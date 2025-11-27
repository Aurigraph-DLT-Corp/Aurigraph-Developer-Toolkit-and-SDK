#!/bin/bash

##############################################################################
# Aurigraph V12 Deployment Script
# Quick deployment to production server
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REMOTE_HOST="${REMOTE_HOST:-dlt.aurigraph.io}"
REMOTE_PORT="${REMOTE_PORT:-22}"
REMOTE_USER="${REMOTE_USER:-subbu}"
DEPLOY_PROFILE="${DEPLOY_PROFILE:-platform}"  # platform, validators, nodes, or full

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         🚀 AURIGRAPH V12 DEPLOYMENT SCRIPT                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}📊 Configuration:${NC}"
echo "   Host: $REMOTE_HOST"
echo "   Port: $REMOTE_PORT"
echo "   User: $REMOTE_USER"
echo "   Profile: $DEPLOY_PROFILE"
echo ""

# Check if we're on V12 branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "V12" ]; then
    echo -e "${YELLOW}⚠️  Warning: Not on V12 branch (current: $CURRENT_BRANCH)${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
fi

# Get current commit
COMMIT_HASH=$(git rev-parse --short HEAD)
echo -e "${GREEN}✓ Current commit: $COMMIT_HASH${NC}"
echo ""

# Test SSH connection
echo -e "${BLUE}🔍 Testing SSH connection...${NC}"
if ssh -p $REMOTE_PORT -o ConnectTimeout=10 -o BatchMode=yes $REMOTE_USER@$REMOTE_HOST "echo 'OK'" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${RED}✗ SSH connection failed${NC}"
    echo "Please check your SSH configuration and try again."
    exit 1
fi
echo ""

# Choose deployment method
echo -e "${BLUE}📦 Choose deployment method:${NC}"
echo "   1) Node.js Deployment Agent (Recommended - Intelligent)"
echo "   2) Direct Shell Script (Fast)"
echo "   3) Manual (SSH and run commands)"
echo ""
read -p "Select option (1-3): " -n 1 -r DEPLOY_METHOD
echo ""
echo ""

case $DEPLOY_METHOD in
    1)
        echo -e "${GREEN}🤖 Using Node.js Deployment Agent...${NC}"
        echo ""
        if [ ! -f "deploy-to-remote.js" ]; then
            echo -e "${RED}✗ deploy-to-remote.js not found${NC}"
            exit 1
        fi

        # Set environment and run
        export REMOTE_HOST=$REMOTE_HOST
        export REMOTE_PORT=$REMOTE_PORT
        export REMOTE_USER=$REMOTE_USER
        export DEPLOY_PROFILE=$DEPLOY_PROFILE

        node deploy-to-remote.js
        ;;

    2)
        echo -e "${GREEN}⚡ Using Direct Deployment...${NC}"
        echo ""

        # Create timestamp
        TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
        DEPLOY_DIR="~/aurigraph-v12-$TIMESTAMP"

        echo -e "${BLUE}📁 Creating deployment directory: $DEPLOY_DIR${NC}"
        ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "mkdir -p $DEPLOY_DIR"

        echo -e "${BLUE}📦 Transferring files...${NC}"
        scp -P $REMOTE_PORT -q docker-compose.yml $REMOTE_USER@$REMOTE_HOST:$DEPLOY_DIR/

        if [ -f ".env.production" ]; then
            scp -P $REMOTE_PORT -q .env.production $REMOTE_USER@$REMOTE_HOST:$DEPLOY_DIR/.env
        fi

        echo -e "${BLUE}🚀 Deploying application...${NC}"
        ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "cd $DEPLOY_DIR && docker-compose pull && docker-compose up -d"

        echo -e "${BLUE}⏳ Waiting for services to start...${NC}"
        sleep 15

        echo -e "${BLUE}🏥 Checking health...${NC}"
        ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST "docker ps --format 'table {{.Names}}\t{{.Status}}' | head -10"

        echo ""
        echo -e "${GREEN}✅ Deployment complete!${NC}"
        ;;

    3)
        echo -e "${YELLOW}📋 Manual deployment instructions:${NC}"
        echo ""
        echo "1. SSH to server:"
        echo "   ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST"
        echo ""
        echo "2. Navigate to Aurigraph directory:"
        echo "   cd ~/Aurigraph-DLT"
        echo ""
        echo "3. Pull latest changes:"
        echo "   git pull origin V12"
        echo ""
        echo "4. Deploy:"
        echo "   docker-compose down"
        echo "   docker-compose pull"
        echo "   docker-compose up -d"
        echo ""
        echo "5. Check status:"
        echo "   docker ps"
        echo ""
        exit 0
        ;;

    *)
        echo -e "${RED}Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  ✅ DEPLOYMENT COMPLETE                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}📍 Access Points:${NC}"
echo "   Portal:     https://$REMOTE_HOST"
echo "   API Health: https://$REMOTE_HOST/api/v11/health"
echo "   Grafana:    https://$REMOTE_HOST/monitoring/grafana"
echo ""

echo -e "${GREEN}🔧 Quick Commands:${NC}"
echo "   Check status:  ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'docker ps'"
echo "   View logs:     ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'docker logs -f dlt-portal'"
echo "   Restart:       ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'cd ~/aurigraph-v12-latest && docker-compose restart'"
echo ""

echo -e "${BLUE}🎉 V12 is now live!${NC}"
echo ""
