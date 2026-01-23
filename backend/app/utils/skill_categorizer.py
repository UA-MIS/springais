"""Shared skill categorization logic."""

CATEGORY_KEYWORDS = {
    "programming": [
        "python", "java", "javascript", "typescript", "c#", "c++",
        "go", "rust", "ruby", "php", "swift", "kotlin", "scala",
        "react", "angular", "vue", "node", "django", "flask", "spring",
        "html", "css", "sql", "nosql", "mongodb", "postgresql", ".net", "asp.net"
    ],
    "cloud_infrastructure": [
        "aws", "azure", "gcp", "cloud", "terraform", "devops",
        "ci/cd", "jenkins", "docker", "kubernetes", "k8s"
    ],
    "data_analytics": [
        "data", "analytics", "machine learning", "ml", "ai",
        "statistics", "etl", "spark", "hadoop", "tableau",
        "power bi", "visualization", "pandas", "numpy"
    ],
    "leadership_management": [
        "leadership", "management", "team lead", "director",
        "mentoring", "coaching", "supervision", "people management"
    ],
    "soft": [
        "communication", "teamwork", "collaboration", "presentation",
        "negotiation", "problem solving", "critical thinking",
        "interpersonal", "public speaking"
    ],
    "business_acumen": [
        "marketing", "branding", "content creation", "seo",
        "advertising", "campaign", "sales", "business development",
        "strategy", "planning", "budgeting", "forecasting", "outreach"
    ],
    "domain": [
        "audit", "tax", "advisory", "consulting", "financial",
        "compliance", "regulatory", "accounting", "risk", "legal",
        "procurement", "vendor", "supply chain", "recruitment"
    ],
    "tools": [
        "excel", "powerpoint", "word", "google suite", "jira",
        "confluence", "git", "github", "slack", "teams",
        "salesforce", "sap", "oracle", "vs code", "cursor"
    ],
    "research": [
        "research", "surveys", "analysis", "studies", "methodology",
        "qualitative", "quantitative", "user research", "market research"
    ],
}

def categorize_skill(skill_name: str) -> str:
    """Categorize a skill based on keywords."""
    value = skill_name.lower()

    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in value for kw in keywords):
            return category

    # Smart fallback
    if any(word in value for word in ["manage", "lead", "direct", "head"]):
        return "leadership_management"
    if any(word in value for word in ["develop", "engineer", "code", "program"]):
        return "programming"

    return "business_acumen"  # Better default than programming
