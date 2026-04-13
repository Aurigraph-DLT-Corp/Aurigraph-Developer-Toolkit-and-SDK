# Aurigraph SDK Documentation

Official SDKs for integrating with the **Aurigraph DLT V12** platform (V11 API).

The Aurigraph SDK provides a unified, asset-agnostic interface to the Aurigraph distributed ledger across four languages. All SDKs share the same namespace structure, authentication model, and error-handling conventions.

## SDKs at a Glance

| Language | Package | Install | Status |
|----------|---------|---------|--------|
| **Java** | `io.aurigraph.dlt:aurigraph-sdk` | [Maven Central](sdks/java.md) | Production |
| **TypeScript** | `@aurigraph/dlt-sdk` | [npm](sdks/typescript.md) | Production |
| **Python** | `aurigraph-sdk` | [PyPI](sdks/python.md) | Production |
| **Rust** | `aurigraph-dlt-sdk` | [crates.io](sdks/rust.md) | Beta |

## Quick Install

### Java

```xml
<dependency>
    <groupId>io.aurigraph.dlt</groupId>
    <artifactId>aurigraph-sdk</artifactId>
    <version>1.2.0</version>
</dependency>
```

### TypeScript

```bash
npm install @aurigraph/dlt-sdk
```

### Python

```bash
pip install aurigraph-sdk
```

### Rust

```toml
[dependencies]
aurigraph-dlt-sdk = "0.1"
```

## Quick Start (All Languages)

Every SDK follows the same pattern: create a client with your credentials, then access namespace APIs.

```java
// Java
AurigraphClient client = AurigraphClient.builder()
    .baseUrl("https://dlt.aurigraph.io")
    .apiKey("your-app-id", "your-raw-key")
    .build();

var health = client.health();
var gold = client.assets().listByUseCase("UC_GOLD");
```

```typescript
// TypeScript
import { AurigraphClient } from '@aurigraph/dlt-sdk';

const client = new AurigraphClient({
  baseUrl: 'https://dlt.aurigraph.io',
  apiKey: process.env.AURIGRAPH_API_KEY,
  appId: process.env.AURIGRAPH_APP_ID,
});

const health = await client.health.get();
const gold = await client.assets.listByUseCase('UC_GOLD');
```

```python
# Python
from aurigraph_sdk import AurigraphClient

client = AurigraphClient(
    base_url="https://dlt.aurigraph.io",
    api_key="your-raw-key",
    app_id="your-app-id",
)

health = client.health()
gold = client.assets.list_by_use_case("UC_GOLD")
```

```rust
// Rust
use aurigraph_sdk::AurigraphClient;

let client = AurigraphClient::builder()
    .base_url("https://dlt.aurigraph.io")
    .api_key("your-app-id", "your-raw-key")
    .build()?;

let health = client.health().await?;
let gold = client.assets().list_by_use_case("UC_GOLD").await?;
```

## Namespace APIs (v1.2.0)

All SDKs expose the same 13 namespace APIs:

| Namespace | Description | Key Endpoints |
|-----------|-------------|---------------|
| [`assets`](api-reference/assets.md) | Asset-agnostic RWA operations | `/rwa/query`, `/use-cases` |
| [`gdpr`](api-reference/gdpr.md) | GDPR data export and erasure | `/gdpr/export`, `/gdpr/erasure` |
| [`graphql`](api-reference/graphql.md) | GraphQL gateway proxy | `POST /graphql` |
| [`tier`](api-reference/tier.md) | SDK partner tier management | `/sdk/partner/tier`, `/usage` |
| [`governance`](api-reference/governance.md) | Proposals, voting, treasury | `/governance/proposals` |
| [`wallet`](api-reference/wallet.md) | Wallet balance and transfers | `/wallet/balance`, `/transfer` |
| [`compliance`](api-reference/compliance.md) | Regulatory framework assessment | `/compliance/frameworks` |
| [`nodes`](api-reference/nodes.md) | Node management and metrics | `/nodes`, `/nodes/metrics` |
| [`channels`](api-reference/channels.md) | Channel registry | `/channels` |
| [`transactions`](api-reference/transactions.md) | Transaction submission | `/transactions` |
| [`dmrv`](api-reference/dmrv.md) | Digital MRV events | `/dmrv/events` |
| [`contracts`](api-reference/contracts.md) | Smart contract management | `/active-contracts`, `/contract-bindings` |
| [`handshake`](api-reference/handshake.md) | SDK handshake protocol | `/sdk/handshake/hello` |

## Core Concepts

- [Getting Started](getting-started.md) -- 5-minute intro to Aurigraph DLT
- [Authentication](authentication.md) -- Keycloak OIDC, API key, and JWT flows
- [Handshake Protocol](handshake-protocol.md) -- hello/heartbeat/capabilities/config
- [Asset-Agnostic Design](asset-agnostic-design.md) -- unified `/rwa/query` instead of per-asset APIs
- [Tier System](tier-system.md) -- SANDBOX/STARTER/BUSINESS/ENTERPRISE quotas
- [Multi-Channel](multi-channel.md) -- ASSET vs TRANSACTION channels
- [GDPR Compliance](gdpr-compliance.md) -- export and erasure workflows
- [Error Handling](error-handling.md) -- RFC 7807 ProblemDetails across SDKs

## Platform

- **API Base**: `https://dlt.aurigraph.io/api/v11`
- **Auth Header**: `Authorization: ApiKey <appId>:<rawKey>`
- **Content-Type**: `application/json`
- **Error Format**: RFC 7807 (`application/problem+json`)
- **Repository**: [GitHub](https://github.com/Aurigraph-DLT-Corp/Aurigraph-Developer-Toolkit-and-SDK)
