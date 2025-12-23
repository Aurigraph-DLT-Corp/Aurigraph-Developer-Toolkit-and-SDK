#!/bin/bash

# Deploy Aurigraph DLT to production server
# This script configures the platform for public access at dlt.aurigraph.io

echo "═══════════════════════════════════════════════════════"
echo "🚀 Aurigraph DLT - Production Deployment Script"
echo "═══════════════════════════════════════════════════════"
echo ""

# Configuration
DOMAIN="dlt.aurigraph.io"
APP_PORT="4004"
SERVER_IP="YOUR_SERVER_IP"  # Replace with actual server IP

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# Check if running locally or on server
if [ "$HOSTNAME" == "localhost" ] || [ "$HOSTNAME" == "*.local" ]; then
    print_warning "Running on local machine. Setting up tunnel for public access..."
    
    # Option 1: Using Cloudflare Tunnel (Recommended)
    if command -v cloudflared &> /dev/null; then
        print_status "Cloudflare Tunnel detected. Starting tunnel..."
        cloudflared tunnel --url http://localhost:$APP_PORT --hostname $DOMAIN &
        TUNNEL_PID=$!
        echo "Tunnel PID: $TUNNEL_PID"
        print_status "Tunnel started. Access at: https://$DOMAIN"
    
    # Option 2: Using ngrok
    elif command -v ngrok &> /dev/null; then
        print_status "ngrok detected. Starting tunnel..."
        print_warning "Note: ngrok requires authentication. Run: ngrok config add-authtoken YOUR_TOKEN"
        ngrok http $APP_PORT --hostname=$DOMAIN &
        TUNNEL_PID=$!
        echo "Tunnel PID: $TUNNEL_PID"
        print_status "Tunnel started. Check ngrok dashboard for URL"
    
    # Option 3: SSH Tunnel
    else
        print_warning "No tunnel software found. Use SSH tunnel for remote access:"
        echo ""
        echo "On your server, run:"
        echo "  ssh -R 80:localhost:$APP_PORT serveo.net"
        echo ""
        echo "Or install Cloudflare Tunnel:"
        echo "  brew install cloudflare/cloudflare/cloudflared"
    fi
    
else
    print_status "Running on server. Configuring for production..."
    
    # Install dependencies
    print_status "Installing system dependencies..."
    sudo apt-get update
    sudo apt-get install -y nginx certbot python3-certbot-nginx
    
    # Setup SSL Certificate
    print_status "Setting up SSL certificate with Let's Encrypt..."
    sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@aurigraph.io
    
    # Configure Nginx
    print_status "Configuring Nginx..."
    sudo cp nginx-config.conf /etc/nginx/sites-available/$DOMAIN
    sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    
    # Setup systemd service
    print_status "Creating systemd service..."
    cat > /tmp/aurigraph-dlt.service << EOF
[Unit]
Description=Aurigraph DLT Platform
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/npm run deploy:dev4
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=aurigraph-dlt
Environment="NODE_ENV=production"
Environment="PORT=$APP_PORT"

[Install]
WantedBy=multi-user.target
EOF
    
    sudo mv /tmp/aurigraph-dlt.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable aurigraph-dlt
    sudo systemctl start aurigraph-dlt
    
    print_status "Service started and enabled"
fi

# Verify deployment
echo ""
echo "═══════════════════════════════════════════════════════"
echo "📊 Deployment Status"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check local service
if curl -s http://localhost:$APP_PORT/health > /dev/null; then
    print_status "Local service is running on port $APP_PORT"
else
    print_error "Local service is not responding"
fi

# DNS Configuration Instructions
echo ""
echo "═══════════════════════════════════════════════════════"
echo "🌐 DNS Configuration Required"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Add the following DNS records to your domain registrar:"
echo ""
echo "Type: A"
echo "Name: dlt"
echo "Value: $SERVER_IP"
echo "TTL: 300"
echo ""
echo "Or if using Cloudflare:"
echo "1. Add A record pointing to your server IP"
echo "2. Enable Cloudflare Proxy (orange cloud)"
echo "3. Set SSL/TLS to 'Full (strict)'"
echo ""

# Access URLs
echo "═══════════════════════════════════════════════════════"
echo "🔗 Access URLs"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Local Access:"
echo "  • API: http://localhost:$APP_PORT"
echo "  • Health: http://localhost:$APP_PORT/health"
echo "  • Status: http://localhost:$APP_PORT/api/v10/status"
echo ""
echo "Public Access (after DNS configuration):"
echo "  • API: https://$DOMAIN"
echo "  • Health: https://$DOMAIN/health"
echo "  • Status: https://$DOMAIN/api/v10/status"
echo ""

# Performance check
echo "═══════════════════════════════════════════════════════"
echo "⚡ Performance Check"
echo "═══════════════════════════════════════════════════════"
echo ""
curl -s http://localhost:$APP_PORT/api/v10/status | jq '.performance' 2>/dev/null || echo "Unable to fetch performance metrics"

echo ""
print_status "Deployment script completed!"
echo ""
echo "Next steps:"
echo "1. Configure DNS records as shown above"
echo "2. Wait for DNS propagation (5-30 minutes)"
echo "3. Test access at https://$DOMAIN"
echo "4. Monitor logs: journalctl -u aurigraph-dlt -f"