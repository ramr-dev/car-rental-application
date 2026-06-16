# DriveLux AI Support Chatbot 🚗🤖

A Python FastAPI microservice that powers the intelligent support chatbot for the DriveLux car rental platform.

## Tech Stack
- **AI**: Google Gemini 1.5 Flash (free tier)
- **Framework**: LangChain + FastAPI
- **Database**: Read-only access to your existing MySQL `drivelux` DB
- **Port**: `8000`

---

## Quick Start

### Step 1 — Get your FREE Gemini API Key
1. Go to: https://aistudio.google.com/app/apikey
2. Click **Create API Key** (no credit card needed)
3. Copy the key

### Step 2 — Set the API Key
Edit `chatbot/.env` to include either your Gemini or Groq key:

* **For Groq (Recommended - Free & Fast)**:
  1. Get a key at: https://console.groq.com/keys
  2. Set: `GROQ_API_KEY=gsk_your_key`
* **For Gemini**:
  1. Get a key at: https://aistudio.google.com/app/apikey
  2. Set: `GEMINI_API_KEY=your_key`



### Step 3 — Run setup
```bash
cd chatbot
bash setup.sh
```

### Step 4 — Start the service
```bash
source venv/bin/activate   # Windows: venv\Scripts\activate
python main.py
```

The service starts at **http://localhost:8000**

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/chat` | Send a message, receive AI reply |
| `GET` | `/health` | Service health check |
| `DELETE` | `/session/{id}` | Clear a session's history |
| `GET` | `/docs` | Swagger UI (interactive API docs) |

### Example Request
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the status of booking DRV-001?",
    "session_id": "my-session-123",
    "user_email": "customer@example.com"
  }'
```

### Example Response
```json
{
  "reply": "📋 **Booking Details**\n- **ID**: DRV-001\n- **Status**: CONFIRMED\n...",
  "session_id": "my-session-123"
}
```

---

## File Structure

```
chatbot/
├── main.py          ← FastAPI app (entry point)
├── agent.py         ← LangChain + Gemini agent
├── tools.py         ← DB query tools (6 tools)
├── memory.py        ← Per-session conversation history
├── prompts.py       ← DriveLux support persona
├── db.py            ← SQLAlchemy MySQL connection
├── models.py        ← Pydantic request/response schemas
├── config.py        ← Environment variable loader
├── requirements.txt ← Python dependencies
├── .env             ← Your secrets (never commit this!)
└── setup.sh         ← One-time setup script
```

## Available AI Tools

The agent autonomously chooses which tool to use:

| Tool | Trigger Example |
|------|----------------|
| `get_booking_by_id` | "Status of booking DRV-001?" |
| `get_user_bookings` | "Show me my bookings" |
| `get_vehicle_info` | "Tell me about vehicle #3" |
| `search_available_vehicles` | "Any SUVs available?" |
| `calculate_booking_price` | "How much for 5 days in car #2?" |
| `get_active_offers` | "Any discounts available?" |
