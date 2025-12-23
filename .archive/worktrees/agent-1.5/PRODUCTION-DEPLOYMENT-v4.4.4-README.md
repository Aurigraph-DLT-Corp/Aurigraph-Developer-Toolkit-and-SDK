# Aurigraph V4.4.4 Production Deployment Guide

**Version**: 4.4.4
**Release Date**: November 13, 2025
**Status**: Ready for Production Deployment
**Target Server**: dlt.aurigraph.io

---

## Overview

This guide provides complete instructions for deploying Aurigraph V4.4.4 infrastructure on a production server with complete Docker containerization, enterprise nodes, and comprehensive monitoring.

### Deployment Components

✅ **Docker Infrastructure**
- NGINX API Gateway with SSL/TLS
- API Gateway Service
- Enterprise Portal
- 3 Validator Nodes
- 1 Business Node
- Prometheus Monitoring
- Grafana Dashboard

✅ **Network Configuration**
- Domain: dlt.aurigraph.io
- Ports: 80 (HTTP → HTTPS redirect), 443 (HTTPS)
- SSL Certificate: /etc/letsencrypt/live/aurcrt/

✅ **Git Repository**
- Repository: git@github.com:Aurigraph-DLT-Corp/Aurigraph-DLT.git
- Branch: main
- Latest security infrastructure integrated

---

## Prerequisites

### Local Machine Requirements
- SSH client (openssh-client)
- Docker CLI (for building images)
- Git with SSH keys configured
- Bash 4.0+

### Remote Server Requirements
- Ubuntu 20.04 LTS or later
- Docker 20.10+
- Docker Compose 1.29+
- 16GB+ RAM recommended
- 200GB+ SSD storage
- SSH access on port 22 (default)
- SSL certificates at `/etc/letsencrypt/live/aurcrt/`

### SSH Access
```bash
# SSH connection details
Host: dlt.aurigraph.io
User: subbu
Port: 22

# Connection test
ssh subbu@dlt.aurigraph.io "echo 'SSH OK'"
```

---

## Deployment Steps

### Step 1: Clean Remote Server (DESTRUCTIVE)

This step removes ALL Docker containers, volumes, and networks from the remote server and cleans up the `/opt/DLT` directory.

```bash
# Review the script first
less cleanup-remote-server.sh

# Execute cleanup (will prompt for confirmation)
./cleanup-remote-server.sh --host dlt.aurigraph.io --user subbu

# Or with dry-run to see what would happen
./cleanup-remote-server.sh --host dlt.aurigraph.io --user subbu --dry-run

# Force cleanup without confirmation
./cleanup-remote-server.sh --host dlt.aurigraph.io --user subbu --force
```

**What This Does**:
1. Stops all running Docker containers
2. Removes all containers
3. Removes all volumes
4. Removes all custom networks
5. Cleans up `/opt/DLT` folder (creates backup)
6. Clones fresh repository from GitHub
7. Creates directory structure

**⚠️ Warning**: This is irreversible. All running services and data will be lost unless backed up.

### Step 2: Verify Git Repository

After cleanup, verify the fresh Git repository is in place:

```bash
ssh subbu@dlt.aurigraph.io << 'EOF'
cd /opt/DLT
git status
git branch -a
git log --oneline -5
EOF
```

Expected output:
```
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean
```

### Step 3: Deploy V4.4.4 Infrastructure

Deploy the complete containerized infrastructure:

```bash
# Review the deployment script
less deploy-v4-production.sh

# Execute full deployment
./deploy-v4-production.sh --host dlt.aurigraph.io --user subbu

# Or with dry-run to preview
./deploy-v4-production.sh --host dlt.aurigraph.io --user subbu --dry-run
```

**What This Does**:
1. Generates docker-compose.yml
2. Generates NGINX configuration
3. Copies SSL certificates
4. Deploys all Docker containers
5. Verifies health checks
6. Generates deployment report

**Deployment Time**: ~10-15 minutes (includes container startup)

### Step 4: Verify Deployment

After deployment completes, verify all services are running:

```bash
# Check container status
ssh subbu@dlt.aurigraph.io "docker ps --format 'table {{.Names}}\t{{.Status}}'"

# Expected output (all should be "Up"):
# aurigraph-nginx           Up 2 minutes
# aurigraph-api-gateway     Up 2 minutes
# aurigraph-portal          Up 2 minutes
# aurigraph-validator-1     Up 2 minutes
# aurigraph-validator-2     Up 1 minute
# aurigraph-validator-3     Up 1 minute
# aurigraph-business-1      Up 1 minute
# aurigraph-prometheus      Up 1 minute
# aurigraph-grafana         Up 1 minute
```

### Step 5: Test API Endpoints

Test the deployed services:

```bash
# Health check
curl https://dlt.aurigraph.io/health

# API Gateway
curl https://dlt.aurigraph.io/api/v4/health

# Portal (should return HTML)
curl -L https://dlt.aurigraph.io/ | head -20

# Monitoring
curl https://dlt.aurigraph.io/monitoring/prometheus/health
curl https://dlt.aurigraph.io/monitoring/grafana/api/health
```

---

## Troubleshooting

### Containers Won't Start

```bash
# Check logs
ssh subbu@dlt.aurigraph.io "docker logs -f aurigraph-nginx"

# Check resource usage
ssh subbu@dlt.aurigraph.io "docker stats"

# Restart containers
ssh subbu@dlt.aurigraph.io "cd /opt/DLT && docker-compose restart"
```

### SSL Certificate Issues

```bash
# Verify certificate exists
ssh subbu@dlt.aurigraph.io "ls -la /etc/letsencrypt/live/aurcrt/"

# Verify certificate in container
ssh subbu@dlt.aurigraph.io "docker exec aurigraph-nginx cat /etc/nginx/certs/fullchain.pem | openssl x509 -text -noout"
```

### Connection Issues

```bash
# Check firewall
ssh subbu@dlt.aurigraph.io "sudo ufw status"

# Check port availability
ssh subbu@dlt.aurigraph.io "sudo ss -tulpn | grep -E ':(80|443)'"

# Restart NGINX
ssh subbu@dlt.aurigraph.io "docker-compose -f /opt/DLT/docker-compose.yml restart nginx-gateway"
```

### Git Repository Issues

```bash
# Check git status
ssh subbu@dlt.aurigraph.io "cd /opt/DLT && git status"

# Fetch latest changes
ssh subbu@dlt.aurigraph.io "cd /opt/DLT && git fetch origin main && git pull origin main"

# Check current branch
ssh subbu@dlt.aurigraph.io "cd /opt/DLT && git branch -v"
```

---

## Post-Deployment Tasks

### 1. Verify All Health Checks

```bash
#!/bin/bash
# Save as health-check.sh

DOMAIN="dlt.aurigraph.io"

echo "Health Check Report for $DOMAIN"
echo "================================="

echo ""
echo "1. API Health:"
curl -s https://$DOMAIN/health | jq . || echo "FAILED"

echo ""
echo "2. Portal Health:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://$DOMAIN/

echo ""
echo "3. Validator 1:"
curl -s https://$DOMAIN/validators/health || echo "FAILED"

echo ""
echo "4. Monitoring:"
curl -s https://$DOMAIN/monitoring/prometheus/health || echo "FAILED"
```

### 2. Configure Monitoring Alerts

```bash
# Access Grafana
# URL: https://dlt.aurigraph.io/monitoring/grafana
# Default credentials: admin / AurigraphSecure123

# Create dashboards for:
# - Container CPU/Memory usage
# - Network I/O
# - Disk usage
# - API response times
# - Transaction throughput
```

### 3. Set Up Log Monitoring

```bash
# View real-time logs
ssh subbu@dlt.aurigraph.io "cd /opt/DLT && docker-compose logs -f"

# View specific service logs
ssh subbu@dlt.aurigraph.io "docker logs -f aurigraph-validator-1"

# Export logs for analysis
ssh subbu@dlt.aurigraph.io "docker logs aurigraph-nginx > /opt/DLT/logs/nginx-backup.log"
```

### 4. Configure Backups

```bash
# Backup validator state volumes
ssh subbu@dlt.aurigraph.io << 'EOF'
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p /opt/backups

# Backup validator-1 state
docker run --rm \
  -v validator-1-state:/data \
  -v /opt/backups:/backup \
  alpine tar czf /backup/validator-1-state-$BACKUP_DATE.tar.gz -C /data .

echo "✓ Backup completed: /opt/backups/validator-1-state-$BACKUP_DATE.tar.gz"
EOF
```

### 5. Schedule Regular Maintenance

```bash
# Create cron job for daily backups
ssh subbu@dlt.aurigraph.io << 'EOF'
# Add to crontab
crontab -e

# Add this line:
0 2 * * * cd /opt/DLT && docker-compose exec -T validator-1 backup.sh >> /var/log/aurigraph-backup.log 2>&1
EOF
```

---

## Docker Compose Configuration

The deployment creates a `docker-compose.yml` file with:

### Services
- **nginx-gateway**: HTTPS reverse proxy (port 443)
- **api-gateway**: REST API service (port 9001)
- **enterprise-portal**: Web UI (port 3000)
- **validator-1, validator-2, validator-3**: Validator nodes
- **business-1**: Business transaction node
- **prometheus**: Metrics collection (port 9090)
- **grafana**: Dashboard visualization (port 3001)

### Volumes
- **validator-1-state, validator-2-state, validator-3-state**: State persistence
- **validator-1-data, validator-2-data, validator-3-data**: Data persistence
- **prometheus-data**: Prometheus metrics storage
- **grafana-data**: Grafana dashboard data

### Network
- **aurigraph-network**: Internal bridge network for container communication

---

## API Endpoints

### Production URLs

| Service | URL |
|---------|-----|
| **API Gateway** | https://dlt.aurigraph.io/api/v4 |
| **Validators** | https://dlt.aurigraph.io/validators |
| **Portal** | https://dlt.aurigraph.io |
| **Monitoring** | https://dlt.aurigraph.io/monitoring |
| **Health Check** | https://dlt.aurigraph.io/health |

### Internal Container Ports

| Service | Port | Container Network |
|---------|------|-------------------|
| API Gateway | 9001 | aurigraph-network |
| Portal | 3000 | aurigraph-network |
| Validator 1 API | 9101 | aurigraph-network |
| Validator 1 Consensus | 9102 | aurigraph-network |
| Validator 2 API | 9111 | aurigraph-network |
| Validator 2 Consensus | 9112 | aurigraph-network |
| Validator 3 API | 9121 | aurigraph-network |
| Validator 3 Consensus | 9122 | aurigraph-network |
| Business Node API | 9201 | aurigraph-network |
| Business Node Consensus | 9202 | aurigraph-network |
| Prometheus | 9090 | aurigraph-network |
| Grafana | 3000 (internal) | aurigraph-network |

---

## SSL Certificate Management

### Certificate Location
```
/etc/letsencrypt/live/aurcrt/
├── fullchain.pem  (copied to /opt/DLT/certs/)
└── privkey.pem    (copied to /opt/DLT/certs/)
```

### Certificate Renewal
```bash
# Let's Encrypt automatic renewal (typically runs daily)
ssh subbu@dlt.aurigraph.io "sudo systemctl status certbot-renew"

# Manual renewal if needed
ssh subbu@dlt.aurigraph.io "sudo certbot renew --quiet"

# Copy renewed certificates to Docker mount points
ssh subbu@dlt.aurigraph.io << 'EOF'
sudo cp /etc/letsencrypt/live/aurcrt/fullchain.pem /opt/DLT/certs/
sudo cp /etc/letsencrypt/live/aurcrt/privkey.pem /opt/DLT/certs/
sudo chown $(whoami):$(whoami) /opt/DLT/certs/*.pem

# Restart NGINX to pick up new certificate
docker-compose -f /opt/DLT/docker-compose.yml restart nginx-gateway
EOF
```

---

## Performance Optimization

### Resource Limits
```yaml
# In docker-compose.yml, add resource limits:
services:
  validator-1:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

### Network Optimization
```bash
# Increase file descriptors
ssh subbu@dlt.aurigraph.io "sudo sysctl -w net.core.somaxconn=65535"

# Increase TCP backlog
ssh subbu@dlt.aurigraph.io "sudo sysctl -w net.ipv4.tcp_max_syn_backlog=65535"

# Enable TCP fast open
ssh subbu@dlt.aurigraph.io "sudo sysctl -w net.ipv4.tcp_fastopen=3"
```

### Storage Optimization
```bash
# Check disk usage
ssh subbu@dlt.aurigraph.io "du -sh /opt/DLT/*"

# Clean up old logs
ssh subbu@dlt.aurigraph.io "find /opt/DLT/logs -name '*.log' -mtime +30 -delete"

# Prune Docker (removes unused images/containers/networks)
ssh subbu@dlt.aurigraph.io "docker system prune -a --volumes"
```

---

## Rollback Procedures

### Rollback to Previous JAR
```bash
ssh subbu@dlt.aurigraph.io << 'EOF'
cd /opt/DLT

# Stop containers
docker-compose down

# Restore from backup
cp /opt/backups/docker-compose-previous.yml docker-compose.yml

# Start with previous version
docker-compose up -d
EOF
```

### Rollback Database State
```bash
ssh subbu@dlt.aurigraph.io << 'EOF'
# List available backups
ls -lh /opt/backups/validator-*-state-*.tar.gz

# Restore backup
docker run --rm \
  -v validator-1-state:/data \
  -v /opt/backups:/backup \
  alpine tar xzf /backup/validator-1-state-20251113_150000.tar.gz -C /data
EOF
```

---

## Support & Escalation

### Logs and Diagnostics
```bash
# Collect logs for support
ssh subbu@dlt.aurigraph.io << 'EOF'
SUPPORT_DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p /tmp/support/$SUPPORT_DATE

# Container logs
docker ps -a | awk 'NR>1 {print $NF}' | xargs -I {} docker logs {} > /tmp/support/$SUPPORT_DATE/{}.log

# System info
docker info > /tmp/support/$SUPPORT_DATE/docker-info.txt
docker-compose config > /tmp/support/$SUPPORT_DATE/docker-compose.txt

# Create archive
tar -czf /tmp/support-$SUPPORT_DATE.tar.gz -C /tmp/support $SUPPORT_DATE

echo "Support bundle: /tmp/support-$SUPPORT_DATE.tar.gz"
EOF
```

### Contact Information
- **Email**: ops@aurigraph.io
- **JIRA**: https://aurigraphdlt.atlassian.net
- **GitHub**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **Slack**: #aurigraph-deployment

---

## Deployment Checklist

- [ ] Server meets minimum requirements (16GB RAM, 200GB storage)
- [ ] SSH access verified: `ssh subbu@dlt.aurigraph.io`
- [ ] SSL certificates exist at `/etc/letsencrypt/live/aurcrt/`
- [ ] Docker and Docker Compose installed on remote
- [ ] Git repository accessible via SSH
- [ ] Backup of existing data created (if applicable)
- [ ] Cleanup script executed successfully
- [ ] Deployment script executed successfully
- [ ] All container health checks passing
- [ ] API endpoints responding
- [ ] Monitoring dashboards accessible
- [ ] Log aggregation configured
- [ ] Backup strategy implemented
- [ ] Runbook documentation updated

---

## Next Steps

1. **Monitor Metrics**: Set up alerting for critical metrics
2. **Test Failover**: Practice container restart procedures
3. **Load Testing**: Validate performance against targets
4. **Security Audit**: Run security audit framework
5. **Documentation**: Update internal wiki/runbooks
6. **Training**: Brief team on new infrastructure
7. **Backup Verification**: Test restore procedures
8. **Compliance**: Verify compliance requirements met

---

**Version**: 4.4.4
**Last Updated**: November 13, 2025
**Deployment Status**: READY FOR PRODUCTION
**Security Level**: Enterprise (NIST Level 5)
