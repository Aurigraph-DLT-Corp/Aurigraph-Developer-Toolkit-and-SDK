# AUREX PLATFORM - DevOps Deployment Guide

## Executive Summary

This comprehensive guide provides step-by-step instructions for deploying the Aurex Platform (Release 3.3) to production environments. The platform represents $15M+ ARR potential with patent-pending Carbon Maturity Navigator™ technology and complete ESG compliance suite.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Deployment Task List](#deployment-task-list)
5. [Step-by-Step Instructions](#step-by-step-instructions)
6. [Monitoring & Validation](#monitoring--validation)
7. [Troubleshooting](#troubleshooting)
8. [Post-Deployment Tasks](#post-deployment-tasks)

## Architecture Overview

### Platform Components
- **6 Main Applications**: Platform, Launchpad (Priority 1), HydroPulse, Sylvagraph, CarbonTrace, Admin
- **Infrastructure**: PostgreSQL, Redis, Nginx, Prometheus, Grafana
- **Deployment Model**: Containerized microservices with Docker Compose
- **Network Architecture**: Multi-tier with frontend, backend, database, and monitoring networks

### Port Allocation (Standardized)
```
Frontend Applications:
- aurex-platform:     Port 3000
- aurex-launchpad:    Port 3001 (Priority 1)
- aurex-hydropulse:   Port 3002
- aurex-sylvagraph:   Port 3003
- aurex-carbontrace:  Port 3004
- aurex-admin:        Port 3005

Backend APIs:
- platform-api:      Port 8000
- launchpad-api:      Port 8001 (Priority 1)
- hydropulse-api:     Port 8002
- sylvagraph-api:     Port 8003
- carbontrace-api:    Port 8004
- admin-api:          Port 8005

Infrastructure:
- PostgreSQL:         Port 5432
- Redis:              Port 6379
- Prometheus:         Port 9090
- Grafana:            Port 3006
```

## Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ or RHEL 8+
- **CPU**: Minimum 8 cores (16 cores recommended)
- **RAM**: Minimum 16GB (32GB recommended)
- **Storage**: 100GB+ SSD with 30GB+ available space
- **Network**: High-speed internet with static IP

### Software Requirements
- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Git**: Version 2.25+
- **SSH Access**: Password or key-based authentication
- **SSL Certificates**: For HTTPS (Let's Encrypt recommended)

### Access Requirements
- **SSH Credentials**: Username, password/key, port (usually 22 or 2224)
- **Domain**: Configured DNS pointing to server IP
- **Firewall**: Ports 80, 443, and application ports accessible

## Pre-Deployment Checklist

### ✅ Infrastructure Verification
- [ ] Server is accessible via SSH
- [ ] Server has sufficient resources (CPU, RAM, Storage)
- [ ] Docker and Docker Compose are installed
- [ ] Domain DNS is configured correctly
- [ ] Firewall rules allow necessary ports
- [ ] Backup strategy is in place

### ✅ Code Preparation
- [ ] Latest code is pulled from repository
- [ ] All Docker files are present and valid
- [ ] Environment configurations are prepared
- [ ] Database migration scripts are ready
- [ ] SSL certificate configuration is prepared

### ✅ Security Preparation
- [ ] Production credentials are generated
- [ ] Environment variables are secured
- [ ] SSL certificates are obtained
- [ ] Security headers are configured
- [ ] Rate limiting rules are defined

## Deployment Task List

### Phase 1: Environment Preparation (30 minutes)
1. **Connect to Server**
   - [ ] Test SSH connectivity
   - [ ] Verify user permissions
   - [ ] Check system resources

2. **Install Dependencies**
   - [ ] Update system packages
   - [ ] Install Docker
   - [ ] Install Docker Compose
   - [ ] Configure Docker daemon

3. **Create Directory Structure**
   - [ ] Create deployment directories
   - [ ] Set proper permissions
   - [ ] Create backup directories

### Phase 2: Application Deployment (45 minutes)
4. **Transfer Application Files**
   - [ ] Create deployment package
   - [ ] Transfer to server
   - [ ] Extract files
   - [ ] Verify file integrity

5. **Configure Environment**
   - [ ] Set production environment variables
   - [ ] Configure database credentials
   - [ ] Set up SSL certificates
   - [ ] Configure monitoring

6. **Deploy Infrastructure Services**
   - [ ] Start PostgreSQL database
   - [ ] Start Redis cache
   - [ ] Verify infrastructure health
   - [ ] Initialize database schemas

### Phase 3: Application Services (60 minutes)
7. **Deploy Backend Services**
   - [ ] Build backend containers
   - [ ] Start platform API (Port 8000)
   - [ ] Start launchpad API (Port 8001) - Priority 1
   - [ ] Start remaining APIs
   - [ ] Verify backend health

8. **Deploy Frontend Applications**
   - [ ] Build frontend containers
   - [ ] Start platform frontend (Port 3000)
   - [ ] Start launchpad frontend (Port 3001) - Priority 1
   - [ ] Start remaining frontends
   - [ ] Verify frontend accessibility

9. **Configure Load Balancer**
   - [ ] Start Nginx reverse proxy
   - [ ] Configure domain routing
   - [ ] Set up SSL termination
   - [ ] Test load balancing

### Phase 4: Monitoring & Security (30 minutes)
10. **Deploy Monitoring Stack**
    - [ ] Start Prometheus (Port 9090)
    - [ ] Start Grafana (Port 3006)
    - [ ] Configure data sources
    - [ ] Import dashboards

11. **Security Hardening**
    - [ ] Configure SSL/TLS
    - [ ] Set up security headers
    - [ ] Enable rate limiting
    - [ ] Configure firewall rules

12. **Final Validation**
    - [ ] Test all application endpoints
    - [ ] Verify monitoring dashboards
    - [ ] Check security configurations
    - [ ] Perform load testing

## Step-by-Step Instructions

### Step 1: Server Connection and Preparation

```bash
# Test SSH connection
ssh -p 2224 yogesh@dev.aurigraph.io "echo 'Connection successful'"

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

### Step 2: File Transfer and Environment Setup

```bash
# Create deployment directory
mkdir -p /opt/aurex-platform
cd /opt/aurex-platform

# Transfer deployment package (from local machine)
scp -P 2224 aurex-deployment.tar.gz yogesh@dev.aurigraph.io:/opt/aurex-platform/

# Extract files
tar -xzf aurex-deployment.tar.gz

# Set up environment
cp .env.production .env
chmod 600 .env
```

### Step 3: Infrastructure Deployment

```bash
# Start infrastructure services
docker-compose -f docker-compose.production.yml up -d postgres redis

# Wait for services to be ready
sleep 30

# Check service health
docker-compose -f docker-compose.production.yml ps
```

### Step 4: Application Deployment

```bash
# Start backend services
docker-compose -f docker-compose.production.yml up -d \
    aurex-platform-backend \
    aurex-launchpad-backend \
    aurex-hydropulse-backend

# Wait for backends
sleep 60

# Start frontend services
docker-compose -f docker-compose.production.yml up -d \
    aurex-platform-frontend \
    aurex-launchpad-frontend \
    aurex-hydropulse-frontend

# Start monitoring
docker-compose -f docker-compose.production.yml up -d prometheus grafana

# Start load balancer
docker-compose -f docker-compose.production.yml up -d nginx
```

### Step 5: SSL Certificate Configuration

```bash
# Request SSL certificates
docker-compose -f docker-compose.production.yml run --rm certbot

# Reload Nginx with SSL
docker-compose -f docker-compose.production.yml exec nginx nginx -s reload
```

## Monitoring & Validation

### Health Check Endpoints
```bash
# Test all service endpoints
curl -f http://dev.aurigraph.io:8000/health  # Platform API
curl -f http://dev.aurigraph.io:8001/health  # Launchpad API
curl -f http://dev.aurigraph.io:3000         # Platform Frontend
curl -f http://dev.aurigraph.io:3001         # Launchpad Frontend
curl -f http://dev.aurigraph.io:9090/-/healthy  # Prometheus
curl -f http://dev.aurigraph.io:3006/api/health # Grafana
```

### Container Status Verification
```bash
# Check all containers
docker-compose -f docker-compose.production.yml ps

# Check resource usage
docker stats --no-stream

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### Performance Monitoring
- **Grafana Dashboard**: http://dev.aurigraph.io:3006
- **Prometheus Metrics**: http://dev.aurigraph.io:9090
- **Application Metrics**: Built into each service

## Troubleshooting

### Common Issues and Solutions

#### 1. Container Start Failures
```bash
# Check container logs
docker-compose -f docker-compose.production.yml logs [service-name]

# Restart specific service
docker-compose -f docker-compose.production.yml restart [service-name]

# Check resource usage
docker system df
docker system prune -f
```

#### 2. Database Connection Issues
```bash
# Check database status
docker-compose -f docker-compose.production.yml exec postgres pg_isready

# Test database connection
docker-compose -f docker-compose.production.yml exec postgres psql -U aurex_staging -d aurex_platform_staging -c "SELECT 1;"

# Reset database
docker-compose -f docker-compose.production.yml restart postgres
```

#### 3. Network Connectivity Issues
```bash
# Check network configuration
docker network ls
docker network inspect aurex-backend-prod

# Test inter-container connectivity
docker-compose -f docker-compose.production.yml exec aurex-platform-backend ping postgres
```

#### 4. SSL Certificate Issues
```bash
# Check certificate status
docker-compose -f docker-compose.production.yml exec certbot certbot certificates

# Renew certificates
docker-compose -f docker-compose.production.yml run --rm certbot certbot renew

# Test SSL configuration
openssl s_client -connect dev.aurigraph.io:443 -servername dev.aurigraph.io
```

### Performance Optimization

#### Resource Scaling
```bash
# Scale backend services
docker-compose -f docker-compose.production.yml up -d --scale aurex-launchpad-backend=3

# Monitor resource usage
docker stats

# Adjust resource limits in docker-compose.yml
```

#### Database Optimization
```bash
# Database performance tuning
docker-compose -f docker-compose.production.yml exec postgres psql -U aurex_staging -c "
    ALTER SYSTEM SET shared_buffers = '512MB';
    ALTER SYSTEM SET effective_cache_size = '2GB';
    ALTER SYSTEM SET work_mem = '8MB';
"

# Restart to apply changes
docker-compose -f docker-compose.production.yml restart postgres
```

## Post-Deployment Tasks

### Security Hardening
1. **Change Default Passwords**
   ```bash
   # Update production passwords
   # Rotate JWT secrets
   # Update database credentials
   ```

2. **Configure Backup Strategy**
   ```bash
   # Set up automated database backups
   # Configure file system backups
   # Test restore procedures
   ```

3. **Set Up Monitoring Alerts**
   ```bash
   # Configure Prometheus alerting rules
   # Set up Grafana notifications
   # Test alert delivery
   ```

### Maintenance Procedures
1. **Log Rotation**
   ```bash
   # Configure logrotate for Docker logs
   sudo tee /etc/logrotate.d/docker > /dev/null <<EOF
   /var/lib/docker/containers/*/*.log {
       daily
       missingok
       rotate 30
       compress
       notifempty
   }
   EOF
   ```

2. **System Updates**
   ```bash
   # Regular system updates
   sudo apt-get update && sudo apt-get upgrade -y
   
   # Docker image updates
   docker-compose -f docker-compose.production.yml pull
   docker-compose -f docker-compose.production.yml up -d
   ```

3. **Database Maintenance**
   ```bash
   # Database vacuum and analyze
   docker-compose -f docker-compose.production.yml exec postgres psql -U aurex_staging -d aurex_platform_staging -c "VACUUM ANALYZE;"
   
   # Check database statistics
   docker-compose -f docker-compose.production.yml exec postgres psql -U aurex_staging -d aurex_platform_staging -c "SELECT * FROM pg_stat_database;"
   ```

## Success Criteria

### Deployment Complete When:
- ✅ All 12 containers are running and healthy
- ✅ All service endpoints respond correctly
- ✅ Database schemas are initialized
- ✅ SSL certificates are active
- ✅ Monitoring dashboards are accessible
- ✅ Load balancer is routing traffic correctly
- ✅ Security configurations are applied
- ✅ Performance metrics are within acceptable ranges

### Key Performance Indicators:
- **Response Time**: < 2 seconds for frontend pages
- **API Latency**: < 500ms for backend endpoints
- **Database Performance**: < 100ms for typical queries
- **Memory Usage**: < 80% of available RAM
- **CPU Usage**: < 70% under normal load
- **Disk Usage**: < 80% of available storage

## Contact Information

### Deployment Support:
- **DevOps Team**: devops@aurigraph.com
- **Engineering Manager**: em@aurigraph.com
- **Platform Team**: platform@aurigraph.com

### Emergency Contacts:
- **On-Call Engineer**: +1-xxx-xxx-xxxx
- **System Administrator**: admin@aurigraph.com
- **Security Team**: security@aurigraph.com

---

## Document Information
- **Version**: 1.0
- **Last Updated**: August 8, 2025
- **Author**: DevOps Engineering Team
- **Review**: Engineering Management
- **Approval**: CTO Office

**NOTE**: This document contains production deployment procedures. Ensure all security protocols are followed and proper authorization is obtained before executing deployment commands.