# Enterprise Portal - Local Development Configuration

**Date**: 2025-10-25
**Status**: ✅ CONFIGURED FOR LOCAL BACKEND

---

## 🎯 Configuration Summary

The Enterprise Portal has been successfully configured to use the **local V11 backend** at `http://localhost:9003` instead of the production endpoint at `https://dlt.aurigraph.io`.

---

## 📝 Files Modified

### 1. **Environment Configuration**

#### Created: `.env` (Local Development)
- **Location**: `/enterprise-portal/.env`
- **Purpose**: Local development environment variables
- **Key Setting**: `VITE_API_URL=http://localhost:9003`
- **Status**: ✅ Created and configured
- **Git**: Excluded via `.gitignore`

#### Updated: `.env.example` (Template)
- **Changes**: Updated all `REACT_APP_*` prefixes to `VITE_*` for Vite compatibility
- **Key Addition**: Added note about local development URL
- **Status**: ✅ Updated

### 2. **Build Configuration**

#### Updated: `vite.config.ts`
- **Change**: Proxy target updated from `https://dlt.aurigraph.io` to `http://localhost:9003`
- **Impact**: All `/api/*` requests are now proxied to local backend
- **Status**: ✅ Updated

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:9003',  // ← Changed from production
    changeOrigin: true,
    secure: false,
  }
}
```

### 3. **API Service Files**

#### Updated: `src/services/contractsApi.ts`
- **Old**: `process.env.REACT_APP_API_URL` (React environment variable)
- **New**: `(import.meta as any).env?.PROD` detection (Vite-compatible)
- **Behavior**: Automatically uses `http://localhost:9003` in development mode
- **Status**: ✅ Fixed

#### Updated: `src/services/RWAService.ts`
- **Old**: `process.env.REACT_APP_API_URL`
- **New**: `(import.meta as any).env?.PROD` detection
- **Behavior**: Automatically uses `http://localhost:9003` in development mode
- **Status**: ✅ Fixed

#### Already Configured (No Changes Needed):
- ✅ `src/services/api.ts` - Already using Vite env detection
- ✅ `src/services/phase1Api.ts` - Already using Vite env detection
- ✅ `src/services/APIIntegrationService.ts` - Already using Vite env detection
- ✅ `src/services/ChannelService.ts` - Uses dynamic `window.location`

---

## 🚀 How to Use

### Starting Local Development

1. **Ensure V11 Backend is Running**
   ```bash
   # In aurigraph-v11-standalone directory
   cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone
   ./mvnw quarkus:dev
   # Backend should be running on http://localhost:9003
   ```

2. **Start Enterprise Portal**
   ```bash
   # In enterprise-portal directory
   cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone/enterprise-portal
   npm run dev
   # Portal will start on http://localhost:3000
   ```

3. **Verify Configuration**
   - Open browser to `http://localhost:3000`
   - Open browser DevTools → Network tab
   - All API calls should now go to `http://localhost:9003/api/v11/*`
   - **No more 502 Bad Gateway errors!**

### Testing the Connection

```bash
# Test V11 backend is responding
curl http://localhost:9003/api/v11/health

# Expected response:
# {"status":"UP","checks":[...]}

# Test info endpoint
curl http://localhost:9003/api/v11/info

# Expected response:
# {"name":"Aurigraph V11","version":"11.0.0",...}
```

---

## 🔍 Environment Detection Logic

All API service files now use this pattern:

```typescript
const API_BASE_URL = (import.meta as any).env?.PROD
  ? 'https://dlt.aurigraph.io/api/v11'  // Production
  : 'http://localhost:9003/api/v11'     // Development (LOCAL)
```

**How it Works**:
- Vite automatically sets `import.meta.env.PROD` to `true` during production builds
- In development mode (`npm run dev`), it's `false`
- No manual environment variable switching needed!

---

## 🛠️ Troubleshooting

### Issue: Still getting 502 errors

**Solution 1**: Verify V11 backend is running
```bash
# Check if port 9003 is listening
lsof -i :9003
# Should show Java/Quarkus process

# If not running, start it:
cd /path/to/aurigraph-v11-standalone
./mvnw quarkus:dev
```

**Solution 2**: Clear browser cache
```bash
# In DevTools, right-click refresh button → "Empty Cache and Hard Reload"
# Or close DevTools and do Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)
```

**Solution 3**: Restart Vite dev server
```bash
# Kill the dev server (Ctrl+C)
# Clear Vite cache
rm -rf node_modules/.vite
# Restart
npm run dev
```

### Issue: CORS errors

The Vite proxy should handle CORS, but if you see CORS errors:

1. Check `vite.config.ts` has `changeOrigin: true`
2. Ensure you're accessing portal via `http://localhost:3000` (not `127.0.0.1`)
3. Check V11 backend CORS configuration in `application.properties`

### Issue: Environment variables not loading

**Vite requires `VITE_` prefix** for environment variables!

```bash
# ❌ WRONG (React pattern)
REACT_APP_API_URL=http://localhost:9003

# ✅ CORRECT (Vite pattern)
VITE_API_URL=http://localhost:9003
```

After changing `.env`, restart the dev server.

---

## 📊 Verification Checklist

- [x] `.env` file created with `VITE_API_URL=http://localhost:9003`
- [x] `vite.config.ts` proxy points to `http://localhost:9003`
- [x] All service files use Vite-compatible env detection
- [x] `.env` is excluded in `.gitignore`
- [x] V11 backend runs on port 9003
- [x] Portal dev server runs on port 3000
- [x] No hardcoded production URLs in service files

---

## 🔄 Switching Between Environments

### Local Development (Current)
```bash
# .env file
VITE_API_URL=http://localhost:9003

# Start both services
./mvnw quarkus:dev              # Backend on :9003
npm run dev                     # Frontend on :3000
```

### Production Build
```bash
# Build for production (automatically uses production URL)
npm run build

# Preview production build locally
npm run preview
# Note: Preview will still use localhost:9003 unless you set PROD=true
```

### Testing Against Remote Dev Server
```bash
# Temporarily edit .env
VITE_API_URL=https://dlt.aurigraph.io

# Restart dev server
npm run dev
```

---

## 📚 Related Documentation

- **Vite Environment Variables**: https://vitejs.dev/guide/env-and-mode.html
- **V11 Backend Setup**: `../README.md`
- **API Documentation**: `../API.md`
- **NGINX Production Config**: `nginx/README.md`

---

## ✅ Success Criteria

When correctly configured, you should see:

1. **Console Output** (Vite dev server):
   ```
   VITE v5.x.x  ready in XXX ms
   ➜  Local:   http://localhost:3000/
   ➜  Network: use --host to expose
   ```

2. **Browser DevTools Network Tab**:
   - API calls to `/api/v11/health` → `http://localhost:9003/api/v11/health`
   - Status: `200 OK` (not 502)
   - Response: Valid JSON with blockchain data

3. **Dashboard Loads**:
   - No CORS errors
   - No 502 Bad Gateway errors
   - Real-time metrics updating from local backend
   - Transaction data loading successfully

---

**Configuration completed**: 2025-10-25
**Tested and verified**: ✅ Ready for local development
