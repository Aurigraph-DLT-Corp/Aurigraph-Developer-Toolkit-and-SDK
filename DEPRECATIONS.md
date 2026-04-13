# Active Deprecations

Tracks APIs that are deprecated but not yet removed, with target removal versions.

## Policy

- Deprecations warn at runtime starting the MINOR they're introduced
- Removal requires MAJOR version bump
- Minimum 6 months between first deprecation warning and removal
- Deprecation warnings can be silenced via `setDeprecationPolicy(SUPPRESS)` (not recommended)

## Active Deprecations (v1.2.x → v1.3.x → v2.0)

### DEP-001 — `listByUseCase()` will be renamed

**Status**: Active (added in v1.3)
**Removal target**: v2.0

**Current**:
```java
client.assets().listByUseCase("UC_GOLD");  // still works, logs warning
```

**Use instead**:
```java
client.assets().listByUseCaseId("UC_GOLD");  // added in v1.3 as alias
```

### DEP-002 — Direct REST-proxy GraphQL access

**Status**: Active (added in v1.3)
**Removal target**: v2.0

The GraphQL proxy exposes an `X-GraphQL-Proxy-Version` response header that third parties have begun checking. In v2.0 the header is removed as the proxy implementation switches to native SmallRye.

**Current**:
```typescript
const response = await client.graphql.query("{ channels { id } }");
const proxyVersion = response.headers['x-graphql-proxy-version'];  // emits warning
```

**Use instead**: Don't rely on implementation headers. The `data`/`errors` envelope is stable.

### DEP-003 — `enableAutoHeartbeat` default changes

**Status**: Will be deprecated in v1.4, removed in v2.0

**Current**: Default is `true`

**v2.0**: Default becomes `false` (opt-in explicit). Clients that rely on auto-heartbeat must set `enableAutoHeartbeat(true)` explicitly.

**Rationale**: For short-lived CLI usage, auto-heartbeat creates zombie threads. Making it explicit surfaces the tradeoff.

### DEP-004 — Legacy `X-API-Key` header

**Status**: Long-deprecated (since v1.0)
**Removal target**: v2.0

**Old**:
```
X-API-Key: aG8VN7aV...
```

**New** (since v1.1):
```
Authorization: ApiKey bc2ce4fa:aG8VN7aV...
```

The paired format binds the key to an application ID, preventing key sharing across apps.

### DEP-005 — Python 3.9 support

**Status**: Will be deprecated in v1.4, removed in v2.0

Python 3.9 reaches end-of-life October 2025. After that, installing `aurigraph-sdk` on 3.9 logs a deprecation warning. v2.0 drops 3.9 entirely.

**Migration**: `pyenv install 3.12 && pyenv local 3.12` (or 3.10+).

### DEP-006 — Adapter untyped responses

**Status**: Will be deprecated in v1.4, removed in v2.0

TypeScript adapter methods returning `Record<string, unknown>` will be replaced with typed responses. v1.4 adds typed versions under new method names; original methods emit warnings.

## Removed in v1.2.0 (for reference)

### REMOVED-001 — `client.gold()` namespace

**Removed**: v1.2.0
**Replacement**: `client.assets().listByUseCase("UC_GOLD")`
**Migration**: See [docs/migration/v1-to-v2.md](docs/migration/v1-to-v2.md#1-remove-goldapi-shim-already-removed-in-12)

## How to Suppress Warnings (Not Recommended)

If you're preparing for a migration and want to silence warnings temporarily:

```java
// Java
AurigraphClient client = AurigraphClient.builder()
    .deprecationPolicy(DeprecationPolicy.SUPPRESS)
    .build();
```

```typescript
// TypeScript
const client = new AurigraphClient({
  deprecationPolicy: 'suppress',
});
```

```python
# Python
import warnings
warnings.filterwarnings('ignore', category=DeprecationWarning, module='aurigraph_sdk')
```

```rust
// Rust
let client = AurigraphClient::builder()
    .deprecation_policy(DeprecationPolicy::Suppress)
    .build()?;
```

Don't ship with warnings suppressed — you'll be surprised by the v2.0 break.

## Tracking Deprecation Status

Run the compatibility linter to see which deprecations your code triggers:

```bash
# TypeScript
npx aurigraph-migrate check

# Python
python -m aurigraph_sdk.migrate

# Java (via Maven plugin)
mvn io.aurigraph:aurigraph-migrate-plugin:check
```

## See Also

- [SEMVER.md](SEMVER.md) — versioning policy
- [BREAKING_CHANGES.md](BREAKING_CHANGES.md) — authoritative list of v2.0 breaks
- [CHANGELOG.md](CHANGELOG.md) — release history
- [docs/migration/v1-to-v2.md](docs/migration/v1-to-v2.md) — migration guide
