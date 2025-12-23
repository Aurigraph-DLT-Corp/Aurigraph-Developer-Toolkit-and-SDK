#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   🏢 Starting Aurex Enterprise Portal${NC}"
echo -e "${BLUE}================================================${NC}"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Python 3 is not installed. Please install Python 3.8+${NC}"
    exit 1
fi

# Install backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd backend
pip3 install -q -r requirements.txt 2>/dev/null || pip3 install -r requirements.txt
cd ..

# Start backend API
echo -e "${GREEN}Starting backend API on port 8001...${NC}"
cd backend
python3 server.py &
BACKEND_PID=$!
cd ..

# Start GNN service (if not already running)
if ! curl -s http://localhost:8000/api/gnn/health > /dev/null 2>&1; then
    echo -e "${GREEN}Starting GNN service on port 8000...${NC}"
    cd ..
    if [ -f "api/main.py" ]; then
        python3 -m uvicorn api.main:app --host 0.0.0.0 --port 8000 &
        GNN_PID=$!
    fi
    cd enterprise-portal
fi

# Simple HTTP server for frontend
echo -e "${GREEN}Starting frontend on port 3000...${NC}"
cd frontend/public
python3 -m http.server 3000 &
FRONTEND_PID=$!
cd ../..

sleep 3

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}   ✅ Enterprise Portal is Running!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Access Points:"
echo -e "${BLUE}  • Enterprise Portal:${NC} http://localhost:3000"
echo -e "${BLUE}  • Backend API:${NC} http://localhost:8001"
echo -e "${BLUE}  • GNN Service:${NC} http://localhost:8000"
echo ""
echo "Features Available:"
echo "  ✓ Executive Dashboard"
echo "  ✓ GNN Platform Integration"
echo "  ✓ Sustainability Metrics"
echo "  ✓ AI Agent Control"
echo "  ✓ Supply Chain Analytics"
echo "  ✓ LCA/PCF Calculator"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait and handle shutdown
trap "echo 'Shutting down...'; kill $BACKEND_PID $FRONTEND_PID $GNN_PID 2>/dev/null; exit" INT

wait
