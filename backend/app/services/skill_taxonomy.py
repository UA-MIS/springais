"""
Skill Taxonomy Service.

Pre-computed skill relationships for intelligent matching.
Handles:
- Parent-child relationships (Microsoft Office -> Word, Excel, PowerPoint)
- Equivalences (JS === JavaScript)
- Implied skills (React implies JavaScript)
- Skill clusters for semantic grouping

This system improves match percentages by recognizing that users with
"Microsoft Word" + "Microsoft Excel" should get credit for "Microsoft Office".
"""

from typing import Dict, List, Set, Optional
from dataclasses import dataclass, field
import logging

logger = logging.getLogger(__name__)


@dataclass
class SkillRelationship:
    """Represents a skill and its relationships."""
    canonical_name: str
    aliases: List[str] = field(default_factory=list)  # Alternative names for same skill
    parent_skills: List[str] = field(default_factory=list)  # Skills this one implies knowledge of
    child_skills: List[str] = field(default_factory=list)  # Skills that imply knowledge of this
    related_skills: List[str] = field(default_factory=list)  # Semantically similar (for stretch matching)
    category: str = "general"


# Core taxonomy data - comprehensive skill relationships
SKILL_TAXONOMY: Dict[str, SkillRelationship] = {
    # ============================================
    # Microsoft Office Ecosystem
    # ============================================
    "microsoft office": SkillRelationship(
        canonical_name="Microsoft Office",
        aliases=["ms office", "office suite", "office 365", "m365", "microsoft 365", "office"],
        parent_skills=[],
        child_skills=["microsoft word", "microsoft excel", "microsoft powerpoint", "microsoft outlook", "microsoft access", "microsoft onenote"],
        related_skills=["google workspace", "libreoffice"],
        category="productivity"
    ),
    "microsoft excel": SkillRelationship(
        canonical_name="Microsoft Excel",
        aliases=["excel", "ms excel", "spreadsheets", "spreadsheet"],
        parent_skills=["microsoft office"],
        child_skills=["pivot tables", "vlookup", "excel vba", "excel macros", "power query", "power pivot"],
        related_skills=["google sheets", "data analysis", "financial modeling"],
        category="productivity"
    ),
    "microsoft word": SkillRelationship(
        canonical_name="Microsoft Word",
        aliases=["word", "ms word", "word processing"],
        parent_skills=["microsoft office"],
        child_skills=[],
        related_skills=["google docs", "technical writing", "documentation"],
        category="productivity"
    ),
    "microsoft powerpoint": SkillRelationship(
        canonical_name="Microsoft PowerPoint",
        aliases=["powerpoint", "ppt", "ms powerpoint", "presentations"],
        parent_skills=["microsoft office"],
        child_skills=[],
        related_skills=["google slides", "presentation skills", "keynote"],
        category="productivity"
    ),
    "microsoft outlook": SkillRelationship(
        canonical_name="Microsoft Outlook",
        aliases=["outlook", "ms outlook"],
        parent_skills=["microsoft office"],
        child_skills=[],
        related_skills=["gmail", "email management"],
        category="productivity"
    ),

    # ============================================
    # Programming Languages
    # ============================================
    "javascript": SkillRelationship(
        canonical_name="JavaScript",
        aliases=["js", "ecmascript", "es6", "es2015", "es2016", "es2017", "es2018", "es2019", "es2020", "es2021", "es2022", "es2023"],
        parent_skills=["web development", "programming"],
        child_skills=["react", "node.js", "vue.js", "angular", "typescript", "next.js", "express.js", "jquery"],
        related_skills=["html", "css", "frontend development"],
        category="programming"
    ),
    "typescript": SkillRelationship(
        canonical_name="TypeScript",
        aliases=["ts"],
        parent_skills=["javascript", "programming"],
        child_skills=[],
        related_skills=["react", "angular", "node.js"],
        category="programming"
    ),
    "react": SkillRelationship(
        canonical_name="React",
        aliases=["reactjs", "react.js", "react js"],
        parent_skills=["javascript", "frontend development"],
        child_skills=["react hooks", "redux", "next.js", "react native", "react router"],
        related_skills=["vue.js", "angular", "svelte"],
        category="programming"
    ),
    "python": SkillRelationship(
        canonical_name="Python",
        aliases=["python3", "py", "python 3"],
        parent_skills=["programming"],
        child_skills=["pandas", "numpy", "django", "flask", "fastapi", "pytorch", "tensorflow", "scikit-learn", "matplotlib"],
        related_skills=["data science", "machine learning", "automation"],
        category="programming"
    ),
    "java": SkillRelationship(
        canonical_name="Java",
        aliases=["java se", "java ee", "core java"],
        parent_skills=["programming"],
        child_skills=["spring", "spring boot", "hibernate", "maven", "gradle"],
        related_skills=["kotlin", "scala", "backend development"],
        category="programming"
    ),
    "c#": SkillRelationship(
        canonical_name="C#",
        aliases=["csharp", "c sharp", "c-sharp"],
        parent_skills=["programming", ".net"],
        child_skills=["asp.net", ".net core", "entity framework", "unity"],
        related_skills=["java", "backend development"],
        category="programming"
    ),
    "sql": SkillRelationship(
        canonical_name="SQL",
        aliases=["structured query language", "database querying"],
        parent_skills=["database management", "data"],
        child_skills=["postgresql", "mysql", "sql server", "oracle sql", "sqlite", "t-sql", "pl/sql"],
        related_skills=["data analysis", "database design", "nosql"],
        category="data"
    ),
    "html": SkillRelationship(
        canonical_name="HTML",
        aliases=["html5", "hypertext markup language"],
        parent_skills=["web development", "frontend development"],
        child_skills=[],
        related_skills=["css", "javascript"],
        category="programming"
    ),
    "css": SkillRelationship(
        canonical_name="CSS",
        aliases=["css3", "cascading style sheets", "stylesheets"],
        parent_skills=["web development", "frontend development"],
        child_skills=["sass", "scss", "less", "tailwind css", "bootstrap"],
        related_skills=["html", "javascript", "responsive design"],
        category="programming"
    ),

    # ============================================
    # Cloud Platforms
    # ============================================
    "aws": SkillRelationship(
        canonical_name="AWS",
        aliases=["amazon web services", "amazon aws", "amazon cloud"],
        parent_skills=["cloud computing"],
        child_skills=["ec2", "s3", "lambda", "rds", "cloudformation", "dynamodb", "ecs", "eks", "sqs", "sns", "api gateway", "cloudwatch"],
        related_skills=["azure", "gcp", "devops", "infrastructure"],
        category="cloud"
    ),
    "azure": SkillRelationship(
        canonical_name="Azure",
        aliases=["microsoft azure", "azure cloud", "ms azure"],
        parent_skills=["cloud computing"],
        child_skills=["azure functions", "azure devops", "azure storage", "azure sql", "azure kubernetes service", "azure app service"],
        related_skills=["aws", "gcp", "devops"],
        category="cloud"
    ),
    "gcp": SkillRelationship(
        canonical_name="GCP",
        aliases=["google cloud", "google cloud platform", "google cloud services"],
        parent_skills=["cloud computing"],
        child_skills=["bigquery", "cloud functions", "cloud run", "gke", "cloud storage", "pub/sub"],
        related_skills=["aws", "azure", "devops"],
        category="cloud"
    ),
    "cloud computing": SkillRelationship(
        canonical_name="Cloud Computing",
        aliases=["cloud", "cloud services", "cloud infrastructure"],
        parent_skills=[],
        child_skills=["aws", "azure", "gcp"],
        related_skills=["devops", "infrastructure", "serverless"],
        category="cloud"
    ),

    # ============================================
    # DevOps & Infrastructure
    # ============================================
    "docker": SkillRelationship(
        canonical_name="Docker",
        aliases=["containers", "containerization", "docker containers"],
        parent_skills=["devops", "containerization"],
        child_skills=["docker compose", "dockerfile"],
        related_skills=["kubernetes", "container orchestration", "microservices"],
        category="devops"
    ),
    "kubernetes": SkillRelationship(
        canonical_name="Kubernetes",
        aliases=["k8s", "kube"],
        parent_skills=["container orchestration", "devops"],
        child_skills=["helm", "kubectl", "kubernetes operators"],
        related_skills=["docker", "cloud computing", "microservices"],
        category="devops"
    ),
    "devops": SkillRelationship(
        canonical_name="DevOps",
        aliases=["dev ops", "development operations"],
        parent_skills=[],
        child_skills=["ci/cd", "docker", "kubernetes", "terraform", "ansible", "jenkins", "github actions"],
        related_skills=["cloud computing", "automation", "infrastructure as code"],
        category="devops"
    ),
    "ci/cd": SkillRelationship(
        canonical_name="CI/CD",
        aliases=["continuous integration", "continuous deployment", "continuous delivery", "cicd"],
        parent_skills=["devops"],
        child_skills=["jenkins", "github actions", "gitlab ci", "circleci", "azure pipelines"],
        related_skills=["automation", "testing"],
        category="devops"
    ),
    "git": SkillRelationship(
        canonical_name="Git",
        aliases=["git version control", "version control"],
        parent_skills=["software development"],
        child_skills=["github", "gitlab", "bitbucket"],
        related_skills=["source control", "collaboration"],
        category="devops"
    ),
    "terraform": SkillRelationship(
        canonical_name="Terraform",
        aliases=["hashicorp terraform", "tf"],
        parent_skills=["infrastructure as code", "devops"],
        child_skills=[],
        related_skills=["cloudformation", "pulumi", "ansible"],
        category="devops"
    ),

    # ============================================
    # Data & Analytics
    # ============================================
    "data analysis": SkillRelationship(
        canonical_name="Data Analysis",
        aliases=["data analytics", "analytics", "data analyst"],
        parent_skills=["data"],
        child_skills=["excel", "sql", "python", "tableau", "power bi", "statistics"],
        related_skills=["business intelligence", "reporting", "visualization"],
        category="data"
    ),
    "machine learning": SkillRelationship(
        canonical_name="Machine Learning",
        aliases=["ml", "machine learning algorithms"],
        parent_skills=["artificial intelligence", "data science"],
        child_skills=["deep learning", "neural networks", "scikit-learn", "tensorflow", "pytorch", "nlp"],
        related_skills=["statistics", "python", "data modeling"],
        category="data"
    ),
    "data science": SkillRelationship(
        canonical_name="Data Science",
        aliases=["data scientist"],
        parent_skills=["data"],
        child_skills=["machine learning", "statistics", "python", "r", "data visualization"],
        related_skills=["analytics", "big data"],
        category="data"
    ),
    "tableau": SkillRelationship(
        canonical_name="Tableau",
        aliases=["tableau desktop", "tableau server"],
        parent_skills=["data visualization", "business intelligence"],
        child_skills=[],
        related_skills=["power bi", "looker", "data studio"],
        category="data"
    ),
    "power bi": SkillRelationship(
        canonical_name="Power BI",
        aliases=["powerbi", "microsoft power bi", "ms power bi"],
        parent_skills=["data visualization", "business intelligence", "microsoft office"],
        child_skills=["dax", "power query"],
        related_skills=["tableau", "looker", "excel"],
        category="data"
    ),

    # ============================================
    # Leadership & Management
    # ============================================
    "project management": SkillRelationship(
        canonical_name="Project Management",
        aliases=["pm", "project mgmt", "project manager"],
        parent_skills=["management", "leadership"],
        child_skills=["agile", "scrum", "waterfall", "pmp", "prince2", "jira"],
        related_skills=["team leadership", "stakeholder management", "planning"],
        category="management"
    ),
    "agile": SkillRelationship(
        canonical_name="Agile",
        aliases=["agile methodology", "agile methodologies", "agile framework"],
        parent_skills=["project management"],
        child_skills=["scrum", "kanban", "safe", "lean"],
        related_skills=["continuous improvement", "sprint planning"],
        category="management"
    ),
    "scrum": SkillRelationship(
        canonical_name="Scrum",
        aliases=["scrum master", "scrum methodology"],
        parent_skills=["agile", "project management"],
        child_skills=[],
        related_skills=["kanban", "sprint planning", "daily standups"],
        category="management"
    ),
    "leadership": SkillRelationship(
        canonical_name="Leadership",
        aliases=["team leadership", "people leadership", "leader"],
        parent_skills=[],
        child_skills=["project management", "team management", "mentoring", "coaching"],
        related_skills=["communication", "decision making", "strategic thinking"],
        category="management"
    ),
    "team management": SkillRelationship(
        canonical_name="Team Management",
        aliases=["people management", "managing teams"],
        parent_skills=["leadership", "management"],
        child_skills=["mentoring", "coaching", "performance management"],
        related_skills=["communication", "conflict resolution"],
        category="management"
    ),

    # ============================================
    # Communication & Soft Skills
    # ============================================
    "communication": SkillRelationship(
        canonical_name="Communication",
        aliases=["communication skills", "effective communication"],
        parent_skills=["soft skills"],
        child_skills=["written communication", "verbal communication", "presentation skills", "public speaking"],
        related_skills=["interpersonal skills", "collaboration"],
        category="soft_skills"
    ),
    "problem solving": SkillRelationship(
        canonical_name="Problem Solving",
        aliases=["problem-solving", "analytical thinking", "critical thinking"],
        parent_skills=["soft skills"],
        child_skills=[],
        related_skills=["decision making", "troubleshooting", "analysis"],
        category="soft_skills"
    ),

    # ============================================
    # Business & Finance
    # ============================================
    "financial analysis": SkillRelationship(
        canonical_name="Financial Analysis",
        aliases=["finance", "financial modeling", "financial analyst"],
        parent_skills=["business", "finance"],
        child_skills=["excel", "financial modeling", "budgeting", "forecasting"],
        related_skills=["accounting", "investment analysis", "valuation"],
        category="finance"
    ),
    "accounting": SkillRelationship(
        canonical_name="Accounting",
        aliases=["accountant", "bookkeeping"],
        parent_skills=["finance"],
        child_skills=["gaap", "ifrs", "tax accounting", "audit"],
        related_skills=["financial analysis", "budgeting"],
        category="finance"
    ),

    # ============================================
    # Frameworks & Libraries (Additional)
    # ============================================
    "node.js": SkillRelationship(
        canonical_name="Node.js",
        aliases=["nodejs", "node"],
        parent_skills=["javascript", "backend development"],
        child_skills=["express.js", "npm", "nest.js"],
        related_skills=["python", "java", "backend"],
        category="programming"
    ),
    "spring": SkillRelationship(
        canonical_name="Spring",
        aliases=["spring framework"],
        parent_skills=["java", "backend development"],
        child_skills=["spring boot", "spring mvc", "spring security", "spring data"],
        related_skills=["hibernate", "maven"],
        category="programming"
    ),
    "django": SkillRelationship(
        canonical_name="Django",
        aliases=["django framework"],
        parent_skills=["python", "backend development"],
        child_skills=["django rest framework", "django orm"],
        related_skills=["flask", "fastapi"],
        category="programming"
    ),
    "fastapi": SkillRelationship(
        canonical_name="FastAPI",
        aliases=["fast api"],
        parent_skills=["python", "backend development"],
        child_skills=[],
        related_skills=["flask", "django", "rest apis"],
        category="programming"
    ),
}


class SkillTaxonomyService:
    """
    Service for skill relationship resolution.

    Used by matching service to expand skill matches:
    1. Direct match: user has exact skill
    2. Implied match: user has child skills that imply parent
    3. Equivalent match: user has alias of required skill
    4. Parent coverage: user has parent skill (broader knowledge)
    """

    def __init__(self):
        self._taxonomy = SKILL_TAXONOMY
        self._alias_map = self._build_alias_map()
        logger.info(f"SkillTaxonomyService initialized with {len(self._taxonomy)} skill definitions")

    def _build_alias_map(self) -> Dict[str, str]:
        """Build reverse lookup from alias to canonical name."""
        alias_map = {}
        for canonical, rel in self._taxonomy.items():
            alias_map[canonical] = canonical
            for alias in rel.aliases:
                alias_map[alias.lower()] = canonical
        return alias_map

    def normalize_skill(self, skill: str) -> str:
        """Normalize skill name to canonical form."""
        if not skill:
            return ""
        skill_lower = skill.lower().strip()
        return self._alias_map.get(skill_lower, skill_lower)

    def get_implied_skills(self, user_skills: List[str]) -> Set[str]:
        """
        Given a list of user skills, return additional skills they implicitly have.

        Example: User has ["Microsoft Word", "Microsoft Excel", "Microsoft PowerPoint"]
                 Returns: {"microsoft office"} (they have all children of Office)
        """
        if not user_skills:
            return set()

        normalized = {self.normalize_skill(s) for s in user_skills}
        implied = set()

        for canonical, rel in self._taxonomy.items():
            # If user has ALL child skills (or at least 2), they get credit for parent
            if rel.child_skills and len(rel.child_skills) >= 2:
                child_set = {self.normalize_skill(c) for c in rel.child_skills}
                # Require at least 2 child skills to imply parent (not just one)
                matching_children = normalized & child_set
                if len(matching_children) >= 2:
                    implied.add(canonical)
                    logger.debug(f"Implied skill '{canonical}' from children: {matching_children}")

        return implied

    def get_parent_skills(self, skill: str) -> List[str]:
        """Get parent skills that this skill implies."""
        normalized = self.normalize_skill(skill)
        if normalized in self._taxonomy:
            return self._taxonomy[normalized].parent_skills
        return []

    def expand_user_skills(self, user_skills: List[str]) -> Set[str]:
        """
        Expand user skills to include implied skills.

        Returns the union of:
        - Original skills (normalized)
        - Skills implied by having multiple children
        - Parent skills (user knows specific, so knows general)
        """
        if not user_skills:
            return set()

        normalized = {self.normalize_skill(s) for s in user_skills}

        # Add implied skills (from having multiple children)
        implied = self.get_implied_skills(user_skills)

        # Add parent skills (if you know React, you know JavaScript)
        parents = set()
        for skill in user_skills:
            for parent in self.get_parent_skills(skill):
                parent_normalized = self.normalize_skill(parent)
                if parent_normalized:
                    parents.add(parent_normalized)

        expanded = normalized | implied | parents
        if len(expanded) > len(normalized):
            logger.debug(f"Expanded {len(normalized)} skills to {len(expanded)} with taxonomy")

        return expanded

    def calculate_skill_coverage(
        self,
        user_skills: List[str],
        required_skill: str
    ) -> float:
        """
        Calculate how well user skills cover a required skill.

        Returns:
        - 1.0: Direct match or alias match
        - 0.85: User has enough child skills to imply this skill
        - 0.80: User has parent skill (knows the broader area)
        - 0.70: User has related skill
        - 0.0: No match
        """
        if not user_skills or not required_skill:
            return 0.0

        user_expanded = self.expand_user_skills(user_skills)
        required_normalized = self.normalize_skill(required_skill)

        # Direct match (including aliases)
        if required_normalized in user_expanded:
            return 1.0

        # Check if user has the required skill via child skills
        if required_normalized in self._taxonomy:
            required_rel = self._taxonomy[required_normalized]

            # Check if user has enough children to imply this skill
            if required_rel.child_skills:
                child_set = {self.normalize_skill(c) for c in required_rel.child_skills}
                matching = user_expanded & child_set
                if len(matching) >= 2:
                    return 0.85  # Has enough specifics to imply general
                elif len(matching) == 1:
                    return 0.6  # Has one related child skill

        # Check if user has parent of required skill (broader knowledge)
        if required_normalized in self._taxonomy:
            required_rel = self._taxonomy[required_normalized]
            for parent in required_rel.parent_skills:
                parent_normalized = self.normalize_skill(parent)
                if parent_normalized in user_expanded:
                    return 0.80  # Has broader skill

        # Check for related skills
        if required_normalized in self._taxonomy:
            required_rel = self._taxonomy[required_normalized]
            related_set = {self.normalize_skill(r) for r in required_rel.related_skills}
            matching_related = user_expanded & related_set
            if matching_related:
                return 0.70  # Has related skill

        return 0.0

    def get_skill_info(self, skill: str) -> Optional[SkillRelationship]:
        """Get full skill relationship info if available."""
        normalized = self.normalize_skill(skill)
        return self._taxonomy.get(normalized)

    def get_related_skills(self, skill: str) -> List[str]:
        """Get skills related to the given skill."""
        normalized = self.normalize_skill(skill)
        if normalized in self._taxonomy:
            return self._taxonomy[normalized].related_skills
        return []


# Singleton instance
_taxonomy_service: Optional[SkillTaxonomyService] = None


def get_taxonomy_service() -> SkillTaxonomyService:
    """Get or create the taxonomy service singleton."""
    global _taxonomy_service
    if _taxonomy_service is None:
        _taxonomy_service = SkillTaxonomyService()
    return _taxonomy_service
