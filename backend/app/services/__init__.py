"""Service exports with lazy imports to avoid heavy dependencies at import time."""

import importlib
from typing import Any

__all__ = [
    # Embedding service
    "EmbeddingService",
    "SimilarSkill",
    # Matching service
    "MatchingService",
    "match_by_skills",
    "get_match_detail",
    # Resume parsing
    "parse_resume",
    "extract_text_from_pdf",
    "extract_text_from_docx",
    "extract_text_from_txt",
    # Skill extraction
    "SkillExtractor",
    "extract_skills_from_text",
    # Skill normalization
    "normalize_skill",
    "deduplicate_skills",
    "normalize_and_deduplicate",
    "seed_skill_taxonomy",
    "categorize_skills",
    "get_normalizer_cache",
]

_LAZY_IMPORTS = {
    # Embedding service
    "EmbeddingService": "app.services.embedding_service",
    "SimilarSkill": "app.services.embedding_service",
    # Matching service
    "MatchingService": "app.services.matching_service",
    "match_by_skills": "app.services.matching_service",
    "get_match_detail": "app.services.matching_service",
    # Resume parsing
    "parse_resume": "app.services.resume_parser",
    "extract_text_from_pdf": "app.services.resume_parser",
    "extract_text_from_docx": "app.services.resume_parser",
    "extract_text_from_txt": "app.services.resume_parser",
    # Skill extraction
    "SkillExtractor": "app.services.skill_extractor",
    "extract_skills_from_text": "app.services.skill_extractor",
    # Skill normalization
    "normalize_skill": "app.services.skill_normalizer",
    "deduplicate_skills": "app.services.skill_normalizer",
    "normalize_and_deduplicate": "app.services.skill_normalizer",
    "seed_skill_taxonomy": "app.services.skill_normalizer",
    "categorize_skills": "app.services.skill_normalizer",
    "get_normalizer_cache": "app.services.skill_normalizer",
}


def __getattr__(name: str) -> Any:
    if name in _LAZY_IMPORTS:
        module = importlib.import_module(_LAZY_IMPORTS[name])
        return getattr(module, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


def __dir__() -> list[str]:
    return sorted(set(__all__))
