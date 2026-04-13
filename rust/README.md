# Aurigraph Rust SDK

Official Rust SDK for the Aurigraph DLT V12 platform (V11 API).

## Installation

Add to your `Cargo.toml`:

```toml
[dependencies]
aurigraph-sdk = "0.1"
tokio = { version = "1", features = ["full"] }
```

## Quickstart

```rust
use aurigraph_sdk::AurigraphClient;

#[tokio::main]
async fn main() -> aurigraph_sdk::Result<()> {
    let client = AurigraphClient::builder()
        .base_url("https://dlt.aurigraph.io")
        .api_key("my-app-id", "my-api-key")
        .build()?;

    // Health check
    let health = client.health().await?;
    println!("Platform status: {}", health.status);

    // Platform stats
    let stats = client.stats().await?;
    println!("TPS: {}, Active nodes: {}", stats.tps, stats.active_nodes);

    // SDK handshake
    let hello = client.handshake().hello().await?;
    println!("Connected as: {} ({})", hello.app_id, hello.status);

    // List use cases
    let use_cases = client.assets().list_use_cases().await?;
    for uc in &use_cases {
        println!("  {} - {}", uc.id, uc.name);
    }

    // Query assets by use case
    let gold_assets = client.assets().list_by_use_case("UC_GOLD").await?;
    println!("Gold assets: {}", gold_assets);

    // GDPR data export
    let export = client.gdpr().export_user_data("user-123").await?;
    println!("Exported {} sections", export.sections.len());

    Ok(())
}
```

## Authentication

The SDK supports two authentication methods:

```rust
// Paired API key (recommended)
let client = AurigraphClient::builder()
    .base_url("https://dlt.aurigraph.io")
    .api_key("app-id", "api-key")
    .build()?;

// JWT bearer token
let client = AurigraphClient::builder()
    .base_url("https://dlt.aurigraph.io")
    .jwt_token("eyJ...")
    .build()?;
```

## Available Namespaces (v0.1)

| Namespace | Accessor | Description |
|-----------|----------|-------------|
| **Assets** | `client.assets()` | Asset-agnostic RWA operations, use cases, channels |
| **Handshake** | `client.handshake()` | SDK handshake protocol (hello, heartbeat, capabilities, config) |
| **GDPR** | `client.gdpr()` | GDPR data export and erasure |

Additional namespaces (nodes, channels, transactions, contracts, compliance, governance, wallet, etc.) will be added in future releases.

## Error Handling

All methods return `Result<T, AurigraphError>`. The error type distinguishes:

- `AurigraphError::Network` -- connection/timeout errors
- `AurigraphError::Server` -- HTTP 5xx with optional RFC 7807 problem details
- `AurigraphError::Client` -- HTTP 4xx with optional RFC 7807 problem details
- `AurigraphError::Config` -- missing/invalid builder configuration
- `AurigraphError::Serialization` -- JSON parse failures

## Links

- [Main Repository](https://github.com/Aurigraph-DLT-Corp/Aurigraph-Developer-Toolkit-and-SDK)
- [Java SDK](../java/) -- reference implementation with full 13-namespace coverage
- [API Documentation](https://dlt.aurigraph.io/api/v11)
