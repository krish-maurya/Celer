#!/bin/bash
set -e
echo "=== Celer Unified Setup ==="
if ! command -v node &> /dev/null; then
  echo "Node.js not found. Install Node 18+"
  exit 1
fi
echo "Node $(node -v) found"
if [ ! -f .env ]; then
  cp .env.example .env
  echo ".env created"
fi
echo "Installing deps..."
npm install
echo "Creating DB + seeding..."
npm run setup
echo ""
echo "✅ Ready! Run: npm run dev"
echo "→ http://localhost:3000"
echo "Login: demo@celer.app / password123"
