#!/usr/bin/env python3
"""
Create JIRA Stories for gRPC-Web Migration (simplified - no custom fields)
Stories will be created and manually linked to Epic AV11-520
"""

import requests
import json

# JIRA Configuration
JIRA_BASE_URL = "https://aurigraphdlt.atlassian.net"
JIRA_EMAIL = "subbu@aurigraph.io"
JIRA_API_TOKEN = "ATATT3xFfGF0sFjaXc9iiBQuv-1jvWEfLDA5APUBvJvhVSrtzDDfS4B9k3ut3gCAyHUNU0YImVJSjcjglkR_3dmHtvRUYiV32nQJqkQ_HwKqCbS6oNs99XdYu5j_SmQqMQX4a7WekwS-sYNbDFtNBTrRuemXmlVHrjWa6dhMdCBuk0vdQvd_OYA=F7D4339F"
PROJECT_KEY = "AV11"
EPIC_KEY = "AV11-520"

def create_story(summary, description):
    """Create a JIRA story (simplified)"""
    url = f"{JIRA_BASE_URL}/rest/api/3/issue"
    auth = (JIRA_EMAIL, JIRA_API_TOKEN)
    headers = {"Content-Type": "application/json"}

    # Add story points and epic link in description
    full_description = f"Epic: {EPIC_KEY}\n\n{description}"

    payload = {
        "fields": {
            "project": {"key": PROJECT_KEY},
            "summary": summary,
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": full_description
                            }
                        ]
                    }
                ]
            },
            "issuetype": {"name": "Story"}
        }
    }

    try:
        response = requests.post(url, auth=auth, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        issue_key = result.get("key")
        print(f"✅ {issue_key}: {summary}")
        return issue_key
    except Exception as e:
        print(f"❌ Failed: {summary[:50]}... - {str(e)[:100]}")
        return None

# All 19 stories
stories = [
    ("AV11-501: Configure gRPC Build Tooling (5 SP)",
     "Add protobuf-maven-plugin, configure protoc-gen-grpc-java, add Quarkus gRPC extension, test build on CI/CD"),

    ("AV11-502: Configure NGINX gRPC-Web Proxy (3 SP)",
     "Update nginx.conf with grpc_pass directives, configure SSL/TLS, add CORS headers, test with grpc_cli"),

    ("AV11-503: Create Proto Files for Streaming Services (8 SP)",
     "Create consensus-stream.proto, channel-stream.proto, validator-stream.proto, network-stream.proto (analytics-stream.proto and metrics-stream.proto already completed)"),

    ("AV11-504: Implement AnalyticsStreamService (13 SP)",
     "AnalyticsStreamServiceImpl.java with StreamDashboardAnalytics(), StreamRealTimeData(), InteractiveDashboard(). Target: 1000 concurrent streams, ≥95% test coverage"),

    ("AV11-505: Implement MetricsStreamService (13 SP)",
     "MetricsStreamServiceImpl.java with StreamMetrics(), StreamAggregatedMetrics(), InteractiveMetrics(). Target: 2000 concurrent streams, <100ms latency"),

    ("AV11-506: Implement ConsensusStreamService (13 SP)",
     "ConsensusStreamServiceImpl.java streaming leader election, voting results, term changes. Target: 500 concurrent streams, <50ms latency"),

    ("AV11-507: Implement TransactionStreamService (13 SP)",
     "TransactionStreamServiceImpl.java streaming transaction lifecycle with filtering. Target: 3000 concurrent streams, zero missed events"),

    ("AV11-508: Implement gRPC Interceptors (8 SP)",
     "GrpcAuthInterceptor (JWT), GrpcLoggingInterceptor, GrpcMetricsInterceptor (Prometheus), GrpcErrorHandlerInterceptor"),

    ("AV11-509: Generate TypeScript gRPC-Web Clients (5 SP)",
     "npm script to generate TypeScript from .proto files, output to src/generated/, verify IDE autocomplete works"),

    ("AV11-510: Create React gRPC-Web Hooks (13 SP)",
     "useAnalyticsStream(), useMetricsStream(), useConsensusStream(), useTransactionStream() with connection lifecycle management"),

    ("AV11-511: Migrate Dashboard Components to gRPC (13 SP)",
     "Update Dashboard.tsx, PerformanceMetrics.tsx, ConsensusMonitoring.tsx, Transactions.tsx, NetworkTopology.tsx, SystemHealth.tsx to use gRPC hooks"),

    ("AV11-512: Implement Feature Flag System (5 SP)",
     "Backend flag: grpc.streaming.enabled, Frontend flag: REACT_APP_USE_GRPC, Admin UI to toggle"),

    ("AV11-513: Implement A/B Testing Framework (8 SP)",
     "Random assignment by client ID, 50% WebSocket / 50% gRPC, track metrics separately per cohort"),

    ("AV11-514: Create Metrics Comparison Dashboard (5 SP)",
     "Grafana dashboard with side-by-side WebSocket vs gRPC comparison (latency, bandwidth, error rate, CPU)"),

    ("AV11-515: Perform User Acceptance Testing (8 SP)",
     "10 beta users test gRPC for 1 week, collect feedback via survey, target ≥4.5/5 rating"),

    ("AV11-516: Enable gRPC for 100% of Users (3 SP)",
     "Set grpc.streaming.enabled=true, WebSocket endpoints return 410 Gone, monitor for 24 hours"),

    ("AV11-517: Remove WebSocket Server Code (13 SP)",
     "Delete 52 WebSocket Java files, remove dependencies from pom.xml, verify build succeeds"),

    ("AV11-518: Remove WebSocket Client Code (8 SP)",
     "Delete 20 WebSocket TypeScript files, remove dependencies from package.json, bundle size reduced by ≥100KB"),

    ("AV11-519: Create Final Performance Report (5 SP)",
     "Before/after metrics, bandwidth savings, cost savings estimation, lessons learned, recommendations")
]

print("=" * 80)
print(f"Creating 19 Stories for Epic {EPIC_KEY}")
print("=" * 80)
print()

for summary, description in stories:
    create_story(summary, description)

print()
print("=" * 80)
print("✅ Story Creation Complete!")
print("=" * 80)
print(f"\nNext Step: Manually link stories to Epic {EPIC_KEY} in JIRA")
print(f"Epic URL: {JIRA_BASE_URL}/browse/{EPIC_KEY}")
