"""
Text utility functions for skill processing.

Provides normalization and processing functions for skill text.
"""

import re


def normalize_skill_text(text: str) -> str:
    """
    Normalize skill text for exact match cache lookup.

    Normalization steps:
    1. Convert to lowercase
    2. Strip leading/trailing whitespace
    3. Replace multiple spaces with single space
    4. Remove extra punctuation

    Args:
        text: Raw skill text

    Returns:
        Normalized skill text

    Examples:
        >>> normalize_skill_text("Python Programming")
        'python programming'
        >>> normalize_skill_text("  React.js  ")
        'react.js'
        >>> normalize_skill_text("AWS   Cloud  ")
        'aws cloud'
    """
    if not text:
        return ""

    # Convert to lowercase
    normalized = text.lower()

    # Strip leading/trailing whitespace
    normalized = normalized.strip()

    # Replace multiple spaces with single space
    normalized = re.sub(r'\s+', ' ', normalized)

    return normalized


def calculate_cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    """
    Calculate cosine similarity between two vectors.

    Formula: similarity = (A · B) / (||A|| * ||B||)

    Args:
        vec1: First embedding vector
        vec2: Second embedding vector

    Returns:
        Cosine similarity score between -1 and 1
        (1 = identical, 0 = orthogonal, -1 = opposite)

    Examples:
        >>> v1 = [1.0, 0.0, 0.0]
        >>> v2 = [1.0, 0.0, 0.0]
        >>> calculate_cosine_similarity(v1, v2)
        1.0

        >>> v1 = [1.0, 0.0, 0.0]
        >>> v2 = [0.0, 1.0, 0.0]
        >>> calculate_cosine_similarity(v1, v2)
        0.0
    """
    if len(vec1) != len(vec2):
        raise ValueError(f"Vectors must have same length: {len(vec1)} != {len(vec2)}")

    # Calculate dot product
    dot_product = sum(a * b for a, b in zip(vec1, vec2))

    # Calculate magnitudes
    magnitude1 = sum(a * a for a in vec1) ** 0.5
    magnitude2 = sum(b * b for b in vec2) ** 0.5

    # Avoid division by zero
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0

    # Calculate cosine similarity
    similarity = dot_product / (magnitude1 * magnitude2)

    return similarity
