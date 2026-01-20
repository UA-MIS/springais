"""
O*NET API Client for SpringAIS Synthetic Data Generation

This module provides skill data from O*NET (Occupational Information Network).
It supports two modes:
1. CACHED MODE (default): Uses pre-fetched O*NET data - no API key required
2. LIVE MODE: Fetches fresh data from O*NET API - requires ONET_API_KEY

Relevant O*NET Occupation Codes:
- 13-2011.00 - Accountants and Auditors (Assurance)
- 13-2081.00 - Tax Preparers (Tax)
- 13-1111.00 - Management Analysts (Consulting)
- 15-1211.00 - Computer Systems Analysts (Tech Consulting)

Usage:
    from onet_client import ONetClient
    
    # Using cached data (no API key needed)
    client = ONetClient()
    skills = client.get_skills_for_service_line("Assurance")
    
    # Using live API (requires key)
    client = ONetClient(api_key="your_key", use_cache=False)
    skills = client.get_skills("13-2011.00")
"""

import os
import time
import base64
import logging
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
from functools import lru_cache

# Optional import for live API mode
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False

logger = logging.getLogger(__name__)


@dataclass
class ONetSkill:
    """Represents a skill from O*NET with importance and level scores."""
    name: str
    importance: float  # 1-5 scale (how important to the job)
    level: float  # 0-7 scale (required proficiency level)
    category: str  # e.g., "Knowledge", "Skill", "Ability"
    
    @property
    def relevance_score(self) -> float:
        """Combined score for ranking skills."""
        return (self.importance / 5.0) * (self.level / 7.0)


@dataclass  
class OccupationMapping:
    """Maps EY service lines to O*NET occupation codes."""
    service_line: str
    occupation_codes: List[str]
    occupation_names: List[str]


# =============================================================================
# O*NET OCCUPATION CODE MAPPINGS
# =============================================================================

SERVICE_LINE_MAPPINGS: Dict[str, OccupationMapping] = {
    "Assurance": OccupationMapping(
        service_line="Assurance",
        occupation_codes=["13-2011.00", "13-2011.01", "13-2011.02"],
        occupation_names=["Accountants and Auditors", "Accountants", "Auditors"],
    ),
    "Tax": OccupationMapping(
        service_line="Tax",
        occupation_codes=["13-2081.00", "13-2082.00", "23-1011.00"],
        occupation_names=["Tax Preparers", "Tax Examiners", "Lawyers (Tax)"],
    ),
    "Consulting": OccupationMapping(
        service_line="Consulting",
        occupation_codes=["13-1111.00", "15-1211.00", "11-1021.00"],
        occupation_names=["Management Analysts", "Computer Systems Analysts", "General Managers"],
    ),
}


# =============================================================================
# CACHED O*NET SKILL DATA
# Pre-fetched from O*NET Online (https://www.onetonline.org/)
# This allows the module to work without an API key
# =============================================================================

CACHED_ONET_SKILLS: Dict[str, List[ONetSkill]] = {
    # Accountants and Auditors (13-2011.00)
    "13-2011.00": [
        # Knowledge
        ONetSkill("Economics and Accounting", 4.62, 5.12, "Knowledge"),
        ONetSkill("Mathematics", 4.25, 4.50, "Knowledge"),
        ONetSkill("English Language", 4.12, 4.62, "Knowledge"),
        ONetSkill("Administration and Management", 3.88, 4.00, "Knowledge"),
        ONetSkill("Computers and Electronics", 3.75, 4.12, "Knowledge"),
        ONetSkill("Law and Government", 3.62, 3.88, "Knowledge"),
        ONetSkill("Customer and Personal Service", 3.50, 3.62, "Knowledge"),
        # Skills
        ONetSkill("Active Listening", 4.25, 4.38, "Skill"),
        ONetSkill("Reading Comprehension", 4.25, 4.50, "Skill"),
        ONetSkill("Critical Thinking", 4.12, 4.38, "Skill"),
        ONetSkill("Speaking", 4.00, 4.25, "Skill"),
        ONetSkill("Writing", 3.88, 4.00, "Skill"),
        ONetSkill("Mathematics", 4.00, 4.25, "Skill"),
        ONetSkill("Judgment and Decision Making", 3.88, 4.00, "Skill"),
        ONetSkill("Complex Problem Solving", 3.75, 4.00, "Skill"),
        ONetSkill("Time Management", 3.75, 3.88, "Skill"),
        # Abilities
        ONetSkill("Written Comprehension", 4.25, 4.50, "Ability"),
        ONetSkill("Oral Comprehension", 4.12, 4.25, "Ability"),
        ONetSkill("Deductive Reasoning", 4.00, 4.25, "Ability"),
        ONetSkill("Number Facility", 4.00, 4.12, "Ability"),
        ONetSkill("Mathematical Reasoning", 3.88, 4.00, "Ability"),
        ONetSkill("Information Ordering", 3.75, 3.88, "Ability"),
    ],
    
    # Tax Preparers (13-2081.00)
    "13-2081.00": [
        # Knowledge
        ONetSkill("Economics and Accounting", 4.50, 4.88, "Knowledge"),
        ONetSkill("Customer and Personal Service", 4.12, 4.00, "Knowledge"),
        ONetSkill("Mathematics", 4.00, 4.25, "Knowledge"),
        ONetSkill("English Language", 3.88, 4.12, "Knowledge"),
        ONetSkill("Law and Government", 4.25, 4.50, "Knowledge"),
        ONetSkill("Computers and Electronics", 3.62, 3.88, "Knowledge"),
        ONetSkill("Clerical", 3.50, 3.50, "Knowledge"),
        # Skills
        ONetSkill("Active Listening", 4.25, 4.25, "Skill"),
        ONetSkill("Reading Comprehension", 4.12, 4.38, "Skill"),
        ONetSkill("Speaking", 4.00, 4.12, "Skill"),
        ONetSkill("Mathematics", 4.25, 4.50, "Skill"),
        ONetSkill("Critical Thinking", 3.88, 4.12, "Skill"),
        ONetSkill("Service Orientation", 3.88, 4.00, "Skill"),
        ONetSkill("Writing", 3.62, 3.88, "Skill"),
        ONetSkill("Time Management", 3.75, 3.88, "Skill"),
        # Abilities  
        ONetSkill("Number Facility", 4.25, 4.38, "Ability"),
        ONetSkill("Written Comprehension", 4.00, 4.25, "Ability"),
        ONetSkill("Oral Comprehension", 4.00, 4.12, "Ability"),
        ONetSkill("Mathematical Reasoning", 4.00, 4.25, "Ability"),
        ONetSkill("Deductive Reasoning", 3.88, 4.00, "Ability"),
        ONetSkill("Near Vision", 3.62, 3.50, "Ability"),
    ],
    
    # Management Analysts (13-1111.00)
    "13-1111.00": [
        # Knowledge
        ONetSkill("Administration and Management", 4.38, 4.62, "Knowledge"),
        ONetSkill("English Language", 4.25, 4.50, "Knowledge"),
        ONetSkill("Customer and Personal Service", 4.00, 4.12, "Knowledge"),
        ONetSkill("Economics and Accounting", 3.88, 4.12, "Knowledge"),
        ONetSkill("Computers and Electronics", 3.75, 4.00, "Knowledge"),
        ONetSkill("Personnel and Human Resources", 3.50, 3.62, "Knowledge"),
        ONetSkill("Mathematics", 3.38, 3.62, "Knowledge"),
        # Skills
        ONetSkill("Active Listening", 4.38, 4.50, "Skill"),
        ONetSkill("Critical Thinking", 4.38, 4.50, "Skill"),
        ONetSkill("Reading Comprehension", 4.38, 4.62, "Skill"),
        ONetSkill("Speaking", 4.25, 4.50, "Skill"),
        ONetSkill("Complex Problem Solving", 4.25, 4.50, "Skill"),
        ONetSkill("Writing", 4.12, 4.38, "Skill"),
        ONetSkill("Judgment and Decision Making", 4.12, 4.38, "Skill"),
        ONetSkill("Systems Analysis", 4.00, 4.25, "Skill"),
        ONetSkill("Active Learning", 3.88, 4.12, "Skill"),
        ONetSkill("Social Perceptiveness", 3.75, 4.00, "Skill"),
        # Abilities
        ONetSkill("Oral Comprehension", 4.38, 4.50, "Ability"),
        ONetSkill("Written Comprehension", 4.38, 4.62, "Ability"),
        ONetSkill("Oral Expression", 4.25, 4.50, "Ability"),
        ONetSkill("Deductive Reasoning", 4.12, 4.38, "Ability"),
        ONetSkill("Inductive Reasoning", 4.00, 4.25, "Ability"),
        ONetSkill("Problem Sensitivity", 4.00, 4.12, "Ability"),
    ],
    
    # Computer Systems Analysts (15-1211.00) - for Tech Consulting
    "15-1211.00": [
        # Knowledge
        ONetSkill("Computers and Electronics", 4.62, 5.12, "Knowledge"),
        ONetSkill("English Language", 4.00, 4.25, "Knowledge"),
        ONetSkill("Customer and Personal Service", 3.88, 4.00, "Knowledge"),
        ONetSkill("Mathematics", 3.62, 4.00, "Knowledge"),
        ONetSkill("Administration and Management", 3.50, 3.75, "Knowledge"),
        ONetSkill("Telecommunications", 3.38, 3.75, "Knowledge"),
        # Skills
        ONetSkill("Critical Thinking", 4.38, 4.62, "Skill"),
        ONetSkill("Active Listening", 4.25, 4.38, "Skill"),
        ONetSkill("Reading Comprehension", 4.25, 4.50, "Skill"),
        ONetSkill("Complex Problem Solving", 4.25, 4.50, "Skill"),
        ONetSkill("Systems Analysis", 4.25, 4.50, "Skill"),
        ONetSkill("Speaking", 4.00, 4.25, "Skill"),
        ONetSkill("Systems Evaluation", 4.00, 4.25, "Skill"),
        ONetSkill("Judgment and Decision Making", 4.00, 4.25, "Skill"),
        ONetSkill("Writing", 3.88, 4.12, "Skill"),
        # Abilities
        ONetSkill("Oral Comprehension", 4.25, 4.38, "Ability"),
        ONetSkill("Written Comprehension", 4.25, 4.50, "Ability"),
        ONetSkill("Deductive Reasoning", 4.12, 4.38, "Ability"),
        ONetSkill("Inductive Reasoning", 4.00, 4.25, "Ability"),
        ONetSkill("Information Ordering", 4.00, 4.12, "Ability"),
    ],
}


# =============================================================================
# EY-SPECIFIC SKILL ENHANCEMENTS
# These are industry-specific skills not in O*NET but critical for EY roles
# =============================================================================

EY_SPECIFIC_SKILLS: Dict[str, List[str]] = {
    "Assurance": [
        "GAAP",
        "IFRS",
        "SOX Compliance",
        "Internal Controls",
        "Audit Documentation",
        "Audit Analytics",
        "SEC Reporting",
        "PCAOB Standards",
        "Sampling Methodology",
        "Workpaper Review",
        "Financial Statement Analysis",
        "Risk Assessment",
        "Control Testing",
        "Substantive Testing",
        "Excel",
        "Accounting",
        "Audit",
        "Financial Reporting",
    ],
    "Tax": [
        "Tax Law",
        "IRC Knowledge",
        "Tax Planning",
        "Tax Research",
        "Tax Compliance",
        "ASC 740",
        "Transfer Pricing",
        "International Tax",
        "M&A Tax",
        "State & Local Tax",
        "Tax Provisions",
        "Tax Software",
        "Tax Credits",
        "Tax Due Diligence",
        "Excel",
        "Tax Strategy",
    ],
    "Consulting": [
        # Core consulting skills
        "Strategy",
        "Business Analysis",
        "Change Management",
        "Project Management",
        "Stakeholder Management",
        "Process Improvement",
        "Digital Transformation",
        "Implementation",
        "Requirements Gathering",
        "Solution Design",
        "Client Management",
        "Proposal Development",
        "Workshop Facilitation",
        "Executive Communication",
        # Tech skills (from focus areas)
        "Python",
        "SQL",
        "AWS",
        "Azure",
        "GCP",
        "Terraform",
        "Kubernetes",
        "Docker",
        "DevOps",
        "Tableau",
        "Power BI",
        "Data Engineering",
        "Data Visualization",
        "TensorFlow",
        "PyTorch",
        "Machine Learning",
        "Data Science",
        "Security Architecture",
        "Cybersecurity",
        # Business skills (from focus areas)
        "Strategic Planning",
        "Competitive Analysis",
        "Market Research",
        "Lean Six Sigma",
        "Supply Chain",
        "ERP Implementation",
        "SAP",
        "Oracle",
        "Due Diligence",
        "Integration Planning",
        "PowerPoint",
        "Excel",
    ],
}


class ONetClient:
    """
    Client for fetching skill data from O*NET API or cached data.
    
    By default, uses cached O*NET data which doesn't require an API key.
    Set use_cache=False and provide api_key to fetch live data.
    """
    
    BASE_URL = "https://services.onetcenter.org/ws"
    
    def __init__(
        self, 
        api_key: Optional[str] = None, 
        use_cache: bool = True,
        rate_limit_delay: float = 6.0  # O*NET free tier: 10 req/min
    ):
        """
        Initialize O*NET client.
        
        Args:
            api_key: O*NET API key (from onetcenter.org). Not needed if use_cache=True.
            use_cache: If True, use pre-cached data. If False, fetch from API.
            rate_limit_delay: Seconds to wait between API calls (default: 6s for free tier)
        """
        self.api_key = api_key or os.getenv("ONET_API_KEY")
        self.use_cache = use_cache
        self.rate_limit_delay = rate_limit_delay
        self._last_request_time = 0.0
        
        if not use_cache and not self.api_key:
            logger.warning(
                "No API key provided and use_cache=False. "
                "Falling back to cached data. "
                "Set ONET_API_KEY environment variable or pass api_key parameter."
            )
            self.use_cache = True
    
    def _get_auth_header(self) -> Dict[str, str]:
        """Generate authentication header for O*NET API."""
        if not self.api_key:
            return {}
        # O*NET uses HTTP Basic Auth with API key as username, empty password
        credentials = base64.b64encode(f"{self.api_key}:".encode()).decode()
        return {"Authorization": f"Basic {credentials}"}
    
    def _rate_limit(self):
        """Enforce rate limiting for API calls."""
        elapsed = time.time() - self._last_request_time
        if elapsed < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - elapsed)
        self._last_request_time = time.time()
    
    def _fetch_from_api(self, occupation_code: str) -> List[ONetSkill]:
        """Fetch skills from O*NET API."""
        if not REQUESTS_AVAILABLE:
            logger.error("requests library not available for API calls")
            return []
        
        self._rate_limit()
        
        skills = []
        
        # Fetch skills
        try:
            url = f"{self.BASE_URL}/online/occupations/{occupation_code}/summary/skills"
            response = requests.get(url, headers=self._get_auth_header(), timeout=30)
            response.raise_for_status()
            data = response.json()
            
            for skill in data.get("element", []):
                skills.append(ONetSkill(
                    name=skill.get("name", ""),
                    importance=skill.get("score", {}).get("value", 3.0),
                    level=skill.get("score", {}).get("value", 3.0),  # Using same as importance for skills
                    category="Skill"
                ))
        except Exception as e:
            logger.error(f"Failed to fetch skills for {occupation_code}: {e}")
        
        # Fetch knowledge
        try:
            self._rate_limit()
            url = f"{self.BASE_URL}/online/occupations/{occupation_code}/summary/knowledge"
            response = requests.get(url, headers=self._get_auth_header(), timeout=30)
            response.raise_for_status()
            data = response.json()
            
            for item in data.get("element", []):
                skills.append(ONetSkill(
                    name=item.get("name", ""),
                    importance=item.get("score", {}).get("value", 3.0),
                    level=item.get("score", {}).get("value", 3.0),
                    category="Knowledge"
                ))
        except Exception as e:
            logger.error(f"Failed to fetch knowledge for {occupation_code}: {e}")
        
        # Fetch abilities
        try:
            self._rate_limit()
            url = f"{self.BASE_URL}/online/occupations/{occupation_code}/summary/abilities"
            response = requests.get(url, headers=self._get_auth_header(), timeout=30)
            response.raise_for_status()
            data = response.json()
            
            for item in data.get("element", []):
                skills.append(ONetSkill(
                    name=item.get("name", ""),
                    importance=item.get("score", {}).get("value", 3.0),
                    level=item.get("score", {}).get("value", 3.0),
                    category="Ability"
                ))
        except Exception as e:
            logger.error(f"Failed to fetch abilities for {occupation_code}: {e}")
        
        return skills
    
    @lru_cache(maxsize=32)
    def get_skills(self, occupation_code: str) -> List[ONetSkill]:
        """
        Get skills for an O*NET occupation code.
        
        Args:
            occupation_code: O*NET-SOC code (e.g., "13-2011.00")
            
        Returns:
            List of ONetSkill objects
        """
        if self.use_cache:
            return CACHED_ONET_SKILLS.get(occupation_code, [])
        else:
            return self._fetch_from_api(occupation_code)
    
    def get_skills_for_service_line(self, service_line: str) -> Dict[str, Any]:
        """
        Get combined skills for an EY service line.
        
        Merges O*NET skills with EY-specific skills.
        
        Args:
            service_line: "Assurance", "Tax", or "Consulting"
            
        Returns:
            Dict with 'onet_skills', 'ey_skills', and 'merged_skills'
        """
        mapping = SERVICE_LINE_MAPPINGS.get(service_line)
        if not mapping:
            logger.warning(f"Unknown service line: {service_line}")
            return {"onet_skills": [], "ey_skills": [], "merged_skills": []}
        
        # Gather O*NET skills from all mapped occupations
        onet_skills = []
        seen_names = set()
        
        for code in mapping.occupation_codes:
            for skill in self.get_skills(code):
                if skill.name not in seen_names:
                    onet_skills.append(skill)
                    seen_names.add(skill.name)
        
        # Sort by relevance score
        onet_skills.sort(key=lambda s: s.relevance_score, reverse=True)
        
        # Get EY-specific skills
        ey_skills = EY_SPECIFIC_SKILLS.get(service_line, [])
        
        # Merge: EY skills first (most relevant), then O*NET skills
        onet_skill_names = [s.name for s in onet_skills]
        merged_skills = ey_skills + [s for s in onet_skill_names if s not in ey_skills]
        
        return {
            "onet_skills": onet_skills,
            "ey_skills": ey_skills,
            "merged_skills": merged_skills,
        }
    
    def get_top_skills(
        self, 
        service_line: str, 
        n: int = 20,
        include_ey_specific: bool = True
    ) -> List[str]:
        """
        Get top N skills for a service line.
        
        Args:
            service_line: "Assurance", "Tax", or "Consulting"
            n: Number of skills to return
            include_ey_specific: If True, prioritize EY-specific skills
            
        Returns:
            List of skill names
        """
        result = self.get_skills_for_service_line(service_line)
        
        if include_ey_specific:
            return result["merged_skills"][:n]
        else:
            return [s.name for s in result["onet_skills"][:n]]
    
    def validate_skill(self, skill_name: str) -> bool:
        """
        Check if a skill name is valid (exists in O*NET or EY skills).
        
        Args:
            skill_name: Name of the skill to validate
            
        Returns:
            True if skill is valid
        """
        # Check O*NET cached skills
        for occupation_skills in CACHED_ONET_SKILLS.values():
            if any(s.name == skill_name for s in occupation_skills):
                return True
        
        # Check EY-specific skills
        for ey_skills in EY_SPECIFIC_SKILLS.values():
            if skill_name in ey_skills:
                return True
        
        return False
    
    def get_all_valid_skills(self) -> set:
        """Get set of all valid skill names."""
        skills = set()
        
        # O*NET skills
        for occupation_skills in CACHED_ONET_SKILLS.values():
            for s in occupation_skills:
                skills.add(s.name)
        
        # EY-specific skills
        for ey_skills in EY_SPECIFIC_SKILLS.values():
            skills.update(ey_skills)
        
        return skills


def print_skills_summary():
    """Print a summary of available skills for debugging."""
    client = ONetClient()
    
    print("\n" + "=" * 70)
    print("O*NET SKILLS SUMMARY FOR SPRINGAIS")
    print("=" * 70)
    
    for service_line in ["Assurance", "Tax", "Consulting"]:
        print(f"\n{service_line.upper()}")
        print("-" * 50)
        
        result = client.get_skills_for_service_line(service_line)
        
        print("\nEY-Specific Skills:")
        for skill in result["ey_skills"][:10]:
            print(f"  • {skill}")
        
        print("\nTop O*NET Skills (by relevance):")
        for skill in result["onet_skills"][:10]:
            print(f"  • {skill.name} (importance: {skill.importance:.2f}, category: {skill.category})")
    
    all_skills = client.get_all_valid_skills()
    print(f"\n{'=' * 70}")
    print(f"Total unique valid skills: {len(all_skills)}")
    print("=" * 70)


if __name__ == "__main__":
    # Test the module
    print_skills_summary()
    
    # Test specific lookups
    print("\n\nTesting specific lookups...")
    client = ONetClient()
    
    print("\nTop 10 Assurance skills:")
    for skill in client.get_top_skills("Assurance", n=10):
        print(f"  • {skill}")
    
    print("\nValidating skills:")
    test_skills = ["GAAP", "Tax Law", "Python", "Banana Farming"]
    for skill in test_skills:
        valid = "✅" if client.validate_skill(skill) else "❌"
        print(f"  {valid} {skill}")

