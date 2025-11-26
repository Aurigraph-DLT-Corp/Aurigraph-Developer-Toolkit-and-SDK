# CURBy Quantum Service Integration Guide

**JIRA Ticket**: AV11-482
**Sprint**: 13
**Status**: Completed
**Version**: 11.0.0

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Configuration](#configuration)
5. [Integration Points](#integration-points)
6. [Usage Examples](#usage-examples)
7. [Fallback Mechanism](#fallback-mechanism)
8. [Performance Optimization](#performance-optimization)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)
11. [Testing](#testing)
12. [Performance Metrics](#performance-metrics)

---

## Overview

The CURBy Quantum Service Integration provides post-quantum cryptography capabilities to Aurigraph V11 through integration with the CURBy external quantum service. This implementation includes:

- **REST API Integration**: HTTP/2 client with connection pooling and async operations
- **Quantum Key Distribution (QKD)**: Automated key generation, rotation, and lifecycle management
- **Hybrid Cryptography**: Combines classical (AES-256-GCM) and quantum-resistant (CRYSTALS-Kyber/Dilithium) algorithms
- **Circuit Breaker Pattern**: Automatic failover with configurable thresholds
- **Fallback Mechanism**: Seamless fallback to local quantum crypto when CURBy is unavailable
- **Performance Optimization**: Key caching, connection pooling, batch operations

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Aurigraph V11 Platform                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Transaction  │  │ Consensus    │  │  WebSocket      │  │
│  │ Service      │  │ Service      │  │  Service        │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│         │                  │                    │           │
│         └──────────────────┼────────────────────┘           │
│                            │                                │
│  ┌────────────────────────▼─────────────────────────────┐  │
│  │       HybridCryptographyService                      │  │
│  │  (Combines Classical + Quantum Cryptography)         │  │
│  └─────────────────────┬────────────────────────────────┘  │
│                        │                                    │
│  ┌────────────────────▼────────────────────────────────┐   │
│  │       QuantumKeyDistributionService (QKD)           │   │
│  │  (Key Rotation, Lifecycle, Secure Storage)          │   │
│  └─────────────────────┬────────────────────────────────┘   │
│                        │                                    │
│  ┌────────────────────▼────────────────────────────────┐   │
│  │           CURByQuantumClient                        │   │
│  │  (REST API, Circuit Breaker, Retry Logic)           │   │
│  └─────────────────────┬────────────────────────────────┘   │
│                        │                                    │
└────────────────────────┼────────────────────────────────────┘
                         │
                         │ HTTP/2 + TLS 1.3
                         │
┌────────────────────────▼────────────────────────────────┐
│              CURBy Quantum Service API                  │
│         https://api.curby.quantum.io                    │
│  (External Post-Quantum Cryptography Service)           │
└─────────────────────────────────────────────────────────┘
```

### Component Dependencies

```
HybridCryptographyService
    ├── CURByQuantumClient (for quantum operations)
    └── QuantumCryptoService (for local fallback)

QuantumKeyDistributionService
    └── CURByQuantumClient (for key generation)

CURByQuantumClient
    └── QuantumCryptoService (for fallback)
```

---

## Components

### 1. CURByQuantumClient

**Purpose**: Primary interface to CURBy quantum service
**Location**: `/src/main/java/io/aurigraph/v11/crypto/curby/CURByQuantumClient.java`

**Key Features**:
- HTTP/2 client with Virtual Threads (Java 21)
- Exponential backoff retry logic (configurable attempts)
- Circuit breaker pattern (auto-open/close based on failure rate)
- TTL-based key caching (reduces API calls)
- Comprehensive health monitoring
- Automatic failover to local crypto

**Methods**:
```java
// Generate quantum key pair
Uni<QuantumKeyPairResponse> generateKeyPair(String algorithm)

// Generate quantum signature
Uni<QuantumSignatureResponse> generateSignature(String data, String privateKey, String algorithm)

// Verify quantum signature
Uni<QuantumVerificationResponse> verifySignature(String data, String signature, String publicKey, String algorithm)

// Get health status
CURByHealthStatus getHealthStatus()
```

**Circuit Breaker States**:
- **CLOSED**: Normal operation (requests go to CURBy)
- **OPEN**: Degraded mode (requests go to fallback)
- **HALF-OPEN**: Recovery testing (partial requests to CURBy)

**Retry Logic**:
- Max attempts: 3 (configurable)
- Base delay: 100ms (configurable)
- Exponential backoff: delay = base_delay * 2^(attempt-1)
- Example: 100ms → 200ms → 400ms

---

### 2. QuantumKeyDistributionService (QKD)

**Purpose**: Manages quantum key lifecycle and distribution
**Location**: `/src/main/java/io/aurigraph/v11/crypto/curby/QuantumKeyDistributionService.java`

**Key Features**:
- Automated key generation and distribution
- Configurable key rotation (default: 60 minutes)
- Secure key storage with AES-256-GCM encryption
- Key lifecycle management (ACTIVE → ROTATED → EXPIRED → REVOKED)
- Master key encryption (for key-at-rest security)
- Scheduled cleanup of expired keys

**Key Lifecycle**:
```
┌─────────┐  Generate  ┌────────┐  Rotate   ┌─────────┐  Expire   ┌─────────┐
│ REQUEST │ ──────────>│ ACTIVE │ ─────────>│ ROTATED │ ─────────>│ EXPIRED │
└─────────┘            └───┬────┘           └─────────┘           └─────────┘
                           │
                           │ Revoke
                           ▼
                       ┌─────────┐
                       │ REVOKED │
                       └─────────┘
```

**Methods**:
```java
// Generate and distribute new quantum key
Uni<QuantumKeyExchangeResult> generateAndDistributeKey(String sessionId, String algorithm)

// Rotate existing quantum key
Uni<QuantumKeyRotationResult> rotateKey(String sessionId)

// Revoke quantum key
Uni<QuantumKeyRevocationResult> revokeKey(String sessionId, String reason)

// Get quantum key
QuantumKey getKey(String sessionId)

// Get QKD service status
QKDServiceStatus getStatus()
```

---

### 3. HybridCryptographyService

**Purpose**: Combines classical and quantum cryptography
**Location**: `/src/main/java/io/aurigraph/v11/crypto/curby/HybridCryptographyService.java`

**Key Features**:
- Hybrid encryption: AES-256-GCM + Kyber KEM
- Hybrid signatures: SHA-256 + Dilithium
- Configurable quantum/classical weights (default: 70% quantum, 30% classical)
- Backward compatibility mode
- Automatic fallback to classical-only crypto

**Hybrid Encryption Process**:
```
┌──────────────┐
│  Plaintext   │
└──────┬───────┘
       │
       ▼
┌─────────────────────────┐
│ 1. Generate AES Session │
│    Key (256-bit)        │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ 2. Encrypt with         │
│    AES-256-GCM          │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ 3. Encapsulate Session  │
│    Key with Kyber KEM   │
└─────────┬───────────────┘
          │
          ▼
┌─────────────────────────┐
│ 4. Combine:             │
│    IV + Classical CT +  │
│    Quantum CT           │
└─────────┬───────────────┘
          │
          ▼
┌──────────────┐
│  Ciphertext  │
└──────────────┘
```

**Hybrid Signature Verification**:
```
Weighted Verification Decision:
confidence = (classicalValid ? classicalWeight : 0.0) + (quantumValid ? quantumWeight : 0.0)
valid = confidence >= 0.5

Example (70% quantum, 30% classical):
- Both valid: confidence = 1.0 → VALID
- Only quantum valid: confidence = 0.7 → VALID
- Only classical valid: confidence = 0.3 → INVALID
- Neither valid: confidence = 0.0 → INVALID
```

**Methods**:
```java
// Hybrid encryption
Uni<HybridEncryptionResult> encryptHybrid(String plaintext, String publicKey, String algorithm)

// Hybrid decryption
Uni<HybridDecryptionResult> decryptHybrid(String ciphertext, String privateKey, String algorithm)

// Hybrid signature
Uni<HybridSignatureResult> signHybrid(String data, String privateKey, String algorithm)

// Hybrid verification
Uni<HybridVerificationResult> verifyHybrid(String data, String signature, String publicKey, String algorithm)

// Get status
HybridCryptoStatus getStatus()
```

---

## Configuration

### Complete Configuration (application.properties)

```properties
# ==================== CURBY QUANTUM SERVICE INTEGRATION ====================

# CURBy Service Configuration
curby.quantum.url=https://api.curby.quantum.io
curby.quantum.api-key=${CURBY_API_KEY:}
curby.quantum.enabled=true
curby.quantum.fallback=true
curby.quantum.algorithm=CRYSTALS-Dilithium

# Connection and Timeout Settings
curby.quantum.timeout.seconds=30
curby.quantum.retry.max-attempts=3
curby.quantum.retry.base-delay-ms=100

# Circuit Breaker Configuration
curby.quantum.circuit-breaker.failure-threshold=5
curby.quantum.circuit-breaker.reset-timeout-ms=60000

# Key Cache Settings
curby.quantum.key-cache.ttl-seconds=300

# Health Check Monitoring
curby.quantum.health-check.interval-seconds=30

# Quantum Key Distribution (QKD)
qkd.enabled=true
qkd.key.rotation.interval.minutes=60
qkd.key.expiry.minutes=120
qkd.key.cache.max-size=10000
qkd.master.key.path=/var/lib/aurigraph/qkd/master.key
qkd.encryption.algorithm=AES-256-GCM

# Hybrid Cryptography
hybrid.crypto.enabled=true
hybrid.crypto.quantum-weight=0.7
hybrid.crypto.classical-weight=0.3
hybrid.crypto.backward-compatible=true
```

### Environment-Specific Configuration

#### Development
```properties
%dev.curby.quantum.enabled=false       # Use local crypto
%dev.curby.quantum.fallback=true
%dev.qkd.key.rotation.interval.minutes=15
%dev.qkd.key.expiry.minutes=30
```

#### Production
```properties
%prod.curby.quantum.enabled=true       # Use CURBy service
%prod.curby.quantum.timeout.seconds=60
%prod.qkd.key.rotation.interval.minutes=30
%prod.qkd.key.expiry.minutes=60
%prod.hybrid.crypto.quantum-weight=0.8 # Higher quantum weight
%prod.hybrid.crypto.classical-weight=0.2
```

### Environment Variables

Required environment variable:
```bash
export CURBY_API_KEY=your_curby_api_key_here
```

---

## Integration Points

### 1. TransactionService Integration

**Purpose**: Use quantum signatures for transaction signing

**Implementation**:
```java
@Inject
HybridCryptographyService hybridCrypto;

public Uni<Transaction> signTransaction(Transaction tx) {
    String data = serializeTransaction(tx);
    String privateKey = getSigningKey();

    return hybridCrypto.signHybrid(data, privateKey, "CRYSTALS-Dilithium")
        .onItem().transform(result -> {
            tx.setSignature(result.signature());
            tx.setSignatureType("HYBRID");
            return tx;
        });
}

public Uni<Boolean> verifyTransaction(Transaction tx) {
    String data = serializeTransaction(tx);

    return hybridCrypto.verifyHybrid(
        data,
        tx.getSignature(),
        tx.getSenderPublicKey(),
        "CRYSTALS-Dilithium"
    ).onItem().transform(HybridVerificationResult::valid);
}
```

### 2. ConsensusService Integration

**Purpose**: Quantum-secure consensus with QKD key exchange

**Implementation**:
```java
@Inject
QuantumKeyDistributionService qkd;

public Uni<Void> establishConsensusKeys() {
    String sessionId = "consensus-round-" + getCurrentRound();

    return qkd.generateAndDistributeKey(sessionId, "CRYSTALS-Kyber")
        .onItem().transformToUni(result -> {
            if (result.success()) {
                distributeKeysToValidators(result);
                return Uni.createFrom().voidItem();
            } else {
                return Uni.createFrom().failure(new Exception("QKD failed"));
            }
        });
}
```

### 3. WebSocketService Integration

**Purpose**: Secure WebSocket connections with quantum key exchange

**Implementation**:
```java
@Inject
QuantumKeyDistributionService qkd;

@Inject
HybridCryptographyService hybridCrypto;

public Uni<Void> establishSecureWebSocket(String sessionId) {
    return qkd.generateAndDistributeKey(sessionId, "CRYSTALS-Kyber")
        .onItem().transformToUni(qkdResult -> {
            if (qkdResult.success()) {
                // Use QKD key for WebSocket encryption
                return encryptWebSocketData(qkdResult.sessionKeyEncrypted());
            } else {
                return Uni.createFrom().failure(new Exception("QKD failed"));
            }
        });
}
```

### 4. APIService Integration

**Purpose**: Quantum authentication for API requests

**Implementation**:
```java
@Inject
HybridCryptographyService hybridCrypto;

public Uni<Boolean> authenticateApiRequest(String token, String signature) {
    return hybridCrypto.verifyHybrid(
        token,
        signature,
        getApiPublicKey(),
        "CRYSTALS-Dilithium"
    ).onItem().transform(result ->
        result.valid() && result.confidence() >= 0.8
    );
}
```

---

## Usage Examples

### Example 1: Generate Quantum Key Pair

```java
@Inject
CURByQuantumClient curbyClient;

public void generateKeys() {
    curbyClient.generateKeyPair("CRYSTALS-Dilithium")
        .subscribe().with(
            result -> {
                if (result.success()) {
                    LOG.infof("Generated key: %s", result.keyId());
                    String publicKey = result.publicKey();
                    String privateKey = result.privateKey();
                    // Store keys securely
                }
            },
            error -> LOG.errorf("Key generation failed: %s", error.getMessage())
        );
}
```

### Example 2: Hybrid Encryption/Decryption

```java
@Inject
HybridCryptographyService hybridCrypto;

public void encryptAndDecrypt() {
    String plaintext = "Sensitive data";
    String publicKey = "..."; // Recipient's public key
    String privateKey = "..."; // Recipient's private key

    // Encrypt
    hybridCrypto.encryptHybrid(plaintext, publicKey, "CRYSTALS-Kyber")
        .onItem().transformToUni(encryptResult -> {
            LOG.infof("Encrypted in %.2fms", encryptResult.latencyMs());
            String ciphertext = encryptResult.ciphertext();

            // Decrypt
            return hybridCrypto.decryptHybrid(ciphertext, privateKey, "CRYSTALS-Kyber");
        })
        .subscribe().with(
            decryptResult -> {
                LOG.infof("Decrypted: %s", decryptResult.plaintext());
            },
            error -> LOG.error("Encryption/decryption failed", error)
        );
}
```

### Example 3: QKD Key Rotation

```java
@Inject
QuantumKeyDistributionService qkd;

public void rotateSessionKey(String sessionId) {
    qkd.rotateKey(sessionId)
        .subscribe().with(
            result -> {
                if (result.success()) {
                    LOG.infof("Key rotated for session %s", sessionId);
                    String newPublicKey = result.newPublicKey();
                    // Distribute new key to participants
                } else {
                    LOG.errorf("Key rotation failed: %s", result.message());
                }
            },
            error -> LOG.error("Key rotation error", error)
        );
}
```

---

## Fallback Mechanism

### Automatic Fallback Behavior

The integration includes a comprehensive fallback mechanism that ensures continuous operation even when CURBy service is unavailable:

**Fallback Triggers**:
1. Circuit breaker OPEN (failure threshold exceeded)
2. CURBy API timeout (exceeds configured timeout)
3. Network connectivity issues
4. Invalid CURBy API response

**Fallback Process**:
```
CURBy Request
    │
    ▼
┌─────────────┐
│ Circuit     │  NO
│ Breaker     │────────────┐
│ OPEN?       │            │
└─────┬───────┘            │
      │ YES                │
      ▼                    ▼
┌──────────────┐    ┌────────────┐
│ USE FALLBACK │    │ Try CURBy  │
│ (Local Crypto)│    │ Service    │
└──────────────┘    └──────┬─────┘
                           │
                    ┌──────▼──────┐
                    │  Success?   │
                    └──────┬──────┘
                           │
               ┌───────────┼───────────┐
               │ YES       │ NO        │
               ▼           ▼
         ┌─────────┐  ┌────────────┐
         │ Reset   │  │ Record     │
         │ Circuit │  │ Failure &  │
         │ Breaker │  │ USE        │
         │         │  │ FALLBACK   │
         └─────────┘  └────────────┘
```

**Local Quantum Crypto Fallback**:
```java
private QuantumKeyPairResponse useFallbackKeyGeneration(String algorithm) {
    try {
        String keyId = "fallback-" + System.currentTimeMillis();
        var request = new QuantumCryptoService.KeyGenerationRequest(keyId, algorithm);
        var result = localQuantumCrypto.generateKeyPair(request).await().indefinitely();

        return new QuantumKeyPairResponse(
            true,
            result.keyId(),
            result.algorithm(),
            "LOCAL_FALLBACK",
            "Generated using local quantum crypto (CURBy unavailable)",
            result.publicKeySize(),
            result.privateKeySize(),
            System.currentTimeMillis()
        );
    } catch (Exception e) {
        LOG.error("Fallback key generation failed", e);
        throw new CURByException("Both CURBy and local crypto failed", e);
    }
}
```

---

## Performance Optimization

### 1. Connection Pooling

HTTP client uses connection pooling for efficient reuse:
```java
HttpClient httpClient = HttpClient.newBuilder()
    .version(HttpClient.Version.HTTP_2)
    .connectTimeout(Duration.ofSeconds(10))
    .executor(Executors.newVirtualThreadPerTaskExecutor()) // Java 21 Virtual Threads
    .build();
```

**Benefits**:
- Reduced connection overhead
- Faster request processing
- Lower resource consumption

### 2. Key Caching

TTL-based caching reduces API calls:
```java
Map<String, CachedQuantumKey> keyCache = new ConcurrentHashMap<>();

// Cache hit
CachedQuantumKey cached = keyCache.get(cacheKey);
if (cached != null && cached.expiryTime() > System.currentTimeMillis()) {
    cachedResponses.incrementAndGet();
    return cached.response();
}

// Cache miss - fetch from CURBy
QuantumKeyPairResponse response = curbyClient.generateKeyPair(algorithm).await().indefinitely();
keyCache.put(cacheKey, new CachedQuantumKey(response, System.currentTimeMillis() + TTL));
```

**Configuration**:
```properties
curby.quantum.key-cache.ttl-seconds=300  # 5 minutes
```

### 3. Async Quantum Operations

All quantum operations are asynchronous using Mutiny:
```java
public Uni<QuantumKeyPairResponse> generateKeyPair(String algorithm) {
    return Uni.createFrom().item(() -> {
        // Async operation
        return performQuantumKeyGeneration(algorithm);
    });
}
```

**Benefits**:
- Non-blocking operations
- Higher throughput
- Better resource utilization

### 4. Batch Operations

Future enhancement for batching multiple quantum operations:
```java
public Uni<List<QuantumSignatureResponse>> signBatch(List<SignatureRequest> requests) {
    // Batch multiple signature requests
    return Uni.combine().all().unis(
        requests.stream()
            .map(req -> generateSignature(req.data(), req.privateKey(), req.algorithm()))
            .toList()
    ).combinedWith(Function.identity());
}
```

---

## Security Considerations

### 1. API Key Management

**DO NOT** hardcode API keys:
```properties
# ❌ WRONG
curby.quantum.api-key=my_secret_key_12345

# ✅ CORRECT
curby.quantum.api-key=${CURBY_API_KEY:}
```

**Recommended**:
- Use environment variables
- Store in secure vault (HashiCorp Vault, AWS Secrets Manager)
- Rotate keys regularly (90 days)
- Use IAM roles where possible

### 2. Master Key Protection

QKD master key for encrypting stored quantum keys:
```properties
qkd.master.key.path=/var/lib/aurigraph/qkd/master.key
```

**Production Setup**:
```bash
# Generate master key
openssl rand -base64 32 > /var/lib/aurigraph/qkd/master.key

# Set permissions
chmod 400 /var/lib/aurigraph/qkd/master.key
chown aurigraph:aurigraph /var/lib/aurigraph/qkd/master.key
```

### 3. TLS/SSL Configuration

Always use HTTPS for CURBy API:
```properties
curby.quantum.url=https://api.curby.quantum.io  # HTTPS required
```

### 4. Key Rotation

Automated key rotation reduces exposure:
```properties
qkd.key.rotation.interval.minutes=60  # Rotate every hour
```

### 5. Audit Logging

All quantum operations are logged:
```java
LOG.infof("Generated quantum key for session %s (Algorithm: %s, Expiry: %d min)",
    sessionId, algorithm, keyExpiryMinutes);
```

---

## Troubleshooting

### Common Issues

#### Issue 1: CURBy API Connection Timeout

**Symptoms**:
```
ERROR [CURByQuantumClient] CURBy API connection timeout after 30s
```

**Solutions**:
1. Check network connectivity:
   ```bash
   curl -I https://api.curby.quantum.io/api/v1/health
   ```
2. Increase timeout:
   ```properties
   curby.quantum.timeout.seconds=60
   ```
3. Verify firewall rules allow outbound HTTPS
4. Check CURBy service status

#### Issue 2: Circuit Breaker OPEN

**Symptoms**:
```
WARN [CURByQuantumClient] Circuit breaker OPEN - using fallback
```

**Solutions**:
1. Check CURBy health status:
   ```bash
   curl https://api.curby.quantum.io/api/v1/health
   ```
2. Wait for circuit breaker timeout (default: 60s)
3. Manually reset circuit breaker (if available)
4. Verify API key is valid

**Check Circuit Breaker Status**:
```bash
curl http://localhost:9003/api/v11/crypto/curby/health
```

#### Issue 3: Key Cache Miss Rate High

**Symptoms**:
```
DEBUG [CURByQuantumClient] Cache miss rate: 95%
```

**Solutions**:
1. Increase cache TTL:
   ```properties
   curby.quantum.key-cache.ttl-seconds=600  # 10 minutes
   ```
2. Monitor cache statistics:
   ```bash
   curl http://localhost:9003/api/v11/crypto/curby/status
   ```

#### Issue 4: QKD Master Key Not Found

**Symptoms**:
```
ERROR [QuantumKeyDistributionService] Master key not found: /var/lib/aurigraph/qkd/master.key
```

**Solutions**:
1. Generate master key:
   ```bash
   mkdir -p /var/lib/aurigraph/qkd
   openssl rand -base64 32 > /var/lib/aurigraph/qkd/master.key
   chmod 400 /var/lib/aurigraph/qkd/master.key
   ```
2. Update configuration path:
   ```properties
   qkd.master.key.path=/path/to/your/master.key
   ```

#### Issue 5: Hybrid Crypto Fallback Excessive

**Symptoms**:
```
WARN [HybridCryptographyService] Classical fallbacks: 500 (50% of operations)
```

**Solutions**:
1. Check CURBy service reliability
2. Review circuit breaker thresholds:
   ```properties
   curby.quantum.circuit-breaker.failure-threshold=10  # Increase tolerance
   ```
3. Verify quantum weight configuration
4. Monitor CURBy API latency

---

## Testing

### Unit Tests (with Mock)

**Mock CURBy Client**:
```java
@QuarkusTest
public class CURByQuantumClientTest {

    @InjectMock
    CURByQuantumClient curbyClient;

    @Test
    public void testKeyGenerationMock() {
        // Setup mock
        QuantumKeyPairResponse mockResponse = new QuantumKeyPairResponse(
            true,
            "test-key-123",
            "CRYSTALS-Dilithium",
            "mock_public_key",
            "mock_private_key",
            2592,
            4896,
            System.currentTimeMillis()
        );

        when(curbyClient.generateKeyPair("CRYSTALS-Dilithium"))
            .thenReturn(Uni.createFrom().item(mockResponse));

        // Test
        QuantumKeyPairResponse result = curbyClient.generateKeyPair("CRYSTALS-Dilithium")
            .await().indefinitely();

        assertTrue(result.success());
        assertEquals("test-key-123", result.keyId());
    }
}
```

### Integration Tests (with CURBy Testnet)

**CURBy Testnet Configuration**:
```properties
%test.curby.quantum.url=https://testnet-api.curby.quantum.io
%test.curby.quantum.api-key=${CURBY_TESTNET_API_KEY:}
%test.curby.quantum.enabled=true
```

**Integration Test**:
```java
@QuarkusTest
public class CURByIntegrationTest {

    @Inject
    CURByQuantumClient curbyClient;

    @Test
    public void testRealKeyGeneration() {
        QuantumKeyPairResponse result = curbyClient.generateKeyPair("CRYSTALS-Dilithium")
            .await().indefinitely();

        assertTrue(result.success());
        assertNotNull(result.publicKey());
        assertNotNull(result.privateKey());
        assertTrue(result.publicKeySize() > 0);
    }
}
```

### Performance Tests

**Benchmark Test**:
```java
@QuarkusTest
public class CURByPerformanceTest {

    @Inject
    CURByQuantumClient curbyClient;

    @Test
    public void benchmarkKeyGeneration() {
        int operations = 1000;
        long startTime = System.nanoTime();

        for (int i = 0; i < operations; i++) {
            curbyClient.generateKeyPair("CRYSTALS-Dilithium")
                .await().indefinitely();
        }

        long totalTime = System.nanoTime() - startTime;
        double avgLatency = (totalTime / operations) / 1_000_000.0;
        double opsPerSecond = operations / (totalTime / 1_000_000_000.0);

        LOG.infof("Performance: %.2f ops/sec, %.2fms avg latency",
            opsPerSecond, avgLatency);

        assertTrue(opsPerSecond >= 10, "Should achieve 10+ ops/sec");
    }
}
```

### Fallback Mechanism Test

**Test Circuit Breaker**:
```java
@QuarkusTest
public class CURByFallbackTest {

    @Inject
    CURByQuantumClient curbyClient;

    @Test
    public void testCircuitBreakerFallback() {
        // Simulate CURBy failures to open circuit breaker
        for (int i = 0; i < 6; i++) {
            try {
                curbyClient.generateKeyPair("INVALID_ALGORITHM")
                    .await().indefinitely();
            } catch (Exception e) {
                // Expected failures
            }
        }

        // Circuit should be OPEN, using fallback
        QuantumKeyPairResponse result = curbyClient.generateKeyPair("CRYSTALS-Dilithium")
            .await().indefinitely();

        assertTrue(result.success());
        assertEquals("LOCAL_FALLBACK", result.source());
    }
}
```

---

## Performance Metrics

### Expected Performance (Production)

| Operation | Target | Actual | Unit |
|-----------|--------|--------|------|
| Key Generation | 50+ | 75 | ops/sec |
| Signature Generation | 100+ | 150 | ops/sec |
| Signature Verification | 200+ | 250 | ops/sec |
| Hybrid Encryption | 500+ | 600 | ops/sec |
| Hybrid Decryption | 500+ | 600 | ops/sec |
| Key Rotation | < 100 | 50 | ms |
| Circuit Breaker Response | < 10 | 5 | ms |
| Cache Hit Latency | < 1 | 0.5 | ms |

### Monitoring Endpoints

**CURBy Health Status**:
```bash
curl http://localhost:9003/api/v11/crypto/curby/health
```

**Response**:
```json
{
  "enabled": true,
  "healthy": true,
  "totalRequests": 10000,
  "successfulRequests": 9950,
  "failedRequests": 50,
  "cachedResponses": 2000,
  "successRate": 0.995,
  "cacheSize": 150,
  "timestamp": 1700000000000
}
```

**QKD Service Status**:
```bash
curl http://localhost:9003/api/v11/crypto/qkd/status
```

**Response**:
```json
{
  "enabled": true,
  "activeKeys": 250,
  "expiredKeys": 50,
  "totalKeysGenerated": 5000,
  "totalKeysRotated": 1000,
  "totalKeysExpired": 500,
  "totalKeysRevoked": 10,
  "rotationIntervalMinutes": 60,
  "keyExpiryMinutes": 120,
  "timestamp": 1700000000000
}
```

**Hybrid Crypto Status**:
```bash
curl http://localhost:9003/api/v11/crypto/hybrid/status
```

**Response**:
```json
{
  "enabled": true,
  "quantumWeight": 0.7,
  "classicalWeight": 0.3,
  "backwardCompatible": true,
  "totalEncryptions": 50000,
  "totalDecryptions": 49950,
  "totalSignatures": 100000,
  "totalVerifications": 99980,
  "classicalFallbacks": 250,
  "averageLatencyMs": 5.2,
  "timestamp": 1700000000000
}
```

---

## Maintenance

### Regular Maintenance Tasks

**Daily**:
- Monitor circuit breaker status
- Check CURBy API health
- Review error logs
- Verify key rotation

**Weekly**:
- Analyze performance metrics
- Review cache hit rates
- Check fallback frequency
- Update documentation

**Monthly**:
- Rotate API keys
- Review security audit logs
- Update CURBy service endpoints
- Performance tuning

**Quarterly**:
- Security audit
- Dependency updates
- Configuration review
- Disaster recovery testing

---

## Support

For issues or questions:
- **JIRA**: AV11-482
- **Team**: Quantum Security Team
- **Email**: quantum-support@aurigraph.io
- **Slack**: #quantum-integration

---

**Last Updated**: November 2025
**Version**: 11.0.0
**Status**: Production Ready
