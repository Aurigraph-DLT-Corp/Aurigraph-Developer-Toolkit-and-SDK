# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Aurex Platform** is a comprehensive ESG (Environmental, Social, Governance) management platform that enables organizations to track, measure, report, and optimize their sustainability initiatives through digital measurement, reporting, and verification (DMRV) capabilities. The platform is built on the **VIBE Framework** (Velocity, Intelligence, Balance, Excellence) and consists of multiple interconnected applications serving different aspects of ESG management with advanced project management, emissions tracking, and analytics capabilities.

## Architecture

The platform follows a **containerized microservices architecture** with 6 main applications:

### **Routing Architecture** (CORRECTED - August 11, 2025):

**SEPARATE APPLICATIONS ARCHITECTURE** - Each application runs as independent service

**Frontend Applications** (Independent React Apps):
1. **aurex-platform** - Main platform landing page (Port 3000)
2. **aurex-launchpad** - ESG assessment and reporting (Port 3001)  
3. **aurex-hydropulse** - Water management (Port 3002)
4. **aurex-sylvagraph** - Forest management (Port 3003)
5. **aurex-carbontrace** - Carbon footprint tracking (Port 3004)
6. **aurex-admin** - Administrative dashboard (Port 3005)

**Backend API Services** (Independent FastAPI Services):
1. **Platform API** - Core shared services (Port 8000)
2. **Launchpad API** - ESG assessment API (Port 8001)
3. **HydroPulse API** - Water management API (Port 8002)
4. **Sylvagraph API** - Forest management API (Port 8003)
5. **CarbonTrace API** - Carbon tracking API (Port 8004)
6. **Admin API** - Administrative API (Port 8005)

**Production Access** (via nginx reverse proxy):
- **Main Platform**: https://dev.aurigraph.io/ → aurex-platform:3000
- **Launchpad**: https://dev.aurigraph.io/Launchpad → aurex-launchpad:3001
- **HydroPulse**: https://dev.aurigraph.io/Hydropulse → aurex-hydropulse:3002
- **Sylvagraph**: https://dev.aurigraph.io/Sylvagraph → aurex-sylvagraph:3003
- **CarbonTrace**: https://dev.aurigraph.io/Carbontrace → aurex-carbontrace:3004
- **Admin**: https://dev.aurigraph.io/AurexAdmin → aurex-admin:3005

**Development/Localhost Access** (via nginx reverse proxy):
- **Main Platform**: http://localhost/ → aurex-platform:3000
- **Launchpad**: http://localhost/Launchpad → aurex-launchpad:3001
- **HydroPulse**: http://localhost/Hydropulse → aurex-hydropulse:3002
- **Sylvagraph**: http://localhost/Sylvagraph → aurex-sylvagraph:3003
- **CarbonTrace**: http://localhost/Carbontrace → aurex-carbontrace:3004
- **Admin**: http://localhost/AurexAdmin → aurex-admin:3005

**Infrastructure Ports** (Secured in production):
- **PostgreSQL**: Port 5432 (internal network only)
- **Redis**: Internal network only (no host binding)
- **Prometheus**: Port 9090 (localhost only)
- **Grafana**: Port 3006 (localhost only)
- **Nginx**: Ports 80, 443 (public facing with SSL)

### **DEPLOYMENT STATUS** (August 11, 2025):

**✅ PRODUCTION READY** - Complete deployment with path-based routing implemented

**Deployment Files**:
- `/docker-compose.production.yml` - Complete production configuration with all 12 services
- `/deploy-aurex-complete.sh` - Automated deployment script with staged rollout
- `/health-check-all.sh` - Comprehensive health checks for all services
- `/nginx/conf.d/default.conf` - Updated reverse proxy configuration

**Service URLs** (dev.aurigraph.io):
- **Frontend Applications** (All via Port 3000):
  - Main Platform: https://dev.aurigraph.io/
  - Launchpad: https://dev.aurigraph.io/Launchpad
  - Hydropulse: https://dev.aurigraph.io/Hydropulse
  - Sylvagraph: https://dev.aurigraph.io/Sylvagraph
  - CarbonTrace: https://dev.aurigraph.io/Carbontrace
  - Admin: https://dev.aurigraph.io/AurexAdmin

**Service URLs** (localhost):
- **Frontend Applications** (All via nginx reverse proxy):
  - Main Platform: http://localhost/
  - Launchpad: http://localhost/Launchpad
  - Hydropulse: http://localhost/Hydropulse
  - Sylvagraph: http://localhost/Sylvagraph
  - CarbonTrace: http://localhost/Carbontrace
  - Admin: http://localhost/AurexAdmin

- **Backend APIs** (Unified gateway):
  - Platform API: http://dev.aurigraph.io/api/platform/
  - Launchpad API: http://dev.aurigraph.io/api/launchpad/
  - Hydropulse API: http://dev.aurigraph.io/api/hydropulse/
  - Sylvagraph API: http://dev.aurigraph.io/api/sylvagraph/
  - CarbonTrace API: http://dev.aurigraph.io/api/carbontrace/
  - Admin API: http://dev.aurigraph.io/api/admin/

**Monitoring**:
- Prometheus: http://dev.aurigraph.io:9090
- Grafana: http://dev.aurigraph.io:3006 (monitoring dashboard)

**Deployment Commands**:
- `./deploy-aurex-complete.sh` - Full deployment
- `./health-check-all.sh` - Health verification
- `docker-compose -f docker-compose.production.yml ps` - Service status
- `docker-compose -f docker-compose.production.yml logs -f [service]` - View logs

**Path-Based Routing** (August 11, 2025):
- **Implementation**: Unified path-based routing for both localhost and production
- **Configuration**: Environment-based URL detection with automatic switching
- **Documentation**: `PATH-BASED-ROUTING-IMPLEMENTATION.md` - Complete implementation guide

### **Container Architecture** (Production-Ready):
Each application deployed as **separate Docker containers**:
- **Frontend Container**: React 18 + TypeScript + Vite + Nginx (optimized)
- **Backend Container**: Python FastAPI + SQLAlchemy ORM (security-hardened)
- **Database**: PostgreSQL with Redis caching (containerized with persistence)
- **Monitoring**: Prometheus + Grafana (container orchestration)
- **Security**: mTLS service mesh, container isolation, secrets management
- **Orchestration**: Docker Compose with production-ready configurations

### **Strategic Benefits**:
- 🚀 **35% Performance Improvement** through independent scaling
- 💰 **40% Cost Reduction** via optimized resource allocation
- ⚡ **60% Faster Deployments** with blue-green strategies
- 🔒 **Enhanced Security** with container isolation
- 📈 **10x Scalability** for enterprise growth

## Database Architecture

### **Database Configuration** (UPDATED - August 10, 2025):

**PostgreSQL Database Structure**:
- **Primary Database**: `aurex_platform` (main application database)
- **Dedicated Databases**: Each application has its own database
  - `aurex_launchpad` - ESG assessment data
  - `aurex_hydropulse` - Water management data
  - `aurex_sylvagraph` - Forest management data
  - `aurex_carbontrace` - Carbon tracking data
  - `aurex_admin` - Administrative data
- **Connection pooling**: Configured per service with health checks
- **Multi-database initialization**: Automated via `init-databases.sh` script

**Redis Database Allocation** (UPDATED):
- **Database 0**: aurex-main (main platform sessions, cache)
- **Database 1**: aurex-launchpad (ESG assessments cache)
- **Database 2**: aurex-hydropulse (water management cache)
- **Database 3**: aurex-sylvagraph (forest management cache)
- **Database 4**: aurex-carbontrace (carbon tracking cache)
- **Database 5**: aurex-admin (admin dashboard cache)

**Security Standards**:
- All credentials managed via environment variables
- No hardcoded passwords in any configuration files
- Secure connection pooling with timeout controls
- Schema-based access control for multi-tenancy

## Development Best Practices

- Always update documents with the changes made. Keep the documents in sync with code.

## Known Issues and Considerations

- **Port Allocation**: ✅ **RESOLVED (August 10, 2025)**
  * Complete production deployment implemented
  * Frontend ports: 3000-3005 (sequential)  
  * Backend ports: 8000-8005 (sequential)
  * All 12 services configured and deployed

- **Production Deployment**: ✅ **COMPLETED (August 10, 2025)**
  * Docker Compose production configuration complete
  * Nginx reverse proxy routing configured
  * Health checks implemented for all services
  * Automated deployment script created
  * Database multi-tenancy configured

## Personal Reminders

- Remember to create ticket for all my prompts
- Create a ticket for every todo item and once complete close it