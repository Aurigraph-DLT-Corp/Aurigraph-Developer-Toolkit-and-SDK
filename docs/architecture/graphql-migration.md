# ADTS-13: SmallRye GraphQL Migration

> **JIRA**: [ADTS-13](https://aurigraphdlt.atlassian.net/browse/ADTS-13)
> **Status**: Design Complete | Implementation: Multi-Sprint (v1.3 / v1.4)
> **Dependencies**: Quarkus 3.23.0+ (SmallRye GraphQL 2.x bundled), aurigraph-v12 backend
> **Related**: ADTS-14 (Streaming), ADTS-17 (Native gRPC)

---

## 1. Current State

The GraphQL endpoint at `POST /api/v11/graphql` is implemented as a **REST-proxy** in `AurigraphGraphQLResource.java`:

- Accepts standard `{"query": "...", "variables": {...}}` payloads
- Uses **regex** (`Pattern.compile("\\{\\s*(\\w+)")`) to detect the root query field
- Routes to hardcoded resolvers: `channels`, `channel(id)`, `assets`, `contracts`, `nodeMetrics`
- Returns data in the standard `{"data": {...}, "errors": [...]}` envelope
- **No** field selection, nested queries, mutations, subscriptions, or introspection
- **No** schema — clients cannot discover available types or fields

**Source**: `aurigraph-v12/src/main/java/io/aurigraph/v11/graphql/AurigraphGraphQLResource.java` (300 LOC)

**Injected repositories**:
- `ChannelRepository` (channels, channel by ID)
- `RwaAssetRepository` (assets, filtered by channelId/useCaseId)
- `RicardianContractRepository` (contracts list)
- `TransactionService` (unused in current resolvers)
- `NodeRegistry` (node metrics: totalNodes, activeNodes, validatorCount)

**SDK integration** (current):
```typescript
// TypeScript — graphql.ts namespace
const result = await client.graphql.query<{ channels: Channel[] }>(
  `query { channels { channelId name type description createdAt } }`
);
```

---

## 2. Target State

Replace the regex-based REST proxy with **SmallRye GraphQL** (`quarkus-smallrye-graphql`), which provides:

- Full GraphQL spec compliance (field selection, aliases, fragments, variables, introspection)
- Auto-generated schema from Java types via `@GraphQLApi` annotations
- Built-in subscription support via SSE transport
- GraphQL UI at `/q/graphql-ui` (dev mode)
- Schema-first or code-first — we use **code-first** (annotations on existing entities)

**Endpoint remains**: `POST /api/v11/graphql` (configured via `quarkus.smallrye-graphql.root-path`)

---

## 3. Migration Phases

### Phase 1: Add SmallRye Dependency (Sprint 1, ~2 days)

Add `quarkus-smallrye-graphql` alongside the existing REST proxy. Both run simultaneously.

**pom.xml addition**:
```xml
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-smallrye-graphql</artifactId>
</dependency>
```

**application.properties**:
```properties
# SmallRye GraphQL runs on a separate path during migration
quarkus.smallrye-graphql.root-path=/api/v11/graphql-native
quarkus.smallrye-graphql.schema-include-directives=true
quarkus.smallrye-graphql.ui.root-path=/q/graphql-ui
quarkus.smallrye-graphql.ui.always-include=true
```

**Acceptance**: `/api/v11/graphql-native` returns introspection schema; `/api/v11/graphql` (REST proxy) still works.

### Phase 2: Mirror Top 5 Queries (Sprint 1-2, ~5 days)

Create `@GraphQLApi` service that mirrors existing resolvers using real Panache repositories.

**New file**: `AurigraphGraphQLService.java`

```java
package io.aurigraph.v11.graphql;

import io.aurigraph.v11.channel.entity.ChannelEntity;
import io.aurigraph.v11.channel.repository.ChannelRepository;
import io.aurigraph.v11.rwa.entity.RwaAssetEntity;
import io.aurigraph.v11.rwa.repository.RwaAssetRepository;
import io.aurigraph.v11.contract.ricardian.entity.RicardianContractEntity;
import io.aurigraph.v11.contract.ricardian.repository.RicardianContractRepository;
import io.aurigraph.v11.api.nodes.NodeRegistry;
import io.aurigraph.v11.usecase.UseCaseRegistryService;
import jakarta.inject.Inject;
import org.eclipse.microprofile.graphql.*;

import java.util.List;

@GraphQLApi
public class AurigraphGraphQLService {

    @Inject ChannelRepository channelRepository;
    @Inject RwaAssetRepository rwaAssetRepository;
    @Inject RicardianContractRepository ricardianContractRepository;
    @Inject NodeRegistry nodeRegistry;
    @Inject UseCaseRegistryService useCaseRegistryService;

    // ── Queries ──────────────────────────────────────────────────────

    @Query("channels")
    @Description("List all active channels in the Aurigraph network")
    public List<ChannelEntity> getChannels() {
        return channelRepository.findAllActive();
    }

    @Query("channel")
    @Description("Get a specific channel by its ID")
    public ChannelEntity getChannel(@Name("id") String channelId) {
        return channelRepository.findByChannelId(channelId);
    }

    @Query("assets")
    @Description("List RWA assets, optionally filtered by use case")
    public List<RwaAssetEntity> getAssets(
            @Name("useCase") @DefaultValue("") String useCase,
            @Name("status") @DefaultValue("") String status,
            @Name("limit") @DefaultValue("50") int limit) {
        if (!useCase.isBlank()) {
            return rwaAssetRepository.list("useCaseId", useCase)
                    .stream().limit(limit).toList();
        }
        return rwaAssetRepository.listAll()
                .stream().limit(limit).toList();
    }

    @Query("contracts")
    @Description("List all Ricardian contracts")
    public List<RicardianContractEntity> getContracts() {
        return ricardianContractRepository.listAll();
    }

    @Query("nodeMetrics")
    @Description("Aggregated node metrics for the network")
    public NodeMetricsDTO getNodeMetrics() {
        int validators = nodeRegistry.getActiveValidators().size();
        int businessNodes = nodeRegistry.getActiveBusinessNodes().size();
        return new NodeMetricsDTO(
                nodeRegistry.getTotalNodes(),
                validators + businessNodes,
                validators,
                businessNodes,
                (validators + businessNodes) > 0 ? "HEALTHY" : "DEGRADED"
        );
    }

    // ── DTO for NodeMetrics (entities handle their own serialization) ──

    public record NodeMetricsDTO(
            int totalNodes,
            int activeNodes,
            int validatorCount,
            int businessNodeCount,
            String networkStatus
    ) {}
}
```

**Generated schema** (auto-derived by SmallRye):
```graphql
type Query {
  channels: [ChannelEntity!]!
  channel(id: String!): ChannelEntity
  assets(useCase: String = "", status: String = "", limit: Int = 50): [RwaAssetEntity!]!
  contracts: [RicardianContractEntity!]!
  nodeMetrics: NodeMetricsDTO!
}

type ChannelEntity {
  channelId: String!
  channelName: String
  channelType: String
  description: String
  status: String
  validatorCount: Int
  businessNodeCount: Int
  useCaseId: String
  createdAt: DateTime
  updatedAt: DateTime
}

type RwaAssetEntity {
  assetId: String!
  assetName: String
  assetType: String
  issuerAddress: String
  totalShares: BigInteger
  availableShares: BigInteger
  currency: String
  status: String
}

type RicardianContractEntity {
  contractId: String!
  documentId: String
  documentType: String
  title: String
  status: String
}

type NodeMetricsDTO {
  totalNodes: Int!
  activeNodes: Int!
  validatorCount: Int!
  businessNodeCount: Int!
  networkStatus: String!
}
```

**Acceptance**: All 5 queries return identical data to REST proxy. Schema visible at `/q/graphql-ui`.

### Phase 3: Add Subscriptions (Sprint 2-3, ~5 days)

SmallRye GraphQL subscriptions use **Server-Sent Events** transport over HTTP. Quarkus uses Mutiny `Multi` for the reactive stream.

```java
import io.smallrye.mutiny.Multi;
import org.eclipse.microprofile.graphql.GraphQLApi;
import io.smallrye.graphql.api.Subscription;

@GraphQLApi
public class AurigraphGraphQLSubscriptions {

    @Inject io.vertx.mutiny.core.eventbus.EventBus eventBus;

    @Subscription("transactionCreated")
    @Description("Stream of newly confirmed transactions")
    public Multi<TransactionEvent> onTransactionCreated() {
        return eventBus.<TransactionEvent>consumer("tx.confirmed")
                .toMulti()
                .map(msg -> msg.body());
    }

    @Subscription("consensusEvent")
    @Description("Stream of consensus state changes (leader election, term updates)")
    public Multi<ConsensusEventDTO> onConsensusEvent() {
        return eventBus.<ConsensusEventDTO>consumer("consensus.event")
                .toMulti()
                .map(msg -> msg.body());
    }

    @Subscription("nodeStatusChanged")
    @Description("Stream of node up/down events")
    public Multi<NodeStatusEvent> onNodeStatusChanged() {
        return eventBus.<NodeStatusEvent>consumer("node.status")
                .toMulti()
                .map(msg -> msg.body());
    }
}
```

**SDK subscription usage**:
```typescript
// TypeScript — subscription via SSE transport
const subscription = client.graphql.subscribe<{ transactionCreated: TxEvent }>(
  `subscription { transactionCreated { txId sender receiver amount timestamp } }`
);

for await (const event of subscription) {
  console.log('New TX:', event.data.transactionCreated.txId);
}
```

**Acceptance**: 3 subscriptions stream events; SDK clients receive them over SSE.

### Phase 4: Switch Endpoint (Sprint 3, ~2 days)

1. Update `quarkus.smallrye-graphql.root-path` to `/api/v11/graphql`
2. Mark `AurigraphGraphQLResource` (REST proxy) as `@Deprecated`
3. Add warning header: `X-Aurigraph-Deprecated: rest-proxy; use SmallRye GraphQL`
4. SDK clients work without changes (same path, same envelope)

### Phase 5: Remove REST Proxy (v2.0)

1. Delete `AurigraphGraphQLResource.java`
2. Remove deprecation warnings
3. Bump SDK major version

---

## 4. Additional Queries and Mutations (Full Target)

### Queries (10 total)

| Query | Source Repository | Args |
|-------|------------------|------|
| `channels` | ChannelRepository | none |
| `channel(id)` | ChannelRepository | channelId: String |
| `assets(useCase, status, limit)` | RwaAssetRepository | optional filters |
| `contracts` | RicardianContractRepository | none |
| `nodeMetrics` | NodeRegistry | none |
| `useCases` | UseCaseRegistryService | none |
| `transactions(limit, offset)` | TransactionService | pagination |
| `governanceProposals` | GovernanceProposalRepository | none |
| `stakingPositions(address)` | StakingPositionRepository | walletAddress |
| `bridgeOperations(status)` | BridgeOperationRepository | optional status filter |

### Mutations (5 total)

| Mutation | Service | Auth |
|----------|---------|------|
| `submitTransaction(input)` | TransactionService | ApiKey required |
| `createAsset(input)` | RwaAssetRepository | ApiKey + ADMIN role |
| `createGovernanceProposal(input)` | GovernanceService | ApiKey required |
| `castVote(proposalId, vote)` | GovernanceService | ApiKey required |
| `transferAssetOwnership(input)` | RwaAssetRepository | ApiKey required |

### Subscriptions (3 total)

| Subscription | Event Bus Address | Events/sec |
|--------------|-------------------|------------|
| `transactionCreated` | `tx.confirmed` | ~100-1K |
| `consensusEvent` | `consensus.event` | ~1-10 |
| `nodeStatusChanged` | `node.status` | ~0.1-1 |

---

## 5. Backward Compatibility

| Aspect | Guarantee |
|--------|-----------|
| Endpoint path | `POST /api/v11/graphql` unchanged |
| Response format | `{"data": {...}, "errors": [...]}` unchanged |
| Existing queries | `channels`, `channel(id)`, `assets`, `contracts`, `nodeMetrics` all work |
| SDK clients | No code changes needed (same HTTP transport, same envelope) |
| Introspection | **New** — SmallRye enables `__schema` and `__type` queries automatically |
| Variables | Supported natively (REST proxy had partial support) |

**Breaking changes (Phase 5 only)**:
- `operationName` field becomes meaningful (REST proxy ignored it)
- Field selection is enforced (REST proxy returned all fields regardless)

---

## 6. Performance Targets

| Metric | Target | Measured By |
|--------|--------|-------------|
| Query throughput | 100+ queries/sec (single node) | JMeter / `wrk` against `/api/v11/graphql` |
| Subscription concurrency | 1,000 concurrent subscribers | Gatling SSE test |
| Query latency (p99) | <50ms for simple queries | Micrometer histogram |
| Schema generation | <500ms at startup | Quarkus startup log |
| Introspection | <10ms | `__schema` query timing |

**Optimization levers**:
- SmallRye's built-in DataLoader for N+1 prevention
- Quarkus reactive routes for subscription backpressure
- `@CacheResult` on hot resolvers (channels, nodeMetrics)

---

## 7. Testing Strategy

### Unit Tests (SmallRye built-in)

```java
@QuarkusTest
class AurigraphGraphQLServiceTest {

    @Test
    void testChannelsQuery() {
        given()
            .contentType("application/json")
            .body("{\"query\": \"{ channels { channelId channelName status } }\"}")
        .when()
            .post("/api/v11/graphql-native")
        .then()
            .statusCode(200)
            .body("data.channels.size()", greaterThan(0))
            .body("data.channels[0].channelId", notNullValue());
    }

    @Test
    void testChannelByIdQuery() {
        given()
            .contentType("application/json")
            .body("{\"query\": \"{ channel(id: \\\"HOME\\\") { channelId channelName } }\"}")
        .when()
            .post("/api/v11/graphql-native")
        .then()
            .statusCode(200)
            .body("data.channel.channelId", equalTo("HOME"));
    }

    @Test
    void testIntrospection() {
        given()
            .contentType("application/json")
            .body("{\"query\": \"{ __schema { queryType { name } } }\"}")
        .when()
            .post("/api/v11/graphql-native")
        .then()
            .statusCode(200)
            .body("data.__schema.queryType.name", equalTo("Query"));
    }
}
```

### SDK Integration Tests

Each SDK language tests against a running dev instance:
- Java: `@QuarkusIntegrationTest` with `GraphQLApi` namespace
- TypeScript: Jest + `nock` for mocked responses, Playwright for live integration
- Python: `pytest` + `httpx` with mocked/live backend
- Rust: `tokio::test` with `mockito` server

---

## 8. Acceptance Criteria

- [ ] 10 `@Query` methods returning data from real Panache repositories
- [ ] 5 `@Mutation` methods with auth enforcement (ApiKey + role checks)
- [ ] 3 `@Subscription` methods streaming via SSE
- [ ] All 4 SDK languages (Java, TypeScript, Python, Rust) can execute queries and receive subscription events
- [ ] Introspection enabled (`__schema`, `__type` queries work)
- [ ] GraphQL UI accessible at `/q/graphql-ui` in dev mode
- [ ] Backward compatibility: existing `POST /api/v11/graphql` queries return same data
- [ ] Performance: 100+ queries/sec sustained on single node
- [ ] REST proxy deprecated with `X-Aurigraph-Deprecated` header
- [ ] All queries return `{"data": {...}}` envelope (no envelope changes)

---

## 9. SDK Changes Required

### Java SDK (`java/`)

Add `GraphQLApi` namespace with SmallRye-aware methods:

```java
public class GraphQLApi {
    // Existing: query(), queryChannels(), queryAssets(), queryNodeMetrics()
    // New: subscribe() returning Flux/Multi for SSE subscriptions
    // New: mutate() for mutation operations
    // New: introspect() for schema discovery
}
```

### TypeScript SDK (`typescript/`)

Enhance `graphql.ts` namespace:

```typescript
export class GraphQLApi {
    // Existing: query(), queryChannels(), queryAssets(), queryNodeMetrics()
    // New: subscribe<T>(query) → AsyncIterableIterator<GraphQLResponse<T>>
    // New: mutate<T>(mutation, variables) → Promise<GraphQLResponse<T>>
}
```

### Python SDK (`python/`)

New `graphql.py` namespace:

```python
class GraphQLApi:
    async def query(self, query: str, variables: dict | None = None) -> GraphQLResponse: ...
    async def subscribe(self, query: str) -> AsyncIterator[GraphQLResponse]: ...
    async def mutate(self, mutation: str, variables: dict | None = None) -> GraphQLResponse: ...
```

### Rust SDK (`rust/`)

New `graphql.rs` namespace:

```rust
impl GraphQLApi {
    pub async fn query<T: DeserializeOwned>(&self, query: &str, variables: Option<Value>) -> Result<GraphQLResponse<T>>;
    pub fn subscribe<T: DeserializeOwned>(&self, query: &str) -> impl Stream<Item = Result<GraphQLResponse<T>>>;
}
```
