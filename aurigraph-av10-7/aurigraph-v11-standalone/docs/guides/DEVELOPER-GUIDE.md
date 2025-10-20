# Aurigraph V11 Developer Guide

Comprehensive guide for developers building applications on the Aurigraph V11 platform.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Development Environment](#development-environment)
- [Core Concepts](#core-concepts)
- [Building Applications](#building-applications)
- [Testing Best Practices](#testing-best-practices)
- [Performance Optimization](#performance-optimization)
- [Contributing](#contributing)

## Architecture Overview

### Technology Stack

```
┌─────────────────────────────────────────────┐
│         Aurigraph V11 Platform              │
├─────────────────────────────────────────────┤
│  Java 21 + Virtual Threads                  │
│  Quarkus 3.26.2 (Reactive Programming)      │
│  GraalVM Native Compilation                 │
├─────────────────────────────────────────────┤
│  HTTP/2 + gRPC + Protocol Buffers           │
│  TLS 1.3 Encryption                         │
├─────────────────────────────────────────────┤
│  HyperRAFT++ Consensus                      │
│  CRYSTALS-Kyber/Dilithium (NIST Level 5)   │
│  AI-Driven Optimization                     │
├─────────────────────────────────────────────┤
│  PostgreSQL + LevelDB                       │
│  Merkle Tree Registry                       │
└─────────────────────────────────────────────┘
```

### Key Components

1. **Transaction Service** (`TransactionService.java`) - Core transaction processing
2. **Consensus Service** (`HyperRAFTConsensusService.java`) - Distributed consensus
3. **Crypto Service** (`QuantumCryptoService.java`) - Quantum-resistant cryptography
4. **AI Optimization** (`AIOptimizationService.java`) - ML-based consensus tuning
5. **Bridge Service** (`CrossChainBridgeService.java`) - Cross-chain interoperability
6. **RWA Registry** (`RWATRegistryService.java`) - Real-world asset tokenization

### Project Structure

```
src/
├── main/
│   ├── java/io/aurigraph/v11/
│   │   ├── AurigraphResource.java          # Main REST API
│   │   ├── TransactionService.java         # Transaction processing
│   │   ├── api/                            # REST API resources
│   │   │   ├── BlockchainApiResource.java
│   │   │   ├── ConsensusApiResource.java
│   │   │   ├── CryptoApiResource.java
│   │   │   └── AIApiResource.java
│   │   ├── consensus/                      # HyperRAFT++ implementation
│   │   │   └── HyperRAFTConsensusService.java
│   │   ├── crypto/                         # Quantum cryptography
│   │   │   ├── QuantumCryptoService.java
│   │   │   └── DilithiumSignatureService.java
│   │   ├── ai/                            # AI optimization
│   │   │   ├── AIOptimizationService.java
│   │   │   └── MLMetricsService.java
│   │   ├── bridge/                        # Cross-chain bridge
│   │   │   └── CrossChainBridgeService.java
│   │   ├── registry/                      # Asset registry
│   │   │   └── RWATRegistryService.java
│   │   └── blockchain/                    # Blockchain core
│   │       └── NetworkStatsService.java
│   ├── proto/                             # gRPC Protocol Buffers
│   │   └── aurigraph-v11.proto
│   └── resources/
│       └── application.properties         # Configuration
└── test/
    └── java/io/aurigraph/v11/            # Test suite
```

## Development Environment

### Setup

1. **Prerequisites**:
   - Java 21+ (OpenJDK or GraalVM)
   - Maven 3.8+ (or use `./mvnw` wrapper)
   - Docker (optional, for native builds)
   - IDE: IntelliJ IDEA, VSCode, or Eclipse

2. **Clone and Build**:
   ```bash
   git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git
   cd Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone
   ./mvnw clean compile
   ```

3. **IDE Configuration**:

   **IntelliJ IDEA**:
   - Open as Maven project
   - Enable annotation processing
   - Configure Java SDK 21
   - Install Quarkus Tools plugin

   **VSCode**:
   - Install "Extension Pack for Java"
   - Install "Quarkus" extension
   - Configure Java 21 in settings

### Development Workflow

#### Hot Reload Development

```bash
# Start dev mode with live reload
./mvnw quarkus:dev

# Code changes are automatically recompiled
# Server restarts in milliseconds
```

**Features in Dev Mode**:
- Automatic code reload
- Dev UI: `http://localhost:9003/q/dev`
- Swagger UI: `http://localhost:9003/q/swagger-ui`
- Continuous testing (optional): `-Dquarkus.test.continuous-testing=enabled`

#### Testing

```bash
# Run all tests
./mvnw test

# Run specific test
./mvnw test -Dtest=AurigraphResourceTest

# Run with coverage
./mvnw test jacoco:report
# View: target/site/jacoco/index.html

# Integration tests
./mvnw test -Dtest=*IT
```

#### Building

```bash
# Standard JAR build
./mvnw clean package

# Native executable (fast dev build)
./mvnw package -Pnative-fast

# Native executable (production optimized)
./mvnw package -Pnative
```

## Core Concepts

### 1. Reactive Programming

Aurigraph V11 uses reactive programming with Mutiny for non-blocking operations.

#### Example: Simple Reactive Endpoint

```java
@Path("/api/v11/example")
@ApplicationScoped
public class ExampleResource {

    @GET
    @Path("/hello")
    @Produces(MediaType.APPLICATION_JSON)
    public Uni<HelloResponse> hello() {
        return Uni.createFrom().item(() -> {
            return new HelloResponse("Hello from Aurigraph V11!");
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    public record HelloResponse(String message) {}
}
```

#### Example: Reactive Transaction Processing

```java
@Inject
TransactionService transactionService;

@POST
@Path("/process")
public Uni<TransactionResponse> processTransaction(TransactionRequest request) {
    return Uni.createFrom().item(() -> {
        String txId = transactionService.processTransaction(
            request.transactionId(),
            request.amount()
        );
        return new TransactionResponse(txId, "PROCESSED");
    }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
}
```

### 2. Virtual Threads (Java 21)

Aurigraph leverages Java 21 Virtual Threads for massive concurrency without OS thread limits.

```java
// Virtual threads are automatically used in reactive contexts
return Uni.createFrom().item(() -> {
    // This runs on a virtual thread
    String result = heavyComputation();
    return result;
}).runSubscriptionOn(r -> Thread.startVirtualThread(r));
```

**Benefits**:
- Millions of concurrent operations
- Low memory overhead (< 1KB per thread)
- No thread pool tuning needed

### 3. Transaction Processing

#### Simple Transaction

```java
@Inject
TransactionService txService;

public String processSimpleTransaction(String txId, double amount) {
    return txService.processTransaction(txId, amount);
}
```

#### Batch Processing

```java
public Uni<List<String>> processBatch(List<TransactionRequest> requests) {
    return txService.batchProcessTransactions(requests)
        .collect().asList()
        .await().atMost(Duration.ofSeconds(30));
}
```

#### Ultra-High-Throughput Processing

```java
public CompletableFuture<BatchResult> processUltraHighThroughput(
    List<TransactionRequest> requests
) {
    return txService.processUltraHighThroughputBatch(requests);
}
```

### 4. Consensus Integration

#### Propose Entry to Consensus

```java
@Inject
HyperRAFTConsensusService consensusService;

public Uni<ProposalResult> proposeEntry(String data) {
    ConsensusEntry entry = new ConsensusEntry(
        "entry-" + UUID.randomUUID(),
        data,
        Instant.now()
    );
    return consensusService.propose(entry);
}
```

#### Get Consensus Status

```java
public Uni<ConsensusStats> getConsensusStats() {
    return consensusService.getStats();
}
```

### 5. Quantum Cryptography

#### Generate Quantum-Resistant Keys

```java
@Inject
QuantumCryptoService cryptoService;

public Uni<KeyGenerationResult> generateKeys() {
    KeyGenerationRequest request = new KeyGenerationRequest(
        "my-key-" + UUID.randomUUID(),
        "KYBER",  // or "DILITHIUM"
        5         // NIST Level 5
    );
    return cryptoService.generateKeyPair(request);
}
```

#### Encrypt Data

```java
public Uni<EncryptionResult> encryptSensitiveData(
    String keyId,
    byte[] data
) {
    EncryptionRequest request = new EncryptionRequest(keyId, data);
    return cryptoService.encryptData(request);
}
```

#### Sign Data

```java
public Uni<SignatureResult> signTransaction(
    String keyId,
    byte[] txData
) {
    SignatureRequest request = new SignatureRequest(keyId, txData);
    return cryptoService.signData(request);
}
```

### 6. AI/ML Integration

#### Get AI Predictions

```java
@Inject
AIOptimizationService aiService;

public AIOptimizationStats getAIStats() {
    return aiService.getOptimizationStats();
}

public NetworkPrediction getNetworkPrediction() {
    return aiService.predictNetworkLoad();
}
```

### 7. Configuration Management

#### Reading Configuration

```java
@ConfigProperty(name = "consensus.target.tps", defaultValue = "2000000")
long targetTPS;

@ConfigProperty(name = "ai.optimization.enabled", defaultValue = "true")
boolean aiOptimizationEnabled;
```

#### Dynamic Configuration

```java
@Inject
ConfigProvider configProvider;

public long getTargetTPS() {
    return configProvider.getConfig()
        .getOptionalValue("consensus.target.tps", Long.class)
        .orElse(2000000L);
}
```

## Building Applications

### Example 1: Custom Transaction Processor

```java
package io.aurigraph.v11.examples;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.smallrye.mutiny.Uni;
import io.aurigraph.v11.TransactionService;

@ApplicationScoped
public class CustomTransactionProcessor {

    @Inject
    TransactionService txService;

    public Uni<ProcessingResult> processWithValidation(
        String txId,
        double amount
    ) {
        return Uni.createFrom().item(() -> {
            // Custom validation logic
            if (amount < 0) {
                throw new IllegalArgumentException("Amount must be positive");
            }

            if (amount > 1_000_000) {
                throw new IllegalArgumentException("Amount exceeds limit");
            }

            // Process transaction
            String result = txService.processTransaction(txId, amount);

            // Return result with metadata
            return new ProcessingResult(
                result,
                "SUCCESS",
                amount,
                System.currentTimeMillis()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    public record ProcessingResult(
        String transactionId,
        String status,
        double amount,
        long timestamp
    ) {}
}
```

### Example 2: Custom REST API Endpoint

```java
package io.aurigraph.v11.examples;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import io.smallrye.mutiny.Uni;
import org.eclipse.microprofile.openapi.annotations.Operation;

@Path("/api/v11/custom")
@ApplicationScoped
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CustomApiResource {

    @Inject
    CustomTransactionProcessor processor;

    @POST
    @Path("/transactions/validated")
    @Operation(summary = "Process validated transaction")
    public Uni<Response> processValidatedTransaction(
        TransactionRequest request
    ) {
        return processor.processWithValidation(
            request.transactionId(),
            request.amount()
        )
        .map(result -> Response.ok(result).build())
        .onFailure().recoverWithItem(error ->
            Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("error", error.getMessage()))
                .build()
        );
    }

    public record TransactionRequest(
        String transactionId,
        double amount
    ) {}
}
```

### Example 3: Smart Contract Integration

```java
package io.aurigraph.v11.examples;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import io.smallrye.mutiny.Uni;

@ApplicationScoped
public class SmartContractExecutor {

    @Inject
    TransactionService txService;

    @Inject
    QuantumCryptoService cryptoService;

    public Uni<ContractResult> executeContract(
        String contractId,
        Map<String, Object> parameters
    ) {
        return Uni.createFrom().item(() -> {
            // 1. Validate contract parameters
            validateParameters(parameters);

            // 2. Sign contract execution
            byte[] contractData = serializeContract(contractId, parameters);
            SignatureResult signature = cryptoService.signData(
                new SignatureRequest("contract-key", contractData)
            ).await().indefinitely();

            // 3. Process contract transaction
            String txId = "contract-" + contractId + "-" + System.nanoTime();
            double amount = (Double) parameters.get("amount");
            String result = txService.processTransaction(txId, amount);

            // 4. Return execution result
            return new ContractResult(
                contractId,
                result,
                signature.signature(),
                "EXECUTED",
                System.currentTimeMillis()
            );
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    private void validateParameters(Map<String, Object> params) {
        if (!params.containsKey("amount")) {
            throw new IllegalArgumentException("Missing required parameter: amount");
        }
    }

    private byte[] serializeContract(String id, Map<String, Object> params) {
        // Implement contract serialization
        return (id + params.toString()).getBytes();
    }

    public record ContractResult(
        String contractId,
        String transactionId,
        byte[] signature,
        String status,
        long timestamp
    ) {}
}
```

## Testing Best Practices

### Unit Testing

```java
package io.aurigraph.v11.examples;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class CustomTransactionProcessorTest {

    @Inject
    CustomTransactionProcessor processor;

    @Test
    public void testValidTransaction() {
        var result = processor.processWithValidation("tx-test-001", 100.0)
            .await().indefinitely();

        assertEquals("SUCCESS", result.status());
        assertEquals(100.0, result.amount());
        assertNotNull(result.transactionId());
    }

    @Test
    public void testInvalidAmount() {
        assertThrows(IllegalArgumentException.class, () -> {
            processor.processWithValidation("tx-test-002", -50.0)
                .await().indefinitely();
        });
    }

    @Test
    public void testExceedsLimit() {
        assertThrows(IllegalArgumentException.class, () -> {
            processor.processWithValidation("tx-test-003", 2_000_000.0)
                .await().indefinitely();
        });
    }
}
```

### Integration Testing

```java
package io.aurigraph.v11.examples;

import io.quarkus.test.junit.QuarkusIntegrationTest;
import io.restassured.RestAssured;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusIntegrationTest
public class CustomApiResourceIT {

    @Test
    public void testValidatedTransactionEndpoint() {
        given()
            .contentType("application/json")
            .body("""
                {
                    "transactionId": "tx-integration-001",
                    "amount": 250.00
                }
                """)
        .when()
            .post("/api/v11/custom/transactions/validated")
        .then()
            .statusCode(200)
            .body("status", equalTo("SUCCESS"))
            .body("amount", equalTo(250.0f));
    }
}
```

### Performance Testing

```java
@QuarkusTest
public class PerformanceTest {

    @Test
    public void testHighThroughput() {
        long startTime = System.nanoTime();
        int iterations = 100_000;

        for (int i = 0; i < iterations; i++) {
            String txId = "perf-test-" + i;
            processor.processWithValidation(txId, 100.0)
                .await().indefinitely();
        }

        long endTime = System.nanoTime();
        double durationMs = (endTime - startTime) / 1_000_000.0;
        double tps = iterations / (durationMs / 1000.0);

        System.out.printf("Processed %d transactions in %.2f ms (%.0f TPS)%n",
            iterations, durationMs, tps);

        assertTrue(tps > 500_000, "TPS should exceed 500K");
    }
}
```

## Performance Optimization

### 1. Batch Operations

Always use batch operations for bulk processing:

```java
// Bad: Individual processing
for (TransactionRequest req : requests) {
    processTransaction(req);
}

// Good: Batch processing
txService.batchProcessTransactions(requests)
    .collect().asList()
    .await().indefinitely();
```

### 2. Virtual Thread Optimization

```java
// Run CPU-intensive operations on virtual threads
return Uni.createFrom().item(() -> {
    // Heavy computation here
    return computeResult();
}).runSubscriptionOn(r -> Thread.startVirtualThread(r));
```

### 3. Caching

```java
import io.quarkus.cache.CacheResult;

@CacheResult(cacheName = "blockchain-stats")
public BlockchainStats getStats() {
    // Expensive computation cached
    return calculateStats();
}
```

### 4. Database Optimization

```java
// Use batch inserts
@Transactional
public void insertBatch(List<Transaction> transactions) {
    entityManager.createQuery("""
        INSERT INTO transactions (id, amount, timestamp)
        VALUES (:id, :amount, :timestamp)
    """)
    .executeUpdate();
}
```

## Contributing

### Code Style

- Follow Java naming conventions
- Use records for DTOs
- Prefer immutability
- Write comprehensive JavaDoc
- Keep methods short (< 50 lines)

### Pull Request Process

1. Create feature branch: `feature/AV11-XXX-description`
2. Write tests (95% coverage required)
3. Update documentation
4. Submit PR with description
5. Address review comments
6. Merge after approval

### Testing Requirements

- Unit tests: 95% line coverage
- Integration tests: Critical paths
- Performance tests: Validate TPS targets
- Security tests: Crypto and auth

## Resources

- **API Documentation**: [../api/README.md](../api/README.md)
- **Operations Guide**: [../operations/OPERATIONS-GUIDE.md](../operations/OPERATIONS-GUIDE.md)
- **Quarkus Documentation**: https://quarkus.io/guides/
- **GitHub Repository**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT

---

**Happy Coding!** Build the future of blockchain with Aurigraph V11.
