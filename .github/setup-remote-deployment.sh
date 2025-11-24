#!/bin/bash

################################################################################
# Remote Deployment CI/CD Setup Script
# Purpose: Automate GitHub Secrets configuration for remote server deployment
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
REMOTE_HOST="${REMOTE_HOST:-dlt.aurigraph.io}"
REMOTE_USER="${REMOTE_USER:-subbu}"
REMOTE_PORT="${REMOTE_PORT:-2235}"
SSH_KEY_PATH="${SSH_KEY_PATH:-$HOME/.ssh/aurigraph-deploy-key}"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    log_section "CHECKING PREREQUISITES"

    log_info "Checking GitHub CLI..."
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI not installed. Install from: https://cli.github.com"
        exit 1
    fi
    log_success "GitHub CLI found: $(gh --version)"

    log_info "Checking Git..."
    if ! command -v git &> /dev/null; then
        log_error "Git not installed"
        exit 1
    fi
    log_success "Git found: $(git --version | head -1)"

    log_info "Checking SSH..."
    if ! command -v ssh &> /dev/null; then
        log_error "SSH not installed"
        exit 1
    fi
    log_success "SSH available"

    log_info "Checking GitHub authentication..."
    if ! gh auth status > /dev/null 2>&1; then
        log_error "Not authenticated with GitHub. Run: gh auth login"
        exit 1
    fi
    log_success "GitHub authentication confirmed"
}

# Generate SSH deployment key
generate_ssh_key() {
    log_section "SSH DEPLOYMENT KEY SETUP"

    if [ -f "$SSH_KEY_PATH" ]; then
        log_warn "SSH key already exists at: $SSH_KEY_PATH"
        read -p "Use existing key? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Enter path for new SSH key:"
            read -r SSH_KEY_PATH
        else
            log_success "Using existing SSH key"
            return 0
        fi
    fi

    log_info "Generating SSH deployment key..."
    ssh-keygen -t ed25519 -f "$SSH_KEY_PATH" -N "" -C "aurigraph-deployment"
    chmod 600 "$SSH_KEY_PATH"
    chmod 644 "${SSH_KEY_PATH}.pub"

    log_success "SSH key generated: $SSH_KEY_PATH"
    echo ""
    echo "📍 Public key location: ${SSH_KEY_PATH}.pub"
    echo ""
}

# Add public key to remote server
setup_remote_access() {
    log_section "CONFIGURING REMOTE SERVER ACCESS"

    log_info "Remote server: $REMOTE_USER@$REMOTE_HOST:$REMOTE_PORT"

    log_info "Testing SSH connectivity..."
    if ! ssh -q -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "echo OK" 2>/dev/null; then
        log_warn "Cannot connect to remote server with existing credentials"
        log_info "This is expected if it's the first setup"
        log_info ""
        log_info "📋 Please add the public key to the remote server manually:"
        echo ""
        echo "1. Copy the public key:"
        cat "${SSH_KEY_PATH}.pub"
        echo ""
        echo "2. Add to remote server:"
        echo "   ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST"
        echo "   mkdir -p ~/.ssh"
        echo "   echo 'PASTE_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys"
        echo "   chmod 600 ~/.ssh/authorized_keys"
        echo "   exit"
        echo ""
        read -p "Press Enter after adding the public key to remote server..."
    fi

    log_info "Verifying remote SSH access..."
    if ssh -q -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" "echo SSH OK"; then
        log_success "SSH access verified"
    else
        log_error "Cannot establish SSH connection"
        exit 1
    fi
}

# Configure GitHub Secrets
setup_github_secrets() {
    log_section "CONFIGURING GITHUB SECRETS"

    # Get repository information
    log_info "Detecting GitHub repository..."
    REPO=$(git config --get remote.origin.url | sed 's/.*://' | sed 's/\.git$//')
    if [ -z "$REPO" ]; then
        log_error "Cannot determine repository from git config"
        exit 1
    fi
    log_success "Repository: $REPO"

    # Production SSH Key
    log_info "Setting PROD_SSH_KEY secret..."
    if gh secret set PROD_SSH_KEY < "$SSH_KEY_PATH" --repo "$REPO"; then
        log_success "PROD_SSH_KEY secret set"
    else
        log_error "Failed to set PROD_SSH_KEY"
        exit 1
    fi

    # Production Host
    log_info "Setting PROD_HOST secret..."
    if gh secret set PROD_HOST -b "$REMOTE_HOST" --repo "$REPO"; then
        log_success "PROD_HOST secret set to: $REMOTE_HOST"
    else
        log_error "Failed to set PROD_HOST"
        exit 1
    fi

    # Production User
    log_info "Setting PROD_USER secret..."
    if gh secret set PROD_USER -b "$REMOTE_USER" --repo "$REPO"; then
        log_success "PROD_USER secret set to: $REMOTE_USER"
    else
        log_error "Failed to set PROD_USER"
        exit 1
    fi

    # Optional: Slack Webhook
    log_section "OPTIONAL SLACK NOTIFICATIONS"
    read -p "Do you want to configure Slack notifications? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Enter Slack webhook URL:"
        read -r SLACK_WEBHOOK

        if [ -z "$SLACK_WEBHOOK" ]; then
            log_warn "Slack webhook URL is empty, skipping"
        else
            log_info "Setting SLACK_WEBHOOK_URL secret..."
            if gh secret set SLACK_WEBHOOK_URL -b "$SLACK_WEBHOOK" --repo "$REPO"; then
                log_success "SLACK_WEBHOOK_URL secret set"
            else
                log_error "Failed to set SLACK_WEBHOOK_URL"
            fi
        fi
    fi
}

# Verify secrets
verify_secrets() {
    log_section "VERIFYING SECRETS"

    REPO=$(git config --get remote.origin.url | sed 's/.*://' | sed 's/\.git$//')

    log_info "Listing configured secrets..."
    if gh secret list --repo "$REPO" | grep -E "PROD_"; then
        log_success "Production secrets configured"
    else
        log_warn "Some secrets not found"
    fi
}

# Create remote directories
setup_remote_directories() {
    log_section "SETTING UP REMOTE DIRECTORIES"

    log_info "Creating remote deployment directories..."
    ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
set -e

echo "Creating directory structure..."
mkdir -p /opt/aurigraph/{production,staging,backups,config}

echo "Setting permissions..."
chmod 755 /opt/aurigraph/{production,staging,backups,config}

echo "✓ Remote directories created:"
ls -la /opt/aurigraph/
EOF

    log_success "Remote directories configured"
}

# Prepare test deployment
prepare_test_deployment() {
    log_section "PREPARING FOR TEST DEPLOYMENT"

    echo ""
    echo "✅ CI/CD setup complete!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Push changes to GitHub: git push"
    echo "2. Trigger deployment manually:"
    echo "   - Go to: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/actions"
    echo "   - Select: 'Remote Server CI/CD Deployment'"
    echo "   - Click 'Run workflow'"
    echo "   - Select 'staging' for first test"
    echo ""
    echo "3. Monitor deployment progress in GitHub Actions"
    echo ""
    echo "⚠️  Important: The first deployment will take 15-25 minutes"
    echo ""
}

# Main execution
main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}    Aurigraph Remote Deployment CI/CD Setup          ${BLUE}║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""

    check_prerequisites
    generate_ssh_key
    setup_remote_access
    setup_github_secrets
    verify_secrets
    setup_remote_directories
    prepare_test_deployment

    echo -e "${GREEN}🎉 Setup complete! Ready for deployment.${NC}"
    echo ""
}

# Handle arguments
case "${1:-setup}" in
    setup)
        main
        ;;
    verify)
        log_section "VERIFYING SETUP"
        verify_secrets
        ;;
    *)
        echo "Usage: $0 [setup|verify]"
        exit 1
        ;;
esac
