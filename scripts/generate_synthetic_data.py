#!/usr/bin/env python3
"""
Synthetic Data Generation Script for SpringAIS

Generates 900 realistic synthetic employees across 3 EY service lines using
a hybrid hard-coded + LLM approach.

Usage:
    # Generate all 900 employees (default)
    python generate_synthetic_data.py --output data/synthetic_employees.sql

    # Generate with custom count (proportionally distributed)
    python generate_synthetic_data.py --output data/synthetic_employees.sql --count 100

    # Validate only (no LLM calls, mock data)
    python generate_synthetic_data.py --output data/test.sql --validate-only

    # Use mock data (no API costs)
    python generate_synthetic_data.py --output data/test.sql --mock

Docker usage:
    docker exec -it springais-backend python /app/scripts/generate_synthetic_data.py --output /app/data/synthetic_employees.sql
"""

import os
import sys
import argparse
import random
import json
import logging
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field, asdict

# Add scripts directory to path for imports
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

from role_templates import (
    ROLE_TEMPLATES,
    RoleTemplate,
    get_role_template,
    get_all_roles,
    get_total_employee_count,
    SOFT_SKILLS_POOL,
)
from llm_generator import LLMGenerator, GeneratedMetrics, GeneratedText
from onet_client import ONetClient

# Optional: tqdm for progress bars
try:
    from tqdm import tqdm
    TQDM_AVAILABLE = True
except ImportError:
    TQDM_AVAILABLE = False
    def tqdm(iterable, **kwargs):
        """Fallback tqdm that just returns the iterable."""
        desc = kwargs.get('desc', '')
        if desc:
            print(f"Processing: {desc}...")
        return iterable

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# =============================================================================
# DISTRIBUTION CONFIGURATION
# =============================================================================

# Focus area distribution per service line
FOCUS_AREA_DISTRIBUTION = {
    "Assurance": {
        "Audit": 0.40,
        "Financial Reporting": 0.25,
        "Risk & Compliance": 0.20,
        "SEC Reporting": 0.15,
    },
    "Tax": {
        "Corporate Tax": 0.35,
        "International Tax": 0.25,
        "M&A Tax": 0.20,
        "State & Local Tax": 0.20,
    },
    "Consulting": {
        # Tech focus (50%)
        "Cloud & Infrastructure": 0.15,
        "Data & Analytics": 0.15,
        "Cybersecurity": 0.10,
        "AI & Machine Learning": 0.10,
        # Business focus (50%)
        "Strategy": 0.12,
        "Operations": 0.12,
        "Finance Transformation": 0.13,
        "M&A Advisory": 0.13,
    },
}

# Service line ID prefixes
SERVICE_LINE_PREFIX = {
    "Assurance": "ASR",
    "Tax": "TAX",
    "Consulting": "CON",
}


@dataclass
class Employee:
    """Represents a synthetic employee."""
    id: str
    service_line: str
    current_role: str
    role_level: int
    years_experience: float
    skills: List[str]
    performance_metrics: Dict[str, Any]
    focus_area: str
    has_specialization: bool
    feedback_themes: List[str]
    notable_achievement: str
    career_history: Optional[Dict] = None

    def to_sql_values(self) -> str:
        """Generate SQL VALUES tuple for INSERT."""
        skills_json = json.dumps(self.skills)
        metrics_json = json.dumps(self.performance_metrics)
        
        # Handle career history
        if self.career_history:
            career_sql = f"'{json.dumps(self.career_history)}'::jsonb"
        else:
            career_sql = "NULL"
        
        # Escape single quotes in text fields
        achievement = self.notable_achievement.replace("'", "''") if self.notable_achievement else ""
        themes = [t.replace("'", "''") for t in self.feedback_themes]
        themes_array = "ARRAY[" + ", ".join(f"'{t}'" for t in themes) + "]" if themes else "NULL"
        
        return (
            f"('{self.id}', '{self.service_line}', '{self.current_role}', "
            f"{self.role_level}, {self.years_experience:.2f}, "
            f"'{skills_json}'::jsonb, '{metrics_json}'::jsonb, "
            f"{career_sql}, "
            f"{themes_array}, '{achievement}')"
        )

    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "service_line": self.service_line,
            "current_role": self.current_role,
            "role_level": self.role_level,
            "years_experience": self.years_experience,
            "skills": self.skills,
            "performance_metrics": self.performance_metrics,
            "focus_area": self.focus_area,
            "has_specialization": self.has_specialization,
            "feedback_themes": self.feedback_themes,
            "notable_achievement": self.notable_achievement,
            "career_history": self.career_history,
        }


# =============================================================================
# SPECIALIZATION LOGIC (TASK 6)
# =============================================================================

def get_specialization_probability(role_level: int, max_level: int) -> float:
    """
    Calculate probability of having specialization based on role level.
    
    Higher roles are more likely to have specialization:
    - Entry level (1): 20%
    - Mid level: 30-40%
    - Senior/Partner: 50%
    
    Args:
        role_level: Current role level (1 = entry)
        max_level: Maximum level for this service line (5 for Assurance/Tax, 9 for Consulting)
    """
    # Linear interpolation from 20% at level 1 to 50% at max level
    base_prob = 0.20
    max_prob = 0.50
    
    if max_level <= 1:
        return base_prob
    
    # Normalize level to 0-1 range
    normalized = (role_level - 1) / (max_level - 1)
    return base_prob + (max_prob - base_prob) * normalized


def select_focus_area(service_line: str) -> str:
    """
    Select a focus area based on distribution weights.
    """
    distribution = FOCUS_AREA_DISTRIBUTION.get(service_line, {})
    if not distribution:
        return "General"
    
    areas = list(distribution.keys())
    weights = list(distribution.values())
    return random.choices(areas, weights=weights, k=1)[0]


def build_skills_list(
    template: RoleTemplate,
    focus_area: str,
    has_specialization: bool,
    onet_client: ONetClient,
) -> List[str]:
    """
    Build the skills list for an employee.
    
    1. Always include core_skills (95%+)
    2. Include 2-4 common_skills (60-80% probability each)
    3. If has_specialization, add focus_area_skills
    4. Add 1-2 soft skills for variety
    """
    skills = []
    
    # 1. Core skills (always included, 95% each)
    for skill in template.core_skills:
        if random.random() < 0.95:
            skills.append(skill)
    
    # Ensure at least some core skills
    if len(skills) < 3 and template.core_skills:
        skills = template.core_skills[:3]
    
    # 2. Common skills (2-4 randomly selected)
    num_common = random.randint(2, min(4, len(template.common_skills)))
    common_selected = random.sample(template.common_skills, num_common)
    for skill in common_selected:
        if skill not in skills:
            skills.append(skill)
    
    # 3. Focus area skills (if specialized)
    if has_specialization and focus_area in template.focus_area_skills:
        focus_skills = template.focus_area_skills[focus_area]
        # Add 2-4 focus area skills
        num_focus = random.randint(2, min(4, len(focus_skills)))
        focus_selected = random.sample(focus_skills, num_focus)
        for skill in focus_selected:
            if skill not in skills:
                skills.append(skill)
    
    # 4. Add 1-2 soft skills for variety
    num_soft = random.randint(1, 2)
    available_soft = [s for s in SOFT_SKILLS_POOL if s not in skills]
    if available_soft:
        soft_selected = random.sample(available_soft, min(num_soft, len(available_soft)))
        skills.extend(soft_selected)
    
    return skills


# =============================================================================
# EMPLOYEE GENERATION
# =============================================================================

def generate_employee_id(service_line: str, index: int) -> str:
    """Generate employee ID in format EMP-XXX-YYYY."""
    prefix = SERVICE_LINE_PREFIX.get(service_line, "UNK")
    return f"EMP-{prefix}-{index:04d}"


def generate_experience(template: RoleTemplate) -> float:
    """Generate years of experience within role's range."""
    min_exp, max_exp = template.experience_range
    # Use triangular distribution (more likely to be in middle of range)
    return round(random.triangular(min_exp, max_exp, (min_exp + max_exp) / 2), 2)


def calculate_max_level(service_line: str) -> int:
    """Get maximum role level for a service line."""
    templates = ROLE_TEMPLATES.get(service_line, {})
    if not templates:
        return 5
    return max(t.level for t in templates.values())


def generate_employees(
    count: int = 900,
    use_mock: bool = False,
    llm_generator: Optional[LLMGenerator] = None,
    onet_client: Optional[ONetClient] = None,
) -> List[Employee]:
    """
    Generate synthetic employees.
    
    Args:
        count: Total number of employees to generate (distributed proportionally)
        use_mock: If True, use mock data instead of LLM
        llm_generator: Optional pre-configured LLM generator
        onet_client: Optional pre-configured O*NET client
    
    Returns:
        List of Employee objects
    """
    if llm_generator is None:
        llm_generator = LLMGenerator(use_mock=use_mock)
    
    if onet_client is None:
        onet_client = ONetClient()
    
    employees = []
    
    # Calculate actual counts per role (proportional to distribution)
    total_target = get_total_employee_count()  # 900
    scale_factor = count / total_target
    
    # Build list of (template, count) for generation
    generation_plan = []
    for service_line, roles in ROLE_TEMPLATES.items():
        for role_name, template in roles.items():
            adjusted_count = max(1, round(template.count * scale_factor))
            generation_plan.append((template, adjusted_count))
    
    # Track employee IDs per service line
    service_line_counters = {"Assurance": 1, "Tax": 1, "Consulting": 1}
    
    # Generate metrics in batches for efficiency
    logger.info(f"Generating {count} employees...")
    
    # Phase 1: Generate metrics for all employees
    logger.info("Phase 1: Generating performance metrics...")
    all_metrics = llm_generator.generate_metrics_batch(generation_plan)
    
    # Phase 2: Generate text content and build employee objects
    logger.info("Phase 2: Building employee profiles...")
    
    metric_idx = 0
    progress_iter = tqdm(generation_plan, desc="Generating employees") if TQDM_AVAILABLE else generation_plan
    
    for template, emp_count in progress_iter:
        service_line = template.service_line
        max_level = calculate_max_level(service_line)
        
        for i in range(emp_count):
            # Get employee ID
            emp_id = generate_employee_id(service_line, service_line_counters[service_line])
            service_line_counters[service_line] += 1
            
            # Select focus area
            focus_area = select_focus_area(service_line)
            
            # Determine specialization
            spec_prob = get_specialization_probability(template.level, max_level)
            has_specialization = random.random() < spec_prob
            
            # Build skills list
            skills = build_skills_list(template, focus_area, has_specialization, onet_client)
            
            # Generate experience
            years_exp = generate_experience(template)
            
            # Get metrics (from batch generation)
            if metric_idx < len(all_metrics):
                metrics = all_metrics[metric_idx]
                metric_idx += 1
            else:
                # Fallback to single generation
                metrics = llm_generator.generate_metrics(template)
            
            # Generate text content
            feedback = llm_generator.generate_feedback_themes(
                role=template.role_name,
                focus_area=focus_area,
                service_line=service_line,
                level=template.level,
            )
            
            achievement = llm_generator.generate_notable_achievement(
                role=template.role_name,
                skills=skills[:5],
                service_line=service_line,
                focus_area=focus_area,
                level=template.level,
            )
            
            # Create employee
            employee = Employee(
                id=emp_id,
                service_line=service_line,
                current_role=template.role_name,
                role_level=template.level,
                years_experience=years_exp,
                skills=skills,
                performance_metrics=metrics.to_dict(),
                focus_area=focus_area,
                has_specialization=has_specialization,
                feedback_themes=feedback,
                notable_achievement=achievement,
                career_history=None,  # Optional, not generated for MVP
            )
            
            employees.append(employee)
    
    logger.info(f"Generated {len(employees)} employees")
    return employees


# =============================================================================
# SQL EXPORT
# =============================================================================

def export_to_sql(employees: List[Employee], output_path: str) -> str:
    """
    Export employees to SQL dump file.
    
    Args:
        employees: List of Employee objects
        output_path: Path to write SQL file
    
    Returns:
        Path to written file
    """
    # Count by service line
    service_counts = {}
    for emp in employees:
        service_counts[emp.service_line] = service_counts.get(emp.service_line, 0) + 1
    
    # Build SQL content
    lines = [
        f"-- SpringAIS Synthetic Employee Data",
        f"-- Generated: {datetime.now().isoformat()}",
        f"-- Total employees: {len(employees)}",
        f"-- Distribution: {', '.join(f'{k}: {v}' for k, v in sorted(service_counts.items()))}",
        "",
        "-- Clear existing data",
        "TRUNCATE TABLE employees CASCADE;",
        "",
        "-- Insert employees",
        'INSERT INTO employees (id, service_line, "current_role", role_level, years_experience, skills, performance_metrics, career_history, feedback_themes, notable_achievement)',
        "VALUES"
    ]
    
    # Add employee values (batch in groups of 100 for readability)
    value_lines = []
    for emp in employees:
        value_lines.append(emp.to_sql_values())
    
    # Join values with commas
    lines.append(",\n".join(value_lines) + ";")
    
    # Add verification query
    lines.extend([
        "",
        "-- Verification queries",
        "SELECT 'Total employees' as metric, COUNT(*)::text as value FROM employees;",
        "SELECT service_line, COUNT(*) FROM employees GROUP BY service_line ORDER BY service_line;",
    ])
    
    # Write to file
    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else '.', exist_ok=True)
    with open(output_path, 'w') as f:
        f.write('\n'.join(lines))
    
    logger.info(f"SQL dump written to: {output_path}")
    return output_path


# =============================================================================
# VALIDATION (Basic - Full validation in validators.py)
# =============================================================================

def validate_basic(employees: List[Employee]) -> Dict[str, Any]:
    """
    Perform basic validation on generated employees.
    Full validation is in validators.py (Phase 4).
    """
    results = {
        "total_count": len(employees),
        "service_line_counts": {},
        "role_counts": {},
        "specialization_rate": 0,
        "avg_skills_per_employee": 0,
        "issues": [],
    }
    
    # Count by service line
    for emp in employees:
        results["service_line_counts"][emp.service_line] = \
            results["service_line_counts"].get(emp.service_line, 0) + 1
        
        key = f"{emp.service_line}:{emp.current_role}"
        results["role_counts"][key] = results["role_counts"].get(key, 0) + 1
    
    # Specialization rate
    specialized = sum(1 for e in employees if e.has_specialization)
    results["specialization_rate"] = specialized / len(employees) if employees else 0
    
    # Average skills
    total_skills = sum(len(e.skills) for e in employees)
    results["avg_skills_per_employee"] = total_skills / len(employees) if employees else 0
    
    # Basic checks
    if len(employees) < 10:
        results["issues"].append(f"Too few employees: {len(employees)}")
    
    for service_line, expected in [("Assurance", 300), ("Tax", 300), ("Consulting", 300)]:
        actual = results["service_line_counts"].get(service_line, 0)
        if actual == 0:
            results["issues"].append(f"No {service_line} employees")
    
    return results


def print_summary(employees: List[Employee], llm_generator: LLMGenerator):
    """Print generation summary."""
    validation = validate_basic(employees)
    
    print("\n" + "=" * 70)
    print("SYNTHETIC DATA GENERATION SUMMARY")
    print("=" * 70)
    
    print(f"\n📊 Employee Distribution")
    print(f"   Total: {validation['total_count']}")
    for sl, count in sorted(validation['service_line_counts'].items()):
        print(f"   {sl}: {count} ({count/validation['total_count']*100:.1f}%)")
    
    print(f"\n🎯 Specialization")
    print(f"   Rate: {validation['specialization_rate']*100:.1f}%")
    print(f"   Avg skills per employee: {validation['avg_skills_per_employee']:.1f}")
    
    # Role breakdown
    print(f"\n👥 Role Distribution")
    for key, count in sorted(validation['role_counts'].items()):
        sl, role = key.split(":")
        print(f"   {sl[:3]} {role}: {count}")
    
    # Cost summary
    llm_generator.print_cost_summary()
    
    # Issues
    if validation['issues']:
        print(f"\n⚠️  Issues Detected")
        for issue in validation['issues']:
            print(f"   - {issue}")
    else:
        print(f"\n✅ Basic validation passed")
    
    print("=" * 70)


# =============================================================================
# CLI
# =============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Generate synthetic employee data for SpringAIS",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    # Generate 900 employees (default)
    python generate_synthetic_data.py --output data/synthetic_employees.sql
    
    # Generate smaller dataset for testing
    python generate_synthetic_data.py --output data/test.sql --count 100 --mock
    
    # Validate only (mock mode, no API costs)
    python generate_synthetic_data.py --output data/test.sql --validate-only
        """
    )
    
    parser.add_argument(
        "--output", "-o",
        default="data/synthetic_employees.sql",
        help="Output SQL file path (default: data/synthetic_employees.sql)"
    )
    
    parser.add_argument(
        "--count", "-n",
        type=int,
        default=900,
        help="Number of employees to generate (default: 900)"
    )
    
    parser.add_argument(
        "--mock",
        action="store_true",
        help="Use mock data instead of LLM (no API costs, faster)"
    )
    
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Generate with mock data and validate only (no API costs)"
    )
    
    parser.add_argument(
        "--seed",
        type=int,
        default=None,
        help="Random seed for reproducibility"
    )
    
    parser.add_argument(
        "--json",
        action="store_true",
        help="Also output JSON file alongside SQL"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging"
    )
    
    args = parser.parse_args()
    
    # Set random seed if provided
    if args.seed:
        random.seed(args.seed)
        logger.info(f"Random seed set to: {args.seed}")
    
    # Determine mock mode
    use_mock = args.mock or args.validate_only
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    print("\n" + "=" * 70)
    print("SPRINGAIS SYNTHETIC DATA GENERATOR")
    print("=" * 70)
    print(f"Output: {args.output}")
    print(f"Count: {args.count}")
    print(f"Mode: {'Mock (no API)' if use_mock else 'Live (uses OpenAI API)'}")
    if args.seed:
        print(f"Seed: {args.seed}")
    print("=" * 70 + "\n")
    
    # Initialize generators
    llm_generator = LLMGenerator(use_mock=use_mock)
    onet_client = ONetClient()
    
    # Generate employees
    start_time = datetime.now()
    employees = generate_employees(
        count=args.count,
        use_mock=use_mock,
        llm_generator=llm_generator,
        onet_client=onet_client,
    )
    
    # Export to SQL
    export_to_sql(employees, args.output)
    
    # Optionally export JSON
    if args.json:
        json_path = args.output.replace(".sql", ".json")
        with open(json_path, 'w') as f:
            json.dump([e.to_dict() for e in employees], f, indent=2)
        logger.info(f"JSON output written to: {json_path}")
    
    # Print summary
    duration = (datetime.now() - start_time).total_seconds()
    print_summary(employees, llm_generator)
    
    print(f"\n⏱️  Generation completed in {duration:.1f} seconds")
    print(f"📄 SQL dump: {args.output}")
    if args.json:
        print(f"📄 JSON dump: {json_path}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())

