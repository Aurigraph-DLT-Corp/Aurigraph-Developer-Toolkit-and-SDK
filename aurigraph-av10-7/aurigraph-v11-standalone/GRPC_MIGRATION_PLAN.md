# gRPC-Web/HTTP/2 Migration Plan
## Replacing WebSockets with gRPC Streaming for 2M+ TPS Platform

**Document Version**: 1.0
**Created**: November 26, 2025
**Project**: Aurigraph V12 (AV11 JIRA Board)
**Target Completion**: Sprint 19-24 (6 sprints, ~12 weeks)

---

## Executive Summary

This document outlines the migration from WebSocket-based real-time communication to gRPC-Web with Protobuf+HTTP/2. This migration will deliver:

- **60-70% bandwidth reduction** (Protobuf vs JSON serialization)
- **Type-safe communication** (auto-generated TypeScript + Java clients)
- **Better performance** for 2M+ TPS target (lower serialization overhead)
- **Improved infrastructure** (HTTP/2 multiplexing, better load balancing)
- **Enterprise-grade reliability** (built-in flow control, backpressure)

**Migration Strategy**: Phased approach with parallel running (WebSocket + gRPC) during transition.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Target Architecture](#2-target-architecture)
3. [Migration Phases](#3-migration-phases)
4. [JIRA Epic & Story Structure](#4-jira-epic--story-structure)
5. [Technical Implementation](#5-technical-implementation)
6. [Testing Strategy](#6-testing-strategy)
7. [Rollback Plan](#7-rollback-plan)
8. [Success Metrics](#8-success-metrics)

---

## 1. Current State Analysis

### 1.1 Existing WebSocket Infrastructure

**Backend WebSocket Endpoints** (52 Java files identified):
```
/api/v11/portal/websocket          - Enterprise Portal
/api/v11/live/stream                - Live stream
/ws/transactions                    - Transaction updates
/ws/channels                        - Channel updates
/ws/network                         - Network topology
/ws/consensus                       - Consensus state
/ws/validators                      - Validator status
/ws/metrics                         - Performance metrics
```

**Frontend WebSocket Hooks** (20 TypeScript files):
- `useEnhancedWebSocket.ts`
- `useTransactionStream.ts`
- `useConsensusStream.ts`
- `useMetricsWebSocket.ts`
- `useNetworkStream.ts`
- `useValidatorStream.ts`
- + 14 more component hooks

### 1.2 Current Issues with WebSocket Approach

| Issue | Impact | Frequency |
|-------|--------|-----------|
| JSON serialization overhead | 3-4KB payloads vs ~800B Protobuf | Every message |
| No type safety | Runtime errors, API mismatches | 15-20 bugs/sprint |
| Manual client implementation | Maintenance burden | Ongoing |
| Connection management complexity | 52 separate WebSocket services | Deployment |
| Firewall/proxy issues | Enterprise customer complaints | Monthly |
| No built-in backpressure | Client overload on high TPS | During spikes |
| Difficult load balancing | Sticky sessions required | Scaling |

### 1.3 Performance Baseline (WebSocket + JSON)

```
Metric                          | Current (WebSocket)
--------------------------------|--------------------
Avg Message Size                | 2.8 KB
Messages/second (per client)    | 10-50
Bandwidth per client            | 28-140 KB/s
Serialization CPU %             | 12-18%
Client-side parsing CPU %       | 8-12%
Connection overhead per client  | ~1.2 MB RAM
```

---

## 2. Target Architecture

### 2.1 gRPC-Web Stack

```
┌─────────────────────────────────────────────────────────┐
│                 Frontend (React/TypeScript)              │
│  - Auto-generated gRPC-Web clients from .proto files    │
│  - Type-safe method calls with Intellisense             │
│  - Built-in retry logic and error handling              │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/2 (TLS 1.3)
                       │ Protobuf binary encoding
                       │
┌──────────────────────▼──────────────────────────────────┐
│              NGINX (Reverse Proxy + LB)                  │
│  - gRPC-Web → gRPC transcoding                           │
│  - HTTP/2 connection multiplexing                        │
│  - Load balancing across backend instances               │
└──────────────────────┬──────────────────────────────────┘
                       │ gRPC (HTTP/2)
                       │ Native Protobuf
                       │
┌──────────────────────▼──────────────────────────────────┐
│           V12 Backend (Quarkus + gRPC)                   │
│  - Auto-generated gRPC service stubs                     │
│  - Reactive streaming with Mutiny                        │
│  - Built-in flow control and backpressure                │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Protocol Buffer Schema Files

**Created**:
- ✅ `analytics-stream.proto` - Dashboard analytics streaming (355 lines)
- ✅ `metrics-stream.proto` - Performance metrics streaming (380 lines)

**To Create**:
- `consensus-stream.proto` - Consensus state updates
- `channel-stream.proto` - Multi-channel events
- `validator-stream.proto` - Validator monitoring
- `network-stream.proto` - Network topology changes

**Existing** (already defined):
- `transaction.proto` - Transaction service (231 lines)
- `consensus.proto` - Consensus core types (298 lines)
- `blockchain.proto` - Block and chain data (467 lines)
- `common.proto` - Shared types (97 lines)

### 2.3 Service Definitions

```protobuf
// Example: Analytics Streaming Service
service AnalyticsStreamService {
  // One-shot request
  rpc GetDashboardAnalytics(DashboardAnalyticsRequest)
      returns (DashboardAnalytics);

  // Server streaming (replaces WebSocket)
  rpc StreamDashboardAnalytics(SubscribeRequest)
      returns (stream DashboardAnalytics);

  // High-frequency data points
  rpc StreamRealTimeData(SubscribeRequest)
      returns (stream RealTimeDataPoint);

  // Bidirectional streaming
  rpc InteractiveDashboard(stream DashboardCommand)
      returns (stream DashboardAnalytics);
}
```

### 2.4 Expected Performance (gRPC-Web + Protobuf)

```
Metric                          | Target (gRPC-Web) | Improvement
--------------------------------|-------------------|-------------
Avg Message Size                | 0.8 KB            | -71%
Messages/second (per client)    | 10-50             | Same
Bandwidth per client            | 8-40 KB/s         | -71%
Serialization CPU %             | 3-5%              | -72%
Client-side parsing CPU %       | 2-3%              | -71%
Connection overhead per client  | ~400 KB RAM       | -67%
```

**Overall Impact**:
- **Bandwidth savings**: 60-100 KB/s per 100 connected clients → **6-10 MB/s saved**
- **CPU savings**: 15-25% reduction in serialization/parsing overhead
- **Memory savings**: 800 KB per client → **80 MB saved** per 100 clients
- **TPS impact**: +5-8% TPS improvement from reduced overhead

---

## 3. Migration Phases

### Phase 1: Foundation (Sprint 19) - **2 weeks**

**Goal**: Set up gRPC infrastructure and tooling

**Deliverables**:
1. Maven gRPC plugin configuration
2. Quarkus gRPC extension setup
3. NGINX gRPC-Web proxy configuration
4. Proto file validation and compilation
5. CI/CD pipeline updates

**Exit Criteria**:
- ✅ `mvn compile` successfully generates gRPC code from .proto files
- ✅ Quarkus starts with gRPC server on port 9004
- ✅ NGINX successfully proxies gRPC-Web → gRPC

---

### Phase 2: Core Services Implementation (Sprint 20-21) - **4 weeks**

**Goal**: Implement core gRPC streaming services

**Deliverables**:

**Sprint 20**:
1. `AnalyticsStreamServiceImpl.java` - Dashboard analytics streaming
2. `MetricsStreamServiceImpl.java` - Performance metrics streaming
3. Unit tests for both services (95% coverage)
4. Integration tests with TestContainers

**Sprint 21**:
5. `ConsensusStreamServiceImpl.java` - Consensus state streaming
6. `TransactionStreamServiceImpl.java` - Transaction event streaming
7. gRPC interceptors (auth, logging, metrics, error handling)
8. Load testing framework setup

**Exit Criteria**:
- ✅ All 4 core gRPC services implemented and tested
- ✅ Services handle 1000+ concurrent streams
- ✅ Benchmark: <5ms p99 latency for message delivery
- ✅ JWT authentication working via gRPC metadata

---

### Phase 3: Frontend Migration (Sprint 22) - **2 weeks**

**Goal**: Migrate React frontend to gRPC-Web clients

**Deliverables**:
1. Generate TypeScript client code from .proto files (using `protoc-gen-grpc-web`)
2. Create React hooks wrapper for gRPC-Web clients:
   - `useAnalyticsStream()` - Replaces `useEnhancedWebSocket.ts`
   - `useMetricsStream()` - Replaces `useMetricsWebSocket.ts`
   - `useConsensusStream()` - Replaces `useConsensusStream.ts`
   - `useTransactionStream()` - Replaces `useTransactionStream.ts`
3. Update 6 dashboard components to use new hooks
4. E2E tests with Playwright

**Exit Criteria**:
- ✅ All dashboard screens functional with gRPC-Web
- ✅ No TypeScript errors (full type safety)
- ✅ E2E tests passing (100% dashboard coverage)
- ✅ Bundle size check: <50KB increase for gRPC-Web library

---

### Phase 4: Parallel Running & Validation (Sprint 23) - **2 weeks**

**Goal**: Run WebSocket + gRPC in parallel, validate correctness

**Deliverables**:
1. Feature flag system (`grpc.enabled=true/false`)
2. A/B testing framework (50% clients WebSocket, 50% gRPC)
3. Metrics comparison dashboard (WebSocket vs gRPC)
4. Performance benchmarking suite
5. User acceptance testing with 10 beta users

**Validation Metrics**:
- Data consistency: 100% match between WebSocket and gRPC streams
- Latency: gRPC ≤ WebSocket latency
- Bandwidth: gRPC ~30% of WebSocket bandwidth
- Error rate: gRPC ≤ 1% error rate
- User feedback: ≥4.5/5 rating from beta testers

**Exit Criteria**:
- ✅ 1 week of stable parallel running in production
- ✅ gRPC performance meets or exceeds WebSocket
- ✅ Zero data loss or corruption issues
- ✅ Beta user approval

---

### Phase 5: Full Migration & WebSocket Deprecation (Sprint 24) - **2 weeks**

**Goal**: Complete migration, deprecate WebSockets

**Deliverables**:
1. Enable gRPC for 100% of users
2. Add deprecation warnings to WebSocket endpoints
3. Documentation updates (API docs, migration guide)
4. Monitor for 1 week (error rates, performance)
5. Remove WebSocket server code (52 files)
6. Remove WebSocket client hooks (20 files)
7. Final performance report

**Exit Criteria**:
- ✅ 100% of clients using gRPC-Web
- ✅ WebSocket endpoints disabled (return 410 Gone)
- ✅ No increase in error rates or support tickets
- ✅ Performance targets achieved (see Phase 2.4)
- ✅ Code cleanup complete (WebSocket code removed)

---

## 4. JIRA Epic & Story Structure

### Epic: **AV11-500: gRPC-Web Migration for Real-Time Streaming**

**Epic Description**:
```
Replace WebSocket-based real-time communication with gRPC-Web + Protobuf + HTTP/2
to achieve 60-70% bandwidth reduction, type-safe communication, and better support
for 2M+ TPS target.

Business Value:
- Improved scalability (HTTP/2 multiplexing)
- Reduced bandwidth costs (60-70% reduction)
- Faster development (auto-generated clients)
- Better reliability (built-in flow control)

Acceptance Criteria:
- All real-time features migrated from WebSocket to gRPC-Web
- Performance metrics meet or exceed baseline
- Zero data loss during migration
- WebSocket code removed from codebase
```

---

### Sprint 19: Foundation

#### **AV11-501: Configure gRPC Build Tooling** (Story, 5 SP)
```
As a backend developer
I want Maven to auto-generate Java gRPC code from .proto files
So that I can implement gRPC services with type safety

Acceptance Criteria:
- pom.xml includes protobuf-maven-plugin
- mvn compile generates Java classes in target/generated-sources/
- Quarkus gRPC extension configured
- Build succeeds with zero warnings

Technical Tasks:
- Add protobuf-maven-plugin to pom.xml
- Configure protoc-gen-grpc-java
- Add Quarkus gRPC extension dependency
- Configure source directories
- Test build on CI/CD pipeline
```

#### **AV11-502: Configure NGINX gRPC-Web Proxy** (Story, 3 SP)
```
As a DevOps engineer
I want NGINX to transcode gRPC-Web ↔ gRPC
So that browser clients can communicate with gRPC backend

Acceptance Criteria:
- NGINX config includes grpc_pass directives
- NGINX forwards gRPC-Web requests to backend:9004
- CORS headers configured correctly
- Health check endpoint working

Technical Tasks:
- Update nginx.conf with gRPC proxy config
- Configure SSL/TLS for gRPC
- Add CORS headers for gRPC-Web
- Test with grpc_cli tool
- Document configuration
```

#### **AV11-503: Create Proto Files for Streaming Services** (Story, 8 SP)
```
As a protocol designer
I want comprehensive .proto schemas for all streaming services
So that backend and frontend can auto-generate type-safe clients

Acceptance Criteria:
- analytics-stream.proto (COMPLETED ✅)
- metrics-stream.proto (COMPLETED ✅)
- consensus-stream.proto created
- channel-stream.proto created
- validator-stream.proto created
- network-stream.proto created
- All proto files compile without errors
- Proto files documented with comments

Technical Tasks:
- Design consensus-stream.proto (consensus state, voting, leader election)
- Design channel-stream.proto (channel events, cross-channel messages)
- Design validator-stream.proto (validator status, slashing events)
- Design network-stream.proto (topology changes, peer events)
- Add comprehensive documentation
- Validate with protoc compiler
```

---

### Sprint 20: Core Services (Part 1)

#### **AV11-504: Implement AnalyticsStreamService** (Story, 13 SP)
```
As a backend developer
I want a gRPC service for streaming dashboard analytics
So that the frontend can receive real-time analytics via gRPC-Web

Acceptance Criteria:
- AnalyticsStreamServiceImpl.java implements AnalyticsStreamService
- Supports StreamDashboardAnalytics() server streaming RPC
- Supports StreamRealTimeData() high-frequency streaming RPC
- Supports InteractiveDashboard() bidirectional streaming RPC
- Unit test coverage ≥95%
- Integration tests with TestContainers
- Performance: handles 1000 concurrent streams
- Documentation complete

Technical Tasks:
- Create AnalyticsStreamServiceImpl.java
- Implement StreamDashboardAnalytics() with Mutiny Multi<>
- Implement StreamRealTimeData() with 100ms interval
- Implement InteractiveDashboard() bidirectional logic
- Add JWT authentication via gRPC metadata
- Unit tests for all RPCs
- Integration tests with gRPC client
- Load test with ghz tool (1000 concurrent streams)
- Add Javadoc documentation
```

#### **AV11-505: Implement MetricsStreamService** (Story, 13 SP)
```
As a backend developer
I want a gRPC service for streaming performance metrics
So that monitoring dashboards can receive real-time metrics

Acceptance Criteria:
- MetricsStreamServiceImpl.java implements MetricsStreamService
- Supports StreamMetrics() server streaming RPC
- Supports StreamAggregatedMetrics() cluster-wide metrics RPC
- Supports InteractiveMetrics() bidirectional streaming RPC
- Unit test coverage ≥95%
- Integration tests with TestContainers
- Performance: handles 2000 concurrent streams (metrics are popular!)
- Documentation complete

Technical Tasks:
- Create MetricsStreamServiceImpl.java
- Implement StreamMetrics() with configurable intervals (100ms-60s)
- Implement StreamAggregatedMetrics() for cluster metrics
- Implement InteractiveMetrics() with command processing
- Add authentication and rate limiting
- Unit tests for all RPCs
- Integration tests with metrics assertions
- Load test with ghz tool (2000 concurrent streams)
- Add Javadoc documentation
```

---

### Sprint 21: Core Services (Part 2)

#### **AV11-506: Implement ConsensusStreamService** (Story, 13 SP)
```
As a backend developer
I want a gRPC service for streaming consensus state
So that operators can monitor HyperRAFT++ consensus in real-time

Acceptance Criteria:
- ConsensusStreamServiceImpl.java implements ConsensusStreamService
- Streams leader election events
- Streams voting results
- Streams term changes
- Unit test coverage ≥95%
- Integration tests with mock consensus
- Performance: handles 500 concurrent streams
- Documentation complete

Technical Tasks:
- Create ConsensusStreamServiceImpl.java
- Integrate with HyperRAFTConsensusService
- Implement leader election event streaming
- Implement voting event streaming
- Implement term change notifications
- Unit tests for all event types
- Integration tests with TestConsensusCluster
- Load test with ghz tool (500 concurrent streams)
- Add Javadoc documentation
```

#### **AV11-507: Implement TransactionStreamService** (Story, 13 SP)
```
As a backend developer
I want a gRPC service for streaming transaction events
So that users can track transaction status in real-time

Acceptance Criteria:
- TransactionStreamServiceImpl.java implements TransactionStreamService
- Streams transaction submitted/pending/confirmed/failed events
- Supports filtering by transaction hash, sender, receiver
- Supports filtering by transaction type
- Unit test coverage ≥95%
- Integration tests with mock transactions
- Performance: handles 3000 concurrent streams (highest load!)
- Documentation complete

Technical Tasks:
- Create TransactionStreamServiceImpl.java
- Integrate with TransactionService event emitter
- Implement filtering logic (hash, sender, receiver, type)
- Implement rate limiting (1000 events/sec per client)
- Unit tests for all event types and filters
- Integration tests with TestTransactionGenerator
- Load test with ghz tool (3000 concurrent streams)
- Add Javadoc documentation
```

#### **AV11-508: Implement gRPC Interceptors** (Story, 8 SP)
```
As a backend developer
I want gRPC interceptors for cross-cutting concerns
So that all gRPC services have consistent auth, logging, metrics, and error handling

Acceptance Criteria:
- GrpcAuthInterceptor for JWT authentication
- GrpcLoggingInterceptor for request/response logging
- GrpcMetricsInterceptor for Prometheus metrics
- GrpcErrorHandlerInterceptor for standardized error responses
- All interceptors registered globally
- Unit tests for each interceptor
- Documentation complete

Technical Tasks:
- Create GrpcAuthInterceptor (extract JWT from metadata)
- Create GrpcLoggingInterceptor (structured logging)
- Create GrpcMetricsInterceptor (track RPC calls, latency, errors)
- Create GrpcErrorHandlerInterceptor (map exceptions to gRPC Status)
- Register interceptors in Quarkus config
- Unit tests for each interceptor
- Integration test verifying interceptor chain
- Add Javadoc documentation
```

---

### Sprint 22: Frontend Migration

#### **AV11-509: Generate TypeScript gRPC-Web Clients** (Story, 5 SP)
```
As a frontend developer
I want auto-generated TypeScript clients for gRPC services
So that I can call gRPC methods with full type safety

Acceptance Criteria:
- npm script to generate TypeScript code from .proto files
- Generated code in src/generated/
- TypeScript compiles with zero errors
- Types available in IDE autocomplete
- Build process automated (runs on npm install)

Technical Tasks:
- Install protoc and protoc-gen-grpc-web
- Create npm script: npm run proto:generate
- Configure output directory: src/generated/
- Test generation with all .proto files
- Verify TypeScript types in VSCode
- Add to package.json postinstall hook
- Document usage in README
```

#### **AV11-510: Create React gRPC-Web Hooks** (Story, 13 SP)
```
As a frontend developer
I want React hooks that wrap gRPC-Web clients
So that I can easily use gRPC streaming in React components

Acceptance Criteria:
- useAnalyticsStream() hook created
- useMetricsStream() hook created
- useConsensusStream() hook created
- useTransactionStream() hook created
- Hooks handle connection lifecycle (connect, disconnect, reconnect)
- Hooks handle errors gracefully
- Hooks provide loading/error states
- Unit tests with React Testing Library
- Storybook stories for all hooks

Technical Tasks:
- Create src/hooks/grpc/useAnalyticsStream.ts
- Create src/hooks/grpc/useMetricsStream.ts
- Create src/hooks/grpc/useConsensusStream.ts
- Create src/hooks/grpc/useTransactionStream.ts
- Implement connection management (auto-reconnect on disconnect)
- Implement error handling and retry logic
- Add TypeScript types for all hook return values
- Unit tests for each hook (mock gRPC client)
- Storybook stories demonstrating usage
- Documentation in JSDoc comments
```

#### **AV11-511: Migrate Dashboard Components to gRPC** (Story, 13 SP)
```
As a frontend developer
I want all dashboard components to use gRPC-Web instead of WebSocket
So that we can validate the gRPC migration

Acceptance Criteria:
- Dashboard.tsx updated to use useAnalyticsStream()
- PerformanceMetrics.tsx updated to use useMetricsStream()
- ConsensusMonitoring.tsx updated to use useConsensusStream()
- Transactions.tsx updated to use useTransactionStream()
- NetworkTopology.tsx updated to use useNetworkStream()
- SystemHealth.tsx updated to use useMetricsStream()
- All components compile with zero TypeScript errors
- Visual regression tests pass
- E2E tests pass with Playwright

Technical Tasks:
- Update Dashboard.tsx (replace WebSocket with gRPC hook)
- Update PerformanceMetrics.tsx
- Update ConsensusMonitoring.tsx
- Update Transactions.tsx
- Update NetworkTopology.tsx
- Update SystemHealth.tsx
- Fix TypeScript errors
- Run visual regression tests (Percy/Chromatic)
- Run E2E tests (Playwright)
- Update Storybook stories
```

---

### Sprint 23: Parallel Running & Validation

#### **AV11-512: Implement Feature Flag System** (Story, 5 SP)
```
As a DevOps engineer
I want a feature flag to toggle between WebSocket and gRPC
So that we can gradually roll out gRPC to users

Acceptance Criteria:
- Backend feature flag: grpc.streaming.enabled (default: false)
- Frontend feature flag: REACT_APP_USE_GRPC (default: false)
- Feature flags configurable via environment variables
- Feature flags queryable via /api/v11/features endpoint
- Admin UI to toggle feature flags
- Documentation complete

Technical Tasks:
- Add ConfigProperty for grpc.streaming.enabled
- Add /api/v11/features endpoint (return feature flag status)
- Update frontend to check REACT_APP_USE_GRPC
- Create admin UI component for toggling flags
- Add logging when feature flags change
- Document feature flag usage
```

#### **AV11-513: Implement A/B Testing Framework** (Story, 8 SP)
```
As a product manager
I want A/B testing between WebSocket and gRPC
So that we can measure performance differences

Acceptance Criteria:
- 50% of users get WebSocket, 50% get gRPC (randomly assigned by client ID)
- A/B assignment persists across sessions
- Metrics tracked separately for WebSocket vs gRPC cohorts
- A/B results dashboard showing comparison
- Statistical significance calculated

Technical Tasks:
- Implement client ID generation (UUID, stored in localStorage)
- Implement A/B assignment logic (hash client ID → cohort)
- Tag metrics with cohort label (websocket vs grpc)
- Create Grafana dashboard comparing cohorts
- Implement statistical significance calculation (t-test)
- Document A/B testing methodology
```

#### **AV11-514: Create Metrics Comparison Dashboard** (Story, 5 SP)
```
As a platform engineer
I want a dashboard comparing WebSocket vs gRPC performance
So that we can validate the migration

Acceptance Criteria:
- Grafana dashboard with side-by-side comparison
- Metrics: latency, bandwidth, error rate, CPU usage
- Real-time updates every 5 seconds
- Historical view (last 7 days)
- Alerts if gRPC performance degrades below WebSocket

Metrics to Track:
- Message latency (p50, p95, p99)
- Bandwidth per client (KB/s)
- Error rate (%)
- CPU usage (%)
- Memory usage (MB)
- Connection count
- Reconnection rate

Technical Tasks:
- Create Grafana dashboard JSON
- Add Prometheus metrics for both WebSocket and gRPC
- Configure side-by-side panels
- Add alerting rules (gRPC latency > WebSocket latency + 10%)
- Document dashboard usage
```

#### **AV11-515: Perform User Acceptance Testing** (Story, 8 SP)
```
As a product manager
I want 10 beta users to test gRPC streaming
So that we can get feedback before full rollout

Acceptance Criteria:
- 10 beta users identified and onboarded
- Beta users use gRPC for 1 week
- Feedback collected via survey (≥4.5/5 rating)
- No critical bugs reported
- Performance meets expectations

Technical Tasks:
- Identify 10 beta users (mix of power users and casual users)
- Enable gRPC for beta users via feature flag
- Create feedback survey (Google Forms)
- Monitor beta users' sessions for errors
- Collect and analyze feedback
- Address any issues raised by beta users
- Document lessons learned
```

---

### Sprint 24: Full Migration & Cleanup

#### **AV11-516: Enable gRPC for 100% of Users** (Story, 3 SP)
```
As a DevOps engineer
I want to enable gRPC for all users
So that we can complete the migration

Acceptance Criteria:
- Feature flag grpc.streaming.enabled=true in production
- REACT_APP_USE_GRPC=true in production build
- WebSocket endpoints return 410 Gone with migration message
- Error rate < 1%
- Support tickets < 5 in first week

Technical Tasks:
- Set grpc.streaming.enabled=true in production config
- Rebuild frontend with REACT_APP_USE_GRPC=true
- Deploy new backend + frontend
- Update WebSocket endpoints to return 410 Gone
- Monitor error rates for 24 hours
- Document rollout process
```

#### **AV11-517: Remove WebSocket Server Code** (Story, 13 SP)
```
As a backend developer
I want to remove WebSocket server code from the codebase
So that we reduce maintenance burden

Acceptance Criteria:
- 52 WebSocket Java files deleted
- WebSocket dependencies removed from pom.xml
- Build succeeds with zero errors
- All tests pass
- Code coverage maintained at ≥95%

Files to Delete:
- src/main/java/io/aurigraph/v11/websocket/ (entire package)
- WebSocket-related configuration files
- WebSocket health checks

Technical Tasks:
- Delete WebSocket Java files
- Remove WebSocket dependencies from pom.xml
- Remove WebSocket configuration from application.properties
- Update CI/CD pipeline (remove WebSocket tests)
- Run full test suite
- Document code cleanup
```

#### **AV11-518: Remove WebSocket Client Code** (Story, 8 SP)
```
As a frontend developer
I want to remove WebSocket client code from the codebase
So that we reduce bundle size and complexity

Acceptance Criteria:
- 20 WebSocket TypeScript files deleted
- WebSocket dependencies removed from package.json
- Build succeeds with zero errors
- All tests pass
- Bundle size reduced by ≥100KB

Files to Delete:
- src/hooks/useEnhancedWebSocket.ts
- src/hooks/useTransactionStream.ts (WebSocket version)
- src/hooks/useConsensusStream.ts (WebSocket version)
- src/hooks/useMetricsWebSocket.ts
- + 16 more files

Technical Tasks:
- Delete WebSocket TypeScript files
- Remove WebSocket dependencies from package.json (ws, socket.io-client)
- Update imports across components
- Run full test suite
- Measure bundle size reduction
- Document code cleanup
```

#### **AV11-519: Create Final Performance Report** (Story, 5 SP)
```
As a platform engineer
I want a final report comparing WebSocket vs gRPC performance
So that we can document the migration success

Acceptance Criteria:
- Report includes before/after metrics
- Report includes bandwidth savings calculation
- Report includes cost savings estimation
- Report includes lessons learned
- Report shared with stakeholders

Report Sections:
1. Executive Summary
2. Performance Metrics (latency, bandwidth, CPU, memory)
3. Cost Savings (bandwidth costs, infrastructure costs)
4. Lessons Learned
5. Future Recommendations

Technical Tasks:
- Collect final metrics from Grafana
- Calculate bandwidth savings (GB/month)
- Estimate cost savings ($/month)
- Write lessons learned section
- Create visualizations (charts, graphs)
- Review with team
- Share with stakeholders
```

---

## 5. Technical Implementation

### 5.1 Backend: Quarkus gRPC Service Example

```java
package io.aurigraph.v11.grpc;

import io.aurigraph.v11.proto.*;
import io.grpc.stub.StreamObserver;
import io.quarkus.grpc.GrpcService;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.Uni;
import jakarta.inject.Inject;
import java.time.Duration;

@GrpcService
public class AnalyticsStreamServiceImpl implements AnalyticsStreamService {

    @Inject
    AnalyticsDashboardService dashboardService;

    @Override
    public Uni<DashboardAnalytics> getDashboardAnalytics(DashboardAnalyticsRequest request) {
        return Uni.createFrom().item(() -> {
            return dashboardService.getCurrentAnalytics(request.getDashboardId());
        });
    }

    @Override
    public Multi<DashboardAnalytics> streamDashboardAnalytics(SubscribeRequest request) {
        return Multi.createFrom().ticks().every(Duration.ofMillis(request.getUpdateIntervalMs()))
            .map(tick -> dashboardService.getCurrentAnalytics(request.getClientId()))
            .onCancellation().invoke(() -> {
                // Cleanup subscription
                dashboardService.unsubscribe(request.getClientId());
            });
    }

    @Override
    public Multi<RealTimeDataPoint> streamRealTimeData(SubscribeRequest request) {
        return dashboardService.getRealTimeStream(request)
            .select().where(dataPoint -> matchesFilters(dataPoint, request));
    }

    @Override
    public Multi<DashboardAnalytics> interactiveDashboard(Multi<DashboardCommand> commands) {
        return commands
            .onItem().transform(cmd -> processCommand(cmd))
            .onItem().transformToMulti(config -> streamWithConfig(config))
            .merge();
    }

    private boolean matchesFilters(RealTimeDataPoint dataPoint, SubscribeRequest request) {
        // Implement filtering logic
        return true;
    }

    private DashboardConfig processCommand(DashboardCommand cmd) {
        // Process interactive commands (pause, resume, change interval, etc.)
        return DashboardConfig.fromCommand(cmd);
    }

    private Multi<DashboardAnalytics> streamWithConfig(DashboardConfig config) {
        return Multi.createFrom().ticks().every(Duration.ofMillis(config.getIntervalMs()))
            .map(tick -> dashboardService.getAnalyticsWithConfig(config));
    }
}
```

### 5.2 Frontend: React gRPC-Web Hook Example

```typescript
// src/hooks/grpc/useAnalyticsStream.ts
import { useEffect, useState, useCallback } from 'react';
import { AnalyticsStreamServiceClient } from '@/generated/analytics-stream_grpc_web_pb';
import { SubscribeRequest, DashboardAnalytics } from '@/generated/analytics-stream_pb';
import { ClientReadableStream } from 'grpc-web';

interface UseAnalyticsStreamOptions {
  dashboardId: string;
  updateIntervalMs?: number;
  autoConnect?: boolean;
}

interface UseAnalyticsStreamReturn {
  analytics: DashboardAnalytics.AsObject | null;
  isConnected: boolean;
  error: Error | null;
  reconnect: () => void;
}

export function useAnalyticsStream(options: UseAnalyticsStreamOptions): UseAnalyticsStreamReturn {
  const [analytics, setAnalytics] = useState<DashboardAnalytics.AsObject | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [stream, setStream] = useState<ClientReadableStream<DashboardAnalytics> | null>(null);

  const client = new AnalyticsStreamServiceClient(
    process.env.REACT_APP_GRPC_ENDPOINT || 'https://dlt.aurigraph.io'
  );

  const connect = useCallback(() => {
    const request = new SubscribeRequest();
    request.setClientId(localStorage.getItem('clientId') || generateClientId());
    request.setUpdateIntervalMs(options.updateIntervalMs || 1000);

    const metadata = {
      'authorization': `Bearer ${getAuthToken()}`,
    };

    const newStream = client.streamDashboardAnalytics(request, metadata);

    newStream.on('data', (response: DashboardAnalytics) => {
      setAnalytics(response.toObject());
      setIsConnected(true);
      setError(null);
    });

    newStream.on('error', (err: Error) => {
      console.error('gRPC stream error:', err);
      setError(err);
      setIsConnected(false);

      // Auto-reconnect after 3 seconds
      setTimeout(() => connect(), 3000);
    });

    newStream.on('end', () => {
      setIsConnected(false);
    });

    setStream(newStream);
  }, [options.dashboardId, options.updateIntervalMs]);

  useEffect(() => {
    if (options.autoConnect !== false) {
      connect();
    }

    return () => {
      stream?.cancel();
    };
  }, [connect, options.autoConnect]);

  return {
    analytics,
    isConnected,
    error,
    reconnect: connect,
  };
}

function generateClientId(): string {
  const clientId = crypto.randomUUID();
  localStorage.setItem('clientId', clientId);
  return clientId;
}

function getAuthToken(): string {
  return localStorage.getItem('authToken') || '';
}
```

### 5.3 NGINX Configuration for gRPC-Web

```nginx
# /etc/nginx/nginx.conf

http {
    # ... existing configuration ...

    # gRPC-Web upstream
    upstream grpc_backend {
        server 127.0.0.1:9004 max_fails=3 fail_timeout=30s;
        keepalive 100;
    }

    server {
        listen 443 ssl http2;
        server_name dlt.aurigraph.io;

        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/aurcrt/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/aurcrt/privkey.pem;

        # gRPC-Web proxy
        location /io.aurigraph.v11.proto {
            grpc_pass grpc://grpc_backend;

            # gRPC-Web headers
            grpc_set_header Host $host;
            grpc_set_header X-Real-IP $remote_addr;
            grpc_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            grpc_set_header X-Forwarded-Proto $scheme;

            # CORS for gRPC-Web
            add_header 'Access-Control-Allow-Origin' 'https://dlt.aurigraph.io' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, X-Grpc-Web, X-User-Agent, Authorization' always;
            add_header 'Access-Control-Expose-Headers' 'Grpc-Status, Grpc-Message, Grpc-Status-Details-Bin' always;

            # Handle preflight requests
            if ($request_method = 'OPTIONS') {
                return 204;
            }

            # gRPC-Web specific
            grpc_socket_keepalive on;
            grpc_read_timeout 3600s;
            grpc_send_timeout 3600s;

            # Buffering
            grpc_buffering off;
        }

        # REST API (existing)
        location /api/v11/ {
            proxy_pass http://backend_api/api/v11/;
            # ... existing proxy configuration ...
        }

        # Frontend (existing)
        location / {
            proxy_pass http://frontend/;
            # ... existing proxy configuration ...
        }
    }
}
```

---

## 6. Testing Strategy

### 6.1 Unit Tests

**Backend (JUnit 5 + Mockito)**:
```java
@QuarkusTest
class AnalyticsStreamServiceImplTest {

    @InjectMock
    AnalyticsDashboardService dashboardService;

    @Inject
    AnalyticsStreamServiceImpl service;

    @Test
    void testGetDashboardAnalytics() {
        // Arrange
        DashboardAnalyticsRequest request = DashboardAnalyticsRequest.newBuilder()
            .setDashboardId("test-dashboard")
            .build();

        DashboardAnalytics expected = createMockAnalytics();
        when(dashboardService.getCurrentAnalytics("test-dashboard")).thenReturn(expected);

        // Act
        DashboardAnalytics result = service.getDashboardAnalytics(request)
            .await().atMost(Duration.ofSeconds(5));

        // Assert
        assertThat(result).isEqualTo(expected);
    }

    @Test
    void testStreamDashboardAnalytics() {
        // Arrange
        SubscribeRequest request = SubscribeRequest.newBuilder()
            .setClientId("test-client")
            .setUpdateIntervalMs(100)
            .build();

        // Act
        List<DashboardAnalytics> results = service.streamDashboardAnalytics(request)
            .select().first(5)  // Take first 5 updates
            .collect().asList()
            .await().atMost(Duration.ofSeconds(2));

        // Assert
        assertThat(results).hasSize(5);
        assertThat(results.get(0).getPerformance().getCurrentTps()).isGreaterThan(0);
    }
}
```

**Frontend (React Testing Library + Jest)**:
```typescript
// src/hooks/grpc/__tests__/useAnalyticsStream.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useAnalyticsStream } from '../useAnalyticsStream';
import { AnalyticsStreamServiceClient } from '@/generated/analytics-stream_grpc_web_pb';

jest.mock('@/generated/analytics-stream_grpc_web_pb');

describe('useAnalyticsStream', () => {
  it('should connect and receive analytics updates', async () => {
    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'data') {
          // Simulate receiving data after 100ms
          setTimeout(() => {
            callback(createMockAnalytics());
          }, 100);
        }
      }),
      cancel: jest.fn(),
    };

    (AnalyticsStreamServiceClient as jest.Mock).mockImplementation(() => ({
      streamDashboardAnalytics: jest.fn(() => mockStream),
    }));

    const { result } = renderHook(() =>
      useAnalyticsStream({ dashboardId: 'test', updateIntervalMs: 1000 })
    );

    // Initially null
    expect(result.current.analytics).toBeNull();
    expect(result.current.isConnected).toBe(false);

    // Wait for connection
    await waitFor(() => {
      expect(result.current.analytics).not.toBeNull();
      expect(result.current.isConnected).toBe(true);
    });

    // Verify analytics data
    expect(result.current.analytics?.performance?.currentTps).toBeGreaterThan(0);
  });

  it('should handle errors and reconnect', async () => {
    // ... test error handling ...
  });
});

function createMockAnalytics() {
  const analytics = new DashboardAnalytics();
  const perf = new PerformanceMetrics();
  perf.setCurrentTps(1500000);
  analytics.setPerformance(perf);
  return analytics;
}
```

### 6.2 Integration Tests

**Backend (TestContainers + gRPC Client)**:
```java
@QuarkusTest
@TestProfile(GrpcIntegrationTestProfile.class)
class AnalyticsStreamIntegrationTest {

    @Test
    void testStreamAnalyticsEndToEnd() throws Exception {
        // Create gRPC channel
        ManagedChannel channel = ManagedChannelBuilder
            .forAddress("localhost", 9004)
            .usePlaintext()
            .build();

        // Create client stub
        AnalyticsStreamServiceGrpc.AnalyticsStreamServiceStub stub =
            AnalyticsStreamServiceGrpc.newStub(channel);

        // Create subscription request
        SubscribeRequest request = SubscribeRequest.newBuilder()
            .setClientId("integration-test")
            .setUpdateIntervalMs(100)
            .build();

        // Collect responses
        List<DashboardAnalytics> responses = new ArrayList<>();
        CountDownLatch latch = new CountDownLatch(5);

        // Subscribe
        stub.streamDashboardAnalytics(request, new StreamObserver<DashboardAnalytics>() {
            @Override
            public void onNext(DashboardAnalytics value) {
                responses.add(value);
                latch.countDown();
            }

            @Override
            public void onError(Throwable t) {
                fail("Stream error: " + t.getMessage());
            }

            @Override
            public void onCompleted() {
                // Stream completed
            }
        });

        // Wait for 5 updates (max 2 seconds)
        assertThat(latch.await(2, TimeUnit.SECONDS)).isTrue();

        // Verify responses
        assertThat(responses).hasSize(5);
        responses.forEach(analytics -> {
            assertThat(analytics.getPerformance().getCurrentTps()).isGreaterThan(0);
            assertThat(analytics.getTimestamp()).isNotNull();
        });

        channel.shutdown();
    }
}
```

### 6.3 Load Tests

**Using ghz (gRPC benchmarking tool)**:
```bash
# Install ghz
go install github.com/bojand/ghz/cmd/ghz@latest

# Load test: 1000 concurrent connections, 10,000 requests
ghz --insecure \
  --proto src/main/proto/analytics-stream.proto \
  --call io.aurigraph.v11.proto.AnalyticsStreamService/StreamDashboardAnalytics \
  -d '{"client_id":"load-test","update_interval_ms":1000}' \
  -c 1000 \
  -n 10000 \
  -t 60s \
  localhost:9004

# Expected results:
# - Requests/sec: > 5,000
# - Latency (p50): < 10ms
# - Latency (p95): < 50ms
# - Latency (p99): < 100ms
# - Error rate: < 0.1%
```

### 6.4 End-to-End Tests

**Using Playwright**:
```typescript
// e2e/dashboard-grpc.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard with gRPC Streaming', () => {
  test.beforeEach(async ({ page }) => {
    // Enable gRPC feature flag
    await page.addInitScript(() => {
      localStorage.setItem('feature_flags', JSON.stringify({ useGrpc: true }));
    });
  });

  test('should display real-time TPS updates', async ({ page }) => {
    await page.goto('https://dlt.aurigraph.io/dashboard');

    // Wait for gRPC connection
    await page.waitForSelector('[data-testid="grpc-status-connected"]');

    // Verify TPS updates
    const tpsElement = page.locator('[data-testid="current-tps"]');
    const initialTps = await tpsElement.textContent();

    // Wait for TPS to update (gRPC stream interval: 1s)
    await page.waitForTimeout(1500);
    const updatedTps = await tpsElement.textContent();

    expect(updatedTps).not.toBe(initialTps);
    expect(parseInt(updatedTps || '0')).toBeGreaterThan(0);
  });

  test('should handle connection loss gracefully', async ({ page }) => {
    await page.goto('https://dlt.aurigraph.io/dashboard');
    await page.waitForSelector('[data-testid="grpc-status-connected"]');

    // Simulate network offline
    await page.context().setOffline(true);

    // Verify error state
    await expect(page.locator('[data-testid="grpc-status-error"]')).toBeVisible();

    // Simulate network online
    await page.context().setOffline(false);

    // Verify reconnection
    await expect(page.locator('[data-testid="grpc-status-connected"]')).toBeVisible({ timeout: 5000 });
  });

  test('should match WebSocket functionality exactly', async ({ page, context }) => {
    // Open two tabs: one with WebSocket, one with gRPC
    const wsPage = await context.newPage();
    await wsPage.goto('https://dlt.aurigraph.io/dashboard?use_websocket=true');

    const grpcPage = await context.newPage();
    await grpcPage.goto('https://dlt.aurigraph.io/dashboard?use_grpc=true');

    // Wait for both to load
    await Promise.all([
      wsPage.waitForSelector('[data-testid="current-tps"]'),
      grpcPage.waitForSelector('[data-testid="current-tps"]'),
    ]);

    // Compare TPS values (should be within 5% due to slight timing differences)
    const wsTps = parseInt((await wsPage.locator('[data-testid="current-tps"]').textContent()) || '0');
    const grpcTps = parseInt((await grpcPage.locator('[data-testid="current-tps"]').textContent()) || '0');

    const diff = Math.abs(wsTps - grpcTps);
    const tolerance = wsTps * 0.05;  // 5% tolerance

    expect(diff).toBeLessThan(tolerance);
  });
});
```

---

## 7. Rollback Plan

### 7.1 Rollback Triggers

Rollback to WebSocket if any of the following occur:

| Trigger | Threshold | Action |
|---------|-----------|--------|
| Error rate spike | >5% for 10 minutes | Immediate rollback |
| Latency degradation | p99 > WebSocket p99 + 50ms for 30 minutes | Rollback |
| Data loss | Any confirmed data loss incident | Immediate rollback |
| Support ticket surge | >20 gRPC-related tickets in 24 hours | Rollback |
| Critical bug | Severity 1 bug impacting >10% users | Immediate rollback |
| Performance regression | TPS drops >10% | Rollback |

### 7.2 Rollback Procedure

**Step 1: Disable gRPC via Feature Flag (5 minutes)**
```bash
# Backend
curl -X POST https://dlt.aurigraph.io/api/v11/admin/feature-flags \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"grpc.streaming.enabled": false}'

# Frontend (redeploy with env var)
REACT_APP_USE_GRPC=false npm run build
# Deploy to CDN
```

**Step 2: Verify WebSocket Endpoints Are Active (2 minutes)**
```bash
# Test WebSocket endpoints
wscat -c wss://dlt.aurigraph.io/ws/transactions
# Should connect successfully
```

**Step 3: Monitor for 1 Hour**
- Watch error rates (should drop to baseline)
- Watch latency metrics (should return to baseline)
- Check support tickets (should stop increasing)

**Step 4: Incident Report**
- Document trigger event
- Analyze root cause
- Create JIRA ticket for fix
- Plan re-migration timeline

### 7.3 Rollback Testing

- Perform rollback drill during Sprint 23 (before production rollout)
- Verify rollback procedure works as documented
- Time the rollback (should be <10 minutes)

---

## 8. Success Metrics

### 8.1 Performance Metrics

| Metric | Baseline (WebSocket) | Target (gRPC) | Actual (Post-Migration) |
|--------|----------------------|---------------|-------------------------|
| Avg Message Size | 2.8 KB | 0.8 KB | _TBD_ |
| Bandwidth per Client | 28-140 KB/s | 8-40 KB/s | _TBD_ |
| Serialization CPU | 12-18% | 3-5% | _TBD_ |
| Parsing CPU | 8-12% | 2-3% | _TBD_ |
| Connection Overhead | 1.2 MB RAM | 400 KB RAM | _TBD_ |
| p50 Latency | 25ms | ≤25ms | _TBD_ |
| p95 Latency | 80ms | ≤80ms | _TBD_ |
| p99 Latency | 150ms | ≤150ms | _TBD_ |
| Error Rate | 0.5% | ≤0.5% | _TBD_ |

### 8.2 Business Metrics

| Metric | Target | Actual (Post-Migration) |
|--------|--------|-------------------------|
| Bandwidth Cost Savings | -60% ($3,000/month) | _TBD_ |
| Infrastructure Cost Savings | -20% ($1,000/month) | _TBD_ |
| Development Velocity | +30% (auto-generated clients) | _TBD_ |
| Bug Reduction | -40% (type safety) | _TBD_ |
| Support Ticket Reduction | -25% (better error handling) | _TBD_ |

### 8.3 Quality Metrics

| Metric | Target | Actual (Post-Migration) |
|--------|--------|-------------------------|
| Test Coverage | ≥95% | _TBD_ |
| TypeScript Errors | 0 | _TBD_ |
| Production Incidents | ≤2 in first month | _TBD_ |
| User Satisfaction | ≥4.5/5 | _TBD_ |
| Time to Implement New Feature | -30% | _TBD_ |

---

## 9. Dependencies & Risks

### 9.1 External Dependencies

| Dependency | Version | Risk Level | Mitigation |
|------------|---------|------------|------------|
| Quarkus gRPC Extension | 3.29.0+ | Low | Actively maintained, stable |
| grpc-web (npm) | ^1.5.0 | Low | Google-maintained |
| protoc compiler | ^3.21.0+ | Low | Stable, widely used |
| NGINX gRPC Module | 1.29.0+ | Low | Built-in, stable |

### 9.2 Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Proto schema breaking changes | Medium | High | Implement versioning strategy (v1, v2) |
| Browser compatibility issues | Low | Medium | Test on all major browsers (Chrome, Firefox, Safari, Edge) |
| Performance regression | Medium | High | Load test before rollout, A/B testing |
| Team learning curve | High | Low | Provide training, documentation, pair programming |
| NGINX misconfiguration | Medium | Medium | Staging environment testing, peer review |
| Proto compilation failures | Low | Medium | CI/CD validation, clear error messages |

---

## 10. Timeline Summary

| Sprint | Weeks | Deliverables | Story Points |
|--------|-------|--------------|--------------|
| Sprint 19 | 2 | Foundation (tooling, proto files) | 16 |
| Sprint 20 | 2 | Core services (analytics, metrics) | 26 |
| Sprint 21 | 2 | Core services (consensus, transactions) + interceptors | 34 |
| Sprint 22 | 2 | Frontend migration (hooks, components) | 31 |
| Sprint 23 | 2 | Parallel running, A/B testing, validation | 26 |
| Sprint 24 | 2 | Full migration, cleanup, reporting | 29 |
| **Total** | **12 weeks** | **gRPC-Web migration complete** | **162 SP** |

**Estimated Effort**:
- **162 story points** = ~12 weeks with 3-person team
- **Team**: 2 backend developers, 1 frontend developer, 0.5 DevOps engineer

---

## 11. Conclusion

This migration from WebSocket to gRPC-Web + Protobuf + HTTP/2 will deliver significant benefits:

✅ **60-70% bandwidth reduction** → Cost savings + better scalability
✅ **Type-safe communication** → Fewer bugs, faster development
✅ **Better performance** → Supports 2M+ TPS target
✅ **Modern infrastructure** → HTTP/2 multiplexing, better observability
✅ **Enterprise-grade** → Used by Google, Netflix, Square

**Next Steps**:
1. Review and approve this migration plan
2. Create JIRA Epic **AV11-500** and child stories
3. Assign team members to Sprint 19 stories
4. Begin Sprint 19: Foundation (tooling setup)

**Questions/Feedback**: Contact Platform Team Lead or create JIRA comment on AV11-500.

---

**Document Control**:
- **Author**: Claude (AI Assistant)
- **Reviewers**: _TBD_
- **Approved By**: _TBD_
- **Last Updated**: November 26, 2025
- **Version**: 1.0
