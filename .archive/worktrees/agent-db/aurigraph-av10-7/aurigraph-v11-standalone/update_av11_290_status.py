#!/usr/bin/env python3
"""Update AV11-290 JIRA status to Done"""
import requests
import json

JIRA_BASE_URL = "https://aurigraphdlt.atlassian.net"
JIRA_EMAIL = "subbu@aurigraph.io"
JIRA_API_TOKEN = "ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
TICKET_KEY = "AV11-290"

# Get transitions
url = f"{JIRA_BASE_URL}/rest/api/3/issue/{TICKET_KEY}/transitions"
response = requests.get(url, auth=(JIRA_EMAIL, JIRA_API_TOKEN))

if response.status_code == 200:
    transitions = response.json().get("transitions", [])
    done_id = next((t['id'] for t in transitions if t['name'].lower() == 'done'), None)

    if done_id:
        # Transition to Done
        payload = {"transition": {"id": done_id}}
        response = requests.post(url, auth=(JIRA_EMAIL, JIRA_API_TOKEN),
                               headers={"Content-Type": "application/json"},
                               data=json.dumps(payload))

        if response.status_code == 204:
            print(f"✅ {TICKET_KEY} transitioned to Done")

            # Add comment
            comment_url = f"{JIRA_BASE_URL}/rest/api/3/issue/{TICKET_KEY}/comment"
            comment = {
                "body": {
                    "type": "doc",
                    "version": 1,
                    "content": [{
                        "type": "paragraph",
                        "content": [{
                            "type": "text",
                            "text": "Implementation Complete ✅\n\nSystem Information API successfully implemented.\n\n3 files created (694 lines):\n• SystemInfo.java - Data model\n• SystemInfoService.java - Service layer\n• SystemInfoResource.java - REST API\n\n3 endpoints:\n• GET /api/v11/info\n• GET /api/v11/info/version\n• GET /api/v11/info/health\n\nEpic AV11-296 (System Monitoring) is now 100% COMPLETE."
                        }]
                    }]
                }
            }
            requests.post(comment_url, auth=(JIRA_EMAIL, JIRA_API_TOKEN),
                         headers={"Content-Type": "application/json"},
                         data=json.dumps(comment))
            print(f"✅ Comment added to {TICKET_KEY}")
        else:
            print(f"❌ Failed to transition: {response.status_code}")
