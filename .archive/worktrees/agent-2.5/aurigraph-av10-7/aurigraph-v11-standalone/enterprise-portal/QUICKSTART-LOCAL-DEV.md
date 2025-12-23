# Enterprise Portal - Quick Start (Local Development)

## 🚀 Start Development in 3 Steps

### 1️⃣ Start Backend (Terminal 1)
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone
./mvnw quarkus:dev
```
**Wait for**: `Listening on: http://localhost:9003`

### 2️⃣ Start Frontend (Terminal 2)
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal
npm run dev
```
**Wait for**: `Local: http://localhost:3000/`

### 3️⃣ Open Browser
```
http://localhost:3000
```

## ✅ Verify It's Working

Open browser DevTools (F12) → Network tab:
- API calls should go to `http://localhost:9003/api/v11/*`
- Status: `200 OK` (not `502 Bad Gateway`)

## 🔧 Quick Test
```bash
# Test backend is responding
curl http://localhost:9003/api/v11/health
# Should return: {"status":"UP",...}

# Run verification script
./verify-local-config.sh
# Should show all green checkmarks ✓
```

## 📖 More Information
- **Full Setup Guide**: `LOCAL-DEVELOPMENT-CONFIG.md`
- **Changes Summary**: `CONFIGURATION-CHANGES-SUMMARY.md`
- **Troubleshooting**: See `LOCAL-DEVELOPMENT-CONFIG.md`

---
**Status**: ✅ Configured for local backend (http://localhost:9003)
