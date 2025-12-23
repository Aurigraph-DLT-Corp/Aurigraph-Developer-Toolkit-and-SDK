#!/usr/bin/env python3
import requests
import json

JIRA_EMAIL = "subbu@aurigraph.io"
JIRA_API_TOKEN = "ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
JIRA_BASE_URL = "https://aurigraphdlt.atlassian.net"

tickets = ["264", "265", "275", "276"]

for ticket_num in tickets:
    ticket_key = f"AV11-{ticket_num}"
    print(f"\n{'='*70}")
    print(f"Ticket: {ticket_key}")
    print(f"{'='*70}")

    try:
        response = requests.get(
            f"{JIRA_BASE_URL}/rest/api/3/issue/{ticket_key}",
            auth=(JIRA_EMAIL, JIRA_API_TOKEN),
            headers={"Accept": "application/json"}
        )

        if response.status_code == 200:
            data = response.json()
            fields = data.get("fields", {})

            print(f"Summary: {fields.get('summary', 'N/A')}")
            print(f"Status: {fields.get('status', {}).get('name', 'N/A')}")
            print(f"Issue Type: {fields.get('issuetype', {}).get('name', 'N/A')}")
            print(f"Priority: {fields.get('priority', {}).get('name', 'N/A')}")

            # Get description
            desc = fields.get('description', {})
            if desc and 'content' in desc:
                desc_text = ""
                for content_block in desc.get('content', []):
                    if content_block.get('type') == 'paragraph':
                        for text_block in content_block.get('content', []):
                            if text_block.get('type') == 'text':
                                desc_text += text_block.get('text', '')
                print(f"Description: {desc_text[:300]}")
            else:
                print("Description: N/A")

        elif response.status_code == 404:
            print(f"✗ Ticket {ticket_key} does not exist")
        else:
            print(f"✗ Error {response.status_code}: {response.text[:200]}")

    except Exception as e:
        print(f"✗ Exception: {str(e)}")

print(f"\n{'='*70}\n")
