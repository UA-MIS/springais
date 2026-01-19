#!/usr/bin/env python3
"""
SQL Exporter Module for SpringAIS Synthetic Data

Exports employee data to PostgreSQL-compatible SQL dump files with:
- Batch INSERT statements (100 rows per statement for efficiency)
- Proper escaping for JSONB and text fields
- Header comments with metadata
- Verification queries

Usage:
    from sql_exporter import SQLExporter
    
    exporter = SQLExporter()
    exporter.export(employees, "data/synthetic_employees.sql")
    
    # Or with validation status
    exporter.export(employees, "data/synthetic_employees.sql", validation_passed=True)
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from collections import defaultdict

logger = logging.getLogger(__name__)


class SQLExporter:
    """
    Exports employee data to PostgreSQL-compatible SQL files.
    
    Features:
    - Batch INSERT statements for efficiency
    - Proper escaping of special characters
    - JSONB formatting for skills and metrics
    - Header comments with generation metadata
    - Verification queries at end of file
    """
    
    # Number of rows per INSERT statement (100 is a good balance)
    BATCH_SIZE = 100
    
    def __init__(self, batch_size: int = 100):
        """
        Initialize SQL exporter.
        
        Args:
            batch_size: Number of rows per INSERT statement (default: 100)
        """
        self.batch_size = batch_size
    
    def escape_string(self, value: str) -> str:
        """Escape a string for PostgreSQL (single quotes)."""
        if value is None:
            return ""
        return str(value).replace("'", "''")
    
    def format_jsonb(self, data: Any) -> str:
        """Format data as JSONB literal."""
        if data is None:
            return "NULL"
        if isinstance(data, str):
            # Already a JSON string
            escaped = self.escape_string(data)
            return f"'{escaped}'::jsonb"
        # Convert to JSON string
        json_str = json.dumps(data, ensure_ascii=False)
        escaped = self.escape_string(json_str)
        return f"'{escaped}'::jsonb"
    
    def format_text_array(self, items: List[str]) -> str:
        """Format a list as PostgreSQL TEXT[] array."""
        if not items:
            return "NULL"
        escaped = [self.escape_string(item) for item in items]
        return "ARRAY[" + ", ".join(f"'{item}'" for item in escaped) + "]"
    
    def format_employee_values(self, employee: Dict[str, Any]) -> str:
        """
        Format a single employee as SQL VALUES tuple.
        
        Expected fields:
        - id, service_line, job_title, role_level, years_experience
        - skills (list), performance_metrics (dict)
        - career_history (dict, optional), feedback_themes (list), notable_achievement (str)
        """
        emp_id = self.escape_string(employee.get('id', ''))
        service_line = self.escape_string(employee.get('service_line', ''))
        job_title = self.escape_string(employee.get('job_title', employee.get('current_role', '')))
        role_level = int(employee.get('role_level', 1))
        years_exp = float(employee.get('years_experience', 0))
        
        skills = employee.get('skills', [])
        if isinstance(skills, str):
            skills = json.loads(skills)
        skills_jsonb = self.format_jsonb(skills)
        
        metrics = employee.get('performance_metrics', {})
        if isinstance(metrics, str):
            metrics = json.loads(metrics)
        metrics_jsonb = self.format_jsonb(metrics)
        
        career_history = employee.get('career_history')
        career_jsonb = self.format_jsonb(career_history) if career_history else "NULL"
        
        feedback_themes = employee.get('feedback_themes', [])
        if isinstance(feedback_themes, str):
            feedback_themes = json.loads(feedback_themes)
        themes_array = self.format_text_array(feedback_themes)
        
        achievement = self.escape_string(employee.get('notable_achievement', ''))
        
        return (
            f"('{emp_id}', '{service_line}', '{job_title}', "
            f"{role_level}, {years_exp:.2f}, "
            f"{skills_jsonb}, {metrics_jsonb}, "
            f"{career_jsonb}, {themes_array}, '{achievement}')"
        )
    
    def generate_header(
        self,
        total_count: int,
        service_line_counts: Dict[str, int],
        validation_passed: Optional[bool] = None,
    ) -> List[str]:
        """Generate SQL file header with metadata."""
        lines = [
            "-- ============================================================",
            "-- SpringAIS Synthetic Employee Data",
            "-- ============================================================",
            f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            f"-- Total employees: {total_count}",
        ]
        
        # Distribution
        for sl, count in sorted(service_line_counts.items()):
            pct = count / total_count * 100 if total_count > 0 else 0
            lines.append(f"-- {sl}: {count} ({pct:.1f}%)")
        
        # Validation status
        if validation_passed is not None:
            status = "PASSED" if validation_passed else "FAILED"
            lines.append(f"-- Validation: {status}")
        
        lines.extend([
            "-- ============================================================",
            "",
        ])
        
        return lines
    
    def generate_truncate(self) -> List[str]:
        """Generate TRUNCATE statement to clear existing data."""
        return [
            "-- Clear existing employee data",
            "TRUNCATE TABLE employees CASCADE;",
            "",
        ]
    
    def generate_inserts(self, employees: List[Dict[str, Any]]) -> List[str]:
        """
        Generate batch INSERT statements.
        
        Batches employees into groups of BATCH_SIZE for efficient loading.
        """
        lines = []
        
        # Group employees by service line for organized output
        by_service_line = defaultdict(list)
        for emp in employees:
            sl = emp.get('service_line', 'Unknown')
            by_service_line[sl].append(emp)
        
        insert_columns = (
            'INSERT INTO employees '
            '(id, service_line, job_title, role_level, years_experience, '
            'skills, performance_metrics, career_history, feedback_themes, notable_achievement)'
        )
        
        for service_line in sorted(by_service_line.keys()):
            sl_employees = by_service_line[service_line]
            lines.append(f"-- {service_line} employees ({len(sl_employees)} rows)")
            
            # Process in batches
            for i in range(0, len(sl_employees), self.batch_size):
                batch = sl_employees[i:i + self.batch_size]
                
                lines.append(insert_columns)
                lines.append("VALUES")
                
                values = []
                for emp in batch:
                    values.append(self.format_employee_values(emp))
                
                # Join values with commas, last one gets semicolon
                for j, val in enumerate(values):
                    if j < len(values) - 1:
                        lines.append(val + ",")
                    else:
                        lines.append(val + ";")
                
                lines.append("")
        
        return lines
    
    def generate_verification(self) -> List[str]:
        """Generate verification queries to confirm data loaded correctly."""
        return [
            "-- ============================================================",
            "-- Verification Queries",
            "-- ============================================================",
            "",
            "-- Total count (should be 900)",
            "SELECT 'Total employees' as metric, COUNT(*)::text as value FROM employees;",
            "",
            "-- Distribution by service line (should be ~300 each)",
            'SELECT service_line, COUNT(*) as count FROM employees GROUP BY service_line ORDER BY service_line;',
            "",
            "-- Distribution by role",
            'SELECT service_line, job_title, COUNT(*) as count',
            'FROM employees',
            'GROUP BY service_line, job_title',
            'ORDER BY service_line, COUNT(*) DESC;',
            "",
            "-- Average metrics by role level",
            "SELECT role_level,",
            "       COUNT(*) as employees,",
            "       ROUND(AVG((performance_metrics->>'billing_rate')::numeric)) as avg_billing,",
            "       ROUND(AVG((performance_metrics->>'quality_score')::numeric), 2) as avg_quality,",
            "       ROUND(AVG(years_experience), 1) as avg_experience",
            "FROM employees",
            "GROUP BY role_level",
            "ORDER BY role_level;",
        ]
    
    def export(
        self,
        employees: List[Dict[str, Any]],
        output_path: str,
        validation_passed: Optional[bool] = None,
        include_verification: bool = True,
    ) -> str:
        """
        Export employees to SQL dump file.
        
        Args:
            employees: List of employee dictionaries
            output_path: Path to write SQL file
            validation_passed: Optional validation status to include in header
            include_verification: Whether to include verification queries
        
        Returns:
            Path to written file
        """
        # Calculate service line counts
        service_line_counts = defaultdict(int)
        for emp in employees:
            sl = emp.get('service_line', 'Unknown')
            service_line_counts[sl] += 1
        
        # Build SQL content
        lines = []
        lines.extend(self.generate_header(len(employees), service_line_counts, validation_passed))
        lines.extend(self.generate_truncate())
        lines.extend(self.generate_inserts(employees))
        
        if include_verification:
            lines.extend(self.generate_verification())
        
        # Write to file
        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else '.', exist_ok=True)
        
        content = "\n".join(lines)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        file_size = os.path.getsize(output_path)
        logger.info(f"SQL dump written to: {output_path} ({file_size / 1024 / 1024:.2f} MB)")
        
        return output_path
    
    def export_from_json(
        self,
        json_path: str,
        output_path: str,
        validation_passed: Optional[bool] = None,
    ) -> str:
        """
        Export employees from JSON file to SQL dump.
        
        Args:
            json_path: Path to JSON file with employee data
            output_path: Path to write SQL file
            validation_passed: Optional validation status
        
        Returns:
            Path to written file
        """
        with open(json_path, 'r') as f:
            employees = json.load(f)
        
        return self.export(employees, output_path, validation_passed)


def main():
    """CLI for SQL exporter."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Export employee data to SQL dump")
    parser.add_argument("--json", "-j", required=True, help="Path to JSON file with employee data")
    parser.add_argument("--output", "-o", required=True, help="Output SQL file path")
    parser.add_argument("--batch-size", type=int, default=100, help="Rows per INSERT statement")
    parser.add_argument("--validated", action="store_true", help="Mark as validation passed")
    parser.add_argument("--no-verification", action="store_true", help="Omit verification queries")
    
    args = parser.parse_args()
    
    exporter = SQLExporter(batch_size=args.batch_size)
    
    output = exporter.export_from_json(
        json_path=args.json,
        output_path=args.output,
        validation_passed=args.validated if args.validated else None,
    )
    
    print(f"SQL dump written to: {output}")
    return 0


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    sys.exit(main())

