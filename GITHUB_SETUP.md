# GitHub Repository Setup Guide

This guide shows how to push the Aurigraph SDK repository to GitHub.

## Prerequisites

- GitHub account
- Git installed locally
- SSH or HTTPS credentials configured for GitHub

## Step 1: Create Repository on GitHub

### Via Web UI

1. Go to https://github.com/new
2. **Repository name**: `aurigraph-sdk`
3. **Description**: "Official TypeScript SDK and Developer Toolkit for Aurigraph DLT V11"
4. **Visibility**: Public
5. **Initialize with**: Leave unchecked (we already have files)
6. Click "Create repository"

### Via GitHub CLI

```bash
gh repo create aurigraph-sdk \
  --public \
  --source=/tmp/aurigraph-sdk \
  --remote=origin \
  --push
```

## Step 2: Configure Repository (Web UI)

After creating the repository, configure these settings:

### General Settings
- **Default branch**: `main` ✅
- **Template repository**: Unchecked
- **Discussions**: Enabled (Optional)
- **Projects**: Enabled (Optional)

### Branch Protection Rules

Create a branch protection rule for `main`:

1. Go to **Settings** → **Branches**
2. Click **Add rule**
3. **Branch name pattern**: `main`
4. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Dismiss stale reviews on new pushes
   - ✅ Require code reviews before merging (1 approval)
   - ✅ Require conversation resolution before merging

### Labels

Create these issue labels:

- `bug` - Red (#d73a4a)
- `documentation` - Blue (#0075ca)
- `enhancement` - Green (#a2eeef)
- `good first issue` - Yellow (#7057ff)
- `help wanted` - Orange (#008672)
- `security` - Purple (#d876e3)

### CODEOWNERS

Create `.github/CODEOWNERS`:

```
# Global owners
* @Aurigraph-DLT/sdk-maintainers

# Documentation
/docs/ @Aurigraph-DLT/documentation
*.md @Aurigraph-DLT/documentation

# Examples
/examples/ @Aurigraph-DLT/sdk-maintainers

# TypeScript
/src/ @Aurigraph-DLT/sdk-maintainers

# Tests
/tests/ @Aurigraph-DLT/qa
```

## Step 3: Push to GitHub

### Using HTTPS

```bash
cd /tmp/aurigraph-sdk

# Add remote
git remote add origin https://github.com/Aurigraph-DLT/aurigraph-sdk.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Using SSH

```bash
cd /tmp/aurigraph-sdk

# Add remote
git remote add origin git@github.com:Aurigraph-DLT/aurigraph-sdk.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 4: Verify Push

```bash
# Check remote
git remote -v

# View last commits
git log --oneline -5
```

Expected output:
```
origin  https://github.com/Aurigraph-DLT/aurigraph-sdk.git (fetch)
origin  https://github.com/Aurigraph-DLT/aurigraph-sdk.git (push)

9912a6f 🚀 Initial release: Aurigraph SDK v1.0.0
```

## Step 5: Setup GitHub Actions (Optional)

### Create `.github/workflows/test.yml`

```yaml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x, 21.x]

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run lint
        run: npm run lint

      - name: Run tests
        run: npm run test:run

      - name: Generate coverage
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## Step 6: Add Topics (GitHub)

Add these topics to make the SDK discoverable:

- `aurigraph`
- `blockchain`
- `dlt`
- `sdk`
- `typescript`
- `nodejs`
- `api-client`
- `rest-api`
- `real-time-events`

## Step 7: Create Initial Discussions (Optional)

Go to **Discussions** tab and pin:

1. **Welcome Discussion**
   ```
   # Welcome to Aurigraph SDK! 👋

   This is the official SDK for Aurigraph DLT V11.

   - [📖 Documentation](../docs)
   - [🚀 Getting Started](../docs/GETTING_STARTED.md)
   - [💡 Examples](../examples)
   ```

2. **Announcements Category**
   - Release announcements
   - Major updates
   - Breaking changes

## Step 8: Publish to NPM (Optional)

### Prerequisites

```bash
npm login  # Login to npm account
```

### Update package.json

```json
{
  "name": "@aurigraph/sdk",
  "version": "1.0.0",
  "publishConfig": {
    "registry": "https://registry.npmjs.org/",
    "access": "public"
  }
}
```

### Publish

```bash
npm publish

# Or with tag
npm publish --tag latest
```

### Verify

```bash
npm info @aurigraph/sdk
npm view @aurigraph/sdk versions
```

## Step 9: Setup README Badges (Update in README.md)

```markdown
[![npm version](https://img.shields.io/npm/v/@aurigraph/sdk)](https://www.npmjs.com/package/@aurigraph/sdk)
[![GitHub](https://img.shields.io/badge/github-aurigraph%2Faurigraph--sdk-blue)](https://github.com/Aurigraph-DLT/aurigraph-sdk)
[![Tests](https://github.com/Aurigraph-DLT/aurigraph-sdk/workflows/Test/badge.svg)](https://github.com/Aurigraph-DLT/aurigraph-sdk/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

## Complete Checklist

- [ ] Repository created on GitHub
- [ ] Files pushed successfully
- [ ] Branch protection rules enabled
- [ ] CODEOWNERS file created
- [ ] GitHub Actions workflow setup
- [ ] Topics added
- [ ] README badges updated
- [ ] NPM package published
- [ ] GitHub discussions setup
- [ ] Documentation links verified

## Verification Commands

```bash
# Clone and verify
git clone https://github.com/Aurigraph-DLT/aurigraph-sdk.git
cd aurigraph-sdk

# Check files
ls -la
tree -I node_modules

# Verify git history
git log --oneline

# Check package
npm info @aurigraph/sdk
```

## Post-Setup Tasks

### Create Release

```bash
# Tag the version
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Create GitHub Release (via web UI)
# 1. Go to Releases
# 2. Click "Create a new release"
# 3. Choose tag v1.0.0
# 4. Add release notes
# 5. Publish release
```

### Link in Main Repository

Add to main Aurigraph repository:

```markdown
## 📦 Developer Toolkit

- **SDK Repository**: https://github.com/Aurigraph-DLT/aurigraph-sdk
- **NPM Package**: https://www.npmjs.com/package/@aurigraph/sdk
- **Documentation**: See [SDK README](../aurigraph-sdk)
```

### Update Organization

1. Add repository to GitHub organization
2. Set appropriate team permissions
3. Configure branch rules
4. Enable pull request templates

## Support & Issues

After setup:

1. Create issue templates
2. Configure issue labels
3. Setup GitHub discussions
4. Create community guidelines

## Security

- [ ] Enable branch protection
- [ ] Configure CODEOWNERS
- [ ] Setup security scanning
- [ ] Enable Dependabot
- [ ] Configure secret scanning

## Reference Links

- **Repository**: https://github.com/Aurigraph-DLT/aurigraph-sdk
- **NPM Package**: https://www.npmjs.com/package/@aurigraph/sdk
- **Documentation**: https://docs.aurigraph.io
- **Issues**: https://github.com/Aurigraph-DLT/aurigraph-sdk/issues
- **Discussions**: https://github.com/Aurigraph-DLT/aurigraph-sdk/discussions

---

**Repository setup complete!** 🎉
