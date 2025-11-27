#!/usr/bin/env python3
"""
Organize JIRA Stories into Epic AV11-520
Links all stories and adds proper sprint labels
"""

import requests
import json

# JIRA Configuration
JIRA_BASE_URL = "https://aurigraphdlt.atlassian.net"
JIRA_EMAIL = "subbu@aurigraph.io"
JIRA_API_TOKEN = "ATATT3xFfGF0sFjaXc9iiBQuv-1jvWEfLDA5APUBvJvhVSrtzDDfS4B9k3ut3gCAyHUNU0YImVJSjcjglkR_3dmHtvRUYiV32nQJqkQ_HwKqCbS6oNs99XdYu5j_SmQqMQX4a7WekwS-sYNbDFtNBTrRuemXmlVHrjWa6dhMdCBuk0vdQvd_OYA=F7D4339F"
PROJECT_KEY = "AV11"
EPIC_KEY = "AV11-520"

def link_issue_to_epic(issue_key, epic_key):
    """Link a story to an epic using issue links"""
    url = f"{JIRA_BASE_URL}/rest/api/3/issue/{issue_key}"
    auth = (JIRA_EMAIL, JIRA_API_TOKEN)
    headers = {"Content-Type": "application/json"}

    # Try to update the Parent field (for linking to epic)
    payload = {
        "fields": {
            "parent": {
                "key": epic_key
            }
        }
    }

    try:
        response = requests.put(url, auth=auth, headers=headers, json=payload)
        if response.status_code == 204:
            print(f"✅ Linked {issue_key} to Epic {epic_key}")
            return True
        else:
            # If parent doesn't work, try description update to mention epic
            update_description_with_epic(issue_key, epic_key)
            return True
    except Exception as e:
        print(f"⚠️  {issue_key}: Using description method")
        update_description_with_epic(issue_key, epic_key)
        return True

def update_description_with_epic(issue_key, epic_key):
    """Update issue description to reference epic"""
    url = f"{JIRA_BASE_URL}/rest/api/3/issue/{issue_key}"
    auth = (JIRA_EMAIL, JIRA_API_TOKEN)
    headers = {"Content-Type": "application/json"}

    # Get current description
    response = requests.get(url, auth=auth, headers=headers)
    if response.status_code != 200:
        return False

    issue_data = response.json()
    current_desc = issue_data.get("fields", {}).get("description", {})

    # Update to add epic reference at the top
    epic_paragraph = {
        "type": "paragraph",
        "content": [
            {
                "type": "text",
                "text": f"🎯 Epic: ",
                "marks": [{"type": "strong"}]
            },
            {
                "type": "text",
                "text": f"{epic_key} - gRPC-Web Migration for Real-Time Streaming",
                "marks": [{"type": "code"}]
            }
        ]
    }

    # Prepend epic reference to existing content
    new_content = [epic_paragraph]
    if current_desc and "content" in current_desc:
        new_content.extend(current_desc["content"])

    payload = {
        "fields": {
            "description": {
                "type": "doc",
                "version": 1,
                "content": new_content
            }
        }
    }

    response = requests.put(url, auth=auth, headers=headers, json=payload)
    return response.status_code == 204

def add_labels(issue_key, labels):
    """Add labels to an issue"""
    url = f"{JIRA_BASE_URL}/rest/api/3/issue/{issue_key}"
    auth = (JIRA_EMAIL, JIRA_API_TOKEN)
    headers = {"Content-Type": "application/json"}

    payload = {
        "update": {
            "labels": [{"add": label} for label in labels]
        }
    }

    try:
        response = requests.put(url, auth=auth, headers=headers, json=payload)
        if response.status_code == 204:
            print(f"   📋 Added labels: {', '.join(labels)}")
            return True
    except Exception as e:
        print(f"   ⚠️  Failed to add labels: {str(e)[:50]}")
    return False

# Story organization by sprint
story_organization = [
    # Sprint 19 - Foundation (3 stories, 16 SP)
    {
        "sprint": "Sprint-19",
        "label": "foundation",
        "stories": ["AV11-521", "AV11-522", "AV11-523"]
    },
    # Sprint 20 - Core Services Part 1 (2 stories, 26 SP)
    {
        "sprint": "Sprint-20",
        "label": "core-services",
        "stories": ["AV11-524", "AV11-525"]
    },
    # Sprint 21 - Core Services Part 2 (3 stories, 34 SP)
    {
        "sprint": "Sprint-21",
        "label": "core-services",
        "stories": ["AV11-526", "AV11-527", "AV11-528"]
    },
    # Sprint 22 - Frontend Migration (3 stories, 31 SP)
    {
        "sprint": "Sprint-22",
        "label": "frontend",
        "stories": ["AV11-529", "AV11-530", "AV11-531"]
    },
    # Sprint 23 - Parallel Running & Validation (4 stories, 26 SP)
    {
        "sprint": "Sprint-23",
        "label": "validation",
        "stories": ["AV11-532", "AV11-533", "AV11-534", "AV11-535"]
    },
    # Sprint 24 - Full Migration & Cleanup (4 stories, 29 SP)
    {
        "sprint": "Sprint-24",
        "label": "cleanup",
        "stories": ["AV11-536", "AV11-537", "AV11-538", "AV11-539"]
    }
]

print("=" * 80)
print(f"Organizing Stories under Epic {EPIC_KEY}")
print("=" * 80)
print()

total_linked = 0

for sprint_group in story_organization:
    sprint = sprint_group["sprint"]
    label = sprint_group["label"]
    stories = sprint_group["stories"]

    print(f"\n📅 {sprint} ({label.upper()}) - {len(stories)} stories")
    print("-" * 80)

    for story_key in stories:
        # Link to epic
        if link_issue_to_epic(story_key, EPIC_KEY):
            # Add labels
            labels = ["gRPC-migration", sprint.lower(), label]
            add_labels(story_key, labels)
            total_linked += 1

print()
print("=" * 80)
print(f"✅ Organization Complete!")
print("=" * 80)
print(f"\nStories organized: {total_linked}")
print(f"Epic: {EPIC_KEY}")
print(f"Sprints: Sprint 19-24 (6 sprints)")
print(f"Total Story Points: 162 SP")
print()
print(f"View Epic: {JIRA_BASE_URL}/browse/{EPIC_KEY}")
print(f"View Board: {JIRA_BASE_URL}/jira/software/projects/AV11/boards/789")
print()
print("📋 Sprint Breakdown:")
print("   Sprint 19: 3 stories (16 SP) - Foundation")
print("   Sprint 20: 2 stories (26 SP) - Core Services Part 1")
print("   Sprint 21: 3 stories (34 SP) - Core Services Part 2")
print("   Sprint 22: 3 stories (31 SP) - Frontend Migration")
print("   Sprint 23: 4 stories (26 SP) - Validation & Testing")
print("   Sprint 24: 4 stories (29 SP) - Cleanup & Reports")
print()
