# Real-Time Analytics Dashboard - Quick Start Guide

## 🚀 Quick Start (5 Minutes)

### 1. Import the Component
```typescript
import { RealTimeAnalytics } from './components/comprehensive'
```

### 2. Add to Your Route
```typescript
<Route path="/analytics" element={<RealTimeAnalytics />} />
```

### 3. Start Development Server
```bash
cd enterprise-portal
npm run dev
```

### 4. View Dashboard
Open browser: http://localhost:3000/analytics

---

## 📁 File Locations

```
enterprise-portal/src/
├── components/
│   └── comprehensive/
│       ├── RealTimeAnalytics.tsx    ← Main component (847 lines)
│       └── index.ts                 ← Exports
└── hooks/
    ├── useMetricsWebSocket.ts       ← Existing hook
    └── useEnhancedWebSocket.ts      ← New enhanced hook
```

---

## 🔌 API Endpoints Needed

### Dashboard Data
```
GET /api/v11/analytics/dashboard
```

**Returns**: KPIs, TPS history, latency data, block times, nodes, anomalies

### WebSocket
```
WS /ws/metrics
```

**Sends**: Real-time metric updates every 1 second

---

## 📊 Component Structure

```
RealTimeAnalytics
├── 6 KPI Cards (Current TPS, Avg TPS, Peak TPS, Avg Latency, Active Tx, Pending Tx)
├── TPS Line Chart (AreaChart with gradient)
├── Latency Distribution (p50/p95/p99 stacked areas)
├── Block Time Bar Chart (last 20 blocks)
├── Node Grid (4x4 = 16 nodes with CPU/Memory/Network)
└── Anomaly Panel (last 10 alerts)
```

---

## 🎨 Customization

### Change Number of Nodes
Edit `initializeMockData()`:
```typescript
for (let i = 1; i <= 32; i++) {  // Change 16 to 32
  mockNodes.push({ ... })
}
```

### Change Chart Colors
Edit chart definitions:
```typescript
<Area stroke="#8884d8" fill="#82ca9d" />  // Change colors
```

### Change Update Frequency
Currently hardcoded to 60 seconds history. Adjust:
```typescript
setTpsHistory(prev => [...prev].slice(-120))  // 2 minutes
```

---

## 🧪 Testing with Mock Data

Component automatically uses mock data if API fails. To force mock mode:
```typescript
// Comment out the API call in useEffect:
// const response = await axios.get(...)
initializeMockData()  // Add this line
```

---

## 🐛 Troubleshooting

### WebSocket Not Connecting
1. Check backend is running on port 9003
2. Verify WebSocket endpoint: `ws://localhost:9003/ws/metrics`
3. Check browser console for connection errors

### Charts Not Displaying
1. Ensure `recharts` is installed: `npm install recharts`
2. Check data format matches interfaces
3. Verify responsive container has parent with defined height

### TypeScript Errors
Most warnings are from library definitions and can be ignored. To skip:
```bash
npm run build  # Vite handles this correctly
```

---

## 📚 Dependencies

All required packages are already installed in package.json:
- react (^18.2.0)
- @mui/material (^5.14.20)
- @mui/icons-material (^5.14.19)
- recharts (^2.10.3)
- axios (^1.6.2)

---

## 🔗 Related Files

- Implementation Report: `SPRINT-16-REALTIME-ANALYTICS-IMPLEMENTATION.md`
- Main App: `src/App.tsx`
- API Service: `src/services/api.ts`
- WebSocket Hook: `src/hooks/useMetricsWebSocket.ts`

---

## ✅ Success Checklist

Before going to production:
- [ ] Backend implements `/api/v11/analytics/dashboard`
- [ ] Backend implements `/ws/metrics` WebSocket
- [ ] WebSocket sends updates every 1 second
- [ ] CORS configured for WebSocket
- [ ] SSL/TLS enabled for production (wss://)
- [ ] Component tested on mobile/tablet/desktop
- [ ] No console errors in production build

---

## 💡 Tips

1. **Development**: Use mock data fallback for faster iteration
2. **Testing**: Open browser DevTools → Network → WS to monitor WebSocket
3. **Performance**: Component keeps only last 60 data points (configurable)
4. **Responsive**: Test on mobile by resizing browser window

---

## 📞 Support

- JIRA: AV11-485
- Component: `RealTimeAnalytics.tsx`
- Documentation: See implementation report for full details
