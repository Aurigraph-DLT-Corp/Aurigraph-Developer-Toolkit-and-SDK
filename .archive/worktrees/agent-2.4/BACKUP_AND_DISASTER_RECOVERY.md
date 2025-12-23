# Aurigraph V11: Backup & Disaster Recovery Plan

**Document Version**: 1.0
**Last Updated**: 2025-11-12
**Recovery Objectives**:
- **RTO** (Recovery Time Objective): 15 minutes maximum
- **RPO** (Recovery Point Objective): 5 minutes maximum data loss

---

## Backup Strategy

### 1. Database Backups (PostgreSQL)

#### Full Backup (Daily)
```bash
#!/bin/bash
# /opt/backup/postgres-full-backup.sh

BACKUP_DIR="/opt/backups/postgres"
DB_NAME="aurigraph_v11"
DB_USER="aurigraph"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/full-backup-$TIMESTAMP.sql.gz"

# Create full database dump
pg_dump -U postgres $DB_NAME | gzip > $BACKUP_FILE

# Verify backup integrity
gunzip -t $BACKUP_FILE

# Calculate checksum
sha256sum $BACKUP_FILE > "$BACKUP_FILE.sha256"

# Upload to S3 (AWS backup)
aws s3 cp $BACKUP_FILE s3://aurigraph-backups/postgres/$(hostname)/ \
  --storage-class GLACIER

# Cleanup local backups older than 7 days
find $BACKUP_DIR -name "full-backup-*.sql.gz" -mtime +7 -delete

echo "Full backup completed: $BACKUP_FILE"
```

**Schedule**: Daily at 2:00 AM UTC (off-peak hours)
**Retention**: 30 days (weekly archives)
**Size**: ~1-2GB per backup

#### Incremental/WAL Backups (Hourly)
```bash
#!/bin/bash
# /opt/backup/postgres-wal-backup.sh

WAL_DIR="/var/lib/postgresql/16/main/pg_wal"
BACKUP_DIR="/opt/backups/postgres-wal"

# Backup PostgreSQL Write-Ahead Log (WAL) files
find $WAL_DIR -name "0000*" -newer $BACKUP_DIR -exec cp {} $BACKUP_DIR \;

# Compression for storage
for file in $BACKUP_DIR/0000*; do
  gzip "$file"
done

# Upload to S3
aws s3 sync $BACKUP_DIR s3://aurigraph-backups/postgres-wal/$(hostname)/

echo "WAL backup completed at $(date)"
```

**Schedule**: Every hour (automatic)
**Retention**: 7 days
**Size**: ~100-200MB per hour

### 2. Application State Backup (RocksDB)

```bash
#!/bin/bash
# /opt/backup/rocksdb-backup.sh

ROCKSDB_DIR="/var/lib/aurigraph/rocksdb"
BACKUP_DIR="/opt/backups/rocksdb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/rocksdb-backup-$TIMESTAMP.tar.gz"

# Create consistent snapshot
cd $ROCKSDB_DIR
tar --exclude='LOCK' --exclude='*.log' -czf $BACKUP_FILE .

# Verify backup
tar -tzf $BACKUP_FILE > /dev/null

# Create checksum
sha256sum $BACKUP_FILE > "$BACKUP_FILE.sha256"

# Upload to S3
aws s3 cp $BACKUP_FILE s3://aurigraph-backups/rocksdb/$(hostname)/

# Cleanup old backups (keep 7 days)
find $BACKUP_DIR -name "rocksdb-backup-*.tar.gz" -mtime +7 -delete

echo "RocksDB backup completed: $BACKUP_FILE"
```

**Schedule**: Every 6 hours
**Retention**: 14 days
**Size**: ~5-10GB per backup

### 3. Configuration Backup

```bash
#!/bin/bash
# /opt/backup/config-backup.sh

BACKUP_DIR="/opt/backups/config"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup all critical configs
tar -czf $BACKUP_DIR/config-$TIMESTAMP.tar.gz \
  /opt/monitoring/prometheus.yml \
  /opt/monitoring/alert-rules.yml \
  /opt/monitoring/alertmanager.yml \
  /home/subbu/v11-startup.sh \
  /etc/postgresql/16/main/postgresql.conf \
  /etc/nginx/nginx.conf \
  /docker-compose.yml

# Upload to S3
aws s3 cp $BACKUP_DIR/config-$TIMESTAMP.tar.gz \
  s3://aurigraph-backups/config/

echo "Config backup completed"
```

**Schedule**: Daily
**Retention**: 90 days

---

## Backup Verification & Testing

### Automated Verification
```bash
#!/bin/bash
# /opt/backup/verify-backups.sh (run weekly)

echo "=== Backup Verification Report ==="
echo "Date: $(date)"

# Check backup file sizes
echo "
## Database Backup Status"
ls -lh /opt/backups/postgres/full-backup-*.sql.gz | tail -5
echo "Latest backup: $(ls -t /opt/backups/postgres/full-backup-*.sql.gz | head -1)"

# Verify checksum
LATEST_BACKUP=$(ls -t /opt/backups/postgres/full-backup-*.sql.gz | head -1)
sha256sum -c "$LATEST_BACKUP.sha256"

# Test restore
echo "
## Testing Restore Capability"
TEST_DB="test_aurigraph_restore"
createdb $TEST_DB
gunzip -c $LATEST_BACKUP | psql $TEST_DB > /dev/null
RESTORE_STATUS=$?

if [ $RESTORE_STATUS -eq 0 ]; then
  echo "✅ Restore test PASSED"
  dropdb $TEST_DB
else
  echo "❌ Restore test FAILED"
  # Alert on failure
  aws sns publish --topic-arn arn:aws:sns:us-east-1:123456789:backup-alerts \
    --message "Database restore test failed!"
fi

# Check backup age
BACKUP_AGE=$(find /opt/backups/postgres -name "full-backup-*.sql.gz" -mtime 0)
if [ -z "$BACKUP_AGE" ]; then
  echo "❌ No backup in last 24 hours!"
fi

echo "=== End Report ==="
```

---

## Disaster Recovery Procedures

### Scenario 1: Database Corruption (RTO: 15 min, RPO: 1 hour)

**Detection**:
```sql
-- If you see errors like:
-- "ERROR: could not access status of transaction"
-- "WARNING: page verification failed"

-- Check database integrity
REINDEX DATABASE aurigraph_v11;
```

**Recovery Steps**:
```bash
#!/bin/bash
# Step 1: Stop V11 service
ssh subbu@dlt.aurigraph.io "pkill -f java.*aurigraph"

# Step 2: Stop PostgreSQL
ssh subbu@dlt.aurigraph.io "sudo systemctl stop postgresql"

# Step 3: Locate latest backup
LATEST_BACKUP=$(aws s3 ls s3://aurigraph-backups/postgres/ | sort | tail -1 | awk '{print $4}')

# Step 4: Download backup
aws s3 cp s3://aurigraph-backups/postgres/$LATEST_BACKUP . /opt/restore/

# Step 5: Restore database
ssh subbu@dlt.aurigraph.io << 'EOF'
sudo systemctl start postgresql
gunzip -c /opt/restore/$LATEST_BACKUP | sudo -u postgres psql
EOF

# Step 6: Restart V11 service
ssh subbu@dlt.aurigraph.io "cd /home/subbu && java -jar aurigraph-v11.jar ... &"

# Step 7: Verify health
sleep 30
curl http://dlt.aurigraph.io:9003/api/v11/health
```

**Time**: 10-15 minutes

### Scenario 2: Complete Server Failure (RTO: 30 min, RPO: 5 min)

**Recovery Steps**:
```bash
#!/bin/bash
# Automated server rebuild script

# 1. Provision new server (AWS/Azure/GCP)
aws ec2 run-instances --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.2xlarge \
  --key-name aurigraph-key \
  --security-group-ids sg-v11-prod

NEW_SERVER_IP="<new-ip>"

# 2. Wait for server to be ready
sleep 60

# 3. Install dependencies
ssh -i aurigraph-key.pem ubuntu@$NEW_SERVER_IP << 'EOF'
sudo apt-get update
sudo apt-get install -y docker.io postgresql-client openjdk-21-jdk
sudo systemctl start docker
EOF

# 4. Download backup and restore database
aws s3 cp s3://aurigraph-backups/postgres/latest.sql.gz .
ssh -i aurigraph-key.pem ubuntu@$NEW_SERVER_IP "gunzip latest.sql.gz | psql ..."

# 5. Deploy V11 application
scp -i aurigraph-key.pem /opt/backups/config/docker-compose.yml \
  ubuntu@$NEW_SERVER_IP:~/docker-compose.yml

ssh -i aurigraph-key.pem ubuntu@$NEW_SERVER_IP "
  cd ~ && \
  docker-compose pull && \
  docker-compose up -d
"

# 6. Update DNS to point to new server
aws route53 change-resource-record-sets --hosted-zone-id Z123 \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "dlt.aurigraph.io",
        "Type": "A",
        "TTL": 300,
        "ResourceRecords": [{"Value": "'$NEW_SERVER_IP'"}]
      }
    }]
  }'

# 7. Verify health
sleep 30
curl https://dlt.aurigraph.io/api/v11/health
```

**Time**: 20-30 minutes

### Scenario 3: Data Center Failure (Multi-Cloud Failover)

**Automatic Failover**:
```bash
#!/bin/bash
# /opt/failover/multi-cloud-failover.sh

# Detect primary datacenter down
PRIMARY="dlt.aurigraph.io"
SECONDARY_AWS="v11-backup-us-west.aurigraph.io"
SECONDARY_AZURE="v11-backup-eastus.aurigraph.io"

# Health check with 3 retries
check_health() {
  for i in {1..3}; do
    curl -s -f http://$1:9003/api/v11/health && return 0
    sleep 5
  done
  return 1
}

# Failover logic
if ! check_health $PRIMARY; then
  echo "Primary down. Activating secondary..."

  # Promote secondary (all in-flight transactions must be committed)
  ssh ubuntu@$SECONDARY_AWS "
    # Complete consensus rounds
    while [ \$(cat /proc/net/tcp | wc -l) -gt 1000 ]; do
      sleep 1
    done

    # Stop replication from primary
    systemctl stop postgresql-replication

    # Promote replica to standalone
    psql -c 'SELECT pg_promote();'
  "

  # Update DNS
  aws route53 change-resource-record-sets \
    --hosted-zone-id Z123 \
    --change-batch "{"Changes":[{"Action":"UPSERT","ResourceRecordSet":{"Name":"dlt.aurigraph.io","Type":"A","ResourceRecords":[{"Value":"<secondary-ip>"}]}}]}"

  # Wait for DNS propagation
  sleep 60

  # Alert team
  aws sns publish \
    --topic-arn arn:aws:sns:us-east-1:123:failover-alerts \
    --message "Failover to secondary completed. New endpoint: $SECONDARY_AWS"
fi
```

**Time**: 5 minutes automatic

---

## Verification Checklist

### Daily Checks
- [ ] Backup completed successfully in S3
- [ ] Latest backup is < 24 hours old
- [ ] All backup files have checksums
- [ ] Backup log shows no errors

### Weekly Checks
- [ ] Database restore test successful
- [ ] RocksDB backup verifiable
- [ ] Configuration backups current
- [ ] Failover DNS records updated

### Monthly Checks
- [ ] Full restore drill (test environment)
- [ ] Multi-cloud failover test
- [ ] Backup retention policy verified
- [ ] Document any recovery findings

---

## Backup Monitoring

```yaml
# Prometheus alerts for backup failures
groups:
  - name: backup_alerts
    rules:
      - alert: BackupMissing
        expr: time() - backup_last_timestamp > 86400  # > 24 hours
        annotations:
          summary: "No backup in last 24 hours"

      - alert: BackupRestoreFailed
        expr: backup_restore_success == 0
        annotations:
          summary: "Database restore test failed"

      - alert: S3SyncFailed
        expr: s3_upload_errors > 0
        annotations:
          summary: "Backup S3 upload failed"
```

---

## Budget Estimate

| Component | Monthly Cost | Notes |
|-----------|--------------|-------|
| S3 Storage | $50-100 | ~300GB stored backups |
| S3 Transfer | $20-50 | Daily uploads |
| Secondary Server (standby) | $200-300 | t3.2xlarge, on-demand |
| Backup Monitoring | $50 | CloudWatch alarms |
| **Total** | **$320-500** | Per month |

---

## References

- [PostgreSQL Point-in-Time Recovery](https://www.postgresql.org/docs/16/continuous-archiving.html)
- [AWS Backup Best Practices](https://docs.aws.amazon.com/aws-backup/latest/userguide/best-practices.html)
- [Disaster Recovery Planning](https://en.wikipedia.org/wiki/Disaster_recovery)
- [RTO/RPO Definition](https://www.ibm.com/cloud/learn/disaster-recovery)

