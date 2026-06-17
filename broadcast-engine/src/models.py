"""Data models for broadcast script generation."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class EnrichedNewsItem(BaseModel):
    """A news item enriched by Horizon, as loaded from the JSON export."""

    id: str
    source_type: str
    title: str
    url: str
    content: Optional[str] = None
    author: Optional[str] = None
    published_at: Optional[str] = None
    metadata: dict[str, Any] = {}
    ai_score: Optional[float] = None
    ai_reason: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_tags: list[str] = []


class BroadcastScript(BaseModel):
    """A complete broadcast script."""

    date: str
    title: str
    body: str
    estimated_duration_seconds: int
    item_count: int
    generated_at: str = ""