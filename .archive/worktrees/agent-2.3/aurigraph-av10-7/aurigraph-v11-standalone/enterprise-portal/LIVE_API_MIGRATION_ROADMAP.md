# Live API Migration Roadmap

**Date**: October 31, 2025
**Current Status**: ✅ Planning & Foundation Complete
**Next Phase**: Begin Implementation Week 1

---

## 📋 What's Completed

### ✅ Phase 1: Assessment & Foundation (COMPLETE)

1. **Audit Complete**
   - Identified 20+ existing V11 backend services
   - Mapped all 45 Portal endpoints to V11 services
   - Documented existing infrastructure

2. **Strategy Documented**
   - Created `LIVE_API_INTEGRATION_STRATEGY.md` (14KB)
   - 4-week implementation plan (Dec 10 deadline)
   - Risk assessment and rollback procedures

3. **Foundation Code Started**
   - Created `PortalResponse.java` - Standard response wrapper
   - Created `BlockchainMetricsDTO.java` - Example data model
   - Directory structure: `src/main/java/io/aurigraph/v11/portal/models/`

---

## 🚀 What's Next (Week 1-2: Days 1-10)

### Immediate Actions (Next 24-48 hours)

1. **Create All Data Models** (12 models)
   ```
   src/main/java/io/aurigraph/v11/portal/models/
   ├── PortalResponse.java ✅
   ├── BlockchainMetricsDTO.java ✅
   ├── TransactionDTO.java
   ├── ValidatorDTO.java
   ├── BlockDTO.java
   ├── TokenDTO.java
   ├── AnalyticsDTO.java
   ├── MLMetricsDTO.java
   ├── RWATokenDTO.java
   ├── SmartContractDTO.java
   ├── MerkleProofDTO.java
   ├── StakingInfoDTO.java
   └── ... (more as needed)
   ```

2. **Create Portal API Gateway** (Core component)
   ```java
   src/main/java/io/aurigraph/v11/portal/
   ├── PortalAPIGateway.java        // Main API entry point
   ├── BlockchainGateway.java       // Blockchain endpoints
   ├── TokenGateway.java            // Token endpoints
   ├── AnalyticsGateway.java        // Analytics endpoints
   ├── services/
   │   ├── BlockchainDataService.java
   │   ├── TokenDataService.java
   │   ├── AnalyticsDataService.java
   │   └── CacheService.java
   └── interceptors/
       ├── AuthInterceptor.java
       ├── RateLimitInterceptor.java
       └── MetricsInterceptor.java
   ```

3. **Update NGINX Configuration**
   - Change mock endpoints to backend proxy
   - Remove redundant location blocks
   - Example: `/api/v11/blocks` → proxy to V11 (not NGINX mock)

### Week 1 Deliverables (Days 1-5)

**Implement Core Health Endpoints**:
- ✅ `/api/v11/health` - Use existing (enhance with live data)
- ✅ `/api/v11/info` - Use existing
- ✅ `/api/v11/performance` - Use existing (with real metrics)
- 🟡 `/api/v11/blockchain/metrics` - Convert mock → real
- 🟡 `/api/v11/blockchain/stats` - Convert mock → real
- 🟡 `/api/v11/tokens/statistics` - Convert mock → real
- 🟡 `/api/v11/blocks` - Convert mock → real
- 🟡 `/api/v11/validators` - Convert mock → real
- 🟡 `/api/v11/validators/{id}` - Convert mock → real
- 🟡 `/api/v11/transactions` - Convert mock → real

**Tests to Add**:
```java
// src/test/java/io/aurigraph/v11/portal/
├── PortalAPIGatewayTest.java
├── BlockchainGatewayTest.java
└── integration/
    └── PortalE2ETest.java
```

### Week 2 Deliverables (Days 6-10)

**Implement Analytics & Advanced Endpoints**:
- `/api/v11/analytics` - Live analytics service
- `/api/v11/analytics/performance` - Real metrics
- `/api/v11/ml/metrics` - ML model metrics
- `/api/v11/ml/performance` - AI performance
- `/api/v11/ml/predictions` - Live predictions
- `/api/v11/ml/confidence` - Confidence scores
- `/api/v11/transactions/{id}` - Specific transaction
- `/api/v11/tokens` - Token registry
- `/api/v11/network/health` - Network health
- `/api/v11/system/config` - System configuration

---

## 📊 Migration Strategy

### Option A: Gradual Replacement (RECOMMENDED)

**Week by week migration**:

```
Week 1: Deploy real endpoints in V11 backend
        Update NGINX to proxy to real endpoints
        Remove NGINX mocks one by one
        Keep mock endpoints as fallback

Week 2: 80% of endpoints live
        Comprehensive testing
        Performance optimization
        Minor bug fixes

Week 3: 100% of endpoints live
        Complete NGINX mock removal
        Full monitoring enabled
        Production validation

Week 4: Optimization and hardening
        Real-world performance data
        Fine-tuning caches
        Documentation update
```

### Option B: Dual Implementation (SAFER)

**Run both simultaneously**:

```
V11 Backend Endpoints (NEW - Real data)
    ↓ proxy_pass
NGINX Reverse Proxy
    ↓
Frontend Portal

V11 Mock Endpoints (OLD - Test data)
    ↓ (keep as fallback)
NGINX Reverse Proxy
```

**Gradual traffic shift**:
- Week 1: 10% real, 90% mock
- Week 2: 50% real, 50% mock
- Week 3: 90% real, 10% mock
- Week 4: 100% real

---

## 🔧 Implementation Pattern

### Standard endpoint migration:

**Before** (NGINX mock):
```nginx
location = /api/v11/blocks {
    access_log off;
    default_type application/json;
    return 200 '{"blocks": [...]}'
}
```

**Transition** (proxy to real):
```nginx
location = /api/v11/blocks {
    proxy_pass http://backend_api/api/v11/blocks;
    proxy_http_version 1.1;
    # ... proxy headers ...
}
```

**Final** (real backend):
```java
@GET
@Path("/blocks")
@Produces(MediaType.APPLICATION_JSON)
@Cached(cacheName = "blocks", duration = 10)
public Uni<List<BlockDTO>> getBlocks(
    @QueryParam("limit") @DefaultValue("20") int limit,
    @QueryParam("offset") @DefaultValue("0") int offset) {

    return blockchainService.getLatestBlocks(limit, offset)
        .map(blocks -> blocks.stream()
            .map(this::mapToDTO)
            .collect(Collectors.toList()));
}
```

---

## 📝 Code Examples

### Portal API Gateway Pattern

```java
@Path("/api/v11")
@ApplicationScoped
public class PortalAPIGateway {

    @Inject
    BlockchainDataService blockchainService;

    @Inject
    @CacheResult(cacheName = "blockchain-metrics")
    Cache<String, BlockchainMetricsDTO> metricsCache;

    @GET
    @Path("/blockchain/metrics")
    @Produces(MediaType.APPLICATION_JSON)
    @Timeout(value = 5, unit = ChronoUnit.SECONDS)
    @CircuitBreaker(requestVolumeThreshold = 20, failureThreshold = 50.0)
    public Uni<PortalResponse<BlockchainMetricsDTO>> getBlockchainMetrics() {
        return Uni.createFrom()
            .item(blockchainService.getMetrics())
            .map(metrics -> PortalResponse.success(metrics, "Blockchain metrics retrieved"))
            .onFailure()
            .recoverWithItem(throwable -> {
                LOG.error("Failed to fetch blockchain metrics", throwable);
                return PortalResponse.error(500, "Failed to retrieve metrics");
            });
    }
}
```

### Service Layer Pattern

```java
@ApplicationScoped
public class BlockchainDataService {

    @Inject
    io.aurigraph.v11.blockchain.NetworkStatsService networkStatsService;

    @Inject
    io.aurigraph.v11.consensus.HyperRAFTConsensusService consensusService;

    public BlockchainMetricsDTO getMetrics() {
        return BlockchainMetricsDTO.builder()
            .tps(networkStatsService.getCurrentTPS())
            .avgBlockTime(networkStatsService.getAvgBlockTime())
            .activenodes(networkStatsService.getActiveNodeCount())
            .totalTransactions(consensusService.getTotalTransactions())
            .consensus("HyperRAFT++")
            .status(networkStatsService.getNetworkStatus())
            .blockHeight(consensusService.getCurrentBlockHeight())
            .difficulty(consensusService.getCurrentDifficulty())
            .networkLoad(networkStatsService.getNetworkLoad())
            .finality(consensusService.getFinality())
            .build();
    }
}
```

---

## 🧪 Testing Strategy

### Unit Tests
```java
@QuarkusTest
public class BlockchainGatewayTest {

    @InjectMock
    BlockchainDataService blockchainService;

    @Test
    public void testGetBlockchainMetrics() {
        // Mock service
        BlockchainMetricsDTO metrics = new BlockchainMetricsDTO();
        metrics.setTps(776000);
        Mockito.when(blockchainService.getMetrics())
            .thenReturn(metrics);

        // Test endpoint
        given()
            .when().get("/api/v11/blockchain/metrics")
            .then()
            .statusCode(200)
            .body("status", equalTo(200))
            .body("data.tps", equalTo(776000));
    }
}
```

### Integration Tests
```java
@QuarkusIntegrationTest
public class PortalE2ETest {

    @Test
    public void testFullPortalFlow() {
        // Test complete flow: Frontend → Portal → V11 → Blockchain

        // 1. Get blockchain metrics
        given()
            .when().get("/api/v11/blockchain/metrics")
            .then().statusCode(200);

        // 2. Get validators
        given()
            .when().get("/api/v11/validators")
            .then().statusCode(200);

        // 3. Get transactions
        given()
            .when().get("/api/v11/transactions")
            .then().statusCode(200);

        // 4. Verify data consistency
        // ...
    }
}
```

---

## 📈 Performance Targets

| Metric | Target | Current | Gap |
|--------|--------|---------|-----|
| P50 Latency | <50ms | ~500ms* | -90% |
| P95 Latency | <100ms | ~1000ms* | -90% |
| P99 Latency | <200ms | ~2000ms* | -90% |
| Throughput | 10K req/s | ~100 req/s* | -99% |
| Cache Hit Rate | >80% | 0% | +80% |
| Uptime | 99.9% | 100% (mock) | Maintain |

*Mock endpoints have no real data fetch cost

---

## 🔒 Security Checklist

- [ ] Add authentication to all endpoints
- [ ] Implement rate limiting per endpoint
- [ ] Add request validation
- [ ] Implement CORS properly
- [ ] Add audit logging
- [ ] Secure sensitive endpoints (admin)
- [ ] Implement CSRF protection
- [ ] Add data encryption in transit
- [ ] Monitor for suspicious patterns
- [ ] Regular security audits

---

## 📞 Communication Plan

**When**: Every Monday at 10:00 AM
**Format**:
- Progress: What endpoints went live
- Issues: Blockers and resolutions
- Next: What's next week's targets
- Metrics: Performance data

**Status Updates**:
- Daily: Git commits
- Weekly: Email to team
- Sprint: JIRA updates

---

## 🎯 Success Definition

✅ **Technical Success**:
- All 45 endpoints return real data
- <100ms P95 latency
- 99.9% uptime
- Zero data inconsistencies

✅ **Business Success**:
- Portal shows real blockchain state
- Users gain full visibility
- No performance regressions
- Zero critical incidents

---

## 📚 Documentation

**Auto-generate from code**:
```bash
mvn clean package
# API docs generated to:
# target/generated-docs/openapi.yaml
# target/generated-docs/index.html
```

**Update Portal docs**:
- API_ENDPOINTS_REFERENCE.md (update with real data)
- Endpoint response examples (from real system)
- Data validation rules (from v11 backend)

---

## 🚨 Rollback Procedure

**If critical issues in production**:

```bash
# Immediate: Revert to mocks
git revert <commit-hash>
./deploy-nginx.sh --rollback

# Temporary: Restore mock endpoints
sudo systemctl restart nginx

# Investigation: What went wrong?
- Check logs
- Analyze metrics
- Review recent changes

# Fix & Retry: Address issue
- Fix code
- Add tests
- Re-deploy with canary
```

**Zero data loss**:
- Mock endpoints preserved
- Blockchain data immutable
- Can always retry real implementation

---

## 📞 Next Steps

1. **Today**: Review this roadmap
2. **Tomorrow**: Start coding data models
3. **This week**: Complete Portal API Gateway
4. **Next week**: Deploy first live endpoints
5. **Month end**: 100% live data

---

## 📖 References

- `LIVE_API_INTEGRATION_STRATEGY.md` - Detailed strategy
- `API_ENDPOINTS_REFERENCE.md` - Endpoint catalog
- `MOCK_ENDPOINTS_DEPLOYMENT.md` - Current mock setup
- `CLAUDE.md` - Development guide

---

**Status**: 🟢 Ready to Begin Implementation
**Next Update**: After Week 1 completion (Nov 6, 2025)

Generated with Claude Code
