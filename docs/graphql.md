# GraphQL Gateway

The platform exposes a GraphQL endpoint at `POST /api/v11/graphql` for clients that prefer typed, batched queries over REST.

## Current Implementation

The v1.2.0 gateway is a **REST proxy**: it parses the GraphQL query string, detects the root field, and delegates to the corresponding REST endpoint. It returns a standard `{"data": {...}, "errors": [...]}` envelope.

This approach ships GraphQL compatibility without adding a full GraphQL runtime to the backend. The full SmallRye GraphQL migration is planned for v1.3 (see [Architecture: GraphQL Migration](architecture/graphql-migration.md)).

## Supported Root Fields (v1.2.0)

- `channels` — list all channels
- `channel(id: String!)` — get a specific channel
- `assets(channelId: String)` — list assets, optionally filtered by channel
- `contracts` — list active contracts
- `nodeMetrics` — platform-wide node metrics

## Using the GraphQL Namespace

```java
// Java — generic query
Map<String, Object> vars = Map.of();
GraphQLResponse response = client.graphql().query(
    "{ channels { channelId channelName channelType } }",
    vars
);
System.out.println(response.data());
```

```typescript
// TypeScript — typed helper
const { data } = await client.graphql.queryChannels();
// data.channels is an array
```

```python
# Python — any query
response = client.graphql.query(
    "{ nodeMetrics { totalNodes activeNodes } }"
)
print(response.data["nodeMetrics"])
```

## Typed Helpers

The TypeScript SDK provides a strongly-typed helper per root field:

```typescript
const { data: channelsData } = await client.graphql.queryChannels();
const { data: assetsData } = await client.graphql.queryAssets('enterprise-channel');
const { data: contractsData } = await client.graphql.queryContracts();
const { data: metricsData } = await client.graphql.queryNodeMetrics();
```

Each helper returns a `GraphQLResponse<T>` with `data` typed to the expected shape.

## Errors

GraphQL errors appear in the `errors` array of the response, not as HTTP error status:

```typescript
const response = await client.graphql.query('{ unknownField }');
if (response.errors?.length) {
  response.errors.forEach(err => console.error(err.message, err.path));
}
```

The HTTP response remains 200 unless there's a transport-level failure. This matches the [GraphQL specification](https://spec.graphql.org/October2021/#sec-Errors).

## Limitations (v1.2.0)

- **No mutations yet** — use REST endpoints for writes
- **No subscriptions yet** — use WebSocket/SSE streaming for real-time (planned v1.3)
- **No fragment composition** — the regex-based field detection doesn't support complex queries
- **No variables** — variables are parsed but pass-through only
- **No directives** (`@include`, `@skip`) — not honored

These limitations are lifted in v1.3 (SmallRye migration). See [Architecture: GraphQL Migration](architecture/graphql-migration.md).

## Performance

The REST-proxy adds ~5ms overhead vs a direct REST call (regex field detection + JSON re-wrapping). For latency-sensitive paths, prefer the REST endpoint directly.

After v1.3 migration, native SmallRye GraphQL is comparable to REST (<1ms overhead) and adds ~30% throughput improvement via query batching.

## When to Use GraphQL vs REST

**Use GraphQL when**:
- You need data from multiple endpoints in one round-trip
- You only want specific fields (bandwidth optimization on mobile)
- You're integrating with a GraphQL client library (Apollo, urql, Relay)

**Use REST when**:
- You need writes (mutations aren't implemented yet)
- You need streaming (subscriptions aren't implemented yet)
- You want maximum performance for a single endpoint

## See Also

- [api-reference/graphql.md](api-reference/graphql.md) — full API reference
- [Architecture: GraphQL Migration](architecture/graphql-migration.md) — SmallRye migration plan
- [Error Handling](error-handling.md) — GraphQL error format
