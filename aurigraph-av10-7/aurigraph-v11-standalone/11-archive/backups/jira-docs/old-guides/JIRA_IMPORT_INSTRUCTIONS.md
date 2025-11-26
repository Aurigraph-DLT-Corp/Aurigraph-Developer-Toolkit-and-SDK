# JIRA Ticket Import Instructions for AV11 Enterprise Portal

## Overview
This guide will help you import 15 user stories (157 story points) into your JIRA AV11 project board.

**Project:** AV11
**Board:** https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789
**Email:** subbu@aurigraph.io

---

## Option 1: Automated Import (Recommended)

### Step 1: Generate JIRA API Token

1. Visit: https://id.atlassian.com/manage-profile/security/api-tokens
2. Log in with: **subbu@aurigraph.io**
3. Click **"Create API token"**
4. Name: `AV11 Portal Development`
5. Click **Create**
6. **Copy the token immediately** (you won't see it again!)

### Step 2: Run Import Script

```bash
cd aurigraph-v11-standalone

# Set your API token as environment variable
export JIRA_API_TOKEN="your_token_here"

# Run the import
node import-jira-tickets.js
```

### Expected Output
```
🚀 Starting JIRA Ticket Import for AV11 Enterprise Portal
======================================================================

📋 Fetching JIRA project configuration...
✅ Found 5 issue types in project AV11

📌 Creating Epic...
✅ Epic created: AV11-XXX

📝 Creating 15 User Stories...

  ✅ Story created: AV11-XXX (5 SP)
  ✅ Story created: AV11-XXX (13 SP)
  ... (13 more stories)

======================================================================
✅ Import Complete!

Epic Created: AV11-XXX - Enterprise Portal API Integration & Dashboard Development
Stories Created: 15/15

View in JIRA: https://aurigraphdlt.atlassian.net/browse/AV11-XXX
======================================================================
```

---

## Option 2: Manual Import via JIRA Web UI

If automated import fails, follow these steps to manually create tickets:

### Step 1: Create Epic

1. Go to: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789
2. Click **"Create"** button (top right)
3. Select **Issue Type:** Epic
4. Fill in:
   - **Summary:** Enterprise Portal API Integration & Dashboard Development
   - **Description:** Complete integration of Aurigraph V11 Enterprise Portal with production API endpoints deployed at dlt.aurigraph.io:9003. This epic covers infrastructure setup, authentication, dashboard integration, and missing UI development.
   - **Labels:** enterprise-portal, ui, api-integration, v11
   - **Priority:** Highest
5. Click **Create**
6. **Note the Epic Key** (e.g., AV11-100)

### Step 2: Create User Stories (15 Stories)

For each story in `JIRA_TICKETS.json`, create a new issue:

1. Click **"Create"** button
2. Select **Issue Type:** Story
3. Fill in from the JSON data:
   - **Summary:** (from `summary` field)
   - **Description:** (from `description` field)
   - **Epic Link:** (select the epic created in Step 1)
   - **Story Points:** (from `storyPoints` field)
   - **Priority:** (from `priority` field)
   - **Labels:** (from `labels` array)
   - **Sprint:** (from `sprint` field - assign later if sprints not created)
4. Click **Create**
5. Repeat for all 15 stories

### Story Summary (for reference):

| # | Summary | SP | Priority | Sprint |
|---|---------|----|---------:|--------|
| 1 | Build API Client Service Layer for V11 Integration | 5 | Highest | Sprint 1 |
| 2 | Implement JWT Authentication System for Enterprise Portal | 13 | Highest | Sprint 1-2 |
| 3 | Setup Global State Management with Redux Toolkit | 8 | Highest | Sprint 2 |
| 4 | Implement Real-Time Data Infrastructure (WebSocket/Polling) | 13 | High | Sprint 3 |
| 5 | Integrate Dashboard with Production API Endpoints | 13 | Highest | Sprint 3 |
| 6 | Integrate Transactions Page with API (Submit & View) | 13 | Highest | Sprint 4 |
| 7 | Build Performance Testing Dashboard | 8 | High | Sprint 5 |
| 8 | Build Batch Transaction Upload Interface | 8 | High | Sprint 5 |
| 9 | Integrate Security Page with Quantum Crypto API | 8 | High | Sprint 6 |
| 10 | Build Consensus Management Dashboard | 13 | High | Sprint 6 |
| 11 | Build Cross-Chain Bridge Dashboard | 8 | High | Sprint 7 |
| 12 | Integrate Bridge Page with Transfer API | 8 | Medium | Sprint 7 |
| 13 | Build HMS Integration Dashboard | 8 | Medium | Sprint 8 |
| 14 | Build AI Optimization Control Panel | 13 | High | Sprint 9 |
| 15 | Final Polish, Testing & Production Deployment | 18 | High | Sprint 10 |

**Total: 157 Story Points**

---

## Option 3: Bulk Import via CSV

JIRA supports CSV import. I can generate a CSV file if you prefer:

### Step 1: Generate CSV

```bash
cd aurigraph-v11-standalone
node generate-jira-csv.js
```

This will create `jira-import.csv`

### Step 2: Import in JIRA

1. Go to JIRA Settings → System → Import & Export → External System Import
2. Select **CSV**
3. Upload `jira-import.csv`
4. Map fields and complete import wizard

---

## Troubleshooting

### "Authentication failed (401)"
- Your API token has expired or is invalid
- Generate a new token at: https://id.atlassian.com/manage-profile/security/api-tokens
- Make sure you're using the correct email: **subbu@aurigraph.io**

### "Project not found (404)"
- Verify project key is **AV11**
- Check you have access to: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11

### "Rate limited (429)"
- JIRA API has rate limits
- The import script includes 500ms delays between requests
- If still hitting limits, wait 1 hour and retry

### Stories created but not linked to Epic
- Manually add Epic Link:
  1. Open each story
  2. Click "Link" → "Link to Epic"
  3. Select the created epic

---

## Post-Import Steps

After successful import:

1. **Create Sprints** (if not already created):
   - Sprint 1 (Oct 7-18, 2025)
   - Sprint 2 (Oct 21-Nov 1, 2025)
   - ... through Sprint 10

2. **Assign Stories to Sprints**:
   - Drag stories from backlog to appropriate sprint

3. **Assign Team Members**:
   - Update assignee field for each story

4. **Start Sprint 1**:
   - Click "Start Sprint" on Sprint 1
   - Set sprint goals

5. **Setup Sprint Board**:
   - Configure columns: To Do, In Progress, In Review, Done
   - Add swimlanes by assignee or priority

---

## Next Steps

Once tickets are imported:

1. Review all stories with the team
2. Refine story points if needed
3. Identify team members for assignment
4. Schedule Sprint 1 planning meeting
5. Begin development work

---

## Support

If you encounter issues with the import:
- Check `jira-import-summary.json` for details
- Review script output for error messages
- Contact JIRA support if API issues persist

**Script Location:** `aurigraph-v11-standalone/import-jira-tickets.js`
**Tickets JSON:** `aurigraph-v11-standalone/JIRA_TICKETS.json`
