"""
Pydantic schemas for Badge Discovery & Integration System.

Per architecture Section 2.4.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class BadgeResponse(BaseModel):
    """Single badge in API responses."""
    id: str
    name: str
    issuer: str
    platform: str
    url: str
    image_url: Optional[str] = None
    skills: List[str] = []
    difficulty_level: Optional[str] = None
    estimated_cost_usd: Optional[float] = None
    estimated_hours: Optional[int] = None
    renewal_months: Optional[int] = None
    relevance_score: float = 0.0
    mapping_source: str = "curated"


class BadgeDiscoverResponse(BaseModel):
    """Paginated badge discovery response."""
    badges: List[BadgeResponse] = []
    total_count: int = 0
    page: int = 1
    per_page: int = 20
    skills_queried: List[str] = []


class BadgeInteractionRequest(BaseModel):
    """Record a user interaction with a badge."""
    badge_id: str
    interaction_type: str = Field(..., pattern="^(click|thumbs_up|thumbs_down)$")
    source: str = Field(..., pattern="^(skill_module|roadmap|search)$")


class BadgeEarnedRequest(BaseModel):
    """Mark a badge as earned."""
    badge_id: str
    earned_date: Optional[datetime] = None


class BadgeAnalyticsResponse(BaseModel):
    """Admin analytics for badge suggestions."""
    total_badges: int
    total_interactions: int
    click_through_rates: dict = {}
    top_clicked_badges: List[dict] = []
    relevance_ratings: dict = {"positive": 0, "negative": 0}
    flagged_badges: List[dict] = []


class BadgeCatalogSearchResponse(BaseModel):
    """Search results for badge catalog."""
    results: List[BadgeResponse] = []
    count: int = 0
