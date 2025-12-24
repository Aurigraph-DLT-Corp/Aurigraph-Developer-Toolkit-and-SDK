# STORY 7: Monitoring & Instrumentation Strategy
## AV11-601-07 - Virtual Validator Board Production Monitoring

**Document Version**: 1.0
**Status**: Production-Ready
**Sprint**: Jan 3-7, 2026
**Last Updated**: December 23, 2025

---

## EXECUTIVE SUMMARY

Story 7 implements enterprise-grade monitoring, metrics collection, alerting, and observability infrastructure for the VVB approval system. This document defines Prometheus metrics, Grafana dashboards, alert rules, ELK stack logging, and distributed tracing configuration.

**Monitoring Objectives**:
- Collect 25+ business and technical metrics
- Real-time visibility through 4 Grafana dashboards
- Proactive alerting with 10+ critical rules
- Complete request tracing with Jaeger
- Structured logging with ELK stack
- SLA compliance monitoring

**Key Metrics**:
- Metric Collection: 25+ metrics per endpoint
- Alert Rules: 10+ critical, 15+ warning thresholds
- Dashboard Coverage: 4 comprehensive dashboards
- Log Retention: 30 days searchable, 1 year archived
- Trace Sampling: 5% (production), 100% (staging)

---

## 1. PROMETHEUS METRICS COLLECTION

### 1.1 Metrics Architecture

```
┌─────────────────────────────────────────────────────┐
│       Application Services (Story 2-6)              │
│  (VVBApprovalService, SecondaryTokenService, etc)  │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
       ┌─────────────────────┐
       │  Micrometer Facade  │
       │  (OpenMetrics API)  │
       └────────┬────────────┘
                │
    ┌───────────┼──────────────┐
    ↓           ↓              ↓
┌─────────┐ ┌──────────┐ ┌──────────────┐
│ Counter │ │ Histogram│ │ GaugeValue   │
│         │ │          │ │              │
│ Rates   │ │ Latency  │ │ Queue Size   │
│ Events  │ │ Timing   │ │ Active Conn  │
└─────────┘ └──────────┘ └──────────────┘
    │           │              │
    └───────────┼──────────────┘
                ↓
    ┌──────────────────────────┐
    │ Prometheus Registry       │
    │ (Text Format Exposition)  │
    └────────────┬─────────────┘
                 │
                 ↓
    ┌──────────────────────────┐
    │ Prometheus Server        │
    │ :9090                    │
    │ ├─ Scrape every 15s      │
    │ ├─ Retention: 15 days    │
    │ └─ Remote Storage: S3    │
    └────────────┬─────────────┘
                 │
    ┌────────────┼─────────────┬──────────────┐
    ↓            ↓             ↓              ↓
┌────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐
│ Grafana│ │ AlertMgr│ │Datadog   │ │ CloudWatch   │
│        │ │         │ │ (optional)│ │ (optional)   │
└────────┘ └─────────┘ └──────────┘ └──────────────┘
```

### 1.2 Application Metrics (25+ total)

#### VVB Approval Request Metrics

```yaml
vvb_approval_requests_total:
  type: Counter
  description: Total approval requests submitted
  labels: [tier, status, region]
  unit: requests
  example: vvb_approval_requests_total{tier="ELEVATED",status="submitted"} 15423

vvb_approval_requests_pending:
  type: Gauge
  description: Current pending approval requests
  labels: [tier, region]
  unit: requests
  example: vvb_approval_requests_pending{tier="STANDARD"} 127

vvb_approval_submission_latency:
  type: Histogram
  description: Time to submit approval request
  labels: [tier, outcome]
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000]
  unit: milliseconds
  example: vvb_approval_submission_latency_bucket{tier="ELEVATED",le="100"} 1523

vvb_approval_requests_failed:
  type: Counter
  description: Failed approval submissions
  labels: [tier, reason]
  unit: requests
  example: vvb_approval_requests_failed{tier="CRITICAL",reason="validation_error"} 45
```

#### Consensus & Voting Metrics

```yaml
vvb_votes_received_total:
  type: Counter
  description: Total votes cast by all validators
  labels: [validator_id, vote_type, approval_tier]
  unit: votes
  example: vvb_votes_received_total{validator_id="val-001",vote_type="approve"} 2543

vvb_vote_processing_latency:
  type: Histogram
  description: Time to process individual vote
  labels: [validator_id, approval_tier]
  buckets: [2, 5, 10, 20, 50, 100, 200]
  unit: milliseconds
  example: vvb_vote_processing_latency{validator_id="val-001",le="10"} 5234

vvb_consensus_calculation_latency:
  type: Histogram
  description: Time to calculate consensus from votes
  labels: [approval_tier, outcome]
  buckets: [5, 10, 25, 50, 100, 250, 500]
  unit: milliseconds
  example: vvb_consensus_calculation_latency{tier="ELEVATED",outcome="approved",le="50"} 1234

vvb_consensus_decisions_total:
  type: Counter
  description: Total consensus decisions made
  labels: [outcome, approval_tier]
  unit: decisions
  example: vvb_consensus_decisions_total{outcome="approved",tier="STANDARD"} 8932

vvb_quorum_misses_total:
  type: Counter
  description: Approvals failed to meet quorum threshold
  labels: [approval_tier, reason]
  unit: failures
  example: vvb_quorum_misses_total{tier="CRITICAL",reason="insufficient_votes"} 23
```

#### Token Lifecycle Metrics

```yaml
vvb_tokens_submitted_total:
  type: Counter
  description: Total tokens submitted for approval
  labels: [token_type, tier]
  unit: tokens
  example: vvb_tokens_submitted_total{token_type="SECONDARY",tier="ELEVATED"} 3421

vvb_tokens_activated_total:
  type: Counter
  description: Total tokens activated after approval
  labels: [token_type, parent_type]
  unit: tokens
  example: vvb_tokens_activated_total{token_type="SECONDARY",parent_type="PRIMARY"} 2134

vvb_tokens_approval_latency:
  type: Histogram
  description: Time from submission to final approval
  labels: [token_type, approval_tier]
  buckets: [100, 500, 1000, 5000, 10000, 30000, 60000]
  unit: milliseconds
  example: vvb_tokens_approval_latency{token_type="SECONDARY",le="5000"} 1243

vvb_tokens_rejected_total:
  type: Counter
  description: Total tokens rejected
  labels: [token_type, reason]
  unit: tokens
  example: vvb_tokens_rejected_total{token_type="COMPOSITE",reason="cascade_violation"} 42

vvb_token_approval_expired_total:
  type: Counter
  description: Approvals expired without decision (7-day window)
  labels: [token_type]
  unit: tokens
  example: vvb_token_approval_expired_total{token_type="SECONDARY"} 15
```

#### Cascade & Governance Metrics

```yaml
vvb_cascade_validations_total:
  type: Counter
  description: Cascade validation checks performed
  labels: [action, result]
  unit: validations
  example: vvb_cascade_validations_total{action="retirement",result="blocked"} 156

vvb_cascade_validation_latency:
  type: Histogram
  description: Time to perform cascade validation
  labels: [action]
  buckets: [2, 5, 10, 20, 50, 100]
  unit: milliseconds
  example: vvb_cascade_validation_latency{action="retirement",le="20"} 2341

vvb_governance_violations_total:
  type: Counter
  description: Governance rule violations detected
  labels: [rule_type, violation]
  unit: violations
  example: vvb_governance_violations_total{rule_type="retirement",violation="active_children"} 12

vvb_parent_tokens_blocked:
  type: Gauge
  description: Parent tokens currently blocked from retirement
  labels: [parent_type]
  unit: tokens
  example: vvb_parent_tokens_blocked{parent_type="PRIMARY"} 8
```

#### Registry & Database Metrics

```yaml
vvb_registry_operations_total:
  type: Counter
  description: Total registry operations (add, update, delete, query)
  labels: [operation, entity_type]
  unit: operations
  example: vvb_registry_operations_total{operation="add",entity_type="approval"} 12543

vvb_registry_operation_latency:
  type: Histogram
  description: Time to perform registry operation
  labels: [operation, entity_type]
  buckets: [1, 2, 5, 10, 20, 50, 100, 200]
  unit: milliseconds
  example: vvb_registry_operation_latency{operation="query",entity_type="approval",le="10"} 4532

vvb_registry_size_bytes:
  type: Gauge
  description: Current registry memory usage
  labels: [entity_type]
  unit: bytes
  example: vvb_registry_size_bytes{entity_type="approvals"} 2148576

vvb_database_connections_active:
  type: Gauge
  description: Active database connections
  labels: [pool_name]
  unit: connections
  example: vvb_database_connections_active{pool_name="vvb_pool"} 12

vvb_database_query_latency:
  type: Histogram
  description: Database query execution time
  labels: [query_type]
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000]
  unit: milliseconds
  example: vvb_database_query_latency{query_type="timeline_query",le="100"} 2341
```

#### Service Integration Metrics

```yaml
vvb_event_publishing_total:
  type: Counter
  description: CDI events published by VVB
  labels: [event_type, target_service]
  unit: events
  example: vvb_event_publishing_total{event_type="ApprovalDecisionEvent",target_service="composite_assembly"} 2341

vvb_event_publishing_latency:
  type: Histogram
  description: Time to publish event
  labels: [event_type]
  buckets: [2, 5, 10, 20, 50, 100]
  unit: milliseconds
  example: vvb_event_publishing_latency{event_type="ApprovalDecisionEvent",le="20"} 2143

vvb_external_service_calls_total:
  type: Counter
  description: Calls to external services (token registry, merkle service)
  labels: [service_name, outcome]
  unit: calls
  example: vvb_external_service_calls_total{service_name="secondary_token_service",outcome="success"} 5421

vvb_external_service_latency:
  type: Histogram
  description: Latency calling external services
  labels: [service_name]
  buckets: [10, 25, 50, 100, 250, 500, 1000, 2000]
  unit: milliseconds
  example: vvb_external_service_latency{service_name="secondary_token_service",le="100"} 3241
```

#### System Health Metrics

```yaml
vvb_validator_availability:
  type: Gauge
  description: Percentage of available validators
  labels: [region]
  unit: percent
  example: vvb_validator_availability{region="us-east"} 98.5

vvb_approval_throughput:
  type: Counter (calculated from rate)
  description: Approval completions per second
  unit: approvals/sec
  calculation: rate(vvb_consensus_decisions_total[1m])
  target: >1,000 approvals/sec

vvb_approval_success_rate:
  type: Gauge (calculated)
  description: Percentage of approvals that complete successfully
  unit: percent
  calculation: 100 * (APPROVED / TOTAL)
  target: >99.9%
```

### 1.3 Infrastructure Metrics (JVM + System)

```yaml
jvm_memory_used_bytes:
  type: Gauge
  description: JVM heap memory currently used
  unit: bytes
  target: < 512MB sustained

jvm_memory_max_bytes:
  type: Gauge
  description: JVM heap memory maximum
  unit: bytes
  config: -Xmx1024m

jvm_gc_collection_seconds_total:
  type: Counter
  description: Time spent in garbage collection
  unit: seconds
  target: < 100ms pause times

jvm_threads_live:
  type: Gauge
  description: Current number of live threads
  unit: threads
  target: < 256 concurrent

http_requests_total:
  type: Counter
  description: Total HTTP requests
  labels: [method, path, status]
  unit: requests

http_request_duration_seconds:
  type: Histogram
  description: HTTP request latency
  labels: [method, path]
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5]
  unit: seconds
```

### 1.4 Metrics Exposure Configuration

```properties
# application.properties
quarkus.micrometer.enabled=true
quarkus.micrometer.export.prometheus.enabled=true
quarkus.micrometer.export.prometheus.path=/q/metrics

# Metrics endpoint (no auth for internal scraping)
quarkus.micrometer.binder.jvm.enabled=true
quarkus.micrometer.binder.system.enabled=true
quarkus.micrometer.binder.vertx.enabled=true

# Custom histogram configuration
quarkus.micrometer.binder.http-server.match-patterns=/api/.*

# Tag configuration
quarkus.application.name=aurigraph-v12-vvb
quarkus.application.version=12.0.0
```

---

## 2. GRAFANA DASHBOARDS

### 2.1 Dashboard Architecture

```
┌─────────────────────────────────────────────────┐
│         Grafana Dashboard Layer (:3000)         │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Dashboard 1: VVB Health Dashboard       │  │
│  │  - Request rates, consensus latency      │  │
│  │  - Error rates, validator availability  │  │
│  │  - Real-time status indicators          │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Dashboard 2: Performance Dashboard      │  │
│  │  - Throughput (approvals/sec)           │  │
│  │  - Latency percentiles (P50, P95, P99)  │  │
│  │  - Resource utilization (CPU, Memory)   │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ├──────────────────────────────────────────┐  │
│  │  Dashboard 3: Approval Audit Dashboard  │  │
│  │  - Approvals by type/tier               │  │
│  │  - Approval rates over time             │  │
│  │  - Rejection rates and reasons          │  │
│  │  - Cascade effects visibility           │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  ┌──────────────────────────────────────────┐  │
│  │  Dashboard 4: System Health Dashboard    │  │
│  │  - Uptime and availability               │  │
│  │  - Error rate trends                    │  │
│  │  - Resource utilization forecasting      │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
└─────────────────┬──────────────────────────────┘
                  │
                  ↓
          ┌───────────────┐
          │ Prometheus    │
          │ Data Source   │
          │ :9090         │
          └───────────────┘
```

### 2.2 Dashboard 1: VVB Health Dashboard

**URL**: http://grafana:3000/d/vvb-health

**Purpose**: Real-time monitoring of approval system health

**Panels**:

1. **Approval Request Rate (line chart)**
   ```
   Query: rate(vvb_approval_requests_total[1m])
   Legend: {{tier}}
   Y-axis: Requests/sec
   Target: STANDARD >100/sec, ELEVATED >50/sec, CRITICAL >20/sec
   Alert: RED if STANDARD < 10/sec
   ```

2. **Pending Approvals (gauge)**
   ```
   Query: vvb_approval_requests_pending
   Threshold: YELLOW > 1000, RED > 5000
   Unit: requests
   Description: "Active approval requests waiting for consensus"
   ```

3. **Consensus Latency P99 (line chart)**
   ```
   Query: histogram_quantile(0.99, vvb_consensus_calculation_latency_bucket)
   Legend: {{approval_tier}}
   Y-axis: Milliseconds
   Target: < 100ms for all tiers
   Alert: RED if P99 > 200ms
   ```

4. **Approval Success Rate (gauge)**
   ```
   Query: 100 * (rate(vvb_consensus_decisions_total{outcome="approved"}[5m]) /
           rate(vvb_consensus_decisions_total[5m]))
   Threshold: GREEN > 99%, YELLOW > 95%, RED < 95%
   Unit: percent
   ```

5. **Validator Availability (heatmap)**
   ```
   Query: vvb_validator_availability
   Legend: {{region}}
   Threshold: GREEN > 95%, YELLOW > 80%, RED < 80%
   Description: "Available validators per region"
   ```

6. **Vote Processing Rate (single stat)**
   ```
   Query: rate(vvb_votes_received_total[1m])
   Unit: votes/sec
   Target: >5,000 votes/sec
   ```

7. **Error Rate (line chart)**
   ```
   Query: rate(vvb_approval_requests_failed[1m])
   Legend: {{reason}}
   Y-axis: Errors/sec
   Target: < 0.1 errors/sec
   Alert: RED if > 1 error/sec
   ```

8. **Approval Timeout Events (counter)**
   ```
   Query: vvb_token_approval_expired_total
   Unit: expired approvals
   Description: "Approvals expired without decision in 7-day window"
   ```

### 2.3 Dashboard 2: Performance Dashboard

**URL**: http://grafana:3000/d/vvb-performance

**Purpose**: Deep performance analysis for SLA compliance

**Panels**:

1. **Approval Throughput (line chart)**
   ```
   Query: rate(vvb_consensus_decisions_total[1m])
   Target: >1,000 approvals/sec
   Annotation: SLA threshold at 1,000
   Alert: YELLOW if < 800/sec, RED if < 500/sec
   ```

2. **Approval Latency Percentiles (heatmap)**
   ```
   Queries:
   - P50: histogram_quantile(0.50, ...)
   - P95: histogram_quantile(0.95, ...)
   - P99: histogram_quantile(0.99, ...)
   - P99.9: histogram_quantile(0.999, ...)

   Y-axis: Milliseconds
   Targets: P50 <25ms, P95 <60ms, P99 <100ms, P99.9 <200ms
   ```

3. **CPU Utilization (gauge + line)**
   ```
   Query: 100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
   Threshold: GREEN < 60%, YELLOW 60-80%, RED > 80%
   Target: < 60% sustained
   ```

4. **Memory Utilization (gauge + line)**
   ```
   Query: 100 * (jvm_memory_used_bytes / jvm_memory_max_bytes)
   Threshold: GREEN < 70%, YELLOW 70-85%, RED > 85%
   Target: < 70% sustained
   Alert: RED if > 90% (potential OOM)
   ```

5. **Request Duration by Endpoint (table)**
   ```
   Query: topk(10, rate(http_request_duration_seconds_sum[5m]))
   Columns: [endpoint, P50, P95, P99, avg_duration]
   Sort: By P99 descending
   Highlight: Endpoints exceeding SLA
   ```

6. **GC Pause Times (heatmap)**
   ```
   Query: jvm_gc_collection_seconds_total (rate)
   Target: < 100ms pause times
   Alert: RED if any pause > 500ms
   ```

7. **Thread Pool Utilization (line chart)**
   ```
   Query: jvm_threads_live / (jvm_threads_started_total * 10)
   Y-axis: Percent
   Target: < 50% saturation
   Alert: YELLOW if > 70%, RED if > 90%
   ```

8. **Database Connection Pool (gauge)**
   ```
   Query: vvb_database_connections_active
   Target: < 20 active connections
   Alert: YELLOW > 15, RED > 20
   ```

### 2.4 Dashboard 3: Approval Audit Dashboard

**URL**: http://grafana:3000/d/vvb-audit

**Purpose**: Business-level approval tracking and compliance

**Panels**:

1. **Approvals by Type (stacked bar chart)**
   ```
   Query: sum by (token_type) (vvb_tokens_submitted_total)
   Legend: {{token_type}}
   Interval: Daily
   Y-axis: Approval count
   ```

2. **Approval Rate Trend (line chart)**
   ```
   Query: rate(vvb_tokens_activated_total[1h])
   Y-axis: Approvals/hour
   Interval: 1-hour buckets
   Description: "Hourly approval completion rate"
   ```

3. **Rejection Rate by Reason (pie chart)**
   ```
   Query: sum by (reason) (vvb_tokens_rejected_total)
   Legend: {{reason}}
   Show percents: true
   Top reasons: cascade_violation, quorum_not_met, validation_error
   ```

4. **Approval Latency by Tier (box plot)**
   ```
   Queries: (separate for STANDARD, ELEVATED, CRITICAL)
   - Median, P25, P75, P90
   Y-axis: Milliseconds
   Target: All tiers < 500ms median
   ```

5. **Cascade Validations Summary (stat cards)**
   ```
   Panel 1: Total validations
   Query: vvb_cascade_validations_total

   Panel 2: Blocked actions
   Query: vvb_cascade_validations_total{result="blocked"}

   Panel 3: Average validation time
   Query: avg(vvb_cascade_validation_latency_bucket)
   Unit: milliseconds
   ```

6. **Governance Violations Timeline (line chart)**
   ```
   Query: increase(vvb_governance_violations_total[1d])
   Legend: {{rule_type}}
   Y-axis: Violations/day
   Target: < 10 violations/day
   Alert: RED if > 100 violations/day
   ```

7. **Parent Token Status (stat table)**
   ```
   Query: vvb_parent_tokens_blocked
   Columns: [parent_id, block_reason, blocked_since, child_count]
   Description: "Parent tokens blocked from retirement"
   ```

8. **Approval Timeline Distribution (histogram)**
   ```
   Query: rate(vvb_tokens_approval_latency_bucket[1h])
   Buckets: [0-100ms, 100-500ms, 500-1000ms, 1-5s, 5-30s, 30+ seconds]
   Y-axis: % of approvals
   Target: >90% complete in < 1 second
   ```

### 2.5 Dashboard 4: System Health Dashboard

**URL**: http://grafana:3000/d/vvb-system-health

**Purpose**: Infrastructure and system-level health monitoring

**Panels**:

1. **Service Uptime (stat)**
   ```
   Query: 100 * (sum(rate(http_requests_total[5m])) / sum(rate(http_requests_total[5m])))
   Unit: percent
   Target: > 99.95% (5 nines)
   Alert: RED if < 99.9%
   ```

2. **Error Rate Trend (line chart)**
   ```
   Query: rate(http_requests_total{status=~"5.."}[1m])
   Y-axis: Errors/sec
   Target: < 0.01 errors/sec (< 1 error per 100 seconds)
   Alert: YELLOW if > 0.1/sec, RED if > 1/sec
   ```

3. **Response Time SLA Compliance (gauge)**
   ```
   Query: 100 * (count(vvb_consensus_calculation_latency_bucket{le="100"}) /
           count(vvb_consensus_calculation_latency_bucket{le="+Inf"}))
   Threshold: GREEN > 99%, YELLOW > 95%, RED < 95%
   Description: "Percentage of operations meeting <100ms SLA"
   ```

4. **Database Health (status card)**
   ```
   Query: vvb_database_connections_active
   Status: GREEN if healthy, RED if connection failed
   Show: Active connections, max connections, healthy status
   ```

5. **Service Dependencies (status table)**
   ```
   Services monitored:
   - Secondary Token Service (availability, latency)
   - Primary Token Registry (availability, query time)
   - Merkle Service (proof generation time)
   - Composite Token Service (assembly time)
   - Database (connection pool, query time)

   Each shows: Status, Latency, Error rate, Last check
   ```

6. **Resource Forecast (line chart)**
   ```
   Query: Linear regression over 7-day window
   Metrics: CPU, Memory, Disk I/O
   Projection: 30-day forecast
   Alert: RED if projected resource exhaustion < 7 days
   ```

7. **Alert Summary (stat panel)**
   ```
   Current Alerts:
   - Firing: {{count}}
   - Pending: {{count}}
   - All: {{count}}

   Recent Changes: Last 24h firing/resolved count
   ```

8. **Service Health Legend (documentation)**
   ```
   Color legend:
   - GREEN: All metrics normal, no alerts
   - YELLOW: Some metrics degraded, non-critical alerts
   - RED: Critical alert, intervention required
   - GRAY: Service unavailable or unknown
   ```

---

## 3. ALERT RULES & THRESHOLDS

### 3.1 Alert Rules (10+ critical, 15+ warning)

#### CRITICAL Alerts (Page on-call)

```yaml
# Alert 1: Approval Consensus Latency SLA Breach
alert: VVB_ConsensusLatencySLABreach
  expr: histogram_quantile(0.99, vvb_consensus_calculation_latency_bucket) > 100
  for: 2m
  severity: critical
  summary: "VVB consensus latency P99 > 100ms"
  description: "Approval consensus calculation taking longer than 100ms SLA. Current P99: {{ $value }}ms"
  action: |
    1. Check Prometheus dashboard for latency spike details
    2. Verify validator response times
    3. Check database query performance
    4. If persistent, scale validator cluster

# Alert 2: Approval Throughput Below Minimum
alert: VVB_ThroughputBelowMinimum
  expr: rate(vvb_consensus_decisions_total[1m]) < 500
  for: 3m
  severity: critical
  summary: "VVB approval throughput < 500/sec"
  description: "Approval completions below minimum threshold. Current: {{ $value }}/sec"
  action: |
    1. Check for service errors in logs
    2. Verify validator availability
    3. Check database connection pool status
    4. Restart service if necessary

# Alert 3: Validator Availability < 75% (Byzantine failure threshold)
alert: VVB_ValidatorAvailabilityLow
  expr: vvb_validator_availability < 75
  for: 1m
  severity: critical
  summary: "VVB validator availability < 75%"
  description: "More than 25% of validators unavailable (Byzantine failure risk)"
  action: |
    1. Immediately check validator node health
    2. Restart unavailable validators
    3. If >33% down, STOP new submissions (consensus impossible)
    4. Trigger incident response

# Alert 4: Approval Success Rate < 95%
alert: VVB_ApprovalSuccessRateLow
  expr: (rate(vvb_consensus_decisions_total{outcome="approved"}[5m]) /
         rate(vvb_consensus_decisions_total[5m])) < 0.95
  for: 5m
  severity: critical
  summary: "VVB approval success rate < 95%"
  description: "{{ $value | humanizePercentage }} of approvals being rejected"
  action: |
    1. Investigate failure reasons in logs
    2. Check governance rule violations
    3. Verify token data integrity
    4. Review recent configuration changes

# Alert 5: Memory Leak Detection
alert: VVB_MemoryLeak
  expr: (jvm_memory_used_bytes / jvm_memory_max_bytes) > 0.90
  for: 10m
  severity: critical
  summary: "VVB service memory usage > 90%"
  description: "JVM heap usage at {{ $value | humanizePercentage }}, potential OOM risk"
  action: |
    1. Force garbage collection
    2. Check for memory leak in application logs
    3. Monitor heap dump if OOM occurs
    4. Prepare for service restart

# Alert 6: Database Connection Pool Exhausted
alert: VVB_DBConnectionPoolExhausted
  expr: vvb_database_connections_active >= 20
  for: 2m
  severity: critical
  summary: "VVB database connection pool at capacity"
  description: "{{ $value }} of 20 database connections in use"
  action: |
    1. Check long-running queries in database
    2. Kill idle connections
    3. Scale connection pool if possible
    4. Check for connection leaks in application

# Alert 7: High Error Rate
alert: VVB_HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[1m]) > 1
  for: 2m
  severity: critical
  summary: "VVB error rate > 1 error/sec"
  description: "Service returning {{ $value }} errors/sec"
  action: |
    1. Check service logs for error patterns
    2. Verify external service dependencies
    3. Check database health
    4. Consider rolling restart

# Alert 8: Service Unavailability
alert: VVB_ServiceUnavailable
  expr: up{job="vvb-service"} == 0
  for: 1m
  severity: critical
  summary: "VVB service is down"
  description: "VVB service has been unavailable for more than 1 minute"
  action: |
    1. Check if service process is running
    2. Check system resources (disk, memory, CPU)
    3. Review recent logs for crash details
    4. Restart service

# Alert 9: Cascade Validation Latency High
alert: VVB_CascadeValidationLatencyHigh
  expr: histogram_quantile(0.99, vvb_cascade_validation_latency_bucket) > 50
  for: 3m
  severity: critical
  summary: "Cascade validation latency P99 > 50ms"
  description: "Parent-child token validation taking too long: {{ $value }}ms"
  action: |
    1. Check token registry size
    2. Verify database index efficiency
    3. Consider caching frequently-accessed parent tokens
    4. Optimize cascade validation algorithm

# Alert 10: Quorum Not Met Rate High
alert: VVB_QuorumNotMetRateHigh
  expr: rate(vvb_quorum_misses_total[5m]) > 0.1
  for: 3m
  severity: critical
  summary: "Approvals failing quorum checks: {{ $value }}/sec"
  description: "High rate of approvals failing consensus threshold"
  action: |
    1. Check validator vote patterns
    2. Verify approval tier assignments
    3. Review governance rules for correctness
    4. Check if validators need additional training
```

#### WARNING Alerts (Create ticket, no page)

```yaml
# Alert 1: Approval Latency Degradation
alert: VVB_ApprovalLatencyDegraded
  expr: histogram_quantile(0.95, vvb_approval_submission_latency_bucket) > 50
  for: 5m
  severity: warning
  summary: "Approval submission latency P95 > 50ms"

# Alert 2: Pending Approvals Queue Growing
alert: VVB_PendingApprovalsQueue
  expr: increase(vvb_approval_requests_pending[5m]) > 500
  for: 5m
  severity: warning
  summary: "Pending approval queue growing: {{ $value }} new requests"

# Alert 3: CPU Utilization High
alert: VVB_CPUUtilizationHigh
  expr: 100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
  for: 10m
  severity: warning
  summary: "CPU utilization > 80%"

# Alert 4: Memory Usage Trending Up
alert: VVB_MemoryTrendingUp
  expr: (jvm_memory_used_bytes / jvm_memory_max_bytes) > 0.75
  for: 15m
  severity: warning
  summary: "Memory usage trending toward limits"

# Alert 5: Database Query Latency High
alert: VVB_DBQueryLatencyHigh
  expr: histogram_quantile(0.95, vvb_database_query_latency_bucket) > 100
  for: 5m
  severity: warning
  summary: "Database query latency P95 > 100ms"

# ... (10+ more warning rules for GC pauses, thread pool saturation, etc.)
```

### 3.2 Alert Routing & Escalation

```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m

route:
  receiver: default
  group_by: ['alertname', 'cluster']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 24h

  routes:
    # Critical alerts → immediate page + Slack
    - match:
        severity: critical
      receiver: critical-incident
      group_wait: 0s
      repeat_interval: 1h

    # Warning alerts → Slack channel only
    - match:
        severity: warning
      receiver: vvb-warnings
      group_wait: 5m
      repeat_interval: 6h

receivers:
  - name: critical-incident
    pagerduty_configs:
      - service_key: $PAGERDUTY_SERVICE_KEY
        client_url: https://aurigraph.example.com/alerts
    slack_configs:
      - api_url: $SLACK_CRITICAL_WEBHOOK
        channel: '#vvb-incidents'
        title: 'CRITICAL: {{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'

  - name: vvb-warnings
    slack_configs:
      - api_url: $SLACK_WARNINGS_WEBHOOK
        channel: '#vvb-monitoring'
```

---

## 4. ELK STACK LOGGING

### 4.1 ELK Architecture

```
┌──────────────────────────────┐
│ Application (Quarkus/Java)   │
│ - SLF4J logging              │
│ - Structured JSON output     │
└────────────┬─────────────────┘
             │
             ↓
┌──────────────────────────────┐
│ Logstash                      │
│ - Parse JSON logs             │
│ - Add metadata (timestamp)    │
│ - Filter sensitive data       │
└────────────┬─────────────────┘
             │
             ↓
┌──────────────────────────────┐
│ Elasticsearch (:9200)         │
│ - Index: aurigraph-vvb-*     │
│ - Retention: 30 days         │
│ - Hot-warm-cold tiering      │
└────────────┬─────────────────┘
             │
             ↓
┌──────────────────────────────┐
│ Kibana (:5601)                │
│ - Search logs                │
│ - Create dashboards           │
│ - Set up alerts               │
└──────────────────────────────┘
```

### 4.2 Structured Logging Format

```json
{
  "timestamp": "2026-01-05T10:30:45.123Z",
  "level": "INFO",
  "logger": "io.aurigraph.v11.token.vvb.VVBApprovalService",
  "message": "Approval decision made",
  "service": "aurigraph-v12",
  "instance": "vvb-service-1",
  "region": "us-east-1",

  "event": {
    "type": "approval_decision",
    "action": "consensus_reached",
    "timestamp": "2026-01-05T10:30:45.000Z"
  },

  "vvb": {
    "approval_id": "appr-123456",
    "token_version_id": "tv-89012",
    "approval_tier": "ELEVATED",
    "votes_received": 3,
    "votes_required": 2,
    "outcome": "approved",
    "decision_time_ms": 42
  },

  "token": {
    "token_id": "tok-456789",
    "token_type": "SECONDARY",
    "parent_token_id": "tok-111111",
    "owner": "user-001"
  },

  "validators": [
    {"validator_id": "val-001", "vote": "approve", "timestamp": "2026-01-05T10:30:42.000Z"},
    {"validator_id": "val-002", "vote": "approve", "timestamp": "2026-01-05T10:30:43.000Z"},
    {"validator_id": "val-003", "vote": "reject", "timestamp": "2026-01-05T10:30:44.000Z"}
  ],

  "performance": {
    "submission_latency_ms": 12,
    "consensus_calculation_ms": 8,
    "registry_update_ms": 5,
    "total_latency_ms": 25
  },

  "trace": {
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "span_id": "00f067aa0ba902b7",
    "parent_span_id": "00f067aa0ba902b7"
  }
}
```

### 4.3 Kibana Dashboards

**Dashboard 1: Approval Workflow Logs**
```
Filters:
- event.type = "approval_*"
- timestamp: last 24h

Visualizations:
1. Approval timeline (scatter plot)
   - X: timestamp
   - Y: decision_time_ms
   - Color: outcome (approved/rejected)

2. Approval distribution (pie chart)
   - By: approval_tier (STANDARD/ELEVATED/CRITICAL)
   - Size: count

3. Recent approvals (table)
   - Columns: approval_id, token_id, outcome, decision_time_ms
   - Sort: timestamp desc
   - Limit: 50 rows
```

**Dashboard 2: Error & Exception Logs**
```
Filters:
- level: ("ERROR" OR "WARN")
- timestamp: last 24h

Visualizations:
1. Error rate over time (line chart)
   - Y: count(level="ERROR") per 5m bucket
   - Target: < 1 error per hour

2. Top error types (bar chart)
   - By: exception class name
   - Count: occurrences
   - Limit: top 10

3. Error details (table)
   - Columns: timestamp, level, logger, message, exception
   - Filter to latest errors
```

**Dashboard 3: Validator Activity Logs**
```
Filters:
- event.type = "vote_submitted"
- timestamp: last 7d

Visualizations:
1. Votes per validator (table)
   - Columns: validator_id, vote_count, approval_rate
   - Sort: vote_count desc

2. Vote decision distribution (pie)
   - approve vs reject vs abstain
   - By validator

3. Validator responsiveness (heatmap)
   - Y: validator_id
   - X: time
   - Color: vote latency (ms)
```

### 4.4 Logging Configuration

```properties
# application.properties
quarkus.log.level=INFO
quarkus.log.category."io.aurigraph.v11.token.vvb".level=DEBUG

# JSON logging for ELK
quarkus.log.console.json=true
quarkus.log.console.json.pretty=false
quarkus.log.console.format=%d{yyyy-MM-dd HH:mm:ss,SSS} %-5p [%c{2.}] (%t) %s%e%n

# Log file output to ship to Logstash
quarkus.log.file.enable=true
quarkus.log.file.path=/var/log/aurigraph/vvb.log
quarkus.log.file.level=INFO
quarkus.log.file.format=%d{yyyy-MM-dd HH:mm:ss,SSS} %-5p [%c{2.}] (%t) %s%e%n
```

---

## 5. DISTRIBUTED TRACING (JAEGER)

### 5.1 Tracing Architecture

```
┌──────────────────────────────┐
│ Application (Quarkus)        │
│ - OpenTelemetry SDK         │
│ - Instrumented endpoints    │
└────────────┬─────────────────┘
             │
     ┌───────┼───────┐
     ↓       ↓       ↓
  [Span]  [Span]  [Span]
     │       │       │
     └───────┼───────┘
             ↓
┌──────────────────────────────┐
│ Jaeger Agent                  │
│ Port: 6831 (UDP)             │
│ - Batches spans              │
│ - Local buffering            │
└────────────┬─────────────────┘
             │
             ↓
┌──────────────────────────────┐
│ Jaeger Collector              │
│ Port: 14250 (gRPC)           │
│ - Receives spans             │
│ - Validates format           │
└────────────┬─────────────────┘
             │
             ↓
┌──────────────────────────────┐
│ Elasticsearch                 │
│ Index: jaeger-*              │
│ - Stores span data           │
│ - Searchable                 │
└────────────┬─────────────────┘
             │
             ↓
┌──────────────────────────────┐
│ Jaeger UI (:16686)           │
│ - View traces                │
│ - Analyze latency            │
│ - Find performance issues    │
└──────────────────────────────┘
```

### 5.2 Instrumented Operations

```
Trace: VVB Approval Submission
├── Span: API_REQUEST (start=t0)
│   ├── Span: VALIDATION (start=t0+5ms)
│   │   ├── Tag: request_size = 512 bytes
│   │   ├── Tag: schema_valid = true
│   │   └── Log: "Schema validation passed"
│   │
│   ├── Span: RULE_ROUTING (start=t0+8ms)
│   │   ├── Tag: routing_tier = "ELEVATED"
│   │   ├── Tag: validator_count = 3
│   │   └── Log: "Routed to ELEVATED queue"
│   │
│   ├── Span: REGISTRY_STORE (start=t0+12ms)
│   │   ├── Tag: db_operation = "insert"
│   │   ├── Tag: rows_affected = 1
│   │   ├── Tag: db_latency_ms = 8
│   │   └── Log: "Approval registered"
│   │
│   ├── Span: EVENT_PUBLISH (start=t0+20ms)
│   │   ├── Tag: event_type = "ApprovalInitiatedEvent"
│   │   ├── Tag: listeners_count = 3
│   │   ├── Tag: publish_latency_ms = 3
│   │   └── Log: "Event published to subscribers"
│   │
│   └── Duration: 25ms (t0 to t0+25)

Trace: Consensus Calculation
├── Span: CONSENSUS_START (start=t0)
│   ├── Span: VOTE_COLLECTION (start=t0)
│   │   ├── Tag: timeout_ms = 7000
│   │   ├── Tag: required_votes = 2
│   │   ├── Log: "Waiting for votes..."
│   │   └── Child Spans:
│   │       ├── Span: VOTE_1 (start=t0+5ms, duration=5ms)
│   │       ├── Span: VOTE_2 (start=t0+10ms, duration=5ms)
│   │       └── Span: VOTE_3 (start=t0+15ms, duration=5ms) [optional]
│   │
│   ├── Span: QUORUM_CHECK (start=t0+15ms)
│   │   ├── Tag: votes_received = 2
│   │   ├── Tag: quorum_met = true
│   │   └── Log: "Quorum threshold reached"
│   │
│   ├── Span: RECORD_DECISION (start=t0+18ms)
│   │   ├── Tag: decision = "approved"
│   │   ├── Tag: db_latency_ms = 5
│   │   └── Log: "Decision recorded"
│   │
│   └── Duration: 25ms (t0 to t0+25)

Trace: Cascade Validation
├── Span: CASCADE_CHECK_START (start=t0)
│   ├── Span: PARENT_LOOKUP (start=t0, duration=2ms)
│   │   ├── Tag: parent_id = "tok-111111"
│   │   └── Tag: found = true
│   │
│   ├── Span: CHILD_COUNT_CHECK (start=t0+2ms, duration=3ms)
│   │   ├── Tag: child_count = 5
│   │   └── Tag: any_active = true
│   │
│   ├── Span: RETIREMENT_BLOCK (start=t0+5ms, duration=2ms)
│   │   ├── Tag: action_blocked = true
│   │   └── Log: "Retirement blocked - active children"
│   │
│   └── Duration: 9ms (t0 to t0+9)
```

### 5.3 Tracing Configuration

```properties
# application.properties
quarkus.otel.traces.exporter=jaeger
quarkus.otel.exporter.jaeger.endpoint=http://localhost:14250
quarkus.otel.traces.sampler=jaegerremote
quarkus.otel.traces.sampler.arg=0.05  # 5% sampling in production

# For staging (100% sampling)
%staging.quarkus.otel.traces.sampler.arg=1.0

# Batch export configuration
quarkus.otel.bsp.max_queue_size=2048
quarkus.otel.bsp.schedule_delay=5000  # ms
quarkus.otel.bsp.max_export_batch_size=512

# Attributes
quarkus.otel.resource.attributes=service.name=aurigraph-v12-vvb,\
  service.version=12.0.0,\
  environment=production,\
  region=us-east-1
```

---

## 6. MONITORING RUNBOOKS

### 6.1 Incident Response Playbook

**Issue**: High Consensus Latency (P99 > 100ms)
```
Detection: Alert VVB_ConsensusLatencySLABreach
Severity: CRITICAL
On-Call: Page immediately

Investigation (0-5 min):
1. Check Grafana "Performance Dashboard"
2. Look for latency spikes in histogram_quantile plot
3. Identify which approval tiers affected
4. Check concurrent approval load

Root Cause Analysis (5-15 min):
1. Check database query latency
   - Query: SELECT * FROM vvb_approvals WHERE created_at > NOW() - INTERVAL 5 MINUTES
   - Compare against baseline (typically <5ms)

2. Check validator response times in Jaeger traces
   - Trace dashboard: filter by duration > 100ms
   - Identify slow validator nodes

3. Check resource utilization
   - CPU > 80%? Look for GC pauses
   - Memory > 85%? Potential leak
   - Disk I/O high? Database bottleneck

Action Items (15-30 min):
- If database slow: Run EXPLAIN ANALYZE on slow queries
- If GC pauses high: Trigger full GC manually, monitor memory
- If validator slow: SSH into validator node, check logs/CPU
- If load high: Scale horizontally (add more service instances)

Remediation:
- Short-term: Scale service, restart if needed
- Medium-term: Optimize slow queries, tune GC
- Long-term: Increase database resources, add caching

Success Criteria:
- P99 latency returns to < 100ms
- No further alert fires within 1 hour
- Root cause documented in incident ticket
```

**Issue**: Approval Success Rate < 95%
```
Detection: Alert VVB_ApprovalSuccessRateLow
Severity: CRITICAL

Investigation:
1. Check "Approval Audit Dashboard"
2. Identify rejection reasons:
   - Cascade violations? Check parent-child relationships
   - Quorum not met? Check validator availability
   - Validation errors? Check governance rules
   - Byzantine failures? Check validator status

Action:
- Cascade: Investigate why children are still active on parent retirement
- Quorum: Check if validators offline, restart if needed
- Rules: Review governance rule changes from last 24 hours
- Byzantine: If >33% validators down, declare incident

Follow-up:
- Add tests to prevent specific failure mode
- Update monitoring thresholds if needed
```

---

## 7. PRODUCTION MONITORING CHECKLIST

Before deploying to production, verify:

```
METRICS COLLECTION
□ All 25+ metrics exposed on /q/metrics endpoint
□ Prometheus scraping successfully (check Prometheus UI)
□ No metric name conflicts or duplicates
□ All metrics have correct units (ms for time, count for counters)
□ Histogram buckets appropriate for performance targets

GRAFANA DASHBOARDS
□ All 4 dashboards created and functional
□ Dashboard links added to Runbook documentation
□ Alerts configured to link to relevant dashboards
□ Shared with on-call team and stakeholders
□ Tested with real data (not just mock data)

ALERT RULES
□ All 10 critical alerts configured in AlertManager
□ All 15+ warning alerts configured
□ Routing rules tested (critical → pagerduty + slack)
□ Receiver integrations verified (PagerDuty, Slack)
□ Alert templates clear and actionable
□ Escalation policies defined

ELK STACK
□ Logstash pipeline validated with sample logs
□ Elasticsearch indexes created with retention policy
□ Kibana dashboards created
□ Log queries tested for common issues
□ Sensitive data filtering applied (PII redaction)

JAEGER TRACING
□ Jaeger Agent running and accessible
□ Sampling rates configured correctly (5% prod, 100% staging)
□ Sample traces captured end-to-end
□ Jaeger UI accessible and loading traces
□ Performance of tracing acceptable (<1% overhead)

RUNBOOKS
□ Incident response playbooks written for each critical alert
□ On-call team trained on playbooks
□ Runbooks linked from alerts and dashboards
□ Contact information updated

LOAD TESTING
□ All performance benchmarks passed
□ SLAs verified under production-like load
□ No memory leaks detected (1-hour soak test)
□ GC pauses within limits (<100ms)

TESTING
□ All unit tests passing (95%+ coverage)
□ All integration tests passing
□ All E2E scenarios passing
□ Performance tests passing
□ Security validation completed

DOCUMENTATION
□ This document (STORY-7-MONITORING-INSTRUMENTATION.md) complete
□ Runbooks linked and accessible
□ Team briefed on monitoring strategy
□ Maintenance procedures documented
```

---

## CONCLUSION

Story 7 implements enterprise-grade monitoring infrastructure:

**Metrics**: 25+ business and technical metrics via Prometheus
**Dashboards**: 4 Grafana dashboards for visibility
**Alerts**: 10 critical + 15+ warning rules with escalation
**Logging**: ELK stack for searchable logs with 30-day retention
**Tracing**: Jaeger for distributed tracing and performance analysis
**Runbooks**: Incident response procedures for all critical scenarios

**Expected Outcome**: Full production observability with <5-minute MTTR for critical issues

**Timeline**: Implementation during Jan 3-7, 2026
**Success Criteria**: All monitoring online, all dashboards accessible, zero blind spots

---

**Document Version**: 1.0
**Status**: Ready for Implementation
**Next Document**: STORY-7-E2E-TEST-SUITE.md
