from __future__ import annotations

import argparse
import concurrent.futures
from collections import Counter
import hashlib
import json
import logging
import os
import random
import re
import sys
import threading
import time
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone, date
from pathlib import Path
from typing import Iterable, Iterator
from urllib.parse import urljoin, urlparse, parse_qs, urlencode, urlunparse

import requests
from bs4 import BeautifulSoup
from sqlalchemy import select, update
from tqdm import tqdm

from field_extractors import (
    ExperienceRange,
    extract_experience,
    extract_education,
    extract_certifications,
    normalize_text,
)


REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = REPO_ROOT / "backend"

# Make `backend/app` importable in-container and locally.
if (BACKEND_DIR / "app").exists():
    sys.path.insert(0, str(BACKEND_DIR))
elif (REPO_ROOT / "app").exists():
    sys.path.insert(0, str(REPO_ROOT))

from app.database import SessionLocal  # noqa: E402
from app.models import JobPosting  # noqa: E402
from app.models.skill_taxonomy import SEED_SKILLS  # noqa: E402


DEFAULT_SEARCH_URL = "https://careers.ey.com/ey/search/"


HEADERS = {
    "User-Agent": "SpringAIS/1.0 (Educational Project; contact: local-dev)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}


@dataclass(frozen=True)
class ListingJobLink:
    url: str
    external_id: str
    source_locale: str | None = None


@dataclass(frozen=True)
class ParsedJob:
    external_id: str
    title: str
    service_line: str
    location: str
    description: str
    posted_date: date | None
    required_skills: list[str]
    preferred_skills: list[str]
    tags: list[str]
    experience: ExperienceRange
    posting_url: str
    source_locale: str | None
    responsibilities_text: str | None
    requirements_text: str | None
    preferred_text: str | None


def setup_logging(log_dir: Path) -> tuple[logging.Logger, logging.Logger]:
    log_dir.mkdir(parents=True, exist_ok=True)

    fmt = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")

    logger = logging.getLogger("ey_scraper")
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    err_logger = logging.getLogger("ey_scraper_errors")
    err_logger.setLevel(logging.INFO)
    err_logger.handlers.clear()

    console = logging.StreamHandler()
    console.setFormatter(fmt)
    logger.addHandler(console)

    file_handler = logging.FileHandler(log_dir / "scraper.log", encoding="utf-8")
    file_handler.setFormatter(fmt)
    logger.addHandler(file_handler)

    err_file_handler = logging.FileHandler(log_dir / "scraper_errors.log", encoding="utf-8")
    err_file_handler.setFormatter(fmt)
    err_logger.addHandler(err_file_handler)

    return logger, err_logger


def ensure_cache_dir(cache_dir: Path) -> None:
    cache_dir.mkdir(parents=True, exist_ok=True)


def _cache_key(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()[:24]


def fetch_html(
    url: str,
    *,
    session: requests.Session,
    timeout_s: float,
    retries: int,
    backoff_s: float,
    cache_dir: Path | None,
    use_cache: bool,
    min_delay_s: float,
    max_delay_s: float,
) -> str:
    if cache_dir and use_cache:
        key = _cache_key(url)
        cached = cache_dir / f"{key}.html"
        if cached.exists():
            return cached.read_text(encoding="utf-8", errors="ignore")

    # polite delay
    if max_delay_s > 0:
        time.sleep(random.uniform(min_delay_s, max_delay_s))

    last_exc: Exception | None = None
    for attempt in range(1, retries + 1):
        try:
            r = session.get(url, headers=HEADERS, timeout=timeout_s, allow_redirects=True)
            r.raise_for_status()
            html = r.text
            if cache_dir:
                key = _cache_key(url)
                (cache_dir / f"{key}.html").write_text(html, encoding="utf-8")
                (cache_dir / f"{key}.meta.json").write_text(
                    json.dumps(
                        {
                            "url": url,
                            "final_url": r.url,
                            "status": r.status_code,
                            "fetched_at": datetime.now(timezone.utc).isoformat(),
                        },
                        indent=2,
                    ),
                    encoding="utf-8",
                )
            return html
        except Exception as e:  # noqa: BLE001
            last_exc = e
            if attempt == retries:
                break
            time.sleep(backoff_s * attempt)
    raise RuntimeError(f"Failed to fetch {url}: {last_exc}")


def fetch_html_safe(
    url: str,
    *,
    session: requests.Session,
    timeout_s: float,
    retries: int,
    backoff_s: float,
    cache_dir: Path | None,
    use_cache: bool,
    min_delay_s: float,
    max_delay_s: float,
) -> str | None:
    try:
        return fetch_html(
            url,
            session=session,
            timeout_s=timeout_s,
            retries=retries,
            backoff_s=backoff_s,
            cache_dir=cache_dir,
            use_cache=use_cache,
            min_delay_s=min_delay_s,
            max_delay_s=max_delay_s,
        )
    except Exception:  # noqa: BLE001
        return None


def build_search_url(
    base_url: str,
    *,
    locationsearch: str | None,
    startrow: int = 0,
    sort_column: str = "referencedate",
    sort_direction: str = "desc",
) -> str:
    parsed = urlparse(base_url)
    q = parse_qs(parsed.query)

    # Keep existing query keys, but enforce the ones we care about.
    q["q"] = q.get("q", [""])
    q["startrow"] = [str(startrow)]
    q["sortColumn"] = [sort_column]
    q["sortDirection"] = [sort_direction]
    if locationsearch:
        q["locationsearch"] = [locationsearch]

    new_query = urlencode({k: v[0] for k, v in q.items()})
    return urlunparse(parsed._replace(query=new_query))


def parse_external_id_from_job_href(href: str) -> str | None:
    # Typical: /ey/job/<slug>/<numeric_id>/
    m = re.search(r"/(\d{6,})/?$", href)
    if m:
        return m.group(1)
    return None


def _slug_tokens(job_url: str) -> list[str]:
    path = urlparse(job_url).path.lower()
    # /ey/job/<slug>/<id>/
    parts = [p for p in path.split("/") if p]
    if not parts:
        return []
    slug = parts[-2] if len(parts) >= 2 else parts[-1]
    # strip leading locale-ish / noise, keep tokens split by '-' and encoded separators
    slug = slug.replace("%2c", " ").replace("%28", " ").replace("%29", " ")
    toks = re.split(r"[-_]+", slug)
    return [t for t in (tok.strip() for tok in toks) if t]


def extract_tags(*, title: str, job_url: str) -> list[str]:
    """
    Extract high-recall, stable tags from title + URL slug only.

    Tags are used for:
    - Filtering
    - Analytics
    - Improving retrieval before pgvector similarity
    """
    text = f"{title} {' '.join(_slug_tokens(job_url))}".lower()

    rules: list[tuple[str, list[str]]] = [
        # Org / delivery
        ("gds", ["gds"]),
        ("parthenon", ["parthenon"]),
        # Service-line-ish / practice
        ("tax", ["tax", "itts", "gcr", "transfer pricing", "vat", "gst", "tax technology", "tax compliance"]),
        ("assurance", ["assurance", "audit", "faas", "ccass", "forensic", "integrity", "sox", "process controls", "process and controls", "internal audit"]),
        ("consulting", ["consulting", "advisory", "strategy", "deals", "transaction", "business consulting", "tech consulting", "technology consulting"]),
        # Cyber / risk / controls
        ("cyber", ["cyber", "cybersecurity"]),
        ("appsec", ["appsec", "application security"]),
        ("grc", ["grc", "egrc", "archer"]),
        ("risk", ["risk", "risk management"]),
        ("compliance", ["compliance"]),
        ("independence", ["independence", "rms"]),
        ("sox", ["sox"]),
        ("forensics", ["forensic", "forensics"]),
        # Tech stack / platforms
        ("sap", ["sap", "mdg"]),
        ("oracle", ["oracle"]),
        ("microsoft", ["microsoft"]),
        ("zscaler", ["zscaler"]),
        ("cloud", ["cloud", "aws", "azure", "gcp"]),
        ("data", ["data", "analytics", "ai", "ml"]),
        ("devops", ["devops", "kubernetes", "docker"]),
    ]

    tags: list[str] = []
    for canonical, needles in rules:
        if any(n in text for n in needles):
            tags.append(canonical)

    # De-dupe but keep stable order
    out: list[str] = []
    seen = set()
    for t in tags:
        if t not in seen:
            seen.add(t)
            out.append(t)
    return out


def derive_service_line(tags: list[str]) -> str:
    """
    Classify EY service line from title/URL-derived tags only.

    IMPORTANT: do NOT classify from the job description. Descriptions carry the
    firm-boilerplate sentence "...services in assurance, consulting, tax,
    strategy and transactions", so description-based classification
    over-assigns Tax to almost everything.

    (This warning is inherited from extract_service_line, a second, unused
    classifier that was removed in the same change that fixed the boilerplate
    bug. It read the same title/URL signals but padded every needle with a
    leading space, so a signal at the START of a title never matched: it scored
    14/16 on the demo corpus against 16/16 for this function, missing
    "Assurance - Technology Risk" and "FAAS-Global Treasury Services". The
    docstring insight was worth keeping; the implementation was not.)
    """
    tagset = set(tags)
    if any(t in tagset for t in ["tax", "itts", "gcr"]):
        return "Tax"
    if any(t in tagset for t in ["assurance", "audit", "sox", "forensics", "ccass", "faas"]):
        return "Assurance"
    return "Consulting"


# ---------------------------------------------------------------------------
# EY posting boilerplate
# ---------------------------------------------------------------------------
# Every EY posting ends with a fixed marketing/legal footer: the "EY | Building
# a better working world" blurb, the compensation-and-benefits block, and the
# EEO statement. That footer contains the sentence
#
#     "EY teams work across a full spectrum of services in assurance,
#      consulting, tax, strategy and transactions."
#
# which is a *legal description of the firm*, not a job requirement. Feeding it
# to the taxonomy matcher tagged all 16 postings in the demo corpus with the
# skill "Tax" - including Data Engineer, Cyber WAF Operations and Corporate &
# Growth Strategy roles - giving every candidate a spurious Tax affinity.
#
# We strip the footer before extraction rather than blacklisting the word
# "tax": a blacklist would also break genuine Tax postings, which is a worse
# bug than the one it fixes.
#
# We cut at the EARLIEST anchor that matches.
BOILERPLATE_ANCHORS = [
    "what we offer you",
    "we offer a comprehensive compensation",
    "ey | building a better working world",
    "ey exists to build a better working world",
    "ey accepts applications for this position on an on-going basis",
    "ey provides equal employment opportunities",
]

# Never cut away more than this much of the posting. If an anchor matches very
# early the page is probably malformed (or the footer moved), and truncating
# would destroy real requirements text. In that case keep the description whole
# and accept the noise - failing open is safer than silently emptying every
# posting.
_MIN_KEEP_RATIO = 0.25


def strip_boilerplate(text: str) -> str:
    """
    Remove EY's trailing marketing/legal footer from a posting description.

    Returns the text unchanged when no anchor is found, or when the earliest
    anchor sits so early that cutting would remove real content.
    """
    if not text:
        return text

    lower = text.lower()
    positions = [i for i in (lower.find(a) for a in BOILERPLATE_ANCHORS) if i != -1]
    if not positions:
        return text

    cut = min(positions)
    if cut < len(text) * _MIN_KEEP_RATIO:
        return text
    return text[:cut].strip()


def split_sections(description: str) -> tuple[str | None, str | None, str | None]:
    """
    Best-effort section splitter for EY job descriptions.
    Returns (responsibilities, requirements, preferred).

    The marketing/legal footer is stripped first so that the trailing section
    (usually "preferred") does not swallow it.
    """
    d = normalize_text(strip_boilerplate(description))
    if not d:
        return None, None, None

    lines = [normalize_text(x) for x in d.split("\n") if normalize_text(x)]
    text = "\n".join(lines)
    lower = text.lower()

    markers = {
        "responsibilities": [
            "your key responsibilities",
            "responsibilities",
            "what you will do",
        ],
        "requirements": [
            "to qualify for the role you must have",
            "to qualify for the role you must",
            "to qualify for the role",
            "requirements",
        ],
        "preferred": [
            "ideally, you'll also have",
            "ideally you'll also have",
            "preferred",
            "nice to have",
        ],
    }

    def find_first(keys: list[str]) -> int | None:
        idxs = [lower.find(k) for k in keys if lower.find(k) != -1]
        return min(idxs) if idxs else None

    r_i = find_first(markers["responsibilities"])
    q_i = find_first(markers["requirements"])
    p_i = find_first(markers["preferred"])

    # Establish boundaries in-order
    points = [(r_i, "r"), (q_i, "q"), (p_i, "p")]
    points = [(i, k) for i, k in points if i is not None]
    points.sort(key=lambda x: x[0])

    # If nothing found, return None sections (we still keep full description)
    if not points:
        return None, None, None

    # Slice helper
    def slice_between(start: int, end: int | None) -> str:
        chunk = text[start : (end if end is not None else len(text))]
        return normalize_text(chunk)

    sections: dict[str, str] = {}
    for idx, (start, key) in enumerate(points):
        end = points[idx + 1][0] if idx + 1 < len(points) else None
        sections[key] = slice_between(start, end)

    return sections.get("r"), sections.get("q"), sections.get("p")


def is_english_page(soup: BeautifulSoup, description: str) -> bool:
    """
    Best-effort English detection.

    - Prefer explicit <html lang="..."> when present.
    - Otherwise, treat obvious non-Latin scripts as non-English.
    """
    html_tag = soup.find("html")
    lang = (html_tag.get("lang") if html_tag else "") or ""
    lang = lang.lower()
    if lang:
        return lang.startswith("en")

    text = description or ""
    if not text:
        return True

    # Obvious non-English scripts (fast heuristic).
    if re.search(r"[\u0600-\u06FF]", text):  # Arabic
        return False
    if re.search(r"[\u4E00-\u9FFF]", text):  # CJK Unified Ideographs
        return False
    if re.search(r"[\u0400-\u04FF]", text):  # Cyrillic
        return False

    return True


def extract_job_links(listing_html: str, *, base_url: str) -> list[ListingJobLink]:
    soup = BeautifulSoup(listing_html, "lxml")

    links: list[ListingJobLink] = []

    # Primary selector on careers.ey.com search results
    for a in soup.select("a.jobTitle-link[href]"):
        href = a.get("href")
        if not href:
            continue
        external_id = parse_external_id_from_job_href(href)
        if not external_id:
            continue
        abs_url = urljoin(base_url, href)
        links.append(ListingJobLink(url=abs_url, external_id=external_id))

    # Fallback: any anchor containing /ey/job/
    if not links:
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if "/ey/job/" not in href:
                continue
            external_id = parse_external_id_from_job_href(href)
            if not external_id:
                continue
            links.append(ListingJobLink(url=urljoin(base_url, href), external_id=external_id))

    # De-dupe by external_id
    deduped: dict[str, ListingJobLink] = {}
    for link in links:
        deduped.setdefault(link.external_id, link)
    return list(deduped.values())


_MONTHS = {
    "jan": 1,
    "january": 1,
    "feb": 2,
    "february": 2,
    "mar": 3,
    "march": 3,
    "apr": 4,
    "april": 4,
    "may": 5,
    "jun": 6,
    "june": 6,
    "jul": 7,
    "july": 7,
    "aug": 8,
    "august": 8,
    "sep": 9,
    "sept": 9,
    "september": 9,
    "oct": 10,
    "october": 10,
    "nov": 11,
    "november": 11,
    "dec": 12,
    "december": 12,
}


def parse_posted_date(raw: str) -> date | None:
    raw = normalize_text(raw)
    if not raw:
        return None

    # Example: "Jan 19, 2026"
    m = re.search(r"\b([A-Za-z]{3,9})\s+(\d{1,2}),\s*(\d{4})\b", raw)
    if m:
        mon = _MONTHS.get(m.group(1).lower())
        if mon:
            return date(int(m.group(3)), mon, int(m.group(2)))

    # Example: "19 Jan 2026"
    m = re.search(r"\b(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})\b", raw)
    if m:
        mon = _MONTHS.get(m.group(2).lower())
        if mon:
            return date(int(m.group(3)), mon, int(m.group(1)))

    return None


def parse_job_page(
    job_url: str,
    *,
    html: str | None = None,
    session: requests.Session,
    english_only: bool = True,
    **fetch_kwargs,
) -> ParsedJob:
    if html is None:
        html = fetch_html(job_url, session=session, **fetch_kwargs)
    soup = BeautifulSoup(html, "lxml")

    h1 = soup.find("h1")
    title = normalize_text(h1.get_text(" ", strip=True) if h1 else "")
    if not title:
        raise ValueError("Missing title")

    token_map: dict[str, str] = {}
    for label_span in soup.select(".joblayouttoken-label"):
        label = normalize_text(label_span.get_text(" ", strip=True)).rstrip(":")
        value_span = label_span.find_next("span")
        value = normalize_text(value_span.get_text(" ", strip=True) if value_span else "")
        if label:
            token_map[label.lower()] = value

    # Location appears as token value for "Location"
    location = token_map.get("location", "")
    location = normalize_text(location) or "Unknown"

    posted_date = parse_posted_date(token_map.get("date", ""))

    # IMPORTANT: external_id must be stable and match listing de-dupe.
    # Use the numeric job id from the URL (e.g., .../1284590701/).
    external_id = parse_external_id_from_job_href(urlparse(job_url).path) or ""
    external_id = normalize_text(external_id)
    if not external_id:
        raise ValueError("Missing external_id")

    desc_el = soup.select_one("[data-careersite-propertyid=description]")
    description = normalize_text(desc_el.get_text("\n", strip=True) if desc_el else "")
    if not description:
        # fallback: large text block; still ensure non-null
        description = normalize_text(soup.get_text("\n", strip=True))

    tags = extract_tags(title=title, job_url=job_url)
    service_line = derive_service_line(tags)

    # Field extraction from description
    exp = extract_experience(description)
    _edu = extract_education(description)  # kept for future, not stored yet
    _certs = extract_certifications(description)  # kept for future, not stored yet

    required_skills, preferred_skills = extract_skills_from_description(description)

    # If we found certifications, make sure they show up as skills too (helps matching)
    for cert in _certs:
        if cert not in required_skills and cert not in preferred_skills:
            preferred_skills.append(cert)

    if english_only and not is_english_page(soup, description):
        raise ValueError("Non-English page")

    responsibilities_text, requirements_text, preferred_text = split_sections(description)

    return ParsedJob(
        external_id=external_id,
        title=title,
        service_line=service_line,
        location=location,
        description=description,
        posted_date=posted_date,
        required_skills=required_skills,
        preferred_skills=preferred_skills,
        tags=tags,
        experience=exp,
        posting_url=job_url,
        source_locale=None,
        responsibilities_text=responsibilities_text,
        requirements_text=requirements_text,
        preferred_text=preferred_text,
    )


# Characters that join a short token into a compound word. A single letter
# flanked by one of these is part of something else ("C-Corps", "R&D") and is
# not a skill mention.
#
# Deliberately EXCLUDES "/" -- a slash is a list separator, not a compound
# joiner. "AI/ML" and "Python/R" are genuine skill mentions, and treating "/"
# as a joiner silently dropped Machine Learning from the AI Developer posting.
_COMPOUND_CHARS = r"\-&"

# Academic credentials that collide with technical acronyms in the taxonomy.
# The clearest case: "Masters degree in Law (LLM)" on a Tax Accountant posting
# matched the "LLM" alias of the "LLM Development" skill, so a tax lawyer's
# degree registered as large-language-model engineering experience.
#
# We reject a match when credential language appears just before it. Postings
# that genuinely do LLM work mention it many times in technical context, so
# suppressing the degree occurrence removes the false positive without
# touching the real skill.
_CREDENTIAL_CONTEXT = re.compile(
    r"(?:degree|masters|master's|bachelor|bachelor's|doctorate|juris|"
    r"post-?graduate|diploma|licen[cs]e|bar membership|certification)\b[^.]{0,60}$",
    re.IGNORECASE,
)

# Aliases that are only ambiguous because they double as credentials.
_CREDENTIAL_AMBIGUOUS = {"llm", "jd", "ms", "ba", "bs", "mba"}

# How much text before a match to inspect for credential language.
_CREDENTIAL_LOOKBACK = 80


def _is_credential_mention(text: str, match: re.Match[str]) -> bool:
    """True when this match is an academic credential, not a skill mention."""
    if match.group(0).strip().lower() not in _CREDENTIAL_AMBIGUOUS:
        return False
    start = max(0, match.start() - _CREDENTIAL_LOOKBACK)
    return bool(_CREDENTIAL_CONTEXT.search(text[start:match.start()]))


def _compile_taxonomy_patterns() -> list[tuple[str, re.Pattern[str]]]:
    patterns: list[tuple[str, re.Pattern[str]]] = []

    def token_pat(token: str) -> str:
        tok = re.escape(token)
        # Very short alphabetic tokens ("C", "R", "Go") are the dangerous ones:
        # a bare \b boundary makes them match inside hyphenated / ampersanded
        # compounds, which is where the false positives came from --
        #   "C-Corps"          -> C   (a tax entity type, not the C language)
        #   "R&D-focused role" -> R   (not the R language)
        # while the SAME tokens are genuine skills in a list:
        #   "using Python, R, and SQL" -> R is real and must be kept.
        #
        # So for <=2-char alphabetic tokens we additionally refuse a match when
        # the neighbouring character is a compound joiner, and we match
        # case-sensitively via a scoped (?-i:...) group so that prose "c" or a
        # sentence-initial "R" cannot fire.
        if len(token) <= 2 and token.isalpha():
            return rf"(?<![A-Za-z0-9{_COMPOUND_CHARS}])(?-i:{tok})(?![A-Za-z0-9{_COMPOUND_CHARS}])"
        # Handle short/edge tokens better (C#, C++, etc.)
        if re.fullmatch(r"[A-Za-z0-9]+", token):
            return rf"\b{tok}\b"
        return rf"(?<![A-Za-z0-9]){tok}(?![A-Za-z0-9])"

    for item in SEED_SKILLS:
        canonical = item["canonical_name"]
        aliases: Iterable[str] = item.get("aliases") or []
        all_tokens = {canonical, *aliases}
        # Compile one combined OR pattern per canonical
        parts = [token_pat(t) for t in all_tokens if t]
        if not parts:
            continue
        pat = re.compile("|".join(sorted(set(parts), key=len, reverse=True)), flags=re.IGNORECASE)
        patterns.append((canonical, pat))

    return patterns


_TAXONOMY_PATTERNS = _compile_taxonomy_patterns()


def extract_skills(text: str) -> list[str]:
    t = normalize_text(text)
    if not t:
        return []

    found: list[str] = []
    for canonical, pat in _TAXONOMY_PATTERNS:
        # A skill counts only if at least one occurrence survives the
        # credential guard - "(LLM)" after "Masters degree in Law" does not.
        if any(not _is_credential_mention(t, m) for m in pat.finditer(t)):
            found.append(canonical)
    return found


def extract_skills_from_description(description: str) -> tuple[list[str], list[str]]:
    """
    Best-effort split of skills into required vs preferred using common section markers.

    The marketing/legal footer is stripped first - see strip_boilerplate. Without
    it the firm-description sentence ("...services in assurance, consulting, tax,
    strategy and transactions") lands in whichever section runs to the end of the
    text, which tagged every posting in the corpus with "Tax".
    """
    d = normalize_text(strip_boilerplate(description))
    if not d:
        return [], []

    lines = [normalize_text(x) for x in d.split("\n") if normalize_text(x)]
    text = "\n".join(lines)
    lower = text.lower()

    # Section markers on careers.ey.com pages
    required_markers = [
        "to qualify for the role you must have",
        "to qualify",
        "requirements",
        "skills and attributes for success",
        "what we look for",
    ]
    preferred_markers = [
        "ideally, you'll also have",
        "ideally you'll also have",
        "ideally",
        "preferred",
        "nice to have",
    ]

    def find_marker(markers: list[str]) -> int | None:
        for m in markers:
            idx = lower.find(m)
            if idx != -1:
                return idx
        return None

    req_idx = find_marker(required_markers)
    pref_idx = find_marker(preferred_markers)

    required_text = text
    preferred_text = ""

    if pref_idx is not None:
        preferred_text = text[pref_idx:]
        required_text = text[:pref_idx]
    if req_idx is not None:
        required_text = text[req_idx : (pref_idx if pref_idx is not None else len(text))]

    required = extract_skills(required_text)
    preferred = extract_skills(preferred_text)

    # If preferred is empty but we have required, keep it that way.
    # If both empty, fallback to whole description.
    if not required and not preferred:
        required = extract_skills(text)

    # Remove overlaps from preferred
    required_set = set(required)
    preferred = [s for s in preferred if s not in required_set]

    return required, preferred


US_LOCATIONS = [
    'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut',
    'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa',
    'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan',
    'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire',
    'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio',
    'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota',
    'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia',
    'wisconsin', 'wyoming', 'atlanta', 'austin', 'boston', 'chicago', 'dallas', 'denver',
    'detroit', 'houston', 'los angeles', 'miami', 'minneapolis', 'nashville', 'new york',
    'philadelphia', 'phoenix', 'san francisco', 'san diego', 'san jose', 'seattle',
    'tampa', 'charlotte', 'hoboken', 'secaucus', 'usa', 'united states', 'nyc',
]


def is_us_location(location: str) -> bool:
    loc_lower = (location or '').lower()
    return any(us_loc in loc_lower for us_loc in US_LOCATIONS)


def job_id_for_external(external_id: str) -> str:
    # Deterministic primary key derived from source + external id.
    # Avoids needing a DB-generated ID in a String PK table.
    return f"ey_{external_id}"


def upsert_job_posting(db, job: ParsedJob, now: datetime) -> tuple[str, bool]:
    """
    Returns (job_id, created_new).
    """
    existing = db.execute(select(JobPosting).where(JobPosting.external_id == job.external_id)).scalar_one_or_none()
    if existing:
        existing.title = job.title
        existing.service_line = job.service_line
        existing.location = job.location
        existing.description = job.description
        existing.required_skills = job.required_skills
        existing.preferred_skills = job.preferred_skills
        if hasattr(existing, "tags"):
            existing.tags = job.tags
        existing.experience_years_min = job.experience.min_years
        existing.experience_years_max = job.experience.max_years
        existing.posting_url = job.posting_url
        existing.scraped_at = now
        if hasattr(existing, "source_locale"):
            existing.source_locale = job.source_locale
        if hasattr(existing, "responsibilities_text"):
            existing.responsibilities_text = job.responsibilities_text
        if hasattr(existing, "requirements_text"):
            existing.requirements_text = job.requirements_text
        if hasattr(existing, "preferred_text"):
            existing.preferred_text = job.preferred_text
        # Newer status columns (added in migration 004)
        if hasattr(existing, "last_seen_at"):
            existing.last_seen_at = now
        if hasattr(existing, "is_active"):
            existing.is_active = True
        if hasattr(existing, "posted_date"):
            existing.posted_date = job.posted_date
        if hasattr(existing, "closed_at"):
            existing.closed_at = None
        return existing.id, False

    new_row = JobPosting(
        id=job_id_for_external(job.external_id),
        external_id=job.external_id,
        title=job.title,
        service_line=job.service_line,
        location=job.location,
        description=job.description,
        required_skills=job.required_skills,
        preferred_skills=job.preferred_skills,
        tags=job.tags,
        experience_years_min=job.experience.min_years,
        experience_years_max=job.experience.max_years,
        posting_url=job.posting_url,
        scraped_at=now,
    )
    if hasattr(new_row, "source_locale"):
        new_row.source_locale = job.source_locale
    if hasattr(new_row, "responsibilities_text"):
        new_row.responsibilities_text = job.responsibilities_text
    if hasattr(new_row, "requirements_text"):
        new_row.requirements_text = job.requirements_text
    if hasattr(new_row, "preferred_text"):
        new_row.preferred_text = job.preferred_text
    if hasattr(new_row, "last_seen_at"):
        new_row.last_seen_at = now
    if hasattr(new_row, "is_active"):
        new_row.is_active = True
    if hasattr(new_row, "posted_date"):
        new_row.posted_date = job.posted_date
    db.add(new_row)
    return new_row.id, True


def mark_inactive_postings(db, *, cutoff: datetime, now: datetime) -> int:
    """
    Mark postings inactive if they haven't been seen since cutoff.
    Requires migration 004 (is_active, last_seen_at, closed_at).
    """
    # If schema isn't migrated yet, no-op.
    if not hasattr(JobPosting, "is_active") or not hasattr(JobPosting, "last_seen_at"):
        return 0

    stmt = (
        update(JobPosting)
        .where(JobPosting.is_active.is_(True))
        .where(JobPosting.last_seen_at.is_not(None))
        .where(JobPosting.last_seen_at < cutoff)
        .values(is_active=False, closed_at=now)
    )
    res = db.execute(stmt)
    return int(res.rowcount or 0)


def iter_listing_pages(
    *,
    base_url: str,
    locationsearch: str | None,
    session: requests.Session,
    listing_timeout_s: float,
    listing_retries: int,
    listing_backoff_s: float,
    cache_dir: Path | None,
    use_cache: bool,
    min_delay_s: float,
    max_delay_s: float,
    max_pages: int,
    max_consecutive_failures: int = 10,
) -> Iterator[str]:
    failures = 0
    for i in range(max_pages):
        url = build_search_url(base_url, locationsearch=locationsearch, startrow=i * 25)
        html = fetch_html_safe(
            url,
            session=session,
            timeout_s=listing_timeout_s,
            retries=listing_retries,
            backoff_s=listing_backoff_s,
            cache_dir=cache_dir,
            use_cache=use_cache,
            min_delay_s=min_delay_s,
            max_delay_s=max_delay_s,
        )
        if html is None:
            failures += 1
            if failures >= max_consecutive_failures:
                break
            continue
        failures = 0
        yield html


def collect_job_links(
    *,
    base_url: str,
    locationsearch: str | None,
    session: requests.Session,
    limit: int | None,
    listing_timeout_s: float,
    listing_retries: int,
    listing_backoff_s: float,
    **fetch_kwargs,
) -> list[ListingJobLink]:
    all_links: dict[str, ListingJobLink] = {}

    for page_html in iter_listing_pages(
        base_url=base_url,
        locationsearch=locationsearch,
        session=session,
        listing_timeout_s=listing_timeout_s,
        listing_retries=listing_retries,
        listing_backoff_s=listing_backoff_s,
        **fetch_kwargs,
    ):
        links = extract_job_links(page_html, base_url=base_url)
        if not links:
            break

        before = len(all_links)
        for l in links:
            all_links.setdefault(l.external_id, l)
        after = len(all_links)

        # If this page didn't add anything new, we're done.
        if after == before:
            break

        if limit is not None and len(all_links) >= limit:
            break

    out = list(all_links.values())
    if limit is not None:
        out = out[:limit]
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description="Scrape EY job postings into the SpringAIS database.")
    parser.add_argument("--url", default=DEFAULT_SEARCH_URL, help="Base EY search URL (default: careers.ey.com search).")
    parser.add_argument(
        "--locationsearch",
        default="",
        help='Location search filter (careers.ey.com). Use "" (default) to fetch all locations.',
    )
    parser.add_argument("--limit", type=int, default=None, help="Limit number of job postings to scrape.")
    parser.add_argument("--service-line", dest="service_line", default=None, help="Filter by service line (Tax/Assurance/Consulting).")
    parser.add_argument("--dry-run", action="store_true", help="Parse only; do not write to DB.")
    parser.add_argument("--workers", type=int, default=32, help="Concurrent workers for job page fetch+parse.")
    parser.add_argument("--include-non-english", action="store_true", help="Do not filter non-English pages.")
    parser.add_argument("--commit-every", type=int, default=250, help="Commit every N upserts (DB mode only).")
    parser.add_argument(
        "--locales",
        default="en_US,en_GB,en",
        help='Comma-separated locales to crawl (default: "en_US,en_GB,en").',
    )
    parser.add_argument("--timeout", type=float, default=20.0, help="Request timeout in seconds.")
    parser.add_argument("--retries", type=int, default=3, help="Request retries.")
    parser.add_argument("--backoff", type=float, default=3.0, help="Retry backoff base seconds.")
    parser.add_argument("--listing-timeout", type=float, default=12.0, help="Listing page timeout in seconds.")
    parser.add_argument("--listing-retries", type=int, default=2, help="Listing page retries.")
    parser.add_argument("--listing-backoff", type=float, default=1.0, help="Listing page retry backoff base seconds.")
    parser.add_argument("--min-delay", type=float, default=0.0, help="Min delay between requests (seconds).")
    parser.add_argument("--max-delay", type=float, default=0.0, help="Max delay between requests (seconds).")
    parser.add_argument("--max-pages", type=int, default=600, help="Max listing pages to crawl (25 jobs/page).")
    parser.add_argument("--cache-dir", default=str(REPO_ROOT / ".cache" / "ey_scraper"), help="HTML cache directory.")
    parser.add_argument("--use-cache", action="store_true", help="Use cached HTML instead of fetching.")
    parser.add_argument("--us-only", action="store_true", help="Only keep US-based job postings.")

    args = parser.parse_args()

    log_dir = REPO_ROOT / "logs"
    logger, err_logger = setup_logging(log_dir)

    cache_dir = Path(args.cache_dir) if args.cache_dir else None
    if cache_dir:
        ensure_cache_dir(cache_dir)

    logger.info("Starting EY job scraper")
    logger.info("Search URL: %s (locationsearch=%s)", args.url, args.locationsearch if args.locationsearch else "<none>")
    logger.info("Workers: %d | English-only: %s", args.workers, "no" if args.include_non_english else "yes")

    run_started = datetime.now(timezone.utc)

    # Collect links across locales for better English coverage, then de-dupe by external_id.
    locale_list = [x.strip() for x in (args.locales or "").split(",") if x.strip()]
    if not locale_list:
        locale_list = ["en_US"]

    all_links: dict[str, ListingJobLink] = {}
    for loc in locale_list:
        # override/ensure locale query param on the base URL
        parsed = urlparse(args.url)
        q = parse_qs(parsed.query)
        q["locale"] = [loc]
        base_url = urlunparse(parsed._replace(query=urlencode({k: v[0] for k, v in q.items()})))

        with requests.Session() as listing_http:
            links = collect_job_links(
                base_url=base_url,
                locationsearch=args.locationsearch or None,
                session=listing_http,
                limit=args.limit,
                listing_timeout_s=args.listing_timeout,
                listing_retries=args.listing_retries,
                listing_backoff_s=args.listing_backoff,
                cache_dir=cache_dir,
                use_cache=args.use_cache,
                min_delay_s=args.min_delay,
                max_delay_s=args.max_delay,
                max_pages=args.max_pages,
            )
        for l in links:
            all_links.setdefault(l.external_id, ListingJobLink(url=l.url, external_id=l.external_id, source_locale=loc))

        logger.info("Locale %s: +%d links (total unique now %d)", loc, len(links), len(all_links))

    links = list(all_links.values())
    if args.limit is not None:
        links = links[: args.limit]

    logger.info("Found %d unique job links (after locale merge)", len(links))

    # Per-thread session (requests.Session is not reliably thread-safe when shared).
    _local = threading.local()

    def _get_thread_session() -> requests.Session:
        sess = getattr(_local, "session", None)
        if sess is None:
            sess = requests.Session()
            _local.session = sess
        return sess

    def _parse_one(link: ListingJobLink) -> ParsedJob | None:
        try:
            job = parse_job_page(
                link.url,
                session=_get_thread_session(),
                english_only=not args.include_non_english,
                timeout_s=args.timeout,
                retries=args.retries,
                backoff_s=args.backoff,
                cache_dir=cache_dir,
                use_cache=args.use_cache,
                min_delay_s=args.min_delay,
                max_delay_s=args.max_delay,
            )
            # attach crawl locale for traceability
            job = ParsedJob(
                external_id=job.external_id,
                title=job.title,
                service_line=job.service_line,
                location=job.location,
                description=job.description,
                posted_date=job.posted_date,
                required_skills=job.required_skills,
                preferred_skills=job.preferred_skills,
                tags=job.tags,
                experience=job.experience,
                posting_url=job.posting_url,
                source_locale=link.source_locale,
                responsibilities_text=job.responsibilities_text,
                requirements_text=job.requirements_text,
                preferred_text=job.preferred_text,
            )
            if args.service_line and job.service_line.lower() != args.service_line.lower():
                return None
            if args.us_only and not is_us_location(job.location):
                return None
            return job
        except Exception as e:  # noqa: BLE001
            err_logger.error("Failed to parse job %s (%s): %s", link.external_id, link.url, e)
            return None

    # STREAMING PIPELINE:
    # - Dry-run: accumulate in-memory counters only
    # - DB run: upsert as results arrive (no giant parsed_jobs list)
    parsed_count = 0
    parse_failed = 0
    by_line: dict[str, int] = {}
    tag_counts: Counter[str] = Counter()

    if args.dry_run:
        with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, int(args.workers))) as pool:
            for job in tqdm(pool.map(_parse_one, links), total=len(links), desc="Parsing jobs", unit="job"):
                if job is None:
                    parse_failed += 1
                    continue
                parsed_count += 1
                by_line[job.service_line] = by_line.get(job.service_line, 0) + 1
                tag_counts.update(job.tags or [])

        logger.info("DRY RUN - no database changes made")
        logger.info(
            "Parsed %d/%d jobs (failed=%d) (service line breakdown: %s)",
            parsed_count,
            len(links),
            parse_failed,
            by_line,
        )
        logger.info("Top tags: %s", tag_counts.most_common(20))
        return 0

    db = SessionLocal()
    new_count = 0
    updated_count = 0
    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, int(args.workers))) as pool:
            for i, job in enumerate(
                tqdm(pool.map(_parse_one, links), total=len(links), desc="Parsing+Upserting", unit="job"),
                start=1,
            ):
                if job is None:
                    parse_failed += 1
                    continue

                parsed_count += 1
                by_line[job.service_line] = by_line.get(job.service_line, 0) + 1
                tag_counts.update(job.tags or [])

                _, created = upsert_job_posting(db, job, run_started)
                if created:
                    new_count += 1
                else:
                    updated_count += 1

                if args.commit_every > 0 and i % args.commit_every == 0:
                    db.commit()

        archived = mark_inactive_postings(
            db,
            cutoff=run_started,
            now=run_started,
        )

        db.commit()
        logger.info(
            "Upsert complete: parsed=%d/%d (failed=%d) | %d new, %d updated, %d archived",
            parsed_count,
            len(links),
            parse_failed,
            new_count,
            updated_count,
            archived,
        )
        logger.info("Service lines: %s", by_line)
        logger.info("Top tags: %s", tag_counts.most_common(25))
        logger.info("Done")
        return 0
    except Exception as e:  # noqa: BLE001
        db.rollback()
        err_logger.error("Fatal error during DB upsert: %s", e)
        raise
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())

