"""
agent.py — LangChain agent that powers the DriveLux support chatbot.

Architecture:
  - LLM: Google Gemini 1.5 Flash (free tier)
  - Pattern: Tool-calling agent (Gemini's native function calling)
  - Memory: Per-session message history from memory.py
  - Tools: DB query tools from tools.py
"""

import logging
from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from config import settings
from prompts import DRIVELUX_SYSTEM_PROMPT
from tools import ALL_TOOLS
from memory import memory_manager, SessionMemory

logger = logging.getLogger(__name__)


# ── LLM Setup ─────────────────────────────────────────────────────────────────

def _create_llm():
    """Create and return a configured LLM instance (Groq Llama-3 or Google Gemini)."""
    if settings.is_groq:
        logger.info(f"🤖 Using Groq LLM Provider | Model: {settings.GROQ_MODEL}")
        return ChatGroq(
            model=settings.GROQ_MODEL,
            groq_api_key=settings.GROQ_API_KEY,
            temperature=0.3,
            max_tokens=settings.MAX_TOKENS,
        )
    else:
        logger.info(f"🤖 Using Gemini LLM Provider | Model: {settings.GEMINI_MODEL}")
        return ChatGoogleGenerativeAI(
            model=settings.GEMINI_MODEL,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.3,
            max_output_tokens=settings.MAX_TOKENS,
            convert_system_message_to_human=False,
        )


# ── Prompt Template ───────────────────────────────────────────────────────────

def _create_prompt() -> ChatPromptTemplate:
    """
    Build the ChatPromptTemplate.
    - system: DriveLux persona + policies
    - chat_history: previous exchanges (injected per session)
    - human: latest user message
    - agent_scratchpad: internal reasoning (required by LangChain tool-calling agent)
    """
    return ChatPromptTemplate.from_messages([
        ("system", DRIVELUX_SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="chat_history", optional=True),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])


# ── Agent Factory ─────────────────────────────────────────────────────────────

def _build_agent_executor() -> AgentExecutor:
    """Build a reusable AgentExecutor (LLM + tools + prompt)."""
    llm = _create_llm()
    prompt = _create_prompt()
    agent = create_tool_calling_agent(llm=llm, tools=ALL_TOOLS, prompt=prompt)
    return AgentExecutor(
        agent=agent,
        tools=ALL_TOOLS,
        verbose=True,               # logs tool calls to console during dev
        handle_parsing_errors=True, # gracefully handle malformed LLM output
        max_iterations=5,           # prevent infinite tool-calling loops
        return_intermediate_steps=False,
    )


# Singleton executor — created once at startup
_executor: Optional[AgentExecutor] = None


def get_executor() -> AgentExecutor:
    global _executor
    if _executor is None:
        _executor = _build_agent_executor()
    return _executor


# ── Main chat function ────────────────────────────────────────────────────────

async def chat(
    message: str,
    session_id: str,
    user_email: Optional[str] = None,
) -> str:
    """
    Process a user message and return the AI's reply.

    Args:
        message:    The user's input text
        session_id: Unique identifier for this browser session
        user_email: Authenticated user's email (injected into context if available)

    Returns:
        The assistant's reply as a plain string
    """
    # 1. Clean up stale sessions opportunistically (every request)
    memory_manager.cleanup_expired()

    # 2. Get (or create) session memory
    session: SessionMemory = memory_manager.get_or_create(session_id)
    history = session.get_history()

    # 3. Enrich the message with user context if authenticated
    enriched_input = message
    if user_email:
        enriched_input = (
            f"[Context: Authenticated user email = {user_email}]\n"
            f"{message}"
        )

    # 4. Run the agent
    executor = get_executor()
    try:
        result = await executor.ainvoke({
            "input": enriched_input,
            "chat_history": history,
        })
        reply: str = result.get("output", "I'm sorry, I couldn't process that. Please try again.")
    except Exception as e:
        logger.error(f"Agent error for session {session_id}: {e}", exc_info=True)
        reply = (
            "I'm experiencing a technical issue right now. "
            "Please try again in a moment or contact support@drivelux.com for immediate help."
        )

    # 5. Save the exchange to session memory
    session.add_user_message(message)
    session.add_ai_message(reply)

    return reply
