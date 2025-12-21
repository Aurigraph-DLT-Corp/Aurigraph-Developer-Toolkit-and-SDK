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

**Completed**: WebSocket→gRPC, SSE Streaming, Multi-Node Infra, V12 Nodes, API Integrations, E2E Fixes, Infra Monitoring, **ActiveContracts (129 SP)**

**ActiveContracts**: All 9 Sprints Complete (129 SP)
- Sprint 1-3: Core Data Model + Wizard (34 SP)
- Sprint 4-7: Signatures/Tokens/VVB/Triggers (62 SP)
- Sprint 8-9: Frontend + Tests (33 SP)

**Architecture**: `Browser ──gRPC-web──> :9004` | `──SSE──> :9003/api/v12/stream/*`

**Key Files**: SignatureWorkflowResource.java, TokenBindingResource.java, VVBVerificationResource.java, TriggerExecutionResource.java

### Commits
```
10a7d5f1 feat: ActiveContracts Sprint 4-9 (95 SP)
48f57b44 docs: #infinitecontext ActiveContracts Sprint 1-3
c597c483 feat: Multi-server infrastructure monitoring
3704177a fix: E2E CSS selectors/ports
a6a926bb feat: Twitter/Weather/News APIs
```

### Resume
```bash
git log -5 --oneline && git status --short && ./mvnw quarkus:dev
```
