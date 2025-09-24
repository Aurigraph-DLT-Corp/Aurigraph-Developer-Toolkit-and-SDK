# Aurex Platform - Production Domain Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Aurex Platform to the production domain `dev.aurigraph.io` with SSL certificates, proper security configuration, and comprehensive monitoring.

## Architecture

The Aurex Platform consists of 6 interconnected applications:

- **Main Platform** (`dev.aurigraph.io`) - Landing page and core platform
- **Launchpad** (`launchpad.aurigraph.io`) - ESG assessment and reporting
- **API Gateway** (`api.aurigraph.io`) - Centralized API access
- **Monitoring** (`monitoring.aurigraph.io`) - Grafana and Prometheus dashboards
- **HydroPulse** - Water management (via API routes)
- **SylvaGraph** - Forest management (via API routes)
- **CarbonTrace** - Carbon footprint tracking (via API routes)
- **Admin** - Administrative dashboard (via API routes)

## Prerequisites

### System Requirements

- **OS**: Ubuntu 20.04+ or similar Linux distribution
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Disk**: Minimum 20GB free space
- **CPU**: 2+ cores recommended
- **Network**: Public IP address with ports 80 and 443 accessible

### Software Requirements

- Docker 20.10+
- Docker Compose 2.0+
- curl
- openssl
- bc (basic calculator)

### Domain Requirements

- Domain ownership of `aurigraph.io`
- DNS management access
- SSL certificate capability (Let's Encrypt compatible)

## Pre-Deployment Setup

### 1. DNS Configuration

Configure the following DNS A records to point to your server's IP address:

```bash
dev.aurigraph.io        → YOUR_SERVER_IP
api.aurigraph.io        → YOUR_SERVER_IP
launchpad.aurigraph.io  → YOUR_SERVER_IP
monitoring.aurigraph.io → YOUR_SERVER_IP
*.aurigraph.io          → YOUR_SERVER_IP  (optional wildcard)
```

### 2. Firewall Configuration

Ensure the following ports are open:

```bash
# HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# SSH (if needed)
sudo ufw allow 22/tcp

# Internal Docker networking (if required)
sudo ufw allow from 172.16.0.0/12
sudo ufw allow from 10.0.0.0/8
sudo ufw allow from 192.168.0.0/16
```

### 3. Environment Validation

Verify your system meets the requirements:

```bash
# Check Docker
docker --version
docker-compose --version

# Check available resources
free -h
df -h /
```

## Deployment Steps

### Step 1: Initial System Preparation

1. **Clone and Navigate to Project**:
   ```bash
   cd /Users/yogesh/00_MyCode/04_Aurigraph/04_aurex-trace-platform/aurex-trace-platform
   ```

2. **Verify Configuration Files**:
   ```bash
   # Check if all required files exist
   ls -la docker-compose.production.yml
   ls -la .env.production
   ls -la 03_Infrastructure/nginx/nginx.conf
   ```

3. **Review Environment Configuration**:
   ```bash
   # Edit production environment variables if needed
   nano .env.production
   ```

### Step 2: Deploy the Application Stack

Run the comprehensive deployment script:

```bash
./scripts/deploy-production-domain.sh
```

This script will:
- ✅ Check all prerequisites
- ✅ Stop any existing containers
- ✅ Build fresh Docker images
- ✅ Deploy all services
- ✅ Wait for services to be ready
- ✅ Perform initial health checks
- ✅ Test basic connectivity

### Step 3: SSL Certificate Setup

After the application is running with dummy certificates, set up real SSL certificates:

```bash
./scripts/setup-ssl-certificates.sh
```

This script will:
- ✅ Generate DH parameters for enhanced security
- ✅ Create initial dummy certificates
- ✅ Request real certificates from Let's Encrypt
- ✅ Configure automatic certificate renewal
- ✅ Reload nginx with proper certificates

**Important**: Ensure DNS records are properly configured before running this script!

### Step 4: Comprehensive Verification

Verify the deployment with the comprehensive test suite:

```bash
./scripts/verify-domain-deployment.sh
```

This will test:
- ✅ Docker service health
- ✅ Internal connectivity (database, cache, APIs)
- ✅ SSL certificate validity
- ✅ Domain resolution
- ✅ HTTP to HTTPS redirects
- ✅ HTTPS functionality
- ✅ API endpoint accessibility
- ✅ Security headers
- ✅ Performance metrics

## Manual Testing

### 1. Web Interface Testing

Test each domain in your browser:

- **Main Platform**: https://dev.aurigraph.io
- **Launchpad**: https://launchpad.aurigraph.io
- **Monitoring**: https://monitoring.aurigraph.io

### 2. API Testing

Test API endpoints:

```bash
# Platform API health
curl -i https://api.aurigraph.io/platform/health

# Launchpad API health
curl -i https://api.aurigraph.io/launchpad/health

# Check HTTPS redirect
curl -i http://dev.aurigraph.io
```

### 3. SSL Certificate Verification

```bash
# Check certificate details
openssl s_client -connect dev.aurigraph.io:443 -servername dev.aurigraph.io

# Check certificate expiry
echo | openssl s_client -connect dev.aurigraph.io:443 -servername dev.aurigraph.io 2>/dev/null | openssl x509 -noout -dates
```

## Monitoring and Maintenance

### 1. Service Monitoring

```bash
# View all running containers
docker-compose -f docker-compose.production.yml ps

# View logs for all services
docker-compose -f docker-compose.production.yml logs -f

# View logs for specific service
docker-compose -f docker-compose.production.yml logs -f nginx
```

### 2. SSL Certificate Renewal

Set up automatic certificate renewal in crontab:

```bash
# Edit crontab
crontab -e

# Add renewal job (runs twice daily)
0 0,12 * * * /path/to/aurex-trace-platform/scripts/renew-certificates.sh
```

### 3. System Health Checks

Regular health verification:

```bash
# Quick health check
./scripts/verify-domain-deployment.sh

# Manual container health check
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## Troubleshooting

### Common Issues and Solutions

#### 1. DNS Resolution Issues

**Problem**: Domain not resolving
**Solution**:
```bash
# Check DNS propagation
nslookup dev.aurigraph.io
dig dev.aurigraph.io

# Wait for DNS propagation (can take up to 48 hours)
```

#### 2. SSL Certificate Issues

**Problem**: Certificate generation fails
**Solution**:
```bash
# Check if port 80 is accessible
curl -I http://dev.aurigraph.io/.well-known/acme-challenge/test

# Check Let's Encrypt rate limits
# Try using staging environment first
```

#### 3. Container Startup Issues

**Problem**: Services not starting
**Solution**:
```bash
# Check container logs
docker-compose -f docker-compose.production.yml logs [service-name]

# Check resource usage
docker stats

# Restart specific service
docker-compose -f docker-compose.production.yml restart [service-name]
```

#### 4. Database Connection Issues

**Problem**: Applications can't connect to database
**Solution**:
```bash
# Test database connectivity
docker exec aurex-postgres-production pg_isready -U aurex_staging

# Check database logs
docker-compose -f docker-compose.production.yml logs postgres

# Verify environment variables
docker exec aurex-platform-backend-container env | grep DATABASE_URL
```

### Emergency Procedures

#### 1. Quick Rollback

```bash
# Stop all services
docker-compose -f docker-compose.production.yml down

# Remove problematic containers
docker container prune -f

# Restart with fresh deployment
./scripts/deploy-production-domain.sh
```

#### 2. Service Recovery

```bash
# Restart individual service
docker-compose -f docker-compose.production.yml restart nginx

# Force recreate service
docker-compose -f docker-compose.production.yml up -d --force-recreate nginx
```

## Security Considerations

### 1. Environment Variables

- ✅ Never commit `.env.production` to version control
- ✅ Use strong passwords for database and Redis
- ✅ Rotate secrets regularly
- ✅ Limit access to production environment

### 2. Network Security

- ✅ Configure firewall properly
- ✅ Use HTTPS everywhere
- ✅ Enable HSTS headers
- ✅ Configure CSP headers appropriately

### 3. Monitoring and Alerting

- ✅ Monitor certificate expiry
- ✅ Set up disk space alerts
- ✅ Monitor application health
- ✅ Review access logs regularly

## Performance Optimization

### 1. Nginx Tuning

The nginx configuration includes:
- ✅ Gzip compression
- ✅ HTTP/2 support
- ✅ SSL session caching
- ✅ Rate limiting
- ✅ Connection keep-alive

### 2. Database Optimization

- ✅ Connection pooling configured
- ✅ Async drivers for better performance
- ✅ Proper indexing in place
- ✅ Regular maintenance scheduled

### 3. Caching Strategy

- ✅ Redis caching for sessions and data
- ✅ Browser caching headers
- ✅ Nginx proxy caching
- ✅ Application-level caching

## Backup and Recovery

### 1. Database Backup

```bash
# Manual backup
docker exec aurex-postgres-production pg_dumpall -U postgres > backup-$(date +%Y%m%d).sql

# Automated backup script available at:
./scripts/backup-databases.sh
```

### 2. SSL Certificate Backup

```bash
# Backup SSL certificates
tar -czf ssl-backup-$(date +%Y%m%d).tar.gz ssl/
```

### 3. Configuration Backup

```bash
# Backup all configuration
tar -czf config-backup-$(date +%Y%m%d).tar.gz \
  .env.production \
  docker-compose.production.yml \
  03_Infrastructure/nginx/
```

## Support and Contacts

- **Technical Support**: Refer to project documentation
- **Emergency Contact**: System Administrator
- **SSL Issues**: Let's Encrypt documentation
- **DNS Issues**: Domain registrar support

## Appendix

### A. Port Allocation

| Service | Internal Port | External Port | Access |
|---------|---------------|---------------|---------|
| Nginx | 80, 443 | 80, 443 | Public |
| Platform Frontend | 3000 | - | Internal |
| Platform Backend | 8000 | - | Internal |
| Launchpad Frontend | 3001 | - | Internal |
| Launchpad Backend | 8001 | - | Internal |
| PostgreSQL | 5432 | - | Internal |
| Redis | 6379 | - | Internal |
| Prometheus | 9090 | - | Internal |
| Grafana | 3000 | - | Internal |

### B. File Locations

- **Nginx Config**: `/Users/yogesh/00_MyCode/04_Aurigraph/04_aurex-trace-platform/aurex-trace-platform/03_Infrastructure/nginx/nginx.conf`
- **SSL Certificates**: `/Users/yogesh/00_MyCode/04_Aurigraph/04_aurex-trace-platform/aurex-trace-platform/ssl/certbot/conf/`
- **Environment File**: `/Users/yogesh/00_MyCode/04_Aurigraph/04_aurex-trace-platform/aurex-trace-platform/.env.production`
- **Docker Compose**: `/Users/yogesh/00_MyCode/04_Aurigraph/04_aurex-trace-platform/aurex-trace-platform/docker-compose.production.yml`
- **Deployment Scripts**: `/Users/yogesh/00_MyCode/04_Aurigraph/04_aurex-trace-platform/aurex-trace-platform/scripts/`

---

**Deployment Date**: $(date)  
**Version**: Production v1.0  
**Environment**: dev.aurigraph.io