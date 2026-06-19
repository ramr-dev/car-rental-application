"""
db.py — Read-only SQLAlchemy engine for the DriveLux MySQL database.

IMPORTANT: This connection is strictly read-only — the chatbot NEVER modifies data.
All write operations continue to go through the Node.js backend.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import OperationalError
from contextlib import contextmanager
from typing import Generator    
import logging

from config import settings

logger = logging.getLogger(__name__)

# ── Engine ────────────────────────────────────────────────────────────────────
# pool_pre_ping=True: tests connections before use (handles MySQL "gone away")
# pool_size=5: small pool — chatbot only reads, no heavy load expected
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=False,  # set True to log SQL queries during dev
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@contextmanager
def get_db() -> Generator[Session, None, None]:
    """Yield a DB session and close it when done."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """Return True if the database is reachable, False otherwise."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except OperationalError as e:
        logger.warning(f"DB connection check failed: {e}")
        return False
