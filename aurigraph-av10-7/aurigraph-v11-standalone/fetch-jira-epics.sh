#!/bin/bash

# JIRA Configuration
JIRA_EMAIL="subbu@aurigraph.io"
JIRA_API_TOKEN="ATATT3xFfGF0sFjaXc9iiBQuv-1jvWEfLDA5APUBvJvhVSrtzDDfS4B9k3ut3gCAyHUNU0YImVJSjcjglkR_3dmHtvRUYiV32nQJqkQ_HwKqCbS6oNs99XdYu5j_SmQqMQX4a7WekwS-sYNbDFtNBTrRuemXmlVHrjWa6dhMdCBuk0vdQvd_OYA=F7D4339F"
JIRA_BASE_URL="https://aurigraphdlt.atlassian.net"
PROJECT_KEY="AV11"

echo "Fetching JIRA Epics AV11-463 to AV11-493..."
echo ""

# Fetch epics in the range
for i in {463..493}; do
    ticket_key="${PROJECT_KEY}-${i}"
    
    response=$(curl -s -X GET \
        -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
        -H "Content-Type: application/json" \
        "${JIRA_BASE_URL}/rest/api/3/issue/${ticket_key}?fields=summary,description,status,issuetype,priority,labels")
    
    # Check if ticket exists
    if echo "$response" | jq -e '.key' > /dev/null 2>&1; then
        summary=$(echo "$response" | jq -r '.fields.summary // "N/A"')
        status=$(echo "$response" | jq -r '.fields.status.name // "N/A"')
        issuetype=$(echo "$response" | jq -r '.fields.issuetype.name // "N/A"')
        priority=$(echo "$response" | jq -r '.fields.priority.name // "N/A"')
        
        echo "[$ticket_key] $issuetype - $summary"
        echo "  Status: $status | Priority: $priority"
        echo ""
    fi
done
