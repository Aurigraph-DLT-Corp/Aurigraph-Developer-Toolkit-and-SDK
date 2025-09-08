#!/bin/bash

# Aurigraph V10 - Ngrok Public Access Setup
# ==========================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

echo "🌐 Aurigraph V10 - Ngrok Public Access Setup"
echo "============================================="

COMMAND=${1:-start}

case $COMMAND in
    start)
        print_step "Starting Aurigraph with Ngrok Public Access"
        
        # Check if platform is running
        if lsof -i:8080 > /dev/null 2>&1; then
            print_warn "Port 8080 already in use. Stopping existing instance..."
            lsof -ti:8080 | xargs kill -9 2>/dev/null
            sleep 2
        fi
        
        # Start the platform
        print_info "Starting Aurigraph V10 on port 8080..."
        
        if [ -f dist-dev4-simple/index.js ]; then
            cd dist-dev4-simple
            PORT=8080 HOST=0.0.0.0 node index.js > ../aurigraph.log 2>&1 &
            PLATFORM_PID=$!
            cd ..
        elif [ -f /tmp/aurigraph-dev4-local/index.js ]; then
            cd /tmp/aurigraph-dev4-local
            PORT=8080 HOST=0.0.0.0 node index.js > aurigraph.log 2>&1 &
            PLATFORM_PID=$!
            cd - > /dev/null
        else
            print_error "Platform files not found. Running prepare first..."
            ./deploy-dev4-simple.sh prepare
            cd dist-dev4-simple
            PORT=8080 HOST=0.0.0.0 node index.js > ../aurigraph.log 2>&1 &
            PLATFORM_PID=$!
            cd ..
        fi
        
        echo "Platform PID: $PLATFORM_PID" > .ngrok-session.pid
        
        # Wait for platform to start
        print_info "Waiting for platform to start..."
        sleep 3
        
        # Verify platform is running
        if curl -s http://localhost:8080/health > /dev/null 2>&1; then
            print_success "Platform is running on port 8080"
        else
            print_error "Platform failed to start. Check aurigraph.log"
            tail -20 aurigraph.log
            exit 1
        fi
        
        # Start ngrok
        print_info "Starting ngrok tunnel..."
        ngrok http 8080 --log stdout > ngrok.log 2>&1 &
        NGROK_PID=$!
        echo "Ngrok PID: $NGROK_PID" >> .ngrok-session.pid
        
        # Wait for ngrok to start
        sleep 5
        
        # Get ngrok URL
        print_step "Retrieving Public URL..."
        
        # Try to get URL from ngrok API
        NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"[^"]*' | grep -o 'https://[^"]*' | head -1)
        
        if [ -z "$NGROK_URL" ]; then
            print_warn "Couldn't retrieve URL automatically. Check ngrok dashboard at http://localhost:4040"
            print_info "Or look for the URL in the ngrok output below:"
            tail -10 ngrok.log | grep "https://"
        else
            echo ""
            echo "=========================================="
            echo -e "${GREEN}🎉 SUCCESS! Aurigraph V10 is now publicly accessible!${NC}"
            echo "=========================================="
            echo ""
            echo -e "${PURPLE}Public URL:${NC} ${NGROK_URL}"
            echo -e "${PURPLE}Local URL:${NC} http://localhost:8080"
            echo -e "${PURPLE}Ngrok Dashboard:${NC} http://localhost:4040"
            echo ""
            echo "=========================================="
            echo -e "${GREEN}Share this URL to access from anywhere:${NC}"
            echo -e "${BLUE}${NGROK_URL}${NC}"
            echo "=========================================="
            echo ""
            echo "Endpoints:"
            echo "  Dashboard: ${NGROK_URL}/"
            echo "  Health: ${NGROK_URL}/health"
            echo "  API: ${NGROK_URL}/api/classical/metrics"
            echo ""
            
            # Save URL to file
            echo "$NGROK_URL" > .ngrok-url.txt
            print_info "URL saved to .ngrok-url.txt"
        fi
        
        print_info "Platform and ngrok are running in background"
        print_info "To stop: ./setup-ngrok.sh stop"
        ;;
        
    status)
        print_step "Checking Ngrok Status"
        
        if [ -f .ngrok-url.txt ]; then
            NGROK_URL=$(cat .ngrok-url.txt)
            echo ""
            echo -e "${GREEN}Public URL:${NC} $NGROK_URL"
            
            # Test the URL
            if curl -s "$NGROK_URL/health" > /dev/null 2>&1; then
                print_success "Platform is accessible via ngrok"
            else
                print_warn "Ngrok URL not responding"
            fi
        else
            print_warn "No active ngrok session found"
        fi
        
        # Check processes
        if lsof -i:8080 > /dev/null 2>&1; then
            print_success "Platform is running on port 8080"
        else
            print_warn "Platform not running"
        fi
        
        if pgrep ngrok > /dev/null; then
            print_success "Ngrok is running"
            echo "Dashboard: http://localhost:4040"
        else
            print_warn "Ngrok not running"
        fi
        ;;
        
    stop)
        print_step "Stopping Ngrok and Platform"
        
        # Kill ngrok
        if pgrep ngrok > /dev/null; then
            pkill ngrok
            print_info "Stopped ngrok"
        fi
        
        # Kill platform
        if lsof -i:8080 > /dev/null 2>&1; then
            lsof -ti:8080 | xargs kill -9 2>/dev/null
            print_info "Stopped platform"
        fi
        
        # Clean up files
        rm -f .ngrok-url.txt .ngrok-session.pid
        
        print_success "All services stopped"
        ;;
        
    restart)
        print_step "Restarting Services"
        $0 stop
        sleep 2
        $0 start
        ;;
        
    logs)
        print_step "Viewing Logs"
        
        echo ""
        echo "=== Platform Logs ==="
        tail -20 aurigraph.log 2>/dev/null || echo "No platform logs found"
        
        echo ""
        echo "=== Ngrok Logs ==="
        tail -20 ngrok.log 2>/dev/null || echo "No ngrok logs found"
        ;;
        
    test)
        print_step "Testing Public Access"
        
        if [ -f .ngrok-url.txt ]; then
            NGROK_URL=$(cat .ngrok-url.txt)
            
            echo ""
            echo "Testing: $NGROK_URL"
            echo ""
            
            # Test health endpoint
            echo "1. Health Check:"
            curl -s "$NGROK_URL/health" | jq '.status, .version' 2>/dev/null || echo "Failed"
            
            echo ""
            echo "2. Metrics:"
            curl -s "$NGROK_URL/api/classical/metrics" | jq '.success' 2>/dev/null || echo "Failed"
            
            echo ""
            echo "3. Benchmark:"
            curl -s "$NGROK_URL/api/classical/benchmark" | jq '.benchmark.throughput' 2>/dev/null || echo "Failed"
            
            echo ""
            print_info "Full URL: $NGROK_URL"
        else
            print_error "No ngrok URL found. Run './setup-ngrok.sh start' first"
        fi
        ;;
        
    dashboard)
        print_step "Opening Ngrok Dashboard"
        
        if pgrep ngrok > /dev/null; then
            print_info "Opening http://localhost:4040"
            open http://localhost:4040 2>/dev/null || xdg-open http://localhost:4040 2>/dev/null || echo "Visit: http://localhost:4040"
        else
            print_error "Ngrok not running. Start with: ./setup-ngrok.sh start"
        fi
        ;;
        
    url)
        if [ -f .ngrok-url.txt ]; then
            cat .ngrok-url.txt
        else
            print_error "No active ngrok session"
            exit 1
        fi
        ;;
        
    *)
        echo "Usage: $0 {start|stop|restart|status|test|logs|dashboard|url}"
        echo ""
        echo "Commands:"
        echo "  start     - Start platform and ngrok tunnel"
        echo "  stop      - Stop all services"
        echo "  restart   - Restart services"
        echo "  status    - Check service status"
        echo "  test      - Test public access"
        echo "  logs      - View logs"
        echo "  dashboard - Open ngrok dashboard"
        echo "  url       - Show public URL only"
        echo ""
        echo "Quick start:"
        echo "  $0 start"
        exit 1
        ;;
esac