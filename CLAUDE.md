# Aurigraph-DLT V12 Project Context

## Project Overview
- **Repository**: Aurigraph-DLT (V12 Branch)
- **Path**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT`
- **V11 Standalone**: `./aurigraph-av10-7/aurigraph-v11-standalone`
- **Enterprise Portal**: `./enterprise-portal/enterprise-portal/frontend`

## Tech Stack
| Layer | Technology |
|-------|------------|
| Backend | Quarkus 3.x, Java 21, gRPC, Protobuf |
| Frontend | React 18, TypeScript, Vite, Ant Design |
| Storage | LevelDB, PostgreSQL |
| Streaming | gRPC-Web (no Envoy), SSE fallback |
| Testing | Playwright E2E, JUnit |

## Quick Commands
```bash
./mvnw quarkus:dev                    # Backend (ports 9003, 9004)
cd enterprise-portal/.../frontend && npm run dev  # Frontend
npx playwright test                   # E2E tests
```

---

## #infinitecontext - Compacted Session Archive

### Current State: 2025-12-21
**Branch**: V12 | **Status**: Active Development

#### Completed Milestones:
| Feature | Status | Key Commits |
|---------|--------|-------------|
| WebSocket → gRPC Migration | ✅ Complete | 49 WS files deleted |
| Live SSE Streaming | ✅ Complete | LiveStreamingResource.java |
| Multi-Node Infrastructure | ✅ Complete | docker-compose.multi-node.yml |
| V12 Node Architecture | ✅ Complete | EI/Business/Validator nodes |
| External API Integrations | ✅ Complete | Twitter/Weather/News |
| E2E Test Fixes | ✅ Complete | CSS selectors, ports |
| Infrastructure Monitoring | ✅ Complete | Multi-server health checks |

#### Active Architecture:
```
Browser ──grpc-web──> Quarkus:9004 (gRPC)
        └──SSE─────> Quarkus:9003 (REST /api/v12/stream/*)
```

#### Key Streaming Endpoints:
| Endpoint | Interval | Data |
|----------|----------|------|
| `/api/v12/stream/transactions` | 500ms | tx hash, amount, gas |
| `/api/v12/stream/metrics` | 1s | TPS, memory, latency |
| `/api/v12/stream/consensus` | 2s | PBFT phases |
| `/api/v12/stream/validators` | 3s | 10 validators |
| `/api/v12/stream/network` | 5s | 50-70 nodes |

#### Critical Fix Reference:
- **LiveMetricsDashboard.tsx**: Rename `metrics` → `displayMetrics` (variable conflict)
- **gRPC imports**: `WebSocketAuthService` → `AuthTokenService`
- **pom.xml**: Remove `quarkus-grpc-web` dep, use config instead

#### Recent Commits (2025-12-21):
```
c597c483 feat: Multi-server infrastructure monitoring with health checks
1cd198f9 chore: Complete WebSocket cleanup and compact #infinitecontext
3704177a fix: E2E test CSS selector and port fixes
a6a926bb feat: Twitter, Weather, News API integrations
c6e9efe0 feat: Multi-node infrastructure
3936fb24 feat: V12 node architecture + enterprise dashboards
```

#### Infrastructure Monitoring Endpoints:
| Endpoint | Purpose |
|----------|---------|
| `/api/v12/infrastructure/servers` | All servers health status |
| `/api/v12/infrastructure/servers/{id}/health` | Individual server health |
| `/api/v12/infrastructure/servers/{id}/ports` | Port status scan |
| `/api/v12/infrastructure/overview` | Complete infrastructure overview |

---

### Archived Sessions (2025-12-21)

<details>
<summary>WebSocket to gRPC Migration (Completed)</summary>

**Summary**: Full migration from WebSocket to gRPC/Protobuf/HTTP2 streaming.

**API Mapping**:
- `/ws/*` endpoints → `StreamingService.stream*()` gRPC methods
- `useWebSocket()` hook → `useMetricsStream()`, `useTransactionStream()`

**Created**: streaming.proto, StreamingServiceImpl.java, GrpcStreamManager.java, grpcService.ts, useGrpcStream.ts

**Deleted**: 49 WebSocket files (backend), 2 WebSocket files (frontend)

**Benefits**: 60-70% bandwidth reduction, type safety, no Envoy proxy needed
</details>

<details>
<summary>Live Data Streaming (Completed)</summary>

**Summary**: SSE streaming endpoints serving live blockchain data.

**Created**: LiveStreamingResource.java with 5 SSE endpoints

**Data Sources**: Real JVM metrics, simulated TPS (500K-2.5M), PBFT consensus phases, validator reputation/stake/uptime
</details>

---

### Resume Protocol
1. `git log -5 --oneline` - Check recent commits
2. `git status --short` - Check pending changes
3. `./mvnw quarkus:dev` - Start backend
4. Review this #infinitecontext section
