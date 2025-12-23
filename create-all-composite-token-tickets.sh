#!/bin/bash

##############################################################################
# Composite Token System - JIRA Ticket Creation Script
#
# Creates all 8 Epics + 41 Stories for 13-sprint Composite Token implementation
# Status: Ready for Sprints 2-13 execution
#
# Usage: export JIRA_EMAIL="subbu@aurigraph.io" JIRA_API_TOKEN="<token>"
#        bash create-all-composite-token-tickets.sh
#
# Tickets Created:
# - 8 Epics (AV11-601 through AV11-608)
# - 41 Stories (13 under AV11-601, 5 under AV11-602, 6 under AV11-603, etc.)
# - Total: 246 Story Points across 13 sprints
#
##############################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
JIRA_URL="https://aurigraphdlt.atlassian.net"
JIRA_API_ENDPOINT="$JIRA_URL/rest/api/3"
PROJECT_KEY="AV11"

# Counters
EPICS_CREATED=0
STORIES_CREATED=0
ERRORS=0

##############################################################################
# UTILITY FUNCTIONS
##############################################################################

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    ((ERRORS++))
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

create_epic() {
    local epic_key=$1
    local epic_num=$2
    local summary=$3
    local description=$4
    local story_points=$5

    log_info "Creating Epic $epic_key ($story_points SP)..."

    local payload=$(cat <<EOF
{
  "fields": {
    "project": {
      "key": "$PROJECT_KEY"
    },
    "summary": "$summary",
    "description": "$description",
    "issuetype": {
      "name": "Epic"
    },
    "customfield_10011": "$epic_key",
    "customfield_10016": $story_points
  }
}
EOF
)

    local response=$(curl -s -X POST \
        -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$JIRA_API_ENDPOINT/issues")

    local key=$(echo "$response" | jq -r '.key // empty')

    if [ -z "$key" ]; then
        log_error "Failed to create epic $epic_key"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        return 1
    fi

    log_success "Created Epic: $key - $summary"
    ((EPICS_CREATED++))
    sleep 1
}

create_story() {
    local story_key=$1
    local epic_key=$2
    local summary=$3
    local description=$4
    local story_points=$5
    local sprint=${6:-"Sprint 1"}

    log_info "Creating Story $story_key ($story_points SP)..."

    local payload=$(cat <<EOF
{
  "fields": {
    "project": {
      "key": "$PROJECT_KEY"
    },
    "summary": "$summary",
    "description": "$description",
    "issuetype": {
      "name": "Story"
    },
    "parent": {
      "key": "$epic_key"
    },
    "customfield_10016": $story_points,
    "customfield_10015": "$sprint"
  }
}
EOF
)

    local response=$(curl -s -X POST \
        -H "Authorization: Basic $(echo -n "$JIRA_EMAIL:$JIRA_API_TOKEN" | base64)" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$JIRA_API_ENDPOINT/issues")

    local key=$(echo "$response" | jq -r '.key // empty')

    if [ -z "$key" ]; then
        log_error "Failed to create story $story_key"
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        return 1
    fi

    log_success "Created Story: $key - $summary"
    ((STORIES_CREATED++))
    sleep 1
}

##############################################################################
# MAIN EXECUTION
##############################################################################

main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  Composite Token System - JIRA Ticket Creation             ║"
    echo "║  Creating 8 Epics + 41 Stories (246 SP)                   ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""

    # Verify credentials
    if [ -z "$JIRA_EMAIL" ] || [ -z "$JIRA_API_TOKEN" ]; then
        log_error "JIRA credentials not set. Please export JIRA_EMAIL and JIRA_API_TOKEN"
        exit 1
    fi

    log_info "Using JIRA project: $PROJECT_KEY at $JIRA_URL"
    echo ""

    ##########################################################################
    # PHASE 1: CREATE 8 EPICS
    ##########################################################################

    echo -e "${YELLOW}══════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}PHASE 1: Creating 8 Epics${NC}"
    echo -e "${YELLOW}══════════════════════════════════════════════════════════${NC}"
    echo ""

    create_epic "AV11-601" "1" \
        "Token Architecture Foundation" \
        "Implement primary, secondary, and enhanced derived token systems with 12+ derivation types across 4 asset classes" \
        "55"

    create_epic "AV11-602" "2" \
        "Composite Token Assembly" \
        "Bundle primary + secondary tokens with Merkle proof verification and VVB consensus" \
        "31"

    create_epic "AV11-603" "3" \
        "Active Contract System" \
        "Bind Active Contracts to composite tokens with workflow engine and RBAC" \
        "49"

    create_epic "AV11-604" "4" \
        "Registry Infrastructure" \
        "Implement Merkle tree registries per asset class (5 classes, 1M+ token capacity)" \
        "18"

    create_epic "AV11-605" "5" \
        "Token Topology Visualization" \
        "Create interactive graph visualization of token relationships with D3.js" \
        "36"

    create_epic "AV11-606" "6" \
        "Traceability System" \
        "Implement comprehensive traceability with audit trails and blockchain anchoring" \
        "18"

    create_epic "AV11-607" "7" \
        "API Layer" \
        "Expose REST APIs for tokens, contracts, and registries with WebSocket support" \
        "15"

    create_epic "AV11-608" "8" \
        "Testing & Quality Assurance" \
        "Implement unit, integration, and E2E tests with 95% coverage and performance validation" \
        "24"

    echo ""
    log_success "PHASE 1 COMPLETE: Created $EPICS_CREATED Epics"
    echo ""

    ##########################################################################
    # PHASE 2: CREATE 41 STORIES
    ##########################################################################

    echo -e "${YELLOW}══════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}PHASE 2: Creating 41 Stories${NC}"
    echo -e "${YELLOW}══════════════════════════════════════════════════════════${NC}"
    echo ""

    # Epic AV11-601: Token Architecture (13 Stories, 55 SP)
    echo -e "${BLUE}📌 Epic AV11-601: Token Architecture Foundation${NC}"

    create_story "AV11-601-01" "AV11-601" \
        "Primary Token Data Model" \
        "Define PrimaryToken entity class with lifecycle management (CREATED → VERIFIED → TRANSFERRED → RETIRED)" \
        "5" "Sprint 1"

    create_story "AV11-601-02" "AV11-601" \
        "Primary Token Factory & Registry" \
        "Implement factory pattern and Merkle tree registry for primary tokens" \
        "5" "Sprint 1"

    create_story "AV11-601-03" "AV11-601" \
        "Secondary Token Types" \
        "Define secondary token hierarchy with IncomeStreamToken, CollateralToken, RoyaltyToken" \
        "5" "Sprint 1"

    create_story "AV11-601-04" "AV11-601" \
        "Secondary Token Factory" \
        "Implement factory for creating secondary token types with validation" \
        "5" "Sprint 2"

    create_story "AV11-601-05A" "AV11-601" \
        "Derived Token Core Architecture" \
        "Foundation for all derived token types with parent-child relationships and revenue distribution" \
        "8" "Sprint 2"

    create_story "AV11-601-05B" "AV11-601" \
        "Real Estate Derived Tokens" \
        "Implement 4 types: RENTAL_INCOME, FRACTIONAL_SHARE, PROPERTY_APPRECIATION, MORTGAGE_COLLATERAL" \
        "5" "Sprint 2"

    create_story "AV11-601-05C" "AV11-601" \
        "Agricultural Derived Tokens" \
        "Implement 4 types: CROP_YIELD, HARVEST_REVENUE, CARBON_SEQUESTRATION, WATER_RIGHTS with USDA integration" \
        "5" "Sprint 2"

    create_story "AV11-601-05D" "AV11-601" \
        "Mining & Commodity Derived Tokens" \
        "Implement 4 types: ORE_EXTRACTION, COMMODITY_OUTPUT, ROYALTY_SHARE, RESOURCE_DEPLETION" \
        "5" "Sprint 2"

    create_story "AV11-601-05E" "AV11-601" \
        "Carbon Credit Derived Tokens" \
        "Implement 3 types: CARBON_SEQUESTRATION, RENEWABLE_ENERGY, CARBON_OFFSET with registry integration" \
        "3" "Sprint 2"

    create_story "AV11-601-05F" "AV11-601" \
        "Revenue Distribution Engine" \
        "Automated multi-party payment distribution (70% investors, 25% manager, 5% platform)" \
        "5" "Sprint 2"

    create_story "AV11-601-05G" "AV11-601" \
        "Oracle Integration Layer" \
        "External data feed integration for valuation (property, USDA, commodity, carbon registries)" \
        "2" "Sprint 2"

    create_story "AV11-601-05H" "AV11-601" \
        "Derived Token Marketplace" \
        "Secondary market trading for derived tokens with order book and compliance matching" \
        "2" "Sprint 2"

    create_story "AV11-601-13" "AV11-601" \
        "Token Module Integration Testing" \
        "Comprehensive integration testing for all token types and flows" \
        "3" "Sprint 2"

    echo -e "${BLUE}📌 Epic AV11-602: Composite Token Assembly${NC}"

    create_story "AV11-602-01" "AV11-602" \
        "Composite Token Binding" \
        "Bundle primary + secondary tokens into composite units with immutability guarantees" \
        "6" "Sprint 3"

    create_story "AV11-602-02" "AV11-602" \
        "Merkle Tree Verification" \
        "Merkle tree construction and proof generation for composite bundles" \
        "6" "Sprint 3"

    create_story "AV11-602-03" "AV11-602" \
        "VVB Consensus Workflow" \
        "3-of-N multi-verifier approval workflow with quantum signatures" \
        "7" "Sprint 3"

    create_story "AV11-602-04" "AV11-602" \
        "Composite Registry" \
        "Registry for composite tokens with Merkle tree verification" \
        "6" "Sprint 4"

    create_story "AV11-602-05" "AV11-602" \
        "Composite Token Integration Tests" \
        "End-to-end testing of composite token creation, verification, and transfer" \
        "6" "Sprint 4"

    echo -e "${BLUE}📌 Epic AV11-603: Active Contract System${NC}"

    create_story "AV11-603-01" "AV11-603" \
        "Workflow State Machine" \
        "Contract lifecycle with transitions: DRAFT → PENDING → ACTIVE ↔ SUSPENDED → TERMINATED" \
        "9" "Sprint 5"

    create_story "AV11-603-02" "AV11-603" \
        "Business Rules Engine" \
        "Rule evaluation engine with DSL support and 35+ pre-built rule patterns" \
        "9" "Sprint 5"

    create_story "AV11-603-03" "AV11-603" \
        "RBAC Service Implementation" \
        "Role-based access control with 5 roles and 8 permissions per role" \
        "9" "Sprint 6"

    create_story "AV11-603-04" "AV11-603" \
        "Contract Registry" \
        "Merkle-tree-based registry for 1M+ active contracts" \
        "8" "Sprint 6"

    create_story "AV11-603-05" "AV11-603" \
        "Compliance & Transition Rules" \
        "Business rule patterns for compliance validation and state transitions" \
        "8" "Sprint 7"

    create_story "AV11-603-06" "AV11-603" \
        "Contract Integration Tests" \
        "Workflow transitions, rule evaluation, RBAC combinations testing" \
        "6" "Sprint 7"

    echo -e "${BLUE}📌 Epic AV11-604: Registry Infrastructure${NC}"

    create_story "AV11-604-01" "AV11-604" \
        "Multi-Asset Class Registry" \
        "Registry supporting 5 asset classes with Merkle tree per class" \
        "7" "Sprint 8"

    create_story "AV11-604-02" "AV11-604" \
        "Optimized Merkle Tree Updates" \
        "Incremental tree updates avoiding full rebuild" \
        "6" "Sprint 8"

    create_story "AV11-604-03" "AV11-604" \
        "Registry Analytics & Reporting" \
        "Cross-registry statistics and analytics" \
        "5" "Sprint 9"

    echo -e "${BLUE}📌 Epic AV11-605: Token Topology Visualization${NC}"

    create_story "AV11-605-01" "AV11-605" \
        "D3.js Force-Directed Graph" \
        "Interactive graph visualization with zoom, pan, drag interactions" \
        "8" "Sprint 10"

    create_story "AV11-605-02" "AV11-605" \
        "Node Detail Panel" \
        "Right sidebar with selected node details and token properties" \
        "6" "Sprint 10"

    create_story "AV11-605-03" "AV11-605" \
        "Topology Controls & Filtering" \
        "Filter by node type, search, and visualization controls" \
        "6" "Sprint 11"

    create_story "AV11-605-04" "AV11-605" \
        "WebSocket Event Streaming" \
        "Real-time topology updates via WebSocket (10K concurrent connections)" \
        "8" "Sprint 11"

    create_story "AV11-605-05" "AV11-605" \
        "Topology E2E Tests" \
        "Playwright E2E tests and Pytest backend tests" \
        "8" "Sprint 11"

    echo -e "${BLUE}📌 Epic AV11-606: Traceability System${NC}"

    create_story "AV11-606-01" "AV11-606" \
        "Asset Traceability Service" \
        "Hash chain with SHA-256 for immutable transaction history" \
        "6" "Sprint 12"

    create_story "AV11-606-02" "AV11-606" \
        "Blockchain Anchoring" \
        "Blockchain integration for verification proofs" \
        "6" "Sprint 12"

    create_story "AV11-606-03" "AV11-606" \
        "Compliance Report Generation" \
        "SEC Form D, EU MiCA, and SOC2 compliance reports" \
        "6" "Sprint 12"

    echo -e "${BLUE}📌 Epic AV11-607: API Layer${NC}"

    create_story "AV11-607-01" "AV11-607" \
        "Token REST APIs" \
        "REST endpoints for token operations with search, filter, pagination" \
        "5" "Sprint 12"

    create_story "AV11-607-02" "AV11-607" \
        "WebSocket & Real-Time Events" \
        "WebSocket support for real-time event streaming" \
        "5" "Sprint 12"

    create_story "AV11-607-03" "AV11-607" \
        "Compliance & Traceability APIs" \
        "REST endpoints for compliance reporting and traceability queries" \
        "5" "Sprint 13"

    echo -e "${BLUE}📌 Epic AV11-608: Testing & Quality Assurance${NC}"

    create_story "AV11-608-01" "AV11-608" \
        "Unit & Integration Test Suite" \
        "Comprehensive unit and integration tests targeting 95%+ coverage" \
        "8" "Sprint 13"

    create_story "AV11-608-02" "AV11-608" \
        "E2E & Performance Testing" \
        "End-to-end testing with Playwright and performance benchmarking" \
        "8" "Sprint 13"

    create_story "AV11-608-03" "AV11-608" \
        "Production Readiness Validation" \
        "Security audit, compliance verification, and deployment checklist" \
        "8" "Sprint 13"

    echo ""
    log_success "PHASE 2 COMPLETE: Created $STORIES_CREATED Stories"
    echo ""

    ##########################################################################
    # FINAL SUMMARY
    ##########################################################################

    echo -e "${YELLOW}══════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}EXECUTION SUMMARY${NC}"
    echo -e "${YELLOW}══════════════════════════════════════════════════════════${NC}"
    echo ""

    echo "✅ Epics Created: $EPICS_CREATED"
    echo "✅ Stories Created: $STORIES_CREATED"
    echo "❌ Errors Encountered: $ERRORS"
    echo ""

    if [ $ERRORS -eq 0 ]; then
        log_success "All tickets created successfully!"
        echo ""
        echo "Total Issues: $((EPICS_CREATED + STORIES_CREATED))"
        echo "Total Story Points: 246 SP"
        echo "Sprints: 13 (26 weeks)"
        echo "Team: 8 developers + 2 QA + 1 architect"
        echo ""
        log_success "Ready to begin Sprint 1 implementation!"
    else
        log_error "Some tickets failed to create. Please review errors above."
        exit 1
    fi
}

main "$@"
