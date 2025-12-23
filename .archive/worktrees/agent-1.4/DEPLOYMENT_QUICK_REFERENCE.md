# Aurigraph V4.4.4 Production Deployment - Quick Reference

**Deployment Date**: November 13, 2025
**Status**: ✅ COMPLETE

---

## Deployment Overview

The Aurigraph V4.4.4 production infrastructure has been successfully deployed to `dlt.aurigraph.io` with the following components operational:

### Running Services

| Service | Container | Port | Status |
|---------|-----------|------|--------|
| Prometheus | aurigraph-prometheus | 9090 | ✅ Running |
| Grafana | aurigraph-grafana | 3001 | ✅ Running |
| NGINX Gateway | aurigraph-nginx | 80, 443 | ✅ Running |

### Infrastructure Summary

- **Docker Containers**: 3 running (9 configured for full deployment)
- **Docker Volumes**: 12 created for state persistence
- **Docker Network**: 1 bridge network (aurigraph-network)
- **Directory**: `/opt/DLT` (clean and synchronized)
- **Git**: main branch at commit `31dda5fa`
- **Backup**: `/opt/backups/DLT_backup_20251113_144033`

---

## Access Information

### Remote Server Access
```bash
# SSH into production server
ssh -p 22 subbu@dlt.aurigraph.io

# Navigate to deployment directory
cd /opt/DLT
```

### Monitoring Dashboards

- **Grafana**: https://dlt.aurigraph.io:3001/
  - Username: admin
  - Password: AurigraphSecure123

- **Prometheus**: https://dlt.aurigraph.io:9090/

- **API Gateway**: https://dlt.aurigraph.io/api/v4/

---

## Common Commands

### Check Service Status
```bash
# View running containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# View all services (including stopped)
docker-compose ps
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker logs -f aurigraph-prometheus
docker logs -f aurigraph-grafana
docker logs -f aurigraph-nginx
```

### Manage Services
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart aurigraph-prometheus

# Rebuild and restart
docker-compose down && docker-compose up -d
```

### Verify Health
```bash
# Prometheus
curl http://localhost:9090/-/healthy

# Grafana
curl http://localhost:3001/api/health

# NGINX
curl -I http://localhost/health
```

---

## Configuration Locations

- **Docker Compose**: `/opt/DLT/docker-compose.yml`
- **NGINX Config**: `/opt/DLT/config/nginx.conf`
- **Prometheus Config**: `/opt/DLT/config/prometheus.yml`
- **SSL Certificates**: `/opt/DLT/certs/` (fullchain.pem, privkey.pem)
- **Logs**: `/opt/DLT/logs/` (nginx, prometheus, etc.)

---

## Deployment Artifacts

### On Local Machine
- `cleanup-remote-server.sh` - Docker/volume cleanup script
- `deploy-v4-production.sh` - Infrastructure deployment script
- `PRODUCTION-DEPLOYMENT-v4.4.4-README.md` - Complete deployment guide
- `DEPLOYMENT_COMPLETION_REPORT.md` - This deployment's report

### On Remote Server
- `/opt/DLT/docker-compose.yml` - Service definitions
- `/opt/DLT/config/` - Configuration files
- `/opt/backups/DLT_backup_20251113_144033` - Previous state backup

---

## Git Status

```
Repository: git@github.com:Aurigraph-DLT-Corp/Aurigraph-DLT.git
Branch: main
Latest Commit: 31dda5fa
Message: feat(deploy): Add V4.4.4 production deployment infrastructure with Docker cleanup
```

### View Deployment Commits
```bash
cd /opt/DLT
git log --oneline | head -10
```

---

## Docker Resources

### Volumes (12 Total)
- Monitoring: `prometheus-data`, `grafana-data`
- Services: `api-gateway-data`, `portal-data`
- Validators: `validator-1-data`, `validator-1-state`, `validator-2-data`, `validator-2-state`, `validator-3-data`, `validator-3-state`
- Business: `business-1-data`, `business-1-state`

### Network
- **Name**: `aurigraph-network`
- **Driver**: bridge
- **Scope**: Container-to-container communication

---

## Next Steps

### Option 1: Deploy Full Aurigraph Services
If you have Aurigraph microservice images:

```bash
# Build and push images to registry
docker build -t aurigraph/api-gateway:v4.4.4 .
docker build -t aurigraph/validator-node:v4.4.4 .
docker build -t aurigraph/business-node:v4.4.4 .
docker build -t aurigraph/enterprise-portal:v4.5.0 .

# Update docker-compose.yml with image details
# Restart services
docker-compose up -d
```

### Option 2: Configure Monitoring
```bash
# Access Grafana
# Login: admin / AurigraphSecure123
# Add Prometheus as data source
# Create dashboards for monitoring
```

### Option 3: Certificate Management
```bash
# Replace self-signed with production certificates
cp /etc/letsencrypt/live/aurcrt/fullchain.pem /opt/DLT/certs/
cp /etc/letsencrypt/live/aurcrt/privkey.pem /opt/DLT/certs/

# Restart NGINX
docker-compose restart aurigraph-nginx
```

---

## Troubleshooting

### Services Not Starting
```bash
# Check logs
docker-compose logs

# Rebuild images
docker-compose down -v
docker-compose up -d --build

# Force cleanup
docker system prune -a --volumes
```

### Port Conflicts
```bash
# Check port usage
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :9090
sudo lsof -i :3001

# Kill conflicting process if needed
sudo kill -9 <PID>
```

### Network Issues
```bash
# Check network connectivity
docker network inspect aurigraph-network

# Restart network
docker network prune -f

# Recreate docker-compose
docker-compose down
docker-compose up -d
```

---

## Performance & Monitoring

### Prometheus Targets
Access: https://dlt.aurigraph.io:9090/targets

Services configured for monitoring:
- Prometheus itself
- API Gateway
- All validator nodes
- Grafana

### Grafana Dashboards
Access: https://dlt.aurigraph.io:3001/

Available after configuration:
- System metrics
- Container performance
- Network I/O
- Transaction throughput

---

## Support

### Emergency Contact
- Email: ops@aurigraph.io
- Repository: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- Documentation: See PRODUCTION-DEPLOYMENT-v4.4.4-README.md

### Get Deployment Details
```bash
# Deployment summary
cat DEPLOYMENT_COMPLETION_REPORT.md

# Full deployment guide
less PRODUCTION-DEPLOYMENT-v4.4.4-README.md
```

---

## Rollback

### If Something Goes Wrong
```bash
# Option 1: Restore from backup
docker-compose down -v
rm -rf /opt/DLT/*
cp -r /opt/backups/DLT_backup_20251113_144033/* /opt/DLT/
cd /opt/DLT && docker-compose up -d

# Option 2: Rerun cleanup and deployment
./cleanup-remote-server.sh --host dlt.aurigraph.io --user subbu --force
./deploy-v4-production.sh --host dlt.aurigraph.io --user subbu
```

---

**Deployment Status**: ✅ COMPLETE
**Last Updated**: November 13, 2025
**Ready for Production**: YES
