# Aurigraph DLT - Complete CI/CD Guide

## Overview

This document provides a comprehensive guide to the CI/CD infrastructure for all Aurigraph DLT components.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Aurigraph DLT CI/CD Pipeline                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   GitHub    │───▶│   Build     │───▶│   Test      │───▶│   Deploy    │   │
│  │   Push/PR   │    │   Stage     │    │   Stage     │    │   Stage     │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘   │
│                            │                  │                  │          │
│                            ▼                  ▼                  ▼          │
│                     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│                     │  Backend    │    │  Unit/E2E   │    │  Remote     │   │
│                     │  Frontend   │    │  Tests      │    │  Server     │   │
│                     │  Docker     │    │  Security   │    │  dlt.aurig- │   │
│                     │  Images     │    │  Scan       │    │  raph.io    │   │
│                     └─────────────┘    └─────────────┘    └─────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Available Workflows

### 1. Unified CI/CD (`aurigraph-unified-cicd.yml`)

**Purpose:** Complete CI/CD for all components
**Trigger:** Push to `main`, `V12`, or `develop` branches

Features:
- Automatic change detection (backend/frontend/docker)
- Parallel build jobs
- Remote server deployment
- E2E testing
- Security scanning
- GitHub notifications

```bash
# Manual trigger with options
gh workflow run "Aurigraph Unified CI/CD" \
  --ref V12 \
  -f deploy_backend=true \
  -f deploy_frontend=true \
  -f run_e2e_tests=true
```

### 2. Frontend Deploy (`frontend-deploy.yml`)

**Purpose:** Frontend-only deployment
**Trigger:** Changes to `enterprise-portal/` directory

Features:
- TypeScript build with Vite
- NGINX deployment
- Cache clearing
- Playwright E2E tests

### 3. V11 Backend CI/CD (`v11-ci-cd.yml`)

**Purpose:** Backend build, test, and quality analysis
**Trigger:** Changes to `aurigraph-av10-7/` directory

Features:
- Maven build with JaCoCo coverage
- Performance testing
- Security vulnerability scanning
- Native GraalVM build (optional)

### 4. Production Monitoring (`monitoring.yml`)

**Purpose:** Automated health checks
**Trigger:** Every 15 minutes (scheduled)

Features:
- API health verification
- Frontend availability check
- SSL certificate monitoring
- Response time measurement
- Automatic alerting on failure

## Components

### Backend (V11/V12 Java API)

| Item | Value |
|------|-------|
| Framework | Quarkus 3.26.2 |
| Java | 21 (Temurin) |
| Build | Maven |
| Port | 9003 |
| Deploy Path | `/home/subbu/` |

### Frontend (Enterprise Portal)

| Item | Value |
|------|-------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Node | 20.x |
| Port | 80/443 (NGINX) |
| Deploy Path | `/usr/share/nginx/html/` |

### Infrastructure

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL | 5432 | Primary database |
| Redis | 6379 | Caching |
| NGINX | 80/443 | Reverse proxy |
| Prometheus | 9090 | Metrics |
| Grafana | 3001 | Dashboards |
| Keycloak | 8180 | IAM |

## GitHub Secrets Required

Configure these in `Settings → Secrets and variables → Actions`:

| Secret | Description | Required |
|--------|-------------|----------|
| `PROD_SSH_PRIVATE_KEY` | SSH key for server access | Yes |
| `PROD_SSH_USER` | SSH username (default: subbu) | No |
| `PROD_SSH_PORT` | SSH port (default: 22) | No |
| `GITHUB_TOKEN` | Auto-provided by GitHub | Auto |
| `SLACK_WEBHOOK_URL` | Slack notifications | No |
| `CODECOV_TOKEN` | Code coverage reporting | No |
| `SNYK_TOKEN` | Security scanning | No |

## Deployment Commands

### Manual Deployment

```bash
# Deploy everything
gh workflow run "Aurigraph Unified CI/CD" --ref V12 \
  -f deploy_backend=true \
  -f deploy_frontend=true

# Deploy backend only
gh workflow run "Aurigraph Unified CI/CD" --ref V12 \
  -f deploy_backend=true \
  -f deploy_frontend=false

# Deploy frontend only
gh workflow run "Frontend Deploy to Remote" --ref V12

# Skip tests for faster deployment
gh workflow run "Aurigraph Unified CI/CD" --ref V12 \
  -f skip_tests=true
```

### Docker Deployment

```bash
# Start all services
cd deployment
docker-compose -f docker-compose.full-stack.yml up -d

# Start specific services
docker-compose -f docker-compose.full-stack.yml up -d backend frontend nginx

# View logs
docker-compose -f docker-compose.full-stack.yml logs -f backend

# Stop all services
docker-compose -f docker-compose.full-stack.yml down
```

### Direct SSH Deployment

```bash
# SSH to production server
ssh -p 22 subbu@dlt.aurigraph.io

# Check backend status
ps aux | grep quarkus

# View backend logs
tail -100 /home/subbu/logs/backend.log

# Restart backend
pkill -f quarkus-run.jar
nohup java -Xmx4g -jar quarkus-app/quarkus-run.jar > logs/backend.log 2>&1 &

# Restart NGINX
sudo systemctl restart nginx
```

## Monitoring & Verification

### Health Check URLs

- Frontend: https://dlt.aurigraph.io
- API Health: https://dlt.aurigraph.io/api/v11/health
- API Info: https://dlt.aurigraph.io/api/v11/info
- Infrastructure: https://dlt.aurigraph.io/admin/infrastructure
- Demo App: https://dlt.aurigraph.io/demo

### Quick Verification Script

```bash
#!/bin/bash
echo "=== Aurigraph DLT Health Check ==="

# API Health
API=$(curl -sf https://dlt.aurigraph.io/api/v11/health && echo "OK" || echo "FAIL")
echo "API: $API"

# Frontend
FE=$(curl -sf -o /dev/null -w "%{http_code}" https://dlt.aurigraph.io/)
echo "Frontend: HTTP $FE"

# Infrastructure API
INFRA=$(curl -sf https://dlt.aurigraph.io/api/v11/infrastructure/metrics && echo "OK" || echo "FAIL")
echo "Infrastructure API: $INFRA"
```

## Workflow Files

| File | Purpose |
|------|---------|
| `aurigraph-unified-cicd.yml` | Main unified CI/CD |
| `frontend-deploy.yml` | Frontend deployment |
| `v11-ci-cd.yml` | Backend CI/CD |
| `monitoring.yml` | Health monitoring |
| `e2e-tests.yml` | E2E testing |
| `security.yml` | Security scanning |

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
tail -100 /home/subbu/logs/backend.log

# Check port
ss -tlnp | grep 9003

# Check Java
java --version

# Restart
pkill -f quarkus && sleep 3 && \
  nohup java -Xmx4g -jar quarkus-app/quarkus-run.jar > logs/backend.log 2>&1 &
```

### Frontend Not Updating

```bash
# Clear NGINX cache
sudo rm -rf /var/cache/nginx/*
sudo systemctl restart nginx

# Check deployed files
ls -la /usr/share/nginx/html/

# Check NGINX config
sudo nginx -t
```

### CI/CD Workflow Failed

1. Check GitHub Actions logs
2. Verify secrets are configured
3. Check runner availability (self-hosted)
4. Review error messages

## Best Practices

1. **Always test locally** before pushing to main
2. **Use feature branches** for development
3. **Monitor deployments** in GitHub Actions
4. **Keep secrets secure** and rotate regularly
5. **Review E2E test results** after each deployment
6. **Check monitoring alerts** for service health

## Contact

- **Repository:** https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **Production URL:** https://dlt.aurigraph.io
- **SSH Access:** `ssh -p 22 subbu@dlt.aurigraph.io`
