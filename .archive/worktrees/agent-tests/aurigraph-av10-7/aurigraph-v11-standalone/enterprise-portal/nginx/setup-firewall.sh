#!/bin/bash

################################################################################
# Aurigraph Enterprise Portal - Firewall Setup Script
# Version: 4.3.2
# Purpose: Configure UFW firewall rules for production deployment
# Usage: ./setup-firewall.sh [--setup|--status|--reset]
################################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

# Install UFW if not present
install_ufw() {
    if ! command -v ufw &> /dev/null; then
        print_info "UFW not found. Installing..."
        apt-get update
        apt-get install -y ufw
        print_success "UFW installed"
    else
        print_success "UFW is already installed"
    fi
}

# Setup basic firewall rules
setup_firewall() {
    print_header "Setting Up Firewall Rules"

    # Reset UFW to default state
    print_info "Resetting UFW to default state..."
    ufw --force reset

    # Set default policies
    print_info "Setting default policies..."
    ufw default deny incoming
    ufw default allow outgoing
    print_success "Default policies configured"

    # Allow SSH (CRITICAL - must be first to avoid lockout)
    print_info "Allowing SSH connections..."
    ufw allow 22/tcp comment 'SSH access'
    ufw allow 2235/tcp comment 'SSH alternative port'
    print_success "SSH access allowed (ports 22, 2235)"

    # Allow HTTP and HTTPS
    print_info "Allowing HTTP/HTTPS..."
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    print_success "HTTP/HTTPS allowed"

    # Allow Aurigraph V11 Backend (localhost only - accessed via NGINX)
    print_info "Configuring backend access..."
    ufw allow from 127.0.0.1 to any port 9003 proto tcp comment 'V11 Backend (localhost)'
    print_success "V11 Backend accessible from localhost only"

    # Allow gRPC port (localhost only)
    ufw allow from 127.0.0.1 to any port 9004 proto tcp comment 'gRPC (localhost)'
    print_success "gRPC accessible from localhost only"

    # Allow Keycloak IAM (if running locally)
    # Uncomment if Keycloak is on the same server
    # ufw allow from 127.0.0.1 to any port 8180 proto tcp comment 'Keycloak IAM (localhost)'

    # Internal network access (customize IP ranges)
    print_info "Configuring internal network access..."
    # Allow internal network to access admin APIs
    ufw allow from 192.168.0.0/16 to any port 9003 proto tcp comment 'Internal network to backend'
    ufw allow from 10.0.0.0/8 to any port 9003 proto tcp comment 'Internal network to backend'
    ufw allow from 172.16.0.0/12 to any port 9003 proto tcp comment 'Internal network to backend'
    print_success "Internal network access configured"

    # VPN access (customize with your VPN IP range)
    print_warning "VPN access not configured. Add your VPN range manually:"
    print_info "  sudo ufw allow from <VPN_IP_RANGE> to any port 9003 proto tcp comment 'VPN access'"

    # Rate limiting for SSH (brute force protection)
    print_info "Enabling SSH rate limiting..."
    ufw limit 22/tcp comment 'Rate limit SSH'
    ufw limit 2235/tcp comment 'Rate limit SSH alternative'
    print_success "SSH rate limiting enabled"

    # Enable UFW
    print_info "Enabling UFW..."
    ufw --force enable
    print_success "UFW enabled and active"

    # Display status
    print_header "Firewall Status"
    ufw status verbose
}

# Setup advanced rules
setup_advanced() {
    print_header "Setting Up Advanced Firewall Rules"

    # Block common attack ports
    print_info "Blocking common attack ports..."
    ufw deny 23/tcp comment 'Block Telnet'
    ufw deny 135/tcp comment 'Block MS RPC'
    ufw deny 139/tcp comment 'Block NetBIOS'
    ufw deny 445/tcp comment 'Block SMB'
    ufw deny 3389/tcp comment 'Block RDP'
    print_success "Common attack ports blocked"

    # Enable logging
    print_info "Enabling firewall logging..."
    ufw logging on
    print_success "Logging enabled at /var/log/ufw.log"

    # Application profiles (if available)
    if [ -d /etc/ufw/applications.d ]; then
        print_info "Checking for application profiles..."
        ufw app list || true
    fi

    print_success "Advanced rules configured"
}

# Display current status
show_status() {
    print_header "Current Firewall Status"
    ufw status verbose
    echo ""
    print_header "Numbered Rules"
    ufw status numbered
    echo ""
    print_header "Application Profiles"
    ufw app list || print_info "No application profiles available"
}

# Reset firewall to defaults
reset_firewall() {
    print_header "Resetting Firewall"
    print_warning "This will remove all firewall rules!"
    print_info "Press Ctrl+C within 5 seconds to cancel..."
    sleep 5

    print_info "Disabling UFW..."
    ufw --force disable

    print_info "Resetting rules..."
    ufw --force reset

    print_success "Firewall reset complete"
}

# Setup application profile for Aurigraph
setup_app_profile() {
    print_header "Creating Aurigraph Application Profile"

    cat > /etc/ufw/applications.d/aurigraph <<'EOF'
[Aurigraph V11]
title=Aurigraph V11 Backend
description=Aurigraph V11 Java/Quarkus Backend API
ports=9003/tcp

[Aurigraph gRPC]
title=Aurigraph gRPC Service
description=Aurigraph V11 gRPC Service
ports=9004/tcp

[Aurigraph Full]
title=Aurigraph Complete Stack
description=Complete Aurigraph V11 stack (HTTP, Backend, gRPC)
ports=80,443,9003,9004/tcp
EOF

    print_success "Application profile created"
    print_info "Reloading application profiles..."
    ufw app update Aurigraph || true
    ufw app list
}

# Backup current rules
backup_rules() {
    print_header "Backing Up Current Rules"

    backup_file="/root/ufw-backup-$(date +%Y%m%d-%H%M%S).txt"
    ufw status verbose > "$backup_file"

    print_success "Rules backed up to: $backup_file"
}

# Restore rules from backup
restore_rules() {
    print_header "Restoring Rules from Backup"

    print_info "Available backups:"
    ls -lh /root/ufw-backup-*.txt 2>/dev/null || print_warning "No backups found"

    echo ""
    print_info "Enter backup file path:"
    read -r backup_file

    if [ ! -f "$backup_file" ]; then
        print_error "Backup file not found: $backup_file"
        exit 1
    fi

    print_warning "This will reset current rules and apply backup"
    print_info "Press Ctrl+C within 5 seconds to cancel..."
    sleep 5

    # Reset and restore (manual process - show instructions)
    print_info "Backup content:"
    cat "$backup_file"
    print_warning "Automatic restore not implemented. Please review and manually apply rules."
}

# Check for issues
check_security() {
    print_header "Security Check"

    # Check if SSH is allowed
    if ufw status | grep -q "22/tcp.*ALLOW"; then
        print_success "SSH access is configured"
    else
        print_error "SSH access not configured - risk of lockout!"
    fi

    # Check if firewall is active
    if ufw status | grep -q "Status: active"; then
        print_success "Firewall is active"
    else
        print_warning "Firewall is not active"
    fi

    # Check for default deny
    if ufw status verbose | grep -q "Default: deny (incoming)"; then
        print_success "Default incoming policy is deny"
    else
        print_warning "Default incoming policy is not deny"
    fi

    # Check logging
    if ufw status verbose | grep -q "Logging: on"; then
        print_success "Logging is enabled"
    else
        print_warning "Logging is disabled"
    fi

    # Check for exposed services
    print_info "Exposed services:"
    ufw status | grep "ALLOW" | awk '{print "  - " $1 " from " $3}'
}

# Main script
main() {
    case "${1:-}" in
        --setup)
            check_root
            install_ufw
            backup_rules
            setup_firewall
            setup_advanced
            setup_app_profile
            check_security
            print_success "Firewall setup complete!"
            ;;
        --status)
            show_status
            check_security
            ;;
        --reset)
            check_root
            backup_rules
            reset_firewall
            ;;
        --backup)
            check_root
            backup_rules
            ;;
        --restore)
            check_root
            restore_rules
            ;;
        --check)
            check_security
            ;;
        --app-profile)
            check_root
            setup_app_profile
            ;;
        --help)
            echo "Usage: $0 [OPTION]"
            echo ""
            echo "Options:"
            echo "  --setup         Complete firewall setup with recommended rules"
            echo "  --status        Display current firewall status"
            echo "  --reset         Reset firewall to defaults (WARNING: removes all rules)"
            echo "  --backup        Backup current firewall rules"
            echo "  --restore       Restore firewall rules from backup"
            echo "  --check         Run security check on current configuration"
            echo "  --app-profile   Create Aurigraph application profile"
            echo "  --help          Display this help message"
            echo ""
            echo "Examples:"
            echo "  sudo $0 --setup         # Initial setup"
            echo "  sudo $0 --status        # Check status"
            echo "  sudo $0 --backup        # Backup rules"
            ;;
        *)
            print_error "Invalid option: ${1:-}"
            echo ""
            echo "Run '$0 --help' for usage information"
            exit 1
            ;;
    esac
}

# Run main
main "$@"
