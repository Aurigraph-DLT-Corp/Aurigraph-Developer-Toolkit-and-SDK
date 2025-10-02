# Git SSH Quick Reference
## Aurigraph DLT Repository

**Repository**: Aurigraph-DLT-Corp/Aurigraph-DLT
**SSH URL**: git@github.com:Aurigraph-DLT-Corp/Aurigraph-DLT.git
**Authenticated User**: SUBBUAURIGRAPH
**Current Branch**: sprints-1-4-clean
**Main Branch**: main

---

## ✅ SSH Connection Status

```bash
# Test SSH connection
ssh -T git@github.com

# Expected output:
# Hi SUBBUAURIGRAPH! You've successfully authenticated, but GitHub does not provide shell access.
```

**Status**: ✅ SSH authentication working

---

## Common Git Operations

### Check Status

```bash
# View changed files
git status

# Short status
git status --short

# View current branch
git branch --show-current
```

### View Changes

```bash
# View unstaged changes
git diff

# View staged changes
git diff --cached

# View all changes
git diff HEAD

# View changes for specific file
git diff path/to/file
```

### Stage and Commit

```bash
# Stage specific files
git add file1.md file2.sh

# Stage all changes
git add .

# Stage only tracked files
git add -u

# Commit with message
git commit -m "feat: Add GitHub-JIRA sync infrastructure"

# Commit with detailed message
git commit -m "feat: Add GitHub-JIRA sync infrastructure

- Created bidirectional sync workflow
- Added standalone sync script
- Documented setup process
- Organized 60+ JIRA tasks into epics"
```

### Push and Pull

```bash
# Push to current branch
git push

# Push to remote branch (first time)
git push -u origin branch-name

# Pull latest changes
git pull

# Pull with rebase
git pull --rebase

# Fetch without merging
git fetch origin
```

### Branch Operations

```bash
# List all branches
git branch -a

# Create new branch
git checkout -b feature-name

# Switch to branch
git checkout branch-name

# Switch to main
git checkout main

# Delete local branch
git branch -d branch-name

# Delete remote branch
git push origin --delete branch-name
```

### Remote Operations

```bash
# View remotes
git remote -v

# Add remote
git remote add origin git@github.com:Aurigraph-DLT-Corp/Aurigraph-DLT.git

# Change remote URL to SSH
git remote set-url origin git@github.com:Aurigraph-DLT-Corp/Aurigraph-DLT.git

# Verify remote
git remote show origin
```

---

## Current Repository State

### Remote Configuration

```
origin  git@github.com:Aurigraph-DLT-Corp/Aurigraph-DLT.git (fetch)
origin  git@github.com:Aurigraph-DLT-Corp/Aurigraph-DLT.git (push)
```

**Status**: ✅ Using SSH (secure, no password required)

### Branch Information

- **Current Branch**: `sprints-1-4-clean`
- **Main Branch**: `main`
- **Recent Commits**:
  - `c44f6599` - Production-grade code refactoring for v3.6 HTTPS deployment
  - `384fcd50` - Sprints 1-4 Complete - Enterprise Portal, Security & Performance

---

## Workflow for GitHub-JIRA Sync Files

### Commit and Push Sync Infrastructure

```bash
cd /Users/subbujois/Documents/GitHub/Aurigraph-DLT

# Check what's changed
git status

# Add sync files
git add .github/workflows/github-jira-sync.yml
git add aurigraph-av10-7/aurigraph-v11-standalone/sync-github-jira.sh
git add aurigraph-av10-7/aurigraph-v11-standalone/GITHUB-JIRA-SYNC-*.md
git add aurigraph-av10-7/aurigraph-v11-standalone/JIRA-ORGANIZATION-*.md
git add aurigraph-av10-7/aurigraph-v11-standalone/organize-jira-epics.sh
git add aurigraph-av10-7/aurigraph-v11-standalone/update-jira-v36-status.sh

# Commit
git commit -m "feat: Add GitHub-JIRA bidirectional sync infrastructure

- Created GitHub Actions workflow for automated sync
- Added standalone sync script (sync-github-jira.sh)
- Organized 60+ JIRA tasks into respective epics
- Updated V3.6 tasks to completed status
- Documented setup and usage

Components:
- Bidirectional sync (JIRA ↔ GitHub)
- Epic to milestone conversion
- Label mapping (type, priority, status)
- Rate limiting and error handling

JIRA: AV11 project (160+ tickets)
Status: Ready for first sync"

# Push to current branch
git push

# Or push to specific branch
git push origin sprints-1-4-clean
```

### Create Pull Request

```bash
# Using GitHub CLI
gh pr create \
  --title "feat: GitHub-JIRA Bidirectional Sync Infrastructure" \
  --body "## Summary

Complete GitHub-JIRA synchronization infrastructure for Aurigraph V11.

## Changes

- ✅ GitHub Actions workflow for automated sync
- ✅ Standalone sync script (160+ JIRA tickets)
- ✅ JIRA organization (60+ tasks linked to epics)
- ✅ V3.6 tasks updated to completed status
- ✅ Comprehensive documentation

## Features

- Bidirectional sync (JIRA ↔ GitHub)
- Epic → Milestone conversion (34 epics)
- Label mapping (type, priority, status)
- Automatic triggers on push/PR/issue events
- Manual trigger with 5 sync modes

## JIRA Status

- **Total Tickets**: 160+
- **Epics**: 34 organized
- **Tasks Organized**: 60+ linked
- **Unlinked Tasks**: 0
- **V3.6 Completion**: 70% (7/10 tasks done)

## Testing

- ✅ JIRA API authentication verified
- ✅ Task organization complete
- ✅ Status updates successful
- ⏳ GitHub sync pending (requires PAT)

## Links

- JIRA Board: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11/boards/789
- Setup Guide: \`GITHUB-JIRA-SYNC-SETUP.md\`
- Status Report: \`GITHUB-JIRA-SYNC-STATUS.md\`

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>" \
  --base main

# Or open PR in browser
gh pr create --web
```

---

## SSH Key Management

### Check SSH Keys

```bash
# List SSH keys
ls -la ~/.ssh/

# View public key
cat ~/.ssh/id_ed25519.pub
# or
cat ~/.ssh/id_rsa.pub
```

### Test SSH Connection

```bash
# Test GitHub SSH
ssh -T git@github.com

# Verbose output for debugging
ssh -vT git@github.com
```

### Add New SSH Key to GitHub

1. Generate key (if needed):
   ```bash
   ssh-keygen -t ed25519 -C "subbu@aurigraph.io"
   ```

2. Copy public key:
   ```bash
   pbcopy < ~/.ssh/id_ed25519.pub
   ```

3. Add to GitHub:
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Paste key and save

---

## Typical Development Workflow

### Feature Development

```bash
# 1. Start from main branch
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/github-jira-sync

# 3. Make changes and commit
git add .
git commit -m "feat: Add sync infrastructure"

# 4. Push to remote
git push -u origin feature/github-jira-sync

# 5. Create PR
gh pr create --web

# 6. After PR approval, merge and cleanup
git checkout main
git pull origin main
git branch -d feature/github-jira-sync
```

### Hotfix Workflow

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# 2. Make fix and commit
git add .
git commit -m "fix: Critical issue in sync script"

# 3. Push and create PR
git push -u origin hotfix/critical-fix
gh pr create --label "hotfix" --label "priority:critical"

# 4. Fast-track merge
```

---

## Git Aliases (Optional)

Add to `~/.gitconfig`:

```ini
[alias]
    st = status
    co = checkout
    br = branch
    ci = commit
    ca = commit --amend
    cp = cherry-pick
    unstage = reset HEAD --
    last = log -1 HEAD
    visual = log --graph --oneline --decorate --all
    sync = !git fetch origin && git rebase origin/main
```

Usage:
```bash
git st          # git status
git co main     # git checkout main
git visual      # Pretty log view
```

---

## Troubleshooting

### SSH Issues

**Problem**: Permission denied (publickey)

**Solution**:
```bash
# Check SSH agent
ssh-add -l

# Add key to agent
ssh-add ~/.ssh/id_ed25519

# Test connection with verbose output
ssh -vT git@github.com
```

### Push Rejected

**Problem**: Updates were rejected because the remote contains work that you do not have locally

**Solution**:
```bash
# Pull with rebase
git pull --rebase origin branch-name

# Resolve conflicts if any
git add conflicted-file
git rebase --continue

# Push
git push
```

### Merge Conflicts

**Solution**:
```bash
# View conflicted files
git status

# Edit files to resolve conflicts
# Look for <<<<<<< HEAD markers

# Mark as resolved
git add resolved-file

# Complete merge
git commit
```

---

## Quick Commands

```bash
# Commit all changes with message
git commit -am "message"

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Discard all local changes
git reset --hard HEAD

# View commit history
git log --oneline -10

# View specific file history
git log --follow path/to/file

# Show changes in specific commit
git show commit-hash

# Create tag
git tag -a v3.6.0 -m "V3.6 Multi-Node Release"
git push origin v3.6.0
```

---

## GitHub CLI Commands

### Issues

```bash
# List issues
gh issue list

# Create issue
gh issue create --title "Bug: Sync fails" --body "Description"

# View issue
gh issue view 123

# Close issue
gh issue close 123
```

### Pull Requests

```bash
# List PRs
gh pr list

# View PR
gh pr view 456

# Checkout PR locally
gh pr checkout 456

# Merge PR
gh pr merge 456 --merge
```

### Workflows

```bash
# List workflows
gh workflow list

# Run workflow
gh workflow run github-jira-sync.yml

# View workflow runs
gh run list --workflow=github-jira-sync.yml

# View run details
gh run view 123456
```

---

## Summary

| Component | Status | URL |
|-----------|--------|-----|
| SSH Authentication | ✅ Working | SUBBUAURIGRAPH |
| Remote URL | ✅ SSH | git@github.com:Aurigraph-DLT-Corp/Aurigraph-DLT.git |
| Current Branch | ✅ Active | sprints-1-4-clean |
| Main Branch | ✅ Available | main |
| Recent Changes | ✅ Staged | 100+ files |

---

*Repository: Aurigraph-DLT-Corp/Aurigraph-DLT*
*User: SUBBUAURIGRAPH*
*Date: October 2, 2025*
