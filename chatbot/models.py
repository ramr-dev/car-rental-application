"""
models.py — Pydantic request/response schemas for the DriveLux chatbot API.
These define the shape of data exchanged between the React frontend and this service.
"""

from pydantic import BaseModel, Field
from typing import Optional
import uuid


class ChatRequest(BaseModel):
    """Incoming chat message from the frontend."""

    message: str = Field(..., min_length=1, max_length=2000, description="User's message")
    session_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique session ID per browser tab — maintains conversation context",
    )
    user_id: Optional[int] = Field(
        default=None,
        description="Authenticated user's ID (optional — allows booking lookups)",
    )
    user_email: Optional[str] = Field(
        default=None,
        description="Authenticated user's email (optional)",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "message": "What is the status of my booking?",
                "session_id": "abc123",
                "user_id": 42,
                "user_email": "customer@example.com",
            }
        }


class ChatResponse(BaseModel):
    """Response sent back to the frontend."""

    reply: str = Field(..., description="AI assistant's reply")
    session_id: str = Field(..., description="Echo back the session ID")
    sources: Optional[list[str]] = Field(
        default=None,
        description="Tools/data sources consulted (for transparency)",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "reply": "Your booking DRV-001 is CONFIRMED. Pick-up: 20 Jun, Drop-off: 23 Jun.",
                "session_id": "abc123",
                "sources": ["booking_database"],
            }
        }


class HealthResponse(BaseModel):
    """Health-check response."""

    status: str
    model: str
    db_connected: bool
    active_sessions: int
