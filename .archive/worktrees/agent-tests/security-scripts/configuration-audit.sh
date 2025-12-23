#!/bin/bash

################################################################################
# Configuration Security Audit Script
#
# Purpose: Audit Aurigraph V11 configuration files for security issues
# Author: Security Team
# Version: 1.0.0
# Last Updated: 2025-11-12
#
# Usage:
#   ./configuration-audit.sh
#
# Checks:
#   - Hardcoded secrets/passwords
#   - Weak encryption settings
#   - Insecure defaults
#   - Missing security headers
#   - Exposed debug endpoints
################################################################################

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_DIR="$PROJECT_ROOT/security-reports/config-audits"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$REPORT_DIR/config-audit-$TIMESTAMP.txt"

# Counters
CRITICAL_ISSUES=0
HIGH_ISSUES=0
MEDIUM_ISSUES=0
LOW_ISSUES=0
INFO_ITEMS=0

# Colors
RED='\033[0;31m'
ORANGE='\033[0;33m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

log_critical() {
    echo -e "${RED}[CRITICAL] $1${NC}" | tee -a "$REPORT_FILE"
    ((CRITICAL_ISSUES++))
}

log_high() {
    echo -e "${ORANGE}[HIGH] $1${NC}" | tee -a "$REPORT_FILE"
    ((HIGH_ISSUES++))
}

log_medium() {
    echo -e "${YELLOW}[MEDIUM] $1${NC}" | tee -a "$REPORT_FILE"
    ((MEDIUM_ISSUES++))
}

log_low() {
    echo -e "[LOW] $1" | tee -a "$REPORT_FILE"
    ((LOW_ISSUES++))
}

log_info() {
    echo -e "${GREEN}[INFO] $1${NC}" | tee -a "$REPORT_FILE"
    ((INFO_ITEMS++))
}

log_pass() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$REPORT_FILE"
}

################################################################################
# Setup
################################################################################

setup_report() {
    mkdir -p "$REPORT_DIR"

    cat > "$REPORT_FILE" <<EOF
================================================================================
Aurigraph V11 Configuration Security Audit Report
================================================================================
Scan Date: $(date)
Project Root: $PROJECT_ROOT
Report File: $REPORT_FILE

================================================================================

EOF
}

################################################################################
# Configuration File Checks
################################################################################

check_application_properties() {
    print_header "Checking application.properties"

    local CONFIG_FILE="$PROJECT_ROOT/aurigraph-av10-7/aurigraph-v11-standalone/src/main/resources/application.properties"

    if [ ! -f "$CONFIG_FILE" ]; then
        log_critical "application.properties not found at $CONFIG_FILE"
        return 1
    fi

    # Check for hardcoded secrets
    echo "Checking for hardcoded secrets..."

    if grep -E "(password|secret|key|token)\s*=\s*[^\$\{]" "$CONFIG_FILE" | grep -v "^\s*#"; then
        log_high "Hardcoded secrets detected in application.properties"
        grep -E "(password|secret|key|token)\s*=\s*[^\$\{]" "$CONFIG_FILE" | grep -v "^\s*#" | tee -a "$REPORT_FILE"
    else
        log_pass "No hardcoded secrets detected"
    fi

    # Check TLS/SSL configuration
    echo "Checking TLS/SSL configuration..."

    if grep -q "quarkus.http.ssl.protocols=TLSv1.3" "$CONFIG_FILE"; then
        log_pass "TLS 1.3 enforced"
    elif grep -q "quarkus.http.ssl.protocols" "$CONFIG_FILE"; then
        log_medium "TLS configuration found but not enforcing TLS 1.3"
    else
        log_high "No explicit TLS protocol configuration found"
    fi

    # Check for insecure HTTP
    if grep -q "quarkus.http.insecure-requests=enabled" "$CONFIG_FILE"; then
        log_medium "Insecure HTTP requests enabled (ensure reverse proxy handles TLS)"
    else
        log_pass "Insecure HTTP not explicitly enabled"
    fi

    # Check for development mode in production
    if grep -q "%prod.quarkus.log.level=DEBUG" "$CONFIG_FILE"; then
        log_high "DEBUG logging enabled in production profile"
    else
        log_pass "Production logging appropriately configured"
    fi

    # Check CORS configuration
    if grep -q "quarkus.http.cors=true" "$CONFIG_FILE"; then
        local CORS_ORIGINS=$(grep "quarkus.http.cors.origins" "$CONFIG_FILE" || echo "")

        if echo "$CORS_ORIGINS" | grep -q "\*"; then
            log_critical "CORS allows all origins (*) - major security risk"
        elif [ -n "$CORS_ORIGINS" ]; then
            log_pass "CORS origins restricted"
        else
            log_medium "CORS enabled but no origins specified"
        fi
    else
        log_info "CORS not enabled"
    fi

    # Check encryption settings
    echo "Checking encryption settings..."

    if grep -q "aurigraph.crypto.dilithium.security-level=5" "$CONFIG_FILE"; then
        log_pass "Quantum cryptography configured to NIST Level 5"
    else
        log_medium "Quantum cryptography not set to maximum security level (NIST Level 5)"
    fi

    # Check database passwords
    if grep -E "quarkus.datasource.password\s*=\s*[^\$\{]" "$CONFIG_FILE"; then
        log_critical "Database password hardcoded in configuration file"
    else
        log_pass "Database password not hardcoded"
    fi

    # Check HSM configuration
    if grep -q "aurigraph.crypto.hsm.enabled=true" "$CONFIG_FILE"; then
        log_pass "HSM (Hardware Security Module) enabled for key storage"
    else
        log_medium "HSM not enabled (recommended for production)"
    fi
}

check_pom_xml() {
    print_header "Checking pom.xml"

    local POM_FILE="$PROJECT_ROOT/aurigraph-av10-7/aurigraph-v11-standalone/pom.xml"

    if [ ! -f "$POM_FILE" ]; then
        log_critical "pom.xml not found at $POM_FILE"
        return 1
    fi

    # Check for outdated dependencies
    echo "Checking for outdated dependencies..."

    if grep -q "<version>.*SNAPSHOT.*</version>" "$POM_FILE"; then
        log_medium "SNAPSHOT dependencies detected (not recommended for production)"
    else
        log_pass "No SNAPSHOT dependencies"
    fi

    # Check for known vulnerable versions
    if grep -q "log4j.*2\.14" "$POM_FILE"; then
        log_critical "Vulnerable Log4j version detected (Log4Shell vulnerability)"
    fi

    # Check BouncyCastle version (for quantum cryptography)
    local BC_VERSION=$(grep -A 1 "bcprov-jdk18on" "$POM_FILE" | grep "<version>" | sed 's/.*<version>\(.*\)<\/version>.*/\1/')

    if [ -n "$BC_VERSION" ]; then
        log_pass "BouncyCastle version: $BC_VERSION"

        # Check if version is recent (1.78+)
        if [[ "$BC_VERSION" < "1.78" ]]; then
            log_medium "BouncyCastle version may be outdated (current: $BC_VERSION, recommended: 1.78+)"
        fi
    else
        log_info "BouncyCastle not found in pom.xml"
    fi
}

check_docker_compose() {
    print_header "Checking docker-compose.yml"

    local COMPOSE_FILE="$PROJECT_ROOT/docker-compose.production.yml"

    if [ ! -f "$COMPOSE_FILE" ]; then
        log_medium "docker-compose.production.yml not found (checking for docker-compose.yml)"
        COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
    fi

    if [ ! -f "$COMPOSE_FILE" ]; then
        log_info "No docker-compose files found"
        return 0
    fi

    # Check for privileged containers
    if grep -q "privileged:\s*true" "$COMPOSE_FILE"; then
        log_critical "Privileged containers detected (major security risk)"
    else
        log_pass "No privileged containers"
    fi

    # Check for host network mode
    if grep -q "network_mode:\s*host" "$COMPOSE_FILE"; then
        log_high "Host network mode detected (reduces network isolation)"
    else
        log_pass "Host network mode not used"
    fi

    # Check for volume mounts
    if grep -q "/var/run/docker.sock" "$COMPOSE_FILE"; then
        log_high "Docker socket mounted (allows container escape)"
    else
        log_pass "Docker socket not mounted"
    fi

    # Check resource limits
    if grep -q "mem_limit" "$COMPOSE_FILE" && grep -q "cpus" "$COMPOSE_FILE"; then
        log_pass "Resource limits configured"
    else
        log_medium "Resource limits (mem_limit, cpus) not fully configured"
    fi

    # Check for read-only root filesystem
    if grep -q "read_only:\s*true" "$COMPOSE_FILE"; then
        log_pass "Read-only root filesystem enabled"
    else
        log_medium "Read-only root filesystem not enabled"
    fi
}

check_nginx_config() {
    print_header "Checking NGINX Configuration"

    local NGINX_CONFIGS=(
        "$PROJECT_ROOT/deployment/nginx/nginx.conf"
        "$PROJECT_ROOT/nginx.conf"
        "/etc/nginx/sites-available/aurigraph-v11"
    )

    local NGINX_CONFIG=""

    for CONFIG in "${NGINX_CONFIGS[@]}"; do
        if [ -f "$CONFIG" ]; then
            NGINX_CONFIG="$CONFIG"
            break
        fi
    done

    if [ -z "$NGINX_CONFIG" ]; then
        log_info "NGINX configuration not found (may be managed externally)"
        return 0
    fi

    echo "Checking $NGINX_CONFIG..."

    # Check TLS version
    if grep -q "ssl_protocols.*TLSv1\.3" "$NGINX_CONFIG"; then
        log_pass "TLS 1.3 configured in NGINX"
    elif grep -q "ssl_protocols" "$NGINX_CONFIG"; then
        log_medium "NGINX TLS configuration found but not enforcing TLS 1.3"
    else
        log_high "No TLS protocol configuration in NGINX"
    fi

    # Check HSTS header
    if grep -q "Strict-Transport-Security" "$NGINX_CONFIG"; then
        log_pass "HSTS header configured"

        # Check HSTS max-age
        local MAX_AGE=$(grep "Strict-Transport-Security" "$NGINX_CONFIG" | grep -o "max-age=[0-9]*" | cut -d= -f2 || echo "0")

        if [ "$MAX_AGE" -ge 31536000 ]; then
            log_pass "HSTS max-age is 1 year or more ($MAX_AGE seconds)"
        else
            log_medium "HSTS max-age is less than 1 year ($MAX_AGE seconds)"
        fi
    else
        log_high "HSTS header not configured"
    fi

    # Check CSP header
    if grep -q "Content-Security-Policy" "$NGINX_CONFIG"; then
        log_pass "Content-Security-Policy header configured"
    else
        log_medium "Content-Security-Policy header not configured"
    fi

    # Check server_tokens
    if grep -q "server_tokens\s*off" "$NGINX_CONFIG"; then
        log_pass "Server version disclosure disabled (server_tokens off)"
    else
        log_low "Server version disclosure not explicitly disabled"
    fi

    # Check rate limiting
    if grep -q "limit_req_zone" "$NGINX_CONFIG"; then
        log_pass "Rate limiting configured"
    else
        log_medium "Rate limiting not configured"
    fi
}

check_keycloak_config() {
    print_header "Checking Keycloak/IAM Configuration"

    # This is a placeholder - actual Keycloak config is managed via admin console
    log_info "Keycloak configuration managed via admin console (https://iam2.aurigraph.io)"
    log_info "Manual checks required:"
    echo "  - [ ] Password policy enforced (14+ characters, complexity)" | tee -a "$REPORT_FILE"
    echo "  - [ ] MFA enabled for admin accounts" | tee -a "$REPORT_FILE"
    echo "  - [ ] Account lockout policy (5 failed attempts)" | tee -a "$REPORT_FILE"
    echo "  - [ ] Session timeout (15 minutes)" | tee -a "$REPORT_FILE"
    echo "  - [ ] SSL/TLS required for all realms" | tee -a "$REPORT_FILE"
}

check_environment_variables() {
    print_header "Checking Environment Variables"

    # Check .env files
    local ENV_FILES=(
        "$PROJECT_ROOT/.env"
        "$PROJECT_ROOT/.env.production"
        "$PROJECT_ROOT/enterprise-portal/enterprise-portal/frontend/.env"
    )

    for ENV_FILE in "${ENV_FILES[@]}"; do
        if [ -f "$ENV_FILE" ]; then
            echo "Checking $ENV_FILE..."

            # Check for hardcoded secrets
            if grep -E "(PASSWORD|SECRET|KEY|TOKEN)\s*=\s*.+" "$ENV_FILE" | grep -v "^\s*#"; then
                log_high "Hardcoded secrets in $ENV_FILE"
                log_medium "Ensure .env files are in .gitignore"
            fi

            # Check if .env is in .gitignore
            if git check-ignore "$ENV_FILE" &>/dev/null; then
                log_pass "$ENV_FILE is in .gitignore"
            else
                log_critical "$ENV_FILE is NOT in .gitignore (secrets may be committed)"
            fi
        fi
    done
}

################################################################################
# Generate Summary Report
################################################################################

generate_summary() {
    print_header "Audit Summary"

    cat >> "$REPORT_FILE" <<EOF

================================================================================
AUDIT SUMMARY
================================================================================

Issues Found:
  Critical: $CRITICAL_ISSUES
  High: $HIGH_ISSUES
  Medium: $MEDIUM_ISSUES
  Low: $LOW_ISSUES

Informational Items: $INFO_ITEMS

================================================================================
RECOMMENDATIONS
================================================================================

1. Address all CRITICAL issues immediately
2. Remediate HIGH and MEDIUM issues within 30 days
3. Review LOW issues for best practices
4. Re-run audit after remediation

================================================================================
NEXT STEPS
================================================================================

- [ ] Create JIRA tickets for each issue
- [ ] Assign ownership and deadlines
- [ ] Implement fixes
- [ ] Re-scan to verify remediation

================================================================================
Report saved to: $REPORT_FILE
================================================================================
EOF

    # Display summary
    echo ""
    echo -e "${RED}Critical Issues: $CRITICAL_ISSUES${NC}"
    echo -e "${ORANGE}High Issues: $HIGH_ISSUES${NC}"
    echo -e "${YELLOW}Medium Issues: $MEDIUM_ISSUES${NC}"
    echo "Low Issues: $LOW_ISSUES"
    echo -e "${GREEN}Informational: $INFO_ITEMS${NC}"
    echo ""
    echo "Full report: $REPORT_FILE"
}

################################################################################
# Main Execution
################################################################################

main() {
    print_header "Aurigraph V11 Configuration Security Audit"
    echo "Project Root: $PROJECT_ROOT"
    echo "Timestamp: $TIMESTAMP"
    echo ""

    setup_report

    check_application_properties
    echo ""
    check_pom_xml
    echo ""
    check_docker_compose
    echo ""
    check_nginx_config
    echo ""
    check_keycloak_config
    echo ""
    check_environment_variables
    echo ""

    generate_summary

    # Exit code
    if [ $CRITICAL_ISSUES -eq 0 ] && [ $HIGH_ISSUES -eq 0 ]; then
        echo -e "${GREEN}✓ No critical or high security issues found${NC}"
        exit 0
    else
        echo -e "${RED}✗ Security issues found. Review required.${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
