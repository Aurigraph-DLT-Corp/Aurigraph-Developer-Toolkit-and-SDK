#!/bin/bash

#############################################################################
# JIRA Bulk Update Script - Session November 13, 2025
# Purpose: Update 16 JIRA tickets related to Portal v4.6.0 and Compliance Framework
#############################################################################

# Configuration
JIRA_URL="https://aurigraphdlt.atlassian.net"
JIRA_EMAIL="subbu@aurigraph.io"
JIRA_TOKEN="ATATT3xFfGF0sFjaXc9iiBQuv-1jvWEfLDA5APUBvJvhVSrtzDDfS4B9k3ut3gCAyHUNU0YImVJSjcjglkR_3dmHtvRUYiV32nQJqkQ_HwKqCbS6oNs99XdYu5j_SmQqMQX4a7WekwS-sYNbDFtNBTrRuemXmlVHrjWa6dhMdCBuk0vdQvd_OYA=F7D4339F"

SUCCESS_COUNT=0
FAILED_COUNT=0

# Test JIRA connection and get ticket info
echo "Testing JIRA connection..."
TEST_RESPONSE=$(curl -s -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
    -X GET \
    "${JIRA_URL}/rest/api/3/issue/AV11-292")

if echo "$TEST_RESPONSE" | grep -q "\"key\""; then
    echo "✅ JIRA connection successful"
else
    echo "❌ JIRA connection failed"
    echo "$TEST_RESPONSE"
    exit 1
fi

# Get available transitions for AV11-292
echo -e "\nFetching available transitions for AV11-292..."
TRANSITIONS=$(curl -s -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
    -X GET \
    "${JIRA_URL}/rest/api/3/issue/AV11-292/transitions")

echo "$TRANSITIONS" | grep -o '"id":"[^"]*","name":"[^"]*"' | head -10

# Extract the "Done" transition ID
DONE_TRANSITION_ID=$(echo "$TRANSITIONS" | grep -o '"id":"[^"]*","name":"Done"' | head -1 | sed 's/"id":"\([^"]*\)".*/\1/')

echo -e "\nDone transition ID: $DONE_TRANSITION_ID"

if [ -z "$DONE_TRANSITION_ID" ]; then
    echo "❌ Could not find 'Done' transition"
    echo "Available transitions:"
    echo "$TRANSITIONS" | jq '.transitions[] | {id, name}' 2>/dev/null || echo "$TRANSITIONS"
    exit 1
fi

# List of tickets to update
echo -e "\n==============================================================================="
echo "Updating 9 Portal Feature Tickets to 'Done' status"
echo "==============================================================================="

PORTAL_TICKETS=("AV11-264" "AV11-208" "AV11-209" "AV11-210" "AV11-211" "AV11-212" "AV11-213" "AV11-214" "AV11-292")

for TICKET in "${PORTAL_TICKETS[@]}"; do
    echo -e "\n📝 Updating $TICKET..."
    
    # Prepare transition payload
    TRANSITION_PAYLOAD=$(cat <<PAYLOAD
{
  "transition": {
    "id": "$DONE_TRANSITION_ID"
  }
}
PAYLOAD
)

    # Make the API call
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -u "${JIRA_EMAIL}:${JIRA_TOKEN}" \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$TRANSITION_PAYLOAD" \
        "${JIRA_URL}/rest/api/3/issue/${TICKET}/transitions")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [[ "$HTTP_CODE" == "204" || "$HTTP_CODE" == "200" ]]; then
        echo "✅ Successfully updated $TICKET to Done"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo "❌ Failed to update $TICKET (HTTP $HTTP_CODE)"
        if [ ! -z "$BODY" ]; then
            echo "Response: $BODY"
        fi
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
    
    sleep 0.5  # Rate limiting
done

# Summary
echo -e "\n==============================================================================="
echo "Update Summary"
echo "==============================================================================="
echo "Total tickets processed: ${#PORTAL_TICKETS[@]}"
echo "✅ Successful: $SUCCESS_COUNT"
echo "❌ Failed: $FAILED_COUNT"
echo ""

if [ $FAILED_COUNT -eq 0 ]; then
    echo "✅ All JIRA tickets updated successfully!"
    echo ""
    echo "⏳ Next steps:"
    echo "  1. Verify all tickets show 'Done' status in JIRA dashboard"
    echo "  2. Create 7 new compliance framework tickets (see JIRA-UPDATES-SESSION-NOV13-2025.md)"
    echo "  3. Link commits to tickets"
    exit 0
else
    echo "⚠️  Some updates failed. Please review above for details."
    exit 1
fi
