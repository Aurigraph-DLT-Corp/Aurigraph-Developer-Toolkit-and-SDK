#!/bin/bash
#
# Enterprise Portal Deployment Script
# Deploys React/TypeScript portal to production server
#
# Usage: ./deploy-portal.sh [options]
# Options:
#   --host HOST        Remote host (default: dlt.aurigraph.io)
#   --port PORT        SSH port (default: 22)
#   --user USER        SSH user (default: subbu)
#   --skip-build       Skip build step
#   --skip-backup      Skip backup step
#

set -e

# Default values
REMOTE_HOST="${REMOTE_HOST:-dlt.aurigraph.io}"
REMOTE_PORT="${REMOTE_PORT:-22}"
REMOTE_USER="${REMOTE_USER:-subbu}"
PORTAL_PATH="/var/www/html/dist"
SKIP_BUILD=false
SKIP_BACKUP=false

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
echo -e "${BLUE}Enterprise Portal Deployment${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "${BLUE}Target:${NC} ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PORT}"
echo ""

# Step 1: Build portal (if not skipped)
if [ "$SKIP_BUILD" = false ]; then
  echo -e "${YELLOW}📦 Step 1: Building portal...${NC}"
  cd "$(dirname "$0")/../enterprise-portal"

  # Ensure .env is configured for production
  cat > .env << EOF
VITE_REACT_APP_API_URL=https://${REMOTE_HOST}/api/v11
VITE_REACT_APP_ENV=production
EOF

  echo -e "${BLUE}Configuration:${NC}"
  cat .env

  # Install dependencies
  echo ""
  echo "Installing dependencies..."
  npm ci

  # Build
  echo ""
  echo "Building production bundle..."
  npm run build

  if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    DIST_SIZE=$(du -sh dist | cut -f1)
    FILE_COUNT=$(find dist -type f | wc -l)
    echo -e "${GREEN}✅ Build successful: $DIST_SIZE, $FILE_COUNT files${NC}"
  else
    echo -e "${RED}❌ Build failed - dist directory not found${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}⏭️  Skipping build step${NC}"
  cd "$(dirname "$0")/../enterprise-portal"
  if [ ! -d "dist" ]; then
    echo -e "${RED}❌ dist directory not found${NC}"
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
  ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << EOF
    BACKUP_DIR="/opt/aurigraph/backups/portal-\$(date +%Y%m%d_%H%M%S)"
    mkdir -p "\$BACKUP_DIR"

    if [ -d "${PORTAL_PATH}" ]; then
      sudo tar -czf "\$BACKUP_DIR/portal-backup.tar.gz" -C /var/www/html dist/ 2>/dev/null || true
      echo "✅ Portal backed up to: \$BACKUP_DIR"
      ls -lh "\$BACKUP_DIR"
    else
      echo "⚠️  No existing portal to backup"
    fi
EOF
  echo -e "${GREEN}✅ Backup complete${NC}"
else
  echo -e "${YELLOW}⏭️  Skipping backup step${NC}"
fi

echo ""

# Step 4: Create deployment package
echo -e "${YELLOW}📦 Step 4: Creating deployment package...${NC}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE_NAME="portal-deploy-${TIMESTAMP}.tar.gz"

tar -czf "$ARCHIVE_NAME" dist/

if [ -f "$ARCHIVE_NAME" ]; then
  ARCHIVE_SIZE=$(ls -lh "$ARCHIVE_NAME" | awk '{print $5}')
  echo -e "${GREEN}✅ Package created: $ARCHIVE_SIZE${NC}"
else
  echo -e "${RED}❌ Failed to create deployment package${NC}"
  exit 1
fi

echo ""

# Step 5: Upload to server
echo -e "${YELLOW}📤 Step 5: Uploading to server...${NC}"
scp -P "$REMOTE_PORT" "$ARCHIVE_NAME" "$REMOTE_USER@$REMOTE_HOST:/tmp/"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Upload successful${NC}"
else
  echo -e "${RED}❌ Upload failed${NC}"
  exit 1
fi

# Clean up local archive
rm -f "$ARCHIVE_NAME"

echo ""

# Step 6: Deploy portal
echo -e "${YELLOW}🚀 Step 6: Deploying portal...${NC}"
ssh -p "$REMOTE_PORT" "$REMOTE_USER@$REMOTE_HOST" << EOF
  cd /tmp

  # Remove old dist
  sudo rm -rf ${PORTAL_PATH}

  # Extract new portal
  tar -xzf ${ARCHIVE_NAME}

  # Move to web root
  sudo mkdir -p /var/www/html
  sudo mv dist ${PORTAL_PATH}

  # Set permissions
  sudo chown -R www-data:www-data ${PORTAL_PATH}
  sudo chmod -R 755 ${PORTAL_PATH}

  # Clean up
  rm -f ${ARCHIVE_NAME}

  echo "✅ Portal deployed"
  ls -lh ${PORTAL_PATH}
EOF

echo ""

# Step 7: Health check
echo -e "${YELLOW}🔍 Step 7: Running health checks...${NC}"
sleep 5

if curl -sf "https://${REMOTE_HOST}/" -I | head -1; then
  echo -e "${GREEN}✅ Portal is accessible${NC}"
else
  echo -e "${RED}❌ Portal health check failed${NC}"
  exit 1
fi

echo ""

# Step 8: Verify assets
echo -e "${YELLOW}🧪 Step 8: Verifying assets...${NC}"
ASSETS=(
  "/"
  "/assets/"
)

FAILED=0
for asset in "${ASSETS[@]}"; do
  if curl -sf "https://${REMOTE_HOST}${asset}" -I > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} ${asset}"
  else
    echo -e "${RED}❌${NC} ${asset}"
    FAILED=$((FAILED + 1))
  fi
done

echo ""

# Final summary
echo -e "${BLUE}======================================${NC}"
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ Deployment Successful!${NC}"
else
  echo -e "${YELLOW}⚠️  Deployment complete with $FAILED asset(s) failing${NC}"
fi
echo -e "${BLUE}======================================${NC}"
echo ""
echo -e "${BLUE}URLs:${NC}"
echo "  • Portal: https://${REMOTE_HOST}/"
echo "  • Health: https://${REMOTE_HOST}/api/v11/health"
echo ""
echo -e "${BLUE}Verify deployment:${NC}"
echo "  curl -I https://${REMOTE_HOST}/"
echo ""
echo -e "${BLUE}Check NGINX logs:${NC}"
echo "  ssh -p $REMOTE_PORT $REMOTE_USER@$REMOTE_HOST 'sudo tail -f /var/log/nginx/access.log'"
echo ""
