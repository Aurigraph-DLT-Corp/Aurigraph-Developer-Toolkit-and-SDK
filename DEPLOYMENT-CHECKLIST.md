# V11 Live Data Integration - Deployment Checklist
**Epic**: AV11-176, AV11-192
**Deployment Date**: TBD
**Status**: Ready for Deployment

---

## Pre-Deployment Verification

### 1. File Inventory ✅

Verify all files are present in `/Users/subbujois/Documents/GitHub/Aurigraph-DLT/`:

- [x] `v11-api-client.js` (8 KB) - Core API client
- [x] `v11-portal-integration.js` (12 KB) - Portal integration layer
- [x] `V11-API-INTEGRATION-REPORT.md` - Full documentation
- [x] `QUICK-INTEGRATION-GUIDE.md` - 5-minute setup guide
- [x] `V11-MISSING-ENDPOINTS.md` - Backend implementation guide
- [x] `V11-INTEGRATION-SUMMARY.md` - Executive summary
- [x] `DEPLOYMENT-CHECKLIST.md` - This checklist

### 2. V11 Backend Verification

```bash
# SSH to production server
ssh -p2235 subbu@dlt.aurigraph.io

# Check V11 service status
sudo systemctl status aurigraph-v11

# Expected output:
# ● aurigraph-v11.service - Aurigraph V11 DLT Platform
#    Loaded: loaded
#    Active: active (running)
```

**Status**: [ ] Running [ ] Not Running

If not running:
```bash
# Start V11 service
sudo systemctl start aurigraph-v11

# Enable on boot
sudo systemctl enable aurigraph-v11

# View logs
journalctl -u aurigraph-v11 -f
```

### 3. API Endpoint Testing

Test all required endpoints:

```bash
# 1. Health Check
curl -X GET https://dlt.aurigraph.io/api/v11/legacy/health

# Expected Response:
# {
#   "status": "HEALTHY",
#   "version": "11.0.0-standalone",
#   "uptimeSeconds": <number>,
#   "totalRequests": <number>,
#   "platform": "Java/Quarkus/GraalVM"
# }
```
**Status**: [ ] Pass [ ] Fail

```bash
# 2. System Information
curl -X GET https://dlt.aurigraph.io/api/v11/legacy/info

# Expected Response:
# {
#   "name": "Aurigraph V11 Java Nexus",
#   "version": "11.0.0",
#   "javaVersion": "Java 21",
#   "framework": "Quarkus Native Ready",
#   "osName": "<OS>",
#   "osArch": "<ARCH>"
# }
```
**Status**: [ ] Pass [ ] Fail

```bash
# 3. System Status (PRIMARY ENDPOINT)
curl -X GET https://dlt.aurigraph.io/api/v11/legacy/system/status

# Expected Response: JSON with these keys:
# - platformName
# - version
# - uptimeMs
# - healthy
# - transactionStats (with currentThroughputMeasurement, totalTransactions)
# - consensusStatus (with currentBlockHeight, activeNodes)
# - cryptoStatus
# - bridgeStats
# - hmsStats
# - aiStats
# - timestamp
```
**Status**: [ ] Pass [ ] Fail

```bash
# 4. Transaction Stats
curl -X GET https://dlt.aurigraph.io/api/v11/legacy/stats

# Expected Response: JSON with transaction statistics
```
**Status**: [ ] Pass [ ] Fail

```bash
# 5. Performance Test
curl -X GET "https://dlt.aurigraph.io/api/v11/legacy/performance?iterations=100000&threads=256"

# Expected Response:
# {
#   "iterations": 100000,
#   "durationMs": <number>,
#   "transactionsPerSecond": <number>,
#   "nsPerTransaction": <number>,
#   "optimizations": "Java/Quarkus + Virtual Threads",
#   "threadCount": 256,
#   "targetTPS": 2000000,
#   "targetAchieved": <boolean>
# }
```
**Status**: [ ] Pass [ ] Fail

### 4. Network & Firewall

```bash
# Test port accessibility from external network
telnet dlt.aurigraph.io 9003

# Should connect successfully
# Press Ctrl+] then type 'quit' to exit
```
**Status**: [ ] Port Open [ ] Port Blocked

If blocked:
```bash
# On server, check firewall
sudo ufw status

# Allow port 9003 if needed
sudo ufw allow 9003/tcp

# Reload firewall
sudo ufw reload
```

---

## Deployment Steps

### Step 1: Upload Integration Files to Server

```bash
# From your local machine
cd /Users/subbujois/Documents/GitHub/Aurigraph-DLT

# Upload files to server
scp -P 2235 v11-api-client.js subbu@dlt.aurigraph.io:/var/www/html/aurigraph-portal/
scp -P 2235 v11-portal-integration.js subbu@dlt.aurigraph.io:/var/www/html/aurigraph-portal/

# Verify upload
ssh -p2235 subbu@dlt.aurigraph.io "ls -lh /var/www/html/aurigraph-portal/v11-*.js"
```

**Files Uploaded**: [ ] Yes [ ] No

### Step 2: Backup Current Portal

```bash
# SSH to server
ssh -p2235 subbu@dlt.aurigraph.io

# Backup current portal
cd /var/www/html/aurigraph-portal
cp aurigraph-v11-full-enterprise-portal.html aurigraph-v11-full-enterprise-portal.html.backup.$(date +%Y%m%d)

# Verify backup
ls -lh *.backup.*
```

**Backup Created**: [ ] Yes [ ] No

### Step 3: Update Enterprise Portal HTML

Option A: **Automated Patch (Recommended)**

Create patch file on server:

```bash
# Create patch script
cat > /tmp/patch-portal.sh << 'EOF'
#!/bin/bash
PORTAL="/var/www/html/aurigraph-portal/aurigraph-v11-full-enterprise-portal.html"

# Add integration scripts before </body>
sed -i '/<\/body>/i \
    <!-- V11 Live Data Integration -->\
    <script src="v11-api-client.js"><\/script>\
    <script src="v11-portal-integration.js"><\/script>\
    <script>\
        document.addEventListener("DOMContentLoaded", async () => {\
            initTheme();\
            initCharts();\
            await v11Integration.init();\
        });\
    <\/script>' "$PORTAL"

echo "✅ Portal patched successfully"
EOF

# Make executable
chmod +x /tmp/patch-portal.sh

# Run patch
/tmp/patch-portal.sh
```

Option B: **Manual Edit**

```bash
# Edit portal file
nano /var/www/html/aurigraph-portal/aurigraph-v11-full-enterprise-portal.html

# Find the line with: document.addEventListener('DOMContentLoaded', () => {
# Around line 7262

# REPLACE:
#   document.addEventListener('DOMContentLoaded', () => {
#       initTheme();
#       initCharts();
#       fetchDashboardData();
#       setInterval(fetchDashboardData, 5000);
#   });

# WITH:
#   document.addEventListener('DOMContentLoaded', async () => {
#       initTheme();
#       initCharts();
#       await v11Integration.init();
#   });

# Save and exit (Ctrl+X, Y, Enter)
```

**Portal Updated**: [ ] Yes [ ] No

### Step 4: Update Demo App

```bash
# Navigate to demo app directory
cd /var/www/html/aurigraph-portal/demo-app

# Backup current index.html
cp index.html index.html.backup.$(date +%Y%m%d)

# Edit demo app
nano index.html

# Add before </body>:
# <script src="../v11-api-client.js"></script>
# <script>
#     const v11Client = new V11ApiClient({
#         baseUrl: 'https://dlt.aurigraph.io/api/v11/legacy'
#     });
#
#     setInterval(async () => {
#         try {
#             const stats = await v11Client.getTransactionStats();
#             document.getElementById('systemTPS').textContent =
#                 Math.round(stats.currentThroughputMeasurement || 0).toLocaleString();
#         } catch (error) {
#             console.error('Failed to update metrics:', error);
#         }
#     }, 30000);
# </script>

# Save and exit
```

**Demo App Updated**: [ ] Yes [ ] No

### Step 5: Verify File Permissions

```bash
# Set correct permissions
cd /var/www/html/aurigraph-portal
chmod 644 v11-api-client.js v11-portal-integration.js
chmod 644 aurigraph-v11-full-enterprise-portal.html

# Verify ownership
ls -l v11-*.js *.html

# Should be owned by www-data or similar
# If not:
# sudo chown www-data:www-data v11-*.js *.html
```

**Permissions Set**: [ ] Yes [ ] No

---

## Post-Deployment Testing

### Test 1: Load Portal

```bash
# From your local machine
curl -I https://dlt.aurigraph.io/aurigraph-portal/aurigraph-v11-full-enterprise-portal.html

# Expected: HTTP/1.1 200 OK
```

**Portal Loads**: [ ] Yes [ ] No

### Test 2: Verify Scripts Load

```bash
# Check if integration scripts are accessible
curl -I https://dlt.aurigraph.io/aurigraph-portal/v11-api-client.js
curl -I https://dlt.aurigraph.io/aurigraph-portal/v11-portal-integration.js

# Expected: HTTP/1.1 200 OK for both
```

**Scripts Load**: [ ] Yes [ ] No

### Test 3: Browser Console Verification

1. Open portal in browser: `https://dlt.aurigraph.io/aurigraph-portal/aurigraph-v11-full-enterprise-portal.html`
2. Open Developer Console (F12)
3. Look for these log messages:

```
✅ Expected Console Output:
[V11 API Client] Initializing...
[V11 API Client] Initialized successfully
[V11 API Client] Health check passed (XXms) - Version: 11.0.0
[V11 Integration] ✅ Connected to V11 backend
[V11 Integration] Loading live dashboard data...
[V11 Integration] ✅ Dashboard data loaded
[V11 Integration] Dashboard metrics updated with LIVE data
[V11 Integration] TPS chart updated: <NUMBER> TPS
[V11 Integration] System status updated
[V11 Integration] ✅ Auto-refresh started
```

**Console Logs OK**: [ ] Yes [ ] No

### Test 4: Dashboard Metrics Verification

Verify dashboard shows LIVE data (not random):

| Metric | Old Behavior | New Behavior | Status |
|--------|-------------|--------------|--------|
| TPS | Random changes | Consistent, realistic values | [ ] OK |
| Total Transactions | Static | Increases over time | [ ] OK |
| Block Height | Fixed '1,234,567' | Real height, incrementing | [ ] OK |
| Active Validators | Random | Consistent count | [ ] OK |

### Test 5: Auto-Refresh Verification

1. Note current TPS value
2. Wait 30 seconds
3. Verify TPS value updates
4. Check console for refresh log

**Auto-Refresh Working**: [ ] Yes [ ] No

### Test 6: TPS Chart Verification

1. Observe TPS chart
2. Wait 30 seconds
3. Verify new data point is added
4. Chart should show rolling window of last 24 points

**TPS Chart Updating**: [ ] Yes [ ] No

### Test 7: Performance Test

1. Navigate to Performance Testing page
2. Click "Start Test"
3. Verify test runs against REAL V11 backend
4. Check results match backend performance

**Performance Test Works**: [ ] Yes [ ] No

### Test 8: Error Handling Test

Temporarily stop V11 backend:

```bash
# On server
sudo systemctl stop aurigraph-v11

# Wait 1 minute

# Check browser - should show warning banner:
# "V11 Backend Unavailable - Using fallback demo data"
```

**Warning Banner Appears**: [ ] Yes [ ] No

Restart V11 backend:

```bash
sudo systemctl start aurigraph-v11

# Click "Retry" button in warning banner
# Banner should disappear
# Dashboard should update with live data
```

**Recovery Works**: [ ] Yes [ ] No

### Test 9: Demo App Verification

1. Open Demo App: `https://dlt.aurigraph.io/aurigraph-portal/demo-app/index.html`
2. Check console for V11 client initialization
3. Verify TPS updates every 30 seconds
4. Check event log shows "Live data: <TPS> TPS"

**Demo App Works**: [ ] Yes [ ] No

---

## Performance Monitoring

### Monitor for 15 Minutes After Deployment

Check every 5 minutes for first 15 minutes:

**Minute 5**:
- [ ] Dashboard loading properly
- [ ] TPS showing realistic values
- [ ] No console errors

**Minute 10**:
- [ ] Auto-refresh occurred (check console)
- [ ] TPS chart has new data points
- [ ] Metrics updated

**Minute 15**:
- [ ] Multiple refreshes completed
- [ ] No memory leaks (check browser Task Manager)
- [ ] API success rate >95%

### Check API Metrics

In browser console:
```javascript
// Get API client metrics
v11Integration.getMetrics()

// Verify:
// - isOnline: true
// - successRate: >95%
// - averageLatency: <500ms
// - totalRequests: >10
```

**Metrics Healthy**: [ ] Yes [ ] No

---

## Rollback Plan (If Needed)

If deployment fails, follow these steps:

### Step 1: Restore Portal Backup

```bash
# SSH to server
ssh -p2235 subbu@dlt.aurigraph.io

cd /var/www/html/aurigraph-portal

# Find backup file
ls -lh *.backup.*

# Restore backup
cp aurigraph-v11-full-enterprise-portal.html.backup.YYYYMMDD aurigraph-v11-full-enterprise-portal.html

# Verify restoration
curl -I https://dlt.aurigraph.io/aurigraph-portal/aurigraph-v11-full-enterprise-portal.html
```

### Step 2: Remove Integration Scripts

```bash
# Remove V11 integration scripts
rm v11-api-client.js v11-portal-integration.js

# Verify removal
ls -l v11-*.js
# Should return: No such file or directory
```

### Step 3: Clear Browser Cache

Instruct users to clear cache:
- Chrome: Ctrl+Shift+Delete
- Firefox: Ctrl+Shift+Delete
- Safari: Cmd+Option+E

### Step 4: Verify Rollback

1. Load portal
2. Verify old dashboard with mock data
3. Confirm no console errors

**Rollback Status**: [ ] Complete [ ] Issues

---

## Documentation & Handoff

### Files to Share with Team

- [ ] V11-API-INTEGRATION-REPORT.md
- [ ] QUICK-INTEGRATION-GUIDE.md
- [ ] V11-MISSING-ENDPOINTS.md
- [ ] V11-INTEGRATION-SUMMARY.md
- [ ] DEPLOYMENT-CHECKLIST.md (this file)

### Training Points

Share with team:
1. How to check API health: `v11Integration.getMetrics()`
2. How to manually refresh: `v11Integration.loadDashboard()`
3. How to check connection: Look for `[V11 API Client]` logs in console
4. What to do if "Backend Unavailable" warning appears

### Monitoring Dashboard

Set up monitoring for:
- V11 service uptime
- API response times
- Error rates
- Dashboard load times

---

## Sign-Off

### Deployment Team

**Deployed By**: ______________________
**Date**: ______________________
**Time**: ______________________

### Verification

**Tested By**: ______________________
**Date**: ______________________
**All Tests Pass**: [ ] Yes [ ] No

### Approval

**Approved By**: ______________________
**Date**: ______________________
**Production Release**: [ ] Approved [ ] Pending

---

## Post-Deployment Notes

**Issues Encountered**:
_____________________________________________
_____________________________________________
_____________________________________________

**Resolutions**:
_____________________________________________
_____________________________________________
_____________________________________________

**Additional Notes**:
_____________________________________________
_____________________________________________
_____________________________________________

---

## Next Steps After Deployment

### Week 1
- [ ] Monitor dashboard daily
- [ ] Check API success rates
- [ ] Gather user feedback
- [ ] Document any issues

### Week 2-4
- [ ] Implement missing endpoints (AV11-177, AV11-178)
- [ ] Deploy new endpoints
- [ ] Update integration to use new endpoints
- [ ] Remove generated block data workaround

### Month 2
- [ ] Implement validator details (AV11-179)
- [ ] Implement security metrics (AV11-180)
- [ ] Add WebSocket support
- [ ] Implement historical data storage

---

**Checklist Version**: 1.0
**Last Updated**: 2025-10-04
**Contact**: Development Team
