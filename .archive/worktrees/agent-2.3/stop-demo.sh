#!/bin/bash
echo "Stopping Aurigraph Demo Platform..."

# Kill FastAPI server
if pgrep -f "aurigraph_demo_server.py" > /dev/null; then
    pkill -f "aurigraph_demo_server.py"
    echo "✓ FastAPI server stopped"
fi

# Kill Vizro dashboard
if pgrep -f "aurigraph_vizro_dashboard.py" > /dev/null; then
    pkill -f "aurigraph_vizro_dashboard.py"
    echo "✓ Vizro dashboard stopped"
fi

# Kill any processes on our ports
lsof -ti:3088 | xargs kill -9 2>/dev/null || true
lsof -ti:8050 | xargs kill -9 2>/dev/null || true

echo "Demo platform stopped successfully"
