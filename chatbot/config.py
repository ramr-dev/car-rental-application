"""
config.py — Environment variable loader for the DriveLux chatbot service.
All settings are loaded from .env via python-dotenv.
"""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:root@localhost:3306/drivelux")
    PORT: int = int(os.getenv("PORT", "8000"))
    CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "http://localhost:8080")
    MAX_MEMORY_MESSAGES: int = int(os.getenv("MAX_MEMORY_MESSAGES", "10"))
    MAX_TOKENS: int = int(os.getenv("MAX_TOKENS", "2048"))

    @property
    def is_groq(self) -> bool:
        return bool(self.GROQ_API_KEY and self.GROQ_API_KEY.strip() and self.GROQ_API_KEY != "your_groq_api_key_here")

    def validate(self):
        if self.is_groq:
            return
        if not self.GEMINI_API_KEY or self.GEMINI_API_KEY == "your_gemini_api_key_here":
            raise ValueError(
                "❌  Neither GEMINI_API_KEY nor GROQ_API_KEY is set!\n"
                "    Please provide a key in chatbot/.env:\n"
                "    - For Groq: GROQ_API_KEY=<your-key>  (Get one free at https://console.groq.com)\n"
                "    - For Gemini: GEMINI_API_KEY=<your-key>"
            )


settings = Settings()
