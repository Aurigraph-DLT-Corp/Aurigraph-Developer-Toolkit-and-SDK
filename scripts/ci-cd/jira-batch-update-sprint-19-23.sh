#!/bin/bash
# JIRA Batch Update Script - Sprint 19-23
# Purpose: Create/update 110 JIRA tickets across 5 sprints
# Credentials: From /Users/subbujois/Documents/GitHub/Aurigraph-DLT/doc/Credentials.md
# Usage: ./jira-batch-update-sprint-19-23.sh [--dry-run] [--debug]
# Execution: Dec 26, 2025 at 10:00 AM EST

set -e

# Configuration
JIRA_URL="https://aurigraphdlt.atlassian.net"
PROJECT="AV11"
API_USER="sjoish12@gmail.com"
# Note: API_TOKEN should be loaded from environment or secrets manager
# export JIRA_API_TOKEN="<token from Credentials.md>"

# Script arguments
DRY_RUN="${1:-false}"
DEBUG="${2:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validation functions
validate_credentials() {
    log_info "Validating JIRA credentials..."
    
    if [ -z "$JIRA_API_TOKEN" ]; then
        log_error "JIRA_API_TOKEN not set. Load from Credentials.md:"
        log_error "  export JIRA_API_TOKEN='<token from Credentials.md>'"
        exit 1
    fi
    
    # Test API connection
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -u "$API_USER:$JIRA_API_TOKEN" \
        "$JIRA_URL/rest/api/3/myself")
    
    if [ "$response" == "200" ]; then
        log_success "JIRA API authentication successful"
    else
        log_error "JIRA API authentication failed (HTTP $response)"
        exit 1
    fi
}

# JIRA API wrapper function
jira_api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    
    local url="$JIRA_URL/rest/api/3$endpoint"
    
    if [ "$DEBUG" == "true" ]; then
        log_info "JIRA API: $method $endpoint"
        if [ ! -z "$data" ]; then
            log_info "Payload: $data"
        fi
    fi
    
    if [ "$DRY_RUN" == "true" ]; then
        echo "$data" | jq '.' 2>/dev/null || echo "$data"
        return 0
    fi
    
    case "$method" in
        POST)
            curl -s -X POST "$url" \
                -H "Authorization: Basic $(echo -n "$API_USER:$JIRA_API_TOKEN" | base64)" \
                -H "Content-Type: application/json" \
                -d "$data"
            ;;
        PUT)
            curl -s -X PUT "$url" \
                -H "Authorization: Basic $(echo -n "$API_USER:$JIRA_API_TOKEN" | base64)" \
                -H "Content-Type: application/json" \
                -d "$data"
            ;;
        GET)
            curl -s -X GET "$url" \
                -H "Authorization: Basic $(echo -n "$API_USER:$JIRA_API_TOKEN" | base64)"
            ;;
    esac
}

# Create Sprint
create_sprint() {
    local sprint_name="$1"
    local board_id="$2"
    
    log_info "Creating sprint: $sprint_name"
    
    data=$(cat <<EOF
{
  "name": "$sprint_name",
    "startDate": "2025-12-26T00:00:00.000Z",
    "endDate": "2026-02-17T23:59:59.999Z"
}
EOF
)
    
    response=$(jira_api_call POST "/rest/api/3/board/$board_id/sprint" "$data")
    
    if echo "$response" | grep -q "\"id\""; then
        sprint_id=$(echo "$response" | jq '.id')
        log_success "Sprint created: $sprint_name (ID: $sprint_id)"
        echo "$sprint_id"
    else
        log_error "Failed to create sprint: $sprint_name"
        echo "$response"
        exit 1
    fi
}

# Create Issue (Ticket)
create_issue() {
    local summary="$1"
    local description="$2"
    local issue_type="$3"
    local epic_link="$4"
    local sprint_id="$5"
    
    if [ "$DEBUG" == "true" ]; then
        log_info "Creating issue: $summary"
    fi
    
    data=$(cat <<EOF
{
  "fields": {
    "project": {
      "key": "$PROJECT"
    },
    "summary": "$summary",
    "description": {
      "version": 1,
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "$description"
            }
          ]
        }
      ]
    },
    "issuetype": {
      "name": "$issue_type"
    },
    "labels": ["sprint-19-23", "v11-migration"],
    "customfield_10028": "$epic_link"
  }
}
EOF
)
    
    response=$(jira_api_call POST "/rest/api/3/issue" "$data")
    
    if echo "$response" | grep -q "\"key\""; then
        issue_key=$(echo "$response" | jq -r '.key')
        log_success "Issue created: $issue_key"
        echo "$issue_key"
    else
        log_error "Failed to create issue: $summary"
        if [ "$DEBUG" == "true" ]; then
            echo "$response"
        fi
    fi
}

# Link PR to Issue
link_pr_to_issue() {
    local issue_key="$1"
    local pr_url="$2"
    
    log_info "Linking PR to $issue_key: $pr_url"
    
    data=$(cat <<EOF
{
  "globalId": "comdev-jira-$issue_key-pr",
  "application": {
    "type": "GitHub",
    "name": "GitHub"
  },
  "relationship": "relates to",
  "object": {
    "url": "$pr_url",
    "title": "GitHub PR",
    "icon": {
      "url16x16": "https://github.githubassets.com/favicon.ico"
    }
  }
}
EOF
)
    
    jira_api_call POST "/rest/api/3/issue/$issue_key/remotelink" "$data" > /dev/null
    log_success "PR linked to $issue_key"
}

# Main execution
main() {
    log_info "======================================================"
    log_info "JIRA Batch Update - Sprint 19-23"
    log_info "======================================================"
    log_info "URL: $JIRA_URL"
    log_info "Project: $PROJECT"
    log_info "User: $API_USER"
    log_info "Dry Run: $DRY_RUN"
    log_info "Debug: $DEBUG"
    log_info ""
    
    # Validate credentials
    validate_credentials
    log_info ""
    
    # Get board ID for project
    log_info "Fetching project board..."
    board_response=$(jira_api_call GET "/rest/api/3/board?projectKey=$PROJECT")
    board_id=$(echo "$board_response" | jq '.values[0].id')
    log_success "Board ID: $board_id"
    log_info ""
    
    # Create Epic for Sprint 19-23
    log_info "Creating Epic: Sprint 19-23 Pre-Deployment & Production Launch"
    epic_response=$(jira_api_call POST "/rest/api/3/issue" $(cat <<'EOF'
{
  "fields": {
    "project": {"key": "AV11"},
    "summary": "Sprint 19-23: Pre-Deployment Verification & Production Launch",
    "description": {
      "version": 1,
      "type": "doc",
      "content": [{
        "type": "paragraph",
        "content": [{
          "type": "text",
          "text": "Comprehensive 6-week initiative to verify infrastructure readiness and achieve 2M+ TPS production deployment by Feb 15, 2026"
        }]
      }]
    },
    "issuetype": {"name": "Epic"},
    "labels": ["epic", "production-launch", "v11-migration"]
  }
}
EOF
))
    epic_key=$(echo "$epic_response" | jq -r '.key')
    log_success "Epic created: $epic_key"
    log_info ""
    
    # Counter for created issues
    total_created=0
    
    # Sprint 19: Pre-Deployment Verification (20 tickets)
    log_info "======================================================"
    log_info "SPRINT 19: Pre-Deployment Verification (20 tickets)"
    log_info "======================================================"
    
    sprint_19_tickets=(
        "Prepare verification materials and communication templates|Comprehensive documentation for team coordination and status tracking|Task"
        "Validate credentials and GitHub SSH access|Automated verification of authentication systems|Task"
        "Verify development environment (Maven, Quarkus, PostgreSQL)|Ensure all development tools are properly configured|Task"
        "Execute Section 1: Credentials verification (7 items)|Automated script to validate all system credentials|Task"
        "Execute Section 2: Dev environment verification (6 items)|Manual verification steps for developer toolchain|Task"
        "Critical gate review - Sections 1-2 (13/13 items)|Assess success probability before proceeding|Review"
        "Execute Sections 3-4: Monitoring and testing verification|Prometheus, Grafana, and test infrastructure validation|Task"
        "Execute Section 5: Communication verification|Team communication channels and notification systems|Task"
        "Execute Section 6: V10 validation|Verify current TypeScript implementation baseline|Task"
        "Execute Section 7: V11 validation|Verify Java/Quarkus implementation status|Task"
        "Execute Section 8: Documentation review|Ensure all documentation is current and accurate|Review"
        "Execute Section 9: Risk mitigation procedures|Finalize contingency and disaster recovery plans|Task"
        "Final sign-off meeting - GO/NO-GO decision|Executive review for production launch approval|Meeting"
        "Fix critical infrastructure issues (4 critical, 8 warnings)|Address security and configuration issues identified in code review|Task"
        "Deploy verification tracking dashboards|Setup real-time tracking for verification progress|Task"
        "Train team on verification procedures|Ensure team is ready for execution phase|Training"
        "Prepare production deployment checklist|Comprehensive pre-flight checklist for Feb 15 launch|Documentation"
        "Setup incident response procedures|Define escalation matrix and SLA commitments|Documentation"
        "Create post-verification action items log|Track all issues identified during verification|Documentation"
        "Execute final security audit|Comprehensive security review before production deployment|Review"
    )
    
    for ticket in "${sprint_19_tickets[@]}"; do
        IFS='|' read -r summary description type <<< "$ticket"
        issue=$(create_issue "$summary" "$description" "$type" "$epic_key" "")
        if [ ! -z "$issue" ]; then
            ((total_created++))
        fi
        sleep 0.5  # Rate limiting
    done
    log_info "Sprint 19 tickets created: $total_created"
    log_info ""
    
    # Sprint 20: REST-gRPC Gateway & Performance (30 tickets)
    log_info "======================================================"
    log_info "SPRINT 20: REST-gRPC Gateway & Performance (30 tickets)"
    log_info "======================================================"
    
    sprint_20_count=0
    
    # Phase 1: Protocol Buffers (10 tickets)
    for i in {1..10}; do
        summary="Define Protocol Buffer service $i (core services)"
        description="Create protocol buffer definitions for gRPC service interface $i, including message types and service methods"
        issue=$(create_issue "$summary" "$description" "Task" "$epic_key" "")
        if [ ! -z "$issue" ]; then
            ((sprint_20_count++))
            ((total_created++))
        fi
        sleep 0.5
    done
    
    # Phase 2: gRPC Service Implementation (10 tickets)
    for i in {1..10}; do
        summary="Implement gRPC service $i with integration tests"
        description="Implement gRPC service #$i with comprehensive integration tests (≥70% coverage) and performance benchmarking"
        issue=$(create_issue "$summary" "$description" "Task" "$epic_key" "")
        if [ ! -z "$issue" ]; then
            ((sprint_20_count++))
            ((total_created++))
        fi
        sleep 0.5
    done
    
    # Phase 3: REST-gRPC Gateway & Performance (10 tickets)
    gateway_tickets=(
        "Implement REST-gRPC gateway|Create gateway for transparent REST↔gRPC translation with 100% API compatibility|Task"
        "Setup performance benchmarking environment|Configure load testing infrastructure for 2M+ TPS validation|Task"
        "Execute 24-hour sustained load test|Verify system can sustain 2M+ TPS for 24-hour continuous period|Task"
        "AI optimization integration with gRPC|Apply ML-driven transaction ordering to gRPC services|Task"
        "Security audit and hardening|Comprehensive security review of all gRPC implementations|Review"
        "Complete integration test suite (≥70% coverage)|Ensure all critical paths have integration tests|Task"
        "Documentation and API reference|Complete gRPC service documentation and API reference guide|Documentation"
        "Team training on gRPC architecture|Training session on Protocol Buffers and gRPC design patterns|Training"
        "Sprint 20 gate review - TPS ≥2M sustained|Verify all success criteria met before proceeding to Sprint 21|Review"
        "Performance optimization based on benchmarks|Apply optimizations to reach 2M+ TPS target|Task"
    )
    
    for ticket in "${gateway_tickets[@]}"; do
        IFS='|' read -r summary description <<< "$ticket"
        issue=$(create_issue "$summary" "$description" "Task" "$epic_key" "")
        if [ ! -z "$issue" ]; then
            ((sprint_20_count++))
            ((total_created++))
        fi
        sleep 0.5
    done
    
    log_info "Sprint 20 tickets created: $sprint_20_count"
    log_info ""
    
    # Sprint 21: Enhanced Services (25 tickets)
    log_info "======================================================"
    log_info "SPRINT 21: Enhanced Services (25 tickets)"
    log_info "======================================================"
    
    sprint_21_count=0
    
    # AI optimization & cross-chain
    for i in {1..7}; do
        summary="AI optimization enhancement $i - Dynamic transaction ordering"
        description="Implement online learning and dynamic transaction ordering enhancement #$i for AI optimization service"
        issue=$(create_issue "$summary" "$description" "Task" "$epic_key" "")
        if [ ! -z "$issue" ]; then
            ((sprint_21_count++))
            ((total_created++))
        fi
        sleep 0.5
    done
    
    # Oracle integration & atomic swaps
    for i in {1..8}; do
        summary="Cross-chain bridge enhancement $i - Oracle consensus"
        description="Implement oracle consensus mechanism and atomic swap protocol enhancement #$i"
        issue=$(create_issue "$summary" "$description" "Task" "$epic_key" "")
        if [ ! -z "$issue" ]; then
            ((sprint_21_count++))
            ((total_created++))
        fi
        sleep 0.5
    done
    
    # RWAT registry enhancements (10 tickets)
    for i in {1..10}; do
        summary="RWAT registry enhancement $i - Oracle pricing integration"
        description="Enhance real-world asset tokenization with oracle pricing and availability integration #$i"
        issue=$(create_issue "$summary" "$description" "Task" "$epic_key" "")
        if [ ! -z "$issue" ]; then
            ((sprint_21_count++))
            ((total_created++))
        fi
        sleep 0.5
    done
    
    log_info "Sprint 21 tickets created: $sprint_21_count"
    log_info ""
    
    # Sprint 22: Multi-Cloud HA (20 tickets)
    log_info "======================================================"
    log_info "SPRINT 22: Multi-Cloud HA & Production Readiness (20 tickets)"
    log_info "======================================================"
    
    sprint_22_count=0
    
    # Multi-cloud infrastructure (12 tickets)
    clouds=("AWS us-east-1" "Azure eastus" "GCP us-central1")
    for cloud in "${clouds[@]}"; do
        for component in "VPC/Network" "RDS/Database" "Consul/ServiceMesh" "Monitoring"; do
            summary="Deploy $component to $cloud"
            description="Deploy $component infrastructure to $cloud cloud provider"
            issue=$(create_issue "$summary" "$description" "Task" "$epic_key" "")
            if [ ! -z "$issue" ]; then
                ((sprint_22_count++))
                ((total_created++))
            fi
            sleep 0.5
        done
    done
    
    # Production readiness (8 tickets)
    readiness_tickets=(
        "Setup WireGuard VPN mesh across 3 clouds|Configure encrypted cross-cloud communication|Task"
        "Configure Consul federation across clouds|Enable service discovery across AWS/Azure/GCP|Task"
        "Implement automated failover procedures|Setup and test all failover scenarios|Task"
        "Chaos engineering tests (all scenarios)|Run chaos tests to validate fault tolerance|Task"
        "Production monitoring dashboards|Create comprehensive monitoring and alerting dashboards|Task"
        "Disaster recovery drills|Execute and document all DR procedures|Task"
        "Team training and runbooks|Train team on production operations and procedures|Training"
        "Sprint 22 gate review - Go-live readiness|Final verification before Feb 15 production launch|Review"
    )
    
    for ticket in "${readiness_tickets[@]}"; do
        IFS='|' read -r summary description <<< "$ticket"
        issue=$(create_issue "$summary" "$description" "Task" "$epic_key" "")
        if [ ! -z "$issue" ]; then
            ((sprint_22_count++))
            ((total_created++))
        fi
        sleep 0.5
    done
    
    log_info "Sprint 22 tickets created: $sprint_22_count"
    log_info ""
    
    # Sprint 23: Post-Launch Optimization (15 tickets)
    log_info "======================================================"
    log_info "SPRINT 23: Post-Launch Optimization (15 tickets)"
    log_info "======================================================"
    
    sprint_23_count=0
    
    sprint_23_tickets=(
        "Post-launch monitoring and alerting|Monitor production systems and tune alerts based on real traffic|Task"
        "Performance optimization based on production metrics|Apply optimizations discovered in production|Task"
        "Bug fixes and hardening|Address bugs discovered during production operation|Task"
        "V10 to V11 data migration completion|Complete TypeScript to Java data migration|Task"
        "Carbon offset tracking implementation|Implement carbon tracking and offset features|Feature"
        "Multi-tenant support enhancement|Add comprehensive multi-tenant support to V11|Feature"
        "WebSocket real-time updates (optional)|Implement WebSocket for real-time dashboard updates|Feature"
        "API documentation and SDK generation|Auto-generate API documentation and client SDKs|Documentation"
        "Knowledge transfer to operations team|Comprehensive documentation and training for ops team|Training"
        "Next sprint planning (Sprint 24+)|Plan future enhancements and improvements|Planning"
        "Post-launch retrospective|Team retrospective and lessons learned documentation|Review"
        "Performance tuning Round 2|Second round of performance optimization|Task"
        "Security hardening Round 2|Additional security enhancements based on production experience|Task"
        "Cost optimization (multi-cloud)|Optimize cloud spending across AWS/Azure/GCP|Task"
        "V10 decommission planning|Plan timeline and procedures for TypeScript V10 retirement|Planning"
    )
    
    for ticket in "${sprint_23_tickets[@]}"; do
        IFS='|' read -r summary description <<< "$ticket"
        type="Task"
        if [[ $summary =~ "Review" ]]; then type="Review"; fi
        if [[ $summary =~ "Planning" ]]; then type="Planning"; fi
        if [[ $summary =~ "retrospective" ]]; then type="Review"; fi
        
        issue=$(create_issue "$summary" "$description" "$type" "$epic_key" "")
        if [ ! -z "$issue" ]; then
            ((sprint_23_count++))
            ((total_created++))
        fi
        sleep 0.5
    done
    
    log_info "Sprint 23 tickets created: $sprint_23_count"
    log_info ""
    
    # Summary
    log_info "======================================================"
    log_info "JIRA Batch Update Complete"
    log_info "======================================================"
    log_success "Total tickets created: $total_created"
    log_success "Epic: $epic_key"
    log_info ""
    log_info "Sprint Summary:"
    log_info "  Sprint 19: ~20 tickets (Pre-deployment verification)"
    log_info "  Sprint 20: ~30 tickets (REST-gRPC gateway)"
    log_info "  Sprint 21: ~25 tickets (Enhanced services)"
    log_info "  Sprint 22: ~20 tickets (Multi-cloud HA)"
    log_info "  Sprint 23: ~15 tickets (Post-launch optimization)"
    log_info "  ─────────────────────────────────"
    log_info "  Total: ~110 tickets"
    log_info ""
    
    if [ "$DRY_RUN" == "true" ]; then
        log_warn "Dry run completed - no actual changes made to JIRA"
    fi
    
    log_success "All tickets ready for assignment and sprint planning"
}

# Execute
main
