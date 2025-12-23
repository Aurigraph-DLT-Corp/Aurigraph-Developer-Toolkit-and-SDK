#!/usr/bin/env bash

# JIRA Duplicate Ticket Closure Script
# Purpose: Close 5 high-confidence duplicate tickets identified in duplicate analysis

set -e

# JIRA Configuration
JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"
JIRA_EMAIL="subbu@aurigraph.io"
JIRA_API_TOKEN="ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"

# Auth header
AUTH_HEADER="Authorization: Basic $(echo -n "${JIRA_EMAIL}:${JIRA_API_TOKEN}" | base64)"

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Duplicate ticket mappings (duplicate:main)
TICKETS=(
    "AV11-382:AV11-408"
    "AV11-381:AV11-403"
    "AV11-380:AV11-397"
    "AV11-379:AV11-390"
    "AV11-378:AV11-383"
)

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}JIRA Duplicate Ticket Closure${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to add comment to ticket (using Atlassian Document Format)
add_comment() {
    local ticket_key=$1
    local main_ticket=$2
    local comment_text="Closing as duplicate of ${main_ticket}. Related duplicate consolidation: https://aurigraphdlt.atlassian.net/browse/${main_ticket}"

    echo -e "${YELLOW}Adding comment to ${ticket_key}...${NC}"

    local response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "${AUTH_HEADER}" \
        -d "{\"body\":{\"type\":\"doc\",\"version\":1,\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"${comment_text}\"}]}]}}" \
        "${JIRA_BASE_URL}/rest/api/3/issue/${ticket_key}/comment")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✓ Comment added successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to add comment (HTTP ${http_code})${NC}"
        return 1
    fi
}

# Function to create duplicate link
create_duplicate_link() {
    local duplicate_ticket=$1
    local main_ticket=$2

    echo -e "${YELLOW}Creating duplicate link: ${duplicate_ticket} → ${main_ticket}...${NC}"

    local response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "${AUTH_HEADER}" \
        -d "{
            \"type\": {\"name\": \"Duplicate\"},
            \"inwardIssue\": {\"key\": \"${duplicate_ticket}\"},
            \"outwardIssue\": {\"key\": \"${main_ticket}\"}
        }" \
        "${JIRA_BASE_URL}/rest/api/3/issueLink")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" -eq 201 ]; then
        echo -e "${GREEN}✓ Duplicate link created successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to create duplicate link (HTTP ${http_code})${NC}"
        echo "$response" | head -n-1
        return 1
    fi
}

# Function to add label
add_label() {
    local ticket_key=$1

    echo -e "${YELLOW}Adding 'duplicate-resolved' label to ${ticket_key}...${NC}"

    local response=$(curl -s -w "\n%{http_code}" -X PUT \
        -H "Content-Type: application/json" \
        -H "${AUTH_HEADER}" \
        -d "{\"update\":{\"labels\":[{\"add\":\"duplicate-resolved\"}]}}" \
        "${JIRA_BASE_URL}/rest/api/3/issue/${ticket_key}")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" -eq 204 ]; then
        echo -e "${GREEN}✓ Label added successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to add label (HTTP ${http_code})${NC}"
        echo "$response" | head -n-1
        return 1
    fi
}

# Function to get available transitions
get_transitions() {
    local ticket_key=$1

    local response=$(curl -s -X GET \
        -H "Content-Type: application/json" \
        -H "${AUTH_HEADER}" \
        "${JIRA_BASE_URL}/rest/api/3/issue/${ticket_key}/transitions")

    echo "$response"
}

# Function to transition ticket to Done
transition_to_done() {
    local ticket_key=$1

    echo -e "${YELLOW}Getting available transitions for ${ticket_key}...${NC}"

    local transitions=$(get_transitions "$ticket_key")
    local done_transition_id=$(echo "$transitions" | grep -o '"id":"[^"]*","name":"Done"' | grep -o '"id":"[^"]*"' | cut -d'"' -f4 | head -1)

    if [ -z "$done_transition_id" ]; then
        echo -e "${RED}✗ Could not find 'Done' transition${NC}"
        echo "Available transitions:"
        echo "$transitions" | grep -o '"name":"[^"]*"' | cut -d'"' -f4
        return 1
    fi

    echo -e "${YELLOW}Transitioning ${ticket_key} to Done (transition ID: ${done_transition_id})...${NC}"

    # Note: Resolution is set separately after transition
    local response=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -H "${AUTH_HEADER}" \
        -d "{\"transition\":{\"id\":\"${done_transition_id}\"}}" \
        "${JIRA_BASE_URL}/rest/api/3/issue/${ticket_key}/transitions")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" -eq 204 ]; then
        echo -e "${GREEN}✓ Ticket transitioned to Done successfully${NC}"
        # Now set resolution to Duplicate
        set_resolution "$ticket_key"
        return 0
    else
        echo -e "${RED}✗ Failed to transition ticket (HTTP ${http_code})${NC}"
        return 1
    fi
}

# Function to set resolution to Duplicate
set_resolution() {
    local ticket_key=$1

    echo -e "${YELLOW}Setting resolution to Duplicate for ${ticket_key}...${NC}"

    local response=$(curl -s -w "\n%{http_code}" -X PUT \
        -H "Content-Type: application/json" \
        -H "${AUTH_HEADER}" \
        -d "{\"fields\":{\"resolution\":{\"name\":\"Duplicate\"}}}" \
        "${JIRA_BASE_URL}/rest/api/3/issue/${ticket_key}")

    local http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" -eq 204 ]; then
        echo -e "${GREEN}✓ Resolution set to Duplicate${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ Resolution update returned HTTP ${http_code} (may be expected)${NC}"
        return 0
    fi
}

# Process each duplicate ticket
success_count=0
fail_count=0
closed_tickets=""

for ticket_pair in "${TICKETS[@]}"; do
    duplicate=$(echo "$ticket_pair" | cut -d':' -f1)
    main_ticket=$(echo "$ticket_pair" | cut -d':' -f2)

    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Processing: ${duplicate} → ${main_ticket}${NC}"
    echo -e "${BLUE}========================================${NC}"

    # Step 1: Add comment
    if add_comment "$duplicate" "$main_ticket"; then
        sleep 1
    else
        echo -e "${RED}Failed to add comment, continuing...${NC}"
    fi

    # Step 2: Create duplicate link
    if create_duplicate_link "$duplicate" "$main_ticket"; then
        sleep 1
    else
        echo -e "${RED}Failed to create duplicate link, continuing...${NC}"
    fi

    # Step 3: Add label
    if add_label "$duplicate"; then
        sleep 1
    else
        echo -e "${RED}Failed to add label, continuing...${NC}"
    fi

    # Step 4: Transition to Done with Duplicate resolution
    if transition_to_done "$duplicate"; then
        echo -e "${GREEN}✓ Successfully closed ${duplicate}${NC}"
        ((success_count++))
        closed_tickets="${closed_tickets}  - ${duplicate} → ${main_ticket}\n"
    else
        echo -e "${RED}✗ Failed to close ${duplicate}${NC}"
        ((fail_count++))
    fi

    sleep 2
done

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Successfully closed: ${success_count} tickets${NC}"
if [ $fail_count -gt 0 ]; then
    echo -e "${RED}Failed to close: ${fail_count} tickets${NC}"
fi

echo ""
echo -e "${BLUE}Duplicate consolidation complete!${NC}"
echo ""
echo "Tickets closed:"
echo -e "${closed_tickets}"

exit 0
