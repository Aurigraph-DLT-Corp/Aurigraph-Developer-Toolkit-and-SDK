# Aurigraph DLT Java SDK

Official Java SDK for the **Aurigraph DLT** V12 platform (V11 API).

- **Artifact**: `io.aurigraph:dlt-sdk:1.0.0`
- **Java**: 21+
- **HTTP**: `java.net.http.HttpClient` — no external HTTP libs
- **JSON**: Jackson
- **Logging**: SLF4J

## Installation

```xml
<dependency>
  <groupId>io.aurigraph</groupId>
  <artifactId>dlt-sdk</artifactId>
  <version>1.0.0</version>
</dependency>
```

## Quickstart

### 1. Health check

```java
import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.HealthResponse;
import io.aurigraph.dlt.sdk.dto.PlatformStats;

AurigraphClient client = AurigraphClient.builder()
    .baseUrl("https://dlt.aurigraph.io")
    .apiKey(System.getenv("AURIGRAPH_API_KEY"))
    .build();

HealthResponse health = client.health();
System.out.println(health.status);  // HEALTHY

PlatformStats stats = client.stats();
System.out.printf("TPS: %d, nodes: %d%n", stats.tps, stats.activeNodes);
```

### 2. Query nodes and registries

```java
import io.aurigraph.dlt.sdk.dto.NodeList;
import io.aurigraph.dlt.sdk.dto.NodeMetrics;
import io.aurigraph.dlt.sdk.dto.UseCase;
import java.util.List;

NodeList nodes = client.nodes().list(0, 100);
NodeMetrics metrics = client.nodes().getMetrics();
System.out.printf("%d/%d active%n", metrics.activeNodes, metrics.totalNodes);

List<UseCase> useCases = client.registries().listUseCases();
useCases.forEach(uc -> System.out.println(uc.id + " " + uc.name));
```

### 3. Submit a signed transaction

```java
import io.aurigraph.dlt.sdk.dto.TransactionSubmitRequest;
import io.aurigraph.dlt.sdk.dto.TransactionReceipt;

TransactionSubmitRequest tx = new TransactionSubmitRequest(
    "0xsender...", "0xrecipient...", "100.50", "USDT");
tx.memo = "invoice-42";
tx.signature = "<ed25519-hex>";
tx.publicKey = "<sender-pubkey-hex>";

TransactionReceipt receipt = client.transactions().submit(tx);
System.out.printf("tx %s → %s%n", receipt.txHash, receipt.status);
```

## Configuration

```java
AurigraphClient.builder()
    .baseUrl("https://dlt.aurigraph.io")   // required
    .apiKey("...")                         // X-API-Key header
    .jwtToken("...")                       // Authorization: Bearer
    .timeout(Duration.ofSeconds(10))       // default 10s
    .maxRetries(3)                         // default 3 (exp backoff on 5xx)
    .build();
```

## Error handling

```java
import io.aurigraph.dlt.sdk.exception.AurigraphException;

try {
    client.nodes().register(new NodeRegisterRequest("", "VALIDATOR"));
} catch (AurigraphException.ClientError e) {
    // HTTP 4xx — do not retry
    System.err.printf("%s: %s%n", e.getErrorCode(), e.getMessage());
} catch (AurigraphException.ServerError e) {
    // HTTP 5xx after retries exhausted
    System.err.println("server error: " + e.getStatusCode());
} catch (AurigraphException.NetworkError e) {
    // Timeout, connection refused, etc.
    System.err.println("network: " + e.getMessage());
}
```

All errors expose the parsed RFC 7807 `problem+json` body via `getProblem()`.

## API surface

| Namespace | Methods |
|-----------|---------|
| `client.health()`           | top-level — returns HealthResponse |
| `client.stats()`            | top-level — returns PlatformStats |
| `client.nodes()`            | `list()`, `get()`, `register()`, `getMetrics()` |
| `client.registries()`       | `battuaStats()`, `battuaTokens()`, `battuaNodes()`, `registerBattuaNodeHeartbeat()`, `provenewsContracts()`, `provenewsAssets()`, `listUseCases()`, `getUseCase()`, `tokens()` |
| `client.registries().tokens()` | `list()`, `get()`, `create()`, `mint()`, `getHolders()`, `getTransfers()`, `stats()` |
| `client.channels()`         | `list()`, `get()`, `create()` |
| `client.transactions()`     | `recent()`, `submit()`, `get()` |
| `client.dmrv()`             | `recordEvent()`, `batchRecord()`, `getAuditTrail()`, `triggerMint()` |
| `client.contracts()`        | `getTokens()`, `bindComposite()`, `issueDerivedFromComposite()`, `getBindingsForContract()`, `getBindingsForToken()` |

## DMRV namespace

Record sensor / meter / device events and trigger on-chain mints on
active Ricardian contracts.

```java
// Single event
DmrvEvent event = new DmrvEvent("battery-ABC123", "BATTERY_SWAP", 1);
DmrvReceipt receipt = client.dmrv().recordEvent(event);

// Batched (SDK splits into chunks of 50 automatically)
List<DmrvEvent> readings = meters.stream()
    .map(m -> new DmrvEvent(m.id, "METER_READING", m.kWh))
    .toList();
BatchReceipt result = client.dmrv().batchRecord(readings);
System.out.println("accepted=" + result.accepted + " rejected=" + result.rejected);

// DMRV-triggered mint (contractId must be a UUID — validated client-side)
MintReceipt mint = client.dmrv().triggerMint(
    "11111111-2222-4333-8444-555555555555",
    "CARBON_OFFSET",
    2.5);
System.out.println(mint.tokenId + " " + mint.txHash);

// Audit trail
AuditFilter filter = new AuditFilter()
    .contractId("11111111-2222-4333-8444-555555555555")
    .limit(100);
List<DmrvEvent> trail = client.dmrv().getAuditTrail(filter);
```

## Generic Token Registry

Create and mint tokens on your own entries in the V12 generic token
registry (`/api/v11/registries/tokens`). This is the 3rd-party path —
tokens you create here belong to your organisation, not to a specific
RWAT use case. Requires `registry:write` + `mint:token` scopes on the
API key.

```java
import io.aurigraph.dlt.sdk.AurigraphClient;
import io.aurigraph.dlt.sdk.dto.CreateTokenRequest;
import io.aurigraph.dlt.sdk.dto.TokenDetail;
import io.aurigraph.dlt.sdk.dto.TokenListResponse;
import io.aurigraph.dlt.sdk.dto.TokenMintReceipt;
import io.aurigraph.dlt.sdk.dto.TokenMintRequest;
import io.aurigraph.dlt.sdk.dto.TokenRegistryStats;
import io.aurigraph.dlt.sdk.namespace.TokenRegistryApi;

AurigraphClient client = AurigraphClient.builder()
    .baseUrl("https://dlt.aurigraph.io")
    .apiKey(System.getenv("AURIGRAPH_API_KEY"))
    .autoIdempotency(true)
    .build();

// 1. List tokens with filter + pagination
TokenRegistryApi.ListFilter f = new TokenRegistryApi.ListFilter()
    .standard("PRIMARY").active(true).size(20);
TokenListResponse page = client.registries().tokens().list(f);
System.out.printf("%d PRIMARY tokens%n", page.totalElements);

// 2. Create your own token
CreateTokenRequest req = new CreateTokenRequest("UTILITY", "My Utility Token", "MUT");
req.totalSupply = 1_000_000L;
req.decimals = 18;
TokenDetail token = client.registries().tokens().create(req);
System.out.println("created " + token.id);

// 3. Mint additional supply — Idempotency-Key is auto-attached
TokenMintRequest mintReq = new TokenMintRequest(1000L, "0xrecipient");
TokenMintReceipt receipt = client.registries().tokens().mint(token.id, mintReq);
System.out.printf("minted %d, new supply = %d%n",
    receipt.amount, receipt.newTotalSupply);

// 4. Aggregate stats (computed client-side — V12 has no /stats endpoint)
TokenRegistryStats stats = client.registries().tokens().stats();
System.out.printf("%d/%d active, byType=%s%n",
    stats.activeTokens, stats.totalTokens, stats.byType);
```

All list-style calls (`list`, `getHolders`, `getTransfers`, `stats`)
return empty collections on transport failure — they never throw — so
dashboards stay resilient. `get`, `create` and `mint` propagate 4xx/5xx
errors as `AurigraphException.ClientError` / `ServerError`.

## Offline queue + idempotency

The SDK can transparently buffer mutating requests (POST/PUT/DELETE) that
fail due to 5xx or network errors, and replay them when the network returns.

```java
AurigraphClient client = AurigraphClient.builder()
    .baseUrl("https://dlt.aurigraph.io")
    .apiKey(System.getenv("AURIGRAPH_API_KEY"))
    .enableQueue(true)              // opt-in offline queue
    .autoIdempotency(true)          // auto-attach Idempotency-Key header
    .queueMaxSize(1000)             // drops oldest when full
    .build();

// Subscribe to queue events
client.queue().onEvent(OfflineQueue.EventKind.FLUSH,
    op -> System.out.println("replayed " + ((OfflineQueue.Operation) op).path));
client.queue().onEvent(OfflineQueue.EventKind.DROP,
    op -> System.err.println("dropped " + ((OfflineQueue.Operation) op).path));

// Calls that fail on 5xx/network are auto-queued. Trigger replay manually:
int flushed = client.queue().flush();
System.out.println("flushed=" + flushed + " remaining=" + client.queue().size());
```

**How idempotency works**: when `autoIdempotency(true)` is set, every
mutating request is sent with a deterministic SHA-256 `Idempotency-Key`
header, computed from its method, path and canonicalised JSON body. Two
callers sending the same logical payload produce the same key, so the V12
server can safely dedupe replayed operations.

## Build

```bash
mvn clean test
mvn package
```

## License

Apache-2.0
