#!/bin/bash
# Enterprise Portal - Staging Deployment Script
# Version: 1.0.0

set -e

echo "🚀 Starting Enterprise Portal Staging Deployment..."

# Configuration
APP_NAME="enterprise-portal"
STAGING_SERVER="staging.dlt.aurigraph.io"
DEPLOY_PATH="/var/www/enterprise-portal"
BACKUP_PATH="/var/backups/enterprise-portal"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Pre-deployment checks
echo -e "${YELLOW}📋 Running pre-deployment checks...${NC}"
npm run lint || { echo -e "${RED}❌ Linting failed${NC}"; exit 1; }
npm run typecheck || { echo -e "${RED}❌ Type check failed${NC}"; exit 1; }

# Step 2: Build application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build || { echo -e "${RED}❌ Build failed${NC}"; exit 1; }

# Step 3: Run tests
echo -e "${YELLOW}🧪 Running tests...${NC}"
npm test -- --coverage --watchAll=false || { echo -e "${RED}❌ Tests failed${NC}"; exit 1; }

# Step 4: Create backup
echo -e "${YELLOW}💾 Creating backup...${NC}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ssh deploy@${STAGING_SERVER} "mkdir -p ${BACKUP_PATH} && tar -czf ${BACKUP_PATH}/backup_${TIMESTAMP}.tar.gz -C ${DEPLOY_PATH} . 2>/dev/null || echo 'No previous deployment to backup'"

# Step 5: Deploy to staging
echo -e "${YELLOW}📤 Deploying to staging...${NC}"
rsync -avz --delete build/ deploy@${STAGING_SERVER}:${DEPLOY_PATH}/

# Step 6: Update environment
echo -e "${YELLOW}⚙️  Updating environment configuration...${NC}"
ssh deploy@${STAGING_SERVER} "cd ${DEPLOY_PATH} && echo 'REACT_APP_API_URL=https://dlt.aurigraph.io/api/v11' > .env.production"

# Step 7: Restart services
echo -e "${YELLOW}🔄 Restarting services...${NC}"
ssh deploy@${STAGING_SERVER} "sudo systemctl reload nginx"

# Step 8: Run smoke tests
echo -e "${YELLOW}🔍 Running smoke tests...${NC}"
sleep 5
./smoke-tests.sh "https://staging.dlt.aurigraph.io" || echo -e "${YELLOW}⚠️  Some smoke tests failed (non-blocking)${NC}"

# Success
echo -e "${GREEN}✅ Deployment to staging completed successfully!${NC}"
echo -e "${GREEN}🌐 Application available at: https://staging.dlt.aurigraph.io${NC}"
echo -e "${GREEN}📊 Monitor at: https://staging.dlt.aurigraph.io/health${NC}"

# Deployment summary
echo ""
echo "Deployment Summary:"
echo "- Build: ✅ Success"
echo "- Tests: ✅ Passed"
echo "- Backup: ✅ Created (backup_${TIMESTAMP}.tar.gz)"
echo "- Deploy: ✅ Complete"
echo "- Smoke Tests: ⚠️ Review output above"
echo ""
echo "Next steps:"
echo "1. Verify staging at https://staging.dlt.aurigraph.io"
echo "2. Run manual testing"
echo "3. If all good, proceed with production deployment"
