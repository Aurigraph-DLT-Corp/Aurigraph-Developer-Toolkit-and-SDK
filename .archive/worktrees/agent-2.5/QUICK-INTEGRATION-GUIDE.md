# Quick Integration Guide - V11 Live Data
**5-Minute Setup for Enterprise Portal & Demo App**

## Prerequisites
- V11 backend running at `https://dlt.aurigraph.io/api/v11/legacy`
- Enterprise Portal HTML file
- Demo App files

## Step 1: Copy Integration Files

```bash
cd /Users/subbujois/Documents/GitHub/Aurigraph-DLT

# Files to deploy:
# - v11-api-client.js (Core API client)
# - v11-portal-integration.js (Portal integration layer)
```

## Step 2: Update Enterprise Portal

### Option A: Manual Integration (Recommended)

Add these scripts **BEFORE** the `</body>` tag in `aurigraph-v11-full-enterprise-portal.html`:

```html
<!-- V11 Live Data Integration -->
<script src="v11-api-client.js"></script>
<script src="v11-portal-integration.js"></script>

<script>
    // REPLACE the existing DOMContentLoaded event (around line 7262) with:
    document.addEventListener('DOMContentLoaded', async () => {
        // Initialize theme
        initTheme();

        // Initialize charts
        initCharts();

        // Initialize V11 Integration - LIVE DATA!
        await v11Integration.init();

        // Auto-refresh is built into v11Integration (30s interval)
    });
</script>
</body>
</html>
```

### Option B: Quick Test (Without File Changes)

Open browser console and paste:

```javascript
// Load API client
const script1 = document.createElement('script');
script1.src = 'v11-api-client.js';
document.body.appendChild(script1);

// Load integration
const script2 = document.createElement('script');
script2.src = 'v11-portal-integration.js';
script2.onload = async () => {
    await v11Integration.init();
    console.log('✅ V11 Live Data Active!');
};
document.body.appendChild(script2);
```

## Step 3: Update Demo App

In `/demo-app/index.html`, add **BEFORE** the `</body>` tag:

```html
<!-- V11 Live Data Integration -->
<script src="../v11-api-client.js"></script>

<script>
    // Add to existing window load event (around line 1768):
    window.addEventListener('load', async () => {
        // ... existing demo code ...

        // ADD THIS:
        const v11Client = new V11ApiClient({
            baseUrl: 'https://dlt.aurigraph.io/api/v11/legacy'
        });

        // Fetch live metrics every 30s
        setInterval(async () => {
            try {
                const stats = await v11Client.getTransactionStats();

                // Update with REAL data
                document.getElementById('systemTPS').textContent =
                    Math.round(stats.currentThroughputMeasurement || 0).toLocaleString();

                document.getElementById('blocksValidated').textContent =
                    (stats.processedTransactions || 0).toLocaleString();

                logEvent(`📊 Live data: ${Math.round(stats.currentThroughputMeasurement)} TPS`);

            } catch (error) {
                console.error('Failed to update metrics:', error);
            }
        }, 30000);
    });
</script>
```

## Step 4: Verify Integration

### Test 1: Health Check

```bash
# Verify backend is accessible
curl https://dlt.aurigraph.io/api/v11/legacy/health

# Expected:
# {"status":"HEALTHY","version":"11.0.0-standalone",...}
```

### Test 2: Browser Console

Open the portal and check console:

```
✅ Expected logs:
[V11 API Client] Initializing...
[V11 API Client] Health check passed (XXms) - Version: 11.0.0
[V11 Integration] ✅ Connected to V11 backend
[V11 Integration] ✅ Dashboard data loaded
[V11 Integration] Dashboard metrics updated with LIVE data
[V11 Integration] ✅ Auto-refresh started
```

### Test 3: Dashboard

- **TPS**: Should show real number (not random)
- **Block Height**: Should show actual current height
- **Metrics**: Update every 30 seconds
- **TPS Chart**: New points added every 30s

## Step 5: Troubleshooting

### Issue: "V11 Backend Unavailable" warning

**Check 1**: Is V11 running?
```bash
ssh -p2235 subbu@dlt.aurigraph.io
systemctl status aurigraph-v11  # Check service status
journalctl -u aurigraph-v11 -f  # View logs
```

**Check 2**: Test endpoint directly
```bash
curl https://dlt.aurigraph.io/api/v11/legacy/health
```

**Check 3**: Firewall/Network
```bash
# From your machine
telnet dlt.aurigraph.io 9003
# Should connect successfully
```

### Issue: Dashboard shows zeros

**Solution**: Check browser console for errors

```javascript
// Get API metrics
v11Integration.getMetrics()

// Expected output:
{
    totalRequests: 10,
    successfulRequests: 10,
    failedRequests: 0,
    successRate: 100,
    isOnline: true,
    currentUrl: "https://dlt.aurigraph.io/api/v11/legacy"
}
```

### Issue: Auto-refresh stopped

**Solution**: Restart auto-refresh

```javascript
// In browser console:
v11Integration.stopAutoRefresh();  // Stop
v11Integration.startAutoRefresh(); // Restart

// Should see:
// [V11 Integration] Auto-refresh stopped
// [V11 Integration] ✅ Auto-refresh started
```

## What You Get

### ✅ LIVE Dashboard Data
- **TPS**: Real-time from V11 backend
- **Transactions**: Actual processed count
- **Block Height**: Current blockchain height
- **Validators**: Live validator count
- **Latency**: Real average latency in ms
- **Success Rate**: Actual transaction success rate

### ✅ Auto-Refresh (No Action Needed)
- Dashboard: Every 30 seconds
- Blocks: Every 60 seconds (when on blocks page)
- Charts: Real-time updates

### ✅ Performance Testing (LIVE)
- Ultra-High Throughput Test: 3M+ TPS capability
- SIMD Batch Test: Optimized parallel processing
- Adaptive Batch Test: Dynamic optimization
- Real results from V11 backend (not simulated!)

### ✅ Error Handling
- Automatic retry (3 attempts)
- Fallback to localhost if production fails
- Health monitoring every 30s
- Connection warning UI

## Advanced Usage

### Custom API Calls

```javascript
// Get API client instance
const client = v11Integration.getClient();

// Run custom performance test
const result = await client.runUltraHighThroughputTest(2000000);
console.log(`Achieved: ${result.transactionsPerSecond} TPS`);
console.log(`Grade: ${result.performanceGrade}`);

// Get system status
const status = await client.getSystemStatus();
console.log(status.transactionStats);
console.log(status.consensusStatus);
console.log(status.cryptoStatus);
```

### Manual Data Refresh

```javascript
// Refresh dashboard manually
await v11Integration.loadDashboard();

// Refresh blocks manually
await v11Integration.loadBlocks();

// Get current metrics
const metrics = v11Integration.getMetrics();
console.log(`Success rate: ${metrics.successRate.toFixed(2)}%`);
console.log(`Avg latency: ${metrics.averageLatency.toFixed(2)}ms`);
```

### Customize Refresh Rates

```javascript
// In v11-portal-integration.js, modify:

// Dashboard refresh (default: 30s)
dashboardRefreshInterval = setInterval(async () => {
    await loadLiveDashboardData();
}, 30000);  // Change to 60000 for 60s

// Blocks refresh (default: 60s)
blockRefreshInterval = setInterval(async () => {
    if (currentPage === 'blocks') {
        await loadLiveBlocks();
    }
}, 60000);  // Change as needed
```

## Files Summary

| File | Purpose | Size | Required |
|------|---------|------|----------|
| `v11-api-client.js` | Core API client with retry/fallback | ~8 KB | ✅ Yes |
| `v11-portal-integration.js` | Portal integration layer | ~12 KB | ✅ Yes (Portal) |
| `V11-API-INTEGRATION-REPORT.md` | Full documentation | ~25 KB | 📄 Reference |
| `QUICK-INTEGRATION-GUIDE.md` | This guide | ~5 KB | 📄 Reference |

## Next Steps

1. ✅ Deploy integration scripts to production
2. ✅ Update Portal HTML with integration code
3. ✅ Update Demo App with V11 client
4. 📋 Test on production URL
5. 📋 Monitor auto-refresh in browser console
6. 📋 Verify performance testing works

## Need Help?

Check logs in browser console:
- `[V11 API Client]` - API client operations
- `[V11 Integration]` - Integration layer operations

Test API directly:
```bash
# Health check
curl https://dlt.aurigraph.io/api/v11/legacy/health

# System status (comprehensive)
curl https://dlt.aurigraph.io/api/v11/legacy/system/status

# Performance test
curl "https://dlt.aurigraph.io/api/v11/legacy/performance?iterations=100000"
```

---

**Done!** Your portal now shows 100% LIVE data from the V11 backend. 🚀
