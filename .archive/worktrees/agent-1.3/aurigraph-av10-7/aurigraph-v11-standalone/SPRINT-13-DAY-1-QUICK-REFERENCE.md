# Sprint 13 Day 1 - Quick Reference Guide
**Status**: 🚀 **EXECUTION PHASE - START NOW**
**For**: All 8 FDA developers
**Time**: November 4, 2025

---

## ⏰ TIMELINE AT A GLANCE

```
10:30 AM - 10:45 AM  → Daily standup (15 min - be on time!)
10:45 AM - 11:00 AM  → Checkout branches (git checkout + git pull)
11:00 AM - 11:30 AM  → Verify environments (run checks below)
11:30 AM - 5:00 PM   → DEVELOPMENT (create scaffolds, commit, push)
5:00 PM              → EOD - all commits should be pushed
```

---

## 🎯 YOUR SPECIFIC TASK

| You Are | Your Component | Commit Message |
|---------|----------------|-----------------|
| FDA Lead 1 | Network Topology | `S13-1: Initial Network Topology component scaffold` |
| FDA Junior 1 | Block Search | `S13-2: Initial Block Search component scaffold` |
| FDA Lead 2 | Validator Performance | `S13-3: Initial Validator Performance component scaffold` |
| FDA Junior 2 | AI Model Metrics | `S13-4: Initial AI Model Metrics component scaffold` |
| FDA Junior 3 | Audit Log Viewer | `S13-5: Initial Audit Log Viewer component scaffold` |
| FDA Dev 1 | RWA Asset Manager | `S13-6: Initial RWA Asset Manager component scaffold` |
| FDA Junior 4 | Token Management | `S13-7: Initial Token Management component scaffold` |
| FDA Lead 3 | Dashboard Layout | `S13-8: Initial Dashboard Layout component scaffold` |

---

## 📝 STEP-BY-STEP EXECUTION

### STEP 1: After Standup (10:45-11:00 AM) - Checkout Your Branch

Replace `[component-name]` with your actual component name:

```bash
# Move to your workspace
cd ~/aurigraph-dlt/aurigraph-av10-7

# Checkout your feature branch
git checkout feature/sprint-13-[component-name]

# Pull latest from origin
git pull origin feature/sprint-13-[component-name]

# Verify - you should see the last few commits
git log --oneline -5
```

**Example** (FDA Lead 1 - Network Topology):
```bash
git checkout feature/sprint-13-network-topology
git pull origin feature/sprint-13-network-topology
git log --oneline -5
```

**If error**: Immediately report to FDA Lead 1 or DDA

---

### STEP 2: Verify Environment (11:00-11:30 AM)

Run these commands in your terminal:

```bash
# 1. Check Node version (must be v20+)
node --version

# 2. Check npm version (must be npm 9+)
npm --version

# 3. Navigate to enterprise portal
cd aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal

# 4. Verify React and TypeScript
npm ls react
npm ls typescript

# 5. Check V12 backend health (CRITICAL)
curl http://localhost:9003/q/health

# 6. Verify TypeScript compiler
npx tsc --version
```

**Expected Results**:
```
✅ node --version      → v20.x or higher
✅ npm --version       → 9.x or higher
✅ npm ls react        → react@18.x.x
✅ npm ls typescript   → typescript@5.x.x
✅ curl health check   → {"status":"UP", ...}
✅ tsc --version       → Version 5.x.x
```

**Report to FDA Lead 1**: When done, send message in Slack/Teams
```
✅ Environment verified - ready for development
```

**If V12 backend fails** (curl returns error):
- Report immediately to DDA with error message
- DDA will resolve within 30 minutes
- Continue with other setup while waiting

---

### STEP 3: Development Phase (11:30 AM - 5:00 PM)

#### 3.1 Create Component Directory Structure

```bash
# In enterprise-portal directory
cd enterprise-portal

# Create folders
mkdir -p src/components/[ComponentName]
mkdir -p src/__tests__/[ComponentName]

# Example for Network Topology:
# mkdir -p src/components/NetworkTopology
# mkdir -p src/__tests__/NetworkTopology
```

#### 3.2 Create Component Files

**File 1: Component Main File**
`src/components/[ComponentName]/[ComponentName].tsx`

```typescript
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Typography,
} from '@mui/material';

interface [ComponentName]Props {
  // Props definition
}

export const [ComponentName]: React.FC<[ComponentName]Props> = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // API call to V12 backend
        const response = await fetch('/api/v11/[endpoint]');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <Box>
      <Card>
        <CardHeader title="[Component Name]" />
        <CardContent>
          <Typography variant="body2">
            Component implementation in progress
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default [ComponentName];
```

**File 2: Index File**
`src/components/[ComponentName]/index.ts`

```typescript
export { [ComponentName] } from './[ComponentName]';
export { default } from './[ComponentName]';
```

**File 3: Test File (Stub)**
`src/__tests__/[ComponentName].test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import [ComponentName] from '../src/components/[ComponentName]';

describe('[ComponentName]', () => {
  it('should render component', () => {
    render(<[ComponentName] />);
    expect(screen.getByText(/Component implementation/i)).toBeTruthy();
  });

  it('should load data from API', async () => {
    render(<[ComponentName] />);
    // Test implementation
  });
});
```

#### 3.3 Stage Files

```bash
git add src/components/[ComponentName]/
git add src/__tests__/[ComponentName].test.tsx
```

#### 3.4 Commit and Push

```bash
# Commit with specific message format
git commit -m "S13-X: Initial [Component Name] component scaffold"

# Push to your feature branch
git push -u origin feature/sprint-13-[component-name]
```

**Example** (FDA Lead 1 - Network Topology):
```bash
git commit -m "S13-1: Initial Network Topology component scaffold"
git push -u origin feature/sprint-13-network-topology
```

**Expected Output**:
```
[feature/sprint-13-network-topology abc1234] S13-1: Initial Network Topology component scaffold
 2 files changed, 50 insertions(+)
 create mode 100644 src/components/NetworkTopology/NetworkTopology.tsx
 create mode 100644 src/__tests__/NetworkTopology.test.tsx
```

---

## 🚨 COMMON ISSUES & FIXES

### Issue 1: "Port already in use" when starting dev server
**Solution**: Dev server will auto-retry. Currently running on port 3002.

### Issue 2: Git checkout fails - "branch not found"
**Solution**:
```bash
git fetch origin
git checkout feature/sprint-13-[component-name]
```

### Issue 3: npm ls shows wrong versions
**Solution**:
```bash
cd enterprise-portal
rm -rf node_modules package-lock.json
npm install
npm ls react typescript
```

### Issue 4: V12 backend not responding (curl fails)
**Solution**: Report to DDA immediately. They have 30-min SLA.
```
Message to DDA: "V12 backend not responding on port 9003 - curl http://localhost:9003/q/health fails"
```

### Issue 5: TypeScript compilation errors
**Solution**: Check component syntax, verify imports, run:
```bash
npx tsc --noEmit
```

---

## ✅ SUCCESS CHECKLIST

**By 11:00 AM** (After standup):
- [ ] Checked out feature branch
- [ ] Pulled latest code
- [ ] No git conflicts

**By 11:30 AM** (After verification):
- [ ] Node v20+ installed
- [ ] npm v9+ installed
- [ ] React@18 and TypeScript@5 confirmed
- [ ] V12 backend responding to health check
- [ ] IDE/editor opened to project directory
- [ ] Reported ready status to FDA Lead 1

**By 5:00 PM** (End of day):
- [ ] Component scaffold created
- [ ] TypeScript types defined
- [ ] Test file created (stub)
- [ ] Files added to git
- [ ] Commit pushed to feature branch
- [ ] Commit message format correct (S13-X: Initial...)

---

## 📞 NEED HELP?

| Issue | Contact | Response Time |
|-------|---------|-----------------|
| Component questions | FDA Lead 1 | ASAP |
| Git/GitHub issues | DDA | 15 min |
| Environment/Node issues | DDA | 20 min |
| V12 backend not responding | DDA | 30 min |
| TypeScript/build issues | FDA Lead 1 + QAA | 30 min |
| Critical blocker | CAA | 2 hours |

**Slack Channel**: #sprint-13-execution

---

## 🎯 KEY REMINDERS

1. **Standup is at 10:30 AM sharp** - Don't be late
2. **V12 backend health check is critical** - Report issues immediately
3. **All commits by 5:00 PM EOD** - No exceptions
4. **Component scaffold only** - Don't over-engineer Day 1
5. **Follow commit message format** - `S13-X: Initial [Component] scaffold`
6. **Report blockers early** - Don't wait until EOD

---

## 🚀 LET'S GO!

You have everything you need. Follow the steps above. Execute in order. Report blockers immediately.

**Portal v4.6.0 starts today. You're ready.**

---

**Document**: SPRINT-13-DAY-1-QUICK-REFERENCE.md
**Generated**: October 31, 2025
**Status**: 🟢 READY FOR EXECUTION
