#!/bin/bash

#############################################################################
# JIRA Bulk Update Script - Session November 13, 2025
# Purpose: Update 16 JIRA tickets related to Portal v4.6.0 and Compliance Framework
# Author: Claude Code AI
# Date: November 13, 2025
#############################################################################

set -e

# Configuration
JIRA_URL="https://aurigraphdlt.atlassian.net"
JIRA_EMAIL="subbu@aurigraph.io"
JIRA_TOKEN="ATATT3xFfGF0sFjaXc9iiBQuv-1jvWEfLDA5APUBvJvhVSrtzDDfS4B9k3ut3gCAyHUNU0YImVJSjcjglkR_3dmHtvRUYiV32nQJqkQ_HwKqCbS6oNs99XdYu5j_SmQqMQX4a7WekwS-sYNbDFtNBTrRuemXmlVHrjWa6dhMdCBuk0vdQvd_OYA=F7D4339F"
PROJECT_KEY="AV11"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_TICKETS=0
SUCCESS_COUNT=0
FAILED_COUNT=0
SKIPPED_COUNT=0

#############################################################################
# UTILITY FUNCTIONS
#############################################################################

log_header() {
    echo -e "\n${BLUE}===============================================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===============================================================================${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to update a JIRA ticket
update_jira_ticket() {
    local ticket=$1
    local status=$2
    local description=$3
    local assignee=${4:-"Unassigned"}

    TOTAL_TICKETS=$((TOTAL_TICKETS + 1))

    log_info "Processing ticket: $ticket (Status: $status)"

    # Prepare the JSON payload
    local payload=$(cat <<EOF
{
  "fields": {
    "status": {
      "name": "$status"
    }
  }
}
EOF
)

    # Make the API call
    local response=$(curl -s -w "\n%{http_code}" \
        -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
        -X PUT \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "${JIRA_URL}/rest/api/3/issue/${ticket}")

    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n-1)

    if [[ "$http_code" == "204" || "$http_code" == "200" ]]; then
        log_success "Updated $ticket to status: $status"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        return 0
    else
        log_error "Failed to update $ticket (HTTP $http_code)"
        echo "$body"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        return 1
    fi
}

# Function to add a comment to a ticket
add_jira_comment() {
    local ticket=$1
    local comment=$2

    log_info "Adding comment to $ticket..."

    local payload=$(cat <<EOF
{
  "body": {
    "version": 0,
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "$comment"
          }
        ]
      }
    ]
  }
}
EOF
)

    local response=$(curl -s -w "\n%{http_code}" \
        -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "${JIRA_URL}/rest/api/3/issue/${ticket}/comments")

    local http_code=$(echo "$response" | tail -n1)

    if [[ "$http_code" == "201" || "$http_code" == "200" ]]; then
        log_success "Comment added to $ticket"
        return 0
    else
        log_warning "Could not add comment to $ticket (HTTP $http_code)"
        return 1
    fi
}

# Function to get ticket details
get_ticket_details() {
    local ticket=$1

    log_info "Fetching details for $ticket..."

    local response=$(curl -s \
        -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
        -X GET \
        "${JIRA_URL}/rest/api/3/issue/${ticket}")

    echo "$response"
}

# Function to list available transitions
get_ticket_transitions() {
    local ticket=$1

    log_info "Fetching available transitions for $ticket..."

    local response=$(curl -s \
        -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
        -X GET \
        "${JIRA_URL}/rest/api/3/issue/${ticket}/transitions")

    echo "$response"
}

#############################################################################
# MAIN EXECUTION
#############################################################################

main() {
    log_header "JIRA Bulk Update - Session November 13, 2025"
    log_info "Processing 16 tickets for Portal v4.6.0 and Compliance Framework"
    echo ""

    # PHASE 1: Update Portal Tickets (AV11-264, 208-214, 292)
    log_header "PHASE 1: Enterprise Portal Tickets (Status: In Progress → Done)"

    # Get ticket details and available transitions
    log_info "Verifying JIRA connectivity..."
    local test_response=$(get_ticket_details "AV11-292")
    if echo "$test_response" | grep -q "\"key\""; then
        log_success "JIRA connection successful"
    else
        log_error "Failed to connect to JIRA"
        exit 1
    fi

    # List of portal tickets to update
    local portal_tickets=("AV11-264" "AV11-208" "AV11-209" "AV11-210" "AV11-211" "AV11-212" "AV11-213" "AV11-214" "AV11-292")

    for ticket in "${portal_tickets[@]}"; do
        update_jira_ticket "$ticket" "Done" "Portal feature update"
        sleep 1  # Rate limiting
    done

    # PHASE 2: Create new Compliance Framework tickets
    log_header "PHASE 2: Create New Compliance Framework Tickets"

    # Note: Creating new tickets requires a different API endpoint
    # For now, we'll document the tickets to be created manually or via separate script

    log_warning "Compliance framework tickets require manual creation or separate script"
    log_info "Tickets to create:"
    echo "  - AV11-NEW-5: ERC-3643 Compliance Framework Implementation"
    echo "  - AV11-NEW-6: Identity Management & KYC/AML Integration"
    echo "  - AV11-NEW-7: Transfer Compliance & Approval Workflow"
    echo "  - AV11-NEW-8: OFAC Sanctions Oracle Integration"
    echo "  - AV11-NEW-9: Compliance Reporting Module"
    echo "  - AV11-NEW-10: Smart Contract Bridge for Compliance"
    echo "  - AV11-NEW-11: Compliance Monitoring Dashboard (Backend)"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 7))

    # PHASE 3: Summary
    log_header "Update Summary"
    echo ""
    echo "Total tickets processed: $TOTAL_TICKETS"
    echo -e "Successful updates:    ${GREEN}$SUCCESS_COUNT${NC}"
    echo -e "Failed updates:        ${RED}$FAILED_COUNT${NC}"
    echo -e "Skipped (manual):      ${YELLOW}$SKIPPED_COUNT${NC}"
    echo ""

    if [[ $FAILED_COUNT -eq 0 ]]; then
        log_success "All bulk updates completed successfully!"
    else
        log_error "Some updates failed. Please review above for details."
        exit 1
    fi
}

# Run main function
main "$@"
