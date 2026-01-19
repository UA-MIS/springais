"""
Text cleaning utilities for resume processing.

Cleans extracted resume text by:
- Removing excessive whitespace
- Removing formatting artifacts
- Preserving skill names and experience information
- Chunking long texts for LLM processing
"""

import re
from typing import List

import tiktoken


# ============================================
# Token Counting
# ============================================

def count_tokens(text: str, model: str = "gpt-4") -> int:
    """
    Count the number of tokens in text using tiktoken.

    Args:
        text: Text to count tokens for
        model: Model to use for tokenization

    Returns:
        Number of tokens
    """
    try:
        encoding = tiktoken.encoding_for_model(model)
    except KeyError:
        # Fall back to cl100k_base for newer models
        encoding = tiktoken.get_encoding("cl100k_base")

    return len(encoding.encode(text))


# ============================================
# Text Cleaning
# ============================================

def clean_resume_text(raw_text: str) -> str:
    """
    Clean extracted resume text for LLM processing.

    Removes:
    - Excessive whitespace and newlines
    - Page numbers and headers/footers
    - Special formatting characters
    - Unicode artifacts

    Preserves:
    - Skill names and technical terms
    - Years of experience
    - Dates and durations
    - Contact information structure

    Args:
        raw_text: Raw extracted text from resume

    Returns:
        Cleaned text suitable for LLM processing
    """
    if not raw_text:
        return ""

    text = raw_text

    # Remove null bytes and other control characters (except newline/tab)
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)

    # Normalize unicode characters
    text = text.replace('\u2019', "'")  # Smart apostrophe
    text = text.replace('\u2018', "'")  # Smart quote
    text = text.replace('\u201c', '"')  # Smart double quote
    text = text.replace('\u201d', '"')  # Smart double quote
    text = text.replace('\u2013', '-')  # En dash
    text = text.replace('\u2014', '-')  # Em dash
    text = text.replace('\u2022', '-')  # Bullet point
    text = text.replace('\u00a0', ' ')  # Non-breaking space

    # Remove page numbers (e.g., "Page 1 of 3", "1", "-1-")
    text = re.sub(r'\bPage\s+\d+\s*(of\s*\d+)?\b', '', text, flags=re.IGNORECASE)
    text = re.sub(r'\n\s*-?\d+-?\s*\n', '\n', text)

    # Remove common header/footer patterns
    text = re.sub(r'^\s*(confidential|resume|curriculum vitae|cv)\s*$', '', text, flags=re.IGNORECASE | re.MULTILINE)

    # Remove excessive whitespace
    text = re.sub(r'[ \t]+', ' ', text)  # Multiple spaces/tabs to single space
    text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)  # Multiple newlines to double newline
    text = re.sub(r'^\s+', '', text, flags=re.MULTILINE)  # Leading whitespace per line

    # Remove lines that are just separators
    text = re.sub(r'^\s*[-=_*]{3,}\s*$', '', text, flags=re.MULTILINE)

    # Clean up bullet points and list markers
    text = re.sub(r'^[\s]*[•●○◦▪▸►]\s*', '- ', text, flags=re.MULTILINE)
    text = re.sub(r'^[\s]*[a-z]\)\s+', '- ', text, flags=re.MULTILINE | re.IGNORECASE)

    # Normalize date formats (preserve but clean)
    # e.g., "Jan 2020 - Present" or "2018-2022"
    text = re.sub(r'\s*[-–—]\s*', ' - ', text)  # Normalize dashes in date ranges

    # Final cleanup
    text = text.strip()

    return text


# ============================================
# Text Chunking
# ============================================

def chunk_text(
    text: str,
    max_tokens: int = 3000,
    overlap_tokens: int = 200
) -> List[str]:
    """
    Split text into chunks that fit within token limits.

    Used for processing long resumes that exceed LLM context limits.

    Args:
        text: Text to chunk
        max_tokens: Maximum tokens per chunk
        overlap_tokens: Tokens to overlap between chunks for context

    Returns:
        List of text chunks
    """
    if not text:
        return []

    # Count total tokens
    total_tokens = count_tokens(text)

    # If text fits in one chunk, return as-is
    if total_tokens <= max_tokens:
        return [text]

    # Split by paragraphs first
    paragraphs = text.split('\n\n')
    chunks = []
    current_chunk = []
    current_tokens = 0

    for para in paragraphs:
        para_tokens = count_tokens(para)

        # If single paragraph exceeds limit, split it further
        if para_tokens > max_tokens:
            # Save current chunk if exists
            if current_chunk:
                chunks.append('\n\n'.join(current_chunk))
                current_chunk = []
                current_tokens = 0

            # Split long paragraph by sentences
            sentences = re.split(r'(?<=[.!?])\s+', para)
            for sentence in sentences:
                sent_tokens = count_tokens(sentence)
                if current_tokens + sent_tokens > max_tokens:
                    if current_chunk:
                        chunks.append('\n\n'.join(current_chunk))
                    current_chunk = [sentence]
                    current_tokens = sent_tokens
                else:
                    current_chunk.append(sentence)
                    current_tokens += sent_tokens
        elif current_tokens + para_tokens > max_tokens:
            # Start new chunk
            chunks.append('\n\n'.join(current_chunk))
            current_chunk = [para]
            current_tokens = para_tokens
        else:
            current_chunk.append(para)
            current_tokens += para_tokens

    # Add final chunk
    if current_chunk:
        chunks.append('\n\n'.join(current_chunk))

    return chunks


# ============================================
# Text Validation
# ============================================

def is_meaningful_text(text: str, min_length: int = 50) -> bool:
    """
    Check if text contains meaningful content for skill extraction.

    Args:
        text: Text to validate
        min_length: Minimum length for meaningful text

    Returns:
        True if text appears to contain meaningful content
    """
    if not text or len(text.strip()) < min_length:
        return False

    # Check for some alphabetic content
    alpha_count = sum(1 for c in text if c.isalpha())
    if alpha_count < min_length * 0.3:  # At least 30% alphabetic
        return False

    return True


def extract_years_experience(text: str) -> dict:
    """
    Extract years of experience mentions from text.

    Args:
        text: Text to search

    Returns:
        Dict mapping skill/role to years mentioned
    """
    experience_patterns = [
        # "5 years of Python experience"
        r'(\d+)\+?\s*years?\s+(?:of\s+)?(?:experience\s+(?:in|with)\s+)?([A-Za-z+#]+(?:\s+[A-Za-z+#]+)?)',
        # "Python (5 years)"
        r'([A-Za-z+#]+(?:\s+[A-Za-z+#]+)?)\s*\((\d+)\+?\s*years?\)',
        # "5+ years Python"
        r'(\d+)\+?\s*years?\s+([A-Za-z+#]+)',
    ]

    results = {}

    for pattern in experience_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            if len(match) == 2:
                # Determine which group is years vs skill
                if match[0].isdigit() or match[0].replace('+', '').isdigit():
                    years = int(match[0].replace('+', ''))
                    skill = match[1].strip()
                else:
                    skill = match[0].strip()
                    years = int(match[1].replace('+', ''))

                # Normalize skill name
                skill = skill.title()
                if skill and years > 0:
                    results[skill] = max(results.get(skill, 0), years)

    return results
