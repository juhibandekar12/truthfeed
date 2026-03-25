from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ─── Auth Models ─────────────────────────────────────────

class SignupRequest(BaseModel):
    """Payload for creating a new user account."""
    username: str = Field(..., min_length=3, max_length=30)
    email: str
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    """Payload for authenticating with email + password."""
    email: str
    password: str


class TokenResponse(BaseModel):
    """JWT access token returned after login/signup."""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """Public-facing user profile data."""
    id: str
    username: str
    email: str
    role: str
    trust_score: int
    created_at: datetime


# ─── News Models ─────────────────────────────────────────

class NewsPostRequest(BaseModel):
    """Payload for submitting a news article."""
    title: str = Field(..., min_length=5, max_length=300)
    content: str = Field(..., min_length=50)
    category: str


class NewsResponse(BaseModel):
    """Full news article as returned by the API."""
    id: str
    title: str
    content: str
    author_id: str
    author_name: str
    category: str
    is_real: bool
    bert_confidence: float
    fake_prob: float
    real_prob: float
    upvotes: int = 0
    downvotes: int = 0
    is_auto_collected: bool = False
    created_at: datetime


class NewsPostResult(BaseModel):
    """Result returned after the AI moderation pipeline."""
    status: str
    message: str
    is_real: Optional[bool] = None
    confidence: Optional[float] = None
    real_prob: Optional[float] = None
    fake_prob: Optional[float] = None
    similarity: Optional[float] = None
    news_id: Optional[str] = None


# ─── Comment Models ──────────────────────────────────────

class CommentRequest(BaseModel):
    """Payload for posting a comment on an article."""
    content: str = Field(..., min_length=1, max_length=1000)


class CommentResponse(BaseModel):
    """A single comment as returned by the API."""
    id: str
    news_id: str
    author_id: str
    author_name: str
    content: str
    created_at: datetime


# ─── Engagement Models ───────────────────────────────────

class VoteResponse(BaseModel):
    """Result of an upvote/downvote toggle."""
    message: str
    upvotes: int
    downvotes: int


class BookmarkResponse(BaseModel):
    """Result of a bookmark toggle."""
    message: str
    bookmarked: bool


# ─── Admin Models ────────────────────────────────────────

class DashboardStats(BaseModel):
    """Aggregate statistics for the admin dashboard."""
    total_articles: int
    real_count: int
    fake_count: int
    real_percentage: float
    fake_percentage: float
    total_users: int
    auto_collected_count: int


class AnalyticsData(BaseModel):
    """Analytics data for admin charts."""
    category_distribution: list
    daily_submissions: list
    fake_vs_real: dict
