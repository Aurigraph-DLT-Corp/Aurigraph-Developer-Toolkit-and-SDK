#!/bin/bash

#####################################################################
# Aurigraph V11 Production Deployment Script
#
# This script automates the deployment of Aurigraph V11 to production
# server (dlt.aurigraph.io)
#
# Prerequisites:
# 1. Native executable built: target/*-runner
# 2. SSH access configured to remote server
# 3. Sudo privileges on remote server
#####################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
VERSION="11.4.3"
APP_NAME="aurigraph-v11-standalone"
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="22"
DEPLOY_BASE_DIR="/opt/DLT/aurigraph-v11"
DEPLOY_DIR="${DEPLOY_BASE_DIR}/${VERSION}"
BACKUP_DIR="${DEPLOY_BASE_DIR}/backups"
LOG_DIR="${DEPLOY_BASE_DIR}/logs"
DATA_DIR="${DEPLOY_BASE_DIR}/data"

# Local paths
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
NATIVE_EXECUTABLE="${PROJECT_DIR}/target/${APP_NAME}-${VERSION}-runner"
APP_PROPERTIES="${PROJECT_DIR}/src/main/resources/application.properties"
SYSTEMD_SERVICE="${SCRIPT_DIR}/aurigraph-v11.service"
NGINX_CONFIG="${SCRIPT_DIR}/nginx-aurigraph-v11.conf"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check native executable
    if [ ! -f "$NATIVE_EXECUTABLE" ]; then
        log_error "Native executable not found: $NATIVE_EXECUTABLE"
        log_info "Please build the native executable first: ./mvnw package -Pnative"
        exit 1
    fi

    # Check SSH connectivity
    if ! ssh -o ConnectTimeout=5 -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" "echo 'SSH connection successful'" &>/dev/null; then
        log_error "Cannot connect to remote server: ${REMOTE_USER}@${REMOTE_HOST}"
        log_info "Please check your SSH configuration and credentials"
        exit 1
    fi

    log_info "Prerequisites check passed"
}

create_remote_directories() {
    log_info "Creating remote directories..."

    ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
        sudo mkdir -p ${DEPLOY_DIR}
        sudo mkdir -p ${BACKUP_DIR}
        sudo mkdir -p ${LOG_DIR}
        sudo mkdir -p ${DATA_DIR}

        # Create aurigraph user if doesn't exist
        if ! id -u aurigraph >/dev/null 2>&1; then
            sudo useradd -r -s /bin/bash -d ${DEPLOY_BASE_DIR} aurigraph
        fi

        # Set permissions
        sudo chown -R aurigraph:aurigraph ${DEPLOY_BASE_DIR}
        sudo chmod 755 ${DEPLOY_DIR}
        sudo chmod 755 ${LOG_DIR}
        sudo chmod 755 ${DATA_DIR}
EOF

    log_info "Remote directories created"
}

backup_existing_deployment() {
    log_info "Backing up existing deployment (if any)..."

    ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
        if [ -f ${DEPLOY_DIR}/${APP_NAME}-${VERSION}-runner ]; then
            BACKUP_NAME="backup-\$(date +%Y%m%d-%H%M%S)"
            sudo mkdir -p ${BACKUP_DIR}/\${BACKUP_NAME}
            sudo cp -r ${DEPLOY_DIR}/* ${BACKUP_DIR}/\${BACKUP_NAME}/
            echo "Backup created: \${BACKUP_NAME}"
        else
            echo "No existing deployment to backup"
        fi
EOF

    log_info "Backup completed"
}

upload_artifacts() {
    log_info "Uploading deployment artifacts..."

    # Upload native executable
    log_info "Uploading native executable..."
    scp -P "$REMOTE_PORT" "$NATIVE_EXECUTABLE" \
        "${REMOTE_USER}@${REMOTE_HOST}:/tmp/${APP_NAME}-${VERSION}-runner"

    # Upload application properties
    log_info "Uploading application properties..."
    scp -P "$REMOTE_PORT" "$APP_PROPERTIES" \
        "${REMOTE_USER}@${REMOTE_HOST}:/tmp/application.properties"

    # Move to final location with sudo
    ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
        sudo mv /tmp/${APP_NAME}-${VERSION}-runner ${DEPLOY_DIR}/
        sudo mv /tmp/application.properties ${DEPLOY_DIR}/
        sudo chmod +x ${DEPLOY_DIR}/${APP_NAME}-${VERSION}-runner
        sudo chown aurigraph:aurigraph ${DEPLOY_DIR}/*
EOF

    log_info "Artifacts uploaded successfully"
}

configure_systemd() {
    log_info "Configuring systemd service..."

    # Upload systemd service file
    scp -P "$REMOTE_PORT" "$SYSTEMD_SERVICE" \
        "${REMOTE_USER}@${REMOTE_HOST}:/tmp/aurigraph-v11.service"

    ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
        sudo mv /tmp/aurigraph-v11.service /etc/systemd/system/
        sudo systemctl daemon-reload
        sudo systemctl enable aurigraph-v11
EOF

    log_info "Systemd service configured"
}

configure_nginx() {
    log_info "Configuring Nginx reverse proxy..."

    # Upload Nginx config
    scp -P "$REMOTE_PORT" "$NGINX_CONFIG" \
        "${REMOTE_USER}@${REMOTE_HOST}:/tmp/nginx-aurigraph-v11.conf"

    ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
        # Check if Nginx is installed
        if ! command -v nginx &> /dev/null; then
            echo "Nginx not installed, skipping Nginx configuration"
            echo "Please install Nginx manually: sudo apt install nginx"
            exit 0
        fi

        # Move config to sites-available
        sudo mv /tmp/nginx-aurigraph-v11.conf /etc/nginx/sites-available/aurigraph-v11.conf

        # Create symlink to sites-enabled
        sudo ln -sf /etc/nginx/sites-available/aurigraph-v11.conf /etc/nginx/sites-enabled/

        # Test Nginx configuration
        sudo nginx -t

        # Note: Don't reload Nginx automatically - let admin review first
        echo "Nginx configuration installed. Review and reload with: sudo systemctl reload nginx"
EOF

    log_info "Nginx configuration uploaded"
}

start_service() {
    log_info "Starting Aurigraph V11 service..."

    ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
        # Stop existing service if running
        if sudo systemctl is-active --quiet aurigraph-v11; then
            sudo systemctl stop aurigraph-v11
            sleep 5
        fi

        # Start service
        sudo systemctl start aurigraph-v11

        # Wait for startup
        sleep 10

        # Check status
        sudo systemctl status aurigraph-v11 --no-pager
EOF

    log_info "Service started"
}

verify_deployment() {
    log_info "Verifying deployment..."

    # Wait for service to stabilize
    sleep 10

    # Check health endpoint
    if ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" \
        "curl -f http://localhost:9003/api/v11/health" &>/dev/null; then
        log_info "Health check PASSED"
    else
        log_error "Health check FAILED"
        log_warn "Check service logs: journalctl -u aurigraph-v11 -f"
        exit 1
    fi

    # Check system info
    log_info "System information:"
    ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" \
        "curl -s http://localhost:9003/api/v11/info | jq ."

    log_info "Deployment verification completed"
}

print_summary() {
    log_info "======================================"
    log_info "Deployment Summary"
    log_info "======================================"
    log_info "Version: ${VERSION}"
    log_info "Server: ${REMOTE_HOST}"
    log_info "Deploy Directory: ${DEPLOY_DIR}"
    log_info ""
    log_info "Next Steps:"
    log_info "1. Review Nginx config and reload: sudo systemctl reload nginx"
    log_info "2. Monitor service logs: journalctl -u aurigraph-v11 -f"
    log_info "3. Run performance tests"
    log_info "4. Monitor metrics: http://${REMOTE_HOST}:9003/q/metrics"
    log_info ""
    log_info "Service Management:"
    log_info "  Start:   sudo systemctl start aurigraph-v11"
    log_info "  Stop:    sudo systemctl stop aurigraph-v11"
    log_info "  Restart: sudo systemctl restart aurigraph-v11"
    log_info "  Status:  sudo systemctl status aurigraph-v11"
    log_info "  Logs:    journalctl -u aurigraph-v11 -f"
    log_info "======================================"
}

rollback() {
    log_warn "Rolling back deployment..."

    ssh -p "$REMOTE_PORT" "${REMOTE_USER}@${REMOTE_HOST}" bash <<EOF
        # Stop service
        sudo systemctl stop aurigraph-v11

        # Find most recent backup
        LATEST_BACKUP=\$(ls -t ${BACKUP_DIR} | head -1)

        if [ -z "\$LATEST_BACKUP" ]; then
            echo "No backup found for rollback"
            exit 1
        fi

        # Restore from backup
        sudo cp -r ${BACKUP_DIR}/\${LATEST_BACKUP}/* ${DEPLOY_DIR}/
        sudo chown -R aurigraph:aurigraph ${DEPLOY_DIR}

        # Start service
        sudo systemctl start aurigraph-v11

        echo "Rolled back to: \$LATEST_BACKUP"
EOF

    log_info "Rollback completed"
}

# Main deployment flow
main() {
    log_info "Starting Aurigraph V11 Production Deployment"
    log_info "Version: ${VERSION}"
    log_info "Target: ${REMOTE_USER}@${REMOTE_HOST}"
    log_info ""

    # Prompt for confirmation
    read -p "Continue with deployment? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        log_warn "Deployment cancelled"
        exit 0
    fi

    # Execute deployment steps
    check_prerequisites
    create_remote_directories
    backup_existing_deployment
    upload_artifacts
    configure_systemd
    configure_nginx
    start_service
    verify_deployment
    print_summary

    log_info "Deployment completed successfully!"
}

# Trap errors and offer rollback
trap 'log_error "Deployment failed! Run with ROLLBACK=1 to rollback"; exit 1' ERR

# Check if rollback is requested
if [ "${ROLLBACK:-0}" = "1" ]; then
    rollback
    exit 0
fi

# Run main deployment
main
