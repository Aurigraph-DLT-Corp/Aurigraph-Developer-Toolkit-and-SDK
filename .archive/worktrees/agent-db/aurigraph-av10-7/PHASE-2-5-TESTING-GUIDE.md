# Phase 2-5 Testing Execution Guide

**Status**: Ready for Sequential Execution
**Date**: October 24, 2025
**Target**: Complete comprehensive E2E testing across UI/UX, Integration, Performance, and Production Readiness

---

## Phase 2: Manual UI/UX Testing (4-6 hours)

### Overview
Comprehensive manual testing of the demo management UI/UX across all functionality, browsers, devices, and accessibility requirements.

### Prerequisites
- Phase 1 API tests completed and passed
- Frontend server running (http://localhost:3000 or configured port)
- Test browser(s) open and ready
- Test user account(s) created

### Test Categories

#### 1. Demo Dashboard Display (8 tests)

**Test 2.1.1**: Dashboard loads without errors
- Navigate to demo dashboard URL
- Verify page loads within 3 seconds
- Verify no JavaScript console errors
- **Expected**: Dashboard visible, fully functional

**Test 2.1.2**: Demo list displays all available demos
- Check demo list renders all demos from database
- Verify count matches API response
- Verify demo cards are properly formatted
- **Expected**: All demos visible in grid/list view

**Test 2.1.3**: Demo cards show correct information
- Verify each card displays: name, user, status, created date
- Check data matches backend values
- Verify no data truncation
- **Expected**: All fields visible and correct

**Test 2.1.4**: Status badges display correctly
- Check badge colors for each status: PENDING, RUNNING, STOPPED, EXPIRED
- Verify badge text matches demo status
- Check accessibility (sufficient contrast)
- **Expected**: Color-coded status badges match spec

**Test 2.1.5**: Demo action buttons appear correctly
- Verify buttons present: Start, Stop, Extend (if admin), Delete
- Check buttons disabled/enabled based on status
- Verify button accessibility (keyboard focusable)
- **Expected**: All expected buttons visible and interactive

**Test 2.1.6**: Dashboard responsive on desktop (1920x1080)
- Open dashboard on desktop resolution
- Verify layout is not broken
- Check all elements visible without scrolling
- **Expected**: Full layout visible, properly aligned

**Test 2.1.7**: Dashboard responsive on tablet (768x1024)
- Resize to tablet dimensions or test on tablet
- Verify layout adapts correctly
- Check touch targets are appropriate size
- **Expected**: Responsive layout, touch-friendly

**Test 2.1.8**: Dashboard responsive on mobile (375x667)
- Resize to mobile dimensions or test on phone
- Verify vertical stack layout
- Check all elements accessible
- **Expected**: Mobile-optimized layout

---

#### 2. Demo Creation Form (8 tests)

**Test 2.2.1**: Form loads with all required fields
- Click "Create Demo" or similar button
- Verify form modal/page appears
- Check fields present: Name, Email, User, Description, Channels, Validators, Nodes
- **Expected**: All form fields visible and accessible

**Test 2.2.2**: Form validation triggers on submit with empty fields
- Click submit with empty name field
- Verify validation error appears
- Check error message is clear
- **Expected**: Validation prevents empty submission

**Test 2.2.3**: Form accepts valid demo data
- Fill all fields with valid data
- Click submit
- Verify form accepts the data
- **Expected**: Form validates and accepts input

**Test 2.2.4**: Form displays success message after creation
- Submit valid demo form
- Verify success toast/modal appears
- Check message content
- **Expected**: Success notification displayed

**Test 2.2.5**: New demo appears in list immediately after creation
- Create demo via form
- Verify new demo appears in dashboard list
- Check demo data matches form input
- **Expected**: Demo immediately visible in list

**Test 2.2.6**: Form clears after successful submission
- Create demo successfully
- Verify form resets to empty state
- **Expected**: Form ready for next demo creation

**Test 2.2.7**: Error messages display for invalid input
- Enter invalid email format
- Try to submit
- Verify inline validation error appears
- **Expected**: Clear error messages for invalid fields

**Test 2.2.8**: Channels/Validators/Nodes can be added/removed dynamically
- Click "Add Channel" button
- Verify new input field appears
- Enter channel data
- Verify data can be removed
- **Expected**: Dynamic field management works

---

#### 3. Demo List Operations (8 tests)

**Test 2.3.1**: Demo list updates after create operation
- Get current demo count
- Create new demo
- Verify list refreshes with new demo
- **Expected**: List updates automatically

**Test 2.3.2**: Demo list updates after delete operation
- Delete a demo
- Verify deletion confirmation
- Verify demo removed from list
- **Expected**: List updates after deletion

**Test 2.3.3**: Demo list filters by status correctly
- Click status filter dropdown
- Select "RUNNING" status
- Verify only running demos display
- **Expected**: Filtering works correctly

**Test 2.3.4**: Demo list sorts by creation date
- Click "Date" column header
- Verify list sorts ascending/descending
- Check date order is correct
- **Expected**: Sorting works in both directions

**Test 2.3.5**: Search functionality finds demos by name
- Type demo name in search box
- Verify matching demos appear
- Type non-matching text
- Verify "no results" message appears
- **Expected**: Search filters correctly

**Test 2.3.6**: Pagination works for large demo lists
- Assuming 20+ demos in list
- Verify pagination controls appear
- Click next page
- Verify new demos load
- **Expected**: Pagination functions correctly

**Test 2.3.7**: Empty state displays correctly
- Delete all demos (or simulate)
- Verify empty state message appears
- Check empty state is user-friendly
- **Expected**: Clear empty state messaging

**Test 2.3.8**: Loading indicators show during operations
- Create a demo
- Verify loading spinner appears during creation
- Verify spinner disappears after completion
- **Expected**: User feedback during async operations

---

#### 4. Demo Actions & State Transitions (12 tests)

**Test 2.4.1**: Start demo button transitions demo to RUNNING state
- Click "Start" on PENDING demo
- Verify status changes to RUNNING
- Verify button changes
- **Expected**: Demo transitions to RUNNING state

**Test 2.4.2**: Stop demo button transitions demo to STOPPED state
- Click "Stop" on RUNNING demo
- Verify status changes to STOPPED
- Verify button becomes disabled
- **Expected**: Demo transitions to STOPPED state

**Test 2.4.3**: Extend demo updates expiration time
- Click "Extend" button (admin user)
- Select extension duration
- Verify expiration time updates
- **Expected**: Expiration time extended

**Test 2.4.4**: Delete demo removes from list
- Click "Delete" button
- Confirm deletion
- Verify demo removed from list
- **Expected**: Demo deleted successfully

**Test 2.4.5**: Start/Stop/Extend buttons disabled when not applicable
- Check RUNNING demo has no "Start" button
- Check EXPIRED demo has no "Stop" button
- Verify button states based on demo status
- **Expected**: Buttons correctly enabled/disabled

**Test 2.4.6**: Extend button only visible for admins
- Log in as regular user
- Verify no "Extend" button on demo
- Log in as admin
- Verify "Extend" button appears
- **Expected**: Admin-only button hidden from users

**Test 2.4.7**: Actions work from demo card and detail view
- Test action button on card view
- Open demo details page
- Verify same action button works
- **Expected**: Actions consistent across views

**Test 2.4.8**: Confirmation dialog appears before delete
- Click "Delete" button
- Verify confirmation modal appears
- Verify "Cancel" cancels action
- **Expected**: Destructive action requires confirmation

**Test 2.4.9**: Status changes reflect immediately in UI
- Perform state transition
- Verify UI updates without page reload
- Check badge color changes
- **Expected**: Instant UI feedback

**Test 2.4.10**: Last activity timestamp updates
- Perform action on demo
- Verify "Last Activity" timestamp updates
- Check timestamp format is correct
- **Expected**: Activity tracking works

**Test 2.4.11**: Action buttons disabled during API calls
- Click action button
- Verify button disabled while loading
- Verify button re-enabled after completion
- **Expected**: Prevents double-click issues

**Test 2.4.12**: Error toast appears if action fails
- Simulate API failure (network tab throttle)
- Perform action
- Verify error toast appears
- Check error message is helpful
- **Expected**: User notified of failures

---

#### 5. Cross-Browser Testing (6 tests)

**Test 2.5.1**: Chrome 120+
- Open demo dashboard in Chrome 120+
- Run through basic functionality tests
- Verify no browser-specific issues
- **Expected**: Full functionality in Chrome

**Test 2.5.2**: Firefox 121+
- Open demo dashboard in Firefox 121+
- Run through basic functionality tests
- Verify CSS rendering consistent
- **Expected**: Full functionality in Firefox

**Test 2.5.3**: Safari 17+
- Open demo dashboard in Safari 17+
- Check for Safari-specific issues
- Verify form submission works
- **Expected**: Full functionality in Safari

**Test 2.5.4**: Edge 120+
- Open demo dashboard in Edge 120+
- Verify consistent with Chromium browsers
- **Expected**: Full functionality in Edge

**Test 2.5.5**: Mobile Safari (iOS 17+)
- Open on iPhone/iPad with iOS 17+
- Test touch interactions
- Verify responsive layout
- **Expected**: Full functionality on iOS

**Test 2.5.6**: Mobile Chrome (Android 14+)
- Open on Android device with Chrome
- Test touch interactions
- Verify responsive layout
- **Expected**: Full functionality on Android

---

#### 6. Accessibility Testing (4 tests)

**Test 2.6.1**: Keyboard navigation works
- Tab through all form fields
- Verify focus visible on all interactive elements
- Use Enter to submit forms
- **Expected**: Full keyboard accessibility

**Test 2.6.2**: ARIA labels present on buttons
- Use browser DevTools to inspect buttons
- Verify aria-label or accessible name present
- Check button purpose is clear
- **Expected**: All buttons properly labeled

**Test 2.6.3**: Color contrast meets WCAG AA
- Use accessibility checker tool
- Check text contrast ratios
- Verify badges, buttons, text all pass
- **Expected**: WCAG AA compliance

**Test 2.6.4**: Screen reader compatible
- Use screen reader (NVDA, JAWS, VoiceOver)
- Navigate demo dashboard
- Verify announcements make sense
- Check form labels read correctly
- **Expected**: Screen reader friendly

---

#### 7. Error Scenarios (4 tests)

**Test 2.7.1**: Network error handling
- Open Network tab in DevTools
- Block network requests
- Attempt to create demo
- Verify error message appears
- **Expected**: Graceful error handling

**Test 2.7.2**: Timeout handling
- Throttle network to very slow
- Perform operation
- Verify timeout error appears after reasonable delay
- **Expected**: Timeout recovery works

**Test 2.7.3**: Invalid response handling
- Intercept API response
- Return malformed JSON
- Verify app doesn't crash
- **Expected**: Handles invalid responses

**Test 2.7.4**: Retry mechanism works
- Simulate transient failure
- Verify retry button appears
- Click retry
- Verify operation succeeds
- **Expected**: Retry mechanism functional

---

### Phase 2 Execution Checklist

- [ ] All 50+ manual test cases executed
- [ ] Test results documented with screenshots
- [ ] Cross-browser compatibility verified
- [ ] Accessibility requirements met
- [ ] Error scenarios tested
- [ ] Performance observations noted
- [ ] Bugs/issues logged with reproduction steps
- [ ] Phase 2 report completed

**Estimated Duration**: 4-6 hours
**Pass Criteria**: 95%+ tests pass, all critical issues resolved
**Sign-off**: QA lead approval

---

## Phase 3: Integration Testing (2-3 hours)

### Overview
End-to-end integration tests validating complete workflows from UI through API to database.

### Test Cases

#### 3.1: End-to-End CRUD Flow (5 tests)

**Test 3.1.1**: Create demo from UI → stored in database
- Create demo via UI form
- Query database directly to verify storage
- Verify all fields saved correctly
- **Expected**: Demo persisted in database

**Test 3.1.2**: Read demo from UI → matches database record
- Fetch demo via UI list
- Query database for same demo
- Compare all field values
- **Expected**: UI data matches database

**Test 3.1.3**: Update demo → changes reflected in list
- Update demo merkle root
- Verify change appears in list
- Query database to confirm change
- **Expected**: Update propagates end-to-end

**Test 3.1.4**: Delete demo → removed from database
- Delete demo via UI
- Verify removed from list
- Query database - should not exist
- **Expected**: Deletion is persistent

**Test 3.1.5**: Verify deleted demo returns 404 on API
- Delete demo via UI
- Call API to fetch deleted demo
- Verify 404 response
- **Expected**: API returns 404 for deleted demos

---

#### 3.2: Data Persistence (4 tests)

**Test 3.2.1**: Demo survives application restart
- Create demo
- Stop application
- Restart application
- Verify demo still exists
- **Expected**: Data persists across restart

**Test 3.2.2**: Multiple demos coexist in database
- Create 5 different demos
- Verify all 5 exist simultaneously
- Delete one, verify others remain
- **Expected**: Multi-demo database support works

**Test 3.2.3**: Sample bootstrap demos are present
- Start application
- Query database for bootstrap demos
- Verify 3 sample demos exist
- **Expected**: Bootstrap data loaded correctly

**Test 3.2.4**: Custom demo data preserved across restarts
- Create custom demo with unique name
- Stop/restart application
- Search for custom demo
- Verify data intact
- **Expected**: Custom data persists

---

#### 3.3: State Management (3 tests)

**Test 3.3.1**: Demo state transitions are atomic
- Start demo
- Immediately check database
- Verify state is consistent (not partial)
- **Expected**: All-or-nothing state changes

**Test 3.3.2**: Concurrent operations don't corrupt data
- Create 10 demos simultaneously
- Verify all created successfully
- Check database integrity
- **Expected**: No data corruption under concurrency

**Test 3.3.3**: Demo list consistency maintained
- Get demo count
- Perform CRUD operations
- Verify count matches reality
- **Expected**: List stays in sync with database

---

#### 3.4: API-Database Integration (3 tests)

**Test 3.4.1**: Flyway migrations execute correctly
- Check database schema
- Verify `demos` table exists with all columns
- Verify indexes created
- **Expected**: Schema matches migration definition

**Test 3.4.2**: H2 database mode works for tests
- Run integration tests against H2
- Verify all tests pass
- Check transaction handling works
- **Expected**: H2 test database compatible

**Test 3.4.3**: Transaction rollback on error
- Start transaction to create demo with invalid data
- Verify transaction rolls back
- Check database unchanged
- **Expected**: ACID compliance maintained

---

#### 3.5: Frontend-Backend Synchronization (2 tests)

**Test 3.5.1**: UI list reflects API response
- Create demo
- Get API response
- Verify UI list matches API data
- **Expected**: UI synchronized with API

**Test 3.5.2**: Form data matches API schema
- Fill form with all fields
- Submit
- Verify API receives correct schema
- **Expected**: Form correctly maps to API

---

### Phase 3 Execution Checklist

- [ ] All 17 integration test cases executed
- [ ] Database state verified after each operation
- [ ] Data persistence validated
- [ ] State transitions verified
- [ ] No data corruption observed
- [ ] All ACID properties confirmed
- [ ] Phase 3 report completed

**Estimated Duration**: 2-3 hours
**Pass Criteria**: 100% tests pass, zero data corruption
**Sign-off**: Development lead approval

---

## Phase 4: Performance Testing (2-4 hours)

### Overview
Measure and validate API response times, throughput, and resource utilization.

### Prerequisites
- JMeter or similar load testing tool installed
- Performance baseline targets defined
- Monitoring tools (JVM metrics, database metrics) available

### Test Cases

#### 4.1: API Response Times (5 tests)

**Test 4.1.1**: GET /api/demos < 500ms
- Execute 100 GET requests
- Record response times
- Verify 95th percentile < 500ms
- **Expected**: List endpoint fast

**Test 4.1.2**: POST /api/demos < 1000ms
- Execute 50 POST requests
- Record response times
- Verify 95th percentile < 1000ms
- **Expected**: Create endpoint meets target

**Test 4.1.3**: GET /api/demos/{id} < 200ms
- Execute 100 single demo fetches
- Record response times
- Verify 95th percentile < 200ms
- **Expected**: Detail endpoint very fast

**Test 4.1.4**: PUT /api/demos/{id} < 500ms
- Execute 50 update requests
- Record response times
- Verify 95th percentile < 500ms
- **Expected**: Update endpoint meets target

**Test 4.1.5**: DELETE /api/demos/{id} < 500ms
- Execute 50 delete requests
- Record response times
- Verify 95th percentile < 500ms
- **Expected**: Delete endpoint meets target

---

#### 4.2: Throughput & Scalability (5 tests)

**Test 4.2.1**: Handle 10 concurrent users
- Simulate 10 concurrent API clients
- Run for 5 minutes
- Verify zero failures
- **Expected**: System stable at 10 users

**Test 4.2.2**: Handle 50 concurrent users
- Simulate 50 concurrent API clients
- Run for 5 minutes
- Verify zero failures
- **Expected**: System stable at 50 users

**Test 4.2.3**: Handle 100 concurrent users
- Simulate 100 concurrent API clients
- Run for 5 minutes
- Verify < 1% failures
- **Expected**: System handles 100 users

**Test 4.2.4**: Measure requests/second
- Run load test with 100 users
- Calculate RPS (requests per second)
- Compare to target (776K TPS for demo endpoints)
- **Expected**: Meet throughput targets

**Test 4.2.5**: Measure average response time under load
- Run 100 concurrent users
- Calculate average response time
- Verify acceptable degradation
- **Expected**: Response time degrades gracefully

---

#### 4.3: Database Performance (5 tests)

**Test 4.3.1**: CREATE demo < 100ms
- Insert 100 demos via API
- Measure database execution time
- Verify 95th percentile < 100ms
- **Expected**: Inserts are fast

**Test 4.3.2**: SELECT demos < 50ms
- Query all demos 100 times
- Verify 95th percentile < 50ms
- **Expected**: Selects very fast

**Test 4.3.3**: UPDATE demo < 100ms
- Update same demo 100 times
- Verify 95th percentile < 100ms
- **Expected**: Updates fast

**Test 4.3.4**: DELETE demo < 100ms
- Delete 100 demos
- Verify 95th percentile < 100ms
- **Expected**: Deletes fast

**Test 4.3.5**: SELECT with filter < 100ms (1000 records)
- Create 1000 demos
- Query with status filter
- Verify 95th percentile < 100ms
- **Expected**: Indexes working effectively

---

#### 4.4: Memory & Resource Usage (3 tests)

**Test 4.4.1**: Memory usage < 512MB (JVM mode)
- Run for 10 minutes with 100 concurrent users
- Monitor JVM heap memory
- Verify peak usage < 512MB
- **Expected**: Reasonable memory footprint

**Test 4.4.2**: Memory usage < 256MB (native mode)
- Run native executable
- Monitor resident memory
- Verify < 256MB (native executable)
- **Expected**: Lightweight native version

**Test 4.4.3**: CPU utilization < 80% under load
- Monitor CPU during 100 user test
- Verify peaks < 80%
- Check for hot spots
- **Expected**: Efficient resource usage

---

#### 4.5: Stress & Endurance (2+ tests)

**Test 4.5.1**: 1000 demo creations without failure
- Create 1000 demos in sequence
- Verify zero failures
- Check final count accurate
- **Expected**: System handles bulk creation

**Test 4.5.2**: 24-hour stability test
- Run light load (10 users) for 24 hours
- Monitor for memory leaks
- Verify consistent performance
- **Expected**: No degradation over time

---

### Phase 4 Execution Checklist

- [ ] All 20+ performance test cases executed
- [ ] Response time baselines recorded
- [ ] Throughput targets validated
- [ ] Database performance acceptable
- [ ] Resource usage within limits
- [ ] Stress test completed successfully
- [ ] Performance report with metrics generated

**Estimated Duration**: 2-4 hours
**Pass Criteria**: All response times met, zero data loss under load
**Sign-off**: Performance engineer approval

---

## Phase 5: Production Readiness Review (1-2 hours)

### Overview
Final comprehensive checklist for production deployment readiness.

### Checklist Items

#### 5.1: Security (6 checks)

- [ ] No hardcoded credentials in code
- [ ] CORS configuration appropriate (not `*`)
- [ ] API endpoints authenticated where required
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (parameterized queries used)
- [ ] Error messages don't expose internals (no stack traces)

#### 5.2: Configuration (4 checks)

- [ ] application.properties secure (no sensitive data)
- [ ] Database connection pooling configured
- [ ] Logging levels appropriate (not DEBUG in prod)
- [ ] Timeout values reasonable (not infinite waits)

#### 5.3: Database (3 checks)

- [ ] Flyway migrations tested
- [ ] Database backup strategy documented
- [ ] Recovery procedures documented

#### 5.4: Deployment (5 checks)

- [ ] JAR size acceptable (< 500MB)
- [ ] Startup time < 10s (native) / < 5s (JVM)
- [ ] Health check endpoint working
- [ ] Metrics endpoint available
- [ ] Graceful shutdown implemented

#### 5.5: Documentation (6 checks)

- [ ] API documentation complete (OpenAPI/Swagger)
- [ ] Deployment guide available
- [ ] Configuration guide available
- [ ] Troubleshooting guide available
- [ ] Change log updated
- [ ] Release notes prepared

#### 5.6: Testing & Coverage (3 checks)

- [ ] All phases passed (1-4)
- [ ] Test coverage > 80%
- [ ] Regression test suite automated

#### 5.7: Sign-off (3 checks)

- [ ] QA sign-off obtained
- [ ] Product owner approval
- [ ] Ready for production deployment

---

### Phase 5 Execution

1. **Security Audit**
   - Review code for hardcoded credentials
   - Check CORS configuration
   - Verify input validation on all endpoints
   - Test error response messages

2. **Configuration Review**
   - Verify application.properties for production
   - Check database connection settings
   - Validate logging configuration
   - Review timeout settings

3. **Database Review**
   - Verify Flyway migrations complete
   - Document backup procedures
   - Test recovery procedures

4. **Deployment Review**
   - Check JAR/native executable sizes
   - Measure startup time
   - Test health check endpoint
   - Verify metrics collection

5. **Documentation Review**
   - Ensure API docs are complete
   - Verify deployment instructions
   - Check troubleshooting guide
   - Update changelog

6. **Final Sign-off**
   - Obtain QA approval
   - Get product owner sign-off
   - Verify all tests passing
   - Confirm readiness for production

---

### Phase 5 Execution Checklist

- [ ] All 30+ checklist items verified
- [ ] Any blocking issues resolved
- [ ] Security review complete
- [ ] Documentation complete
- [ ] All phases 1-4 passed
- [ ] QA sign-off obtained
- [ ] Product owner approval
- [ ] Production deployment approved

**Estimated Duration**: 1-2 hours
**Pass Criteria**: All checklist items complete, zero blockers
**Sign-off**: Product owner and deployment lead

---

## Summary

| Phase | Duration | Tests | Status |
|-------|----------|-------|--------|
| 1 - API Testing | 1-2h | 21 | 🔄 Running |
| 2 - UI/UX Testing | 4-6h | 50+ | ⏳ Pending |
| 3 - Integration | 2-3h | 17 | ⏳ Pending |
| 4 - Performance | 2-4h | 20+ | ⏳ Pending |
| 5 - Production | 1-2h | 30+ | ⏳ Pending |
| **TOTAL** | **10-17h** | **130+** | **In Progress** |

---

## Completion Criteria

✅ All tests passed
✅ Performance baselines met
✅ Zero critical/high-severity issues
✅ Security review complete
✅ Documentation complete
✅ All sign-offs obtained
✅ Production-ready

---

**Document Version**: 1.0
**Last Updated**: 2025-10-24
**Next Review**: After Phase 1 completion
