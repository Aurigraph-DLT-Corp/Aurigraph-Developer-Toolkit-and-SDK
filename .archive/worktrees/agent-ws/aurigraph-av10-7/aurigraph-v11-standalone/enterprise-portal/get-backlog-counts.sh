#!/bin/bash

JIRA_EMAIL="subbu@aurigraph.io"
JIRA_API_TOKEN="ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"

echo "Direct API call for backlog statistics:"
echo ""

# Try direct search
echo "1. Total tickets in AV11:"
curl -s -X GET \
    -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
    -H "Content-Type: application/json" \
    "$JIRA_BASE_URL/rest/api/3/search?jql=project=AV11&maxResults=0" | \
    python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"Total: {data.get('total', 'N/A')}\")"

echo ""
echo "2. Done tickets:"
curl -s -X GET \
    -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
    -H "Content-Type: application/json" \
    "$JIRA_BASE_URL/rest/api/3/search?jql=project=AV11%20AND%20status=Done&maxResults=0" | \
    python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"Done: {data.get('total', 'N/A')}\")"

echo ""
echo "3. To Do tickets:"
curl -s -X GET \
    -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
    -H "Content-Type: application/json" \
    "$JIRA_BASE_URL/rest/api/3/search?jql=project=AV11%20AND%20status=%22To%20Do%22&maxResults=0" | \
    python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"To Do: {data.get('total', 'N/A')}\")"

echo ""
echo "4. In Progress tickets:"
curl -s -X GET \
    -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
    -H "Content-Type: application/json" \
    "$JIRA_BASE_URL/rest/api/3/search?jql=project=AV11%20AND%20status=%22In%20Progress%22&maxResults=0" | \
    python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"In Progress: {data.get('total', 'N/A')}\")"

echo ""
echo "5. Checking if project exists:"
curl -s -X GET \
    -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
    -H "Content-Type: application/json" \
    "$JIRA_BASE_URL/rest/api/3/project/AV11" | \
    python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"Project: {data.get('name', 'N/A')}, Key: {data.get('key', 'N/A')}\")"

