# Sprint 13 Quick Commands Reference
**Sprint**: Sprint 13 Development (Nov 4-15, 2025)
**Purpose**: Fast access to common commands and procedures
**Status**: Live - Use daily

---

## 🚀 MORNING STARTUP (Every Weekday)

```bash
# Navigate to project
cd aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal

# Sync with latest main
git fetch origin
git pull origin main

# Check out your feature branch
git checkout feature/sprint-13-your-component

# Install/update dependencies (if needed)
npm install

# Start development server (in one terminal)
npm run dev

# In another terminal, run tests in watch mode
npm test

# Verify mock APIs are accessible
curl http://localhost:5173/api/v11/health
```

Expected output:
```json
{ "status": "UP", "timestamp": "...", "uptime": 123456, "version": "11.0.0" }
```

---

## 📝 DAILY DEVELOPMENT WORKFLOW

### Checkpoint 1: Before Standup (10:30 AM)

```bash
# Make sure you're on your feature branch
git status

# Check if any changes need committing
git add .
git commit -m "feat: [Component] - [What you did]"

# Push to feature branch
git push origin feature/sprint-13-your-component
```

### Checkpoint 2: During Development (11 AM - 6 PM)

```bash
# Run tests continuously (should already be running)
npm test

# Check linting/TypeScript
npm run lint
npm run typecheck

# Make changes to your component
# ... edit files ...

# Commit regularly
git add .
git commit -m "feat: [Component] - [Incremental progress]"

# Push progress
git push origin feature/sprint-13-your-component
```

### Checkpoint 3: End of Day (Before 6 PM)

```bash
# Final commit of the day
git add .
git commit -m "feat: [Component] - Daily progress update

- Completed [specific work]
- Tests passing: [count]
- Coverage: [%]
- Blockers: [if any]"

# Push to GitHub
git push origin feature/sprint-13-your-component

# Update JIRA ticket status manually (in JIRA UI)
# Mark progress % and next steps
```

---

## 🧪 TESTING COMMANDS

### Run All Tests

```bash
# Run tests once
npm run test:run

# Run tests in watch mode (auto-rerun on changes)
npm test

# Run tests with coverage report
npm run test:coverage

# View coverage in browser (after running with coverage)
open coverage/index.html
```

### Run Specific Test File

```bash
# Test a specific component
npm test -- NetworkTopology.test.tsx

# Test a specific pattern
npm test -- --grep "renders correctly"
```

### Check Coverage

```bash
# After running tests with coverage
npm run test:coverage

# View results
open coverage/lcov-report/index.html
```

**Target**: 85%+ line coverage for your component

---

## 📊 PERFORMANCE COMMANDS

### Benchmark Your Component

```bash
# Run performance benchmarks
npm run benchmark -- YourComponentName

# View benchmark results
open performance-results/YourComponentName.html
```

### Profile Memory Usage

```bash
# Profile component memory
npm run profile:memory -- YourComponentName

# View memory profile
open memory-profile/YourComponentName.html
```

**Targets**:
- Initial render: < 400ms
- Re-render: < 100ms
- Memory: < 25MB

---

## 🔍 CODE QUALITY COMMANDS

### Check TypeScript

```bash
# Compile TypeScript
npm run typecheck

# Should show: "Successfully compiled X files"
```

### Run ESLint

```bash
# Check for linting issues
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

### Format Code

```bash
# Format with Prettier
npm run format

# Or automatically on save (editor config)
```

---

## 🔀 GIT WORKFLOW COMMANDS

### Starting a Feature

```bash
# Your feature branch should already exist, just check it out
git checkout feature/sprint-13-your-component

# Confirm you're on correct branch
git status
# Should show: "On branch feature/sprint-13-your-component"
```

### Making Changes

```bash
# See what you've changed
git status

# Add changes to staging
git add .

# Commit with message
git commit -m "feat: [Component] - [Description]

- Detailed change 1
- Detailed change 2

Fixes #AV11-XXX"

# Push to GitHub
git push origin feature/sprint-13-your-component
```

### Creating a Pull Request

```bash
# After pushing, create PR on GitHub
# 1. Go to: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
# 2. Click "New Pull Request"
# 3. Select: feature/sprint-13-your-component → main
# 4. Add title: "feat: [Component] for Sprint 13"
# 5. Add description with acceptance criteria
# 6. Link JIRA ticket: "Fixes #AV11-XXX"
# 7. Request 2+ reviewers
```

### Handling Merge Conflicts

```bash
# If conflicts appear when pulling
git status  # See which files have conflicts

# Open files and resolve conflicts manually
# Look for: <<<<<< HEAD ... ====== ... >>>>>>

# After resolving
git add .
git commit -m "chore: Resolve merge conflicts"
git push origin feature/sprint-13-your-component
```

---

## 📲 API INTEGRATION COMMANDS

### Check Mock API Endpoints

```bash
# Health check
curl http://localhost:5173/api/v11/health

# System info
curl http://localhost:5173/api/v11/info

# Your component's endpoint
curl http://localhost:5173/api/v11/blockchain/network/topology
```

### View Mock API Request Handler

```bash
# Located in: src/mocks/handlers.ts
# Each endpoint is defined there with mock response data

# Example from handlers.ts:
http.get(`${API_BASE_URL}/blockchain/network/topology`, () => {
  return HttpResponse.json({
    nodes: [...],
    totalNodes: 127,
    activeValidators: 100
  });
});
```

---

## 🆘 TROUBLESHOOTING COMMANDS

### Dev Server Won't Start

```bash
# Kill any existing process on port 5173
lsof -i :5173
kill -9 <PID>

# Or use the npm command
npm run dev
```

### Tests Not Running

```bash
# Clear cache
rm -rf node_modules/.vitest

# Reinstall
npm install

# Try tests again
npm test
```

### Dependency Issues

```bash
# Clear and reinstall all dependencies
rm -rf node_modules package-lock.json
npm install

# Start fresh
npm run dev
```

### Port Already in Use

```bash
# Find what's using the port
lsof -i :5173    # Dev server
lsof -i :9003    # Mock API

# Kill the process
kill -9 <PID>

# Or restart from scratch
killall node
npm run dev
```

---

## 📊 JIRA INTEGRATION

### Update JIRA from Command Line

```bash
# Get your JIRA ticket number (e.g., AV11-42)

# In your commit message, reference it
git commit -m "feat: Implement NetworkTopology

- Added ReactFlow visualization
- Integrated API endpoint
- 85% test coverage

Fixes #AV11-42"

# When PR is merged, JIRA ticket auto-updates
```

### Manual JIRA Updates

1. Go to: https://aurigraphdlt.atlassian.net/jira
2. Find your ticket (e.g., AV11-42)
3. Update status: 📋 In Progress / 🔄 In Review / ✅ Done
4. Add comments with progress updates
5. Link PR/commits in ticket

---

## 🚀 COMPLETE DAILY WORKFLOW (Copy & Paste)

```bash
# MORNING SETUP
cd aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal
git fetch origin
git pull origin main
git checkout feature/sprint-13-your-component
npm run dev  # Terminal 1

# TERMINAL 2 - Tests
npm test

# DURING DAY - Make changes and commit regularly
git add .
git commit -m "feat: [Component] - [Work done]"
git push origin feature/sprint-13-your-component

# BEFORE STANDUP (10:30 AM)
git status  # Verify everything pushed

# END OF DAY (Before 6 PM)
git add .
git commit -m "feat: [Component] - Daily progress
- Completed [work]
- Coverage: [%]
- Blockers: [if any]"
git push origin feature/sprint-13-your-component

# Update JIRA manually with status
```

---

## 📚 QUICK REFERENCE

### Folder Structure

```
enterprise-portal/
├── src/
│   ├── pages/                 # Where your components go
│   │   ├── NetworkTopology.tsx
│   │   ├── BlockSearch.tsx
│   │   └── ... (your component here)
│   ├── api/                   # API hooks and queries
│   ├── components/            # Reusable components
│   ├── hooks/                 # Custom React hooks
│   ├── styles/                # CSS and styling
│   ├── types/                 # TypeScript types
│   ├── utils/                 # Utility functions
│   ├── __tests__/            # Test files
│   │   ├── mocks/            # Mock data
│   │   └── fixtures/          # Test fixtures
│   └── setupTests.ts          # Test configuration
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### File Naming Conventions

```
Components:       YourComponent.tsx
Tests:           YourComponent.test.tsx
Types:           types.ts or YourComponent.types.ts
Styles:          YourComponent.module.css
Hooks:           useYourComponent.ts
```

---

## 🎯 SUCCESS CHECKLIST (Before Submitting PR)

```bash
# Run all checks before submitting PR
npm run typecheck      # ✅ No TypeScript errors?
npm run lint           # ✅ No ESLint errors?
npm test              # ✅ All tests passing?
npm run test:coverage # ✅ 85%+ coverage?

# Check performance manually
# Initial render < 400ms? Re-render < 100ms? Memory < 25MB?

# Verify your commits are pushed
git log --oneline -5  # Should see your commits

# Create PR on GitHub
# Link JIRA ticket in PR description
```

---

## 📞 GETTING HELP

### Command Not Working?

1. Check you're in correct directory: `pwd`
2. Check you're on correct branch: `git status`
3. Check dependencies installed: `ls node_modules | grep vitest`
4. Try: `npm install && npm run dev`

### Still Stuck?

1. Ask in daily standup (10:30 AM)
2. Slack Frontend Lead
3. Check SPRINT-13-15-OPERATIONAL-HANDBOOK.md
4. See TROUBLESHOOTING section in SPRINT-13-EXECUTION-GUIDE.md

---

## 🎉 YOU'RE ALL SET!

All commands above will get you through Sprint 13 development. Most of the time you'll need:

```bash
npm run dev      # Start dev server
npm test         # Run tests
git commit ...   # Commit work
git push ...     # Push to GitHub
```

**Happy coding!** 🚀

---

**Document**: SPRINT-13-QUICK-COMMANDS.md
**Date**: November 4, 2025
**Status**: Live reference guide
**Update**: Add new commands as needed
**Questions**: Ask Frontend Lead in standup
