#!/bin/bash

echo "🔄 Restarting Aurigraph Demo Platform..."

# Kill any existing processes
echo "Stopping existing services..."
pkill -f "aurigraph_demo_server.py" 2>/dev/null
pkill -f "aurigraph_vizro_dashboard.py" 2>/dev/null
pkill -f "aurigraph_simple_dashboard.py" 2>/dev/null

# Also kill processes on specific ports
lsof -ti:3088 | xargs kill -9 2>/dev/null || true
lsof -ti:8050 | xargs kill -9 2>/dev/null || true

sleep 2

# Create logs directory if it doesn't exist
mkdir -p logs

# Start FastAPI server
echo "Starting FastAPI server..."
nohup python3 aurigraph_demo_server.py > logs/fastapi.log 2>&1 &
FASTAPI_PID=$!
echo "FastAPI PID: $FASTAPI_PID"

sleep 3

# Check if FastAPI is running
if ps -p $FASTAPI_PID > /dev/null; then
    echo "✅ FastAPI server started on http://localhost:3088"
else
    echo "❌ FastAPI failed to start. Checking logs..."
    tail -20 logs/fastapi.log
    exit 1
fi

# Test API endpoint
echo "Testing API connection..."
if curl -s http://localhost:3088/api/status > /dev/null; then
    echo "✅ API is responding"
else
    echo "⚠️ API is not responding yet"
fi

echo ""
echo "✅ Demo Platform Restarted!"
echo ""
echo "Access points:"
echo "  • Demo UI: http://localhost:3088"
echo "  • API Docs: http://localhost:3088/docs"
echo "  • Test Page: file://$PWD/test-connection.html"
echo ""
echo "To view logs: tail -f logs/fastapi.log"