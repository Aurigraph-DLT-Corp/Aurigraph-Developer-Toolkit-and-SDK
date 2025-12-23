# JIRA Integration Setup Guide

## Overview
This repository is configured with comprehensive GitHub Actions workflows that automatically sync with JIRA for complete project management integration.

## Prerequisites

### 1. GitHub Secrets Configuration
Add the following secrets to your GitHub repository:

```bash
# Navigate to: Settings > Secrets and variables > Actions

JIRA_API_TOKEN    # Your JIRA API token
```

Current token (for reference - store securely):
```
ATATT3xFfGF0lM8vRlqVHtgMi3GIxEBJYTuEA5xv0R_wMrc2wMquvtNmMmzjPuF0Jr0GDMGeBcOBfea9gbxG41jJEeV9QaFaLwKHYXZOqeSVttRjisilfp-8Dy0DcGQZreM7BwSkw5flTBwBI5DwSLaCJNRgKsjRPQuFS2HseulYEcEYF2qsO6w=2E35545C
```

### 2. JIRA Configuration
Ensure your JIRA instance has:
- API access enabled
- Appropriate user permissions for the API token
- Board ID: 789 (Aurigraph V11 Board)
- Project Key: AV11

## Workflows

### 1. `jira-integration.yml`
**Purpose**: Main integration workflow for issue tracking and status updates

**Triggers**:
- Push to main/develop/feature branches
- Pull request events
- Issue creation/closure
- Release publication
- Manual trigger

**Features**:
- Automatically extracts JIRA issue keys from branch names (format: `AV11-XXX`)
- Updates issue status based on GitHub events
- Creates bidirectional links between PRs and JIRA issues
- Syncs deployment information
- Creates JIRA issues from GitHub issues

### 2. `jira-build-status.yml`
**Purpose**: Syncs build and test results with JIRA

**Triggers**:
- Push events
- Pull request updates
- CI/CD pipeline completion

**Features**:
- Sends build status to JIRA
- Updates test results and metrics
- Links commits and branches to issues
- Provides test coverage reports

### 3. `jira-sprint-automation.yml`
**Purpose**: Automates sprint management tasks

**Triggers**:
- Weekly schedule (Mondays at 9 AM UTC)
- Manual trigger with action selection

**Features**:
- Creates new sprints automatically
- Closes completed sprints
- Updates burndown charts
- Generates sprint reports
- Auto-assigns issues based on components

## Usage

### Branch Naming Convention
Always include the JIRA issue key in your branch name:
```bash
git checkout -b feature/AV11-123-implement-new-feature
git checkout -b bugfix/AV11-456-fix-critical-bug
git checkout -b release/AV11-789-version-2.0
```

### Commit Messages
Include JIRA issue keys in commit messages for tracking:
```bash
git commit -m "AV11-123: Implement new consensus algorithm"
git commit -m "fix(AV11-456): Resolve memory leak in transaction pool"
```

### Pull Request Titles
Include the JIRA issue key in PR titles:
```
AV11-123: Add quantum-resistant cryptography support
[AV11-456] Fix: Resolve consensus timeout issues
```

### Manual Workflow Triggers

#### Update JIRA Issue Status
```bash
gh workflow run jira-integration.yml \
  -f jira_issue="AV11-123" \
  -f update_type="status"
```

#### Generate Sprint Report
```bash
gh workflow run jira-sprint-automation.yml \
  -f action="generate_report"
```

#### Create New Sprint
```bash
gh workflow run jira-sprint-automation.yml \
  -f action="create_sprint"
```

## JIRA Status Transitions

The workflows automatically transition issues through these states:

1. **To Do** → **In Progress**: When work begins (push to feature branch)
2. **In Progress** → **In Review**: When PR is opened
3. **In Review** → **Done**: When PR is merged
4. **Any** → **Blocked**: Manual update required

## Integration Features

### 1. Smart Issue Linking
- Automatically creates web links between GitHub PRs and JIRA issues
- Bi-directional navigation between platforms
- Shows PR status directly in JIRA

### 2. Build & Deployment Tracking
- Real-time build status updates
- Deployment environment tracking
- Test result synchronization
- Performance metrics reporting

### 3. Sprint Automation
- Automatic sprint creation based on schedule
- Velocity tracking and reporting
- Burndown chart updates
- Team performance metrics

### 4. Notifications
- Comments added to JIRA issues for major events
- Build failures trigger JIRA notifications
- Release notes automatically posted to relevant issues

## Troubleshooting

### Common Issues

1. **JIRA Key Not Found**
   - Ensure branch name follows convention: `feature/AV11-XXX-description`
   - Check PR title includes the JIRA key
   - Verify the issue exists in JIRA

2. **Authentication Failures**
   - Verify JIRA_API_TOKEN secret is set correctly
   - Check API token hasn't expired
   - Ensure user has appropriate JIRA permissions

3. **Workflow Not Triggering**
   - Check branch protection rules
   - Verify workflow file syntax
   - Review GitHub Actions quotas

### Debug Mode
Enable debug logging in workflows:
```yaml
env:
  ACTIONS_RUNNER_DEBUG: true
  ACTIONS_STEP_DEBUG: true
```

## Best Practices

1. **Always use JIRA issue keys** in branch names and PR titles
2. **Keep issues updated** - the automation supplements, not replaces, manual updates
3. **Review sprint reports** weekly to track team velocity
4. **Use components and labels** in JIRA for better auto-assignment
5. **Link related issues** to maintain traceability

## API Endpoints Used

### JIRA REST API v3
- `/rest/api/3/issue/{issueKey}` - Issue management
- `/rest/api/3/issue/{issueKey}/comment` - Comments
- `/rest/api/3/issue/{issueKey}/remotelink` - External links

### JIRA Agile API
- `/rest/agile/1.0/board/{boardId}/sprint` - Sprint management
- `/rest/agile/1.0/sprint/{sprintId}/issue` - Sprint issues

### JIRA DevOps API
- `/rest/builds/1.0/bulk` - Build information
- `/rest/deployments/1.0/bulk` - Deployment tracking

## Security Considerations

1. **Never commit API tokens** to the repository
2. **Use GitHub Secrets** for all sensitive data
3. **Rotate API tokens** regularly (every 90 days)
4. **Limit token permissions** to minimum required
5. **Audit webhook deliveries** regularly

## Support

For issues or questions:
1. Check workflow run logs in GitHub Actions tab
2. Review JIRA audit logs for API calls
3. Contact: devops@aurigraph.io
4. Create issue with label: `jira-integration`

## License
This integration is part of the Aurigraph V11 platform and follows the same licensing terms.