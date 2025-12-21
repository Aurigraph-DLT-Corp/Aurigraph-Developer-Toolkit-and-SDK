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

**Completed**: WebSocket→gRPC, SSE Streaming, Multi-Node Infra, V12 Nodes, API Integrations, E2E Fixes, Infra Monitoring

**ActiveContracts**: Sprint 1-3 Done (34 SP) | Sprint 4+ Pending (95 SP)

**Architecture**: `Browser ──gRPC-web──> :9004` | `──SSE──> :9003/api/v12/stream/*`

**Key Files**: LiveStreamingResource.java, streaming.proto, docker-compose.multi-node.yml

### Commits
```
48f57b44 docs: #infinitecontext ActiveContracts Sprint 1-3
c597c483 feat: Multi-server infrastructure monitoring
3704177a fix: E2E CSS selectors/ports
a6a926bb feat: Twitter/Weather/News APIs
c6e9efe0 feat: Multi-node infrastructure
```

### Resume
```bash
git log -5 --oneline && git status --short && ./mvnw quarkus:dev
```
