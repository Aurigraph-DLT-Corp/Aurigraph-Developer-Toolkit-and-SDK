# Backup & Disaster Recovery - Enterprise Portal V4.3.2

## Overview

Comprehensive backup and disaster recovery strategy for Aurigraph Enterprise Portal and V11 backend.

**Production Server**: dlt.aurigraph.io
**Created**: October 19, 2025
**Status**: Configuration Ready

---

## Backup Strategy

### What to Backup
1. **Enterprise Portal** (`/opt/aurigraph-v11/enterprise-portal`)
2. **Backend Application** (`/opt/aurigraph-v11/`)
3. **NGINX Configuration** (`/etc/nginx/`)
4. **SSL Certificates** (`/etc/letsencrypt/`)
5. **Logs** (`/var/log/nginx/`, `/opt/aurigraph-v11/logs/`)
6. **Database** (if applicable)
7. **Grafana Dashboards** (`/var/lib/grafana/`)
8. **Prometheus Data** (`/var/lib/prometheus/`)

### Backup Frequency
- **Critical (Portal, Backend)**: Daily
- **Configuration (NGINX, SSL)**: Weekly
- **Logs**: Monthly
- **Monitoring Data**: Weekly

### Retention Policy
- **Daily Backups**: 7 days
- **Weekly Backups**: 4 weeks
- **Monthly Backups**: 12 months
- **Yearly Backups**: 3 years

---

## 1. Automated Backup Script

### Create Backup Script

Create `/opt/backup/aurigraph-backup.sh`:

```bash
#!/bin/bash
#
# Aurigraph DLT - Automated Backup Script
# Created: October 19, 2025
# Purpose: Backup critical system components
#

set -e

# Configuration
BACKUP_DIR="/backups/aurigraph"
REMOTE_BACKUP="subbu@backup.aurigraph.io:/backups/"
RETENTION_DAYS=7
LOG_FILE="/var/log/aurigraph-backup.log"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="aurigraph-backup-${DATE}"

# Notification settings
ALERT_EMAIL="subbu@aurigraph.io"
SLACK_WEBHOOK_URL=""  # Optional: Add Slack webhook for notifications

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    send_notification "❌ Backup Failed" "$1"
    exit 1
}

# Send notification
send_notification() {
    TITLE="$1"
    MESSAGE="$2"

    # Email notification
    if command -v mail &> /dev/null; then
        echo "$MESSAGE" | mail -s "$TITLE" "$ALERT_EMAIL"
    fi

    # Slack notification (if configured)
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"${TITLE}: ${MESSAGE}\"}" 2>/dev/null || true
    fi
}

# Create backup directories
create_backup_dirs() {
    log "Creating backup directories..."
    mkdir -p "$BACKUP_DIR/$BACKUP_NAME"/{portal,backend,config,logs,monitoring}
}

# Backup Enterprise Portal
backup_portal() {
    log "Backing up Enterprise Portal..."
    tar -czf "$BACKUP_DIR/$BACKUP_NAME/portal/enterprise-portal.tar.gz" \
        -C /opt/aurigraph-v11 enterprise-portal/ \
        || error_exit "Failed to backup Enterprise Portal"

    SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME/portal/enterprise-portal.tar.gz" | cut -f1)
    log "✅ Portal backup complete ($SIZE)"
}

# Backup V11 Backend
backup_backend() {
    log "Backing up V11 Backend..."
    tar -czf "$BACKUP_DIR/$BACKUP_NAME/backend/aurigraph-v11.tar.gz" \
        --exclude='*.log' \
        --exclude='logs/*' \
        -C /opt/aurigraph-v11 . \
        || error_exit "Failed to backup V11 Backend"

    SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME/backend/aurigraph-v11.tar.gz" | cut -f1)
    log "✅ Backend backup complete ($SIZE)"
}

# Backup NGINX Configuration
backup_nginx() {
    log "Backing up NGINX configuration..."
    tar -czf "$BACKUP_DIR/$BACKUP_NAME/config/nginx.tar.gz" \
        /etc/nginx/ \
        || error_exit "Failed to backup NGINX configuration"

    SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME/config/nginx.tar.gz" | cut -f1)
    log "✅ NGINX backup complete ($SIZE)"
}

# Backup SSL Certificates
backup_ssl() {
    log "Backing up SSL certificates..."
    sudo tar -czf "$BACKUP_DIR/$BACKUP_NAME/config/ssl-certificates.tar.gz" \
        /etc/letsencrypt/ \
        || error_exit "Failed to backup SSL certificates"

    SIZE=$(du -h "$BACKUP_DIR/$BACKUP_NAME/config/ssl-certificates.tar.gz" | cut -f1)
    log "✅ SSL certificates backup complete ($SIZE)"
}

# Backup Logs
backup_logs() {
    log "Backing up logs..."
    tar -czf "$BACKUP_DIR/$BACKUP_NAME/logs/nginx-logs.tar.gz" \
        /var/log/nginx/ 2>/dev/null || log "⚠️  No NGINX logs to backup"

    tar -czf "$BACKUP_DIR/$BACKUP_NAME/logs/aurigraph-logs.tar.gz" \
        /opt/aurigraph-v11/logs/ 2>/dev/null || log "⚠️  No Aurigraph logs to backup"

    log "✅ Logs backup complete"
}

# Backup Monitoring Data
backup_monitoring() {
    log "Backing up monitoring data..."

    # Backup Grafana dashboards
    if [ -d /var/lib/grafana ]; then
        tar -czf "$BACKUP_DIR/$BACKUP_NAME/monitoring/grafana.tar.gz" \
            /var/lib/grafana/ 2>/dev/null || log "⚠️  No Grafana data to backup"
    fi

    # Backup Prometheus configuration (data is too large, config only)
    if [ -d /etc/prometheus ]; then
        tar -czf "$BACKUP_DIR/$BACKUP_NAME/monitoring/prometheus-config.tar.gz" \
            /etc/prometheus/ 2>/dev/null || log "⚠️  No Prometheus config to backup"
    fi

    log "✅ Monitoring data backup complete"
}

# Backup Database (if applicable)
backup_database() {
    log "Backing up database..."

    # PostgreSQL backup example (uncomment if database exists)
    # pg_dump -U aurigraph_user aurigraph_v11 | gzip > "$BACKUP_DIR/$BACKUP_NAME/database.sql.gz"

    # For now, just log that no database backup is needed
    log "ℹ️  No database to backup (stateless application)"
}

# Create backup manifest
create_manifest() {
    log "Creating backup manifest..."

    MANIFEST_FILE="$BACKUP_DIR/$BACKUP_NAME/MANIFEST.txt"
    cat > "$MANIFEST_FILE" <<EOF
# Aurigraph DLT Backup Manifest
# Created: $(date '+%Y-%m-%d %H:%M:%S')
# Backup Name: $BACKUP_NAME
# Server: $(hostname)

## Contents
$(find "$BACKUP_DIR/$BACKUP_NAME" -type f -name "*.tar.gz" -exec sh -c 'echo "{} ($(du -h {} | cut -f1))"' \;)

## System Information
- Hostname: $(hostname)
- OS: $(lsb_release -d | cut -f2)
- Kernel: $(uname -r)
- Uptime: $(uptime -p)

## Service Status
- NGINX: $(systemctl is-active nginx)
- Aurigraph Backend: $(pgrep -f aurigraph-v11 > /dev/null && echo "running" || echo "stopped")

## Disk Space
$(df -h / | tail -1)

## Backup Completed: $(date '+%Y-%m-%d %H:%M:%S')
EOF

    log "✅ Manifest created"
}

# Compress entire backup
compress_backup() {
    log "Compressing backup archive..."

    cd "$BACKUP_DIR"
    tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME/" \
        || error_exit "Failed to compress backup"

    # Remove uncompressed directory
    rm -rf "$BACKUP_NAME"

    SIZE=$(du -h "${BACKUP_NAME}.tar.gz" | cut -f1)
    log "✅ Backup compressed: ${BACKUP_NAME}.tar.gz ($SIZE)"
}

# Upload to remote backup server (optional)
upload_to_remote() {
    if [ -n "$REMOTE_BACKUP" ] && command -v rsync &> /dev/null; then
        log "Uploading backup to remote server..."
        rsync -avz --progress \
            "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" \
            "$REMOTE_BACKUP" \
            && log "✅ Backup uploaded to remote server" \
            || log "⚠️  Failed to upload to remote server"
    else
        log "ℹ️  Remote backup not configured"
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."

    find "$BACKUP_DIR" -name "aurigraph-backup-*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete
    REMOVED=$(find "$BACKUP_DIR" -name "aurigraph-backup-*.tar.gz" -type f -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)

    if [ "$REMOVED" -gt 0 ]; then
        log "✅ Removed $REMOVED old backup(s)"
    else
        log "ℹ️  No old backups to remove"
    fi
}

# Verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."

    tar -tzf "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" > /dev/null 2>&1 \
        && log "✅ Backup verification successful" \
        || error_exit "Backup verification failed - archive may be corrupted"
}

# Main execution
main() {
    log "========================================="
    log "Starting Aurigraph Backup Process"
    log "========================================="

    create_backup_dirs
    backup_portal
    backup_backend
    backup_nginx
    backup_ssl
    backup_logs
    backup_monitoring
    backup_database
    create_manifest
    compress_backup
    verify_backup
    upload_to_remote
    cleanup_old_backups

    # Final summary
    TOTAL_SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" | cut -f1)
    log "========================================="
    log "Backup completed successfully!"
    log "Backup file: ${BACKUP_NAME}.tar.gz"
    log "Total size: $TOTAL_SIZE"
    log "Location: $BACKUP_DIR"
    log "========================================="

    send_notification "✅ Backup Successful" "Backup ${BACKUP_NAME}.tar.gz completed (${TOTAL_SIZE})"
}

# Run main function
main
```

### Make Script Executable

```bash
sudo chmod +x /opt/backup/aurigraph-backup.sh
sudo mkdir -p /backups/aurigraph
sudo chown subbu:subbu /backups/aurigraph
```

---

## 2. Automated Scheduling

### Daily Backups (Cron)

```bash
# Edit crontab
sudo crontab -e

# Add daily backup at 2:00 AM
0 2 * * * /opt/backup/aurigraph-backup.sh >> /var/log/aurigraph-backup.log 2>&1

# Add weekly full backup on Sundays at 3:00 AM
0 3 * * 0 RETENTION_DAYS=28 /opt/backup/aurigraph-backup.sh >> /var/log/aurigraph-backup.log 2>&1
```

### Using systemd Timer (Alternative)

Create `/etc/systemd/system/aurigraph-backup.service`:

```ini
[Unit]
Description=Aurigraph DLT Backup Service
After=network.target

[Service]
Type=oneshot
User=subbu
ExecStart=/opt/backup/aurigraph-backup.sh
StandardOutput=append:/var/log/aurigraph-backup.log
StandardError=append:/var/log/aurigraph-backup.log
```

Create `/etc/systemd/system/aurigraph-backup.timer`:

```ini
[Unit]
Description=Aurigraph DLT Daily Backup Timer
Requires=aurigraph-backup.service

[Timer]
OnCalendar=daily
OnCalendar=02:00
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start timer:

```bash
sudo systemctl daemon-reload
sudo systemctl enable aurigraph-backup.timer
sudo systemctl start aurigraph-backup.timer
sudo systemctl status aurigraph-backup.timer
```

---

## 3. Restore Procedures

### Full System Restore

Create `/opt/backup/aurigraph-restore.sh`:

```bash
#!/bin/bash
#
# Aurigraph DLT - Restore Script
# Purpose: Restore from backup archive
#

set -e

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <backup-file.tar.gz>"
    echo "Example: $0 /backups/aurigraph/aurigraph-backup-20251019_020000.tar.gz"
    exit 1
fi

BACKUP_FILE="$1"
RESTORE_DIR="/tmp/aurigraph-restore-$(date +%s)"

# Verify backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "========================================="
echo "Aurigraph DLT Restore Process"
echo "========================================="
echo "Backup file: $BACKUP_FILE"
echo "Restore directory: $RESTORE_DIR"
echo ""
read -p "Continue with restore? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled."
    exit 0
fi

# Extract backup
echo "[1/7] Extracting backup..."
mkdir -p "$RESTORE_DIR"
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"
cd "$RESTORE_DIR"/*

# Stop services
echo "[2/7] Stopping services..."
sudo systemctl stop nginx
ps aux | grep aurigraph-v11 | grep -v grep | awk '{print $2}' | xargs kill -15 2>/dev/null || true
sleep 5

# Restore Enterprise Portal
echo "[3/7] Restoring Enterprise Portal..."
sudo tar -xzf portal/enterprise-portal.tar.gz -C /opt/aurigraph-v11/

# Restore Backend
echo "[4/7] Restoring V11 Backend..."
sudo tar -xzf backend/aurigraph-v11.tar.gz -C /opt/aurigraph-v11/

# Restore NGINX Configuration
echo "[5/7] Restoring NGINX configuration..."
sudo tar -xzf config/nginx.tar.gz -C /

# Restore SSL Certificates
echo "[6/7] Restoring SSL certificates..."
sudo tar -xzf config/ssl-certificates.tar.gz -C /

# Restart services
echo "[7/7] Restarting services..."
sudo nginx -t && sudo systemctl start nginx

cd /opt/aurigraph-v11
nohup java -jar aurigraph-v11-standalone-*.jar &

echo "========================================="
echo "Restore completed successfully!"
echo "========================================="
echo ""
echo "Verify services:"
echo "  Portal: https://dlt.aurigraph.io"
echo "  API: https://dlt.aurigraph.io/api/v11/health"
echo ""
```

Make executable:

```bash
sudo chmod +x /opt/backup/aurigraph-restore.sh
```

### Restore Individual Components

```bash
# Restore only Enterprise Portal
sudo tar -xzf /backups/aurigraph/aurigraph-backup-YYYYMMDD/portal/enterprise-portal.tar.gz -C /opt/aurigraph-v11/

# Restore only NGINX config
sudo tar -xzf /backups/aurigraph/aurigraph-backup-YYYYMMDD/config/nginx.tar.gz -C /
sudo nginx -t && sudo systemctl reload nginx

# Restore only SSL certificates
sudo tar -xzf /backups/aurigraph/aurigraph-backup-YYYYMMDD/config/ssl-certificates.tar.gz -C /
```

---

## 4. Off-site Backup

### S3 Backup (AWS)

Install AWS CLI:

```bash
sudo apt install -y awscli
aws configure
```

Add to backup script:

```bash
# Upload to S3
upload_to_s3() {
    if command -v aws &> /dev/null; then
        log "Uploading backup to S3..."
        aws s3 cp "$BACKUP_DIR/${BACKUP_NAME}.tar.gz" \
            s3://aurigraph-backups/production/ \
            --storage-class GLACIER \
            && log "✅ Backup uploaded to S3" \
            || log "⚠️  Failed to upload to S3"
    fi
}
```

### Rsync to Remote Server

```bash
# Set up SSH key authentication
ssh-keygen -t ed25519 -C "backup@dlt.aurigraph.io"
ssh-copy-id subbu@backup.aurigraph.io

# Add to backup script
rsync -avz --progress \
    /backups/aurigraph/${BACKUP_NAME}.tar.gz \
    subbu@backup.aurigraph.io:/backups/aurigraph/
```

---

## 5. Backup Monitoring

### Backup Success Check

Create `/opt/monitoring/check-backup.sh`:

```bash
#!/bin/bash
# Check if daily backup was successful

BACKUP_LOG="/var/log/aurigraph-backup.log"
ALERT_EMAIL="subbu@aurigraph.io"

# Check if backup ran today
if ! grep -q "$(date +%Y-%m-%d)" "$BACKUP_LOG"; then
    echo "ERROR: No backup found for today!" | mail -s "Backup Alert: Missing Daily Backup" "$ALERT_EMAIL"
    exit 1
fi

# Check if backup was successful
if ! tail -100 "$BACKUP_LOG" | grep -q "Backup completed successfully"; then
    echo "ERROR: Backup failed!" | mail -s "Backup Alert: Backup Failed" "$ALERT_EMAIL"
    exit 1
fi

echo "✅ Backup check passed"
```

Add to crontab:

```bash
# Check backup success at 6:00 AM (4 hours after backup)
0 6 * * * /opt/monitoring/check-backup.sh
```

---

## 6. Disaster Recovery Plan

### Recovery Time Objective (RTO)

**Target**: < 2 hours for full system recovery

### Recovery Point Objective (RPO)

**Target**: < 24 hours (daily backups)

### DR Procedure

1. **Prepare New Server** (30 minutes)
   - Provision new server with same specs
   - Install Ubuntu 24.04 LTS
   - Install Java 21, NGINX

2. **Download Latest Backup** (15 minutes)
   - Retrieve from S3 or backup server
   - Verify integrity

3. **Run Restore Script** (30 minutes)
   - Execute `aurigraph-restore.sh`
   - Verify all services started

4. **Update DNS** (15 minutes)
   - Point dlt.aurigraph.io to new server IP
   - Wait for DNS propagation

5. **Verify Functionality** (30 minutes)
   - Test portal access
   - Test API endpoints
   - Check SSL certificates
   - Monitor logs

---

## 7. Testing Backups

### Monthly Backup Test

```bash
# 1. List available backups
ls -lh /backups/aurigraph/

# 2. Select a recent backup
BACKUP_FILE="/backups/aurigraph/aurigraph-backup-20251019_020000.tar.gz"

# 3. Extract to test directory (do NOT overwrite production)
TEST_DIR="/tmp/backup-test-$(date +%s)"
mkdir -p "$TEST_DIR"
tar -xzf "$BACKUP_FILE" -C "$TEST_DIR"

# 4. Verify all expected files exist
find "$TEST_DIR" -type f -name "*.tar.gz"

# 5. Verify each archive can be extracted
for archive in $(find "$TEST_DIR" -type f -name "*.tar.gz"); do
    echo "Testing: $archive"
    tar -tzf "$archive" > /dev/null && echo "✅ OK" || echo "❌ FAILED"
done

# 6. Cleanup
rm -rf "$TEST_DIR"
```

---

## 8. Backup Checklist

### Daily Tasks
- [x] Automated backup runs at 2:00 AM
- [ ] Verify backup log for success
- [ ] Check backup file size is reasonable

### Weekly Tasks
- [ ] Review backup retention (delete old backups)
- [ ] Verify off-site backup uploads
- [ ] Check disk space on backup storage

### Monthly Tasks
- [ ] Test restore procedure on test environment
- [ ] Verify backup integrity
- [ ] Update backup documentation

### Quarterly Tasks
- [ ] Full disaster recovery test
- [ ] Review and update backup strategy
- [ ] Review retention policies

---

## 9. Quick Reference

### Backup Commands

```bash
# Manual backup
sudo /opt/backup/aurigraph-backup.sh

# List backups
ls -lh /backups/aurigraph/

# Check backup log
tail -f /var/log/aurigraph-backup.log

# Verify backup
tar -tzf /backups/aurigraph/aurigraph-backup-YYYYMMDD.tar.gz

# Restore from backup
sudo /opt/backup/aurigraph-restore.sh /backups/aurigraph/aurigraph-backup-YYYYMMDD.tar.gz
```

### Backup Storage

**Local Backups**: `/backups/aurigraph/`
**Remote Backups**: `subbu@backup.aurigraph.io:/backups/`
**S3 Backups**: `s3://aurigraph-backups/production/`

---

## 10. Contact Information

**Backup Administrator**: subbu@aurigraph.io
**Emergency Contact**: sjoish12@gmail.com

**Backup Schedule**: Daily at 2:00 AM IST
**Retention**: 7 days (daily), 28 days (weekly)

---

**Document Version**: 1.0
**Created**: October 19, 2025
**Last Tested**: [To be updated after first test]
**Status**: Ready for Implementation

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
