#!/bin/bash

JIRA_EMAIL="subbu@aurigraph.io"
JIRA_API_TOKEN="ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"

echo "========================================"
echo "FINAL JIRA PROJECT STATISTICS"
echo "========================================"
echo ""

# Use new API endpoint
echo "Total tickets in project AV11:"
total=$(curl -s -X POST \
    -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"jql": "project=AV11", "maxResults": 0}' \
    "$JIRA_BASE_URL/rest/api/3/search/jql" | \
    python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('total', 0))" 2>/dev/null || echo "0")
echo "  Total: $total"

echo ""
echo "Done tickets:"
done=$(curl -s -X POST \
    -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"jql": "project=AV11 AND status=Done", "maxResults": 0}' \
    "$JIRA_BASE_URL/rest/api/3/search/jql" | \
    python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('total', 0))" 2>/dev/null || echo "0")
echo "  Done: $done"

echo ""
echo "To Do tickets:"
todo=$(curl -s -X POST \
    -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"jql": "project=AV11 AND status=\"To Do\"", "maxResults": 0}' \
    "$JIRA_BASE_URL/rest/api/3/search/jql" | \
    python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('total', 0))" 2>/dev/null || echo "0")
echo "  To Do: $todo"

echo ""
echo "In Progress tickets:"
inprogress=$(curl -s -X POST \
    -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"jql": "project=AV11 AND status=\"In Progress\"", "maxResults": 0}' \
    "$JIRA_BASE_URL/rest/api/3/search/jql" | \
    python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('total', 0))" 2>/dev/null || echo "0")
echo "  In Progress: $inprogress"

echo ""
echo "Active backlog (not Done):"
backlog=$(curl -s -X POST \
    -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"jql": "project=AV11 AND status!=Done", "maxResults": 0}' \
    "$JIRA_BASE_URL/rest/api/3/search/jql" | \
    python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('total', 0))" 2>/dev/null || echo "0")
echo "  Active backlog: $backlog"

echo ""
echo "========================================"
echo "SUMMARY"
echo "========================================"
echo ""
echo "Project Statistics:"
echo "  Total tickets:       $total"
echo "  Completed (Done):    $done"
echo "  In Progress:         $inprogress"
echo "  To Do:               $todo"
echo "  Active backlog:      $backlog"
echo ""

if [ "$total" != "0" ]; then
    completion_pct=$((done * 100 / total))
    echo "  Completion rate:     $completion_pct%"
fi

echo ""
echo "Cleanup Impact:"
echo "  Original backlog:    85 tickets"
echo "  Duplicates closed:   12 tickets"
echo "  Completed updated:   14 tickets"
echo "  Current backlog:     $backlog tickets"
echo "  Backlog reduction:   $((85 - backlog)) tickets"
echo ""

