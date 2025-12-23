#!/bin/bash

JIRA_EMAIL="subbu@aurigraph.io"
JIRA_API_TOKEN="ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"

echo "Testing JIRA search API:"
echo ""

response=$(curl -s -X GET \
    -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
    -H "Content-Type: application/json" \
    "$JIRA_BASE_URL/rest/api/3/search?jql=project=AV11&maxResults=1")

echo "Response (first 500 chars):"
echo "$response" | head -c 500
echo ""
echo ""

echo "Parsing total:"
echo "$response" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"Total tickets: {data.get('total', 'ERROR')}\")" 2>&1

