#!/bin/bash

# =============================================================================
# Aurigraph V12 - Self-Hosted GitHub Actions Runner Setup
# =============================================================================
# This script sets up a self-hosted GitHub Actions runner on the remote server
#
# Prerequisites:
# - SSH access to dlt.aurigraph.io
# - GitHub Personal Access Token with repo and admin:org permissions
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
REMOTE_PORT="22"
REPO="Aurigraph-DLT-Corp/Aurigraph-DLT"
RUNNER_NAME="aurigraph-prod-runner"
RUNNER_DIR="/home/subbu/actions-runner"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Aurigraph Self-Hosted Runner Setup${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if GitHub token is provided
if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}Please provide your GitHub Personal Access Token:${NC}"
    echo "The token needs 'repo' and 'admin:org' permissions."
    echo ""
    read -sp "GitHub Token: " GITHUB_TOKEN
    echo ""
fi

# Step 1: Get runner registration token
echo -e "${YELLOW}Step 1: Getting runner registration token...${NC}"
REGISTRATION_TOKEN=$(curl -s -X POST \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/${REPO}/actions/runners/registration-token" | jq -r '.token')

if [ "$REGISTRATION_TOKEN" == "null" ] || [ -z "$REGISTRATION_TOKEN" ]; then
    echo -e "${RED}Failed to get registration token. Check your GitHub token permissions.${NC}"
    exit 1
fi

echo -e "${GREEN}Registration token obtained!${NC}"
echo ""

# Step 2: Install and configure runner on remote server
echo -e "${YELLOW}Step 2: Installing runner on remote server...${NC}"

ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << INSTALL_SCRIPT
set -e

# Create runner directory
mkdir -p ${RUNNER_DIR}
cd ${RUNNER_DIR}

# Check if runner already exists
if [ -f "./config.sh" ]; then
    echo "Runner already installed, updating..."
    ./svc.sh stop 2>/dev/null || true
    ./svc.sh uninstall 2>/dev/null || true
fi

# Download latest runner
echo "Downloading GitHub Actions runner..."
RUNNER_VERSION=\$(curl -s https://api.github.com/repos/actions/runner/releases/latest | grep -oP '"tag_name": "v\K[^"]+')
curl -sL "https://github.com/actions/runner/releases/download/v\${RUNNER_VERSION}/actions-runner-linux-x64-\${RUNNER_VERSION}.tar.gz" -o runner.tar.gz
tar -xzf runner.tar.gz
rm runner.tar.gz

# Configure runner
echo "Configuring runner..."
./config.sh --url https://github.com/${REPO} \
    --token ${REGISTRATION_TOKEN} \
    --name ${RUNNER_NAME} \
    --labels self-hosted,Linux,X64,aurigraph-prod \
    --work _work \
    --unattended \
    --replace

# Install as service
echo "Installing runner as service..."
sudo ./svc.sh install
sudo ./svc.sh start

echo "Runner installation complete!"
INSTALL_SCRIPT

echo -e "${GREEN}Runner installed on remote server!${NC}"
echo ""

# Step 3: Verify runner is online
echo -e "${YELLOW}Step 3: Verifying runner status...${NC}"
sleep 5

RUNNER_STATUS=$(curl -s \
    -H "Authorization: token $GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    "https://api.github.com/repos/${REPO}/actions/runners" | jq -r ".runners[] | select(.name==\"${RUNNER_NAME}\") | .status")

if [ "$RUNNER_STATUS" == "online" ]; then
    echo -e "${GREEN}Runner is online and ready!${NC}"
else
    echo -e "${YELLOW}Runner status: ${RUNNER_STATUS}${NC}"
    echo "The runner may take a few moments to come online."
fi

echo ""

# Summary
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Setup Complete!${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""
echo "Runner Details:"
echo "  Name: ${RUNNER_NAME}"
echo "  Host: ${REMOTE_HOST}"
echo "  Labels: self-hosted, Linux, X64, aurigraph-prod"
echo ""
echo "The CI/CD workflow will now use this self-hosted runner"
echo "for all jobs (build, deploy, smoke-tests)."
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  Check runner status: ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} 'cd ${RUNNER_DIR} && sudo ./svc.sh status'"
echo "  View runner logs: ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} 'cd ${RUNNER_DIR} && cat _diag/Runner_*.log | tail -100'"
echo "  Restart runner: ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} 'cd ${RUNNER_DIR} && sudo ./svc.sh restart'"
echo ""
