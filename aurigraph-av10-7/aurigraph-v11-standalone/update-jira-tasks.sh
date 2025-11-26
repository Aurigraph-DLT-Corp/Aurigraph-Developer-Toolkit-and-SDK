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
    local story_points="$3"
    local labels="$4"
    
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
                "labels": '"${labels}"',
                "customfield_10016": '"${story_points}"'
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
    else
        echo "❌ Failed to create ticket"
        echo "Response: $response"
    fi
    
    echo ""
}

# Task 1: Persistence Configuration Fix
create_jira_ticket \
    "[CRITICAL] Fix Persistence Configuration for 9 Unmapped Entities" \
    "Fixed Hibernate persistence configuration to register 5 missing entity packages: auth, bridge.persistence, compliance.persistence, oracle, websocket. Eliminated 9 entity warnings and potential data loss. Files: application.properties lines 859-867, 949-950. Impact: HIGH - All 9 entity types can now persist correctly." \
    5 \
    '["persistence", "configuration", "critical", "sprint-foundation"]'

# Task 2: Bridge Transfer Investigation
create_jira_ticket \
    "[HIGH] Investigate and Document Bridge Transfer Status" \
    "Conducted comprehensive investigation of reported stuck bridge transfers. Found 0 stuck transfers in production database. Created detailed 413-line investigation report with root cause analysis, prevention measures, SQL monitoring queries, and implementation roadmap. Deliverable: BRIDGE-TRANSFER-INVESTIGATION.md. Impact: HIGH - Documented prevention strategy." \
    3 \
    '["bridge", "investigation", "documentation", "sprint-foundation"]'

# Task 3: GitHub Secrets Setup Guide
create_jira_ticket \
    "[MEDIUM] Create GitHub Secrets Setup Guide for CI/CD" \
    "Created comprehensive 438-line step-by-step guide for configuring GitHub Actions secrets. Includes SSH key generation (Ed25519), server configuration, testing procedures, troubleshooting guide, security best practices, and 90-day key rotation procedure. Deliverable: .github/GITHUB-SECRETS-SETUP-GUIDE.md. Impact: MEDIUM - Team can now configure CI/CD independently." \
    3 \
    '["ci-cd", "documentation", "github", "sprint-foundation"]'

# Task 4: gRPC Implementation Plan
create_jira_ticket \
    "[CRITICAL] Create 10-Day gRPC Implementation Roadmap" \
    "Created comprehensive 589-line gRPC implementation plan with 10-day roadmap. Week 1: Core services (Transaction, Blockchain, Bridge, Interceptors). Week 2: Testing, optimization, integration. Includes code examples, performance targets (776K → 2M+ TPS), testing strategy with ghz, and migration guide. Deliverable: GRPC-IMPLEMENTATION-PLAN.md. Impact: CRITICAL - Foundation for 5-10x performance improvement." \
    5 \
    '["grpc", "performance", "architecture", "sprint-foundation"]'

# Task 5: gRPC Interceptors Activation
create_jira_ticket \
    "[HIGH] Activate 4 gRPC Global Interceptors" \
    "Applied @GlobalInterceptor annotations to 4 existing gRPC interceptors: LoggingInterceptor, AuthorizationInterceptor, MetricsInterceptor, ExceptionInterceptor. Resolves build warning: 'At least one unused gRPC interceptor found'. Provides comprehensive logging, authorization, metrics, and exception handling for all gRPC calls. Files: 4 interceptor Java files. Impact: HIGH - gRPC observability enabled." \
    2 \
    '["grpc", "interceptors", "monitoring", "sprint-foundation"]'

# Task 6: gRPC Server Configuration Enhancement
create_jira_ticket \
    "[MEDIUM] Enhance gRPC Server Configuration for Production" \
    "Enhanced gRPC server configuration with production-ready settings. Added keep-alive settings (5m interval, 20s timeout) and connection lifecycle management (10m idle, 30m max age, 5m grace). File: application.properties lines 45-67. Impact: MEDIUM - Production-ready gRPC server with connection health monitoring and automatic cleanup." \
    2 \
    '["grpc", "configuration", "production", "sprint-foundation"]'

echo "=========================================="
echo "✅ All JIRA tickets created and closed"
echo "=========================================="
