#!/usr/bin/env bash

JIRA_EMAIL="subbu@aurigraph.io"
JIRA_API_TOKEN="ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
AUTH=$(echo -n "${JIRA_EMAIL}:${JIRA_API_TOKEN}" | base64)

echo "Testing comment API..."
curl -v -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic ${AUTH}" \
  -d '{"body":{"type":"doc","version":1,"content":[{"type":"paragraph","content":[{"type":"text","text":"Test comment"}]}]}}' \
  'https://aurigraphdlt.atlassian.net/rest/api/3/issue/AV11-382/comment'
