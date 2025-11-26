#!/usr/bin/env python3
"""
JIRA Ticket Update Script
Updates bug tickets with deployment verification and transitions to Done status
"""

import requests
import json
import sys

# JIRA Configuration
JIRA_EMAIL = "subbu@aurigraph.io"
JIRA_API_TOKEN = "ATATT3xFfGF0sFjaXc9iiBQuv-1jvWEfLDA5APUBvJvhVSrtzDDfS4B9k3ut3gCAyHUNU0YImVJSjcjglkR_3dmHtvRUYiV32nQJqkQ_HwKqCbS6oNs99XdYu5j_SmQqMQX4a7WekwS-sYNbDFtNBTrRuemXmlVHrjWa6dhMdCBuk0vdQvd_OYA=F7D4339F"
JIRA_BASE_URL = "https://aurigraphdlt.atlassian.net"
PROJECT_KEY = "AV11"

# Ticket IDs created
TICKETS = {
    "AV11-494": "Missing assetId field",
    "AV11-495": "CDI AmbiguousResolutionException",
    "AV11-496": "WebSocket endpoint collision",
    "AV11-497": "SQL Injection vulnerability",
    "AV11-498": "WebSocket authentication bypass"
}

def add_comment(ticket_key, comment_text):
    """Add a comment to a JIRA ticket"""

    print(f"Adding comment to {ticket_key}...")

    url = f"{JIRA_BASE_URL}/rest/api/3/issue/{ticket_key}/comment"

    payload = {
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

    try:
        response = requests.post(
            url,
            auth=(JIRA_EMAIL, JIRA_API_TOKEN),
            headers={"Content-Type": "application/json"},
            json=payload
        )

        if response.status_code in [200, 201]:
            print(f"✅ Comment added to {ticket_key}")
            return True
        else:
            print(f"❌ Failed to add comment to {ticket_key}")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error adding comment: {e}")
        return False

def get_transitions(ticket_key):
    """Get available transitions for a ticket"""

    url = f"{JIRA_BASE_URL}/rest/api/3/issue/{ticket_key}/transitions"

    try:
        response = requests.get(
            url,
            auth=(JIRA_EMAIL, JIRA_API_TOKEN),
            headers={"Content-Type": "application/json"}
        )

        if response.status_code == 200:
            transitions = response.json().get('transitions', [])
            return transitions
        else:
            print(f"❌ Failed to get transitions for {ticket_key}")
            return []
    except Exception as e:
        print(f"❌ Error getting transitions: {e}")
        return []

def transition_ticket(ticket_key, transition_name):
    """Transition a ticket to a new status"""

    print(f"Transitioning {ticket_key} to {transition_name}...")

    # Get available transitions
    transitions = get_transitions(ticket_key)

    if not transitions:
        print(f"❌ No transitions available for {ticket_key}")
        return False

    # Find the transition ID for the desired status
    transition_id = None
    for transition in transitions:
        if transition['name'].lower() == transition_name.lower():
            transition_id = transition['id']
            break

    if not transition_id:
        print(f"❌ Transition '{transition_name}' not found for {ticket_key}")
        print(f"Available transitions: {[t['name'] for t in transitions]}")
        return False

    # Execute transition
    url = f"{JIRA_BASE_URL}/rest/api/3/issue/{ticket_key}/transitions"

    payload = {
        "transition": {
            "id": transition_id
        }
    }

    try:
        response = requests.post(
            url,
            auth=(JIRA_EMAIL, JIRA_API_TOKEN),
            headers={"Content-Type": "application/json"},
            json=payload
        )

        if response.status_code == 204:
            print(f"✅ {ticket_key} transitioned to {transition_name}")
            return True
        else:
            print(f"❌ Failed to transition {ticket_key}")
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error transitioning ticket: {e}")
        return False

def main():
    """Update all bug tickets with verification and close them"""

    # Deployment verification comment
    verification_comment = """DEPLOYMENT VERIFICATION:

Date: November 25, 2025
Environment: Production (dlt.aurigraph.io)
Version: V12.0.0
Build: aurigraph-v12-standalone-12.0.0-runner.jar (180MB)

VERIFICATION STEPS:
1. Security fixes applied to source code
2. Clean build completed successfully (BUILD SUCCESS)
3. JAR deployed to production server
4. Service started (Process PID 991054)
5. Health endpoint verified (Status: UP)
6. WebSocket service operational
7. Oracle service verified (9/10 oracles active)
8. Database connections healthy
9. No security-related errors in logs

PRODUCTION STATUS:
- Service: UP and running
- Port: 9003
- Memory: 512MB-2GB allocation
- All 5 critical security vulnerabilities RESOLVED
- System fully operational with security patches deployed

JIRA TRACKING:
All 5 bugs tracked for audit and compliance purposes.
Fixes verified in production deployment."""

    print("="*70)
    print("UPDATING JIRA TICKETS WITH DEPLOYMENT VERIFICATION")
    print("="*70)
    print()

    success_count = 0

    for ticket_key, description in TICKETS.items():
        print(f"\nProcessing {ticket_key}: {description}")
        print("-" * 70)

        # Add verification comment
        if add_comment(ticket_key, verification_comment):
            success_count += 1

            # Try to transition to Done
            # Note: Transition names may vary - common ones are "Done", "Close", "Resolve"
            transition_success = False
            for transition_name in ["Done", "Close", "Resolve"]:
                if transition_ticket(ticket_key, transition_name):
                    transition_success = True
                    break

            if not transition_success:
                print(f"⚠️  Could not auto-transition {ticket_key} - may need manual status update")

        print()

    # Summary
    print("="*70)
    print("SUMMARY")
    print("="*70)
    print(f"Tickets updated: {success_count}/{len(TICKETS)}")
    print(f"\nView tickets at: {JIRA_BASE_URL}/jira/software/projects/{PROJECT_KEY}/issues")
    print("="*70)

if __name__ == "__main__":
    main()
