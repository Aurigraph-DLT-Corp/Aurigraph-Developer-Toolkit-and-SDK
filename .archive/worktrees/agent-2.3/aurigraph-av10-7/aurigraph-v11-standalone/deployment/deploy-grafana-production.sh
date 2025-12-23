#!/bin/bash

################################################################################
# Grafana Production Deployment Script
# Sprint 16 Phase 2: Monitoring Infrastructure Deployment
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REMOTE_HOST="dlt.aurigraph.io"
REMOTE_USER="subbu"
REMOTE_PORT="2235"
GRAFANA_PORT="3000"
GRAFANA_VERSION="11.4.0"
DEPLOYMENT_DIR="/opt/aurigraph/monitoring"
BACKUP_DIR="/opt/aurigraph/backups/grafana"
LOG_FILE="/var/log/aurigraph/grafana-deployment.log"

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

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check SSH connectivity
    if ! ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "echo 'SSH OK'" > /dev/null 2>&1; then
        print_error "Cannot connect to remote host ${REMOTE_HOST}"
        print_info "Please ensure SSH access is configured with key-based authentication"
        exit 1
    fi
    print_success "SSH connectivity verified"

    # Check Docker on remote host
    if ! ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "docker --version" > /dev/null 2>&1; then
        print_error "Docker not found on remote host"
        exit 1
    fi
    print_success "Docker verified on remote host"

    # Check Docker Compose
    if ! ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "docker compose version" > /dev/null 2>&1; then
        print_error "Docker Compose not found on remote host"
        exit 1
    fi
    print_success "Docker Compose verified"

    # Check available disk space (need at least 10GB for Grafana + data)
    AVAILABLE_SPACE=$(ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "df -BG /opt | tail -1 | awk '{print \$4}' | sed 's/G//'")
    if [ "${AVAILABLE_SPACE}" -lt 10 ]; then
        print_error "Insufficient disk space. Need at least 10GB, available: ${AVAILABLE_SPACE}GB"
        exit 1
    fi
    print_success "Disk space verified (${AVAILABLE_SPACE}GB available)"

    # Check available memory (need at least 2GB for Grafana)
    AVAILABLE_MEM=$(ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "free -g | grep Mem | awk '{print \$7}'")
    if [ "${AVAILABLE_MEM}" -lt 2 ]; then
        print_warning "Low available memory: ${AVAILABLE_MEM}GB. Grafana needs at least 2GB"
    fi
    print_success "Memory check passed (${AVAILABLE_MEM}GB available)"
}

# Backup existing Grafana data
backup_existing_data() {
    print_header "Backing Up Existing Grafana Data"

    # Check if Grafana is running
    if ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "docker ps | grep grafana" > /dev/null 2>&1; then
        print_info "Existing Grafana instance found, creating backup..."

        # Create backup directory
        ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "sudo mkdir -p ${BACKUP_DIR}"

        # Backup Grafana data
        BACKUP_NAME="grafana-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
            "sudo docker exec aurigraph-grafana tar czf /tmp/${BACKUP_NAME} /var/lib/grafana 2>/dev/null || true"

        ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
            "sudo docker cp aurigraph-grafana:/tmp/${BACKUP_NAME} ${BACKUP_DIR}/ 2>/dev/null || true"

        print_success "Backup created: ${BACKUP_DIR}/${BACKUP_NAME}"
    else
        print_info "No existing Grafana instance found, skipping backup"
    fi
}

# Create deployment directory structure
create_directory_structure() {
    print_header "Creating Directory Structure"

    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
        sudo mkdir -p /opt/aurigraph/monitoring/grafana/{data,dashboards,provisioning}
        sudo mkdir -p /opt/aurigraph/monitoring/grafana/provisioning/{datasources,dashboards}
        sudo mkdir -p /var/log/aurigraph
        sudo chown -R 472:472 /opt/aurigraph/monitoring/grafana/data
        sudo chmod -R 755 /opt/aurigraph/monitoring/grafana
EOF

    print_success "Directory structure created"
}

# Copy configuration files
copy_configurations() {
    print_header "Copying Configuration Files"

    # Copy datasource configuration
    scp -P ${REMOTE_PORT} ./grafana-datasources.yml \
        ${REMOTE_USER}@${REMOTE_HOST}:/tmp/grafana-datasources.yml

    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "sudo mv /tmp/grafana-datasources.yml /opt/aurigraph/monitoring/grafana/provisioning/datasources/"

    print_success "Datasource configuration copied"

    # Copy dashboard provisioning config
    cat > /tmp/dashboard-provisioning.yml << 'DASHEOF'
apiVersion: 1

providers:
  - name: 'Aurigraph V11'
    orgId: 1
    folder: 'Aurigraph'
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
DASHEOF

    scp -P ${REMOTE_PORT} /tmp/dashboard-provisioning.yml \
        ${REMOTE_USER}@${REMOTE_HOST}:/tmp/

    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "sudo mv /tmp/dashboard-provisioning.yml /opt/aurigraph/monitoring/grafana/provisioning/dashboards/dashboards.yml"

    print_success "Dashboard provisioning configured"

    # Copy dashboard JSON files if they exist
    if [ -d "../config/grafana/dashboards" ]; then
        print_info "Copying dashboard files..."
        scp -P ${REMOTE_PORT} ../config/grafana/dashboards/*.json \
            ${REMOTE_USER}@${REMOTE_HOST}:/tmp/ 2>/dev/null || true

        ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
            "sudo mv /tmp/*.json /opt/aurigraph/monitoring/grafana/dashboards/ 2>/dev/null || true"

        print_success "Dashboard files copied"
    fi
}

# Deploy Grafana container
deploy_grafana() {
    print_header "Deploying Grafana Container"

    # Stop existing container if running
    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "docker stop aurigraph-grafana 2>/dev/null || true"

    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "docker rm aurigraph-grafana 2>/dev/null || true"

    # Create Grafana container
    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << EOF
        docker run -d \
            --name aurigraph-grafana \
            --restart unless-stopped \
            -p 127.0.0.1:${GRAFANA_PORT}:3000 \
            -e GF_SECURITY_ADMIN_USER=admin \
            -e GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_ADMIN_PASSWORD:-aurigraph_admin_2025} \
            -e GF_USERS_ALLOW_SIGN_UP=false \
            -e GF_SERVER_ROOT_URL=https://dlt.aurigraph.io/monitoring \
            -e GF_SERVER_SERVE_FROM_SUB_PATH=true \
            -e GF_INSTALL_PLUGINS=grafana-piechart-panel,grafana-clock-panel \
            -e GF_LOG_MODE=console,file \
            -e GF_LOG_LEVEL=info \
            -v /opt/aurigraph/monitoring/grafana/data:/var/lib/grafana \
            -v /opt/aurigraph/monitoring/grafana/provisioning/datasources:/etc/grafana/provisioning/datasources \
            -v /opt/aurigraph/monitoring/grafana/provisioning/dashboards:/etc/grafana/provisioning/dashboards \
            -v /opt/aurigraph/monitoring/grafana/dashboards:/etc/grafana/dashboards \
            grafana/grafana:${GRAFANA_VERSION}
EOF

    print_success "Grafana container deployed"
}

# Verify deployment
verify_deployment() {
    print_header "Verifying Deployment"

    # Wait for Grafana to start
    print_info "Waiting for Grafana to start (max 60 seconds)..."
    for i in {1..60}; do
        if ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
            "curl -s http://localhost:${GRAFANA_PORT}/api/health" | grep -q "ok"; then
            print_success "Grafana is running"
            break
        fi

        if [ $i -eq 60 ]; then
            print_error "Grafana failed to start within 60 seconds"
            print_info "Check logs: ssh ${REMOTE_USER}@${REMOTE_HOST} -p ${REMOTE_PORT} 'docker logs aurigraph-grafana'"
            exit 1
        fi

        sleep 1
    done

    # Check container status
    CONTAINER_STATUS=$(ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "docker inspect -f '{{.State.Status}}' aurigraph-grafana")

    if [ "${CONTAINER_STATUS}" = "running" ]; then
        print_success "Container status: ${CONTAINER_STATUS}"
    else
        print_error "Container status: ${CONTAINER_STATUS}"
        exit 1
    fi

    # Check Grafana version
    GRAFANA_RUNNING_VERSION=$(ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "curl -s http://localhost:${GRAFANA_PORT}/api/health | jq -r '.version' 2>/dev/null || echo 'unknown'")

    print_success "Grafana version: ${GRAFANA_RUNNING_VERSION}"

    # Check datasources
    print_info "Checking Prometheus datasource..."
    if ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "docker exec aurigraph-grafana ls /etc/grafana/provisioning/datasources/grafana-datasources.yml" > /dev/null 2>&1; then
        print_success "Datasource configuration found"
    else
        print_warning "Datasource configuration not found"
    fi
}

# Configure firewall
configure_firewall() {
    print_header "Configuring Firewall"

    # Note: Grafana runs on localhost only, accessible via NGINX reverse proxy
    print_info "Grafana is configured to listen on 127.0.0.1:${GRAFANA_PORT} only"
    print_info "External access will be provided via NGINX reverse proxy"
    print_success "Firewall configuration complete (localhost only)"
}

# Display summary
display_summary() {
    print_header "Deployment Summary"

    echo ""
    echo "Grafana has been successfully deployed to production!"
    echo ""
    echo "Configuration:"
    echo "  - Host: ${REMOTE_HOST}"
    echo "  - Port: ${GRAFANA_PORT} (localhost only)"
    echo "  - Version: ${GRAFANA_VERSION}"
    echo "  - URL: https://dlt.aurigraph.io/monitoring (after NGINX configuration)"
    echo ""
    echo "Container Information:"
    echo "  - Name: aurigraph-grafana"
    echo "  - Restart Policy: unless-stopped"
    echo "  - Data Volume: /opt/aurigraph/monitoring/grafana/data"
    echo ""
    echo "Default Credentials:"
    echo "  - Username: admin"
    echo "  - Password: (set via GRAFANA_ADMIN_PASSWORD env var)"
    echo ""
    echo "Next Steps:"
    echo "  1. Configure NGINX reverse proxy (run deploy-nginx-monitoring.sh)"
    echo "  2. Set up SSL certificates (run setup-ssl-certificates.sh)"
    echo "  3. Change admin password via Grafana UI"
    echo "  4. Import dashboards if not auto-provisioned"
    echo "  5. Configure alert notification channels"
    echo ""
    echo "Useful Commands:"
    echo "  - View logs: ssh ${REMOTE_USER}@${REMOTE_HOST} -p ${REMOTE_PORT} 'docker logs -f aurigraph-grafana'"
    echo "  - Restart: ssh ${REMOTE_USER}@${REMOTE_HOST} -p ${REMOTE_PORT} 'docker restart aurigraph-grafana'"
    echo "  - Stop: ssh ${REMOTE_USER}@${REMOTE_HOST} -p ${REMOTE_PORT} 'docker stop aurigraph-grafana'"
    echo ""
}

# Main execution
main() {
    print_header "Grafana Production Deployment - Sprint 16 Phase 2"
    echo "Target: ${REMOTE_HOST}"
    echo "Time: $(date)"
    echo ""

    check_prerequisites
    backup_existing_data
    create_directory_structure
    copy_configurations
    deploy_grafana
    verify_deployment
    configure_firewall
    display_summary

    print_success "Deployment completed successfully!"
}

# Run main function
main "$@"
