#!/usr/bin/env bash

JIRA_EMAIL="subbu@aurigraph.io"
JIRA_API_TOKEN="ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
AUTH=$(echo -n "${JIRA_EMAIL}:${JIRA_API_TOKEN}" | base64)

TICKETS=(
    "AV11-382:AV11-408"
    "AV11-381:AV11-403"
    "AV11-380:AV11-397"
    "AV11-379:AV11-390"
    "AV11-378:AV11-383"
)

echo "Verifying closed duplicate tickets..."
echo "======================================"
echo ""

for ticket_pair in "${TICKETS[@]}"; do
    duplicate=$(echo "$ticket_pair" | cut -d':' -f1)
    main_ticket=$(echo "$ticket_pair" | cut -d':' -f2)

    echo "Checking ${duplicate}..."
    response=$(curl -s -X GET \
        -H "Content-Type: application/json" \
        -H "Authorization: Basic ${AUTH}" \
        "https://aurigraphdlt.atlassian.net/rest/api/3/issue/${duplicate}?fields=status,resolution,labels,issuelinks")

    status=$(echo "$response" | jq -r '.fields.status.name')
    resolution=$(echo "$response" | jq -r '.fields.resolution.name')
    labels=$(echo "$response" | jq -r '.fields.labels[]' | grep "duplicate-resolved")
    links=$(echo "$response" | jq -r '.fields.issuelinks[] | select(.type.name=="Duplicate") | .outwardIssue.key')

    echo "  Status: ${status}"
    echo "  Resolution: ${resolution}"
    echo "  Has duplicate-resolved label: $([ -n "$labels" ] && echo "Yes" || echo "No")"
    echo "  Linked to: ${links}"
    echo ""
done

echo "Verification complete!"
