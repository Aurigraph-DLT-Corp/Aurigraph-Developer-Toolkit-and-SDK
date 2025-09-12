# Multi-Node Docker Configuration Guide
**Running Multiple Aurigraph Basic Nodes in Docker**

## Overview
Configure Docker to run multiple Aurigraph basic nodes efficiently, supporting both single-container and multi-container deployments with load balancing.

## Deployment Options

### Option 1: Multiple Nodes in Single Container (Recommended)
Best for development and resource-constrained environments.

```bash
# Build and start 3 nodes in one container
docker-compose -f docker-compose.multi.yml up -d

# Or use management script
./scripts/manage-multinodes.sh start 3

# Access points:
# Node 1: http://localhost:8080
# Node 2: http://localhost:8081  
# Node 3: http://localhost:8082
# Load Balancer: http://localhost:9080
```

**Benefits:**
- Shared container overhead
- Simplified management
- Resource efficiency
- Single deployment unit

### Option 2: Individual Node Containers  
Best for production environments requiring isolation.

```bash
# Start individual containers with load balancer
docker-compose -f docker-compose.multi.yml --profile individual up -d

# Or use management script
./scripts/manage-multinodes.sh individual
```

**Benefits:**
- Process isolation
- Independent scaling
- Fault isolation
- Production resilience

## Architecture Diagrams

### Single Container Multi-Node
```
┌─────────────────────────────────────────────────────────┐
│                Docker Container                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Node 1    │  │   Node 2    │  │   Node 3    │     │
│  │  Port 8080  │  │  Port 8081  │  │  Port 8082  │     │
│  │  128MB RAM  │  │  128MB RAM  │  │  128MB RAM  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │              Supervisor Process Manager           │ │
│  │        • Auto-restart    • Health monitoring     │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
           │         │         │
           ▼         ▼         ▼
    ┌─────────────────────────────────┐
    │        Load Balancer            │
    │      (Nginx - Port 80)          │
    └─────────────────────────────────┘
```

### Individual Container Multi-Node
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ Container 1 │  │ Container 2 │  │ Container 3 │
│   Node 1    │  │   Node 2    │  │   Node 3    │
│ Port 8080   │  │ Port 8081   │  │ Port 8082   │
│ 512MB RAM   │  │ 512MB RAM   │  │ 512MB RAM   │
│ 2 CPU cores │  │ 2 CPU cores │  │ 2 CPU cores │
└─────────────┘  └─────────────┘  └─────────────┘
       │               │               │
       └───────────────┼───────────────┘
                       │
           ┌─────────────────────────────────┐
           │      Load Balancer Container    │
           │        (Nginx - Port 9080)     │
           └─────────────────────────────────┘
```

## Management Commands

### Quick Start
```bash
# Start 3 nodes in single container
./scripts/manage-multinodes.sh start 3

# Start 5 nodes in single container  
./scripts/manage-multinodes.sh start 5

# Start individual containers
./scripts/manage-multinodes.sh individual
```

### Operations
```bash
# Check status of all nodes
./scripts/manage-multinodes.sh status

# Check health of all nodes
./scripts/manage-multinodes.sh health

# View logs for all nodes
./scripts/manage-multinodes.sh logs

# View logs for specific node
./scripts/manage-multinodes.sh logs 2

# Scale to different number of nodes
./scripts/manage-multinodes.sh scale 10

# Restart all nodes
./scripts/manage-multinodes.sh restart

# Stop all nodes
./scripts/manage-multinodes.sh stop

# Clean up everything
./scripts/manage-multinodes.sh clean
```

## Resource Configuration

### Single Container Multi-Node
- **Memory per Node**: 128MB (total: N × 128MB + 256MB overhead)
- **CPU per Node**: 0.8 cores (total: N × 0.8 + 1 core overhead)
- **Startup Time**: 5-10 seconds for all nodes
- **Max Recommended**: 10 nodes per container

### Individual Containers
- **Memory per Node**: 512MB (isolated)
- **CPU per Node**: 2 cores (isolated)
- **Startup Time**: 5 seconds per container
- **Max Recommended**: Limited by system resources

## Load Balancing

### Nginx Configuration
The load balancer distributes requests across all nodes using:
- **Algorithm**: Least connections for optimal distribution
- **Health Checks**: Automatic unhealthy node detection
- **Failover**: Automatic retry on node failure
- **Session Affinity**: Optional sticky sessions

### Access Patterns
```bash
# Load balanced access (automatic node selection)
curl http://localhost:9080/api/node/status

# Direct node access (for debugging)
curl http://localhost:8080/api/node/status  # Node 1
curl http://localhost:8081/api/node/status  # Node 2
curl http://localhost:8082/api/node/status  # Node 3

# Load balancer status
curl http://localhost:9080/lb/status
```

## Configuration Examples

### Development: 3 Nodes Single Container
```yaml
# docker-compose.dev.yml
services:
  aurigraph-dev:
    build:
      dockerfile: Dockerfile.multi
    environment:
      - NODE_COUNT=3
      - JAVA_OPTS=-Xmx128m
    mem_limit: 1024m
    cpus: 4.0
```

### Production: 5 Individual Containers
```yaml
# docker-compose.prod.yml  
services:
  aurigraph-node1:
    build:
      dockerfile: Dockerfile.simple
    mem_limit: 512m
    cpus: 2.0
    deploy:
      replicas: 5
```

### High Availability: 10 Node Cluster
```bash
# Auto-scaling configuration
./scripts/manage-multinodes.sh scale 10

# Resource requirements:
# Memory: 10 × 128MB + 512MB = ~2GB
# CPU: 10 × 0.8 + 2 = ~10 cores
# Ports: 8080-8089 + 9080 (load balancer)
```

## Monitoring & Health Checks

### Container Health
```bash
# Check container health status
docker ps --filter name=aurigraph --format "table {{.Names}}\t{{.Status}}"

# Detailed health check
docker inspect aurigraph-multinodes --format='{{.State.Health.Status}}'
```

### Node Health
```bash
# Check all nodes via load balancer
curl http://localhost:9080/q/health

# Check individual node health
for port in 8080 8081 8082; do
  curl -s http://localhost:$port/q/health | jq '.status'
done
```

### Resource Monitoring
```bash
# Real-time resource usage
docker stats aurigraph-multinodes

# Node-specific metrics
curl http://localhost:8080/api/node/metrics | jq
```

## Scaling Strategies

### Vertical Scaling (More Resources per Container)
```bash
# Increase memory limit
docker update --memory=2048m aurigraph-multinodes

# Increase CPU limit  
docker update --cpus=8.0 aurigraph-multinodes
```

### Horizontal Scaling (More Nodes)
```bash
# Scale to 10 nodes
./scripts/manage-multinodes.sh scale 10

# Or start additional containers
docker run -d --name aurigraph-node4 -p 8083:8080 aurigraph/basicnode:10.19.0
```

## Troubleshooting

### Common Issues
1. **Port Conflicts**: Use different port ranges
2. **Memory Limits**: Reduce nodes per container or increase memory
3. **Health Check Failures**: Check node startup logs
4. **Load Balancer Issues**: Verify nginx configuration

### Diagnostic Commands
```bash
# Check what's using ports
lsof -i :8080-8085

# Monitor resource usage
docker stats --no-stream

# View container logs
docker logs aurigraph-multinodes

# Execute commands in container
docker exec -it aurigraph-multinodes /bin/bash
```

## Production Recommendations

### Small Deployment (1-3 Nodes)
- Use single container with supervisor
- Memory: 1GB total
- CPU: 4 cores total

### Medium Deployment (4-10 Nodes)  
- Use individual containers
- Memory: 512MB per container
- CPU: 2 cores per container
- Load balancer: Nginx

### Large Deployment (10+ Nodes)
- Use Kubernetes or Docker Swarm
- Auto-scaling based on load
- External load balancer
- Persistent storage

## Security Considerations

### Container Security
- Non-root user execution (UID 1001)
- Resource limits enforced
- Network isolation
- Health monitoring

### Multi-Node Security
- Isolated processes (individual containers)
- Shared volumes only for necessary data
- API key rotation support
- Secure inter-node communication

---

**Multi-Node Docker Configuration Complete**
Supports 1-50+ nodes with flexible deployment options and automatic load balancing.