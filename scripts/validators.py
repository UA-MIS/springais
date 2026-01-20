#!/usr/bin/env python3
"""
5-Layer Validation Module for SpringAIS Synthetic Data

Implements comprehensive validation as specified in CONTEXT.md:
- Layer 1: Distribution Validation (employee counts)
- Layer 2: Correlation Validation (metrics vs role level)
- Layer 3: Progression Validation (experience vs role)
- Layer 4: Boundary Validation (values within ranges)
- Layer 5: Semantic Validation (skills match service line)

Usage:
    from validators import validate_all, generate_validation_report
    
    # From database
    results = validate_all_from_db(connection_string)
    
    # From Employee objects
    results = validate_all(employees)
    
    # Generate report
    report = generate_validation_report(employees, output_path="data/validation_report.txt")
"""

import os
import sys
import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from collections import defaultdict
import statistics

# Add scripts directory to path for imports
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)

from role_templates import (
    ROLE_TEMPLATES,
    RoleTemplate,
    get_role_template,
    SERVICE_LINE_TOTALS,
)

logger = logging.getLogger(__name__)


# =============================================================================
# VALIDATION RESULT TYPES
# =============================================================================

@dataclass
class ValidationResult:
    """Result of a single validation check."""
    name: str
    passed: bool
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    
    def __str__(self) -> str:
        status = "✅ PASS" if self.passed else "❌ FAIL"
        return f"{status}: {self.name} - {self.message}"


@dataclass
class LayerResult:
    """Result of an entire validation layer."""
    layer_name: str
    layer_number: int
    passed: bool
    checks: List[ValidationResult] = field(default_factory=list)
    
    @property
    def pass_count(self) -> int:
        return sum(1 for c in self.checks if c.passed)
    
    @property
    def fail_count(self) -> int:
        return sum(1 for c in self.checks if not c.passed)
    
    def __str__(self) -> str:
        status = "✅ PASS" if self.passed else "❌ FAIL"
        return f"Layer {self.layer_number}: {self.layer_name} - {status} ({self.pass_count}/{len(self.checks)} checks passed)"


@dataclass
class ValidationReport:
    """Complete validation report across all layers."""
    timestamp: str
    total_employees: int
    layers: List[LayerResult] = field(default_factory=list)
    summary_stats: Dict[str, Any] = field(default_factory=dict)
    outliers: List[Dict[str, Any]] = field(default_factory=list)
    
    @property
    def all_passed(self) -> bool:
        return all(layer.passed for layer in self.layers)
    
    @property
    def total_checks(self) -> int:
        return sum(len(layer.checks) for layer in self.layers)
    
    @property
    def passed_checks(self) -> int:
        return sum(layer.pass_count for layer in self.layers)


# =============================================================================
# HELPER: EMPLOYEE DATA EXTRACTION
# =============================================================================

def extract_employee_data(employee: Any) -> Dict[str, Any]:
    """
    Extract standardized data from various employee formats.
    Handles both Employee objects and database row dicts.
    """
    if hasattr(employee, 'to_dict'):
        return employee.to_dict()
    elif isinstance(employee, dict):
        # Database row format
        data = dict(employee)
        # Parse JSONB fields if they're strings
        if isinstance(data.get('skills'), str):
            data['skills'] = json.loads(data['skills'])
        if isinstance(data.get('performance_metrics'), str):
            data['performance_metrics'] = json.loads(data['performance_metrics'])
        return data
    else:
        raise ValueError(f"Unknown employee format: {type(employee)}")


def get_metric(employee: Dict, metric_name: str) -> Optional[float]:
    """Extract a numeric metric from employee data."""
    metrics = employee.get('performance_metrics', {})
    if isinstance(metrics, str):
        metrics = json.loads(metrics)
    value = metrics.get(metric_name)
    if value is not None:
        return float(value)
    return None


# =============================================================================
# LAYER 1: DISTRIBUTION VALIDATION
# =============================================================================

def validate_distribution(employees: List[Any], target_count: int = 900) -> LayerResult:
    """
    Layer 1: Validate employee distribution across service lines and roles.
    
    Checks:
    - Total employee count matches target
    - Service line distribution matches targets (±5%)
    - Each role has expected count (±10%)
    """
    layer = LayerResult(
        layer_name="Distribution Validation",
        layer_number=1,
        passed=True,
        checks=[]
    )
    
    # Extract data
    data = [extract_employee_data(e) for e in employees]
    
    # Check 1: Total count
    total = len(data)
    check1 = ValidationResult(
        name="Total Employee Count",
        passed=total == target_count,
        message=f"Expected {target_count}, got {total}",
        details={"expected": target_count, "actual": total}
    )
    layer.checks.append(check1)
    
    # Check 2: Service line distribution
    service_counts = defaultdict(int)
    for emp in data:
        service_counts[emp['service_line']] += 1
    
    for service_line, expected in SERVICE_LINE_TOTALS.items():
        actual = service_counts.get(service_line, 0)
        # Scale expected if target_count != 900
        scaled_expected = int(expected * (target_count / 900))
        tolerance = max(scaled_expected * 0.05, 5)  # 5% or at least 5 employees
        
        passed = abs(actual - scaled_expected) <= tolerance
        check = ValidationResult(
            name=f"{service_line} Count",
            passed=passed,
            message=f"Expected ~{scaled_expected} (±{int(tolerance)}), got {actual}",
            details={
                "service_line": service_line,
                "expected": scaled_expected,
                "actual": actual,
                "tolerance": tolerance,
                "percentage": round(actual / total * 100, 1) if total > 0 else 0
            }
        )
        layer.checks.append(check)
    
    # Check 3: Role distribution
    role_counts = defaultdict(int)
    for emp in data:
        key = f"{emp['service_line']}:{emp['current_role']}"
        role_counts[key] += 1
    
    for service_line, roles in ROLE_TEMPLATES.items():
        for role_name, template in roles.items():
            key = f"{service_line}:{role_name}"
            actual = role_counts.get(key, 0)
            # Scale expected
            scaled_expected = int(template.count * (target_count / 900))
            tolerance = max(scaled_expected * 0.10, 2)  # 10% or at least 2
            
            passed = abs(actual - scaled_expected) <= tolerance
            check = ValidationResult(
                name=f"{service_line} {role_name} Count",
                passed=passed,
                message=f"Expected ~{scaled_expected} (±{int(tolerance)}), got {actual}",
                details={
                    "service_line": service_line,
                    "role": role_name,
                    "expected": scaled_expected,
                    "actual": actual
                }
            )
            layer.checks.append(check)
    
    # Determine overall layer pass/fail
    layer.passed = all(c.passed for c in layer.checks)
    return layer


# =============================================================================
# LAYER 2: CORRELATION VALIDATION
# =============================================================================

def validate_correlation(employees: List[Any]) -> LayerResult:
    """
    Layer 2: Validate that metrics correlate with role level WITHIN each service line.
    
    Higher role levels should have:
    - Higher average billing rate
    - Higher average quality score
    - Generally higher utilization (but Partners may have lower)
    
    Note: We validate within each service line because Assurance/Tax have 5 levels
    while Consulting has 9, so cross-service-line comparison is not meaningful.
    """
    layer = LayerResult(
        layer_name="Correlation Validation",
        layer_number=2,
        passed=True,
        checks=[]
    )
    
    data = [extract_employee_data(e) for e in employees]
    
    # Group by service line, then by level
    by_service_line = defaultdict(lambda: defaultdict(list))
    for emp in data:
        sl = emp['service_line']
        level = emp.get('role_level', 1)
        by_service_line[sl][level].append(emp)
    
    # Validate within each service line
    for service_line in sorted(by_service_line.keys()):
        level_data = by_service_line[service_line]
        
        # Calculate averages per level within this service line
        level_stats = {}
        for level in sorted(level_data.keys()):
            emps = level_data[level]
            level_stats[level] = {
                'count': len(emps),
                'avg_billing_rate': statistics.mean([get_metric(e, 'billing_rate') or 0 for e in emps]),
                'avg_quality_score': statistics.mean([get_metric(e, 'quality_score') or 0 for e in emps]),
                'avg_utilization': statistics.mean([get_metric(e, 'utilization') or 0 for e in emps]),
            }
        
        levels = sorted(level_stats.keys())
        
        # Check: Billing rate increases with level within this service line
        billing_increasing = True
        for i in range(1, len(levels)):
            prev_rate = level_stats[levels[i-1]]['avg_billing_rate']
            curr_rate = level_stats[levels[i]]['avg_billing_rate']
            if curr_rate < prev_rate * 0.90:  # Allow 10% dip for variation
                billing_increasing = False
                break
        
        check = ValidationResult(
            name=f"{service_line} Billing Rate Correlation",
            passed=billing_increasing,
            message=f"Billing increases with level" if billing_increasing else "Billing does not consistently increase",
            details={"by_level": {l: f"${level_stats[l]['avg_billing_rate']:.0f}" for l in levels}}
        )
        layer.checks.append(check)
        
        # Check: Quality score increases with level within this service line
        quality_increasing = True
        for i in range(1, len(levels)):
            prev_score = level_stats[levels[i-1]]['avg_quality_score']
            curr_score = level_stats[levels[i]]['avg_quality_score']
            if curr_score < prev_score - 0.15:  # Allow 0.15 dip for variation
                quality_increasing = False
                break
        
        check = ValidationResult(
            name=f"{service_line} Quality Score Correlation",
            passed=quality_increasing,
            message=f"Quality increases with level" if quality_increasing else "Quality does not consistently increase",
            details={"by_level": {l: f"{level_stats[l]['avg_quality_score']:.2f}" for l in levels}}
        )
        layer.checks.append(check)
    
    # Overall check: Entry level (1-2) has higher utilization than senior (4-5 or 8-9)
    entry_emps = [e for e in data if e.get('role_level', 1) <= 2]
    senior_emps = [e for e in data if e.get('role_level', 1) >= 4]
    
    if entry_emps and senior_emps:
        entry_util = statistics.mean([get_metric(e, 'utilization') or 0 for e in entry_emps])
        senior_util = statistics.mean([get_metric(e, 'utilization') or 0 for e in senior_emps])
        
        check = ValidationResult(
            name="Utilization Pattern (Entry vs Senior)",
            passed=entry_util >= senior_util - 10,  # Entry should be higher or within 10%
            message=f"Entry levels avg: {entry_util:.1f}%, Senior levels avg: {senior_util:.1f}%",
            details={"entry_avg": round(entry_util, 1), "senior_avg": round(senior_util, 1)}
        )
        layer.checks.append(check)
    
    layer.passed = all(c.passed for c in layer.checks)
    return layer


# =============================================================================
# LAYER 3: PROGRESSION VALIDATION
# =============================================================================

def validate_progression(employees: List[Any]) -> LayerResult:
    """
    Layer 3: Validate experience aligns with role level.
    
    No impossible patterns like:
    - Staff with 15 years experience
    - Partner with 2 years experience
    """
    layer = LayerResult(
        layer_name="Progression Validation",
        layer_number=3,
        passed=True,
        checks=[]
    )
    
    data = [extract_employee_data(e) for e in employees]
    violations = []
    
    for emp in data:
        service_line = emp['service_line']
        role = emp['current_role']
        level = emp.get('role_level', 1)
        years_exp = emp.get('years_experience', 0)
        
        # Get expected range from template
        template = get_role_template(service_line, role)
        if template:
            min_exp, max_exp = template.experience_range
            # Add 20% buffer for edge cases
            buffered_min = max(0, min_exp - 0.5)
            buffered_max = max_exp + 2.0
            
            if years_exp < buffered_min or years_exp > buffered_max:
                violations.append({
                    'id': emp['id'],
                    'role': f"{service_line} {role}",
                    'years': years_exp,
                    'expected': f"{min_exp:.1f}-{max_exp:.1f}",
                })
    
    # Check: No experience violations
    check = ValidationResult(
        name="Experience-Role Alignment",
        passed=len(violations) == 0,
        message=f"{len(violations)} employees with unrealistic experience" if violations else "All employees have realistic experience for their role",
        details={"violations": violations[:10] if violations else []}  # Show first 10
    )
    layer.checks.append(check)
    
    # Check: Experience increases with level within each service line
    for service_line in ["Assurance", "Tax", "Consulting"]:
        sl_data = [e for e in data if e['service_line'] == service_line]
        
        by_level = defaultdict(list)
        for emp in sl_data:
            by_level[emp.get('role_level', 1)].append(emp.get('years_experience', 0))
        
        avg_exp_by_level = {l: statistics.mean(exps) for l, exps in by_level.items() if exps}
        levels = sorted(avg_exp_by_level.keys())
        
        exp_increasing = True
        for i in range(1, len(levels)):
            if avg_exp_by_level[levels[i]] <= avg_exp_by_level[levels[i-1]] * 0.95:  # Allow 5% variation
                exp_increasing = False
                break
        
        check = ValidationResult(
            name=f"{service_line} Experience Progression",
            passed=exp_increasing,
            message="Experience increases with level" if exp_increasing else "Experience does not consistently increase",
            details={"avg_by_level": {l: f"{avg_exp_by_level[l]:.1f}" for l in levels}}
        )
        layer.checks.append(check)
    
    layer.passed = all(c.passed for c in layer.checks)
    return layer


# =============================================================================
# LAYER 4: BOUNDARY VALIDATION
# =============================================================================

def validate_boundaries(employees: List[Any]) -> LayerResult:
    """
    Layer 4: Validate all values fall within realistic bounds.
    
    - Utilization: 45-100%
    - Billing rate: $80-800/hr
    - Realization: 75-100%
    - Quality score: 1.0-5.0
    - Training hours: 5-120/year
    - Client feedback: 1.0-5.0
    """
    layer = LayerResult(
        layer_name="Boundary Validation",
        layer_number=4,
        passed=True,
        checks=[]
    )
    
    data = [extract_employee_data(e) for e in employees]
    
    # Define boundaries
    boundaries = {
        'utilization': (45, 100),
        'billing_rate': (80, 800),
        'realization': (75, 100),
        'quality_score': (1.0, 5.0),
        'training_hours': (5, 120),
        'client_feedback': (1.0, 5.0),
    }
    
    for metric_name, (min_val, max_val) in boundaries.items():
        violations = []
        for emp in data:
            value = get_metric(emp, metric_name)
            if value is not None and (value < min_val or value > max_val):
                violations.append({
                    'id': emp['id'],
                    'value': value,
                    'expected': f"{min_val}-{max_val}"
                })
        
        check = ValidationResult(
            name=f"{metric_name.replace('_', ' ').title()} Bounds",
            passed=len(violations) == 0,
            message=f"All values in range [{min_val}, {max_val}]" if not violations else f"{len(violations)} out of bounds",
            details={"violations": violations[:5]}  # Show first 5
        )
        layer.checks.append(check)
    
    # Check: Required skills present
    skill_violations = []
    for emp in data:
        service_line = emp['service_line']
        role = emp['current_role']
        skills = emp.get('skills', [])
        if isinstance(skills, str):
            skills = json.loads(skills)
        
        template = get_role_template(service_line, role)
        if template:
            # Check at least 50% of core skills present (allowing for 95% probability)
            core_skills_present = sum(1 for s in template.core_skills if s in skills)
            if core_skills_present < len(template.core_skills) * 0.5:
                skill_violations.append({
                    'id': emp['id'],
                    'role': f"{service_line} {role}",
                    'missing_core': [s for s in template.core_skills if s not in skills][:3]
                })
    
    check = ValidationResult(
        name="Core Skills Present",
        passed=len(skill_violations) == 0,
        message="All employees have required core skills" if not skill_violations else f"{len(skill_violations)} missing core skills",
        details={"violations": skill_violations[:5]}
    )
    layer.checks.append(check)
    
    layer.passed = all(c.passed for c in layer.checks)
    return layer


# =============================================================================
# LAYER 5: SEMANTIC VALIDATION
# =============================================================================

def validate_semantics(employees: List[Any]) -> LayerResult:
    """
    Layer 5: Validate skills and content make semantic sense.
    
    - Assurance employees have accounting-related skills
    - Tax employees have tax-related skills
    - Cloud consultants have cloud skills, not tax skills
    """
    layer = LayerResult(
        layer_name="Semantic Validation",
        layer_number=5,
        passed=True,
        checks=[]
    )
    
    data = [extract_employee_data(e) for e in employees]
    
    # Define semantic requirements (need at least one from each list)
    service_line_required_skills = {
        "Assurance": ["Accounting", "Audit", "GAAP", "Financial Reporting", "Internal Controls", "Excel"],
        "Tax": ["Tax Law", "Tax Compliance", "Tax Research", "Tax Planning", "IRC Knowledge", "Tax Strategy", "IRC Expertise", "Excel", "Tax Policy"],
        "Consulting": ["Strategy", "Analysis", "Project Management", "Client Management", "Research", 
                       "PowerPoint", "Excel", "Communication", "Stakeholder Management", "Business Development",
                       "Strategic Leadership", "Executive Presence"],  # Broader for senior roles
    }
    
    forbidden_skills = {
        "Assurance": ["Tax Law", "Transfer Pricing", "IRC Knowledge"],  # Shouldn't have tax-specific
        "Tax": [],  # Tax can overlap with accounting
        "Consulting": [],  # Consulting can have anything
    }
    
    # Check 1: Service line employees have relevant skills
    for service_line, required in service_line_required_skills.items():
        emps = [e for e in data if e['service_line'] == service_line]
        missing_required = []
        
        for emp in emps:
            skills = emp.get('skills', [])
            if isinstance(skills, str):
                skills = json.loads(skills)
            
            # At least one of the required skills should be present
            if not any(skill in skills for skill in required):
                missing_required.append({
                    'id': emp['id'],
                    'skills': skills[:5]
                })
        
        check = ValidationResult(
            name=f"{service_line} Relevant Skills",
            passed=len(missing_required) == 0,
            message=f"All {service_line} employees have relevant skills" if not missing_required else f"{len(missing_required)} lack core {service_line} skills",
            details={"missing": missing_required[:5]}
        )
        layer.checks.append(check)
    
    # Check 2: No forbidden skill combinations
    for service_line, forbidden in forbidden_skills.items():
        if not forbidden:
            continue
        
        emps = [e for e in data if e['service_line'] == service_line]
        violations = []
        
        for emp in emps:
            skills = emp.get('skills', [])
            if isinstance(skills, str):
                skills = json.loads(skills)
            
            forbidden_found = [s for s in skills if s in forbidden]
            if forbidden_found:
                violations.append({
                    'id': emp['id'],
                    'forbidden_skills': forbidden_found
                })
        
        check = ValidationResult(
            name=f"{service_line} No Forbidden Skills",
            passed=len(violations) == 0,
            message=f"No {service_line} employees have forbidden skills" if not violations else f"{len(violations)} have unexpected skills",
            details={"violations": violations[:5]}
        )
        layer.checks.append(check)
    
    # Check 3: Focus area skills for specialized employees
    # Note: Only employees with has_specialization=True AND tech focus areas should have focus skills
    focus_area_required = {
        "Cloud & Infrastructure": ["AWS", "Azure", "GCP", "Terraform", "Kubernetes", "Docker", "DevOps", "CI/CD"],
        "Data & Analytics": ["Python", "SQL", "Tableau", "Power BI", "Data Engineering", "ETL", "Snowflake", "Data Visualization"],
        "Cybersecurity": ["Security Architecture", "NIST", "ISO 27001", "SOC 2", "Penetration Testing", "IAM", "Risk Assessment"],
        "AI & Machine Learning": ["Python", "TensorFlow", "PyTorch", "Machine Learning", "Data Science", "NLP", "LLMs", "MLOps"],
    }
    
    focus_violations = []
    for emp in data:
        focus_area = emp.get('focus_area', '')
        has_specialization = emp.get('has_specialization', False)
        
        # Only check tech focus areas AND only if employee is specialized
        if focus_area in focus_area_required and has_specialization:
            skills = emp.get('skills', [])
            if isinstance(skills, str):
                skills = json.loads(skills)
            
            required_skills = focus_area_required[focus_area]
            # Specialized employees should have at least one focus area skill
            if not any(s in skills for s in required_skills):
                focus_violations.append({
                    'id': emp['id'],
                    'focus_area': focus_area,
                    'skills': skills[:5]
                })
    
    check = ValidationResult(
        name="Focus Area Skills",
        passed=len(focus_violations) == 0,
        message="Specialized employees have focus area skills" if not focus_violations else f"{len(focus_violations)} specialists lack focus skills",
        details={"violations": focus_violations[:5]}
    )
    layer.checks.append(check)
    
    layer.passed = all(c.passed for c in layer.checks)
    return layer


# =============================================================================
# MAIN VALIDATION FUNCTION
# =============================================================================

def validate_all(employees: List[Any], target_count: int = 900) -> ValidationReport:
    """
    Run all 5 validation layers on employee data.
    
    Args:
        employees: List of Employee objects or dicts
        target_count: Expected total employee count
    
    Returns:
        ValidationReport with all layer results
    """
    report = ValidationReport(
        timestamp=datetime.now().isoformat(),
        total_employees=len(employees),
        layers=[],
        summary_stats={},
        outliers=[]
    )
    
    # Run all layers
    report.layers.append(validate_distribution(employees, target_count))
    report.layers.append(validate_correlation(employees))
    report.layers.append(validate_progression(employees))
    report.layers.append(validate_boundaries(employees))
    report.layers.append(validate_semantics(employees))
    
    # Calculate summary stats
    data = [extract_employee_data(e) for e in employees]
    
    report.summary_stats = {
        'total_employees': len(data),
        'service_line_counts': {},
        'role_counts': {},
        'avg_experience_by_level': {},
        'avg_metrics_by_level': {},
    }
    
    # Service line counts
    for emp in data:
        sl = emp['service_line']
        report.summary_stats['service_line_counts'][sl] = \
            report.summary_stats['service_line_counts'].get(sl, 0) + 1
    
    # Find outliers (employees with metrics > 2 std devs from mean)
    report.outliers = find_outliers(data)
    
    return report


def find_outliers(data: List[Dict], std_threshold: float = 2.0) -> List[Dict]:
    """Find employees with metrics outside 2 standard deviations."""
    outliers = []
    
    metrics = ['utilization', 'billing_rate', 'realization', 'quality_score', 'training_hours']
    
    # Calculate mean and std for each metric
    for metric in metrics:
        values = [get_metric(e, metric) for e in data if get_metric(e, metric) is not None]
        if len(values) < 10:
            continue
        
        mean = statistics.mean(values)
        std = statistics.stdev(values)
        
        for emp in data:
            value = get_metric(emp, metric)
            if value is not None and abs(value - mean) > std_threshold * std:
                outliers.append({
                    'id': emp['id'],
                    'metric': metric,
                    'value': value,
                    'mean': round(mean, 2),
                    'std': round(std, 2),
                    'z_score': round((value - mean) / std, 2)
                })
    
    return outliers


# =============================================================================
# REPORT GENERATION
# =============================================================================

def generate_validation_report(
    employees: List[Any],
    output_path: Optional[str] = None,
    target_count: int = 900
) -> str:
    """
    Generate a comprehensive validation report.
    
    Args:
        employees: List of Employee objects or dicts
        output_path: Path to save report (optional)
        target_count: Expected employee count
    
    Returns:
        Report as string
    """
    report = validate_all(employees, target_count)
    
    lines = [
        "=" * 70,
        "SPRINGAIS SYNTHETIC DATA VALIDATION REPORT",
        "=" * 70,
        f"Generated: {report.timestamp}",
        f"Total Employees: {report.total_employees}",
        f"Overall Status: {'✅ ALL LAYERS PASSED' if report.all_passed else '❌ SOME LAYERS FAILED'}",
        f"Checks Passed: {report.passed_checks}/{report.total_checks}",
        "",
    ]
    
    # Layer summaries
    lines.append("=" * 70)
    lines.append("LAYER SUMMARY")
    lines.append("=" * 70)
    for layer in report.layers:
        lines.append(str(layer))
    lines.append("")
    
    # Detailed results per layer
    for layer in report.layers:
        lines.append("=" * 70)
        lines.append(f"LAYER {layer.layer_number}: {layer.layer_name.upper()}")
        lines.append("=" * 70)
        
        for check in layer.checks:
            status = "✅" if check.passed else "❌"
            lines.append(f"  {status} {check.name}")
            lines.append(f"     {check.message}")
            if check.details and not check.passed:
                for key, value in check.details.items():
                    if key == 'violations' and value:
                        lines.append(f"     Sample violations: {value[:3]}")
        lines.append("")
    
    # Distribution tables
    lines.append("=" * 70)
    lines.append("DISTRIBUTION TABLES")
    lines.append("=" * 70)
    
    data = [extract_employee_data(e) for e in employees]
    
    # Service line distribution
    lines.append("\nService Line Distribution:")
    sl_counts = defaultdict(int)
    for emp in data:
        sl_counts[emp['service_line']] += 1
    for sl in sorted(sl_counts.keys()):
        pct = sl_counts[sl] / len(data) * 100
        lines.append(f"  {sl}: {sl_counts[sl]} ({pct:.1f}%)")
    
    # Role distribution
    lines.append("\nRole Distribution:")
    role_counts = defaultdict(int)
    for emp in data:
        key = f"{emp['service_line'][:3]} {emp['current_role']}"
        role_counts[key] += 1
    for role in sorted(role_counts.keys()):
        lines.append(f"  {role}: {role_counts[role]}")
    
    # Metrics by level
    lines.append("\n" + "=" * 70)
    lines.append("CORRELATION TABLES (Avg Metrics by Role Level)")
    lines.append("=" * 70)
    
    by_level = defaultdict(list)
    for emp in data:
        by_level[emp.get('role_level', 1)].append(emp)
    
    lines.append(f"\n{'Level':<8}{'Count':<8}{'Billing':<12}{'Quality':<10}{'Utilization':<12}{'Experience':<10}")
    lines.append("-" * 60)
    for level in sorted(by_level.keys()):
        emps = by_level[level]
        avg_billing = statistics.mean([get_metric(e, 'billing_rate') or 0 for e in emps])
        avg_quality = statistics.mean([get_metric(e, 'quality_score') or 0 for e in emps])
        avg_util = statistics.mean([get_metric(e, 'utilization') or 0 for e in emps])
        avg_exp = statistics.mean([e.get('years_experience', 0) for e in emps])
        lines.append(f"{level:<8}{len(emps):<8}${avg_billing:<11.0f}{avg_quality:<10.2f}{avg_util:<12.1f}{avg_exp:<10.1f}")
    
    # Outliers
    if report.outliers:
        lines.append("\n" + "=" * 70)
        lines.append("OUTLIERS (>2 std devs from mean)")
        lines.append("=" * 70)
        for outlier in report.outliers[:20]:  # Show first 20
            lines.append(f"  {outlier['id']}: {outlier['metric']} = {outlier['value']} (z-score: {outlier['z_score']})")
    
    # Final summary
    lines.append("\n" + "=" * 70)
    lines.append("FINAL SUMMARY")
    lines.append("=" * 70)
    lines.append(f"Total Checks: {report.total_checks}")
    lines.append(f"Passed: {report.passed_checks}")
    lines.append(f"Failed: {report.total_checks - report.passed_checks}")
    lines.append(f"Outliers Detected: {len(report.outliers)}")
    lines.append(f"\n{'✅ DATA VALIDATION PASSED' if report.all_passed else '❌ DATA VALIDATION FAILED'}")
    lines.append("=" * 70)
    
    report_text = "\n".join(lines)
    
    # Save to file if path provided
    if output_path:
        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else '.', exist_ok=True)
        with open(output_path, 'w') as f:
            f.write(report_text)
        logger.info(f"Validation report saved to: {output_path}")
    
    return report_text


# =============================================================================
# DATABASE VALIDATION
# =============================================================================

def validate_from_database(
    host: str = "localhost",
    port: int = 5432,
    database: str = "springais",
    user: str = "postgres",
    password: str = "",
) -> ValidationReport:
    """
    Validate data directly from PostgreSQL database.
    
    Requires psycopg2.
    """
    try:
        import psycopg2
        import psycopg2.extras
    except ImportError:
        raise ImportError("psycopg2 required for database validation. Install with: pip install psycopg2-binary")
    
    conn = psycopg2.connect(
        host=host,
        port=port,
        database=database,
        user=user,
        password=password
    )
    
    try:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("""
                SELECT id, service_line, "current_role", role_level, years_experience,
                       skills, performance_metrics, feedback_themes, notable_achievement
                FROM employees
            """)
            employees = cur.fetchall()
        
        return validate_all(employees)
    finally:
        conn.close()


# =============================================================================
# CLI
# =============================================================================

def main():
    """CLI for running validation."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Validate SpringAIS synthetic employee data")
    parser.add_argument("--json", type=str, help="Path to JSON file with employee data")
    parser.add_argument("--db", action="store_true", help="Validate from database")
    parser.add_argument("--db-host", default="localhost", help="Database host")
    parser.add_argument("--db-port", type=int, default=5432, help="Database port")
    parser.add_argument("--db-name", default="springais", help="Database name")
    parser.add_argument("--db-user", default="postgres", help="Database user")
    parser.add_argument("--output", "-o", help="Output path for validation report")
    parser.add_argument("--count", type=int, default=900, help="Expected employee count")
    
    args = parser.parse_args()
    
    if args.json:
        with open(args.json, 'r') as f:
            employees = json.load(f)
        report_text = generate_validation_report(employees, args.output, args.count)
    elif args.db:
        report = validate_from_database(
            host=args.db_host,
            port=args.db_port,
            database=args.db_name,
            user=args.db_user
        )
        employees = []  # Would need to fetch for full report
        print(f"Validation {'PASSED' if report.all_passed else 'FAILED'}")
        for layer in report.layers:
            print(f"  {layer}")
        return 0 if report.all_passed else 1
    else:
        print("Error: Specify --json or --db")
        return 1
    
    print(report_text)
    return 0


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    sys.exit(main())

