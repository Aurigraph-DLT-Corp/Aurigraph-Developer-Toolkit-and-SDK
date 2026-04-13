# Changelog

All notable changes to the Aurigraph Developer Toolkit & SDK are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Python async client (`AsyncAurigraphClient`) with httpx.AsyncClient
- Rust SDK remaining 10 namespaces (tier, governance, wallet, compliance, nodes, channels, transactions, dmrv, contracts, graphql)
- iOS SDK Swift Package (v1.0 scaffold — Package.swift, actor-based AurigraphClient, AssetsAPI/HandshakeAPI/GdprAPI, Codable Models, XCTest suite)
- Android SDK Kotlin module (v1.0 scaffold — directory structure only, full implementation pending)
- Complete documentation site with MkDocs config, 12 concept docs, 4 SDK-specific docs, migration guide
- SEMVER.md, CHANGELOG.md, BREAKING_CHANGES.md, DEPRECATIONS.md policies
- GitHub Actions CI/CD workflows (ci.yml, release-java.yml, release-npm.yml, release-pypi.yml, release-crates.yml, security-scan.yml)
- Dependabot configuration for Maven, npm, pip, Cargo, GitHub Actions
- Issue templates + PR template
- RELEASE.md release process documentation

### Planned for v1.3
- SmallRye GraphQL backend migration (replaces REST-proxy)
- WebSocket/SSE streaming namespace
- Full Python + Rust + iOS + Android test coverage (≥80%)

---

## [1.2.0] — 2026-04-12

### Added
- **Asset-agnostic `AssetsApi`** — unified query API replacing per-asset-class methods
  - `query()`, `list()`, `get()`, `listByUseCase()`, `listByType()`, `listByChannel()`
  - `useCaseSummary()`, `typeSummary()`
  - `channelsForAsset()`, `assetsInChannel()`, `listDerivedTokens()`
- **7 new namespace APIs**: `gdpr`, `graphql`, `tier`, `governance`, `wallet`, `compliance`, `assets`
- **Multi-channel asset assignments** — assets can be visible in multiple channels simultaneously
- **4-tier SDK partner system** (SANDBOX/STARTER/BUSINESS/ENTERPRISE) with progressive rate limits and scope sets
- **SDK handshake protocol** — hello, heartbeat, capabilities, config endpoints
- **GraphQL REST-proxy gateway** — accepts GraphQL queries, delegates to REST endpoints
- **GDPR data export + erasure APIs** with patented encrypted-tombstone mechanism (PCT-AUR-011)
- **17 new Java DTOs + 17 new TypeScript interfaces** for all new APIs
- Standalone repo migration: `github.com/Aurigraph-DLT-Corp/Aurigraph-Developer-Toolkit-and-SDK`

### Changed
- Moved SDK code from monorepo `aurigraph-sdk/` to dedicated repository
- `client.gold()` replaced by asset-agnostic `client.assets().listByUseCase("UC_GOLD")`

### Removed
- **BREAKING**: `GoldApi` class — use `AssetsApi.listByUseCase("UC_GOLD")` instead

### Security
- API key rotation now supports 7-day overlap window (zero-downtime rotation)

---

## [1.1.0] — 2026-02-15

### Added
- **Project adapters** (TypeScript): Battua, Provenews, Hermes — domain-specific type-safe wrappers
- **CLI wizard** (`npx @aurigraph/dlt-sdk tokenize`) for scaffolding new integrations
  - Framework detection (Next.js, Vite, Express, Quarkus)
  - Auto-generated config, service, and example files
- **Offline queue** with durable request replay and exponential backoff
- **SHA-256 idempotency keys** auto-generated for POST/PUT operations
- Typed empty fallbacks on all hook call sites (Session #117 pattern)

### Fixed
- Handshake protocol CLI integration
- Battua adapter endpoint path corrections (INS-BATTUA-7)

---

## [1.0.0] — 2025-12-18

### Added
- Initial public release of Java + TypeScript SDKs
- **7 namespace APIs**: NodesApi, RegistriesApi, ChannelsApi, TransactionsApi, DmrvApi, ContractsApi, SdkHandshakeApi
- Java client: Jackson + `java.net.http.HttpClient` (zero external HTTP deps)
- TypeScript client: fetch-based (zero runtime deps)
- Java package: `io.aurigraph.dlt:aurigraph-sdk`
- TypeScript package: `@aurigraph/dlt-sdk`
- Handshake protocol for 3rd-party integrations
- RFC 7807 error responses
- Basic retry logic with exponential backoff
- OpenAPI-conformant request/response types

---

## Version Links

- [Unreleased] https://github.com/Aurigraph-DLT-Corp/Aurigraph-Developer-Toolkit-and-SDK/compare/v1.2.0...HEAD
- [1.2.0] https://github.com/Aurigraph-DLT-Corp/Aurigraph-Developer-Toolkit-and-SDK/releases/tag/v1.2.0
- [1.1.0] https://github.com/Aurigraph-DLT-Corp/Aurigraph-Developer-Toolkit-and-SDK/releases/tag/v1.1.0
- [1.0.0] https://github.com/Aurigraph-DLT-Corp/Aurigraph-Developer-Toolkit-and-SDK/releases/tag/v1.0.0
