# 🚀 GitHub Actions JIRA Integration Setup Guide

This guide will help you set up comprehensive JIRA integration with GitHub Actions for the Aurigraph DLT project.

## 📋 Overview

The integration provides:
- ✅ **Automatic JIRA issue creation** from GitHub issues
- ✅ **Commit-based JIRA updates** when commits reference AV11-XXX tickets
- ✅ **Pull Request lifecycle management** with JIRA status transitions
- ✅ **Review tracking** and comment synchronization
- ✅ **Branch-based status transitions** (main = Done, develop = In Review, etc.)
- ✅ **Bulk operations** for creating and updating all JIRA tickets
- ✅ **Project synchronization** between GitHub and JIRA
- ✅ **Data-driven ticket creation** from JSON/CSV files
- ✅ **Template-based ticket management**

## 🔧 Setup Instructions

### Step 1: Configure GitHub Repository Secrets

You need to add the following secrets to your GitHub repository:

1. Go to your repository: `https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT`
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:

#### Required Secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `JIRA_API_TOKEN` | `ATATT3xFfGF0lM8vRlqVHtgMi3GIxEBJYTuEA5xv0R_wMrc2wMquvtNmMmzjPuF0Jr0GDMGeBcOBfea9gbxG41jJEeV9QaFaLwKsjRPQuFS2HseulYEcEYF2qsO6w=2E35545C` | Your JIRA API token |

**Note**: The other JIRA configuration (base URL, email, project key) are already configured in the workflow files.

### Step 2: Verify Workflow Files

Ensure these workflow files are present in your repository:

```
.github/
├── workflows/
│   ├── jira-integration.yml          # Main JIRA integration workflow
│   ├── jira-commit-sync.yml          # Commit-based synchronization
│   ├── jira-pr-workflow.yml          # Pull request lifecycle management
│   ├── jira-bulk-operations.yml      # Bulk ticket operations
│   ├── jira-project-sync.yml         # Complete project synchronization
│   └── setup-jira-secrets.yml        # Setup and testing workflow
├── scripts/
│   ├── jira-utils.js                 # Utility functions for JIRA operations
│   └── jira-bulk-manager.js          # Advanced bulk operations manager
└── data/
    └── tickets-data.json              # Sample ticket data for bulk creation
```

### Step 3: Test the Integration

#### Test 1: Commit with JIRA Reference
```bash
git commit -m "feat(AV11-123): Add new quantum encryption feature

This commit implements the quantum encryption algorithm
for enhanced security in the blockchain platform."
```

#### Test 2: Create Pull Request with JIRA Reference
- Create a PR with title: `feat: Implement AV11-456 - Cross-chain bridge`
- Include `AV11-456` in the PR description

#### Test 3: Create GitHub Issue
- Create a new GitHub issue
- The workflow will automatically create a corresponding JIRA issue

## 🎯 How It Works

### Commit Synchronization
When you push commits that reference JIRA issues (format: `AV11-XXX`):
1. **Extracts** JIRA issue numbers from commit messages
2. **Adds comments** to JIRA issues with commit details
3. **Transitions issues** based on target branch:
   - `main` → **Done**
   - `develop` → **In Review**
   - `feature/*` → **In Progress**
   - `hotfix/*` → **In Progress**

### Bulk Operations
The system supports comprehensive bulk operations for managing all JIRA tickets:

#### Available Bulk Operations
- **create-from-data**: Create tickets from JSON/CSV data files
- **update-all-tickets**: Update all existing tickets in the project
- **sync-github-issues**: Sync all GitHub issues to JIRA
- **bulk-transition**: Transition multiple tickets to a new status
- **create-from-template**: Create tickets using predefined templates
- **project-cleanup**: Clean up and organize project tickets
- **export-tickets**: Export all tickets to JSON/CSV format

### Pull Request Lifecycle
When you create/update pull requests:
1. **PR Opened** → Adds comment to JIRA, transitions to "In Review"
2. **PR Merged** → Adds success comment, transitions to "Done" (if main branch)
3. **PR Closed** → Adds closure comment
4. **PR Reviews** → Adds review comments with approval status

### GitHub Issues
When you create GitHub issues:
1. **Auto-creates** corresponding JIRA issue
2. **Links** GitHub issue to JIRA issue
3. **Syncs** labels and metadata

## 📝 Usage Examples

### Commit Message Formats
```bash
# Single JIRA issue
git commit -m "fix(AV11-789): Resolve consensus algorithm bug"

# Multiple JIRA issues
git commit -m "feat: Implement AV11-123 and AV11-456 integration"

# With detailed description
git commit -m "feat(AV11-999): Add quantum cryptography

- Implement post-quantum algorithms
- Add quantum key distribution
- Update security protocols

Resolves AV11-999"
```

### Pull Request Titles
```
feat: Implement AV11-123 - Quantum consensus algorithm
fix: Resolve AV11-456 - Memory leak in validator nodes
docs: Update AV11-789 - API documentation improvements
```

### Branch Naming (Optional but Recommended)
```
feature/AV11-123-quantum-consensus
hotfix/AV11-456-memory-leak
release/AV11-789-v2.1.0
```

## 🔍 Monitoring and Troubleshooting

### Check Workflow Runs
1. Go to **Actions** tab in your GitHub repository
2. Look for workflow runs named:
   - "JIRA Integration - Main Workflow"
   - "JIRA Commit Synchronization"
   - "JIRA Pull Request Workflow"

### Common Issues and Solutions

#### Issue: JIRA API Token Invalid
**Solution**: Regenerate JIRA API token and update GitHub secret

#### Issue: No JIRA Issues Found
**Solution**: Ensure commit messages/PR titles contain `AV11-XXX` format

#### Issue: Transition Failed
**Solution**: Check JIRA workflow - ensure target status exists and is available

#### Issue: Permission Denied
**Solution**: Verify JIRA user has permission to comment and transition issues

### Debug Information
Each workflow provides detailed summary information in the GitHub Actions interface, including:
- Number of JIRA issues found and updated
- Transition attempts and results
- API response codes and error messages

## 🎛️ Configuration Options

### Environment Variables (in workflow files)
```yaml
env:
  JIRA_BASE_URL: https://aurigraphdlt.atlassian.net
  JIRA_PROJECT_KEY: AV11
  JIRA_EMAIL: subbu@aurigraph.io
```

### Customizing Transitions
Edit the workflow files to modify status transitions:
- **jira-commit-sync.yml**: Line ~180 (branch-based transitions)
- **jira-pr-workflow.yml**: Line ~60 (PR-based transitions)

### Adding Custom Fields
Modify the `jira-utils.js` script to include additional JIRA fields:
```javascript
const issueData = {
  fields: {
    // ... existing fields
    customfield_10001: "Custom value",
    labels: ["github-sync", "automated"]
  }
};
```

## 🔗 JIRA Project Links

- **AV11 Project**: https://aurigraphdlt.atlassian.net/projects/AV11
- **AV11 Board**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789
- **Create Issue**: https://aurigraphdlt.atlassian.net/secure/CreateIssue.jspa?pid=10001

## 🎉 Success Indicators

When properly configured, you should see:
- ✅ JIRA comments appear automatically when pushing commits
- ✅ JIRA issues transition status based on PR events
- ✅ GitHub issues create corresponding JIRA issues
- ✅ Workflow runs complete successfully in GitHub Actions

## 📞 Support

If you encounter issues:
1. Check the **Actions** tab for detailed error logs
2. Verify JIRA API token permissions
3. Ensure JIRA issue keys follow `AV11-XXX` format
4. Review workflow file configurations

---

**🚀 Ready to automate your JIRA workflow with GitHub Actions!**
