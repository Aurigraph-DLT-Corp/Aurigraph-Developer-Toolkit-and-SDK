#!/bin/bash

JIRA_EMAIL="subbu@aurigraph.io"
JIRA_API_TOKEN="ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"

jira_api_call() {
    curl -s -X "$1" \
        -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
        -H "Content-Type: application/json" \
        "$JIRA_BASE_URL/rest/api/3/$2"
}

echo "Checking transitions for AV11-415..."
transitions=$(jira_api_call "GET" "issue/AV11-415/transitions")
echo "$transitions" | python3 -c "import sys, json; data=json.load(sys.stdin); [print(f\"ID: {t['id']}, Name: {t['name']}, To: {t.get('to', {}).get('name', 'N/A')}\") for t in data.get('transitions', [])]"

echo ""
echo "Checking current status of AV11-415..."
status=$(jira_api_call "GET" "issue/AV11-415?fields=status")
echo "$status" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"Status: {data['fields']['status']['name']}\")"

echo ""
echo "Checking transitions for AV11-400..."
transitions=$(jira_api_call "GET" "issue/AV11-400/transitions")
echo "$transitions" | python3 -c "import sys, json; data=json.load(sys.stdin); [print(f\"ID: {t['id']}, Name: {t['name']}, To: {t.get('to', {}).get('name', 'N/A')}\") for t in data.get('transitions', [])]"

