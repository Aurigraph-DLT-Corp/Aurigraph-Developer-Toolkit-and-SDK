# Git Push Troubleshooting Guide
## Aurigraph DLT Repository

**Issue**: `pack-objects died of signal 10` error when pushing
**Branch**: sprints-1-4-clean → main
**Commits to Push**: 3 commits (100+ files, ~50,000+ lines)
**Date**: October 2, 2025

---

## Current Status

### ✅ Local Commits Ready

All changes have been successfully committed locally:

```bash
4db808d1 chore: Update PRD and configuration files
e7e11f27 chore: Update submodule reference for JIRA sync
ee236614 feat: Add GitHub-JIRA sync workflow and documentation
```

**Total Changes**:
- **Files changed**: 100+ new files
- **Lines added**: ~50,000+ lines
- **Key components**:
  - GitHub-JIRA sync workflow (`.github/workflows/github-jira-sync.yml`)
  - JIRA organization scripts and reports
  - Security & quality workflows
  - MCP configuration
  - Comprehensive documentation

### ❌ Push Failing

**Error**:
```
error: pack-objects died of signal 10
error: remote unpack failed: index-pack failed
! [remote rejected] sprints-1-4-clean -> sprints-1-4-clean (failed)
```

**Signal 10 (SIGBUS)** indicates:
- Memory/RAM issues during pack compression
- Network interruption during transfer
- Git process crash during large file handling
- Possible disk I/O errors

---

## Solution Options

### Option 1: Use GitHub CLI to Create PR (Recommended)

Since local commits are safe, create a Pull Request instead of direct push:

```bash
# Install GitHub CLI if not installed
brew install gh

# Authenticate
gh auth login

# Create PR from current branch
gh pr create \
  --title "feat: GitHub-JIRA Sync Infrastructure & JIRA Organization" \
  --body "## Summary

Complete GitHub-JIRA synchronization infrastructure with comprehensive JIRA organization.

## Key Changes

### GitHub-JIRA Sync
- ✅ Bidirectional sync workflow (`.github/workflows/github-jira-sync.yml`)
- ✅ Standalone sync script (`sync-github-jira.sh`)
- ✅ Epic to milestone conversion
- ✅ Label mapping (type, priority, status)

### JIRA Organization
- ✅ 60+ tasks linked to respective epics
- ✅ V3.6 tasks updated to completed status (7/10 done)
- ✅ 0 unlinked tasks remaining
- ✅ 34 epics organized

### Documentation
- ✅ Comprehensive setup guides
- ✅ Git/SSH quick reference
- ✅ JIRA organization reports
- ✅ Security workflows

## Files Changed
- **New files**: 100+
- **Lines added**: ~50,000+
- **Components**: Workflows, scripts, documentation, configuration

## Testing
- ✅ JIRA API authentication verified
- ✅ Task organization complete
- ✅ Status updates successful
- ⏳ GitHub sync pending (requires PAT)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>" \
  --base main \
  --head sprints-1-4-clean

# View PR
gh pr view --web
```

**Benefits**:
- No need to resolve push issues
- Code review process
- CI/CD runs automatically
- Merge when ready

---

### Option 2: Push to New Branch

Create a fresh branch and push smaller commits:

```bash
# Create new branch from current state
git checkout -b github-jira-sync-v2

# Try pushing new branch (might work if remote doesn't have it)
git push -u origin github-jira-sync-v2

# If successful, create PR
gh pr create --base main --head github-jira-sync-v2
```

---

### Option 3: Use GitHub Desktop

If command-line push fails, use GitHub Desktop GUI:

1. **Download GitHub Desktop**: https://desktop.github.com/
2. **Open repository** in GitHub Desktop
3. **Review changes** in the UI
4. **Push** using the GUI (handles large pushes better)
5. **Create PR** from the app

---

### Option 4: Split Commits and Push Incrementally

Push one commit at a time:

```bash
# Create new branch at older commit
git checkout -b partial-sync ee236614

# Push first commit
git push -u origin partial-sync

# If successful, add more commits
git cherry-pick e7e11f27
git push origin partial-sync

# Continue for remaining commits
git cherry-pick 4db808d1
git push origin partial-sync
```

---

### Option 5: Compress and Clean Repository

Reduce repository size before pushing:

```bash
# Clean up repository
git gc --aggressive --prune=now

# Verify git integrity
git fsck --full

# Try push again
git push origin sprints-1-4-clean
```

---

### Option 6: Use SSH Compression

Configure SSH with compression:

```bash
# Edit ~/.ssh/config
cat >> ~/.ssh/config << 'EOF'
Host github.com
    Hostname github.com
    User git
    Compression yes
    CompressionLevel 9
EOF

# Try push with SSH
git push origin sprints-1-4-clean
```

---

### Option 7: Upload Patches Manually

Create patch files and apply on GitHub:

```bash
# Create patches for each commit
git format-patch HEAD~3

# This creates:
# 0001-feat-Add-GitHub-JIRA-sync-workflow-and-documentation.patch
# 0002-chore-Update-submodule-reference-for-JIRA-sync.patch
# 0003-chore-Update-PRD-and-configuration-files.patch

# Upload patches to GitHub as a new branch
# (Requires manual intervention on GitHub)
```

---

### Option 8: Wait and Retry

Sometimes the issue is temporary:

```bash
# Wait 30 minutes
sleep 1800

# Reset git config
git config --global --unset pack.windowMemory
git config --global --unset pack.packSizeLimit
git config --global --unset pack.threads
git config --global --unset http.postBuffer

# Retry push
git push origin sprints-1-4-clean
```

---

## Diagnostic Commands

### Check Repository Size

```bash
# Check repo size
du -sh .git

# Check largest files
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  awk '/^blob/ {print substr($0,6)}' | \
  sort --numeric-sort --key=2 | \
  tail -20

# Check pack file size
ls -lh .git/objects/pack/
```

### Verify Git Health

```bash
# Check for corruption
git fsck --full

# Check remote connectivity
ssh -T git@github.com

# Test network speed
curl -o /dev/null -w "Speed: %{speed_download} bytes/sec\n" \
  https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/info/refs
```

### Check System Resources

```bash
# Check available RAM
vm_stat | grep free

# Check disk space
df -h .

# Check for background processes
top -l 1 | head -20
```

---

## Recommended Workflow

**Step 1**: Create PR using GitHub CLI (Option 1)

```bash
gh pr create --fill
```

**Step 2**: If PR creation fails, use GitHub Desktop (Option 3)

**Step 3**: If all else fails, push to new branch (Option 2)

```bash
git checkout -b github-jira-sync-clean
git push -u origin github-jira-sync-clean
```

---

## Alternative: Manual Merge via GitHub Web UI

If push continues to fail:

1. **Create new branch** on GitHub web UI: `github-jira-sync`

2. **Upload key files manually**:
   - Go to: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
   - Switch to new branch
   - Click "Add file" → "Upload files"
   - Upload priority files:
     - `.github/workflows/github-jira-sync.yml`
     - `sync-github-jira.sh`
     - `GITHUB-JIRA-SYNC-*.md`
     - `JIRA-ORGANIZATION-*.md`

3. **Create PR** to merge uploaded files to main

4. **Add remaining files** in subsequent commits

---

## What's Safe

Your commits are **safe locally**:

```bash
# Verify commits exist
git log -3 --oneline
# 4db808d1 chore: Update PRD and configuration files
# e7e11f27 chore: Update submodule reference for JIRA sync
# ee236614 feat: Add GitHub-JIRA sync workflow and documentation

# All changes are committed
git status
# On branch sprints-1-4-clean
```

**Backup recommendation**:

```bash
# Create local backup
git bundle create ~/aurigraph-backup-$(date +%Y%m%d).bundle --all

# Backup is saved to: ~/aurigraph-backup-20251002.bundle
```

---

## Summary

| Option | Difficulty | Success Rate | Recommended |
|--------|-----------|--------------|-------------|
| **GitHub CLI PR** | Easy | High | ✅ Yes |
| **GitHub Desktop** | Easy | High | ✅ Yes |
| **New Branch** | Medium | Medium | ⚠️ Maybe |
| **Split Commits** | Hard | Medium | ⚠️ Maybe |
| **Wait & Retry** | Easy | Low | ❌ No |
| **Manual Upload** | Medium | High | ⚠️ Last resort |

---

## Next Steps

1. **Try GitHub CLI first** (fastest):
   ```bash
   gh pr create --fill
   ```

2. **If that fails, use GitHub Desktop** (most reliable for large pushes)

3. **Alternative**: Create new branch and try fresh push

All commits are safe locally - no data loss risk! 🎯

---

*Generated: October 2, 2025*
*Issue: pack-objects signal 10*
*Status: Local commits safe, remote push pending*
