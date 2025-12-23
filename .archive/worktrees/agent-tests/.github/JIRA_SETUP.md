# GitHub Actions JIRA Integration Setup

## Required GitHub Secrets

To enable automated JIRA updates via GitHub Actions, configure the following secrets in your GitHub repository:

### 1. Navigate to Repository Settings
```
Repository > Settings > Secrets and variables > Actions
```

### 2. Add the following secrets:

#### JIRA_USER
- **Value**: Your JIRA email address
- **Example**: `user@aurigraph.io`

#### JIRA_TOKEN
- **Value**: JIRA API Token (not password)
- **How to generate**:
  1. Log in to JIRA at https://aurigraphdlt.atlassian.net
  2. Go to Account Settings > Security > API tokens
  3. Click "Create API token"
  4. Name it "GitHub Actions"
  5. Copy the generated token

### 3. Verify Workflow File

Ensure `.github/workflows/jira-update.yml` exists and contains:
- Correct JIRA base URL: `https://aurigraphdlt.atlassian.net`
- Correct project key: `AV11`
- Correct transition IDs for your workflow

## JIRA Workflow Transition IDs

Common transition IDs (verify in your JIRA instance):
- **To Do → In Progress**: 21
- **In Progress → In Review**: 31
- **In Review → Done**: 41
- **Any → To Do**: 11

To find your transition IDs:
```bash
curl -u "email:token" \
  "https://aurigraphdlt.atlassian.net/rest/api/3/issue/AV11-1/transitions"
```

## Testing the Integration

1. Make a commit with a JIRA ticket ID:
```bash
git commit -m "feat(AV11-123): Complete feature implementation"
```

2. Push to trigger the workflow:
```bash
git push origin main
```

3. Check GitHub Actions tab for workflow execution
4. Verify JIRA ticket has been updated

## Troubleshooting

### Common Issues:

1. **Authentication Failed**
   - Verify JIRA_USER is your email, not username
   - Ensure JIRA_TOKEN is an API token, not password
   - Check token hasn't expired

2. **Transition Failed**
   - Verify transition IDs match your workflow
   - Ensure ticket is in correct status for transition
   - Check user has permission to transition ticket

3. **Ticket Not Found**
   - Ensure ticket ID format is correct (AV11-XXX)
   - Verify ticket exists in JIRA
   - Check project key is correct

## Security Notes

- Never commit credentials to the repository
- Use GitHub Secrets for all sensitive data
- Rotate API tokens regularly
- Limit token permissions in JIRA when possible
- Use environment-specific tokens for different environments

## Workflow Features

The GitHub Actions workflow automatically:
- Extracts JIRA ticket IDs from commit messages
- Transitions tickets based on commit keywords
- Adds comments with commit details
- Updates epic progress
- Creates releases when tagged

## Commit Message Format

For best results, use conventional commits:
```
feat(AV11-123): Add new feature
fix(AV11-124): Fix bug in module
chore(AV11-125): Update dependencies
docs(AV11-126): Update documentation
```

Keywords that trigger transitions:
- `feat`, `feature` + `complete` → Done
- `WIP`, `wip`, `progress` → In Progress
- `fix`, `bugfix`, `hotfix` → In Review