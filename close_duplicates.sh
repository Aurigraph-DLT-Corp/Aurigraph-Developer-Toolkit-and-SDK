#!/bin/bash
#
# JIRA Duplicate Ticket Closure Script
# Closes high-confidence duplicate tickets identified in the analysis
#
# Usage: ./close_duplicates.sh
#

# JIRA Configuration
JIRA_URL="https://aurigraphdlt.atlassian.net"
JIRA_EMAIL="subbu@aurigraph.io"
JIRA_API_TOKEN="ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "JIRA Duplicate Ticket Closure Script"
echo "=========================================="
echo ""

# Function to close a ticket as duplicate
close_as_duplicate() {
    local ticket_to_close=$1
    local duplicate_of=$2
    local reason=$3

    echo -e "${YELLOW}Processing: $ticket_to_close → duplicate of $duplicate_of${NC}"

    # First, add a comment explaining why it's being closed
    comment_response=$(curl -s -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
        -X POST \
        -H "Content-Type: application/json" \
        "${JIRA_URL}/rest/api/3/issue/${ticket_to_close}/comment" \
        -d '{
            "body": {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": "Closing as duplicate of '"${duplicate_of}"'. Reason: '"${reason}"'\n\nIdentified by automated duplicate detection analysis on 2025-10-29."
                            }
                        ]
                    }
                ]
            }
        }')

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Comment added${NC}"
    else
        echo -e "${RED}✗ Failed to add comment${NC}"
        return 1
    fi

    # Add duplicate link
    link_response=$(curl -s -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
        -X POST \
        -H "Content-Type: application/json" \
        "${JIRA_URL}/rest/api/3/issueLink" \
        -d '{
            "type": {
                "name": "Duplicate"
            },
            "inwardIssue": {
                "key": "'"${duplicate_of}"'"
            },
            "outwardIssue": {
                "key": "'"${ticket_to_close}"'"
            }
        }')

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Duplicate link created${NC}"
    else
        echo -e "${YELLOW}⚠ Link may already exist${NC}"
    fi

    # Transition to Done status (status ID may vary)
    # First, get available transitions
    transitions=$(curl -s -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
        -X GET \
        "${JIRA_URL}/rest/api/3/issue/${ticket_to_close}/transitions")

    # Try to find "Done" transition ID
    done_transition_id=$(echo "$transitions" | grep -o '"id":"[0-9]*","name":"Done"' | head -1 | grep -o '"id":"[0-9]*"' | grep -o '[0-9]*')

    if [ -n "$done_transition_id" ]; then
        transition_response=$(curl -s -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
            -X POST \
            -H "Content-Type: application/json" \
            "${JIRA_URL}/rest/api/3/issue/${ticket_to_close}/transitions" \
            -d '{
                "transition": {
                    "id": "'"${done_transition_id}"'"
                }
            }')

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Status changed to Done${NC}"
        else
            echo -e "${RED}✗ Failed to change status${NC}"
        fi
    else
        echo -e "${YELLOW}⚠ Could not find Done transition. Please close manually.${NC}"
    fi

    echo -e "${GREEN}✓ Ticket ${ticket_to_close} processed successfully${NC}"
    echo ""
}

# Function to delete test tickets
delete_ticket() {
    local ticket=$1

    echo -e "${YELLOW}Deleting test ticket: $ticket${NC}"

    delete_response=$(curl -s -u "${JIRA_EMAIL}:${JIRA_API_TOKEN}" \
        -X DELETE \
        "${JIRA_URL}/rest/api/3/issue/${ticket}")

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Ticket ${ticket} deleted${NC}"
    else
        echo -e "${RED}✗ Failed to delete ticket ${ticket}${NC}"
    fi
    echo ""
}

# Main execution
echo "This script will close the following high-confidence duplicate tickets:"
echo ""
echo "1. AV11-408 (duplicate of AV11-382) - Demo App & User Documentation"
echo "2. AV11-381 (duplicate of AV11-403) - API Endpoints & External Integration"
echo "3. AV11-397 (duplicate of AV11-380) - 3rd Party Verification Service"
echo "4. AV11-390 (duplicate of AV11-379) - Real-World Asset Tokenization"
echo "5. AV11-383 (duplicate of AV11-378) - Ricardian Smart Contracts"
echo ""
echo "And delete test tickets:"
echo "6. AV11-443 (Test)"
echo "7. AV11-442 (Test)"
echo ""
read -p "Do you want to proceed? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Operation cancelled."
    exit 0
fi

echo ""
echo "Processing duplicates..."
echo ""

# Close high-confidence duplicates
close_as_duplicate "AV11-408" "AV11-382" "100% identical summary and description - Demo App & User Documentation"
close_as_duplicate "AV11-381" "AV11-403" "100% identical summary and description - API Endpoints (AV11-403 already Done)"
close_as_duplicate "AV11-397" "AV11-380" "100% identical summary and description - 3rd Party Verification Service"
close_as_duplicate "AV11-390" "AV11-379" "100% identical summary and description - Real-World Asset Tokenization"
close_as_duplicate "AV11-383" "AV11-378" "100% identical summary and description - Ricardian Smart Contracts"

# Delete test tickets
echo "Deleting test tickets..."
delete_ticket "AV11-443"
delete_ticket "AV11-442"

echo ""
echo "=========================================="
echo "Processing Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - 5 duplicate tickets closed"
echo "  - 2 test tickets deleted"
echo ""
echo "Next steps:"
echo "  1. Review the closed tickets in JIRA"
echo "  2. Fix incorrect JIRA links (see JIRA_DUPLICATE_ANALYSIS_SUMMARY.md)"
echo "  3. Implement duplicate prevention guidelines"
echo ""
