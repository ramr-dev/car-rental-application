import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  X,
  Send,
  Trash2,
  Loader2,
  Bot,
  Sparkles,
  User,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/store/auth";
import axios from "axios";

// Chatbot backend endpoint configuration
const getChatbotApiUrl = (): string => {
  let urlStr = import.meta.env.VITE_CHATBOT_API_URL || "http://localhost:8000";
  if (typeof window !== "undefined") {
    try {
      const uri = new URL(urlStr, window.location.origin);
      if (uri.hostname === "localhost" && window.location.hostname !== "localhost") {
        uri.hostname = window.location.hostname;
        urlStr = uri.toString().replace(/\/$/, "");
      }
    } catch {
      // Ignore URL parsing errors
    }
  }
  return urlStr;
};

const CHATBOT_API = getChatbotApiUrl();

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

const SESSION_KEY = "drivelux_chat_session_id";
const MESSAGES_KEY = "drivelux_chat_messages";

// Generate unique session ID if not exists
const getOrCreateSessionId = (): string => {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `dl-session-${Math.random().toString(36).substring(2, 15)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

// Escape HTML utility for safety
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Convert markdown-like response text into safe HTML
function formatMessage(text: string): string {
  // Split into lines to parse bullet lists
  const lines = text.split("\n");
  const processedLines = lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      const content = escapeHtml(trimmed.substring(2));
      const boldContent = content.replace(/\*\/(.*?)\*\//g, "<strong>$1</strong>");
      // Fixed regex to find matches of **text** correctly
      const boldFixed = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      const codeContent = boldFixed.replace(/`(.*?)`/g, "<code class='bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-bold text-primary'>$1</code>");
      return `<li class="ml-4 list-disc my-1 text-sm">${codeContent}</li>`;
    }
    
    const content = escapeHtml(line);
    const boldContent = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    const codeContent = boldContent.replace(/`(.*?)`/g, "<code class='bg-muted px-1.5 py-0.5 rounded text-xs font-mono font-bold text-primary'>$1</code>");
    return codeContent;
  });

  return processedLines.join("<br />");
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [isHealthy, setIsHealthy] = useState(true);
  const [dbConnected, setDbConnected] = useState(true);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const user = useAuth((state) => state.user);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Session & Load Cache
  useEffect(() => {
    const id = getOrCreateSessionId();
    setSessionId(id);

    // Initial greeting message
    const defaultGreeting: Message = {
      id: "welcome",
      role: "assistant",
      text: `Hello${user ? `, ${user.name}` : ""}! I am your **DriveLux AI Assistant**. 🚗🤖\n\nI can help you manage bookings, check vehicle availability, look up active discounts, or calculate rental quotes.\n\n* **Check booking status**: "What is the status of my booking?"\n* **Search vehicles**: "Show me available SUVs."\n* **Browse offers**: "Are there any active discount offers?"\n* **Pricing**: "How much for 3 days in vehicle #2?"\n\n${user ? `*(Logged in as **${user.email}** — I will search your bookings automatically!)*` : "*(Tip: Log in to let me access your profile and bookings!)*"}`,
      timestamp: new Date(),
    };

    // Load cached messages if any
    const cached = localStorage.getItem(MESSAGES_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const mapped = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        // If cached is empty, set default
        if (mapped.length === 0) {
          setMessages([defaultGreeting]);
        } else {
          setMessages(mapped);
        }
      } catch (e) {
        setMessages([defaultGreeting]);
      }
    } else {
      setMessages([defaultGreeting]);
    }

    // Run health check
    checkBackendHealth();
  }, [user]);

  // Save messages to Cache
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const checkBackendHealth = async () => {
    try {
      const { data } = await axios.get(`${CHATBOT_API}/health`, { timeout: 3000 });
      setIsHealthy(data.status === "ok");
      setDbConnected(data.db_connected !== false);
    } catch (e) {
      setIsHealthy(false);
      setDbConnected(false);
    }
  };

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    // Append user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await axios.post(`${CHATBOT_API}/chat`, {
        message: trimmed,
        session_id: sessionId,
        user_email: user?.email || null,
      });

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: response.data.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsHealthy(true); // reset health since call succeeded
    } catch (error: any) {
      console.error("Chat error:", error);
      
      let errMsg = "I apologize, but I encountered an error connecting to the support server. Please make sure the service is running.";
      if (error.response?.data?.detail) {
        errMsg = error.response.data.detail;
      }

      const assistantMsg: Message = {
        id: `assistant-error-${Date.now()}`,
        role: "assistant",
        text: `⚠️ **Connection Error**\n\n${errMsg}`,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      checkBackendHealth(); // refresh health status
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      // Clear session from backend
      if (sessionId) {
        await axios.delete(`${CHATBOT_API}/session/${sessionId}`);
      }
    } catch (e) {
      console.error("Failed to delete session on server:", e);
    }

    // Clear local storage and state
    const defaultGreeting: Message = {
      id: "welcome",
      role: "assistant",
      text: `Hello${user ? `, ${user.name}` : ""}! History cleared. I am ready for any new queries. 🚗🤖`,
      timestamp: new Date(),
    };
    
    setMessages([defaultGreeting]);
    localStorage.removeItem(MESSAGES_KEY);
    setShowConfirmClear(false);
  };

  const suggestions = [
    { label: "My Bookings", query: "Show my bookings" },
    { label: "Car Search", query: "Are there any cars available?" },
    { label: "Active Offers", query: "Are there any active discount offers?" },
    { label: "Help/FAQ", query: "What is your rental process?" },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            checkBackendHealth();
          }
        }}
        className="chat-toggle-btn fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow transition-all duration-300 hover:scale-110 hover:rotate-6 active:scale-95 cursor-pointer animate-in fade-in duration-500"
        aria-label="Open support chat"
      >
        {isOpen ? (
          <X className="h-6 w-6 animate-in fade-in zoom-in duration-200" />
        ) : (
          <div className="relative flex h-6 w-6 items-center justify-center">
            <MessageSquare className="h-6 w-6 animate-in fade-in zoom-in duration-200" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success"></span>
            </span>
          </div>
        )}
      </button>

      {/* Conversation Window */}
      {isOpen && (
        <div
          ref={chatContainerRef}
          className="fixed bottom-24 right-6 z-50 flex h-[580px] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-elevated transition-all duration-300 animate-in slide-in-from-bottom-5 fade-in-20 duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-hero px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-display font-semibold leading-tight text-white flex items-center gap-1.5">
                  DriveLux AI Support
                  <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-pulse" />
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`h-2 w-2 rounded-full ${isHealthy ? "bg-emerald-400" : "bg-rose-400"} animate-pulse`} />
                  <span className="text-[10px] font-medium text-white/85">
                    {isHealthy ? "Assistant Online" : "Connection Offline"}
                  </span>
                </div>
              </div>
            </div>

            {/* Header controls */}
            <div className="flex items-center gap-1">
              {/* Clear History Button */}
              <button
                onClick={() => setShowConfirmClear(true)}
                className="rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
                title="Clear History"
              >
                <Trash2 className="h-4.5 w-4.5" />
              </button>
              {/* Close Button */}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1.5 text-white/80 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Database warning if disconnected */}
          {isHealthy && !dbConnected && (
            <div className="flex items-center gap-2 bg-amber-500/10 border-b border-amber-500/20 px-3 py-2 text-[11px] text-amber-600 dark:text-amber-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span>Database query tools are currently unavailable. Basic support is active.</span>
            </div>
          )}

          {/* Confirm Clear Overlay */}
          {showConfirmClear && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-6 text-center animate-in fade-in duration-200">
              <div className="rounded-full bg-rose-500/10 p-3 text-rose-500 mb-3">
                <Trash2 className="h-6 w-6" />
              </div>
              <h4 className="font-semibold text-foreground text-md">Clear chat history?</h4>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                This will delete the current conversation memory from both the server and your local browser cache.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 rounded-md border border-input bg-background py-2 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearHistory}
                  className="flex-1 rounded-md bg-rose-600 py-2 text-xs font-medium text-white hover:bg-rose-700 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => {
              const isAssistant = msg.role === "assistant";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isAssistant ? "justify-start" : "justify-end"} items-start gap-2`}
                >
                  {isAssistant && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-soft text-sm leading-relaxed ${
                      isAssistant
                        ? "bg-muted text-foreground rounded-tl-none border border-border/40"
                        : "bg-primary text-primary-foreground rounded-tr-none"
                    }`}
                  >
                    {/* Render message HTML format */}
                    <div
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }}
                      className="space-y-1"
                    />
                    <span
                      className={`block text-[9px] mt-1 text-right ${
                        isAssistant ? "text-muted-foreground" : "text-primary-foreground/70"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {!isAssistant && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex justify-start items-start gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-muted text-foreground rounded-2xl rounded-tl-none px-4 py-3 shadow-soft border border-border/40">
                  <div className="flex gap-1 items-center justify-center py-1">
                    <span className="h-2 w-2 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-border/30 bg-muted/20">
              {suggestions.map((s) => (
                <button
                  key={s.label}
                  onClick={() => handleSendMessage(s.query)}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary cursor-pointer hover:bg-primary/5 active:scale-95"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Connection Error Banner */}
          {!isHealthy && (
            <div className="bg-rose-500/10 border-t border-rose-500/20 px-4 py-2 flex items-center justify-between text-xs text-rose-600 dark:text-rose-400">
              <span className="flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Cannot reach chatbot API (port 8000)
              </span>
              <button
                type="button"
                onClick={checkBackendHealth}
                className="rounded p-1 text-rose-600 hover:bg-rose-500/20 active:scale-90 cursor-pointer"
                title="Retry connection"
              >
                <RefreshCw className="h-3.5 w-3.5 animate-spin-hover" />
              </button>
            </div>
          )}

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="flex items-center gap-2 border-t border-border p-3 bg-card"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isHealthy ? "Ask something about bookings..." : "Chatbot is offline..."}
              disabled={isLoading || !isHealthy}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || !isHealthy}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-soft transition-colors hover:bg-primary/90 disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
