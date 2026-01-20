from __future__ import annotations

import re
from dataclasses import dataclass


_WS_RE = re.compile(r"\s+")


def normalize_text(text: str) -> str:
    """Normalize whitespace and common odd characters from scraped HTML."""
    if not text:
        return ""
    # Common bad encodings on the EY careers pages (e.g. "we�re")
    text = text.replace("\uFFFD", " ").replace("�", " ")
    return _WS_RE.sub(" ", text).strip()


@dataclass(frozen=True)
class ExperienceRange:
    min_years: int | None
    max_years: int | None


def extract_experience(text: str) -> ExperienceRange:
    """
    Extract min/max years of experience from free text.

    Handles patterns:
    - "3-5 years", "3 to 5 years"
    - "5+ years", "at least 5 years", "minimum of 5 years"
    - "5 years of experience"
    """
    t = normalize_text(text).lower()
    if not t:
        return ExperienceRange(None, None)

    # Ranges
    range_patterns = [
        r"\b(\d{1,2})\s*-\s*(\d{1,2})\s*(?:\+?\s*)?(?:years?|yrs?)\b",
        r"\b(\d{1,2})\s*(?:to|through)\s*(\d{1,2})\s*(?:years?|yrs?)\b",
    ]
    for pat in range_patterns:
        m = re.search(pat, t, flags=re.IGNORECASE)
        if m:
            a, b = int(m.group(1)), int(m.group(2))
            lo, hi = (a, b) if a <= b else (b, a)
            return ExperienceRange(lo, hi)

    # Min-only
    min_patterns = [
        r"\b(\d{1,2})\s*\+\s*(?:years?|yrs?)\b",
        r"\b(?:at\s+least|minimum\s+of|min\.)\s*(\d{1,2})\s*(?:years?|yrs?)\b",
        r"\b(\d{1,2})\s*(?:years?|yrs?)\s+of\s+experience\b",
    ]
    for pat in min_patterns:
        m = re.search(pat, t, flags=re.IGNORECASE)
        if m:
            return ExperienceRange(int(m.group(1)), None)

    return ExperienceRange(None, None)


def extract_education(text: str) -> str | None:
    """
    Extract education requirement (best-effort).
    Returns a short normalized string (e.g. "Bachelor's", "Master's", "MBA"), or None.
    """
    t = normalize_text(text)
    if not t:
        return None

    # Order matters (more specific first)
    education_patterns: list[tuple[str, str]] = [
        (r"\b(ph\.?d\.?|doctorate)\b", "PhD"),
        (r"\b(m\.?s\.?|m\.?sc\.?|master'?s)\b", "Master's"),
        (r"\b(mba)\b", "MBA"),
        (r"\b(b\.?s\.?|b\.?sc\.?|bachelor'?s)\b", "Bachelor's"),
        (r"\b(associate'?s)\b", "Associate's"),
        (r"\b(high\s+school\s+diploma)\b", "High school diploma"),
    ]

    for pat, label in education_patterns:
        if re.search(pat, t, flags=re.IGNORECASE):
            return label

    # Generic fallback
    if re.search(r"\bdegree\b", t, flags=re.IGNORECASE):
        return "Degree"

    return None


def extract_certifications(text: str) -> list[str]:
    """
    Extract common certifications (best-effort).
    Returns unique canonical tokens (e.g. ["CPA", "CFA"]).
    """
    t = normalize_text(text)
    if not t:
        return []

    cert_patterns: list[tuple[str, str]] = [
        (r"\bCPA\b", "CPA"),
        (r"\bCMA\b", "CMA"),
        (r"\bCIA\b", "CIA"),
        (r"\bCFA\b", "CFA"),
        (r"\bPMP\b", "PMP"),
        (r"\bCISSP\b", "CISSP"),
        (r"\bITIL\b", "ITIL"),
        (r"\bCCNA\b", "CCNA"),
        (r"\bCCNP\b", "CCNP"),
        (r"\bAWS\b.*\bCertified\b|\bAWS Certified\b", "AWS Certified"),
        (r"\bAzure\b.*\bCertified\b|\bMicrosoft Certified\b", "Azure Certified"),
        (r"\bGCP\b.*\bCertified\b|\bGoogle Cloud Certified\b", "Google Cloud Certified"),
        (r"\bCKA\b|\bCertified Kubernetes Administrator\b", "CKA"),
    ]

    found: list[str] = []
    for pat, label in cert_patterns:
        if re.search(pat, t, flags=re.IGNORECASE):
            found.append(label)

    # De-dupe while preserving order
    seen = set()
    out: list[str] = []
    for c in found:
        if c not in seen:
            seen.add(c)
            out.append(c)
    return out

