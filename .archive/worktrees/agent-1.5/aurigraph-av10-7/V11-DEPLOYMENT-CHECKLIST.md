# Aurigraph V11 Deployment Checklist for dlt.aurigraph.io

## 🔍 **Pre-Deployment Prerequisites**

### ✅ **CORS Configuration** 
- [x] Added CORS headers to application.properties
- [x] Configured allowed origins: `https://dlt.aurigraph.io, http://dlt.aurigraph.io`
- [x] Set proper CORS methods: GET, POST, PUT, DELETE, OPTIONS
- [x] Added CORS preflight handling

### ✅ **NGINX Configuration**
- [x] Created V11-specific NGINX config: `dist-dev4/nginx-dlt.aurigraph.io-v11.conf`
- [x] Configured HTTP to HTTPS redirect (port 80 → 443)
- [x] Set up proxy for V11 service (port 9003)
- [x] Added security headers (CSP, HSTS, X-Frame-Options)
- [x] Configured rate limiting (1000 req/s)

### ⚠️ **SSL/TLS Certificate** - **NEEDS VERIFICATION**
- [ ] Verify Let's Encrypt certificate for dlt.aurigraph.io
- [ ] Check certificate expiration date
- [ ] Test HTTPS redirect functionality
- [ ] Validate TLS 1.3 configuration

### ✅ **Application Configuration**
- [x] Production-ready application.properties
- [x] AI optimization parameters tuned for 2M+ TPS
- [x] Virtual threads enabled (Java 21)
- [x] HTTP/2 enabled for high performance
- [x] Logging configured for production

### ✅ **Deployment Scripts**
- [x] Created V11 deployment script: `deploy-v11-dev4.sh`
- [x] Native compilation with ultra optimization
- [x] Systemd service configuration
- [x] Health check endpoints

## 🚀 **Deployment Steps**

### 1. **Prepare Deployment Package**
```bash
cd aurigraph-v11-standalone
./deploy-v11-dev4.sh prepare
```

**Expected Output:**
- Native executable built with ultra optimization
- Deployment package in `dist-v11-dev4/`
- Production configuration files
- Systemd service file

### 2. **Deploy to Dev4 Server**
```bash
./deploy-v11-dev4.sh deploy
```

**Creates:**
- `aurigraph-v11-dev4.tar.gz` deployment package

### 3. **Server Setup (Run on dev4.aurigraph.io)**
```bash
# Upload package
scp aurigraph-v11-dev4.tar.gz user@dev4.aurigraph.io:/tmp/

# Connect and setup
ssh user@dev4.aurigraph.io
./deploy-v11-dev4.sh server-setup
```

## 🔧 **Critical Prerequisites to Check**

### **1. SSL Certificate Status**
```bash
# Check certificate validity
openssl s_client -connect dlt.aurigraph.io:443 -servername dlt.aurigraph.io < /dev/null 2>/dev/null | openssl x509 -noout -dates

# Verify Let's Encrypt auto-renewal
sudo certbot certificates
```

### **2. NGINX Configuration**
```bash
# Test new configuration
sudo nginx -t -c /path/to/nginx-dlt.aurigraph.io-v11.conf

# Check current NGINX status
sudo systemctl status nginx
```

### **3. Firewall and Security**
```bash
# Ensure ports are open
sudo ufw status
# Should allow: 22/tcp, 80/tcp, 443/tcp, 9003/tcp (internal)

# Check for port conflicts
sudo netstat -tlnp | grep -E ':(80|443|9003|9004)'
```

### **4. Server Resources**
```bash
# Check available memory (need 2GB+)
free -h

# Check disk space
df -h

# Check Java 21 installation
java --version
echo $JAVA_HOME
```

### **5. User and Permissions**
```bash
# Ensure aurigraph user exists
sudo useradd -r -s /bin/false aurigraph || true
sudo mkdir -p /opt/aurigraph/v11
sudo chown -R aurigraph:aurigraph /opt/aurigraph
```

## 🧪 **Post-Deployment Testing**

### **1. Service Health**
```bash
# Check systemd service
sudo systemctl status aurigraph-v11

# Test health endpoint
curl -s http://localhost:9003/api/v11/health | jq '.'
```

### **2. HTTPS and CORS Testing**
```bash
# Test HTTPS redirect
curl -I http://dlt.aurigraph.io/

# Test CORS headers
curl -H "Origin: https://example.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://dlt.aurigraph.io/api/v11/health
```

### **3. Performance Validation**
```bash
# Check current TPS
curl -s https://dlt.aurigraph.io/api/v11/stats | jq '.transactions.current_tps'

# Monitor performance
curl -s https://dlt.aurigraph.io/api/v11/performance
```

## ⚠️ **Known Issues & Solutions**

### **Issue 1: HTTP Not Redirecting to HTTPS**
**Current Status:** `curl http://dlt.aurigraph.io/` returns 200 OK instead of 301 redirect

**Solution:**
1. Update NGINX configuration with new V11 config
2. Ensure NGINX is reloaded: `sudo systemctl reload nginx`
3. Test redirect: `curl -I http://dlt.aurigraph.io/`

### **Issue 2: SSL Certificate**
**Potential Issue:** Let's Encrypt certificate may need renewal

**Solution:**
1. Check certificate: `sudo certbot certificates`
2. Renew if needed: `sudo certbot renew`
3. Reload NGINX: `sudo systemctl reload nginx`

### **Issue 3: Port Conflicts**
**Potential Issue:** Port 9003 may be in use

**Solution:**
1. Check port usage: `sudo lsof -i :9003`
2. Stop conflicting service or change port
3. Update NGINX proxy configuration

## 📊 **Performance Targets**

### **V11 Production Targets:**
- **TPS**: 2M+ (current dev: ~779K)
- **Latency**: <50ms P99
- **Memory**: <256MB (native)
- **Startup**: <1s (native)
- **Uptime**: 99.9%+

### **Security Requirements:**
- **TLS**: 1.3 only
- **CORS**: Properly configured
- **Rate Limiting**: 1000 req/s
- **DDoS Protection**: Enabled
- **Quantum Cryptography**: NIST Level 5

## 🎯 **Final Deployment Command**

Once all prerequisites are verified:

```bash
# On local machine
cd aurigraph-v11-standalone
./deploy-v11-dev4.sh prepare
./deploy-v11-dev4.sh deploy

# Upload and deploy
scp aurigraph-v11-dev4.tar.gz user@dev4.aurigraph.io:/tmp/
ssh user@dev4.aurigraph.io './deploy-v11-dev4.sh server-setup'

# Verify deployment
curl -s https://dlt.aurigraph.io/api/v11/health
```

## 📋 **Rollback Plan**

If deployment fails:

```bash
# On server
sudo systemctl stop aurigraph-v11
sudo systemctl start aurigraph-dev4  # V10 service
sudo cp /etc/nginx/sites-available/dlt.aurigraph.io.backup /etc/nginx/sites-available/dlt.aurigraph.io
sudo systemctl reload nginx
```

---

**⚡ STATUS: Ready for deployment after SSL certificate verification**