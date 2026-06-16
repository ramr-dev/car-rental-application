"""
memory.py — Per-session conversation memory manager.

Each browser session (tab) gets its own conversation history so the AI
remembers the context of the current chat without mixing up users.
Memory is stored in-process (RAM) — fast and zero-dependency.
For production with multiple workers, swap for RedisEntityMemory.
"""

import logging
import time
from threading import Lock
from typing import Optional

from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────
MAX_MESSAGES_PER_SESSION = 20      # keep last N messages (10 exchanges)
SESSION_TTL_SECONDS = 60 * 60     # expire sessions after 1 hour of inactivity


class SessionMemory:
    """Holds the message history for a single chat session."""

    def __init__(self):
        self.messages: list = []
        self.last_active: float = time.time()

    def add_user_message(self, content: str):
        self.messages.append(HumanMessage(content=content))
        self.last_active = time.time()
        self._trim()

    def add_ai_message(self, content: str):
        self.messages.append(AIMessage(content=content))
        self.last_active = time.time()
        self._trim()

    def get_history(self) -> list:
        """Return message history (without the system prompt — that's added by the agent)."""
        return self.messages.copy()

    def _trim(self):
        """Keep only the most recent MAX_MESSAGES_PER_SESSION messages."""
        if len(self.messages) > MAX_MESSAGES_PER_SESSION:
            self.messages = self.messages[-MAX_MESSAGES_PER_SESSION:]

    @property
    def is_expired(self) -> bool:
        return (time.time() - self.last_active) > SESSION_TTL_SECONDS


class MemoryManager:
    """
    Thread-safe store for all active sessions.
    Call `cleanup_expired()` periodically (or on each request) to free RAM.
    """

    def __init__(self):
        self._sessions: dict[str, SessionMemory] = {}
        self._lock = Lock()

    def get_or_create(self, session_id: str) -> SessionMemory:
        with self._lock:
            if session_id not in self._sessions:
                self._sessions[session_id] = SessionMemory()
                logger.debug(f"Created new session: {session_id}")
            return self._sessions[session_id]

    def get(self, session_id: str) -> Optional[SessionMemory]:
        with self._lock:
            return self._sessions.get(session_id)

    def delete(self, session_id: str):
        with self._lock:
            self._sessions.pop(session_id, None)

    def cleanup_expired(self):
        with self._lock:
            expired = [sid for sid, mem in self._sessions.items() if mem.is_expired]
            for sid in expired:
                del self._sessions[sid]
            if expired:
                logger.info(f"Cleaned up {len(expired)} expired session(s)")

    @property
    def active_count(self) -> int:
        with self._lock:
            return len(self._sessions)


# ── Singleton — shared across all requests in the same process ─────────────
memory_manager = MemoryManager()
