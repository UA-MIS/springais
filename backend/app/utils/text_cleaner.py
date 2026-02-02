"""
Text cleaning utilities for resume processing.

Cleans extracted resume text by:
- Removing excessive whitespace
- Removing formatting artifacts
- Stripping PII (names, emails, phones, addresses) for bias mitigation
- Preserving skill names and experience information
- Chunking long texts for LLM processing
"""

import re
from typing import List, Tuple

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
# PII Stripping (Bias Mitigation)
# ============================================

# Common name prefixes/suffixes to help identify name lines
NAME_PREFIXES = {'mr', 'mrs', 'ms', 'dr', 'prof', 'professor'}
NAME_SUFFIXES = {'jr', 'sr', 'ii', 'iii', 'iv', 'phd', 'md', 'esq', 'cpa'}

# Top universities that could signal socioeconomic bias (Ivy+ and equivalents)
PRESTIGIOUS_INSTITUTIONS = {
    # Ivy League
    'harvard', 'yale', 'princeton', 'columbia', 'upenn', 'penn',
    'dartmouth', 'brown', 'cornell',
    # Top tech/research
    'stanford', 'mit', 'caltech', 'berkeley', 'carnegie mellon',
    # Other elite US
    'duke', 'northwestern', 'uchicago', 'chicago', 'ucla', 'nyu',
    'georgetown', 'vanderbilt', 'notre dame', 'rice', 'emory',
    # International elite
    'oxford', 'cambridge', 'lse', 'imperial college'
}


def strip_pii(text: str, aggressive: bool = False) -> Tuple[str, dict]:
    """
    Strip personally identifiable information from resume text.

    This is a pre-processing step for bias mitigation. Removes:
    - Email addresses
    - Phone numbers
    - Physical addresses (street addresses, zip codes)
    - URLs and social media links
    - The candidate's name (first 1-2 lines typically)

    Optionally (aggressive=True) also obscures:
    - University names (replaces with [UNIVERSITY])
    - Company names in headers (harder to detect reliably)

    Args:
        text: Resume text to strip PII from
        aggressive: If True, also obscure institution names

    Returns:
        Tuple of (stripped_text, metadata_dict with counts of what was removed)
    """
    if not text:
        return "", {"items_removed": 0}

    stripped = text
    removed_counts = {
        "emails": 0,
        "phones": 0,
        "addresses": 0,
        "urls": 0,
        "names": 0,
        "institutions": 0
    }

    # 1. Remove email addresses
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    emails_found = re.findall(email_pattern, stripped)
    removed_counts["emails"] = len(emails_found)
    stripped = re.sub(email_pattern, '[EMAIL]', stripped)

    # 2. Remove phone numbers (various formats)
    phone_patterns = [
        r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',  # (123) 456-7890, 123-456-7890
        r'\+?1?[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',  # +1 123 456 7890
        r'\b\d{3}[-.\s]\d{4}\b',  # 456-7890 (local)
    ]
    for pattern in phone_patterns:
        phones_found = re.findall(pattern, stripped)
        removed_counts["phones"] += len(phones_found)
        stripped = re.sub(pattern, '[PHONE]', stripped)

    # 3. Remove URLs (LinkedIn, personal websites, etc.)
    url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
    urls_found = re.findall(url_pattern, stripped)
    removed_counts["urls"] = len(urls_found)
    stripped = re.sub(url_pattern, '[URL]', stripped)

    # Also catch linkedin.com/in/username patterns without http
    linkedin_pattern = r'\blinkedin\.com/in/[A-Za-z0-9_-]+\b'
    stripped = re.sub(linkedin_pattern, '[LINKEDIN]', stripped, flags=re.IGNORECASE)

    # 4. Remove physical addresses
    # Street addresses: "123 Main Street", "456 Oak Ave, Apt 7"
    street_pattern = r'\b\d{1,5}\s+[A-Za-z]+(?:\s+[A-Za-z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Circle|Cir|Place|Pl)\.?(?:\s*,?\s*(?:Apt|Suite|Ste|Unit|#)\s*\d+[A-Za-z]?)?\b'
    addresses_found = re.findall(street_pattern, stripped, flags=re.IGNORECASE)
    removed_counts["addresses"] += len(addresses_found)
    stripped = re.sub(street_pattern, '[ADDRESS]', stripped, flags=re.IGNORECASE)

    # Zip codes (US): standalone 5-digit or 5+4 format
    zip_pattern = r'\b\d{5}(?:-\d{4})?\b'
    stripped = re.sub(zip_pattern, '[ZIP]', stripped)

    # City, State patterns: "New York, NY" or "San Francisco, California"
    city_state_pattern = r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*(?:AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New\s+Hampshire|New\s+Jersey|New\s+Mexico|New\s+York|North\s+Carolina|North\s+Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode\s+Island|South\s+Carolina|South\s+Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West\s+Virginia|Wisconsin|Wyoming)\b'
    stripped = re.sub(city_state_pattern, '[LOCATION]', stripped)

    # 5. Remove candidate name (typically first 1-2 non-empty lines)
    lines = stripped.split('\n')
    new_lines = []
    name_lines_removed = 0

    for i, line in enumerate(lines):
        clean_line = line.strip()

        # Skip empty lines at the start
        if not clean_line and name_lines_removed == 0:
            new_lines.append(line)
            continue

        # First 2 non-empty, non-placeholder lines are likely the name/title
        if name_lines_removed < 2 and clean_line:
            # Check if this looks like a name line (short, no technical keywords)
            is_name_line = (
                len(clean_line) < 40 and  # Names are short
                not any(kw in clean_line.lower() for kw in [
                    'experience', 'education', 'skills', 'summary', 'objective',
                    'work', 'employment', 'professional', 'technical', 'projects',
                    'certification', 'award', '@', 'http', 'year', 'senior',
                    'junior', 'manager', 'engineer', 'developer', 'analyst',
                    # Common skills that might appear on short lines
                    'python', 'javascript', 'java', 'react', 'node', 'aws',
                    'docker', 'kubernetes', 'sql', 'typescript', 'angular',
                    'bachelor', 'master', 'degree', 'university', 'college'
                ]) and
                not re.match(r'^\[(?:EMAIL|PHONE|URL|ADDRESS|LOCATION)\]', clean_line) and  # Not already a placeholder
                ',' not in clean_line  # Skill lists often have commas
            )

            if is_name_line:
                new_lines.append('[CANDIDATE]')
                name_lines_removed += 1
                removed_counts["names"] += 1
                continue

        new_lines.append(line)

    stripped = '\n'.join(new_lines)

    # 6. Optionally obscure prestigious institutions (aggressive mode)
    if aggressive:
        for institution in PRESTIGIOUS_INSTITUTIONS:
            pattern = r'\b' + institution + r'\b'
            if re.search(pattern, stripped, flags=re.IGNORECASE):
                removed_counts["institutions"] += 1
            stripped = re.sub(pattern, '[UNIVERSITY]', stripped, flags=re.IGNORECASE)

    # Clean up multiple consecutive placeholders
    stripped = re.sub(r'(\[(?:EMAIL|PHONE|URL|ADDRESS|LOCATION|CANDIDATE)\]\s*)+',
                      lambda m: m.group().split(']')[0] + '] ', stripped)

    # Calculate total
    removed_counts["items_removed"] = sum(v for k, v in removed_counts.items() if k != "items_removed")

    return stripped, removed_counts


def strip_pii_simple(text: str) -> str:
    """
    Convenience wrapper that returns only the stripped text.

    Args:
        text: Resume text to strip PII from

    Returns:
        Text with PII removed
    """
    stripped, _ = strip_pii(text)
    return stripped


# ============================================
# Text Cleaning
# ============================================

def clean_resume_text(raw_text: str, strip_pii_flag: bool = True) -> str:
    """
    Clean extracted resume text for LLM processing.

    Removes:
    - Excessive whitespace and newlines
    - Page numbers and headers/footers
    - Special formatting characters
    - Unicode artifacts
    - PII (emails, phones, addresses, names) when strip_pii_flag=True

    Preserves:
    - Skill names and technical terms
    - Years of experience
    - Dates and durations

    Args:
        raw_text: Raw extracted text from resume
        strip_pii_flag: Whether to strip PII for bias mitigation (default: True)

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

    # Strip PII early, before format changes that might break detection patterns
    if strip_pii_flag:
        text, _ = strip_pii(text)

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
