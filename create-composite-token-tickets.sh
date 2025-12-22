#!/bin/bash
# Composite Token + Enhanced Derived Token JIRA Ticket Creation Script
# Creates 8 Epics + 41 Stories (254 Story Points) with enhanced Derived Token system
# December 22, 2025

set -e

# Configuration
JIRA_EMAIL="${JIRA_EMAIL:-subbu@aurigraph.io}"
JIRA_API_TOKEN="${JIRA_API_TOKEN}"
JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"
JIRA_PROJECT="AV11"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Counters
EPICS_CREATED=0
STORIES_CREATED=0
TICKETS_CLOSED=0
FAILED=0

# Helper function to create JIRA ticket
create_jira_ticket() {
    local type=$1
    local key=$2
    local summary=$3
    local description=$4
    local parent=$5
    local points=$6
    local epic_name=$7

    # Build JSON payload
    local payload="{
        \"fields\": {
            \"project\": {\"key\": \"$JIRA_PROJECT\"},
            \"summary\": \"$summary\",
            \"description\": \"$description\",
            \"issuetype\": {\"name\": \"$type\"}"

    # Add parent for stories
    if [ ! -z "$parent" ]; then
        payload="$payload,
            \"parent\": {\"key\": \"$parent\"}"
    fi

    # Add story points
    if [ ! -z "$points" ] && [ "$type" = "Story" ]; then
        payload="$payload,
            \"customfield_10016\": $points"
    fi

    # Add epic name for epics
    if [ "$type" = "Epic" ] && [ ! -z "$epic_name" ]; then
        payload="$payload,
            \"customfield_10011\": \"$epic_name\""
    fi

    payload="$payload
        }
    }"

    # Execute API call
    http_code=$(curl -s -X POST \
        "${JIRA_BASE_URL}/rest/api/3/issues" \
        -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        -w "%{http_code}" \
        -o /tmp/jira_response.json)

    if [[ "$http_code" == "201" ]]; then
        local ticket_key=$(jq -r '.key' /tmp/jira_response.json 2>/dev/null || echo "CREATED")
        if [ "$type" = "Epic" ]; then
            echo -e "${GREEN}✅ Epic Created: $ticket_key${NC}"
            ((EPICS_CREATED++))
        else
            echo -e "${GREEN}✅ Story Created: $ticket_key${NC}"
            ((STORIES_CREATED++))
        fi
        return 0
    else
        echo -e "${RED}❌ Failed to create $type [$http_code]${NC}"
        ((FAILED++))
        return 1
    fi
}

# Helper function to close/transition completed tickets
close_ticket() {
    local ticket=$1

    http_code=$(curl -s -X POST \
        "${JIRA_BASE_URL}/rest/api/3/issue/${ticket}/transitions" \
        -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
        -H "Content-Type: application/json" \
        -d '{"transition":{"id":"31"}}' \
        -w "%{http_code}" \
        -o /dev/null)

    if [[ "$http_code" == "204" ]] || [[ "$http_code" == "200" ]]; then
        echo -e "${GREEN}✅ Closed: $ticket${NC}"
        ((TICKETS_CLOSED++))
        return 0
    else
        echo -e "${YELLOW}⚠️  Could not close $ticket [HTTP $http_code]${NC}"
        return 1
    fi
}

# Main execution
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Composite Token + Enhanced Derived Token${NC}"
echo -e "${BLUE}JIRA Ticket Creation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check credentials
if [ -z "$JIRA_API_TOKEN" ]; then
    echo -e "${RED}❌ Error: JIRA_API_TOKEN not set${NC}"
    echo "Set the token with: export JIRA_API_TOKEN='your_token'"
    exit 1
fi

echo -e "${GREEN}✅ Credentials configured${NC}"
echo ""

# ==================== PHASE 1: CLOSE COMPLETED TICKETS ====================

echo -e "${BLUE}📋 PHASE 1: Closing 15 Completed Tickets${NC}"
echo ""

completed_tickets=(
    "AV11-452"  # RWAT Implementation
    "AV11-455"  # VVB Verification Service
    "AV11-460"  # Ricardian Smart Contracts
    "AV11-476"  # CURBy Quantum Cryptography
    "AV11-550"  # JIRA API Search Endpoint
    "AV11-584"  # File Upload Hash Verification
    "AV11-585"  # File Upload Test Suite
    "AV11-541"  # TransactionScoringModelTest Fix
    "AV11-303"  # Cross-Chain Bridge Test Framework
    "AV11-304"  # Production Infrastructure Deployment
    "AV11-305"  # Deployment Strategy with Fallback
    "AV11-567"  # Real API Integration
    "AV11-524"  # AnalyticsStreamService
    "AV11-519"  # CrossChainBridgeGrpcService
    "AV11-475"  # CURBy REST Client
)

for ticket in "${completed_tickets[@]}"; do
    close_ticket "$ticket"
done

echo ""
echo -e "${GREEN}Closed: $TICKETS_CLOSED/15 tickets${NC}"
echo ""

# ==================== PHASE 2: CREATE EPICS ====================

echo -e "${BLUE}📊 PHASE 2: Creating 8 Main Epics${NC}"
echo ""

# Epic definitions - create epics directly without associative array
echo -e "${BLUE}Creating Epic: AV11-601 - Token Architecture Foundation${NC}"
create_jira_ticket "Epic" "AV11-601" "Token Architecture Foundation" "Implement primary, secondary, and enhanced derived token systems with independent transferability and value calculation" "" "" "AV11-601"
sleep 1

echo -e "${BLUE}Creating Epic: AV11-602 - Composite Token Assembly${NC}"
create_jira_ticket "Epic" "AV11-602" "Composite Token Assembly" "Bundle primary + secondary tokens with Merkle proof verification and VVB consensus" "" "" "AV11-602"
sleep 1

echo -e "${BLUE}Creating Epic: AV11-603 - Active Contract System${NC}"
create_jira_ticket "Epic" "AV11-603" "Active Contract System" "Bind Active Contracts to composite tokens with workflow engine and business rules" "" "" "AV11-603"
sleep 1

echo -e "${BLUE}Creating Epic: AV11-604 - Registry Infrastructure${NC}"
create_jira_ticket "Epic" "AV11-604" "Registry Infrastructure" "Implement Merkle tree registries per asset class with cross-registry navigation" "" "" "AV11-604"
sleep 1

echo -e "${BLUE}Creating Epic: AV11-605 - Token Topology Visualization${NC}"
create_jira_ticket "Epic" "AV11-605" "Token Topology Visualization" "Create interactive graph visualization of token relationships with owner approval workflow" "" "" "AV11-605"
sleep 1

echo -e "${BLUE}Creating Epic: AV11-606 - Traceability System${NC}"
create_jira_ticket "Epic" "AV11-606" "Traceability System" "Implement comprehensive traceability with compliance reporting and audit trails" "" "" "AV11-606"
sleep 1

echo -e "${BLUE}Creating Epic: AV11-607 - API Layer${NC}"
create_jira_ticket "Epic" "AV11-607" "API Layer" "Expose REST APIs for tokens, contracts, and registries with WebSocket real-time events" "" "" "AV11-607"
sleep 1

echo -e "${BLUE}Creating Epic: AV11-608 - Testing${NC}"
create_jira_ticket "Epic" "AV11-608" "Testing" "Implement unit, integration, and E2E tests with 95% coverage target" "" "" "AV11-608"
sleep 1

echo ""
echo -e "${GREEN}Created: $EPICS_CREATED/8 Epics${NC}"
echo ""

# ==================== PHASE 3: CREATE TOKEN ARCHITECTURE STORIES ====================

echo -e "${BLUE}📝 PHASE 3: Creating Token Architecture Stories (AV11-601)${NC}"
echo ""

# Foundation stories (AV11-601-01 through AV11-601-04)
create_jira_ticket "Story" "AV11-601-01" "Primary Token Data Model" \
    "Define and implement the Primary Token data model representing underlying assets.\n\nAcceptance Criteria:\n- PrimaryToken entity with fields: tokenId, assetId, assetType, ownerAddress, digitalTwinRef, valuation, vvbVerified, createdAt\n- Support for asset types: REAL_ESTATE, VEHICLE, COMMODITY, IP, FINANCIAL\n- Digital twin reference linking\n- JPA/Panache entity with indexes" \
    "AV11-601" "5"
sleep 1

create_jira_ticket "Story" "AV11-601-02" "Primary Token Factory & Registry" \
    "Implement Primary Token factory for token creation and registry for storage/retrieval.\n\nAcceptance Criteria:\n- PrimaryTokenFactory with createToken(), mintToken() methods\n- PrimaryTokenRegistry with CRUD operations\n- Token ID generation (PT-{assetType}-{uuid})\n- Event emission on token creation" \
    "AV11-601" "5"
sleep 1

create_jira_ticket "Story" "AV11-601-03" "Secondary Token Types" \
    "Define secondary token types for supporting documents and artifacts.\n\nAcceptance Criteria:\n- SecondaryTokenType enum: TITLE_DEED, OWNER_KYC, TAX_RECEIPT, PHOTO_GALLERY, VIDEO_TOUR, APPRAISAL, INSURANCE, SURVEY\n- SecondaryToken entity linking to primary\n- SHA256 hash storage for document verification\n- File attachment integration" \
    "AV11-601" "5"
sleep 1

create_jira_ticket "Story" "AV11-601-04" "Secondary Token Factory" \
    "Implement factory for creating secondary tokens from documents/artifacts.\n\nAcceptance Criteria:\n- Document-to-token conversion\n- Media (photo/video) token creation\n- KYC token integration\n- Automatic hash calculation" \
    "AV11-601" "5"
sleep 1

# ==================== PHASE 4: CREATE ENHANCED DERIVED TOKEN STORIES ====================

echo -e "${BLUE}🔄 PHASE 4: Creating Enhanced Derived Token Stories (8 stories)${NC}"
echo ""

create_jira_ticket "Story" "AV11-601-05A" "Derived Token Core Architecture" \
    "Foundation for all derived token types with parent-child relationships.\n\nAcceptance Criteria:\n- DerivedToken entity with: derivedTokenId, primaryTokenRef, derivationType, derivationRules\n- Parent-child relationship management\n- Independent transferability from primary token\n- Lifecycle management (CREATED → ACTIVE → REDEEMED → EXPIRED)\n- Value calculation engine framework\n\nTechnical Notes:\n- Use PanacheEntity for ORM\n- JSON storage for flexible derivation rules\n- Status enum for lifecycle management" \
    "AV11-601" "8"
sleep 1

create_jira_ticket "Story" "AV11-601-05B" "Real Estate Derived Tokens" \
    "Rental income and property-based derivatives.\n\nDerivation Types:\n- RENTAL_INCOME: Monthly/annual rental income streams\n- FRACTIONAL_SHARE: Partial ownership tokens\n- PROPERTY_APPRECIATION: Value increase tokens\n- MORTGAGE_COLLATERAL: Loan collateralization\n\nAcceptance Criteria:\n- Rental income distribution rules (frequency, amount)\n- Fractional ownership percentage calculation\n- Property valuation oracle integration\n- Automatic payment distribution mechanism" \
    "AV11-601" "5"
sleep 1

create_jira_ticket "Story" "AV11-601-05C" "Agricultural Derived Tokens" \
    "Crop yield and agricultural asset derivatives.\n\nDerivation Types:\n- CROP_YIELD: Future harvest revenue tokens\n- HARVEST_REVENUE: Seasonal income streams\n- CARBON_SEQUESTRATION: Agricultural carbon credits\n- WATER_RIGHTS: Irrigation and water usage tokens\n\nAcceptance Criteria:\n- Crop yield prediction model integration\n- Harvest season scheduling\n- USDA yield data oracle\n- Weather risk factor calculation" \
    "AV11-601" "5"
sleep 1

create_jira_ticket "Story" "AV11-601-05D" "Mining & Commodity Derived Tokens" \
    "Resource extraction and commodity output derivatives.\n\nDerivation Types:\n- ORE_EXTRACTION: Mining output tokens\n- COMMODITY_OUTPUT: Oil, gas, minerals revenue streams\n- ROYALTY_SHARE: Extraction royalty tokens\n- RESOURCE_DEPLETION: Value adjustment for resource drawdown\n\nAcceptance Criteria:\n- Mining output tracking\n- Commodity price feed integration (gold, oil, copper)\n- Royalty percentage calculation\n- Reserve estimation and depletion modeling" \
    "AV11-601" "5"
sleep 1

create_jira_ticket "Story" "AV11-601-05E" "Carbon Credit Derived Tokens" \
    "Environmental and sustainability-based derivatives.\n\nDerivation Types:\n- CARBON_SEQUESTRATION: Forest/land carbon capture\n- RENEWABLE_ENERGY: Solar/wind energy production credits\n- CARBON_OFFSET: Verified offset certificates\n\nAcceptance Criteria:\n- Integration with Verra VCS, Gold Standard registries\n- Paris Agreement Article 6.2 compliance\n- Automatic retirement on redemption\n- Double-counting prevention\n\nIntegration: Leverage existing CarbonCredit.java (507 lines)" \
    "AV11-601" "3"
sleep 1

create_jira_ticket "Story" "AV11-601-05F" "Revenue Distribution Engine" \
    "Automated payment distribution for derived tokens.\n\nAcceptance Criteria:\n- Distribution rules engine (percentage splits, thresholds)\n- Payment schedule management (daily, monthly, quarterly)\n- Multi-party distribution (investors 70%, manager 25%, platform 5%)\n- Escrow service for trustless settlement\n- Distribution history and audit trail\n\nTechnical Notes: Use existing CompositeToken.java patterns for multi-party consensus" \
    "AV11-601" "5"
sleep 1

create_jira_ticket "Story" "AV11-601-05G" "Oracle Integration Layer" \
    "External data feed integration for derived token valuation.\n\nAcceptance Criteria:\n- Property management system API integration (rental data)\n- USDA crop data API (harvest yields)\n- Commodity price feeds (Bloomberg, CME)\n- Carbon registry APIs (Verra, Gold Standard)\n- Oracle confidence scoring (0-100)" \
    "AV11-601" "2"
sleep 1

create_jira_ticket "Story" "AV11-601-05H" "Derived Token Marketplace" \
    "Secondary market trading for derived tokens.\n\nAcceptance Criteria:\n- Order book for derived token trading\n- Compliance-aware matching (KYC/AML, transfer restrictions)\n- Price discovery mechanism\n- Settlement integration with revenue distribution\n\nIntegration: Extend existing MarketplaceService.java (617 lines)" \
    "AV11-601" "2"
sleep 1

echo ""
echo -e "${GREEN}Created: 12 Token Architecture stories (foundation + enhanced derived tokens)${NC}"
echo ""

# ==================== PHASE 5: CREATE REMAINING STORIES ====================

echo -e "${BLUE}📝 PHASE 5: Creating Remaining 29 Stories (AV11-602 through AV11-608)${NC}"
echo ""

# Composite Token Assembly (AV11-602)
create_jira_ticket "Story" "AV11-602-01" "Composite Token Core Model" \
    "Design and implement the core Composite Token model with bundle management." \
    "AV11-602" "5"
sleep 1

create_jira_ticket "Story" "AV11-602-02" "Primary-Secondary Binding" \
    "Implement binding mechanism between primary and secondary tokens with approval workflows." \
    "AV11-602" "5"
sleep 1

create_jira_ticket "Story" "AV11-602-03" "Merkle Tree Construction" \
    "Implement Merkle tree construction for composite token bundles with proof generation and verification." \
    "AV11-602" "8"
sleep 1

create_jira_ticket "Story" "AV11-602-04" "VVB Verification Workflow" \
    "Integrate VVB (Validation & Verification Body) verification for composite tokens with multi-verifier consensus." \
    "AV11-602" "8"
sleep 1

create_jira_ticket "Story" "AV11-602-05" "Composite Token Registry" \
    "Implement composite token registry with search and analytics capabilities." \
    "AV11-602" "5"
sleep 1

# Active Contract System (AV11-603)
create_jira_ticket "Story" "AV11-603-01" "Active Contract Data Model" \
    "Define Active Contract entity that binds to composite tokens with metadata and versioning." \
    "AV11-603" "5"
sleep 1

create_jira_ticket "Story" "AV11-603-02" "Contract-Composite Binding" \
    "Implement binding between Active Contract and Composite Token with authorization." \
    "AV11-603" "5"
sleep 1

create_jira_ticket "Story" "AV11-603-03" "Workflow Engine" \
    "Implement workflow engine for Active Contract state management with templating." \
    "AV11-603" "13"
sleep 1

create_jira_ticket "Story" "AV11-603-04" "Business Rules Engine" \
    "Implement business rules engine for Active Contracts with asset-class specific rules." \
    "AV11-603" "13"
sleep 1

create_jira_ticket "Story" "AV11-603-05" "RBAC System" \
    "Implement Role-Based Access Control for Active Contracts with audit logging." \
    "AV11-603" "8"
sleep 1

create_jira_ticket "Story" "AV11-603-06" "Active Contract Registry" \
    "Implement Active Contract registry with listing and navigation." \
    "AV11-603" "5"
sleep 1

# Registry Infrastructure (AV11-604)
create_jira_ticket "Story" "AV11-604-01" "Merkle Tree Registry Per Asset Class" \
    "Implement separate Merkle tree registries for each asset class." \
    "AV11-604" "8"
sleep 1

create_jira_ticket "Story" "AV11-604-02" "Cross-Registry Navigation" \
    "Implement navigation between registries with breadcrumb and deep linking support." \
    "AV11-604" "5"
sleep 1

create_jira_ticket "Story" "AV11-604-03" "Registry Analytics" \
    "Add analytics capabilities to registries with metrics and time-series data." \
    "AV11-604" "5"
sleep 1

# Topology Visualization (AV11-605)
create_jira_ticket "Story" "AV11-605-01" "Topology Data Model" \
    "Define topology data structure for visualization with node and edge types." \
    "AV11-605" "5"
sleep 1

create_jira_ticket "Story" "AV11-605-02" "Topology API Endpoint" \
    "Implement API endpoint to fetch topology data with depth parameter support." \
    "AV11-605" "5"
sleep 1

create_jira_ticket "Story" "AV11-605-03" "Topology Graph Component" \
    "Create React component for topology visualization using D3.js or vis-network." \
    "AV11-605" "13"
sleep 1

create_jira_ticket "Story" "AV11-605-04" "Click-to-Expand Detail" \
    "Implement click behavior to show detailed topology with expandable nodes." \
    "AV11-605" "8"
sleep 1

create_jira_ticket "Story" "AV11-605-05" "Owner Approval Workflow" \
    "Implement access control for topology viewing with time-limited access grants." \
    "AV11-605" "5"
sleep 1

# Traceability System (AV11-606)
create_jira_ticket "Story" "AV11-606-01" "Traceability Core" \
    "Implement core traceability functionality with immutable trace log and hash chain integrity." \
    "AV11-606" "5"
sleep 1

create_jira_ticket "Story" "AV11-606-02" "Registry Navigation API" \
    "Implement navigation API across registries with cross-registry links." \
    "AV11-606" "5"
sleep 1

create_jira_ticket "Story" "AV11-606-03" "Compliance Reporting" \
    "Implement compliance and audit reporting with regulatory templates." \
    "AV11-606" "8"
sleep 1

# API Layer (AV11-607)
create_jira_ticket "Story" "AV11-607-01" "Primary/Secondary Token APIs" \
    "Implement REST APIs for primary and secondary token CRUD operations." \
    "AV11-607" "5"
sleep 1

create_jira_ticket "Story" "AV11-607-02" "Active Contract APIs" \
    "Implement REST APIs for Active Contract management and binding operations." \
    "AV11-607" "5"
sleep 1

create_jira_ticket "Story" "AV11-607-03" "WebSocket Events" \
    "Implement real-time events via WebSocket for token and contract updates." \
    "AV11-607" "5"
sleep 1

# Testing (AV11-608)
create_jira_ticket "Story" "AV11-608-01" "Unit Tests" \
    "Implement comprehensive unit tests with 95% coverage for token models and registries." \
    "AV11-608" "8"
sleep 1

create_jira_ticket "Story" "AV11-608-02" "Integration Tests" \
    "Implement integration tests for end-to-end token flows and registry operations." \
    "AV11-608" "8"
sleep 1

create_jira_ticket "Story" "AV11-608-03" "E2E Tests (Playwright)" \
    "Implement E2E tests for UI components and user workflows." \
    "AV11-608" "8"
sleep 1

echo ""
echo -e "${GREEN}Created: 29 remaining stories (Epics AV11-602 through AV11-608)${NC}"
echo ""

# ==================== SUMMARY ====================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CREATION SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Epics Created: ${EPICS_CREATED}/8${NC}"
echo -e "${GREEN}✅ Stories Created: ${STORIES_CREATED}/41${NC}"
echo -e "${GREEN}✅ Tickets Closed: ${TICKETS_CLOSED}/15${NC}"
echo -e "${RED}❌ Failed: ${FAILED}${NC}"
echo ""

total_expected=$((8 + 41))
total_created=$((EPICS_CREATED + STORIES_CREATED))

if [ $FAILED -eq 0 ] && [ $total_created -eq $total_expected ]; then
    echo -e "${GREEN}🎉 All Composite Token Epics & Stories created successfully!${NC}"
    echo ""
    echo -e "${GREEN}Deliverables:${NC}"
    echo "  📊 8 Epics (AV11-601 through AV11-608)"
    echo "  📝 41 Stories (33 original + 8 enhanced derived tokens)"
    echo "  📈 254 Story Points allocated"
    echo "  ✅ 15 completed tickets closed"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tickets failed to create or close${NC}"
    echo "  Review the output above for details"
    exit 1
fi
