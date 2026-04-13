# Asset-Agnostic Design

One of the SDK's most important architectural decisions: **a single, parameterized API handles all 16 RWAT use cases** instead of 16 separate classes.

## The Problem It Solves

Naive SDK design would create one class per asset type:

```java
// Anti-pattern — don't do this
client.gold().getPublicLedger();
client.carbon().getCredits();
client.realEstate().listProperties();
client.art().getCollections();
// ... 16 more classes
```

As use cases grow from 16 to 50+, this approach:
- Requires a new SDK release for every new asset type
- Forces developers to learn 16 different APIs
- Creates 16x duplication in HTTP clients, retry logic, auth code
- Fractures the type system — each class has unique models
- Explodes the public API surface (measured in thousands of methods)

## The Solution

A single `AssetsApi` with parameterized queries:

```java
// Asset-agnostic — one API, all use cases
client.assets().listByUseCase("UC_GOLD");
client.assets().listByUseCase("UC_CARBON");
client.assets().listByType("COMMODITY");
client.assets().query(useCase, type, status, channelId, 50, 0);
client.assets().getComplianceStatus(assetId, "MiCA");
```

Adding a new use case requires **zero SDK changes** — just a new `useCaseId` enum value in the backend.

## Mapping to REST

The SDK delegates to a single backend endpoint:

```
GET /api/v11/rwa/query?useCase={uc}&type={t}&status={s}&channelId={c}&limit={n}&offset={o}
```

All asset-specific semantics live in backend service classes (`GoldTradingService`, `CarbonComplianceService`, etc.), not in the SDK. The SDK stays thin and stable across platform releases.

## Methods

| Method | Purpose |
|--------|---------|
| `query(...)` | Parameterized filter — any combination of useCase, type, status, channelId |
| `list()` | All assets, any type |
| `get(assetId)` | Single asset by ID (returns raw JSON map — fields depend on type) |
| `listByUseCase(ucId)` | Filter by use case enum value |
| `listByType(type)` | Filter by asset type (COMMODITY, REAL_ESTATE, CARBON_CREDIT, etc.) |
| `listByChannel(chId)` | Filter by channel membership (see [Multi-Channel](multi-channel.md)) |
| `useCaseSummary()` | Grouped counts per use case |
| `typeSummary()` | Grouped counts per asset type |
| `channelsForAsset(id)` | Which channels an asset is visible in |
| `assetsInChannel(chId)` | All assets in a given channel |
| `listDerivedTokens(id)` | Secondary tokens derived from an asset |
| `getComplianceStatus(id, framework)` | Asset's status against a compliance framework |

## Use Cases Supported

All 16 RWAT use cases are accessed through the same API surface:

| `useCaseId` | Description |
|-------------|-------------|
| UC_GOLD | Gold tokenization (COMMODITY) |
| UC_REAL_ESTATE | Real estate deeds |
| UC_CARBON | Carbon credits |
| UC_ESG | ESG compliance tokens |
| UC_IP | Intellectual property licenses |
| UC_ART | Art & collectibles |
| UC_INFRASTRUCTURE | Infrastructure projects |
| UC_CONTENT | Content provenance (C2PA) |
| UC_SUPPLY_CHAIN | Supply chain assets |
| UC_HEALTHCARE | Healthcare records |
| UC_AGRI | Agricultural commodities |
| UC_TRADE_FINANCE | Trade finance instruments |
| UC_WATER | Water rights |
| UC_ROYALTY | Royalty streams |
| UC_PE_VC | Private equity / VC |
| UC_BATTERY_AADHAR | Battery lifecycle (BaaS) |

## Working with Dynamic Responses

Because different use cases return different fields, `get(assetId)` returns `Map<String, Object>` (Java) / `Record<string, unknown>` (TS) / `dict` (Python). Use typed helpers when you know the use case:

```typescript
const asset = await client.assets.get(assetId);

if (asset.useCase === 'UC_GOLD') {
  // Gold-specific fields guaranteed
  const weightOz = asset.weightOz as number;
  const purity = asset.purity as string;
}
```

The SDK deliberately doesn't generate 16 typed response classes — that would recreate the problem asset-agnostic design solves. If you want strong types for a specific use case, use the GraphQL endpoint with fragment typing.

## See Also

- [Multi-Channel](multi-channel.md) — channel-scoped asset queries
- [Tier System](tier-system.md) — quota limits per use case
- [GraphQL](graphql.md) — strongly-typed queries
