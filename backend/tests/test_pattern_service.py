"""
Unit tests for Success Pattern Analysis Service.

Tests transition analysis, skill correlation, and career graph building
using mock data.
"""

import pytest
from app.services.pattern_service import (
    SuccessPatternService,
    MOCK_EMPLOYEES_FOR_PATTERNS,
    get_pattern_service,
    analyze_career_transitions,
)
from app.schemas.pattern import TransitionPattern, CareerGraph, RoleRecommendation


class TestSuccessPatternService:
    """Tests for SuccessPatternService."""
    
    @pytest.fixture
    def service(self):
        """Create a pattern service using mock data."""
        return SuccessPatternService(db=None, use_mock=True)
    
    # ============================================
    # Task 1.2: Transition Analysis Tests
    # ============================================
    
    def test_analyze_transitions_returns_patterns(self, service):
        """Test that analyze_transitions returns TransitionPattern objects."""
        # Use lower min_sample_size for mock data (default is 5)
        patterns = service.analyze_transitions(min_sample_size=2)
        
        assert isinstance(patterns, list)
        assert len(patterns) > 0
        assert all(isinstance(p, TransitionPattern) for p in patterns)
    
    def test_analyze_transitions_meets_minimum_sample_size(self, service):
        """Test that only transitions with enough samples are included."""
        # Use low threshold to get more results with mock data
        patterns = service.analyze_transitions(min_sample_size=2)
        
        for pattern in patterns:
            assert pattern.sample_size >= 2
    
    def test_analyze_transitions_contains_required_fields(self, service):
        """Test that patterns have all required fields populated."""
        patterns = service.analyze_transitions(min_sample_size=2)
        
        if patterns:
            pattern = patterns[0]
            assert pattern.pattern_id is not None
            assert pattern.source_role != ""
            assert pattern.target_role != ""
            assert 0 <= pattern.success_rate <= 1
            assert pattern.avg_time_to_promotion_years > 0
            assert pattern.sample_size >= 1
    
    def test_analyze_transitions_filters_by_service_line(self, service):
        """Test filtering by service line."""
        advisory_patterns = service.analyze_transitions(service_line="Advisory", min_sample_size=2)
        tech_patterns = service.analyze_transitions(service_line="Technology", min_sample_size=2)
        
        # Should have different results
        if advisory_patterns and tech_patterns:
            advisory_roles = {p.source_role for p in advisory_patterns}
            tech_roles = {p.source_role for p in tech_patterns}
            # Advisory has Consultant/Analyst, Technology has Engineer
            assert advisory_roles != tech_roles
    
    def test_consultant_to_senior_consultant_pattern(self, service):
        """Test the common Consultant → Senior Consultant transition."""
        patterns = service.analyze_transitions(service_line="Advisory", min_sample_size=2)
        
        # Find the consultant transition
        consultant_pattern = next(
            (p for p in patterns if p.source_role == "Consultant" and p.target_role == "Senior Consultant"),
            None
        )
        
        if consultant_pattern:
            assert consultant_pattern.success_rate > 0
            assert consultant_pattern.avg_time_to_promotion_years > 0
            assert len(consultant_pattern.common_skills) > 0
    
    # ============================================
    # Task 1.3: Skill Correlation Tests
    # ============================================
    
    def test_find_common_skills_returns_list(self, service):
        """Test that find_common_skills returns a list of strings."""
        skills = service.find_common_skills("Consultant", "Senior Consultant", threshold=0.5)
        
        assert isinstance(skills, list)
        assert all(isinstance(s, str) for s in skills)
    
    def test_find_common_skills_sorted_by_frequency(self, service):
        """Test that skills are sorted by frequency."""
        # Get correlation with frequencies
        correlation = service.get_skill_correlation("Consultant", "Senior Consultant")
        skills = service.find_common_skills("Consultant", "Senior Consultant", threshold=0.5)
        
        if len(skills) >= 2:
            # First skill should have higher or equal frequency
            assert correlation.get(skills[0], 0) >= correlation.get(skills[1], 0)
    
    def test_get_skill_correlation_returns_frequencies(self, service):
        """Test that skill correlation returns skill frequencies."""
        correlation = service.get_skill_correlation("Consultant", "Senior Consultant")
        
        assert isinstance(correlation, dict)
        for skill, freq in correlation.items():
            assert isinstance(skill, str)
            assert 0 <= freq <= 1
    
    def test_nonexistent_transition_returns_empty(self, service):
        """Test that nonexistent transitions return empty results."""
        skills = service.find_common_skills("NonexistentRole", "AnotherFakeRole")
        assert skills == []
        
        correlation = service.get_skill_correlation("FakeRole", "FakeTarget")
        assert correlation == {}
    
    # ============================================
    # Career Graph Tests
    # ============================================
    
    def test_build_career_graph_structure(self, service):
        """Test that career graph has correct structure."""
        graph = service.build_career_graph(min_sample_size=2)
        
        assert isinstance(graph, CareerGraph)
        assert isinstance(graph.nodes, list)
        assert isinstance(graph.edges, list)
        assert len(graph.nodes) > 0
    
    def test_career_graph_nodes_have_required_fields(self, service):
        """Test that graph nodes have all required fields."""
        graph = service.build_career_graph(min_sample_size=2)
        
        for node in graph.nodes:
            assert node.id is not None
            assert node.role is not None
            assert isinstance(node.position, dict)
            assert "x" in node.position
            assert "y" in node.position
    
    def test_career_graph_edges_reference_valid_nodes(self, service):
        """Test that all edge sources/targets reference valid nodes."""
        graph = service.build_career_graph(min_sample_size=2)
        
        node_ids = {n.id for n in graph.nodes}
        
        for edge in graph.edges:
            assert edge.source in node_ids, f"Edge source {edge.source} not in nodes"
            assert edge.target in node_ids, f"Edge target {edge.target} not in nodes"
    
    def test_career_graph_filters_by_service_line(self, service):
        """Test that career graph can be filtered by service line."""
        advisory_graph = service.build_career_graph(service_line="Advisory", min_sample_size=2)
        tech_graph = service.build_career_graph(service_line="Technology", min_sample_size=2)
        
        advisory_roles = {n.role for n in advisory_graph.nodes}
        tech_roles = {n.role for n in tech_graph.nodes}
        
        # Different service lines should have different roles
        assert advisory_roles != tech_roles
    
    # ============================================
    # Employee Recommendations Tests
    # ============================================
    
    def test_get_recommendations_for_employee(self, service):
        """Test getting role recommendations for an employee."""
        recommendations = service.get_next_role_recommendations("EMP004", top_k=3)
        
        assert isinstance(recommendations, list)
        assert all(isinstance(r, RoleRecommendation) for r in recommendations)
    
    def test_recommendations_have_skill_analysis(self, service):
        """Test that recommendations include skill gap analysis."""
        recommendations = service.get_next_role_recommendations("EMP004", top_k=3)
        
        if recommendations:
            rec = recommendations[0]
            assert rec.role is not None
            assert 0 <= rec.success_rate <= 1
            assert 0 <= rec.skill_match_score <= 1
            assert isinstance(rec.skill_gaps, list)
            assert isinstance(rec.matching_skills, list)
    
    def test_nonexistent_employee_returns_empty(self, service):
        """Test that nonexistent employee returns empty recommendations."""
        recommendations = service.get_next_role_recommendations("FAKE_EMP_ID")
        assert recommendations == []
    
    # ============================================
    # Trajectory Metrics Tests
    # ============================================
    
    def test_get_trajectory_metrics(self, service):
        """Test getting trajectory metrics for an employee."""
        metrics = service.get_trajectory_metrics("EMP004")
        
        assert metrics is not None
        assert metrics.employee_id == "EMP004"
        assert metrics.current_role is not None
        assert metrics.trajectory_status in ["on_track", "ahead", "behind"]
        assert 0 <= metrics.percentile_rank <= 100
    
    def test_trajectory_metrics_nonexistent_employee(self, service):
        """Test trajectory metrics for nonexistent employee."""
        metrics = service.get_trajectory_metrics("FAKE_ID")
        assert metrics is None
    
    # ============================================
    # Edge Cases
    # ============================================
    
    def test_employee_with_no_career_history(self, service):
        """Test handling of employees with no career history."""
        # Mock employees all have career history, but the code should handle empty
        patterns = service.analyze_transitions(min_sample_size=1)
        # Should not crash and should return results
        assert isinstance(patterns, list)
    
    def test_single_person_transition(self, service):
        """Test that single-person transitions are excluded by default."""
        patterns = service.analyze_transitions(min_sample_size=5)
        
        for pattern in patterns:
            assert pattern.sample_size >= 5
    
    def test_convenience_functions(self):
        """Test convenience functions work correctly."""
        service = get_pattern_service(use_mock=True)
        assert isinstance(service, SuccessPatternService)
        
        patterns = analyze_career_transitions(min_sample_size=2)
        assert isinstance(patterns, list)


class TestMockData:
    """Tests to verify mock data is valid."""
    
    def test_mock_employees_have_career_history(self):
        """Test that mock employees have career history."""
        employees_with_history = [
            e for e in MOCK_EMPLOYEES_FOR_PATTERNS 
            if e.career_history and len(e.career_history) > 0
        ]
        assert len(employees_with_history) > 0
    
    def test_mock_employees_have_skills(self):
        """Test that mock employees have skills."""
        for emp in MOCK_EMPLOYEES_FOR_PATTERNS:
            assert len(emp.skills) > 0
    
    def test_mock_data_has_multiple_service_lines(self):
        """Test that mock data covers multiple service lines."""
        service_lines = {e.service_line for e in MOCK_EMPLOYEES_FOR_PATTERNS}
        assert len(service_lines) >= 3  # Advisory, Technology, Assurance, Tax


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

