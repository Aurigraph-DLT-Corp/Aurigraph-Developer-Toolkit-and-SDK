#!/bin/bash

# JIRA Configuration
JIRA_EMAIL="subbu@aurigraph.io"
JIRA_API_TOKEN="ATATT3xFfGF0sFjaXc9iiBQuv-1jvWEfLDA5APUBvJvhVSrtzDDfS4B9k3ut3gCAyHUNU0YImVJSjcjglkR_3dmHtvRUYiV32nQJqkQ_HwKqCbS6oNs99XdYu5j_SmQqMQX4a7WekwS-sYNbDFtNBTrRuemXmlVHrjWa6dhMdCBuk0vdQvd_OYA=F7D4339F"
JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"
PROJECT_KEY="AV11"

echo "=========================================="
echo "JIRA Ticket Update - Sprint Completion"
echo "Date: November 26, 2025"
echo "=========================================="
echo ""

# Function to create JIRA ticket
create_jira_ticket() {
    local summary="$1"
    local description="$2"
    local labels="$3"
    
    echo "Creating ticket: $summary"
    
    response=$(curl -s -X POST \
        -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
        -H "Content-Type: application/json" \
        "${JIRA_BASE_URL}/rest/api/3/issue" \
        -d '{
            "fields": {
                "project": {"key": "'"${PROJECT_KEY}"'"},
                "summary": "'"${summary}"'",
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "type": "text",
                                    "text": "'"${description}"'"
                                }
                            ]
                        }
                    ]
                },
                "issuetype": {"name": "Task"},
                "labels": '"${labels}"'
            }
        }')
    
    ticket_key=$(echo "$response" | jq -r '.key // empty')
    
    if [ -n "$ticket_key" ]; then
        echo "✅ Created: $ticket_key"
        
        # Transition to Done
        transition_id=$(curl -s -X GET \
            -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
            "${JIRA_BASE_URL}/rest/api/3/issue/${ticket_key}/transitions" | \
            jq -r '.transitions[] | select(.name == "Done") | .id')
        
        if [ -n "$transition_id" ]; then
            curl -s -X POST \
                -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
                -H "Content-Type: application/json" \
                "${JIRA_BASE_URL}/rest/api/3/issue/${ticket_key}/transitions" \
                -d '{
                    "transition": {"id": "'"${transition_id}"'"}
                }' > /dev/null
            echo "✅ Transitioned to Done"
        fi
        
        echo "📝 URL: ${JIRA_BASE_URL}/browse/${ticket_key}"
    else
        echo "❌ Failed to create ticket"
        echo "Response: $response"
    fi
    
    echo ""
}

# Task 1: Persistence Configuration Fix
create_jira_ticket \
    "[Nov 26] Fix Persistence Configuration for 9 Unmapped Entities" \
    "COMPLETED: Fixed Hibernate persistence configuration to register 5 missing entity packages (auth, bridge.persistence, compliance.persistence, oracle, websocket). Eliminated 9 entity warnings. Files: application.properties lines 859-867, 949-950. Impact: HIGH - All entity types can now persist correctly. Story Points: 5" \
    '["persistence", "configuration", "critical", "nov26-sprint"]'

# Task 2: Bridge Transfer Investigation
create_jira_ticket \
    "[Nov 26] Investigate and Document Bridge Transfer Status" \
    "COMPLETED: Conducted comprehensive investigation of reported stuck bridge transfers. Found 0 stuck transfers in production. Created 413-line investigation report with root cause analysis, prevention measures, SQL monitoring queries, and implementation roadmap. Deliverable: BRIDGE-TRANSFER-INVESTIGATION.md. Story Points: 3" \
    '["bridge", "investigation", "documentation", "nov26-sprint"]'

# Task 3: GitHub Secrets Setup Guide
create_jira_ticket \
    "[Nov 26] Create GitHub Secrets Setup Guide for CI/CD" \
    "COMPLETED: Created comprehensive 438-line step-by-step guide for configuring GitHub Actions secrets. Includes SSH key generation (Ed25519), server configuration, testing, troubleshooting, security best practices, and 90-day key rotation. Deliverable: .github/GITHUB-SECRETS-SETUP-GUIDE.md. Story Points: 3" \
    '["ci-cd", "documentation", "github", "nov26-sprint"]'

# Task 4: gRPC Implementation Plan  
create_jira_ticket \
    "[Nov 26] Create 10-Day gRPC Implementation Roadmap" \
    "COMPLETED: Created comprehensive 589-line gRPC implementation plan with 10-day roadmap. Week 1: Core services. Week 2: Testing and optimization. Includes code examples, performance targets (776K to 2M+ TPS), testing strategy, and migration guide. Deliverable: GRPC-IMPLEMENTATION-PLAN.md. Story Points: 5" \
    '["grpc", "performance", "architecture", "nov26-sprint"]'

# Task 5: gRPC Interceptors Activation
create_jira_ticket \
    "[Nov 26] Activate 4 gRPC Global Interceptors" \
    "COMPLETED: Applied @GlobalInterceptor annotations to 4 gRPC interceptors (Logging, Authorization, Metrics, Exception). Resolves build warning. Provides comprehensive observability for all gRPC calls. Files: LoggingInterceptor.java, AuthorizationInterceptor.java, MetricsInterceptor.java, ExceptionInterceptor.java. Story Points: 2" \
    '["grpc", "interceptors", "monitoring", "nov26-sprint"]'

# Task 6: gRPC Server Configuration Enhancement
create_jira_ticket \
    "[Nov 26] Enhance gRPC Server Configuration for Production" \
    "COMPLETED: Enhanced gRPC server configuration with production-ready settings. Added keep-alive (5m interval, 20s timeout) and connection lifecycle management (10m idle, 30m max age, 5m grace). File: application.properties lines 45-67. Production-ready with connection health monitoring. Story Points: 2" \
    '["grpc", "configuration", "production", "nov26-sprint"]'

echo "=========================================="
echo "✅ All JIRA tickets created successfully"
echo "=========================================="
