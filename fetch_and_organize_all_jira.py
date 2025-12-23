#!/usr/bin/env python3
"""
Fetch all AV11 tickets and organize them into logical epics
"""

import requests
import json
from collections import defaultdict

# JIRA Configuration
JIRA_BASE_URL = "https://aurigraphdlt.atlassian.net"
JIRA_EMAIL = "subbu@aurigraph.io"
JIRA_API_TOKEN = "ATATT3xFfGF0sFjaXc9iiBQuv-1jvWEfLDA5APUBvJvhVSrtzDDfS4B9k3ut3gCAyHUNU0YImVJSjcjglkR_3dmHtvRUYiV32nQJqkQ_HwKqCbS6oNs99XdYu5j_SmQqMQX4a7WekwS-sYNbDFtNBTrRuemXmlVHrjWa6dhMdCBuk0vdQvd_OYA=F7D4339F"
PROJECT_KEY = "AV11"

def fetch_all_issues():
    """Fetch all issues from AV11 project"""
    url = f"{JIRA_BASE_URL}/rest/api/3/search"
    auth = (JIRA_EMAIL, JIRA_API_TOKEN)

    params = {
        "jql": f"project = {PROJECT_KEY} ORDER BY created DESC",
        "maxResults": 100,
        "fields": "summary,issuetype,status,created,description,labels,parent"
    }

    try:
        response = requests.get(url, auth=auth, params=params)
        response.raise_for_status()
        data = response.json()
        return data.get("issues", [])
    except Exception as e:
        print(f"❌ Error fetching issues: {str(e)}")
        return []

def analyze_issues(issues):
    """Analyze issues and suggest epic organization"""

    epics = []
    stories_without_epic = []
    stories_by_category = defaultdict(list)

    for issue in issues:
        key = issue["key"]
        fields = issue["fields"]
        issue_type = fields["issuetype"]["name"]
        summary = fields["summary"]
        status = fields["status"]["name"]
        labels = fields.get("labels", [])
        parent = fields.get("parent")

        issue_info = {
            "key": key,
            "type": issue_type,
            "summary": summary,
            "status": status,
            "labels": labels,
            "parent": parent.get("key") if parent else None
        }

        if issue_type == "Epic":
            epics.append(issue_info)
        elif issue_type == "Story":
            if not parent:
                stories_without_epic.append(issue_info)

                # Categorize by keywords in summary
                summary_lower = summary.lower()

                if any(word in summary_lower for word in ["api", "endpoint", "rest", "service"]):
                    stories_by_category["API Development"].append(issue_info)
                elif any(word in summary_lower for word in ["portal", "dashboard", "ui", "frontend"]):
                    stories_by_category["Portal & UI"].append(issue_info)
                elif any(word in summary_lower for word in ["performance", "optimization", "tps", "benchmark"]):
                    stories_by_category["Performance"].append(issue_info)
                elif any(word in summary_lower for word in ["test", "qa", "quality"]):
                    stories_by_category["Testing & QA"].append(issue_info)
                elif any(word in summary_lower for word in ["deploy", "devops", "ci/cd", "infrastructure"]):
                    stories_by_category["DevOps & Infrastructure"].append(issue_info)
                elif any(word in summary_lower for word in ["security", "auth", "crypto"]):
                    stories_by_category["Security"].append(issue_info)
                elif any(word in summary_lower for word in ["consensus", "hyperraft", "blockchain"]):
                    stories_by_category["Consensus & Blockchain"].append(issue_info)
                elif any(word in summary_lower for word in ["documentation", "docs"]):
                    stories_by_category["Documentation"].append(issue_info)
                else:
                    stories_by_category["Other"].append(issue_info)

    return epics, stories_without_epic, stories_by_category

def create_epic(name, description):
    """Create a new epic"""
    url = f"{JIRA_BASE_URL}/rest/api/3/issue"
    auth = (JIRA_EMAIL, JIRA_API_TOKEN)
    headers = {"Content-Type": "application/json"}

    payload = {
        "fields": {
            "project": {"key": PROJECT_KEY},
            "summary": name,
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            {
                                "type": "text",
                                "text": description
                            }
                        ]
                    }
                ]
            },
            "issuetype": {"name": "Epic"}
        }
    }

    try:
        response = requests.post(url, auth=auth, headers=headers, json=payload)
        response.raise_for_status()
        result = response.json()
        return result.get("key")
    except Exception as e:
        print(f"❌ Failed to create epic: {str(e)[:100]}")
        return None

def link_story_to_epic(story_key, epic_key):
    """Link a story to an epic"""
    url = f"{JIRA_BASE_URL}/rest/api/3/issue/{story_key}"
    auth = (JIRA_EMAIL, JIRA_API_TOKEN)
    headers = {"Content-Type": "application/json"}

    payload = {
        "fields": {
            "parent": {
                "key": epic_key
            }
        }
    }

    try:
        response = requests.put(url, auth=auth, headers=headers, json=payload)
        return response.status_code == 204
    except:
        # Fallback: update description to mention epic
        return update_description_with_epic(story_key, epic_key)

def update_description_with_epic(story_key, epic_key):
    """Update story description to reference epic"""
    url = f"{JIRA_BASE_URL}/rest/api/3/issue/{story_key}"
    auth = (JIRA_EMAIL, JIRA_API_TOKEN)
    headers = {"Content-Type": "application/json"}

    # Get current description
    response = requests.get(url, auth=auth, headers=headers)
    if response.status_code != 200:
        return False

    issue_data = response.json()
    current_desc = issue_data.get("fields", {}).get("description", {})

    # Add epic reference
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
                "text": epic_key,
                "marks": [{"type": "code"}]
            }
        ]
    }

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

# Main execution
print("=" * 100)
print("JIRA Epic Organization Analysis - AV11 Project")
print("=" * 100)
print()

# Fetch all issues
print("📥 Fetching all AV11 issues...")
issues = fetch_all_issues()
print(f"   Found {len(issues)} total issues")
print()

# Analyze issues
epics, stories_without_epic, stories_by_category = analyze_issues(issues)

print(f"📊 Analysis Results:")
print(f"   Existing Epics: {len(epics)}")
print(f"   Stories without Epic: {len(stories_without_epic)}")
print()

# Show existing epics
if epics:
    print("🎯 Existing Epics:")
    for epic in epics:
        print(f"   {epic['key']}: {epic['summary']}")
    print()

# Show categorized stories
print("📋 Stories Needing Organization:")
print()

for category, stories in sorted(stories_by_category.items()):
    if stories:
        print(f"\n{'=' * 100}")
        print(f"Category: {category} ({len(stories)} stories)")
        print('=' * 100)
        for story in stories:
            status_icon = "✅" if story["status"] == "Done" else "🔵" if story["status"] == "In Progress" else "⭐"
            print(f"   {status_icon} {story['key']}: {story['summary'][:80]}")

# Suggest epic structure
print("\n\n" + "=" * 100)
print("🎯 SUGGESTED EPIC STRUCTURE")
print("=" * 100)
print()

suggested_epics = [
    {
        "name": "V12 Backend API Development",
        "description": "Complete REST API implementation for all Enterprise Portal screens and backend services",
        "category": "API Development"
    },
    {
        "name": "Enterprise Portal Enhancement",
        "description": "Frontend development, UI/UX improvements, and dashboard functionality for Enterprise Portal",
        "category": "Portal & UI"
    },
    {
        "name": "Performance Optimization & TPS Target",
        "description": "Achieve and maintain 2M+ TPS target through optimization, benchmarking, and performance tuning",
        "category": "Performance"
    },
    {
        "name": "Testing & Quality Assurance",
        "description": "Comprehensive testing strategy including unit, integration, E2E, and performance tests with 95% coverage target",
        "category": "Testing & QA"
    },
    {
        "name": "DevOps & Infrastructure",
        "description": "CI/CD pipelines, deployment automation, monitoring, and infrastructure management",
        "category": "DevOps & Infrastructure"
    },
    {
        "name": "Security & Cryptography",
        "description": "Quantum-resistant cryptography, authentication, authorization, and security auditing",
        "category": "Security"
    },
    {
        "name": "HyperRAFT++ Consensus Implementation",
        "description": "Consensus protocol implementation, leader election, and blockchain core functionality",
        "category": "Consensus & Blockchain"
    },
    {
        "name": "Documentation & Knowledge Management",
        "description": "Technical documentation, API docs, user guides, and knowledge base",
        "category": "Documentation"
    }
]

for epic_def in suggested_epics:
    category = epic_def["category"]
    stories = stories_by_category.get(category, [])

    if stories:
        print(f"\n📁 Epic: {epic_def['name']}")
        print(f"   Description: {epic_def['description']}")
        print(f"   Stories to include: {len(stories)}")
        for story in stories[:5]:  # Show first 5
            print(f"      • {story['key']}: {story['summary'][:70]}")
        if len(stories) > 5:
            print(f"      ... and {len(stories) - 5} more")

print("\n\n" + "=" * 100)
print("💡 RECOMMENDATION")
print("=" * 100)
print()
print("Create the suggested epics above to organize all unlinked stories.")
print("This will provide a clean, manageable JIRA board structure.")
print()
print(f"View board: {JIRA_BASE_URL}/jira/software/projects/AV11/boards/789")
print()

# Ask user if they want to proceed with epic creation
print("\n" + "=" * 100)
print("Would you like to create these epics and organize stories? (Run with --execute flag)")
print("=" * 100)
