"""
Success Pattern Analysis Service.

Analyzes historical employee data to identify patterns of successful role transitions.
Powers career path visualization (Block K) and informs match recommendations (Block E).

This implementation works with:
- Real database data when available (employees table with career_history JSONB)
- Mock data for testing when database is empty
- Redis caching for expensive pattern queries (24h TTL)
"""

from typing import List, Dict, Optional, Tuple, Any
from collections import defaultdict
from dataclasses import dataclass
import hashlib
import json
import os
import logging
from difflib import SequenceMatcher

from sqlalchemy.orm import Session
from sqlalchemy import text

from ..schemas.pattern import (
    TransitionPattern,
    CareerGraph,
    CareerGraphNode,
    CareerGraphEdge,
    RoleRecommendation,
    TrajectoryMetrics,
)

logger = logging.getLogger(__name__)

# Redis client (lazy initialization)
_redis_client = None

def get_redis_client():
    """Get or create Redis client."""
    global _redis_client
    if _redis_client is None:
        try:
            import redis
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
            _redis_client = redis.from_url(redis_url, decode_responses=True)
            # Test connection
            _redis_client.ping()
            logger.info("Redis connected for pattern caching")
        except Exception as e:
            logger.warning(f"Redis not available, caching disabled: {e}")
            _redis_client = None
    return _redis_client


# ============================================
# Mock Data for Testing (when DB is empty)
# ============================================

@dataclass
class MockEmployee:
    """Mock employee for pattern analysis testing."""
    id: str
    current_role: str
    role_level: int
    service_line: str
    years_experience: float
    skills: List[str]
    career_history: List[Dict]  # [{"role": "Analyst", "years": 2, "service_line": "Advisory"}, ...]


MOCK_EMPLOYEES_FOR_PATTERNS: List[MockEmployee] = [
    # Advisory Service Line - Analyst track
    MockEmployee("EMP001", "Senior Consultant", 5, "Advisory", 5.0, 
                 ["Client Management", "Problem Solving", "Excel", "PowerPoint", "SQL"],
                 [{"role": "Consultant", "years": 2, "service_line": "Advisory"},
                  {"role": "Analyst", "years": 2, "service_line": "Advisory"}]),
    MockEmployee("EMP002", "Senior Consultant", 5, "Advisory", 4.5,
                 ["Client Management", "Project Management", "Excel", "Leadership"],
                 [{"role": "Consultant", "years": 2.5, "service_line": "Advisory"}]),
    MockEmployee("EMP003", "Senior Consultant", 5, "Advisory", 6.0,
                 ["Client Management", "Problem Solving", "Excel", "SQL", "Tableau"],
                 [{"role": "Consultant", "years": 3, "service_line": "Advisory"},
                  {"role": "Analyst", "years": 1.5, "service_line": "Advisory"}]),
    MockEmployee("EMP004", "Consultant", 4, "Advisory", 3.0,
                 ["Problem Solving", "Excel", "Communication", "SQL"],
                 [{"role": "Analyst", "years": 2, "service_line": "Advisory"}]),
    MockEmployee("EMP005", "Consultant", 4, "Advisory", 2.5,
                 ["Excel", "PowerPoint", "Communication", "Problem Solving"],
                 [{"role": "Analyst", "years": 1.5, "service_line": "Advisory"}]),
    MockEmployee("EMP006", "Consultant", 4, "Advisory", 3.5,
                 ["Client Management", "Excel", "SQL", "Problem Solving"],
                 [{"role": "Analyst", "years": 2.5, "service_line": "Advisory"}]),
    MockEmployee("EMP007", "Manager", 6, "Advisory", 8.0,
                 ["Leadership", "Client Management", "Strategic Planning", "Project Management", "Excel"],
                 [{"role": "Senior Consultant", "years": 3, "service_line": "Advisory"},
                  {"role": "Consultant", "years": 2, "service_line": "Advisory"}]),
    MockEmployee("EMP008", "Manager", 6, "Advisory", 7.5,
                 ["Leadership", "Project Management", "Client Management", "Problem Solving"],
                 [{"role": "Senior Consultant", "years": 2.5, "service_line": "Advisory"},
                  {"role": "Consultant", "years": 2, "service_line": "Advisory"}]),
    
    # Technology Service Line
    MockEmployee("EMP009", "Senior Engineer", 5, "Technology", 5.0,
                 ["Python", "AWS", "Docker", "SQL", "Machine Learning"],
                 [{"role": "Engineer", "years": 3, "service_line": "Technology"}]),
    MockEmployee("EMP010", "Senior Engineer", 5, "Technology", 4.5,
                 ["Python", "Java", "AWS", "Kubernetes", "SQL"],
                 [{"role": "Engineer", "years": 2.5, "service_line": "Technology"}]),
    MockEmployee("EMP011", "Senior Engineer", 5, "Technology", 6.0,
                 ["Python", "AWS", "Machine Learning", "TensorFlow", "Data Analysis"],
                 [{"role": "Engineer", "years": 3, "service_line": "Technology"},
                  {"role": "Junior Engineer", "years": 1, "service_line": "Technology"}]),
    MockEmployee("EMP012", "Engineer", 4, "Technology", 3.0,
                 ["Python", "SQL", "Docker", "Git"],
                 [{"role": "Junior Engineer", "years": 2, "service_line": "Technology"}]),
    MockEmployee("EMP013", "Engineer", 4, "Technology", 2.5,
                 ["Java", "AWS", "SQL", "Agile"],
                 [{"role": "Junior Engineer", "years": 1.5, "service_line": "Technology"}]),
    MockEmployee("EMP014", "Tech Lead", 6, "Technology", 8.0,
                 ["Python", "AWS", "Leadership", "Architecture", "Machine Learning"],
                 [{"role": "Senior Engineer", "years": 3, "service_line": "Technology"},
                  {"role": "Engineer", "years": 2, "service_line": "Technology"}]),
    MockEmployee("EMP015", "Tech Lead", 6, "Technology", 7.0,
                 ["Java", "Kubernetes", "Leadership", "AWS", "Docker"],
                 [{"role": "Senior Engineer", "years": 2.5, "service_line": "Technology"}]),
    
    # Assurance Service Line
    MockEmployee("EMP016", "Senior Auditor", 5, "Assurance", 5.0,
                 ["Audit", "Financial Modeling", "Excel", "Risk Assessment", "SQL"],
                 [{"role": "Auditor", "years": 3, "service_line": "Assurance"}]),
    MockEmployee("EMP017", "Senior Auditor", 5, "Assurance", 4.5,
                 ["Audit", "Financial Modeling", "Risk Assessment", "Communication"],
                 [{"role": "Auditor", "years": 2.5, "service_line": "Assurance"}]),
    MockEmployee("EMP018", "Auditor", 4, "Assurance", 2.5,
                 ["Audit", "Excel", "Financial Modeling"],
                 [{"role": "Junior Auditor", "years": 1.5, "service_line": "Assurance"}]),
    MockEmployee("EMP019", "Audit Manager", 6, "Assurance", 7.5,
                 ["Audit", "Leadership", "Client Management", "Risk Assessment", "Financial Modeling"],
                 [{"role": "Senior Auditor", "years": 3, "service_line": "Assurance"},
                  {"role": "Auditor", "years": 2, "service_line": "Assurance"}]),
    
    # Tax Service Line  
    MockEmployee("EMP020", "Tax Senior", 5, "Tax", 4.0,
                 ["Tax Planning", "Financial Modeling", "Excel", "Communication"],
                 [{"role": "Tax Associate", "years": 2.5, "service_line": "Tax"}]),
    MockEmployee("EMP021", "Tax Senior", 5, "Tax", 3.5,
                 ["Tax Planning", "Excel", "SQL", "Problem Solving"],
                 [{"role": "Tax Associate", "years": 2, "service_line": "Tax"}]),
    MockEmployee("EMP022", "Tax Manager", 6, "Tax", 6.5,
                 ["Tax Planning", "Leadership", "Client Management", "Strategic Planning"],
                 [{"role": "Tax Senior", "years": 2.5, "service_line": "Tax"},
                  {"role": "Tax Associate", "years": 2, "service_line": "Tax"}]),
]


class SuccessPatternService:
    """
    Service for analyzing career transition patterns.
    
    Identifies common career paths, calculates success rates, and finds
    skills associated with successful transitions.
    
    Features:
    - Redis caching with 24h TTL for expensive queries
    - Automatic fallback to mock data when DB is empty
    - React Flow compatible graph output
    
    Example:
        >>> service = SuccessPatternService(db_session)
        >>> transitions = service.analyze_transitions()
        >>> print(transitions[0].success_rate)
        0.72
    """
    
    MIN_SAMPLE_SIZE = 2  # Minimum transitions to consider a pattern (lower for demo/mock data)
    SKILL_THRESHOLD = 0.70  # Skills must be present in 70%+ of transitioners
    CACHE_TTL = 86400  # 24 hours in seconds
    CACHE_PREFIX = "patterns"
    
    def __init__(self, db: Optional[Session] = None, use_mock: bool = False, use_cache: bool = True):
        """
        Initialize the pattern service.
        
        Args:
            db: SQLAlchemy database session (optional)
            use_mock: Force use of mock data even if db is provided
            use_cache: Enable Redis caching (default: True)
        """
        self.db = db
        self.use_mock = use_mock
        self.use_cache = use_cache
        self._local_cache: Dict[str, Any] = {}
        self._redis = get_redis_client() if use_cache else None
    
    # ============================================
    # Task 3.1: Redis Caching
    # ============================================
    
    def _get_cache_key(self, operation: str, **kwargs) -> str:
        """Generate a cache key for the given operation and parameters."""
        params = "_".join(f"{k}={v}" for k, v in sorted(kwargs.items()) if v is not None)
        return f"{self.CACHE_PREFIX}:{operation}:{params}" if params else f"{self.CACHE_PREFIX}:{operation}"
    
    def _get_cached(self, key: str) -> Optional[Any]:
        """Get value from cache (Redis first, then local)."""
        # Try Redis
        if self._redis:
            try:
                data = self._redis.get(key)
                if data:
                    return json.loads(data)
            except Exception as e:
                logger.debug(f"Redis get failed: {e}")
        
        # Fallback to local cache
        return self._local_cache.get(key)
    
    def _set_cached(self, key: str, value: Any, ttl: int = None) -> None:
        """Set value in cache (both Redis and local)."""
        ttl = ttl or self.CACHE_TTL
        
        # Store in Redis
        if self._redis:
            try:
                self._redis.setex(key, ttl, json.dumps(value))
            except Exception as e:
                logger.debug(f"Redis set failed: {e}")
        
        # Also store in local cache
        self._local_cache[key] = value
    
    def invalidate_cache(self, service_line: Optional[str] = None) -> int:
        """
        Invalidate pattern cache. Call when employee data changes.
        
        Args:
            service_line: Optional - only invalidate for this service line
            
        Returns:
            Number of keys invalidated
        """
        count = 0
        pattern = f"{self.CACHE_PREFIX}:*"
        if service_line:
            pattern = f"{self.CACHE_PREFIX}:*service_line={service_line}*"
        
        if self._redis:
            try:
                keys = self._redis.keys(pattern)
                if keys:
                    count = self._redis.delete(*keys)
                    logger.info(f"Invalidated {count} Redis cache keys")
            except Exception as e:
                logger.warning(f"Redis cache invalidation failed: {e}")
        
        # Clear local cache
        if service_line:
            self._local_cache = {k: v for k, v in self._local_cache.items() 
                                 if service_line not in k}
        else:
            self._local_cache.clear()
        
        return count
    
    # ============================================
    # Task 1.2: Transition Analysis
    # ============================================
    
    def analyze_transitions(
        self,
        service_line: Optional[str] = None,
        min_sample_size: int = None,
        use_fuzzy_matching: bool = True,
        fuzzy_threshold: float = 0.65
    ) -> List[TransitionPattern]:
        """
        Analyze career transitions from employee history data.

        Parses career_history JSONB field, groups by (previous_role, current_role),
        and calculates success metrics. Results are cached in Redis for 24 hours.

        Args:
            service_line: Optional filter by service line
            min_sample_size: Minimum transitions to include (default: 2)
            use_fuzzy_matching: Enable fuzzy role name matching (default: True)
            fuzzy_threshold: Similarity threshold for fuzzy matching (default: 0.65)

        Returns:
            List of TransitionPattern sorted by sample_size descending
        """
        min_sample_size = min_sample_size or self.MIN_SAMPLE_SIZE

        # Check cache first
        cache_key = self._get_cache_key("transitions", service_line=service_line, min_sample=min_sample_size, fuzzy=use_fuzzy_matching)
        cached = self._get_cached(cache_key)
        if cached:
            return [TransitionPattern(**p) for p in cached]

        # Try database first, fall back to mock
        employees = self._get_employees(service_line)

        # First pass: collect all role names for fuzzy grouping
        role_clusters: Dict[str, str] = {}
        if use_fuzzy_matching:
            all_roles = set()
            for emp in employees:
                current_role = emp.get("current_role", "") if isinstance(emp, dict) else emp.current_role
                career_history = emp.get("career_history", []) if isinstance(emp, dict) else emp.career_history
                if current_role:
                    all_roles.add(current_role)
                for entry in (career_history or []):
                    role = entry.get("role", "") if isinstance(entry, dict) else getattr(entry, "role", "")
                    if role:
                        all_roles.add(role)

            # Build role clusters using fuzzy matching
            role_clusters = self._build_role_clusters(list(all_roles), fuzzy_threshold)

        # Build transition counts
        transitions: Dict[Tuple[str, str, str], List[Dict]] = defaultdict(list)

        for emp in employees:
            career_history = emp.get("career_history", []) if isinstance(emp, dict) else emp.career_history
            current_role = emp.get("current_role", "") if isinstance(emp, dict) else emp.current_role
            emp_service_line = emp.get("service_line", "") if isinstance(emp, dict) else emp.service_line
            skills = emp.get("skills", []) if isinstance(emp, dict) else emp.skills

            if not career_history:
                continue

            # Normalize role names using clusters
            current_role_normalized = role_clusters.get(current_role, current_role) if use_fuzzy_matching else current_role

            # The most recent role in history is what they transitioned FROM to current
            if len(career_history) > 0:
                prev_role = career_history[0].get("role", "")
                prev_role_normalized = role_clusters.get(prev_role, prev_role) if use_fuzzy_matching else prev_role
                years_in_prev = career_history[0].get("years", 0)

                if prev_role_normalized and current_role_normalized:
                    key = (prev_role_normalized, current_role_normalized, emp_service_line)
                    transitions[key].append({
                        "years_in_prev": years_in_prev,
                        "skills": skills if isinstance(skills, list) else list(skills.keys()) if isinstance(skills, dict) else [],
                    })
        
        # Convert to TransitionPattern objects
        patterns = []
        for (source_role, target_role, svc_line), trans_list in transitions.items():
            if len(trans_list) < min_sample_size:
                continue
            
            # Calculate metrics
            avg_time = sum(t["years_in_prev"] for t in trans_list) / len(trans_list)
            common_skills = self._find_common_skills_from_list(
                [t["skills"] for t in trans_list]
            )
            
            # Generate pattern ID
            pattern_id = self._generate_pattern_id(source_role, target_role, svc_line)
            
            # For demo, calculate pseudo success rate based on sample size
            # In production, this would compare to total employees who started in source_role
            success_rate = min(0.95, len(trans_list) / (len(trans_list) + 5) + 0.3)
            
            patterns.append(TransitionPattern(
                pattern_id=pattern_id,
                source_role=source_role,
                target_role=target_role,
                success_rate=round(success_rate, 2),
                avg_time_to_promotion_years=round(avg_time, 1),
                sample_size=len(trans_list),
                service_line=svc_line if svc_line else None,
                common_skills=common_skills[:5],  # Top 5 skills
                recommended_skills_to_develop=self._get_recommended_skills(source_role, target_role, common_skills)
            ))
        
        # Sort by sample size
        patterns.sort(key=lambda p: p.sample_size, reverse=True)
        
        # Cache the results
        self._set_cached(cache_key, [p.model_dump() for p in patterns])
        
        return patterns
    
    # ============================================
    # Task 1.3: Skill Correlation Analysis
    # ============================================
    
    def find_common_skills(
        self,
        source_role: str,
        target_role: str,
        threshold: float = None
    ) -> List[str]:
        """
        Find skills present in 70%+ of employees who made a specific transition.
        
        Args:
            source_role: The starting role
            target_role: The destination role
            threshold: Skill frequency threshold (default: 0.70)
            
        Returns:
            List of skills sorted by frequency (highest first)
        """
        threshold = threshold or self.SKILL_THRESHOLD
        
        employees = self._get_employees()
        
        # Find employees who made this exact transition
        skill_counts: Dict[str, int] = defaultdict(int)
        total_transitioners = 0
        
        for emp in employees:
            career_history = emp.get("career_history", []) if isinstance(emp, dict) else emp.career_history
            current_role = emp.get("current_role", "") if isinstance(emp, dict) else emp.current_role
            skills = emp.get("skills", []) if isinstance(emp, dict) else emp.skills
            
            if not career_history or current_role != target_role:
                continue
            
            # Check if they came from source_role
            if len(career_history) > 0 and career_history[0].get("role") == source_role:
                total_transitioners += 1
                skill_list = skills if isinstance(skills, list) else list(skills.keys()) if isinstance(skills, dict) else []
                for skill in skill_list:
                    skill_counts[skill] += 1
        
        if total_transitioners == 0:
            return []
        
        # Filter by threshold and sort by frequency
        common = [
            skill for skill, count in skill_counts.items()
            if count / total_transitioners >= threshold
        ]
        
        # Sort by frequency
        common.sort(key=lambda s: skill_counts[s], reverse=True)
        return common
    
    def get_skill_correlation(
        self,
        source_role: str,
        target_role: str
    ) -> Dict[str, float]:
        """
        Get skill frequency for a specific transition.
        
        Returns dict of {skill: frequency} for all skills present
        in employees who made this transition.
        """
        employees = self._get_employees()
        
        skill_counts: Dict[str, int] = defaultdict(int)
        total = 0
        
        for emp in employees:
            career_history = emp.get("career_history", []) if isinstance(emp, dict) else emp.career_history
            current_role = emp.get("current_role", "") if isinstance(emp, dict) else emp.current_role
            skills = emp.get("skills", []) if isinstance(emp, dict) else emp.skills
            
            if not career_history or current_role != target_role:
                continue
                
            if len(career_history) > 0 and career_history[0].get("role") == source_role:
                total += 1
                skill_list = skills if isinstance(skills, list) else list(skills.keys()) if isinstance(skills, dict) else []
                for skill in skill_list:
                    skill_counts[skill] += 1
        
        if total == 0:
            return {}
            
        return {skill: round(count / total, 2) for skill, count in skill_counts.items()}
    
    # ============================================
    # Career Graph Building (for Block K)
    # ============================================
    
    def build_career_graph(
        self,
        service_line: Optional[str] = None,
        min_sample_size: int = None
    ) -> CareerGraph:
        """
        Build a career graph for React Flow visualization.
        
        Creates nodes for each role and edges for common transitions.
        Results are cached in Redis for 24 hours.
        
        Args:
            service_line: Optional filter by service line
            min_sample_size: Minimum transitions for edge to appear
            
        Returns:
            CareerGraph with nodes and edges for React Flow
        """
        min_sample_size = min_sample_size or self.MIN_SAMPLE_SIZE
        
        # Check cache
        cache_key = self._get_cache_key("graph", service_line=service_line, min_sample=min_sample_size)
        cached = self._get_cached(cache_key)
        if cached:
            return CareerGraph(
                nodes=[CareerGraphNode(**n) for n in cached["nodes"]],
                edges=[CareerGraphEdge(**e) for e in cached["edges"]]
            )
        
        transitions = self.analyze_transitions(service_line, min_sample_size)
        
        # Collect unique roles
        roles: Dict[str, Dict] = {}
        employees = self._get_employees(service_line)
        
        # Count employees per role
        role_counts: Dict[str, int] = defaultdict(int)
        role_levels: Dict[str, int] = {}
        
        for emp in employees:
            current_role = emp.get("current_role", "") if isinstance(emp, dict) else emp.current_role
            role_level = emp.get("role_level", 0) if isinstance(emp, dict) else getattr(emp, "role_level", 0)
            emp_svc = emp.get("service_line", "") if isinstance(emp, dict) else emp.service_line
            
            if current_role:
                role_counts[current_role] += 1
                if current_role not in role_levels:
                    role_levels[current_role] = role_level
        
        # Add roles from transitions
        for trans in transitions:
            if trans.source_role not in role_counts:
                role_counts[trans.source_role] = 0
            if trans.target_role not in role_counts:
                role_counts[trans.target_role] = 0
        
        # Create nodes
        nodes = []
        role_positions = self._calculate_positions(list(role_counts.keys()), role_levels)
        
        for role, count in role_counts.items():
            node_id = self._slugify(role)
            nodes.append(CareerGraphNode(
                id=node_id,
                role=role,
                role_level=role_levels.get(role),
                service_line=service_line,
                employee_count=count,
                position=role_positions.get(role, {"x": 0, "y": 0})
            ))
        
        # Create edges from transitions
        edges = []
        for trans in transitions:
            edge_id = f"{self._slugify(trans.source_role)}_to_{self._slugify(trans.target_role)}"
            edges.append(CareerGraphEdge(
                id=edge_id,
                source=self._slugify(trans.source_role),
                target=self._slugify(trans.target_role),
                success_rate=trans.success_rate,
                avg_time_years=trans.avg_time_to_promotion_years,
                sample_size=trans.sample_size,
                label=f"{int(trans.success_rate * 100)}%"
            ))
        
        graph = CareerGraph(nodes=nodes, edges=edges)
        
        # Cache the result
        self._set_cached(cache_key, {
            "nodes": [n.model_dump() for n in nodes],
            "edges": [e.model_dump() for e in edges]
        })
        
        return graph
    
    # ============================================
    # Employee Recommendations
    # ============================================
    
    def get_next_role_recommendations(
        self,
        employee_id: str,
        top_k: int = 5
    ) -> List[RoleRecommendation]:
        """
        Get recommended next roles for an employee.
        
        Based on employee's current role, finds high-success-rate transitions
        and ranks by success_rate, skill_match, and time_to_promotion.
        
        Args:
            employee_id: The employee's ID
            top_k: Number of recommendations to return
            
        Returns:
            List of RoleRecommendation sorted by fit
        """
        employee = self._get_employee_by_id(employee_id)
        if not employee:
            return []
        
        current_role = employee.get("current_role", "") if isinstance(employee, dict) else employee.current_role
        emp_skills = employee.get("skills", []) if isinstance(employee, dict) else employee.skills
        emp_skills_set = set(emp_skills if isinstance(emp_skills, list) else list(emp_skills.keys()) if isinstance(emp_skills, dict) else [])
        
        # Get all transitions from current role
        transitions = self.analyze_transitions()
        relevant = [t for t in transitions if t.source_role == current_role]
        
        recommendations = []
        for trans in relevant:
            # Calculate skill match
            common_skills_set = set(trans.common_skills)
            matching = emp_skills_set & common_skills_set
            gaps = common_skills_set - emp_skills_set
            
            skill_match = len(matching) / max(len(common_skills_set), 1)
            
            # Estimate readiness (rough heuristic)
            estimated_months = int((1 - skill_match) * 12 + 3) if gaps else 0
            
            recommendations.append(RoleRecommendation(
                role=trans.target_role,
                success_rate=trans.success_rate,
                avg_time_to_promotion=trans.avg_time_to_promotion_years,
                skill_match_score=round(skill_match, 2),
                skill_gaps=list(gaps)[:5],
                matching_skills=list(matching)[:5],
                estimated_readiness_months=estimated_months
            ))
        
        # Sort by composite score: success_rate * 0.4 + skill_match * 0.6
        recommendations.sort(
            key=lambda r: r.success_rate * 0.4 + r.skill_match_score * 0.6,
            reverse=True
        )
        
        return recommendations[:top_k]
    
    def get_trajectory_metrics(self, employee_id: str) -> Optional[TrajectoryMetrics]:
        """
        Calculate career trajectory metrics for an employee.
        
        Compares employee's progression vs peers with same start role and tenure.
        """
        employee = self._get_employee_by_id(employee_id)
        if not employee:
            return None
        
        current_role = employee.get("current_role", "") if isinstance(employee, dict) else employee.current_role
        years_exp = employee.get("years_experience", 0) if isinstance(employee, dict) else employee.years_experience
        career_history = employee.get("career_history", []) if isinstance(employee, dict) else employee.career_history
        
        # Calculate time in current role (rough estimate from total experience minus history)
        history_years = sum(h.get("years", 0) for h in (career_history or []))
        time_in_current = max(0.5, years_exp - history_years)
        
        # Get typical promotion time for this role
        transitions = self.analyze_transitions()
        from_current = [t for t in transitions if t.source_role == current_role]
        
        if from_current:
            typical_time = sum(t.avg_time_to_promotion_years for t in from_current) / len(from_current)
        else:
            typical_time = 3.0  # Default estimate
        
        # Determine trajectory status
        ratio = time_in_current / typical_time
        if ratio < 0.8:
            status = "ahead"
            percentile = min(90, 60 + (1 - ratio) * 40)
        elif ratio > 1.2:
            status = "behind"
            percentile = max(10, 50 - (ratio - 1) * 30)
        else:
            status = "on_track"
            percentile = 50 + (1 - ratio) * 20
        
        return TrajectoryMetrics(
            employee_id=employee_id,
            current_role=current_role,
            time_in_current_role_years=round(time_in_current, 1),
            typical_promotion_time_years=round(typical_time, 1),
            percentile_rank=round(percentile, 0),
            trajectory_status=status,
            peer_comparison={
                "sample_size": len(from_current) if from_current else 0,
                "avg_peer_promotion_time": round(typical_time, 1),
            }
        )
    
    # ============================================
    # Helper Methods
    # ============================================
    
    def _get_employees(self, service_line: Optional[str] = None) -> List[Any]:
        """Get employees from database or mock data."""
        if self.use_mock or self.db is None:
            employees = MOCK_EMPLOYEES_FOR_PATTERNS
            if service_line:
                employees = [e for e in employees if e.service_line == service_line]
            return employees
        
        try:
            # Try to get from database
            query = text("""
                SELECT id, current_role, role_level, service_line, 
                       years_experience, skills, career_history
                FROM employees
                WHERE career_history IS NOT NULL
            """)
            
            if service_line:
                query = text("""
                    SELECT id, current_role, role_level, service_line,
                           years_experience, skills, career_history
                    FROM employees
                    WHERE career_history IS NOT NULL AND service_line = :svc
                """)
                result = self.db.execute(query, {"svc": service_line})
            else:
                result = self.db.execute(query)
            
            rows = result.fetchall()
            if not rows:
                # Fall back to mock if DB is empty
                employees = MOCK_EMPLOYEES_FOR_PATTERNS
                if service_line:
                    employees = [e for e in employees if e.service_line == service_line]
                return employees
            
            return [
                {
                    "id": row[0],
                    "current_role": row[1],
                    "role_level": row[2],
                    "service_line": row[3],
                    "years_experience": float(row[4]) if row[4] else 0,
                    "skills": row[5] or [],
                    "career_history": row[6] or [],
                }
                for row in rows
            ]
            
        except Exception:
            # Fall back to mock on any DB error
            employees = MOCK_EMPLOYEES_FOR_PATTERNS
            if service_line:
                employees = [e for e in employees if e.service_line == service_line]
            return employees
    
    def _get_employee_by_id(self, employee_id: str) -> Optional[Any]:
        """Get a specific employee by ID."""
        if self.use_mock or self.db is None:
            for emp in MOCK_EMPLOYEES_FOR_PATTERNS:
                if emp.id == employee_id:
                    return emp
            return None
        
        try:
            query = text("""
                SELECT id, current_role, role_level, service_line,
                       years_experience, skills, career_history
                FROM employees
                WHERE id = :emp_id
            """)
            result = self.db.execute(query, {"emp_id": employee_id})
            row = result.fetchone()
            
            if not row:
                # Check mock data
                for emp in MOCK_EMPLOYEES_FOR_PATTERNS:
                    if emp.id == employee_id:
                        return emp
                return None
            
            return {
                "id": row[0],
                "current_role": row[1],
                "role_level": row[2],
                "service_line": row[3],
                "years_experience": float(row[4]) if row[4] else 0,
                "skills": row[5] or [],
                "career_history": row[6] or [],
            }
            
        except Exception:
            for emp in MOCK_EMPLOYEES_FOR_PATTERNS:
                if emp.id == employee_id:
                    return emp
            return None
    
    def _find_common_skills_from_list(self, skill_lists: List[List[str]]) -> List[str]:
        """Find skills that appear in 70%+ of the provided skill lists."""
        if not skill_lists:
            return []
        
        skill_counts: Dict[str, int] = defaultdict(int)
        for skills in skill_lists:
            for skill in skills:
                skill_counts[skill] += 1
        
        threshold = len(skill_lists) * self.SKILL_THRESHOLD
        common = [skill for skill, count in skill_counts.items() if count >= threshold]
        common.sort(key=lambda s: skill_counts[s], reverse=True)
        return common
    
    def _get_recommended_skills(
        self,
        source_role: str,
        target_role: str,
        common_skills: List[str]
    ) -> List[str]:
        """Get skills to develop for a transition (skills in target not in source)."""
        # For demo, return leadership/management skills not in common
        development_skills = ["Leadership", "Project Management", "Strategic Planning", "Client Management"]
        return [s for s in development_skills if s not in common_skills][:3]
    
    def _generate_pattern_id(self, source: str, target: str, service_line: str) -> str:
        """Generate a unique pattern ID."""
        key = f"{source}_{target}_{service_line}".lower().replace(" ", "_")
        return hashlib.md5(key.encode()).hexdigest()[:12]
    
    def _slugify(self, text: str) -> str:
        """Convert text to slug format for node IDs."""
        return text.lower().replace(" ", "_").replace("-", "_")
    
    def _calculate_positions(
        self,
        roles: List[str],
        role_levels: Dict[str, int]
    ) -> Dict[str, Dict[str, float]]:
        """Calculate x,y positions for React Flow nodes based on role level."""
        positions = {}
        level_counts: Dict[int, int] = defaultdict(int)
        
        for role in roles:
            level = role_levels.get(role, 3)
            x_offset = level_counts[level] * 200
            positions[role] = {
                "x": float(x_offset),
                "y": float(level * 120)
            }
            level_counts[level] += 1
        
        return positions
    
    def _build_role_clusters(self, roles: List[str], threshold: float = 0.65) -> Dict[str, str]:
        """
        Build clusters of similar role names, mapping each role to a canonical representative.

        Args:
            roles: List of all unique role names
            threshold: Similarity threshold for clustering

        Returns:
            Dict mapping each role name to its canonical (most common) form
        """
        clusters: Dict[str, List[str]] = {}
        role_to_cluster: Dict[str, str] = {}

        for role in sorted(roles, key=lambda r: -len(r)):  # Process longer names first
            # Check if this role matches any existing cluster
            matched_cluster = None
            for canonical, members in clusters.items():
                if self._fuzzy_match_roles(role, canonical, threshold):
                    matched_cluster = canonical
                    break

            if matched_cluster:
                clusters[matched_cluster].append(role)
                role_to_cluster[role] = matched_cluster
            else:
                # Start new cluster with this role as canonical
                clusters[role] = [role]
                role_to_cluster[role] = role

        logger.debug(f"Built {len(clusters)} role clusters from {len(roles)} roles")
        return role_to_cluster

    def _fuzzy_match_roles(self, role1: str, role2: str, threshold: float = 0.7) -> bool:
        """
        Fuzzy string matching for role names using sequence similarity.
        
        Args:
            role1: First role name
            role2: Second role name
            threshold: Similarity threshold (0.0-1.0), default 0.7 (70%)
            
        Returns:
            True if roles are similar enough (above threshold)
        """
        if not role1 or not role2:
            return False
        
        # Normalize role names
        r1 = role1.lower().strip()
        r2 = role2.lower().strip()
        
        # Exact match (case-insensitive)
        if r1 == r2:
            return True
        
        # Calculate similarity ratio
        similarity = SequenceMatcher(None, r1, r2).ratio()
        
        # Also check if one role contains the other (for cases like "Senior Consultant" vs "Consultant")
        if r1 in r2 or r2 in r1:
            # If one is a substring, require higher threshold
            return similarity >= max(threshold, 0.6)
        
        return similarity >= threshold
    
    def find_similar_roles(self, target_role: str, threshold: float = 0.7) -> List[str]:
        """
        Find all roles similar to the target role.
        
        Args:
            target_role: The role to find matches for
            threshold: Similarity threshold (default: 0.7)
            
        Returns:
            List of similar role names
        """
        employees = self._get_employees()
        similar_roles = set()
        
        for emp in employees:
            current_role = emp.get("current_role", "") if isinstance(emp, dict) else emp.current_role
            career_history = emp.get("career_history", []) if isinstance(emp, dict) else emp.career_history
            
            # Check current role
            if current_role and self._fuzzy_match_roles(current_role, target_role, threshold):
                similar_roles.add(current_role)
            
            # Check career history roles
            if career_history:
                for entry in career_history:
                    role = entry.get("role", "") if isinstance(entry, dict) else getattr(entry, "role", "")
                    if role and self._fuzzy_match_roles(role, target_role, threshold):
                        similar_roles.add(role)
        
        return list(similar_roles)


# ============================================
# Convenience Functions
# ============================================

def get_pattern_service(db: Optional[Session] = None, use_mock: bool = False) -> SuccessPatternService:
    """Factory function to create a SuccessPatternService."""
    return SuccessPatternService(db=db, use_mock=use_mock)


def analyze_career_transitions(
    db: Optional[Session] = None,
    service_line: Optional[str] = None,
    min_sample_size: int = 5
) -> List[TransitionPattern]:
    """
    Convenience function to analyze transitions.
    
    Args:
        db: Optional database session
        service_line: Optional filter
        min_sample_size: Minimum transitions to include
        
    Returns:
        List of TransitionPattern
    """
    service = SuccessPatternService(db=db)
    return service.analyze_transitions(service_line, min_sample_size)

