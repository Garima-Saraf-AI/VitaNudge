#!/bin/bash
# NutriTrack — Full setup script
# Run this once: bash setup.sh

set -e
echo ""
echo "╔══════════════════════════════════════╗"
echo "║   NutriTrack — Setup                 ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Check Node
if ! command -v node &> /dev/null; then
  echo "❌  Node.js not found. Install from https://nodejs.org (v18+)"
  exit 1
fi
NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 18 ]; then
  echo "❌  Node.js v18+ required. Current: $(node -v)"
  exit 1
fi
echo "✅  Node.js $(node -v)"

# Backend
echo ""
echo "📦  Installing backend dependencies..."
cd backend
npm install
echo "✅  Backend dependencies installed"

# DB init + seed
echo "🗄️   Initialising database..."
node database/init.js
node database/seed.js

# Check API key
if grep -q "your_anthropic_api_key_here" .env 2>/dev/null; then
  echo ""
  echo "⚠️   ANTHROPIC_API_KEY not set in backend/.env"
  echo "   Label scanning won't work until you add it."
  echo "   Edit backend/.env and replace 'your_anthropic_api_key_here'"
  echo "   Get a key at: https://console.anthropic.com"
fi

cd ..

# Frontend
echo ""
echo "📦  Installing frontend dependencies..."
cd frontend
npm install
echo "✅  Frontend dependencies installed"
cd ..

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   Setup complete!                    ║"
echo "╠══════════════════════════════════════╣"
echo "║                                      ║"
echo "║  Start backend:                      ║"
echo "║    cd backend && npm run dev         ║"
echo "║                                      ║"
echo "║  Start frontend (new terminal):      ║"
echo "║    cd frontend && npm run dev        ║"
echo "║                                      ║"
echo "║  Open: http://localhost:3000         ║"
echo "║                                      ║"
echo "╚══════════════════════════════════════╝"
echo ""
