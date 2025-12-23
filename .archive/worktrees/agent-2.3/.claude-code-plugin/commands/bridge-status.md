# /bridge-status

Check cross-chain bridge health across all supported chains and identify issues.

## Usage

```bash
/bridge-status [options]
```

## Options

- `--chain <name>`: Check specific chain only (`ethereum`, `bsc`, `polygon`, `avalanche`)
- `--detailed`: Show detailed transaction history
- `--stuck-only`: Show only stuck transactions
- `--fix`: Attempt to fix identified issues automatically

## Examples

```bash
# Check all bridges
/bridge-status

# Check Ethereum bridge only with details
/bridge-status --chain ethereum --detailed

# Find and attempt to fix stuck transactions
/bridge-status --stuck-only --fix
```

## Implementation

### 1. Query Bridge API

```bash
# Health endpoint
curl http://localhost:9003/api/v11/bridge/health

# Stats endpoint
curl http://localhost:9003/api/v11/bridge/stats

# History with stuck filter
curl "http://localhost:9003/api/v11/bridge/history?status=pending&minDuration=1800"
```

### 2. Analyze Bridge Health

```javascript
async function analyzeBridgeHealth() {
  const chains = ['ethereum', 'bsc', 'polygon', 'avalanche'];
  const report = {
    timestamp: new Date().toISOString(),
    overall: 'healthy',
    chains: {},
    issues: [],
    recommendations: []
  };

  for (const chain of chains) {
    const chainHealth = await checkChainBridge(chain);
    report.chains[chain] = chainHealth;

    if (chainHealth.status !== 'healthy') {
      report.overall = 'degraded';
      report.issues.push({
        chain,
        type: chainHealth.issueType,
        severity: chainHealth.severity,
        message: chainHealth.message
      });
    }
  }

  return report;
}
```

### 3. Detect Stuck Transactions

```javascript
async function findStuckTransactions() {
  // Transactions pending > 30 minutes
  const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);

  const stuckTxs = await fetch('/api/v11/bridge/history?status=pending,processing')
    .then(r => r.json())
    .then(data => data.transactions.filter(tx =>
      new Date(tx.timestamps.initiated) < thirtyMinutesAgo
    ));

  return stuckTxs.map(tx => ({
    id: tx.transactionId,
    sourceChain: tx.sourceChain,
    targetChain: tx.targetChain,
    amount: tx.amountUsd,
    duration: Math.floor((Date.now() - new Date(tx.timestamps.initiated)) / 60000),
    lastStatus: tx.status,
    reason: diagnoseTxStuck(tx)
  }));
}

function diagnoseTxStuck(tx) {
  if (!tx.sourceTransaction) return 'Source transaction not confirmed';
  if (tx.confirmations.sourceConfirmations < 12) return 'Waiting for confirmations';
  if (!tx.timestamps.bridgeStarted) return 'Bridge processing not initiated';
  if (!tx.targetTransaction && tx.timestamps.bridgeStarted) return 'Target chain issue';
  return 'Unknown - manual investigation required';
}
```

### 4. Check Failure Rates

```javascript
async function calculateFailureRates() {
  const stats = await fetch('/api/v11/bridge/stats').then(r => r.json());

  const rates = {
    overall: {
      total: stats.totalTransactions,
      failed: stats.failedTransactions,
      rate: (stats.failedTransactions / stats.totalTransactions * 100).toFixed(2)
    },
    byChain: {}
  };

  // Get per-chain stats
  const chains = ['ethereum', 'bsc', 'polygon', 'avalanche'];
  for (const chain of chains) {
    const chainStats = await fetch(`/api/v11/bridge/stats?chain=${chain}`)
      .then(r => r.json());

    rates.byChain[chain] = {
      total: chainStats.totalTransactions,
      failed: chainStats.failedTransactions,
      rate: (chainStats.failedTransactions / chainStats.totalTransactions * 100).toFixed(2),
      status: chainStats.failedTransactions / chainStats.totalTransactions > 0.1 ? '⚠️  HIGH' : '✅ OK'
    };
  }

  return rates;
}
```

### 5. Check Error Messages

```javascript
async function analyzeErrorMessages() {
  const errors = await fetch('/api/v11/bridge/history?status=failed')
    .then(r => r.json())
    .then(data => data.transactions.map(tx => tx.error));

  const errorCounts = {};
  errors.forEach(error => {
    const code = error.errorCode;
    errorCounts[code] = (errorCounts[code] || 0) + 1;
  });

  return Object.entries(errorCounts)
    .map(([code, count]) => ({ code, count, percentage: (count / errors.length * 100).toFixed(1) }))
    .sort((a, b) => b.count - a.count);
}
```

### 6. Generate Health Report

```markdown
# Bridge Health Report
Generated: 2025-10-16 23:15:00

## 📊 Overall Status: ✅ HEALTHY

### Chain Status
| Chain | Status | Tx/24h | Failure Rate | Avg Time | Stuck |
|-------|--------|--------|--------------|----------|-------|
| Ethereum | ✅ Healthy | 342 | 2.3% | 42s | 0 |
| BSC | ✅ Healthy | 456 | 1.8% | 38s | 0 |
| Polygon | ⚠️  Degraded | 523 | 15.2% | 45s | 1 |
| Avalanche | ✅ Healthy | 289 | 3.1% | 41s | 0 |

### 🚨 Issues Detected

#### 1. High Failure Rate on Polygon
- **Severity**: MEDIUM
- **Rate**: 15.2% (79 failed / 523 total)
- **Root Cause**: Transfer limit exceeded (85% of failures)
- **Recommendation**: Users need better error messages (AV11-375 fixes pending deployment)

#### 2. Stuck Transaction
- **ID**: btx-a3f8e9d2
- **Route**: Ethereum → Polygon
- **Amount**: $125,000
- **Duration**: 45 minutes
- **Reason**: Waiting for target chain confirmation
- **Action**: Monitor for 15 more minutes, then manual investigation

### 📈 Error Breakdown
| Error Code | Count | % |
|------------|-------|---|
| TRANSFER_LIMIT_EXCEEDED | 67 | 85.0% |
| INSUFFICIENT_LIQUIDITY | 8 | 10.1% |
| GAS_PRICE_TOO_HIGH | 3 | 3.8% |
| VALIDATOR_TIMEOUT | 1 | 1.3% |

### 🔧 Recommendations

1. **Deploy AV11-375 fixes** to improve error messages for transfer limits
2. **Monitor btx-a3f8e9d2** for next 15 minutes
3. **Review Polygon validator** connectivity
4. **Consider increasing** Polygon transfer limit from $250K to $500K

### 💡 Next Steps
- [ ] Check bridge logs for Polygon validator issues
- [ ] Review liquidity pools for all chains
- [ ] Update monitoring alerts for 10% failure threshold
- [ ] Schedule deployment of error message fixes

---
🕐 Next check recommended in: 15 minutes
```

### 7. Automatic Fix Attempts

If `--fix` flag is provided:

```javascript
async function attemptAutoFix(issue) {
  switch (issue.type) {
    case 'STUCK_TRANSACTION':
      return await retryStuckTransaction(issue.transactionId);

    case 'HIGH_FAILURE_RATE':
      return await investigateFailures(issue.chain);

    case 'VALIDATOR_OFFLINE':
      return await restartValidator(issue.validatorId);

    default:
      return { success: false, message: 'No automatic fix available' };
  }
}

async function retryStuckTransaction(txId) {
  // Check if safe to retry
  const tx = await getTransaction(txId);

  if (tx.confirmations.sourceConfirmations >= 12) {
    // Manually trigger target chain processing
    await fetch(`/api/v11/bridge/retry/${txId}`, { method: 'POST' });
    return { success: true, message: 'Retry initiated' };
  }

  return { success: false, message: 'Not safe to retry - awaiting confirmations' };
}
```

### 8. Alert Thresholds

Monitor and alert on:

```javascript
const THRESHOLDS = {
  failureRate: {
    warning: 5,  // 5% failure rate
    critical: 10  // 10% failure rate
  },
  stuckDuration: {
    warning: 30,  // 30 minutes pending
    critical: 60   // 1 hour pending
  },
  volume: {
    drop: 50  // 50% volume drop from average
  }
};
```

### 9. Historical Comparison

Compare current stats with historical averages:

```javascript
async function compareWithHistory() {
  const current = await getBridgeStats();
  const historical = await getHistoricalAverage(7); // 7-day average

  return {
    failureRate: {
      current: current.failureRate,
      historical: historical.failureRate,
      change: ((current.failureRate - historical.failureRate) / historical.failureRate * 100).toFixed(1),
      trend: current.failureRate > historical.failureRate ? '📈 UP' : '📉 DOWN'
    },
    volume: {
      current: current.volume24h,
      historical: historical.avgVolume,
      change: ((current.volume24h - historical.avgVolume) / historical.avgVolume * 100).toFixed(1)
    }
  };
}
```

## Success Criteria

- ✅ All chains responding
- ✅ Failure rate < 5% per chain
- ✅ No transactions stuck > 30 minutes
- ✅ All validators online
- ✅ Liquidity pools adequate
- ✅ Error messages accurate

## Monitoring Integration

Can be scheduled to run automatically:

```bash
# Add to crontab - check every 15 minutes
*/15 * * * * /path/to/claude-code /bridge-status >> /var/log/bridge-health.log

# Alert on issues
*/15 * * * * /path/to/claude-code /bridge-status | grep "⚠️" && send-alert
```

## Notes

- Health checks are non-intrusive (read-only)
- Safe to run frequently (every 5-15 minutes)
- Automatic fixes require confirmation in production
- Maintains health history for trend analysis
- Integrates with monitoring dashboards
