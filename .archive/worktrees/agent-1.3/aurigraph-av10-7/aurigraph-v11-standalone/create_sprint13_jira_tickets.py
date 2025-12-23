#!/usr/bin/env python3
"""
Create JIRA Tickets for Sprint 13 - Parallel Development
Epic: AV11-295 (gRPC Foundation & Consensus Core)
"""

import requests
import json
import sys
from typing import Dict, List

# JIRA Configuration
JIRA_EMAIL = "subbu@aurigraph.io"
JIRA_API_TOKEN = "ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
JIRA_BASE_URL = "https://aurigraphdlt.atlassian.net"
PROJECT_KEY = "AV11"

# Sprint 13 Tickets
SPRINT_13_TICKETS = [
    # WORKSTREAM 1: gRPC Service Migration
    {
        "summary": "Design gRPC Service Architecture",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 1 - gRPC Service Migration
**Priority:** CRITICAL
**Duration:** 3 days
**Team:** Core Architecture Team + Backend Platform Team

**Objectives:**
- Define all internal service communication patterns
- Create comprehensive .proto file specifications
- Design service mesh topology
- Document gRPC best practices

**Deliverables:**
- Architecture diagram (system + component level)
- 20+ proto files for all services
- Service mesh topology document
- gRPC communication guidelines

**Acceptance Criteria:**
- [ ] All internal services have proto definitions
- [ ] Service mesh topology approved by CAA
- [ ] Proto files compile without errors
- [ ] Documentation reviewed and approved

**Dependencies:** None
**Risk Level:** High - foundational architecture decisions""",
        "story_points": 8,
        "assignee": None,  # Will be assigned later
        "labels": ["sprint13", "workstream1", "grpc", "architecture"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },
    {
        "summary": "Implement Core gRPC Services",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 1 - gRPC Service Migration
**Priority:** CRITICAL
**Duration:** 5 days
**Team:** Backend Platform Team

**Objectives:**
- Implement TransactionService gRPC interface
- Implement ConsensusService gRPC interface
- Implement BlockchainService gRPC interface
- Implement StateManager gRPC interface

**Deliverables:**
- 4 fully functional gRPC services with:
  - Server implementation
  - Client stubs
  - Unit tests (95% coverage)
  - Integration tests
  - Performance benchmarks

**Acceptance Criteria:**
- [ ] All 4 services operational
- [ ] Unit tests pass (>95% coverage)
- [ ] Integration tests pass
- [ ] Performance meets baseline (<50ms latency)
- [ ] Error handling implemented
- [ ] Logging and monitoring integrated

**Dependencies:** AV11-300 (gRPC Architecture)
**Risk Level:** High - critical services""",
        "story_points": 13,
        "assignee": None,
        "labels": ["sprint13", "workstream1", "grpc", "backend"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },
    {
        "summary": "gRPC Service Discovery & Load Balancing",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 1 - gRPC Service Migration
**Priority:** HIGH
**Duration:** 3 days
**Team:** Core Architecture Team

**Objectives:**
- Implement service registry
- Configure client-side load balancing
- Add health checks for all gRPC services
- Implement retry/timeout policies

**Deliverables:**
- Service discovery system (Consul/etcd)
- Load balancing configuration
- Health check endpoints
- Resilience policies (retry, circuit breaker)

**Acceptance Criteria:**
- [ ] Services auto-register on startup
- [ ] Load balancing distributes requests evenly
- [ ] Health checks detect unhealthy services
- [ ] Failed requests retry automatically
- [ ] Circuit breaker prevents cascading failures

**Dependencies:** AV11-301 (Core gRPC Services)
**Risk Level:** Medium""",
        "story_points": 8,
        "assignee": None,
        "labels": ["sprint13", "workstream1", "grpc", "infrastructure"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },
    {
        "summary": "Migrate REST to gRPC Internal Calls",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 1 - gRPC Service Migration
**Priority:** CRITICAL
**Duration:** 4 days
**Team:** Core Architecture Team + Backend Platform Team

**Objectives:**
- Replace all REST internal calls with gRPC
- Maintain REST only for external API
- Performance benchmarking (REST vs gRPC)
- Update documentation

**Deliverables:**
- 100% internal gRPC communication
- External REST API preserved
- Performance comparison report
- Migration guide documentation

**Acceptance Criteria:**
- [ ] No internal REST calls remaining
- [ ] gRPC shows >50% latency improvement
- [ ] All integration tests pass
- [ ] External API unchanged
- [ ] Zero downtime during migration

**Dependencies:** AV11-302 (Service Discovery)
**Risk Level:** High - breaking changes possible""",
        "story_points": 13,
        "assignee": None,
        "labels": ["sprint13", "workstream1", "grpc", "migration"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },

    # WORKSTREAM 2: HyperRAFT++ Consensus Migration
    {
        "summary": "Migrate HyperRAFT++ Leader Election",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 2 - HyperRAFT++ Consensus Migration
**Priority:** CRITICAL
**Duration:** 4 days
**Team:** Backend Platform Team (Consensus Specialist)

**Objectives:**
- Port leader election algorithm from TypeScript to Java
- Implement Java/Quarkus reactive version
- Add virtual thread optimization
- Integrate with gRPC for inter-node communication

**Deliverables:**
- Leader election service (Java)
- Election timeout management
- Split-vote prevention
- Unit tests (98% coverage)

**Acceptance Criteria:**
- [ ] Leader election completes in <500ms
- [ ] No split-vote scenarios
- [ ] Leader failover in <1s
- [ ] Virtual threads reduce overhead
- [ ] Unit tests pass (98% coverage)

**Dependencies:** AV11-301 (gRPC Services)
**Risk Level:** High - consensus critical""",
        "story_points": 13,
        "assignee": None,
        "labels": ["sprint13", "workstream2", "consensus", "hyperraft"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },
    {
        "summary": "Migrate HyperRAFT++ Log Replication",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 2 - HyperRAFT++ Consensus Migration
**Priority:** CRITICAL
**Duration:** 4 days
**Team:** Backend Platform Team (Consensus Specialist)

**Objectives:**
- Port log replication mechanism from TypeScript
- Implement gRPC-based replication
- Add batch processing optimization
- Implement log compaction

**Deliverables:**
- Log replication service
- AppendEntries RPC (gRPC)
- Batch replication
- Log compaction mechanism

**Acceptance Criteria:**
- [ ] Replication throughput >1M ops/sec
- [ ] Batch size dynamically adjusted
- [ ] Log compaction reduces storage by 80%
- [ ] Out-of-order handling correct
- [ ] Unit tests pass (95% coverage)

**Dependencies:** AV11-310 (Leader Election)
**Risk Level:** High - consensus critical""",
        "story_points": 13,
        "assignee": None,
        "labels": ["sprint13", "workstream2", "consensus", "hyperraft"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },
    {
        "summary": "Implement Consensus State Machine",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 2 - HyperRAFT++ Consensus Migration
**Priority:** HIGH
**Duration:** 3 days
**Team:** Backend Platform Team

**Objectives:**
- Implement state transitions (Follower/Candidate/Leader)
- Snapshot mechanism for state recovery
- Recovery procedures after failure
- Integrate with transaction processing

**Deliverables:**
- State machine implementation
- Snapshot creation/restoration
- Recovery procedures
- State persistence

**Acceptance Criteria:**
- [ ] State transitions follow RAFT specification
- [ ] Snapshots created every 10K entries
- [ ] Recovery from snapshot in <10s
- [ ] State persisted to disk
- [ ] Unit tests pass (95% coverage)

**Dependencies:** AV11-311 (Log Replication)
**Risk Level:** Medium""",
        "story_points": 8,
        "assignee": None,
        "labels": ["sprint13", "workstream2", "consensus", "state-machine"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },
    {
        "summary": "Integrate AI-Based Consensus Optimization",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 2 - HyperRAFT++ Consensus Migration
**Priority:** MEDIUM
**Duration:** 2 days
**Team:** AI/ML Development Team + Backend Platform Team

**Objectives:**
- Connect AIConsensusOptimizer to HyperRAFT++
- Real-time tuning integration
- Performance monitoring
- Adaptive batch sizing

**Deliverables:**
- AI-optimized consensus
- Dynamic parameter tuning
- Performance metrics integration
- ML model deployment

**Acceptance Criteria:**
- [ ] AI model reduces consensus latency by 20%
- [ ] Batch size adapts to load
- [ ] Real-time performance monitoring
- [ ] Model updates without downtime

**Dependencies:** AV11-312 (State Machine)
**Risk Level:** Low""",
        "story_points": 5,
        "assignee": None,
        "labels": ["sprint13", "workstream2", "consensus", "ai-optimization"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },

    # WORKSTREAM 3: Quantum Cryptography Foundation
    {
        "summary": "Migrate CRYSTALS-Kyber Implementation",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 3 - Quantum Cryptography Foundation
**Priority:** HIGH
**Duration:** 4 days
**Team:** Security & Cryptography Team

**Objectives:**
- Port Kyber key exchange from V10 TypeScript
- Java BouncyCastle integration
- Performance optimization
- Key serialization/deserialization

**Deliverables:**
- Kyber service (Java)
- Key exchange protocol
- Performance benchmarks
- Unit tests (98% coverage)

**Acceptance Criteria:**
- [ ] Kyber-1024 key exchange in <5ms
- [ ] BouncyCastle integration working
- [ ] Serialization format compatible
- [ ] Performance within 20% of C implementation
- [ ] Unit tests pass (98% coverage)

**Dependencies:** None
**Risk Level:** Medium - library compatibility""",
        "story_points": 13,
        "assignee": None,
        "labels": ["sprint13", "workstream3", "crypto", "quantum"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },
    {
        "summary": "Migrate CRYSTALS-Dilithium Signatures",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 3 - Quantum Cryptography Foundation
**Priority:** HIGH
**Duration:** 4 days
**Team:** Security & Cryptography Team

**Objectives:**
- Port Dilithium digital signatures from V10
- Integrate with transaction signing
- Batch verification optimization
- Performance tuning

**Deliverables:**
- Dilithium signature service
- Transaction signing integration
- Batch verification (100+ signatures)
- Performance benchmarks

**Acceptance Criteria:**
- [ ] Dilithium5 signing in <3ms
- [ ] Verification in <2ms
- [ ] Batch verification 10x faster
- [ ] Transaction integration working
- [ ] Unit tests pass (95% coverage)

**Dependencies:** None
**Risk Level:** Medium""",
        "story_points": 13,
        "assignee": None,
        "labels": ["sprint13", "workstream3", "crypto", "quantum", "signatures"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },
    {
        "summary": "Quantum-Safe Key Management",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 3 - Quantum Cryptography Foundation
**Priority:** MEDIUM
**Duration:** 3 days
**Team:** Security & Cryptography Team

**Objectives:**
- Key generation service
- Secure key storage (HSM integration)
- Key rotation mechanism
- Key backup/recovery

**Deliverables:**
- Key management system
- HSM integration
- Key rotation automation
- Backup/recovery procedures

**Acceptance Criteria:**
- [ ] Keys stored in HSM
- [ ] Automated key rotation every 90 days
- [ ] Backup encryption with master key
- [ ] Recovery tested successfully
- [ ] Audit logging for all operations

**Dependencies:** AV11-320, AV11-321
**Risk Level:** Medium""",
        "story_points": 8,
        "assignee": None,
        "labels": ["sprint13", "workstream3", "crypto", "key-management"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },
    {
        "summary": "Crypto Performance Benchmarking",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 3 - Quantum Cryptography Foundation
**Priority:** LOW
**Duration:** 2 days
**Team:** Security & Cryptography Team

**Objectives:**
- Benchmark Kyber/Dilithium performance
- Compare with classical crypto (ECDSA, RSA)
- Identify optimization opportunities
- Create performance report

**Deliverables:**
- Performance comparison report
- Optimization recommendations
- Benchmarking suite
- Regression test suite

**Acceptance Criteria:**
- [ ] Benchmarks for 1K, 10K, 100K operations
- [ ] Comparison with classical crypto
- [ ] Optimization recommendations documented
- [ ] Regression tests automated

**Dependencies:** AV11-320, AV11-321
**Risk Level:** Low""",
        "story_points": 5,
        "assignee": None,
        "labels": ["sprint13", "workstream3", "crypto", "performance"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },

    # WORKSTREAM 4: Test Automation Infrastructure
    {
        "summary": "Setup JUnit 5 + TestContainers Framework",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 4 - Test Automation Infrastructure
**Priority:** HIGH
**Duration:** 2 days
**Team:** Quality Assurance Team

**Objectives:**
- Configure comprehensive test infrastructure
- Setup Redis/H2 test containers
- Create base test classes
- Configure test reporting

**Deliverables:**
- Test framework configuration
- Base test classes (unit, integration, e2e)
- TestContainers setup
- Test reporting (JaCoCo, Surefire)

**Acceptance Criteria:**
- [ ] JUnit 5 configured
- [ ] TestContainers working
- [ ] Base test classes created
- [ ] Test reports generated
- [ ] CI integration ready

**Dependencies:** None
**Risk Level:** Low""",
        "story_points": 5,
        "assignee": None,
        "labels": ["sprint13", "workstream4", "testing", "infrastructure"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },
    {
        "summary": "Write Unit Tests for Core Services",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 4 - Test Automation Infrastructure
**Priority:** CRITICAL
**Duration:** 5 days
**Team:** Quality Assurance Team + Backend Team

**Objectives:**
- Write unit tests for TransactionService (target: 95% coverage)
- Write unit tests for ConsensusService (target: 98% coverage)
- Write unit tests for CryptoService (target: 98% coverage)
- Write unit tests for BlockchainService (target: 95% coverage)

**Deliverables:**
- 150+ unit tests
- 95%+ coverage for critical services
- Parameterized tests for edge cases
- Mock/stub utilities

**Acceptance Criteria:**
- [ ] TransactionService: 95% coverage
- [ ] ConsensusService: 98% coverage
- [ ] CryptoService: 98% coverage
- [ ] BlockchainService: 95% coverage
- [ ] All tests pass
- [ ] Test execution < 5 minutes

**Dependencies:** AV11-330
**Risk Level:** Medium""",
        "story_points": 13,
        "assignee": None,
        "labels": ["sprint13", "workstream4", "testing", "unit-tests"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },
    {
        "summary": "Write Integration Tests for gRPC Services",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 4 - Test Automation Infrastructure
**Priority:** HIGH
**Duration:** 4 days
**Team:** Quality Assurance Team

**Objectives:**
- End-to-end gRPC service tests
- Service interaction tests
- Error handling tests
- Timeout/retry tests

**Deliverables:**
- 50+ integration tests
- Service interaction test suite
- Error scenario tests
- Performance test suite

**Acceptance Criteria:**
- [ ] All gRPC services tested end-to-end
- [ ] Service interactions validated
- [ ] Error handling verified
- [ ] Timeout/retry behavior correct
- [ ] Tests run in CI pipeline

**Dependencies:** AV11-301 (gRPC Services)
**Risk Level:** Medium""",
        "story_points": 13,
        "assignee": None,
        "labels": ["sprint13", "workstream4", "testing", "integration-tests"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },
    {
        "summary": "Performance Test Suite for 2M TPS",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 4 - Test Automation Infrastructure
**Priority:** MEDIUM
**Duration:** 2 days
**Team:** Quality Assurance Team

**Objectives:**
- Create JMeter test plans for 2M TPS
- Create Gatling load tests
- TPS validation scripts
- Performance regression detection

**Deliverables:**
- JMeter test plans (1M, 2M, 3M TPS)
- Gatling scenarios
- Automated TPS validation
- Performance dashboards

**Acceptance Criteria:**
- [ ] JMeter can generate 2M+ TPS
- [ ] Gatling tests automated
- [ ] TPS metrics collected
- [ ] Regression tests detect 10% degradation
- [ ] Reports generated automatically

**Dependencies:** None
**Risk Level:** Low""",
        "story_points": 8,
        "assignee": None,
        "labels": ["sprint13", "workstream4", "testing", "performance"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },

    # WORKSTREAM 5: Native Build Optimization
    {
        "summary": "Optimize GraalVM Native Compilation",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 5 - Native Build Optimization
**Priority:** MEDIUM
**Duration:** 3 days
**Team:** DevOps & Infrastructure Team

**Objectives:**
- Profile native image build
- Add reflection configurations
- Optimize startup time (<1s target)
- Memory footprint optimization

**Deliverables:**
- Optimized native profile
- Reflection configurations
- Startup time <1s
- Memory usage <256MB

**Acceptance Criteria:**
- [ ] Startup time <1s
- [ ] Memory footprint <256MB
- [ ] No reflection errors
- [ ] All tests pass in native mode
- [ ] Build time <15 minutes

**Dependencies:** None
**Risk Level:** Medium""",
        "story_points": 8,
        "assignee": None,
        "labels": ["sprint13", "workstream5", "native", "graalvm"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },
    {
        "summary": "Create Docker Multi-Stage Build Pipeline",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 5 - Native Build Optimization
**Priority:** MEDIUM
**Duration:** 3 days
**Team:** DevOps & Infrastructure Team

**Objectives:**
- Dockerfile optimization
- Layer caching strategy
- Build time reduction (<5 min)
- Image size reduction

**Deliverables:**
- Optimized Dockerfile
- Multi-stage build
- Layer caching
- Image size <200MB

**Acceptance Criteria:**
- [ ] Build time <5 minutes
- [ ] Image size <200MB
- [ ] Layer caching working
- [ ] Build reproducible
- [ ] No security vulnerabilities

**Dependencies:** None
**Risk Level:** Low""",
        "story_points": 8,
        "assignee": None,
        "labels": ["sprint13", "workstream5", "docker", "devops"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },
    {
        "summary": "Setup CI/CD Pipeline with GitHub Actions",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 5 - Native Build Optimization
**Priority:** HIGH
**Duration:** 4 days
**Team:** DevOps & Infrastructure Team

**Objectives:**
- Automated build on commit
- Test execution in pipeline
- Native image build automation
- Deployment to staging

**Deliverables:**
- GitHub Actions workflows
- Test automation in CI
- Native build automation
- Staging deployment automation

**Acceptance Criteria:**
- [ ] Builds triggered on commit
- [ ] Tests run automatically
- [ ] Native image built in CI
- [ ] Deployment to staging automated
- [ ] Notifications on failure

**Dependencies:** AV11-340
**Risk Level:** Low""",
        "story_points": 13,
        "assignee": None,
        "labels": ["sprint13", "workstream5", "ci-cd", "github-actions"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },
    {
        "summary": "Production Deployment Scripts",
        "description": """**Epic:** gRPC Foundation & Consensus Core
**Workstream:** 5 - Native Build Optimization
**Priority:** MEDIUM
**Duration:** 3 days
**Team:** DevOps & Infrastructure Team

**Objectives:**
- Blue-green deployment strategy
- Rollback procedures
- Health check automation
- Zero-downtime deployment

**Deliverables:**
- Deployment scripts
- Rollback automation
- Health check scripts
- Deployment runbook

**Acceptance Criteria:**
- [ ] Blue-green deployment working
- [ ] Rollback in <5 minutes
- [ ] Health checks automated
- [ ] Zero downtime validated
- [ ] Runbook documented

**Dependencies:** None
**Risk Level:** Medium""",
        "story_points": 8,
        "assignee": None,
        "labels": ["sprint13", "workstream5", "deployment", "devops"],
        "issue_type": "Task",
        "epic": "AV11-295"
    },
]

def create_epic():
    """Create the Sprint 13 Epic"""
    epic_data = {
        "fields": {
            "project": {"key": PROJECT_KEY},
            "summary": "Sprint 13: gRPC Foundation & Consensus Core",
            "description": """Sprint 13 Epic for parallel development across 5 workstreams.

**Duration:** Oct 14-25, 2025 (2 weeks)
**Theme:** Internal Communication Transformation

**Workstreams:**
1. gRPC Service Migration (Team 1 + Team 2)
2. HyperRAFT++ Consensus Migration (Team 2)
3. Quantum Cryptography Foundation (Team 4)
4. Test Automation Infrastructure (Team 7)
5. Native Build Optimization (Team 8)

**Success Criteria:**
- 100% internal gRPC communication
- HyperRAFT++ consensus operational (1M+ TPS)
- Quantum crypto foundation (80% complete)
- Test coverage increase (15% → 40%)
- Native startup time <1s
""",
            "issuetype": {"name": "Epic"},
            "labels": ["sprint13", "parallel-development", "v11-migration"],
            "customfield_10011": "AV11-295"  # Epic Name field
        }
    }

    response = requests.post(
        f"{JIRA_BASE_URL}/rest/api/3/issue",
        auth=(JIRA_EMAIL, JIRA_API_TOKEN),
        headers={"Accept": "application/json", "Content-Type": "application/json"},
        json=epic_data
    )

    if response.status_code in [200, 201]:
        epic = response.json()
        print(f"✅ Epic created: {epic['key']} - Sprint 13: gRPC Foundation & Consensus Core")
        return epic['key']
    else:
        print(f"❌ Failed to create epic: {response.status_code}")
        print(response.text)
        return None

def create_ticket(ticket_data: Dict, epic_key: str = None) -> str:
    """Create a single JIRA ticket"""

    issue_data = {
        "fields": {
            "project": {"key": PROJECT_KEY},
            "summary": ticket_data["summary"],
            "description": ticket_data["description"],
            "issuetype": {"name": ticket_data["issue_type"]},
            "labels": ticket_data["labels"]
        }
    }

    # Add story points if provided
    if "story_points" in ticket_data:
        issue_data["fields"]["customfield_10016"] = ticket_data["story_points"]

    # Link to epic if provided
    if epic_key:
        issue_data["fields"]["customfield_10014"] = epic_key  # Epic Link field

    response = requests.post(
        f"{JIRA_BASE_URL}/rest/api/3/issue",
        auth=(JIRA_EMAIL, JIRA_API_TOKEN),
        headers={"Accept": "application/json", "Content-Type": "application/json"},
        json=issue_data
    )

    if response.status_code in [200, 201]:
        issue = response.json()
        print(f"✅ Created: {issue['key']} - {ticket_data['summary']}")
        return issue['key']
    else:
        print(f"❌ Failed: {ticket_data['summary']}")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text[:200]}")
        return None

def main():
    print("🚀 Creating Sprint 13 JIRA Tickets")
    print("=" * 60)
    print("")

    # Create epic first
    print("📋 Step 1: Creating Sprint 13 Epic...")
    epic_key = "AV11-295"  # Using existing or will create
    print("")

    # Create all tickets
    print("📋 Step 2: Creating Sprint 13 Tickets...")
    print("")

    created_tickets = []
    workstream_counts = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    total_story_points = 0

    for ticket_data in SPRINT_13_TICKETS:
        ticket_key = create_ticket(ticket_data, epic_key)
        if ticket_key:
            created_tickets.append(ticket_key)

            # Count by workstream
            for label in ticket_data["labels"]:
                if label.startswith("workstream"):
                    ws_num = int(label.replace("workstream", ""))
                    workstream_counts[ws_num] += 1

            total_story_points += ticket_data.get("story_points", 0)

    print("")
    print("=" * 60)
    print("🎉 Sprint 13 Ticket Creation Complete!")
    print("")
    print(f"📊 Summary:")
    print(f"   Total Tickets Created: {len(created_tickets)}")
    print(f"   Total Story Points: {total_story_points}")
    print("")
    print(f"   Workstream 1 (gRPC): {workstream_counts[1]} tickets")
    print(f"   Workstream 2 (Consensus): {workstream_counts[2]} tickets")
    print(f"   Workstream 3 (Crypto): {workstream_counts[3]} tickets")
    print(f"   Workstream 4 (Testing): {workstream_counts[4]} tickets")
    print(f"   Workstream 5 (Native): {workstream_counts[5]} tickets")
    print("")
    print(f"🔗 View Sprint 13 Epic:")
    print(f"   {JIRA_BASE_URL}/browse/{epic_key}")
    print("")
    print("✅ All tickets are ready for Sprint 13 planning!")

if __name__ == "__main__":
    main()
