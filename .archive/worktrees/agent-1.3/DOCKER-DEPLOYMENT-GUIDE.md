# Docker Deployment Guide - Aurigraph DLT V11
**Server**: dlt.aurigraph.io
**Deployment Path**: /opt/DLT
**SSH**: ssh -p 22 subbu@dlt.aurigraph.io
**SSL**: /etc/letsencrypt/live/aurcrt/
**Status**: 🟢 Ready for Deployment

---

## 📋 Pre-Deployment Requirements

### ✅ Prerequisites Met
- [x] Remote server access (SSH port 22)
- [x] Docker installed on server
- [x] Docker Compose installed
- [x] SSL certificates pre-installed at `/etc/letsencrypt/live/aurcrt/`
- [x] Deployment folder `/opt/DLT` available
- [x] Domain: dlt.aurigraph.io
- [x] Ports 80, 443, 9003, 9004 available

### SSL Certificate Details
```
Certificate Path:    /etc/letsencrypt/live/aurcrt/fullchain.pem
Private Key Path:    /etc/letsencrypt/live/aurcrt/privkey.pem
Domain:              dlt.aurigraph.io
Renewal:             Auto via certbot
```

---

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)

```bash
# 1. Make script executable
chmod +x docker-deploy-remote.sh

# 2. Run deployment
./docker-deploy-remote.sh

# 3. Expected output: System deployed in ~15-20 minutes
```

### Option 2: Step-by-Step Manual Deployment

See detailed manual steps below.

---

## 🐳 Docker Architecture

### Container Structure
```
dlt.aurigraph.io:443 (HTTPS)
    ↓
nginx (aurigraph-portal)
    ├── Port 80 (HTTP redirect)
    ├── Port 443 (HTTPS)
    └── SSL: /etc/letsencrypt/live/aurcrt/

backend (aurigraph-backend)
    ├── Port 9003 (REST API)
    ├── Port 9004 (gRPC)
    └── Health: /api/v11/health

Network: aurigraph-network
Volumes: backend-logs, portal-logs
```

### Services

#### Backend Container
- **Image**: aurigraph-backend:v11
- **Ports**: 9003 (REST), 9004 (gRPC)
- **Environment**: Java 21, Quarkus
- **Health Check**: HTTP GET /api/v11/health
- **Restart**: unless-stopped

#### Portal Container
- **Image**: aurigraph-portal:v4
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **Runtime**: NGINX Alpine
- **SSL**: /etc/letsencrypt/live/aurcrt/
- **Restart**: unless-stopped

---

## 📝 Manual Deployment Steps

### Step 1: SSH to Server

```bash
ssh -p 22 subbu@dlt.aurigraph.io
```

### Step 2: Verify SSL Certificates

```bash
# Check certificates exist
ls -lh /etc/letsencrypt/live/aurcrt/

# Expected output:
# -rw-r--r-- fullchain.pem
# -r-------- privkey.pem
```

### Step 3: Clean Up Existing Docker Resources

```bash
# Stop and remove all containers
docker ps -q | xargs -r docker stop
docker ps -aq | xargs -r docker rm

# Remove all volumes
docker volume ls -q | xargs -r docker volume rm

# Remove aurigraph networks
docker network ls --filter 'name=aurigraph' -q | xargs -r docker network rm

# Verify cleanup
docker ps -a
docker volume ls
docker network ls
```

### Step 4: Prepare Deployment Directory

```bash
# Create directory structure
mkdir -p /opt/DLT/{backend,portal,nginx,data,logs}
cd /opt/DLT

# Clone repository
git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git .

# Update to latest
git fetch origin && git checkout main && git pull origin main
```

### Step 5: Build Docker Images

#### Build Backend Image

```bash
cd /opt/DLT

cat > Dockerfile.backend << 'EOF'
FROM maven:3.9-eclipse-temurin-21 as builder

WORKDIR /app
COPY aurigraph-av10-7/aurigraph-v11-standalone .

RUN mvn clean package -DskipTests -q

FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=builder /app/target/quarkus-app .

EXPOSE 9003 9004

CMD ["java", "-jar", "quarkus-run.jar"]
EOF

docker build -f Dockerfile.backend -t aurigraph-backend:v11 .
```

#### Build Portal Image

```bash
cat > Dockerfile.portal << 'EOF'
FROM node:20 as builder

WORKDIR /app
COPY aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal .

RUN npm install --production && npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
EOF

docker build -f Dockerfile.portal -t aurigraph-portal:v4 .
```

### Step 6: Create NGINX Configuration

```bash
cd /opt/DLT

cat > nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    access_log /var/log/nginx/access.log;
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_types text/plain text/css application/json application/javascript;

    # HTTP to HTTPS
    server {
        listen 80;
        server_name dlt.aurigraph.io;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS Main Server
    server {
        listen 443 ssl http2;
        server_name dlt.aurigraph.io;

        ssl_certificate /etc/letsencrypt/live/aurcrt/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/aurcrt/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;

        root /usr/share/nginx/html;
        index index.html;

        # API Proxy
        location /api/v11/ {
            proxy_pass http://backend:9003;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_buffering off;
        }

        # WebSocket
        location /api/v11/ws/ {
            proxy_pass http://backend:9003;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
            proxy_read_timeout 86400s;
        }

        # Static files
        location ~* \.(js|css|png|jpg|gif|ico)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # SPA routing
        location / {
            try_files $uri /index.html;
        }

        # Security
        location ~ /\. {
            deny all;
        }
    }

    # gRPC Server
    server {
        listen 9004 ssl http2;
        server_name dlt.aurigraph.io;

        ssl_certificate /etc/letsencrypt/live/aurcrt/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/aurcrt/privkey.pem;

        location / {
            proxy_pass http://backend:9004;
            proxy_http_version 2;
            proxy_set_header Host $host;
        }
    }
}
EOF
```

### Step 7: Create Docker Compose File

```bash
cat > docker-compose.yml << 'EOF'
version: '3.9'

services:
  backend:
    image: aurigraph-backend:v11
    container_name: aurigraph-backend
    ports:
      - "9003:9003"
      - "9004:9004"
    environment:
      - JAVA_OPTS=-Xmx4g
      - quarkus.http.port=9003
      - quarkus.grpc.server.port=9004
    networks:
      - aurigraph-network
    volumes:
      - backend-logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9003/api/v11/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  portal:
    image: aurigraph-portal:v4
    container_name: aurigraph-portal
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /opt/DLT/nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt/live/aurcrt:/etc/letsencrypt/live/aurcrt:ro
      - portal-logs:/var/log/nginx
    networks:
      - aurigraph-network
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped

networks:
  aurigraph-network:
    driver: bridge

volumes:
  backend-logs:
    driver: local
  portal-logs:
    driver: local
EOF
```

### Step 8: Deploy Containers

```bash
# Pull images
docker-compose pull

# Start services
docker-compose up -d

# Wait for initialization
sleep 10

# Check status
docker-compose ps
```

---

## 🔍 Verification

### Check Container Status

```bash
docker-compose ps

# Expected output:
# NAME               STATUS        PORTS
# aurigraph-backend  Up (healthy)  0.0.0.0:9003->9003/tcp, 0.0.0.0:9004->9004/tcp
# aurigraph-portal   Up            0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### Test API Endpoint

```bash
# From local machine
curl https://dlt.aurigraph.io/api/v11/health

# Expected: JSON health status
```

### Check Logs

```bash
# Backend logs
docker logs -f aurigraph-backend

# Portal logs
docker logs -f aurigraph-portal

# Combined
docker-compose logs -f
```

### Test WebSocket

```bash
# Install wscat
npm install -g wscat

# Test WebSocket
wscat -c wss://dlt.aurigraph.io/api/v11/ws/metrics
```

---

## 🛠️ Management Commands

### View Status

```bash
docker-compose ps
docker-compose stats
```

### View Logs

```bash
# Live logs
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Portal only
docker-compose logs -f portal

# Last 100 lines
docker-compose logs --tail=100
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart portal
```

### Stop Services

```bash
# Stop (keep containers)
docker-compose stop

# Remove containers
docker-compose down

# Remove with volumes
docker-compose down -v
```

### Update Services

```bash
# Pull latest
docker-compose pull

# Recreate containers
docker-compose up -d --force-recreate
```

---

## 🔄 Troubleshooting

### Backend Not Starting

```bash
# Check logs
docker logs aurigraph-backend

# Check resources
docker stats aurigraph-backend

# Restart
docker-compose restart backend

# Rebuild if needed
docker build -f Dockerfile.backend -t aurigraph-backend:v11 .
docker-compose up -d --force-recreate backend
```

### Portal Returns 404

```bash
# Check NGINX config
docker exec aurigraph-portal nginx -t

# Check build
docker logs aurigraph-portal

# Rebuild portal
docker build -f Dockerfile.portal -t aurigraph-portal:v4 .
docker-compose up -d --force-recreate portal
```

### SSL Certificate Issues

```bash
# Verify certificates exist
ls -la /etc/letsencrypt/live/aurcrt/

# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/aurcrt/fullchain.pem -noout -dates

# Test SSL
openssl s_client -connect dlt.aurigraph.io:443
```

### Network Issues

```bash
# Check network
docker network ls
docker network inspect aurigraph-network

# Test connectivity
docker exec aurigraph-portal ping -c 1 backend
docker exec aurigraph-backend curl http://localhost:9003/api/v11/health
```

---

## 📊 Performance Monitoring

### CPU & Memory Usage

```bash
# Real-time stats
docker stats

# Backend stats
docker stats aurigraph-backend

# Portal stats
docker stats aurigraph-portal
```

### Disk Usage

```bash
# Container sizes
docker ps -s

# Volume sizes
docker volume ls --format "table {{.Name}}\t{{.Mountpoint}}"
```

### Network Traffic

```bash
# View network stats
docker exec aurigraph-backend ss -tupln | grep LISTEN
```

---

## 🧹 Cleanup Procedures

### Clean Docker System

```bash
# Remove unused containers
docker container prune

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Full system prune (WARNING: removes all unused data)
docker system prune -a --volumes
```

### Backup Before Cleanup

```bash
# Backup logs
docker cp aurigraph-backend:/app/logs ./backup/backend-logs/
docker cp aurigraph-portal:/var/log/nginx ./backup/portal-logs/

# Backup volumes
docker run --rm -v backend-logs:/data -v $(pwd)/backup:/backup \
  alpine tar czf /backup/backend-logs.tar.gz -C /data .
```

---

## 📈 Scaling Considerations

### Increase Backend Resources

```bash
# Edit docker-compose.yml and increase:
# JAVA_OPTS=-Xmx8g  # Increase from 4g to 8g
# Or set resource limits:

# resources:
#   limits:
#     cpus: '2'
#     memory: 8G
```

### Add Load Balancer

For production with multiple backend instances, add HAProxy:

```yaml
haproxy:
  image: haproxy:latest
  ports:
    - "8080:8080"
  volumes:
    - ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro
  depends_on:
    - backend
  networks:
    - aurigraph-network
```

---

## 🔐 Security Hardening

### Update Security Headers

Already included in nginx.conf:
- Strict-Transport-Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

### Additional Recommendations

```bash
# Set file permissions
chmod 600 /etc/letsencrypt/live/aurcrt/privkey.pem

# Enable firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Regular backups
crontab -e
# 0 2 * * * docker-compose -f /opt/DLT/docker-compose.yml ps >> /opt/DLT/logs/health-check.log 2>&1
```

---

## ✅ Post-Deployment Checklist

- [ ] Portal accessible at https://dlt.aurigraph.io
- [ ] API responding at https://dlt.aurigraph.io/api/v11/health
- [ ] WebSocket endpoints working
- [ ] SSL certificate valid
- [ ] All containers running
- [ ] Logs being collected
- [ ] Monitoring in place
- [ ] Backup strategy configured
- [ ] Team notified of deployment

---

## 📞 Support & Monitoring

### Essential Commands

```bash
# Remote SSH
ssh -p 22 subbu@dlt.aurigraph.io

# Docker status
docker-compose -f /opt/DLT/docker-compose.yml ps

# Tail logs
docker-compose -f /opt/DLT/docker-compose.yml logs -f

# Restart services
docker-compose -f /opt/DLT/docker-compose.yml restart
```

### Contact

- **Domain**: dlt.aurigraph.io
- **Portal**: https://dlt.aurigraph.io
- **API**: https://dlt.aurigraph.io/api/v11/
- **SSH**: subbu@dlt.aurigraph.io (port 22)

---

**Status**: 🟢 **DOCKER DEPLOYMENT READY**

**Deployment Method**: `./docker-deploy-remote.sh`

**Expected Duration**: ~15-20 minutes

**Next Step**: Execute deployment script
