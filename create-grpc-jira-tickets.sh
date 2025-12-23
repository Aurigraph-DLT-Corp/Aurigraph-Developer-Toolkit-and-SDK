#!/bin/bash

# Script to create JIRA Epic and Stories for gRPC Migration
# Based on GRPC_MIGRATION_PLAN.md

set -e

# JIRA Configuration
JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"
JIRA_EMAIL="subbu@aurigraph.io"
JIRA_API_TOKEN="ATATT3xFfGF0sFjaXc9iiBQuv-1jvWEfLDA5APUBvJvhVSrtzDDfS4B9k3ut3gCAyHUNU0YImVJSjcjglkR_3dmHtvRUYiV32nQJqkQ_HwKqCbS6oNs99XdYu5j_SmQqMQX4a7WekwS-sYNbDFtNBTrRuemXmlVHrjWa6dhMdCBuk0vdQvd_OYA=F7D4339F"
PROJECT_KEY="AV11"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}===========================================================${NC}"
echo -e "${BLUE}  gRPC-Web Migration - JIRA Ticket Creation${NC}"
echo -e "${BLUE}===========================================================${NC}"
echo ""

# Function to create JIRA issue
create_jira_issue() {
    local issue_type="$1"
    local summary="$2"
    local description="$3"
    local story_points="$4"
    local epic_link="$5"
    local sprint="$6"

    local json_payload=$(cat <<EOF
{
  "fields": {
    "project": {
      "key": "${PROJECT_KEY}"
    },
    "summary": "${summary}",
    "description": {
      "type": "doc",
      "version": 1,
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "${description}"
            }
          ]
        }
      ]
    },
    "issuetype": {
      "name": "${issue_type}"
    }
    $(if [ -n "$story_points" ]; then echo ",\"customfield_10016\": ${story_points}"; fi)
    $(if [ -n "$epic_link" ]; then echo ",\"customfield_10014\": \"${epic_link}\""; fi)
  }
}
EOF
)

    response=$(curl -s -X POST \
        -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "${json_payload}" \
        "${JIRA_BASE_URL}/rest/api/3/issue")

    issue_key=$(echo "${response}" | grep -o '"key":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ -n "$issue_key" ]; then
        echo -e "${GREEN}✓ Created: ${issue_key} - ${summary}${NC}"
        echo "$issue_key"
    else
        echo -e "${RED}✗ Failed to create: ${summary}${NC}"
        echo "Response: ${response}"
        echo ""
    fi
}

# Step 1: Create Epic
echo -e "${BLUE}Step 1: Creating Epic AV11-500...${NC}"
EPIC_DESCRIPTION="Replace WebSocket-based real-time communication with gRPC-Web + Protobuf + HTTP/2 to achieve 60-70% bandwidth reduction, type-safe communication, and better support for 2M+ TPS target.

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
Total Story Points: 162 SP"

EPIC_KEY=$(create_jira_issue "Epic" "gRPC-Web Migration for Real-Time Streaming" "${EPIC_DESCRIPTION}" "" "" "")
echo ""

if [ -z "$EPIC_KEY" ]; then
    echo -e "${RED}Failed to create Epic. Exiting.${NC}"
    exit 1
fi

# Sprint 19 Stories
echo -e "${BLUE}Step 2: Creating Sprint 19 Stories (Foundation)...${NC}"

create_jira_issue "Story" \
    "AV11-501: Configure gRPC Build Tooling" \
    "As a backend developer, I want Maven to auto-generate Java gRPC code from .proto files so that I can implement gRPC services with type safety. Tasks: Add protobuf-maven-plugin, configure protoc-gen-grpc-java, add Quarkus gRPC extension, test build on CI/CD." \
    "5" \
    "$EPIC_KEY" \
    "Sprint 19"

create_jira_issue "Story" \
    "AV11-502: Configure NGINX gRPC-Web Proxy" \
    "As a DevOps engineer, I want NGINX to transcode gRPC-Web to gRPC so that browser clients can communicate with gRPC backend. Tasks: Update nginx.conf with grpc_pass directives, configure SSL/TLS, add CORS headers, test with grpc_cli." \
    "3" \
    "$EPIC_KEY" \
    "Sprint 19"

create_jira_issue "Story" \
    "AV11-503: Create Proto Files for Streaming Services" \
    "As a protocol designer, I want comprehensive .proto schemas for all streaming services. Already completed: analytics-stream.proto, metrics-stream.proto. To create: consensus-stream.proto, channel-stream.proto, validator-stream.proto, network-stream.proto." \
    "8" \
    "$EPIC_KEY" \
    "Sprint 19"

echo ""

# Sprint 20 Stories
echo -e "${BLUE}Step 3: Creating Sprint 20 Stories (Core Services Part 1)...${NC}"

create_jira_issue "Story" \
    "AV11-504: Implement AnalyticsStreamService" \
    "As a backend developer, I want a gRPC service for streaming dashboard analytics. Acceptance: AnalyticsStreamServiceImpl.java implements StreamDashboardAnalytics(), StreamRealTimeData(), InteractiveDashboard(). Unit test coverage ≥95%. Performance: handles 1000 concurrent streams." \
    "13" \
    "$EPIC_KEY" \
    "Sprint 20"

create_jira_issue "Story" \
    "AV11-505: Implement MetricsStreamService" \
    "As a backend developer, I want a gRPC service for streaming performance metrics. Acceptance: MetricsStreamServiceImpl.java implements StreamMetrics(), StreamAggregatedMetrics(), InteractiveMetrics(). Unit test coverage ≥95%. Performance: handles 2000 concurrent streams." \
    "13" \
    "$EPIC_KEY" \
    "Sprint 20"

echo ""

# Sprint 21 Stories
echo -e "${BLUE}Step 4: Creating Sprint 21 Stories (Core Services Part 2)...${NC}"

create_jira_issue "Story" \
    "AV11-506: Implement ConsensusStreamService" \
    "As a backend developer, I want a gRPC service for streaming consensus state. Streams leader election events, voting results, term changes. Unit test coverage ≥95%. Performance: handles 500 concurrent streams." \
    "13" \
    "$EPIC_KEY" \
    "Sprint 21"

create_jira_issue "Story" \
    "AV11-507: Implement TransactionStreamService" \
    "As a backend developer, I want a gRPC service for streaming transaction events. Streams transaction submitted/pending/confirmed/failed events. Supports filtering by hash, sender, receiver. Performance: handles 3000 concurrent streams." \
    "13" \
    "$EPIC_KEY" \
    "Sprint 21"

create_jira_issue "Story" \
    "AV11-508: Implement gRPC Interceptors" \
    "As a backend developer, I want gRPC interceptors for cross-cutting concerns. Create GrpcAuthInterceptor (JWT), GrpcLoggingInterceptor, GrpcMetricsInterceptor (Prometheus), GrpcErrorHandlerInterceptor. Register globally in Quarkus." \
    "8" \
    "$EPIC_KEY" \
    "Sprint 21"

echo ""

# Sprint 22 Stories
echo -e "${BLUE}Step 5: Creating Sprint 22 Stories (Frontend Migration)...${NC}"

create_jira_issue "Story" \
    "AV11-509: Generate TypeScript gRPC-Web Clients" \
    "As a frontend developer, I want auto-generated TypeScript clients for gRPC services. Create npm script to generate TypeScript code from .proto files in src/generated/. Verify types in IDE autocomplete." \
    "5" \
    "$EPIC_KEY" \
    "Sprint 22"

create_jira_issue "Story" \
    "AV11-510: Create React gRPC-Web Hooks" \
    "As a frontend developer, I want React hooks that wrap gRPC-Web clients. Create useAnalyticsStream(), useMetricsStream(), useConsensusStream(), useTransactionStream(). Hooks handle connection lifecycle and errors gracefully." \
    "13" \
    "$EPIC_KEY" \
    "Sprint 22"

create_jira_issue "Story" \
    "AV11-511: Migrate Dashboard Components to gRPC" \
    "As a frontend developer, I want all dashboard components to use gRPC-Web instead of WebSocket. Update Dashboard.tsx, PerformanceMetrics.tsx, ConsensusMonitoring.tsx, Transactions.tsx, NetworkTopology.tsx, SystemHealth.tsx." \
    "13" \
    "$EPIC_KEY" \
    "Sprint 22"

echo ""

# Sprint 23 Stories
echo -e "${BLUE}Step 6: Creating Sprint 23 Stories (Parallel Running & Validation)...${NC}"

create_jira_issue "Story" \
    "AV11-512: Implement Feature Flag System" \
    "As a DevOps engineer, I want a feature flag to toggle between WebSocket and gRPC. Backend flag: grpc.streaming.enabled. Frontend flag: REACT_APP_USE_GRPC. Admin UI to toggle flags." \
    "5" \
    "$EPIC_KEY" \
    "Sprint 23"

create_jira_issue "Story" \
    "AV11-513: Implement A/B Testing Framework" \
    "As a product manager, I want A/B testing between WebSocket and gRPC. 50% users get WebSocket, 50% get gRPC (randomly assigned by client ID). Metrics tracked separately for cohorts." \
    "8" \
    "$EPIC_KEY" \
    "Sprint 23"

create_jira_issue "Story" \
    "AV11-514: Create Metrics Comparison Dashboard" \
    "As a platform engineer, I want a dashboard comparing WebSocket vs gRPC performance. Grafana dashboard with side-by-side comparison. Metrics: latency, bandwidth, error rate, CPU usage. Real-time updates." \
    "5" \
    "$EPIC_KEY" \
    "Sprint 23"

create_jira_issue "Story" \
    "AV11-515: Perform User Acceptance Testing" \
    "As a product manager, I want 10 beta users to test gRPC streaming. Beta users use gRPC for 1 week. Feedback collected via survey (≥4.5/5 rating). No critical bugs reported." \
    "8" \
    "$EPIC_KEY" \
    "Sprint 23"

echo ""

# Sprint 24 Stories
echo -e "${BLUE}Step 7: Creating Sprint 24 Stories (Full Migration & Cleanup)...${NC}"

create_jira_issue "Story" \
    "AV11-516: Enable gRPC for 100% of Users" \
    "As a DevOps engineer, I want to enable gRPC for all users. Set grpc.streaming.enabled=true in production. Update WebSocket endpoints to return 410 Gone. Monitor error rates for 24 hours." \
    "3" \
    "$EPIC_KEY" \
    "Sprint 24"

create_jira_issue "Story" \
    "AV11-517: Remove WebSocket Server Code" \
    "As a backend developer, I want to remove WebSocket server code from the codebase. Delete 52 WebSocket Java files, remove WebSocket dependencies from pom.xml. Build succeeds with zero errors." \
    "13" \
    "$EPIC_KEY" \
    "Sprint 24"

create_jira_issue "Story" \
    "AV11-518: Remove WebSocket Client Code" \
    "As a frontend developer, I want to remove WebSocket client code from the codebase. Delete 20 WebSocket TypeScript files, remove WebSocket dependencies from package.json. Bundle size reduced by ≥100KB." \
    "8" \
    "$EPIC_KEY" \
    "Sprint 24"

create_jira_issue "Story" \
    "AV11-519: Create Final Performance Report" \
    "As a platform engineer, I want a final report comparing WebSocket vs gRPC performance. Report includes before/after metrics, bandwidth savings calculation, cost savings estimation, lessons learned." \
    "5" \
    "$EPIC_KEY" \
    "Sprint 24"

echo ""
echo -e "${GREEN}===========================================================${NC}"
echo -e "${GREEN}  ✓ JIRA Ticket Creation Complete!${NC}"
echo -e "${GREEN}===========================================================${NC}"
echo ""
echo -e "Epic: ${GREEN}${EPIC_KEY}${NC}"
echo -e "Stories Created: ${GREEN}19${NC}"
echo -e "Total Story Points: ${GREEN}162 SP${NC}"
echo -e "Timeline: ${GREEN}Sprint 19-24 (12 weeks)${NC}"
echo ""
echo -e "View Epic: ${BLUE}${JIRA_BASE_URL}/browse/${EPIC_KEY}${NC}"
echo ""
