#!/usr/bin/env python3
"""
JIRA Duplicate Ticket Analyzer for AV11 Project
Performs comprehensive duplicate detection using multiple strategies.
"""

import json
import re
from difflib import SequenceMatcher
from collections import defaultdict
from typing import List, Dict, Tuple, Set

class JIRADuplicateAnalyzer:
    def __init__(self, tickets_file: str):
        with open(tickets_file, 'r') as f:
            data = json.load(f)
        self.tickets = data.get('issues', [])
        self.duplicates = []

    def extract_text_from_description(self, desc) -> str:
        """Extract plain text from JIRA's structured description format."""
        if not desc:
            return ""

        if isinstance(desc, str):
            return desc

        if isinstance(desc, dict):
            text_parts = []

            def extract_content(node):
                if isinstance(node, dict):
                    if node.get('type') == 'text':
                        text_parts.append(node.get('text', ''))
                    elif 'content' in node:
                        for child in node['content']:
                            extract_content(child)
                elif isinstance(node, list):
                    for item in node:
                        extract_content(item)

            extract_content(desc)
            return ' '.join(text_parts)

        return str(desc)

    def normalize_text(self, text: str) -> str:
        """Normalize text for comparison."""
        if not text:
            return ""
        # Convert to lowercase, remove extra whitespace
        text = text.lower()
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\w\s]', '', text)
        return text.strip()

    def calculate_similarity(self, text1: str, text2: str) -> float:
        """Calculate similarity score between two texts using SequenceMatcher."""
        return SequenceMatcher(None, text1, text2).ratio()

    def extract_keywords(self, text: str) -> Set[str]:
        """Extract important keywords from text."""
        # Common stop words to ignore
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
                      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
                      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
                      'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that'}

        words = text.lower().split()
        keywords = {w for w in words if len(w) > 3 and w not in stop_words}
        return keywords

    def find_summary_duplicates(self, threshold: float = 0.85) -> List[Dict]:
        """Find tickets with very similar summaries."""
        duplicates = []

        for i, ticket1 in enumerate(self.tickets):
            for ticket2 in self.tickets[i+1:]:
                summary1 = self.normalize_text(ticket1['fields'].get('summary', ''))
                summary2 = self.normalize_text(ticket2['fields'].get('summary', ''))

                if not summary1 or not summary2:
                    continue

                similarity = self.calculate_similarity(summary1, summary2)

                if similarity >= threshold:
                    duplicates.append({
                        'type': 'summary_match',
                        'ticket1': ticket1['key'],
                        'ticket2': ticket2['key'],
                        'summary1': ticket1['fields']['summary'],
                        'summary2': ticket2['fields']['summary'],
                        'similarity': similarity,
                        'status1': ticket1['fields']['status']['name'],
                        'status2': ticket2['fields']['status']['name'],
                    })

        return duplicates

    def find_description_duplicates(self, threshold: float = 0.75) -> List[Dict]:
        """Find tickets with very similar descriptions."""
        duplicates = []

        for i, ticket1 in enumerate(self.tickets):
            for ticket2 in self.tickets[i+1:]:
                desc1_raw = ticket1['fields'].get('description')
                desc2_raw = ticket2['fields'].get('description')

                desc1 = self.normalize_text(self.extract_text_from_description(desc1_raw))
                desc2 = self.normalize_text(self.extract_text_from_description(desc2_raw))

                if not desc1 or not desc2 or len(desc1) < 20 or len(desc2) < 20:
                    continue

                similarity = self.calculate_similarity(desc1, desc2)

                if similarity >= threshold:
                    duplicates.append({
                        'type': 'description_match',
                        'ticket1': ticket1['key'],
                        'ticket2': ticket2['key'],
                        'summary1': ticket1['fields']['summary'],
                        'summary2': ticket2['fields']['summary'],
                        'similarity': similarity,
                        'status1': ticket1['fields']['status']['name'],
                        'status2': ticket2['fields']['status']['name'],
                        'desc_preview1': desc1[:100] + '...' if len(desc1) > 100 else desc1,
                        'desc_preview2': desc2[:100] + '...' if len(desc2) > 100 else desc2,
                    })

        return duplicates

    def find_label_duplicates(self, min_common_labels: int = 2, similarity_threshold: float = 0.6) -> List[Dict]:
        """Find tickets with same labels and similar content."""
        duplicates = []

        # Group tickets by labels
        label_groups = defaultdict(list)
        for ticket in self.tickets:
            labels = tuple(sorted(ticket['fields'].get('labels', [])))
            if labels:
                label_groups[labels].append(ticket)

        # Check tickets within same label groups
        for labels, group in label_groups.items():
            if len(group) < 2 or len(labels) < min_common_labels:
                continue

            for i, ticket1 in enumerate(group):
                for ticket2 in group[i+1:]:
                    summary1 = self.normalize_text(ticket1['fields'].get('summary', ''))
                    summary2 = self.normalize_text(ticket2['fields'].get('summary', ''))

                    if not summary1 or not summary2:
                        continue

                    similarity = self.calculate_similarity(summary1, summary2)

                    if similarity >= similarity_threshold:
                        duplicates.append({
                            'type': 'label_content_match',
                            'ticket1': ticket1['key'],
                            'ticket2': ticket2['key'],
                            'summary1': ticket1['fields']['summary'],
                            'summary2': ticket2['fields']['summary'],
                            'common_labels': list(labels),
                            'similarity': similarity,
                            'status1': ticket1['fields']['status']['name'],
                            'status2': ticket2['fields']['status']['name'],
                        })

        return duplicates

    def find_linked_duplicates(self) -> List[Dict]:
        """Find tickets that are marked as duplicates via JIRA links."""
        duplicates = []

        for ticket in self.tickets:
            issue_links = ticket['fields'].get('issuelinks', [])

            for link in issue_links:
                if link['type']['name'] == 'Duplicate':
                    # Check if outward (this duplicates another)
                    if 'outwardIssue' in link:
                        other = link['outwardIssue']
                        duplicates.append({
                            'type': 'jira_linked_duplicate',
                            'ticket1': ticket['key'],
                            'ticket2': other['key'],
                            'summary1': ticket['fields']['summary'],
                            'summary2': other['fields']['summary'],
                            'link_type': 'duplicates',
                            'status1': ticket['fields']['status']['name'],
                            'status2': other['fields']['status']['name'],
                        })
                    # Check if inward (duplicated by another)
                    elif 'inwardIssue' in link:
                        other = link['inwardIssue']
                        duplicates.append({
                            'type': 'jira_linked_duplicate',
                            'ticket1': other['key'],
                            'ticket2': ticket['key'],
                            'summary1': other['fields']['summary'],
                            'summary2': ticket['fields']['summary'],
                            'link_type': 'is duplicated by',
                            'status1': other['fields']['status']['name'],
                            'status2': ticket['fields']['status']['name'],
                        })

        return duplicates

    def find_keyword_duplicates(self, min_common_keywords: int = 4, similarity_threshold: float = 0.5) -> List[Dict]:
        """Find tickets with significant keyword overlap."""
        duplicates = []

        # Extract keywords for all tickets
        ticket_keywords = []
        for ticket in self.tickets:
            summary = ticket['fields'].get('summary', '')
            desc_raw = ticket['fields'].get('description')
            desc = self.extract_text_from_description(desc_raw)
            text = summary + ' ' + desc
            keywords = self.extract_keywords(text)
            ticket_keywords.append((ticket, keywords))

        # Compare keyword overlap
        for i, (ticket1, keywords1) in enumerate(ticket_keywords):
            for ticket2, keywords2 in ticket_keywords[i+1:]:
                if not keywords1 or not keywords2:
                    continue

                common = keywords1 & keywords2
                union = keywords1 | keywords2

                if len(common) >= min_common_keywords:
                    jaccard = len(common) / len(union) if union else 0

                    if jaccard >= similarity_threshold:
                        duplicates.append({
                            'type': 'keyword_overlap',
                            'ticket1': ticket1['key'],
                            'ticket2': ticket2['key'],
                            'summary1': ticket1['fields']['summary'],
                            'summary2': ticket2['fields']['summary'],
                            'common_keywords': sorted(list(common))[:10],  # Top 10
                            'keyword_count': len(common),
                            'jaccard_similarity': jaccard,
                            'status1': ticket1['fields']['status']['name'],
                            'status2': ticket2['fields']['status']['name'],
                        })

        return duplicates

    def analyze_all(self) -> Dict:
        """Run all duplicate detection strategies."""
        print(f"Analyzing {len(self.tickets)} tickets from AV11 project...")

        summary_dups = self.find_summary_duplicates(threshold=0.85)
        print(f"Found {len(summary_dups)} summary duplicates")

        desc_dups = self.find_description_duplicates(threshold=0.75)
        print(f"Found {len(desc_dups)} description duplicates")

        label_dups = self.find_label_duplicates(min_common_labels=2, similarity_threshold=0.6)
        print(f"Found {len(label_dups)} label-based duplicates")

        linked_dups = self.find_linked_duplicates()
        print(f"Found {len(linked_dups)} JIRA-linked duplicates")

        keyword_dups = self.find_keyword_duplicates(min_common_keywords=4, similarity_threshold=0.5)
        print(f"Found {len(keyword_dups)} keyword-overlap duplicates")

        # Consolidate and deduplicate results
        all_dups = []
        seen_pairs = set()

        for dup_list in [summary_dups, desc_dups, label_dups, linked_dups, keyword_dups]:
            for dup in dup_list:
                pair = tuple(sorted([dup['ticket1'], dup['ticket2']]))
                if pair not in seen_pairs:
                    seen_pairs.add(pair)
                    all_dups.append(dup)
                else:
                    # Add detection type to existing duplicate
                    for existing in all_dups:
                        existing_pair = tuple(sorted([existing['ticket1'], existing['ticket2']]))
                        if existing_pair == pair:
                            if 'detection_methods' not in existing:
                                existing['detection_methods'] = [existing['type']]
                            existing['detection_methods'].append(dup['type'])
                            break

        # Sort by confidence (tickets detected by multiple methods)
        for dup in all_dups:
            if 'detection_methods' in dup:
                dup['confidence'] = len(set(dup['detection_methods']))
            else:
                dup['confidence'] = 1

        all_dups.sort(key=lambda x: x['confidence'], reverse=True)

        return {
            'total_tickets': len(self.tickets),
            'total_duplicate_pairs': len(all_dups),
            'summary_duplicates': len(summary_dups),
            'description_duplicates': len(desc_dups),
            'label_duplicates': len(label_dups),
            'linked_duplicates': len(linked_dups),
            'keyword_duplicates': len(keyword_dups),
            'duplicates': all_dups,
        }

    def generate_report(self, results: Dict) -> str:
        """Generate a human-readable report."""
        report = []
        report.append("=" * 80)
        report.append("JIRA DUPLICATE TICKET ANALYSIS - AV11 PROJECT")
        report.append("=" * 80)
        report.append("")
        report.append(f"Total Tickets Analyzed: {results['total_tickets']}")
        report.append(f"Total Duplicate Pairs Found: {results['total_duplicate_pairs']}")
        report.append("")
        report.append("Detection Methods:")
        report.append(f"  - Summary Matches: {results['summary_duplicates']}")
        report.append(f"  - Description Matches: {results['description_duplicates']}")
        report.append(f"  - Label-Based Matches: {results['label_duplicates']}")
        report.append(f"  - JIRA-Linked Duplicates: {results['linked_duplicates']}")
        report.append(f"  - Keyword Overlap Matches: {results['keyword_duplicates']}")
        report.append("")
        report.append("=" * 80)
        report.append("DUPLICATE PAIRS (Sorted by Confidence)")
        report.append("=" * 80)
        report.append("")

        for i, dup in enumerate(results['duplicates'], 1):
            report.append(f"{i}. {dup['ticket1']} ↔ {dup['ticket2']}")
            report.append(f"   Confidence: {dup['confidence']}/5 (detected by {dup['confidence']} method(s))")
            report.append(f"   Detection Type: {dup['type']}")

            if 'detection_methods' in dup:
                methods = ', '.join(set(dup['detection_methods']))
                report.append(f"   All Methods: {methods}")

            report.append(f"   Status: {dup['status1']} | {dup['status2']}")
            report.append("")
            report.append(f"   [{dup['ticket1']}] {dup['summary1']}")
            report.append(f"   [{dup['ticket2']}] {dup['summary2']}")

            if 'similarity' in dup:
                report.append(f"   Similarity Score: {dup['similarity']:.2%}")

            if 'common_labels' in dup:
                report.append(f"   Common Labels: {', '.join(dup['common_labels'])}")

            if 'common_keywords' in dup:
                keywords = ', '.join(dup['common_keywords'])
                report.append(f"   Common Keywords ({dup['keyword_count']}): {keywords}")
                report.append(f"   Jaccard Similarity: {dup['jaccard_similarity']:.2%}")

            if 'link_type' in dup:
                report.append(f"   JIRA Link: {dup['ticket1']} {dup['link_type']} {dup['ticket2']}")

            if 'desc_preview1' in dup:
                report.append(f"   Description Preview:")
                report.append(f"     [{dup['ticket1']}] {dup['desc_preview1']}")
                report.append(f"     [{dup['ticket2']}] {dup['desc_preview2']}")

            report.append("")
            report.append("-" * 80)
            report.append("")

        # Add recommendations
        report.append("")
        report.append("=" * 80)
        report.append("RECOMMENDATIONS")
        report.append("=" * 80)
        report.append("")

        # Group by confidence level
        high_confidence = [d for d in results['duplicates'] if d['confidence'] >= 3]
        medium_confidence = [d for d in results['duplicates'] if d['confidence'] == 2]
        low_confidence = [d for d in results['duplicates'] if d['confidence'] == 1]

        if high_confidence:
            report.append(f"HIGH CONFIDENCE DUPLICATES ({len(high_confidence)} pairs):")
            report.append("These tickets were detected by 3+ methods and are very likely duplicates.")
            report.append("Recommendation: Review and consolidate immediately.")
            for dup in high_confidence:
                report.append(f"  - {dup['ticket1']} ↔ {dup['ticket2']}")
            report.append("")

        if medium_confidence:
            report.append(f"MEDIUM CONFIDENCE DUPLICATES ({len(medium_confidence)} pairs):")
            report.append("These tickets were detected by 2 methods.")
            report.append("Recommendation: Review for potential consolidation.")
            for dup in medium_confidence:
                report.append(f"  - {dup['ticket1']} ↔ {dup['ticket2']}")
            report.append("")

        if low_confidence:
            report.append(f"LOW CONFIDENCE DUPLICATES ({len(low_confidence)} pairs):")
            report.append("These tickets were detected by 1 method only.")
            report.append("Recommendation: Manual review to confirm if they are true duplicates.")
            report.append(f"  (Showing first 10 of {len(low_confidence)})")
            for dup in low_confidence[:10]:
                report.append(f"  - {dup['ticket1']} ↔ {dup['ticket2']}")
            report.append("")

        # Status-based recommendations
        done_done = [d for d in results['duplicates'] if d['status1'] == 'Done' and d['status2'] == 'Done']
        if done_done:
            report.append(f"BOTH DONE ({len(done_done)} pairs):")
            report.append("Both tickets are marked as Done. Consider closing one as duplicate.")
            for dup in done_done[:5]:
                report.append(f"  - {dup['ticket1']} ↔ {dup['ticket2']}")
            report.append("")

        todo_done = [d for d in results['duplicates']
                     if (d['status1'] == 'To Do' and d['status2'] == 'Done') or
                        (d['status1'] == 'Done' and d['status2'] == 'To Do')]
        if todo_done:
            report.append(f"TODO vs DONE ({len(todo_done)} pairs):")
            report.append("One ticket is Done, other is To Do. Close To Do as duplicate.")
            for dup in todo_done[:5]:
                report.append(f"  - {dup['ticket1']} ↔ {dup['ticket2']}")
            report.append("")

        return '\n'.join(report)


def main():
    analyzer = JIRADuplicateAnalyzer('/Users/subbujois/subbuworkingdir/Aurigraph-DLT/jira_tickets_raw.json')
    results = analyzer.analyze_all()
    report = analyzer.generate_report(results)

    # Save results
    with open('/Users/subbujois/subbuworkingdir/Aurigraph-DLT/duplicate_analysis_results.json', 'w') as f:
        json.dump(results, f, indent=2)

    with open('/Users/subbujois/subbuworkingdir/Aurigraph-DLT/duplicate_analysis_report.txt', 'w') as f:
        f.write(report)

    print("\n" + report)
    print("\nResults saved to:")
    print("  - duplicate_analysis_results.json (structured data)")
    print("  - duplicate_analysis_report.txt (human-readable report)")


if __name__ == '__main__':
    main()
