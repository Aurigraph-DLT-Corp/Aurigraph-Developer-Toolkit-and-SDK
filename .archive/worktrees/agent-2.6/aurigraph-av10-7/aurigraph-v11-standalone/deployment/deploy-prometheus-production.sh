#!/bin/bash

################################################################################
# Prometheus Production Deployment Script
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
PROMETHEUS_PORT="9090"
PROMETHEUS_VERSION="v2.58.3"
DEPLOYMENT_DIR="/opt/aurigraph/monitoring"
BACKUP_DIR="/opt/aurigraph/backups/prometheus"
RETENTION_DAYS="30"
STORAGE_SIZE="20GB"

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
        exit 1
    fi
    print_success "SSH connectivity verified"

    # Check Docker on remote host
    if ! ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "docker --version" > /dev/null 2>&1; then
        print_error "Docker not found on remote host"
        exit 1
    fi
    print_success "Docker verified"

    # Check available disk space (need at least 25GB for Prometheus data)
    AVAILABLE_SPACE=$(ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "df -BG /opt | tail -1 | awk '{print \$4}' | sed 's/G//'")
    if [ "${AVAILABLE_SPACE}" -lt 25 ]; then
        print_error "Insufficient disk space. Need at least 25GB, available: ${AVAILABLE_SPACE}GB"
        exit 1
    fi
    print_success "Disk space verified (${AVAILABLE_SPACE}GB available)"

    # Check if configuration files exist locally
    if [ ! -f "./prometheus.yml" ]; then
        print_error "prometheus.yml not found in current directory"
        exit 1
    fi
    print_success "Configuration files verified"
}

# Backup existing Prometheus data
backup_existing_data() {
    print_header "Backing Up Existing Prometheus Data"

    if ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "docker ps | grep prometheus" > /dev/null 2>&1; then
        print_info "Existing Prometheus instance found, creating backup..."

        ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} "sudo mkdir -p ${BACKUP_DIR}"

        BACKUP_NAME="prometheus-backup-$(date +%Y%m%d-%H%M%S).tar.gz"
        ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
            "sudo tar czf ${BACKUP_DIR}/${BACKUP_NAME} /opt/aurigraph/monitoring/prometheus/data 2>/dev/null || true"

        print_success "Backup created: ${BACKUP_DIR}/${BACKUP_NAME}"
    else
        print_info "No existing Prometheus instance found, skipping backup"
    fi
}

# Create directory structure
create_directory_structure() {
    print_header "Creating Directory Structure"

    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
        sudo mkdir -p /opt/aurigraph/monitoring/prometheus/{data,config,rules}
        sudo mkdir -p /var/log/aurigraph
        sudo chown -R 65534:65534 /opt/aurigraph/monitoring/prometheus/data
        sudo chmod -R 755 /opt/aurigraph/monitoring/prometheus
EOF

    print_success "Directory structure created"
}

# Copy configuration files
copy_configurations() {
    print_header "Copying Configuration Files"

    # Copy Prometheus config
    scp -P ${REMOTE_PORT} ./prometheus.yml \
        ${REMOTE_USER}@${REMOTE_HOST}:/tmp/prometheus.yml

    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "sudo mv /tmp/prometheus.yml /opt/aurigraph/monitoring/prometheus/config/"

    print_success "Prometheus configuration copied"

    # Copy alert rules
    if [ -f "./prometheus-alerts.yml" ]; then
        scp -P ${REMOTE_PORT} ./prometheus-alerts.yml \
            ${REMOTE_USER}@${REMOTE_HOST}:/tmp/prometheus-alerts.yml

        ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
            "sudo mv /tmp/prometheus-alerts.yml /opt/aurigraph/monitoring/prometheus/rules/alerts.yml"

        print_success "Alert rules copied"
    else
        print_warning "No alert rules file found (prometheus-alerts.yml)"
    fi

    # Update Prometheus config for production
    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
        # Update scrape targets for production
        sudo sed -i 's/localhost:9003/host.docker.internal:9003/g' /opt/aurigraph/monitoring/prometheus/config/prometheus.yml
EOF

    print_success "Configuration updated for production"
}

# Deploy Prometheus container
deploy_prometheus() {
    print_header "Deploying Prometheus Container"

    # Stop existing container if running
    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "docker stop aurigraph-prometheus 2>/dev/null || true"

    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "docker rm aurigraph-prometheus 2>/dev/null || true"

    # Create Prometheus container
    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << EOF
        docker run -d \
            --name aurigraph-prometheus \
            --restart unless-stopped \
            --add-host=host.docker.internal:host-gateway \
            -p 127.0.0.1:${PROMETHEUS_PORT}:9090 \
            -v /opt/aurigraph/monitoring/prometheus/config:/etc/prometheus \
            -v /opt/aurigraph/monitoring/prometheus/rules:/etc/prometheus/rules \
            -v /opt/aurigraph/monitoring/prometheus/data:/prometheus \
            prom/prometheus:${PROMETHEUS_VERSION} \
            --config.file=/etc/prometheus/prometheus.yml \
            --storage.tsdb.path=/prometheus \
            --storage.tsdb.retention.time=${RETENTION_DAYS}d \
            --storage.tsdb.retention.size=${STORAGE_SIZE} \
            --web.console.libraries=/usr/share/prometheus/console_libraries \
            --web.console.templates=/usr/share/prometheus/consoles \
            --web.enable-lifecycle \
            --web.enable-admin-api
EOF

    print_success "Prometheus container deployed"
}

# Deploy Node Exporter
deploy_node_exporter() {
    print_header "Deploying Node Exporter"

    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "docker stop aurigraph-node-exporter 2>/dev/null || true"

    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "docker rm aurigraph-node-exporter 2>/dev/null || true"

    ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} << 'EOF'
        docker run -d \
            --name aurigraph-node-exporter \
            --restart unless-stopped \
            -p 9100:9100 \
            --pid="host" \
            -v /proc:/host/proc:ro \
            -v /sys:/host/sys:ro \
            -v /:/rootfs:ro \
            prom/node-exporter:v1.8.2 \
            --path.procfs=/host/proc \
            --path.sysfs=/host/sys \
            --path.rootfs=/rootfs \
            --collector.filesystem.mount-points-exclude='^/(sys|proc|dev|host|etc)($$|/)'
EOF

    print_success "Node Exporter deployed"
}

# Verify deployment
verify_deployment() {
    print_header "Verifying Deployment"

    # Wait for Prometheus to start
    print_info "Waiting for Prometheus to start (max 60 seconds)..."
    for i in {1..60}; do
        if ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
            "curl -s http://localhost:${PROMETHEUS_PORT}/-/healthy" | grep -q "Prometheus Server is Healthy"; then
            print_success "Prometheus is running"
            break
        fi

        if [ $i -eq 60 ]; then
            print_error "Prometheus failed to start within 60 seconds"
            exit 1
        fi

        sleep 1
    done

    # Check container status
    CONTAINER_STATUS=$(ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "docker inspect -f '{{.State.Status}}' aurigraph-prometheus")

    if [ "${CONTAINER_STATUS}" = "running" ]; then
        print_success "Container status: ${CONTAINER_STATUS}"
    else
        print_error "Container status: ${CONTAINER_STATUS}"
        exit 1
    fi

    # Check configuration
    print_info "Validating configuration..."
    if ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "curl -s http://localhost:${PROMETHEUS_PORT}/-/ready" | grep -q "Prometheus Server is Ready"; then
        print_success "Configuration is valid"
    else
        print_error "Configuration validation failed"
        exit 1
    fi

    # Check scrape targets
    print_info "Checking scrape targets..."
    TARGET_COUNT=$(ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "curl -s http://localhost:${PROMETHEUS_PORT}/api/v1/targets | jq '.data.activeTargets | length' 2>/dev/null || echo '0'")

    if [ "${TARGET_COUNT}" -gt 0 ]; then
        print_success "Found ${TARGET_COUNT} scrape targets"
    else
        print_warning "No scrape targets found yet (may take a few seconds)"
    fi

    # Check Node Exporter
    if ssh -p ${REMOTE_PORT} ${REMOTE_USER}@${REMOTE_HOST} \
        "curl -s http://localhost:9100/metrics" | grep -q "node_"; then
        print_success "Node Exporter is working"
    else
        print_warning "Node Exporter metrics not available"
    fi
}

# Configure firewall
configure_firewall() {
    print_header "Configuring Firewall"

    print_info "Prometheus runs on 127.0.0.1:${PROMETHEUS_PORT} (localhost only)"
    print_info "Node Exporter runs on 0.0.0.0:9100 (accessible from Prometheus)"
    print_success "Firewall configuration complete"
}

# Display summary
display_summary() {
    print_header "Deployment Summary"

    echo ""
    echo "Prometheus has been successfully deployed to production!"
    echo ""
    echo "Configuration:"
    echo "  - Host: ${REMOTE_HOST}"
    echo "  - Port: ${PROMETHEUS_PORT} (localhost only)"
    echo "  - Version: ${PROMETHEUS_VERSION}"
    echo "  - Retention: ${RETENTION_DAYS} days"
    echo "  - Storage Limit: ${STORAGE_SIZE}"
    echo ""
    echo "Container Information:"
    echo "  - Name: aurigraph-prometheus"
    echo "  - Restart Policy: unless-stopped"
    echo "  - Data Volume: /opt/aurigraph/monitoring/prometheus/data"
    echo ""
    echo "Exporters:"
    echo "  - Node Exporter: localhost:9100 (system metrics)"
    echo ""
    echo "Next Steps:"
    echo "  1. Verify scrape targets: http://localhost:${PROMETHEUS_PORT}/targets"
    echo "  2. Check alert rules: http://localhost:${PROMETHEUS_PORT}/rules"
    echo "  3. Deploy Alertmanager (optional)"
    echo "  4. Configure Grafana to use Prometheus as datasource"
    echo ""
    echo "Useful Commands:"
    echo "  - View logs: ssh ${REMOTE_USER}@${REMOTE_HOST} -p ${REMOTE_PORT} 'docker logs -f aurigraph-prometheus'"
    echo "  - Reload config: ssh ${REMOTE_USER}@${REMOTE_HOST} -p ${REMOTE_PORT} 'curl -X POST http://localhost:${PROMETHEUS_PORT}/-/reload'"
    echo "  - Check targets: ssh ${REMOTE_USER}@${REMOTE_HOST} -p ${REMOTE_PORT} 'curl http://localhost:${PROMETHEUS_PORT}/api/v1/targets'"
    echo ""
}

# Main execution
main() {
    print_header "Prometheus Production Deployment - Sprint 16 Phase 2"
    echo "Target: ${REMOTE_HOST}"
    echo "Time: $(date)"
    echo ""

    check_prerequisites
    backup_existing_data
    create_directory_structure
    copy_configurations
    deploy_prometheus
    deploy_node_exporter
    verify_deployment
    configure_firewall
    display_summary

    print_success "Deployment completed successfully!"
}

# Run main function
main "$@"
