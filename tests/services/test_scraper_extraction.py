"""
Regression tests for the EY scraper's skill/service-line extraction.

These cover three defects found by re-parsing a curated 16-posting EY corpus:

1. The firm-boilerplate footer ("...services in assurance, consulting, tax,
   strategy and transactions") was read as a job requirement, tagging all 16
   postings with the skill "Tax" -- including Data Engineer, Cyber WAF
   Operations and Corporate & Growth Strategy roles.
2. Short/ambiguous taxonomy tokens matched inside compounds ("C" from
   "C-Corps", "R" from "R&D") and academic credentials ("LLM" from "Masters
   degree in Law (LLM)").
3. derive_service_line vs the unused extract_service_line -- the latter was
   removed; these tests pin the behaviour of the one that stayed.

The point of the negative cases is precision: the SAME tokens must survive when
they are genuine ("using Python, R, and SQL" is really R; an AI Developer
posting really is LLM Development).
"""

import os
import sys

import pytest

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))

# Only scripts/ goes on the path, deliberately.
#
# tests/conftest.py owns the suite's single import root and sets it to app.*
# (backend/ then the project root). This module conforms to that root rather
# than competing with it: scrape_ey_jobs.py imports app.* and puts backend/ on
# sys.path itself, so there is nothing for this file to add there. Re-adding
# backend/ here would recreate the second-root collision that root conftest
# exists to prevent.
#
# scripts/ is still needed and is not redundant: it has no __init__.py, so the
# project root that conftest adds does not make `scrape_ey_jobs` importable as
# a bare top-level module. This is the one entry this file genuinely requires.
_SCRIPTS = os.path.join(REPO_ROOT, "scripts")
if _SCRIPTS not in sys.path:
    sys.path.insert(0, _SCRIPTS)

scrape_ey_jobs = pytest.importorskip(
    "scrape_ey_jobs",
    reason="scraper deps (bs4/sqlalchemy/tqdm) not installed",
)

strip_boilerplate = scrape_ey_jobs.strip_boilerplate
extract_skills = scrape_ey_jobs.extract_skills
extract_skills_from_description = scrape_ey_jobs.extract_skills_from_description
derive_service_line = scrape_ey_jobs.derive_service_line


# The real footer, trimmed to the part that caused the bug.
EY_FOOTER = (
    "What we offer you At EY, we offer a comprehensive compensation and benefits "
    "package. EY | Building a better working world EY is building a better working "
    "world by creating new value for clients, people, society and the planet. "
    "EY teams work across a full spectrum of services in assurance, consulting, "
    "tax, strategy and transactions. EY provides equal employment opportunities "
    "to applicants and employees without regard to race, color, religion, age, sex."
)


def _posting(body: str) -> str:
    """A realistic posting: enough body text that the footer is in the back half."""
    padding = (
        "Your key responsibilities You will design, build and operate production "
        "systems for our clients across a range of engagements, working closely "
        "with delivery teams and stakeholders throughout the project lifecycle. "
    ) * 3
    return padding + body + " " + EY_FOOTER


# ---------------------------------------------------------------------------
# 1. Boilerplate stripping
# ---------------------------------------------------------------------------

class TestStripBoilerplate:
    def test_removes_footer(self):
        text = _posting("To qualify for the role you must have experience with Python.")
        out = strip_boilerplate(text)
        assert "assurance, consulting, tax, strategy and transactions" not in out
        assert "equal employment opportunities" not in out
        assert "experience with Python" in out

    def test_returns_text_unchanged_when_no_footer(self):
        text = "To qualify for the role you must have experience with Python and SQL."
        assert strip_boilerplate(text) == text

    def test_handles_empty_input(self):
        assert strip_boilerplate("") == ""
        assert strip_boilerplate(None) is None

    def test_fails_open_when_anchor_is_too_early(self):
        """
        A posting that is almost entirely footer is more likely a malformed page
        than a real cut point. Truncating it would empty the posting, so we keep
        it whole and accept the noise.
        """
        text = "What we offer you " + ("benefits and compensation details. " * 20)
        assert strip_boilerplate(text) == text

    def test_cut_is_idempotent(self):
        text = _posting("To qualify you must have Python.")
        once = strip_boilerplate(text)
        assert strip_boilerplate(once) == once


# ---------------------------------------------------------------------------
# 2. The Tax false positive
# ---------------------------------------------------------------------------

class TestBoilerplateDoesNotProduceSkills:
    def test_footer_alone_yields_no_tax_skill(self):
        """The exact bug: the legal footer must not read as a Tax requirement."""
        required, preferred = extract_skills_from_description(
            _posting("To qualify for the role you must have strong Python and SQL skills.")
        )
        assert "Tax" not in required
        assert "Tax" not in preferred

    def test_genuine_tax_posting_still_extracts_tax(self):
        """
        The fix must not be a blacklist. A real Tax posting still has to yield
        the Tax skill, otherwise we have traded one bug for a worse one.
        """
        required, preferred = extract_skills_from_description(
            _posting(
                "To qualify for the role you must have experience preparing "
                "federal and state tax returns, tax provision work, and broad "
                "corporate tax compliance exposure."
            )
        )
        assert "Tax" in required + preferred

    def test_tax_word_only_in_footer_is_dropped_but_body_word_is_kept(self):
        no_tax = _posting("To qualify you must have Python and SQL.")
        with_tax = _posting("To qualify you must have tax compliance experience.")
        assert "Tax" not in extract_skills(strip_boilerplate(no_tax))
        assert "Tax" in extract_skills(strip_boilerplate(with_tax))


# ---------------------------------------------------------------------------
# 3. Short-token and credential false positives
# ---------------------------------------------------------------------------

class TestShortTokenPrecision:
    def test_c_in_c_corps_is_not_the_c_language(self):
        assert "C" not in extract_skills(
            "flow through entities (S-Corps, Partnerships and LLCs); C-Corps "
            "including income tax provisional and consolidated federal returns"
        )

    def test_r_in_r_and_d_is_not_the_r_language(self):
        assert "R" not in extract_skills(
            "Experience in a technology company in a product management or "
            "R&D-focused role or in a consulting firm."
        )

    def test_genuine_r_in_a_language_list_is_kept(self):
        """The precision half: this R is real and must survive."""
        assert "R" in extract_skills(
            "Hands-on experience developing scalable data solutions using "
            "Python, R, and SQL, with expertise in data engineering."
        )

    def test_slash_separated_list_is_not_a_compound(self):
        """'AI/ML' is a list, not a compound word -- ML must still match."""
        assert "Machine Learning" in extract_skills(
            "Strong grounding in traditional AI/ML and deep learning fundamentals."
        )


class TestCredentialGuard:
    def test_llm_as_a_law_degree_is_not_llm_development(self):
        assert "LLM Development" not in extract_skills(
            "Must meet one of the following: active US CPA certification, "
            "Masters degree in Law (LLM), and/or US state bar membership."
        )

    def test_llm_in_technical_context_is_still_a_skill(self):
        """The precision half: a real GenAI posting must keep the skill."""
        assert "LLM Development" in extract_skills(
            "Build and integrate LLM, RAG, and agentic solution components "
            "into enterprise solutions, including production-grade LLM "
            "applications and prompt engineering."
        )

    def test_one_credential_mention_does_not_suppress_a_real_mention(self):
        """A posting with both must still register the skill."""
        assert "LLM Development" in extract_skills(
            "Masters degree in Law (LLM) preferred. You will also build "
            "production LLM pipelines and RAG retrieval systems."
        )


# ---------------------------------------------------------------------------
# 4. Section splitting still works after stripping
# ---------------------------------------------------------------------------

class TestSectionsAfterStripping:
    def test_required_and_preferred_stay_disjoint(self):
        required, preferred = extract_skills_from_description(
            _posting(
                "To qualify for the role you must have Python and SQL. "
                "Ideally, you'll also have Docker and Kubernetes."
            )
        )
        assert not (set(required) & set(preferred))

    def test_preferred_section_does_not_absorb_the_footer(self):
        required, preferred = extract_skills_from_description(
            _posting(
                "To qualify for the role you must have Python. "
                "Ideally, you'll also have Docker."
            )
        )
        assert "Tax" not in preferred

    def test_posting_without_markers_still_yields_skills(self):
        required, preferred = extract_skills_from_description(
            _posting("We need someone strong in Python and SQL.")
        )
        assert "Python" in required + preferred


# ---------------------------------------------------------------------------
# 5. Service line
# ---------------------------------------------------------------------------

class TestDeriveServiceLine:
    @pytest.mark.parametrize(
        "tags,expected",
        [
            (["tax"], "Tax"),
            (["itts"], "Tax"),
            (["gcr"], "Tax"),
            (["assurance"], "Assurance"),
            (["audit"], "Assurance"),
            (["faas"], "Assurance"),
            (["consulting"], "Consulting"),
            (["cyber"], "Consulting"),
            ([], "Consulting"),
        ],
    )
    def test_known_tag_mappings(self, tags, expected):
        assert derive_service_line(tags) == expected

    def test_tax_wins_over_consulting(self):
        """Tax Technology roles carry both tags; Tax is the correct answer."""
        assert derive_service_line(["tax", "consulting", "sap"]) == "Tax"

    def test_assurance_wins_over_consulting(self):
        assert derive_service_line(["assurance", "consulting", "cyber"]) == "Assurance"

    def test_removed_classifier_is_gone(self):
        """
        extract_service_line was deleted: it scored 14/16 on the demo corpus
        against 16/16 for derive_service_line. This pins the removal so it is
        not reintroduced by a future merge without a deliberate decision.
        """
        assert not hasattr(scrape_ey_jobs, "extract_service_line")
