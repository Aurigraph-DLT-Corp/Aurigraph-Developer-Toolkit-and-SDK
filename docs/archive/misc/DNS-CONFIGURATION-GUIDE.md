# DNS Configuration Guide for dlt.aurigraph.io

**Objective:** Configure DNS to enable Let's Encrypt ACME certificate provisioning for Traefik reverse proxy
**Target Domain:** `dlt.aurigraph.io`
**Target IP:** `160.10.1.168`
**Status:** Ready for configuration

---

## Critical Information

**Your Production Server:**
- **Hostname:** dlt.aurigraph.io
- **IP Address:** 160.10.1.168
- **Services Running:** Traefik, V11 API, Enterprise Portal, PostgreSQL, Redis, Prometheus, Grafana
- **Current Status:** Traefik waiting for valid DNS to complete Let's Encrypt certificate provisioning

---

## Why DNS Configuration is Critical

Without proper DNS configuration:
- ❌ Let's Encrypt ACME HTTP challenge fails
- ❌ SSL/TLS certificates cannot be provisioned
- ❌ Browser shows `NET::ERR_CERT_AUTHORITY_INVALID`
- ❌ HTTPS access blocked
- ❌ Traefik health check fails

With proper DNS configuration:
- ✅ Let's Encrypt validates domain ownership
- ✅ SSL/TLS certificates auto-provisioned
- ✅ HTTPS access enabled
- ✅ Traefik becomes healthy
- ✅ Phase 2 monitoring can begin

---

## Step 1: Locate Your DNS Provider

Your domain registrar or DNS hosting provider varies. Common options:

| Provider | Admin Portal | Common for |
|----------|-------------|-----------|
| GoDaddy | https://dcc.godaddy.com | Domain registrar |
| Namecheap | https://www.namecheap.com/myaccount/login | Domain registrar |
| Cloudflare | https://dash.cloudflare.com | DNS hosting (free) |
| Route 53 | https://console.aws.amazon.com/route53 | AWS-hosted domains |
| Azure DNS | https://portal.azure.com | Microsoft-hosted domains |
| Google Cloud DNS | https://console.cloud.google.com | Google-hosted domains |

**If unsure where your DNS is hosted:**
```bash
# Check domain registration
whois dlt.aurigraph.io

# Check authoritative nameservers
dig dlt.aurigraph.io NS
nslookup -type=NS dlt.aurigraph.io
```

---

## Step 2: Create A Record in Your DNS Provider

### For Most Registrars (GoDaddy, Namecheap, etc.)

**Access DNS Management:**
1. Login to your domain registrar's control panel
2. Navigate to DNS / Domain Settings
3. Find "DNS Records" or "Name Records"

**Create or Update A Record:**

| Field | Value |
|-------|-------|
| **Type** | A (Address Record) |
| **Name/Subdomain** | `dlt` (for `dlt.aurigraph.io`) or leave blank for root domain |
| **Target/Points to** | `160.10.1.168` |
| **TTL** | 3600 (1 hour) or default |
| **Priority** | N/A (only for MX records) |

**Example Configuration:**
```
Type: A
Name: dlt
Value: 160.10.1.168
TTL: 3600
```

Also add a wildcard record (optional, for subdomains):
```
Type: A
Name: *.dlt
Value: 160.10.1.168
TTL: 3600
```

---

## Step 3: Configure Additional Records (Optional but Recommended)

### Add Root Domain Record (if using `aurigraph.io` root)

```
Type: A
Name: @ (or leave blank)
Value: 160.10.1.168
TTL: 3600
```

### Add www Subdomain (Optional)

```
Type: A
Name: www
Value: 160.10.1.168
TTL: 3600
```

### Add CNAME for Convenience (Optional)

```
Type: CNAME
Name: api
Value: dlt.aurigraph.io
TTL: 3600
```

This allows access via `api.dlt.aurigraph.io` → `dlt.aurigraph.io`

---

## Step 4: Verify DNS Propagation

### Check Local DNS (Immediate)

```bash
# On your local machine
nslookup dlt.aurigraph.io
# or
dig dlt.aurigraph.io
# or
host dlt.aurigraph.io
```

**Expected Output:**
```
dlt.aurigraph.io has address 160.10.1.168
```

### Check Global DNS Propagation (Wait 5-30 minutes)

```bash
# Check from multiple locations
curl -I https://dlt.aurigraph.io/api/v11/health

# Or use online tool
# https://www.whatsmydns.net/
# Search for: dlt.aurigraph.io
# Type: A
```

### Comprehensive DNS Test

```bash
#!/bin/bash
echo "=== DNS Propagation Test ==="
echo ""
echo "1. Local DNS resolution:"
nslookup dlt.aurigraph.io
echo ""
echo "2. Authoritative nameserver:"
dig dlt.aurigraph.io NS
echo ""
echo "3. Full DNS lookup:"
dig dlt.aurigraph.io
echo ""
echo "4. Reverse DNS (if configured):"
dig -x 160.10.1.168
echo ""
echo "5. HTTP connectivity test:"
timeout 5 curl -I http://160.10.1.168/ || echo "HTTP connection attempt made"
echo ""
echo "6. Check Traefik response:"
timeout 5 curl -I http://dlt.aurigraph.io/ || echo "Traefik not yet responding (this is OK during propagation)"
```

---

## Step 5: Verify DNS on Production Server

Once DNS is propagated, verify from your production server:

```bash
# SSH into production server
ssh -p 22 subbu@dlt.aurigraph.io

# Verify DNS resolution from server
nslookup dlt.aurigraph.io
dig dlt.aurigraph.io

# Test HTTP access (should work immediately)
curl -I http://dlt.aurigraph.io/api/v11/health

# Check Traefik logs for Let's Encrypt activity
docker logs dlt-traefik | grep -i acme

# Expected output should show ACME challenge attempts
```

---

## Step 6: Monitor Traefik Let's Encrypt Provisioning

Once DNS is propagated, Traefik will automatically:
1. Detect valid DNS for `dlt.aurigraph.io`
2. Attempt Let's Encrypt HTTP challenge
3. Receive challenge token
4. Respond to challenge from Let's Encrypt servers
5. Receive signed certificate
6. Store in `/letsencrypt/acme.json`

### Check Certificate Status

```bash
# SSH into production server
ssh -p 22 subbu@dlt.aurigraph.io

# Check Traefik dashboard (once HTTPS is working)
curl -s http://localhost:8080/ping

# View Let's Encrypt certificate storage
docker exec dlt-traefik ls -lah /letsencrypt/

# Check certificate details (once provisioned)
openssl s_client -connect dlt.aurigraph.io:443 -servername dlt.aurigraph.io 2>/dev/null | openssl x509 -noout -text | grep -A 2 "Issuer\|Subject\|Not"

# View Traefik logs for successful provisioning
docker logs dlt-traefik | tail -50 | grep -i "acme\|certificate\|issued"
```

### Expected Traefik Log Output

```
time=2025-11-22T12:34:56Z level=info msg="Netsplit detected, let's encrypt certs, will expire soon." provider=acme
time=2025-11-22T12:34:57Z level=info msg="[dlt.aurigraph.io] Deleting domain..." provider=acme
time=2025-11-22T12:35:00Z level=info msg="[dlt.aurigraph.io] Creating certificate for dlt.aurigraph.io" provider=acme
time=2025-11-22T12:35:10Z level=info msg="[dlt.aurigraph.io] Certificate received from ACME server." provider=acme
time=2025-11-22T12:35:10Z level=info msg="[dlt.aurigraph.io] acme: Storing certificate in /letsencrypt/acme.json" provider=acme
```

### Monitor Certificate Expiration

```bash
# Check certificate expiration date (in 90 days)
docker exec dlt-traefik cat /letsencrypt/acme.json 2>/dev/null | jq -r '.Certificates[].Certificate' | openssl x509 -text -noout | grep "Not After"

# Expected: Certificate valid for 90 days
# Example output: Not After : Nov 20 12:34:56 2025 GMT
```

---

## Step 7: Test HTTPS Access After Certificate Provisioning

Once certificate is provisioned:

```bash
# Test from local machine
curl -I https://dlt.aurigraph.io/api/v11/health
# Expected: 200 OK

# Test from production server
ssh -p 22 subbu@dlt.aurigraph.io
curl -I https://dlt.aurigraph.io/api/v11/health

# View certificate in browser
# Navigate to https://dlt.aurigraph.io/
# Lock icon should show "Secure" or green checkmark
# Certificate issued by: Let's Encrypt
```

---

## Step 8: Verify Traefik Health Status

Once certificates are provisioned, Traefik health status should change:

```bash
# SSH into production server
ssh -p 22 subbu@dlt.aurigraph.io

# Check container status (should be "Healthy" not "Unhealthy")
docker-compose -f docker-compose.yml ps | grep traefik

# Before DNS: Status = Up (Unhealthy)
# After DNS + Certs: Status = Up (Healthy)

# Check Traefik dashboard accessibility
curl -I http://localhost:8080/dashboard/
# Expected: 200 OK
```

---

## DNS Propagation Timeline

| Time | Status | Action |
|------|--------|--------|
| T+0 | Changes saved | DNS records updated in registrar |
| T+5-30 min | Propagating | Most ISPs update their DNS caches |
| T+30-120 min | Propagated | Global DNS resolvers sync (TTL dependent) |
| T+DNS propagation | Let's Encrypt | ACME challenge succeeds |
| T+DNS+2 min | Certificate issued | Let's Encrypt generates certificate |
| T+DNS+3 min | Provisioned | Traefik stores certificate |
| T+DNS+5 min | Live HTTPS | HTTPS access enabled |

**TTL Impact:** If you set TTL to 3600 (1 hour), changes take ~1 hour to fully propagate. Setting TTL to 300 (5 minutes) speeds up propagation.

---

## Troubleshooting DNS Issues

### Issue 1: DNS Not Resolving

**Symptom:** `nslookup dlt.aurigraph.io` returns "Non-existent domain" or no IP

**Solutions:**
1. **Verify record created correctly**
   - Check DNS admin console for typos
   - Ensure record type is "A"
   - Verify IP is exactly `160.10.1.168`

2. **Check nameserver configuration**
   ```bash
   dig dlt.aurigraph.io NS
   ```
   - Should show your DNS provider's nameservers
   - If different, update domain registrar pointing

3. **Force cache flush**
   ```bash
   # macOS
   sudo dscacheutil -flushcache

   # Linux
   sudo systemctl restart systemd-resolved

   # Windows
   ipconfig /flushdns
   ```

4. **Wait for TTL to expire**
   - If TTL is 3600, wait 1 hour
   - If TTL is 86400, wait 24 hours
   - Reduce TTL if needed, then update record

### Issue 2: ACME Challenge Failing

**Symptom:** Traefik logs show "ACME challenge failed" or "HTTP validation failed"

**Possible Causes:**
1. DNS not fully propagated
2. Firewall blocking port 80 (HTTP)
3. Port 80 redirect not working properly
4. Let's Encrypt rate limits

**Solutions:**
```bash
# Test HTTP access on port 80
ssh -p 22 subbu@dlt.aurigraph.io
curl -I http://dlt.aurigraph.io/

# Check firewall allows port 80
netstat -tlnp | grep :80

# Verify Traefik listening on port 80
docker exec dlt-traefik netstat -tlnp | grep 80

# Check Traefik logs
docker logs dlt-traefik | grep -A 5 "challenge"
```

### Issue 3: Certificate Not Being Renewed

**Symptom:** Certificate shows as expiring soon, Traefik not renewing

**Solutions:**
```bash
# Check certificate expiration
docker exec dlt-traefik ls -lah /letsencrypt/

# Force renewal attempt
docker restart dlt-traefik

# Wait 2-3 minutes for renewal
sleep 180
docker logs dlt-traefik | grep -i "certificate\|acme"
```

### Issue 4: Browser Still Shows Untrusted Certificate

**Symptom:** Even after DNS configured, browser shows certificate error

**Solutions:**
1. **Clear browser cache**
   - Chrome: Ctrl+Shift+Delete → Clear browsing data
   - Safari: Develop → Empty Caches
   - Firefox: Ctrl+Shift+Delete

2. **Verify certificate is actually issued**
   ```bash
   openssl s_client -connect dlt.aurigraph.io:443 -servername dlt.aurigraph.io 2>/dev/null | grep "Issuer"
   # Should show: Issuer: Let's Encrypt (R3 or similar)
   ```

3. **Check certificate validity dates**
   ```bash
   openssl s_client -connect dlt.aurigraph.io:443 -servername dlt.aurigraph.io 2>/dev/null | openssl x509 -noout -dates
   # Should show: notBefore and notAfter dates with current date within range
   ```

4. **Restart Traefik to reload certificate**
   ```bash
   docker-compose -f docker-compose.yml restart traefik
   sleep 5
   ```

---

## DNS Provider-Specific Instructions

### GoDaddy

1. Login to https://dcc.godaddy.com/
2. Click "DNS" next to your domain
3. Click "Add" in DNS Records section
4. Select "A" from Type dropdown
5. Enter "dlt" in Name field
6. Enter "160.10.1.168" in Value field
7. Click "Save"
8. Wait 5-30 minutes for propagation

### Namecheap

1. Login to https://www.namecheap.com/myaccount/login/
2. Click "Manage" next to your domain
3. Go to "Advanced DNS" tab
4. Click "Add New Record"
5. Type: A Record
6. Host: dlt
7. Value: 160.10.1.168
8. TTL: 3600
9. Click checkmark to save
10. Wait 5-30 minutes for propagation

### Cloudflare

1. Login to https://dash.cloudflare.com/
2. Select your domain
3. Go to "DNS" tab
4. Click "Add record"
5. Type: A
6. Name: dlt
7. IPv4 Address: 160.10.1.168
8. TTL: Auto (or 300 for faster updates)
9. Proxy status: Gray cloud (DNS only, not Cloudflare proxy)
10. Click "Save"
11. Wait 5-30 minutes for propagation

### Route 53 (AWS)

1. Login to AWS Console
2. Navigate to Route 53 service
3. Click "Hosted zones"
4. Select your domain
5. Click "Create record"
6. Record name: "dlt" (for dlt.aurigraph.io)
7. Record type: A
8. Value: 160.10.1.168
9. TTL: 300 (5 minutes for faster updates)
10. Click "Create records"
11. Wait 5-30 minutes for propagation

### Azure DNS

1. Login to https://portal.azure.com/
2. Search for "DNS zones"
3. Select your domain
4. Click "+ Record set"
5. Name: dlt
6. Type: A
7. IP Address: 160.10.1.168
8. TTL: 300
9. Click "Create"
10. Wait 5-30 minutes for propagation

---

## Automated DNS Verification Script

Save and run this script to automate DNS verification:

```bash
#!/bin/bash
# DNS Verification Script for dlt.aurigraph.io

DOMAIN="dlt.aurigraph.io"
TARGET_IP="160.10.1.168"
SERVER_HOST="subbu@dlt.aurigraph.io"
SERVER_PORT="22"

echo "=========================================================="
echo "  DNS Configuration Verification for $DOMAIN"
echo "=========================================================="
echo ""

# Test 1: Local DNS Resolution
echo "✓ Test 1: Local DNS Resolution"
LOCAL_IP=$(nslookup $DOMAIN 2>/dev/null | grep "Address:" | tail -1 | awk '{print $2}')
if [ "$LOCAL_IP" == "$TARGET_IP" ]; then
    echo "  ✅ PASS: $DOMAIN resolves to $TARGET_IP"
else
    echo "  ❌ FAIL: Expected $TARGET_IP, got $LOCAL_IP (or unresolved)"
fi
echo ""

# Test 2: Check nameservers
echo "✓ Test 2: Authoritative Nameservers"
echo "  Nameservers:"
dig $DOMAIN NS +short
echo ""

# Test 3: HTTP Connectivity
echo "✓ Test 3: HTTP Connectivity (Port 80)"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -m 5 http://$DOMAIN/ 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" != "000" ]; then
    echo "  ✅ PASS: HTTP responding (Status: $HTTP_STATUS)"
else
    echo "  ⏳ PENDING: HTTP not yet responding (Traefik may need time)"
fi
echo ""

# Test 4: Server-side DNS Resolution
echo "✓ Test 4: Server-side DNS Resolution"
SERVER_RESOLUTION=$(ssh -p $SERVER_PORT $SERVER_HOST "nslookup $DOMAIN 2>/dev/null | grep 'Address:' | tail -1 | awk '{print \$2}'" 2>/dev/null)
if [ "$SERVER_RESOLUTION" == "$TARGET_IP" ]; then
    echo "  ✅ PASS: Server resolves $DOMAIN to $TARGET_IP"
else
    echo "  ❌ FAIL: Server sees $SERVER_RESOLUTION (or no response)"
fi
echo ""

# Test 5: Traefik Docker Status
echo "✓ Test 5: Traefik Service Status"
TRAEFIK_STATUS=$(ssh -p $SERVER_PORT $SERVER_HOST "docker-compose -f docker-compose.yml ps traefik 2>/dev/null | tail -1 | awk '{print \$NF}'" 2>/dev/null)
echo "  Status: $TRAEFIK_STATUS"
echo ""

# Test 6: Let's Encrypt Certificate Status
echo "✓ Test 6: Let's Encrypt Certificate Status"
CERT_CHECK=$(ssh -p $SERVER_PORT $SERVER_HOST "docker exec dlt-traefik ls -l /letsencrypt/acme.json 2>/dev/null | wc -l" 2>/dev/null)
if [ "$CERT_CHECK" -gt "0" ]; then
    echo "  ✅ acme.json exists (certificate storage initialized)"
    ssh -p $SERVER_PORT $SERVER_HOST "docker logs dlt-traefik 2>/dev/null | grep -i 'certificate' | tail -3"
else
    echo "  ⏳ acme.json not yet created (waiting for ACME challenge)"
fi
echo ""

echo "=========================================================="
echo "  Next Steps:"
echo "=========================================================="
if [ "$LOCAL_IP" == "$TARGET_IP" ]; then
    echo "  ✅ DNS is properly configured!"
    echo "  ✅ Waiting for Let's Encrypt certificate provisioning..."
    echo "  ✅ This can take 5-10 minutes after DNS propagation"
else
    echo "  ❌ DNS is not yet configured or propagated"
    echo "  ⏳ Please ensure DNS A record points $DOMAIN to $TARGET_IP"
    echo "  ⏳ Wait 5-30 minutes for DNS propagation"
    echo "  ⏳ Then run this script again"
fi
echo ""
```

**Usage:**
```bash
chmod +x dns-verify.sh
./dns-verify.sh
```

---

## Post-Configuration Checklist

Once DNS is configured, verify these items:

- [ ] DNS A record created: `dlt` → `160.10.1.168`
- [ ] `nslookup dlt.aurigraph.io` returns `160.10.1.168`
- [ ] `curl -I http://dlt.aurigraph.io/` returns HTTP response
- [ ] Traefik logs show ACME challenge attempts (check after 5 min)
- [ ] Traefik logs show "Certificate received from ACME"
- [ ] `/letsencrypt/acme.json` exists on production server
- [ ] `docker-compose ps` shows traefik as "Healthy"
- [ ] `https://dlt.aurigraph.io/` shows green padlock in browser
- [ ] Certificate issued by Let's Encrypt (check cert details)
- [ ] Phase 2 monitoring can now begin

---

## Summary

**Critical Path to Production:**

1. ✅ Traefik deployed with Dockerfile image tag fix
2. ✅ Both HTTP and HTTPS routers configured
3. ✅ Portal health check endpoint fixed
4. ⏳ **DNS Configuration (you are here)**
5. 📋 Let's Encrypt certificate provisioning (automatic after DNS)
6. 📋 Traefik health status becomes "Healthy"
7. 📋 Phase 2: 7-day parallel monitoring
8. 📋 Phase 3: NGINX cutover
9. 📋 Phase 3B: NGINX decommissioning

**Your Action Items:**

1. Create DNS A record for `dlt.aurigraph.io` → `160.10.1.168`
2. Wait 5-30 minutes for propagation
3. Verify with `nslookup dlt.aurigraph.io` (should return `160.10.1.168`)
4. Monitor Traefik logs for Let's Encrypt provisioning:
   ```bash
   ssh -p 22 subbu@dlt.aurigraph.io
   docker logs dlt-traefik | tail -20
   ```
5. Once certificate issued, Traefik becomes healthy and Phase 2 can begin

---

## Reference Information

**Key Files:**
- Production config: `/opt/DLT/docker-compose.yml`
- Traefik config: Traefik service labels in docker-compose.yml
- Let's Encrypt storage: `/letsencrypt/acme.json` (volume)
- Traefik logs: `docker logs dlt-traefik`

**Useful Commands:**
```bash
# Verify DNS
nslookup dlt.aurigraph.io
dig dlt.aurigraph.io
host dlt.aurigraph.io

# Check HTTP access
curl -I http://dlt.aurigraph.io/api/v11/health

# Monitor Traefik
docker logs dlt-traefik | grep -i acme
docker exec dlt-traefik ls -la /letsencrypt/

# Check certificate
openssl s_client -connect dlt.aurigraph.io:443 -servername dlt.aurigraph.io

# Verify service health
docker-compose -f docker-compose.yml ps
```

**Support Contacts:**
- DNS Provider Support: Check your registrar's help docs
- Let's Encrypt Issues: https://community.letsencrypt.org/
- Traefik Documentation: https://doc.traefik.io/

---

**Last Updated:** November 22, 2025
**Status:** Ready for DNS Configuration
