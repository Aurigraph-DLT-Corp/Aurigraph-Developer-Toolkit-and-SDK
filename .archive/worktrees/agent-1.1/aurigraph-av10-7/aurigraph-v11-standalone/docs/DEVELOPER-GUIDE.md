# Aurigraph V11 Developer Guide

**Version**: 11.0.0
**Last Updated**: October 20, 2025
**Target Audience**: Platform Developers, Contributors, DevOps Engineers

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Development Environment](#development-environment)
3. [Code Structure](#code-structure)
4. [Core Components](#core-components)
5. [Development Workflow](#development-workflow)
6. [Testing Strategies](#testing-strategies)
7. [Performance Optimization](#performance-optimization)
8. [Security Best Practices](#security-best-practices)
9. [Deployment](#deployment)
10. [Contributing](#contributing)

---

## Architecture Overview

### High-Level Architecture

Aurigraph V11 is built on a modern, reactive Java stack:

```
┌─────────────────────────────────────────────────────┐
│                 Enterprise Portal                    │
│              (React + TypeScript + MUI)              │
└───────────────────┬─────────────────────────────────┘
                    │ HTTPS/REST
                    ▼
┌─────────────────────────────────────────────────────┐
│                   NGINX Proxy                        │
│      (SSL/TLS, Rate Limiting, Load Balancing)       │
└───────────────────┬─────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│          Aurigraph V11 Platform (Port 9003)         │
│                Java 21 + Quarkus 3.26.2             │
├─────────────────────────────────────────────────────┤
│  REST API Layer (JAX-RS + Reactive Uni/Multi)      │
├─────────────────────────────────────────────────────┤
│  Service Layer                                       │
│  ├─ TransactionService                              │
│  ├─ HyperRAFTConsensusService                       │
│  ├─ QuantumCryptoService                            │
│  ├─ CrossChainBridgeService                         │
│  ├─ AIOptimizationService                           │
│  └─ NetworkStatsService                             │
├─────────────────────────────────────────────────────┤
│  Core Infrastructure                                 │
│  ├─ Virtual Threads (Java 21)                       │
│  ├─ Reactive Streams (Mutiny)                       │
│  ├─ Rate Limiting                                    │
│  └─ Health Monitoring                                │
└─────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Runtime** | Java (OpenJDK) | 21+ |
| **Framework** | Quarkus | 3.26.2 |
| **Reactive** | Mutiny | Built-in |
| **REST** | JAX-RS (RESTEasy) | Jakarta EE 10 |
| **Native** | GraalVM | Latest |
| **Testing** | JUnit 5 + Mockito | 5.10+ |
| **Build** | Maven | 3.9+ |
| **AI/ML** | DeepLearning4J | 1.0.0-M2 |
| **Crypto** | BouncyCastle PQC | 1.77 |

### Design Principles

1. **Reactive-First**: Use `Uni<T>` and `Multi<T>` for non-blocking operations
2. **Virtual Threads**: Leverage Java 21 virtual threads for concurrency
3. **Immutability**: Prefer immutable records and final fields
4. **Fail-Fast**: Validate early, throw meaningful exceptions
5. **Test-Driven**: Write tests before implementation
6. **Performance**: Target 2M+ TPS with <100ms finality
7. **Security**: Quantum-resistant cryptography by default

---

## Development Environment

### IDE Setup

#### IntelliJ IDEA (Recommended)

1. **Install Quarkus Plugin**:
   - File → Settings → Plugins
   - Search "Quarkus Tools"
   - Install and restart

2. **Configure Java 21**:
   - File → Project Structure → Project SDK
   - Add JDK 21 if not present

3. **Enable Hot Reload**:
   - Run → Edit Configurations
   - Add "Quarkus" configuration
   - Command: `quarkus:dev`

#### VS Code

1. **Install Extensions**:
   ```bash
   code --install-extension redhat.java
   code --install-extension vscjava.vscode-java-pack
   code --install-extension redhat.vscode-quarkus
   ```

2. **Configure `launch.json`**:
   ```json
   {
     "type": "java",
     "request": "launch",
     "mainClass": "io.quarkus.runner.GeneratedMain",
     "args": "quarkus:dev"
   }
   ```

### Environment Variables

Create `.env` file in project root:

```bash
# Java Configuration
JAVA_HOME=/opt/homebrew/opt/openjdk@21
JAVA_OPTS="-Xmx4g -XX:+UseG1GC"

# Quarkus Configuration
QUARKUS_HTTP_PORT=9003
QUARKUS_PROFILE=dev

# Performance Tuning
AURIGRAPH_TARGET_TPS=2000000
CONSENSUS_BATCH_SIZE=10000
AI_OPTIMIZATION_ENABLED=true

# Security (DO NOT commit production values)
JWT_SECRET=dev-secret-change-in-production
ADMIN_PASSWORD=dev-admin-password
```

**Load environment**:
```bash
export $(cat .env | xargs)
```

---

## Code Structure

### Project Layout

```
aurigraph-v11-standalone/
├── src/
│   ├── main/
│   │   ├── java/io/aurigraph/v11/
│   │   │   ├── AurigraphResource.java          # Main REST API
│   │   │   ├── TransactionService.java         # Transaction processing
│   │   │   ├── api/                            # API resources
│   │   │   │   ├── BlockchainApiResource.java
│   │   │   │   ├── ConsensusApiResource.java
│   │   │   │   ├── AIApiResource.java
│   │   │   │   └── ...
│   │   │   ├── consensus/                      # HyperRAFT++ consensus
│   │   │   │   ├── HyperRAFTConsensusService.java
│   │   │   │   └── ConsensusModels.java
│   │   │   ├── crypto/                         # Quantum cryptography
│   │   │   │   ├── QuantumCryptoService.java
│   │   │   │   └── DilithiumSignatureService.java
│   │   │   ├── ai/                             # AI/ML optimization
│   │   │   │   ├── AIOptimizationService.java
│   │   │   │   └── MLMetricsService.java
│   │   │   ├── bridge/                         # Cross-chain bridge
│   │   │   │   ├── CrossChainBridgeService.java
│   │   │   │   └── adapters/
│   │   │   ├── blockchain/                     # Blockchain core
│   │   │   │   └── NetworkStatsService.java
│   │   │   ├── security/                       # Security services
│   │   │   ├── ratelimit/                      # Rate limiting
│   │   │   └── contracts/                      # Smart contracts
│   │   ├── resources/
│   │   │   ├── application.properties          # Quarkus config
│   │   │   └── META-INF/
│   │   └── proto/                              # gRPC definitions (future)
│   └── test/
│       └── java/io/aurigraph/v11/
│           ├── AurigraphResourceTest.java
│           ├── TransactionServiceTest.java
│           └── ...
├── docs/                                       # Documentation
│   ├── API-DOCUMENTATION.md
│   ├── GETTING-STARTED.md
│   ├── DEVELOPER-GUIDE.md
│   ├── openapi.yaml
│   └── adr/                                    # Architecture decisions
├── enterprise-portal/                          # React frontend
├── pom.xml                                     # Maven configuration
└── README.md
```

### Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| **Classes** | PascalCase | `TransactionService` |
| **Interfaces** | PascalCase | `ConsensusAlgorithm` |
| **Methods** | camelCase | `processTransaction()` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_BATCH_SIZE` |
| **Packages** | lowercase | `io.aurigraph.v11.consensus` |
| **Records** | PascalCase | `PerformanceStats` |
| **REST Paths** | kebab-case | `/api/v11/blockchain-stats` |

---

## Core Components

### 1. REST API Layer

#### Creating a New REST Resource

```java
package io.aurigraph.v11.api;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import io.smallrye.mutiny.Uni;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/api/v11/example")
@ApplicationScoped
@Tag(name = "Example API", description = "Example operations")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ExampleApiResource {

    private static final Logger LOG = Logger.getLogger(ExampleApiResource.class);

    @Inject
    ExampleService exampleService;

    @GET
    @Path("/data")
    @Operation(summary = "Get data", description = "Retrieve example data")
    public Uni<ExampleResponse> getData() {
        return Uni.createFrom().item(() -> {
            LOG.info("Fetching example data");
            return exampleService.getData();
        }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    }

    public record ExampleResponse(String data, long timestamp) {}
}
```

**Key Points**:
- Use `@ApplicationScoped` for CDI
- Use `Uni<T>` for async operations
- Use `Thread.startVirtualThread(r)` for virtual threads
- Add OpenAPI annotations for documentation

### 2. Service Layer

#### Creating a Service

```java
package io.aurigraph.v11.service;

import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

@ApplicationScoped
public class ExampleService {

    private static final Logger LOG = Logger.getLogger(ExampleService.class);

    public ExampleData getData() {
        LOG.debug("Processing data request");

        // Business logic here
        return new ExampleData("result", System.currentTimeMillis());
    }

    public record ExampleData(String result, long timestamp) {}
}
```

### 3. Reactive Programming with Mutiny

#### Using Uni (Single Async Result)

```java
// Simple async operation
Uni<String> result = Uni.createFrom().item(() -> {
    return "Result";
});

// With failure handling
Uni<String> safeResult = result
    .onFailure().recoverWithItem(throwable -> {
        LOG.error("Operation failed", throwable);
        return "Default value";
    });

// Chain operations
Uni<ProcessedData> processed = fetchData()
    .onItem().transform(data -> processData(data))
    .onItem().invoke(result -> LOG.info("Processed: " + result));
```

#### Using Multi (Stream of Results)

```java
// Process stream of transactions
Multi<TransactionResult> results = Multi.createFrom().items(transactions.stream())
    .onItem().transformToUniAndConcatenate(tx -> processTransaction(tx))
    .onFailure().invoke(error -> LOG.error("Stream error", error));

// Collect results
List<TransactionResult> allResults = results
    .collect().asList()
    .await().indefinitely();
```

### 4. Virtual Threads Pattern

```java
// Spawn virtual thread for CPU-intensive work
Uni<Result> asyncWork = Uni.createFrom().item(() -> {
    // CPU-intensive computation
    return computeExpensiveResult();
}).runSubscriptionOn(r -> Thread.startVirtualThread(r));

// Multiple parallel virtual threads
List<Uni<Result>> tasks = new ArrayList<>();
for (int i = 0; i < 100; i++) {
    final int taskId = i;
    Uni<Result> task = Uni.createFrom().item(() -> {
        return processTask(taskId);
    }).runSubscriptionOn(r -> Thread.startVirtualThread(r));
    tasks.add(task);
}

// Wait for all to complete
Uni.join().all(tasks).andFailFast()
    .await().atMost(Duration.ofMinutes(5));
```

---

## Development Workflow

### 1. Feature Development

#### Step-by-Step Process

```bash
# 1. Create feature branch
git checkout -b feature/new-api-endpoint

# 2. Start development mode
./mvnw quarkus:dev

# 3. Develop feature (hot reload active)
# Edit files in src/main/java/...

# 4. Write tests
# Edit files in src/test/java/...

# 5. Run tests
./mvnw test

# 6. Commit changes
git add .
git commit -m "feat: Add new API endpoint for XYZ"

# 7. Push and create PR
git push origin feature/new-api-endpoint
```

#### Commit Message Format

Follow conventional commits:

```
type(scope): subject

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style/formatting
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance tasks

**Example**:
```
feat(api): Add blockchain statistics endpoint

Implement comprehensive blockchain statistics API endpoint
that returns current height, TPS, validator count, and
network health metrics.

Closes #123
```

### 2. Hot Reload Development

With `./mvnw quarkus:dev` running:

1. **Edit Java File**: Changes auto-compile
2. **Refresh Browser/API**: See changes immediately
3. **Add Dependency**: Auto-reloaded on save
4. **Configuration Change**: Auto-reloaded

**Disable hot reload for a file**:
```java
@ApplicationScoped
@io.quarkus.arc.Unremovable  // Prevents removal during hot reload
public class MyService {
    // ...
}
```

### 3. Debugging

#### IntelliJ IDEA

1. Set breakpoints in code
2. Run → Debug "Quarkus"
3. Debug port: 5005 (default)

#### VS Code

Add to `launch.json`:
```json
{
  "type": "java",
  "request": "attach",
  "name": "Debug Quarkus",
  "hostName": "localhost",
  "port": 5005
}
```

#### Remote Debugging

```bash
./mvnw quarkus:dev -Ddebug=5005
```

---

## Testing Strategies

### Unit Testing

#### Service Unit Test

```java
package io.aurigraph.v11;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;
import jakarta.inject.Inject;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class TransactionServiceTest {

    @Inject
    TransactionService transactionService;

    @Test
    public void testProcessTransaction() {
        String txId = "tx_test_123";
        double amount = 100.50;

        String result = transactionService.processTransaction(txId, amount);

        assertNotNull(result);
        assertEquals(txId, result);
    }

    @Test
    public void testBatchProcessing() {
        List<TransactionService.TransactionRequest> requests = List.of(
            new TransactionService.TransactionRequest("tx1", 100.0),
            new TransactionService.TransactionRequest("tx2", 200.0)
        );

        var results = transactionService.batchProcessTransactions(requests)
            .collect().asList()
            .await().atMost(Duration.ofSeconds(10));

        assertEquals(2, results.size());
    }
}
```

### Integration Testing

#### REST API Integration Test

```java
package io.aurigraph.v11;

import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;

@QuarkusTest
public class AurigraphResourceTest {

    @Test
    public void testHealthEndpoint() {
        given()
            .when().get("/api/v11/health")
            .then()
            .statusCode(200)
            .contentType(ContentType.JSON)
            .body("status", is("HEALTHY"))
            .body("platform", is("Java/Quarkus/GraalVM"));
    }

    @Test
    public void testProcessTransaction() {
        given()
            .contentType(ContentType.JSON)
            .body("{\"transactionId\": \"tx_test\", \"amount\": 100.50}")
        .when()
            .post("/api/v11/blockchain/transactions")
        .then()
            .statusCode(201)
            .body("status", is("PROCESSED"))
            .body("transactionId", is("tx_test"));
    }
}
```

### Performance Testing

#### Throughput Test

```java
@Test
public void testHighThroughput() {
    long startTime = System.nanoTime();
    int iterations = 100_000;

    for (int i = 0; i < iterations; i++) {
        transactionService.processTransaction("tx_" + i, i * 1.0);
    }

    long endTime = System.nanoTime();
    double durationMs = (endTime - startTime) / 1_000_000.0;
    double tps = iterations / (durationMs / 1000.0);

    System.out.printf("Processed %d transactions in %.2fms (%.0f TPS)%n",
                      iterations, durationMs, tps);

    assertTrue(tps > 1_000_000, "TPS should exceed 1M");
}
```

### Test Coverage

**Run with coverage**:
```bash
./mvnw clean test jacoco:report
```

**View report**:
```bash
open target/site/jacoco/index.html
```

**Coverage Requirements**:
- **Overall**: 95% line coverage
- **Critical modules** (crypto, consensus): 98% coverage
- **API resources**: 90% coverage

---

## Performance Optimization

### 1. Virtual Threads

```java
// Good: Use virtual threads for I/O-bound work
Uni<Result> asyncIO = Uni.createFrom().item(() -> {
    return performDatabaseQuery();
}).runSubscriptionOn(r -> Thread.startVirtualThread(r));

// Good: Spawn many virtual threads
for (int i = 0; i < 10_000; i++) {
    Thread.startVirtualThread(() -> processTask());
}
```

### 2. Batch Processing

```java
// Good: Process in batches
List<Transaction> batch = new ArrayList<>();
for (Transaction tx : transactions) {
    batch.add(tx);
    if (batch.size() >= BATCH_SIZE) {
        processBatch(batch);
        batch.clear();
    }
}
if (!batch.isEmpty()) {
    processBatch(batch);
}
```

### 3. Parallel Streams

```java
// Good: Parallel processing
results = transactions.parallelStream()
    .map(tx -> processTransaction(tx))
    .collect(Collectors.toList());
```

### 4. Caching

```java
@ApplicationScoped
public class CachedService {

    private final Cache<String, Data> cache = Caffeine.newBuilder()
        .maximumSize(10_000)
        .expireAfterWrite(Duration.ofMinutes(10))
        .build();

    public Data getData(String key) {
        return cache.get(key, k -> loadData(k));
    }
}
```

### 5. Profiling

**JFR (Java Flight Recorder)**:
```bash
java -XX:StartFlightRecording=filename=recording.jfr \
     -jar target/quarkus-app/quarkus-run.jar
```

**Analyze**:
```bash
jmc recording.jfr  # Java Mission Control
```

---

## Security Best Practices

### 1. Input Validation

```java
@POST
@Path("/process")
public Uni<Response> process(TransactionRequest request) {
    // Validate input
    if (request.transactionId() == null || request.transactionId().isEmpty()) {
        return Uni.createFrom().item(
            Response.status(400)
                .entity(Map.of("error", "Transaction ID required"))
                .build()
        );
    }

    // Sanitize input
    String sanitizedId = request.transactionId()
        .replaceAll("[^a-zA-Z0-9_-]", "");

    // Process...
}
```

### 2. Authentication

```java
@GET
@Path("/secure")
@RolesAllowed("admin")
public Response secureEndpoint() {
    // Only accessible to admin role
    return Response.ok("Secure data").build();
}
```

### 3. Rate Limiting

```java
@GET
@Path("/limited")
@RateLimited(requestsPerMinute = 60)
public Response limitedEndpoint() {
    return Response.ok("Rate limited data").build();
}
```

### 4. Secrets Management

**Never hardcode secrets**:
```java
// Bad
String secret = "hardcoded-secret";

// Good
@ConfigProperty(name = "app.secret")
String secret;
```

**Use environment variables**:
```properties
# application.properties
app.secret=${APP_SECRET}
```

---

## Deployment

### Development Deployment

```bash
./mvnw quarkus:dev
```

### Production JAR Deployment

```bash
# Build
./mvnw clean package

# Run
java -jar target/quarkus-app/quarkus-run.jar
```

### Native Deployment

```bash
# Build native
./mvnw package -Pnative

# Run native
./target/aurigraph-v11-standalone-11.0.0-runner
```

### Docker Deployment

```dockerfile
FROM registry.access.redhat.com/ubi8/openjdk-21:1.18

ENV LANGUAGE='en_US:en'

COPY --chown=185 target/quarkus-app /deployments/

EXPOSE 9003
USER 185
ENV JAVA_OPTS="-Dquarkus.http.host=0.0.0.0 -Djava.util.logging.manager=org.jboss.logmanager.LogManager"

ENTRYPOINT [ "java", "-jar", "/deployments/quarkus-run.jar" ]
```

**Build & Run**:
```bash
docker build -t aurigraph-v11 .
docker run -p 9003:9003 aurigraph-v11
```

---

## Contributing

### Pull Request Process

1. **Fork repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: Follow conventional commits
4. **Write tests**: Maintain 95% coverage
5. **Update docs**: Add/update relevant documentation
6. **Push branch**: `git push origin feature/amazing-feature`
7. **Open Pull Request**: Provide clear description

### Code Review Checklist

- [ ] Tests pass locally
- [ ] Code coverage ≥95%
- [ ] Documentation updated
- [ ] No hardcoded secrets
- [ ] Performance impact considered
- [ ] Security implications reviewed
- [ ] OpenAPI annotations added (for APIs)

---

## Resources

- **Quarkus Guides**: https://quarkus.io/guides/
- **Java 21 Features**: https://openjdk.org/projects/jdk/21/
- **Mutiny Documentation**: https://smallrye.io/smallrye-mutiny/
- **Architecture Decision Records**: `docs/adr/`

---

**Last Updated**: October 20, 2025
**Version**: 11.0.0
**Guide Version**: 1.0.0
