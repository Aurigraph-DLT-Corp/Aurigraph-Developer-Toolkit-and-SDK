# Aurigraph-DLT V12 Project Context

## Project Overview
- **Path**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT`
- **V11**: `./aurigraph-av10-7/aurigraph-v11-standalone`
- **Portal**: `./enterprise-portal/enterprise-portal/frontend`

## Tech Stack
Quarkus 3.x | Java 21 | gRPC | React 18 | TypeScript | Vite | Ant Design | LevelDB | Playwright

## Quick Commands
```bash
./mvnw quarkus:dev          # Backend :9003/:9004
npm run dev                 # Frontend
npx playwright test         # E2E
```

---

## #infinitecontext

### State: 2025-12-21 | Branch: V12

**V12 Progress**: 85/215 SP (Sprint 1-2 Complete)

**Sprint 1 - Security Hardening (40 SP)** ✓
- BridgeCircuitBreaker, BridgeRateLimiter, FlashLoanDetector
- HQCCryptoService, ChainlinkProofOfReserve
- BridgeSecurityResource.java @ `/api/v12/security/*`

**Sprint 2 - Interoperability (45 SP)** ✓
- CCIPAdapter.java: Chainlink CCIP (5 chains)
- ArbitrumBridge.java: 7-day challenge, retryable tickets
- OptimismBridge.java: OP Stack + Base
- IBCLightClient.java: Cosmos IBC, Tendermint
- InteroperabilityResource.java @ `/api/v12/interop/*`

**ActiveContracts (129 SP)** ✓ - All 9 Sprints

**Next**: Sprint 3 - RWA Token Standards (40 SP)

### Key Files
- `/bridge/security/*` - Circuit breaker, rate limiter, flash loan detector
- `/bridge/adapters/*` - CCIP, Arbitrum, Optimism, IBC
- `/rest/BridgeSecurityResource.java` - Security API
- `/rest/InteroperabilityResource.java` - Cross-chain API

### Commits
```
b5885446 feat: Sprint 2 Cross-Chain Bridge Adapters (45 SP)
98936fdb feat: Sprint 2 Cross-Chain Interoperability REST API
035f03ac feat: Sprint 1 Security Hardening (40 SP)
aea304eb docs: #infinitecontext ActiveContracts complete
10a7d5f1 feat: ActiveContracts Sprint 4-9 (95 SP)
```

### Resume
```bash
git log -5 --oneline && ./mvnw compile -q && ./mvnw quarkus:dev
```
