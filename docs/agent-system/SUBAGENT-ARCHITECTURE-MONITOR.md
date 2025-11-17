# Sub-Agent: Architecture Deviation Monitor

**Purpose**: Continuously monitor codebase for deviations from architecture, PRD, and design specifications
**Status**: Ready for Deployment
**Agent Type**: J4C Background Agent
**Responsibility**: Detect and report architectural violations in real-time

---

## Overview

This sub-agent automatically scans the V11 codebase for deviations from the established architecture, Product Requirements Document (PRD), and design specifications. It runs continuously in the background and alerts when it detects violations.

### What It Does

1. **Architecture Compliance Checking**
   - Monitors module boundaries and layer separation
   - Verifies API endpoint naming conventions
   - Ensures service dependencies follow design
   - Tracks module ownership assignments

2. **PRD Requirements Validation**
   - Verifies feature implementations match PRD specs
   - Monitors performance targets (776K+ TPS, <100ms latency)
   - Checks API contract compliance
   - Validates error handling patterns

3. **Design Pattern Enforcement**
   - Ensures consistent service structure
   - Validates REST API design patterns
   - Monitors gRPC proto definitions
   - Checks naming conventions and standards

4. **Code Quality Alignment**
   - Monitors test coverage targets (90%+ unit, 80%+ integration)
   - Validates dependency versions
   - Checks for deprecated API usage
   - Enforces security standards

5. **Real-Time Reporting**
   - Generates hourly deviation reports
   - Posts critical violations to logs/alerts
   - Creates JIRA tickets for severe deviations
   - Maintains deviation history

---

## Architecture

### Multi-Layer Scanning System

```
Code Commit/Push
     ↓
Scan Trigger
     ↓
Architecture Rules Engine
     ├── Module Boundary Check
     ├── API Endpoint Validation
     ├── Service Dependency Verification
     └── Design Pattern Check
     ↓
PRD Requirements Engine
     ├── Feature Spec Matching
     ├── Performance Target Validation
     ├── Contract Compliance
     └── Error Handling Verification
     ↓
Code Quality Engine
     ├── Test Coverage Analysis
     ├── Dependency Version Check
     ├── Deprecated API Detection
     └── Security Standard Verification
     ↓
Deviation Detection
     ├── Categorize: Critical | High | Medium | Low
     ├── Generate Report
     └── Create Alert/Ticket
```

---

## Configuration Files

### Architecture Rules (`.architecture.yml`)

```yaml
# Module Structure Rules
modules:
  v11-core:
    path: "aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/"
    owner: "Core Team"
    allowed_dependencies:
      - "io.quarkus.*"
      - "java.*"
    forbidden_dependencies:
      - "org.apache.commons"
      - "com.google.guava"
    description: "Core V11 blockchain implementation"

  v11-contracts:
    path: "aurigraph-av10-7/aurigraph-v11-standalone/src/main/java/io/aurigraph/v11/contracts/"
    owner: "Smart Contracts Team"
    allowed_dependencies:
      - "io.aurigraph.v11.core"
      - "io.quarkus.*"
    forbidden_dependencies:
      - "external.blockchain"

  v11-grpc:
    path: "aurigraph-av10-7/aurigraph-proto/"
    owner: "gRPC Team"
    allowed_dependencies:
      - "grpc.*"
      - "protobuf.*"

# API Endpoint Rules
api_endpoints:
  base_path: "/api/v11"
  naming_convention: "^/[a-z]+(/[a-z-]+)*$"
  required_endpoints:
    - path: "/health"
      method: "GET"
      description: "Health check"
    - path: "/info"
      method: "GET"
      description: "System info"
    - path: "/stats"
      method: "GET"
      description: "Transaction stats"
  forbidden_patterns:
    - "/test"
    - "/debug"

# Service Structure Rules
service_structure:
  resource_layer:
    pattern: "*Resource.java"
    location: "*/resources/"
  service_layer:
    pattern: "*Service.java"
    location: "*/services/"
  dto_layer:
    pattern: "*DTO.java"
    location: "*/dtos/"
```

### PRD Requirements (`prd-requirements.yml`)

```yaml
features:
  consensus:
    spec: "HyperRAFT++ with Byzantine fault tolerance"
    file: "consensus/HyperRAFTConsensusService.java"
    required_methods:
      - "elect()"
      - "replicate()"
      - "commit()"
    performance_target:
      finality_ms: 100
      heartbeat_interval_ms: 50

  transaction_processing:
    spec: "Process 776K+ TPS with <100ms finality"
    file: "TransactionService.java"
    performance_targets:
      tps: 776000
      latency_p99_ms: 100
      memory_max_mb: 512

  quantum_crypto:
    spec: "NIST Level 5 quantum-resistant cryptography"
    file: "crypto/QuantumCryptoService.java"
    required_algorithms:
      - "CRYSTALS-Dilithium"
      - "CRYSTALS-Kyber"
    required_methods:
      - "sign()"
      - "verify()"
      - "encrypt()"
      - "decrypt()"

  rest_api:
    spec: "Complete REST API with all v11 endpoints"
    file: "AurigraphResource.java"
    required_endpoints:
      - GET /health
      - GET /info
      - GET /stats
      - GET /analytics/dashboard
      - GET /blockchain/transactions
      - GET /nodes
      - GET /consensus/status
      - POST /contracts/deploy
      - POST /rwa/tokenize
```

### Design Standards (`design-standards.yml`)

```yaml
naming_conventions:
  classes: "^[A-Z][a-zA-Z0-9]*$"
  methods: "^[a-z][a-zA-Z0-9]*$"
  constants: "^[A-Z_]+$"
  packages: "^[a-z]+(\\.([a-z0-9]+))*$"

file_organization:
  resource_classes:
    suffix: "Resource"
    location: "resources/"
  service_classes:
    suffix: "Service"
    location: "services/"
  model_classes:
    suffix: "DTO"
    location: "dtos/"

code_patterns:
  annotations_required:
    - "@RestController"
    - "@Service"
    - "@Component"
  forbidden_patterns:
    - "System.out.println"
    - "printStackTrace()"
    - "new Date()"

test_coverage:
  unit_test_minimum: 90
  integration_test_minimum: 80
  e2e_test_minimum: 95
```

---

## Violation Categories

### Critical (Immediate Action Required)

- Missing required API endpoints
- Unauthorized module dependencies
- Performance targets not met (TPS, latency)
- Security vulnerabilities detected
- Required cryptography methods missing

### High (Fix Within 24 Hours)

- Naming convention violations
- Missing test coverage thresholds
- Deprecated API usage
- Architecture layer violations
- Missing service implementations

### Medium (Fix Within 3 Days)

- Code style deviations
- Documentation missing
- Inefficient implementations
- Version incompatibilities
- Minor pattern violations

### Low (Fix Within Sprint)

- Code organization issues
- Unused imports
- Inconsistent formatting
- Comment quality issues
- Minor design violations

---

## Scanning Implementation

### Task 1: Architecture Compliance Scan
**Schedule**: Every 30 minutes

```bash
# Scan module dependencies
find /path/to/v11 -name "*.java" | while read file; do
  grep -h "^import " "$file" | while read import; do
    check_allowed_dependency "$import" "$module"
    if [[ $? -ne 0 ]]; then
      log_violation "CRITICAL" "$file" "Unauthorized import: $import"
    fi
  done
done

# Verify module structure
for module in "${modules[@]}"; do
  if [[ ! -d "$module_path" ]]; then
    log_violation "CRITICAL" "$module" "Module path missing"
  fi
done

# Check API endpoints
grep -r "@.*Mapping" src/ | while read line; do
  if [[ ! $line =~ $endpoint_pattern ]]; then
    log_violation "HIGH" "$file" "Non-standard API endpoint: $line"
  fi
done
```

### Task 2: PRD Requirements Verification
**Schedule**: Every hour

```bash
# Check feature implementations
for feature in "${features[@]}"; do
  file=$(get_feature_file "$feature")

  if [[ ! -f "$file" ]]; then
    log_violation "CRITICAL" "$feature" "Implementation file missing"
    continue
  fi

  # Verify required methods exist
  for method in $(get_required_methods "$feature"); do
    if ! grep -q "public.*$method()" "$file"; then
      log_violation "CRITICAL" "$feature" "Required method missing: $method"
    fi
  done
done

# Check performance targets
run_performance_tests
performance_results=$(parse_performance_results)
for target in "${performance_targets[@]}"; do
  if [[ $(get_metric "$target") -lt $(get_requirement "$target") ]]; then
    log_violation "CRITICAL" "Performance" "$target not met"
  fi
done
```

### Task 3: Design Pattern Enforcement
**Schedule**: On every commit (via git hook)

```bash
# Check naming conventions
find src/ -name "*.java" | while read file; do
  classname=$(basename "$file" .java)
  if [[ ! $classname =~ $naming_pattern ]]; then
    log_violation "HIGH" "$file" "Invalid class name: $classname"
  fi
done

# Verify file organization
for class_type in "${class_types[@]}"; do
  find src/ -name "*${class_type}.java" | while read file; do
    if [[ ! $file =~ $expected_location ]]; then
      log_violation "HIGH" "$file" "File in wrong location"
    fi
  done
done

# Check annotations
grep -r "public class" src/ | while read line; do
  file=$(echo "$line" | cut -d: -f1)
  if ! grep -B5 "^public class" "$file" | grep -q "@RestController\|@Service\|@Component"; then
    log_violation "MEDIUM" "$file" "Missing required annotation"
  fi
done
```

### Task 4: Code Quality Analysis
**Schedule**: Every 4 hours + on demand

```bash
# Measure test coverage
coverage=$(run_jacoco_coverage)
if [[ $(echo "$coverage < 90" | bc) -eq 1 ]]; then
  log_violation "HIGH" "Tests" "Unit test coverage below 90%: $coverage%"
fi

# Check dependency versions
mvn dependency:tree | while read dependency; do
  if is_deprecated "$dependency"; then
    log_violation "MEDIUM" "Dependencies" "Deprecated dependency: $dependency"
  fi
  if is_vulnerable "$dependency"; then
    log_violation "CRITICAL" "Security" "Vulnerable dependency: $dependency"
  fi
done

# Detect forbidden patterns
grep -r "System.out.println\|printStackTrace\|new Date()" src/ | while read line; do
  file=$(echo "$line" | cut -d: -f1)
  log_violation "HIGH" "$file" "Forbidden pattern detected: $line"
done
```

### Task 5: Generate Reports
**Schedule**: Every hour

```bash
# Collect violations from last hour
violations=$(get_violations_since "1 hour ago")

# Categorize
critical=$(filter_violations "violations" "CRITICAL")
high=$(filter_violations "violations" "HIGH")
medium=$(filter_violations "violations" "MEDIUM")
low=$(filter_violations "violations" "LOW")

# Generate report
cat > /tmp/architecture-monitor-report.txt <<EOF
ARCHITECTURE DEVIATION REPORT
Generated: $(date)

CRITICAL VIOLATIONS: $(count "$critical")
$(format_violations "$critical")

HIGH PRIORITY VIOLATIONS: $(count "$high")
$(format_violations "$high")

MEDIUM PRIORITY VIOLATIONS: $(count "$medium")
$(format_violations "$medium")

LOW PRIORITY VIOLATIONS: $(count "$low")
$(format_violations "$low")

TREND ANALYSIS:
- Total violations today: $(count_violations "today")
- Total violations this week: $(count_violations "this week")
- Trending: $(trend_analysis)

SUMMARY:
- Architecture Compliance: $(calculate_compliance_score)%
- PRD Adherence: $(calculate_prd_score)%
- Design Pattern Compliance: $(calculate_design_score)%
EOF

# Log to file
cat /tmp/architecture-monitor-report.txt >> /tmp/architecture-monitor-full.log

# Create JIRA tickets for critical violations
if [[ $(count "$critical") -gt 0 ]]; then
  for violation in $critical; do
    create_jira_ticket "CRITICAL" "$violation"
  done
fi
```

---

## Monitoring & Alerts

### Alert Channels

```bash
# Log File
/tmp/architecture-monitor.log

# Alert on Critical
echo "[CRITICAL] $violation" | \
  tee -a /tmp/architecture-monitor.log

# JIRA Ticket Creation (on Critical)
curl -X POST \
  -u "$JIRA_USER:$JIRA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "project": {"key": "AV11"},
      "issuetype": {"name": "Bug"},
      "summary": "Architecture Violation: '"${violation}"'",
      "priority": {"name": "Critical"}
    }
  }' \
  "$JIRA_BASE_URL/rest/api/3/issues"
```

### Dashboard Metrics

The agent maintains real-time metrics at `/tmp/architecture-monitor-status.json`:

```json
{
  "agent": "Architecture Deviation Monitor",
  "updated": "2025-11-17T14:35:00Z",
  "overall_compliance": {
    "architecture": "94.2%",
    "prd_adherence": "96.5%",
    "design_patterns": "91.3%"
  },
  "violations": {
    "critical": 0,
    "high": 2,
    "medium": 5,
    "low": 12,
    "total": 19
  },
  "recent_violations": [
    {
      "type": "HIGH",
      "category": "Test Coverage",
      "message": "Unit test coverage at 87%, target is 90%",
      "file": "TransactionService.java",
      "timestamp": "2025-11-17T14:30:00Z"
    }
  ],
  "trends": {
    "violations_24h": 24,
    "violations_7d": 156,
    "trend_direction": "decreasing"
  }
}
```

---

## Configuration Files Location

The agent loads configuration from:

```
/repo-root/.architecture-rules/
├── architecture.yml          # Module and API rules
├── prd-requirements.yml      # Feature requirements
├── design-standards.yml      # Code standards
├── performance-targets.yml   # Performance metrics
└── security-policies.yml     # Security requirements
```

---

## Running the Agent

### Start Agent

```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT
export ARCH_MONITOR_DEBUG=false
export JIRA_USER=your-email@example.com
export JIRA_TOKEN=your-api-token

./scripts/architecture-monitor-agent.sh &
```

### Verify Running

```bash
ps aux | grep architecture-monitor
tail -f /tmp/architecture-monitor.log
```

### Stop Agent

```bash
pkill -f architecture-monitor
```

### View Reports

```bash
# Latest report
cat /tmp/architecture-monitor-report.txt

# Full history
tail -100 /tmp/architecture-monitor-full.log

# Status metrics
cat /tmp/architecture-monitor-status.json | jq
```

---

## Benefits

### For Development Teams
- Real-time feedback on architecture violations
- Catch PRD mismatches early
- Ensure code follows design patterns
- Prevent technical debt accumulation

### For Architects
- Continuous architecture compliance monitoring
- Early warning system for deviations
- Automated violation reporting
- Design pattern enforcement

### For QA/Testing
- Verify test coverage targets
- Monitor performance metrics
- Detect missing test implementations
- Alert on quality degradation

### For DevOps
- Security vulnerability detection
- Dependency management
- Performance baseline monitoring
- Compliance tracking

---

## Roadmap

### V1 (Current)
- ✅ Architecture compliance scanning
- ✅ PRD requirements verification
- ✅ Design pattern enforcement
- ✅ Hourly reporting
- ✅ JIRA ticket creation

### V2 (Future)
- [ ] ML-based pattern detection
- [ ] Predictive violation warnings
- [ ] Integration with SonarQube
- [ ] Slack notifications
- [ ] Custom violation rules engine
- [ ] Trend analysis and forecasting
- [ ] Automated remediation suggestions

---

## Known Limitations

1. **File Scanning**: Text-based pattern matching; may have false positives
2. **Performance Tests**: Requires test infrastructure; not available in all environments
3. **PRD Matching**: Requires manual configuration of feature specifications
4. **Real-Time**: Runs on schedule; not triggered on every keystroke
5. **Dependencies**: Requires Maven/Gradle for dependency analysis

---

**Agent Status**: Ready for deployment
**Last Updated**: November 17, 2025
**Integration**: #addtoJ4Cagents
