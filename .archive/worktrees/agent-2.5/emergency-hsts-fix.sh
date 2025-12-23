#!/bin/bash

# Emergency HSTS Fix - Temporary disable HSTS for debugging
echo "🚨 Emergency HSTS Fix for dlt.aurigraph.io"
echo "========================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  This script temporarily disables HSTS to debug SSL issues${NC}"
echo -e "${YELLOW}⚠️  Use only for debugging - HSTS should be re-enabled after fixing SSL${NC}"
echo ""

if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ This script must be run as root${NC}"
   exit 1
fi

# Backup current config
cp /etc/nginx/sites-available/dlt.aurigraph.io /etc/nginx/sites-available/dlt.aurigraph.io.backup.hsts

# Remove HSTS header temporarily
sed -i 's/add_header Strict-Transport-Security.*/#&/' /etc/nginx/sites-available/dlt.aurigraph.io

# Test configuration
nginx -t

if [ $? -eq 0 ]; then
    systemctl reload nginx
    echo -e "${GREEN}✅ HSTS temporarily disabled${NC}"
    echo ""
    echo "Now try accessing the site to see if SSL works without HSTS"
    echo "If it works, the issue is with certificate trust, not HSTS"
    echo ""
    echo "To re-enable HSTS after fixing SSL:"
    echo "  sudo cp /etc/nginx/sites-available/dlt.aurigraph.io.backup.hsts /etc/nginx/sites-available/dlt.aurigraph.io"
    echo "  sudo systemctl reload nginx"
else
    echo -e "${RED}❌ Nginx configuration error${NC}"
    # Restore backup
    cp /etc/nginx/sites-available/dlt.aurigraph.io.backup.hsts /etc/nginx/sites-available/dlt.aurigraph.io
fi
