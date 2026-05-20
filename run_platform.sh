#!/bin/bash

# TestFlow - One-Click Launcher

echo "------------------------------------------------"
echo "Starting TestFlow..."
echo "------------------------------------------------"

# Get the script directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start Backend
echo "[1/2] Launching Backend Server..."
cd "$DIR/backend"
# Use the local venv
./venv/bin/python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to initialize
sleep 2

# Start Frontend
echo "[2/2] Launching Frontend Interface..."
cd "$DIR/frontend"
# Export path for Node/NPM
export PATH=/home/$USER/.local/share/fnm/node-versions/v25.2.1/installation/bin:$PATH
npm run dev -- --host --port 5173 > frontend.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo "✅ Systems are running!"
echo "------------------------------------------------"
echo "Admin Dashboard: http://localhost:5173/login"
echo "Local Network:   http://$(hostname -I | awk '{print $1}'):5173/"
echo "------------------------------------------------"
echo "Press Ctrl+C to stop the servers."

# Handle shutdown
trap "kill $BACKEND_PID $FRONTEND_PID; echo 'Shutting down servers...'; exit" INT
wait
