#!/bin/bash

JIRA_EMAIL="subbu@aurigraph.io"
JIRA_TOKEN="ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"

curl -s -u "$JIRA_EMAIL:$JIRA_TOKEN" \
  -H "Content-Type: application/json" \
  -X POST \
  "$JIRA_BASE_URL/rest/api/3/search/jql" \
  -d '{
    "jql": "project=AV11",
    "maxResults": 1000,
    "fields": ["key", "summary", "description", "status", "issuetype", "assignee", "created", "updated", "priority", "labels", "components"]
  }'
