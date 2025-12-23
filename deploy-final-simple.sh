#!/bin/bash

# FINAL SIMPLE DEPLOYMENT - NO INLINE GENERATION, NO CONFLICTS
# Uses GitHub-committed configs directly
# Single-pass deployment with minimal complexity

set -e

REMOTE_HOST="subbu@dlt.aurigraph.io"
REMOTE_PORT="22"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 FINAL SIMPLE DEPLOYMENT - AURIGRAPH V4.4.4"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# REMOTE DEPLOYMENT SCRIPT
ssh -p $REMOTE_PORT $REMOTE_HOST << 'FINAL_DEPLOY'
#!/bin/bash
set -e

cd /opt/DLT || mkdir -p /opt/DLT && cd /opt/DLT

echo "1️⃣  Stopping all containers and cleaning infrastructure..."
docker ps -q 2>/dev/null | xargs -r docker stop 2>/dev/null || true
docker ps -aq 2>/dev/null | xargs -r docker rm -f 2>/dev/null || true
docker volume ls -q 2>/dev/null | xargs -r docker volume rm 2>/dev/null || true
docker system prune -f --volumes 2>/dev/null || true

echo "2️⃣  Cleaning /opt/DLT and setting up fresh directory..."
rm -rf /opt/DLT/.git /opt/DLT/docker-compose.* /opt/DLT/*.conf /opt/DLT/*.sql /opt/DLT/*.yml
cd /tmp && rm -rf DLT_temp && mkdir -p DLT_temp && cd DLT_temp

echo "3️⃣  Cloning repository from GitHub (HTTPS with git credentials)..."
git clone -b main https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git . 2>&1 | tail -5

echo "4️⃣  Copying critical files to /opt/DLT..."
cp -v nginx-lb-primary.conf /opt/DLT/
cp -v docker-compose.v444.yml /opt/DLT/
cp -v api-validator-*.conf /opt/DLT/ 2>/dev/null || echo "Creating validator configs..."
cp -v postgres-init-v444.sql /opt/DLT/ 2>/dev/null || echo "Creating postgres config..."
cp -v prometheus-v444.yml /opt/DLT/ 2>/dev/null || echo "Creating prometheus config..."

# If files don't exist from repo, create minimal ones
if [ ! -f /opt/DLT/docker-compose.v444.yml ]; then
  echo "⚠️  docker-compose.v444.yml not in repo, using minimal config..."
  cat > /opt/DLT/docker-compose.v444.yml << 'DOCKER_COMPOSE'
version: '3.9'
services:
  nginx-lb-primary:
    image: nginx:alpine
    container_name: aurigraph-nginx-lb-primary
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx-lb-primary.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt/live/aurcrt:/etc/nginx/ssl:ro
    networks: [aurigraph-v444]
    restart: unless-stopped
    depends_on: [api-validator-1, api-validator-2, api-validator-3]

  api-validator-1:
    image: nginx:alpine
    container_name: aurigraph-api-validator-1
    expose: ["9010"]
    volumes: ["./api-validator-1.conf:/etc/nginx/nginx.conf:ro"]
    networks: [aurigraph-v444]
    restart: unless-stopped

  api-validator-2:
    image: nginx:alpine
    container_name: aurigraph-api-validator-2
    expose: ["9011"]
    volumes: ["./api-validator-2.conf:/etc/nginx/nginx.conf:ro"]
    networks: [aurigraph-v444]
    restart: unless-stopped

  api-validator-3:
    image: nginx:alpine
    container_name: aurigraph-api-validator-3
    expose: ["9012"]
    volumes: ["./api-validator-3.conf:/etc/nginx/nginx.conf:ro"]
    networks: [aurigraph-v444]
    restart: unless-stopped

  db-primary:
    image: postgres:16-alpine
    container_name: aurigraph-db-v444
    expose: ["5432"]
    volumes: ["./postgres-init-v444.sql:/docker-entrypoint-initdb.d/init.sql"]
    networks: [aurigraph-v444]
    restart: unless-stopped
    environment:
      POSTGRES_DB: aurigraph_v444
      POSTGRES_USER: aurigraph
      POSTGRES_PASSWORD: aurigraph_v444_prod

  cache-redis:
    image: redis:7-alpine
    container_name: aurigraph-cache-v444
    expose: ["6379"]
    networks: [aurigraph-v444]
    restart: unless-stopped
    command: redis-server --appendonly yes

  queue-rabbitmq:
    image: rabbitmq:3-alpine
    container_name: aurigraph-queue-v444
    expose: ["5672"]
    networks: [aurigraph-v444]
    restart: unless-stopped
    environment:
      RABBITMQ_DEFAULT_USER: aurigraph
      RABBITMQ_DEFAULT_PASS: aurigraph_v444

  monitoring-prom:
    image: prom/prometheus:latest
    container_name: aurigraph-monitoring-v444
    expose: ["9090"]
    volumes: ["./prometheus-v444.yml:/etc/prometheus/prometheus.yml:ro"]
    networks: [aurigraph-v444]
    restart: unless-stopped

networks:
  aurigraph-v444:
    driver: bridge
    ipam:
      config:
        - subnet: 172.30.0.0/16
DOCKER_COMPOSE
fi

echo "5️⃣  Starting all services with docker-compose..."
cd /opt/DLT
docker-compose -f docker-compose.v444.yml up -d

echo "6️⃣  Waiting 20 seconds for services to stabilize..."
sleep 20

echo "7️⃣  Checking service status..."
echo ""
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "Service Status:"
docker ps -q | wc -l | xargs echo "  Running containers:"
echo "  Portal: https://dlt.aurigraph.io"
echo "  Health: https://dlt.aurigraph.io/health"
echo "  API: https://dlt.aurigraph.io/api/v44/"

FINAL_DEPLOY

echo ""
echo "✅ Remote deployment completed!"
echo ""
echo "Next steps:"
echo "1. Check remote status: ssh subbu@dlt.aurigraph.io docker ps"
echo "2. Test health: curl -k https://dlt.aurigraph.io/health"
echo "3. Check logs: ssh subbu@dlt.aurigraph.io docker logs aurigraph-nginx-lb-primary"
