#!/bin/bash

# Aurigraph V11 Monitoring Setup Script
# Configures Prometheus + Grafana for production monitoring

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
REMOTE_HOST="151.242.51.55"
REMOTE_USER="subbu"
REMOTE_PASSWORD="subbuFuture@2025"

echo -e "${BLUE}================================================================${NC}"
echo -e "${BLUE}Aurigraph V11 Monitoring Setup${NC}"
echo -e "${BLUE}Server: ${REMOTE_HOST}${NC}"
echo -e "${BLUE}Stack: Prometheus + Grafana${NC}"
echo -e "${BLUE}================================================================${NC}"
echo ""

# SSH command
SSH_CMD="sshpass -p '${REMOTE_PASSWORD}' ssh -p 22 -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST}"

echo -e "${YELLOW}[1/5] Installing Docker Compose...${NC}"

${SSH_CMD} << 'INSTALL_DOCKER_COMPOSE'
    set -e

    # Check if docker-compose exists
    if command -v docker-compose &> /dev/null; then
        echo "Docker Compose already installed: $(docker-compose --version)"
    else
        echo "Installing Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        echo "✓ Docker Compose installed"
    fi
INSTALL_DOCKER_COMPOSE

echo -e "${GREEN}✓ Docker Compose ready${NC}"
echo ""

echo -e "${YELLOW}[2/5] Creating monitoring stack configuration...${NC}"

${SSH_CMD} << 'CREATE_MONITORING'
    set -e

    # Create monitoring directory
    sudo mkdir -p /opt/monitoring/{prometheus,grafana}
    sudo chown -R subbu:subbu /opt/monitoring

    cd /opt/monitoring

    # Create Prometheus configuration
    cat > prometheus/prometheus.yml << 'PROM_CONFIG'
# Prometheus Configuration for Aurigraph V11
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'aurigraph-v11'
    environment: 'production'

# Alerting configuration
alerting:
  alertmanagers:
    - static_configs:
        - targets: []

# Scrape configurations
scrape_configs:
  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Aurigraph V11 Application
  - job_name: 'aurigraph-v11'
    metrics_path: '/q/metrics'
    static_configs:
      - targets: ['host.docker.internal:9003']
    labels:
      service: 'aurigraph-v11'
      component: 'blockchain'

  # Node Exporter (System Metrics)
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
    labels:
      service: 'system'

  # Nginx Metrics
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
    labels:
      service: 'nginx'
PROM_CONFIG

    # Create alert rules
    cat > prometheus/alerts.yml << 'ALERT_RULES'
groups:
  - name: aurigraph_alerts
    interval: 30s
    rules:
      # Service Down Alert
      - alert: AurigraphServiceDown
        expr: up{job="aurigraph-v11"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Aurigraph V11 service is down"
          description: "Aurigraph V11 has been down for more than 1 minute"

      # High Memory Usage
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          description: "Memory usage is above 90% for 5 minutes"

      # High CPU Usage
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          description: "CPU usage is above 80% for 5 minutes"

      # Disk Space Warning
      - alert: DiskSpaceWarning
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) < 0.2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space"
          description: "Disk space is below 20%"
ALERT_RULES

    # Create docker-compose configuration
    cat > docker-compose.yml << 'COMPOSE_CONFIG'
version: '3.8'

services:
  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./prometheus/alerts.yml:/etc/prometheus/alerts.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - monitoring

  # Node Exporter (System Metrics)
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    restart: unless-stopped
    ports:
      - "9100:9100"
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--path.rootfs=/rootfs'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    networks:
      - monitoring

  # Grafana
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=AurigraphAdmin@2025
      - GF_SERVER_ROOT_URL=https://dlt.aurigraph.io:3000
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./grafana/datasources:/etc/grafana/provisioning/datasources:ro
    depends_on:
      - prometheus
    networks:
      - monitoring

volumes:
  prometheus_data:
  grafana_data:

networks:
  monitoring:
    driver: bridge
COMPOSE_CONFIG

    # Create Grafana datasource configuration
    mkdir -p grafana/datasources
    cat > grafana/datasources/prometheus.yml << 'GRAFANA_DS'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
GRAFANA_DS

    # Create Grafana dashboard provisioning
    mkdir -p grafana/dashboards
    cat > grafana/dashboards/dashboard.yml << 'GRAFANA_DASH'
apiVersion: 1

providers:
  - name: 'Aurigraph Dashboards'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
GRAFANA_DASH

    echo "✓ Monitoring configuration created"
CREATE_MONITORING

echo -e "${GREEN}✓ Configuration created${NC}"
echo ""

echo -e "${YELLOW}[3/5] Starting monitoring stack...${NC}"

${SSH_CMD} << 'START_MONITORING'
    set -e

    cd /opt/monitoring

    # Pull images
    echo "Pulling Docker images..."
    sudo docker-compose pull

    # Start services
    echo "Starting monitoring stack..."
    sudo docker-compose up -d

    # Wait for services
    echo "Waiting for services to start..."
    sleep 10

    # Check status
    sudo docker-compose ps

    echo "✓ Monitoring stack started"
START_MONITORING

echo -e "${GREEN}✓ Monitoring stack running${NC}"
echo ""

echo -e "${YELLOW}[4/5] Configuring firewall for monitoring...${NC}"

${SSH_CMD} << 'CONFIGURE_FW'
    set -e

    # Allow Prometheus
    sudo ufw allow 9090/tcp comment 'Prometheus'

    # Allow Node Exporter
    sudo ufw allow 9100/tcp comment 'Node Exporter'

    # Allow Grafana
    sudo ufw allow 3000/tcp comment 'Grafana'

    sudo ufw status

    echo "✓ Firewall configured"
CONFIGURE_FW

echo -e "${GREEN}✓ Firewall configured${NC}"
echo ""

echo -e "${YELLOW}[5/5] Validating monitoring setup...${NC}"

${SSH_CMD} << 'VALIDATE'
    set -e

    cd /opt/monitoring

    echo "=== Docker Containers ==="
    sudo docker-compose ps

    echo ""
    echo "=== Prometheus Health ==="
    curl -s http://localhost:9090/-/healthy || echo "Prometheus not ready yet"

    echo ""
    echo "=== Grafana Health ==="
    curl -s http://localhost:3000/api/health || echo "Grafana not ready yet"

    echo ""
    echo "=== Node Exporter Metrics ==="
    curl -s http://localhost:9100/metrics | head -5

    echo ""
    echo "✓ Validation complete"
VALIDATE

echo -e "${GREEN}✓ Validation complete${NC}"
echo ""

echo -e "${BLUE}================================================================${NC}"
echo -e "${GREEN}✓✓✓ MONITORING SETUP COMPLETE ✓✓✓${NC}"
echo -e "${BLUE}================================================================${NC}"
echo ""

echo -e "${GREEN}Access URLs:${NC}"
echo -e "  • Prometheus: http://${REMOTE_HOST}:9090"
echo -e "  • Grafana: http://${REMOTE_HOST}:3000"
echo -e "  • Node Exporter: http://${REMOTE_HOST}:9100/metrics"
echo ""

echo -e "${GREEN}Grafana Credentials:${NC}"
echo -e "  • Username: admin"
echo -e "  • Password: AurigraphAdmin@2025"
echo ""

echo -e "${GREEN}Management Commands:${NC}"
echo -e "  • View logs: ssh -p 22 ${REMOTE_USER}@${REMOTE_HOST} 'cd /opt/monitoring && sudo docker-compose logs -f'"
echo -e "  • Restart: ssh -p 22 ${REMOTE_USER}@${REMOTE_HOST} 'cd /opt/monitoring && sudo docker-compose restart'"
echo -e "  • Stop: ssh -p 22 ${REMOTE_USER}@${REMOTE_HOST} 'cd /opt/monitoring && sudo docker-compose down'"
echo -e "  • Start: ssh -p 22 ${REMOTE_USER}@${REMOTE_HOST} 'cd /opt/monitoring && sudo docker-compose up -d'"
echo ""

echo -e "${GREEN}Monitored Metrics:${NC}"
echo -e "  • Aurigraph V11 application metrics"
echo -e "  • System resources (CPU, Memory, Disk)"
echo -e "  • Network traffic"
echo -e "  • Nginx performance"
echo ""

echo -e "${BLUE}================================================================${NC}"
echo -e "${GREEN}🚀 Monitoring is now running!${NC}"
echo -e "${BLUE}================================================================${NC}"
