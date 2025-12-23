#!/bin/bash

################################################################################
# SSL/TLS Certificate Setup Script
# Sprint 16 Phase 2: Production Infrastructure Deployment
# Uses Let's Encrypt with Certbot for automated SSL certificate management
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
DOMAIN="dlt.aurigraph.io"
EMAIL="sjoish12@gmail.com"
WEBROOT="/var/www/html"
CERT_DIR="/etc/letsencrypt"

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

    # Check if running as sudo is possible
    if ! ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "sudo -n true" 2>/dev/null; then
        print_warning "Sudo access may require password"
    else
        print_success "Sudo access verified"
    fi

    # Check DNS resolution
    if ! ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "nslookup ${DOMAIN}" > /dev/null 2>&1; then
        print_error "DNS resolution failed for ${DOMAIN}"
        exit 1
    fi
    print_success "DNS resolution verified"

    # Check NGINX
    if ! ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "nginx -v" > /dev/null 2>&1; then
        print_error "NGINX not installed"
        exit 1
    fi
    print_success "NGINX verified"
}

# Install Certbot
install_certbot() {
    print_header "Installing Certbot"

    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
        # Check if certbot is already installed
        if command -v certbot > /dev/null 2>&1; then
            echo "Certbot already installed: $(certbot --version)"
            exit 0
        fi

        # Install certbot
        if [ -f /etc/debian_version ]; then
            # Debian/Ubuntu
            sudo apt-get update
            sudo apt-get install -y certbot python3-certbot-nginx
        elif [ -f /etc/redhat-release ]; then
            # RHEL/CentOS
            sudo yum install -y epel-release
            sudo yum install -y certbot python3-certbot-nginx
        else
            echo "Unsupported OS"
            exit 1
        fi
EOF

    print_success "Certbot installed"
}

# Create webroot directory
create_webroot() {
    print_header "Creating Webroot Directory"

    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << EOF
        sudo mkdir -p ${WEBROOT}/.well-known/acme-challenge
        sudo chown -R www-data:www-data ${WEBROOT} 2>/dev/null || sudo chown -R nginx:nginx ${WEBROOT}
        sudo chmod -R 755 ${WEBROOT}
EOF

    print_success "Webroot directory created"
}

# Configure NGINX for ACME challenge
configure_nginx_acme() {
    print_header "Configuring NGINX for ACME Challenge"

    cat > /tmp/acme-challenge.conf << 'NGINXEOF'
# ACME challenge configuration for Let's Encrypt
server {
    listen 80;
    listen [::]:80;
    server_name dlt.aurigraph.io;

    # ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    # Redirect all other HTTP traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}
NGINXEOF

    scp -P ${REMOTE_PORT} /tmp/acme-challenge.conf \
        ${REMOTE_USER}@${REMOTE_HOST}:/tmp/

    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
        sudo mv /tmp/acme-challenge.conf /etc/nginx/conf.d/acme-challenge.conf
        sudo nginx -t
        sudo systemctl reload nginx
EOF

    print_success "NGINX configured for ACME challenge"
}

# Obtain SSL certificate
obtain_certificate() {
    print_header "Obtaining SSL Certificate"

    print_info "Requesting certificate from Let's Encrypt..."
    print_info "Domain: ${DOMAIN}"
    print_info "Email: ${EMAIL}"

    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << EOF
        sudo certbot certonly \
            --webroot \
            --webroot-path=${WEBROOT} \
            --email ${EMAIL} \
            --agree-tos \
            --no-eff-email \
            --domain ${DOMAIN} \
            --non-interactive \
            --verbose
EOF

    if [ $? -eq 0 ]; then
        print_success "SSL certificate obtained successfully"
    else
        print_error "Failed to obtain SSL certificate"
        print_info "Check certbot logs for details"
        exit 1
    fi
}

# Configure NGINX with SSL
configure_nginx_ssl() {
    print_header "Configuring NGINX with SSL"

    cat > /tmp/ssl-monitoring.conf << 'NGINXEOF'
# Aurigraph V11 Monitoring - HTTPS Configuration
# SSL/TLS with Let's Encrypt

# HTTP redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name dlt.aurigraph.io;

    # ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/html;
        allow all;
    }

    # Redirect to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dlt.aurigraph.io;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/dlt.aurigraph.io/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dlt.aurigraph.io/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/dlt.aurigraph.io/chain.pem;

    # SSL protocols and ciphers (Mozilla Intermediate)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;

    # SSL session settings
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_session_tickets off;

    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Content Security Policy
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self';" always;

    # Logging
    access_log /var/log/nginx/monitoring_https_access.log combined;
    error_log /var/log/nginx/monitoring_https_error.log warn;

    # Client settings
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Root location - redirect to monitoring
    location = / {
        return 301 /monitoring;
    }

    # Backend API
    location /api/v11 {
        proxy_pass http://127.0.0.1:9003;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }

    # Include monitoring endpoints
    include /etc/nginx/conf.d/monitoring.conf;
}
NGINXEOF

    scp -P ${REMOTE_PORT} /tmp/ssl-monitoring.conf \
        ${REMOTE_USER}@${REMOTE_HOST}:/tmp/

    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
        # Remove ACME challenge config (now part of main config)
        sudo rm -f /etc/nginx/conf.d/acme-challenge.conf

        # Move new SSL config
        sudo mv /tmp/ssl-monitoring.conf /etc/nginx/sites-available/monitoring-ssl.conf
        sudo ln -sf /etc/nginx/sites-available/monitoring-ssl.conf /etc/nginx/sites-enabled/

        # Test configuration
        sudo nginx -t

        # Reload NGINX
        sudo systemctl reload nginx
EOF

    print_success "NGINX configured with SSL"
}

# Set up automatic renewal
setup_auto_renewal() {
    print_header "Setting Up Automatic Certificate Renewal"

    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
        # Create renewal hook script
        sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy

        cat > /tmp/nginx-reload.sh << 'HOOKEOF'
#!/bin/bash
# Reload NGINX after certificate renewal
systemctl reload nginx
HOOKEOF

        sudo mv /tmp/nginx-reload.sh /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh
        sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/nginx-reload.sh

        # Test renewal process (dry run)
        echo "Testing renewal process (dry run)..."
        sudo certbot renew --dry-run
EOF

    print_success "Automatic renewal configured"
    print_info "Certbot will automatically renew certificates via systemd timer"
}

# Verify SSL configuration
verify_ssl() {
    print_header "Verifying SSL Configuration"

    print_info "Checking SSL certificate..."
    if ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "sudo certbot certificates" | grep -q "${DOMAIN}"; then
        print_success "Certificate found for ${DOMAIN}"
    else
        print_error "Certificate not found"
        exit 1
    fi

    print_info "Testing HTTPS endpoint..."
    if ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "curl -k -s -o /dev/null -w '%{http_code}' https://localhost/monitoring" | grep -q "200\|302"; then
        print_success "HTTPS endpoint responding"
    else
        print_warning "HTTPS endpoint may not be accessible yet"
    fi

    print_info "Checking SSL protocols..."
    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "openssl s_client -connect localhost:443 -tls1_2 < /dev/null 2>/dev/null | grep 'Protocol' || true"
}

# Display summary
display_summary() {
    print_header "SSL Certificate Summary"

    CERT_INFO=$(ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "sudo certbot certificates 2>/dev/null | grep -A 5 '${DOMAIN}' || echo 'Not available'")

    echo ""
    echo "SSL/TLS certificates configured successfully!"
    echo ""
    echo "Certificate Information:"
    echo "${CERT_INFO}"
    echo ""
    echo "Secure URLs:"
    echo "  - Monitoring: https://dlt.aurigraph.io/monitoring"
    echo "  - API: https://dlt.aurigraph.io/api/v11"
    echo ""
    echo "Certificate Details:"
    echo "  - Provider: Let's Encrypt"
    echo "  - Domain: ${DOMAIN}"
    echo "  - Email: ${EMAIL}"
    echo "  - Auto-renewal: Enabled (via systemd)"
    echo ""
    echo "Security Features:"
    echo "  - TLS 1.2 and 1.3 only"
    echo "  - Modern cipher suites (Mozilla Intermediate)"
    echo "  - HSTS enabled (63072000 seconds)"
    echo "  - OCSP stapling enabled"
    echo "  - Security headers configured"
    echo ""
    echo "Certificate Renewal:"
    echo "  - Automatic renewal via certbot systemd timer"
    echo "  - Check renewal: sudo certbot renew --dry-run"
    echo "  - View certificates: sudo certbot certificates"
    echo ""
    echo "Useful Commands:"
    echo "  - Renew manually: ssh ${REMOTE_USER}@${REMOTE_HOST} -p ${REMOTE_PORT} 'sudo certbot renew'"
    echo "  - Check cert: ssh ${REMOTE_USER}@${REMOTE_HOST} -p ${REMOTE_PORT} 'sudo certbot certificates'"
    echo "  - Test config: ssh ${REMOTE_USER}@${REMOTE_HOST} -p ${REMOTE_PORT} 'sudo nginx -t'"
    echo ""
    echo "Next Steps:"
    echo "  1. Test SSL: https://www.ssllabs.com/ssltest/analyze.html?d=${DOMAIN}"
    echo "  2. Configure firewall to allow ports 80 and 443"
    echo "  3. Set up monitoring for certificate expiration"
    echo ""
}

# Main execution
main() {
    print_header "SSL/TLS Certificate Setup - Sprint 16 Phase 2"
    echo "Target: ${REMOTE_HOST}"
    echo "Domain: ${DOMAIN}"
    echo "Time: $(date)"
    echo ""

    check_prerequisites
    install_certbot
    create_webroot
    configure_nginx_acme
    obtain_certificate
    configure_nginx_ssl
    setup_auto_renewal
    verify_ssl
    display_summary

    print_success "SSL setup completed successfully!"
}

# Run main
main "$@"
