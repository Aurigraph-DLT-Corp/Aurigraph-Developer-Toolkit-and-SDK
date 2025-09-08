#!/bin/bash

# Aurigraph V10 Classical - Local Deployment Script
echo "🚀 Aurigraph V10 Classical Local Deployment"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check prerequisites
print_header "Checking Prerequisites"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
    
    # Check if Node.js version is 20+
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 20 ]; then
        print_error "Node.js 20+ required. Current version: $NODE_VERSION"
        exit 1
    fi
else
    print_error "Node.js not found. Please install Node.js 20+"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "npm found: $NPM_VERSION"
else
    print_error "npm not found. Please install npm"
    exit 1
fi

# Check system resources
print_header "System Resource Check"
CPU_CORES=$(sysctl -n hw.ncpu 2>/dev/null || nproc 2>/dev/null || echo "unknown")
TOTAL_MEM=$(sysctl -n hw.memsize 2>/dev/null | awk '{print $1/1024/1024/1024 " GB"}' || free -h | awk '/^Mem:/{print $2}' || echo "unknown")

print_status "CPU Cores: $CPU_CORES"
print_status "Total Memory: $TOTAL_MEM"

# Check for GPU (NVIDIA)
if command -v nvidia-smi &> /dev/null; then
    GPU_INFO=$(nvidia-smi --query-gpu=name --format=csv,noheader,nounits | head -1)
    print_status "GPU found: $GPU_INFO"
    export CUDA_VISIBLE_DEVICES=all
else
    print_warning "No NVIDIA GPU found. Running in CPU-only mode."
    export FORCE_CPU_ONLY=true
fi

# Install dependencies
print_header "Installing Dependencies"
if [ ! -d "node_modules" ]; then
    print_status "Installing npm packages..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_status "Dependencies already installed"
fi

# Create logs directory
print_header "Preparing Environment"
mkdir -p logs data/local reports/local
print_status "Created local directories"

# Set environment variables
export NODE_ENV=production
export PORT=${PORT:-3100}
export LOG_LEVEL=${LOG_LEVEL:-info}
export AURIGRAPH_ENV=local

print_status "Environment configured for local deployment"

# Health check function
check_health() {
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for platform to start..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
            print_status "Platform is healthy!"
            return 0
        fi
        
        echo -n "."
        sleep 1
        attempt=$((attempt + 1))
    done
    
    print_error "Platform failed to start within 30 seconds"
    return 1
}

# Start the platform
print_header "Starting Aurigraph V10 Classical Platform"

# Option to start in background or foreground
if [ "$1" = "--background" ] || [ "$1" = "-d" ]; then
    print_status "Starting in background mode..."
    nohup npm start > logs/aurigraph-local.log 2>&1 &
    PID=$!
    echo $PID > logs/aurigraph.pid
    
    # Check if process started successfully
    sleep 2
    if kill -0 $PID 2>/dev/null; then
        print_status "Platform started with PID: $PID"
        
        # Wait for health check
        if check_health; then
            print_status "Platform successfully deployed locally!"
            echo ""
            echo "🌐 Access URLs:"
            echo "   Health Check: http://localhost:$PORT/health"
            echo "   API Docs: http://localhost:$PORT/api/classical/*"
            echo "   Logs: tail -f logs/aurigraph-local.log"
            echo ""
            echo "🔧 Management Commands:"
            echo "   Stop: ./deploy-local.sh --stop"
            echo "   Status: ./deploy-local.sh --status"
            echo "   Logs: ./deploy-local.sh --logs"
        fi
    else
        print_error "Failed to start platform"
        exit 1
    fi
    
elif [ "$1" = "--stop" ]; then
    print_header "Stopping Aurigraph Platform"
    if [ -f logs/aurigraph.pid ]; then
        PID=$(cat logs/aurigraph.pid)
        if kill -0 $PID 2>/dev/null; then
            kill $PID
            print_status "Platform stopped (PID: $PID)"
            rm logs/aurigraph.pid
        else
            print_warning "Platform not running"
        fi
    else
        print_warning "No PID file found"
    fi
    
elif [ "$1" = "--status" ]; then
    print_header "Platform Status"
    if [ -f logs/aurigraph.pid ]; then
        PID=$(cat logs/aurigraph.pid)
        if kill -0 $PID 2>/dev/null; then
            print_status "Platform is running (PID: $PID)"
            if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
                print_status "Platform is healthy"
            else
                print_warning "Platform process running but not responding"
            fi
        else
            print_error "Platform not running (stale PID file)"
            rm logs/aurigraph.pid
        fi
    else
        print_error "Platform not running"
    fi
    
elif [ "$1" = "--logs" ]; then
    print_header "Platform Logs"
    if [ -f logs/aurigraph-local.log ]; then
        tail -f logs/aurigraph-local.log
    else
        print_error "Log file not found"
    fi
    
elif [ "$1" = "--test" ]; then
    print_header "Testing Local Deployment"
    
    # Test health endpoint
    print_status "Testing health endpoint..."
    HEALTH=$(curl -s http://localhost:$PORT/health | jq -r '.status' 2>/dev/null || echo "failed")
    if [ "$HEALTH" = "healthy" ]; then
        print_status "✅ Health check passed"
    else
        print_error "❌ Health check failed"
    fi
    
    # Test metrics endpoint
    print_status "Testing metrics endpoint..."
    METRICS=$(curl -s http://localhost:$PORT/api/classical/metrics | jq -r '.success' 2>/dev/null || echo "false")
    if [ "$METRICS" = "true" ]; then
        print_status "✅ Metrics endpoint passed"
    else
        print_error "❌ Metrics endpoint failed"
    fi
    
    # Test benchmark
    print_status "Testing benchmark endpoint..."
    BENCHMARK=$(curl -s http://localhost:$PORT/api/classical/benchmark | jq -r '.success' 2>/dev/null || echo "false")
    if [ "$BENCHMARK" = "true" ]; then
        print_status "✅ Benchmark endpoint passed"
    else
        print_error "❌ Benchmark endpoint failed"
    fi
    
else
    # Start in foreground mode
    print_status "Starting in foreground mode..."
    print_status "Use Ctrl+C to stop"
    echo ""
    
    # Trap Ctrl+C
    trap 'echo ""; print_status "Shutting down..."; exit 0' INT
    
    npm start
fi