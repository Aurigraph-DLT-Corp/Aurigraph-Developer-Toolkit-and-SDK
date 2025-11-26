# 🚀 SPRINT 16 EXECUTION PLAN
## Aurigraph DLT V12 - Immediate Implementation Actions

**Date**: November 25, 2025
**Sprint**: 16 (Weeks 1-2)
**Status**: READY TO EXECUTE
**Team Size**: 4 backend + 2 frontend + 2 QA = 8 developers

---

## 📋 JIRA TICKETS - SPRINT 16

### Backend Tickets

#### AV11-480: Oracle Verification System Enhancement
**Type**: Story
**Priority**: Critical (P0)
**Effort**: 60 person-days (2 developers × 3 weeks)
**Sprint**: 16-17

**Description**:
Implement multi-oracle consensus verification system with signature validation for Real-World Asset (RWAT) composite token verification.

**Current Status**: 70% complete (OracleStatusService exists with 10 oracle integrations)

**Acceptance Criteria**:
- [ ] Multi-oracle consensus algorithm (3-of-5 minimum)
- [ ] Oracle signature verification (BouncyCastle)
- [ ] Median price calculation across active oracles
- [ ] 5% price tolerance validation
- [ ] Database persistence (oracle_verifications table)
- [ ] REST API endpoints (/api/v11/oracle/verify)
- [ ] 85% unit test coverage
- [ ] Integration tests with mock oracles
- [ ] Performance: <5s per verification

**Technical Specification**:
```java
// Package: io.aurigraph.v11.oracle
@ApplicationScoped
public class OracleVerificationService {
    public Uni<OracleVerificationResult> verifyAssetValue(
        String assetId,
        BigDecimal claimedValue
    ) {
        // 1. Query active oracles (10 integrations available)
        // 2. Fetch price data in parallel (CompletableFuture)
        // 3. Verify signatures (CRYSTALS-Dilithium)
        // 4. Calculate median price
        // 5. Validate claimed value (5% tolerance)
        // 6. Persist verification result
        // 7. Return OracleVerificationResult
    }
}
```

**Dependencies**:
- OracleStatusService (existing, 10 oracles configured)
- SignatureVerificationService (quantum crypto)
- Database migration: V11__Create_Oracle_Verification_Table.sql

**Subtasks**:
1. Create OracleVerificationService class
2. Implement multi-oracle consensus logic
3. Add signature verification
4. Create database migration script
5. Implement REST API endpoint
6. Write 50 unit tests
7. Write 20 integration tests
8. Performance testing (<5s target)

---

#### AV11-481: WebSocket Authentication & Subscription Management
**Type**: Story
**Priority**: High (P1)
**Effort**: 20 person-days (1 developer × 2 weeks)
**Sprint**: 16

**Description**:
Enhance existing WebSocket support with JWT authentication, channel-based subscription management, and message queuing for offline clients.

**Current Status**: 6 WebSocket endpoints exist, need authentication + subscriptions

**Acceptance Criteria**:
- [ ] JWT token validation on WebSocket connection
- [ ] Channel subscription management (subscribe/unsubscribe)
- [ ] Message queuing for offline clients (max 1000 messages)
- [ ] Heartbeat/ping-pong mechanism (every 30 seconds)
- [ ] Session persistence in database
- [ ] Support 10K+ concurrent connections
- [ ] Message delivery latency <100ms
- [ ] 85% test coverage

**Technical Specification**:
```java
// Package: io.aurigraph.v11.websocket
@ServerEndpoint(value = "/ws/transactions",
                configurator = AuthenticatedWebSocketConfigurator.class)
@ApplicationScoped
public class EnhancedTransactionWebSocket {

    @OnOpen
    public void onOpen(Session session, @PathParam("token") String authToken) {
        // 1. Validate JWT token
        // 2. Register session with WebSocketSessionManager
        // 3. Load subscription preferences
        // 4. Send connection acknowledgment
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        // Handle: SUBSCRIBE, UNSUBSCRIBE, PING commands
    }
}
```

**Dependencies**:
- Existing: WebSocketBroadcaster, LiveDataResource
- New: WebSocketSessionManager, WebSocketAuthenticationService

**Subtasks**:
1. Create AuthenticatedWebSocketConfigurator
2. Implement WebSocketSessionManager
3. Add subscription management logic
4. Create message queue system
5. Add heartbeat mechanism
6. Database migration for session persistence
7. Write 40 unit tests
8. Load testing (10K connections)

---

### Frontend Tickets

#### AV11-482: Real-Time Analytics Dashboard Component
**Type**: Story
**Priority**: High (P1)
**Effort**: 10 person-days (1 developer × 2 weeks)
**Sprint**: 16

**Description**:
Implement Real-Time Analytics dashboard with TPS charts, latency distribution, node performance grid, and anomaly alerts.

**Acceptance Criteria**:
- [ ] 6 KPI cards (TPS, Avg TPS, Peak TPS, Latency, Active/Pending Tx)
- [ ] TPS line chart with area gradient (60-second window)
- [ ] Latency distribution stacked area chart (p50/p95/p99)
- [ ] Block time bar chart
- [ ] Node performance grid (4x4, CPU/Memory/Network)
- [ ] Anomaly alerts panel with severity badges
- [ ] WebSocket real-time updates (1-second interval)
- [ ] Recharts integration
- [ ] 80% component test coverage

**Technical Specification**:
```typescript
// Component: /components/comprehensive/RealTimeAnalytics.tsx
const RealTimeAnalytics: React.FC = () => {
  const [tpsHistory, setTpsHistory] = useState<DataPoint[]>([]);
  const { data: tpsUpdate } = useEnhancedWebSocket<number>('metrics', 'tps_update');

  // Real-time chart with 60-second sliding window
  // Recharts: AreaChart, LineChart, BarChart
  // Update on WebSocket 'metric_update' event
};
```

**API Endpoints Required**:
- GET /api/v11/analytics/dashboard
- GET /api/v11/analytics/timeseries?metric=tps&window=1h
- GET /api/v11/nodes
- WS /ws/metrics

**Subtasks**:
1. Create RealTimeAnalytics component
2. Implement 6 KPI cards
3. Add TPS line chart (Recharts)
4. Add latency distribution chart
5. Add node performance grid
6. Integrate WebSocket real-time updates
7. Add anomaly alerts panel
8. Write component tests (Jest + RTL)
9. Integration test with mock API

---

#### AV11-483: WebSocket Real-Time Wrapper Enhancement
**Type**: Story
**Priority**: High (P1)
**Effort**: 15 person-days (1 developer × 3 weeks)
**Sprint**: 16-17

**Description**:
Enhance WebSocket service with advanced reconnection strategies, message queuing, channel management, and performance monitoring.

**Acceptance Criteria**:
- [ ] WebSocketManager with multi-channel support
- [ ] 3 reconnection strategies (exponential, linear, constant)
- [ ] Message queue with persistence (localStorage)
- [ ] Type-safe event subscriptions
- [ ] Connection state tracking
- [ ] Latency monitoring
- [ ] Message rate statistics
- [ ] React hook: useEnhancedWebSocket<T>()
- [ ] 85% test coverage

**Technical Specification**:
```typescript
// Service: /services/websocket/WebSocketManager.ts
class WebSocketManager {
  private connections: Map<string, WebSocketChannel>;
  private messageQueues: Map<string, MessageQueue>;

  createChannel(config: ChannelConfig): WebSocketChannel;
  subscribe<T>(channel: string, event: string, handler: (data: T) => void);
  setReconnectStrategy(channel: string, strategy: ReconnectStrategy);
  getHealthMetrics(): HealthMetrics;
}

// Hook: /hooks/useEnhancedWebSocket.ts
export const useEnhancedWebSocket = <T>(
  channel: string,
  eventType: string,
  options?: Options
): { data: T | null; isConnected: boolean; latency: number }
```

**Dependencies**:
- Existing: websocketService.ts
- New libraries: reconnecting-websocket, eventemitter3

**Subtasks**:
1. Create WebSocketManager class
2. Implement WebSocketChannel class
3. Add reconnection strategies
4. Create MessageQueue class
5. Implement useEnhancedWebSocket hook
6. Add connection health monitoring
7. Write unit tests (60 tests)
8. Integration tests with mock server
9. Load testing (1000+ subscriptions)

---

### Testing Tickets

#### AV11-484: Cryptography Test Suite (95% Coverage)
**Type**: Task
**Priority**: Critical (P0)
**Effort**: 5 person-days (1 developer × 1 week)
**Sprint**: 16

**Description**:
Comprehensive test suite for post-quantum cryptography (CRYSTALS-Dilithium, Kyber, SPHINCS+) to achieve 95%+ coverage.

**Acceptance Criteria**:
- [ ] 80 unit tests (key generation, signing, encryption)
- [ ] 25 integration tests (transaction signing, multi-sig)
- [ ] 10 performance tests (>1K sig/s, >5K ver/s)
- [ ] NIST test vector validation
- [ ] 95%+ line coverage
- [ ] 90%+ branch coverage
- [ ] JaCoCo report generation

**Test Categories**:
1. Key Generation (15 tests)
2. Digital Signatures (20 tests)
3. Encryption/Decryption (20 tests)
4. HSM Integration (15 tests)
5. NIST Compliance (10 tests)
6. Integration Tests (25 tests)
7. Performance Tests (10 tests)

**Target Classes**:
- PostQuantumCryptoService.java
- QuantumCryptoService.java
- DilithiumSignatureService.java
- KyberKeyManager.java
- SphincsPlusService.java

---

#### AV11-485: Consensus Test Suite (95% Coverage)
**Type**: Task
**Priority**: Critical (P0)
**Effort**: 8 person-days (2 developers × 1 week)
**Sprint**: 16

**Description**:
Comprehensive test suite for HyperRAFT++ consensus algorithm including leader election, log replication, and Byzantine fault tolerance.

**Acceptance Criteria**:
- [ ] 120 unit tests (leader election, log replication, state machine)
- [ ] 40 integration tests (multi-node consensus, failures)
- [ ] 15 performance tests (2M+ TPS validation)
- [ ] 95%+ line coverage
- [ ] All critical paths tested
- [ ] Network partition scenarios
- [ ] Byzantine failure scenarios

**Test Categories**:
1. Leader Election (25 tests)
2. Log Replication (30 tests)
3. State Machine (20 tests)
4. Consensus Protocol (25 tests)
5. AI Optimization (20 tests)
6. Integration Tests (40 tests)
7. Performance Tests (15 tests)

**Target Classes**:
- HyperRAFTPlusProduction.java
- HyperRAFTEnhancedOptimization.java
- LiveConsensusService.java
- ConsensusEngine.java

---

#### AV11-486: gRPC Service Test Suite (90% Coverage)
**Type**: Task
**Priority**: High (P1)
**Effort**: 5 person-days (1 developer × 1 week)
**Sprint**: 16

**Description**:
Test suite for 4 gRPC services (Transaction, Consensus, Blockchain, Network) with RPC method validation and performance testing.

**Acceptance Criteria**:
- [ ] 60 unit tests (service initialization, RPC methods)
- [ ] 30 integration tests (service-to-service communication)
- [ ] 10 performance tests (latency <5ms p50, 100K+ req/s)
- [ ] 90%+ line coverage
- [ ] Protocol Buffer validation
- [ ] Error handling tests

**Test Categories**:
1. Service Initialization (8 tests)
2. RPC Method Invocation (25 tests)
3. Protocol Buffers (10 tests)
4. Performance (12 tests)
5. Error Handling (5 tests)
6. Integration Tests (30 tests)
7. Performance Tests (10 tests)

**Target Services**:
- TransactionService (gRPC)
- ConsensusService (gRPC)
- BlockchainService (gRPC)
- NetworkService (gRPC)

---

## 🔧 ACTION 2: NGINX CONFIGURATION UPDATE

### Current Issue
V12 service running on `localhost:9003` but not publicly accessible via `https://dlt.aurigraph.io/api/v11/`

### NGINX Configuration Changes

**File**: `/etc/nginx/conf.d/default.conf` (on remote server)

**Add V12 API Proxy**:
```nginx
# V12 API Proxy (Port 9003)
location /api/v11/ {
    proxy_pass http://localhost:9003/api/v11/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}

# Health Check Endpoint
location /q/health {
    proxy_pass http://localhost:9003/q/health;
    proxy_http_version 1.1;
    add_header Content-Type application/json;
}

# Metrics Endpoint
location /q/metrics {
    proxy_pass http://localhost:9003/q/metrics;
    proxy_http_version 1.1;
    add_header Content-Type text/plain;
}
```

### Deployment Commands
```bash
# 1. SSH to remote server
ssh subbu@dlt.aurigraph.io

# 2. Backup current NGINX config
sudo cp /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.backup.$(date +%s)

# 3. Edit NGINX configuration
sudo nano /etc/nginx/conf.d/default.conf
# (Add the V12 API proxy configuration above)

# 4. Test NGINX configuration
sudo nginx -t

# 5. Reload NGINX (no downtime)
sudo nginx -s reload

# 6. Verify V12 API is publicly accessible
curl https://dlt.aurigraph.io/api/v11/health | jq .
curl https://dlt.aurigraph.io/api/v11/info | jq .
```

**Expected Result**: V12 API endpoints publicly accessible via HTTPS

---

## 📝 ACTION 3: ORACLE VERIFICATION - DETAILED IMPLEMENTATION SPEC

### Complete Implementation Guide

#### File 1: OracleVerificationService.java
**Location**: `src/main/java/io/aurigraph/v11/oracle/OracleVerificationService.java`

```java
package io.aurigraph.v11.oracle;

import io.smallrye.mutiny.Uni;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@ApplicationScoped
public class OracleVerificationService {

    @Inject
    OracleStatusService oracleStatusService;

    @Inject
    SignatureVerificationService signatureService;

    @Inject
    OracleVerificationRepository repository;

    @ConfigProperty(name = "oracle.verification.min.consensus", defaultValue = "0.51")
    double minConsensusThreshold;

    @ConfigProperty(name = "oracle.verification.price.tolerance", defaultValue = "0.05")
    double priceTolerance;

    public Uni<OracleVerificationResult> verifyAssetValue(
        String assetId,
        BigDecimal claimedValue
    ) {
        return Uni.createFrom().item(() -> {

            // Step 1: Query active oracles
            List<OracleNode> activeOracles = getActiveOracles();

            if (activeOracles.size() < 3) {
                throw new InsufficientOraclesException(
                    "Minimum 3 active oracles required, found: " + activeOracles.size()
                );
            }

            // Step 2: Fetch price data in parallel
            List<CompletableFuture<OraclePriceData>> futures = activeOracles.stream()
                .map(oracle -> CompletableFuture.supplyAsync(() ->
                    fetchPriceFromOracle(oracle, assetId)
                ))
                .collect(Collectors.toList());

            // Step 3: Wait for responses (timeout: 5 seconds)
            List<OraclePriceData> priceData = futures.stream()
                .map(f -> f.completeOnTimeout(null, 5, TimeUnit.SECONDS))
                .map(CompletableFuture::join)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

            // Step 4: Verify signatures
            List<OraclePriceData> verifiedData = priceData.stream()
                .filter(data -> signatureService.verifySignature(
                    data.getSignature(),
                    data.getOraclePublicKey(),
                    data.getPriceData()
                ))
                .collect(Collectors.toList());

            // Step 5: Calculate consensus
            BigDecimal medianPrice = calculateMedianPrice(verifiedData);
            double consensusPercent = calculateConsensusPercent(verifiedData, medianPrice);

            if (consensusPercent < minConsensusThreshold) {
                throw new ConsensusNotReachedException(
                    "Consensus threshold not met: " + consensusPercent + " < " + minConsensusThreshold
                );
            }

            // Step 6: Validate claimed value
            BigDecimal priceDifference = claimedValue.subtract(medianPrice).abs();
            BigDecimal maxDifference = medianPrice.multiply(BigDecimal.valueOf(priceTolerance));
            boolean isValid = priceDifference.compareTo(maxDifference) <= 0;

            // Step 7: Create result
            OracleVerificationResult result = new OracleVerificationResult(
                UUID.randomUUID().toString(),
                assetId,
                claimedValue,
                medianPrice,
                consensusPercent,
                isValid,
                verifiedData.size(),
                activeOracles.size(),
                Instant.now()
            );

            // Step 8: Persist result
            repository.save(result);

            return result;
        });
    }

    private List<OracleNode> getActiveOracles() {
        return oracleStatusService.getOracleStatus()
            .await().indefinitely()
            .getOracles().stream()
            .filter(o -> "active".equals(o.getStatus()))
            .collect(Collectors.toList());
    }

    private OraclePriceData fetchPriceFromOracle(OracleNode oracle, String assetId) {
        // Implementation depends on oracle type (Chainlink, Pyth, Band, etc.)
        // Each oracle has specific API integration
        return oracleStatusService.fetchPrice(oracle.getId(), assetId);
    }

    private BigDecimal calculateMedianPrice(List<OraclePriceData> data) {
        List<BigDecimal> prices = data.stream()
            .map(OraclePriceData::getPrice)
            .sorted()
            .collect(Collectors.toList());

        int size = prices.size();
        if (size == 0) {
            throw new NoOracleDataException("No oracle price data available");
        }

        if (size % 2 == 0) {
            return prices.get(size / 2 - 1)
                .add(prices.get(size / 2))
                .divide(BigDecimal.valueOf(2));
        } else {
            return prices.get(size / 2);
        }
    }

    private double calculateConsensusPercent(List<OraclePriceData> data, BigDecimal medianPrice) {
        long withinTolerance = data.stream()
            .filter(d -> {
                BigDecimal diff = d.getPrice().subtract(medianPrice).abs();
                BigDecimal maxDiff = medianPrice.multiply(BigDecimal.valueOf(priceTolerance));
                return diff.compareTo(maxDiff) <= 0;
            })
            .count();

        return (double) withinTolerance / data.size();
    }
}
```

#### File 2: Database Migration
**Location**: `src/main/resources/db/migration/V11__Create_Oracle_Verification_Table.sql`

```sql
-- Oracle Verification Results Table
CREATE TABLE oracle_verifications (
    verification_id VARCHAR(64) PRIMARY KEY,
    asset_id VARCHAR(128) NOT NULL,
    claimed_value DECIMAL(24, 8) NOT NULL,
    verified_value DECIMAL(24, 8),
    consensus_percent DECIMAL(5, 2),
    is_verified BOOLEAN NOT NULL,
    oracles_consulted INT NOT NULL,
    oracles_responded INT NOT NULL,
    verification_timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_asset_id (asset_id),
    INDEX idx_verification_timestamp (verification_timestamp),
    INDEX idx_is_verified (is_verified)
);

-- Oracle Verification Details (audit trail)
CREATE TABLE oracle_verification_details (
    detail_id VARCHAR(64) PRIMARY KEY,
    verification_id VARCHAR(64) NOT NULL,
    oracle_id VARCHAR(128) NOT NULL,
    oracle_name VARCHAR(256),
    reported_price DECIMAL(24, 8),
    signature_verified BOOLEAN,
    response_time_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (verification_id) REFERENCES oracle_verifications(verification_id),
    INDEX idx_verification_id (verification_id),
    INDEX idx_oracle_id (oracle_id)
);
```

#### File 3: REST API Endpoint
**Location**: `src/main/java/io/aurigraph/v11/AurigraphResource.java` (add to existing file)

```java
@Path("/api/v11/oracle")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OracleResource {

    @Inject
    OracleVerificationService verificationService;

    @POST
    @Path("/verify")
    public Uni<OracleVerificationResult> verifyAssetValue(
        VerifyAssetRequest request
    ) {
        return verificationService.verifyAssetValue(
            request.getAssetId(),
            request.getClaimedValue()
        );
    }

    @GET
    @Path("/verify/{verificationId}")
    public Uni<OracleVerificationResult> getVerificationResult(
        @PathParam("verificationId") String verificationId
    ) {
        return verificationService.getVerificationById(verificationId);
    }
}
```

#### File 4: Test Suite
**Location**: `src/test/java/io/aurigraph/v11/oracle/OracleVerificationServiceTest.java`

```java
@QuarkusTest
class OracleVerificationServiceTest {

    @Inject
    OracleVerificationService service;

    @InjectMock
    OracleStatusService mockOracleService;

    @InjectMock
    SignatureVerificationService mockSignatureService;

    @Test
    void testVerifyAssetValue_WithConsensus() {
        // Mock 5 oracles with similar prices
        mockOracleResponses(
            BigDecimal.valueOf(50000.00),
            BigDecimal.valueOf(50050.00),
            BigDecimal.valueOf(49950.00),
            BigDecimal.valueOf(50025.00),
            BigDecimal.valueOf(49975.00)
        );

        // Mock signature verification (all valid)
        when(mockSignatureService.verifySignature(any(), any(), any()))
            .thenReturn(true);

        // Execute
        var result = service.verifyAssetValue("BTC-USD", BigDecimal.valueOf(50000))
            .await().indefinitely();

        // Assert
        assertThat(result.isVerified()).isTrue();
        assertThat(result.getConsensusPercent()).isGreaterThan(0.8);
        assertThat(result.getVerifiedValue()).isCloseTo(
            BigDecimal.valueOf(50000),
            Offset.offset(BigDecimal.valueOf(100))
        );
    }

    @Test
    void testVerifyAssetValue_InsufficientOracles() {
        // Mock only 2 oracles (minimum is 3)
        mockOracleResponses(
            BigDecimal.valueOf(50000.00),
            BigDecimal.valueOf(50050.00)
        );

        // Execute & Assert
        assertThatThrownBy(() ->
            service.verifyAssetValue("BTC-USD", BigDecimal.valueOf(50000))
                .await().indefinitely()
        ).isInstanceOf(InsufficientOraclesException.class);
    }

    // Additional 48 unit tests...
}
```

---

## ⚙️ ACTION 4: CI/CD PIPELINE SETUP

### GitHub Actions Workflow
**Location**: `.github/workflows/test-pipeline.yml`

```yaml
name: Aurigraph V12 CI/CD Pipeline

on:
  push:
    branches: [main, develop, feature/*]
  pull_request:
    branches: [main, develop]

env:
  JAVA_VERSION: '21'
  MAVEN_OPTS: '-Xmx4g -XX:+UseG1GC'

jobs:
  # Job 1: Unit Tests
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'

      - name: Run unit tests
        run: |
          cd aurigraph-av10-7/aurigraph-v11-standalone
          ./mvnw test -Dquarkus.test.profile=unit

      - name: Generate JaCoCo report
        run: |
          cd aurigraph-av10-7/aurigraph-v11-standalone
          ./mvnw jacoco:report

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v4
        with:
          files: ./aurigraph-av10-7/aurigraph-v11-standalone/target/site/jacoco/jacoco.xml
          flags: unittests
          name: codecov-umbrella

      - name: Quality Gate - Coverage Check
        run: |
          cd aurigraph-av10-7/aurigraph-v11-standalone
          COVERAGE=$(./mvnw jacoco:report | grep -oP '(?<=Total\s)\d+')
          echo "Coverage: $COVERAGE%"
          if [ "$COVERAGE" -lt "85" ]; then
            echo "❌ Coverage $COVERAGE% is below 85% threshold"
            exit 1
          fi
          echo "✅ Coverage $COVERAGE% meets 85% threshold"

  # Job 2: Integration Tests
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: unit-tests

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: aurigraph_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'

      - name: Run integration tests
        env:
          QUARKUS_DATASOURCE_JDBC_URL: jdbc:postgresql://localhost:5432/aurigraph_test
          QUARKUS_DATASOURCE_USERNAME: testuser
          QUARKUS_DATASOURCE_PASSWORD: testpass
          QUARKUS_REDIS_HOSTS: redis://localhost:6379
        run: |
          cd aurigraph-av10-7/aurigraph-v11-standalone
          ./mvnw verify -Dquarkus.test.profile=integration

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: integration-test-results
          path: aurigraph-av10-7/aurigraph-v11-standalone/target/surefire-reports/

  # Job 3: Performance Tests
  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest
    needs: integration-tests
    if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop')

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'

      - name: Build application
        run: |
          cd aurigraph-av10-7/aurigraph-v11-standalone
          ./mvnw clean package -DskipTests

      - name: Run performance tests
        run: |
          cd aurigraph-av10-7/aurigraph-v11-standalone
          ./mvnw test -Pperformance-test

      - name: Upload JFR profiles
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: jfr-profiles
          path: aurigraph-av10-7/aurigraph-v11-standalone/target/jfr/*.jfr

  # Job 4: Security Scan
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    needs: unit-tests

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Snyk security scan
        uses: snyk/actions/maven@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  # Job 5: Build & Deploy
  build-deploy:
    name: Build & Deploy
    runs-on: ubuntu-latest
    needs: [integration-tests, security-scan]
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'

      - name: Build uber JAR
        run: |
          cd aurigraph-av10-7/aurigraph-v11-standalone
          ./mvnw clean package -DskipTests -Dquarkus.package.jar.type=uber-jar

      - name: Deploy to production
        env:
          REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
          REMOTE_USER: ${{ secrets.REMOTE_USER }}
          REMOTE_PASSWORD: ${{ secrets.REMOTE_PASSWORD }}
        run: |
          # Install sshpass
          sudo apt-get update && sudo apt-get install -y sshpass

          # Copy JAR to remote server
          sshpass -p "$REMOTE_PASSWORD" scp -o StrictHostKeyChecking=no \
            aurigraph-av10-7/aurigraph-v11-standalone/target/aurigraph-v12-standalone-12.0.0-runner.jar \
            $REMOTE_USER@$REMOTE_HOST:/tmp/

          # Restart service
          sshpass -p "$REMOTE_PASSWORD" ssh -o StrictHostKeyChecking=no \
            $REMOTE_USER@$REMOTE_HOST << 'EOF'
            # Stop old process
            pkill -f "aurigraph-v12-standalone" || true

            # Start new service
            cd /tmp
            nohup java -Xms512m -Xmx2g \
              -Dquarkus.http.port=9003 \
              -Dquarkus.flyway.migrate-at-start=false \
              -jar aurigraph-v12-standalone-12.0.0-runner.jar > v12.log 2>&1 &

            echo "✅ V12 deployment complete"
          EOF

      - name: Health check
        run: |
          sleep 30  # Wait for service to start
          curl -f https://dlt.aurigraph.io/api/v11/health || exit 1
          echo "✅ Health check passed"
```

### Quality Gates Configuration
**Location**: `.github/workflows/quality-gates.yml`

```yaml
name: Quality Gates

on:
  pull_request:
    branches: [main, develop]

jobs:
  quality-check:
    name: Quality Gates
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'

      - name: Run tests with coverage
        run: |
          cd aurigraph-av10-7/aurigraph-v11-standalone
          ./mvnw clean verify

      - name: Quality Gate 1 - Coverage
        run: |
          cd aurigraph-av10-7/aurigraph-v11-standalone
          ./mvnw jacoco:check -Djacoco.haltOnFailure=true

      - name: Quality Gate 2 - No Critical Bugs
        run: |
          cd aurigraph-av10-7/aurigraph-v11-standalone
          ./mvnw spotbugs:check -Dspotbugs.threshold=High

      - name: Quality Gate 3 - Code Style
        run: |
          cd aurigraph-av10-7/aurigraph-v11-standalone
          ./mvnw checkstyle:check

      - name: Comment PR with results
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ All quality gates passed!'
            })
```

---

## 📊 SPRINT 16 PROGRESS TRACKING

### Daily Standup Template
```markdown
### Sprint 16 - Day X

**Yesterday**:
- [ ] Completed tasks

**Today**:
- [ ] Planned tasks

**Blockers**:
- None / [Describe blocker]

**Coverage**:
- Backend: X%
- Frontend: X%
- Tests: X tests passed
```

### Definition of Done
- [ ] All acceptance criteria met
- [ ] Unit tests written (85%+ coverage)
- [ ] Integration tests written
- [ ] Code reviewed by 2 team members
- [ ] Documentation updated
- [ ] Performance benchmarks met
- [ ] Security scan passed
- [ ] Deployed to staging environment
- [ ] QA validated

---

## 🎯 SUCCESS CRITERIA - SPRINT 16

### Technical Metrics
- ✅ Backend coverage: 85%+
- ✅ Frontend coverage: 75%+
- ✅ 390 tests passing (Crypto + Consensus + gRPC)
- ✅ Oracle verification operational (<5s per verification)
- ✅ WebSocket authentication implemented
- ✅ Real-Time Analytics dashboard live
- ✅ V12 API publicly accessible via HTTPS

### Business Metrics
- ✅ Oracle-verified RWAT tokens ready for production
- ✅ Real-time monitoring dashboard deployed
- ✅ Developer productivity improved (WebSocket real-time updates)

---

**Document Created**: November 25, 2025
**Status**: READY FOR EXECUTION
**Next Review**: End of Week 1 (Sprint 16)
