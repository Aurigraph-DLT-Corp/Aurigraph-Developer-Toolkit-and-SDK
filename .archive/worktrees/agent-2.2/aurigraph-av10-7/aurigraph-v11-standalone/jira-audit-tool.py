#!/usr/bin/env python3
"""
JIRA Ticket Audit & Verification Tool
Audits AV11-14 through AV11-460 for duplicates, status, and inconsistencies
"""

import os
import sys
import json
import requests
from typing import List, Dict, Tuple
from collections import defaultdict
from datetime import datetime

class JIRATicketAuditor:
    def __init__(self):
        """Initialize JIRA auditor with credentials from environment"""
        # Load credentials from environment
        self.jira_url = os.getenv('JIRA_BASE_URL', 'https://aurigraphdlt.atlassian.net')
        self.jira_email = os.getenv('JIRA_EMAIL', 'subbu@aurigraph.io')
        self.jira_token = os.getenv('JIRA_API_TOKEN')
        self.project_key = os.getenv('JIRA_PROJECT_KEY', 'AV11')

        if not self.jira_token:
            raise ValueError("JIRA_API_TOKEN environment variable not set")

        self.session = requests.Session()
        self.session.auth = (self.jira_email, self.jira_token)
        self.session.headers.update({'Content-Type': 'application/json'})

        # Audit results
        self.tickets = {}
        self.duplicates = defaultdict(list)
        self.orphaned = []
        self.errors = []
        self.status_summary = defaultdict(int)

    def fetch_ticket(self, ticket_id: str) -> Dict:
        """Fetch a single ticket from JIRA"""
        url = f"{self.jira_url}/rest/api/3/issues/{ticket_id}"
        try:
            response = self.session.get(url)
            if response.status_code == 404:
                return None  # Ticket doesn't exist
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            self.errors.append(f"Error fetching {ticket_id}: {str(e)}")
            return None

    def audit_ticket_range(self, start: int = 14, end: int = 460) -> None:
        """Audit all tickets in the given range"""
        print(f"\n{'='*80}")
        print(f"JIRA TICKET AUDIT: {self.project_key}-{start} through {self.project_key}-{end}")
        print(f"Start Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"{'='*80}\n")

        total = end - start + 1
        processed = 0
        found = 0

        for ticket_num in range(start, end + 1):
            ticket_id = f"{self.project_key}-{ticket_num}"
            print(f"[{processed+1:3d}/{total}] Auditing {ticket_id}...", end='\r')

            ticket_data = self.fetch_ticket(ticket_id)

            if ticket_data:
                found += 1
                self.tickets[ticket_id] = {
                    'key': ticket_data.get('key'),
                    'summary': ticket_data['fields'].get('summary', ''),
                    'status': ticket_data['fields'].get('status', {}).get('name', 'Unknown'),
                    'type': ticket_data['fields'].get('issuetype', {}).get('name', 'Unknown'),
                    'assignee': ticket_data['fields'].get('assignee', {}).get('displayName', 'Unassigned'),
                    'epic': ticket_data['fields'].get('customfield_10000'),  # Epic field may vary
                    'description': ticket_data['fields'].get('description', ''),
                    'labels': ticket_data['fields'].get('labels', []),
                    'created': ticket_data['fields'].get('created'),
                    'updated': ticket_data['fields'].get('updated'),
                }

                # Track status
                status = self.tickets[ticket_id]['status']
                self.status_summary[status] += 1

            processed += 1

        print(f"\n✅ Audit Complete: {found}/{total} tickets found\n")
        self._analyze_duplicates()
        self._find_orphaned()
        self._generate_report()

    def _analyze_duplicates(self) -> None:
        """Analyze tickets for duplicates"""
        # Group by summary to find potential duplicates
        summary_groups = defaultdict(list)

        for ticket_id, data in self.tickets.items():
            summary = data['summary'].lower().strip()
            summary_groups[summary].append(ticket_id)

        # Identify duplicates
        duplicate_count = 0
        for summary, tickets in summary_groups.items():
            if len(tickets) > 1:
                self.duplicates[summary] = tickets
                duplicate_count += len(tickets) - 1

        # Also check for similar titles (fuzzy matching)
        self._find_similar_tickets()

        if self.duplicates:
            print(f"⚠️  Found {duplicate_count} potential duplicate tickets\n")

    def _find_similar_tickets(self) -> None:
        """Find similar tickets using simple string matching"""
        # Look for tickets with keywords that might indicate duplication
        keyword_patterns = {
            'websocket': [],
            'api': [],
            'dashboard': [],
            'test': [],
            'bug': [],
            'feature': [],
        }

        for ticket_id, data in self.tickets.items():
            summary = data['summary'].lower()
            for keyword in keyword_patterns.keys():
                if keyword in summary:
                    keyword_patterns[keyword].append(ticket_id)

        # Report on high-volume categories
        for keyword, tickets in keyword_patterns.items():
            if len(tickets) > 3:
                print(f"   ℹ️  {len(tickets)} tickets contain '{keyword}'")

    def _find_orphaned(self) -> None:
        """Find orphaned tickets (no epic, no assignee, etc.)"""
        for ticket_id, data in self.tickets.items():
            issues = []
            if not data['epic']:
                issues.append('no_epic')
            if data['assignee'] == 'Unassigned':
                issues.append('unassigned')
            if not data['description']:
                issues.append('no_description')

            if issues:
                self.orphaned.append({
                    'ticket': ticket_id,
                    'issues': issues,
                    'summary': data['summary']
                })

        if self.orphaned:
            print(f"⚠️  Found {len(self.orphaned)} orphaned or incomplete tickets\n")

    def _generate_report(self) -> None:
        """Generate comprehensive audit report"""
        print(f"\n{'='*80}")
        print("AUDIT REPORT SUMMARY")
        print(f"{'='*80}\n")

        # Status distribution
        print("📊 Status Distribution:")
        for status, count in sorted(self.status_summary.items(), key=lambda x: x[1], reverse=True):
            print(f"   {status:20s}: {count:4d} tickets")

        # Duplicates
        if self.duplicates:
            print(f"\n⚠️  DUPLICATES ({len(self.duplicates)} groups):")
            for i, (summary, tickets) in enumerate(sorted(self.duplicates.items())[:10], 1):
                print(f"   {i}. {summary[:60]}")
                print(f"      Tickets: {', '.join(tickets)}")

        # Orphaned
        if self.orphaned:
            print(f"\n⚠️  ORPHANED TICKETS ({len(self.orphaned)}):")
            for item in sorted(self.orphaned, key=lambda x: x['ticket'])[:15]:
                issues_str = ', '.join(item['issues'])
                print(f"   {item['ticket']:10s}: {issues_str} - {item['summary'][:40]}")

        # Errors
        if self.errors:
            print(f"\n❌ ERRORS ({len(self.errors)}):")
            for error in self.errors[:5]:
                print(f"   {error}")

        print(f"\n{'='*80}\n")

    def generate_json_report(self, filename: str = 'jira-audit-report.json') -> None:
        """Generate JSON report for further processing"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'project': self.project_key,
            'total_tickets_audited': len(self.tickets),
            'status_summary': dict(self.status_summary),
            'duplicates_count': sum(len(v) for v in self.duplicates.values()),
            'orphaned_count': len(self.orphaned),
            'error_count': len(self.errors),
            'duplicates': {k: v for k, v in self.duplicates.items()},
            'orphaned': self.orphaned[:50],  # First 50
            'errors': self.errors[:20],  # First 20
        }

        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)

        print(f"✅ JSON report saved to {filename}")


def main():
    """Main execution"""
    try:
        # Initialize auditor
        auditor = JIRATicketAuditor()

        # Run audit for AV11-14 through AV11-460
        auditor.audit_ticket_range(start=14, end=460)

        # Generate JSON report
        auditor.generate_json_report('/tmp/jira-audit-report.json')

        return 0

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return 1


if __name__ == '__main__':
    sys.exit(main())
