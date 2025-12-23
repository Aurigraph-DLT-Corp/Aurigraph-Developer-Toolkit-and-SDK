# JIRA Import Instructions - Enterprise Portal

## Overview

This guide walks you through importing the Enterprise Portal Epic and all 58 user stories into JIRA project AV11.

**File to Import**: `ENTERPRISE-PORTAL-JIRA-IMPORT.csv`  
**Total Tickets**: 60 (1 Epic + 58 Stories + 1 Header)  
**Project**: AV11 (https://aurigraphdlt.atlassian.net/projects/AV11)

---

## Prerequisites

### Required Permissions:
- [x] JIRA account access
- [x] AV11 project member
- [x] Permission to create issues
- [x] Permission to import CSV files

### Required Files:
- [x] `ENTERPRISE-PORTAL-JIRA-IMPORT.csv` (in repository root)

---

## Method 1: CSV Import (Recommended)

### Step 1: Access JIRA Project
1. Go to: https://aurigraphdlt.atlassian.net
2. Click on "Projects" in top menu
3. Select "AV11" project
4. Click on "Issues" in left sidebar

### Step 2: Start CSV Import
1. Click on "..." (more actions) button in top-right
2. Select "Import issues" → "Import issues from CSV"
3. Or directly go to: `https://aurigraphdlt.atlassian.net/secure/admin/ExternalImport1.jspa`

### Step 3: Upload CSV File
1. Click "Choose File" button
2. Navigate to repository: `/Users/subbujois/Documents/GitHub/Aurigraph-DLT/`
3. Select file: `ENTERPRISE-PORTAL-JIRA-IMPORT.csv`
4. Click "Next"

### Step 4: Configure Field Mapping

JIRA will auto-detect most fields. Verify these mappings:

| CSV Column | JIRA Field | Status |
|------------|------------|--------|
| Summary | Summary | ✅ Auto-mapped |
| Issue Type | Issue Type | ✅ Auto-mapped |
| Priority | Priority | ✅ Auto-mapped |
| Labels | Labels | ✅ Auto-mapped |
| Epic Name | Epic Name | ⚠️ May need manual mapping |
| Epic Link | Epic Link | ⚠️ May need manual mapping |
| Description | Description | ✅ Auto-mapped |
| Story Points | Story Points | ⚠️ Check custom field |
| Component/s | Components | ✅ Auto-mapped |
| Affects Version/s | Affects Versions | ✅ Auto-mapped |
| Fix Version/s | Fix Versions | ✅ Auto-mapped |

**Manual Mapping Steps**:
1. If "Epic Name" is not auto-mapped:
   - Find custom field `customfield_10011` (Epic Name)
   - Map CSV "Epic Name" → JIRA "Epic Name"

2. If "Epic Link" is not auto-mapped:
   - Find custom field `customfield_10014` (Epic Link)
   - Map CSV "Epic Link" → JIRA "Epic Link"

3. If "Story Points" is not auto-mapped:
   - Find custom field `customfield_10016` (Story Points)
   - Map CSV "Story Points" → JIRA "Story Points"

### Step 5: Validate Data
1. Review the preview of first few issues
2. Check that Epic appears first (row 1)
3. Verify user stories are linked to Epic
4. Confirm priorities are correct (Highest/High/Medium)
5. Click "Next"

### Step 6: Complete Import
1. Review summary: "60 issues will be imported"
2. Click "Begin Import"
3. Wait for completion (usually 30-60 seconds)
4. Click "View imported issues"

### Step 7: Verify Import

Navigate to your Epic:
1. Go to: https://aurigraphdlt.atlassian.net/projects/AV11/issues
2. Filter by: Epic = "Enterprise Portal - Production-Grade Blockchain Management Platform"
3. Verify you see:
   - ✅ 1 Epic ticket
   - ✅ 58 User Story tickets
   - ✅ All stories linked to Epic
   - ✅ Story points assigned
   - ✅ Priorities set correctly

---

## Method 2: Manual Creation (If CSV Fails)

If CSV import doesn't work due to permissions or field mapping issues, create tickets manually:

### Create Epic:
1. Click "Create" button
2. Select Issue Type: "Epic"
3. Fill in:
   - **Summary**: Enterprise Portal - Production-Grade Blockchain Management Platform
   - **Epic Name**: PORTAL-2025
   - **Description**: Copy from CSV or ENTERPRISE-PORTAL-FEATURES.md
   - **Story Points**: 793
   - **Priority**: High
   - **Labels**: enterprise-portal, v11, production
   - **Component**: Portal
   - **Affects Version**: 11.0.0
   - **Fix Version**: 11.1.0
4. Click "Create"
5. Note the Epic Key (e.g., AV11-123)

### Create User Stories:
For each of the 58 features in CSV:
1. Click "Create" button
2. Select Issue Type: "Story"
3. Fill in fields from CSV row
4. **Epic Link**: Select the Epic you created
5. Click "Create"

**Note**: This is time-consuming! CSV import is highly recommended.

---

## Method 3: Script-Based Import (Advanced)

### Using create-portal-epic.sh:
```bash
export JIRA_API_TOKEN="your-api-token-here"
./create-portal-epic.sh
```

**Note**: This only creates the Epic, not the stories. Use CSV for complete import.

### Using import-jira-tickets.js:
```bash
cd aurigraph-av10-7/aurigraph-v11-standalone/
export JIRA_API_TOKEN="your-api-token-here"
node import-jira-tickets.js
```

**Requirements**:
- Node.js installed
- JIRA API token with write permissions
- Modify script to read from ENTERPRISE-PORTAL-JIRA-IMPORT.csv

---

## Post-Import Tasks

### 1. Organize Epic
1. Open the Epic ticket
2. Add to current Sprint if appropriate
3. Set Epic color/icon (optional)
4. Pin to board (optional)

### 2. Create Sprints
1. Go to Backlog view
2. Create Sprint 1: "Portal Foundation" (Oct 7-18)
3. Create Sprint 2: "Dashboard & Analytics" (Oct 21-Nov 1)
4. Create Sprint 3-40 as needed

### 3. Assign Sprint 1 Stories
Based on SPRINT-1-PLAN.md, move these to Sprint 1:
- Implement Responsive Sidebar Navigation (3 pts)
- Build Top Navigation Bar with Search (5 pts)
- Create Key Performance Metrics Cards (5 pts)
- Implement TPS Performance Chart (5 pts)
- Create Responsive Grid Layout System (2 pts)

**Total**: 20 points

### 4. Assign Team Members
1. Open each Sprint 1 story
2. Assign to appropriate team member
3. Set status to "To Do"

### 5. Configure Board
1. Add Epic filter to board
2. Create swimlanes by Priority
3. Set WIP limits
4. Configure columns (To Do, In Progress, Review, Done)

---

## Troubleshooting

### Issue: CSV Import Button Not Visible
**Solution**: Check JIRA permissions. You need "Administer Projects" permission.

### Issue: Field Mapping Fails
**Solution**: 
1. Check that all custom fields exist in your JIRA instance
2. Admin → Issues → Custom fields
3. Create missing fields:
   - Epic Name (Text Field, Single Line)
   - Epic Link (Epic Link)
   - Story Points (Number Field)

### Issue: Epic Link Doesn't Connect
**Solution**:
1. Import Epic first (row 1)
2. Note the Epic Key
3. Update CSV "Epic Link" column with actual Epic Key
4. Re-import stories only (rows 2-59)

### Issue: Descriptions Are Truncated
**Solution**:
1. Use Manual Creation for Epic (detailed description)
2. CSV import for Stories (shorter descriptions acceptable)
3. Update descriptions post-import if needed

### Issue: Import Says "0 Issues Imported"
**Solution**:
1. Check CSV file encoding (should be UTF-8)
2. Ensure first row is header
3. Verify no empty rows in CSV
4. Try removing special characters from descriptions

---

## Verification Checklist

After import, verify:

- [ ] Epic ticket exists with key (e.g., AV11-EPIC-01)
- [ ] Epic has "Enterprise Portal" in summary
- [ ] Epic has 793 story points
- [ ] Epic has labels: enterprise-portal, v11, production
- [ ] All 58 user stories exist
- [ ] All stories linked to Epic
- [ ] Story points match CSV (range: 2-34 points)
- [ ] Priorities set correctly (22 Highest, 25 High, 4 Medium)
- [ ] Components assigned (Portal, Dashboard, Blockchain, etc.)
- [ ] Versions set (Affects: 11.0.0, Fix: 11.1.0 or 11.2.0)
- [ ] Descriptions are readable
- [ ] Labels are applied

---

## Quick Links

### JIRA:
- **Project**: https://aurigraphdlt.atlassian.net/projects/AV11
- **Board**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789
- **Backlog**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789/backlog
- **Import**: https://aurigraphdlt.atlassian.net/secure/admin/ExternalImport1.jspa

### Documentation:
- **Features**: ENTERPRISE-PORTAL-FEATURES.md
- **Sprint 1 Plan**: SPRINT-1-PLAN.md
- **Delivery Summary**: PORTAL-DELIVERY-SUMMARY.md

### Files:
- **CSV Import**: ENTERPRISE-PORTAL-JIRA-IMPORT.csv
- **Epic Script**: create-portal-epic.sh

---

## Support

### Issues with Import:
1. Check JIRA documentation: https://support.atlassian.com/jira-software-cloud/docs/import-data-from-a-csv-file/
2. Contact JIRA admin for permission issues
3. Use manual creation as fallback

### Questions about Stories:
1. Review ENTERPRISE-PORTAL-FEATURES.md for detailed specs
2. Check SPRINT-1-PLAN.md for implementation guidance
3. Refer to PORTAL-DELIVERY-SUMMARY.md for overview

---

## Success!

Once import is complete, you should have:

✅ **1 Epic** ready to track overall progress  
✅ **58 User Stories** ready for sprint planning  
✅ **793 Story Points** distributed across 4 phases  
✅ **Sprint 1** ready to start (20 points selected)  
✅ **18-month roadmap** visible in JIRA

**Next Steps:**
1. Review Sprint 1 plan (SPRINT-1-PLAN.md)
2. Assign stories to team members
3. Start Sprint 1 on October 7, 2025
4. Daily standups and progress tracking
5. Sprint review and demo on October 18, 2025

---

**Created**: October 3, 2025  
**Status**: Ready for Import  
**Estimated Import Time**: 5-10 minutes  

---

*🤖 Generated by Claude Code - Aurigraph Development Team*
