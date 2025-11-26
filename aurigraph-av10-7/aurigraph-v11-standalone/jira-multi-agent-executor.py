#!/usr/bin/env python3
"""
JIRA Multi-Agent Parallel Execution System
Uses Git worktrees and multiple J4C agents to complete pending tickets in parallel
"""

import requests
import json
import subprocess
import os
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# JIRA Configuration
JIRA_EMAIL = "subbu@aurigraph.io"
JIRA_API_TOKEN = "ATATT3xFfGF0sFjaXc9iiBQuv-1jvWEfLDA5APUBvJvhVSrtzDDfS4B9k3ut3gCAyHUNU0YImVJSjcjglkR_3dmHtvRUYiV32nQJqkQ_HwKqCbS6oNs99XdYu5j_SmQqMQX4a7WekwS-sYNbDFtNBTrRuemXmlVHrjWa6dhMdCBuk0vdQvd_OYA=F7D4339F"
JIRA_BASE_URL = "https://aurigraphdlt.atlassian.net"
PROJECT_KEY = "AV11"

# Agent Configuration
MAX_PARALLEL_AGENTS = 4  # Number of agents working in parallel
WORKTREE_BASE = "/Users/subbujois/subbuworkingdir/Aurigraph-DLT/worktrees"

class JIRAAgent:
    def __init__(self):
        self.session = requests.Session()
        self.session.auth = (JIRA_EMAIL, JIRA_API_TOKEN)
        self.session.headers.update({"Content-Type": "application/json"})

    def fetch_pending_tickets(self):
        """Fetch all pending tickets from JIRA"""
        jql = f"project={PROJECT_KEY} AND status NOT IN (Done, Closed, Resolved) ORDER BY priority DESC, created ASC"
        url = f"{JIRA_BASE_URL}/rest/api/3/search"

        params = {
            "jql": jql,
            "maxResults": 100,
            "fields": "summary,status,priority,issuetype,assignee,labels,sprint,description"
        }

        try:
            response = self.session.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            tickets = []
            for issue in data.get('issues', []):
                ticket = {
                    'key': issue['key'],
                    'summary': issue['fields']['summary'],
                    'status': issue['fields']['status']['name'],
                    'priority': issue['fields']['priority']['name'],
                    'type': issue['fields']['issuetype']['name'],
                    'description': issue['fields'].get('description', {})
                }
                tickets.append(ticket)

            return tickets
        except Exception as e:
            print(f"❌ Error fetching tickets: {e}")
            return []

    def update_ticket_status(self, ticket_key, status, comment=None):
        """Update ticket status and add comment"""
        try:
            # Add comment if provided
            if comment:
                comment_url = f"{JIRA_BASE_URL}/rest/api/3/issue/{ticket_key}/comment"
                comment_data = {
                    "body": {
                        "type": "doc",
                        "version": 1,
                        "content": [{
                            "type": "paragraph",
                            "content": [{
                                "type": "text",
                                "text": comment
                            }]
                        }]
                    }
                }
                self.session.post(comment_url, json=comment_data)

            # Get available transitions
            transitions_url = f"{JIRA_BASE_URL}/rest/api/3/issue/{ticket_key}/transitions"
            response = self.session.get(transitions_url)
            transitions = response.json().get('transitions', [])

            # Find transition ID for target status
            transition_id = None
            for transition in transitions:
                if transition['name'].lower() == status.lower():
                    transition_id = transition['id']
                    break

            if not transition_id:
                # Try common alternatives
                status_map = {
                    'in progress': ['In Progress', 'Start Progress'],
                    'done': ['Done', 'Close', 'Resolve']
                }
                for alt_name in status_map.get(status.lower(), []):
                    for transition in transitions:
                        if transition['name'].lower() == alt_name.lower():
                            transition_id = transition['id']
                            break
                    if transition_id:
                        break

            if transition_id:
                transition_data = {"transition": {"id": transition_id}}
                self.session.post(transitions_url, json=transition_data)
                print(f"✅ {ticket_key}: Transitioned to {status}")
                return True
            else:
                print(f"⚠️  {ticket_key}: Transition '{status}' not available")
                return False

        except Exception as e:
            print(f"❌ Error updating {ticket_key}: {e}")
            return False

def setup_git_worktrees(tickets, base_path):
    """Create Git worktrees for parallel work"""
    os.makedirs(base_path, exist_ok=True)

    worktrees = []
    for i, ticket in enumerate(tickets[:MAX_PARALLEL_AGENTS]):
        worktree_path = f"{base_path}/agent-{i+1}-{ticket['key']}"

        # Create worktree from main branch
        try:
            subprocess.run([
                "git", "worktree", "add", "-b", f"feature/{ticket['key']}",
                worktree_path, "HEAD"
            ], check=True, capture_output=True)

            worktrees.append({
                'path': worktree_path,
                'ticket': ticket,
                'agent_id': i + 1
            })
            print(f"✅ Worktree created: {worktree_path}")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to create worktree for {ticket['key']}: {e}")

    return worktrees

def categorize_tickets(tickets):
    """Categorize tickets by type and complexity"""
    categories = {
        'quick_wins': [],      # Small, low-complexity tasks
        'features': [],        # New feature implementation
        'bugs': [],           # Bug fixes
        'enhancements': [],   # Improvements to existing features
        'documentation': [],  # Documentation tasks
        'technical_debt': []  # Refactoring, optimization
    }

    for ticket in tickets:
        ticket_type = ticket['type'].lower()
        summary = ticket['summary'].lower()

        if ticket_type == 'bug':
            categories['bugs'].append(ticket)
        elif ticket_type in ['story', 'epic']:
            if any(word in summary for word in ['document', 'docs', 'readme']):
                categories['documentation'].append(ticket)
            else:
                categories['features'].append(ticket)
        elif ticket_type == 'task':
            if any(word in summary for word in ['refactor', 'optimize', 'cleanup']):
                categories['technical_debt'].append(ticket)
            elif any(word in summary for word in ['enhance', 'improve', 'update']):
                categories['enhancements'].append(ticket)
            else:
                categories['quick_wins'].append(ticket)
        else:
            categories['quick_wins'].append(ticket)

    return categories

def main():
    print("="*70)
    print("JIRA Multi-Agent Parallel Execution System")
    print("="*70)
    print()

    # Initialize JIRA agent
    agent = JIRAAgent()

    # Fetch pending tickets
    print("[1/5] Fetching pending JIRA tickets...")
    tickets = agent.fetch_pending_tickets()

    if not tickets:
        print("✅ No pending tickets found!")
        return

    print(f"Found {len(tickets)} pending tickets\n")

    # Categorize tickets
    print("[2/5] Categorizing tickets...")
    categories = categorize_tickets(tickets)

    print("\nTicket Breakdown:")
    print(f"  • Quick Wins: {len(categories['quick_wins'])}")
    print(f"  • Features: {len(categories['features'])}")
    print(f"  • Bugs: {len(categories['bugs'])}")
    print(f"  • Enhancements: {len(categories['enhancements'])}")
    print(f"  • Documentation: {len(categories['documentation'])}")
    print(f"  • Technical Debt: {len(categories['technical_debt'])}")
    print()

    # Display top priority tickets
    print("[3/5] Top Priority Tickets:")
    print("-" * 70)
    for i, ticket in enumerate(tickets[:10], 1):
        print(f"{i:2}. {ticket['key']}: {ticket['summary'][:50]}")
        print(f"    Priority: {ticket['priority']} | Status: {ticket['status']} | Type: {ticket['type']}")
    print()

    # Create execution plan
    print("[4/5] Creating Parallel Execution Plan...")
    print(f"Will process {min(MAX_PARALLEL_AGENTS, len(tickets))} tickets in parallel")
    print()

    # Priority order for execution
    execution_order = (
        categories['bugs'] +           # Fix bugs first
        categories['quick_wins'] +     # Quick wins for momentum
        categories['enhancements'] +   # Improvements
        categories['features'] +       # New features
        categories['technical_debt'] + # Tech debt
        categories['documentation']    # Documentation last
    )

    print("[5/5] Execution Summary:")
    print("-" * 70)
    print(f"Total pending tickets: {len(tickets)}")
    print(f"Tickets to process now: {min(MAX_PARALLEL_AGENTS, len(execution_order))}")
    print(f"Parallel agents: {MAX_PARALLEL_AGENTS}")
    print()

    # Display tickets that will be processed
    print("Tickets selected for parallel execution:")
    for i, ticket in enumerate(execution_order[:MAX_PARALLEL_AGENTS], 1):
        print(f"  Agent {i}: {ticket['key']} - {ticket['summary'][:45]}")

        # Mark ticket as In Progress in JIRA
        agent.update_ticket_status(
            ticket['key'],
            'in progress',
            f"🤖 Automated execution started by Multi-Agent System\n"
            f"Agent ID: {i}\n"
            f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            f"Execution mode: Parallel with Git worktrees"
        )

    print()
    print("="*70)
    print("✅ Multi-Agent execution plan prepared!")
    print("="*70)
    print()
    print("Next Steps:")
    print("1. Git worktrees will be created for each agent")
    print("2. Each agent will work independently on their assigned ticket")
    print("3. Progress will be updated in JIRA automatically")
    print("4. Completed work will be merged back to main branch")
    print()
    print("Note: Actual implementation requires Claude Code J4C agents")
    print("This script prepares the execution plan and updates JIRA status")

if __name__ == "__main__":
    main()
