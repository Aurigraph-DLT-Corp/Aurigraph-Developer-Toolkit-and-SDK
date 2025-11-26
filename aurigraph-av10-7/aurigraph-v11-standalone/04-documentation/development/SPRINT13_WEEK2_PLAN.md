# Sprint 13 Week 2 - Execution Plan

**Plan Date**: October 25, 2025
**Sprint Period**: October 25-29, 2025 (5 days)
**Sprint Status**: 📋 **READY TO START**
**Agent Framework**: Multi-Agent Parallel Execution
**Previous Week**: ✅ Sprint 13 Week 1 Complete (All objectives met)

---

## Executive Summary

Sprint 13 Week 2 focuses on **THREE PARALLEL WORKSTREAMS**:

### 🎯 Primary Objectives

1. **Performance Optimization** (BDA Lead)
   - Week 1: Platform thread migration (1.0M TPS target)
   - Week 2: Lock-free ring buffer (1.4M TPS target)
   - Validate with JFR profiling

2. **Enterprise Portal Phase 1** (FDA Lead)
   - Implement 2 critical React components
   - NetworkTopology.tsx + BlockSearch.tsx
   - Full test coverage (85%+)

3. **Test Infrastructure Fixes** (QAA Lead)
   - Fix 2 blocking test errors
   - Re-enable skipped tests incrementally
   - Achieve zero test failures

### 📊 Success Metrics

| Metric | Week 1 Baseline | Week 2 Target | Status |
|--------|----------------|---------------|--------|
| **TPS** | 3.0M | Validate optimization path | 📋 Pending |
| **Test Errors** | 2 | 0 | 📋 Pending |
| **Portal Components** | 0 | 2 | 📋 Pending |
| **API Documentation** | 0% | 100% (OpenAPI) | 📋 Pending |
| **Test Coverage** | 85% | 85%+ | 📋 Maintain |

---

## Workstream 1: Performance Optimization (Days 1-5)

### Agent Assignment
**Primary**: BDA (Backend Development Agent)
**Support**: QAA (Performance Testing), DDA (Infrastructure)
**Story Points**: 32 SP

### Day 1-2: Week 1 Optimization - Platform Thread Migration

#### Objective
Replace virtual threads with platform threads to eliminate 56% CPU overhead

#### Tasks

**Task 1.1: Replace Virtual Thread Executor** (2 hours)
```java
// Location: src/main/java/io/aurigraph/v11/TransactionService.java:142

// CURRENT (Virtual Threads)
ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

// REPLACE WITH (Platform Threads)
private static final ExecutorService executor = new ThreadPoolExecutor(
    256,  // corePoolSize
    256,  // maximumPoolSize
    0L,   // keepAliveTime
    TimeUnit.MILLISECONDS,
    new ArrayBlockingQueue<>(10000),  // Bounded queue
    new ThreadPoolExecutor.CallerRunsPolicy()  // Overflow handling
);
```

**Validation**:
- ✅ Compile and run: `./mvnw quarkus:dev`
- ✅ Verify startup: No errors in logs
- ✅ Basic smoke test: `curl http://localhost:9003/api/v11/health`

**Task 1.2: Update Configuration** (30 minutes)
```properties
# Location: src/main/resources/application.properties

# Disable virtual threads (if enabled)
quarkus.virtual-threads.enabled=false

# Platform thread pool configuration
transaction.thread-pool.size=256
transaction.thread-pool.queue-size=10000
transaction.thread-pool.overflow-policy=caller-runs
```

**Task 1.3: Add Monitoring Metrics** (1 hour)
```java
// Location: src/main/java/io/aurigraph/v11/TransactionService.java

@Gauge(name = "transaction_pool_active_threads", unit = "threads")
public int getActiveThreads() {
    ThreadPoolExecutor pool = (ThreadPoolExecutor) executor;
    return pool.getActiveCount();
}

@Gauge(name = "transaction_pool_queue_size", unit = "tasks")
public int getQueueSize() {
    ThreadPoolExecutor pool = (ThreadPoolExecutor) executor;
    return pool.getQueue().size();
}
```

**Task 1.4: Run Performance Tests** (2 hours)
```bash
# Terminal 1: Start application with JFR
./mvnw quarkus:dev &
APP_PID=$!

jcmd $APP_PID JFR.start name=week1-platform-threads duration=30m \
  filename=week1-platform-threads.jfr

# Terminal 2: Run load test
for i in {1..5}; do
  echo "Iteration $i of 5"
  curl -X POST http://localhost:9003/api/v11/performance \
    -H "Content-Type: application/json" \
    -d '{"transactions": 1000000}'
  sleep 60
done

# Wait for JFR completion
wait $APP_PID

# Analyze results
jfr summary week1-platform-threads.jfr
python3 analyze-jfr.py week1-platform-threads.jfr
```

**Task 1.5: Validate Results** (1 hour)

**Success Criteria**:
- ✅ Virtual thread CPU samples: <5% (was 56%)
- ✅ Application CPU samples: >80% (was 43%)
- ✅ TPS: ≥1.0M sustained for 30 minutes
- ✅ Latency P99: <10ms
- ✅ Error rate: <0.01%

**Expected Outcome**:
- Baseline TPS (virtual): 776K
- Week 1 TPS (platform): 1.0M-1.13M
- **Improvement**: +30-45%

**Rollback Plan**:
```bash
git revert <commit-hash>
./mvnw clean compile quarkus:dev
# Verify TPS returns to baseline 776K
```

---

### Day 3-4: Week 2 Optimization - Lock-Free Ring Buffer

#### Objective
Replace ArrayBlockingQueue with LMAX Disruptor for zero-contention queuing

#### Tasks

**Task 2.1: Add Disruptor Dependency** (15 minutes)
```xml
<!-- Location: pom.xml -->
<dependency>
    <groupId>com.lmax</groupId>
    <artifactId>disruptor</artifactId>
    <version>4.0.0</version>
</dependency>
```

**Task 2.2: Create TransactionEvent Wrapper** (1 hour)
```java
// Location: src/main/java/io/aurigraph/v11/events/TransactionEvent.java

package io.aurigraph.v11.events;

public class TransactionEvent {
    private String txId;
    private double amount;
    private long timestamp;

    // Default constructor for Disruptor
    public TransactionEvent() {}

    public void set(String txId, double amount) {
        this.txId = txId;
        this.amount = amount;
        this.timestamp = System.nanoTime();
    }

    public void clear() {
        this.txId = null;
        this.amount = 0.0;
        this.timestamp = 0;
    }

    // Getters/Setters
}
```

**Task 2.3: Implement Disruptor Ring Buffer** (3 hours)
```java
// Location: src/main/java/io/aurigraph/v11/TransactionService.java

import com.lmax.disruptor.*;
import com.lmax.disruptor.dsl.*;

private Disruptor<TransactionEvent> disruptor;
private RingBuffer<TransactionEvent> ringBuffer;

@PostConstruct
public void initializeDisruptor() {
    // Create Disruptor with 1M ring buffer
    disruptor = new Disruptor<>(
        TransactionEvent::new,           // Event factory
        1024 * 1024,                     // Ring buffer size (power of 2)
        DaemonThreadFactory.INSTANCE,    // Thread factory
        ProducerType.MULTI,              // Multiple producers
        new BusySpinWaitStrategy()       // Lowest latency strategy
    );

    // Set up event handler
    disruptor.handleEventsWith((event, sequence, endOfBatch) -> {
        processTransaction(event.getTxId(), event.getAmount());
        event.clear();  // Release for reuse
    });

    disruptor.start();
    ringBuffer = disruptor.getRingBuffer();
}

@PreDestroy
public void shutdownDisruptor() {
    if (disruptor != null) {
        disruptor.shutdown();
    }
}

// Replace queue submission with ring buffer
public void submitTransaction(String txId, double amount) {
    long sequence = ringBuffer.next();
    try {
        TransactionEvent event = ringBuffer.get(sequence);
        event.set(txId, amount);
    } finally {
        ringBuffer.publish(sequence);
    }
}
```

**Task 2.4: Add Overflow Handling** (1 hour)
```java
// Handle ring buffer full scenario
public void submitTransactionSafe(String txId, double amount) {
    try {
        long sequence = ringBuffer.tryNext();
        try {
            TransactionEvent event = ringBuffer.get(sequence);
            event.set(txId, amount);
        } finally {
            ringBuffer.publish(sequence);
        }
    } catch (InsufficientCapacityException e) {
        // Ring buffer full - use fallback processing
        log.warn("Ring buffer full, using direct processing");
        processTransactionDirect(txId, amount);
        ringBufferOverflowCounter.increment();
    }
}
```

**Task 2.5: Run Performance Tests** (2 hours)
```bash
# Start with JFR profiling
jcmd $APP_PID JFR.start name=week2-ring-buffer duration=30m \
  filename=week2-ring-buffer.jfr

# Run 5 iterations
for i in {1..5}; do
  echo "Iteration $i - Week 2 Ring Buffer Test"
  curl -X POST http://localhost:9003/api/v11/performance \
    -H "Content-Type: application/json" \
    -d '{"transactions": 1000000}'
  sleep 60
done

# Analyze
python3 analyze-jfr.py week2-ring-buffer.jfr \
  --compare week1-platform-threads.jfr
```

**Task 2.6: Validate Results** (1 hour)

**Success Criteria**:
- ✅ ArrayBlockingQueue samples: 0 (was 2.7%)
- ✅ Ring buffer overflow rate: <0.1%
- ✅ TPS: ≥1.4M sustained
- ✅ Latency P99: <8ms
- ✅ No exceptions in logs

**Expected Outcome**:
- Week 1 TPS: 1.13M
- Week 2 TPS: 1.4M
- **Improvement**: +27%

**Rollback Plan**:
```bash
git revert <commit-hash>
./mvnw clean compile quarkus:dev
# Keep platform threads, revert to ArrayBlockingQueue
```

---

### Day 5: Performance Validation & Reporting

#### Task 3.1: Comprehensive Performance Report (2 hours)

**Generate Before/After Comparison**:
```bash
# Compare all 3 profiles
python3 analyze-jfr.py \
  --baseline baseline-sprint12.jfr \
  --week1 week1-platform-threads.jfr \
  --week2 week2-ring-buffer.jfr \
  --report SPRINT13_WEEK2_PERFORMANCE_REPORT.md
```

**Report Contents**:
1. Executive summary with TPS improvements
2. CPU hotspot analysis (before/after)
3. GC analysis (pause time reduction)
4. Memory allocation changes
5. Thread contention elimination
6. Recommendations for Week 3-4

**Task 3.2: Update Documentation** (1 hour)
- Update TODO.md with Week 2 completion
- Update SPRINT_PLAN.md with progress
- Commit performance report to git

**Task 3.3: Staging Deployment** (2 hours)
```bash
# Build optimized native image
./mvnw clean package -Pnative-fast

# Deploy to staging
scp target/*-runner subbu@dlt.aurigraph.io:/opt/aurigraph/staging/
ssh subbu@dlt.aurigraph.io "systemctl restart aurigraph-staging"

# Validate staging
curl https://staging.dlt.aurigraph.io/api/v11/health
```

---

## Workstream 2: Enterprise Portal Phase 1 (Days 1-5)

### Agent Assignment
**Primary**: FDA (Frontend Development Agent)
**Support**: BDA (API Support), QAA (Testing)
**Story Points**: 13 SP (2 components)

### Day 1-2: NetworkTopology Component

#### Objective
Implement interactive network topology visualization

#### Tasks

**Task 4.1: Component Structure** (3 hours)
```typescript
// Location: enterprise-portal/src/components/NetworkTopology/NetworkTopology.tsx

import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { useGetNetworkTopologyQuery } from '../../store/api/networkApi';
import TopologyGraph from './TopologyGraph';
import NodeDetails from './NodeDetails';

interface Node {
  id: string;
  type: 'VALIDATOR' | 'BUSINESS' | 'OBSERVER';
  location: { latitude: number; longitude: number };
  status: 'ACTIVE' | 'INACTIVE' | 'SYNCING';
  connections: number;
  version: string;
}

interface Edge {
  source: string;
  target: string;
  latency: number;
  bandwidth: number;
}

export const NetworkTopology: React.FC = () => {
  const { data, isLoading, error } = useGetNetworkTopologyQuery();
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  if (isLoading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">Failed to load network topology</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
      <Card sx={{ flex: 1 }}>
        <CardContent>
          <Typography variant="h6">Network Topology</Typography>
          <TopologyGraph
            nodes={data?.nodes ?? []}
            edges={data?.edges ?? []}
            onNodeClick={setSelectedNode}
          />
        </CardContent>
      </Card>

      {selectedNode && (
        <Card sx={{ width: 320 }}>
          <CardContent>
            <NodeDetails node={selectedNode} />
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
```

**Task 4.2: Redux API Slice** (1 hour)
```typescript
// Location: enterprise-portal/src/store/api/networkApi.ts

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const networkApi = createApi({
  reducerPath: 'networkApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v11' }),
  endpoints: (builder) => ({
    getNetworkTopology: builder.query({
      query: () => '/blockchain/network/topology',
      pollingInterval: 30000,  // Refresh every 30s
    }),
  }),
});

export const { useGetNetworkTopologyQuery } = networkApi;
```

**Task 4.3: TopologyGraph Component** (4 hours)
```typescript
// Location: enterprise-portal/src/components/NetworkTopology/TopologyGraph.tsx

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Props {
  nodes: Node[];
  edges: Edge[];
  onNodeClick: (node: Node) => void;
}

export const TopologyGraph: React.FC<Props> = ({ nodes, edges, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 600;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // D3 force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    // Render edges
    const link = svg.selectAll('.link')
      .data(edges)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', '#999')
      .attr('stroke-width', d => Math.sqrt(d.bandwidth / 100));

    // Render nodes
    const node = svg.selectAll('.node')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('class', 'node')
      .attr('r', 8)
      .attr('fill', d => nodeColor(d.type))
      .on('click', (event, d) => onNodeClick(d));

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
    });

    return () => simulation.stop();
  }, [nodes, edges]);

  return <svg ref={svgRef} />;
};

function nodeColor(type: string): string {
  switch (type) {
    case 'VALIDATOR': return '#1976d2';
    case 'BUSINESS': return '#388e3c';
    case 'OBSERVER': return '#f57c00';
    default: return '#757575';
  }
}
```

**Task 4.4: Unit Tests** (2 hours)
```typescript
// Location: enterprise-portal/src/components/NetworkTopology/__tests__/NetworkTopology.test.tsx

import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { NetworkTopology } from '../NetworkTopology';
import { store } from '../../../store';

describe('NetworkTopology', () => {
  it('renders loading state', () => {
    render(
      <Provider store={store}>
        <NetworkTopology />
      </Provider>
    );
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders network graph when data loads', async () => {
    // Mock API response
    const mockData = {
      nodes: [
        { id: 'n1', type: 'VALIDATOR', location: { latitude: 40.7, longitude: -74 } },
        { id: 'n2', type: 'BUSINESS', location: { latitude: 34.05, longitude: -118.2 } },
      ],
      edges: [
        { source: 'n1', target: 'n2', latency: 45, bandwidth: 1000 },
      ],
    };

    // ... test implementation
  });

  // 15+ more tests
});
```

**Deliverable**: NetworkTopology.tsx (350 lines + 200 lines tests)
**Story Points**: 7 SP
**Timeline**: 2 days

---

### Day 3-5: BlockSearch Component

#### Objective
Implement advanced block search with multiple filters

#### Tasks

**Task 5.1: Component Structure** (2 hours)
```typescript
// Location: enterprise-portal/src/components/BlockSearch/BlockSearch.tsx

import React, { useState } from 'react';
import { Box, Card, TextField, Button, Select, MenuItem } from '@mui/material';
import { useSearchBlocksMutation } from '../../store/api/blockchainApi';
import SearchResults from './SearchResults';

export const BlockSearch: React.FC = () => {
  const [filters, setFilters] = useState({
    hash: '',
    heightFrom: '',
    heightTo: '',
    validator: '',
    timestampFrom: '',
    timestampTo: '',
  });

  const [searchBlocks, { data, isLoading }] = useSearchBlocksMutation();

  const handleSearch = () => {
    searchBlocks(filters);
  };

  return (
    <Box>
      <Card sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Block Search</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Block Hash"
              value={filters.hash}
              onChange={(e) => setFilters({ ...filters, hash: e.target.value })}
              fullWidth
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              label="Height From"
              type="number"
              value={filters.heightFrom}
              onChange={(e) => setFilters({ ...filters, heightFrom: e.target.value })}
              fullWidth
            />
          </Grid>
          {/* More filters... */}
          <Grid item xs={12}>
            <Button variant="contained" onClick={handleSearch} disabled={isLoading}>
              Search
            </Button>
          </Grid>
        </Grid>
      </Card>

      <SearchResults results={data?.blocks ?? []} isLoading={isLoading} />
    </Box>
  );
};
```

**Task 5.2: Redux API Slice** (30 minutes)
```typescript
// Location: enterprise-portal/src/store/api/blockchainApi.ts

export const blockchainApi = createApi({
  reducerPath: 'blockchainApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/v11' }),
  endpoints: (builder) => ({
    searchBlocks: builder.mutation({
      query: (filters) => ({
        url: '/blockchain/blocks/search',
        method: 'GET',
        params: filters,
      }),
    }),
  }),
});

export const { useSearchBlocksMutation } = blockchainApi;
```

**Task 5.3: SearchResults Component** (3 hours)
```typescript
// Location: enterprise-portal/src/components/BlockSearch/SearchResults.tsx

import React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

const columns: GridColDef[] = [
  { field: 'height', headerName: 'Height', width: 120 },
  { field: 'hash', headerName: 'Hash', width: 200 },
  { field: 'validator', headerName: 'Validator', width: 150 },
  { field: 'transactions', headerName: 'TXs', width: 100 },
  { field: 'size', headerName: 'Size (KB)', width: 120 },
  { field: 'timestamp', headerName: 'Timestamp', width: 180 },
];

export const SearchResults: React.FC<Props> = ({ results, isLoading }) => {
  return (
    <Card>
      <CardContent>
        <DataGrid
          rows={results}
          columns={columns}
          loading={isLoading}
          pageSize={25}
          autoHeight
        />
      </CardContent>
    </Card>
  );
};
```

**Task 5.4: Unit Tests** (2 hours)
```typescript
// Location: enterprise-portal/src/components/BlockSearch/__tests__/BlockSearch.test.tsx

describe('BlockSearch', () => {
  it('renders search form', () => {
    // ... test implementation
  });

  it('performs search on button click', async () => {
    // ... test implementation
  });

  it('displays search results', async () => {
    // ... test implementation
  });

  // 10+ more tests
});
```

**Deliverable**: BlockSearch.tsx (280 lines + 180 lines tests)
**Story Points**: 6 SP
**Timeline**: 2 days

---

## Workstream 3: Test Infrastructure Fixes (Days 1-2)

### Agent Assignment
**Primary**: QAA (Quality Assurance Agent)
**Support**: BDA (Backend Support)
**Story Points**: 8 SP

### Day 1: Fix Test Errors

#### Task 6.1: Fix OnlineLearningServiceTest (2 hours)

**Current Error**:
```
java.lang.RuntimeException: Failed to start quarkus
  at io.quarkus.test.junit.QuarkusTestExtension.throwBootFailureException
```

**Root Cause**: Quarkus CDI context initialization issue

**Fix**:
```java
// Location: src/test/java/io/aurigraph/v11/ai/OnlineLearningServiceTest.java

@QuarkusTest
@TestProfile(OnlineLearningServiceTestProfile.class)  // Add custom profile
public class OnlineLearningServiceTest {

    @Inject
    OnlineLearningService onlineLearningService;

    // ... tests
}

// Create test profile
// Location: src/test/java/io/aurigraph/v11/ai/OnlineLearningServiceTestProfile.java

public class OnlineLearningServiceTestProfile implements QuarkusTestProfile {
    @Override
    public Map<String, String> getConfigOverrides() {
        return Map.of(
            "quarkus.http.test-port", "0",  // Random port
            "quarkus.grpc.server.test-port", "0",
            "ai.optimization.enabled", "true",
            "ai.online-learning.enabled", "true"
        );
    }
}
```

**Validation**:
```bash
./mvnw test -Dtest=OnlineLearningServiceTest
# Should pass all 23 tests
```

#### Task 6.2: Fix PerformanceTests NullPointer (15 minutes)

**Current Error**:
```
java.lang.NullPointerException: Cannot read field "totalRequests"
```

**Fix**:
```java
// Location: src/test/java/io/aurigraph/v11/integration/PerformanceTests.java

@AfterEach
public void tearDownPerformanceTests() {
    if (overallMetrics != null) {  // Add null check
        printPerformanceReport();
    } else {
        log.warn("Performance tests did not initialize metrics");
    }
}
```

**Validation**:
```bash
./mvnw test -Dtest=PerformanceTests
# Should pass without NPE
```

#### Task 6.3: Resolve Duplicate Endpoints (1 hour)

**Issue #1**: Duplicate `/api/v11/performance`
- Exists in: AurigraphResource.java (line 180)
- Also exists in: Phase2ComprehensiveApiResource.java (line 345)

**Fix**: Remove from AurigraphResource.java, keep in Phase2ComprehensiveApiResource.java

```java
// Location: src/main/java/io/aurigraph/v11/AurigraphResource.java

// DELETE this method (lines 180-195)
// @GET
// @Path("/performance")
// public Uni<PerformanceMetrics> getPerformance() {
//     ...
// }

// Keep only in Phase2ComprehensiveApiResource.java
```

**Issue #2**: Duplicate `/api/v11/ai` paths

**Fix**: Rename to avoid conflict

```java
// Location: src/main/java/io/aurigraph/v11/api/AIModelMetricsApiResource.java

@Path("/ai/models")  // Add /models to make path unique
@Produces(MediaType.APPLICATION_JSON)
public class AIModelMetricsApiResource {
    // ... implementation
}
```

**Validation**:
```bash
./mvnw clean compile
# Should have zero route conflicts
```

---

### Day 2: Re-enable and Validate Tests

#### Task 7.1: Incremental Test Re-enabling (4 hours)

**Strategy**: Re-enable tests in small batches, fix as needed

**Batch 1: Unit Tests (50 tests)**
```bash
# Remove @Disabled from 50 unit tests in:
# - TransactionServiceTest.java
# - ConsensusServiceTest.java
# - SecurityServiceTest.java

./mvnw test -Dtest=*ServiceTest
# Fix any failures, aim for 100% pass rate
```

**Batch 2: Integration Tests (25 tests)**
```bash
# Remove @Disabled from:
# - BlockchainIntegrationTest.java
# - ValidatorIntegrationTest.java

./mvnw test -Dtest=*IntegrationTest
# Fix any failures
```

**Batch 3: API Tests (remaining)**
```bash
# Re-enable remaining API endpoint tests
./mvnw test -Dtest=*ApiResourceTest
```

**Task 7.2: Full Test Suite Validation** (1 hour)
```bash
# Run complete test suite
./mvnw clean test

# Target results:
# Tests run: 872
# Failures: 0
# Errors: 0
# Skipped: <50 (only E2E tests allowed to skip)
```

**Task 7.3: Update Test Documentation** (30 minutes)
- Document all fixed test issues
- Update COMPREHENSIVE-TEST-PLAN.md
- Create TEST-FIXES-SPRINT13-WEEK2.md

---

## Workstream 4: Documentation & Infrastructure (Days 1-5)

### Agent Assignment
**Primary**: DOA (Documentation Agent)
**Support**: DDA (DevOps)
**Story Points**: 5 SP

### Day 1-2: OpenAPI Documentation

#### Task 8.1: Add Quarkus OpenAPI Extension (30 minutes)
```xml
<!-- Location: pom.xml -->
<dependency>
    <groupId>io.quarkus</groupId>
    <artifactId>quarkus-smallrye-openapi</artifactId>
</dependency>
```

#### Task 8.2: Configure OpenAPI (1 hour)
```properties
# Location: src/main/resources/application.properties

# OpenAPI configuration
quarkus.smallrye-openapi.path=/openapi
quarkus.swagger-ui.always-include=true
quarkus.swagger-ui.path=/swagger-ui

# API Info
mp.openapi.extensions.smallrye.info.title=Aurigraph V11 API
mp.openapi.extensions.smallrye.info.version=11.3.0
mp.openapi.extensions.smallrye.info.description=High-performance blockchain platform
mp.openapi.extensions.smallrye.info.contact.name=Aurigraph DLT Team
mp.openapi.extensions.smallrye.info.license.name=Proprietary
```

#### Task 8.3: Add API Annotations (3 hours)
```java
// Location: src/main/java/io/aurigraph/v11/api/NetworkTopologyApiResource.java

import org.eclipse.microprofile.openapi.annotations.*;
import org.eclipse.microprofile.openapi.annotations.media.*;
import org.eclipse.microprofile.openapi.annotations.responses.*;

@Path("/api/v11/blockchain/network")
@Produces(MediaType.APPLICATION_JSON)
@Tag(name = "Network", description = "Network topology and monitoring endpoints")
public class NetworkTopologyApiResource {

    @GET
    @Path("/topology")
    @Operation(
        summary = "Get network topology",
        description = "Returns the complete network topology including nodes, edges, and connection metrics"
    )
    @APIResponse(
        responseCode = "200",
        description = "Network topology retrieved successfully",
        content = @Content(
            mediaType = MediaType.APPLICATION_JSON,
            schema = @Schema(implementation = NetworkTopology.class)
        )
    )
    @APIResponse(
        responseCode = "500",
        description = "Internal server error"
    )
    public Uni<NetworkTopology> getTopology() {
        // ... implementation
    }
}
```

**Repeat for all 26 endpoints**

#### Task 8.4: Validate OpenAPI Spec (1 hour)
```bash
# Start application
./mvnw quarkus:dev

# Access OpenAPI spec
curl http://localhost:9003/openapi

# Access Swagger UI
open http://localhost:9003/swagger-ui

# Validate spec
npx @apidevtools/swagger-cli validate http://localhost:9003/openapi
```

---

### Day 3-4: API Usage Examples

#### Task 9.1: Create API Examples Document (4 hours)
```markdown
# Location: API-USAGE-EXAMPLES.md

# Aurigraph V11 API Usage Examples

## Network Topology

### Get Full Network Topology
```bash
curl -X GET http://localhost:9003/api/v11/blockchain/network/topology \
  -H "Accept: application/json" | jq .
```

**Response**:
```json
{
  "totalNodes": 45,
  "activeNodes": 42,
  "nodes": [...],
  "edges": [...]
}
```

### Search Blocks by Hash
```bash
curl -X GET "http://localhost:9003/api/v11/blockchain/blocks/search?hash=0x123abc" \
  -H "Accept: application/json" | jq .
```

... (50+ more examples for all 26 endpoints)
```

#### Task 9.2: Create Postman Collection (2 hours)
```json
// Location: postman/Aurigraph-V11.postman_collection.json

{
  "info": {
    "name": "Aurigraph V11 API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Network Topology",
      "request": {
        "method": "GET",
        "url": "{{baseUrl}}/api/v11/blockchain/network/topology"
      }
    },
    // ... 26 requests
  ]
}
```

---

### Day 5: Staging Environment Setup

#### Task 10.1: Staging Deployment Script (2 hours)
```bash
#!/bin/bash
# Location: deploy-staging.sh

set -e

echo "Building native image..."
./mvnw clean package -Pnative-fast

echo "Uploading to staging server..."
scp target/aurigraph-v11-standalone-11.0.0-runner \
  subbu@dlt.aurigraph.io:/opt/aurigraph/staging/

echo "Deploying systemd service..."
ssh subbu@dlt.aurigraph.io << 'EOF'
  sudo systemctl stop aurigraph-staging
  sudo cp /opt/aurigraph/staging/aurigraph-v11-standalone-11.0.0-runner \
         /opt/aurigraph/staging/current
  sudo chmod +x /opt/aurigraph/staging/current
  sudo systemctl start aurigraph-staging
  sudo systemctl status aurigraph-staging
EOF

echo "Validating deployment..."
sleep 10
curl -f https://staging.dlt.aurigraph.io/api/v11/health || exit 1

echo "✅ Staging deployment successful!"
```

#### Task 10.2: Staging Validation Tests (2 hours)
```bash
#!/bin/bash
# Location: validate-staging.sh

echo "Running staging validation tests..."

# Health check
curl -f https://staging.dlt.aurigraph.io/api/v11/health || exit 1

# Performance check
RESPONSE=$(curl -s -X POST https://staging.dlt.aurigraph.io/api/v11/performance \
  -H "Content-Type: application/json" \
  -d '{"transactions": 1000}')

TPS=$(echo $RESPONSE | jq -r '.tps')
if (( $(echo "$TPS < 100000" | bc -l) )); then
  echo "❌ TPS too low: $TPS"
  exit 1
fi

echo "✅ Staging validation passed!"
```

---

## Daily Schedule & Milestones

### Day 1 (Friday, Oct 25)
**Focus**: Test fixes + optimization start

**Morning (9 AM - 12 PM)**:
- ✅ Fix OnlineLearningServiceTest (QAA - 2h)
- ✅ Fix PerformanceTests NullPointer (QAA - 15min)
- ✅ Resolve duplicate endpoints (QAA - 1h)

**Afternoon (1 PM - 5 PM)**:
- ✅ Replace virtual threads with platform threads (BDA - 2h)
- ✅ Update configuration (BDA - 30min)
- ✅ Add monitoring metrics (BDA - 1h)
- ✅ Add Quarkus OpenAPI extension (DOA - 30min)

**End of Day Deliverables**:
- Zero test errors ✅
- Platform thread migration code complete ✅
- OpenAPI infrastructure ready ✅

---

### Day 2 (Monday, Oct 28)
**Focus**: Week 1 optimization validation + Portal start

**Morning (9 AM - 12 PM)**:
- ✅ Run Week 1 performance tests (BDA - 2h)
- ✅ Analyze JFR results (BDA - 1h)
- ✅ Start NetworkTopology component structure (FDA - 3h)

**Afternoon (1 PM - 5 PM)**:
- ✅ Validate Week 1 success criteria (BDA - 1h)
- ✅ Re-enable test batch 1 (QAA - 2h)
- ✅ Configure OpenAPI (DOA - 1h)
- ✅ Create Redux API slice for NetworkTopology (FDA - 1h)

**End of Day Deliverables**:
- Week 1 optimization validated (≥1.0M TPS) ✅
- 50 unit tests re-enabled ✅
- NetworkTopology component 40% complete ✅

---

### Day 3 (Tuesday, Oct 29)
**Focus**: Week 2 optimization start + Portal progress

**Morning (9 AM - 12 PM)**:
- ✅ Add Disruptor dependency (BDA - 15min)
- ✅ Create TransactionEvent wrapper (BDA - 1h)
- ✅ Continue NetworkTopology TopologyGraph (FDA - 3h)

**Afternoon (1 PM - 5 PM)**:
- ✅ Implement Disruptor ring buffer (BDA - 3h)
- ✅ Re-enable test batch 2 (QAA - 2h)
- ✅ Add OpenAPI annotations (DOA - 3h)

**End of Day Deliverables**:
- Disruptor ring buffer implemented ✅
- 75 total tests re-enabled ✅
- NetworkTopology component 70% complete ✅

---

### Day 4 (Wednesday, Oct 30)
**Focus**: Week 2 validation + BlockSearch start

**Morning (9 AM - 12 PM)**:
- ✅ Add ring buffer overflow handling (BDA - 1h)
- ✅ Run Week 2 performance tests (BDA - 2h)
- ✅ Complete NetworkTopology unit tests (FDA - 2h)

**Afternoon (1 PM - 5 PM)**:
- ✅ Validate Week 2 success criteria (BDA - 1h)
- ✅ Start BlockSearch component (FDA - 2h)
- ✅ Full test suite validation (QAA - 1h)
- ✅ Create API usage examples (DOA - 2h)

**End of Day Deliverables**:
- Week 2 optimization validated (≥1.4M TPS) ✅
- NetworkTopology component 100% complete ✅
- All tests passing (0 errors) ✅

---

### Day 5 (Thursday, Oct 31)
**Focus**: Reporting + BlockSearch completion + deployment

**Morning (9 AM - 12 PM)**:
- ✅ Generate performance report (BDA - 2h)
- ✅ Complete BlockSearch component (FDA - 3h)

**Afternoon (1 PM - 5 PM)**:
- ✅ BlockSearch unit tests (FDA - 2h)
- ✅ Staging deployment (DDA - 2h)
- ✅ Update all documentation (DOA - 2h)

**End of Day Deliverables**:
- SPRINT13_WEEK2_PERFORMANCE_REPORT.md ✅
- 2 Portal components complete ✅
- Staging environment deployed ✅
- All documentation updated ✅

---

## Success Criteria & Validation

### Week 2 Success Criteria (ALL must be met)

**Performance Optimization**:
- ✅ Week 1: TPS ≥1.0M sustained for 30 minutes
- ✅ Week 1: Virtual thread CPU <5% (was 56%)
- ✅ Week 2: TPS ≥1.4M sustained for 30 minutes
- ✅ Week 2: ArrayBlockingQueue samples = 0
- ✅ Latency P99: <10ms (both weeks)
- ✅ Error rate: <0.01% (both weeks)

**Test Infrastructure**:
- ✅ Test errors: 0 (was 2)
- ✅ Tests passing: ≥100 (was 78)
- ✅ Skipped tests: <50 (was 870)
- ✅ No flaky tests

**Enterprise Portal**:
- ✅ NetworkTopology.tsx: 100% complete with tests
- ✅ BlockSearch.tsx: 100% complete with tests
- ✅ Test coverage: ≥85% for both components
- ✅ Zero compilation errors
- ✅ Zero runtime errors

**Documentation**:
- ✅ OpenAPI spec: 100% coverage (all 26 endpoints)
- ✅ Swagger UI: Operational
- ✅ API examples: 26 endpoints documented
- ✅ Postman collection: Complete

**Infrastructure**:
- ✅ Staging deployment: Successful
- ✅ Staging validation: All tests passing
- ✅ Production readiness: 95%+

---

## Risk Assessment & Mitigation

### Technical Risks

**Risk #1: Platform Thread Migration Fails**
**Probability**: LOW (15%)
**Impact**: HIGH
**Mitigation**:
- Thorough JFR analysis validates approach
- Rollback plan tested and ready
- Can fall back to virtual threads
**Contingency**: Keep virtual threads, skip to Week 3 optimization

**Risk #2: Ring Buffer Overflow**
**Probability**: MEDIUM (30%)
**Impact**: MEDIUM
**Mitigation**:
- Overflow handling implemented
- Fallback to direct processing
- Monitoring added
**Contingency**: Increase ring buffer to 2M, or revert to ArrayBlockingQueue

**Risk #3: Test Re-enabling Uncovers Issues**
**Probability**: MEDIUM (40%)
**Impact**: MEDIUM
**Mitigation**:
- Incremental batch re-enabling
- Fix issues immediately
- Daily test status reports
**Contingency**: Keep problematic tests disabled, fix in Sprint 14

**Risk #4: Portal Component Integration Issues**
**Probability**: LOW (20%)
**Impact**: LOW
**Mitigation**:
- TDD approach (tests first)
- API contract already validated
- Redux patterns proven
**Contingency**: Simplify UI, defer advanced features to Sprint 14

---

### Schedule Risks

**Risk #5: Performance Testing Takes Longer**
**Probability**: MEDIUM (35%)
**Impact**: MEDIUM
**Mitigation**:
- Automated test scripts ready
- Parallel testing where possible
- Can reduce iterations from 5 to 3
**Contingency**: Extend Week 2 by 1 day (acceptable)

**Risk #6: Portal Development Delays**
**Probability**: MEDIUM (40%)
**Impact**: LOW
**Mitigation**:
- Parallel workstream (not blocking optimization)
- Can defer to Sprint 14
- MVP approach (core features first)
**Contingency**: Ship 1 component instead of 2 (acceptable)

---

## Definition of Done

### Sprint 13 Week 2 Complete When:

**Performance Optimization**:
- [x] Week 1 optimization implemented and validated (≥1.0M TPS)
- [x] Week 2 optimization implemented and validated (≥1.4M TPS)
- [x] Performance report generated with before/after comparison
- [x] All code committed to main branch
- [x] JFR profiles archived for future reference

**Test Infrastructure**:
- [x] Zero test errors (OnlineLearningServiceTest fixed, PerformanceTests fixed)
- [x] Duplicate endpoints resolved
- [x] ≥100 tests passing (re-enabled from skipped)
- [x] Test documentation updated

**Enterprise Portal**:
- [x] NetworkTopology.tsx: 100% implementation + ≥85% test coverage
- [x] BlockSearch.tsx: 100% implementation + ≥85% test coverage
- [x] Redux API slices created and tested
- [x] Components integrated into main portal
- [x] Zero compilation errors, zero console warnings

**Documentation**:
- [x] OpenAPI spec generated for all 26 endpoints
- [x] Swagger UI accessible at /swagger-ui
- [x] API-USAGE-EXAMPLES.md created with 26 examples
- [x] Postman collection exported
- [x] All sprint documentation updated (TODO.md, SPRINT_PLAN.md)

**Infrastructure**:
- [x] Staging environment deployed with optimized build
- [x] Staging validation tests passing
- [x] Deployment scripts tested and documented

**Code Quality**:
- [x] Zero compilation errors
- [x] Zero test failures
- [x] Code review completed (by tech lead)
- [x] All commits include meaningful messages
- [x] No TODO comments in production code

---

## Next Steps After Week 2

### Sprint 13 Week 3-4 Preview

**Week 3 Focus**: Allocation reduction optimization
- Remove ScheduledThreadPoolExecutor (saves 5.6 GB/30min)
- Implement Transaction object pool (saves 970 MB/30min)
- Target: 1.6M TPS

**Week 4 Focus**: Database optimization
- Cache Hibernate query plans
- Scale DB connection pool to 200
- Target: 2.0M+ TPS

**Portal Development**: Continue Phase 1 components (remaining 5)

### Sprint 14 Preview (Nov 1-14)

**Focus**: Real-time features + advanced capabilities
- WebSocket integration for live data
- Implement 8 Phase 2 Portal components
- Load testing (10K concurrent users)
- Security audit

### Sprint 15 Preview (Nov 15-22)

**Focus**: Validation, testing, deployment
- Comprehensive integration testing
- Performance validation at scale
- Production deployment
- User acceptance testing

---

## Appendix: Commands Quick Reference

### Performance Testing
```bash
# Start app with JFR profiling
jcmd $APP_PID JFR.start name=test duration=30m filename=profile.jfr

# Run load test
curl -X POST http://localhost:9003/api/v11/performance \
  -H "Content-Type: application/json" \
  -d '{"transactions": 1000000}'

# Analyze JFR
jfr summary profile.jfr
python3 analyze-jfr.py profile.jfr
```

### Testing
```bash
# Run all tests
./mvnw clean test

# Run specific test
./mvnw test -Dtest=OnlineLearningServiceTest

# Run with coverage
./mvnw test jacoco:report
```

### Portal Development
```bash
cd enterprise-portal

# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Deployment
```bash
# Build native
./mvnw package -Pnative-fast

# Deploy to staging
./deploy-staging.sh

# Validate staging
./validate-staging.sh
```

---

**Document Version**: 1.0
**Created**: October 25, 2025
**Author**: PMA (Project Management Agent) + DOA (Documentation Agent)
**Status**: ✅ **READY FOR EXECUTION**
**Next Review**: End of Sprint 13 Week 2 (October 31, 2025)

---

**END OF SPRINT 13 WEEK 2 PLAN**
