#!/usr/bin/env python3
"""
Create JIRA Epic and Stories for gRPC-Web Migration
Uses JIRA REST API v3 with proper JSON encoding
"""

import requests
import json
import sys

# JIRA Configuration
JIRA_BASE_URL = "https://aurigraphdlt.atlassian.net"
JIRA_EMAIL = "subbu@aurigraph.io"
JIRA_API_TOKEN = "ATATT3xFfGF0sFjaXc9iiBQuv-1jvWEfLDA5APUBvJvhVSrtzDDfS4B9k3ut3gCAyHUNU0YImVJSjcjglkR_3dmHtvRUYiV32nQJqkQ_HwKqCbS6oNs99XdYu5j_SmQqMQX4a7WekwS-sYNbDFtNBTrRuemXmlVHrjWa6dhMdCBuk0vdQvd_OYA=F7D4339F"
PROJECT_KEY = "AV11"

def create_issue(issue_type, summary, description, story_points=None, epic_key=None):
    """Create a JIRA issue using REST API"""

    url = f"{JIRA_BASE_URL}/rest/api/3/issue"
    auth = (JIRA_EMAIL, JIRA_API_TOKEN)
    headers = {"Content-Type": "application/json"}

    # Build payload
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
                                "text": description
                            }
                        ]
                    }
                ]
            },
            "issuetype": {"name": issue_type}
        }
    }

    # Add story points if provided (customfield_10016 is standard for story points)
    if story_points:
        payload["fields"]["customfield_10016"] = story_points

    # Add epic link if provided (customfield_10014 is standard for epic link)
    if epic_key:
        payload["fields"]["customfield_10014"] = epic_key

    try:
        response = requests.post(url, auth=auth, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        issue_key = result.get("key")
        print(f"✅ Created: {issue_key} - {summary}")
        return issue_key
    except requests.exceptions.HTTPError as e:
        print(f"❌ Failed to create: {summary}")
        print(f"   Status: {e.response.status_code}")
        print(f"   Response: {e.response.text}")
        return None
    except Exception as e:
        print(f"❌ Error creating {summary}: {str(e)}")
        return None

def main():
    print("=" * 80)
    print("gRPC-Web Migration - JIRA Ticket Creation")
    print("=" * 80)
    print()

    # Step 1: Create Epic
    print("Step 1: Creating Epic AV11-500...")
    epic_description = """Replace WebSocket-based real-time communication with gRPC-Web + Protobuf + HTTP/2 to achieve 60-70% bandwidth reduction, type-safe communication, and better support for 2M+ TPS target.

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

Migration Timeline: Sprint 19-24 (12 weeks)
Total Story Points: 162 SP"""

    epic_key = create_issue("Epic", "gRPC-Web Migration for Real-Time Streaming", epic_description)

    if not epic_key:
        print("❌ Failed to create Epic. Exiting.")
        sys.exit(1)

    print()

    # Define all stories
    stories = [
        # Sprint 19
        ("Sprint 19", [
            ("AV11-501: Configure gRPC Build Tooling", 5,
             "As a backend developer, I want Maven to auto-generate Java gRPC code from .proto files so that I can implement gRPC services with type safety.\n\nTasks:\n- Add protobuf-maven-plugin to pom.xml\n- Configure protoc-gen-grpc-java\n- Add Quarkus gRPC extension\n- Test build on CI/CD\n\nAcceptance Criteria:\n- Maven build generates Java classes from .proto files\n- Generated code compiles without errors\n- CI/CD pipeline includes proto compilation step"),

            ("AV11-502: Configure NGINX gRPC-Web Proxy", 3,
             "As a DevOps engineer, I want NGINX to transcode gRPC-Web to gRPC so that browser clients can communicate with gRPC backend.\n\nTasks:\n- Update nginx.conf with grpc_pass directives\n- Configure SSL/TLS for gRPC\n- Add CORS headers for gRPC-Web\n- Test with grpc_cli\n\nAcceptance Criteria:\n- NGINX successfully proxies gRPC-Web requests\n- CORS headers allow browser access\n- SSL/TLS works with gRPC traffic"),

            ("AV11-503: Create Proto Files for Streaming Services", 8,
             "As a protocol designer, I want comprehensive .proto schemas for all streaming services.\n\nCompleted:\n- analytics-stream.proto (355 lines)\n- metrics-stream.proto (380 lines)\n\nTo Create:\n- consensus-stream.proto\n- channel-stream.proto  \n- validator-stream.proto\n- network-stream.proto\n\nAcceptance Criteria:\n- All 6 proto files created\n- Messages follow consistent naming\n- RPCs cover all WebSocket endpoints")
        ]),

        # Sprint 20
        ("Sprint 20", [
            ("AV11-504: Implement AnalyticsStreamService", 13,
             "As a backend developer, I want a gRPC service for streaming dashboard analytics.\n\nImplementation:\n- AnalyticsStreamServiceImpl.java\n- StreamDashboardAnalytics() RPC\n- StreamRealTimeData() RPC\n- InteractiveDashboard() RPC\n\nAcceptance Criteria:\n- Service implements all RPCs from analytics-stream.proto\n- Unit test coverage ≥95%\n- Performance: handles 1000 concurrent streams\n- Bandwidth: ≤0.8 KB/s per client"),

            ("AV11-505: Implement MetricsStreamService", 13,
             "As a backend developer, I want a gRPC service for streaming performance metrics.\n\nImplementation:\n- MetricsStreamServiceImpl.java\n- StreamMetrics() RPC\n- StreamAggregatedMetrics() RPC\n- InteractiveMetrics() RPC\n\nAcceptance Criteria:\n- Service implements all RPCs from metrics-stream.proto\n- Unit test coverage ≥95%\n- Performance: handles 2000 concurrent streams\n- Real-time TPS updates with <100ms latency")
        ]),

        # Sprint 21
        ("Sprint 21", [
            ("AV11-506: Implement ConsensusStreamService", 13,
             "As a backend developer, I want a gRPC service for streaming consensus state.\n\nImplementation:\n- ConsensusStreamServiceImpl.java\n- Stream leader election events\n- Stream voting results\n- Stream term changes\n\nAcceptance Criteria:\n- Service streams HyperRAFT++ consensus events\n- Unit test coverage ≥95%\n- Performance: handles 500 concurrent streams\n- Events delivered with <50ms latency"),

            ("AV11-507: Implement TransactionStreamService", 13,
             "As a backend developer, I want a gRPC service for streaming transaction events.\n\nImplementation:\n- TransactionStreamServiceImpl.java\n- Stream transaction lifecycle events\n- Support filtering by hash/sender/receiver\n- Handle 3000+ concurrent streams\n\nAcceptance Criteria:\n- Streams submitted/pending/confirmed/failed events\n- Filtering works correctly\n- Performance: handles 3000 concurrent streams\n- No missed transaction events"),

            ("AV11-508: Implement gRPC Interceptors", 8,
             "As a backend developer, I want gRPC interceptors for cross-cutting concerns.\n\nImplementation:\n- GrpcAuthInterceptor (JWT validation)\n- GrpcLoggingInterceptor (request/response logging)\n- GrpcMetricsInterceptor (Prometheus metrics)\n- GrpcErrorHandlerInterceptor (error mapping)\n\nAcceptance Criteria:\n- All interceptors registered globally\n- JWT auth works for protected streams\n- Metrics exported to Prometheus\n- Errors mapped to gRPC status codes")
        ]),

        # Sprint 22
        ("Sprint 22", [
            ("AV11-509: Generate TypeScript gRPC-Web Clients", 5,
             "As a frontend developer, I want auto-generated TypeScript clients for gRPC services.\n\nImplementation:\n- npm script to generate TypeScript from .proto\n- Output to src/generated/\n- Type definitions for IDE\n\nAcceptance Criteria:\n- TypeScript code generated successfully\n- Types work in IDE autocomplete\n- No compilation errors\n- Generated code committed to repo"),

            ("AV11-510: Create React gRPC-Web Hooks", 13,
             "As a frontend developer, I want React hooks that wrap gRPC-Web clients.\n\nImplementation:\n- useAnalyticsStream()\n- useMetricsStream()\n- useConsensusStream()\n- useTransactionStream()\n\nAcceptance Criteria:\n- Hooks manage connection lifecycle\n- Auto-reconnect on disconnect\n- Error handling with retry logic\n- Loading states exposed\n- Clean up on unmount"),

            ("AV11-511: Migrate Dashboard Components to gRPC", 13,
             "As a frontend developer, I want all dashboard components to use gRPC-Web instead of WebSocket.\n\nComponents to Update:\n- Dashboard.tsx\n- PerformanceMetrics.tsx\n- ConsensusMonitoring.tsx\n- Transactions.tsx\n- NetworkTopology.tsx\n- SystemHealth.tsx\n\nAcceptance Criteria:\n- All components use gRPC hooks\n- Real-time updates work correctly\n- No WebSocket references remain\n- UI performance unchanged or better")
        ]),

        # Sprint 23
        ("Sprint 23", [
            ("AV11-512: Implement Feature Flag System", 5,
             "As a DevOps engineer, I want a feature flag to toggle between WebSocket and gRPC.\n\nImplementation:\n- Backend flag: grpc.streaming.enabled\n- Frontend flag: REACT_APP_USE_GRPC\n- Admin UI to toggle flags\n\nAcceptance Criteria:\n- Flags toggle between WebSocket/gRPC\n- Changes take effect without restart\n- Admin UI shows current state\n- Default: WebSocket (safe fallback)"),

            ("AV11-513: Implement A/B Testing Framework", 8,
             "As a product manager, I want A/B testing between WebSocket and gRPC.\n\nImplementation:\n- Random assignment by client ID\n- 50% WebSocket, 50% gRPC\n- Track metrics separately per cohort\n\nAcceptance Criteria:\n- Users randomly assigned to cohorts\n- Assignment persists across sessions\n- Metrics tracked separately\n- Statistical analysis ready"),

            ("AV11-514: Create Metrics Comparison Dashboard", 5,
             "As a platform engineer, I want a dashboard comparing WebSocket vs gRPC performance.\n\nImplementation:\n- Grafana dashboard\n- Side-by-side comparison\n- Metrics: latency, bandwidth, error rate, CPU\n- Real-time updates\n\nAcceptance Criteria:\n- Dashboard shows both protocols\n- Metrics update in real-time\n- Percentile calculations correct\n- Exportable to PDF"),

            ("AV11-515: Perform User Acceptance Testing", 8,
             "As a product manager, I want 10 beta users to test gRPC streaming.\n\nTasks:\n- Select 10 beta users\n- Enable gRPC for beta cohort\n- Monitor for 1 week\n- Collect feedback via survey\n\nAcceptance Criteria:\n- 10 users complete testing\n- Survey response rate ≥80%\n- Average rating ≥4.5/5\n- No critical bugs reported")
        ]),

        # Sprint 24
        ("Sprint 24", [
            ("AV11-516: Enable gRPC for 100% of Users", 3,
             "As a DevOps engineer, I want to enable gRPC for all users.\n\nTasks:\n- Set grpc.streaming.enabled=true in production\n- Update WebSocket endpoints to return 410 Gone\n- Monitor error rates for 24 hours\n\nAcceptance Criteria:\n- All users use gRPC\n- Error rate ≤0.5%\n- No rollback needed\n- Performance meets targets"),

            ("AV11-517: Remove WebSocket Server Code", 13,
             "As a backend developer, I want to remove WebSocket server code from the codebase.\n\nTasks:\n- Delete 52 WebSocket Java files\n- Remove WebSocket dependencies from pom.xml\n- Update documentation\n- Verify build succeeds\n\nAcceptance Criteria:\n- All WebSocket code removed\n- Build succeeds with zero errors\n- No WebSocket dependencies remain\n- Code coverage maintained"),

            ("AV11-518: Remove WebSocket Client Code", 8,
             "As a frontend developer, I want to remove WebSocket client code from the codebase.\n\nTasks:\n- Delete 20 WebSocket TypeScript files\n- Remove WebSocket dependencies from package.json\n- Update documentation\n- Verify bundle size reduced\n\nAcceptance Criteria:\n- All WebSocket code removed\n- Bundle size reduced by ≥100KB\n- No WebSocket dependencies remain\n- All tests pass"),

            ("AV11-519: Create Final Performance Report", 5,
             "As a platform engineer, I want a final report comparing WebSocket vs gRPC performance.\n\nReport Sections:\n- Before/after metrics comparison\n- Bandwidth savings calculation\n- Cost savings estimation\n- Lessons learned\n- Recommendations\n\nAcceptance Criteria:\n- Report includes all metrics\n- Cost savings calculated\n- Lessons documented\n- Shared with stakeholders")
        ])
    ]

    # Create all stories
    for sprint_name, sprint_stories in stories:
        print(f"\nStep: Creating {sprint_name} Stories...")
        for summary, points, description in sprint_stories:
            create_issue("Story", summary, description, story_points=points, epic_key=epic_key)
        print()

    print("=" * 80)
    print("✅ JIRA Ticket Creation Complete!")
    print("=" * 80)
    print()
    print(f"Epic: {epic_key}")
    print(f"Stories Created: 19")
    print(f"Total Story Points: 162 SP")
    print(f"Timeline: Sprint 19-24 (12 weeks)")
    print()
    print(f"View Epic: {JIRA_BASE_URL}/browse/{epic_key}")
    print()

if __name__ == "__main__":
    main()
