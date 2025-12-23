#!/usr/bin/env python3
"""
Update JIRA ticket AV11-282 to Done status
"""

import requests
import json

# JIRA credentials
JIRA_EMAIL = "subbu@aurigraph.io"
JIRA_API_TOKEN = "ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
JIRA_BASE_URL = "https://aurigraphdlt.atlassian.net"

def update_jira_ticket(ticket_key, transition_name, comment_text):
    """Update JIRA ticket status and add comment"""

    # Get available transitions
    transitions_url = f"{JIRA_BASE_URL}/rest/api/3/issue/{ticket_key}/transitions"
    response = requests.get(
        transitions_url,
        auth=(JIRA_EMAIL, JIRA_API_TOKEN),
        headers={"Accept": "application/json"}
    )

    if response.status_code != 200:
        print(f"❌ Failed to get transitions: {response.status_code}")
        print(response.text)
        return False

    transitions = response.json()["transitions"]
    transition_id = None

    for trans in transitions:
        if trans["name"].lower() == transition_name.lower():
            transition_id = trans["id"]
            break

    if not transition_id:
        print(f"❌ Transition '{transition_name}' not found")
        print(f"Available transitions: {[t['name'] for t in transitions]}")
        return False

    # Transition ticket
    transition_payload = {
        "transition": {
            "id": transition_id
        }
    }

    response = requests.post(
        transitions_url,
        auth=(JIRA_EMAIL, JIRA_API_TOKEN),
        headers={"Accept": "application/json", "Content-Type": "application/json"},
        json=transition_payload
    )

    if response.status_code not in [200, 204]:
        print(f"❌ Failed to transition ticket: {response.status_code}")
        print(response.text)
        return False

    print(f"✅ Ticket {ticket_key} transitioned to {transition_name}")

    # Add comment
    comment_url = f"{JIRA_BASE_URL}/rest/api/3/issue/{ticket_key}/comment"
    comment_payload = {
        "body": {
            "type": "doc",
            "version": 1,
            "content": [
                {
                    "type": "paragraph",
                    "content": [
                        {
                            "type": "text",
                            "text": comment_text
                        }
                    ]
                }
            ]
        }
    }

    response = requests.post(
        comment_url,
        auth=(JIRA_EMAIL, JIRA_API_TOKEN),
        headers={"Accept": "application/json", "Content-Type": "application/json"},
        json=comment_payload
    )

    if response.status_code not in [200, 201]:
        print(f"❌ Failed to add comment: {response.status_code}")
        print(response.text)
        return False

    print(f"✅ Comment added to {ticket_key}")
    return True

# Update AV11-282
comment = """✅ Bridge Transaction History API Implementation Complete

**Files Created:**
- BridgeTransaction.java (380 lines) - Transaction data model
- BridgeTransactionHistory.java (150 lines) - History with pagination
- BridgeHistoryService.java (320 lines) - Service layer
- BridgeHistoryResource.java (250 lines) - REST API

**Endpoints:**
- GET /api/v11/bridge/history - Paginated history with filters
- GET /api/v11/bridge/history/{txId} - Transaction by ID
- GET /api/v11/bridge/history/user/{address} - User transactions
- GET /api/v11/bridge/history/summary - Aggregated statistics

**Features:**
- 500 simulated transactions across 5 chains
- Pagination (1-100 records per page)
- 7 filter criteria (chain, asset, status, amount, user)
- Transaction details (timestamps, fees, confirmations, errors)
- Gas efficiency and success rate tracking
- Average duration: 18-28 seconds per transfer

**Status:**
- Compilation: BUILD SUCCESS (675 source files)
- Committed: 49cee02a
- Sprint 12: 5/5 tickets COMPLETE (100%)
- Epic AV11-291: Cross-Chain Bridge Integration COMPLETE

🎉 SPRINT 12 COMPLETE - All quick win tickets delivered!

Implementation ready for integration and testing."""

success = update_jira_ticket("AV11-282", "Done", comment)

if success:
    print("\n🎉 AV11-282 updated to Done successfully!")
    print("🎊 SPRINT 12 COMPLETE - All 5 tickets done!")
else:
    print("\n❌ Failed to update AV11-282")
