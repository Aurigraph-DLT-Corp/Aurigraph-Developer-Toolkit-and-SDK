#!/bin/bash
# Bulk JIRA Ticket Status Update Script (v2)
# Transitions verified tickets from "To Do" to "Done" status
# December 22, 2025

set -e

# Configuration
JIRA_EMAIL="${JIRA_EMAIL:-subbu@aurigraph.io}"
JIRA_API_TOKEN="${JIRA_API_TOKEN}"
JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Counters
SUCCESS=0
FAILED=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}JIRA Bulk Ticket Status Update (v2)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check credentials
if [ -z "$JIRA_API_TOKEN" ]; then
    echo -e "${RED}❌ Error: JIRA_API_TOKEN not set${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Credentials configured${NC}"
echo ""

# Function to update ticket with simple payload
update_ticket() {
    local ticket_key=$1
    local description=$2

    echo -ne "${YELLOW}Updating ${ticket_key}... ${NC}"

    # Use simpler transition payload
    local payload='{"transition":{"id":"31"}}'

    # Execute update
    http_code=$(curl -s -X POST \
        "${JIRA_BASE_URL}/rest/api/3/issue/${ticket_key}/transitions" \
        -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "$payload" \
        -w "%{http_code}" \
        -o /dev/null)

    if [[ "$http_code" == "204" ]] || [[ "$http_code" == "200" ]]; then
        echo -e "${GREEN}✅ [HTTP $http_code]${NC}"
        ((SUCCESS++))
        return 0
    else
        echo -e "${RED}❌ [HTTP $http_code]${NC}"
        ((FAILED++))
        return 1
    fi
}

# ==================== UPDATE 15 TICKETS ====================

echo -e "${BLUE}📋 TESTING & QUALITY (3 tickets)${NC}"
update_ticket "AV11-584" "File Upload Hash Verification"
update_ticket "AV11-585" "File Upload Test Suite"
update_ticket "AV11-541" "TransactionScoringModelTest Fix"
echo ""

echo -e "${BLUE}🎯 FEATURE IMPLEMENTATION (5 tickets)${NC}"
update_ticket "AV11-452" "RWAT Implementation"
update_ticket "AV11-455" "VVB Verification Service"
update_ticket "AV11-460" "Ricardian Smart Contracts"
update_ticket "AV11-476" "CURBy Quantum Cryptography"
update_ticket "AV11-567" "Real API Integration"
echo ""

echo -e "${BLUE}🔌 API & INTEGRATION (1 ticket)${NC}"
update_ticket "AV11-550" "JIRA API Search Endpoint"
echo ""

echo -e "${BLUE}🚀 INFRASTRUCTURE & DEPLOYMENT (3 tickets)${NC}"
update_ticket "AV11-303" "Cross-Chain Bridge Test Framework"
update_ticket "AV11-304" "Production Infrastructure Deployment"
update_ticket "AV11-305" "Deployment Strategy with Fallback"
echo ""

# ==================== SUMMARY ====================

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}UPDATE SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Successful: ${SUCCESS}/15${NC}"
echo -e "${RED}❌ Failed: ${FAILED}/15${NC}"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tickets updated successfully!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  ${FAILED} tickets failed${NC}"
    exit 1
fi
