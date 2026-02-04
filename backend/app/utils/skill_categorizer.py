"""Shared skill categorization logic."""

CATEGORY_KEYWORDS = {
    "programming": [
        # Languages
        "python", "java", "javascript", "typescript", "c#", "c++", "csharp",
        "go", "rust", "ruby", "php", "swift", "kotlin", "scala", "perl",
        # Frameworks & Libraries
        "react", "angular", "vue", "node", "django", "flask", "spring",
        "next.js", "nextjs", "express", "fastapi", "laravel", "rails",
        "bootstrap", "tailwind", "jquery", "webpack", "vite",
        # Web fundamentals
        "html", "css", "sass", "scss", "less",
        # Databases & Query
        "sql", "nosql", "mongodb", "postgresql", "mysql", "redis", "graphql",
        # Platforms
        ".net", "asp.net", "dotnet",
        # Concepts
        "api", "rest", "restful", "microservices", "backend", "frontend",
        "full-stack", "fullstack", "web development", "software development",
        "object-oriented", "oop", "functional programming",
        "authentication", "authorization", "mvp",
    ],
    "cloud_infrastructure": [
        "aws", "azure", "gcp", "cloud", "terraform", "devops",
        "ci/cd", "jenkins", "docker", "kubernetes", "k8s",
        "linux", "unix", "windows server", "macos", "ubuntu", "centos",
        "nginx", "apache", "load balancer", "cdn",
        "infrastructure", "deployment", "serverless", "lambda",
    ],
    "data_analytics": [
        "data", "analytics", "machine learning", "ml", "ai",
        "statistics", "etl", "spark", "hadoop", "tableau",
        "power bi", "visualization", "pandas", "numpy", "scikit",
        "tensorflow", "pytorch", "deep learning", "neural network",
        "nlp", "natural language", "llm", "large language model",
        "data science", "data engineering", "data catalog",
    ],
    "leadership_management": [
        "leadership", "management", "team lead", "director",
        "mentoring", "coaching", "supervision", "people management",
        "cross-functional", "stakeholder", "coordination",
        "project management", "program management", "scrum master",
    ],
    "soft": [
        "communication", "teamwork", "collaboration", "presentation",
        "negotiation", "problem solving", "critical thinking",
        "interpersonal", "public speaking", "attention to detail",
        "time management", "adaptability", "creativity",
    ],
    "business_acumen": [
        "marketing", "branding", "content creation", "seo",
        "advertising", "campaign", "sales", "business development",
        "strategy", "planning", "budgeting", "forecasting", "outreach",
        "product management", "business analysis", "requirements",
    ],
    "domain": [
        "audit", "tax", "advisory", "consulting", "financial",
        "compliance", "regulatory", "accounting", "risk", "legal",
        "procurement", "vendor", "supply chain", "recruitment",
        "sox", "it controls", "general controls", "access control",
        "security", "cybersecurity", "vulnerability", "threat",
        "data protection", "privacy", "gdpr",
    ],
    "tools": [
        "excel", "powerpoint", "word", "google suite", "jira",
        "confluence", "git", "github", "gitlab", "slack", "teams",
        "salesforce", "sap", "oracle", "vs code", "cursor",
        "visual studio", "intellij", "eclipse", "xcode",
        "postman", "figma", "sketch", "adobe", "photoshop",
        "trello", "asana", "notion", "monday",
        "digitization", "archiving", "document",
    ],
    "research": [
        "research", "surveys", "analysis", "studies", "methodology",
        "qualitative", "quantitative", "user research", "market research",
        "ux research", "usability", "a/b testing",
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
