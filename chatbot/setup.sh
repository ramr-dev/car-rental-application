#!/usr/bin/env bash
# setup.sh — One-time setup script for the DriveLux chatbot
# Run: bash setup.sh

set -e  # exit on any error

echo ""
echo "🚗  DriveLux AI Chatbot — Setup"
echo "================================"
echo ""

# 1. Check Python version
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
REQUIRED="3.10"
echo "✅  Python: $PYTHON_VERSION"

# 2. Create virtual environment
if [ ! -d "venv" ]; then
    echo "⚙️   Creating virtual environment..."
    python3 -m venv venv
    echo "✅  Virtual environment created"
else
    echo "✅  Virtual environment already exists"
fi

# 3. Activate venv
echo "⚙️   Activating virtual environment..."
# shellcheck disable=SC1091
source venv/bin/activate

# 4. Upgrade pip
pip install --upgrade pip --quiet

# 5. Install dependencies
echo "📦  Installing Python dependencies..."
pip install -r requirements.txt --quiet
echo "✅  Dependencies installed"

# 6. Check .env file
if grep -q "your_gemini_api_key_here" .env; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⚠️   ACTION REQUIRED — Set your Gemini API Key"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "  1. Go to: https://aistudio.google.com/app/apikey"
    echo "  2. Click 'Create API Key' (FREE — no credit card needed)"
    echo "  3. Copy the key"
    echo "  4. Open: chatbot/.env"
    echo "  5. Replace 'your_gemini_api_key_here' with your key"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "✅  Gemini API key is set"
fi

echo ""
echo "🎉  Setup complete!"
echo ""
echo "To start the chatbot:"
echo "  source venv/bin/activate"
echo "  python main.py"
echo ""
echo "Then open: http://localhost:8000/docs"
echo ""
