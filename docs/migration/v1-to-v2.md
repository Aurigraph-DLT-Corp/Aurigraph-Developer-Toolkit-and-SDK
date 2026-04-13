# Migration Guide: v1.x → v2.0

**Target release**: Q4 2026 (tentative)
**Status**: Planning — breaking changes listed here are under review

This guide tracks planned breaking changes for v2.0 so you can prepare integrations. Nothing here is in effect yet.

## Deprecation Timeline

- **April 2026** — v1.2.0 released (current)
- **Q3 2026** — v1.3.x series, deprecation warnings added
- **Q4 2026** — v2.0.0 release, deprecations removed

All deprecated APIs will emit runtime warnings in v1.3.x for at least 6 months before removal.

## Planned Breaking Changes

### 1. Remove `GoldApi` shim (already removed in 1.2)

`client.gold()` was removed in v1.2.0 in favor of asset-agnostic `client.assets().listByUseCase("UC_GOLD")`. v2.0 removes all residual references in types.

**v1.x**:
```java
client.gold().getPublicLedger();  // removed in 1.2
```

**v2.0**:
```java
client.assets().getPublicLedger("UC_GOLD");
```

### 2. Consolidate `Transaction` vs `TransactionReceipt`

Current state: two types for the same concept, differing by context.

**v2.0**: Single `Transaction` record with optional `ReceiptDetails` field.

**v1.x**:
```java
Transaction tx = client.transactions().get(id);
TransactionReceipt receipt = client.transactions().getReceipt(id);
// two different types, partly overlapping
```

**v2.0**:
```java
Transaction tx = client.transactions().get(id);
Optional<ReceiptDetails> receipt = tx.receipt();
```

### 3. Rename `listByUseCase(id)` → `listByUseCaseId(id)`

Parameter name clarity — it's always an ID, never an object.

**v1.x**:
```java
client.assets().listByUseCase("UC_GOLD");
```

**v2.0**:
```java
client.assets().listByUseCaseId("UC_GOLD");
```

v1.3.x will add `listByUseCaseId()` as an alias. v2.0 removes `listByUseCase()`.

### 4. Python: drop 3.9, require 3.10+

Enable modern type syntax (`dict[str, X]`, `X | None`, `match` statements) without `__future__` imports.

### 5. Java: drop 17, require 21 LTS+

Virtual threads, pattern matching, records enhancements require 21+.

### 6. Rust: commit MSRV 1.80

First stable MSRV commitment at v1.0 release. MSRV increases become MINOR version bumps (not PATCH).

### 7. Mint response shape changes

The response from mint operations gains new required fields (`quotaConsumed`, `tierBefore`, `tierAfter`). SDK models need regeneration.

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

### 8. TypeScript: drop CommonJS default

v2.0 ships ESM-only by default. A separate `@aurigraph/dlt-sdk-cjs` package provides CommonJS for legacy environments.

### 9. Remove REST-proxy GraphQL

v1.3 migrates GraphQL to native SmallRye. v2.0 removes the REST-proxy fallback path.

### 10. Adapter API changes

The Battua, Provenews, Hermes adapters gain typed responses (currently return `Record<string, unknown>`). Rename a few methods for consistency.

## Migration Checklist

When you upgrade to v2.0:

```bash
# 1. Upgrade language runtime
#    Python: ensure 3.10+
#    Java: ensure 21 LTS+
#    TypeScript: ensure Node 20+
#    Rust: ensure 1.80+

# 2. Update package version
npm install @aurigraph/dlt-sdk@2.0
pip install 'aurigraph-sdk>=2.0,<3.0'

# 3. Run compatibility linter (v2.0 only)
npx aurigraph-migrate check   # TypeScript
python -m aurigraph_sdk.migrate  # Python

# 4. Apply code-mods
npx aurigraph-migrate apply   # auto-fixes most call sites

# 5. Run your test suite
# Any runtime warnings from v1.3.x should be resolved first

# 6. Deploy to staging
#    Verify handshake, health, smoke tests

# 7. Deploy to production with rolling release
```

## Compatibility Notes

- **Wire protocol is unchanged** — v1 and v2 SDKs both speak the V11 API
- **Platform backward compat** — v12 platform continues supporting v1 SDKs through 2027
- **You don't have to upgrade in lock-step** — mix v1 and v2 SDKs in different services

## Opt-in Preview

v1.3.x ships v2.0 APIs behind feature flags. Try before committing:

```java
AurigraphClient client = AurigraphClient.builder()
    .baseUrl(...)
    .apiKey(...)
    .enableV2Preview(true)  // opt in
    .build();

// v2 method names work, v1 method names emit warnings
client.assets().listByUseCaseId("UC_GOLD");
```

## Getting Help

- **Code-mods not covering your case?** Open issue with `v2-migration` label
- **Breaking change feels wrong?** Request a deprecation extension on the ADTS board (ADTS-24)
- **Integration support?** BUSINESS/ENTERPRISE tiers get migration assistance

## See Also

- [SEMVER.md](../../SEMVER.md) — versioning policy
- [CHANGELOG.md](../../CHANGELOG.md) — full history
- [BREAKING_CHANGES.md](../../BREAKING_CHANGES.md) — authoritative list
- [DEPRECATIONS.md](../../DEPRECATIONS.md) — active deprecations
