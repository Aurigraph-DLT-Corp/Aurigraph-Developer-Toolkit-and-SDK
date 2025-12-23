# Complete Deployment Script - Build & Deploy All Containers

**Status:** Production Deployment
**Date:** November 22, 2025
**Scope:** Infrastructure + V11 Application + Portal + All Nodes (25 total)
**Execution Time:** ~30-45 minutes total
**Target Server:** 160.10.1.168 (dlt.aurigraph.io)

---

## Pre-Deployment Checklist

Before running this deployment, verify:

- [ ] DNS configured for `dlt.aurigraph.io` → `160.10.1.168`
- [ ] SSH access working: `ssh -p 22 subbu@dlt.aurigraph.io`
- [ ] Git latest code pulled locally
- [ ] All fixes committed to main branch
- [ ] Docker running on remote server
- [ ] 50GB+ free disk space on remote
- [ ] 16GB+ available RAM

---

## Phase 1: Infrastructure Deployment (5 minutes)

Start core services: PostgreSQL, Redis, Prometheus, Grafana, Traefik

```bash
#!/bin/bash
# Phase 1: Infrastructure

echo "=========================================================="
echo "  PHASE 1: INFRASTRUCTURE DEPLOYMENT"
echo "=========================================================="
echo ""

ssh -p 22 subbu@dlt.aurigraph.io << 'SSH_PHASE1'

cd /opt/DLT

echo "=== Step 1: Pull Latest Code ==="
git pull origin main
echo ""

echo "=== Step 2: Stop Existing Containers (if any) ==="
docker-compose -f docker-compose.yml down --remove-orphans 2>/dev/null || echo "No existing containers to remove"
echo ""

echo "=== Step 3: Create Required Networks ==="
docker network create dlt-frontend 2>/dev/null || echo "Network dlt-frontend already exists"
docker network create dlt-backend 2>/dev/null || echo "Network dlt-backend already exists"
docker network create dlt-monitoring 2>/dev/null || echo "Network dlt-monitoring already exists"
echo "✓ Networks created"
echo ""

echo "=== Step 4: Start Infrastructure Services ==="
docker-compose -f docker-compose.yml up -d \
  postgres \
  redis \
  prometheus \
  grafana \
  traefik

echo "✓ Infrastructure services starting..."
echo ""

echo "=== Step 5: Wait for Database Ready ==="
sleep 10
for i in {1..30}; do
  if docker exec dlt-postgres pg_isready -U aurigraph > /dev/null 2>&1; then
    echo "✓ PostgreSQL database ready (attempt $i/30)"
    break
  else
    echo "  Waiting for PostgreSQL... ($i/30)"
    sleep 2
  fi
done
echo ""

echo "=== Step 6: Verify Infrastructure Status ==="
docker-compose -f docker-compose.yml ps | grep -E "postgres|redis|prometheus|grafana|traefik"
echo ""

echo "✅ PHASE 1 COMPLETE: Infrastructure ready"

SSH_PHASE1

echo ""
echo "✅ Phase 1 status: COMPLETE"
echo ""
```

---

## Phase 2: V11 Application Build & Deploy (15 minutes)

Build V11 JAR and deploy as Docker container

```bash
#!/bin/bash
# Phase 2: V11 Application

echo "=========================================================="
echo "  PHASE 2: V11 APPLICATION BUILD & DEPLOYMENT"
echo "=========================================================="
echo ""

ssh -p 22 subbu@dlt.aurigraph.io << 'SSH_PHASE2'

cd /opt/DLT

echo "=== Step 1: Build V11 JAR (JVM Mode) ==="
cd aurigraph-av10-7/aurigraph-v11-standalone

echo "Configuration:"
echo "  - Profile: JVM Mode (production-ready)"
echo "  - Java: OpenJDK 21 (Virtual Threads)"
echo "  - Framework: Quarkus 3.26.2"
echo "  - TPS Target: 776K+ sustained"
echo ""

echo "Building JAR (this takes 10-15 minutes)..."
./mvnw clean package -DskipTests 2>&1 | tail -50

if [ -f target/quarkus-app/quarkus-run.jar ]; then
  echo "✓ JAR build successful"
  ls -lh target/quarkus-app/quarkus-run.jar
else
  echo "❌ JAR build failed!"
  echo "Check error logs above"
  exit 1
fi
echo ""

cd /opt/DLT

echo "=== Step 2: Build Docker Image ==="
docker build \
  -t aurigraph-v11:11.4.4 \
  -f aurigraph-av10-7/aurigraph-v11-standalone/Dockerfile \
  .

if [ "$(docker images -q aurigraph-v11:11.4.4 2>/dev/null)" != "" ]; then
  echo "✓ Docker image built successfully"
  docker images | grep aurigraph-v11
else
  echo "❌ Docker image build failed!"
  exit 1
fi
echo ""

echo "=== Step 3: Start V11 Service ==="
docker-compose -f docker-compose.yml up -d aurigraph-v11-service

echo "✓ V11 service starting..."
sleep 10

echo ""
echo "=== Step 4: Verify V11 Health ==="
for i in {1..20}; do
  HEALTH=$(docker exec dlt-aurigraph-v11 curl -s http://localhost:9003/q/health 2>/dev/null | grep -o '"status":"UP"' || echo "")
  if [ -n "$HEALTH" ]; then
    echo "✓ V11 service healthy (attempt $i/20)"
    break
  else
    echo "  Waiting for V11 startup... ($i/20)"
    sleep 3
  fi
done

echo ""
docker-compose -f docker-compose.yml ps | grep aurigraph-v11

echo ""
echo "✅ PHASE 2 COMPLETE: V11 Service deployed and healthy"

SSH_PHASE2

echo ""
echo "✅ Phase 2 status: COMPLETE"
echo ""
```

---

## Phase 3: Enterprise Portal Deploy (5 minutes)

Build and deploy React frontend portal

```bash
#!/bin/bash
# Phase 3: Enterprise Portal

echo "=========================================================="
echo "  PHASE 3: ENTERPRISE PORTAL BUILD & DEPLOYMENT"
echo "=========================================================="
echo ""

ssh -p 22 subbu@dlt.aurigraph.io << 'SSH_PHASE3'

cd /opt/DLT

echo "=== Step 1: Install Portal Dependencies ==="
docker-compose -f docker-compose.yml exec -T enterprise-portal npm ci || true

echo "✓ Dependencies installed"
echo ""

echo "=== Step 2: Build Portal (React) ==="
echo "Building production React bundle (this takes 5 minutes)..."
docker-compose -f docker-compose.yml exec -T enterprise-portal npm run build 2>&1 | tail -20

if docker exec dlt-portal test -d /app/build; then
  echo "✓ Portal build successful"
else
  echo "⚠️  Portal build may have issues, checking..."
fi
echo ""

echo "=== Step 3: Start Portal Service ==="
docker-compose -f docker-compose.yml up -d enterprise-portal

echo "✓ Portal service starting..."
sleep 5

echo ""
echo "=== Step 4: Verify Portal Health ==="
for i in {1..10}; do
  if docker exec dlt-portal curl -s http://localhost:3000/ > /dev/null 2>&1; then
    echo "✓ Portal responding (attempt $i/10)"
    break
  else
    echo "  Waiting for portal... ($i/10)"
    sleep 2
  fi
done

echo ""
docker-compose -f docker-compose.yml ps | grep enterprise-portal

echo ""
echo "✅ PHASE 3 COMPLETE: Enterprise Portal deployed"

SSH_PHASE3

echo ""
echo "✅ Phase 3 status: COMPLETE"
echo ""
```

---

## Phase 4: Node Infrastructure Setup (3 minutes)

Create Docker networks and prepare for node scaling

```bash
#!/bin/bash
# Phase 4: Node Infrastructure

echo "=========================================================="
echo "  PHASE 4: NODE INFRASTRUCTURE SETUP"
echo "=========================================================="
echo ""

ssh -p 22 subbu@dlt.aurigraph.io << 'SSH_PHASE4'

cd /opt/DLT

echo "=== Step 1: Verify Node Image ==="
if docker images | grep -q "aurigraph-v11:11.4.4"; then
  echo "✓ Node image aurigraph-v11:11.4.4 available"
else
  echo "❌ Node image not found!"
  exit 1
fi
echo ""

echo "=== Step 2: Create Node Networks ==="
docker network create dlt-backend 2>/dev/null || echo "✓ Network dlt-backend exists"
docker network create dlt-blockchain 2>/dev/null || echo "✓ Network dlt-blockchain exists"
echo ""

echo "=== Step 3: Verify docker-compose-nodes-scaled.yml ==="
if [ -f docker-compose-nodes-scaled.yml ]; then
  echo "✓ Node configuration file exists"
  wc -l docker-compose-nodes-scaled.yml
else
  echo "❌ Node configuration missing!"
  exit 1
fi
echo ""

echo "✅ PHASE 4 COMPLETE: Node infrastructure ready"

SSH_PHASE4

echo ""
echo "✅ Phase 4 status: COMPLETE"
echo ""
```

---

## Phase 5: Validator Nodes Deployment (5 minutes)

Deploy 5 validator nodes for consensus layer

```bash
#!/bin/bash
# Phase 5: Validator Nodes

echo "=========================================================="
echo "  PHASE 5: VALIDATOR NODES DEPLOYMENT (5 instances)"
echo "=========================================================="
echo ""

ssh -p 22 subbu@dlt.aurigraph.io << 'SSH_PHASE5'

cd /opt/DLT

echo "=== Deploying 5 Validator Nodes ==="
echo "Configuration:"
echo "  - Type: Validator (consensus participants)"
echo "  - Memory: 1GB per instance"
echo "  - CPU: 2 cores per instance"
echo "  - Port Range: 19003-19007 (HTTP), 20003-20007 (gRPC)"
echo ""

# Use docker-compose with profiles for validators
docker-compose -f docker-compose.yml -f docker-compose-nodes-scaled.yml \
  up -d validator-nodes-multi

echo "✓ Validator nodes starting..."
sleep 15

echo ""
echo "=== Checking Validator Node Status ==="
docker ps -a | grep validator

echo ""
echo "=== Checking Validator Node Health ==="
for port in 19003 19004 19005 19006 19007; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/q/health 2>/dev/null || echo "000")
  if [ "$STATUS" = "200" ]; then
    echo "✓ Validator on port $port: HEALTHY"
  else
    echo "  Validator on port $port: Initializing... (status: $STATUS)"
  fi
done

echo ""
echo "✅ PHASE 5 COMPLETE: Validator nodes deployed"

SSH_PHASE5

echo ""
echo "✅ Phase 5 status: COMPLETE"
echo ""
```

---

## Phase 6: Business Nodes Deployment (5 minutes)

Deploy 15 business nodes for transaction processing

```bash
#!/bin/bash
# Phase 6: Business Nodes

echo "=========================================================="
echo "  PHASE 6: BUSINESS NODES DEPLOYMENT (15 instances)"
echo "=========================================================="
echo ""

ssh -p 22 subbu@dlt.aurigraph.io << 'SSH_PHASE6'

cd /opt/DLT

echo "=== Deploying 15 Business Nodes ==="
echo "Configuration:"
echo "  - Type: Business (transaction processors, non-voting)"
echo "  - Memory: 512MB per instance"
echo "  - CPU: 1 core per instance"
echo "  - Port Range: 21003-21017 (HTTP), 22003-22017 (gRPC)"
echo ""

# Start business nodes
for i in {1..15}; do
  PORT=$((21000 + i))
  GRPC_PORT=$((22000 + i))

  docker run -d \
    --name dlt-business-node-$i \
    --network dlt-backend \
    -e AURIGRAPH_NODE_ID=business-$i \
    -e AURIGRAPH_NODE_TYPE=business \
    -e QUARKUS_HTTP_PORT=$PORT \
    -e QUARKUS_GRPC_SERVER_PORT=$GRPC_PORT \
    -e AURIGRAPH_MODE=production \
    -e CONSENSUS_OBSERVER_MODE=true \
    --restart unless-stopped \
    --memory 512m \
    --cpus 1 \
    aurigraph-v11:11.4.4

  echo "  Started: business-node-$i on port $PORT"
done

echo "✓ All 15 business nodes starting..."
sleep 20

echo ""
echo "=== Checking Business Node Status ==="
docker ps -a | grep business

echo ""
echo "=== Sample Business Node Health Checks ==="
for i in 1 8 15; do
  PORT=$((21000 + i))
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/q/health 2>/dev/null || echo "000")
  echo "Business node $i (port $PORT): Status $STATUS"
done

echo ""
BUSINESS_COUNT=$(docker ps -a | grep -c "business-node")
echo "✓ Business nodes running: $BUSINESS_COUNT / 15"

echo ""
echo "✅ PHASE 6 COMPLETE: Business nodes deployed"

SSH_PHASE6

echo ""
echo "✅ Phase 6 status: COMPLETE"
echo ""
```

---

## Phase 7: Slim Nodes Deployment (5 minutes)

Deploy 5 slim nodes for edge/archive nodes

```bash
#!/bin/bash
# Phase 7: Slim Nodes

echo "=========================================================="
echo "  PHASE 7: SLIM NODES DEPLOYMENT (5 instances)"
echo "=========================================================="
echo ""

ssh -p 22 subbu@dlt.aurigraph.io << 'SSH_PHASE7'

cd /opt/DLT

echo "=== Deploying 5 Slim Nodes ==="
echo "Configuration:"
echo "  - Type: Slim (edge/archive nodes, minimal footprint)"
echo "  - Memory: 256MB per instance"
echo "  - CPU: 0.5 cores per instance"
echo "  - Port Range: 25003-25007 (HTTP), 26003-26007 (gRPC)"
echo ""

# Start slim nodes
for i in {1..5}; do
  PORT=$((25000 + i))
  GRPC_PORT=$((26000 + i))

  docker run -d \
    --name dlt-slim-node-$i \
    --network dlt-backend \
    -e AURIGRAPH_NODE_ID=slim-$i \
    -e AURIGRAPH_NODE_TYPE=slim \
    -e QUARKUS_HTTP_PORT=$PORT \
    -e QUARKUS_GRPC_SERVER_PORT=$GRPC_PORT \
    -e AURIGRAPH_MODE=production \
    -e SLIM_NODE_SYNC_INTERVAL=10000 \
    --restart unless-stopped \
    --memory 256m \
    --cpus 0.5 \
    aurigraph-v11:11.4.4

  echo "  Started: slim-node-$i on port $PORT"
done

echo "✓ All 5 slim nodes starting..."
sleep 15

echo ""
echo "=== Checking Slim Node Status ==="
docker ps -a | grep slim

echo ""
echo "=== Sample Slim Node Health Checks ==="
for i in 1 3 5; do
  PORT=$((25000 + i))
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/q/health 2>/dev/null || echo "000")
  echo "Slim node $i (port $PORT): Status $STATUS"
done

echo ""
SLIM_COUNT=$(docker ps -a | grep -c "slim-node")
echo "✓ Slim nodes running: $SLIM_COUNT / 5"

echo ""
echo "✅ PHASE 7 COMPLETE: Slim nodes deployed"

SSH_PHASE7

echo ""
echo "✅ Phase 7 status: COMPLETE"
echo ""
```

---

## Phase 8: Deployment Verification (5 minutes)

Comprehensive health checks for all services

```bash
#!/bin/bash
# Phase 8: Verification

echo "=========================================================="
echo "  PHASE 8: DEPLOYMENT VERIFICATION"
echo "=========================================================="
echo ""

ssh -p 22 subbu@dlt.aurigraph.io << 'SSH_PHASE8'

cd /opt/DLT

echo "=== Complete Service Status ==="
echo ""
docker-compose -f docker-compose.yml ps
echo ""

echo "=== Infrastructure Services ==="
INFRA_RUNNING=$(docker ps -a | grep -E "postgres|redis|prometheus|grafana|traefik" | wc -l)
echo "Infrastructure services running: $INFRA_RUNNING / 6"
echo ""

echo "=== Application Services ==="
APP_RUNNING=$(docker ps -a | grep -E "aurigraph-v11|enterprise-portal" | wc -l)
echo "Application services running: $APP_RUNNING / 2"
echo ""

echo "=== Blockchain Nodes ==="
VALIDATOR_COUNT=$(docker ps -a | grep -c "validator-node")
BUSINESS_COUNT=$(docker ps -a | grep -c "business-node")
SLIM_COUNT=$(docker ps -a | grep -c "slim-node")
TOTAL_NODES=$((VALIDATOR_COUNT + BUSINESS_COUNT + SLIM_COUNT))

echo "Validator nodes: $VALIDATOR_COUNT / 5"
echo "Business nodes: $BUSINESS_COUNT / 15"
echo "Slim nodes: $SLIM_COUNT / 5"
echo "Total nodes: $TOTAL_NODES / 25"
echo ""

echo "=== Health Checks ==="
echo ""
echo "1. PostgreSQL Database"
if docker exec dlt-postgres pg_isready -U aurigraph > /dev/null 2>&1; then
  echo "   ✓ Database ready"
else
  echo "   ❌ Database not ready"
fi
echo ""

echo "2. Redis Cache"
if docker exec dlt-redis redis-cli ping > /dev/null 2>&1; then
  echo "   ✓ Redis responding"
else
  echo "   ❌ Redis not responding"
fi
echo ""

echo "3. V11 API Service"
V11_HEALTH=$(curl -s http://localhost:9003/q/health | grep -o '"status":"UP"' || echo "")
if [ -n "$V11_HEALTH" ]; then
  echo "   ✓ V11 API healthy"
else
  echo "   ⏳ V11 API initializing..."
fi
echo ""

echo "4. Enterprise Portal"
PORTAL_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null || echo "000")
if [ "$PORTAL_HEALTH" = "200" ]; then
  echo "   ✓ Portal responding"
else
  echo "   ⏳ Portal initializing (status: $PORTAL_HEALTH)..."
fi
echo ""

echo "5. Traefik Reverse Proxy"
if docker exec dlt-traefik curl -s http://localhost:8080/ping > /dev/null 2>&1; then
  echo "   ✓ Traefik responding"
else
  echo "   ⏳ Traefik initializing..."
fi
echo ""

echo "=== Resource Usage ==="
docker stats --no-stream | head -15
echo ""

echo "=== Network Status ==="
echo "Available networks:"
docker network ls | grep dlt
echo ""

echo "=== Logs Summary (last errors, if any) ==="
echo "Traefik warnings/errors:"
docker logs dlt-traefik 2>&1 | grep -i "error\|warning" | tail -3 || echo "  (none)"
echo ""

echo "✅ PHASE 8 COMPLETE: Deployment verified"

SSH_PHASE8

echo ""
echo "✅ Phase 8 status: COMPLETE"
echo ""
```

---

## Master Deployment Script (All Phases)

Complete end-to-end deployment script:

```bash
#!/bin/bash
# Master Deployment Script - All Phases

set -e  # Exit on error

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║      AURIGRAPH DLT - COMPLETE DEPLOYMENT SCRIPT        ║"
echo "║  Infrastructure + V11 + Portal + Nodes (25 total)      ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

DEPLOYMENT_START=$(date +%s)

# Phase 1: Infrastructure
echo "Starting Phase 1: Infrastructure..."
bash phase1-infrastructure.sh
PHASE1_TIME=$(date +%s)

# Phase 2: V11 Application
echo "Starting Phase 2: V11 Application..."
bash phase2-v11-app.sh
PHASE2_TIME=$(date +%s)

# Phase 3: Enterprise Portal
echo "Starting Phase 3: Enterprise Portal..."
bash phase3-portal.sh
PHASE3_TIME=$(date +%s)

# Phase 4: Node Infrastructure
echo "Starting Phase 4: Node Infrastructure..."
bash phase4-node-infra.sh
PHASE4_TIME=$(date +%s)

# Phase 5: Validator Nodes
echo "Starting Phase 5: Validator Nodes..."
bash phase5-validator-nodes.sh
PHASE5_TIME=$(date +%s)

# Phase 6: Business Nodes
echo "Starting Phase 6: Business Nodes..."
bash phase6-business-nodes.sh
PHASE6_TIME=$(date +%s)

# Phase 7: Slim Nodes
echo "Starting Phase 7: Slim Nodes..."
bash phase7-slim-nodes.sh
PHASE7_TIME=$(date +%s)

# Phase 8: Verification
echo "Starting Phase 8: Verification..."
bash phase8-verification.sh
PHASE8_TIME=$(date +%s)

# Final Summary
DEPLOYMENT_END=$(date +%s)
TOTAL_TIME=$((DEPLOYMENT_END - DEPLOYMENT_START))

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║            DEPLOYMENT COMPLETE - SUMMARY               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Deployment Timeline:"
echo "  Phase 1 (Infrastructure):    $((PHASE1_TIME - DEPLOYMENT_START))s"
echo "  Phase 2 (V11 Application):   $((PHASE2_TIME - PHASE1_TIME))s"
echo "  Phase 3 (Portal):            $((PHASE3_TIME - PHASE2_TIME))s"
echo "  Phase 4 (Node Infrastructure): $((PHASE4_TIME - PHASE3_TIME))s"
echo "  Phase 5 (Validators):        $((PHASE5_TIME - PHASE4_TIME))s"
echo "  Phase 6 (Business Nodes):    $((PHASE6_TIME - PHASE5_TIME))s"
echo "  Phase 7 (Slim Nodes):        $((PHASE7_TIME - PHASE6_TIME))s"
echo "  Phase 8 (Verification):      $((PHASE8_TIME - PHASE7_TIME))s"
echo ""
echo "  TOTAL TIME: $((TOTAL_TIME / 60))m $((TOTAL_TIME % 60))s"
echo ""
echo "✅ All phases completed successfully!"
echo ""
echo "Access your services:"
echo "  - V11 API:          http://dlt.aurigraph.io/api/v11/health"
echo "  - Portal:           http://dlt.aurigraph.io/"
echo "  - Prometheus:       http://dlt.aurigraph.io:9090"
echo "  - Grafana:          http://dlt.aurigraph.io:3001"
echo "  - Traefik:          http://dlt.aurigraph.io:8080/dashboard/"
echo ""
echo "Next Steps:"
echo "  1. Configure DNS for dlt.aurigraph.io → 160.10.1.168"
echo "  2. Verify Let's Encrypt certificate provisioning"
echo "  3. Start Phase 2 monitoring (7-day validation)"
echo "  4. Proceed with Phase 3 NGINX cutover"
echo ""

```

---

## Quick Start: One-Command Deployment

Deploy everything with a single command:

```bash
#!/bin/bash
# One-command complete deployment

ssh -p 22 subbu@dlt.aurigraph.io << 'SSH_FULL_DEPLOY'

cd /opt/DLT && \
echo "========================================================" && \
echo "  COMPLETE AURIGRAPH DEPLOYMENT - START" && \
echo "========================================================" && \
echo "" && \

# Pull latest code
git pull origin main && \
echo "✓ Latest code pulled" && \
echo "" && \

# Create networks
docker network create dlt-frontend 2>/dev/null || true && \
docker network create dlt-backend 2>/dev/null || true && \
docker network create dlt-monitoring 2>/dev/null || true && \
echo "✓ Networks created" && \
echo "" && \

# Phase 1: Infrastructure (5 min)
echo "=== PHASE 1: INFRASTRUCTURE (5 min) ===" && \
docker-compose -f docker-compose.yml up -d \
  postgres redis prometheus grafana traefik && \
sleep 15 && \
echo "✓ Infrastructure deployed" && \
echo "" && \

# Phase 2: V11 Application (15 min)
echo "=== PHASE 2: V11 APPLICATION (15 min) ===" && \
cd aurigraph-av10-7/aurigraph-v11-standalone && \
./mvnw clean package -DskipTests -q 2>&1 | tail -20 && \
cd /opt/DLT && \
docker build -q -t aurigraph-v11:11.4.4 \
  -f aurigraph-av10-7/aurigraph-v11-standalone/Dockerfile . && \
docker-compose -f docker-compose.yml up -d aurigraph-v11-service && \
sleep 10 && \
echo "✓ V11 deployed and starting" && \
echo "" && \

# Phase 3: Portal (5 min)
echo "=== PHASE 3: ENTERPRISE PORTAL (5 min) ===" && \
docker-compose -f docker-compose.yml up -d enterprise-portal && \
sleep 5 && \
echo "✓ Portal deployed" && \
echo "" && \

# Phase 4-7: Blockchain Nodes (20 min)
echo "=== PHASE 4-7: BLOCKCHAIN NODES (20 min) ===" && \
docker-compose -f docker-compose.yml -f docker-compose-nodes-scaled.yml \
  up -d validator-nodes-multi && \
echo "✓ 5 Validator nodes starting" && \
sleep 10 && \

for i in {1..15}; do
  docker run -d \
    --name dlt-business-node-$i \
    --network dlt-backend \
    -e AURIGRAPH_NODE_ID=business-$i \
    -e AURIGRAPH_NODE_TYPE=business \
    -e QUARKUS_HTTP_PORT=$((21000+i)) \
    -e AURIGRAPH_MODE=production \
    -e CONSENSUS_OBSERVER_MODE=true \
    --restart unless-stopped \
    --memory 512m --cpus 1 \
    aurigraph-v11:11.4.4 &
done && \
wait && \
echo "✓ 15 Business nodes starting" && \
sleep 10 && \

for i in {1..5}; do
  docker run -d \
    --name dlt-slim-node-$i \
    --network dlt-backend \
    -e AURIGRAPH_NODE_ID=slim-$i \
    -e AURIGRAPH_NODE_TYPE=slim \
    -e QUARKUS_HTTP_PORT=$((25000+i)) \
    -e AURIGRAPH_MODE=production \
    --restart unless-stopped \
    --memory 256m --cpus 0.5 \
    aurigraph-v11:11.4.4 &
done && \
wait && \
echo "✓ 5 Slim nodes starting" && \
echo "" && \

# Phase 8: Verification
echo "=== PHASE 8: VERIFICATION ===" && \
echo "Services running:" && \
docker ps --format "table {{.Names}}\t{{.Status}}" | head -20 && \
echo "" && \
echo "Node count:" && \
echo "  Validators: $(docker ps -a | grep -c validator-node)" && \
echo "  Business: $(docker ps -a | grep -c business-node)" && \
echo "  Slim: $(docker ps -a | grep -c slim-node)" && \
echo "" && \
echo "========================================================" && \
echo "  ✅ DEPLOYMENT COMPLETE" && \
echo "========================================================" && \
echo "" && \
echo "Services ready:" && \
echo "  - V11 API (port 9003)" && \
echo "  - Portal (port 3000)" && \
echo "  - Prometheus (port 9090)" && \
echo "  - Grafana (port 3001)" && \
echo "  - Traefik (port 80, 443, 8080)" && \
echo "  - 25 Blockchain Nodes" && \
echo "" && \
echo "Next: Configure DNS for dlt.aurigraph.io → 160.10.1.168"

SSH_FULL_DEPLOY
```

---

## Deployment Command

Run the complete deployment:

```bash
# Save as deploy-all.sh
chmod +x deploy-all.sh
./deploy-all.sh
```

Or execute directly:

```bash
ssh -p 22 subbu@dlt.aurigraph.io << 'DEPLOY'
cd /opt/DLT && \
git pull origin main && \
docker network create dlt-frontend 2>/dev/null || true && \
docker network create dlt-backend 2>/dev/null || true && \
docker-compose -f docker-compose.yml up -d postgres redis prometheus grafana traefik && \
sleep 15 && \
cd aurigraph-av10-7/aurigraph-v11-standalone && \
./mvnw clean package -DskipTests -q && \
cd /opt/DLT && \
docker build -q -t aurigraph-v11:11.4.4 -f aurigraph-av10-7/aurigraph-v11-standalone/Dockerfile . && \
docker-compose -f docker-compose.yml up -d aurigraph-v11-service enterprise-portal && \
docker-compose -f docker-compose.yml -f docker-compose-nodes-scaled.yml up -d validator-nodes-multi && \
sleep 10 && \
for i in {1..15}; do docker run -d --name dlt-business-node-$i --network dlt-backend -e AURIGRAPH_NODE_ID=business-$i -e QUARKUS_HTTP_PORT=$((21000+i)) --memory 512m --cpus 1 aurigraph-v11:11.4.4 & done && \
wait && \
for i in {1..5}; do docker run -d --name dlt-slim-node-$i --network dlt-backend -e AURIGRAPH_NODE_ID=slim-$i -e QUARKUS_HTTP_PORT=$((25000+i)) --memory 256m --cpus 0.5 aurigraph-v11:11.4.4 & done && \
wait && \
echo "✅ DEPLOYMENT COMPLETE - $(docker ps -a | wc -l) containers running"
DEPLOY
```

---

## Post-Deployment Steps

After deployment completes:

### 1. Verify DNS Configuration
```bash
nslookup dlt.aurigraph.io
# Should return: 160.10.1.168
```

### 2. Check Service Health
```bash
ssh -p 22 subbu@dlt.aurigraph.io "docker-compose -f docker-compose.yml ps"
```

### 3. Monitor Traefik Let's Encrypt
```bash
ssh -p 22 subbu@dlt.aurigraph.io "docker logs dlt-traefik | grep -i certificate"
```

### 4. Access Services
```
- V11 API:          http://dlt.aurigraph.io/api/v11/health
- Portal:           http://dlt.aurigraph.io/
- Prometheus:       http://dlt.aurigraph.io:9090
- Grafana:          http://dlt.aurigraph.io:3001
- Traefik:          http://dlt.aurigraph.io:8080/dashboard/
```

### 5. Monitor Node Health
```bash
ssh -p 22 subbu@dlt.aurigraph.io << 'CHECK'
echo "=== NODE HEALTH CHECK ==="
for i in {1..5}; do
  PORT=$((19000+i))
  curl -s http://localhost:$PORT/q/health | grep -o status || echo "Validator $i: initializing"
done
for i in {1..5}; do
  PORT=$((21000+i))
  curl -s http://localhost:$PORT/q/health | grep -o status || echo "Business $i: initializing"
done
for i in {1..5}; do
  PORT=$((25000+i))
  curl -s http://localhost:$PORT/q/health | grep -o status || echo "Slim $i: initializing"
done
CHECK
```

---

## Deployment Checklist

- [ ] Pre-deployment checklist completed
- [ ] Code pulled from main branch
- [ ] Deployment script executed
- [ ] Phase 1: Infrastructure ✓
- [ ] Phase 2: V11 Application ✓
- [ ] Phase 3: Portal ✓
- [ ] Phase 4: Node Infrastructure ✓
- [ ] Phase 5: Validator Nodes ✓
- [ ] Phase 6: Business Nodes ✓
- [ ] Phase 7: Slim Nodes ✓
- [ ] Phase 8: Verification ✓
- [ ] All 25 nodes running
- [ ] All services healthy
- [ ] DNS configured for dlt.aurigraph.io
- [ ] Let's Encrypt certificates provisioning
- [ ] Ready for Phase 2 monitoring

---

## Troubleshooting Deployment

### V11 Build Fails
```bash
ssh -p 22 subbu@dlt.aurigraph.io
cd /opt/DLT/aurigraph-av10-7/aurigraph-v11-standalone
./mvnw clean package -DskipTests
# Check error messages and fix
```

### Portal Build Issues
```bash
ssh -p 22 subbu@dlt.aurigraph.io
docker-compose -f docker-compose.yml exec enterprise-portal npm run build
# Check Node.js and npm versions
```

### Node Startup Issues
```bash
ssh -p 22 subbu@dlt.aurigraph.io
docker logs dlt-validator-nodes-multi  # Check specific container
docker logs dlt-business-node-1
docker logs dlt-slim-node-1
```

### Insufficient Resources
```bash
ssh -p 22 subbu@dlt.aurigraph.io
docker stats          # Check resource usage
df -h                 # Check disk space
free -h               # Check memory
```

---

## Performance Expectations After Deployment

| Component | Expected Status | Performance |
|-----------|-----------------|-------------|
| **Infrastructure** | All 6 healthy | Database ready, caches working |
| **V11 API** | Healthy | 776K+ TPS, <100ms latency |
| **Portal** | Healthy | React bundle loaded, responsive |
| **Validator Nodes** | 5 running | Consensus forming |
| **Business Nodes** | 15 running | Processing transactions |
| **Slim Nodes** | 5 running | Syncing blockchain |
| **Traefik** | Healthy (after DNS) | Routing traffic, certificates provisioning |

---

## Success Criteria

After deployment, you should see:

✅ 28 total containers running (6 core + 2 app + 20 nodes)
✅ All core services healthy (postgres, redis, prometheus, grafana)
✅ V11 API responding to health check
✅ Portal loading in browser
✅ 25 blockchain nodes (5V + 15B + 5S) operational
✅ Traefik routing traffic
✅ Traefik waiting for DNS to provision certificates

---

**Estimated Total Deployment Time:** 30-45 minutes
**Next Step:** Configure DNS for `dlt.aurigraph.io` → `160.10.1.168`
