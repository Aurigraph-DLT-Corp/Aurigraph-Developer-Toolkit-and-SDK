#!/bin/bash

set -e

JIRA_EMAIL="subbu@aurigraph.io"
JIRA_API_TOKEN="ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

transition_ticket() {
    local ticket=$1
    local transition_id=$2
    
    local response=$(curl -s -w "\n%{http_code}" -X POST \
        -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"transition\": {\"id\": \"$transition_id\"}}" \
        "$JIRA_BASE_URL/rest/api/3/issue/$ticket/transitions")
    
    local http_code=$(echo "$response" | tail -n 1)
    local body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" == "204" ] || [ "$http_code" == "200" ]; then
        echo -e "  ${GREEN}✓ $ticket transitioned successfully (HTTP $http_code)${NC}"
        return 0
    else
        echo -e "  ${RED}✗ $ticket transition failed (HTTP $http_code)${NC}"
        echo "  Response: $body"
        return 1
    fi
}

echo "Fixing transitions for duplicate tickets..."
echo "==========================================="
echo ""

# Duplicate tickets to close (transition ID 31 = Done)
declare -a duplicates=(
    "AV11-415" "AV11-426" "AV11-412" "AV11-437"
    "AV11-440" "AV11-438" "AV11-446" "AV11-447"
    "AV11-448" "AV11-449"
)

success_count=0
for ticket in "${duplicates[@]}"; do
    echo "Closing $ticket..."
    if transition_ticket "$ticket" "31"; then
        ((success_count++))
    fi
    sleep 0.5
done

echo ""
echo "Fixing transitions for completed tickets..."
echo "==========================================="
echo ""

# Completed tickets to mark as Done (transition ID 31 = Done)
declare -a completed=(
    "AV11-400" "AV11-401" "AV11-402" "AV11-403" "AV11-404"
    "AV11-417" "AV11-433" "AV11-441" "AV11-442" "AV11-443"
    "AV11-444" "AV11-445" "AV11-450"
)

completed_count=0
for ticket in "${completed[@]}"; do
    echo "Completing $ticket..."
    if transition_ticket "$ticket" "31"; then
        ((completed_count++))
    fi
    sleep 0.5
done

echo ""
echo "==========================================="
echo "Summary:"
echo "  Duplicates closed: $success_count/${#duplicates[@]}"
echo "  Completed tickets: $completed_count/${#completed[@]}"
echo "==========================================="

