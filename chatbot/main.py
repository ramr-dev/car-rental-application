"""
main.py — FastAPI application entry point for the DriveLux AI Support Chatbot.

Endpoints:
  POST /chat        → Send a message, receive AI reply
  GET  /health      → Service health check
  DELETE /session   → Clear a specific session's memory

Docs:
  http://localhost:8000/docs   (Swagger UI)
  http://localhost:8000/redoc  (ReDoc)
"""

import logging
import sys
from contextlib import asynccontextmanager  

import uvicorn
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models import ChatRequest, ChatResponse, HealthResponse
from agent import chat, get_executor
from db import check_db_connection
from memory import memory_manager

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)


# ── Lifespan (startup / shutdown) ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup checks before accepting requests."""
    logger.info("🚗  DriveLux Chatbot starting up...")

    # Validate API key
    try:
        settings.validate()
        if settings.is_groq:
            logger.info(f"✅  LLM provider: Groq | Model: {settings.GROQ_MODEL}")
        else:
            logger.info(f"✅  LLM provider: Gemini | Model: {settings.GEMINI_MODEL}")
    except ValueError as e:
        logger.error(str(e))
        sys.exit(1)

    # Check DB connection
    db_ok = check_db_connection()
    if db_ok:
        logger.info("✅  MySQL database connected")
    else:
        logger.warning(
            "⚠️   MySQL database is NOT reachable. "
            "Booking/vehicle tools will be unavailable until DB is connected."
        )

    # Pre-warm the agent executor (loads model config, validates tools)
    logger.info("⚙️   Warming up LangChain agent...")
    get_executor()
    logger.info("✅  Agent ready!")

    logger.info(f"🌐  Chatbot service running → http://localhost:{settings.PORT}")
    logger.info(f"📚  API docs → http://localhost:{settings.PORT}/docs")

    yield  # ← server runs here

    logger.info("👋  DriveLux Chatbot shutting down...")


# ── FastAPI App ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="DriveLux AI Support Chatbot",
    description=(
        "Intelligent support assistant for DriveLux car rental. "
        "Powered by Google Gemini 1.5 Flash + LangChain."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)


# ── CORS ──────────────────────────────────────────────────────────────────────
# Allows the React frontend (localhost:8080) to call this service

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CORS_ORIGIN, "http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """
    Check if the chatbot service, Gemini API connection, and MySQL DB are healthy.
    Used by monitoring systems and the frontend to show service status.
    """
    db_ok = check_db_connection()
    return HealthResponse(
        status="ok",
        model=settings.GROQ_MODEL if settings.is_groq else settings.GEMINI_MODEL,
        db_connected=db_ok,
        active_sessions=memory_manager.active_count,
    )


@app.post(
    "/chat",
    response_model=ChatResponse,
    tags=["Chat"],
    summary="Send a message to the DriveLux AI assistant",
)
async def chat_endpoint(request: ChatRequest):
    """
    **Main chat endpoint.**

    Send a message and receive an AI-generated support reply.

    - The agent automatically decides whether to query the database
    - `session_id` maintains conversation context across messages
    - `user_email` (optional) enables personalised booking lookups

    **Rate limit**: Subject to Gemini free-tier limits (15 RPM).
    """
    if not request.message.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message cannot be empty.",
        )

    try:
        reply = await chat(
            message=request.message.strip(),
            session_id=request.session_id,
            user_email=request.user_email,
        )
    except Exception as e:
        logger.error(f"Unhandled error in /chat: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again.",
        )

    return ChatResponse(
        reply=reply,
        session_id=request.session_id,
    )


@app.delete("/session/{session_id}", tags=["System"], summary="Clear a chat session")
async def clear_session(session_id: str):
    """
    Delete a session's conversation history.
    Call this when the user closes the chat widget or logs out.
    """
    memory_manager.delete(session_id)
    return {"message": f"Session '{session_id}' cleared successfully."}


# ── Entry Point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=False,       # keep False when running as background process
        log_level="info",
    )
