# JIRA Documentation Archive

This directory contains obsolete, superseded, or dead JIRA documentation and tooling archived on October 30, 2025.

## Purpose

The JIRA documentation archive maintains historical references while keeping the active project root clean and focused on current, authoritative documentation.

## Directory Structure

### old-guides/
Old JIRA management and update guides that have been superseded by more current documentation.

**Contents:**
- `JIRA-CLEANUP-STRATEGY-OCT10-2025.md` - Old cleanup strategy document (superseded by JIRA-CLEANUP-AND-ARCHIVE.md)

**Status:** Reference only. Use current guides in project root for active work.

### superseded/
Sprint planning and roadmap documents that have been superseded by more recent planning materials.

**Contents:**
- `JIRA-ROADMAP-SPRINTS-15-18.md` - Old sprint roadmap for sprints 15-18 (superseded by SPRINT_PLAN.md)
- `JIRA-TICKETS-CREATED-SUMMARY.md` - Old summary of created tickets (superseded by JIRA_TICKETS_SUMMARY.md)
- `JIRA_TICKETS_TO_CREATE.md` - Old template for tickets to create (superseded by JIRA_TICKETS.json)
- `JIRA_UPDATE_PLAN.md` - Old update planning document (superseded by JIRA-TICKET-UPDATE-GUIDE.md)

**Status:** Historical reference only. Use current planning documents for new work.

### old-reports/
This directory would contain dated JIRA verification and audit reports that have been superseded by comprehensive current reports.

**Expected Contents:**
- JIRA verification reports for old ticket ranges
- Single-date status reports
- Old audit findings (superseded by JIRA-AUDIT-REPORT.md and JIRA-AUDIT-CURRENT-STATUS.md)

**Status:** Archive placeholder. Reports are consolidated into current audit framework.

### deprecated-tools/
Old automation scripts and tools that have been replaced by newer versions or approaches.

**Expected Contents:**
- Legacy JIRA ticket creation scripts
- Old shell/Python tools
- Outdated test utilities
- Temporary work files

**Status:** Do NOT use in production. Refer to current Python tools in project root.

## Active Documentation

For current JIRA work, use these authoritative documents in the **project root**:

### JIRA Audit & Status
- **`JIRA-AUDIT-CURRENT-STATUS.md`** - Phase 4 execution planning and current audit status
- **`JIRA-AUDIT-REPORT.md`** - Comprehensive audit methodology and reference
- **`jira-audit-tool.py`** - Python tool for batch ticket auditing and analysis

### JIRA Ticket Management
- **`JIRA-TICKET-UPDATE-GUIDE.md`** - Step-by-step setup and update procedures
- **`JIRA_TICKETS_SUMMARY.md`** - Current Phase 4 ticket summary (9 tickets)
- **`JIRA_TICKETS.json`** - Authoritative ticket definitions in JSON format

### Sprint Planning
- **`SPRINT-13-15-JIRA-TICKETS.md`** - Sprint tickets defined and structured
- **`SPRINT_PLAN.md`** - Current sprint objectives and timeline

### GitHub Integration
- **`JIRA-GITHUB-SYNC-STATUS.md`** - Current sync status and integration status

## Archival Policy

Documents are archived when they meet one or more of these criteria:

1. **Superseded**: Replaced by a newer, more comprehensive version
2. **Obsolete**: No longer relevant to active sprints or projects
3. **Old**: Reports from >30 days ago without current updates
4. **Dead**: No activity or references for 30+ days
5. **Consolidated**: Information merged into a current document

## Maintenance Schedule

**Weekly:**
- Review old reports for potential archival (>7 days old)
- Check for newly obsolete guides

**Monthly:**
- Archive closed tickets
- Review and update archive index (this file)
- Clean up temporary files from archive

**Quarterly:**
- Full archive review
- Remove duplicates within archive
- Update archival policy if needed

## How to Use This Archive

### For Reference
To review old approaches or historical context:
```bash
cd .archive/jira-docs/
ls -la superseded/          # View old planning docs
ls -la old-guides/          # View old guides
```

### For Migration
To understand how something was previously done:
1. Find the relevant archived file
2. Compare with current authoritative document
3. Note any historical patterns or lessons learned

### For Cleanup
To add new files to archive:
```bash
# Move obsolete file
mv ../old-file.md ./superseded/

# Update this README with the new file
# Then commit: git add .archive/ && git commit -m "docs: Archive <filename>"
```

## Search Tips

To find files in the archive:
```bash
# Find all files mentioning "consensus"
grep -r "consensus" .archive/jira-docs/

# List all markdown files
find .archive/jira-docs -name "*.md"

# Check archive size
du -sh .archive/jira-docs/
```

## Quick Links to Active Documentation

### Project Root Location
```
aurigraph-v11-standalone/
├── JIRA-AUDIT-CURRENT-STATUS.md
├── JIRA-AUDIT-REPORT.md
├── JIRA-TICKET-UPDATE-GUIDE.md
├── JIRA_TICKETS_SUMMARY.md
├── JIRA_TICKETS.json
├── SPRINT-13-15-JIRA-TICKETS.md
├── jira-audit-tool.py
└── .archive/              (This directory)
```

## Key Metrics

**Archive Contents:**
- Superseded planning docs: 4 files
- Old guides: 1 file
- Old reports: (placeholder, 0 files)
- Deprecated tools: (placeholder, 0 files)

**Active Documentation:**
- Audit/status files: 3 files
- Ticket management: 3 files
- Planning documents: 2 files
- Tools: 1 Python script

## Contact & Updates

**Last Updated:** October 30, 2025
**Maintained By:** Claude Code
**Next Review:** November 30, 2025

For questions about archival or to propose new archival, refer to `JIRA-CLEANUP-AND-ARCHIVE.md` in the project root.

---

**Archive Status:** ✅ Active and Maintained
