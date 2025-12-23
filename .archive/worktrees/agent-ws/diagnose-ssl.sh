#!/bin/bash

# SSL Diagnostic Script for dlt.aurigraph.io
echo "🔍 SSL Diagnostic for dlt.aurigraph.io"
echo "======================================"

DOMAIN="dlt.aurigraph.io"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}1. Checking DNS resolution...${NC}"
dig +short $DOMAIN
nslookup $DOMAIN

echo ""
echo -e "${BLUE}2. Checking certificate files...${NC}"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo -e "${GREEN}✅ Certificate file exists${NC}"
    
    # Check certificate details
    echo "Certificate details:"
    openssl x509 -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:|DNS:)"
    
    # Check certificate expiry
    EXPIRY=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" | cut -d= -f2)
    echo "Expires: $EXPIRY"
    
else
    echo -e "${RED}❌ Certificate file missing${NC}"
fi

echo ""
echo -e "${BLUE}3. Testing SSL connection...${NC}"
echo "Q" | timeout 10 openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>&1 | grep -E "(Verify return code:|Certificate chain|subject=|issuer=)"

echo ""
echo -e "${BLUE}4. Checking nginx configuration...${NC}"
nginx -t

echo ""
echo -e "${BLUE}5. Checking nginx SSL configuration...${NC}"
grep -n "ssl_certificate" /etc/nginx/sites-available/$DOMAIN

echo ""
echo -e "${BLUE}6. Testing HTTPS response...${NC}"
curl -v --max-time 10 https://$DOMAIN/health 2>&1 | grep -E "(SSL|TLS|certificate|HTTP)"

echo ""
echo -e "${BLUE}7. Checking system date/time...${NC}"
date
timedatectl status

echo ""
echo -e "${BLUE}8. Checking nginx processes...${NC}"
ps aux | grep nginx

echo ""
echo -e "${BLUE}9. Checking ports...${NC}"
netstat -tulpn | grep -E ":80|:443"

echo ""
echo -e "${BLUE}10. Checking recent SSL errors...${NC}"
tail -20 /var/log/nginx/dlt.aurigraph.io.error.log 2>/dev/null || echo "No error log found"

echo ""
echo -e "${YELLOW}Diagnostic complete. Common issues:${NC}"
echo "  • Expired certificate - renew with certbot"
echo "  • Wrong certificate path in nginx config"
echo "  • Clock sync issues - check system time"
echo "  • Firewall blocking port 443"
echo "  • DNS not pointing to correct server"
