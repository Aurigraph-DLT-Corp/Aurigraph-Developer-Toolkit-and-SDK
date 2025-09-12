#!/bin/bash

echo "🚀 Aurigraph Dev4 Deployment Script"
echo "===================================="
echo "Target: dlt.aurigraph.io"
echo ""

# Configuration
DOMAIN="dlt.aurigraph.io"
PORT=4004
WS_PORT=4005
NODE_ENV="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "📋 Pre-deployment checks..."
echo ""

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node -v)
    print_status "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js is not installed"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    print_status "npm installed: $NPM_VERSION"
else
    print_error "npm is not installed"
    exit 1
fi

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    print_status "Python installed: $PYTHON_VERSION"
else
    print_warning "Python3 not found (dashboard may not work)"
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install Node dependencies
npm install express ws crypto 2>/dev/null || {
    print_warning "Some npm packages may already be installed"
}

# Install Python dependencies for dashboard
if command_exists python3; then
    python3 -m pip install dash plotly requests --quiet 2>/dev/null || {
        print_warning "Some Python packages may already be installed"
    }
fi

echo ""
echo "🛑 Stopping existing processes..."
echo ""

# Stop any existing demo processes
pkill -f "node.*aurigraph-demo" 2>/dev/null && print_status "Stopped existing Node.js demos" || print_warning "No existing Node.js demos running"
pkill -f "python.*dashboard" 2>/dev/null && print_status "Stopped existing Python dashboards" || print_warning "No existing Python dashboards running"

# Kill processes on specific ports
lsof -ti:$PORT | xargs kill -9 2>/dev/null && print_status "Cleared port $PORT" || print_warning "Port $PORT was already free"
lsof -ti:$WS_PORT | xargs kill -9 2>/dev/null && print_status "Cleared port $WS_PORT" || print_warning "Port $WS_PORT was already free"
lsof -ti:8050 | xargs kill -9 2>/dev/null && print_status "Cleared port 8050" || print_warning "Port 8050 was already free"

echo ""
echo "🚀 Starting Aurigraph Dev4 Demo..."
echo ""

# Set environment variables
export NODE_ENV=$NODE_ENV
export DOMAIN=$DOMAIN
export PORT=$PORT
export WS_PORT=$WS_PORT
export CORS_ORIGIN="https://$DOMAIN"

# Start the demo
nohup node aurigraph-demo-dev4.js > demo-dev4.log 2>&1 &
DEMO_PID=$!

# Wait for demo to start
sleep 3

# Check if demo started successfully
if ps -p $DEMO_PID > /dev/null; then
    print_status "Demo started with PID: $DEMO_PID"
    echo $DEMO_PID > demo-dev4.pid
else
    print_error "Failed to start demo"
    tail -20 demo-dev4.log
    exit 1
fi

# Start the Vizro dashboard
if command_exists python3; then
    echo ""
    echo "🎨 Starting Vizro Dashboard..."
    nohup python3 dashboard_vizro.py > dashboard-dev4.log 2>&1 &
    DASHBOARD_PID=$!
    
    sleep 3
    
    if ps -p $DASHBOARD_PID > /dev/null; then
        print_status "Dashboard started with PID: $DASHBOARD_PID"
        echo $DASHBOARD_PID > dashboard-dev4.pid
    else
        print_warning "Dashboard failed to start (non-critical)"
    fi
fi

echo ""
echo "🔍 Verifying deployment..."
echo ""

# Test endpoints
sleep 2

# Test health endpoint
HEALTH_RESPONSE=$(curl -s http://localhost:$PORT/health)
if [[ $HEALTH_RESPONSE == *"healthy"* ]]; then
    print_status "Health endpoint responding"
else
    print_error "Health endpoint not responding"
fi

# Test status endpoint
STATUS_RESPONSE=$(curl -s http://localhost:$PORT/channel/status)
if [[ $STATUS_RESPONSE == *"active"* ]]; then
    print_status "Status endpoint responding"
else
    print_error "Status endpoint not responding"
fi

# Test metrics endpoint
METRICS_RESPONSE=$(curl -s http://localhost:$PORT/channel/metrics)
if [[ $METRICS_RESPONSE == *"totalTPS"* ]]; then
    print_status "Metrics endpoint responding"
else
    print_error "Metrics endpoint not responding"
fi

echo ""
echo "📊 Deployment Summary"
echo "===================="
echo ""
print_status "Main Demo: http://localhost:$PORT"
print_status "WebSocket: ws://localhost:$WS_PORT"
if command_exists python3; then
    print_status "Vizro Dashboard: http://localhost:8050"
fi
echo ""
echo "🌍 Production URLs:"
echo "   • API: https://$DOMAIN"
echo "   • Dashboard: https://$DOMAIN/dashboard"
echo "   • Status: https://$DOMAIN/channel/status"
echo "   • Metrics: https://$DOMAIN/channel/metrics"
echo "   • Nodes: https://$DOMAIN/channel/nodes"
echo "   • API Docs: https://$DOMAIN/api/docs"
echo ""
echo "📝 Logs:"
echo "   • Demo: tail -f demo-dev4.log"
echo "   • Dashboard: tail -f dashboard-dev4.log"
echo ""
echo "🛑 To stop:"
echo "   • ./stop-dev4.sh"
echo ""
print_status "Deployment complete!"