# 🚨 Immediate Fixes Required - Aurigraph V12
**Date**: December 5, 2025, 10:20 IST
**Priority**: CRITICAL
**Location**: Remote Server `dlt.aurigraph.io`

---

## 📊 Executive Summary

**3 Critical Bugs** blocking production functionality:
1. **PostgreSQL Not Running** → Login & Demo Registration fail (500 errors)
2. **LevelDB Path Issues** → Token Creation fails (500 error)
3. **TokenManagementService Disabled** → Token API non-functional

**Impact**: Core APIs returning 500 errors, affecting user experience

**Solution Time**: ~45 minutes total

---

## 🔴 CRITICAL FIX #1: Start PostgreSQL Container

### Problem
- PostgreSQL container `dlt-postgres` is not running on remote server
- Affects: Login API (`/api/v11/auth/login`), Demo Registration (`/api/v11/demos`)
- Error: 500 Internal Server Error (database connection failure)

### Solution (15 minutes)

```bash
# SSH to remote server
ssh -p 2235 subbu@dlt.aurigraph.io

# Check if PostgreSQL is running
docker ps | grep postgres

# If not running, start it
cd /path/to/Aurigraph-DLT  # Navigate to docker-compose.yml location
docker-compose up -d postgres

# Wait for startup (10 seconds)
sleep 10

# Verify PostgreSQL is healthy
docker exec -it dlt-postgres pg_isready -U aurigraph

# Test database connection
docker exec -it dlt-postgres psql -U aurigraph -d aurigraph_production -c "SELECT version();"

# Check application can connect
curl -X POST https://dlt.aurigraph.io/api/v11/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Expected: Should return 200 or 401 (not 500)
```

### Verification
```bash
# Test Login API
curl -X POST https://dlt.aurigraph.io/api/v11/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'

# Test Demo Registration API
curl -X POST https://dlt.aurigraph.io/api/v11/demos \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Demo",
    "description": "Testing database connectivity",
    "nodeCount": 5
  }'
```

**Success Criteria**: Both endpoints return 200/201 (not 500)

---

## 🔴 CRITICAL FIX #2: Configure LevelDB Paths

### Problem
- LevelDB directory `/var/lib/aurigraph/leveldb/` doesn't exist or not writable
- TokenManagementService disabled due to initialization failures
- Token Creation API returns 500 error

### Solution (20 minutes)

```bash
# SSH to remote server (if not already connected)
ssh -p 2235 subbu@dlt.aurigraph.io

# Create LevelDB directory structure
sudo mkdir -p /var/lib/aurigraph/leveldb

# Set proper ownership (replace 'subbu' with actual user if different)
sudo chown -R subbu:subbu /var/lib/aurigraph

# Set proper permissions
sudo chmod -R 755 /var/lib/aurigraph

# Verify writable
touch /var/lib/aurigraph/leveldb/test.txt && \
  rm /var/lib/aurigraph/leveldb/test.txt && \
  echo "✅ LevelDB directory is writable"

# Check current application.properties configuration
grep -A 5 "leveldb.data.path" /path/to/aurigraph-v11-standalone/src/main/resources/application.properties
```

### Expected Output
```properties
leveldb.data.path=/var/lib/aurigraph/leveldb/${consensus.node.id:node-1}
leveldb.cache.size.mb=256
leveldb.write.buffer.mb=64
leveldb.compression.enabled=true
```

**Success Criteria**: Directory exists, is writable, and owned by application user

---

## 🔴 CRITICAL FIX #3: Re-enable TokenManagementService

### Problem
- TokenManagementService injection commented out in `TokenDataService.java`
- Token Creation API uses mock data only
- Real token operations fail

### Solution (10 minutes)

#### File to Edit
`/path/to/aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/portal/services/TokenDataService.java`

#### Changes Required

**Line 22** - Re-enable injection:
```java
// BEFORE (commented out):
// @Inject
// TokenManagementService tokenManagementService;

// AFTER (uncommented):
@Inject
TokenManagementService tokenManagementService;
```

**Lines 301-327** - Update createToken method:
```java
public Uni<TokenCreationResponse> createToken(TokenCreationRequest request) {
    // Remove mock data implementation
    // Add real TokenManagementService call
    return tokenManagementService.createToken(request)
        .onItem().transform(token -> {
            return TokenCreationResponse.builder()
                .tokenId(token.getId())
                .tokenAddress(token.getAddress())
                .success(true)
                .message("Token created successfully")
                .timestamp(Instant.now())
                .build();
        })
        .onFailure().recoverWithItem(error -> {
            Log.error("Token creation failed", error);
            return TokenCreationResponse.builder()
                .success(false)
                .message("Token creation failed: " + error.getMessage())
                .timestamp(Instant.now())
                .build();
        });
}
```

#### Rebuild and Deploy

```bash
# On local machine
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# Rebuild application
./mvnw clean package -DskipTests

# Copy JAR to remote server
scp -P 2235 target/aurigraph-v12-standalone-12.0.0-runner.jar \
  subbu@dlt.aurigraph.io:/tmp/

# On remote server
ssh -p 2235 subbu@dlt.aurigraph.io

# Stop current application
docker-compose stop aurigraph-v11-service

# Update JAR file
sudo cp /tmp/aurigraph-v12-standalone-12.0.0-runner.jar \
  /path/to/deployment/aurigraph-v11-runner.jar

# Restart application
docker-compose up -d aurigraph-v11-service

# Wait for startup
sleep 30

# Check health
curl https://dlt.aurigraph.io/q/health
```

### Verification
```bash
# Test Token Creation API
curl -X POST https://dlt.aurigraph.io/api/v11/tokens/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Token",
    "symbol": "TEST",
    "totalSupply": 1000000,
    "decimals": 18
  }'

# Expected: 200 OK with token details (not 500)
```

**Success Criteria**: Token Creation API returns 200 with real token data

---

## 📋 Complete Execution Checklist

### Pre-Flight Checks
- [ ] SSH access to `dlt.aurigraph.io` confirmed
- [ ] Docker daemon running on remote server
- [ ] Backup of current configuration taken

### Phase 1: Infrastructure (15 min)
- [ ] SSH to remote server
- [ ] Check PostgreSQL status
- [ ] Start PostgreSQL container if stopped
- [ ] Verify PostgreSQL health check passes
- [ ] Test database connectivity from application

### Phase 2: LevelDB Setup (20 min)
- [ ] Create `/var/lib/aurigraph/leveldb/` directory
- [ ] Set ownership to application user
- [ ] Set permissions to 755
- [ ] Verify write permissions
- [ ] Check application.properties configuration

### Phase 3: Application Fix (10 min)
- [ ] Edit `TokenDataService.java` (re-enable injection)
- [ ] Rebuild application locally
- [ ] Copy JAR to remote server
- [ ] Stop application container
- [ ] Replace JAR file
- [ ] Restart application container
- [ ] Wait for health checks to pass

### Phase 4: Verification (5 min)
- [ ] Test Login API (expect 200/401, not 500)
- [ ] Test Demo Registration API (expect 200/201, not 500)
- [ ] Test Token Creation API (expect 200, not 500)
- [ ] Check application logs for errors
- [ ] Verify all health checks passing

---

## 🎯 Success Criteria

### Infrastructure
✅ PostgreSQL container running and healthy
✅ Database accessible at `postgres:5432` (Docker network)
✅ LevelDB directory exists and writable

### Application
✅ Login API: Returns 200 or 401 (not 500)
✅ Demo Registration API: Returns 200/201 (not 500)
✅ Token Creation API: Returns 200 (not 500)
✅ All health checks passing

### Logs
✅ No database connection errors
✅ No LevelDB initialization errors
✅ No TokenManagementService injection errors

---

## 🚀 Quick Command Reference

### Check Status
```bash
# PostgreSQL status
docker ps | grep postgres

# Application status
docker ps | grep aurigraph-v11

# Application logs
docker logs dlt-aurigraph-v11 --tail 100

# Health check
curl https://dlt.aurigraph.io/q/health
```

### Restart Services
```bash
# Restart PostgreSQL
docker-compose restart postgres

# Restart Application
docker-compose restart aurigraph-v11-service

# Restart All
docker-compose restart
```

### Test Endpoints
```bash
# Test Login
curl -X POST https://dlt.aurigraph.io/api/v11/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test Demo Registration
curl -X POST https://dlt.aurigraph.io/api/v11/demos \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Test","nodeCount":5}'

# Test Token Creation
curl -X POST https://dlt.aurigraph.io/api/v11/tokens/create \
  -H "Content-Type: application/json" \
  -d '{"name":"TEST","symbol":"TST","totalSupply":1000000}'
```

---

## 📞 Support Information

### Server Details
- **Host**: dlt.aurigraph.io
- **SSH Port**: 2235
- **User**: subbu
- **Docker Compose Location**: `/path/to/Aurigraph-DLT/docker-compose.yml`

### Key Files
- **Application JAR**: `/path/to/deployment/aurigraph-v11-runner.jar`
- **Config**: `aurigraph-v11-standalone/src/main/resources/application.properties`
- **Token Service**: `src/main/java/io/aurigraph/v11/portal/services/TokenDataService.java`

### Container Names
- PostgreSQL: `dlt-postgres`
- Application: `dlt-aurigraph-v11`
- Redis: `dlt-redis`

---

## 📚 Related Documentation
- `E2E-BUG-REPORT.md` - Detailed bug analysis
- `REMAINING-ISSUES-RESOLUTION-PLAN.md` - Comprehensive resolution plan
- `ISSUES_AND_TODO.md` - Full issue list
- `docker-compose.yml` - Infrastructure configuration

---

**Report Generated**: December 5, 2025, 10:20 IST
**Estimated Fix Time**: 45 minutes
**Priority**: CRITICAL - Blocking production functionality
