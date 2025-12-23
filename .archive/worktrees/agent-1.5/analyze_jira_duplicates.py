#!/usr/bin/env python3
"""
JIRA Duplicate Detection and Analysis Tool
Analyzes AV11 JIRA tickets for potential duplicates using similarity algorithms
"""

import json
import sys
from collections import defaultdict
from datetime import datetime
from difflib import SequenceMatcher
import re

def clean_text(text):
    """Clean and normalize text for comparison"""
    if not text:
        return ""
    # Remove HTML tags, extra spaces, and convert to lowercase
    text = re.sub(r'<[^>]+>', '', str(text))
    text = re.sub(r'\s+', ' ', text)
    return text.lower().strip()

def extract_keywords(text):
    """Extract meaningful keywords from text"""
    if not text:
        return set()
    # Remove common words and extract keywords
    common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'being'}
    words = re.findall(r'\b\w+\b', text.lower())
    return set(w for w in words if len(w) > 3 and w not in common_words)

def calculate_similarity(text1, text2):
    """Calculate similarity percentage between two texts"""
    return SequenceMatcher(None, clean_text(text1), clean_text(text2)).ratio() * 100

def get_description_text(desc_field):
    """Extract text from JIRA description field (may be rich text)"""
    if not desc_field:
        return ""
    if isinstance(desc_field, str):
        return desc_field
    if isinstance(desc_field, dict):
        # Extract text from rich text format
        text_parts = []
        if 'content' in desc_field:
            for content_item in desc_field.get('content', []):
                if content_item.get('type') == 'paragraph':
                    for text_item in content_item.get('content', []):
                        if text_item.get('type') == 'text':
                            text_parts.append(text_item.get('text', ''))
        return ' '.join(text_parts)
    return str(desc_field)

def analyze_duplicates(tickets, similarity_threshold=70):
    """Analyze tickets for duplicates"""
    duplicates = []
    processed_pairs = set()

    for i, ticket1 in enumerate(tickets):
        for j, ticket2 in enumerate(tickets[i+1:], i+1):
            pair_key = tuple(sorted([ticket1['key'], ticket2['key']]))
            if pair_key in processed_pairs:
                continue

            # Calculate similarities
            summary1 = ticket1['fields']['summary']
            summary2 = ticket2['fields']['summary']
            desc1 = get_description_text(ticket1['fields'].get('description', ''))
            desc2 = get_description_text(ticket2['fields'].get('description', ''))

            summary_sim = calculate_similarity(summary1, summary2)
            desc_sim = calculate_similarity(desc1, desc2) if desc1 and desc2 else 0

            # Weight summary more heavily (70%) than description (30%)
            overall_sim = (summary_sim * 0.7) + (desc_sim * 0.3)

            # Extract common keywords
            keywords1 = extract_keywords(summary1 + ' ' + desc1)
            keywords2 = extract_keywords(summary2 + ' ' + desc2)
            common_keywords = keywords1 & keywords2

            if overall_sim >= similarity_threshold or (summary_sim >= 80 and len(common_keywords) >= 3):
                processed_pairs.add(pair_key)
                duplicates.append({
                    'tickets': [ticket1['key'], ticket2['key']],
                    'summaries': [summary1, summary2],
                    'similarity': round(overall_sim, 2),
                    'summary_similarity': round(summary_sim, 2),
                    'description_similarity': round(desc_sim, 2),
                    'common_keywords': sorted(list(common_keywords))[:10],
                    'statuses': [ticket1['fields']['status']['name'], ticket2['fields']['status']['name']],
                    'issue_types': [ticket1['fields']['issuetype']['name'], ticket2['fields']['issuetype']['name']],
                    'created': [ticket1['fields']['created'], ticket2['fields']['created']]
                })

    # Group related duplicates
    duplicate_groups = []
    grouped_tickets = set()

    for dup in sorted(duplicates, key=lambda x: x['similarity'], reverse=True):
        if dup['tickets'][0] not in grouped_tickets and dup['tickets'][1] not in grouped_tickets:
            group = {
                'primary': dup['tickets'][0],
                'related': [dup['tickets'][1]],
                'similarity': dup['similarity'],
                'details': [dup]
            }
            grouped_tickets.add(dup['tickets'][0])
            grouped_tickets.add(dup['tickets'][1])

            # Find other tickets similar to this group
            for other_dup in duplicates:
                if other_dup['tickets'][0] in group['related'] or other_dup['tickets'][1] in group['related']:
                    continue
                if (other_dup['tickets'][0] == group['primary'] and other_dup['tickets'][1] not in grouped_tickets):
                    group['related'].append(other_dup['tickets'][1])
                    group['details'].append(other_dup)
                    grouped_tickets.add(other_dup['tickets'][1])
                elif (other_dup['tickets'][1] == group['primary'] and other_dup['tickets'][0] not in grouped_tickets):
                    group['related'].append(other_dup['tickets'][0])
                    group['details'].append(other_dup)
                    grouped_tickets.add(other_dup['tickets'][0])

            duplicate_groups.append(group)

    return duplicate_groups, duplicates

def generate_statistics(tickets, duplicate_groups):
    """Generate statistics about duplicates"""
    stats = {
        'total_tickets': len(tickets),
        'duplicate_groups': len(duplicate_groups),
        'tickets_in_duplicates': sum(1 + len(g['related']) for g in duplicate_groups),
        'by_status': defaultdict(int),
        'by_type': defaultdict(int),
        'by_priority': defaultdict(int)
    }

    for ticket in tickets:
        stats['by_status'][ticket['fields']['status']['name']] += 1
        stats['by_type'][ticket['fields']['issuetype']['name']] += 1
        priority = ticket['fields'].get('priority')
        if priority:
            stats['by_priority'][priority.get('name', 'None')] += 1
        else:
            stats['by_priority']['None'] += 1

    return stats

def generate_markdown_report(tickets, duplicate_groups, duplicates, stats):
    """Generate comprehensive markdown report"""
    report = []

    # Header
    report.append("# JIRA Duplicate Detection Analysis Report")
    report.append(f"**Project**: AV11 - Aurigraph DLT V11")
    report.append(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    report.append(f"**Analysis Method**: Text similarity + keyword matching\n")
    report.append("---\n")

    # Executive Summary
    report.append("## 1. Executive Summary\n")
    report.append(f"- **Total Tickets Analyzed**: {stats['total_tickets']}")
    report.append(f"- **Duplicate Groups Identified**: {stats['duplicate_groups']}")
    report.append(f"- **Tickets Involved in Duplicates**: {stats['tickets_in_duplicates']}")
    report.append(f"- **Duplicate Prevalence**: {round(stats['tickets_in_duplicates'] / stats['total_tickets'] * 100, 2) if stats['total_tickets'] > 0 else 0}%")

    # Risk assessment
    if stats['duplicate_groups'] == 0:
        report.append(f"- **Risk Level**: ✅ **LOW** - No significant duplicates detected")
    elif stats['duplicate_groups'] <= 5:
        report.append(f"- **Risk Level**: ⚠️  **MODERATE** - {stats['duplicate_groups']} duplicate groups require attention")
    else:
        report.append(f"- **Risk Level**: 🔴 **HIGH** - {stats['duplicate_groups']} duplicate groups detected\n")

    report.append("\n---\n")

    # Detailed Duplicate Analysis
    report.append("## 2. Duplicate Analysis\n")

    if duplicate_groups:
        report.append(f"Found **{len(duplicate_groups)}** duplicate groups:\n")

        for idx, group in enumerate(sorted(duplicate_groups, key=lambda x: x['similarity'], reverse=True), 1):
            report.append(f"### Group {idx}: {group['primary']} + {len(group['related'])} Related Ticket(s)\n")
            report.append(f"**Similarity Score**: {group['similarity']}%\n")

            # Primary ticket info
            primary_ticket = next(t for t in tickets if t['key'] == group['primary'])
            report.append(f"**Primary Ticket**: [{group['primary']}] {primary_ticket['fields']['summary']}")
            report.append(f"- **Status**: {primary_ticket['fields']['status']['name']}")
            report.append(f"- **Type**: {primary_ticket['fields']['issuetype']['name']}")
            report.append(f"- **Created**: {primary_ticket['fields']['created'][:10]}\n")

            # Related tickets
            report.append("**Related Tickets**:\n")
            for detail in group['details']:
                related_key = detail['tickets'][1] if detail['tickets'][0] == group['primary'] else detail['tickets'][0]
                related_ticket = next(t for t in tickets if t['key'] == related_key)
                report.append(f"- [{related_key}] {related_ticket['fields']['summary']}")
                report.append(f"  - **Similarity**: {detail['similarity']}% (Summary: {detail['summary_similarity']}%, Description: {detail['description_similarity']}%)")
                report.append(f"  - **Status**: {related_ticket['fields']['status']['name']}")
                report.append(f"  - **Common Keywords**: {', '.join(detail['common_keywords'][:7]) if detail['common_keywords'] else 'N/A'}\n")

            # Recommendation
            report.append("**Recommendation**:")
            all_statuses = [primary_ticket['fields']['status']['name']] + [next(t for t in tickets if t['key'] == rk)['fields']['status']['name'] for rk in group['related']]

            if any(s in ['Done', 'Closed'] for s in all_statuses):
                report.append("- ✅ **CLOSE/LINK** - Link related tickets and close duplicates\n")
            elif group['similarity'] >= 90:
                report.append("- 🔴 **MERGE IMMEDIATELY** - High similarity, likely exact duplicates\n")
            elif group['similarity'] >= 80:
                report.append("- ⚠️  **REVIEW & MERGE** - Very similar, review and consolidate\n")
            else:
                report.append("- 📋 **LINK** - Similar topics, link for reference\n")

            report.append("---\n")
    else:
        report.append("✅ **No duplicate groups detected** with current threshold (70% similarity)\n")
        report.append("---\n")

    # Statistics
    report.append("## 3. Statistics\n")
    report.append("### 3.1 Overall Metrics\n")
    report.append(f"- **Total Tickets**: {stats['total_tickets']}")
    report.append(f"- **Duplicate Groups**: {stats['duplicate_groups']}")
    report.append(f"- **Duplicate Prevalence**: {round(stats['tickets_in_duplicates'] / stats['total_tickets'] * 100, 2) if stats['total_tickets'] > 0 else 0}%\n")

    report.append("### 3.2 Breakdown by Status\n")
    for status, count in sorted(stats['by_status'].items(), key=lambda x: x[1], reverse=True):
        pct = round(count / stats['total_tickets'] * 100, 1)
        report.append(f"- **{status}**: {count} ({pct}%)")
    report.append("")

    report.append("### 3.3 Breakdown by Issue Type\n")
    for itype, count in sorted(stats['by_type'].items(), key=lambda x: x[1], reverse=True):
        pct = round(count / stats['total_tickets'] * 100, 1)
        report.append(f"- **{itype}**: {count} ({pct}%)")
    report.append("")

    report.append("### 3.4 Breakdown by Priority\n")
    priority_order = {'Highest': 0, 'High': 1, 'Medium': 2, 'Low': 3, 'Lowest': 4, 'None': 5}
    for priority, count in sorted(stats['by_priority'].items(), key=lambda x: priority_order.get(x[0], 99)):
        pct = round(count / stats['total_tickets'] * 100, 1)
        report.append(f"- **{priority}**: {count} ({pct}%)")
    report.append("\n---\n")

    # Recommendations
    report.append("## 4. Recommendations\n")

    if duplicate_groups:
        report.append("### 4.1 Priority Order for Duplicate Resolution\n")
        priority_groups = sorted(duplicate_groups, key=lambda x: (x['similarity'], len(x['related'])), reverse=True)
        for idx, group in enumerate(priority_groups[:10], 1):
            report.append(f"{idx}. **{group['primary']}** - Similarity: {group['similarity']}%, Related: {len(group['related'])} ticket(s)")
        report.append("")

        report.append("### 4.2 Suggested Actions\n")
        report.append("1. **Immediate Review**: Groups with >90% similarity")
        report.append("2. **Link Related Tickets**: Use JIRA 'relates to' or 'duplicates' link types")
        report.append("3. **Consolidate Information**: Merge valuable information from duplicates into primary ticket")
        report.append("4. **Close Duplicates**: After consolidation, close duplicate tickets with proper comments")
        report.append("5. **Update Workflow**: Implement duplicate prevention measures\n")
    else:
        report.append("### 4.1 Current Status\n")
        report.append("✅ **No duplicates detected** - JIRA project is well-maintained\n")

    report.append("### 4.3 Workflow Improvements to Prevent Future Duplicates\n")
    report.append("1. **Search Before Create**: Require search step before ticket creation")
    report.append("2. **Template Standardization**: Use consistent ticket templates")
    report.append("3. **Auto-Duplicate Detection**: Enable JIRA's built-in duplicate detection")
    report.append("4. **Regular Audits**: Monthly duplicate detection analysis")
    report.append("5. **Keyword Tagging**: Consistent use of labels and components")
    report.append("6. **Team Training**: Educate team on duplicate prevention\n")
    report.append("---\n")

    # Impact Assessment
    report.append("## 5. Impact Assessment\n")

    if duplicate_groups:
        time_savings = len(duplicate_groups) * 2  # Assume 2 hours per duplicate group
        report.append(f"### 5.1 Time Savings from Consolidation\n")
        report.append(f"- **Estimated Time Savings**: ~{time_savings} hours")
        report.append(f"- **Reduced Confusion**: Eliminate {stats['tickets_in_duplicates']} duplicate tickets")
        report.append(f"- **Improved Clarity**: Consolidated information in {len(duplicate_groups)} primary tickets\n")

        report.append(f"### 5.2 Resource Allocation Optimization\n")
        report.append(f"- **Developer Time**: Reduce context switching by consolidating duplicates")
        report.append(f"- **PM Time**: Clearer sprint planning with deduplicated backlog")
        report.append(f"- **QA Time**: Fewer redundant test cases\n")
    else:
        report.append("### 5.1 Current Impact\n")
        report.append("✅ **Minimal Impact** - No duplicates requiring consolidation\n")

    report.append("### 5.3 Sprint Planning Improvements\n")
    if duplicate_groups:
        report.append(f"- **Backlog Clarity**: {stats['tickets_in_duplicates']} fewer tickets to manage")
        report.append(f"- **Velocity Accuracy**: More accurate sprint planning without duplicate estimates")
        report.append(f"- **Team Focus**: Reduced confusion about which tickets to work on\n")
    else:
        report.append("- **Current Status**: Sprint planning already optimized with no duplicates\n")

    report.append("---\n")

    # Footer
    report.append("## Appendix: Analysis Methodology\n")
    report.append("**Similarity Algorithm**:")
    report.append("- Text similarity using SequenceMatcher (Python difflib)")
    report.append("- Weighted scoring: 70% summary + 30% description")
    report.append("- Keyword extraction and matching")
    report.append("- Threshold: 70% similarity for duplicate detection\n")
    report.append("**Data Sources**:")
    report.append("- JIRA REST API v3")
    report.append("- Project: AV11 (Aurigraph DLT V11)")
    report.append(f"- Tickets Analyzed: {stats['total_tickets']}\n")
    report.append("---\n")
    report.append(f"*Report generated by JIRA Duplicate Detection Tool - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n")

    return '\n'.join(report)

def main():
    # Load JIRA data
    try:
        with open('/tmp/jira_tickets_full.json', 'r') as f:
            data = json.load(f)
            tickets = data.get('issues', [])
    except FileNotFoundError:
        print("Error: /tmp/jira_tickets_full.json not found", file=sys.stderr)
        sys.exit(1)

    if not tickets:
        print("Error: No tickets found in data", file=sys.stderr)
        sys.exit(1)

    print(f"Analyzing {len(tickets)} tickets...", file=sys.stderr)

    # Analyze duplicates
    duplicate_groups, all_duplicates = analyze_duplicates(tickets, similarity_threshold=70)

    print(f"Found {len(duplicate_groups)} duplicate groups", file=sys.stderr)

    # Generate statistics
    stats = generate_statistics(tickets, duplicate_groups)

    # Generate report
    report = generate_markdown_report(tickets, duplicate_groups, all_duplicates, stats)

    print(report)

    # Also save detailed JSON for reference
    analysis_data = {
        'generated': datetime.now().isoformat(),
        'statistics': dict(stats),
        'duplicate_groups': duplicate_groups,
        'all_duplicates': all_duplicates
    }

    with open('/tmp/jira_duplicate_analysis.json', 'w') as f:
        json.dump(analysis_data, f, indent=2, default=str)

    print(f"\n\nDetailed analysis saved to: /tmp/jira_duplicate_analysis.json", file=sys.stderr)

if __name__ == '__main__':
    main()
