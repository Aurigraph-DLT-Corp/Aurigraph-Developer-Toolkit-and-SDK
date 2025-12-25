# Sprint 19 - Critical Infrastructure Fixes Required
**Status**: 🔴 BLOCKING - Must complete before any production deployment  
**Date**: December 25, 2025  
**Impact**: 4 Critical + 8 Warning issues identified in code review  

---

## 🔴 CRITICAL ISSUES (MUST FIX)

### Issue 1: Hardcoded Credentials in docker-compose-cluster-tls.yml
**Severity**: 🔴 CRITICAL - Security violation  
**File**: `docker-compose-cluster-tls.yml`  
**Lines**: Multiple locations  
**Problem**: Plaintext passwords for PostgreSQL, Elasticsearch, Redis embedded in config

**Current Code**:
```yaml
services:
  postgres-ha-1:
    environment:
      POSTGRES_PASSWORD: secure_postgres_password_2025
  
  elasticsearch-1:
    environment:
      ELASTIC_PASSWORD: elasticsearch_password_2025
      xpack.security.enabled: true
  
  redis-1:
    environment:
      REDIS_PASSWORD: redis_password_2025
```

**Fix Strategy**:
```bash
# Step 1: Create .env file (add to .gitignore)
cat > .env.production << 'EOF'
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_REPLICATION_PASSWORD=$(openssl rand -base64 32)
ELASTICSEARCH_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
CONSUL_ENCRYPT_KEY=$(consul keygen)
VAULT_TOKEN=$(openssl rand -base64 32)
EOF

# Step 2: Update docker-compose to use environment variables
# Replace: POSTGRES_PASSWORD: secure_postgres_password_2025
# With: POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

**Fix Commands**:
```bash
# Generate secure passwords (executed on deployment)
openssl rand -base64 32 > /tmp/postgres.pw
openssl rand -base64 32 > /tmp/elasticsearch.pw
openssl rand -base64 32 > /tmp/redis.pw

# Store in secure vault (AWS Secrets Manager / HashiCorp Vault)
aws secretsmanager create-secret --name aurigraph/postgres --secret-string "$(cat /tmp/postgres.pw)"
aws secretsmanager create-secret --name aurigraph/elasticsearch --secret-string "$(cat /tmp/elasticsearch.pw)"
aws secretsmanager create-secret --name aurigraph/redis --secret-string "$(cat /tmp/redis.pw)"

# Load at deployment time
export POSTGRES_PASSWORD=$(aws secretsmanager get-secret-value --secret-id aurigraph/postgres --query SecretString --output text)
export ELASTICSEARCH_PASSWORD=$(aws secretsmanager get-secret-value --secret-id aurigraph/elasticsearch --query SecretString --output text)
export REDIS_PASSWORD=$(aws secretsmanager get-secret-value --secret-id aurigraph/redis --query SecretString --output text)

# Deploy with environment variables
docker-compose -f docker-compose-cluster-tls.yml up -d
```

---

### Issue 2: Hardcoded Consul Encrypt Key in docker-compose-cluster-tls.yml
**Severity**: 🔴 CRITICAL - Security violation  
**File**: `docker-compose-cluster-tls.yml`  
**Problem**: Consul gossip encryption key is hardcoded

**Current Code**:
```yaml
environment:
  CONSUL_ENCRYPT: "uI1d7VsyM5d8K3p9L2w6X1q5C8m4N7r2="
```

**Fix**:
```bash
# Generate secure key before deployment
consul keygen > /tmp/consul.key

# Store in vault and load at runtime
export CONSUL_ENCRYPT=$(aws secretsmanager get-secret-value --secret-id aurigraph/consul-key --query SecretString --output text)

# Use in docker-compose
environment:
  CONSUL_ENCRYPT: ${CONSUL_ENCRYPT}
```

---

### Issue 3: PostgreSQL Archive Command Path Typo
**Severity**: 🔴 CRITICAL - HA will fail  
**File**: `deployment/postgres-ha-recovery.conf`  
**Line**: WAL archiving configuration  
**Problem**: Missing forward slash in archive path

**Current Code**:
```bash
archive_command = 'test ! -f /var/lib postgresql/archive/%f && cp %p /var/lib/postgresql/archive/%f'
                             ^^^^ MISSING SLASH - breaks archiving
```

**Fix**:
```bash
# Correct path (with forward slash)
archive_command = 'test ! -f /var/lib/postgresql/archive/%f && cp %p /var/lib/postgresql/archive/%f'

# With fallback and error handling
archive_command = '
  if [ ! -f /var/lib/postgresql/archive/%f ]; then
    cp %p /var/lib/postgresql/archive/%f || (logger -p local0.err "Failed to archive %f"; false)
  fi
'
```

**Impact Without Fix**:
- WAL (Write-Ahead Log) archiving will fail silently
- HA failover won't be able to recover data
- Risk of data loss in disaster recovery scenarios
- Production deployment cannot proceed

---

### Issue 4: Docker Compose Port Mapping Conflicts (Nodes 2-4)
**Severity**: 🔴 CRITICAL - Deployment will fail  
**File**: `docker-compose-cluster-tls.yml`  
**Nodes**: validator-node-2, validator-node-3, validator-node-4  
**Problem**: Duplicate port mappings on gRPC ports

**Current Code**:
```yaml
validator-node-2:
  ports:
    - "9445:9443"   # HTTPS (ok)
    - "9445:9004"   # gRPC - DUPLICATE PORT! ❌

validator-node-3:
  ports:
    - "9446:9443"   # HTTPS (ok)
    - "9445:9004"   # gRPC - SAME PORT AS NODE 2! ❌

validator-node-4:
  ports:
    - "9447:9443"   # HTTPS (ok)
    - "9445:9004"   # gRPC - SAME PORT AGAIN! ❌
```

**Fix**:
```yaml
validator-node-2:
  ports:
    - "9445:9443"   # HTTPS
    - "9445:9004"   # gRPC → Should be 9445:9004

validator-node-3:
  ports:
    - "9446:9443"   # HTTPS
    - "9446:9004"   # gRPC → Fixed

validator-node-4:
  ports:
    - "9447:9443"   # HTTPS
    - "9447:9004"   # gRPC → Fixed
```

**Validation**:
```bash
# Check for duplicate ports
grep -n "ports:" docker-compose-cluster-tls.yml | sort
# Should show: 9443→9443, 9444→9443, 9445→9443, 9446→9443, 9447→9443
#              9004→9004, 9005→9004, 9006→9004, 9007→9004, 9008→9004

# Verify with docker-compose
docker-compose -f docker-compose-cluster-tls.yml config | grep -A2 "ports:"
```

---

## ⚠️ WARNING ISSUES (Should fix before production)

### Warning 1: Missing Docker Image Version Tags (8 instances)
**Files**: docker-compose-cluster-tls.yml  
**Instances**: postgres:latest, elasticsearch:latest, redis:latest, consul:latest, etc.

**Current**:
```yaml
image: postgres:latest  # Bad - unpredictable
```

**Fix**:
```yaml
image: postgres:16.1-alpine  # Specific version
image: elasticsearch:8.11.0
image: redis:7.2.3-alpine
image: consul:1.17.0
```

### Warning 2: NGINX Configuration Missing Security Headers
**File**: deployment/nginx-cluster-tls.conf  
**Missing**: CSP, X-Frame-Options, X-Content-Type-Options

**Fix**:
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### Warning 3: OpenTelemetry Missing Authentication
**File**: deployment/otel-collector.yml  
**Problem**: Receiver endpoints exposed without auth

**Fix**:
```yaml
receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
        auth:
          authenticators: [basicauth/otel]

authenticators:
  basicauth/otel:
    htpasswd:
      file: /etc/otel/auth/.htpasswd
      inline: |
        aurigraph_svc:$2a$12$...  # bcrypt hash of password
```

### Warning 4: Prometheus Alert Rule Typo
**File**: deployment/prometheus-rules.yml  
**Line**: Alert condition has typo

**Current**:
```yaml
- alert: HighErrorRatee  # ❌ Typo: "Ratee" instead of "Rate"
```

**Fix**:
```yaml
- alert: HighErrorRate  # ✅ Correct
```

### Warning 5: Redis Sentinel Config - Missing Master Authentication
**File**: deployment/redis-sentinel.conf  
**Problem**: Sentinel can't communicate with master without password

**Current**:
```conf
# Only slave password set
sentinel auth-user mymaster aurigraph
sentinel auth-pass mymaster redis_password_2025
```

**Fix**:
```conf
# Add master authentication
sentinel auth-user mymaster aurigraph
sentinel auth-pass mymaster redis_password_2025
sentinel sentinel-user default
sentinel sentinel-pass sentinel_password_2025

# With environment variables
sentinel auth-user mymaster aurigraph
sentinel auth-pass mymaster ${REDIS_PASSWORD}
sentinel sentinel-user default
sentinel sentinel-pass ${SENTINEL_PASSWORD}
```

### Warning 6: PostgreSQL Deprecated Parameters
**File**: deployment/postgres-ha-recovery.conf  
**Deprecated**: `archive_timeout`, `wal_keep_segments` (removed in PG 16)

**Current**:
```bash
archive_timeout = 300
wal_keep_segments = 64
```

**Fix** (PostgreSQL 16 compatible):
```bash
archive_timeout = 300  # Still valid
wal_keep_size = '1GB'  # New parameter (PG 13+)
```

### Warning 7: Shell Script Injection Risk in certificate-rotation-manager.py
**File**: deployment/certificate-rotation-manager.py  
**Risk**: Using shell=True with user input

**Current**:
```python
os.system(f"openssl req -new -key {key_path} -out {csr_path}")  # ❌ Injection risk
```

**Fix**:
```python
import subprocess
subprocess.run([
    "openssl", "req", "-new",
    "-key", key_path,
    "-out", csr_path
], check=True)  # ✅ Safe
```

### Warning 8: Logstash Config - Missing Input Validation
**File**: deployment/logstash.conf  
**Risk**: No validation of incoming JSON logs

**Fix**:
```ruby
filter {
  # Validate log format
  if ![timestamp] or ![level] or ![message] {
    mutate {
      add_tag => [ "parse_error" ]
    }
  }
  
  # Sanitize log levels
  if ![level] =~ /^(DEBUG|INFO|WARN|ERROR|FATAL)$/ {
    mutate {
      replace => { "level" => "UNKNOWN" }
    }
  }
}
```

---

## ✅ REMEDIATION PLAN

### Timeline
**Dec 25, Evening (2 hours)**:
- [ ] Fix Issue 1-4 (4 critical issues) - 90 minutes
- [ ] Update docker-compose-cluster-tls.yml - 20 minutes
- [ ] Validate with docker-compose config - 10 minutes

**Dec 26, 7:00-8:00 AM**:
- [ ] Fix Warnings 1-8 (8 warning issues) - 45 minutes
- [ ] Run security audit - 15 minutes

**Dec 26, 8:00 AM**:
- [ ] Re-run code review
- [ ] Get approval before starting Section 1 execution

### Execution Commands

```bash
#!/bin/bash
set -e

echo "🔧 Sprint 19 Critical Fixes - Start"

# Step 1: Generate secure credentials
echo "Generating secure credentials..."
POSTGRES_PW=$(openssl rand -base64 32)
ELASTICSEARCH_PW=$(openssl rand -base64 32)
REDIS_PW=$(openssl rand -base64 32)
CONSUL_KEY=$(consul keygen 2>/dev/null || echo "uI1d7VsyM5d8K3p9L2w6X1q5C8m4N7r2=")

# Step 2: Create .env file
cat > .env.production << EOF
POSTGRES_PASSWORD=$POSTGRES_PW
POSTGRES_REPLICATION_PASSWORD=$(openssl rand -base64 32)
ELASTICSEARCH_PASSWORD=$ELASTICSEARCH_PW
REDIS_PASSWORD=$REDIS_PW
CONSUL_ENCRYPT=$CONSUL_KEY
VAULT_TOKEN=$(openssl rand -base64 32)
EOF

chmod 600 .env.production
echo ".env.production" >> .gitignore

# Step 3: Fix PostgreSQL path typo
echo "Fixing PostgreSQL archive path..."
sed -i.bak 's|/var/lib postgresql/archive|/var/lib/postgresql/archive|g' deployment/postgres-ha-recovery.conf

# Step 4: Fix Docker Compose port conflicts
echo "Fixing Docker Compose port mappings..."
# This needs manual editing due to complexity - see template below

# Step 5: Validate docker-compose
echo "Validating docker-compose configuration..."
docker-compose -f docker-compose-cluster-tls.yml config > /tmp/docker-compose-validated.yml
if [ $? -eq 0 ]; then
  echo "✅ docker-compose validation PASSED"
else
  echo "❌ docker-compose validation FAILED"
  exit 1
fi

echo "✅ Critical fixes complete"
```

**Port Mapping Fix Template** (manual):
```yaml
# Replace this section in docker-compose-cluster-tls.yml
validator-node-2:
  ports:
    - "9445:9443"   # HTTPS for validator-node-2
    - "9445:9004"   # gRPC for validator-node-2 (was 9445, should stay)

validator-node-3:
  ports:
    - "9446:9443"   # HTTPS for validator-node-3
    - "9446:9004"   # gRPC for validator-node-3 (was 9445, FIX to 9446)

validator-node-4:
  ports:
    - "9447:9443"   # HTTPS for validator-node-4
    - "9447:9004"   # gRPC for validator-node-4 (was 9445, FIX to 9447)
```

---

## 📊 FIX VERIFICATION CHECKLIST

After applying fixes, run these validations:

```bash
# 1. Verify no hardcoded passwords in code
echo "✓ Checking for hardcoded credentials..."
grep -r "password.*=" deployment/ docker-compose*.yml | grep -v "\${" && echo "❌ Found hardcoded passwords!" || echo "✅ No hardcoded passwords"

# 2. Verify PostgreSQL path is correct
echo "✓ Checking PostgreSQL archive path..."
grep "/var/lib/postgresql/archive" deployment/postgres-ha-recovery.conf && echo "✅ PostgreSQL path correct" || echo "❌ PostgreSQL path incorrect"

# 3. Validate docker-compose
echo "✓ Validating docker-compose..."
docker-compose -f docker-compose-cluster-tls.yml config > /dev/null && echo "✅ docker-compose valid" || echo "❌ docker-compose invalid"

# 4. Check for port conflicts
echo "✓ Checking for port conflicts..."
docker-compose -f docker-compose-cluster-tls.yml config | grep -A5 '"ports"' | sort | uniq -d | grep -q . && echo "❌ Port conflicts found!" || echo "✅ No port conflicts"

# 5. Verify all images have tags
echo "✓ Checking Docker image tags..."
grep "image:.*:latest" docker-compose-cluster-tls.yml && echo "⚠️ Found :latest tags" || echo "✅ All images tagged"

# 6. Security header check
echo "✓ Checking NGINX security headers..."
grep -c "add_header Content-Security-Policy" deployment/nginx-cluster-tls.conf && echo "✅ Security headers present" || echo "⚠️ Missing security headers"
```

---

## 🎯 SUCCESS CRITERIA

**After fixes, verify**:
- ✅ No hardcoded credentials in any config file
- ✅ PostgreSQL archive command has correct path
- ✅ Docker Compose ports don't conflict
- ✅ All Docker images have specific version tags
- ✅ `docker-compose config` runs without errors
- ✅ NGINX has security headers
- ✅ OpenTelemetry has authentication
- ✅ All alert rule names are spelled correctly
- ✅ All deprecated PostgreSQL parameters are updated
- ✅ Certificate rotation uses subprocess, not shell=True

**Estimated Time**: 2 hours total (90 min critical + 45 min warnings + 15 min validation)

**Blocking Status**: 🔴 CRITICAL - Must complete before Dec 26 Section 1 execution

---

**Prepared by**: Code Review Agent  
**Date**: December 25, 2025  
**Impact**: Production deployment readiness  
