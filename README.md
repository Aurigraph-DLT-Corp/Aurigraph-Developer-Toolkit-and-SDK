# Aurigraph Developer Toolkit & SDK

Official SDKs for integrating with the **Aurigraph DLT V12** platform (V11 API).

## SDKs

| Language | Path | Version | Status |
|----------|------|---------|--------|
| **Java** | `java/` | 1.2.0 | Production |
| **TypeScript** | `typescript/` | 1.2.0 | Production |

## Architecture: Asset-Agnostic Design

The SDK uses a **unified, asset-agnostic query API** — no asset-type-specific classes. All 15+ RWAT use cases are accessed through the same `AssetsApi`:

```java
// Java
AurigraphClient client = AurigraphClient.builder()
    .baseUrl("https://dlt.aurigraph.io")
    .apiKey(System.getenv("AURIGRAPH_API_KEY"))
    .build();

// Query any asset type via parameters
client.assets().listByUseCase("UC_GOLD");
client.assets().listByType("COMMODITY");
client.assets().listByChannel("enterprise-channel");
client.assets().query("UC_CARBON", null, "VERIFIED", null, 50, 0);

// Multi-channel: assets can be in multiple channels
client.assets().channelsForAsset("RWA-CO-001");
client.assets().assetsInChannel("marketplace-channel");
```

```typescript
// TypeScript
const client = new AurigraphClient({
  baseUrl: 'https://dlt.aurigraph.io',
  apiKey: process.env.AURIGRAPH_API_KEY,
});

const gold = await client.assets.listByUseCase('UC_GOLD');
const channels = await client.assets.channelsForAsset('RWA-CO-001');
```

## Namespace APIs (v1.2.0)

| Namespace | Description | Endpoints |
|-----------|-------------|-----------|
| `assets` | Asset-agnostic RWA operations | /rwa/query, /rwa/assets, /use-cases |
| `gdpr` | GDPR data export & erasure | /gdpr/export, /gdpr/erasure |
| `graphql` | GraphQL gateway proxy | POST /graphql |
| `tier` | SDK partner tier management | /sdk/partner/tier, /usage, /quota |
| `governance` | Proposals, voting, treasury | /governance/proposals, /vote |
| `wallet` | Wallet balance, transfer, history | /wallet/balance, /transfer |
| `compliance` | Regulatory framework assessment | /compliance/frameworks, /assess |
| `nodes` | Node management | /nodes/metrics, /stats |
| `channels` | Channel registry | /channels |
| `transactions` | Transaction submission | /transactions |
| `dmrv` | Digital MRV events | /dmrv/events |
| `contracts` | Smart contract management | /contracts |
| `handshake` | SDK handshake protocol | /sdk/handshake/hello, /heartbeat |

## Channel Architecture

- **ASSET channels**: Domain-specific, selective node membership (ENTERPRISE, MARKETPLACE, COMPLIANCE)
- **TRANSACTION channels**: Universal, all nodes auto-join (Battua P2P, escrow, swap, CBDC)
- **BRIDGE channels**: Cross-chain relay (ETH, Polygon, BSC, Avalanche, Solana)

## Quick Start

### Java

```xml
<dependency>
    <groupId>io.aurigraph.dlt</groupId>
    <artifactId>aurigraph-sdk</artifactId>
    <version>1.2.0</version>
</dependency>
```

```bash
cd java && mvn compile
```

### TypeScript

```bash
cd typescript && npm install && npm run build
```

## Platform

- **API Base**: `https://dlt.aurigraph.io/api/v11`
- **Endpoints**: 1,265+ REST, 100+ gRPC RPCs
- **Auth**: `Authorization: ApiKey <appId>:<rawKey>`
- **Docs**: `https://dlt.aurigraph.io/api-docs`

## License

Proprietary - Aurigraph DLT Corp. All rights reserved.
