#!/bin/bash

# Manual Deployment Script for Aurigraph DLT
# This script can be run locally to deploy to the production server

set -e

# Configuration
SERVER_USER="subbu"
SERVER_HOST="dlt.aurigraph.io"
SERVER_PORT="2235"
DOMAIN_NAME="dlt.aurigraph.io"
SSL_CERT_PATH="/etc/letsencrypt/live/aurcrt/fullchain.pem"
SSL_KEY_PATH="/etc/letsencrypt/live/aurcrt/privkey.pem"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Aurigraph DLT Manual Deployment Script${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

# Function to check command existence
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed${NC}"
        exit 1
    fi
}

# Check required commands
echo -e "${YELLOW}Checking requirements...${NC}"
check_command "npm"
check_command "ssh"
check_command "scp"
check_command "tar"

# Ask what to deploy
echo ""
echo "What would you like to deploy?"
echo "1) Frontend only"
echo "2) Backend only"
echo "3) Both Frontend and Backend"
echo "4) Just update nginx configuration"
read -p "Enter choice (1-4): " DEPLOY_CHOICE

# Change to project directory
cd "$(dirname "$0")"
PROJECT_ROOT=$(pwd)

# Deploy Frontend
deploy_frontend() {
    echo -e "${YELLOW}Building frontend...${NC}"
    cd "$PROJECT_ROOT/aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal-ui"
    
    # Create production environment file
    cat > .env.production << EOF
REACT_APP_API_URL=https://${DOMAIN_NAME}/api
REACT_APP_WS_URL=wss://${DOMAIN_NAME}/ws
REACT_APP_GRPC_URL=${DOMAIN_NAME}:9004

# IAM2 Authentication
REACT_APP_AUTH_API_URL=https://iam2.aurigraph.io/realms/AurigraphDLT
REACT_APP_IAM2_URL=https://iam2.aurigraph.io
REACT_APP_IAM2_REALM=AurigraphDLT
REACT_APP_IAM2_CLIENT_ID=aurigraph-portal
REACT_APP_IAM2_REDIRECT_URI=https://${DOMAIN_NAME}/auth/callback

# SSO Configuration
REACT_APP_SSO_ENABLED=true
REACT_APP_SSO_PROVIDER=oidc
REACT_APP_SSO_ENDPOINT=https://iam2.aurigraph.io/realms/AurigraphDLT/protocol/openid-connect/auth
REACT_APP_SSO_TOKEN_ENDPOINT=https://iam2.aurigraph.io/realms/AurigraphDLT/protocol/openid-connect/token
REACT_APP_SSO_LOGOUT_ENDPOINT=https://iam2.aurigraph.io/realms/AurigraphDLT/protocol/openid-connect/logout

REACT_APP_ENV=production
REACT_APP_ENABLE_WEBSOCKET=true
REACT_APP_ENABLE_MOCK_DATA=false
EOF

    # Install dependencies and build
    npm ci
    npm run build
    
    # Create archive
    tar -czf frontend-build.tar.gz build/
    
    echo -e "${YELLOW}Deploying frontend to server...${NC}"
    scp -P ${SERVER_PORT} frontend-build.tar.gz ${SERVER_USER}@${SERVER_HOST}:/tmp/
    
    ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
        set -e
        cd /tmp
        tar -xzf frontend-build.tar.gz
        sudo rm -rf /var/www/html/*
        sudo cp -r build/* /var/www/html/
        sudo chown -R www-data:www-data /var/www/html
        rm -rf build frontend-build.tar.gz
        echo "Frontend deployed successfully"
ENDSSH
    
    # Cleanup
    rm -f frontend-build.tar.gz
    echo -e "${GREEN}Frontend deployment complete!${NC}"
}

# Deploy Backend
deploy_backend() {
    echo -e "${YELLOW}Building backend...${NC}"
    cd "$PROJECT_ROOT/aurigraph-av10-7/aurigraph-v11-standalone"
    
    # Build JAR
    ./mvnw clean package -DskipTests -Dquarkus.package.jar.type=uber-jar
    
    # Copy to server
    echo -e "${YELLOW}Deploying backend to server...${NC}"
    scp -P ${SERVER_PORT} target/*-runner.jar ${SERVER_USER}@${SERVER_HOST}:/tmp/aurigraph-backend.jar
    
    ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
        set -e
        mkdir -p ~/aurigraph-deployment
        mv /tmp/aurigraph-backend.jar ~/aurigraph-deployment/
        echo "Backend JAR deployed successfully"
ENDSSH
    
    echo -e "${GREEN}Backend deployment complete!${NC}"
}

# Update nginx Configuration
update_nginx() {
    echo -e "${YELLOW}Creating nginx configuration...${NC}"
    
    cat > /tmp/nginx-production.conf << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name ${DOMAIN_NAME};
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl;
    http2 on;
    server_name ${DOMAIN_NAME};

    ssl_certificate ${SSL_CERT_PATH};
    ssl_certificate_key ${SSL_KEY_PATH};
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    root /usr/share/nginx/html;
    index index.html;
    
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    location /api/ {
        proxy_pass http://aurigraph-backend:9003/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /ws {
        proxy_pass http://aurigraph-backend:9003/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location = /api/auth/sso/config {
        default_type application/json;
        return 200 '{
            "enabled": true,
            "provider": "oidc",
            "endpoint": "https://iam2.aurigraph.io/realms/AurigraphDLT/protocol/openid-connect/auth",
            "clientId": "aurigraph-portal",
            "redirectUri": "https://${DOMAIN_NAME}/auth/callback",
            "scopes": ["openid", "profile", "email"]
        }';
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location / {
        try_files \$uri /index.html;
    }
}
EOF
    
    echo -e "${YELLOW}Deploying nginx configuration...${NC}"
    scp -P ${SERVER_PORT} /tmp/nginx-production.conf ${SERVER_USER}@${SERVER_HOST}:/tmp/
    
    ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
        set -e
        mkdir -p ~/aurigraph-deployment
        mv /tmp/nginx-production.conf ~/aurigraph-deployment/nginx.conf
        
        # Restart nginx container if it exists
        if docker ps | grep -q aurigraph-nginx; then
            docker stop aurigraph-nginx
            docker rm aurigraph-nginx
        fi
        
        docker run -d --name aurigraph-nginx \
            -p 80:80 -p 443:443 \
            -v /var/www/html:/usr/share/nginx/html:ro \
            -v ~/aurigraph-deployment/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
            -v /etc/letsencrypt/live/aurcrt:/etc/nginx/ssl:ro \
            --restart always \
            nginx:alpine
        
        echo "nginx configuration updated and container restarted"
ENDSSH
    
    rm -f /tmp/nginx-production.conf
    echo -e "${GREEN}nginx update complete!${NC}"
}

# Execute based on choice
case $DEPLOY_CHOICE in
    1)
        deploy_frontend
        update_nginx
        ;;
    2)
        deploy_backend
        ;;
    3)
        deploy_frontend
        deploy_backend
        update_nginx
        ;;
    4)
        update_nginx
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Verify deployment
echo ""
echo -e "${YELLOW}Verifying deployment...${NC}"
echo -e "Testing HTTPS connectivity..."
curl -k -s -o /dev/null -w "HTTPS Status: %{http_code}\n" https://${DOMAIN_NAME}

echo -e "Testing API endpoint..."
curl -k -s https://${DOMAIN_NAME}/api/auth/sso/config | python3 -m json.tool 2>/dev/null || echo "API endpoint test completed"

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}Site URL: https://${DOMAIN_NAME}${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "IAM2 Login Credentials:"
echo "  Username: aurdltadmin"
echo "  Password: Column@2025"
echo ""