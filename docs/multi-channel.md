# Multi-Channel Architecture

Aurigraph channels are first-class: assets live in one-to-many relationships with channels, and each channel has a distinct role in the platform topology.

## Channel Types

The platform distinguishes three channel types:

| Type | Node Membership | Purpose |
|------|----------------|---------|
| **ASSET** | SELECTIVE — business nodes join per industry | Domain-specific tokenization |
| **TRANSACTION** | UNIVERSAL — all nodes auto-join | Payment settlement (Battua) |
| **BRIDGE** | SELECTIVE — relay nodes only | Cross-chain interop |

Why the distinction? An ENTERPRISE channel hosting gold trading doesn't need every validator — only nodes with LBMA compliance credentials participate. But a Battua payment settlement needs every node for maximum liquidity and censorship resistance.

## Seeded Channels

The platform ships with these channels out of the box:

**ASSET channels** (selective):
- `enterprise-channel` — Institutional investors (Gold, RE, IP, Infrastructure)
- `marketplace-channel` — Retail trading (Carbon, Art, Commodities, Secondary tokens)
- `compliance-channel` — Regulatory reporting (KYC, AML, ESG, DMRV)
- `home-channel` — V12 home channel (37 nodes)
- `provenews-channel` — Content provenance + C2PA
- `battua-home-channel` — Battua master channel

**TRANSACTION channels** (universal — all nodes):
- `battua-p2p-channel` — P2P transfer settlement
- `battua-escrow-channel` — Escrow lock/confirm/release
- `battua-swap-channel` — Stablecoin/CBDC swaps
- `battua-cbdc-channel` — CBDC settlement

**BRIDGE channels**:
- `bridge-channel` — ETH/Polygon/BSC/Avalanche/Solana relay

## Many-to-Many Asset Assignments

An asset isn't confined to one channel. A gold bar might be visible in both:
- `enterprise-channel` with `FULL` visibility + `BUSINESS` access tier (institutional clients)
- `marketplace-channel` with `READ_ONLY` visibility + `SANDBOX` access tier (retail browsers)

### List Channels for an Asset

```java
Map<String, Object> result = client.assets().channelsForAsset("RWA-CO-001");
List<Map<String, Object>> channels = (List<Map<String, Object>>) result.get("channels");
for (var ch : channels) {
    System.out.println(ch.get("channelId") + ": " + ch.get("visibility"));
}
```

```typescript
const { channels } = await client.assets.channelsForAsset('RWA-CO-001');
channels.forEach(ch => console.log(ch.channelId, ch.visibility));
```

```python
result = client.assets.channels_for_asset("RWA-CO-001")
for ch in result["channels"]:
    print(f"{ch['channelId']}: {ch['visibility']}")
```

### List Assets in a Channel

```java
Map<String, Object> result = client.assets().assetsInChannel("enterprise-channel");
System.out.println("Asset count: " + result.get("assetCount"));
```

### Assign an Asset to a Channel (Admin Only)

```
POST /api/v11/asset-channels/{assetId}/assign
{
  "channelId": "marketplace-channel",
  "visibility": "FULL",
  "accessTier": "SANDBOX",
  "metadata": {"displayName": "Gold Bar 001 - Retail"}
}
```

Requires `admin` role. See the [Asset-Channel Assignment API](api-reference/assets.md).

## Visibility Levels

| Level | Grants |
|-------|--------|
| **FULL** | All operations — read, trade, tokenize, settle |
| **READ_ONLY** | Query only — no state changes |
| **METADATA_ONLY** | Name, type, and existence — no price or balance data |

Use `METADATA_ONLY` for public discovery (e.g., showing an asset in search results without exposing financial detail).

## Access Tier Gates

Each channel assignment specifies the minimum SDK tier required to access the asset via that channel:

- `SANDBOX` — free-tier SDK users can access
- `STARTER` — requires paid tier
- `BUSINESS` — requires verified business
- `ENTERPRISE` — requires signed contract

This is how the platform enables freemium models: SANDBOX users see marketplace-channel assets but not enterprise-channel assets.

## Channel-Scoped Queries

Filter asset queries by channel:

```java
Map<String, Object> enterprise = client.assets().listByChannel("enterprise-channel");
Map<String, Object> marketplace = client.assets().listByChannel("marketplace-channel");
```

## See Also

- [Asset-Agnostic Design](asset-agnostic-design.md) — unified query API
- [Tier System](tier-system.md) — how access_tier gates work
- [api-reference/assets.md](api-reference/assets.md) — full API reference
