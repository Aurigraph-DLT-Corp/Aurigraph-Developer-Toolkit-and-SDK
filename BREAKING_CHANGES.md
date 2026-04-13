# Breaking Changes

Authoritative list of breaking changes planned for v2.0.

See [docs/migration/v1-to-v2.md](docs/migration/v1-to-v2.md) for migration guidance with before/after examples.

## Status Legend

- 🟢 **Planned** — in the v2.0 backlog, not yet applied
- 🟡 **In v1.3 preview** — opt-in via `enableV2Preview: true`, emits deprecation warning
- 🔴 **Applied** — already broken (removed or changed)

## Summary Table

| ID | Change | Status | Deprecated since | Target removal |
|----|--------|--------|------------------|----------------|
| BC-001 | `client.gold()` → `client.assets()` | 🔴 Applied | 1.1 | **removed 1.2.0** |
| BC-002 | Consolidate `Transaction` + `TransactionReceipt` | 🟢 Planned | — | 2.0 |
| BC-003 | Rename `listByUseCase` → `listByUseCaseId` | 🟢 Planned | — | 2.0 (alias in 1.3) |
| BC-004 | Python MSRV 3.9 → 3.10 | 🟢 Planned | — | 2.0 |
| BC-005 | Java MSRV 17 → 21 LTS | 🟢 Planned | — | 2.0 |
| BC-006 | Rust commit MSRV 1.80 | 🟢 Planned | — | 2.0 |
| BC-007 | Mint response adds required fields | 🟢 Planned | — | 2.0 |
| BC-008 | TypeScript default ESM (CJS separate pkg) | 🟢 Planned | — | 2.0 |
| BC-009 | Remove REST-proxy GraphQL | 🟢 Planned | 1.3 | 2.0 |
| BC-010 | Adapter API typed responses | 🟢 Planned | 1.3 | 2.0 |

## Details

### BC-001 — `GoldApi` → `AssetsApi`

**Status**: 🔴 Applied in v1.2.0

**Old**:
```java
client.gold().getPublicLedger();
```

**New**:
```java
client.assets().getPublicLedger("UC_GOLD");
```

**Rationale**: Asset-agnostic design. With 16+ RWAT use cases, per-class APIs don't scale. See [asset-agnostic-design.md](docs/asset-agnostic-design.md).

---

### BC-002 — Unified Transaction type

**Status**: 🟢 Planned for v2.0

The current dual-type design causes confusion:
- `Transaction` — what you submit
- `TransactionReceipt` — what you get back

**v1.x**:
```typescript
const tx: TransactionSubmit = { from, to, amount };
const result: TransactionReceipt = await client.transactions.submit(tx);
// Transaction and TransactionReceipt have overlapping but different fields
```

**v2.0**:
```typescript
const tx: Transaction = { from, to, amount };
const result: Transaction = await client.transactions.submit(tx);
// Single type. Post-submit fields populated in `result.receipt`.
```

**Migration**: The v2.0 code-mod auto-detects and rewrites usage. Manual migration:
1. Replace `TransactionReceipt` → `Transaction` in type annotations
2. Change `receipt.txHash` → `tx.receipt.txHash`

---

### BC-003 — Parameter naming

**Status**: 🟢 Planned for v2.0 (alias added in v1.3)

Makes parameter semantics explicit.

**v1.x**:
```java
client.assets().listByUseCase("UC_GOLD");  // ambiguous: is UC_GOLD an ID or an enum?
```

**v2.0**:
```java
client.assets().listByUseCaseId("UC_GOLD");  // clear: it's an ID
```

---

### BC-004/005/006 — Language runtime bumps

| SDK | v1.x min | v2.0 min | Reason |
|-----|----------|----------|--------|
| Python | 3.9 | 3.10 | Native `X \| None` syntax, `match` statements |
| Java | 17 LTS | 21 LTS | Virtual threads, pattern matching, records |
| Rust | 1.70 | 1.80 (MSRV) | Stabilized async features |

**Migration**: Upgrade your language runtime before upgrading the SDK.

---

### BC-007 — Mint response additive fields become required

**Status**: 🟢 Planned for v2.0

v1.x mint responses have optional billing fields. v2.0 makes them required so consumers can always show quota info.

**v1.x**:
```json
{ "mintId": "...", "txHash": "...", "amount": 100 }
```

**v2.0**:
```json
{
  "mintId": "...",
  "txHash": "...",
  "amount": 100,
  "quotaConsumed": { "mints": 1, "operations": 3 },
  "tierBefore": "SANDBOX",
  "tierAfter": "SANDBOX"
}
```

**Migration**: Regenerate typed models. Existing ignore-unknown-fields deserialization continues to work — this only breaks code that explicitly checks for absence of these fields.

---

### BC-008 — TypeScript ESM default

**Status**: 🟢 Planned for v2.0

**v1.x**: Dual package (CJS + ESM) in `@aurigraph/dlt-sdk`

**v2.0**: ESM-only in `@aurigraph/dlt-sdk`; separate `@aurigraph/dlt-sdk-cjs` for legacy

**Migration**:
- Modern projects (Node 20+, Vite, Next.js): no change
- Legacy CJS projects: `npm install @aurigraph/dlt-sdk-cjs`

---

### BC-009 — Remove REST-proxy GraphQL

**Status**: 🟢 Planned for v2.0

v1.3 migrates the backend GraphQL to native SmallRye. The transitional REST-proxy stays in v1.3.x for compatibility, then is removed in v2.0.

**Impact**: Endpoint `/api/v11/graphql` continues to work — only internal implementation changes. You shouldn't notice unless you're parsing debug headers.

---

### BC-010 — Typed adapter responses

**Status**: 🟢 Planned for v2.0

TypeScript adapters (Battua, Provenews, Hermes) currently return `Record<string, unknown>`. v2.0 adds generated typed responses.

**v1.x**:
```typescript
const asset: Record<string, unknown> = await battua.wallet.getBalance(addr);
const balance = asset.balance as number;  // unsafe cast
```

**v2.0**:
```typescript
const asset: WalletBalance = await battua.wallet.getBalance(addr);
const balance = asset.balance;  // typed
```

**Migration**: Remove `as X` casts after upgrade. TypeScript will catch remaining issues at compile time.

## Non-Breaking Additions in v2.0

These are new features (MINOR would suffice, but bundled with v2.0 for coherent release):

- New `client.stream` namespace for real-time events (WebSocket/SSE)
- Native gRPC client (`client.grpc()` — opt-in)
- iOS + Android SDKs promoted from scaffold to production
- Rust SDK published to crates.io

## See Also

- [SEMVER.md](SEMVER.md) — versioning policy
- [docs/migration/v1-to-v2.md](docs/migration/v1-to-v2.md) — migration guide
- [DEPRECATIONS.md](DEPRECATIONS.md) — current deprecations
- [CHANGELOG.md](CHANGELOG.md) — release history
