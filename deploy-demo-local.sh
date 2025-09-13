#!/bin/bash

# Aurigraph DLT V11 - Local Demo Deployment Script
# This script sets up and runs the complete demo platform locally

set -e

echo "================================================"
echo "🚀 Aurigraph DLT V11 - Demo Platform Deployment"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check Python version
echo "Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    print_status "Python $PYTHON_VERSION found"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version | cut -d' ' -f2)
    print_status "Python $PYTHON_VERSION found"
    PYTHON_CMD="python"
else
    print_error "Python is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if virtual environment exists, create if not
VENV_DIR="venv"
if [ ! -d "$VENV_DIR" ]; then
    echo ""
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv $VENV_DIR
    print_status "Virtual environment created"
else
    print_status "Virtual environment already exists"
fi

# Activate virtual environment
echo ""
echo "Activating virtual environment..."
source $VENV_DIR/bin/activate
print_status "Virtual environment activated"

# Upgrade pip
echo ""
echo "Upgrading pip..."
pip install --upgrade pip > /dev/null 2>&1
print_status "pip upgraded"

# Install dependencies
echo ""
echo "Installing dependencies..."
pip install -r requirements.txt > /dev/null 2>&1
print_status "Dependencies installed"

# Create necessary directories
echo ""
echo "Setting up directories..."
mkdir -p logs
mkdir -p data
print_status "Directories created"

# Check if ports are available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    else
        return 0
    fi
}

echo ""
echo "Checking port availability..."

# Kill existing processes on our ports if needed
if ! check_port 3088; then
    print_warning "Port 3088 is in use, attempting to free it..."
    lsof -ti:3088 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

if ! check_port 8050; then
    print_warning "Port 8050 is in use, attempting to free it..."
    lsof -ti:8050 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

print_status "Ports are available"

# Start FastAPI server in background
echo ""
echo "Starting FastAPI demo server..."
nohup python aurigraph_demo_server.py > logs/fastapi.log 2>&1 &
FASTAPI_PID=$!
echo "FastAPI PID: $FASTAPI_PID"
print_status "FastAPI server started on http://localhost:3088"

# Wait for FastAPI to start
echo "Waiting for server to initialize..."
sleep 3

# Check if FastAPI is running
if ps -p $FASTAPI_PID > /dev/null; then
    print_status "FastAPI server is running"
else
    print_error "FastAPI server failed to start. Check logs/fastapi.log for details"
    exit 1
fi

# Start Vizro dashboard in background
echo ""
echo "Starting Vizro dashboard..."
nohup python aurigraph_vizro_dashboard.py > logs/vizro.log 2>&1 &
VIZRO_PID=$!
echo "Vizro PID: $VIZRO_PID"
print_status "Vizro dashboard started on http://localhost:8050"

# Wait for Vizro to start
sleep 3

# Check if Vizro is running
if ps -p $VIZRO_PID > /dev/null; then
    print_status "Vizro dashboard is running"
else
    print_warning "Vizro dashboard may have failed to start. Check logs/vizro.log for details"
fi

# Create stop script
cat > stop-demo.sh << 'EOF'
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
EOF

chmod +x stop-demo.sh
print_status "Created stop-demo.sh script"

# Save process IDs to file for later cleanup
echo "FASTAPI_PID=$FASTAPI_PID" > .demo-pids
echo "VIZRO_PID=$VIZRO_PID" >> .demo-pids

echo ""
echo "================================================"
echo "✅ Demo Platform Successfully Deployed!"
echo "================================================"
echo ""
echo "🌐 Access Points:"
echo "   • Demo UI:        http://localhost:3088"
echo "   • Vizro Dashboard: http://localhost:8050"
echo "   • WebSocket:      ws://localhost:3088/ws"
echo "   • API Docs:       http://localhost:3088/docs"
echo ""
echo "📊 Features Available:"
echo "   • Configure validators (1-20) and business nodes (1-50)"
echo "   • Select consensus algorithm (HyperRAFT++, PBFT, RAFT)"
echo "   • Target TPS from 1K to 2M+"
echo "   • Real-time throughput visualization"
echo "   • Live metrics monitoring"
echo ""
echo "🛑 To stop the demo:"
echo "   ./stop-demo.sh"
echo ""
echo "📝 Logs are available in:"
echo "   • FastAPI: logs/fastapi.log"
echo "   • Vizro:   logs/vizro.log"
echo ""
echo "Opening demo in browser..."

# Try to open browser (works on macOS)
if command -v open &> /dev/null; then
    sleep 2
    open http://localhost:3088
elif command -v xdg-open &> /dev/null; then
    sleep 2
    xdg-open http://localhost:3088
fi

echo ""
echo "Demo is running! Press Ctrl+C to exit (or run ./stop-demo.sh)"
echo ""

# Keep script running and show logs
tail -f logs/fastapi.log