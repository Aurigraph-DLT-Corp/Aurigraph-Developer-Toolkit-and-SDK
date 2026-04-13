# Rust SDK

Official Rust SDK for Aurigraph DLT V12. Async-first, built on `tokio` + `reqwest` with `serde` for serialization.

**Current Version**: `0.1.0` (v1.4 track — production-hardened in next release)
**Minimum Rust**: 1.75 (for async-trait in stable)
**Dependencies**: `reqwest`, `tokio`, `serde`, `serde_json`, `thiserror`

## Install

```toml
# Cargo.toml
[dependencies]
aurigraph-sdk = "0.1"
tokio = { version = "1", features = ["rt-multi-thread", "macros"] }
```

> Note: crates.io publishing begins with v1.0. For v0.x, use a git dependency:
> ```toml
> aurigraph-sdk = { git = "https://github.com/Aurigraph-DLT-Corp/Aurigraph-Developer-Toolkit-and-SDK", subpath = "rust" }
> ```

## Quickstart

```rust
use aurigraph_sdk::AurigraphClient;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let client = AurigraphClient::builder()
        .base_url("https://dlt.aurigraph.io")
        .app_id(std::env::var("AURIGRAPH_APP_ID")?)
        .api_key(std::env::var("AURIGRAPH_API_KEY")?)
        .build()?;

    // Health check (public)
    let health = client.health().await?;
    println!("Platform: {:?}", health.status);

    // Handshake (auth required)
    let hello = client.handshake().hello().await?;
    println!("Tier: {}", hello.partner_profile.tier);

    // Query assets
    let gold = client.assets().list_by_use_case("UC_GOLD").await?;
    println!("Gold assets: {:?}", gold);

    Ok(())
}
```

## Builder Pattern

```rust
let client = AurigraphClient::builder()
    .base_url("https://dlt.aurigraph.io")
    .app_id("bc2ce4fa...")
    .api_key("aG8VN7aV...")
    .timeout(std::time::Duration::from_secs(30))
    .max_retries(3)
    .build()?;
```

## All 13 Namespaces

```rust
client.nodes();         // NodesApi
client.registries();    // RegistriesApi
client.channels();      // ChannelsApi
client.transactions();  // TransactionsApi
client.dmrv();          // DmrvApi
client.contracts();     // ContractsApi
client.handshake();     // HandshakeApi
client.assets();        // AssetsApi
client.gdpr();          // GdprApi
client.graphql();       // GraphQLApi
client.tier();          // TierApi
client.governance();    // GovernanceApi
client.wallet();        // WalletApi
client.compliance();    // ComplianceApi
```

## Error Handling

The SDK uses `thiserror` for typed errors:

```rust
use aurigraph_sdk::{AurigraphClient, AurigraphError};

match client.assets().get("nonexistent").await {
    Ok(asset) => println!("Got asset: {:?}", asset),

    Err(AurigraphError::Server { status, message }) => {
        eprintln!("Server error {}: {}", status, message);
    }

    Err(AurigraphError::Client(msg)) => {
        eprintln!("Client error: {}", msg);
    }

    Err(AurigraphError::Network(e)) => {
        eprintln!("Network error: {}", e);
    }

    Err(e) => eprintln!("Other error: {}", e),
}
```

## Typed vs Dynamic Responses

Well-known responses use typed structs:

```rust
let health: HealthResponse = client.health().await?;
//          ^ typed struct with fields
```

Asset-agnostic responses use `serde_json::Value`:

```rust
let gold: serde_json::Value = client.assets().list_by_use_case("UC_GOLD").await?;
// Access fields dynamically
let count = gold["filtered"].as_u64().unwrap_or(0);
```

Rationale: with 16 asset types returning different fields, generating 16 typed response structs would replicate the anti-pattern asset-agnostic design solves. For strong types, query specific fields via GraphQL.

## Streaming RPCs (Planned v1.4)

When streaming support lands:

```rust
let mut stream = client.stream().subscribe("transactions").await?;
while let Some(event) = stream.next().await {
    match event {
        Ok(tx) => println!("TX: {}", tx.tx_id),
        Err(e) => eprintln!("Stream error: {}", e),
    }
}
```

## Concurrent Requests

`AurigraphClient` is `Clone + Send + Sync` — cheap to clone into multiple tasks:

```rust
let client = AurigraphClient::builder().build()?;

let tasks: Vec<_> = (0..10).map(|i| {
    let c = client.clone();
    tokio::spawn(async move {
        c.assets().get(&format!("RWA-CO-{:03}", i)).await
    })
}).collect();

let results = futures::future::join_all(tasks).await;
```

Internally uses an `Arc<InnerClient>` so clones share the underlying HTTP connection pool.

## Testing with Mocks

Use `wiremock` for HTTP mocking:

```rust
use wiremock::{Mock, MockServer, ResponseTemplate};
use wiremock::matchers::{method, path};

#[tokio::test]
async fn test_health_check() {
    let server = MockServer::start().await;

    Mock::given(method("GET"))
        .and(path("/api/v11/health"))
        .respond_with(ResponseTemplate::new(200).set_body_json(serde_json::json!({
            "status": "HEALTHY",
            "uptime": 12345
        })))
        .mount(&server)
        .await;

    let client = AurigraphClient::builder()
        .base_url(&server.uri())
        .build()
        .unwrap();

    let health = client.health().await.unwrap();
    assert_eq!(health.status, "HEALTHY");
}
```

## Features Roadmap

- **v0.2** — Complete all 13 namespaces (currently assets, handshake, gdpr are implemented; others return `todo!()`)
- **v0.5** — Native gRPC client via `tonic`
- **v1.0** — crates.io publishing, stable API contract, MSRV guarantee (1.75)
- **v1.5** — WebAssembly target for browser use

## Minimum Supported Rust Version (MSRV)

Current: 1.75. We'll commit to MSRV 1.80 at v1.0 release. MSRV increases are MINOR version bumps (not PATCH).

## Unsafe Code

The SDK is `#![forbid(unsafe_code)]` — no unsafe blocks anywhere. All cryptographic operations (PQC signatures) delegate to audited libraries.

## See Also

- [API Reference](../api-reference/) — all namespaces
- [Getting Started](../getting-started.md) — first integration
- [Error Handling](../error-handling.md) — RFC 7807 errors
