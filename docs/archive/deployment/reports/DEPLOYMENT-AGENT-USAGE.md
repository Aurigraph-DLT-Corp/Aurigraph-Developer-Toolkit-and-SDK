# Aurigraph V12 Deployment Agent - Usage Guide

## Deployment Profiles

The deployment agent supports 4 different deployment profiles:

### 1. Full Platform (Default)
**Complete Aurigraph DLT with validators, business nodes, and slim nodes**

```bash
# Deploy full platform
node deploy-to-remote.js

# Or explicitly
DEPLOY_PROFILE=full node deploy-to-remote.js
```

**Includes:**
- Core Platform (API, Portal, Database)
- Optimized Validators
- Business Nodes (Scaled)
- Slim Nodes
- Monitoring (Prometheus, Grafana)

**Compose Files:**
- `docker-compose.yml`
- `docker-compose-validators-optimized.yml`
- `docker-compose-nodes-scaled.yml`
- `docker-compose.production.yml`

---

### 2. Platform Only
**Core platform with monitoring only (no validators or nodes)**

```bash
DEPLOY_PROFILE=platform node deploy-to-remote.js
```

**Includes:**
- Core Platform
- Portal
- Database
- Monitoring

**Compose Files:**
- `docker-compose.yml`

---

### 3. Platform + Validators
**Core platform with optimized validators**

```bash
DEPLOY_PROFILE=validators node deploy-to-remote.js
```

**Includes:**
- Core Platform
- Optimized Validators
- Monitoring

**Compose Files:**
- `docker-compose.yml`
- `docker-compose-validators-optimized.yml`

---

### 4. Platform + Nodes
**Core platform with business and slim nodes**

```bash
DEPLOY_PROFILE=nodes node deploy-to-remote.js
```

**Includes:**
- Core Platform
- Business Nodes (Scaled)
- Slim Nodes
- Monitoring

**Compose Files:**
- `docker-compose.yml`
- `docker-compose-nodes-scaled.yml`

---

## Environment Variables

```bash
# Server Configuration
export REMOTE_HOST="dlt.aurigraph.io"
export REMOTE_PORT="22"
export REMOTE_USER="subbu"

# Deployment Profile (full, platform, validators, nodes)
export DEPLOY_PROFILE="full"

# Deploy
node deploy-to-remote.js
```

---

## Examples

### Deploy Full Platform
```bash
# Full Aurigraph DLT with everything
node deploy-to-remote.js
```

### Deploy Only Platform for Testing
```bash
# Lightweight deployment for testing
DEPLOY_PROFILE=platform node deploy-to-remote.js
```

### Deploy Platform + Validators Only
```bash
# Platform with validators, no business/slim nodes
DEPLOY_PROFILE=validators node deploy-to-remote.js
```

### Deploy Platform + Nodes Only
```bash
# Platform with nodes, no validators
DEPLOY_PROFILE=nodes node deploy-to-remote.js
```

---

## What Each Profile Deploys

| Component | Platform | Validators | Nodes | Full |
|-----------|----------|------------|-------|------|
| Portal | ✅ | ✅ | ✅ | ✅ |
| API | ✅ | ✅ | ✅ | ✅ |
| Database | ✅ | ✅ | ✅ | ✅ |
| Redis | ✅ | ✅ | ✅ | ✅ |
| Prometheus | ✅ | ✅ | ✅ | ✅ |
| Grafana | ✅ | ✅ | ✅ | ✅ |
| Validators | ❌ | ✅ | ❌ | ✅ |
| Business Nodes | ❌ | ❌ | ✅ | ✅ |
| Slim Nodes | ❌ | ❌ | ✅ | ✅ |

---

## Reverse Proxy Reconfiguration

The agent automatically handles reverse proxy (NGINX/Traefik) configuration:

1. **Detection**: Automatically detects running NGINX or Traefik containers
2. **Reconfiguration**:
   - **NGINX**: Tests configuration and reloads gracefully (`nginx -s reload`)
   - **Traefik**: Verifies service discovery (auto-configures via Docker labels)
3. **Seamless Updates**: Ensures new components (validators, nodes) are immediately accessible without downtime

---

## Deployment Output

The agent will show:
- Selected profile and description
- Number of compose files being deployed
- Services included
- Real-time deployment progress
- **Reverse proxy reconfiguration status**
- Container status after deployment
- Access URLs

---

## Post-Deployment

After deployment, the agent provides:
- Portal URL: `https://dlt.aurigraph.io`
- API URL: `https://dlt.aurigraph.io/api/v11/health`
- Grafana: `https://dlt.aurigraph.io/monitoring/grafana`
- Management commands for logs, status, restart

---

## Troubleshooting

### Check what was deployed
```bash
ssh -p 22 subbu@dlt.aurigraph.io "docker ps"
```

### View logs
```bash
ssh -p 22 subbu@dlt.aurigraph.io "cd ~/aurigraph-v12-latest && docker-compose logs -f"
```

### Restart services
```bash
ssh -p 22 subbu@dlt.aurigraph.io "cd ~/aurigraph-v12-latest && docker-compose restart"
```

---

**Version**: 12.0.0
**Last Updated**: 2025-11-25
**Default Profile**: Full Platform
