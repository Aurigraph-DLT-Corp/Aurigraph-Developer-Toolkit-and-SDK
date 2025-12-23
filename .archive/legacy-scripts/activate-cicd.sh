#!/bin/bash
#
# Aurigraph-DLT CI/CD Activation Script
# This script automates the setup of CI/CD pipeline for remote deployment
#
# Prerequisites:
# - SSH access to remote server
# - GitHub CLI installed (gh)
# - Git repository access
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration (modify these as needed)
REMOTE_HOST="${REMOTE_HOST:-dlt.aurigraph.io}"
REMOTE_PORT="${REMOTE_PORT:-2235}"
REMOTE_USER="${REMOTE_USER:-subbu}"
DEPLOY_KEY_PATH="${HOME}/.ssh/aurigraph-deploy-key"

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Aurigraph-DLT CI/CD Pipeline Activation Script  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to print section header
print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to print success message
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print error message
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to print warning message
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print info message
print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Step 1: Pre-flight checks
print_section "Step 1: Pre-flight Checks"

echo "Checking required tools..."

if ! command -v git &> /dev/null; then
    print_error "git is not installed"
    exit 1
fi
print_success "git is installed"

if ! command -v gh &> /dev/null; then
    print_error "GitHub CLI (gh) is not installed"
    print_info "Install with: brew install gh"
    exit 1
fi
print_success "GitHub CLI is installed"

if ! command -v ssh &> /dev/null; then
    print_error "ssh is not installed"
    exit 1
fi
print_success "ssh is installed"

# Check if in correct directory
if [ ! -d ".git" ]; then
    print_error "Not in a git repository"
    print_info "Please run this script from the Aurigraph-DLT project root"
    exit 1
fi
print_success "In git repository"

# Step 2: Display configuration
print_section "Step 2: Configuration"

echo "Remote server configuration:"
echo "  Host: ${REMOTE_HOST}"
echo "  Port: ${REMOTE_PORT}"
echo "  User: ${REMOTE_USER}"
echo ""
read -p "Is this configuration correct? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Configuration cancelled"
    echo "To change configuration, set environment variables:"
    echo "  export REMOTE_HOST=your.server.com"
    echo "  export REMOTE_PORT=22"
    echo "  export REMOTE_USER=youruser"
    exit 0
fi

# Step 3: Test remote server connectivity
print_section "Step 3: Testing Remote Server Connectivity"

print_info "Testing connection to ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PORT}..."

if ssh -p ${REMOTE_PORT} -o ConnectTimeout=10 -o BatchMode=yes ${REMOTE_USER}@${REMOTE_HOST} "echo 'Connection test successful'" 2>/dev/null; then
    print_success "SSH connection successful"
else
    print_error "Cannot connect to remote server"
    print_info "Please verify:"
    print_info "1. Server is running: ${REMOTE_HOST}"
    print_info "2. Port is correct: ${REMOTE_PORT}"
    print_info "3. You have SSH access with your current key"
    echo ""
    read -p "Would you like to continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    print_warning "Continuing without server connectivity verification"
fi

# Step 4: Generate deployment SSH key
print_section "Step 4: SSH Deployment Key"

if [ -f "${DEPLOY_KEY_PATH}" ]; then
    print_warning "Deployment key already exists at ${DEPLOY_KEY_PATH}"
    read -p "Do you want to use the existing key? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Generating new key..."
        ssh-keygen -t ed25519 -f "${DEPLOY_KEY_PATH}" -N "" -C "aurigraph-cicd-deploy"
        print_success "New deployment key generated"
    else
        print_success "Using existing deployment key"
    fi
else
    print_info "Generating new SSH deployment key..."
    ssh-keygen -t ed25519 -f "${DEPLOY_KEY_PATH}" -N "" -C "aurigraph-cicd-deploy"
    print_success "Deployment key generated at ${DEPLOY_KEY_PATH}"
fi

# Display public key
echo ""
print_info "Public key (add this to remote server):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat "${DEPLOY_KEY_PATH}.pub"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

read -p "Have you added this public key to the remote server? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Please add the public key to ${REMOTE_USER}@${REMOTE_HOST}:~/.ssh/authorized_keys"
    echo ""
    echo "You can do this by running:"
    echo "  ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \"mkdir -p ~/.ssh && echo '$(cat ${DEPLOY_KEY_PATH}.pub)' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys\""
    echo ""
    read -p "Press Enter after adding the key to continue..."
fi

# Test the new key
print_info "Testing new deployment key..."
if ssh -i "${DEPLOY_KEY_PATH}" -p ${REMOTE_PORT} -o ConnectTimeout=10 ${REMOTE_USER}@${REMOTE_HOST} "echo 'Deployment key works'" 2>/dev/null; then
    print_success "Deployment key verified"
else
    print_warning "Could not verify deployment key, but continuing..."
fi

# Step 5: Configure GitHub Secrets
print_section "Step 5: GitHub Secrets Configuration"

print_info "Checking GitHub authentication..."
if ! gh auth status &> /dev/null; then
    print_error "GitHub CLI is not authenticated"
    print_info "Please run: gh auth login"
    exit 1
fi
print_success "GitHub authenticated"

print_info "Current GitHub secrets:"
gh secret list 2>/dev/null || print_warning "Could not list secrets"

echo ""
read -p "Configure GitHub secrets for CI/CD? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Setting PROD_SSH_KEY..."
    gh secret set PROD_SSH_KEY < "${DEPLOY_KEY_PATH}" && print_success "PROD_SSH_KEY set" || print_error "Failed to set PROD_SSH_KEY"

    print_info "Setting PROD_HOST..."
    gh secret set PROD_HOST -b "${REMOTE_HOST}" && print_success "PROD_HOST set" || print_error "Failed to set PROD_HOST"

    print_info "Setting PROD_USER..."
    gh secret set PROD_USER -b "${REMOTE_USER}" && print_success "PROD_USER set" || print_error "Failed to set PROD_USER"

    echo ""
    read -p "Do you want to configure Slack notifications? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter Slack Webhook URL: " SLACK_WEBHOOK
        if [ -n "$SLACK_WEBHOOK" ]; then
            gh secret set SLACK_WEBHOOK_URL -b "${SLACK_WEBHOOK}" && print_success "SLACK_WEBHOOK_URL set" || print_error "Failed to set SLACK_WEBHOOK_URL"
        fi
    fi

    echo ""
    print_success "GitHub secrets configured"
    print_info "Updated secrets list:"
    gh secret list
else
    print_warning "Skipped GitHub secrets configuration"
fi

# Step 6: Setup remote server directories
print_section "Step 6: Remote Server Setup"

read -p "Setup remote server directories? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Setting up directories on remote server..."

    if ssh -i "${DEPLOY_KEY_PATH}" -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} bash << 'ENDSSH'
set -e
echo "Creating directories..."
mkdir -p /opt/aurigraph/{production,staging,backups,config}
echo "Directories created"

echo "Checking Docker installation..."
if command -v docker &> /dev/null; then
    echo "Docker version: $(docker --version)"
    echo "Docker Compose version: $(docker-compose --version 2>/dev/null || echo 'Not installed')"
else
    echo "⚠️  Docker is not installed"
fi

echo "Setting up production directory..."
cd /opt/aurigraph/production

if [ -d ".git" ]; then
    echo "Repository exists, pulling latest..."
    git pull origin main
else
    echo "⚠️  Repository not cloned yet"
    echo "Manual action needed: Clone repository to /opt/aurigraph/production"
fi

echo "✅ Remote setup complete"
ENDSSH
    then
        print_success "Remote server setup complete"
    else
        print_error "Remote server setup failed"
    fi
else
    print_warning "Skipped remote server setup"
fi

# Step 7: Summary and next steps
print_section "Summary"

echo ""
print_success "CI/CD Pipeline Setup Complete!"
echo ""
echo "Next steps:"
echo "  1. Verify GitHub secrets are configured:"
echo "     ${BLUE}gh secret list${NC}"
echo ""
echo "  2. Test the CI/CD pipeline:"
echo "     - Visit: https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/actions"
echo "     - Click 'Remote Server CI/CD Deployment'"
echo "     - Click 'Run workflow'"
echo "     - Select 'staging' environment"
echo ""
echo "  3. Monitor the deployment:"
echo "     ${BLUE}gh run watch${NC}"
echo ""
echo "  4. Verify deployment on remote server:"
echo "     ${BLUE}ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} 'docker ps'${NC}"
echo ""
echo "Documentation:"
echo "  - Setup Guide: .github/REMOTE_DEPLOYMENT_SETUP.md"
echo "  - Quick Summary: CICD-QUICK-SUMMARY.md"
echo "  - Workflow Guide: .agent/workflows/setup-cicd.md"
echo ""

print_info "For detailed instructions, type /setup-cicd in the chat"
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     🎉 Setup Complete - Ready to Deploy! 🚀      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
