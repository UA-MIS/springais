"""
Role Templates for SpringAIS Synthetic Data Generation

This module defines deterministic templates for all 25 roles across 3 service lines:
- Assurance: 5 roles (Staff → Partner)
- Tax: 5 roles (Staff → Partner)
- Consulting: 9 roles (Analyst → Partner)

Each template includes:
- Core skills (required, 95%+ of employees have these)
- Common skills (optional, 60-80% have 2-4 of these)
- Experience ranges (years)
- Performance metric ranges
- Focus areas (30% of employees get specialization)
- Distribution target (employee count)

Usage:
    from role_templates import ROLE_TEMPLATES, get_all_roles, get_role_template
    
    template = get_role_template("Assurance", "Senior")
    all_roles = get_all_roles()
"""

from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional
from enum import Enum


class ServiceLine(Enum):
    ASSURANCE = "Assurance"
    TAX = "Tax"
    CONSULTING = "Consulting"


@dataclass
class PerformanceRanges:
    """Performance metric ranges for a role level."""
    utilization: Tuple[int, int]  # % (e.g., 70-85)
    billing_rate: Tuple[int, int]  # $/hr (e.g., 100-150)
    realization: Tuple[int, int]  # % (e.g., 85-95)
    quality_score: Tuple[float, float]  # 1-5 scale (e.g., 3.5-4.2)
    training_hours: Tuple[int, int]  # per year (e.g., 30-50)
    client_feedback: Tuple[float, float]  # 1-5 scale (e.g., 3.8-4.5)
    
    def to_dict(self) -> Dict:
        return {
            "utilization": list(self.utilization),
            "billing_rate": list(self.billing_rate),
            "realization": list(self.realization),
            "quality_score": list(self.quality_score),
            "training_hours": list(self.training_hours),
            "client_feedback": list(self.client_feedback),
        }


@dataclass
class RoleTemplate:
    """Template defining a role's characteristics for synthetic data generation."""
    role_name: str
    service_line: str
    level: int  # 1=entry, higher=senior
    core_skills: List[str]  # Required skills (95%+ have these)
    common_skills: List[str]  # Optional skills (60-80% have 2-4)
    experience_range: Tuple[float, float]  # Years (min, max)
    performance_ranges: PerformanceRanges
    focus_areas: List[str]  # Specialization options (30% get one)
    focus_area_skills: Dict[str, List[str]]  # Additional skills per focus area
    count: int  # Distribution target
    
    def to_dict(self) -> Dict:
        return {
            "role_name": self.role_name,
            "service_line": self.service_line,
            "level": self.level,
            "core_skills": self.core_skills,
            "common_skills": self.common_skills,
            "experience_range": list(self.experience_range),
            "performance_ranges": self.performance_ranges.to_dict(),
            "focus_areas": self.focus_areas,
            "focus_area_skills": self.focus_area_skills,
            "count": self.count,
        }


# =============================================================================
# ASSURANCE SERVICE LINE (300 employees, 5 roles)
# Career path: Staff → Senior → Manager → Senior Manager → Partner
# =============================================================================

ASSURANCE_FOCUS_AREAS = ["Audit", "Financial Reporting", "Risk & Compliance", "SEC Reporting"]

ASSURANCE_FOCUS_AREA_SKILLS = {
    "Audit": ["SOX Compliance", "Audit Documentation", "Testing Procedures", "Sampling Methodology", "Audit Analytics"],
    "Financial Reporting": ["SEC Reporting", "10-K/10-Q Preparation", "IFRS", "Financial Statement Analysis", "Disclosure Requirements"],
    "Risk & Compliance": ["Internal Audit", "Risk Assessment", "Compliance Testing", "Control Design", "Risk Frameworks"],
    "SEC Reporting": ["XBRL", "Regulatory Filings", "Disclosure Controls", "MD&A Analysis", "SEC Comment Letters"],
}

ASSURANCE_TEMPLATES = {
    "Staff": RoleTemplate(
        role_name="Staff",
        service_line="Assurance",
        level=1,
        core_skills=["Accounting", "Audit", "GAAP", "Excel", "Attention to Detail"],
        common_skills=["Financial Reporting", "Internal Controls", "Financial Analysis", 
                      "Communication", "Time Management", "Teamwork"],
        experience_range=(0.0, 2.0),
        performance_ranges=PerformanceRanges(
            utilization=(70, 85),
            billing_rate=(80, 120),
            realization=(82, 92),
            quality_score=(3.4, 4.0),
            training_hours=(40, 60),
            client_feedback=(3.5, 4.2),
        ),
        focus_areas=ASSURANCE_FOCUS_AREAS,
        focus_area_skills=ASSURANCE_FOCUS_AREA_SKILLS,
        count=90,  # 30% of 300
    ),
    "Senior": RoleTemplate(
        role_name="Senior",
        service_line="Assurance",
        level=2,
        core_skills=["Accounting", "Audit", "GAAP", "Financial Reporting", "Internal Controls", "Excel"],
        common_skills=["SOX Compliance", "Analytical Skills", "Client Relations", 
                      "Problem Solving", "Technical Writing", "Supervision"],
        experience_range=(2.0, 4.0),
        performance_ranges=PerformanceRanges(
            utilization=(75, 88),
            billing_rate=(120, 170),
            realization=(85, 94),
            quality_score=(3.7, 4.3),
            training_hours=(35, 55),
            client_feedback=(3.8, 4.5),
        ),
        focus_areas=ASSURANCE_FOCUS_AREAS,
        focus_area_skills=ASSURANCE_FOCUS_AREA_SKILLS,
        count=75,  # 25% of 300
    ),
    "Manager": RoleTemplate(
        role_name="Manager",
        service_line="Assurance",
        level=3,
        core_skills=["Accounting", "Audit", "GAAP", "Financial Reporting", "Internal Controls",
                    "Risk Assessment", "Client Management", "Project Management"],
        common_skills=["SOX Compliance", "Staff Development", "Business Development",
                      "Strategic Thinking", "Presentation Skills", "IFRS"],
        experience_range=(4.0, 7.0),
        performance_ranges=PerformanceRanges(
            utilization=(72, 85),
            billing_rate=(170, 230),
            realization=(88, 96),
            quality_score=(4.0, 4.5),
            training_hours=(30, 50),
            client_feedback=(4.0, 4.6),
        ),
        focus_areas=ASSURANCE_FOCUS_AREAS,
        focus_area_skills=ASSURANCE_FOCUS_AREA_SKILLS,
        count=60,  # 20% of 300
    ),
    "Senior Manager": RoleTemplate(
        role_name="Senior Manager",
        service_line="Assurance",
        level=4,
        core_skills=["Accounting", "Audit", "GAAP", "Financial Reporting", "Internal Controls",
                    "Risk Assessment", "Client Management", "Project Management", "Business Development"],
        common_skills=["Strategic Planning", "Team Leadership", "Executive Communication",
                      "Industry Expertise", "Quality Review", "Regulatory Relations"],
        experience_range=(7.0, 12.0),
        performance_ranges=PerformanceRanges(
            utilization=(68, 82),
            billing_rate=(230, 320),
            realization=(90, 97),
            quality_score=(4.2, 4.7),
            training_hours=(25, 45),
            client_feedback=(4.2, 4.8),
        ),
        focus_areas=ASSURANCE_FOCUS_AREAS,
        focus_area_skills=ASSURANCE_FOCUS_AREA_SKILLS,
        count=45,  # 15% of 300
    ),
    "Partner": RoleTemplate(
        role_name="Partner",
        service_line="Assurance",
        level=5,
        core_skills=["Accounting", "Audit", "GAAP", "Financial Reporting", "Risk Assessment",
                    "Client Management", "Business Development", "Strategic Leadership", "Executive Presence"],
        common_skills=["Board Relations", "M&A Advisory", "Thought Leadership",
                      "Firm Leadership", "Industry Specialization", "Regulatory Influence"],
        experience_range=(12.0, 25.0),
        performance_ranges=PerformanceRanges(
            utilization=(55, 75),
            billing_rate=(350, 500),
            realization=(92, 99),
            quality_score=(4.4, 4.9),
            training_hours=(20, 40),
            client_feedback=(4.4, 4.9),
        ),
        focus_areas=ASSURANCE_FOCUS_AREAS,
        focus_area_skills=ASSURANCE_FOCUS_AREA_SKILLS,
        count=30,  # 10% of 300
    ),
}


# =============================================================================
# TAX SERVICE LINE (300 employees, 5 roles)
# Career path: Staff → Senior → Manager → Senior Manager → Partner
# =============================================================================

TAX_FOCUS_AREAS = ["Corporate Tax", "International Tax", "M&A Tax", "State & Local Tax"]

TAX_FOCUS_AREA_SKILLS = {
    "Corporate Tax": ["ASC 740", "Tax Provisions", "Consolidated Returns", "Tax Credits", "R&D Credits"],
    "International Tax": ["Transfer Pricing", "Foreign Tax Credits", "BEPS", "Treaty Analysis", "GILTI/FDII"],
    "M&A Tax": ["Transaction Structuring", "Tax Due Diligence", "338(h)(10)", "Tax-Free Reorganizations", "Integration Planning"],
    "State & Local Tax": ["Nexus Analysis", "Apportionment", "Tax Incentives", "Sales & Use Tax", "Property Tax"],
}

TAX_TEMPLATES = {
    "Staff": RoleTemplate(
        role_name="Staff",
        service_line="Tax",
        level=1,
        core_skills=["Tax Law", "Tax Compliance", "Tax Research", "Excel", "Attention to Detail"],
        common_skills=["Tax Software", "Communication", "Time Management", 
                      "Technical Writing", "Research Skills", "IRC Knowledge"],
        experience_range=(0.0, 2.0),
        performance_ranges=PerformanceRanges(
            utilization=(70, 85),
            billing_rate=(80, 120),
            realization=(82, 92),
            quality_score=(3.4, 4.0),
            training_hours=(40, 60),
            client_feedback=(3.5, 4.2),
        ),
        focus_areas=TAX_FOCUS_AREAS,
        focus_area_skills=TAX_FOCUS_AREA_SKILLS,
        count=90,  # 30% of 300
    ),
    "Senior": RoleTemplate(
        role_name="Senior",
        service_line="Tax",
        level=2,
        core_skills=["Tax Law", "Tax Planning", "Tax Compliance", "Tax Research", "IRC Knowledge", "Excel"],
        common_skills=["Client Communication", "Technical Writing", "Analytical Skills",
                      "Problem Solving", "Supervision", "Tax Software"],
        experience_range=(2.0, 4.0),
        performance_ranges=PerformanceRanges(
            utilization=(75, 88),
            billing_rate=(120, 170),
            realization=(85, 94),
            quality_score=(3.7, 4.3),
            training_hours=(35, 55),
            client_feedback=(3.8, 4.5),
        ),
        focus_areas=TAX_FOCUS_AREAS,
        focus_area_skills=TAX_FOCUS_AREA_SKILLS,
        count=75,  # 25% of 300
    ),
    "Manager": RoleTemplate(
        role_name="Manager",
        service_line="Tax",
        level=3,
        core_skills=["Tax Law", "Tax Planning", "Tax Compliance", "Tax Research", "IRC Knowledge",
                    "Client Management", "Project Management", "Tax Strategy"],
        common_skills=["Business Development", "Staff Development", "Presentation Skills",
                      "Industry Expertise", "Strategic Thinking", "Regulatory Relations"],
        experience_range=(4.0, 7.0),
        performance_ranges=PerformanceRanges(
            utilization=(72, 85),
            billing_rate=(170, 230),
            realization=(88, 96),
            quality_score=(4.0, 4.5),
            training_hours=(30, 50),
            client_feedback=(4.0, 4.6),
        ),
        focus_areas=TAX_FOCUS_AREAS,
        focus_area_skills=TAX_FOCUS_AREA_SKILLS,
        count=60,  # 20% of 300
    ),
    "Senior Manager": RoleTemplate(
        role_name="Senior Manager",
        service_line="Tax",
        level=4,
        core_skills=["Tax Law", "Tax Planning", "Tax Strategy", "Client Management", 
                    "Business Development", "Project Management", "Team Leadership", "IRC Expertise"],
        common_skills=["Executive Communication", "Industry Specialization", "Thought Leadership",
                      "Quality Review", "Strategic Planning", "IRS Relations"],
        experience_range=(7.0, 12.0),
        performance_ranges=PerformanceRanges(
            utilization=(68, 82),
            billing_rate=(230, 320),
            realization=(90, 97),
            quality_score=(4.2, 4.7),
            training_hours=(25, 45),
            client_feedback=(4.2, 4.8),
        ),
        focus_areas=TAX_FOCUS_AREAS,
        focus_area_skills=TAX_FOCUS_AREA_SKILLS,
        count=45,  # 15% of 300
    ),
    "Partner": RoleTemplate(
        role_name="Partner",
        service_line="Tax",
        level=5,
        core_skills=["Tax Law", "Tax Strategy", "Client Management", "Business Development",
                    "Strategic Leadership", "Executive Presence", "Industry Leadership", "Tax Policy"],
        common_skills=["Board Advisory", "Legislative Influence", "M&A Leadership",
                      "Firm Leadership", "Thought Leadership", "Regulatory Relations"],
        experience_range=(12.0, 25.0),
        performance_ranges=PerformanceRanges(
            utilization=(55, 75),
            billing_rate=(350, 500),
            realization=(92, 99),
            quality_score=(4.4, 4.9),
            training_hours=(20, 40),
            client_feedback=(4.4, 4.9),
        ),
        focus_areas=TAX_FOCUS_AREAS,
        focus_area_skills=TAX_FOCUS_AREA_SKILLS,
        count=30,  # 10% of 300
    ),
}


# =============================================================================
# CONSULTING SERVICE LINE (300 employees, 9 roles)
# Career path: Analyst → Associate → Sr Associate → Consultant →
#              Sr Consultant → Manager → Sr Manager → Director → Partner
# =============================================================================

CONSULTING_FOCUS_AREAS = [
    # Technology focus (50%)
    "Cloud & Infrastructure",
    "Data & Analytics", 
    "Cybersecurity",
    "AI & Machine Learning",
    # Business focus (50%)
    "Strategy",
    "Operations",
    "Finance Transformation",
    "M&A Advisory",
]

CONSULTING_FOCUS_AREA_SKILLS = {
    # Technology focus areas
    "Cloud & Infrastructure": ["AWS", "Azure", "GCP", "Terraform", "Kubernetes", "Docker", "DevOps", "CI/CD"],
    "Data & Analytics": ["Python", "SQL", "Tableau", "Power BI", "Data Engineering", "ETL", "Data Visualization", "Snowflake"],
    "Cybersecurity": ["Security Architecture", "NIST", "ISO 27001", "Penetration Testing", "SOC 2", "Risk Assessment", "IAM"],
    "AI & Machine Learning": ["Python", "TensorFlow", "PyTorch", "MLOps", "NLP", "Computer Vision", "LLMs", "Data Science"],
    # Business focus areas
    "Strategy": ["Strategic Planning", "Competitive Analysis", "Market Research", "Business Cases", "Corporate Strategy"],
    "Operations": ["Process Improvement", "Lean Six Sigma", "Supply Chain", "Operational Excellence", "Change Management"],
    "Finance Transformation": ["ERP Implementation", "SAP", "Oracle", "Financial Planning", "Process Automation", "Workday"],
    "M&A Advisory": ["Due Diligence", "Integration Planning", "Synergy Realization", "Carve-outs", "Post-Merger Integration"],
}

CONSULTING_TEMPLATES = {
    "Analyst": RoleTemplate(
        role_name="Analyst",
        service_line="Consulting",
        level=1,
        core_skills=["Research", "Analysis", "PowerPoint", "Excel", "Communication"],
        common_skills=["Problem Solving", "Data Analysis", "Attention to Detail",
                      "Time Management", "Teamwork", "Business Writing"],
        experience_range=(0.0, 1.5),
        performance_ranges=PerformanceRanges(
            utilization=(70, 85),
            billing_rate=(80, 110),
            realization=(80, 90),
            quality_score=(3.3, 3.9),
            training_hours=(50, 80),
            client_feedback=(3.4, 4.0),
        ),
        focus_areas=CONSULTING_FOCUS_AREAS,
        focus_area_skills=CONSULTING_FOCUS_AREA_SKILLS,
        count=45,  # 15% of 300
    ),
    "Associate": RoleTemplate(
        role_name="Associate",
        service_line="Consulting",
        level=2,
        core_skills=["Research", "Analysis", "PowerPoint", "Excel", "Communication", "Problem Solving"],
        common_skills=["Data Analysis", "Client Communication", "Project Coordination",
                      "Business Analysis", "Process Mapping", "Facilitation"],
        experience_range=(1.5, 3.0),
        performance_ranges=PerformanceRanges(
            utilization=(72, 87),
            billing_rate=(110, 145),
            realization=(82, 92),
            quality_score=(3.5, 4.1),
            training_hours=(45, 70),
            client_feedback=(3.6, 4.2),
        ),
        focus_areas=CONSULTING_FOCUS_AREAS,
        focus_area_skills=CONSULTING_FOCUS_AREA_SKILLS,
        count=42,  # 14% of 300
    ),
    "Senior Associate": RoleTemplate(
        role_name="Senior Associate",
        service_line="Consulting",
        level=3,
        core_skills=["Analysis", "PowerPoint", "Excel", "Communication", "Problem Solving", 
                    "Project Coordination", "Client Relations"],
        common_skills=["Business Analysis", "Process Improvement", "Data Analysis",
                      "Stakeholder Management", "Workshop Facilitation", "Technical Skills"],
        experience_range=(3.0, 4.5),
        performance_ranges=PerformanceRanges(
            utilization=(74, 88),
            billing_rate=(145, 180),
            realization=(84, 93),
            quality_score=(3.7, 4.3),
            training_hours=(40, 65),
            client_feedback=(3.8, 4.4),
        ),
        focus_areas=CONSULTING_FOCUS_AREAS,
        focus_area_skills=CONSULTING_FOCUS_AREA_SKILLS,
        count=39,  # 13% of 300
    ),
    "Consultant": RoleTemplate(
        role_name="Consultant",
        service_line="Consulting",
        level=4,
        core_skills=["Strategy", "Analysis", "Client Management", "Project Management",
                    "Communication", "Problem Solving", "Stakeholder Management"],
        common_skills=["Business Development Support", "Team Leadership", "Subject Matter Expertise",
                      "Process Design", "Change Management", "Executive Communication"],
        experience_range=(4.5, 6.0),
        performance_ranges=PerformanceRanges(
            utilization=(73, 86),
            billing_rate=(180, 220),
            realization=(86, 94),
            quality_score=(3.9, 4.4),
            training_hours=(35, 60),
            client_feedback=(4.0, 4.5),
        ),
        focus_areas=CONSULTING_FOCUS_AREAS,
        focus_area_skills=CONSULTING_FOCUS_AREA_SKILLS,
        count=36,  # 12% of 300
    ),
    "Senior Consultant": RoleTemplate(
        role_name="Senior Consultant",
        service_line="Consulting",
        level=5,
        core_skills=["Strategy", "Client Management", "Project Management", "Team Leadership",
                    "Stakeholder Management", "Business Development", "Subject Matter Expertise"],
        common_skills=["Executive Communication", "Change Management", "Industry Expertise",
                      "Proposal Development", "Quality Assurance", "Coaching"],
        experience_range=(6.0, 8.0),
        performance_ranges=PerformanceRanges(
            utilization=(72, 85),
            billing_rate=(220, 270),
            realization=(88, 95),
            quality_score=(4.1, 4.5),
            training_hours=(30, 55),
            client_feedback=(4.1, 4.6),
        ),
        focus_areas=CONSULTING_FOCUS_AREAS,
        focus_area_skills=CONSULTING_FOCUS_AREA_SKILLS,
        count=33,  # 11% of 300
    ),
    "Manager": RoleTemplate(
        role_name="Manager",
        service_line="Consulting",
        level=6,
        core_skills=["Strategy", "Client Management", "Project Management", "Team Leadership",
                    "Business Development", "Stakeholder Management", "P&L Management"],
        common_skills=["Executive Presence", "Industry Thought Leadership", "Proposal Leadership",
                      "Staff Development", "Quality Review", "Risk Management"],
        experience_range=(8.0, 11.0),
        performance_ranges=PerformanceRanges(
            utilization=(70, 83),
            billing_rate=(270, 340),
            realization=(90, 96),
            quality_score=(4.2, 4.6),
            training_hours=(25, 50),
            client_feedback=(4.2, 4.7),
        ),
        focus_areas=CONSULTING_FOCUS_AREAS,
        focus_area_skills=CONSULTING_FOCUS_AREA_SKILLS,
        count=30,  # 10% of 300
    ),
    "Senior Manager": RoleTemplate(
        role_name="Senior Manager",
        service_line="Consulting",
        level=7,
        core_skills=["Strategy", "Client Management", "Business Development", "Team Leadership",
                    "P&L Management", "Strategic Planning", "Executive Presence", "Industry Leadership"],
        common_skills=["C-Suite Relationships", "Thought Leadership", "Firm Leadership",
                      "Account Management", "Partnership Development", "Talent Strategy"],
        experience_range=(11.0, 15.0),
        performance_ranges=PerformanceRanges(
            utilization=(65, 80),
            billing_rate=(340, 420),
            realization=(91, 97),
            quality_score=(4.3, 4.7),
            training_hours=(20, 45),
            client_feedback=(4.3, 4.8),
        ),
        focus_areas=CONSULTING_FOCUS_AREAS,
        focus_area_skills=CONSULTING_FOCUS_AREA_SKILLS,
        count=27,  # 9% of 300
    ),
    "Director": RoleTemplate(
        role_name="Director",
        service_line="Consulting",
        level=8,
        core_skills=["Strategy", "Client Management", "Business Development", "Strategic Leadership",
                    "P&L Management", "Executive Presence", "Industry Leadership", "C-Suite Advisory"],
        common_skills=["Board Relations", "Thought Leadership", "Firm Strategy",
                      "Innovation Leadership", "Alliance Building", "Market Development"],
        experience_range=(15.0, 20.0),
        performance_ranges=PerformanceRanges(
            utilization=(55, 75),
            billing_rate=(420, 500),
            realization=(92, 98),
            quality_score=(4.4, 4.8),
            training_hours=(15, 40),
            client_feedback=(4.4, 4.8),
        ),
        focus_areas=CONSULTING_FOCUS_AREAS,
        focus_area_skills=CONSULTING_FOCUS_AREA_SKILLS,
        count=24,  # 8% of 300
    ),
    "Partner": RoleTemplate(
        role_name="Partner",
        service_line="Consulting",
        level=9,
        core_skills=["Strategic Leadership", "Client Management", "Business Development", 
                    "Executive Presence", "Industry Leadership", "C-Suite Advisory", "Firm Leadership"],
        common_skills=["Board Advisory", "Thought Leadership", "Industry Influence",
                      "Market Shaping", "Talent Development", "Innovation Strategy"],
        experience_range=(18.0, 30.0),
        performance_ranges=PerformanceRanges(
            utilization=(45, 70),
            billing_rate=(500, 750),
            realization=(93, 99),
            quality_score=(4.5, 4.9),
            training_hours=(10, 35),
            client_feedback=(4.5, 4.9),
        ),
        focus_areas=CONSULTING_FOCUS_AREAS,
        focus_area_skills=CONSULTING_FOCUS_AREA_SKILLS,
        count=24,  # 8% of 300
    ),
}


# =============================================================================
# COMBINED ROLE TEMPLATES
# =============================================================================

ROLE_TEMPLATES: Dict[str, Dict[str, RoleTemplate]] = {
    "Assurance": ASSURANCE_TEMPLATES,
    "Tax": TAX_TEMPLATES,
    "Consulting": CONSULTING_TEMPLATES,
}

# Role level mapping for validation (service_line -> role_name -> level)
ROLE_LEVEL_MAP: Dict[str, Dict[str, int]] = {
    service_line: {role_name: template.level for role_name, template in roles.items()}
    for service_line, roles in ROLE_TEMPLATES.items()
}

# Total employees per service line (for validation)
SERVICE_LINE_TOTALS = {
    "Assurance": 300,
    "Tax": 300,
    "Consulting": 300,
}


# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_role_template(service_line: str, role_name: str) -> Optional[RoleTemplate]:
    """Get a specific role template by service line and role name."""
    return ROLE_TEMPLATES.get(service_line, {}).get(role_name)


def get_all_roles() -> List[RoleTemplate]:
    """Get all role templates as a flat list."""
    roles = []
    for service_line_roles in ROLE_TEMPLATES.values():
        roles.extend(service_line_roles.values())
    return roles


def get_roles_by_service_line(service_line: str) -> List[RoleTemplate]:
    """Get all role templates for a specific service line."""
    return list(ROLE_TEMPLATES.get(service_line, {}).values())


def get_role_count() -> int:
    """Get total number of unique roles."""
    return sum(len(roles) for roles in ROLE_TEMPLATES.values())


def get_total_employee_count() -> int:
    """Get total number of employees to generate based on distribution targets."""
    return sum(
        template.count 
        for service_line_roles in ROLE_TEMPLATES.values() 
        for template in service_line_roles.values()
    )


def validate_distribution_targets() -> Dict[str, int]:
    """Validate that distribution targets sum to expected totals."""
    results = {}
    for service_line, roles in ROLE_TEMPLATES.items():
        total = sum(template.count for template in roles.values())
        expected = SERVICE_LINE_TOTALS[service_line]
        results[service_line] = {
            "actual": total,
            "expected": expected,
            "valid": total == expected,
        }
    return results


def get_role_progression(service_line: str) -> List[str]:
    """Get the ordered list of roles for a service line (entry to senior)."""
    roles = get_roles_by_service_line(service_line)
    return [r.role_name for r in sorted(roles, key=lambda x: x.level)]


def print_role_summary():
    """Print a summary of all roles for debugging."""
    print("\n" + "=" * 70)
    print("SPRINGAIS ROLE TEMPLATES SUMMARY")
    print("=" * 70)
    
    for service_line, roles in ROLE_TEMPLATES.items():
        total = sum(t.count for t in roles.values())
        print(f"\n{service_line} ({total} employees, {len(roles)} roles)")
        print("-" * 50)
        
        for role_name, template in sorted(roles.items(), key=lambda x: x[1].level):
            print(f"  Level {template.level}: {role_name:<20} ({template.count:>3} employees)")
            print(f"           Experience: {template.experience_range[0]:.1f}-{template.experience_range[1]:.1f} years")
            print(f"           Core skills: {', '.join(template.core_skills[:4])}...")
            print()
    
    # Summary
    total_roles = get_role_count()
    total_employees = get_total_employee_count()
    print("=" * 70)
    print(f"TOTAL: {total_roles} unique roles, {total_employees} employees")
    print("=" * 70)


# =============================================================================
# SOFT SKILLS POOL (used by LLM generator for variation)
# =============================================================================

SOFT_SKILLS_POOL = [
    "Communication",
    "Attention to Detail",
    "Problem Solving",
    "Adaptability",
    "Client Relations",
    "Time Management",
    "Critical Thinking",
    "Analytical Skills",
    "Teamwork",
    "Ethics",
    "Leadership",
    "Collaboration",
    "Initiative",
    "Organization",
    "Creativity",
    "Emotional Intelligence",
    "Conflict Resolution",
    "Decision Making",
    "Mentoring",
    "Presentation Skills",
]


if __name__ == "__main__":
    # Test the module
    print_role_summary()
    
    # Validate distribution targets
    print("\nValidating distribution targets...")
    validation = validate_distribution_targets()
    for service_line, result in validation.items():
        status = "✅" if result["valid"] else "❌"
        print(f"  {service_line}: {result['actual']}/{result['expected']} {status}")
    
    # Test getting specific role
    print("\nTesting get_role_template('Assurance', 'Senior'):")
    template = get_role_template("Assurance", "Senior")
    if template:
        print(f"  Role: {template.role_name}")
        print(f"  Level: {template.level}")
        print(f"  Core skills: {template.core_skills}")
        print(f"  Experience: {template.experience_range[0]}-{template.experience_range[1]} years")

