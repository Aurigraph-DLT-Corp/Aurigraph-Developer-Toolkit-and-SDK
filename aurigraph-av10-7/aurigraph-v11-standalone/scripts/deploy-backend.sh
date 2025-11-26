#!/bin/bash
#
# Backend Deployment Script
# Deploys Aurigraph V12 backend to production server
#
# Usage: ./deploy-backend.sh [options]
# Options:
#   --host HOST        Remote host (default: dlt.aurigraph.io)
#   --port PORT        SSH port (default: 22)
#   --user USER        SSH user (default: subbu)
#   --jar PATH         Path to JAR file
#   --skip-build       Skip build step
#   --skip-backup      Skip backup step
#

set -e

# Default values
REMOTE_HOST="${REMOTE_HOST:-dlt.aurigraph.io}"
REMOTE_PORT="${REMOTE_PORT:-22}"
REMOTE_USER="${REMOTE_USER:-subbu}"
BACKEND_PORT=9003
SKIP_BUILD=false
SKIP_BACKUP=false
JAR_PATH=""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --host)
      REMOTE_HOST="$2"
      shift 2
      ;;
    --port)
      REMOTE_PORT="$2"
      shift 2
      ;;
    --user)
      REMOTE_USER="$2"
      shift 2
      ;;
    --jar)
      JAR_PATH="$2"
      shift 2
      ;;
    --skip-build)
      SKIP_BUILD=true
      shift
      ;;
    --skip-backup)
      SKIP_BACKUP=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}Aurigraph V12 Backend Deployment${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "${BLUE}Target:${NC} ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PORT}"
echo ""

# Step 1: Build JAR (if not skipped)
if [ "$SKIP_BUILD" = false ]; then
  echo -e "${YELLOW}📦 Step 1: Building uber JAR...${NC}"
  cd "$(dirname "$0")/.."

  ./mvnw clean package \
    -DskipTests \
    -Dmaven.test.skip=true \
    -Dquarkus.package.jar.type=uber-jar \
    -B

  JAR_PATH="target/aurigraph-v12-standalone-12.0.0-runner.jar"

  if [ -f "$JAR_PATH" ]; then
    JAR_SIZE=$(ls -lh "$JAR_PATH" | awk '{print $5}')
    echo -e "${GREEN}✅ Build successful: $JAR_SIZE${NC}"
  else
    echo -e "${RED}❌ Build failed - JAR not found${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⏭️  Skipping build step${NC}"
  if [ -z "$JAR_PATH" ] || [ ! -f "$JAR_PATH" ]; then
    echo -e "${RED}❌ JAR path not specified or file not found${NC}"
    exit 1
  fi
fi

echo ""

# Step 2: Test SSH connection
echo -e "${YELLOW}🔐 Step 2: Testing SSH connection...${NC}"
if ssh -p "$REMOTE_PORT" -o BatchMode=yes -o ConnectTimeout=5 "$REMOTE_USER@$REMOTE_HOST" "echo 'Connection successful'" 2>/dev/null; then
  echo -e "${GREEN}✅ SSH connection successful${NC}"
else
  echo -e "${RED}❌ SSH connection failed${NC}"
  echo "Please ensure:"
  echo "  1. SSH key is configured (~/.ssh/id_rsa)"
  echo "  2. Host is reachable"
  echo "  3. User has proper permissions"
  exit 1
fi

echo ""

# Step 3: Create backup
if [ "$SKIP_BACKUP" = false ]; then
  echo -e "${YELLOW}💾 Step 3: Creating backup...${NC}"
  ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << 'EOF'
    BACKUP_DIR="/opt/aurigraph/backups/backend-$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    if [ -f /tmp/aurigraph-v12-standalone-12.0.0-runner.jar ]; then
      cp /tmp/aurigraph-v12-standalone-12.0.0-runner.jar "$BACKUP_DIR/"
      echo "✅ Backend JAR backed up to: $BACKUP_DIR"
    else
      echo "⚠️  No existing JAR to backup"
    fi
EOF
  echo -e "${GREEN}✅ Backup complete${NC}"
else
  echo -e "${YELLOW}⏭️  Skipping backup step${NC}"
fi

echo ""

# Step 4: Stop running service
echo -e "${YELLOW}⏸️  Step 4: Stopping backend service...${NC}"
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << EOF
  PID=\$(lsof -ti:${BACKEND_PORT} 2>/dev/null || echo "")
  if [ -n "\$PID" ]; then
    echo "Stopping process \$PID..."
    kill -15 \$PID 2>/dev/null || true
    sleep 5

    # Force kill if still running
    if kill -0 \$PID 2>/dev/null; then
      echo "Force stopping..."
      kill -9 \$PID 2>/dev/null || true
    fi
    echo "✅ Backend stopped"
  else
    echo "⚠️  No backend process running on port ${BACKEND_PORT}"
  fi
EOF

echo ""

# Step 5: Upload JAR
echo -e "${YELLOW}📤 Step 5: Uploading JAR to server...${NC}"
scp -P "$REMOTE_PORT" "$JAR_PATH" "$REMOTE_USER@$REMOTE_HOST:/tmp/"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Upload successful${NC}"
else
  echo -e "${RED}❌ Upload failed${NC}"
  exit 1
fi

echo ""

# Step 6: Start service
echo -e "${YELLOW}🚀 Step 6: Starting backend service...${NC}"
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << EOF
  cd /tmp

  nohup java \
    -Xms512m \
    -Xmx2g \
    -Dquarkus.http.port=${BACKEND_PORT} \
    -Dquarkus.flyway.migrate-at-start=false \
    -jar aurigraph-v12-standalone-12.0.0-runner.jar \
    > v12-production.log 2>&1 &

  NEW_PID=\$!
  echo "✅ Backend started with PID: \$NEW_PID"
  echo \$NEW_PID > /tmp/aurigraph-backend.pid

  echo "⏳ Waiting for service to start..."
  sleep 15
EOF

echo ""

# Step 7: Health check
echo -e "${YELLOW}🔍 Step 7: Running health checks...${NC}"
MAX_RETRIES=15
RETRY=0

while [ $RETRY -lt $MAX_RETRIES ]; do
  if curl -sf "https://${REMOTE_HOST}/api/v11/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is healthy${NC}"
    curl -s "https://${REMOTE_HOST}/api/v11/health" | jq '.' || true
    break
  fi

  RETRY=$((RETRY + 1))
  echo "Health check attempt $RETRY/$MAX_RETRIES..."
  sleep 5
done

if [ $RETRY -eq $MAX_RETRIES ]; then
  echo -e "${RED}❌ Health check failed after $MAX_RETRIES attempts${NC}"
  echo "Check logs with: ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'tail -f /tmp/v12-production.log'"
  exit 1
fi

echo ""

# Step 8: Verify endpoints
echo -e "${YELLOW}🧪 Step 8: Verifying endpoints...${NC}"
ENDPOINTS=(
  "/api/v11/health"
  "/api/v11/info"
  "/api/v11/dashboard"
  "/api/v11/dashboard/performance"
)

FAILED=0
for endpoint in "${ENDPOINTS[@]}"; do
  if curl -sf "https://${REMOTE_HOST}${endpoint}" > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} $endpoint"
  else
    echo -e "${RED}❌${NC} $endpoint"
    FAILED=$((FAILED + 1))
  fi
done

echo ""

# Final summary
echo -e "${BLUE}======================================${NC}"
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ Deployment Successful!${NC}"
else
  echo -e "${YELLOW}⚠️  Deployment complete with $FAILED endpoint(s) failing${NC}"
fi
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "${BLUE}URLs:${NC}"
echo "  • Health: https://${REMOTE_HOST}/api/v11/health"
echo "  • Info: https://${REMOTE_HOST}/api/v11/info"
echo "  • Dashboard: https://${REMOTE_HOST}/api/v11/dashboard"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo "  ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'tail -f /tmp/v12-production.log'"
echo ""
