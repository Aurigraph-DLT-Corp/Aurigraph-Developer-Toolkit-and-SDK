#!/usr/bin/env python3
"""
JIRA Ticket Creation Script for Sprints 15-18
Creates 40 tickets (4 epics + 36 stories)
"""

import requests
import json
import time
from typing import Optional

# JIRA Configuration
JIRA_EMAIL = "subbu@aurigraph.io"
JIRA_API_TOKEN = "ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
JIRA_BASE_URL = "https://aurigraphdlt.atlassian.net"
JIRA_PROJECT_KEY = "AV11"

# Counters
created_count = 0
failed_count = 0
created_tickets = []

def create_jira_ticket(ticket_type: str, summary: str, description: str,
                      story_points: int = 0, parent_key: Optional[str] = None,
                      priority: str = "Medium", labels: list = []) -> Optional[str]:
    """Create a JIRA ticket and return the created key"""
    global created_count, failed_count

    print(f"\n{'='*60}")
    print(f"Creating {ticket_type}: {summary}")
    print(f"{'='*60}")

    # Build payload
    payload = {
        "fields": {
            "project": {"key": JIRA_PROJECT_KEY},
            "summary": summary,
            "description": {
                "type": "doc",
                "version": 1,
                "content": [{
                    "type": "paragraph",
                    "content": [{
                        "type": "text",
                        "text": description
                    }]
                }]
            },
            "issuetype": {"name": ticket_type}
        }
    }

    # Add parent if provided (for stories under epics)
    if parent_key:
        payload["fields"]["parent"] = {"key": parent_key}

    # Add labels if provided
    if labels:
        payload["fields"]["labels"] = labels

    try:
        # Create ticket
        response = requests.post(
            f"{JIRA_BASE_URL}/rest/api/3/issue",
            auth=(JIRA_EMAIL, JIRA_API_TOKEN),
            headers={"Accept": "application/json", "Content-Type": "application/json"},
            json=payload
        )

        if response.status_code == 201:
            created_key = response.json()["key"]
            print(f"✓ Created: {created_key}")
            created_count += 1
            created_tickets.append({"key": created_key, "summary": summary})
            return created_key
        else:
            print(f"✗ Failed (HTTP {response.status_code})")
            print(f"  Error: {response.text[:200]}")
            failed_count += 1
            return None

    except Exception as e:
        print(f"✗ Exception: {str(e)}")
        failed_count += 1
        return None

def main():
    print("="*70)
    print("JIRA Ticket Creation - Sprints 15-18")
    print("="*70)

    # ========================================
    # SPRINT 15: Core Node Implementation
    # ========================================
    print("\n\n### SPRINT 15: Core Node Implementation ###\n")

    epic_208 = create_jira_ticket(
        "Epic",
        "Sprint 15: Core Node Implementation",
        "Complete implementation of Channel, Validator, Business, and API Integration nodes with base Node interface and V11 backend integration.",
        labels=["node-implementation", "backend", "core"]
    )
    time.sleep(2)

    if epic_208:
        create_jira_ticket(
            "Story",
            "Complete Channel Node Service Implementation",
            "Implement Channel Node with 500K msg/sec, 10K concurrent channels, <5ms routing latency",
            parent_key=epic_208,
            labels=["channel-node", "backend"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Complete Validator Node Service Implementation",
            "Implement Validator Node with HyperRAFT++ consensus: 200K TPS, <500ms block proposal, <1s finality",
            parent_key=epic_208,
            labels=["validator-node", "consensus"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Complete Business Node Service Implementation",
            "Implement Business Node with smart contracts: 100K tx/sec, <100ms execution, <200ms workflow",
            parent_key=epic_208,
            labels=["business-node", "smart-contracts"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Complete API Integration Node - Alpaca Markets",
            "Implement Alpaca Markets integration: 10K calls/sec, >90% cache hit, <100ms latency",
            parent_key=epic_208,
            labels=["api-node", "alpaca"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Complete API Integration Node - Weather Service",
            "Implement Weather.com integration: 10K calls/sec, 5min cache TTL, <10s freshness",
            parent_key=epic_208,
            labels=["api-node", "weather"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Implement Base Node Interface and Abstract Class",
            "Create Node interface, AbstractNode, NodeFactory, NodeRegistry for all node types",
            parent_key=epic_208,
            labels=["node-interface", "foundation"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Implement Node Configuration Management System",
            "Create configuration system with validation, hot reload, persistence. Support global, node-type, instance configs",
            parent_key=epic_208,
            labels=["configuration", "backend"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Implement Node State Management and Persistence",
            "Create state management with LevelDB persistence, sync, recovery, snapshots",
            parent_key=epic_208,
            labels=["state-management", "persistence"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Implement Node Metrics and Monitoring",
            "Create metrics with Prometheus export, real-time streaming, alerting. Track TPS, latency, errors, resources",
            parent_key=epic_208,
            labels=["metrics", "monitoring"]
        )
        time.sleep(2)

    # ========================================
    # SPRINT 16: Real-Time Infrastructure
    # ========================================
    print("\n\n### SPRINT 16: Real-Time Infrastructure & Visualization ###\n")

    epic_218 = create_jira_ticket(
        "Epic",
        "Sprint 16: Real-Time Infrastructure & Visualization",
        "Implement WebSocket layer and Vizro graph visualization for real-time node monitoring",
        labels=["real-time", "visualization", "frontend"]
    )
    time.sleep(2)

    if epic_218:
        create_jira_ticket(
            "Story",
            "Implement WebSocket Server Infrastructure",
            "Create WebSocket server: 10K connections, <50ms latency, 50K events/sec",
            parent_key=epic_218,
            labels=["websocket", "real-time"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Implement Real-Time Event System",
            "Create event system with filtering and replay for channel, consensus, transaction, metric events",
            parent_key=epic_218,
            labels=["events", "real-time"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Create Vizro Graph Visualization Component",
            "Build Vizro graph with force-directed layout, drag/drop, zoom/pan, real-time updates",
            parent_key=epic_218,
            labels=["vizro", "visualization", "frontend"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Create Node Panel UI Components",
            "Build node control panel with filtering, sorting, search, real-time updates",
            parent_key=epic_218,
            labels=["ui", "frontend", "react"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Implement Node Configuration UI",
            "Build configuration interface with validation, presets, import/export, history",
            parent_key=epic_218,
            labels=["ui", "configuration", "frontend"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Implement Real-Time Data Streaming to UI",
            "Create data streaming pipeline with throttling, reconnection, error handling",
            parent_key=epic_218,
            labels=["streaming", "real-time", "frontend"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Create Scalability Demo Mode",
            "Build auto-scaling demo with load generator, performance viz, capacity metrics",
            parent_key=epic_218,
            labels=["demo", "scalability"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Implement Performance Dashboard",
            "Create performance dashboard with TPS charts, latency distribution, resource utilization",
            parent_key=epic_218,
            labels=["dashboard", "monitoring", "frontend"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Create Node Health Monitoring UI",
            "Build health monitoring UI with alerts, history timeline, diagnostic tools",
            parent_key=epic_218,
            labels=["health", "monitoring", "frontend"]
        )
        time.sleep(2)

    # ========================================
    # SPRINT 17: Advanced Features
    # ========================================
    print("\n\n### SPRINT 17: Advanced Features & Integration ###\n")

    epic_228 = create_jira_ticket(
        "Epic",
        "Sprint 17: Advanced Features & Integration",
        "Advanced node features and V11 backend integration with transaction service, consensus, gRPC, cross-chain",
        labels=["integration", "advanced-features"]
    )
    time.sleep(2)

    if epic_228:
        create_jira_ticket(
            "Story",
            "Integrate Nodes with V11 Transaction Service",
            "Connect Business nodes with TransactionService for submission, status tracking, batch operations",
            parent_key=epic_228,
            labels=["integration", "transactions"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Integrate Nodes with HyperRAFT++ Consensus",
            "Connect Validators with consensus for leader election, block proposal, voting, state sync",
            parent_key=epic_228,
            labels=["integration", "consensus"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Implement Inter-Node gRPC Communication",
            "Create gRPC layer with RPC calls, streaming, load balancing, circuit breaker, mTLS",
            parent_key=epic_228,
            labels=["grpc", "communication"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Implement Node Discovery and Service Registry",
            "Create discovery with Kubernetes and DNS integration, auto-registration, health-based de-registration",
            parent_key=epic_228,
            labels=["discovery", "service-registry"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Implement Cross-Chain Bridge Integration for Nodes",
            "Connect nodes with bridge for Ethereum, Solana transfers, status tracking, fee calculation",
            parent_key=epic_228,
            labels=["cross-chain", "bridge"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Implement Node Security and Access Control",
            "Add RBAC with JWT, permissions, audit logging, rate limiting, IP whitelist",
            parent_key=epic_228,
            labels=["security", "rbac", "authentication"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Implement Node Backup and Recovery",
            "Create backup with automated scheduling, point-in-time recovery, snapshots, disaster recovery",
            parent_key=epic_228,
            labels=["backup", "recovery", "operations"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Implement Node Logging and Diagnostics",
            "Add structured JSON logging, Elasticsearch integration, thread/heap dumps, profiling",
            parent_key=epic_228,
            labels=["logging", "diagnostics", "observability"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Implement Node Resource Management",
            "Add CPU/memory limits, disk monitoring, bandwidth limiting, connection pooling, auto-scaling",
            parent_key=epic_228,
            labels=["resource-management", "operations"]
        )
        time.sleep(2)

    # ========================================
    # SPRINT 18: Testing & Deployment
    # ========================================
    print("\n\n### SPRINT 18: Testing, Documentation & Deployment ###\n")

    epic_238 = create_jira_ticket(
        "Epic",
        "Sprint 18: Testing, Documentation & Deployment",
        "Complete testing suite, documentation, and production deployment with CI/CD pipeline",
        labels=["testing", "documentation", "deployment"]
    )
    time.sleep(2)

    if epic_238:
        create_jira_ticket(
            "Story",
            "Create Comprehensive Unit Test Suite",
            "Write unit tests for all components. Target: 95%+ line coverage, 90%+ branch coverage",
            parent_key=epic_238,
            labels=["testing", "unit-tests", "quality"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Create Integration Test Suite",
            "Write integration tests for node interactions, services, WebSocket, database, external APIs",
            parent_key=epic_238,
            labels=["testing", "integration-tests", "quality"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Create Performance Test Suite",
            "Build performance tests: 2M+ network TPS, 500K channel msg/sec, 200K validator TPS",
            parent_key=epic_238,
            labels=["testing", "performance", "load-testing"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Create API Documentation (OpenAPI/Swagger)",
            "Generate API docs with OpenAPI 3.0, Swagger UI, examples, authentication guide, error codes",
            parent_key=epic_238,
            labels=["documentation", "api", "openapi"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Create User Guide and Tutorials",
            "Write user guide with Getting Started, deployment tutorials, configuration, troubleshooting, FAQ",
            parent_key=epic_238,
            labels=["documentation", "user-guide", "tutorials"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Create Architecture Documentation",
            "Document architecture with diagrams: system, component, sequence, data flow, deployment, security",
            parent_key=epic_238,
            labels=["documentation", "architecture", "adr"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Create Docker Images and Compose Files",
            "Build Docker images with multi-stage builds. Target: <500MB. Include Compose for dev/prod",
            parent_key=epic_238,
            labels=["docker", "containers", "devops"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Create Kubernetes Manifests and Helm Charts",
            "Build K8s deployment with HPA (2-20 replicas), rolling updates, health probes, Helm chart",
            parent_key=epic_238,
            labels=["kubernetes", "helm", "devops"]
        )
        time.sleep(1)

        create_jira_ticket(
            "Story",
            "Deploy to Production and Create CI/CD Pipeline",
            "Create GitHub Actions pipeline with testing, Docker builds, staging/prod deployment, monitoring",
            parent_key=epic_238,
            labels=["cicd", "deployment", "production"]
        )
        time.sleep(1)

    # Summary
    print("\n\n" + "="*70)
    print("TICKET CREATION SUMMARY")
    print("="*70)
    print(f"✓ Successfully created: {created_count} tickets")
    if failed_count > 0:
        print(f"✗ Failed to create: {failed_count} tickets")
    print("="*70)

    # List created tickets
    if created_tickets:
        print("\nCreated Tickets:")
        for ticket in created_tickets:
            print(f"  - {ticket['key']}: {ticket['summary']}")

    print(f"\nNext steps:")
    print(f"1. Verify tickets in JIRA: {JIRA_BASE_URL}/browse/{JIRA_PROJECT_KEY}")
    print(f"2. Assign tickets to team members")
    print(f"3. Set sprint dates and start sprints")
    print(f"4. Update story points via JIRA UI")
    print()

if __name__ == "__main__":
    main()
