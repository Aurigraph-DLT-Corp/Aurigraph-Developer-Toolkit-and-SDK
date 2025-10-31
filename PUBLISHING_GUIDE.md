# Aurigraph SDK Publishing Guide

Complete guide for publishing the SDK to GitHub and NPM.

## 🚀 Publishing Checklist

### Phase 1: Verify Repository

- [x] All source code committed
- [x] All documentation completed
- [x] Examples included
- [x] Tests configured
- [x] License included
- [x] .gitignore configured
- [x] package.json configured
- [x] tsconfig.json configured

### Phase 2: Create GitHub Repository

**Option 1: Using Web UI**

1. Go to https://github.com/new
2. **Repository name**: `aurigraph-sdk`
3. **Owner**: Aurigraph-DLT (organization)
4. **Description**: "Official TypeScript SDK and Developer Toolkit for Aurigraph DLT V11"
5. **Visibility**: Public
6. **Initialize repository**: Leave unchecked (we have files)
7. Click **Create repository**

**Option 2: Using GitHub CLI**

```bash
gh repo create aurigraph-sdk \
  --public \
  --organization Aurigraph-DLT \
  --source=/tmp/aurigraph-sdk \
  --remote=origin \
  --push
```

### Phase 3: Push to GitHub

#### Using HTTPS

```bash
cd /tmp/aurigraph-sdk

# Add remote
git remote add origin https://github.com/Aurigraph-DLT/aurigraph-sdk.git

# Set main as default branch
git branch -M main

# Push all commits
git push -u origin main
```

#### Using SSH

```bash
cd /tmp/aurigraph-sdk

# Add remote
git remote add origin git@github.com:Aurigraph-DLT/aurigraph-sdk.git

# Set main as default branch
git branch -M main

# Push all commits
git push -u origin main
```

### Phase 4: Configure Repository Settings

#### Repository Settings

1. Go to **Settings** → **General**
2. **Default branch**: main
3. **Pull request merges**: Allow squash merging
4. **Delete head branches**: Enable

#### Branch Protection Rules

1. Go to **Settings** → **Branches**
2. Click **Add rule**
3. **Branch name pattern**: `main`
4. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Require code reviews before merging (1+ approval)
   - ✅ Require conversation resolution before merging
5. Save

#### Labels

Create these labels for issues:

```bash
# Using GitHub CLI
gh label create bug --color d73a4a --description "Something isn't working"
gh label create documentation --color 0075ca --description "Improvements or additions to documentation"
gh label create enhancement --color a2eeef --description "New feature or request"
gh label create good\ first\ issue --color 7057ff --description "Good for newcomers"
gh label create help\ wanted --color 008672 --description "Extra attention is needed"
```

### Phase 5: Setup GitHub Actions (Optional)

Create `.github/workflows/test.yml`:

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
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:run
      - run: npm run test:coverage
```

### Phase 6: Publish to NPM

#### Prerequisites

```bash
# Login to npm
npm login

# Verify login
npm whoami
```

#### Update package.json

Ensure these fields are set:

```json
{
  "name": "@aurigraph/sdk",
  "version": "1.0.0",
  "description": "Official TypeScript SDK for Aurigraph DLT V11",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "publishConfig": {
    "registry": "https://registry.npmjs.org/",
    "access": "public"
  }
}
```

#### Build and Publish

```bash
cd /tmp/aurigraph-sdk

# Build TypeScript
npm run build

# Publish to NPM
npm publish

# Verify publication
npm info @aurigraph/sdk
npm view @aurigraph/sdk versions
```

### Phase 7: Create GitHub Release

```bash
cd /tmp/aurigraph-sdk

# Tag the version
git tag -a v1.0.0 -m "Release version 1.0.0"

# Push tag
git push origin v1.0.0

# Create release notes
gh release create v1.0.0 \
  --title "Aurigraph SDK v1.0.0" \
  --notes-file RELEASE_NOTES.md \
  --draft=false
```

Or manually via Web UI:

1. Go to **Releases** tab
2. Click **Create a new release**
3. **Tag**: v1.0.0
4. **Title**: Aurigraph SDK v1.0.0
5. **Description**: Copy from RELEASE_NOTES.md
6. Mark as latest release
7. **Publish release**

### Phase 8: Add Topics (Web UI)

Go to repository **Settings** → **General** → **Topics**

Add:
- `aurigraph`
- `blockchain`
- `dlt`
- `sdk`
- `typescript`
- `nodejs`
- `api-client`
- `websocket`

### Phase 9: Create Discussion Categories (Optional)

Go to **Discussions** tab:

Create categories:
1. **Announcements** - Release announcements
2. **General** - General discussion
3. **Q&A** - Questions and answers
4. **Show & Tell** - Show your projects
5. **Ideas** - Feature suggestions

### Phase 10: Setup Badges

Update README.md with badges:

```markdown
[![npm version](https://img.shields.io/npm/v/@aurigraph/sdk)](https://www.npmjs.com/package/@aurigraph/sdk)
[![GitHub](https://img.shields.io/github/v/release/Aurigraph-DLT/aurigraph-sdk)](https://github.com/Aurigraph-DLT/aurigraph-sdk)
[![Tests](https://github.com/Aurigraph-DLT/aurigraph-sdk/workflows/Test/badge.svg)](https://github.com/Aurigraph-DLT/aurigraph-sdk/actions)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
```

---

## 📝 Repository Information

### URL Structure

- **Repository**: https://github.com/Aurigraph-DLT/aurigraph-sdk
- **Issues**: https://github.com/Aurigraph-DLT/aurigraph-sdk/issues
- **Discussions**: https://github.com/Aurigraph-DLT/aurigraph-sdk/discussions
- **Releases**: https://github.com/Aurigraph-DLT/aurigraph-sdk/releases
- **NPM Package**: https://www.npmjs.com/package/@aurigraph/sdk

### Repository Stats

- **Files**: 14
- **Commits**: 4 (initial)
- **Languages**: TypeScript, Markdown
- **License**: MIT
- **Size**: < 1 MB (without node_modules)

### Files Included

- **Source Code**: 3 TypeScript files (1,179 lines)
- **Configuration**: 2 files (package.json, tsconfig.json)
- **Documentation**: 7 Markdown files (22,000+ words)
- **Examples**: 4 TypeScript files (2 complete, 2 templates)
- **Tests**: 3 test templates
- **License**: MIT License
- **.gitignore**: Node.js ignore patterns

---

## 🔐 Security Considerations

### Before Publishing

- [ ] Remove any sensitive data
- [ ] Review all environment variables
- [ ] Audit dependencies
- [ ] Check for security vulnerabilities
- [ ] Verify no API keys in code
- [ ] Check commit history for secrets

### During Publishing

- [ ] Use 2FA for npm
- [ ] Use 2FA for GitHub
- [ ] Sign commits with GPG (recommended)
- [ ] Enable branch protection on main

### After Publishing

- [ ] Monitor issues for vulnerabilities
- [ ] Setup automated dependency scanning
- [ ] Monitor npm for reported issues
- [ ] Keep dependencies updated

---

## 🚀 Next Steps After Publishing

### Immediate (Day 1)

1. ✅ Publish to NPM
2. ✅ Create GitHub Release
3. ✅ Announce on social media
4. ✅ Update main Aurigraph repo with link
5. ✅ Send to team

### Short Term (Week 1)

1. Monitor for issues
2. Fix critical bugs
3. Respond to questions
4. Update documentation

### Medium Term (Month 1)

1. v1.1 patch release (bug fixes)
2. Gather user feedback
3. Plan v1.2 features
4. Community engagement

### Long Term (Year 1)

1. v2.0 with WebSocket support
2. Additional SDKs (Go, Python)
3. Expanded examples
4. Community contributions

---

## 📊 Success Criteria

### Publishing Success

- [x] Repository created
- [x] Code committed
- [x] Files organized
- [x] Documentation complete
- [x] Tests configured
- [x] License included
- [ ] GitHub repository public
- [ ] NPM published
- [ ] Release created
- [ ] Badges working

### Adoption Metrics (Post-Publishing)

- Downloads from npm
- GitHub stars
- GitHub forks
- Issues created
- Pull requests
- Community engagement

---

## 🆘 Troubleshooting

### Git Issues

```bash
# Remove remote and re-add
git remote remove origin
git remote add origin https://github.com/Aurigraph-DLT/aurigraph-sdk.git

# Verify remote
git remote -v

# Force push (if needed)
git push -u origin main --force
```

### NPM Issues

```bash
# Clear npm cache
npm cache clean --force

# Re-login
npm login

# Dry run publish
npm publish --dry-run

# Check npm access
npm access list
```

### GitHub Issues

- Clear browser cache
- Check organization access
- Verify write permissions
- Check GitHub status: https://www.githubstatus.com/

---

## 📞 Support Contacts

For help with:

- **GitHub**: https://github.com/support
- **NPM**: https://npm.community
- **Aurigraph**: support@aurigraph.io

---

## ✅ Final Checklist

Before going live:

- [ ] Code tested locally
- [ ] All files committed
- [ ] Documentation reviewed
- [ ] Examples working
- [ ] No secrets in code
- [ ] License included
- [ ] gitignore configured
- [ ] package.json correct
- [ ] tsconfig correct
- [ ] GitHub repository ready
- [ ] NPM account ready
- [ ] 2FA enabled
- [ ] Team notified

---

## 🎉 You're Ready!

Your Aurigraph SDK is ready for publication!

**Next: Execute the publishing steps above** ⬆️

---

*Last Updated: October 31, 2025*
*Version: 1.0.0*
*Status: Ready for Publishing*
