# Java SDK

Official Java SDK for Aurigraph DLT V12. Zero external HTTP dependencies — uses `java.net.http.HttpClient` (Java 11+) with Jackson for JSON.

**Current Version**: `1.2.0`
**Minimum Java**: 21 LTS (tested on 21, 25)
**Dependencies**: Jackson 2.16+, SLF4J 2.x

## Install

### Maven

```xml
<dependency>
    <groupId>io.aurigraph.dlt</groupId>
    <artifactId>aurigraph-sdk</artifactId>
    <version>1.2.0</version>
</dependency>
```

### Gradle

```kotlin
dependencies {
    implementation("io.aurigraph.dlt:aurigraph-sdk:1.2.0")
}
```

> Note: Maven Central publishing begins with v2.0. For v1.x, build from source or use the included reference client.

## Quickstart

```java
import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.HealthResponse;
import io.aurigraph.dlt.sdk.handshake.HelloResponse;

public class Example {
    public static void main(String[] args) {
        AurigraphClient client = AurigraphClient.builder()
            .baseUrl("https://dlt.aurigraph.io")
            .appId(System.getenv("AURIGRAPH_APP_ID"))
            .apiKey(System.getenv("AURIGRAPH_API_KEY"))
            .build();

        // Health check (public)
        HealthResponse health = client.health();
        System.out.println("Platform: " + health.status());

        // Handshake (auth required)
        HelloResponse hello = client.handshake().hello();
        System.out.println("Tier: " + hello.partnerProfile().tier());

        // Query assets
        Map<String, Object> gold = client.assets().listByUseCase("UC_GOLD");
        System.out.println("Gold assets: " + gold.get("filtered"));
    }
}
```

## Builder Pattern

All configuration is immutable via the builder:

```java
AurigraphClient client = AurigraphClient.builder()
    .baseUrl("https://dlt.aurigraph.io")
    .appId("bc2ce4fa...")
    .apiKey("aG8VN7aV...")
    .timeout(Duration.ofSeconds(30))
    .maxRetries(3)
    .enableAutoHeartbeat(true)        // default true
    .enableQueue(true)                 // offline queue
    .build();
```

## Offline Queue

For resilience against network partitions, enable the offline queue. Requests queued during outages replay when connectivity returns:

```java
AurigraphClient client = AurigraphClient.builder()
    .baseUrl("https://dlt.aurigraph.io")
    .apiKey(apiKey)
    .enableQueue(true)                 // enable
    .autoIdempotency(true)            // auto-generate idempotency keys
    .build();

// Fire-and-forget — will queue if offline, replay when online
client.dmrv().recordEventAsync(event);
```

Queue persists to `~/.aurigraph/queue.dat` between JVM restarts.

## Handshake Automation

The SDK maintains a session via auto-heartbeat. Disable if you prefer manual control:

```java
// Manual heartbeat management
AurigraphClient client = AurigraphClient.builder()
    .enableAutoHeartbeat(false)
    .build();

// Call heartbeat yourself every 30s
scheduler.scheduleAtFixedRate(
    () -> client.handshake().heartbeat(),
    0, 30, TimeUnit.SECONDS
);
```

## Namespaces

All 13 namespaces are accessed as client methods:

```java
client.nodes()        // NodesApi
client.registries()   // RegistriesApi
client.channels()     // ChannelsApi
client.transactions() // TransactionsApi
client.dmrv()         // DmrvApi
client.contracts()    // ContractsApi
client.handshake()    // SdkHandshakeApi
client.assets()       // AssetsApi (asset-agnostic)
client.gdpr()         // GdprApi
client.graphql()      // GraphQLApi
client.tier()         // TierApi
client.governance()   // GovernanceApi
client.wallet()       // WalletApi
client.compliance()   // ComplianceApi
```

See [API Reference](../api-reference/) for method signatures.

## Thread Safety

`AurigraphClient` is thread-safe — create once, share across threads. Internal `HttpClient` uses a connection pool. No need for per-thread instances.

```java
// Singleton pattern recommended
public class AurigraphClientHolder {
    private static final AurigraphClient INSTANCE = AurigraphClient.builder()
        .baseUrl(Config.baseUrl())
        .apiKey(Config.apiKey())
        .build();

    public static AurigraphClient get() { return INSTANCE; }
}
```

## Error Handling

See [Error Handling](../error-handling.md). Brief summary:

```java
try {
    client.assets().get("nonexistent");
} catch (AurigraphException.ClientError e) {
    System.err.println("Error code: " + e.errorCode());
    System.err.println("Trace: " + e.traceId());
} catch (AurigraphException.ServerError e) {
    // Already retried automatically
    logger.error("Server error after retries", e);
}
```

## Logging

The SDK uses SLF4J. Configure your preferred backend:

```xml
<!-- logback.xml -->
<logger name="io.aurigraph.dlt.sdk" level="INFO"/>
<logger name="io.aurigraph.dlt.sdk.AurigraphClient" level="DEBUG"/>
```

At `DEBUG` level, every request logs URL, method, duration, and trace ID.

## Graceful Shutdown

Always close the client on app shutdown:

```java
Runtime.getRuntime().addShutdownHook(new Thread(() -> {
    try {
        client.close();  // flushes queue, cancels heartbeats
    } catch (Exception e) {
        logger.warn("Error closing Aurigraph client", e);
    }
}));
```

## See Also

- [API Reference](../api-reference/) — all namespaces
- [Getting Started](../getting-started.md) — first integration
- [Error Handling](../error-handling.md) — RFC 7807 errors
