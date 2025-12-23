#!/bin/bash

JIRA_EMAIL="subbu@aurigraph.io"
JIRA_TOKEN="ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"

# Fetch first batch to get total count
FIRST_BATCH=$(curl -s -u "$JIRA_EMAIL:$JIRA_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST \
  "$JIRA_BASE_URL/rest/api/3/search/jql" \
  -d '{
    "jql": "project=AV11 ORDER BY created DESC",
    "maxResults": 100,
    "startAt": 0,
    "fields": ["key", "summary", "description", "status", "issuetype", "assignee", "created", "updated", "priority", "labels", "components"]
  }')

TOTAL=$(echo "$FIRST_BATCH" | jq -r '.total')
echo "Total tickets: $TOTAL" >&2

# Initialize output array
echo '{"total": '$TOTAL', "issues": []}' > /tmp/all_tickets.json

# Fetch all pages
START_AT=0
MAX_RESULTS=100

while [ $START_AT -lt $TOTAL ]; do
  echo "Fetching tickets $START_AT to $((START_AT + MAX_RESULTS))..." >&2

  BATCH=$(curl -s -u "$JIRA_EMAIL:$JIRA_TOKEN" \
    -H "Content-Type: application/json" \
    -X POST \
    "$JIRA_BASE_URL/rest/api/3/search/jql" \
    -d '{
      "jql": "project=AV11 ORDER BY created DESC",
      "maxResults": '$MAX_RESULTS',
      "startAt": '$START_AT',
      "fields": ["key", "summary", "description", "status", "issuetype", "assignee", "created", "updated", "priority", "labels", "components"]
    }')

  # Merge issues
  jq -s '.[0].issues += .[1].issues | .[0]' /tmp/all_tickets.json <(echo "$BATCH") > /tmp/all_tickets_temp.json
  mv /tmp/all_tickets_temp.json /tmp/all_tickets.json

  START_AT=$((START_AT + MAX_RESULTS))
done

cat /tmp/all_tickets.json
