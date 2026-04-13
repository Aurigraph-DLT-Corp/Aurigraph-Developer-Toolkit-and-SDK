# Semantic Versioning Policy

The Aurigraph Developer Toolkit & SDK follows [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html) strictly.

## Version Format

`MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]`

Examples:
- `1.2.0` — current stable
- `1.3.0-rc.1` — release candidate
- `2.0.0-beta.2` — beta for major release
- `1.3.0+build.20260415` — build metadata

## Bump Rules

### MAJOR (x.0.0) — Breaking

Bump when:
- Removing public APIs, types, or methods
- Changing method signatures in incompatible ways
- Changing response shapes (removing fields, changing types)
- Raising minimum language/runtime version
- Changing default behavior in ways that break consumers

**Release cadence**: Annual (with 6-month deprecation notice)

### MINOR (1.x.0) — Backward-Compatible Features

Bump when:
- Adding new public APIs, types, or methods
- Adding optional parameters
- Adding new response fields (consumers must tolerate unknown fields)
- Deprecating APIs (but not removing)
- Increasing MSRV for Rust (not language version for others)

**Release cadence**: Quarterly

### PATCH (1.2.x) — Backward-Compatible Fixes

Bump when:
- Bug fixes that don't change behavior contracts
- Performance improvements without API changes
- Documentation updates
- Dependency updates that are themselves patch-level

**Release cadence**: Monthly (or as-needed for critical fixes)

## Pre-release Identifiers

| Suffix | Stage | Stability |
|--------|-------|-----------|
| `-alpha.N` | Internal testing | Unstable, rapid changes |
| `-beta.N` | Public preview | Feature-complete, API may shift |
| `-rc.N` | Release candidate | API frozen, only bug fixes |

Pre-release versions are never default-installed by package managers. Consumers must opt in:

```bash
npm install @aurigraph/dlt-sdk@2.0.0-rc.1
pip install aurigraph-sdk==2.0.0rc1
```

## Version Compatibility Matrix

### SDK ↔ Platform API

| SDK | Platform API | Min Platform | Notes |
|-----|--------------|--------------|-------|
| 1.0.x | V11 | v12.0 | Initial release |
| 1.1.x | V11 | v12.0 | Adapters + CLI |
| 1.2.x | V11 | v12.1.52 | Asset-agnostic, new namespaces |
| 1.3.x | V11 | v12.1.52 | Python SDK, GraphQL enhancements |
| 2.0.x | V12+ | v13.0+ | New REST paths, breaking |

Platform V12 continues supporting V11 SDKs through 2027.

### Language Runtimes

| Package | v1.x | v2.x |
|---------|------|------|
| Java | 17 LTS+ | 21 LTS+ |
| Python | 3.9+ | 3.10+ |
| TypeScript/Node | Node 18+ | Node 20+ |
| Rust | 1.70+ | 1.80 (MSRV) |

## Deprecation Lifecycle

All breaking changes go through a deprecation cycle:

```
v1.2 — API added
v1.3 — @Deprecated annotation + runtime warning
v1.4 — deprecation persists, warning intensifies
...    — at least 6 months in deprecated state
v2.0 — API removed
```

We do not remove APIs in PATCH or MINOR releases. Ever.

## What Isn't Versioned

These are NOT part of the SemVer contract:

- **Internal utilities** (`internal/`, `_private`, or starts with `_`)
- **Performance characteristics** — we optimize freely
- **Log messages** (content can change, log levels may shift)
- **Error messages** (stable `errorCode` is versioned, `detail` text may change)
- **Generated code** (regenerated from proto/OpenAPI, may shift)
- **Bundled dependencies** (we upgrade transitive deps liberally)

## Release Channels

| Channel | Tag | Who Installs |
|---------|-----|--------------|
| `stable` | `@latest` (npm), `1.2` (pip) | Production users |
| `beta` | `@beta` | Early adopters |
| `nightly` | `@next` | SDK contributors |

The `stable` channel only receives MAJOR/MINOR/PATCH releases that have passed full CI + soak testing.

## Backward Compatibility Promise

For v1.x we commit that:

1. **Code compiled against 1.0 runs on 1.x** (no ABI breaks)
2. **JSON responses remain decodable** by older SDKs (new fields are additive)
3. **Endpoint URLs are stable** (no path changes within a MAJOR version)
4. **Error codes are stable** (codes may be added, never renumbered)
5. **Authentication headers are stable** (`ApiKey` format never changes within MAJOR)

Breaking these invariants requires a MAJOR bump.

## For SDK Contributors

When submitting a PR that changes the public API:

1. Label with `semver-major`, `semver-minor`, or `semver-patch`
2. Update `CHANGELOG.md` in the `[Unreleased]` section
3. If MAJOR, update `BREAKING_CHANGES.md` + `docs/migration/v1-to-v2.md`
4. If deprecating, update `DEPRECATIONS.md` with target removal version

CI will block merge if the label doesn't match the actual change type (detected via API diff).

## See Also

- [CHANGELOG.md](CHANGELOG.md) — release notes
- [BREAKING_CHANGES.md](BREAKING_CHANGES.md) — v2.0 breaking list
- [DEPRECATIONS.md](DEPRECATIONS.md) — active deprecations
