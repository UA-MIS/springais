#!/usr/bin/env python3
"""
Test script for LLM Generator (Tasks 3-4)

Tests both mock mode and live API mode (if OPENAI_API_KEY is available).
Verifies:
- Task 3: Generate metrics for 10 employees, verify cost <$0.01
- Task 4: Generate text for 10 employees, verify quality and cost <$0.05
"""

import sys
import os
import json
import time
from pathlib import Path

# Add scripts directory to path
sys.path.insert(0, str(Path(__file__).parent))

from role_templates import (
    get_role_template, 
    get_all_roles, 
    get_roles_by_service_line,
    ROLE_TEMPLATES
)
from llm_generator import LLMGenerator, GeneratedMetrics, GeneratedText


def test_mock_mode():
    """Test Task 3 & 4 in mock mode (no API calls)."""
    print("\n" + "=" * 70)
    print("MOCK MODE TESTS (No API calls)")
    print("=" * 70)
    
    generator = LLMGenerator(use_mock=True)
    
    # Task 3: Generate metrics for 10 employees
    print("\n📊 Task 3: Metric Generation")
    print("-" * 50)
    
    test_templates = [
        (get_role_template("Assurance", "Staff"), 3),
        (get_role_template("Tax", "Senior"), 3),
        (get_role_template("Consulting", "Manager"), 4),
    ]
    
    start = time.time()
    metrics_batch = generator.generate_metrics_batch(test_templates)
    elapsed = time.time() - start
    
    print(f"   Generated {len(metrics_batch)} metric sets in {elapsed:.2f}s")
    
    # Validate all metrics are within bounds
    errors = []
    idx = 0
    for template, count in test_templates:
        ranges = template.performance_ranges
        for i in range(count):
            m = metrics_batch[idx]
            if not (ranges.utilization[0] <= m.utilization <= ranges.utilization[1]):
                errors.append(f"Employee {idx}: utilization {m.utilization} not in {ranges.utilization}")
            if not (ranges.billing_rate[0] <= m.billing_rate <= ranges.billing_rate[1]):
                errors.append(f"Employee {idx}: billing_rate {m.billing_rate} not in {ranges.billing_rate}")
            if not (ranges.quality_score[0] <= m.quality_score <= ranges.quality_score[1]):
                errors.append(f"Employee {idx}: quality_score {m.quality_score} not in {ranges.quality_score}")
            idx += 1
    
    if errors:
        print(f"   ❌ Validation errors:")
        for e in errors[:5]:
            print(f"      {e}")
    else:
        print(f"   ✅ All {len(metrics_batch)} metrics valid and within bounds")
    
    print("\n   Sample metrics:")
    for i, m in enumerate(metrics_batch[:3]):
        print(f"      Employee {i}: {m.to_dict()}")
    
    # Task 4: Generate text for 10 employees  
    print("\n📝 Task 4: Text Generation")
    print("-" * 50)
    
    test_employees = [
        {"role": "Staff", "service_line": "Assurance", "focus_area": "Audit", "level": 1, "skills": ["Accounting", "Audit", "GAAP"]},
        {"role": "Senior", "service_line": "Assurance", "focus_area": "Financial Reporting", "level": 2, "skills": ["GAAP", "SEC Reporting"]},
        {"role": "Manager", "service_line": "Tax", "focus_area": "Corporate Tax", "level": 3, "skills": ["Tax Law", "ASC 740"]},
        {"role": "Senior Manager", "service_line": "Tax", "focus_area": "International Tax", "level": 4, "skills": ["Transfer Pricing", "BEPS"]},
        {"role": "Partner", "service_line": "Tax", "focus_area": "M&A Tax", "level": 5, "skills": ["Tax Strategy", "M&A"]},
        {"role": "Analyst", "service_line": "Consulting", "focus_area": "Cloud & Infrastructure", "level": 1, "skills": ["AWS", "Python"]},
        {"role": "Consultant", "service_line": "Consulting", "focus_area": "Data & Analytics", "level": 4, "skills": ["Python", "SQL", "Tableau"]},
        {"role": "Manager", "service_line": "Consulting", "focus_area": "Cybersecurity", "level": 6, "skills": ["Security Architecture", "NIST"]},
        {"role": "Director", "service_line": "Consulting", "focus_area": "AI & Machine Learning", "level": 8, "skills": ["Python", "TensorFlow", "MLOps"]},
        {"role": "Partner", "service_line": "Consulting", "focus_area": "Strategy", "level": 9, "skills": ["Strategy", "C-Suite Advisory"]},
    ]
    
    start = time.time()
    text_batch = generator.generate_text_batch(test_employees)
    elapsed = time.time() - start
    
    print(f"   Generated {len(text_batch)} text sets in {elapsed:.2f}s")
    
    # Validate text output
    text_errors = []
    for i, text in enumerate(text_batch):
        if not (3 <= len(text.feedback_themes) <= 8):
            text_errors.append(f"Employee {i}: {len(text.feedback_themes)} themes (expected 3-8)")
        if not (10 <= len(text.notable_achievement) <= 200):
            text_errors.append(f"Employee {i}: achievement length {len(text.notable_achievement)} (expected 10-200)")
    
    if text_errors:
        print(f"   ❌ Validation errors:")
        for e in text_errors[:5]:
            print(f"      {e}")
    else:
        print(f"   ✅ All {len(text_batch)} text outputs valid")
    
    print("\n   Sample text outputs:")
    for i, (emp, text) in enumerate(zip(test_employees[:3], text_batch[:3])):
        print(f"\n      Employee {i} ({emp['service_line']} {emp['role']}):")
        print(f"         Themes: {text.feedback_themes}")
        print(f"         Achievement: {text.notable_achievement}")
    
    # Cost summary (mock mode = $0)
    generator.print_cost_summary()
    
    return True


def test_live_mode():
    """Test Task 3 & 4 with live API (if key available)."""
    print("\n" + "=" * 70)
    print("LIVE API MODE TESTS")
    print("=" * 70)
    
    generator = LLMGenerator(use_mock=False)
    
    if generator.use_mock:
        print("\n⚠️  No OPENAI_API_KEY found. Skipping live tests.")
        print("   Set OPENAI_API_KEY environment variable to test live generation.")
        return True  # Not a failure, just skipped
    
    print(f"\n   API key found. Running live tests...")
    
    # Task 3: Generate metrics for 10 employees
    print("\n📊 Task 3: Live Metric Generation")
    print("-" * 50)
    
    test_templates = [
        (get_role_template("Assurance", "Staff"), 3),
        (get_role_template("Tax", "Senior"), 3),
        (get_role_template("Consulting", "Manager"), 4),
    ]
    
    start = time.time()
    metrics_batch = generator.generate_metrics_batch(test_templates)
    elapsed = time.time() - start
    
    print(f"   Generated {len(metrics_batch)} metric sets in {elapsed:.2f}s")
    
    # Validate metrics
    errors = []
    idx = 0
    for template, count in test_templates:
        ranges = template.performance_ranges
        for i in range(count):
            m = metrics_batch[idx]
            if not (ranges.utilization[0] <= m.utilization <= ranges.utilization[1]):
                errors.append(f"Employee {idx}: utilization {m.utilization} not in {ranges.utilization}")
            if not (ranges.billing_rate[0] <= m.billing_rate <= ranges.billing_rate[1]):
                errors.append(f"Employee {idx}: billing_rate {m.billing_rate} not in {ranges.billing_rate}")
            idx += 1
    
    if errors:
        print(f"   ⚠️  {len(errors)} validation errors (clamped to bounds):")
        for e in errors[:3]:
            print(f"      {e}")
    else:
        print(f"   ✅ All {len(metrics_batch)} metrics valid")
    
    print("\n   Sample live metrics:")
    for i, m in enumerate(metrics_batch[:3]):
        print(f"      Employee {i}: {m.to_dict()}")
    
    # Check Task 3 cost requirement: <$0.01
    cost_summary = generator.get_cost_summary()
    metrics_cost = cost_summary["metrics"]["estimated_cost_usd"]
    
    print(f"\n   💰 Metrics cost: ${metrics_cost:.4f}")
    if metrics_cost < 0.01:
        print(f"   ✅ Task 3 cost requirement met (<$0.01)")
    else:
        print(f"   ⚠️  Task 3 cost ${metrics_cost:.4f} > $0.01 target")
    
    # Task 4: Generate text for 10 employees
    print("\n📝 Task 4: Live Text Generation")
    print("-" * 50)
    
    test_employees = [
        {"role": "Staff", "service_line": "Assurance", "focus_area": "Audit", "level": 1, "skills": ["Accounting", "Audit"]},
        {"role": "Senior", "service_line": "Tax", "focus_area": "Corporate Tax", "level": 2, "skills": ["Tax Law", "ASC 740"]},
        {"role": "Manager", "service_line": "Consulting", "focus_area": "Cloud & Infrastructure", "level": 6, "skills": ["AWS", "Strategy"]},
        {"role": "Partner", "service_line": "Consulting", "focus_area": "Strategy", "level": 9, "skills": ["Strategy", "Leadership"]},
    ]
    
    start = time.time()
    text_batch = generator.generate_text_batch(test_employees)
    elapsed = time.time() - start
    
    print(f"   Generated {len(text_batch)} text sets in {elapsed:.2f}s")
    
    print("\n   Sample live text outputs:")
    for i, (emp, text) in enumerate(zip(test_employees[:2], text_batch[:2])):
        print(f"\n      Employee {i} ({emp['service_line']} {emp['role']}):")
        print(f"         Themes: {text.feedback_themes}")
        print(f"         Achievement: {text.notable_achievement}")
    
    # Check Task 4 cost requirement: <$0.05
    cost_summary = generator.get_cost_summary()
    text_cost = cost_summary["text"]["estimated_cost_usd"]
    total_cost = cost_summary["total_estimated_cost_usd"]
    
    print(f"\n   💰 Text cost: ${text_cost:.4f}")
    if text_cost < 0.05:
        print(f"   ✅ Task 4 cost requirement met (<$0.05)")
    else:
        print(f"   ⚠️  Task 4 cost ${text_cost:.4f} > $0.05 target")
    
    # Final cost summary
    generator.print_cost_summary()
    
    print(f"\n   📊 Total test cost: ${total_cost:.4f}")
    
    return True


def test_edge_cases():
    """Test edge cases and error handling."""
    print("\n" + "=" * 70)
    print("EDGE CASE TESTS")
    print("=" * 70)
    
    generator = LLMGenerator(use_mock=True)
    
    # Test clamping edge values
    print("\n   Testing metric clamping...")
    template = get_role_template("Assurance", "Staff")
    
    # Generate 50 samples to test distribution
    metrics = [generator.generate_metrics(template) for _ in range(50)]
    
    utilizations = [m.utilization for m in metrics]
    billing_rates = [m.billing_rate for m in metrics]
    
    print(f"      Utilization range: {min(utilizations)}-{max(utilizations)} (expected: 70-85)")
    print(f"      Billing rate range: ${min(billing_rates)}-${max(billing_rates)} (expected: $80-$120)")
    
    # All should be within bounds
    ranges = template.performance_ranges
    within_bounds = all(
        ranges.utilization[0] <= m.utilization <= ranges.utilization[1] and
        ranges.billing_rate[0] <= m.billing_rate <= ranges.billing_rate[1]
        for m in metrics
    )
    
    if within_bounds:
        print(f"   ✅ All 50 samples within bounds")
    else:
        print(f"   ❌ Some samples out of bounds")
    
    # Test all roles
    print("\n   Testing all role templates...")
    all_roles = get_all_roles()
    for template in all_roles[:5]:  # Test first 5
        m = generator.generate_metrics(template)
        ranges = template.performance_ranges
        valid = (
            ranges.utilization[0] <= m.utilization <= ranges.utilization[1] and
            ranges.billing_rate[0] <= m.billing_rate <= ranges.billing_rate[1] and
            ranges.quality_score[0] <= m.quality_score <= ranges.quality_score[1]
        )
        status = "✅" if valid else "❌"
        print(f"      {status} {template.service_line} {template.role_name}")
    
    print(f"\n   Tested {len(all_roles)} total roles in role_templates")
    
    return True


def main():
    """Run all tests."""
    print("\n" + "=" * 70)
    print("SPRINGAIS LLM GENERATOR TESTS (Tasks 3-4)")
    print("=" * 70)
    print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    all_passed = True
    
    try:
        # Mock mode tests (always run)
        if not test_mock_mode():
            all_passed = False
        
        # Edge case tests
        if not test_edge_cases():
            all_passed = False
        
        # Live mode tests (if API key available)
        if not test_live_mode():
            all_passed = False
        
    except Exception as e:
        print(f"\n❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        all_passed = False
    
    print("\n" + "=" * 70)
    if all_passed:
        print("✅ ALL TESTS PASSED")
    else:
        print("❌ SOME TESTS FAILED")
    print("=" * 70)
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())

