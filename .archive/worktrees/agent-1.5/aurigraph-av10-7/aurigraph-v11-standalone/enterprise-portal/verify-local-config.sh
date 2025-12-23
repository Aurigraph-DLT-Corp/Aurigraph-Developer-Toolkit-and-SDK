#!/bin/bash

# Enterprise Portal - Local Configuration Verification Script
# Verifies that the portal is correctly configured for local backend

set -e

PORTAL_DIR="/Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal"
BACKEND_PORT=9003
FRONTEND_PORT=3000

echo "========================================="
echo "Enterprise Portal - Configuration Check"
echo "========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check status
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

# 1. Check .env file exists
echo "1. Checking environment configuration..."
if [ -f "$PORTAL_DIR/.env" ]; then
    check_status ".env file exists"

    # Check if it contains localhost:9003
    if grep -q "localhost:9003" "$PORTAL_DIR/.env"; then
        check_status ".env points to localhost:9003"
    else
        echo -e "${RED}✗${NC} .env does not contain localhost:9003"
        echo -e "${YELLOW}  Fix: Add VITE_API_URL=http://localhost:9003 to .env${NC}"
    fi
else
    echo -e "${RED}✗${NC} .env file not found"
    echo -e "${YELLOW}  Fix: Copy .env.example to .env and set VITE_API_URL=http://localhost:9003${NC}"
fi
echo ""

# 2. Check vite.config.ts
echo "2. Checking Vite proxy configuration..."
if grep -q "target: 'http://localhost:9003'" "$PORTAL_DIR/vite.config.ts"; then
    check_status "Vite proxy points to localhost:9003"
else
    echo -e "${RED}✗${NC} Vite proxy not configured for localhost:9003"
    echo -e "${YELLOW}  Fix: Update vite.config.ts proxy target${NC}"
fi
echo ""

# 3. Check API service files
echo "3. Checking API service files..."
API_FILES=(
    "src/services/api.ts"
    "src/services/phase1Api.ts"
    "src/services/contractsApi.ts"
    "src/services/APIIntegrationService.ts"
    "src/services/RWAService.ts"
)

for file in "${API_FILES[@]}"; do
    if grep -q "localhost:9003" "$PORTAL_DIR/$file"; then
        check_status "$file configured"
    else
        echo -e "${YELLOW}⚠${NC} $file may need review"
    fi
done
echo ""

# 4. Check V11 backend is running
echo "4. Checking V11 backend status..."
if lsof -i :$BACKEND_PORT > /dev/null 2>&1; then
    check_status "V11 backend running on port $BACKEND_PORT"

    # Try to hit health endpoint
    if curl -s -f "http://localhost:$BACKEND_PORT/api/v11/health" > /dev/null 2>&1; then
        check_status "V11 backend health endpoint responding"
    else
        echo -e "${YELLOW}⚠${NC} V11 backend port open but health endpoint not responding"
    fi
else
    echo -e "${RED}✗${NC} V11 backend not running on port $BACKEND_PORT"
    echo -e "${YELLOW}  Fix: cd ../aurigraph-v11-standalone && ./mvnw quarkus:dev${NC}"
fi
echo ""

# 5. Check frontend dev server status
echo "5. Checking frontend dev server..."
if lsof -i :$FRONTEND_PORT > /dev/null 2>&1; then
    check_status "Frontend dev server running on port $FRONTEND_PORT"
else
    echo -e "${YELLOW}⚠${NC} Frontend dev server not running on port $FRONTEND_PORT"
    echo -e "${YELLOW}  To start: cd $PORTAL_DIR && npm run dev${NC}"
fi
echo ""

# 6. Check for production URLs in code
echo "6. Checking for hardcoded production URLs..."
PROD_URL_COUNT=$(grep -r "https://dlt.aurigraph.io" "$PORTAL_DIR/src/services" --include="*.ts" | grep -v "env?.PROD" | wc -l | tr -d ' ')

if [ "$PROD_URL_COUNT" -eq "0" ]; then
    check_status "No hardcoded production URLs found"
else
    echo -e "${YELLOW}⚠${NC} Found $PROD_URL_COUNT potential hardcoded production URLs"
    echo -e "${YELLOW}  Review: grep -r 'https://dlt.aurigraph.io' src/services${NC}"
fi
echo ""

# Summary
echo "========================================="
echo "Configuration Summary"
echo "========================================="
echo ""
echo "Backend URL:  http://localhost:$BACKEND_PORT"
echo "Frontend URL: http://localhost:$FRONTEND_PORT"
echo "Proxy:        /api → http://localhost:$BACKEND_PORT"
echo ""

# Final recommendation
if lsof -i :$BACKEND_PORT > /dev/null 2>&1 && [ -f "$PORTAL_DIR/.env" ]; then
    echo -e "${GREEN}✓ Configuration looks good!${NC}"
    echo ""
    echo "To start development:"
    echo "  1. Backend is already running on :$BACKEND_PORT"
    echo "  2. Start frontend: cd $PORTAL_DIR && npm run dev"
    echo "  3. Open browser: http://localhost:$FRONTEND_PORT"
else
    echo -e "${YELLOW}⚠ Configuration needs attention${NC}"
    echo ""
    echo "To fix:"
    if ! lsof -i :$BACKEND_PORT > /dev/null 2>&1; then
        echo "  1. Start backend: cd ../aurigraph-v11-standalone && ./mvnw quarkus:dev"
    fi
    if [ ! -f "$PORTAL_DIR/.env" ]; then
        echo "  2. Create .env: cp .env.example .env"
        echo "     Then set: VITE_API_URL=http://localhost:9003"
    fi
    echo "  3. Start frontend: npm run dev"
fi

echo ""
echo "For detailed documentation, see: LOCAL-DEVELOPMENT-CONFIG.md"
echo ""
