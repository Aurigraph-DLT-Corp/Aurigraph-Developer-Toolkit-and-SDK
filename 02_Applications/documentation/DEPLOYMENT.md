# Aurex Platform - Streamlined Deployment Guide

## 🚀 Overview

The Aurex Platform deployment has been consolidated from **43 deployment files** into **exactly 2 streamlined scripts** for maximum simplicity and reliability.

## 📁 File Structure

```
aurex-trace-platform/
├── scripts/
│   ├── deploy-local.sh           # Local development deployment
│   ├── deploy-production.sh      # Production deployment
│   ├── init-databases.sh         # Database initialization
│   └── cleanup-old-deployments.sh # Cleanup script (run once)
├── docker-compose.local.yml      # Local development configuration
├── docker-compose.production.yml # Production configuration
├── nginx/
│   ├── nginx.conf                # Main nginx configuration
│   ├── conf.d/production.conf    # Production server blocks
│   └── local.conf                # Local development configuration
└── logs/                         # Deployment logs
```

## 🛠️ Prerequisites

### Local Development
- Docker Desktop
- Docker Compose
- Git
- Node.js (for development)

### Production Deployment
- Docker
- Docker Compose
- Git
- sshpass
- rsync
- SSH access to production server

## 🏠 Local Development Deployment

### Quick Start
```bash
# Deploy locally with hot-reload
./scripts/deploy-local.sh
```

### What It Does
- ✅ Builds fresh Docker images with local version tags
- ✅ Deploys all 4 applications (Platform, Launchpad, HydroPulse, Sylvagraph)
- ✅ Sets up PostgreSQL with multiple databases
- ✅ Configures Redis for caching
- ✅ Enables hot-reload for development
- ✅ Provides health checks and validation

### Access URLs
- **Main Platform**: http://localhost/
- **Launchpad**: http://localhost/Launchpad
- **HydroPulse**: http://localhost/Hydropulse
- **Sylvagraph**: http://localhost/Sylvagraph
- **CarbonTrace**: http://localhost/Carbontrace
- **Admin**: http://localhost/AurexAdmin

### Development Features
- 🔄 **Hot Reload**: Source code changes reflect immediately
- 📁 **Volume Mounting**: Live editing without rebuilds
- 🐛 **Debug Logging**: Comprehensive logging for troubleshooting
- 🔍 **Health Monitoring**: Automatic health checks

## 🌐 Production Deployment

### Quick Start
```bash
# Deploy to production server
./scripts/deploy-production.sh
```

### What It Does
- ✅ Creates automatic backups before deployment
- ✅ Builds production-optimized Docker images
- ✅ Syncs code to production server (dev.aurigraph.io)
- ✅ Deploys with zero-downtime strategy
- ✅ Configures SSL/HTTPS with nginx reverse proxy
- ✅ Implements health checks and monitoring
- ✅ Provides rollback capability on failure

### Production URLs
- **Main Platform**: https://dev.aurigraph.io/
- **Launchpad**: https://dev.aurigraph.io/launchpad
- **HydroPulse**: https://dev.aurigraph.io/hydropulse
- **Sylvagraph**: https://dev.aurigraph.io/sylvagraph

### Production Features
- 🔒 **SSL/HTTPS**: Automatic SSL certificate management
- 🔄 **Zero Downtime**: Rolling deployment strategy
- 💾 **Auto Backup**: Database and configuration backups
- 📊 **Monitoring**: Prometheus and Grafana integration
- 🛡️ **Security**: Enterprise-grade security headers
- 🔙 **Rollback**: Automatic rollback on deployment failure

## 🔧 Configuration

### Environment Variables

#### Local Development
```bash
# Database
POSTGRES_PASSWORD=postgres123
REDIS_PASSWORD=redis123

# Applications
ENVIRONMENT=local
DEBUG=true
```

#### Production
```bash
# Database
POSTGRES_PASSWORD=AurexProd2025!
REDIS_PASSWORD=AurexRedis2025!

# Applications
ENVIRONMENT=production
SECRET_KEY=aurex-platform-secret-key-production

# Monitoring
GRAFANA_PASSWORD=AurexGrafana2025!

# SSL
SSL_EMAIL=admin@aurigraph.com
```

### Version Management

Both scripts automatically generate version tags:
- **Local**: `local-v20250810-123456-abc1234`
- **Production**: `production-v20250810-123456-abc1234`

Format: `{environment}-v{timestamp}-{git-commit}`

## 📊 Application Architecture

### 4 Core Applications
1. **Aurex Platform** - Main homepage and central hub
2. **Aurex Launchpad** - ESG assessment tools (3 premium services)
3. **Aurex HydroPulse** - AWD project management
4. **Aurex Sylvagraph** - Agroforestry monitoring

### Infrastructure Services
- **PostgreSQL** - Multi-database setup (one per application)
- **Redis** - Caching and session management
- **Nginx** - Reverse proxy and SSL termination
- **Prometheus** - Metrics collection
- **Grafana** - Monitoring dashboards

## 🔍 Troubleshooting

### Check Deployment Status
```bash
# Local
docker-compose -f docker-compose.local.yml ps

# Production (on server)
docker-compose -f docker-compose.production.yml ps
```

### View Logs
```bash
# Local
docker-compose -f docker-compose.local.yml logs -f

# Production (on server)
docker-compose -f docker-compose.production.yml logs -f
```

### Health Checks
```bash
# Local
curl http://localhost/health

# Production
curl https://dev.aurigraph.io/health
```

### Common Issues

#### 1. Port Conflicts (Local)
```bash
# Stop conflicting services
docker-compose -f docker-compose.local.yml down
sudo lsof -i :80 # Check what's using port 80
```

#### 2. SSL Issues (Production)
```bash
# Check SSL certificates
openssl s_client -connect dev.aurigraph.io:443 -servername dev.aurigraph.io
```

#### 3. Database Connection Issues
```bash
# Check database logs
docker logs aurex-postgres-production
docker logs aurex-postgres-local
```

## 🔄 Rollback Procedure

### Automatic Rollback
The production script automatically rolls back on failure using the backup created before deployment.

### Manual Rollback
```bash
# SSH to production server
ssh -p 2224 yogesh@dev.aurigraph.io

# List available backups
ls -la /opt/aurex-platform/backups/

# Restore specific backup
docker exec aurex-postgres-production psql -U postgres < /opt/aurex-platform/backups/backup-YYYYMMDD-HHMMSS-database.sql
```

## 📈 Monitoring

### Production Monitoring
- **Prometheus**: http://dev.aurigraph.io:9090 (internal)
- **Grafana**: http://dev.aurigraph.io:3006 (internal)
- **Application Logs**: Centralized logging with retention

### Key Metrics
- Application response times
- Database performance
- Container health status
- SSL certificate expiry
- Disk usage and backups

## 🔐 Security

### Production Security Features
- SSL/TLS encryption (Let's Encrypt)
- Security headers (HSTS, CSP, etc.)
- Rate limiting on API endpoints
- Network isolation between services
- Regular security updates

### Access Control
- SSH key-based authentication
- Internal service communication only
- Firewall rules for external access
- Database user isolation

## 📞 Support

### Deployment Logs
All deployment activities are logged to:
- **Local**: `logs/deploy-local-YYYYMMDD-HHMMSS.log`
- **Production**: `logs/deploy-production-YYYYMMDD-HHMMSS.log`

### Emergency Contacts
- **Production Server**: dev.aurigraph.io:2224
- **SSH User**: yogesh
- **Backup Location**: /opt/aurex-platform/backups/

---

## 🎉 Success!

Your Aurex Platform deployment is now streamlined with:
- ✅ **2 deployment scripts** (down from 43 files)
- ✅ **Automated version management**
- ✅ **Zero-downtime production deployment**
- ✅ **Comprehensive health monitoring**
- ✅ **Automatic backup and rollback**
- ✅ **Enterprise-grade security**

**Ready to deploy! 🚀**
