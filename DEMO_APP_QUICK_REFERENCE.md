# High-Throughput Demo App - Quick Reference Card

## 🚀 Quick Start (2 minutes)

```
1. Go to: https://dlt.aurigraph.io
2. Click: Blockchain → High-Throughput Demo
3. Click: "New Channel"
4. Keep defaults (4 validators, 6 business, 12 slim)
5. Click: "Create Channel"
6. Click: "Start Demo"
7. Watch real-time metrics update
```

---

## 📊 Dashboard Overview

### KPI Cards (Top Row)
- **Current TPS**: Live throughput
- **Peak TPS**: Max reached this session
- **Avg Latency**: Transaction confirmation time
- **Total Transactions**: Cumulative count

### Tabs

**Performance**: Real-time charts + node metrics table

**Configuration**: Node counts, TPS target, AI/Quantum toggles

**AI Optimization**: Consensus improvements, throughput gains

**Security**: Quantum-safe cryptography details

---

## ⚙️ Configuration Quick Tips

| Setting | Dev | Staging | Production |
|---------|-----|---------|------------|
| Validators | 2 | 4 | 8 |
| Business | 3 | 6 | 12 |
| Slim | 6 | 12 | 24 |
| Target TPS | 300K | 800K | 1.5M |
| AI | No | Yes | Yes |
| Quantum | No | Yes | Yes |

---

## 🎯 Common Test Scenarios

### Light Testing (Development)
```
New Channel → Keep defaults → TPS: 300K → 5 min
Expected: 95% peak TPS, <100ms latency
```

### Performance Baseline
```
New Channel → 4V, 6B, 12S → TPS: 1M → 10 min
Expected: 1M peak TPS, 45-50ms latency, 99.8% success
```

### High-Throughput Stress
```
New Channel → 8V, 12B, 24S → TPS: 1.5M → 15 min
Enable AI & Quantum → Monitor node health
Expected: 1.3M+ TPS, <50ms latency
```

### Multi-Channel Federation
```
Create 3 channels, each 4V, 6B, 12S
Simulate cross-chain messaging
Measure inter-channel latency
```

---

## 📈 Reading the Metrics

### TPS Metrics
- **Current**: This exact moment
- **Peak**: Best performance during run
- **Target**: What you set for this test
- **Success Rate**: % transactions that completed

**Good Values**:
- Within 10% of target TPS
- Consistent (not dropping)
- Peak > Average by <20%

### Latency Metrics
- **Average**: Mean time to finality
- **P50/P95/P99**: Percentile latencies
- **Max**: Worst-case latency

**Good Values**:
- <50ms with AI optimization
- <75ms without optimization
- Stable (not increasing over time)

### Resource Metrics
- **CPU**: % of node CPU used
- **Memory**: % of node memory used
- **Node Health**: Healthy/Degraded/Offline

**Good Values**:
- CPU <70%
- Memory <80%
- 100% Healthy nodes

---

## 🔧 Troubleshooting Checklist

**Demo won't start?**
- ✅ Channel selected in dropdown?
- ✅ Backend running? (`curl localhost:9003/api/v11/health`)
- ✅ Check browser console for errors

**Metrics not updating?**
- ✅ Is demo actually running (green status)?
- ✅ Network tab shows API requests?
- ✅ Try refreshing page

**Low TPS?**
- ✅ Reduce target TPS
- ✅ Enable AI optimization
- ✅ Add more validator nodes
- ✅ Check node CPU/memory

**Node showing red/degraded?**
- ✅ Reduce total node count
- ✅ Lower target TPS
- ✅ Check available system resources
- ✅ Restart demo

---

## 🔑 Key Keyboard Shortcuts

| Action | Windows/Linux | Mac |
|--------|---------------|-----|
| Create Channel | Ctrl+N | Cmd+N |
| Export Metrics | Ctrl+E | Cmd+E |
| Refresh Data | F5 or Ctrl+R | Cmd+R |
| Open Browser Dev Tools | F12 | Cmd+Option+I |

---

## 📞 API Endpoints

```
Create Channel:    POST /api/v11/demo/channels/create
List Channels:     GET /api/v11/demo/channels
Start Demo:        POST /api/v11/demo/channels/{id}/start
Stop Demo:         POST /api/v11/demo/channels/{id}/stop
Get Metrics:       GET /api/v11/demo/channels/{id}/metrics
Get Node Metrics:  GET /api/v11/demo/channels/{id}/nodes/metrics
Get Report:        GET /api/v11/demo/channels/{id}/report
Health Check:      GET /api/v11/demo/health
```

---

## 💾 Data Export

**After running a demo:**

1. Click "Export Metrics" (bottom right)
2. Choose format:
   - **JSON**: Full data with timestamps
   - **CSV**: Spreadsheet-friendly format
   - **PDF**: Formatted report (TBD)

**File naming**: `demo-report-{channelId}-{timestamp}.{ext}`

---

## 🎓 Performance Theory

### HyperRAFT++ Consensus
- Parallel log replication
- AI-driven leader selection
- Byzantine fault tolerance (f < n/3)
- ~45ms latency, 1M+ TPS

### AI Optimization Benefits
- **TPS**: +18.2% with transaction ordering
- **Latency**: -23.5% with consensus optimization
- **CPU**: -15.3% resource usage
- **Energy**: -12.5% power consumption

### Post-Quantum Cryptography
- **CRYSTALS-Kyber**: Key encapsulation
- **CRYSTALS-Dilithium**: Digital signatures
- **NIST Level 5**: Quantum-resistant
- Minimal performance overhead

---

## 📋 Session Checklist

Before starting a demo:
- [ ] Browser updated and cached cleared
- [ ] Backend service running
- [ ] Network connectivity verified
- [ ] Target TPS defined
- [ ] Test duration estimated
- [ ] Metrics export location selected

After running a demo:
- [ ] Metrics exported
- [ ] Results reviewed
- [ ] Performance compared to baseline
- [ ] Logs archived
- [ ] Channel deleted (if temporary)

---

## 🔐 Security Notes

- Demo uses internal portal access token
- API Key: `sk_test_dev_key_12345` (dev only)
- Authorization: `Bearer internal-portal-access`
- HTTPS required for production
- Always use TLS 1.3 with PQC

---

## 🏆 Performance Targets

### Conservative (Safe)
- TPS: 500K-800K
- Nodes: 4V, 6B, 12S
- Latency: <75ms
- Success: >99.5%

### Standard (Recommended)
- TPS: 1M-1.2M
- Nodes: 4V, 6B, 12S + AI
- Latency: <50ms
- Success: >99.8%

### Aggressive (Stress Test)
- TPS: 1.5M-2M
- Nodes: 8V, 12B, 24S + AI + Quantum
- Latency: <40ms
- Success: >99.9%

---

## 📚 Further Reading

- **Full Guide**: `DEMO_APP_GUIDE.md`
- **Architecture**: `ARCHITECTURE.md`
- **V11 Development**: `CLAUDE.md`
- **API Docs**: Check `/api/v11/demo/health` endpoint

---

## 🚨 Emergency Procedures

**Portal unresponsive?**
```bash
ssh subbu@dlt.aurigraph.io
sudo systemctl restart nginx
```

**Backend API down?**
```bash
ssh subbu@dlt.aurigraph.io
ps aux | grep java
sudo systemctl restart aurigraph-v11
```

**Database connection lost?**
```bash
ssh subbu@dlt.aurigraph.io
curl http://localhost:9003/api/v11/health
```

**Clear browser cache:**
```
Chrome: Ctrl+Shift+Delete
Firefox: Ctrl+Shift+Delete
Safari: Cmd+Option+E
```

---

## 📞 Support

- **Email**: support@aurigraph.io
- **Docs**: https://dlt.aurigraph.io
- **GitHub**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **JIRA**: https://aurigraphdlt.atlassian.net/jira/software/projects/AV11

---

**Version**: 1.0.0 | **Updated**: 2025-11-13 | **Status**: ✅ Live
