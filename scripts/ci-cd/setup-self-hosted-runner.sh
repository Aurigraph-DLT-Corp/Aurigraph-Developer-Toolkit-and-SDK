#!/bin/bash
#===============================================================================
# Aurigraph DLT - Self-Hosted GitHub Actions Runner Setup
#
# This script sets up a GitHub Actions self-hosted runner on the remote server
# for CI/CD deployments without needing SSH keys or password authentication.
#
# Target Server: dlt.aurigraph.io
# SSH Port: 22
# Runner Labels: self-hosted, Linux, aurigraph-prod
#
# Prerequisites:
# - Ubuntu 20.04+ or similar Linux distribution
# - sudo access
# - GitHub repository admin access (to get runner token)
#
# Usage:
#   1. SSH to the remote server: ssh -p 22 subbu@dlt.aurigraph.io
#   2. Run this script: bash setup-self-hosted-runner.sh
#   3. Follow prompts to enter the GitHub runner token
#
#===============================================================================

set -e

# Configuration
RUNNER_VERSION="2.314.1"  # Update to latest version from GitHub
RUNNER_USER="subbu"
RUNNER_DIR="/home/${RUNNER_USER}/actions-runner"
RUNNER_LABELS="self-hosted,Linux,aurigraph-prod"
GITHUB_ORG="Aurigraph-DLT-Corp"
GITHUB_REPO="Aurigraph-DLT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       Aurigraph DLT - Self-Hosted Runner Setup                 ║"
echo "║       Target: dlt.aurigraph.io                                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

#===============================================================================
# Step 1: Prerequisites Check
#===============================================================================
echo -e "${YELLOW}[Step 1/7] Checking prerequisites...${NC}"

# Check if running as correct user
if [ "$(whoami)" != "${RUNNER_USER}" ]; then
    echo -e "${RED}Error: Please run this script as user '${RUNNER_USER}'${NC}"
    echo "Switch user with: su - ${RUNNER_USER}"
    exit 1
fi

# Check for required packages
echo "Checking required packages..."
REQUIRED_PACKAGES="curl jq tar"
for pkg in $REQUIRED_PACKAGES; do
    if ! command -v $pkg &> /dev/null; then
        echo -e "${YELLOW}Installing $pkg...${NC}"
        sudo apt-get update && sudo apt-get install -y $pkg
    fi
done

# Check disk space (need at least 5GB)
AVAILABLE_SPACE=$(df -BG /home | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -lt 5 ]; then
    echo -e "${RED}Error: Insufficient disk space. Need at least 5GB, have ${AVAILABLE_SPACE}GB${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Prerequisites check passed${NC}"

#===============================================================================
# Step 2: Install Dependencies
#===============================================================================
echo -e "${YELLOW}[Step 2/7] Installing dependencies...${NC}"

sudo apt-get update
sudo apt-get install -y \
    libicu-dev \
    libssl-dev \
    libkrb5-dev \
    zlib1g-dev \
    unzip

# Install Java 21 (required for building)
if ! java -version 2>&1 | grep -q "21"; then
    echo "Installing Java 21..."
    sudo apt-get install -y openjdk-21-jdk
fi

# Install Node.js 20 (required for frontend builds)
if ! node --version 2>&1 | grep -q "v20"; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install Maven (if not already installed)
if ! command -v mvn &> /dev/null; then
    echo "Installing Maven..."
    sudo apt-get install -y maven
fi

echo -e "${GREEN}✓ Dependencies installed${NC}"

#===============================================================================
# Step 3: Create Runner Directory
#===============================================================================
echo -e "${YELLOW}[Step 3/7] Setting up runner directory...${NC}"

# Create runner directory
mkdir -p "${RUNNER_DIR}"
cd "${RUNNER_DIR}"

# Clean up any existing installation
if [ -f ".runner" ]; then
    echo "Existing runner detected. Removing..."
    ./svc.sh stop 2>/dev/null || true
    ./svc.sh uninstall 2>/dev/null || true
    rm -rf ./*
fi

echo -e "${GREEN}✓ Runner directory ready: ${RUNNER_DIR}${NC}"

#===============================================================================
# Step 4: Download GitHub Actions Runner
#===============================================================================
echo -e "${YELLOW}[Step 4/7] Downloading GitHub Actions Runner v${RUNNER_VERSION}...${NC}"

# Get the latest runner version if not specified
RUNNER_PACKAGE="actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
RUNNER_URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${RUNNER_PACKAGE}"

# Download runner
curl -O -L "${RUNNER_URL}"

# Extract runner
tar xzf "${RUNNER_PACKAGE}"
rm -f "${RUNNER_PACKAGE}"

echo -e "${GREEN}✓ Runner downloaded and extracted${NC}"

#===============================================================================
# Step 5: Configure Runner
#===============================================================================
echo -e "${YELLOW}[Step 5/7] Configuring runner...${NC}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}IMPORTANT: You need to get a runner registration token from GitHub${NC}"
echo ""
echo "1. Go to: https://github.com/${GITHUB_ORG}/${GITHUB_REPO}/settings/actions/runners/new"
echo "2. Click 'New self-hosted runner'"
echo "3. Copy the token from the 'Configure' section"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════════${NC}"
echo ""

read -p "Enter the runner registration token: " RUNNER_TOKEN

if [ -z "$RUNNER_TOKEN" ]; then
    echo -e "${RED}Error: Token is required${NC}"
    exit 1
fi

# Configure the runner
./config.sh \
    --url "https://github.com/${GITHUB_ORG}/${GITHUB_REPO}" \
    --token "${RUNNER_TOKEN}" \
    --name "aurigraph-prod-runner" \
    --labels "${RUNNER_LABELS}" \
    --work "_work" \
    --runasservice \
    --replace

echo -e "${GREEN}✓ Runner configured${NC}"

#===============================================================================
# Step 6: Install and Start Service
#===============================================================================
echo -e "${YELLOW}[Step 6/7] Installing runner as service...${NC}"

# Install as a service
sudo ./svc.sh install ${RUNNER_USER}

# Start the service
sudo ./svc.sh start

# Check service status
sudo ./svc.sh status

echo -e "${GREEN}✓ Runner service installed and started${NC}"

#===============================================================================
# Step 7: Create Deployment Directories
#===============================================================================
echo -e "${YELLOW}[Step 7/7] Creating deployment directories...${NC}"

# Create directories for deployments
sudo mkdir -p /home/subbu/logs
sudo mkdir -p /var/lib/aurigraph/leveldb
sudo mkdir -p /var/www/aurigraph-portal
sudo mkdir -p /opt/aurigraph-v11

# Set permissions
sudo chown -R ${RUNNER_USER}:${RUNNER_USER} /home/subbu/logs
sudo chown -R ${RUNNER_USER}:${RUNNER_USER} /var/lib/aurigraph
sudo chown -R ${RUNNER_USER}:${RUNNER_USER} /var/www/aurigraph-portal

echo -e "${GREEN}✓ Deployment directories created${NC}"

#===============================================================================
# Summary
#===============================================================================
echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║              Setup Complete!                                   ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Runner Name:    aurigraph-prod-runner                         ║"
echo "║  Runner Labels:  ${RUNNER_LABELS}                ║"
echo "║  Runner Dir:     ${RUNNER_DIR}               ║"
echo "║  Service Status: Running                                       ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Useful Commands:                                              ║"
echo "║  - Check status: sudo ./svc.sh status                          ║"
echo "║  - Stop runner:  sudo ./svc.sh stop                            ║"
echo "║  - Start runner: sudo ./svc.sh start                           ║"
echo "║  - View logs:    journalctl -u actions.runner.*                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo ""
echo "Next steps:"
echo "1. Verify runner appears in GitHub: Settings → Actions → Runners"
echo "2. Push to V12 branch to trigger a deployment"
echo "3. Monitor deployments in GitHub Actions tab"
echo ""
