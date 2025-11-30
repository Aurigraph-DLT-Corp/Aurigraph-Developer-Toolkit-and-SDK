#!/bin/bash

# =============================================================================
# Aurigraph V12 - Remote Deployment Setup Script
# =============================================================================
# This script sets up SSH key authentication and configures GitHub secrets
# for automated CI/CD deployment to the remote server.
#
# Prerequisites:
# - GitHub CLI (gh) installed and authenticated
# - SSH access to dlt.aurigraph.io
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="2235"
KEY_NAME="aurigraph-deploy-key"
REPO="Aurigraph-DLT-Corp/Aurigraph-DLT"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Aurigraph V12 CI/CD Deployment Setup${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Step 1: Generate SSH key pair for deployment
echo -e "${YELLOW}Step 1: Generating SSH key pair...${NC}"

if [ -f ~/.ssh/${KEY_NAME} ]; then
    echo -e "${GREEN}SSH key already exists at ~/.ssh/${KEY_NAME}${NC}"
else
    ssh-keygen -t ed25519 -C "aurigraph-deploy@github-actions" -f ~/.ssh/${KEY_NAME} -N ""
    echo -e "${GREEN}SSH key generated!${NC}"
fi

echo ""

# Step 2: Copy public key to remote server
echo -e "${YELLOW}Step 2: Copying public key to remote server...${NC}"
echo -e "  Server: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PORT}"
echo ""
echo -e "${YELLOW}You may be prompted for the password...${NC}"

ssh-copy-id -i ~/.ssh/${KEY_NAME}.pub -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST}

echo -e "${GREEN}Public key copied to remote server!${NC}"
echo ""

# Step 3: Test SSH connection
echo -e "${YELLOW}Step 3: Testing SSH connection...${NC}"

if ssh -p ${REMOTE_PORT} -i ~/.ssh/${KEY_NAME} -o BatchMode=yes ${REMOTE_USER}@${REMOTE_HOST} "echo 'SSH connection successful'" 2>/dev/null; then
    echo -e "${GREEN}SSH connection test passed!${NC}"
else
    echo -e "${RED}SSH connection failed. Please check your configuration.${NC}"
    exit 1
fi

echo ""

# Step 4: Configure GitHub Secrets
echo -e "${YELLOW}Step 4: Configuring GitHub Secrets...${NC}"

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}GitHub CLI (gh) is not installed.${NC}"
    echo "Please install it from: https://cli.github.com/"
    echo ""
    echo "After installing, run:"
    echo "  gh auth login"
    echo ""
    echo "Then set these secrets manually:"
    echo "  PROD_SSH_PRIVATE_KEY - Contents of ~/.ssh/${KEY_NAME}"
    echo ""
    echo -e "${YELLOW}Private key content:${NC}"
    echo "---"
    cat ~/.ssh/${KEY_NAME}
    echo "---"
    exit 0
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}Please authenticate with GitHub CLI:${NC}"
    gh auth login
fi

# Set the secret
echo -e "Setting PROD_SSH_PRIVATE_KEY secret..."
gh secret set PROD_SSH_PRIVATE_KEY --repo ${REPO} < ~/.ssh/${KEY_NAME}

echo -e "${GREEN}GitHub secret configured!${NC}"
echo ""

# Step 5: Summary
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Setup Complete!${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo -e "${GREEN}CI/CD Pipeline is ready!${NC}"
echo ""
echo "The following has been configured:"
echo "  - SSH key pair for deployment"
echo "  - Public key added to ${REMOTE_HOST}"
echo "  - GitHub secret PROD_SSH_PRIVATE_KEY set"
echo ""
echo "Deployment will trigger automatically on:"
echo "  - Push to 'main' branch"
echo "  - Push to 'V12' branch"
echo "  - Manual workflow dispatch"
echo ""
echo "GitHub Actions workflow location:"
echo "  .github/workflows/remote-deployment.yml"
echo ""
echo -e "${YELLOW}Manual deployment command:${NC}"
echo "  gh workflow run remote-deployment.yml --repo ${REPO}"
echo ""
