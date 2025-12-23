# JIRA Ticket Reference Card
**Quick Lookup During Ticket Creation**
**Date**: November 1, 2025

---

## 📊 Tickets by Sprint

### Sprint 13: Phase 1 High-Priority Components (8 tickets, 40 SP)

| # | Ticket | Title | SP | Assignee |
|---|--------|-------|----|---------:|
| 1 | S13-T01 | Network Topology Visualization | 8 | FDA Lead |
| 2 | S13-T02 | Advanced Block Search | 6 | FDA Junior |
| 3 | S13-T03 | Validator Performance Dashboard | 7 | FDA Lead |
| 4 | S13-T04 | AI Model Metrics Viewer | 6 | FDA Junior |
| 5 | S13-T05 | Security Audit Log Viewer | 5 | FDA Dev |
| 6 | S13-T06 | RWA Portfolio Dashboard | 4 | FDA Dev |
| 7 | S13-T07 | Token Management Interface | 4 | FDA Junior |
| 8 | S13-T08 | Dashboard Main Layout | 0 | FDA Lead |
| **TOTAL** | | | **40 SP** | |

---

### Sprint 14: Phase 2 Extended Components + WebSocket (11 tickets, 69 SP)

| # | Ticket | Title | SP | Assignee |
|---|--------|-------|----|---------:|
| 1 | S14-T01 | Advanced Block Explorer | 8 | FDA Dev |
| 2 | S14-T02 | Real-time Analytics Dashboard | 8 | FDA Dev |
| 3 | S14-T03 | Consensus Monitor | 7 | FDA Lead |
| 4 | S14-T04 | Network Event Log Viewer | 6 | FDA Junior |
| 5 | S14-T05 | Bridge Analytics Dashboard | 6 | FDA Dev |
| 6 | S14-T06 | Oracle Dashboard | 5 | FDA Junior |
| 7 | S14-T07 | WebSocket Wrapper Framework | 8 | FDA Lead |
| 8 | S14-T08 | Real-time Sync Infrastructure | 7 | FDA Dev |
| 9 | S14-T09 | Performance Monitor Component | 5 | FDA Dev |
| 10 | S14-T10 | System Health Indicator | 5 | FDA Junior |
| 11 | S14-T11 | Configuration Manager | 4 | FDA Lead |
| **TOTAL** | | | **69 SP** | |

---

### Sprint 15: Testing, Optimization & Release (4 tickets, 23 SP)

| # | Ticket | Title | SP | Assignee |
|---|--------|-------|----|---------:|
| 1 | S15-T01 | E2E Test Suite | 8 | QA Lead |
| 2 | S15-T02 | Performance Optimization | 7 | FDA Dev |
| 3 | S15-T03 | Integration Test Suite | 5 | QA Lead |
| 4 | S15-T04 | Documentation & Release | 3 | DOA |
| **TOTAL** | | | **23 SP** | |

---

## 🏷️ Common Labels

Use these labels for all tickets (helps with filtering and tracking):

- `frontend` - Frontend component
- `component` - React component
- `sprint-13`, `sprint-14`, `sprint-15` - Sprint identifier
- `phase-1`, `phase-2`, `testing` - Phase identifier
- `api-integration` - Integrates with API endpoint
- `websocket` - Requires WebSocket
- `performance-critical` - Performance target

---

## 📍 Sprint Configuration Quick Reference

### Sprint 13 Configuration
```
Name:        Sprint 13: Phase 1 High-Priority Components
Start Date:  2025-11-04
End Date:    2025-11-15
Duration:    2 weeks (11 working days)
Capacity:    40 story points
Goal:        Implement 8 core components with 85%+ test coverage
```

### Sprint 14 Configuration
```
Name:        Sprint 14: Phase 2 Extended Components + WebSocket
Start Date:  2025-11-18
End Date:    2025-11-22
Duration:    1 week (5 working days)
Capacity:    69 story points
Goal:        Implement 11 extended components with WebSocket integration
```

### Sprint 15 Configuration
```
Name:        Sprint 15: Testing, Optimization & Release
Start Date:  2025-11-25
End Date:    2025-11-29
Duration:    1 week (5 working days)
Capacity:    23 story points
Goal:        Complete E2E testing, performance optimization, and release
```

---

## 🎯 Acceptance Criteria Templates

### All Tickets Must Include:

✅ **Functional Requirements**
- What component does
- User interactions supported
- Data displayed
- Integrations required

✅ **Technical Requirements**
- Libraries/frameworks to use
- API endpoints integrated
- State management approach
- Real-time update strategy

✅ **Performance Requirements**
- Initial render: < 400ms
- Re-render: < 100ms
- Memory: < 25MB
- API response: < 100ms (p95)

✅ **Quality Requirements**
- Test coverage: 85%+
- WCAG 2.1 AA accessibility
- TypeScript strict mode
- ESLint compliance

✅ **Documentation Requirements**
- PropTypes documented
- JSDoc comments
- Usage examples
- Performance benchmarks

---

## 📌 Quick Field Reference

When creating each ticket, fill in:

```
Issue Type:      Story
Summary:         [Ticket title from list above]
Description:     [From SPRINT-13-15-JIRA-SETUP-SCRIPT.md, Step 3]
Epic Link:       [Select the Epic created in Step 1]
Sprint:          [Select correct sprint: 13, 14, or 15]
Story Points:    [From table above]
Assignee:        [From table above]
Labels:          [Use labels from above list]
Component:       Frontend Portal
```

---

## ⚡ Pro Tips for Faster Creation

1. **Copy-paste descriptions** from SPRINT-13-15-JIRA-SETUP-SCRIPT.md
2. **Use keyboard shortcuts**:
   - `c` = Create Issue
   - `Escape` = Close dialog
   - `j` = Next issue
   - `k` = Previous issue

3. **Batch create by sprint**:
   - Create all Sprint 13 tickets first (8 tickets)
   - Then Sprint 14 (11 tickets)
   - Then Sprint 15 (4 tickets)

4. **Assign after creation**:
   - Create all tickets with Epic + Sprint
   - Then go back and assign team members
   - Faster than doing it during creation

5. **Use browser tabs**:
   - Tab 1: JIRA creation
   - Tab 2: SPRINT-13-15-JIRA-SETUP-SCRIPT.md (specs)
   - Tab 3: This card (reference)

---

## ✅ Verification Checklist

After creating all 23 tickets, verify:

- [ ] All 23 tickets visible in JIRA backlog
- [ ] Epic link is set for all 23 tickets
- [ ] Sprint 13 has 8 tickets (40 SP)
- [ ] Sprint 14 has 11 tickets (69 SP)
- [ ] Sprint 15 has 4 tickets (23 SP)
- [ ] All team members assigned
- [ ] Story points sum to 132 total
- [ ] No duplicate tickets created

---

## 📱 Mobile Friendly Tips

If using phone/tablet to create tickets:

1. Use landscape orientation (wider view)
2. Create tickets one at a time
3. Assign in batch after creation
4. Verify on desktop afterward

---

**Ready to start creating tickets?**
→ Open SPRINT-13-15-JIRA-SETUP-SCRIPT.md (Step 3) for full specifications
→ Use this card as quick reference during creation
→ Estimated time: 90 minutes for all 23 tickets
