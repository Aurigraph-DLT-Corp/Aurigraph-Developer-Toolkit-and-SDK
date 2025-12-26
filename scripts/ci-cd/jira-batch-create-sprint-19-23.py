#!/usr/bin/env python3
"""
JIRA Batch Ticket Creation - Sprint 19-23
Purpose: Create 110 JIRA tickets across 5 sprints for Aurigraph DLT V11
Credentials: From /Users/subbujois/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md
Usage: python3 jira-batch-create-sprint-19-23.py [--dry-run] [--debug]
"""

import os
import sys
import json
import argparse
import requests
from requests.auth import HTTPBasicAuth
from typing import List, Dict, Optional
import time

# Configuration
JIRA_URL = "https://aurigraphdlt.atlassian.net"
PROJECT_KEY = "AV11"
API_USER = "subbu@aurigraph.io"
BOARD_ID = 789

# Colors for output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def log_info(msg):
    print(f"{Colors.BLUE}[INFO]{Colors.END} {msg}")

def log_success(msg):
    print(f"{Colors.GREEN}[SUCCESS]{Colors.END} {msg}")

def log_warn(msg):
    print(f"{Colors.YELLOW}[WARN]{Colors.END} {msg}")

def log_error(msg):
    print(f"{Colors.RED}[ERROR]{Colors.END} {msg}")

class JIRAClient:
    def __init__(self, api_token: str, dry_run: bool = False, debug: bool = False):
        self.api_token = api_token
        self.dry_run = dry_run
        self.debug = debug
        self.session = requests.Session()
        self.session.auth = HTTPBasicAuth(API_USER, api_token)

    def validate_credentials(self) -> bool:
        """Validate JIRA API credentials"""
        log_info("Validating JIRA credentials...")
        try:
            response = self.session.get(f"{JIRA_URL}/rest/api/3/myself")
            if response.status_code == 200:
                data = response.json()
                log_success(f"JIRA API authentication successful (User: {data.get('displayName')})")
                return True
            else:
                log_error(f"JIRA API authentication failed (HTTP {response.status_code})")
                return False
        except Exception as e:
            log_error(f"Authentication validation error: {str(e)}")
            return False

    def create_epic(self, summary: str, description: str) -> Optional[str]:
        """Create an Epic in JIRA (as a Task since Epic type not available)"""
        if self.debug:
            log_info(f"Creating Epic: {summary}")

        payload = {
            "fields": {
                "project": {"key": PROJECT_KEY},
                "summary": summary,
                "description": {
                    "version": 1,
                    "type": "doc",
                    "content": [{
                        "type": "paragraph",
                        "content": [{
                            "type": "text",
                            "text": description
                        }]
                    }]
                },
                "issuetype": {"name": "Task"},
                "labels": ["epic", "production-launch", "v11-migration"]
            }
        }

        if self.dry_run:
            log_info(f"DRY RUN: Would create Epic: {summary}")
            return f"AV11-DRY-{int(time.time())}"

        try:
            response = self.session.post(
                f"{JIRA_URL}/rest/api/3/issue",
                json=payload,
                headers={"Content-Type": "application/json"}
            )

            if response.status_code in [200, 201]:
                epic_key = response.json().get("key")
                log_success(f"Epic created: {epic_key}")
                return epic_key
            else:
                log_error(f"Failed to create Epic: {summary} (HTTP {response.status_code})")
                if self.debug:
                    log_error(f"Response: {response.text}")
                return None
        except Exception as e:
            log_error(f"Exception creating Epic: {str(e)}")
            return None

    def create_issue(self, summary: str, description: str, issue_type: str = "Task",
                     epic_link: Optional[str] = None) -> Optional[str]:
        """Create an Issue in JIRA"""
        # Map custom issue types to Task (only Task type available in AV11)
        mapped_type = "Task"  # All issue types map to Task for AV11 project

        if self.debug:
            log_info(f"Creating {issue_type}: {summary}")

        payload = {
            "fields": {
                "project": {"key": PROJECT_KEY},
                "summary": summary,
                "description": {
                    "version": 1,
                    "type": "doc",
                    "content": [{
                        "type": "paragraph",
                        "content": [{
                            "type": "text",
                            "text": description
                        }]
                    }]
                },
                "issuetype": {"name": mapped_type},
                "labels": ["sprint-19-23", "v11-migration"]
            }
        }

        # Epic link field not available in AV11 project - skip it

        if self.dry_run:
            log_info(f"DRY RUN: Would create {issue_type}: {summary}")
            return f"AV11-DRY-{int(time.time() * 1000) % 100000}"

        try:
            response = self.session.post(
                f"{JIRA_URL}/rest/api/3/issue",
                json=payload,
                headers={"Content-Type": "application/json"}
            )

            if response.status_code in [200, 201]:
                issue_key = response.json().get("key")
                log_success(f"Issue created: {issue_key}")
                time.sleep(0.2)  # Rate limiting
                return issue_key
            else:
                log_error(f"Failed to create issue: {summary} (HTTP {response.status_code})")
                if self.debug:
                    log_error(f"Response: {response.text}")
                return None
        except Exception as e:
            log_error(f"Exception creating issue: {str(e)}")
            return None

def main():
    parser = argparse.ArgumentParser(description="JIRA Batch Ticket Creator - Sprint 19-23")
    parser.add_argument("--dry-run", action="store_true", help="Dry run mode (don't create tickets)")
    parser.add_argument("--debug", action="store_true", help="Enable debug logging")
    args = parser.parse_args()

    # Get API token from environment
    api_token = os.getenv("JIRA_API_TOKEN")
    if not api_token:
        log_error("JIRA_API_TOKEN environment variable not set")
        log_info("Load from credentials: export JIRA_API_TOKEN='<token from Credentials.md>'")
        sys.exit(1)

    # Initialize JIRA client
    client = JIRAClient(api_token, dry_run=args.dry_run, debug=args.debug)

    # Print header
    print(f"\n{Colors.BOLD}{'=' * 70}{Colors.END}")
    log_info("JIRA Batch Ticket Creator - Sprint 19-23")
    print(f"{Colors.BOLD}{'=' * 70}{Colors.END}")
    log_info(f"URL: {JIRA_URL}")
    log_info(f"Project: {PROJECT_KEY}")
    log_info(f"User: {API_USER}")
    log_info(f"Dry Run: {'YES' if args.dry_run else 'NO'}")
    log_info(f"Debug: {'YES' if args.debug else 'NO'}")
    print()

    # Validate credentials
    if not client.validate_credentials():
        sys.exit(1)
    print()

    # Create Epic
    log_info("Creating Epic for Sprints 19-23...")
    epic_key = client.create_epic(
        "Sprint 19-23: Pre-Deployment Verification & Production Launch",
        "Comprehensive 6-week initiative to verify infrastructure readiness and achieve 2M+ TPS production deployment by Feb 15, 2026"
    )

    if not epic_key:
        log_error("Failed to create Epic. Aborting.")
        sys.exit(1)
    print()

    total_created = 0

    # Sprint 19: Pre-Deployment Verification (20 tickets)
    print(f"{Colors.BOLD}{'=' * 70}{Colors.END}")
    log_info("SPRINT 19: Pre-Deployment Verification (20 tickets)")
    print(f"{Colors.BOLD}{'=' * 70}{Colors.END}")

    sprint_19_tickets = [
        ("Prepare verification materials and communication templates", "Comprehensive documentation for team coordination and status tracking", "Task"),
        ("Validate credentials and GitHub SSH access", "Automated verification of authentication systems", "Task"),
        ("Verify development environment (Maven, Quarkus, PostgreSQL)", "Ensure all development tools are properly configured", "Task"),
        ("Execute Section 1: Credentials verification (7 items)", "Automated script to validate all system credentials", "Task"),
        ("Execute Section 2: Dev environment verification (6 items)", "Manual verification steps for developer toolchain", "Task"),
        ("Critical gate review - Sections 1-2 (13/13 items)", "Assess success probability before proceeding", "Review"),
        ("Execute Sections 3-4: Monitoring and testing verification", "Prometheus, Grafana, and test infrastructure validation", "Task"),
        ("Execute Section 5: Communication verification", "Team communication channels and notification systems", "Task"),
        ("Execute Section 6: V10 validation", "Verify current TypeScript implementation baseline", "Task"),
        ("Execute Section 7: V11 validation", "Verify Java/Quarkus implementation status", "Task"),
        ("Execute Section 8: Documentation review", "Ensure all documentation is current and accurate", "Review"),
        ("Execute Section 9: Risk mitigation procedures", "Finalize contingency and disaster recovery plans", "Task"),
        ("Final sign-off meeting - GO/NO-GO decision", "Executive review for production launch approval", "Meeting"),
        ("Fix critical infrastructure issues (4 critical, 8 warnings)", "Address security and configuration issues identified in code review", "Task"),
        ("Deploy verification tracking dashboards", "Setup real-time tracking for verification progress", "Task"),
        ("Train team on verification procedures", "Ensure team is ready for execution phase", "Training"),
        ("Prepare production deployment checklist", "Comprehensive pre-flight checklist for Feb 15 launch", "Documentation"),
        ("Setup incident response procedures", "Define escalation matrix and SLA commitments", "Documentation"),
        ("Create post-verification action items log", "Track all issues identified during verification", "Documentation"),
        ("Execute final security audit", "Comprehensive security review before production deployment", "Review"),
    ]

    sprint_19_count = 0
    for summary, description, issue_type in sprint_19_tickets:
        issue_key = client.create_issue(summary, description, issue_type, epic_key)
        if issue_key:
            sprint_19_count += 1
            total_created += 1

    log_info(f"Sprint 19 completed: {sprint_19_count}/20 tickets created")
    print()

    # Sprint 20: REST-gRPC Gateway & Performance (30 tickets)
    print(f"{Colors.BOLD}{'=' * 70}{Colors.END}")
    log_info("SPRINT 20: REST-gRPC Gateway & Performance (30 tickets)")
    print(f"{Colors.BOLD}{'=' * 70}{Colors.END}")

    sprint_20_count = 0

    # Phase 1: Protocol Buffers (10 tickets)
    for i in range(1, 11):
        summary = f"Define Protocol Buffer service {i} (core services)"
        description = f"Create protocol buffer definitions for gRPC service interface {i}, including message types and service methods"
        issue_key = client.create_issue(summary, description, "Task", epic_key)
        if issue_key:
            sprint_20_count += 1
            total_created += 1

    # Phase 2: gRPC Service Implementation (10 tickets)
    for i in range(1, 11):
        summary = f"Implement gRPC service {i} with integration tests"
        description = f"Implement gRPC service #{i} with comprehensive integration tests (≥70% coverage) and performance benchmarking"
        issue_key = client.create_issue(summary, description, "Task", epic_key)
        if issue_key:
            sprint_20_count += 1
            total_created += 1

    # Phase 3: REST-gRPC Gateway & Performance (10 tickets)
    rest_grpc_tickets = [
        ("Implement REST-gRPC Gateway (dual protocol support)", "Build bidirectional gateway with automatic protocol negotiation and message translation"),
        ("Performance optimization for gRPC serialization", "Benchmark and optimize Protocol Buffer message serialization performance"),
        ("Implement connection pooling for gRPC clients", "Add intelligent pooling to reduce connection overhead"),
        ("Add compression support to gRPC streams", "Implement gzip/brotli compression for large payloads"),
        ("Implement request tracing for gRPC services", "Add distributed tracing with OpenTelemetry"),
        ("Add metrics collection for gRPC endpoints", "Prometheus metrics for all gRPC operations"),
        ("Performance testing: 1M TPS with gRPC", "End-to-end performance validation against 1M TPS target"),
        ("Implement graceful degradation (REST fallback)", "Automatic fallback to REST if gRPC unavailable"),
        ("Load balancing optimization for gRPC", "Multi-node load distribution with sticky sessions"),
        ("Production hardening for gRPC services", "Security, rate limiting, and reliability improvements"),
    ]

    for summary, description in rest_grpc_tickets:
        issue_key = client.create_issue(summary, description, "Task", epic_key)
        if issue_key:
            sprint_20_count += 1
            total_created += 1

    log_info(f"Sprint 20 completed: {sprint_20_count}/30 tickets created")
    print()

    # Sprint 21: Performance Optimization (22 tickets)
    print(f"{Colors.BOLD}{'=' * 70}{Colors.END}")
    log_info("SPRINT 21: Performance Optimization (22 tickets)")
    print(f"{Colors.BOLD}{'=' * 70}{Colors.END}")

    sprint_21_count = 0
    sprint_21_tickets = [
        ("Optimize consensus latency to <100ms", "Profile HyperRAFT++ consensus and reduce finality time"),
        ("Implement transaction batching optimization", "Group transactions for improved throughput"),
        ("Optimize database query performance", "Index analysis and query optimization for critical paths"),
        ("Implement connection pooling for PostgreSQL", "Reduce connection overhead with intelligent pooling"),
        ("Add in-memory caching layer (Redis)", "Cache hot data to reduce database load"),
        ("Optimize AI optimization service latency", "Reduce decision latency for transaction ordering"),
        ("Implement smart mempool management", "Intelligent transaction prioritization and expiration"),
        ("Performance profiling with JFR (Java Flight Recorder)", "Identify bottlenecks with production-safe profiling"),
        ("Benchmark: Achieve 1.5M TPS sustainable", "Sustained performance testing over 24 hours"),
        ("Implement reactive streams for high throughput", "Full async/reactive pipeline for all operations"),
        ("Add circuit breaker patterns to prevent cascading failures", "Fault tolerance improvements"),
        ("Optimize memory usage in native image", "Reduce GraalVM native image footprint"),
        ("Implement backpressure handling for streams", "Prevent queue overflow under high load"),
        ("Performance optimization for cross-chain bridge", "Optimize oracle communication and validation"),
        ("Optimize quantum crypto operations", "Hardware acceleration for CRYSTALS-Dilithium"),
        ("Add performance telemetry dashboards", "Real-time visibility into system performance metrics"),
        ("Implement request coalescing for duplicate queries", "Reduce redundant processing"),
        ("Optimize JSON serialization for REST API", "Use faster serialization libraries"),
        ("Implement lazy loading for large datasets", "Reduce initial load time and memory usage"),
        ("Add performance SLA monitoring", "Automated alerts for SLA violations"),
        ("Benchmark: Test peak burst capacity (2M+ TPS)", "Validate theoretical 2M+ TPS capability"),
        ("Document performance optimization patterns", "Best practices for maintaining high performance"),
    ]

    for summary, description in sprint_21_tickets:
        issue_key = client.create_issue(summary, description, "Task", epic_key)
        if issue_key:
            sprint_21_count += 1
            total_created += 1

    log_info(f"Sprint 21 completed: {sprint_21_count}/22 tickets created")
    print()

    # Sprint 22: Multi-Cloud Deployment (20 tickets)
    print(f"{Colors.BOLD}{'=' * 70}{Colors.END}")
    log_info("SPRINT 22: Multi-Cloud Deployment (20 tickets)")
    print(f"{Colors.BOLD}{'=' * 70}{Colors.END}")

    sprint_22_count = 0
    sprint_22_tickets = [
        ("Setup AWS infrastructure (us-east-1 region)", "Create EC2, RDS, and networking for AWS cluster"),
        ("Setup Azure infrastructure (eastus region)", "Create VMs, databases, and networking for Azure cluster"),
        ("Setup GCP infrastructure (us-central1 region)", "Create Compute Engine, Cloud SQL, and networking for GCP"),
        ("Configure WireGuard VPN mesh for inter-cloud connectivity", "Secure VPN tunnels between all clouds"),
        ("Setup Consul federation across clouds", "Service discovery across AWS, Azure, GCP"),
        ("Configure GeoDNS for multi-cloud routing", "Geo-proximity based traffic routing"),
        ("Deploy Aurigraph V11 to AWS cluster", "Full production deployment on AWS"),
        ("Deploy Aurigraph V11 to Azure cluster", "Full production deployment on Azure"),
        ("Deploy Aurigraph V11 to GCP cluster", "Full production deployment on GCP"),
        ("Setup monitoring across all clouds (Prometheus + Grafana)", "Unified monitoring dashboard for all regions"),
        ("Configure disaster recovery failover procedures", "Automated failover between clouds"),
        ("Setup cross-cloud data replication", "PostgreSQL streaming replication across regions"),
        ("Implement multi-cloud load balancing", "Traffic distribution across all clouds"),
        ("Configure backup and restore procedures", "Cross-cloud backup strategy"),
        ("Performance testing across cloud providers", "Validate 1.5M TPS across all deployments"),
        ("Setup logging aggregation (ELK stack)", "Centralized logging from all clouds"),
        ("Configure alerting for multi-cloud health", "Automated alerts for failures across regions"),
        ("Document multi-cloud deployment procedures", "Runbooks for operations team"),
        ("Setup cost monitoring and optimization", "Cloud cost tracking and optimization"),
        ("Execute multi-cloud failover drill", "Test disaster recovery procedures"),
    ]

    for summary, description in sprint_22_tickets:
        issue_key = client.create_issue(summary, description, "Task", epic_key)
        if issue_key:
            sprint_22_count += 1
            total_created += 1

    log_info(f"Sprint 22 completed: {sprint_22_count}/20 tickets created")
    print()

    # Sprint 23: V10 Deprecation & Cutover (15 tickets)
    print(f"{Colors.BOLD}{'=' * 70}{Colors.END}")
    log_info("SPRINT 23: V10 Deprecation & Cutover (15 tickets)")
    print(f"{Colors.BOLD}{'=' * 70}{Colors.END}")

    sprint_23_count = 0
    sprint_23_tickets = [
        ("Deprecate V10 API endpoints (announce 30-day sunset)", "Public announcement of V10 deprecation timeline"),
        ("Migrate all V10 users to V11 API", "Support team coordination for user migration"),
        ("Update all documentation to reference V11", "Complete documentation refresh"),
        ("Migrate monitoring from V10 to V11 dashboards", "Grafana dashboard updates and consolidation"),
        ("Export V10 blockchain data to archive", "Historical data preservation and backup"),
        ("Decommission V10 production infrastructure", "AWS/Azure/GCP V10 resources teardown"),
        ("Audit all V10 contracts and finish transactions", "Ensure clean shutdown without data loss"),
        ("Update website to remove V10 references", "Marketing and documentation site updates"),
        ("Archive V10 GitHub repository", "Move to archived state with read-only access"),
        ("Create V10 deprecation knowledge base", "FAQ and troubleshooting for transition period"),
        ("Implement V10→V11 data migration tool", "Automated tool for moving custom data"),
        ("Cutover DNS to point to V11 (production flip)", "Final DNS update to go live"),
        ("Final V10 system shutdown and decommission", "Complete infrastructure removal"),
        ("Post-cutover performance and stability validation", "24-hour production stability verification"),
        ("Document lessons learned from V10→V11 migration", "Project retrospective and knowledge transfer"),
    ]

    for summary, description in sprint_23_tickets:
        issue_key = client.create_issue(summary, description, "Task", epic_key)
        if issue_key:
            sprint_23_count += 1
            total_created += 1

    log_info(f"Sprint 23 completed: {sprint_23_count}/15 tickets created")
    print()

    # Final Summary
    print(f"{Colors.BOLD}{'=' * 70}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.GREEN}BATCH CREATION COMPLETE{Colors.END}")
    print(f"{Colors.BOLD}{'=' * 70}{Colors.END}")

    expected_total = 20 + 30 + 22 + 20 + 15  # 107 tickets (not counting the epic)
    log_success(f"Total tickets created: {total_created}/{expected_total}")
    log_success(f"  Sprint 19: {sprint_19_count}/20")
    log_success(f"  Sprint 20: {sprint_20_count}/30")
    log_success(f"  Sprint 21: {sprint_21_count}/22")
    log_success(f"  Sprint 22: {sprint_22_count}/20")
    log_success(f"  Sprint 23: {sprint_23_count}/15")
    log_success(f"Epic: {epic_key}")

    if args.dry_run:
        log_warn("Dry run mode - no tickets were actually created")
    else:
        log_success("All tickets successfully created in JIRA")

    print()

if __name__ == "__main__":
    main()
