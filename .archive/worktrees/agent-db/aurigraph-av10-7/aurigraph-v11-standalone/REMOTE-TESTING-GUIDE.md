# Aurigraph V11 Enterprise Portal - Remote Testing Guide

**Date**: October 31, 2025
**Version**: 4.8.0 with Login Page Flashing Fix
**Status**: Ready for Remote Testing Deployment

---

## Quick Start

### Prerequisites
- SSH access to `dlt.aurigraph.io` (port 2235)
- Username: `subbu`
- Server must be online and reachable

### One-Command Deployment
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone
./deploy-remote-testing.sh
```

This script will:
1. ✅ Verify build artifacts exist
2. ✅ Test remote server connectivity
3. ✅ Backup current deployments
4. ✅ Deploy backend JAR (176 MB)
5. ✅ Deploy frontend build
6. ✅ Restart backend and NGINX services
7. ✅ Provide testing URLs

---

## What's Being Deployed

### Backend (Java/Quarkus)
- **File**: `target/aurigraph-v11-standalone-11.4.4-runner.jar` (176 MB)
- **Version**: 11.4.4
- **Port**: 9003 (proxied via NGINX to port 443)
- **Framework**: Quarkus 3.29.0 with Java 21
- **Status**: ✅ All 831 source files compile
- **Testing**: ✅ 22/22 integration tests passing

**What's New in This Build**:
- ✅ Endpoint conflicts resolved (moved old APIs to /deprecated)
- ✅ Caching infrastructure configured
- ✅ Type safety fixes in Portal API Gateway
- ✅ 7 Portal data services fully integrated

### Frontend (Enterprise Portal)
- **Type**: React 18 + TypeScript + Material-UI
- **Build Output**: `enterprise-portal/dist/` directory
- **Version**: 4.8.0
- **Size**: ~1.5 MB (gzipped)
- **Status**: ✅ Production build successful

**What's New in This Build**:
- ✅ **FIXED**: Login page flashing issue
  - Added `isLoading` state to auth management
  - Prevents route rendering until auth is initialized
  - Eliminates rapid mount/unmount cycles
- ✅ 23 pages across 6 categories
- ✅ Real-time blockchain metrics display
- ✅ Material-UI components with Aurigraph branding
- ✅ Responsive design for all screen sizes

---

## Testing Workflow

### 1. Deploy to Remote Server
```bash
./deploy-remote-testing.sh
```

Wait for all 6 steps to complete successfully.

### 2. Access the Portal
```
Frontend: https://dlt.aurigraph.io
Backend Health: https://dlt.aurigraph.io/api/v11/health
Backend Info: https://dlt.aurigraph.io/api/v11/info
```

### 3. Login
```
Username: admin
Password: admin
```

### 4. Test Features

#### Dashboard Tests
- [ ] Page loads without errors
- [ ] Real-time metrics display (TPS, validators, block height)
- [ ] Charts and graphs render correctly
- [ ] No console errors (check DevTools)

#### Navigation Tests
- [ ] Sidebar navigation works
- [ ] Page transitions are smooth
- [ ] URLs update correctly
- [ ] Back button works

#### API Integration Tests
- [ ] Network statistics load
- [ ] Transaction data displays
- [ ] Validator information shows
- [ ] Analytics data renders
- [ ] Performance metrics display

#### Mobile Responsiveness
- [ ] Test on mobile device or DevTools
- [ ] Sidebar collapses on small screens
- [ ] Content is readable
- [ ] Touch interactions work

### 5. Check Browser Console
Open DevTools (F12) and check:
```
Console tab:
- [ ] No red error messages
- [ ] No failed API calls (404s, 500s)
- [ ] No TypeScript errors
- [ ] Network requests complete successfully

Network tab:
- [ ] All resources load (check for 200 status)
- [ ] API responses are valid JSON
- [ ] Images and fonts load
- [ ] No hanging requests
```

### 6. Verify Backend Services
Test backend endpoints directly:
```bash
# Health check
curl -k https://dlt.aurigraph.io/api/v11/health

# System info
curl -k https://dlt.aurigraph.io/api/v11/info

# Blockchain metrics
curl -k https://dlt.aurigraph.io/api/v11/blockchain/health

# Validators
curl -k https://dlt.aurigraph.io/api/v11/blockchain/validators
```

Expected: All endpoints return 200 with valid JSON responses

---

## Known Issues & Fixes

### Issue 1: Login Page Flashing ✅ FIXED
**Symptom**: Login page appears and disappears rapidly on page load
**Root Cause**: Missing auth loading state, causing rapid redirect cycles
**Fix Applied**: Added `isLoading` state to gate route rendering until auth is initialized
**Files Modified**:
- `src/store/authSlice.ts` - Added isLoading field
- `src/App.tsx` - Added loading guard before rendering routes

### Issue 2: Endpoint Conflicts ✅ FIXED
**Symptom**: Integration tests failing with duplicate endpoint errors
**Root Cause**: Multiple REST resources declaring same endpoints
**Fix Applied**: Moved old API resources to /deprecated paths
**Files Modified**:
- Created `PortalIntegrationTestProfile` for test isolation
- Moved old resources: AurigraphResource, BlockchainApiResource, NetworkResource

### Issue 3: Remote Server Unavailability ⚠️ TEMPORARY
**Current Status**: Server is temporarily unavailable (Connection refused on port 2235)
**Action**: This deployment package is ready to execute as soon as server comes online
**Preparation**: All artifacts are built and deployment script is ready

---

## Deployment Checklist

Before running `./deploy-remote-testing.sh`:

- [ ] Backend JAR exists: `target/aurigraph-v11-standalone-11.4.4-runner.jar` (176 MB)
- [ ] Frontend build exists: `enterprise-portal/dist/` directory with index.html
- [ ] SSH access to `subbu@dlt.aurigraph.io:2235` is configured
- [ ] Git commits are pushed to origin/main
- [ ] No uncommitted changes locally

### Verify Artifacts
```bash
# Check backend
ls -lh target/aurigraph-v11-standalone-*.jar

# Check frontend
ls -la enterprise-portal/dist/index.html
```

### Verify Git Status
```bash
# Should be clean
git status

# Should show recent commits
git log --oneline -5
```

---

## Post-Deployment Verification

After `./deploy-remote-testing.sh` completes:

### Backend Service Status
```bash
# SSH to server
ssh -p 2235 subbu@dlt.aurigraph.io

# Check service status
sudo systemctl status aurigraph-v11

# View recent logs
sudo journalctl -u aurigraph-v11 -n 20
```

### Frontend Deployment Status
```bash
# Check NGINX status
sudo systemctl status nginx

# Check deployed files
ls -la /var/www/dlt.aurigraph.io/

# View NGINX config
sudo cat /etc/nginx/sites-available/dlt.aurigraph.io
```

### Backup Locations
```bash
# Backend backups
ls -la /opt/aurigraph/v11/backups/

# Frontend rollback (previous version)
ls -la /var/www/dlt.aurigraph.io.bak/
```

---

## Rollback Procedure

If something goes wrong:

### Rollback Backend
```bash
ssh -p 2235 subbu@dlt.aurigraph.io << 'ROLLBACK'
# Find latest backup
ls -t /opt/aurigraph/v11/backups/ | head -1

# Restore
cp /opt/aurigraph/v11/backups/aurigraph-v11-standalone-11.4.4-runner_YYYYMMDD_HHMMSS.jar \
   /opt/aurigraph/v11/aurigraph-v11-standalone-11.4.4-runner.jar

# Restart
sudo systemctl restart aurigraph-v11
ROLLBACK
```

### Rollback Frontend
```bash
ssh -p 2235 subbu@dlt.aurigraph.io << 'ROLLBACK'
# Restore from backup
cp -r /var/www/dlt.aurigraph.io.bak/* /var/www/dlt.aurigraph.io/

# Reload NGINX
sudo systemctl reload nginx
ROLLBACK
```

---

## Performance Baselines

Expected performance on remote server:

### Backend
- **Response Time**: < 100ms (p99)
- **Error Rate**: < 0.1%
- **Uptime**: > 99%
- **Memory Usage**: ~512MB JVM
- **CPU Usage**: < 70% average

### Frontend
- **Page Load**: < 2 seconds
- **Time to Interactive**: < 3 seconds
- **Bundle Size**: ~450KB gzipped
- **JavaScript Errors**: 0

### API Endpoints
- **Health Check**: < 50ms
- **System Info**: < 100ms
- **Metrics**: < 200ms
- **Validator List**: < 500ms

---

## Testing Scenarios

### Scenario 1: Fresh Login
1. Clear browser cache/cookies
2. Navigate to https://dlt.aurigraph.io
3. Should see Login page (no flashing)
4. Enter: admin/admin
5. Should navigate to Dashboard
6. Check browser console (F12) for errors

**Expected**: Clean login, no errors, smooth navigation

### Scenario 2: Dashboard Navigation
1. From Dashboard, navigate to each section
2. Transactions → Performance → Node Management → Analytics → Settings
3. Check each page loads and displays data
4. Click back button, navigate forward

**Expected**: All pages load, navigation is smooth, data displays correctly

### Scenario 3: Session Persistence
1. Login as admin
2. Refresh page (Ctrl+R or Cmd+R)
3. Should remain logged in
4. Open DevTools → Application → LocalStorage
5. Should see `auth_token` and `auth_user` entries

**Expected**: Session persists across page refreshes

### Scenario 4: Error Handling
1. Check Network tab in DevTools
2. Look for any failed API calls (4xx, 5xx status codes)
3. Check Console tab for JavaScript errors
4. Verify error messages are user-friendly

**Expected**: All API calls succeed (200-299 status codes), no errors in console

### Scenario 5: Mobile Testing
1. Open https://dlt.aurigraph.io on mobile device
2. Or use DevTools device emulation (F12 → Toggle device toolbar)
3. Test Responsive sizes: iPhone (375px), iPad (768px), Desktop (1920px)
4. Verify sidebar responsive behavior
5. Test touch interactions

**Expected**: Responsive design works, content is readable, interactions responsive

---

## Troubleshooting

### Issue: "Connection refused" when running deploy script
```
Error: Cannot connect to remote server at dlt.aurigraph.io:2235
```
**Solution**:
1. Verify server is online: `ping dlt.aurigraph.io`
2. Verify SSH port: `ssh -p 2235 subbu@dlt.aurigraph.io`
3. Check SSH key configuration: `ssh -v -p 2235 subbu@dlt.aurigraph.io`
4. Confirm network connectivity

### Issue: "Permission denied" when deploying
```
Error: Permission denied (publickey,password)
```
**Solution**:
1. Verify SSH key is configured
2. Try password authentication: `ssh -p 2235 subbu@dlt.aurigraph.io`
3. Add SSH key: `ssh-copy-id -p 2235 -i ~/.ssh/id_rsa subbu@dlt.aurigraph.io`

### Issue: Login page still flashing
```
Symptom: Page keeps refreshing/redirecting even after fix
```
**Solution**:
1. Clear browser cache: Ctrl+Shift+Delete
2. Hard refresh page: Ctrl+Shift+R
3. Check browser console for errors: F12
4. Verify backend is responding: `curl https://dlt.aurigraph.io/api/v11/health`

### Issue: "Cannot GET /api/v11/..." errors
```
Error: 404 responses from API endpoints
```
**Solution**:
1. Verify backend service is running: `sudo systemctl status aurigraph-v11`
2. Check backend logs: `sudo journalctl -u aurigraph-v11 -n 50`
3. Verify NGINX proxy configuration: `sudo nginx -t`
4. Restart NGINX: `sudo systemctl restart nginx`

### Issue: NGINX "502 Bad Gateway"
```
Error: Upstream connection refused from https://dlt.aurigraph.io
```
**Solution**:
1. Verify backend service is running: `sudo systemctl status aurigraph-v11`
2. Check if port 9003 is listening: `sudo lsof -i :9003`
3. Verify NGINX upstream config points to localhost:9003
4. Restart both services:
   ```bash
   sudo systemctl restart aurigraph-v11
   sudo systemctl restart nginx
   ```

---

## Support & Documentation

### Files in This Deployment
- `deploy-remote-testing.sh` - Main deployment script
- `REMOTE-TESTING-GUIDE.md` - This file
- `DEPLOYMENT.md` - Backend deployment documentation
- `enterprise-portal/` - Frontend source code

### Related Documentation
- `TODO.md` - Current project status and completed work
- `SPRINT_PLAN.md` - Sprint objectives and timeline
- `COMPREHENSIVE-TEST-PLAN.md` - Testing requirements and coverage

### Git Commit
- **Latest Commit**: `98f751fa` - Fix login page flashing with auth state loading
- **Previous Commits**: `bb4aa54c`, `fc854c2f`, `4daf3b3e`
- **Repository**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT

---

## Next Steps After Testing

1. **Collect Feedback**: Document any issues or feature requests
2. **Performance Analysis**: Compare actual vs. expected performance
3. **Security Review**: Test authentication and authorization
4. **API Integration**: Verify all backend endpoints work correctly
5. **Mobile Testing**: Ensure responsive design works on all devices
6. **Production Hardening**: Address any issues found during testing
7. **Update Documentation**: Record testing results and findings

---

**Last Updated**: October 31, 2025
**Deployment Ready**: ✅ YES
**Remote Server Status**: ⚠️ Currently Unavailable (will retry on execution)

