# Sprint 13-15 Operational Handbook
**Date**: November 1, 2025
**Audience**: Development Team
**Status**: Ready for Team Use
**Version**: 1.0

---

## Quick Start Guide

### Before You Start

1. **Check the Kickoff Date**: November 4, 2025, 9:00 AM
2. **Attend Training**: November 2, 2025, 10:00 AM (2 hours)
3. **Setup Environment**: Complete individual setup by November 3, 5:00 PM
4. **Read This Handbook**: 5 minutes

### Your Assignment

Check the **SPRINT-13-15-JIRA-SETUP-SCRIPT.md** for your component assignment once JIRA tickets are created on Nov 1.

---

## Component Workflow

### Sprint 13 (Nov 4 - Nov 15)

Each component follows this workflow:

```
Feature Branch Created
       ↓
Development Starts
       ↓
Code & Tests
       ↓
Commit & Push
       ↓
Create Pull Request
       ↓
Code Review (2+ reviewers)
       ↓
Merge to Main
       ↓
Mark JIRA Ticket Done
```

### Each Component Must Have

- ✅ **Source Code** (.tsx file)
  - TypeScript with strict mode
  - Component follows template patterns
  - JSDoc comments for props
  - Error handling implemented

- ✅ **Unit Tests** (.test.tsx file)
  - Minimum 85% line coverage
  - All user interactions tested
  - Error scenarios covered
  - Accessibility tests included

- ✅ **Integration Tests**
  - API integration verified
  - Mock data validates
  - WebSocket connections tested
  - State management verified

- ✅ **Performance Benchmarks**
  - Initial render < 400ms
  - Re-render < 100ms
  - Memory usage < 25MB
  - Results documented

- ✅ **Documentation**
  - Component README
  - Props documentation
  - Usage examples
  - Performance notes

### Definition of Done

A component is "Done" when ALL of the following are true:

1. **Code Quality** ✅
   - [ ] TypeScript compiles without errors
   - [ ] ESLint passes without warnings
   - [ ] Prettier formatting applied
   - [ ] No console errors

2. **Functionality** ✅
   - [ ] Component renders successfully
   - [ ] All user interactions work
   - [ ] API integration working (mocked)
   - [ ] Error handling implemented
   - [ ] Loading states shown

3. **Testing** ✅
   - [ ] Unit tests written (85%+ coverage)
   - [ ] All tests passing
   - [ ] Integration tests passing
   - [ ] Performance benchmarks met

4. **Performance** ✅
   - [ ] Initial render < 400ms
   - [ ] Re-render < 100ms
   - [ ] Memory < 25MB
   - [ ] Benchmarks documented

5. **Accessibility** ✅
   - [ ] WCAG 2.1 AA compliant
   - [ ] Keyboard navigation works
   - [ ] Screen reader compatible
   - [ ] Color contrast verified

6. **Documentation** ✅
   - [ ] PropTypes documented
   - [ ] Code comments added
   - [ ] Test documentation included
   - [ ] Usage examples provided

7. **Code Review** ✅
   - [ ] Pull request created
   - [ ] 2+ reviewers approved
   - [ ] All feedback addressed
   - [ ] PR merged to main

8. **JIRA Ticket** ✅
   - [ ] Ticket updated with completion date
   - [ ] PR link added to ticket
   - [ ] Ticket marked "Done"
   - [ ] Acceptance criteria verified

---

## Daily Standup Format

**Time**: 10:30 AM - 11:00 AM (daily)

**Format**:
1. **What did you do yesterday?** (1-2 min)
   - Which tasks completed?
   - What did you learn?

2. **What will you do today?** (1-2 min)
   - Which tasks starting?
   - Expected progress?

3. **Do you have blockers?** (30 sec)
   - What's blocking you?
   - How can we help?

**Blocker Resolution**: Address immediately in meeting if possible, or schedule 30-min follow-up.

---

## Git Workflow

### Initial Setup (One Time)

```bash
# Clone repository (if needed)
git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git
cd aurigraph-av10-7/aurigraph-v11-standalone

# Install dependencies
npm install

# Start development server
npm run dev
```

### Component Development Workflow

```bash
# Step 1: Checkout your feature branch
git checkout feature/sprint-13-your-component

# Step 2: Make sure you're up to date with main
git fetch origin
git pull origin main

# Step 3: Create a working branch (optional, for safety)
git checkout -b feature/sprint-13-your-component-work

# Step 4: Make changes and commit
git add .
git commit -m "feat: Implement YourComponent with API integration

- Added YourComponent.tsx with props and state
- Integrated with /api/v11/your-endpoint
- Added 85%+ test coverage
- Verified performance targets met

Fixes #JIRA-XXX"

# Step 5: Push to origin
git push origin feature/sprint-13-your-component

# Step 6: Create Pull Request on GitHub
# Go to https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
# - Compare: feature/sprint-13-your-component
# - PR Title: "feat: Implement YourComponent for Sprint 13"
# - Description: Include acceptance criteria met, performance results
# - Link JIRA ticket in description

# Step 7: Wait for code review (2+ reviewers must approve)

# Step 8: After approval, merge PR to main
```

### Commit Message Format

```
feat: Brief description of the feature

- Implementation details
- Key changes made
- Performance metrics achieved
- Issues fixed

Fixes #JIRA-XXX (e.g., Fixes #AV11-42)
Co-Authored-By: Team Member Name <email@example.com>
```

### Branch Naming Convention

Your feature branch is: `feature/sprint-XX-component-name`

Keep it as-is. Don't create new branches unless directed.

---

## Testing Your Component

### Run Tests

```bash
# Run tests in watch mode (recommended during development)
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run performance tests
npm run test:performance
```

### Check Coverage

```bash
# Open coverage report in browser
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

**Target**: 85%+ coverage

### Performance Benchmarking

```bash
# Run performance benchmarks for your component
npm run benchmark -- YourComponentName

# View benchmark results
open performance-results/YourComponentName.html
```

**Targets**:
- Initial render: < 400ms
- Re-render: < 100ms
- Memory: < 25MB

---

## Component Template

Use this template as a starting point for your component:

```typescript
import React, { useEffect, useState } from 'react';
import { useQuery } from '@reduxjs/toolkit/query/react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { YourApi } from '../api';  // Import your API hook

interface YourComponentProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const YourComponent: React.FC<YourComponentProps> = ({
  autoRefresh = true,
  refreshInterval = 5000,
}) => {
  // State management
  const [error, setError] = useState<string | null>(null);

  // API integration with RTK Query
  const { data, isLoading, refetch } = useQuery({
    queryFn: async () => {
      const response = await fetch('/api/v11/your-endpoint');
      if (!response.ok) throw new Error('Failed to fetch data');
      return response.json();
    },
    // Configure cache behavior
    pollingInterval: autoRefresh ? refreshInterval : undefined,
  });

  // WebSocket integration (if needed)
  useEffect(() => {
    const handleWebSocketMessage = (event: MessageEvent) => {
      // Handle real-time updates
      refetch();
    };

    // Subscribe to WebSocket if needed
    // const ws = new WebSocket('ws://...');
    // ws.addEventListener('message', handleWebSocketMessage);
    // return () => ws.close();
  }, [refetch]);

  // Error handling
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  // Loading state
  if (isLoading) {
    return <CircularProgress />;
  }

  // Main component render
  return (
    <Box>
      {/* Your component content */}
      {data && <YourContent data={data} />}
    </Box>
  );
};

export default YourComponent;
```

---

## API Integration

### Using Mock APIs (Development)

During development, all APIs use Mock Service Worker (MSW):

```typescript
// APIs are automatically mocked in development
const response = await fetch('/api/v11/your-endpoint');
const data = await response.json();
// This works with the mock server - no backend needed!
```

### Mock Data Format

Each API endpoint has mock data generators. Check **MOCK-API-SERVER-SETUP-GUIDE.md** for available mock data.

Example mock data:
```typescript
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "timestamp": "2025-11-04T09:00:00Z",
  "status": "active",
  "metrics": {
    "value": 1000,
    "unit": "TPS"
  }
}
```

### Error Handling

Always handle errors gracefully:

```typescript
const { data, error, isLoading } = useQuery(...);

if (error) {
  return <Alert severity="error">Failed to load data</Alert>;
}

if (isLoading) {
  return <CircularProgress />;
}

return <YourContent data={data} />;
```

---

## Performance Optimization

### Keep Render Time Under 400ms

1. **Use React.memo for child components**
   ```typescript
   const ChildComponent = React.memo(({ data }) => {
     return <div>{data.value}</div>;
   });
   ```

2. **Memoize expensive calculations**
   ```typescript
   const expensiveValue = useMemo(() => {
     return calculateExpensiveValue(data);
   }, [data]);
   ```

3. **Use useCallback for event handlers**
   ```typescript
   const handleClick = useCallback(() => {
     doSomething();
   }, []);
   ```

4. **Lazy load heavy components**
   ```typescript
   const HeavyChart = lazy(() => import('./HeavyChart'));
   ```

### Monitor Memory Usage

```bash
# Profile your component memory usage
npm run profile:memory -- YourComponentName

# Check results
open memory-profile/YourComponentName.html
```

---

## Code Review Checklist

Before requesting review, verify:

- [ ] Code compiles without errors
- [ ] ESLint passes: `npm run lint`
- [ ] Tests pass: `npm test`
- [ ] Coverage 85%+: `npm run test:coverage`
- [ ] Performance targets met
- [ ] Documentation added
- [ ] No console errors/warnings
- [ ] Accessibility verified
- [ ] PR description complete

---

## Troubleshooting

### Tests Failing

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Run tests again
npm test
```

### Performance Slow

```bash
# Profile your component
npm run profile -- YourComponentName

# Open profiler and identify bottlenecks
open performance-profile/YourComponentName.html

# Check common issues:
# 1. Unnecessary re-renders? Use React.memo or useMemo
# 2. Expensive calculations? Move to useMemo or useCallback
# 3. Large data sets? Implement pagination or virtualization
```

### API Not Working

```bash
# Check mock server is running
curl http://localhost:5173/api/v11/health

# Check mock data
npm run test:mocks

# Verify endpoint is mocked
grep -r "your-endpoint" src/__tests__/mocks/
```

### Git Merge Conflicts

```bash
# Fetch latest main
git fetch origin
git pull origin main

# Resolve conflicts in your editor
# Then:
git add .
git commit -m "chore: Resolve merge conflicts"
git push origin feature/sprint-13-your-component
```

---

## Support & Escalation

### Questions About Your Component

**Frontend Lead**: Technical architecture and design patterns
- Slack: @FDA Lead
- Response time: < 1 hour

### Questions About Testing

**QAA**: Test strategy and coverage requirements
- Slack: @QAA
- Response time: < 4 hours

### Questions About Performance

**Performance Team**: Performance targets and optimization
- Slack: @Performance Team
- Response time: < 4 hours

### Blockers or Issues

**Project Manager**: Timeline and process issues
- Slack: @Project Manager
- Response time: < 1 hour (critical issues)

---

## Success Metrics

### Individual Developer

- **Productivity**: 1-2 components per sprint (per story points)
- **Quality**: 85%+ test coverage maintained
- **Performance**: All targets met on first submission
- **Velocity**: Consistent story point completion weekly

### Team (Weekly)

- **Completion**: 15-20 story points per week (Sprint 13)
- **Quality**: 100% tests passing
- **Performance**: All benchmarks green
- **Code Reviews**: < 24 hours average review time
- **Blockers**: Zero critical, max 2 medium per week

### Sprint (Bi-weekly)

- **Delivery**: All components shipped on schedule
- **Quality**: 85%+ coverage achieved
- **Performance**: Baseline established
- **Testing**: All E2E tests passing
- **Documentation**: Complete and reviewed

---

## Celebration Milestones

🎉 **Complete a component with all acceptance criteria met**
- Daily standup shout-out
- Logged in achievement tracking

🎉 **Week 1 Success (Nov 4-8)**
- 4-5 components started
- Mock APIs working
- Zero blockers
- **Reward**: Team appreciation shout-out

🎉 **Sprint 13 Complete (Nov 15)**
- 8 components shipped
- All tests passing
- Performance targets met
- **Reward**: Sprint retrospective celebration

🎉 **All Sprints Complete (Nov 29)**
- 15 components in production
- Portal v4.6.0 released
- Performance baseline set
- **Reward**: Team celebration and release announcement

---

## Key Documents

| Document | Purpose | Due Date |
|----------|---------|----------|
| SPRINT-13-15-COMPONENT-REVIEW.md | Component specifications | Oct 30 ✅ |
| MOCK-API-SERVER-SETUP-GUIDE.md | Mock API setup | Nov 1 📋 |
| TEAM-TRAINING-MATERIALS.md | Training curriculum | Nov 2 📋 |
| SPRINT-13-15-JIRA-SETUP-SCRIPT.md | JIRA configuration | Nov 1 📋 |
| SPRINT-13-15-KICKOFF-CHECKLIST.md | Pre-sprint validation | Nov 3 📋 |
| This Handbook | Daily operations | Nov 4 🚀 |

---

## Final Checklist Before Nov 4

**Before the first standup on Nov 4, 10:30 AM, verify**:

- [ ] Development environment is set up
- [ ] Dev server runs: `npm run dev`
- [ ] Tests run: `npm test`
- [ ] Your feature branch is checked out
- [ ] You've read all documentation above
- [ ] You understand your component assignment
- [ ] You know the daily standup format
- [ ] You know who to contact for blockers
- [ ] You're excited to ship! 🚀

---

## Remember

> **"Your component is successful when users can use it without knowing all the engineering that went into it."**

Focus on:
1. ✅ Making it work
2. ✅ Making it fast
3. ✅ Making it tested
4. ✅ Making it accessible
5. ✅ Documenting it

We're shipping 15 components together. Your effort makes the whole team successful.

**Let's build something amazing! 🚀**

---

**Document Status**: Ready for Team Use
**Questions?** Reach out to Frontend Lead
**Questions About This Handbook?** Contact Project Manager
**Next Review**: During Sprint 13 retrospective (Nov 15)
