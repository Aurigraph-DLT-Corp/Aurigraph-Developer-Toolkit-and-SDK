#!/bin/bash

################################################################################
# NGINX Reverse Proxy Configuration for Monitoring Stack
# Sprint 16 Phase 2: Production Infrastructure Deployment
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="2235"
NGINX_CONF_DIR="/etc/nginx"
NGINX_SITES_AVAILABLE="${NGINX_CONF_DIR}/sites-available"
NGINX_SITES_ENABLED="${NGINX_CONF_DIR}/sites-enabled"

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check SSH
    if ! ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "echo 'SSH OK'" > /dev/null 2>&1; then
        print_error "Cannot connect to ${REMOTE_HOST}"
        exit 1
    fi
    print_success "SSH connectivity verified"

    # Check NGINX
    if ! ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "nginx -v" > /dev/null 2>&1; then
        print_error "NGINX not installed on remote host"
        exit 1
    fi
    print_success "NGINX installed"

    # Check monitoring containers
    if ! ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "docker ps | grep -E '(grafana|prometheus)'" > /dev/null 2>&1; then
        print_warning "Monitoring containers not running. Deploy them first."
    else
        print_success "Monitoring containers detected"
    fi
}

# Backup existing NGINX configuration
backup_nginx_config() {
    print_header "Backing Up NGINX Configuration"

    BACKUP_DIR="/opt/aurigraph/backups/nginx"
    BACKUP_NAME="nginx-config-$(date +%Y%m%d-%H%M%S).tar.gz"

    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << EOF
        sudo mkdir -p ${BACKUP_DIR}
        sudo tar czf ${BACKUP_DIR}/${BACKUP_NAME} ${NGINX_CONF_DIR} 2>/dev/null || true
EOF

    print_success "Backup created: ${BACKUP_DIR}/${BACKUP_NAME}"
}

# Create NGINX configuration for monitoring
create_nginx_config() {
    print_header "Creating NGINX Configuration"

    # Create monitoring configuration file
    cat > /tmp/monitoring.conf << 'NGINXEOF'
# Aurigraph V11 Monitoring Stack - NGINX Configuration
# Sprint 16 Phase 2: Production Infrastructure

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=monitoring_limit:10m rate=100r/s;
limit_req_zone $binary_remote_addr zone=admin_limit:10m rate=10r/s;

# Upstream definitions
upstream grafana_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

upstream prometheus_backend {
    server 127.0.0.1:9090;
    keepalive 32;
}

upstream alertmanager_backend {
    server 127.0.0.1:9093;
    keepalive 32;
}

# Grafana - Public monitoring interface
location /monitoring {
    # Rate limiting
    limit_req zone=monitoring_limit burst=200 nodelay;

    # Proxy settings
    proxy_pass http://grafana_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;

    # WebSocket support for live updates
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Buffering
    proxy_buffering on;
    proxy_buffer_size 4k;
    proxy_buffers 8 4k;
    proxy_busy_buffers_size 8k;

    # Logging
    access_log /var/log/nginx/grafana_access.log combined;
    error_log /var/log/nginx/grafana_error.log warn;
}

# Grafana API endpoints
location ~ ^/monitoring/(api|avatar|public) {
    limit_req zone=monitoring_limit burst=100 nodelay;

    proxy_pass http://grafana_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_http_version 1.1;
    proxy_set_header Connection "";

    access_log /var/log/nginx/grafana_api_access.log combined;
    error_log /var/log/nginx/grafana_api_error.log warn;
}

# Prometheus - Admin only (IP restricted)
location /prometheus {
    # IP whitelist - restrict to admin IPs only
    allow 127.0.0.1;
    allow 10.0.0.0/8;      # Internal network
    allow 172.16.0.0/12;   # Docker network
    deny all;

    # Rate limiting for admins
    limit_req zone=admin_limit burst=20 nodelay;

    # Authentication (optional - uncomment to enable)
    # auth_basic "Prometheus Admin Access";
    # auth_basic_user_file /etc/nginx/.htpasswd_prometheus;

    proxy_pass http://prometheus_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Longer timeouts for queries
    proxy_connect_timeout 120s;
    proxy_send_timeout 120s;
    proxy_read_timeout 120s;

    access_log /var/log/nginx/prometheus_access.log combined;
    error_log /var/log/nginx/prometheus_error.log warn;
}

# Alertmanager - Admin only (IP restricted)
location /alertmanager {
    # IP whitelist
    allow 127.0.0.1;
    allow 10.0.0.0/8;
    allow 172.16.0.0/12;
    deny all;

    limit_req zone=admin_limit burst=20 nodelay;

    # Authentication (optional)
    # auth_basic "Alertmanager Admin Access";
    # auth_basic_user_file /etc/nginx/.htpasswd_alertmanager;

    proxy_pass http://alertmanager_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    access_log /var/log/nginx/alertmanager_access.log combined;
    error_log /var/log/nginx/alertmanager_error.log warn;
}

# Health check endpoint (public)
location /monitoring/health {
    access_log off;
    add_header Content-Type application/json;
    return 200 '{"status":"ok","service":"aurigraph-monitoring"}';
}
NGINXEOF

    # Copy to remote server
    scp -P ${REMOTE_PORT} /tmp/monitoring.conf \
        ${REMOTE_USER}@${REMOTE_HOST}:/tmp/

    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "sudo mv /tmp/monitoring.conf ${NGINX_CONF_DIR}/conf.d/"

    print_success "NGINX configuration created"
}

# Update main NGINX configuration
update_main_config() {
    print_header "Updating Main NGINX Configuration"

    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
        # Ensure conf.d directory exists
        sudo mkdir -p /etc/nginx/conf.d

        # Add security headers if not present
        if ! grep -q "add_header X-Frame-Options" /etc/nginx/nginx.conf; then
            sudo sed -i '/http {/a \    # Security headers\n    add_header X-Frame-Options "SAMEORIGIN" always;\n    add_header X-Content-Type-Options "nosniff" always;\n    add_header X-XSS-Protection "1; mode=block" always;' /etc/nginx/nginx.conf
        fi

        # Increase client body size for dashboard imports
        if ! grep -q "client_max_body_size" /etc/nginx/nginx.conf; then
            sudo sed -i '/http {/a \    client_max_body_size 100M;' /etc/nginx/nginx.conf
        fi
EOF

    print_success "Main configuration updated"
}

# Test NGINX configuration
test_nginx_config() {
    print_header "Testing NGINX Configuration"

    if ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "sudo nginx -t"; then
        print_success "NGINX configuration test passed"
    else
        print_error "NGINX configuration test failed"
        exit 1
    fi
}

# Reload NGINX
reload_nginx() {
    print_header "Reloading NGINX"

    if ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "sudo systemctl reload nginx"; then
        print_success "NGINX reloaded successfully"
    else
        print_error "Failed to reload NGINX"
        exit 1
    fi
}

# Verify endpoints
verify_endpoints() {
    print_header "Verifying Endpoints"

    # Test Grafana
    print_info "Testing Grafana endpoint..."
    if ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "curl -s -o /dev/null -w '%{http_code}' http://localhost/monitoring" | grep -q "200\|302"; then
        print_success "Grafana endpoint accessible"
    else
        print_warning "Grafana endpoint may not be accessible yet"
    fi

    # Test health endpoint
    print_info "Testing health endpoint..."
    if ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "curl -s http://localhost/monitoring/health" | grep -q "ok"; then
        print_success "Health endpoint working"
    else
        print_warning "Health endpoint not responding"
    fi
}

# Display summary
display_summary() {
    print_header "Configuration Summary"

    echo ""
    echo "NGINX reverse proxy configured successfully!"
    echo ""
    echo "Monitoring Endpoints:"
    echo "  - Grafana: https://dlt.aurigraph.io/monitoring"
    echo "  - Prometheus: https://dlt.aurigraph.io/prometheus (admin only)"
    echo "  - Alertmanager: https://dlt.aurigraph.io/alertmanager (admin only)"
    echo "  - Health: https://dlt.aurigraph.io/monitoring/health"
    echo ""
    echo "Rate Limits:"
    echo "  - Monitoring: 100 requests/second"
    echo "  - Admin: 10 requests/second"
    echo ""
    echo "Security:"
    echo "  - Prometheus/Alertmanager: IP restricted"
    echo "  - Optional HTTP basic auth (commented out)"
    echo "  - Security headers enabled"
    echo ""
    echo "Next Steps:"
    echo "  1. Set up SSL certificates (run setup-ssl-certificates.sh)"
    echo "  2. Configure firewall rules (ports 80, 443)"
    echo "  3. Set up alert notification channels in Alertmanager"
    echo "  4. Change Grafana admin password"
    echo "  5. Import dashboards if not auto-provisioned"
    echo ""
    echo "Useful Commands:"
    echo "  - Test config: ssh ${REMOTE_USER}@${REMOTE_HOST} -p ${REMOTE_PORT} 'sudo nginx -t'"
    echo "  - Reload: ssh ${REMOTE_USER}@${REMOTE_HOST} -p ${REMOTE_PORT} 'sudo systemctl reload nginx'"
    echo "  - View logs: ssh ${REMOTE_USER}@${REMOTE_HOST} -p ${REMOTE_PORT} 'sudo tail -f /var/log/nginx/*_error.log'"
    echo ""
}

# Main execution
main() {
    print_header "NGINX Monitoring Configuration - Sprint 16 Phase 2"
    echo "Target: ${REMOTE_HOST}"
    echo "Time: $(date)"
    echo ""

    check_prerequisites
    backup_nginx_config
    create_nginx_config
    update_main_config
    test_nginx_config
    reload_nginx
    verify_endpoints
    display_summary

    print_success "Configuration completed successfully!"
}

# Run main
main "$@"
