from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class PerformanceMetrics(BaseModel):
    """Type-safe schema for employee performance_metrics JSONB field."""

    utilization: float = Field(ge=0, le=100)
    billing_rate: float = Field(ge=0, le=500)
    realization: float = Field(ge=0, le=100)
    quality_score: float = Field(ge=1.0, le=5.0)
    training_hours: int = Field(ge=0, le=120)
    client_feedback: float = Field(ge=1.0, le=5.0)


class MatchScores(BaseModel):
    """Type-safe schema for match score breakdown fields."""

    overall_score: float = Field(ge=0.0, le=1.0)
    skill_match_score: float = Field(ge=0.0, le=1.0)
    experience_score: float = Field(ge=0.0, le=1.0)
    role_fit_score: float = Field(ge=0.0, le=1.0)


class ReactFlowNode(BaseModel):
    """Minimal React Flow node schema."""

    model_config = ConfigDict(extra="allow")

    id: str
    type: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)
    position: Dict[str, float] = Field(default_factory=dict)


class ReactFlowEdge(BaseModel):
    """Minimal React Flow edge schema."""

    model_config = ConfigDict(extra="allow")

    id: str
    source: str
    target: str
    label: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)


class ReactFlowGraph(BaseModel):
    """Type-safe schema for React Flow graph data JSONB field."""

    nodes: List[ReactFlowNode] = Field(default_factory=list)
    edges: List[ReactFlowEdge] = Field(default_factory=list)
