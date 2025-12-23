#!/bin/bash
#
# Aurigraph V11 - Monitoring Stack Deployment Script
# Deploys Prometheus, Grafana, Alertmanager, and exporters
#
# Usage: ./deploy-monitoring.sh [remote-host] [remote-user] [deploy-path]
# Example: ./deploy-monitoring.sh dlt.aurigraph.io subbu /home/subbu/monitoring

set -e

# Configuration
REMOTE_HOST="${1:-dlt.aurigraph.io}"
REMOTE_USER="${2:-subbu}"
DEPLOY_PATH="${3:-/home/subbu/monitoring}"
LOCAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[✓]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[✗]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
  log_info "Checking prerequisites..."

  if ! command -v ssh &> /dev/null; then
    log_error "SSH not found. Please install SSH client."
    exit 1
  fi

  if ! command -v scp &> /dev/null; then
    log_error "SCP not found. Please install SCP client."
    exit 1
  fi

  if [ ! -f "$LOCAL_DIR/docker-compose-monitoring.yml" ]; then
    log_error "docker-compose-monitoring.yml not found in $LOCAL_DIR"
    exit 1
  fi

  if [ ! -f "$LOCAL_DIR/prometheus.yml" ]; then
    log_error "prometheus.yml not found in $LOCAL_DIR"
    exit 1
  fi

  if [ ! -f "$LOCAL_DIR/alertmanager.yml" ]; then
    log_error "alertmanager.yml not found in $LOCAL_DIR"
    exit 1
  fi

  log_success "All prerequisites met"
}

# Test SSH connectivity
test_ssh_connectivity() {
  log_info "Testing SSH connectivity to $REMOTE_USER@$REMOTE_HOST..."

  if ssh -o ConnectTimeout=5 "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH connection successful'" &> /dev/null; then
    log_success "SSH connectivity confirmed"
  else
    log_error "Cannot connect to $REMOTE_USER@$REMOTE_HOST"
    exit 1
  fi
}

# Create remote directories
create_remote_directories() {
  log_info "Creating remote directories..."

  ssh "$REMOTE_USER@$REMOTE_HOST" << 'REMOTE_COMMANDS'
    # Create directory structure
    mkdir -p ~/monitoring/{grafana/provisioning/{datasources,dashboards},prometheus,loki}

    # Set proper permissions
    chmod 755 ~/monitoring
    chmod 755 ~/monitoring/grafana
    chmod 755 ~/monitoring/prometheus
    chmod 755 ~/monitoring/loki

    echo "Remote directories created successfully"
REMOTE_COMMANDS

  log_success "Remote directories created"
}

# Transfer configuration files
transfer_files() {
  log_info "Transferring configuration files..."

  # Transfer docker-compose file
  scp "$LOCAL_DIR/docker-compose-monitoring.yml" "$REMOTE_USER@$REMOTE_HOST:~/monitoring/" 2>/dev/null
  log_success "Transferred docker-compose-monitoring.yml"

  # Transfer Prometheus config
  scp "$LOCAL_DIR/prometheus.yml" "$REMOTE_USER@$REMOTE_HOST:~/monitoring/" 2>/dev/null
  log_success "Transferred prometheus.yml"

  # Transfer Alert Rules
  scp "$LOCAL_DIR/alert-rules.yml" "$REMOTE_USER@$REMOTE_HOST:~/monitoring/" 2>/dev/null
  log_success "Transferred alert-rules.yml"

  # Transfer Alertmanager config
  scp "$LOCAL_DIR/alertmanager.yml" "$REMOTE_USER@$REMOTE_HOST:~/monitoring/" 2>/dev/null
  log_success "Transferred alertmanager.yml"

  # Transfer Promtail config
  if [ -f "$LOCAL_DIR/promtail-config.yaml" ]; then
    scp "$LOCAL_DIR/promtail-config.yaml" "$REMOTE_USER@$REMOTE_HOST:~/monitoring/" 2>/dev/null
    log_success "Transferred promtail-config.yaml"
  fi

  # Transfer Grafana datasources
  if [ -d "$LOCAL_DIR/grafana/provisioning" ]; then
    scp -r "$LOCAL_DIR/grafana/provisioning/"* "$REMOTE_USER@$REMOTE_HOST:~/monitoring/grafana/provisioning/" 2>/dev/null || true
    log_success "Transferred Grafana provisioning files"
  fi
}

# Deploy monitoring stack
deploy_monitoring() {
  log_info "Deploying monitoring stack (this may take 1-2 minutes)..."

  ssh "$REMOTE_USER@$REMOTE_HOST" << 'REMOTE_DEPLOY'
    cd ~/monitoring

    # Check Docker availability
    if ! command -v docker &> /dev/null; then
      echo "Error: Docker not found. Please install Docker."
      exit 1
    fi

    # Pull latest images
    echo "Pulling latest Docker images..."
    docker-compose -f docker-compose-monitoring.yml pull --quiet

    # Start services
    echo "Starting monitoring stack..."
    docker-compose -f docker-compose-monitoring.yml up -d

    # Wait for services to be ready
    echo "Waiting for services to be ready..."
    sleep 15

    # Check service health
    echo "Checking service health..."
    for service in prometheus grafana alertmanager; do
      if docker-compose -f docker-compose-monitoring.yml ps | grep "$service" | grep -q "Up"; then
        echo "✓ $service is running"
      else
        echo "✗ $service failed to start"
      fi
    done
REMOTE_DEPLOY

  log_success "Monitoring stack deployed"
}

# Verify deployment
verify_deployment() {
  log_info "Verifying monitoring stack..."

  ssh "$REMOTE_USER@$REMOTE_HOST" << 'REMOTE_VERIFY'
    echo "=== Monitoring Stack Status ==="

    cd ~/monitoring
    docker-compose -f docker-compose-monitoring.yml ps

    echo ""
    echo "=== Service Endpoints ==="
    echo "Prometheus: http://localhost:9090"
    echo "Grafana: http://localhost:3000"
    echo "Alertmanager: http://localhost:9093"

    echo ""
    echo "=== Health Checks ==="

    # Check Prometheus
    if curl -s http://localhost:9090/-/healthy &> /dev/null; then
      echo "✓ Prometheus health check passed"
    else
      echo "✗ Prometheus health check failed"
    fi

    # Check Grafana
    if curl -s http://localhost:3000/api/health &> /dev/null; then
      echo "✓ Grafana health check passed"
    else
      echo "✗ Grafana health check failed"
    fi

    # Check Alertmanager
    if curl -s http://localhost:9093/-/healthy &> /dev/null; then
      echo "✓ Alertmanager health check passed"
    else
      echo "✗ Alertmanager health check failed"
    fi
REMOTE_VERIFY

  log_success "Verification complete"
}

# Generate access information
generate_access_info() {
  log_info "Generating access information..."

  cat > "$LOCAL_DIR/MONITORING_ACCESS_INFO.txt" << 'EOF'
=== Aurigraph V11 Monitoring Stack - Access Information ===

Deployment Date: $(date)
Remote Host: REMOTE_HOST
Remote User: REMOTE_USER
Deploy Path: ~/monitoring

=== Service Endpoints ===

Prometheus (Metrics Database & UI):
  URL: http://REMOTE_HOST:9090
  Purpose: Collect and visualize metrics from all services
  Key Metrics:
    - v11_api_http_request_duration_ms
    - v11_transactions_total
    - v11_blockchain_height
    - postgresql_connections_total
    - node_cpu_seconds_total

Grafana (Visualization & Dashboards):
  URL: http://REMOTE_HOST:3000
  Default Credentials:
    Username: admin
    Password: admin (change after first login)
  Purpose: Create and manage monitoring dashboards

Alertmanager (Alert Management):
  URL: http://REMOTE_HOST:9093
  Purpose: Route and manage alerts from Prometheus
  Notification Channels:
    - Slack (#alerts-critical, #v11-alerts, etc.)
    - Email (alerts@dlt.aurigraph.io)
    - PagerDuty (on-call rotations)

=== Monitoring Exporters ===

1. Prometheus (Port 9090)
   - Collects metrics from V11 API endpoints
   - Metrics path: /api/v11/metrics
   - Scrape interval: 10s

2. Node Exporter (Port 9100)
   - System and host metrics (CPU, memory, disk, network)
   - Scrape interval: 15s

3. PostgreSQL Exporter (Port 9187)
   - Database metrics and performance stats
   - Connection count, query latency, index usage
   - Scrape interval: 30s

4. Redis Exporter (Port 9121)
   - Cache metrics and operations
   - Memory usage, eviction, replication status
   - Scrape interval: 30s

5. NGINX Exporter (Port 9113)
   - Reverse proxy metrics
   - Request rates, response times, error rates
   - Scrape interval: 15s

6. cAdvisor (Port 8080)
   - Container metrics
   - Memory, CPU, network usage per container
   - Scrape interval: 15s

7. Loki (Port 3100)
   - Log aggregation and analysis
   - Full-text search of application and system logs
   - Log retention: 30 days

8. Promtail
   - Log shipping agent
   - Collects from V11 app logs, syslog, PostgreSQL, Docker
   - Forwards to Loki for storage and analysis

=== Alert Rules Configured ===

Critical Alerts (P0):
  - V11 Service Down (immediate notification)
  - Database Connection Failure
  - High Error Rate (>10%)
  - Blockchain Height Not Increasing

Warning Alerts (P1):
  - High Response Latency (p95 > 500ms)
  - Database Query Latency > 100ms
  - Memory Pressure (>85% utilization)
  - Disk Space Low (<20% free)

Informational Alerts (P2):
  - High CPU Usage (>75%)
  - Network I/O Saturation (>80%)
  - Cache Hit Ratio Low (<60%)

=== Initial Setup Steps ===

1. Access Grafana: http://REMOTE_HOST:3000
2. Login with credentials above
3. Change admin password (Settings → Change Password)
4. Add Prometheus as data source (if not auto-discovered)
5. Create custom dashboards for your metrics
6. Configure notification channels (Slack, Email, PagerDuty)
7. Test alerts by triggering sample alerts

=== Common Tasks ===

View real-time metrics:
  $ ssh REMOTE_USER@REMOTE_HOST
  $ cd ~/monitoring
  $ docker-compose -f docker-compose-monitoring.yml logs -f prometheus

Check service health:
  $ docker-compose -f docker-compose-monitoring.yml ps

Restart a service:
  $ docker-compose -f docker-compose-monitoring.yml restart prometheus

Stop monitoring stack:
  $ docker-compose -f docker-compose-monitoring.yml down

View Alertmanager alerts:
  $ curl http://REMOTE_HOST:9093/api/v1/alerts

Query metrics via Prometheus API:
  $ curl 'http://REMOTE_HOST:9090/api/v1/query?query=up'

=== Troubleshooting ===

If services don't start:
  1. Check Docker daemon: docker ps
  2. Check logs: docker-compose logs [service-name]
  3. Verify ports are not in use: lsof -i :9090
  4. Check disk space: df -h
  5. Restart stack: docker-compose down && docker-compose up -d

If metrics are missing:
  1. Verify V11 service is running: curl http://localhost:9003/api/v11/health
  2. Check Prometheus targets: http://REMOTE_HOST:9090/targets
  3. Verify scrape configs in prometheus.yml
  4. Check exporter connectivity: curl http://localhost:9100/metrics

If alerts are not firing:
  1. Verify alert rules in Prometheus: http://REMOTE_HOST:9090/alerts
  2. Check Alertmanager config: /home/REMOTE_USER/monitoring/alertmanager.yml
  3. Verify notification channels (test Slack webhook)
  4. Check Alertmanager logs: docker-compose logs alertmanager

=== Important Notes ===

- Monitoring stack requires Docker and ~500MB disk space
- Default retention is 30 days for metrics
- Database credentials needed for PostgreSQL exporter
- Slack/Email/PagerDuty config required for notifications
- Change all default credentials before production use
- Backup Grafana dashboards regularly

=== References ===

- Prometheus Docs: https://prometheus.io/docs/
- Grafana Docs: https://grafana.com/docs/grafana/latest/
- Alertmanager Docs: https://prometheus.io/docs/alerting/latest/alertmanager/
- Loki Docs: https://grafana.com/docs/loki/latest/

EOF

  sed -i "s|REMOTE_HOST|$REMOTE_HOST|g" "$LOCAL_DIR/MONITORING_ACCESS_INFO.txt"
  sed -i "s|REMOTE_USER|$REMOTE_USER|g" "$LOCAL_DIR/MONITORING_ACCESS_INFO.txt"

  log_success "Access information generated: MONITORING_ACCESS_INFO.txt"
}

# Main execution
main() {
  echo ""
  echo "=========================================="
  echo "Aurigraph V11 Monitoring Stack Deployment"
  echo "=========================================="
  echo ""

  log_info "Starting deployment process..."
  log_info "Remote Host: $REMOTE_HOST"
  log_info "Remote User: $REMOTE_USER"
  log_info "Deploy Path: $DEPLOY_PATH"
  echo ""

  check_prerequisites
  test_ssh_connectivity
  create_remote_directories
  transfer_files
  deploy_monitoring
  verify_deployment
  generate_access_info

  echo ""
  echo "=========================================="
  log_success "Monitoring stack deployed successfully!"
  echo "=========================================="
  echo ""
  echo -e "Next steps:"
  echo -e "  1. Access Grafana: ${BLUE}http://$REMOTE_HOST:3000${NC}"
  echo -e "  2. Login with admin / admin"
  echo -e "  3. Change admin password"
  echo -e "  4. Configure notification channels"
  echo -e "  5. Create custom dashboards"
  echo ""
  echo -e "View detailed access info in: ${YELLOW}MONITORING_ACCESS_INFO.txt${NC}"
  echo ""
}

# Run main function
main "$@"
