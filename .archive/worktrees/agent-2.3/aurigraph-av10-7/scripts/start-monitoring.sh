#!/bin/bash

echo "═══════════════════════════════════════════════════════"
echo "🚀 Starting Aurigraph Monitoring Stack"
echo "═══════════════════════════════════════════════════════"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create necessary directories if they don't exist
echo "📁 Creating monitoring directories..."
mkdir -p monitoring/grafana/provisioning/datasources
mkdir -p monitoring/grafana/provisioning/dashboards
mkdir -p monitoring/grafana/dashboards
mkdir -p logs

# Create AlertManager configuration if it doesn't exist
if [ ! -f "monitoring/alertmanager.yml" ]; then
    echo "📝 Creating AlertManager configuration..."
    cat > monitoring/alertmanager.yml << 'EOF'
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'cluster', 'service']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'aurigraph-admin'

receivers:
  - name: 'aurigraph-admin'
    webhook_configs:
      - url: 'http://localhost:5001/'
        send_resolved: true
EOF
fi

# Create Loki configuration if it doesn't exist
if [ ! -f "monitoring/loki-config.yml" ]; then
    echo "📝 Creating Loki configuration..."
    cat > monitoring/loki-config.yml << 'EOF'
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

ingester:
  wal:
    enabled: true
    dir: /tmp/wal
  lifecycler:
    address: 127.0.0.1
    ring:
      kvstore:
        store: inmemory
      replication_factor: 1
    final_sleep: 0s

schema_config:
  configs:
    - from: 2020-10-24
      store: boltdb-shipper
      object_store: filesystem
      schema: v11
      index:
        prefix: index_
        period: 24h

storage_config:
  boltdb_shipper:
    active_index_directory: /loki/boltdb-shipper-active
    cache_location: /loki/boltdb-shipper-cache
    cache_ttl: 24h
    shared_store: filesystem
  filesystem:
    directory: /loki/chunks

limits_config:
  enforce_metric_name: false
  reject_old_samples: true
  reject_old_samples_max_age: 168h

chunk_store_config:
  max_look_back_period: 0s

table_manager:
  retention_deletes_enabled: false
  retention_period: 0s
EOF
fi

# Create Promtail configuration if it doesn't exist
if [ ! -f "monitoring/promtail-config.yml" ]; then
    echo "📝 Creating Promtail configuration..."
    cat > monitoring/promtail-config.yml << 'EOF'
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: aurigraph
    static_configs:
      - targets:
          - localhost
        labels:
          job: aurigraph
          __path__: /app/logs/*.log
EOF
fi

# Start the monitoring stack
echo "🐳 Starting Docker Compose monitoring stack..."
docker-compose -f docker-compose.monitoring.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo ""
echo "📊 Checking service status..."
echo ""

# Check Prometheus
if curl -s http://localhost:9091/api/v1/query?query=up > /dev/null; then
    echo "✅ Prometheus is running at http://localhost:9091"
else
    echo "⚠️  Prometheus may still be starting..."
fi

# Check Grafana
if curl -s http://localhost:3000/api/health > /dev/null; then
    echo "✅ Grafana is running at http://localhost:3000"
    echo "   Username: admin"
    echo "   Password: aurigraph123"
else
    echo "⚠️  Grafana may still be starting..."
fi

# Check AlertManager
if curl -s http://localhost:9093/-/healthy > /dev/null; then
    echo "✅ AlertManager is running at http://localhost:9093"
else
    echo "⚠️  AlertManager may still be starting..."
fi

# Check Node Exporter
if curl -s http://localhost:9100/metrics > /dev/null; then
    echo "✅ Node Exporter is running at http://localhost:9100"
else
    echo "⚠️  Node Exporter may still be starting..."
fi

# Check Platform Metrics
if curl -s http://localhost:9090/metrics > /dev/null; then
    echo "✅ Platform metrics available at http://localhost:9090/metrics"
else
    echo "⚠️  Platform metrics exporter not running. Start the platform first."
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "📈 Monitoring Stack Started Successfully!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "🔗 Access Points:"
echo "   Grafana Dashboard: http://localhost:3000"
echo "   Prometheus: http://localhost:9091"
echo "   AlertManager: http://localhost:9093"
echo "   Platform Metrics: http://localhost:9090/metrics"
echo ""
echo "📊 Default Dashboards:"
echo "   1. Login to Grafana"
echo "   2. Navigate to Dashboards → Browse"
echo "   3. Open 'Aurigraph Platform Overview'"
echo ""
echo "🛑 To stop monitoring: docker-compose -f docker-compose.monitoring.yml down"
echo "═══════════════════════════════════════════════════════"