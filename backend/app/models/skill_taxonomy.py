"""
Skill Taxonomy database model.

Stores canonical skill names with their aliases for normalization.
"""

from sqlalchemy import Column, Integer, String, JSON, DateTime, Index
from sqlalchemy.sql import func

from app.models.base import Base


class SkillTaxonomy(Base):
    """
    Skill taxonomy table for skill normalization.

    Stores canonical skill names with aliases for converting
    variations like "Javascript", "JS", "ECMAScript" → "JavaScript"
    """

    __tablename__ = "skill_taxonomy"

    id = Column(Integer, primary_key=True, index=True)
    canonical_name = Column(String(255), unique=True, nullable=False, index=True)
    category = Column(String(50), nullable=False, index=True)  # technical, soft, domain, certification
    aliases = Column(JSON, default=list)  # ["Javascript", "JS", "ECMAScript"]
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Create index for faster alias lookups (using GIN for JSON)
    __table_args__ = (
        Index('idx_skill_taxonomy_category', 'category'),
    )

    def __repr__(self):
        return f"<SkillTaxonomy(canonical_name='{self.canonical_name}', category='{self.category}')>"

    def matches(self, skill_name: str) -> bool:
        """
        Check if a skill name matches this taxonomy entry.

        Args:
            skill_name: Skill name to check

        Returns:
            True if skill_name matches canonical name or any alias
        """
        skill_lower = skill_name.lower().strip()

        # Check canonical name
        if self.canonical_name.lower() == skill_lower:
            return True

        # Check aliases
        if self.aliases:
            for alias in self.aliases:
                if alias.lower() == skill_lower:
                    return True

        return False


# ============================================
# Seed Data
# ============================================

SEED_SKILLS = [
    # Technical Skills - Programming Languages
    {"canonical_name": "Python", "category": "technical", "aliases": ["python", "Python3", "py", "python3"]},
    {"canonical_name": "JavaScript", "category": "technical", "aliases": ["Javascript", "JS", "js", "ECMAScript", "ES6", "ES2015"]},
    {"canonical_name": "TypeScript", "category": "technical", "aliases": ["Typescript", "TS", "ts"]},
    {"canonical_name": "Java", "category": "technical", "aliases": ["java", "J2EE", "JEE"]},
    {"canonical_name": "C#", "category": "technical", "aliases": ["C Sharp", "CSharp", "csharp", ".NET C#"]},
    {"canonical_name": "C++", "category": "technical", "aliases": ["CPP", "cpp", "C Plus Plus"]},
    {"canonical_name": "C", "category": "technical", "aliases": ["c programming", "ANSI C"]},
    {"canonical_name": "Go", "category": "technical", "aliases": ["Golang", "golang", "go"]},
    {"canonical_name": "Rust", "category": "technical", "aliases": ["rust", "Rust Lang"]},
    {"canonical_name": "Ruby", "category": "technical", "aliases": ["ruby", "Ruby on Rails"]},
    {"canonical_name": "PHP", "category": "technical", "aliases": ["php", "PHP7", "PHP8"]},
    {"canonical_name": "Swift", "category": "technical", "aliases": ["swift", "iOS Swift"]},
    {"canonical_name": "Kotlin", "category": "technical", "aliases": ["kotlin", "Android Kotlin"]},
    {"canonical_name": "Scala", "category": "technical", "aliases": ["scala"]},
    {"canonical_name": "R", "category": "technical", "aliases": ["R Programming", "R Language", "rstats"]},
    {"canonical_name": "MATLAB", "category": "technical", "aliases": ["Matlab", "matlab"]},
    {"canonical_name": "Perl", "category": "technical", "aliases": ["perl"]},
    {"canonical_name": "Shell Scripting", "category": "technical", "aliases": ["Bash", "bash", "Shell", "shell", "Zsh", "PowerShell"]},

    # Technical Skills - Web Frameworks
    {"canonical_name": "React", "category": "technical", "aliases": ["ReactJS", "React.js", "react", "React Native"]},
    {"canonical_name": "Angular", "category": "technical", "aliases": ["AngularJS", "Angular.js", "angular", "Angular 2+"]},
    {"canonical_name": "Vue.js", "category": "technical", "aliases": ["Vue", "VueJS", "vue", "vuejs"]},
    {"canonical_name": "Node.js", "category": "technical", "aliases": ["NodeJS", "Node", "node", "nodejs"]},
    {"canonical_name": "Express.js", "category": "technical", "aliases": ["Express", "ExpressJS", "express"]},
    {"canonical_name": "Django", "category": "technical", "aliases": ["django", "Django REST"]},
    {"canonical_name": "Flask", "category": "technical", "aliases": ["flask"]},
    {"canonical_name": "FastAPI", "category": "technical", "aliases": ["fastapi", "Fast API"]},
    {"canonical_name": "Spring Boot", "category": "technical", "aliases": ["Spring", "SpringBoot", "spring boot", "Spring Framework"]},
    {"canonical_name": "Ruby on Rails", "category": "technical", "aliases": ["Rails", "RoR", "rails"]},
    {"canonical_name": "ASP.NET", "category": "technical", "aliases": ["ASP.NET Core", ".NET Core", "dotnet", ".NET"]},
    {"canonical_name": "Laravel", "category": "technical", "aliases": ["laravel"]},
    {"canonical_name": "Next.js", "category": "technical", "aliases": ["NextJS", "Nextjs", "next.js"]},
    {"canonical_name": "Svelte", "category": "technical", "aliases": ["svelte", "SvelteKit"]},

    # Technical Skills - Databases
    {"canonical_name": "SQL", "category": "technical", "aliases": ["sql", "Structured Query Language"]},
    {"canonical_name": "PostgreSQL", "category": "technical", "aliases": ["Postgres", "postgres", "psql", "PG"]},
    {"canonical_name": "MySQL", "category": "technical", "aliases": ["mysql", "MariaDB"]},
    {"canonical_name": "MongoDB", "category": "technical", "aliases": ["Mongo", "mongo", "mongodb"]},
    {"canonical_name": "Redis", "category": "technical", "aliases": ["redis"]},
    {"canonical_name": "Elasticsearch", "category": "technical", "aliases": ["ElasticSearch", "ES", "ELK"]},
    {"canonical_name": "Oracle Database", "category": "technical", "aliases": ["Oracle", "Oracle DB", "OracleDB"]},
    {"canonical_name": "Microsoft SQL Server", "category": "technical", "aliases": ["MSSQL", "SQL Server", "MS SQL"]},
    {"canonical_name": "DynamoDB", "category": "technical", "aliases": ["AWS DynamoDB", "dynamodb"]},
    {"canonical_name": "Cassandra", "category": "technical", "aliases": ["Apache Cassandra", "cassandra"]},
    {"canonical_name": "Neo4j", "category": "technical", "aliases": ["neo4j", "Graph Database"]},

    # Technical Skills - Cloud & DevOps
    {"canonical_name": "AWS", "category": "technical", "aliases": ["Amazon Web Services", "aws", "Amazon AWS"]},
    {"canonical_name": "Azure", "category": "technical", "aliases": ["Microsoft Azure", "azure", "Azure Cloud"]},
    {"canonical_name": "Google Cloud Platform", "category": "technical", "aliases": ["GCP", "gcp", "Google Cloud"]},
    {"canonical_name": "Docker", "category": "technical", "aliases": ["docker", "Containers", "containerization"]},
    {"canonical_name": "Kubernetes", "category": "technical", "aliases": ["K8s", "k8s", "kubernetes"]},
    {"canonical_name": "Terraform", "category": "technical", "aliases": ["terraform", "TF", "Infrastructure as Code"]},
    {"canonical_name": "Ansible", "category": "technical", "aliases": ["ansible"]},
    {"canonical_name": "Jenkins", "category": "technical", "aliases": ["jenkins", "CI/CD"]},
    {"canonical_name": "GitHub Actions", "category": "technical", "aliases": ["Github Actions", "GH Actions"]},
    {"canonical_name": "GitLab CI", "category": "technical", "aliases": ["Gitlab CI", "GitLab CI/CD"]},
    {"canonical_name": "CircleCI", "category": "technical", "aliases": ["Circle CI", "circleci"]},
    {"canonical_name": "Linux", "category": "technical", "aliases": ["linux", "Unix", "UNIX", "Ubuntu", "CentOS", "RedHat"]},
    {"canonical_name": "Nginx", "category": "technical", "aliases": ["nginx", "NGINX"]},
    {"canonical_name": "Apache", "category": "technical", "aliases": ["Apache HTTP", "apache", "httpd"]},

    # Technical Skills - Data & ML
    {"canonical_name": "Machine Learning", "category": "technical", "aliases": ["ML", "ml", "machine learning"]},
    {"canonical_name": "Deep Learning", "category": "technical", "aliases": ["DL", "deep learning", "Neural Networks"]},
    {"canonical_name": "TensorFlow", "category": "technical", "aliases": ["Tensorflow", "tensorflow", "TF"]},
    {"canonical_name": "PyTorch", "category": "technical", "aliases": ["Pytorch", "pytorch", "torch"]},
    {"canonical_name": "Scikit-learn", "category": "technical", "aliases": ["sklearn", "scikit learn", "Sklearn"]},
    {"canonical_name": "Pandas", "category": "technical", "aliases": ["pandas"]},
    {"canonical_name": "NumPy", "category": "technical", "aliases": ["Numpy", "numpy"]},
    {"canonical_name": "Apache Spark", "category": "technical", "aliases": ["Spark", "PySpark", "spark"]},
    {"canonical_name": "Hadoop", "category": "technical", "aliases": ["hadoop", "HDFS", "MapReduce"]},
    {"canonical_name": "Tableau", "category": "technical", "aliases": ["tableau"]},
    {"canonical_name": "Power BI", "category": "technical", "aliases": ["PowerBI", "power bi", "Microsoft Power BI"]},
    {"canonical_name": "Data Analysis", "category": "technical", "aliases": ["Data Analytics", "data analysis", "Analytics"]},
    {"canonical_name": "Natural Language Processing", "category": "technical", "aliases": ["NLP", "nlp", "Text Mining"]},
    {"canonical_name": "Computer Vision", "category": "technical", "aliases": ["CV", "Image Processing", "computer vision"]},
    {"canonical_name": "LLM Development", "category": "technical", "aliases": ["LLM", "LLM integration", "langchain", "LangChain", "large language models", "GPT integration", "prompt engineering", "RAG"]},

    # Technical Skills - Tools & Version Control
    {"canonical_name": "Git", "category": "technical", "aliases": ["git", "Version Control", "GitHub", "GitLab", "Bitbucket"]},
    {"canonical_name": "Jira", "category": "technical", "aliases": ["jira", "JIRA"]},
    {"canonical_name": "Confluence", "category": "technical", "aliases": ["confluence"]},
    {"canonical_name": "Figma", "category": "technical", "aliases": ["figma"]},
    {"canonical_name": "VS Code", "category": "technical", "aliases": ["Visual Studio Code", "VSCode", "vscode"]},
    {"canonical_name": "IntelliJ IDEA", "category": "technical", "aliases": ["IntelliJ", "intellij", "IDEA"]},

    # Technical Skills - APIs & Protocols
    {"canonical_name": "REST API", "category": "technical", "aliases": ["REST", "RESTful", "RESTful API", "rest api", "API Development", "Web APIs"]},
    {"canonical_name": "GraphQL", "category": "technical", "aliases": ["graphql", "Graph QL"]},
    {"canonical_name": "gRPC", "category": "technical", "aliases": ["grpc", "GRPC"]},
    {"canonical_name": "WebSocket", "category": "technical", "aliases": ["WebSockets", "websocket", "WS"]},
    {"canonical_name": "OAuth", "category": "technical", "aliases": ["OAuth2", "OAuth 2.0", "oauth"]},

    # Technical Skills - Testing
    {"canonical_name": "Unit Testing", "category": "technical", "aliases": ["unit tests", "Unit Tests"]},
    {"canonical_name": "Jest", "category": "technical", "aliases": ["jest"]},
    {"canonical_name": "Pytest", "category": "technical", "aliases": ["pytest", "py.test"]},
    {"canonical_name": "Selenium", "category": "technical", "aliases": ["selenium", "Selenium WebDriver"]},
    {"canonical_name": "Cypress", "category": "technical", "aliases": ["cypress"]},
    {"canonical_name": "JUnit", "category": "technical", "aliases": ["junit", "JUnit5"]},

    # Soft Skills
    {"canonical_name": "Leadership", "category": "soft", "aliases": ["leadership", "Team Leadership", "Leading Teams", "Team Lead", "mentoring", "coaching", "people management"]},
    {"canonical_name": "Communication", "category": "soft", "aliases": ["communication", "Communication Skills", "Verbal Communication", "Written Communication", "client engagement", "cross-functional collaboration", "stakeholder engagement"]},
    {"canonical_name": "Problem Solving", "category": "soft", "aliases": ["Problem-Solving", "problem solving", "Analytical Thinking"]},
    {"canonical_name": "Teamwork", "category": "soft", "aliases": ["teamwork", "Team Player", "Collaboration", "Team Collaboration"]},
    {"canonical_name": "Time Management", "category": "soft", "aliases": ["time management", "Time-Management", "Prioritization"]},
    {"canonical_name": "Critical Thinking", "category": "soft", "aliases": ["critical thinking", "Analytical Skills"]},
    {"canonical_name": "Adaptability", "category": "soft", "aliases": ["adaptability", "Flexibility", "Adaptable"]},
    {"canonical_name": "Creativity", "category": "soft", "aliases": ["creativity", "Creative Thinking", "Innovation"]},
    {"canonical_name": "Attention to Detail", "category": "soft", "aliases": ["attention to detail", "Detail-Oriented", "Detail Oriented"]},
    {"canonical_name": "Presentation Skills", "category": "soft", "aliases": ["presentation skills", "Public Speaking", "Presentations"]},
    {"canonical_name": "Negotiation", "category": "soft", "aliases": ["negotiation", "Negotiation Skills"]},
    {"canonical_name": "Conflict Resolution", "category": "soft", "aliases": ["conflict resolution", "Conflict Management"]},
    {"canonical_name": "Mentoring", "category": "soft", "aliases": ["mentoring", "Coaching", "Training"]},
    {"canonical_name": "Decision Making", "category": "soft", "aliases": ["decision making", "Decision-Making"]},

    # Domain Skills
    {"canonical_name": "Agile", "category": "domain", "aliases": ["agile", "Agile Methodology", "Agile Development", "Agile/Scrum"]},
    {"canonical_name": "Scrum", "category": "domain", "aliases": ["scrum", "Scrum Master", "Scrum Framework"]},
    {"canonical_name": "Project Management", "category": "domain", "aliases": ["project management", "PM", "Project Manager", "vendor management", "stakeholder management", "program management"]},
    {"canonical_name": "Product Management", "category": "domain", "aliases": ["product management", "Product Manager", "Product Owner"]},
    {"canonical_name": "Business Analysis", "category": "domain", "aliases": ["business analysis", "BA", "Business Analyst"]},
    {"canonical_name": "Financial Analysis", "category": "domain", "aliases": ["financial analysis", "Finance", "Financial Modeling"]},
    {"canonical_name": "Data Science", "category": "domain", "aliases": ["data science", "Data Scientist"]},
    {"canonical_name": "UX Design", "category": "domain", "aliases": ["UX", "User Experience", "UX/UI", "User Experience Design"]},
    {"canonical_name": "UI Design", "category": "domain", "aliases": ["UI", "User Interface", "User Interface Design"]},
    {"canonical_name": "DevOps", "category": "domain", "aliases": ["devops", "Dev Ops", "DevSecOps"]},
    {"canonical_name": "System Design", "category": "domain", "aliases": ["system design", "Architecture Design", "Software Architecture"]},
    {"canonical_name": "Technical Writing", "category": "domain", "aliases": ["technical writing", "Documentation"]},
    {"canonical_name": "Quality Assurance", "category": "domain", "aliases": ["QA", "qa", "Quality Control", "Testing"]},
    {"canonical_name": "Security", "category": "domain", "aliases": ["Cybersecurity", "Information Security", "InfoSec", "Application Security"]},
    {"canonical_name": "Networking", "category": "domain", "aliases": ["networking", "Network Engineering", "TCP/IP"]},
    {"canonical_name": "Sales", "category": "domain", "aliases": ["sales", "B2B Sales", "B2C Sales"]},
    {"canonical_name": "Marketing", "category": "domain", "aliases": ["marketing", "Digital Marketing", "Content Marketing"]},
    {"canonical_name": "SEO", "category": "domain", "aliases": ["seo", "Search Engine Optimization"]},
    {"canonical_name": "Customer Service", "category": "domain", "aliases": ["customer service", "Customer Support", "Client Relations"]},
    {"canonical_name": "Human Resources", "category": "domain", "aliases": ["HR", "hr", "Human Resource Management"]},
    {"canonical_name": "Accounting", "category": "domain", "aliases": ["accounting", "Bookkeeping", "Financial Accounting"]},
    {"canonical_name": "Tax", "category": "domain", "aliases": ["Tax Planning", "Tax Law", "Taxation"]},
    {"canonical_name": "Audit", "category": "domain", "aliases": ["Auditing", "Internal Audit", "External Audit"]},
    {"canonical_name": "Risk Management", "category": "domain", "aliases": ["risk management", "Risk Analysis", "Risk Assessment"]},
    {"canonical_name": "Compliance", "category": "domain", "aliases": ["compliance", "Regulatory Compliance"]},

    # Certifications
    {"canonical_name": "AWS Certified Solutions Architect", "category": "certification", "aliases": ["AWS Solutions Architect", "AWS SA", "AWS Certified"]},
    {"canonical_name": "AWS Certified Developer", "category": "certification", "aliases": ["AWS Developer"]},
    {"canonical_name": "Azure Certified", "category": "certification", "aliases": ["Microsoft Certified Azure", "Azure Administrator"]},
    {"canonical_name": "Google Cloud Certified", "category": "certification", "aliases": ["GCP Certified", "Google Cloud Professional"]},
    {"canonical_name": "PMP", "category": "certification", "aliases": ["Project Management Professional", "pmp", "PMP Certified"]},
    {"canonical_name": "Scrum Master Certified", "category": "certification", "aliases": ["CSM", "Certified Scrum Master", "PSM"]},
    {"canonical_name": "CPA", "category": "certification", "aliases": ["Certified Public Accountant", "cpa"]},
    {"canonical_name": "CFA", "category": "certification", "aliases": ["Chartered Financial Analyst", "cfa"]},
    {"canonical_name": "CISSP", "category": "certification", "aliases": ["Certified Information Systems Security Professional"]},
    {"canonical_name": "CompTIA Security+", "category": "certification", "aliases": ["Security+", "CompTIA Sec+"]},
    {"canonical_name": "CompTIA Network+", "category": "certification", "aliases": ["Network+", "CompTIA Net+"]},
    {"canonical_name": "Cisco CCNA", "category": "certification", "aliases": ["CCNA", "Cisco Certified Network Associate"]},
    {"canonical_name": "Cisco CCNP", "category": "certification", "aliases": ["CCNP", "Cisco Certified Network Professional"]},
    {"canonical_name": "Kubernetes Administrator", "category": "certification", "aliases": ["CKA", "Certified Kubernetes Administrator"]},
    {"canonical_name": "Docker Certified Associate", "category": "certification", "aliases": ["DCA", "Docker Certified"]},
    {"canonical_name": "HashiCorp Terraform Associate", "category": "certification", "aliases": ["Terraform Certified"]},
    {"canonical_name": "Six Sigma", "category": "certification", "aliases": ["Six Sigma Green Belt", "Six Sigma Black Belt", "Lean Six Sigma"]},
    {"canonical_name": "ITIL", "category": "certification", "aliases": ["ITIL Foundation", "ITIL Certified", "ITIL v4"]},
]


def get_seed_skills() -> list:
    """Return the list of seed skills for database initialization."""
    return SEED_SKILLS
