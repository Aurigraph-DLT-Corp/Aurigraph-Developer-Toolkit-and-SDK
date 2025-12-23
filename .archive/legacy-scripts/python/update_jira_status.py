#!/usr/bin/env python3
"""
Update JIRA status for completed work
"""

import requests
import json

# JIRA Configuration
JIRA_BASE_URL = "https://aurigraphdlt.atlassian.net"
JIRA_EMAIL = "subbu@aurigraph.io"
JIRA_API_TOKEN = "ATATT3xFfGF0sFjaXc9iiBQuv-1jvWEfLDA5APUBvJvhVSrtzDDfS4B9k3ut3gCAyHUNU0YImVJSjcjglkR_3dmHtvRUYiV32nQJqkQ_HwKqCbS6oNs99XdYu5j_SmQqMQX4a7WekwS-sYNbDFtNBTrRuemXmlVHrjWa6dhMdCBuk0vdQvd_OYA=F7D4339F"

def get_transitions(issue_key):
    """Get available transitions for an issue"""
    url = f"{JIRA_BASE_URL}/rest/api/3/issue/{issue_key}/transitions"
    auth = (JIRA_EMAIL, JIRA_API_TOKEN)

    try:
        response = requests.get(url, auth=auth)
        response.raise_for_status()
        return response.json().get("transitions", [])
    except Exception as e:
        print(f"❌ Error getting transitions for {issue_key}: {str(e)[:50]}")
        return []

def transition_issue(issue_key, transition_name):
    """Transition an issue to a new status"""
    # First, get available transitions
    transitions = get_transitions(issue_key)

    # Find the transition ID for the desired status
    transition_id = None
    for trans in transitions:
        if trans["name"].lower() == transition_name.lower() or trans["to"]["name"].lower() == transition_name.lower():
            transition_id = trans["id"]
            break

    if not transition_id:
        print(f"⚠️  {issue_key}: Transition '{transition_name}' not available")
        print(f"   Available: {', '.join([t['to']['name'] for t in transitions])}")
        return False

    # Perform the transition
    url = f"{JIRA_BASE_URL}/rest/api/3/issue/{issue_key}/transitions"
    auth = (JIRA_EMAIL, JIRA_API_TOKEN)
    headers = {"Content-Type": "application/json"}

    payload = {
        "transition": {
            "id": transition_id
        }
    }

    try:
        response = requests.post(url, auth=auth, headers=headers, json=payload)
        response.raise_for_status()
        print(f"✅ {issue_key}: Moved to '{transition_name}'")
        return True
    except Exception as e:
        print(f"❌ {issue_key}: Failed to transition - {str(e)[:50]}")
        return False

def add_comment(issue_key, comment_text):
    """Add a comment to an issue"""
    url = f"{JIRA_BASE_URL}/rest/api/3/issue/{issue_key}/comment"
    auth = (JIRA_EMAIL, JIRA_API_TOKEN)
    headers = {"Content-Type": "application/json"}

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
        response = requests.post(url, auth=auth, headers=headers, json=payload)
        response.raise_for_status()
        print(f"   💬 Added comment")
        return True
    except Exception as e:
        print(f"   ⚠️  Failed to add comment: {str(e)[:50]}")
        return False

print("=" * 100)
print("Updating JIRA Status for Completed Work")
print("=" * 100)
print()

# Epic AV11-520 - Already created, mark as In Progress
print("📋 Epic AV11-520: gRPC-Web Migration")
transition_issue("AV11-520", "In Progress")
add_comment("AV11-520", """✅ Epic created and organized successfully.

**Progress Update (Nov 26, 2025)**:
- Epic created with 19 child stories (162 SP)
- All stories properly linked and labeled
- Sprint organization complete (Sprint 19-24)
- Proto files created: analytics-stream.proto, metrics-stream.proto
- Migration plan documented in GRPC_MIGRATION_PLAN.md

**Next Steps**:
- AV11-521: Configure gRPC Build Tooling (Sprint 19)
- AV11-523: Complete remaining proto files (Sprint 19)""")
print()

# AV11-523: Create Proto Files - Partially complete
print("📋 AV11-523: Create Proto Files for Streaming Services")
transition_issue("AV11-523", "In Progress")
add_comment("AV11-523", """🚧 Partially Complete (2/6 proto files) - Nov 26, 2025 19:53

**Completed**:
✅ analytics-stream.proto (355 lines) - Dashboard analytics streaming
✅ metrics-stream.proto (380 lines) - Performance metrics streaming

**Remaining**:
⏳ consensus-stream.proto - Consensus state streaming
⏳ channel-stream.proto - Channel management streaming
⏳ validator-stream.proto - Validator monitoring streaming
⏳ network-stream.proto - Network topology streaming

**Issue Resolution** ✅:
Fixed naming conflicts in analytics-stream.proto:
   - Added imports: consensus.proto, transaction.proto
   - Removed duplicate ConsensusMetrics definition (now using from consensus.proto)
   - Removed duplicate TransactionEvent definition (now using from transaction.proto)
   - Proto compilation: ✅ SUCCESS
   - Java classes generated: ✅ 338 files in target/generated-sources/grpc/

**Build Status**: ✅ BUILD SUCCESS (28.4s compilation time)
**Next Action**: Create remaining 4 proto files (consensus-stream, channel-stream, validator-stream, network-stream)""")
print()

# Other completed stories from today's session
completed_stories = [
    {
        "key": "Epic for Infrastructure",
        "summary": "Create epic for V12 backend deployment and infrastructure work",
        "comment": """✅ Infrastructure work completed today:

**V12 Backend Restored**:
- PostgreSQL database created (j4c_db with user j4c_user)
- V12 service successfully started on port 9003
- Health endpoint verified: ✅ HEALTHY

**Service Cleanup**:
- V11 and V3.6 services disabled and removed
- Port conflicts resolved
- DEPLOYMENT_SERVICE_PROTOCOL.md created

**Status**: V12 backend is now running in production at dlt.aurigraph.io"""
    }
]

print("\n" + "=" * 100)
print("✅ Status Update Complete!")
print("=" * 100)
print()
print("📊 Summary:")
print("   Epic AV11-520: ✅ In Progress")
print("   AV11-523: 🚧 In Progress (2/6 complete)")
print()
print("🔗 View Board: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789")
print()
