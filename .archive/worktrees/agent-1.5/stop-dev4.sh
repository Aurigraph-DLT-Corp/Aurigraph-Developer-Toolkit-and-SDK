#!/bin/bash

echo "🛑 Stopping Aurigraph Dev4 Services"
echo "===================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Stop demo process
if [ -f demo-dev4.pid ]; then
    DEMO_PID=$(cat demo-dev4.pid)
    if ps -p $DEMO_PID > /dev/null 2>&1; then
        kill $DEMO_PID
        print_status "Stopped demo process (PID: $DEMO_PID)"
    else
        print_warning "Demo process not running"
    fi
    rm demo-dev4.pid
else
    print_warning "No demo PID file found"
fi

# Stop dashboard process
if [ -f dashboard-dev4.pid ]; then
    DASHBOARD_PID=$(cat dashboard-dev4.pid)
    if ps -p $DASHBOARD_PID > /dev/null 2>&1; then
        kill $DASHBOARD_PID
        print_status "Stopped dashboard process (PID: $DASHBOARD_PID)"
    else
        print_warning "Dashboard process not running"
    fi
    rm dashboard-dev4.pid
else
    print_warning "No dashboard PID file found"
fi

# Kill any remaining processes
pkill -f "node.*aurigraph-demo-dev4" 2>/dev/null && print_status "Killed remaining demo processes" || print_warning "No remaining demo processes"
pkill -f "python.*dashboard_vizro" 2>/dev/null && print_status "Killed remaining dashboard processes" || print_warning "No remaining dashboard processes"

# Clear ports
lsof -ti:4004 | xargs kill -9 2>/dev/null && print_status "Cleared port 4004" || print_warning "Port 4004 already clear"
lsof -ti:4005 | xargs kill -9 2>/dev/null && print_status "Cleared port 4005" || print_warning "Port 4005 already clear"
lsof -ti:8050 | xargs kill -9 2>/dev/null && print_status "Cleared port 8050" || print_warning "Port 8050 already clear"

echo ""
print_status "All services stopped!"