# Manual Deployment Instructions for V4.4.4 Production
## When SSH Connection is Restored

**Status**: Configuration ready, awaiting network connectivity to remote server

---

## Option 1: Using Automated Deployment Script (Recommended)

### Prerequisites
```bash
# Ensure you have SSH access configured
cat ~/.ssh/config | grep -A 5 "Host dlt"

# Should show:
# Host dlt
#   Hostname dlt.aurigraph.io
#   User subbu
#   Port 2235
#   IdentityFile ~/.ssh/id_rsa
```

### Execute Full Deployment

```bash
# From repository root
chmod +x deploy.sh
./deploy.sh deploy
```

**What this does**:
1. Pulls latest configuration from GitHub
2. Builds Docker images (native-fast profile)
3. Starts all services
4. Verifies service health
5. Displays access URLs

**Expected output**:
```
[INFO] Starting full deployment process...
[✓] Configuration files found
[INFO] Step 1: Pulling latest configuration...
[✓] Latest configuration pulled
[INFO] Step 2: Building Docker images...
[✓] Docker images built successfully
[INFO] Step 3: Starting services...
[✓] Docker services started
[INFO] Waiting for services to be ready (30 seconds)...
[✓] Deployment completed successfully!
Access the application at: https://dlt.aurigraph.io
Grafana dashboard: https://dlt.aurigraph.io/grafana
API documentation: https://dlt.aurigraph.io/swagger-ui/
```

### Other Deployment Commands

```bash
# View service status
./deploy.sh status

# View logs (all services)
./deploy.sh logs

# View specific service logs
./deploy.sh logs dlt-aurigraph-v11
./deploy.sh logs dlt-postgres
./deploy.sh logs dlt-nginx-gateway

# Backup database before making changes
./deploy.sh backup

# Restart services
./deploy.sh restart

# Stop all services
./deploy.sh stop

# Start services
./deploy.sh start

# Clean up (removes containers, volumes, networks)
./deploy.sh clean
```

---

## Option 2: Manual Step-by-Step Deployment

### Step 1: SSH into Remote Server

```bash
ssh dlt
# Or: ssh -p2235 subbu@dlt.aurigraph.io
```

### Step 2: Navigate to Deployment Directory

```bash
cd /opt/DLT
pwd  # Should show: /opt/DLT
```

### Step 3: Pull Latest Configuration

```bash
git pull origin main

# Expected output:
# Already on 'main'
# Your branch is up to date with 'origin/main'.
```

### Step 4: Build Docker Images (First Time Only)

```bash
# Build all images in parallel
docker-compose build --parallel

# Or use native-fast profile (faster)
docker-compose build --parallel --progress=plain
```

**Expected build time**:
- Native build: ~30 minutes (first time)
- Subsequent builds: ~5-10 minutes (cached)

### Step 5: Pull Latest Images

```bash
docker-compose pull
```

### Step 6: Start Services

```bash
docker-compose up -d

# Output should show:
# Creating dlt-nginx-gateway ... done
# Creating dlt-postgres ... done
# Creating dlt-redis ... done
# Creating dlt-prometheus ... done
# Creating dlt-aurigraph-v11 ... done
# Creating dlt-grafana ... done
# Creating dlt-portal ... done
```

### Step 7: Monitor Service Startup

```bash
# Watch logs in real-time
docker-compose logs -f

# Or watch specific service
docker-compose logs -f dlt-aurigraph-v11

# Press Ctrl+C to exit
```

### Step 8: Verify Services are Running

```bash
# Check all services
docker-compose ps

# Expected output:
# NAME                      STATUS
# dlt-nginx-gateway         Up X seconds (healthy)
# dlt-postgres              Up X seconds (healthy)
# dlt-redis                 Up X seconds (healthy)
# dlt-prometheus            Up X seconds (healthy)
# dlt-aurigraph-v11         Up X seconds (healthy)
# dlt-grafana               Up X seconds (healthy)
# dlt-portal                Up X seconds (healthy)
```

### Step 9: Run Health Checks

```bash
# Health check endpoint
curl -s http://localhost:9003/q/health | jq .

# Output should contain:
# {
#   "status": "UP"
# }

# Check PostgreSQL
docker-compose exec postgres pg_isready -U aurigraph

# Output:
# accepting connections

# Check Redis
docker-compose exec redis redis-cli ping

# Output:
# PONG
```

### Step 10: Verify Database Initialization

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U aurigraph -d aurigraph_production

# List schemas
\dn

# Should show:
#   Name    | Owner
# ----------+-----------
#  bridge_transfers  | aurigraph
#  atomic_swaps      | aurigraph
#  query_stats       | aurigraph
#  monitoring        | aurigraph
#  public            | postgres

# List tables in bridge_transfers schema
\dt bridge_transfers.*

# Should show transfers, transfer_signatures, transfer_events tables

# Exit psql
\q
```

---

## Deployment Verification Checklist

### 1. Service Health Check

```bash
# All services should be UP and healthy
docker-compose ps

# Check exit codes (should be 0)
docker-compose exec aurigraph-v11-service curl http://localhost:9003/q/health
docker-compose exec postgres pg_isready
docker-compose exec redis redis-cli ping
docker-compose exec prometheus curl http://localhost:9090/-/healthy
docker-compose exec grafana curl http://localhost:3000/api/health
```

### 2. API Endpoint Tests

```bash
# Health endpoint
curl -s http://dlt.aurigraph.io/q/health | jq .

# Bridge Transfer endpoint
curl -s -X POST http://dlt.aurigraph.io/api/v11/bridge/transfer/submit \
  -H "Content-Type: application/json" \
  -d '{
    "transferId": "test-transfer-001",
    "sourceChain": "ethereum",
    "targetChain": "polygon",
    "tokenSymbol": "ETH",
    "amount": "10.00",
    "requiredSignatures": 2,
    "totalSigners": 3
  }' | jq .

# Atomic Swap endpoint
curl -s -X POST http://dlt.aurigraph.io/api/v11/bridge/swap/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "swapId": "test-swap-001",
    "initiator": "0x1111111111111111111111111111111111111111",
    "counterparty": "0x2222222222222222222222222222222222222222",
    "sourceChain": "ethereum",
    "targetChain": "polygon",
    "tokenIn": "ETH",
    "tokenOut": "WETH",
    "amountIn": "1.5",
    "amountOut": "1.4",
    "hashAlgo": "SHA256",
    "hashLock": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "timelock": 300000
  }' | jq .

# Query endpoint
curl -s "http://dlt.aurigraph.io/api/v11/bridge/query/transfers?pageNumber=1&pageSize=50" | jq .
```

### 3. Web Interfaces

```bash
# Enterprise Portal (React frontend)
# Visit: https://dlt.aurigraph.io
# Expected: Dashboard with API connectivity status

# Grafana Dashboards
# Visit: https://dlt.aurigraph.io/grafana
# Login: admin / admin123 (change this!)
# Expected: Monitoring dashboards with metrics

# API Documentation
# Visit: https://dlt.aurigraph.io/swagger-ui/
# Expected: OpenAPI/Swagger documentation with all endpoints
```

### 4. Database Verification

```bash
# Count records in each schema
docker-compose exec -T postgres psql -U aurigraph aurigraph_production -c "
  SELECT 'bridge_transfers' as schema, count(*) FROM bridge_transfers.transfers
  UNION ALL
  SELECT 'atomic_swaps', count(*) FROM atomic_swaps.swaps
  UNION ALL
  SELECT 'query_stats', count(*) FROM query_stats.transaction_summary
;"

# Check indexes are created
docker-compose exec -T postgres psql -U aurigraph aurigraph_production -c "
  SELECT schemaname, tablename, indexname
  FROM pg_indexes
  WHERE schemaname IN ('bridge_transfers', 'atomic_swaps')
  ORDER BY schemaname, tablename;
"
```

### 5. Prometheus Metrics

```bash
# Check Prometheus is scraping targets
# Visit: http://localhost:9090/targets
# Expected: All scrape targets showing GREEN (UP status)

# Query specific metric
curl -s "http://localhost:9090/api/v1/query?query=up" | jq .
```

---

## Common Deployment Issues & Solutions

### Issue: Services Not Starting

**Symptoms**:
```
dlt-aurigraph-v11  Restarting
dlt-postgres       Exited (1)
```

**Solution**:
```bash
# Check logs
docker-compose logs -f dlt-aurigraph-v11

# If database connection error, wait for postgres
docker-compose restart dlt-postgres
sleep 30
docker-compose restart dlt-aurigraph-v11

# If still failing, check resource limits
docker stats
```

### Issue: Port Already in Use

**Symptoms**:
```
bind: address already in use
```

**Solution**:
```bash
# Find what's using the port (example: port 9003)
lsof -i :9003

# Stop the conflicting process
kill -9 <PID>

# Or stop existing containers
docker-compose down
```

### Issue: Database Connection Errors

**Symptoms**:
```
FATAL: password authentication failed for user "aurigraph"
```

**Solution**:
```bash
# Check .env.production has correct credentials
cat .env.production | grep -i password

# Update if needed
echo "DB_PASSWORD=correct-password" >> .env.production

# Restart postgres
docker-compose restart dlt-postgres
```

### Issue: Disk Space

**Symptoms**:
```
no space left on device
```

**Solution**:
```bash
# Check disk usage
df -h

# Clean up old logs
docker-compose logs --tail=0 -f /dev/null

# Remove old images
docker image prune -a

# If still needed, increase volume size or cleanup backups
rm -f /opt/DLT/backups/aurigraph_*.sql
```

### Issue: Memory Issues

**Symptoms**:
```
Killed
out of memory
```

**Solution**:
```bash
# Increase memory limits in docker-compose.yml
# Find lines like:
#   deploy:
#     resources:
#       limits:
#         memory: 2G

# Increase 2G to 4G or 8G as needed
nano docker-compose.yml

# Restart services
docker-compose down
docker-compose up -d
```

---

## Post-Deployment Actions

### 1. Change Default Passwords

```bash
# Change Grafana admin password
docker-compose exec grafana grafana-cli admin reset-admin-password <new-password>

# Change PostgreSQL password
docker-compose exec postgres psql -U aurigraph -d aurigraph_production -c \
  "ALTER USER aurigraph WITH PASSWORD 'new-secure-password';"

# Update .env.production
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=new-secure-password/" .env.production
```

### 2. Configure SSL Certificate Auto-Renewal

```bash
# Check certbot status
sudo certbot renew --dry-run

# Set up auto-renewal cron
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Verify
sudo systemctl status certbot.timer
```

### 3. Set Up Log Rotation

```bash
# Create logrotate config
sudo nano /etc/logrotate.d/aurigraph

# Add:
/opt/DLT/logs/*.log {
  daily
  rotate 14
  compress
  delaycompress
  missingok
  notifempty
}

# Test
sudo logrotate -d /etc/logrotate.d/aurigraph
```

### 4. Configure Monitoring & Alerts

```bash
# Set up Grafana alert notifications
# Visit: https://dlt.aurigraph.io/grafana/alerting/notifications

# Create dashboard alerts for:
# - V11 Service down
# - PostgreSQL down
# - High memory usage
# - High disk usage
# - API response time > 500ms
```

### 5. Enable SMTP for Alerts

```bash
# Update .env.production
SMTP_HOST=smtp.gmail.com:587
SMTP_USER=alerts@example.com
SMTP_PASSWORD=app-specific-password
GRAFANA_SMTP_ENABLED=true

# Restart services
docker-compose restart dlt-grafana
```

---

## Backup & Recovery

### Regular Backups

```bash
# Automated daily backup script
cat > /opt/DLT/backup-daily.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/DLT/backups"
BACKUP_FILE="$BACKUP_DIR/aurigraph_$(date +%Y%m%d_%H%M%S).sql"
mkdir -p "$BACKUP_DIR"
docker-compose exec -T postgres pg_dump -U aurigraph aurigraph_production > "$BACKUP_FILE"
gzip "$BACKUP_FILE"
# Keep only last 30 days
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete
EOF

chmod +x /opt/DLT/backup-daily.sh

# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/DLT/backup-daily.sh") | crontab -
```

### Restore from Backup

```bash
# List available backups
ls -lh /opt/DLT/backups/

# Restore specific backup
docker-compose exec -T postgres psql -U aurigraph aurigraph_production < /path/to/backup.sql

# Or if compressed
gunzip -c /path/to/backup.sql.gz | docker-compose exec -T postgres psql -U aurigraph aurigraph_production
```

---

## Performance Monitoring

### Real-Time Metrics

```bash
# Monitor container stats
docker stats

# Watch specific container
docker stats dlt-aurigraph-v11 --no-stream

# Log container performance
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### Database Performance

```bash
# Top queries by execution time
docker-compose exec -T postgres psql -U aurigraph aurigraph_production -c \
  "SELECT query, mean_exec_time, calls FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;"

# Check index usage
docker-compose exec -T postgres psql -U aurigraph aurigraph_production -c \
  "SELECT schemaname, tablename, indexname, idx_scan FROM pg_stat_user_indexes ORDER BY idx_scan;"

# Analyze table sizes
docker-compose exec -T postgres psql -U aurigraph aurigraph_production -c \
  "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname IN ('bridge_transfers', 'atomic_swaps') ORDER BY pg_total_relation_size DESC;"
```

---

## Troubleshooting Commands

```bash
# Check all service health
docker-compose ps

# View latest errors
docker-compose logs --tail=50 | grep -i error

# Restart specific service
docker-compose restart dlt-aurigraph-v11

# Scale service (if needed)
docker-compose up -d --scale dlt-aurigraph-v11=3

# Check network connectivity
docker-compose exec dlt-aurigraph-v11 ping postgres
docker-compose exec dlt-aurigraph-v11 ping redis

# Check port bindings
netstat -tlnp | grep LISTEN

# Monitor resource usage
free -h  # Memory
df -h    # Disk
top      # CPU

# Check certificate expiry
openssl x509 -in /etc/letsencrypt/live/aurcrt/fullchain.pem -noout -dates
```

---

## Success Indicators

✅ **Deployment is successful when**:

1. All services are UP and healthy
   ```bash
   docker-compose ps
   # All should show "Up X seconds (healthy)"
   ```

2. Health checks pass
   ```bash
   curl http://localhost:9003/q/health
   # Returns: {"status":"UP"}
   ```

3. Database schemas exist
   ```bash
   docker-compose exec postgres psql -U aurigraph aurigraph_production -c "\dn"
   # Shows: bridge_transfers, atomic_swaps, query_stats, monitoring
   ```

4. Prometheus collects metrics
   ```bash
   curl http://localhost:9090/targets
   # Shows all targets with status "UP"
   ```

5. Grafana dashboards display data
   ```
   https://dlt.aurigraph.io/grafana
   # Dashboards show live metrics
   ```

6. API endpoints respond
   ```bash
   curl https://dlt.aurigraph.io/api/v11/health
   # Returns successful response
   ```

---

## Support & Documentation

For detailed information, refer to:
- `DEPLOYMENT-V4.4.4-PRODUCTION.md` - Comprehensive deployment guide
- `docker-compose.yml` - Service configuration
- `deploy.sh` - Automated deployment script
- `/ARCHITECTURE.md` - System architecture
- `/DEVELOPMENT.md` - Development guide

---

**Status**: Ready for deployment
**Next Step**: Execute either automated (./deploy.sh deploy) or manual deployment
**Expected Duration**: 2-5 minutes for service startup
**Contact**: See CLAUDE.md for support information
