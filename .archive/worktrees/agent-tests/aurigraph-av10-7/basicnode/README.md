# Aurigraph Basic Node v10.19.0

User-friendly basic node implementation with Docker + Quarkus for simplified network participation.

## Quick Start

### Option 1: Docker Compose (Recommended)
```bash
# Start basic node with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option 2: Docker Build & Run
```bash
# Build and run with simplified Dockerfile
docker build -f Dockerfile.simple -t aurigraph/basicnode:10.19.0 .

# Run container
docker run -d \
  --name aurigraph-basicnode \
  --memory=512m \
  --cpus=2.0 \
  -p 8080:8080 \
  -e AURIGRAPH_PLATFORM_URL=http://host.docker.internal:3018 \
  aurigraph/basicnode:10.19.0
```

### Option 3: One-Command Deployment
```bash
# Use automated build script
./scripts/build-and-run.sh
```

## Access Points

- **Web Interface**: http://localhost:8080
- **API Endpoints**: http://localhost:8080/api/node/*
- **Health Check**: http://localhost:8080/q/health
- **API Documentation**: http://localhost:8080/q/swagger-ui

## Features

### ✅ User-Friendly Interface
- **Dashboard**: Real-time node status and metrics
- **Monitoring**: Resource usage tracking
- **Settings**: Easy configuration management
- **Help**: Built-in documentation and troubleshooting

### ✅ Performance Optimized
- **Memory**: <512MB usage limit
- **CPU**: <2 cores usage limit
- **Startup**: <5 seconds container boot
- **Monitoring**: Real-time resource optimization

### ✅ Platform Integration
- **AV11-18 Connectivity**: Automatic connection to main platform
- **API Gateway**: RESTful integration
- **Real-time Sync**: Continuous platform synchronization
- **Automatic Registration**: Self-registering with platform

### ✅ Docker Containerized
- **Lightweight**: <100MB container size
- **Secure**: Non-root user execution
- **Portable**: Runs on any Docker environment
- **Health Checks**: Automatic container health monitoring

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Browser   │    │  Basic Node     │    │  AV11-18        │
│                 │    │  (Port 8080)    │    │  Platform       │
│  • Dashboard    │◄──►│  • NodeManager  │◄──►│  (Port 3018)    │
│  • Monitoring   │    │  • API Gateway  │    │  • Validators   │
│  • Settings     │    │  • Monitoring   │    │  • Consensus    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## API Endpoints

### Node Management
- `GET /api/node/status` - Current node status
- `GET /api/node/config` - Node configuration
- `PUT /api/node/config` - Update configuration
- `GET /api/node/metrics` - Performance metrics
- `GET /api/node/performance` - Performance report
- `POST /api/node/restart` - Restart node

### Onboarding
- `POST /api/onboarding/start` - Start setup wizard
- `POST /api/onboarding/configure` - Apply configuration
- `POST /api/onboarding/connect` - Connect to platform
- `POST /api/onboarding/complete` - Complete setup
- `GET /api/onboarding/status` - Onboarding progress

## Configuration

### Environment Variables
- `AURIGRAPH_PLATFORM_URL` - AV11-18 platform URL (default: http://localhost:3018)
- `AURIGRAPH_NODE_ID` - Unique node identifier
- `QUARKUS_PROFILE` - Quarkus profile (dev/test/prod)

### Resource Limits
- **Memory**: Maximum 512MB
- **CPU**: Maximum 2 cores
- **Disk**: Minimal storage requirements
- **Network**: Stable internet connection

## Monitoring

### Performance Metrics
- Memory usage and optimization
- CPU utilization tracking
- Network connectivity status
- Transaction processing statistics

### Health Checks
- Container health monitoring
- Platform connectivity checks
- Resource constraint validation
- Automatic alerts and notifications

## Integration with AV11-18

The basic node integrates with the AV11-18 platform to:
- Participate in quantum consensus network
- Process transactions with 5M+ TPS capability
- Leverage Quantum Level 6 security
- Access autonomous compliance features
- Benefit from AI-driven optimization

## Troubleshooting

### Common Issues
1. **Container won't start**: Check Docker daemon and port 8080 availability
2. **Platform connection failed**: Verify AV11-18 platform is running on port 3018
3. **High memory usage**: Restart container to clear memory
4. **Performance issues**: Check system resources and Docker limits

### Logs
```bash
# View container logs
docker logs -f aurigraph-basicnode

# View real-time metrics
curl http://localhost:8080/api/node/metrics

# Check health status
curl http://localhost:8080/q/health
```

## Development

### Local Development
```bash
# Start in development mode (requires Java 21)
quarkus dev

# Or with Docker
docker-compose -f docker-compose.dev.yml up
```

### Testing
```bash
# Run tests
mvn test

# Integration tests
mvn verify
```

## Production Deployment

### Requirements
- Docker Engine 20.10+
- 512MB available memory
- 2 CPU cores recommended
- Stable network connection

### Security
- Non-root container execution
- Resource constraints enforced
- Health monitoring enabled
- Automatic restart on failure

---

**Aurigraph Basic Node v10.19.0** - Making distributed ledger technology accessible to everyone.