# TIER 1 Critical Fixes - Execution Plan
**Date**: December 5, 2025, 12:08 IST
**Status**: 🚀 READY TO EXECUTE
**Estimated Time**: 30 minutes

---

## 🎯 Current Status

### ✅ Completed Analysis
- [x] Reviewed docker-compose.yml configuration
- [x] Identified PostgreSQL service configuration (dlt-postgres)
- [x] Located TokenDataService.java (currently using mock data)
- [x] Found LevelDB configuration in application.properties
- [x] Confirmed database connection strings

### ⚠️ Current Blockers
- [ ] Remote server connection (dlt.aurigraph.io:2235) - Connection refused
- [ ] Docker daemon not running locally
- [ ] Need to verify server accessibility

---

## 🔧 Fix 1: Start PostgreSQL Database

### Configuration Found
```yaml
# From docker-compose.yml (lines 298-334)
postgres:
  image: postgres:16-alpine
  container_name: dlt-postgres
  environment:
    - POSTGRES_DB=aurigraph_production
    - POSTGRES_USER=aurigraph
    - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-aurigraph-prod-secure-2025}
  volumes:
    - dlt-postgres-data:/var/lib/postgresql/data
  networks:
    - dlt-backend
```

### Application Configuration
```properties
# From application.properties (line 870)
quarkus.datasource.jdbc.url=jdbc:postgresql://dlt-postgres:5432/aurigraph_production

# Production (line 914)
%prod.quarkus.datasource.jdbc.url=jdbc:postgresql://dlt-postgres:5432/aurigraph_production
```

### Execution Steps
```bash
# 1. SSH to remote server
ssh -p 2235 subbu@dlt.aurigraph.io

# 2. Check PostgreSQL status
docker ps | grep postgres

# 3. If not running, check all containers
docker ps -a | grep postgres

# 4. Start PostgreSQL
docker-compose up -d postgres

# 5. Verify it's running
docker ps | grep postgres

# 6. Check logs
docker logs dlt-postgres

# 7. Test database connection
docker exec -it dlt-postgres psql -U aurigraph -d aurigraph_production -c "SELECT version();"

# 8. Test from application
curl -X POST https://dlt.aurigraph.io/api/v11/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```

**Expected Result**: PostgreSQL running, Login API returns 200 (or proper auth error, not 500)

---

## 🔧 Fix 2: Configure LevelDB Paths

### Configuration Found
```properties
# From application.properties (line 227)
leveldb.data.path=/var/lib/aurigraph/leveldb/${consensus.node.id:node-1}

# Production (line 238)
%prod.leveldb.data.path=/var/lib/aurigraph/leveldb/${consensus.node.id:prod-node-1}
```

### Execution Steps
```bash
# 1. SSH to remote server
ssh -p 2235 subbu@dlt.aurigraph.io

# 2. Check if directory exists
ls -la /var/lib/aurigraph/leveldb/

# 3. Create directory with proper permissions
sudo mkdir -p /var/lib/aurigraph/leveldb
sudo chown -R subbu:subbu /var/lib/aurigraph
sudo chmod -R 755 /var/lib/aurigraph

# 4. Verify writable
touch /var/lib/aurigraph/leveldb/test.txt && rm /var/lib/aurigraph/leveldb/test.txt

# 5. Create node-specific directories
mkdir -p /var/lib/aurigraph/leveldb/node-1
mkdir -p /var/lib/aurigraph/leveldb/prod-node-1

# 6. Verify permissions
ls -la /var/lib/aurigraph/leveldb/
```

**Expected Result**: Directory exists with write permissions for application user

---

## 🔧 Fix 3: Re-enable TokenManagementService

### Current State
```java
// Line 22 in TokenDataService.java
// TokenManagementService injection removed to avoid LevelDB initialization issues
// Re-add when ready for real token integration
```

### Code Changes Required

**File**: `aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/portal/services/TokenDataService.java`

**Change 1**: Re-enable TokenManagementService injection (line 22)
```java
// BEFORE:
// TokenManagementService injection removed to avoid LevelDB initialization issues
// Re-add when ready for real token integration

// AFTER:
@Inject
TokenManagementService tokenManagementService;
```

**Change 2**: Update createToken method to use real service (lines 301-327)
```java
// CURRENT: Using mock data
public Uni<TokenDTO> createToken(TokenCreateRequest request) {
    return Uni.createFrom().item(() -> {
        // ... mock implementation
    });
}

// UPDATED: Use TokenManagementService
public Uni<TokenDTO> createToken(TokenCreateRequest request) {
    Log.infof("Creating token via TokenManagementService: %s (%s)", 
              request.name(), request.symbol());
    
    // Convert request to TokenManagementService format
    var tokenRequest = io.aurigraph.v11.token.TokenCreationRequest.builder()
        .name(request.name())
        .symbol(request.symbol())
        .decimals(request.decimals() != null ? request.decimals() : 18)
        .totalSupply(request.value() != null ? request.value().longValue() : 1000000L)
        .assetType(request.assetType())
        .description(request.description())
        .build();
    
    return tokenManagementService.createToken(tokenRequest)
        .onItem().transform(token -> {
            return TokenDTO.builder()
                .tokenId(token.getId())
                .name(token.getName())
                .symbol(token.getSymbol())
                .decimals(token.getDecimals())
                .totalSupply(String.valueOf(token.getTotalSupply()))
                .circulatingSupply("0")
                .contractAddress(token.getContractAddress())
                .type(token.getType())
                .price("$" + String.format("%.2f", request.value() / 1000000.0))
                .priceChange24h(0.0)
                .marketCap("$" + String.format("%.2f", request.value()))
                .volume24h("$0.00")
                .holders(1)
                .createdAt(Instant.now())
                .status("active")
                .build();
        })
        .onFailure().recoverWithItem(error -> {
            Log.errorf("Token creation failed: %s", error.getMessage());
            // Return mock token as fallback
            String tokenId = "TOK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            return TokenDTO.builder()
                .tokenId(tokenId)
                .name(request.name())
                .symbol(request.symbol())
                .status("failed")
                .build();
        });
}
```

### Execution Steps
```bash
# 1. Navigate to project directory
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone

# 2. Make code changes (see above)
# This will be done via code editor

# 3. Rebuild application
./mvnw clean package -DskipTests

# 4. Build Docker image
docker build -t aurigraph-v11:11.4.4 .

# 5. Deploy to remote server
# (Use existing deployment scripts)

# 6. Test token creation API
curl -X POST https://dlt.aurigraph.io/api/v11/tokens/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Token",
    "symbol": "TEST",
    "value": 1000000,
    "assetType": "rwa"
  }'
```

**Expected Result**: Token creation returns 200 with real token data

---

## 📋 Execution Checklist

### Phase 1: Server Access (5 min)
- [ ] Verify remote server is accessible
- [ ] Check if Docker is running on server
- [ ] Verify docker-compose.yml is present

### Phase 2: PostgreSQL Fix (10 min)
- [ ] Check PostgreSQL container status
- [ ] Start PostgreSQL if not running
- [ ] Verify database connectivity
- [ ] Test Login API endpoint
- [ ] Test Demo Registration API endpoint

### Phase 3: LevelDB Fix (10 min)
- [ ] Check LevelDB directory existence
- [ ] Create directory with proper permissions
- [ ] Verify write access
- [ ] Create node-specific subdirectories

### Phase 4: Code Changes (10 min)
- [ ] Update TokenDataService.java
- [ ] Rebuild application locally
- [ ] Run tests to verify no regressions
- [ ] Build Docker image
- [ ] Deploy to remote server
- [ ] Test Token Creation API

---

## 🎯 Success Criteria

### Infrastructure ✅
- [ ] PostgreSQL accessible at `dlt-postgres:5432`
- [ ] Database connection successful from application
- [ ] LevelDB directory writable at `/var/lib/aurigraph/leveldb/`

### Application ✅
- [ ] Login API returns 200 or proper auth error (not 500)
- [ ] Demo Registration API returns 200 or validation error (not 500)
- [ ] Token Creation API returns 200 with real token data (not 500)

### Verification ✅
- [ ] All E2E tests pass
- [ ] No LevelDB initialization errors in logs
- [ ] No database connection errors in logs

---

## 🚨 Troubleshooting

### If PostgreSQL won't start:
```bash
# Check logs
docker logs dlt-postgres

# Check if port is in use
sudo netstat -tlnp | grep 5432

# Remove and recreate
docker-compose down postgres
docker volume rm dlt-postgres-data
docker-compose up -d postgres
```

### If LevelDB permissions fail:
```bash
# Check SELinux/AppArmor
sudo getenforce
sudo aa-status

# Disable if needed (temporary)
sudo setenforce 0

# Check disk space
df -h /var/lib/aurigraph
```

### If Token Creation still fails:
```bash
# Check application logs
docker logs dlt-aurigraph-v11 | grep -i "leveldb\|token"

# Verify TokenManagementService is loaded
docker exec -it dlt-aurigraph-v11 curl http://localhost:9004/q/health
```

---

## 📞 Next Steps

1. **Verify Server Access**: Check if dlt.aurigraph.io:2235 is accessible
2. **Execute Fixes**: Run through each fix sequentially
3. **Test Endpoints**: Verify all three critical APIs work
4. **Update Status**: Mark issues as resolved in REMAINING-ISSUES-RESOLUTION-PLAN.md
5. **Proceed to TIER 2**: Configuration cleanup (if time permits)

---

**Created**: December 5, 2025, 12:08 IST
**Last Updated**: December 5, 2025, 12:08 IST
**Status**: Ready for execution pending server access
