#!/usr/bin/env python3
import requests
import json

JIRA_EMAIL = "subbu@aurigraph.io"
JIRA_API_TOKEN = "ATATT3xFfGF0c79X44m_ecHcP5d2F-jx5ljisCVB11tCEl5jB0Cx_FaapQt_u44IqcmBwfq8Gl8CsMFdtu9mqV8SgzcUwjZ2TiHRJo9eh718fUYw7ptk5ZFOzc-aLV2FH_ywq2vSsJ5gLvSorz-eB4JeKxUSLyYiGS9Y05-WhlEWa0cgFUdhUI4=0BECD4F5"
JIRA_BASE_URL = "https://aurigraphdlt.atlassian.net"

print("="*70)
print("JIRA Ticket Verification: AV11-208 to AV11-214")
print("="*70)

tickets = range(208, 215)  # 208 to 214 inclusive
results = []

for ticket_num in tickets:
    ticket_key = f"AV11-{ticket_num}"

    try:
        response = requests.get(
            f"{JIRA_BASE_URL}/rest/api/3/issue/{ticket_key}",
            auth=(JIRA_EMAIL, JIRA_API_TOKEN),
            headers={"Accept": "application/json"}
        )

        if response.status_code == 200:
            data = response.json()
            fields = data.get("fields", {})

            result = {
                "key": ticket_key,
                "exists": True,
                "summary": fields.get('summary', 'N/A'),
                "status": fields.get('status', {}).get('name', 'N/A'),
                "type": fields.get('issuetype', {}).get('name', 'N/A'),
                "priority": fields.get('priority', {}).get('name', 'N/A')
            }

            # Get description
            desc = fields.get('description', {})
            if desc and 'content' in desc:
                desc_text = ""
                for content_block in desc.get('content', []):
                    if content_block.get('type') == 'paragraph':
                        for text_block in content_block.get('content', []):
                            if text_block.get('type') == 'text':
                                desc_text += text_block.get('text', '')
                result["description"] = desc_text[:200] if desc_text else "N/A"
            else:
                result["description"] = "N/A"

            results.append(result)

            print(f"\n✓ {ticket_key} EXISTS")
            print(f"  Summary: {result['summary']}")
            print(f"  Type: {result['type']}")
            print(f"  Status: {result['status']}")
            print(f"  Priority: {result['priority']}")
            if result["description"] != "N/A":
                print(f"  Description: {result['description'][:150]}...")

        elif response.status_code == 404:
            results.append({
                "key": ticket_key,
                "exists": False
            })
            print(f"\n✗ {ticket_key} DOES NOT EXIST")

        else:
            print(f"\n✗ {ticket_key} ERROR {response.status_code}")
            results.append({
                "key": ticket_key,
                "exists": False,
                "error": f"HTTP {response.status_code}"
            })

    except Exception as e:
        print(f"\n✗ {ticket_key} EXCEPTION: {str(e)}")
        results.append({
            "key": ticket_key,
            "exists": False,
            "error": str(e)
        })

print(f"\n{'='*70}")
print("SUMMARY")
print(f"{'='*70}")

existing = [r for r in results if r.get("exists")]
missing = [r for r in results if not r.get("exists")]

print(f"\nTickets Found: {len(existing)}")
for r in existing:
    print(f"  ✓ {r['key']}: {r.get('summary', 'N/A')[:60]}")

print(f"\nTickets Not Found: {len(missing)}")
for r in missing:
    print(f"  ✗ {r['key']}")

print(f"\n{'='*70}\n")
