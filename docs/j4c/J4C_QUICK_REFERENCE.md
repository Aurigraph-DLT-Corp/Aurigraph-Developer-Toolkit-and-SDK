# J4C Framework - Quick Reference Guide

## Projects Summary

```
HMS Trading Platform (v2.0.0)
│
├─ PLUGIN (v2.2.0) ⭐ PRIMARY J4C INTEGRATION
│  ├─ 12 Specialized Agents
│  ├─ 80+ Skills (22 implemented, 76 documented)
│  ├─ Docker: node:18-alpine
│  └─ Path: /plugin/
│
├─ STRATEGY BUILDER (v5.0.0)
│  ├─ Trading strategy system
│  ├─ MongoDB + Redis + Bull queues
│  ├─ Docker: node:18-alpine
│  └─ Path: /strategy-builder/
│
├─ WEB DASHBOARD (v2.0.0)
│  ├─ React 18.2 + Redux + Vite
│  ├─ Docker: Vite dev server
│  └─ Path: /web/
│
├─ MOBILE PLATFORM (v1.0.0)
│  ├─ React Native 0.72 + Expo
│  ├─ Docker: nginx:alpine (web deployment)
│  └─ Path: /mobile/
│
└─ BACKEND API (v2.0.0)
   ├─ Express + PostgreSQL + gRPC
   ├─ Docker: node:18-alpine
   └─ Path: /backend/
```

---

## J4C Configuration Matrix

| Project | Config Path | Enabled | Consolidation | Auto-Update |
|---------|------------|---------|---------------|-------------|
| Root | `.j4c/config.json` | ✅ | Monthly | ✅ |
| Plugin | `plugin/.j4c/config.json` | ✅ | Monthly | ✅ |
| Web | `web/.j4c/config.json` | ✅ | Monthly | ✅ |
| Strategy | `strategy-builder/.j4c/config.json` | ✅ | Monthly | ✅ |
| Backend | `backend/.j4c/config.json` | ✅ | Monthly | ✅ |
| Mobile | `mobile/.j4c/config.json` | ✅ | Monthly | ✅ |

---

## Deployment Methods

### 1. Local Development
```bash
npm install
docker-compose up -d
```

### 2. Docker (Production Build)
```bash
docker build -t project-name:latest .
docker run -p 3000:3000 project-name:latest
```

### 3. Kubernetes
```bash
kubectl apply -f k8s/gnn-hms-namespace.yaml
kubectl apply -f k8s/
```

### 4. GitHub Actions (CI/CD)
- Trigger: Push to main branch
- Jobs: Test → Build → Deploy
- Targets: ECS (staging/production)

### 5. AWS ECS
```bash
aws ecs update-service --cluster aurigraph-production \
  --service aurigraph-production \
  --force-new-deployment
```

---

## 12 Agents Overview

### Development & Infrastructure
1. **DLT Developer** - Blockchain/Smart Contracts
2. **DevOps Engineer** - Infrastructure/Deployments
3. **Frontend Developer** - UI/React Development

### Operations & Trading
4. **Trading Operations** - Strategies/Exchanges
5. **Strategy Builder Agent** - Strategy Optimization

### Quality & Reliability
6. **QA Engineer** - Testing/Coverage/Security
7. **SRE/Reliability** - Incidents/Monitoring/SLOs

### Management & Organization
8. **Project Manager** - JIRA/Sprints/Reporting
9. **Employee Onboarding** - HR/Training/Compliance

### Specialized Domains
10. **Security & Compliance** - Audits/Compliance
11. **Data Engineer** - ETL/Analytics
12. **Digital Marketing** - Campaigns/Social/Email
13. **GNN Heuristic Agent** - Neural Optimization

---

## Dockerfile Specifications

| Project | Base Image | Stage Count | Port | Features |
|---------|-----------|-----------|------|----------|
| Main (Root) | node:18-alpine | 2 | 3001 | Health check, non-root |
| Strategy Builder | node:18-alpine | 2 | 3000 | tini signal handling |
| Mobile | nginx:alpine | 2 | 80/443 | SSL support, embedded UI |
| Plugin | node:18-alpine | 2 | 3000 | Config volume, health check |

---

## Docker-Compose Services

### Strategy Builder Stack
- **mongodb**: Persistence
- **redis**: Caching & queues
- **api**: Main application (3000)
- **websocket**: Real-time updates (3001)
- **bull-board**: Queue monitoring (3002)

### Root Stack (Multiple Variants)
1. `docker-compose.yml` - Main
2. `docker-compose-nginx.yml` - Reverse proxy
3. `docker-compose.hms.yml` - HMS specific
4. `docker-compose.hermes.yml` - Hermes specific
5. `docker-compose.swarm.yml` - Swarm mode
6. `docker-compose.production.monitoring.yml` - Observability

---

## GitHub Actions Workflows

### Main Workflows (6 total)

| Workflow | Trigger | Status | Purpose |
|----------|---------|--------|---------|
| deploy-production.yml | main push | **DISABLED** | Production deployment |
| test-and-deploy.yml | PR/push | Active | Testing & deployment |
| test-and-build.yml | - | - | Testing suite |
| deploy.yml | - | - | Deployment |
| security-and-updates.yml | - | - | Security scanning |
| plugin/.github/workflows/build-and-deploy.yml | - | - | Plugin deployment |

### Build Job Steps
1. Checkout code
2. Setup Node.js 18
3. Install dependencies
4. Lint code
5. Run tests
6. Compile TypeScript
7. Build Docker image
8. Security scanning (Trivy/Snyk)
9. Deploy to ECS/K8s

---

## Kubernetes Resources

```
Namespace: gnn-hms-namespace
├── Services: Load-balanced entry points
├── Deployments: Pod definitions
├── StatefulSets: Data persistence
├── ConfigMaps: Configuration
├── Secrets: Credentials
├── Ingress: External routing
├── HPA: Auto-scaling policies
└── NetworkPolicies: Firewall rules
```

### Key K8s Files
- `gnn-hms-services.yaml` - Service definitions
- `gnn-components-deployment.yaml` - Pod deployments
- `gnn-hpa-autoscaling.yaml` - Scaling rules
- `gnn-ingress.yaml` - External access
- `helm-chart/Chart.yaml` - Helm configuration

---

## Environment Variables

### Required for Integration
```
HERMES_API_KEY=***
HERMES_API_URL=http://localhost:8005
HERMES_TIMEOUT=30000
HERMES_MAX_RETRIES=3
JIRA_API_KEY=***
```

### Database Configuration
```
MONGODB_URI=mongodb://admin:pass@mongodb:27017/db
REDIS_HOST=redis
REDIS_PORT=6379
DB_HOST=postgres
DB_USER=user
DB_PASSWORD=***
```

### Application Settings
```
NODE_ENV=production
PORT=3000
JWT_SECRET=***
LOG_LEVEL=info
```

---

## Framework Capabilities

### Learning System
- Pattern mining from execution history
- Confidence scoring for recommendations
- Heuristic learning with reinforcement
- Agent profile tracking
- Trend analysis and prediction

### Orchestration
- Multi-criteria agent selection
- Workflow scheduling (daily/weekly/monthly)
- Event-driven workflows
- Cross-project learning sync
- Automatic capability optimization

### Communication
- Inter-agent message bus
- 10 message types for knowledge sharing
- Agent registry with health tracking
- Message routing and subscriptions
- Automatic message cleanup

### Best Practices
- GNN-powered consolidation
- Organization-wide pattern analysis
- Hierarchical instruction system
- Compliance verification
- Automatic recommendations

---

## Deployment Targets

### Local
- Docker Compose (Dev environment)
- Direct Node.js execution

### Staging
- AWS ECS cluster: `aurigraph-staging`
- Health checks and smoke tests
- Manual approval for production

### Production
- AWS ECS cluster: `aurigraph-production`
- Blue-green deployment strategy
- RDS automated backups
- CloudWatch monitoring
- ElastiCache for Redis
- Load balancing
- SSL/TLS termination

### Kubernetes
- GKE or self-managed cluster
- Helm chart deployment
- Auto-scaling HPA
- Ingress routing
- Network policies

---

## Performance & Security

### Built-in Monitoring
- Health check endpoints
- Prometheus metrics
- Grafana dashboards
- CloudWatch integration
- Application Performance Monitoring (APM)

### Security Features
- Multi-stage Docker builds (smaller images)
- Non-root user execution
- Secret management (K8s Secrets, AWS Secrets Manager)
- HTTPS/TLS support
- Network policies
- Security scanning (Trivy, Snyk, OWASP)
- JWT authentication

### Scalability
- Horizontal Pod Autoscaling (K8s)
- Load balancing (ECS, Ingress)
- Database replication (RDS read replicas)
- Redis cluster support
- Bull queue scaling

---

## File Statistics

- **Total Dockerfiles**: 4
- **Total docker-compose files**: 10
- **GitHub Actions workflows**: 6
- **Kubernetes manifests**: 13+
- **J4C config files**: 6
- **Package.json files**: 6+
- **Environment configs**: 5+
- **Total code**: ~9,600+ lines
- **Documentation**: 6,000+ lines

---

## Version Numbers

| Component | Version |
|-----------|---------|
| HMS Trading Platform | 2.0.0 |
| Plugin System | 2.2.0 |
| Strategy Builder | 5.0.0 |
| Web Dashboard | 2.0.0 |
| Mobile Platform | 1.0.0 |
| Backend API | 2.0.0 |
| J4C Framework | 2.0.0 |
| Node.js Target | 18+ |
| React | 18.2.0 |
| React Native | 0.72.0 |
| Expo | 49.0.0 |
| Express | 4.21.2 |
| MongoDB | 7.0 |
| Redis | 7.2 |
| PostgreSQL | 15 |

---

## Getting Started Checklist

- [ ] Install Node.js 18+
- [ ] Clone repository
- [ ] Install dependencies: `npm install`
- [ ] Configure environment variables
- [ ] Start local stack: `docker-compose up`
- [ ] Verify health endpoints
- [ ] Review logs
- [ ] Run tests: `npm test`
- [ ] Build Docker images
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Deploy to production

