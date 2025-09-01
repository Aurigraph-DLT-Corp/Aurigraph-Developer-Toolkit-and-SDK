#!/bin/bash

# AV10-17 External Storage Setup Script
# Configures bare-metal server storage for Aurigraph nodes

set -euo pipefail

# Configuration
AURIGRAPH_BASE_PATH="/opt/aurigraph"
AURIGRAPH_USER="aurigraph"
AURIGRAPH_GROUP="aurigraph"
STORAGE_SIZE_CHECK_GB=10

echo "🔧 AV10-17 External Storage Setup"
echo "=================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root for system configuration"
   exit 1
fi

# Create aurigraph user and group
echo "👤 Creating aurigraph user and group..."
if ! getent group $AURIGRAPH_GROUP >/dev/null 2>&1; then
    groupadd -r $AURIGRAPH_GROUP
    echo "✅ Group '$AURIGRAPH_GROUP' created"
else
    echo "ℹ️ Group '$AURIGRAPH_GROUP' already exists"
fi

if ! getent passwd $AURIGRAPH_USER >/dev/null 2>&1; then
    useradd -r -g $AURIGRAPH_GROUP -d $AURIGRAPH_BASE_PATH -s /bin/bash $AURIGRAPH_USER
    echo "✅ User '$AURIGRAPH_USER' created"
else
    echo "ℹ️ User '$AURIGRAPH_USER' already exists"
fi

# Create directory structure
echo "📁 Creating external storage directory structure..."
directories=(
    "$AURIGRAPH_BASE_PATH"
    "$AURIGRAPH_BASE_PATH/data"
    "$AURIGRAPH_BASE_PATH/data/postgresql"
    "$AURIGRAPH_BASE_PATH/data/redis" 
    "$AURIGRAPH_BASE_PATH/logs"
    "$AURIGRAPH_BASE_PATH/logs/postgresql"
    "$AURIGRAPH_BASE_PATH/logs/redis"
    "$AURIGRAPH_BASE_PATH/logs/nodes"
    "$AURIGRAPH_BASE_PATH/logs/monitor"
    "$AURIGRAPH_BASE_PATH/config"
    "$AURIGRAPH_BASE_PATH/users"
    "$AURIGRAPH_BASE_PATH/checkpoints"
    "$AURIGRAPH_BASE_PATH/transactions"
    "$AURIGRAPH_BASE_PATH/backup"
    "$AURIGRAPH_BASE_PATH/backup/data"
    "$AURIGRAPH_BASE_PATH/backup/logs"
)

for dir in "${directories[@]}"; do
    mkdir -p "$dir"
    chown $AURIGRAPH_USER:$AURIGRAPH_GROUP "$dir"
    chmod 755 "$dir"
    echo "✅ Created: $dir"
done

# Set proper permissions for sensitive directories
chmod 700 "$AURIGRAPH_BASE_PATH/users"
chmod 700 "$AURIGRAPH_BASE_PATH/checkpoints"
chmod 750 "$AURIGRAPH_BASE_PATH/data"

echo "🔒 Security permissions applied"

# Check available disk space
echo "💾 Checking available disk space..."
available_space=$(df --output=avail -BG "$AURIGRAPH_BASE_PATH" | tail -n1 | tr -d 'G ')
if [ "$available_space" -lt "$STORAGE_SIZE_CHECK_GB" ]; then
    echo "⚠️ Warning: Available space is ${available_space}GB, recommend at least ${STORAGE_SIZE_CHECK_GB}GB"
else
    echo "✅ Sufficient disk space available: ${available_space}GB"
fi

# Create configuration files
echo "⚙️ Creating AV10-17 configuration files..."

# Node configuration
cat > "$AURIGRAPH_BASE_PATH/config/node.yml" << EOF
# AV10-17 Node Configuration
aurigraph:
  node:
    compliance: AV10-17
    external-storage:
      enabled: true
      base-path: $AURIGRAPH_BASE_PATH/data
      backup-path: $AURIGRAPH_BASE_PATH/backup
      retention-days: 90
    
  database:
    url: jdbc:postgresql://localhost:5432/aurigraph
    username: aurigraph
    password: aurigraph123
    
  performance:
    target-tps: 50000
    max-memory-mb: 512
    startup-timeout-seconds: 5
    uptime-target-percent: 99.99
EOF

# Database initialization script
cat > "$AURIGRAPH_BASE_PATH/config/init-database.sql" << EOF
-- AV10-17 Database Initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User management
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- User sessions (as defined in ExternalDataManager)
CREATE TABLE IF NOT EXISTS user_sessions (
    session_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    node_id VARCHAR(64) NOT NULL,
    login_time TIMESTAMP NOT NULL,
    last_activity TIMESTAMP NOT NULL,
    session_data JSONB,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Transaction logs
CREATE TABLE IF NOT EXISTS transaction_logs (
    log_id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    transaction_id VARCHAR(128) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    transaction_data JSONB NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    checkpoint_data JSONB,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Node checkpoints
CREATE TABLE IF NOT EXISTS node_checkpoints (
    checkpoint_id VARCHAR(128) PRIMARY KEY,
    node_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    checkpoint_type VARCHAR(50) NOT NULL,
    checkpoint_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_status ON user_sessions(status);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_user_id ON transaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_status ON transaction_logs(status);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_type ON transaction_logs(transaction_type);
CREATE INDEX IF NOT EXISTS idx_node_checkpoints_node_user ON node_checkpoints(node_id, user_id);
CREATE INDEX IF NOT EXISTS idx_node_checkpoints_type ON node_checkpoints(checkpoint_type);

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO aurigraph;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO aurigraph;
EOF

# Systemd service for automatic database backup
cat > "/etc/systemd/system/aurigraph-backup.service" << EOF
[Unit]
Description=Aurigraph AV10-17 Data Backup Service
After=network.target

[Service]
Type=oneshot
User=root
ExecStart=/bin/bash -c 'pg_dump -h localhost -U aurigraph aurigraph | gzip > $AURIGRAPH_BASE_PATH/backup/aurigraph-db-\$(date +%%Y%%m%%d-%%H%%M%%S).sql.gz'
ExecStartPost=/bin/bash -c 'find $AURIGRAPH_BASE_PATH/backup -name "aurigraph-db-*.sql.gz" -mtime +7 -delete'

[Install]
WantedBy=multi-user.target
EOF

# Systemd timer for daily backups
cat > "/etc/systemd/system/aurigraph-backup.timer" << EOF
[Unit]
Description=Daily Aurigraph Backup
Requires=aurigraph-backup.service

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Enable backup service
systemctl daemon-reload
systemctl enable aurigraph-backup.timer
systemctl start aurigraph-backup.timer

echo "⏰ Daily backup service configured and started"

# Create monitoring script
cat > "$AURIGRAPH_BASE_PATH/scripts/monitor-storage.sh" << 'EOF'
#!/bin/bash

# AV10-17 Storage Monitoring Script

AURIGRAPH_BASE="/opt/aurigraph"
LOG_FILE="$AURIGRAPH_BASE/logs/monitor/storage-monitor.log"

# Create log entry
log_entry() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_entry "=== AV10-17 Storage Health Check ==="

# Check disk usage
disk_usage=$(df --output=pcent "$AURIGRAPH_BASE" | tail -n1 | tr -d '% ')
log_entry "Disk usage: ${disk_usage}%"

if [ "$disk_usage" -gt 80 ]; then
    log_entry "⚠️ WARNING: Disk usage above 80%"
fi

if [ "$disk_usage" -gt 90 ]; then
    log_entry "🚨 CRITICAL: Disk usage above 90%"
fi

# Check directory sizes
log_entry "Directory sizes:"
du -sh "$AURIGRAPH_BASE"/* 2>/dev/null | while read size dir; do
    log_entry "  $dir: $size"
done

# Check database connectivity
if pg_isready -h localhost -U aurigraph >/dev/null 2>&1; then
    log_entry "✅ Database: Connected"
else
    log_entry "❌ Database: Connection failed"
fi

# Check Redis connectivity
if redis-cli ping >/dev/null 2>&1; then
    log_entry "✅ Redis: Connected"
else
    log_entry "❌ Redis: Connection failed"
fi

# Count active sessions and transactions
if psql -h localhost -U aurigraph -d aurigraph -t -c "SELECT COUNT(*) FROM user_sessions WHERE status='ACTIVE';" >/dev/null 2>&1; then
    active_sessions=$(psql -h localhost -U aurigraph -d aurigraph -t -c "SELECT COUNT(*) FROM user_sessions WHERE status='ACTIVE';" | tr -d ' ')
    pending_txns=$(psql -h localhost -U aurigraph -d aurigraph -t -c "SELECT COUNT(*) FROM transaction_logs WHERE status IN ('PENDING', 'IN_PROGRESS');" | tr -d ' ')
    log_entry "Active sessions: $active_sessions"
    log_entry "Pending transactions: $pending_txns"
fi

log_entry "=== Storage Health Check Complete ==="
EOF

chmod +x "$AURIGRAPH_BASE/scripts/monitor-storage.sh"
mkdir -p "$AURIGRAPH_BASE/scripts"
chown $AURIGRAPH_USER:$AURIGRAPH_GROUP "$AURIGRAPH_BASE/scripts/monitor-storage.sh"

# Create cron job for storage monitoring
echo "0 */6 * * * $AURIGRAPH_USER $AURIGRAPH_BASE/scripts/monitor-storage.sh" > /etc/cron.d/aurigraph-storage-monitor
chmod 644 /etc/cron.d/aurigraph-storage-monitor

echo "📊 Storage monitoring configured"

# Create graceful shutdown script
cat > "$AURIGRAPH_BASE/scripts/graceful-shutdown.sh" << 'EOF'
#!/bin/bash

# AV10-17 Graceful Shutdown Script

echo "🔄 Initiating AV10-17 graceful shutdown..."

# Signal all Aurigraph containers to shutdown gracefully
echo "📤 Sending graceful shutdown signal to containers..."
docker-compose -f docker-compose.external-storage.yml exec aurigraph-basicnode-external \
    curl -X POST http://localhost:8080/api/admin/shutdown

# Wait for graceful shutdown completion
echo "⏳ Waiting for graceful shutdown completion..."
sleep 10

# Stop containers in proper order
echo "🛑 Stopping containers..."
docker-compose -f docker-compose.external-storage.yml stop aurigraph-basicnode-external
docker-compose -f docker-compose.external-storage.yml stop aurigraph-redis
docker-compose -f docker-compose.external-storage.yml stop aurigraph-database

# Verify all data is synced
echo "💾 Syncing external storage..."
sync

echo "✅ AV10-17 graceful shutdown completed"
EOF

chmod +x "$AURIGRAPH_BASE/scripts/graceful-shutdown.sh"
chown $AURIGRAPH_USER:$AURIGRAPH_GROUP "$AURIGRAPH_BASE/scripts/graceful-shutdown.sh"

# Create startup script with transaction recovery
cat > "$AURIGRAPH_BASE/scripts/startup-with-recovery.sh" << 'EOF'
#!/bin/bash

# AV10-17 Startup with Transaction Recovery

echo "🚀 Starting AV10-17 node with transaction recovery..."

# Start external storage services
echo "💾 Starting external storage services..."
cd "$(dirname "$0")/.."
docker-compose -f docker-compose.external-storage.yml up -d aurigraph-database aurigraph-redis

# Wait for services to be ready
echo "⏳ Waiting for database and cache services..."
sleep 15

# Verify database connectivity
echo "🔍 Verifying database connectivity..."
while ! pg_isready -h localhost -U aurigraph >/dev/null 2>&1; do
    echo "⏳ Waiting for database..."
    sleep 2
done
echo "✅ Database ready"

# Verify Redis connectivity  
echo "🔍 Verifying Redis connectivity..."
while ! redis-cli ping >/dev/null 2>&1; do
    echo "⏳ Waiting for Redis..."
    sleep 2
done
echo "✅ Redis ready"

# Start the main node with recovery
echo "🏗️ Starting AV10-17 compliant basic node..."
docker-compose -f docker-compose.external-storage.yml up -d aurigraph-basicnode-external

# Wait for node startup
echo "⏳ Waiting for node startup..."
sleep 10

# Verify node health
echo "🏥 Checking node health..."
while ! curl -f http://localhost:8080/health/ready >/dev/null 2>&1; do
    echo "⏳ Waiting for node health..."
    sleep 3
done

echo "✅ AV10-17 node startup with recovery completed successfully"
echo "🌐 Node available at: http://localhost:8080"
echo "📊 Metrics available at: http://localhost:8080/metrics"
echo "🏥 Health status: http://localhost:8080/health"
EOF

chmod +x "$AURIGRAPH_BASE/scripts/startup-with-recovery.sh"
chown $AURIGRAPH_USER:$AURIGRAPH_GROUP "$AURIGRAPH_BASE/scripts/startup-with-recovery.sh"

# Install PostgreSQL client tools if not present
echo "🔧 Installing PostgreSQL client tools..."
if command -v apt-get >/dev/null 2>&1; then
    apt-get update && apt-get install -y postgresql-client redis-tools curl
elif command -v yum >/dev/null 2>&1; then
    yum install -y postgresql redis curl
elif command -v apk >/dev/null 2>&1; then
    apk add --no-cache postgresql-client redis curl
else
    echo "⚠️ Please manually install postgresql-client, redis-tools, and curl"
fi

# Test directory permissions
echo "🧪 Testing directory permissions..."
su - $AURIGRAPH_USER -c "touch $AURIGRAPH_BASE_PATH/data/test-file && rm $AURIGRAPH_BASE_PATH/data/test-file"
echo "✅ Directory permissions verified"

# Create log rotation configuration
cat > "/etc/logrotate.d/aurigraph" << EOF
$AURIGRAPH_BASE_PATH/logs/**/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 $AURIGRAPH_USER $AURIGRAPH_GROUP
    postrotate
        # Signal applications to reopen log files if needed
        systemctl reload aurigraph-backup 2>/dev/null || true
    endscript
}
EOF

echo "📋 Log rotation configured"

# Final summary
echo ""
echo "✅ AV10-17 External Storage Setup Complete!"
echo "==========================================="
echo "📁 Base path: $AURIGRAPH_BASE_PATH"
echo "👤 User/Group: $AURIGRAPH_USER:$AURIGRAPH_GROUP"
echo "💾 Available space: ${available_space}GB"
echo "⏰ Backup schedule: Daily at midnight"
echo "📊 Monitoring: Every 6 hours"
echo ""
echo "🚀 To start the node with recovery:"
echo "   sudo $AURIGRAPH_BASE_PATH/scripts/startup-with-recovery.sh"
echo ""
echo "🔄 To shutdown gracefully:"
echo "   sudo $AURIGRAPH_BASE_PATH/scripts/graceful-shutdown.sh"
echo ""
echo "📊 To monitor storage:"
echo "   sudo $AURIGRAPH_BASE_PATH/scripts/monitor-storage.sh"
echo ""