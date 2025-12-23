# Traefik Reverse Proxy Deployment Guide

**Status**: Phase 1 - Parallel Deployment Implementation
**Date**: November 21, 2025
**Goal**: Replace NGINX with Traefik for zero-downtime, automated reverse proxy management

---

## Executive Summary

This guide implements Traefik as a modern, container-native replacement for NGINX. Traefik provides automatic service discovery, zero-downtime configuration updates, and eliminates manual nginx.conf management. The deployment follows a phased approach with NGINX running in parallel for gradual migration testing.

**Expected Benefits:**
- Elimination of NGINX management overhead (180+ hours annually)
- Zero configuration reload downtime
- Automatic TLS/SSL certificate management via Let's Encrypt
- Intelligent health checks and automatic failover
- Built-in dashboard for monitoring
- Perfect fit for Docker-based multi-cloud Terraform infrastructure

---

## Phase 1: Parallel Deployment (Current)

### 1.1 Docker Compose Configuration

The updated `docker-compose.yml` includes a new Traefik service configured with:

```yaml
traefik:
  image: traefik:v3.0-alpine
  container_name: dlt-traefik
  restart: unless-stopped

  command:
    # API & Dashboard
    - "--api=true"
    - "--api.dashboard=true"

    # HTTP/HTTPS Entrypoints with auto-redirect
    - "--entrypoints.web.address=:80"
    - "--entrypoints.websecure.address=:443"
    - "--entrypoints.web.http.redirections.entrypoint.to=websecure"

    # Docker auto-discovery
    - "--providers.docker=true"
    - "--providers.docker.exposedbydefault=false"
    - "--providers.docker.network=dlt-frontend"

    # Let's Encrypt ACME
    - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
    - "--certificatesresolvers.letsencrypt.acme.email=admin@aurigraph.io"
    - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"

  ports:
    - "80:80"      # HTTP
    - "443:443"    # HTTPS
    - "8080:8080"  # Dashboard

  volumes:
    - "/var/run/docker.sock:/var/run/docker.sock:ro"
    - letsencrypt:/letsencrypt

  profiles: ["traefik"]  # Only run when explicitly enabled
```

### 1.2 Service Auto-Discovery with Labels

Services are configured with Traefik labels in docker-compose.yml:

**Enterprise Portal (example):**
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.portal.rule=Host(`dlt.aurigraph.io`) || Host(`www.dlt.aurigraph.io`)"
  - "traefik.http.routers.portal.entrypoints=websecure"
  - "traefik.http.routers.portal.tls.certresolver=letsencrypt"
  - "traefik.http.services.portal.loadbalancer.server.port=3000"
  - "traefik.http.services.portal.loadbalancer.healthcheck.path=/health"
  - "traefik.http.middlewares.portal-gzip.compress=true"
  - "traefik.http.routers.portal.middlewares=portal-gzip@docker"
```

**Aurigraph V11 API (example):**
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.aurigraph-api.rule=Host(`dlt.aurigraph.io`) && PathPrefix(`/api/v11`)"
  - "traefik.http.routers.aurigraph-api.entrypoints=websecure"
  - "traefik.http.routers.aurigraph-api.tls.certresolver=letsencrypt"
  - "traefik.http.services.aurigraph-api.loadbalancer.server.port=9003"
  - "traefik.http.services.aurigraph-api.loadbalancer.healthcheck.path=/q/health"
  - "traefik.http.middlewares.aurigraph-ratelimit.ratelimit.average=1000"
  - "traefik.http.routers.aurigraph-api.middlewares=aurigraph-ratelimit@docker"
```

### 1.3 Deployment Commands

**Start Traefik alongside NGINX (Phase 1 - Testing):**

```bash
# Pull latest changes
git pull origin main

# Start Traefik profile (NGINX remains running)
docker-compose --profile traefik up -d traefik

# Verify Traefik is running
docker-compose ps | grep traefik
# Output: dlt-traefik   traefik:v3.0-alpine   "up" 5 minutes

# Access Traefik dashboard (if running locally)
# http://localhost:8080/dashboard/
```

**Verify both proxies are running:**

```bash
# Check NGINX (existing)
docker-compose ps | grep nginx
# Output: dlt-nginx-gateway   nginx:1.25-alpine   "up" 45 minutes

# Check Traefik (new)
docker-compose ps | grep traefik
# Output: dlt-traefik   traefik:v3.0-alpine   "up" 5 minutes

# Both running in parallel - traffic still flows through NGINX
```

**Health check for Traefik:**

```bash
# Check Traefik health
docker exec dlt-traefik traefik healthcheck --ping
# Output: pong

# Check Traefik dashboard accessibility
curl -s http://localhost:8080/ping
# Output: OK
```

---

## Phase 2: Gradual Traffic Migration (Next - 1 week)

### 2.1 DNS Switch (Parallel Test)

Update DNS records to point to Traefik while keeping NGINX active:

```bash
# Resolve dlt.aurigraph.io to test host IP
host dlt.aurigraph.io
# Current: points to NGINX IP
# After switch: points to Traefik IP (same server, different container)

# Both services handle traffic simultaneously
# Monitor response times and error rates
```

### 2.2 Monitoring Metrics

Track key metrics during parallel operation:

```bash
# Monitor NGINX traffic
docker-compose logs -f nginx-gateway | grep "HTTP/2"

# Monitor Traefik traffic
docker-compose logs -f traefik | grep "Request"

# Compare response times
time curl -s https://dlt.aurigraph.io/api/v11/health

# Check TLS certificate
echo | openssl s_client -connect dlt.aurigraph.io:443 -servername dlt.aurigraph.io
# Should show: CN = dlt.aurigraph.io (Let's Encrypt)
```

### 2.3 Success Criteria

- 100% API response rate through Traefik
- <100ms additional latency compared to NGINX
- Zero certificate errors
- All health checks passing
- Dashboard accessible and showing correct routing

---

## Phase 3: Full Migration (Week 2)

### 3.1 Stop NGINX

Once Traefik has been verified for 1 week:

```bash
# Stop NGINX (keep Traefik running)
docker-compose stop nginx-gateway

# Verify all traffic flowing through Traefik
curl -v https://dlt.aurigraph.io/api/v11/health
# Check response headers show Traefik routing
```

### 3.2 Remove NGINX Profile

Once confirmed stable, remove NGINX from production:

```bash
# Remove nginx-gateway from docker-compose.yml
# Comment out or delete the entire nginx-gateway service

# Rebuild services
docker-compose down
docker-compose up -d

# Remove NGINX image if desired
docker image rm nginx:1.25-alpine
```

### 3.3 Cleanup

```bash
# Remove NGINX config files (no longer needed)
rm -rf config/nginx/

# Remove nginx-gateway volume mounts from docker-compose.yml
```

---

## Configuration Reference

### Traefik Dashboard

**Access Dashboard:**
```
http://localhost:8080/dashboard/
```

**Dashboard Features:**
- Real-time HTTP request statistics
- Entrypoint status (HTTP, HTTPS)
- Routers configuration and status
- Services and middleware visibility
- Request/response metrics

### Label Syntax Reference

**Basic Routing:**
```yaml
traefik.enable=true                              # Enable service
traefik.http.routers.{name}.rule=...            # Routing rule
traefik.http.routers.{name}.entrypoints=...     # Entry point (web/websecure)
traefik.http.services.{name}.loadbalancer.server.port=XXX  # Backend port
```

**SSL/TLS:**
```yaml
traefik.http.routers.{name}.tls.certresolver=letsencrypt
traefik.http.services.{name}.loadbalancer.healthcheck.path=/health
traefik.http.services.{name}.loadbalancer.healthcheck.interval=30s
```

**Middleware (Compression, Rate Limiting):**
```yaml
traefik.http.middlewares.{name}.compress=true
traefik.http.middlewares.{name}.ratelimit.average=1000
traefik.http.middlewares.{name}.ratelimit.period=1s
traefik.http.routers.{name}.middlewares={middleware}@docker
```

---

## Troubleshooting

### Issue: Traefik not discovering services

**Solution:**
```bash
# Check if services are on dlt-frontend network
docker network inspect dlt-frontend

# Verify service labels
docker inspect dlt-portal | grep -A 20 Labels

# Check Traefik logs for discovery errors
docker logs dlt-traefik | grep "discovered\|error"
```

### Issue: Certificate errors after migration

**Solution:**
```bash
# Verify Let's Encrypt ACME storage
docker exec dlt-traefik cat /letsencrypt/acme.json | jq .

# Force certificate renewal
docker exec dlt-traefik traefik acme.renewal

# Check certificate expiration
openssl x509 -in /letsencrypt/acme.json -text -noout 2>/dev/null || \
  echo "acme.json is binary format, use Traefik's built-in renewal"
```

### Issue: High latency or timeouts

**Solution:**
```bash
# Check Traefik resource usage
docker stats dlt-traefik

# Increase timeouts if needed (add to command)
- "--entryPoints.websecure.address=:443"
- "--entryPoints.websecure.transport.respondingTimeouts.idleTimeout=90s"

# Check backend service health
curl http://localhost:9003/q/health
curl http://localhost:3000/health
```

### Issue: Dashboard not accessible

**Solution:**
```bash
# Verify API and dashboard are enabled
docker exec dlt-traefik traefik --help | grep -i dashboard

# Check port 8080 is not in use
lsof -i :8080

# Access through container
docker exec dlt-traefik curl -s http://localhost:8080/dashboard/
```

---

## Performance Comparison

### NGINX vs Traefik

| Aspect | NGINX | Traefik |
|--------|-------|---------|
| **Configuration** | Manual nginx.conf edits | Docker labels (auto-discovery) |
| **Reload downtime** | 100-500ms per reload | 0ms (hot reload) |
| **TLS/SSL Management** | Manual or Certbot | Automatic (Let's Encrypt) |
| **Load Balancing** | Round-robin, IP hash | Round-robin, URI hash, IP hash |
| **Health Checks** | Basic TCP/HTTP | Advanced with custom paths |
| **Middleware** | Limited built-in | Compression, rate limit, auth, etc. |
| **Dashboard** | Requires Nginx-UI | Built-in WebUI |
| **Startup Time** | ~500ms | ~100ms |
| **Memory Usage** | ~50MB | ~30MB |

### Annual Time Savings Estimate

**NGINX Operations:**
- Configuration reloads: 5 per week × 52 weeks × 1 hour = 260 hours
- Troubleshooting issues: 10 per year × 4 hours = 40 hours
- Certificate management: 12 per year × 2 hours = 24 hours
- **Total: ~324 hours/year**

**Traefik Operations:**
- Configuration: Automatic via labels
- Troubleshooting: Fewer issues due to auto-discovery
- Certificate management: Automatic via Let's Encrypt
- **Total: ~24 hours/year (mostly monitoring/optimization)**

**Savings: 300+ hours annually**

---

## Rollback Plan

If Traefik encounters critical issues:

```bash
# Step 1: Bring NGINX back online (if still configured)
docker-compose up -d nginx-gateway

# Step 2: Update DNS to point back to NGINX IP
# (Update DNS records)

# Step 3: Monitor traffic and verify stability
docker-compose logs -f nginx-gateway

# Step 4: Stop Traefik (keep container for debugging)
docker-compose stop traefik

# Step 5: Debug and diagnose issues
docker logs dlt-traefik > /tmp/traefik-debug.log
```

---

## Next Steps

1. **Immediate (Today)**: Deploy Traefik in parallel with NGINX
2. **Week 1**: Monitor metrics, verify all routes work correctly
3. **Week 2**: Cut over NGINX to Traefik (stop NGINX, keep Traefik running)
4. **Week 3**: Remove NGINX from docker-compose.yml if all stable
5. **Week 4+**: Optional - Explore advanced Traefik features:
   - Service mesh integration (Consul)
   - CanaryDeployments with weighted routing
   - Multi-cloud routing via Terraform labels

---

## References

- **Traefik Documentation**: https://doc.traefik.io/traefik/
- **Docker Labels for Traefik**: https://doc.traefik.io/traefik/providers/docker/
- **Let's Encrypt with Traefik**: https://doc.traefik.io/traefik/https/acme/
- **Traefik Comparison with NGINX**: https://doc.traefik.io/traefik/user-guides/

---

## Support

For issues or questions about Traefik migration:

1. Check Traefik logs: `docker logs dlt-traefik`
2. Access dashboard: `http://localhost:8080/dashboard/`
3. Review this guide's troubleshooting section
4. Consult Traefik documentation at https://doc.traefik.io/
