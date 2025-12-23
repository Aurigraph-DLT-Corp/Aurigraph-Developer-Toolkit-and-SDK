#!/bin/bash

# Aurigraph V11 - Local Domain Setup & Deployment
# ================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

echo "🌐 Aurigraph V11 - Domain Setup & Local Deployment"
echo "=================================================="

COMMAND=${1:-status}

case $COMMAND in
    status)
        print_step "Checking Domain & DNS Status"
        
        echo ""
        echo "Main Domain (aurigraph.io):"
        nslookup aurigraph.io 2>/dev/null | grep -A1 "Name:" || echo "  ❌ Not found"
        
        echo ""
        echo "Subdomain (dlt.aurigraph.io):"
        nslookup dlt.aurigraph.io 2>/dev/null | grep -A1 "Name:" || echo "  ❌ Not configured in DNS"
        
        echo ""
        echo "Local /etc/hosts entry:"
        grep "dlt.aurigraph.io" /etc/hosts || echo "  ❌ No local entry"
        
        echo ""
        print_info "DNS Configuration Required:"
        echo "  Option 1: Add DNS A record for dlt.aurigraph.io → Your server IP"
        echo "  Option 2: Use local /etc/hosts for testing"
        echo "  Option 3: Deploy to existing domain/subdomain"
        ;;
        
    setup-local)
        print_step "Setting Up Local Domain Access"
        
        print_info "This will add dlt.aurigraph.io to your /etc/hosts file"
        print_warn "Requires sudo access"
        
        # Check if entry already exists
        if grep -q "dlt.aurigraph.io" /etc/hosts; then
            print_warn "Entry already exists in /etc/hosts"
            grep "dlt.aurigraph.io" /etc/hosts
        else
            echo ""
            echo "Adding to /etc/hosts:"
            echo "127.0.0.1    dlt.aurigraph.io"
            echo ""
            
            # Add entry
            echo "127.0.0.1    dlt.aurigraph.io" | sudo tee -a /etc/hosts > /dev/null
            
            if [ $? -eq 0 ]; then
                print_info "✅ Added dlt.aurigraph.io → 127.0.0.1 to /etc/hosts"
            else
                print_error "Failed to update /etc/hosts"
                exit 1
            fi
        fi
        
        print_info "You can now access the platform at http://dlt.aurigraph.io:8080 (when running)"
        ;;
        
    run-with-domain)
        print_step "Running Platform with Domain Configuration"
        
        # Check if hosts entry exists
        if ! grep -q "dlt.aurigraph.io" /etc/hosts; then
            print_warn "No local hosts entry found. Run './deploy-local-domain.sh setup-local' first"
            print_info "Or you can still access via http://localhost:8080"
        fi
        
        # Kill any existing instance on port 8080
        lsof -ti:8080 | xargs kill -9 2>/dev/null
        
        print_info "Starting Aurigraph V11 on port 8080..."
        print_info "Domain: dlt.aurigraph.io"
        print_info "Local: http://localhost:8080"
        
        if [ -f dist-dev4-simple/index.js ]; then
            cd dist-dev4-simple
            PORT=8080 HOST=0.0.0.0 node index.js
        else
            print_error "Deployment package not found. Run './deploy-dev4-simple.sh prepare' first"
            exit 1
        fi
        ;;
        
    nginx-local)
        print_step "Setting Up Local Nginx Proxy"
        
        print_info "Creating nginx configuration for local development"
        
        cat > /tmp/dlt.aurigraph.local.conf << 'EOF'
server {
    listen 80;
    server_name dlt.aurigraph.io localhost;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://localhost:8080/health;
        access_log off;
    }
}
EOF
        
        print_info "Nginx configuration created at /tmp/dlt.aurigraph.local.conf"
        
        if command -v nginx &> /dev/null; then
            print_info "To use with nginx:"
            echo "  1. sudo cp /tmp/dlt.aurigraph.local.conf /usr/local/etc/nginx/servers/"
            echo "  2. sudo nginx -s reload"
            echo "  3. Access at http://dlt.aurigraph.io (port 80)"
        else
            print_warn "Nginx not installed. Install with: brew install nginx"
        fi
        ;;
        
    dns-setup)
        print_step "DNS Configuration Instructions"
        
        echo ""
        echo "To make dlt.aurigraph.io publicly accessible:"
        echo ""
        echo "1. LOGIN to your DNS provider (where aurigraph.io is registered)"
        echo ""
        echo "2. ADD an A record:"
        echo "   Type: A"
        echo "   Name: dlt"
        echo "   Value: <Your-Server-IP>"
        echo "   TTL: 300 (5 minutes for testing)"
        echo ""
        echo "3. For LOCAL testing without DNS:"
        echo "   Run: ./deploy-local-domain.sh setup-local"
        echo ""
        echo "4. Current aurigraph.io IP: $(nslookup aurigraph.io | grep Address | tail -1 | awk '{print $2}')"
        echo ""
        echo "5. If deploying to the SAME server as aurigraph.io:"
        echo "   Use IP: 151.242.51.23"
        echo ""
        print_info "DNS propagation typically takes 5-30 minutes"
        ;;
        
    deploy-alternative)
        print_step "Alternative Deployment Options"
        
        echo ""
        echo "Since dlt.aurigraph.io DNS is not configured, here are alternatives:"
        echo ""
        echo "OPTION 1: Local Development (Recommended for now)"
        echo "  ./deploy-local-domain.sh setup-local"
        echo "  ./deploy-local-domain.sh run-with-domain"
        echo "  Access: http://dlt.aurigraph.io:8080"
        echo ""
        echo "OPTION 2: Deploy to main domain subdirectory"
        echo "  Deploy to: aurigraph.io/dlt/"
        echo "  Server IP: 151.242.51.23"
        echo ""
        echo "OPTION 3: Use ngrok for public access"
        echo "  npm install -g ngrok"
        echo "  ngrok http 8080"
        echo "  Get public URL from ngrok"
        echo ""
        echo "OPTION 4: Deploy to cloud platform"
        echo "  - AWS EC2 with Elastic IP"
        echo "  - Google Cloud Platform"
        echo "  - DigitalOcean Droplet"
        echo "  - Heroku (with modifications)"
        echo ""
        print_info "Run './deploy-local-domain.sh setup-local' to start with local testing"
        ;;
        
    test-access)
        print_step "Testing Domain Access"
        
        # Test different access methods
        echo ""
        echo "Testing access methods:"
        echo ""
        
        # Local hosts file
        if grep -q "dlt.aurigraph.io" /etc/hosts; then
            print_info "✅ Local hosts entry exists"
            curl -s -o /dev/null -w "  http://dlt.aurigraph.io:8080 - %{http_code}\n" http://dlt.aurigraph.io:8080/health || echo "  ❌ Not running"
        else
            print_warn "No local hosts entry"
        fi
        
        # Localhost
        curl -s -o /dev/null -w "  http://localhost:8080 - %{http_code}\n" http://localhost:8080/health || echo "  ❌ Not running on 8080"
        
        # Check if platform is running
        if lsof -i:8080 > /dev/null 2>&1; then
            PID=$(lsof -ti:8080)
            print_info "✅ Platform running on port 8080 (PID: $PID)"
        else
            print_warn "Platform not running on port 8080"
            echo "  Run: ./deploy-local-domain.sh run-with-domain"
        fi
        ;;
        
    *)
        echo "Usage: $0 {status|setup-local|run-with-domain|nginx-local|dns-setup|deploy-alternative|test-access}"
        echo ""
        echo "Commands:"
        echo "  status            - Check domain and DNS status"
        echo "  setup-local       - Add dlt.aurigraph.io to /etc/hosts"
        echo "  run-with-domain   - Start platform with domain config"
        echo "  nginx-local       - Setup local nginx proxy"
        echo "  dns-setup         - Show DNS configuration instructions"
        echo "  deploy-alternative - Show alternative deployment options"
        echo "  test-access       - Test all access methods"
        echo ""
        echo "Quick start:"
        echo "  $0 setup-local"
        echo "  $0 run-with-domain"
        exit 1
        ;;
esac