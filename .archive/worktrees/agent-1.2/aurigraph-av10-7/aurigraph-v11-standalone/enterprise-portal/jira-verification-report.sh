#!/bin/bash

# JIRA Verification Report
# Verify cleanup results and generate detailed report

set -e

JIRA_EMAIL="subbu@aurigraph.io"
JIRA_API_TOKEN="ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"
JIRA_PROJECT_KEY="AV11"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

jira_api_call() {
    local method=$1
    local endpoint=$2
    
    curl -s -X "$method" \
        -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
        -H "Content-Type: application/json" \
        "$JIRA_BASE_URL/rest/api/3/$endpoint"
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}JIRA Cleanup Verification Report${NC}"
echo -e "${BLUE}Generated: $(date)${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Verify closed duplicate tickets
echo -e "${YELLOW}Part 1: Verifying Closed Duplicate Tickets${NC}"
echo "--------------------------------------------"

declare -a closed_duplicates=(
    "AV11-415" "AV11-426" "AV11-412" "AV11-425" "AV11-437"
    "AV11-440" "AV11-438" "AV11-446" "AV11-447" "AV11-448"
    "AV11-449" "AV11-450"
)

closed_count=0
for ticket in "${closed_duplicates[@]}"; do
    result=$(jira_api_call "GET" "issue/$ticket?fields=status,resolution")
    status=$(echo "$result" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['fields']['status']['name'])" 2>/dev/null || echo "Unknown")
    
    if [ "$status" == "Done" ] || [ "$status" == "Closed" ]; then
        echo -e "  ${GREEN}✓ $ticket: $status${NC}"
        ((closed_count++))
    else
        echo -e "  ⚠ $ticket: $status (Expected: Done/Closed)"
    fi
done

echo ""
echo "Closed duplicates: $closed_count/${#closed_duplicates[@]}"
echo ""

# Verify completed tickets
echo -e "${YELLOW}Part 2: Verifying Completed Tickets${NC}"
echo "--------------------------------------------"

declare -a completed_tickets=(
    "AV11-400" "AV11-401" "AV11-402" "AV11-403" "AV11-404"
    "AV11-417" "AV11-420" "AV11-433" "AV11-441" "AV11-442"
    "AV11-443" "AV11-444" "AV11-445" "AV11-450"
)

done_count=0
for ticket in "${completed_tickets[@]}"; do
    result=$(jira_api_call "GET" "issue/$ticket?fields=status")
    status=$(echo "$result" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data['fields']['status']['name'])" 2>/dev/null || echo "Unknown")
    
    if [ "$status" == "Done" ]; then
        echo -e "  ${GREEN}✓ $ticket: DONE${NC}"
        ((done_count++))
    else
        echo -e "  ⚠ $ticket: $status (Expected: Done)"
    fi
done

echo ""
echo "Completed tickets marked DONE: $done_count/${#completed_tickets[@]}"
echo ""

# Get current backlog count
echo -e "${YELLOW}Part 3: Backlog Analysis${NC}"
echo "--------------------------------------------"

# Count tickets by status
backlog_jql="project=AV11 AND status NOT IN (Done, Closed)"
backlog_result=$(jira_api_call "GET" "search?jql=$(echo "$backlog_jql" | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read().strip()))")&maxResults=0")
backlog_count=$(echo "$backlog_result" | python3 -c "import sys, json; print(json.load(sys.stdin)['total'])" 2>/dev/null || echo "Unknown")

done_jql="project=AV11 AND status=Done"
done_result=$(jira_api_call "GET" "search?jql=$(echo "$done_jql" | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read().strip()))")&maxResults=0")
done_total=$(echo "$done_result" | python3 -c "import sys, json; print(json.load(sys.stdin)['total'])" 2>/dev/null || echo "Unknown")

total_jql="project=AV11"
total_result=$(jira_api_call "GET" "search?jql=$(echo "$total_jql" | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read().strip()))")&maxResults=0")
total_count=$(echo "$total_result" | python3 -c "import sys, json; print(json.load(sys.stdin)['total'])" 2>/dev/null || echo "Unknown")

echo "Total AV11 tickets: $total_count"
echo "Active backlog (not Done/Closed): $backlog_count"
echo "Completed (Done): $done_total"
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}Cleanup Results:${NC}"
echo "  ✓ Duplicate tickets closed: $closed_count/12"
echo "  ✓ Completed tickets marked DONE: $done_count/14"
echo ""
echo -e "${GREEN}Backlog Impact:${NC}"
echo "  Original estimate: 85 tickets"
echo "  Duplicates consolidated: 12 tickets"
echo "  Current active backlog: $backlog_count tickets"
echo "  Reduction: $((85 - backlog_count)) tickets"
echo ""
echo -e "${GREEN}Project Health:${NC}"
echo "  Total project tickets: $total_count"
echo "  Completed work: $done_total tickets"
if [ "$total_count" != "Unknown" ] && [ "$done_total" != "Unknown" ]; then
    completion_rate=$((done_total * 100 / total_count))
    echo "  Completion rate: $completion_rate%"
fi
echo ""

