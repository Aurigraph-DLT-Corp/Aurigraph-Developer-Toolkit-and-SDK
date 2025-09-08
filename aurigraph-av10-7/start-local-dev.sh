#!/bin/bash

# Aurigraph V10 Classical - Simple Local Development
echo "🚀 Starting Aurigraph V10 Classical (Development Mode)"
echo "====================================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[DEV]${NC} $1"
}

# Set development environment
export NODE_ENV=development
export PORT=3100
export LOG_LEVEL=debug

# Create necessary directories
mkdir -p logs data/dev

print_header "Environment Setup"
print_info "Environment: $NODE_ENV"
print_info "Port: $PORT"
print_info "Log Level: $LOG_LEVEL"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_header "Installing Dependencies"
    npm install
fi

print_header "Starting Platform"
print_info "Platform will restart automatically on file changes"
print_info "Access: http://localhost:$PORT"
print_info "Health: http://localhost:$PORT/health"
print_info "API: http://localhost:$PORT/api/classical/*"
print_info ""
print_info "Press Ctrl+C to stop"
print_info ""

# Start with auto-reload
npx ts-node-dev --respawn --transpile-only src/index-classical-simple.ts