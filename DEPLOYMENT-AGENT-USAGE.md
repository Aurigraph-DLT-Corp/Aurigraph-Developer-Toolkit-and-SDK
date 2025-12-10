# Deployment Agent Usage Guide

## Overview

This guide documents how to use the Aurigraph V12 deployment agent for automated deployments to the remote server (dlt.aurigraph.io).

## Remote Server Details

| Property | Value |
|----------|-------|
| **Host** | `dlt.aurigraph.io` |
| **SSH Port** | 2235 |
| **Main Service Port** | 9003 |
| **Frontend** | https://dlt.aurigraph.io |
| **API Base** | https://dlt.aurigraph.io/api/v11 |

## Quick Health Check

```bash
# Check API health
curl -s https://dlt.aurigraph.io/api/v11/topology/stats | jq .

# Check specific endpoints
curl -s https://dlt.aurigraph.io/api/v11/topology/nodes | jq '.count'
curl -s https://dlt.aurigraph.io/api/v11/topology/channels | jq .
curl -s https://dlt.aurigraph.io/api/v11/topology/contracts | jq '.count'
```

## Available API Endpoints

### Node Topology Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v11/topology` | GET | Full network topology |
| `/api/v11/topology/nodes` | GET | All nodes with metrics |
| `/api/v11/topology/nodes/{nodeId}` | GET | Specific node details |
| `/api/v11/topology/channels` | GET | List all channels |
| `/api/v11/topology/channels/{channelId}` | GET | Nodes in a channel |
| `/api/v11/topology/contracts` | GET | All active contracts |
| `/api/v11/topology/nodes/{nodeId}/contracts` | GET | Node's contracts |
| `/api/v11/topology/stats` | GET | Aggregated statistics |

### Query Parameters

- `?type=VALIDATOR|BUSINESS|SLIM|CHANNEL` - Filter by node type
- `?channel=channel-1` - Filter by channel ID
- `?includeContracts=true|false` - Include contract details

## Network Statistics (Live)

As of last verification:

| Metric | Value |
|--------|-------|
| Total Nodes | 48 |
| Total TPS | ~2.4M |
| Validators | 10 |
| Business Nodes | 20 |
| Slim Nodes | 10 |
| Channel Nodes | 8 |
| Active Contracts | 97 |
| Avg Latency | ~23ms |
| Health Status | 100% healthy |

## Node Distribution by Region

| Region | Nodes |
|--------|-------|
| APAC-SOUTH | 12 |
| US-WEST | 9 |
| EU-CENTRAL | 8 |
| EU-WEST | 8 |
| APAC-EAST | 6 |
| US-EAST | 5 |

## Deployment Methods

### 1. GitHub Actions (Recommended)

Trigger the deployment workflow:
```bash
gh workflow run remote-deployment.yml --ref V12
```

### 2. Manual Deployment Script

```bash
# From project root
bash scripts/ci-cd/deploy-to-remote.sh
```

### 3. SSH Direct Access

```bash
ssh -p 2235 subbu@dlt.aurigraph.io
cd /opt/aurigraph
docker-compose pull
docker-compose up -d
```

## Frontend Dashboard Access

The Enterprise Portal is accessible at: **https://dlt.aurigraph.io**

Features:
- High Throughput Demo with Node Topology tab
- Real-time streaming dashboard
- Network visualization
- Contract monitoring

## Verification Steps

After deployment, verify:

1. **API Health**
   ```bash
   curl -s https://dlt.aurigraph.io/api/v11/topology/stats | jq '.totalNodes'
   ```

2. **Frontend Access**
   - Open https://dlt.aurigraph.io in browser
   - Navigate to High Throughput Demo
   - Check Node Topology tab

3. **Node Status**
   ```bash
   curl -s https://dlt.aurigraph.io/api/v11/topology/stats | jq '{healthy: .healthyNodes, degraded: .degradedNodes, unhealthy: .unhealthyNodes}'
   ```

## Troubleshooting

### SSH Connection Refused
- Verify you're on the correct network/VPN
- Check if port 2235 is open
- Use HTTP endpoints for health checks instead

### API Returns HTML
- Ensure using correct path: `/api/v11/...`
- The base path `/api/...` routes to frontend

### 500 Errors
- Check backend logs via SSH
- Verify Java service is running
- Check database connectivity

## Agent Configuration

The deployment agent is configured in `.agent/config.yml`:

```yaml
agent_roles:
  - name: "DevOps Agent"
    id: 8
    responsibilities: ["deployment", "ci-cd", "infrastructure"]
```

## Related Documentation

- [CI/CD Guide](docs/cicd/CI_CD_COMPLETE_GUIDE.md)
- [Deployment Guide](docs/cicd/DEPLOYMENT_GUIDE.md)
- [Remote Deployment Setup](docs/cicd/REMOTE_DEPLOYMENT_SETUP.md)
- [GitHub Secrets Setup](docs/cicd/GITHUB_SECRETS_SETUP.md)

## Last Verified

- **Date**: December 10, 2025
- **Version**: V12 (12.0.0)
- **Status**: All endpoints operational
- **TPS**: ~2.4 Million
