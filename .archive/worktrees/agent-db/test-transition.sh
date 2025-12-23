#!/usr/bin/env bash

JIRA_EMAIL="subbu@aurigraph.io"
JIRA_API_TOKEN="ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
AUTH=$(echo -n "${JIRA_EMAIL}:${JIRA_API_TOKEN}" | base64)

echo "Getting transitions for AV11-382..."
curl -s -X GET \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic ${AUTH}" \
  'https://aurigraphdlt.atlassian.net/rest/api/3/issue/AV11-382/transitions' | jq '.'

echo ""
echo "Testing transition without resolution..."
curl -v -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic ${AUTH}" \
  -d '{"transition":{"id":"31"}}' \
  'https://aurigraphdlt.atlassian.net/rest/api/3/issue/AV11-382/transitions' 2>&1 | grep "< HTTP"
