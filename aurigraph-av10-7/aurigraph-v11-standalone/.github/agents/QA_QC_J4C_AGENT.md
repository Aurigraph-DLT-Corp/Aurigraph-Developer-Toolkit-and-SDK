# QA/QC J4C Agent - Quality Assurance & Quality Control

**Agent ID**: QAA (Quality Assurance Agent)
**Version**: 1.0.0
**Last Updated**: December 15, 2025
**Status**: ACTIVE

---

## Agent Overview

The QA/QC J4C Agent is responsible for maintaining quality standards across the Aurigraph V12 platform through automated testing, smoke tests, and continuous quality monitoring.

### Core Responsibilities

1. **Post-Deployment Smoke Tests** - Run immediately after every deployment
2. **E2E Test Execution** - Comprehensive end-to-end testing
3. **Test Plan Maintenance** - Keep test cases updated with new features
4. **Quality Metrics Reporting** - Track and report quality KPIs
5. **Regression Testing** - Ensure existing functionality remains intact

---

## Post-Deployment Smoke Test Protocol

### Trigger Events
- After every CI/CD deployment (automatic)
- After manual deployments (manual trigger)
- On-demand via workflow dispatch

### Smoke Test Suite

#### 1. Health Endpoints (Critical)
```bash
# Must pass within 30 seconds of deployment
curl -sf https://dlt.aurigraph.io/q/health
curl -sf https://dlt.aurigraph.io/api/v12/info
curl -sf https://dlt.aurigraph.io/api/v11/health
```

#### 2. Core API Endpoints
```bash
# Composite Tokens
curl -sf https://dlt.aurigraph.io/api/v12/composite-tokens

# Active Contracts
curl -sf https://dlt.aurigraph.io/api/v12/activecontracts

# Demo Management (NEW - Dec 2025)
curl -sf https://dlt.aurigraph.io/api/v11/demos

# Node Topology
curl -sf https://dlt.aurigraph.io/api/v12/topology/nodes
```

#### 3. Node Health (All 11 Nodes)
```bash
# Validators (5)
for port in 19001 19002 19003 19004 19005; do
  curl -sf http://localhost:$port/q/health
done

# Business Nodes (3)
for port in 19010 19011 19012; do
  curl -sf http://localhost:$port/q/health
done

# EI Nodes (3) - External Integration (formerly Slim)
for port in 19020 19021 19022; do
  curl -sf http://localhost:$port/q/health
done
```

### Smoke Test Success Criteria
- All health endpoints return 200 within 10s
- At least 10/11 nodes healthy
- API response time < 500ms
- No 5xx errors in last 5 minutes

---

## Test Case Categories

### Category 1: External Integration (EI) Node Tests
**Added**: December 2025 (Renamed from Slim Node)

| Test ID | Description | Endpoint | Priority |
|---------|-------------|----------|----------|
| TC-EI-001 | EI node health check | `/q/health` on 19020-19022 | Critical |
| TC-EI-002 | EI node data feed status | `/api/v12/quantconnect/ei-node/status` | High |
| TC-EI-003 | EI node metrics collection | `/api/v12/ei-nodes/metrics` | Medium |
| TC-EI-004 | EI node topology listing | `/api/v12/topology/nodes?type=EI` | High |
| TC-EI-005 | EI node backward compatibility (SLIM) | `/api/v12/topology/nodes?type=SLIM` | Medium |
| TC-EI-006 | EI node data streaming | gRPC streaming test | High |
| TC-EI-007 | EI node external API integration | External feed connectivity | High |
| TC-EI-008 | EI node load balancing | Round-robin verification | Medium |
| TC-EI-009 | EI node failover | Node failure handling | High |
| TC-EI-010 | EI node configuration | Dynamic config updates | Low |

### Category 2: Demo Management API Tests
**Added**: December 2025

| Test ID | Description | Endpoint | Priority |
|---------|-------------|----------|----------|
| TC-DEMO-001 | List all demos | `GET /api/v11/demos` | Critical |
| TC-DEMO-002 | Get active demos | `GET /api/v11/demos/active` | High |
| TC-DEMO-003 | Create demo | `POST /api/v11/demos` | Critical |
| TC-DEMO-004 | Get demo by ID | `GET /api/v11/demos/{id}` | High |
| TC-DEMO-005 | Update demo | `PUT /api/v11/demos/{id}` | High |
| TC-DEMO-006 | Start demo | `POST /api/v11/demos/{id}/start` | High |
| TC-DEMO-007 | Stop demo | `POST /api/v11/demos/{id}/stop` | High |
| TC-DEMO-008 | Extend demo duration | `POST /api/v11/demos/{id}/extend` | Medium |
| TC-DEMO-009 | Add transactions | `POST /api/v11/demos/{id}/transactions` | High |
| TC-DEMO-010 | Delete demo | `DELETE /api/v11/demos/{id}` | Medium |
| TC-DEMO-011 | Demo auto-expiration | Scheduler test (60s) | High |
| TC-DEMO-012 | Demo auto-transactions | Scheduler test (5s) | Medium |
| TC-DEMO-013 | Demo v11 API compatibility | Both v11 and v12 paths | High |
| TC-DEMO-014 | Demo public access (no auth) | JWT filter bypass | Critical |
| TC-DEMO-015 | Demo admin duration override | isAdmin=true parameter | Medium |

### Category 3: Node Topology Tests (Updated)
**Updated**: December 2025 - EI Node support

| Test ID | Description | Endpoint | Priority |
|---------|-------------|----------|----------|
| TC-TOPO-001 | Get all nodes | `GET /api/v12/topology/nodes` | Critical |
| TC-TOPO-002 | Get validators | `GET /api/v12/topology/nodes?type=VALIDATOR` | High |
| TC-TOPO-003 | Get business nodes | `GET /api/v12/topology/nodes?type=BUSINESS` | High |
| TC-TOPO-004 | Get EI nodes | `GET /api/v12/topology/nodes?type=EI` | High |
| TC-TOPO-005 | Get EI nodes (legacy) | `GET /api/v12/topology/nodes?type=SLIM` | Medium |
| TC-TOPO-006 | Topology stats | `GET /api/v12/topology/stats` | High |
| TC-TOPO-007 | Verify eiCount field | Stats response validation | High |
| TC-TOPO-008 | Node by channel | `GET /api/v12/topology/nodes?channel={id}` | Medium |
| TC-TOPO-009 | gRPC topology stream | Streaming subscription | High |
| TC-TOPO-010 | Node health aggregation | Multi-node health check | Critical |

---

## Automated Smoke Test Script

### smoke-tests.sh
```bash
#!/bin/bash
# QA/QC J4C Agent - Post-Deployment Smoke Tests
# Run after every deployment

set -e

BASE_URL="${1:-https://dlt.aurigraph.io}"
PASSED=0
FAILED=0

log_test() {
  local name="$1"
  local result="$2"
  if [ "$result" = "PASS" ]; then
    echo "✅ $name"
    PASSED=$((PASSED + 1))
  else
    echo "❌ $name"
    FAILED=$((FAILED + 1))
  fi
}

echo "🧪 QA/QC J4C Agent - Smoke Tests"
echo "================================"
echo "Target: $BASE_URL"
echo "Time: $(date)"
echo ""

# Health endpoints
curl -sf "$BASE_URL/q/health" > /dev/null && log_test "Health (Quarkus)" "PASS" || log_test "Health (Quarkus)" "FAIL"
curl -sf "$BASE_URL/api/v12/info" > /dev/null && log_test "API Info" "PASS" || log_test "API Info" "FAIL"

# Core endpoints
curl -sf "$BASE_URL/api/v12/composite-tokens" > /dev/null && log_test "Composite Tokens" "PASS" || log_test "Composite Tokens" "FAIL"
curl -sf "$BASE_URL/api/v12/activecontracts" > /dev/null && log_test "Active Contracts" "PASS" || log_test "Active Contracts" "FAIL"

# New features
curl -sf "$BASE_URL/api/v11/demos" > /dev/null && log_test "Demo API" "PASS" || log_test "Demo API" "FAIL"
curl -sf "$BASE_URL/api/v12/topology/nodes" > /dev/null && log_test "Node Topology" "PASS" || log_test "Node Topology" "FAIL"

# Verify EI node naming
TOPO_RESPONSE=$(curl -sf "$BASE_URL/api/v12/topology/stats" 2>/dev/null || echo "{}")
if echo "$TOPO_RESPONSE" | grep -q "eiCount"; then
  log_test "EI Node Stats" "PASS"
else
  log_test "EI Node Stats" "FAIL"
fi

echo ""
echo "================================"
echo "Results: $PASSED passed, $FAILED failed"
echo "Success Rate: $(( (PASSED * 100) / (PASSED + FAILED) ))%"

if [ $FAILED -gt 0 ]; then
  exit 1
fi
```

---

## Integration with CI/CD

### GitHub Actions Workflow Integration

The QA/QC Agent integrates with the J4C Deployment Agent workflow:

```yaml
# In j4c-deployment-agent.yml
verify:
  name: "✅ J4C Verification Agent"
  runs-on: self-hosted
  needs: deploy

  steps:
    - name: "🧪 Run QA/QC smoke tests"
      run: |
        bash .github/agents/smoke-tests.sh https://dlt.aurigraph.io
```

---

## Quality Metrics Dashboard

### Key Performance Indicators (KPIs)

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Smoke Test Pass Rate | 100% | 100% | ✅ |
| E2E Test Coverage | 95% | 68% | ⚠️ |
| API Response Time | <100ms | 45ms | ✅ |
| Node Health | 11/11 | 11/11 | ✅ |
| Deployment Success | 99% | 100% | ✅ |

---

## Memorized Procedures

### MEMORIZE: Post-Deployment Protocol

1. **Immediate** (0-30s): Health endpoint checks
2. **Short** (30s-2min): Core API smoke tests
3. **Medium** (2-5min): Node health verification (all 11 nodes)
4. **Extended** (5-15min): E2E test suite (if configured)
5. **Report**: Generate test summary and update JIRA

### MEMORIZE: New Feature Test Protocol

When new features are added:
1. Create test cases in E2E-TEST-PLAN-FUTURE-TESTING.md
2. Add smoke test entries in this document
3. Update smoke-tests.sh script
4. Add test scenarios to CI/CD workflow
5. Document in JIRA with test coverage

### MEMORIZE: EI Node Testing

- Always use `EXTERNAL_INTEGRATION` or `EI` for node type
- Backward compatibility: `SLIM` and `S` still work
- Port range: 19020-19022 for EI nodes
- gRPC ports: 19120-19122

---

## Changelog

### December 15, 2025
- Added EI (External Integration) Node test cases (TC-EI-001 to TC-EI-010)
- Added Demo Management API test cases (TC-DEMO-001 to TC-DEMO-015)
- Updated Topology test cases for EI node support
- Created automated smoke-tests.sh script
- Integrated with J4C Deployment Agent workflow
