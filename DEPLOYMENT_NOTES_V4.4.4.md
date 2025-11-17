# AURDLT V4.4.4 Deployment Notes & API Service Integration Guide

**Date**: November 17, 2025
**Status**: Infrastructure Ready - Awaiting V11 API Service Container

---

## 📋 Current Deployment Status

### Infrastructure Services (All Running)
✅ **NGINX Gateway** - Reverse proxy with SSL/TLS (Healthy)
✅ **PostgreSQL 16** - Database with 4 production schemas (Healthy)
✅ **Redis 7** - Cache layer (Healthy)
✅ **Prometheus** - Metrics collection (Healthy)
✅ **Grafana** - Monitoring dashboards (Healthy)
✅ **Enterprise Portal** - React frontend (Running)

### API Service (Container Deployed - Awaiting Application)
⏳ **Aurigraph V11** - Container running (Alpine Linux placeholder)
   - Container Status: Running ✅
   - Port 9003: Not listening (service not started)
   - Port 9004: Not listening (gRPC not started)
   - Expected: API application binary to be deployed inside container

---

## 🔍 Understanding the Current State

### What's Deployed
The current deployment includes a complete production infrastructure stack with:
- Full Docker orchestration (7 containers)
- Isolated networks for security
- Persistent data volumes
- NGINX reverse proxy with SSL/TLS
- Complete monitoring stack
- Placeholder for Aurigraph V11 API service

### What's Needed
The V11 service container currently runs Alpine Linux with `sleep 9999999`. To activate the API:
1. Build the Aurigraph V11 JAR/native binary
2. Create a Docker image with the executable
3. Update the docker-compose.yml with the actual image
4. Restart the V11 service

---

## 📊 API Endpoint Status

### Current Behavior (Expected with Placeholder)
```
Portal Root: https://dlt.aurigraph.io              → 200 OK ✅
API Endpoints: https://dlt.aurigraph.io/api/v11/*  → 502 Bad Gateway (expected)
Health Checks: https://dlt.aurigraph.io/q/health   → 502 Bad Gateway (expected)
Swagger UI: https://dlt.aurigraph.io/swagger-ui/   → 502 Bad Gateway (expected)
```

### Once V11 API is Deployed (Expected)
```
Portal Root: https://dlt.aurigraph.io              → 200 OK ✅
API Endpoints: https://dlt.aurigraph.io/api/v11/*  → 200 OK ✅
Health Checks: https://dlt.aurigraph.io/q/health   → 200 OK ✅
Swagger UI: https://dlt.aurigraph.io/swagger-ui/   → 200 OK ✅
```

---

## 🚀 Deploying Aurigraph V11 API Service

### Step 1: Build the V11 Application

#### Option A: Build JAR (Development/Testing)
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean package

# Result: target/quarkus-app/quarkus-run.jar
```

#### Option B: Build Native Executable (Production)
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone
./mvnw package -Pnative -Dquarkus.native.container-build=true

# Result: target/aurigraph-v11-standalone-11.0.0-runner
```

### Step 2: Create Docker Image for V11

Create a `Dockerfile` in the aurigraph-av10-7 directory:

**For JAR-based deployment:**
```dockerfile
FROM openjdk:21-slim

WORKDIR /app
COPY aurigraph-v11-standalone/target/quarkus-app ./

ENV QUARKUS_PROFILE=production
ENV QUARKUS_HTTP_HOST=0.0.0.0
ENV QUARKUS_HTTP_PORT=9003

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:9003/q/health || exit 1

EXPOSE 9003 9004

ENTRYPOINT ["java", "-jar", "quarkus-run.jar"]
```

**For Native executable deployment:**
```dockerfile
FROM alpine:latest

RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY aurigraph-v11-standalone/target/aurigraph-v11-standalone-11.0.0-runner ./

ENV QUARKUS_PROFILE=production
ENV QUARKUS_HTTP_HOST=0.0.0.0
ENV QUARKUS_HTTP_PORT=9003

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9003/q/health || exit 1

EXPOSE 9003 9004

ENTRYPOINT ["./aurigraph-v11-standalone-11.0.0-runner"]
```

### Step 3: Build and Test Local Image

```bash
# Build the image
docker build -t aurigraph-v11:latest -f Dockerfile .

# Test locally
docker run -p 9003:9003 \
  -e QUARKUS_PROFILE=production \
  aurigraph-v11:latest

# Verify in another terminal
curl http://localhost:9003/q/health
```

### Step 4: Push Image to Registry

```bash
# Tag for registry
docker tag aurigraph-v11:latest your-registry/aurigraph-v11:latest

# Push
docker push your-registry/aurigraph-v11:latest
```

### Step 5: Update docker-compose.yml

Replace the V11 service section:

**Current (Placeholder):**
```yaml
aurigraph-v11-service:
  image: alpine:latest
  container_name: dlt-aurigraph-v11
  restart: unless-stopped
  command: sleep 9999999
  # ... rest of config
```

**Updated:**
```yaml
aurigraph-v11-service:
  image: your-registry/aurigraph-v11:latest
  container_name: dlt-aurigraph-v11
  restart: unless-stopped

  # Remove the sleep command, let the JAR/binary run
  # command: sleep 9999999  <- DELETE THIS LINE

  # Keep everything else the same:
  deploy:
    resources:
      limits:
        memory: 2G
        cpus: '4.0'
      reservations:
        memory: 512M
        cpus: '1.0'

  environment:
    - QUARKUS_PROFILE=production
    - QUARKUS_HTTP_HOST=0.0.0.0
    - QUARKUS_HTTP_PORT=9003
    # ... other environment variables

  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:9003/q/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 30s
```

### Step 6: Deploy Updated Configuration

```bash
# Copy updated docker-compose.yml to remote
scp -P 22 docker-compose.yml subbu@dlt.aurigraph.io:/opt/DLT/

# Connect and restart V11 service
ssh -p 22 subbu@dlt.aurigraph.io "cd /opt/DLT && docker-compose pull && docker-compose up -d aurigraph-v11-service"

# Monitor startup
ssh -p 22 subbu@dlt.aurigraph.io "cd /opt/DLT && docker-compose logs -f aurigraph-v11-service"

# Check status
ssh -p 22 subbu@dlt.aurigraph.io "cd /opt/DLT && docker-compose ps aurigraph-v11-service"
```

### Step 7: Verify API Endpoints

```bash
# Health check
curl https://dlt.aurigraph.io/q/health

# API test
curl https://dlt.aurigraph.io/api/v11/health

# Swagger UI
curl https://dlt.aurigraph.io/swagger-ui/
```

---

## 🔧 Alternative: Quick Local Testing

If you want to test the deployment locally before production:

```bash
# Start with docker-compose locally
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT
docker-compose up -d

# Access services
curl http://localhost:9003/q/health       # V11 when running
curl http://localhost:3000                # Portal
curl http://localhost:3000/grafana        # Grafana (via NGINX)
curl http://localhost:5432                # PostgreSQL
```

---

## 📝 Monitoring & Health Checks

### Health Endpoints (Once V11 Deployed)

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `/q/health` | Liveness probe | `{"status":"UP"}` |
| `/q/health/ready` | Readiness probe | `{"status":"UP"}` |
| `/q/health/live` | Live probe | `{"status":"UP"}` |
| `/q/metrics` | Prometheus metrics | Metrics in Prometheus format |

### Viewing Metrics

```bash
# Access Grafana
https://dlt.aurigraph.io/grafana

# Default dashboards:
# - Aurigraph Performance
# - System Metrics
# - API Throughput
```

### Monitoring Logs

```bash
# V11 service logs
ssh -p 22 subbu@dlt.aurigraph.io "cd /opt/DLT && docker-compose logs -f aurigraph-v11-service"

# NGINX proxy logs
ssh -p 22 subbu@dlt.aurigraph.io "cd /opt/DLT && docker-compose logs -f nginx-gateway | grep -E '502|error'"

# All services
ssh -p 22 subbu@dlt.aurigraph.io "cd /opt/DLT && docker-compose logs -f"
```

---

## 🎯 API Integration Checklist

- [ ] Build Aurigraph V11 JAR or native executable
- [ ] Create Docker image with V11 binary
- [ ] Test image locally with docker run
- [ ] Push image to Docker registry
- [ ] Update docker-compose.yml with actual V11 image
- [ ] Copy updated docker-compose.yml to remote server
- [ ] Pull new image and restart V11 service
- [ ] Wait for health check to show "healthy" status
- [ ] Verify API endpoints return 200 OK
- [ ] Load Swagger UI and verify API documentation
- [ ] Test Portal functionality with real backend
- [ ] Monitor logs for any errors
- [ ] Validate Grafana dashboards are collecting metrics

---

## 🚨 Troubleshooting

### V11 Container Not Starting

**Symptom**: V11 shows "Up (unhealthy)" but health checks fail

**Solutions**:
1. Check if JAR/binary exists in image: `docker exec dlt-aurigraph-v11 ls -la /app`
2. Check port is listening: `docker exec dlt-aurigraph-v11 netstat -tlnp | grep 9003`
3. Check logs: `docker-compose logs aurigraph-v11-service`
4. Increase start_period if startup takes >30s: Change in docker-compose.yml

### API Returns 502 Bad Gateway

**Symptom**: All API endpoints return 502

**Solutions**:
1. Verify V11 is listening: `curl http://localhost:9003/q/health` (from remote server)
2. Check NGINX logs: `docker-compose logs nginx-gateway | grep 502`
3. Verify Docker network connectivity: `docker exec dlt-nginx-gateway ping aurigraph-v11-service`
4. Check if service DNS resolves: `docker exec dlt-nginx-gateway nslookup aurigraph-v11-service`

### Memory/CPU Issues

**Symptom**: V11 container killed or slow

**Solutions**:
1. Check resource usage: `docker stats dlt-aurigraph-v11`
2. Increase limits in docker-compose.yml (currently 2GB/4 CPU)
3. Monitor logs for out-of-memory errors
4. Check JVM heap settings if using JAR

---

## 📚 Reference Documentation

- **DEPLOYMENT_LESSONS_LEARNED.md** - NGINX proxy patterns and prevention
- **DEPLOYMENT_SUMMARY_V4.4.4.md** - Complete infrastructure overview
- **docker-compose.yml** - Service configuration (line 84+)
- **config/nginx/nginx.conf** - Reverse proxy configuration

---

## 🔐 Security Notes

✅ **Already Configured**:
- SSL/TLS 1.3 with Let's Encrypt certificates
- NGINX reverse proxy with rate limiting
- Docker networks for service isolation
- Security headers (HSTS, X-Frame-Options, etc.)
- Persistent data volumes

**To Verify**:
- [ ] Passwords/secrets in environment variables (not in docker-compose.yml)
- [ ] Database backups configured
- [ ] SSL certificate auto-renewal working
- [ ] API authentication/authorization enabled
- [ ] CORS policies appropriate for your use case

---

## 📈 Expected Performance

Once V11 API is deployed:

| Metric | Expected | Config |
|--------|----------|--------|
| Startup Time | <15 seconds | 30s health check start_period |
| Memory Usage | 512MB-2GB | 2GB limit configured |
| CPU Usage | 0.5-4 cores | 4 core limit configured |
| API Latency | <100ms | Depends on V11 optimization |
| TPS Capacity | 776K-2M | Depends on V11 tuning |

---

## ✅ Deployment Completion Checklist

**Infrastructure** (Completed ✅):
- [x] Docker Compose orchestration
- [x] 7 services deployed
- [x] 3 networks configured
- [x] 6 volumes created
- [x] NGINX with SSL/TLS
- [x] Database initialized
- [x] Monitoring stack active
- [x] Portal accessible

**API Service** (Pending ⏳):
- [ ] V11 binary built
- [ ] Docker image created
- [ ] Image tested locally
- [ ] Image pushed to registry
- [ ] docker-compose.yml updated
- [ ] V11 service deployed
- [ ] Health checks passing
- [ ] API endpoints verified

**Testing & Validation** (Next Steps):
- [ ] Load testing configured
- [ ] Monitoring dashboards verified
- [ ] Alerting configured
- [ ] Backup strategy implemented
- [ ] Disaster recovery tested
- [ ] Documentation updated

---

## 📞 Support & Next Actions

### Immediate Actions
1. Review this document
2. Build Aurigraph V11 JAR or native binary
3. Create Docker image following guidelines above
4. Test image locally
5. Update docker-compose.yml

### Questions?
Refer to:
- DEPLOYMENT_LESSONS_LEARNED.md - For NGINX/Docker issues
- DEPLOYMENT_SUMMARY_V4.4.4.md - For infrastructure overview
- docker-compose.yml - For service configuration

---

**Status**: Infrastructure Ready ✅ | Awaiting V11 API Service ⏳
**Last Updated**: November 17, 2025
**Infrastructure Version**: v4.4.4 Production

🤖 *Generated with Claude Code - Aurigraph Development Agent*
