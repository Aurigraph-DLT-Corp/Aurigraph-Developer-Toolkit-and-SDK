# Backend Startup and Verification Guide

## Current Status
- ✅ Port conflict resolved (V11 backend now on port 9004)
- ✅ Database migration created (UUID enforcement)
- ✅ Configuration warnings cleaned up
- ⏸️ Backend is **NOT RUNNING** - needs to be started

---

## Step 1: Start Docker Desktop
The backend runs in Docker containers. Ensure Docker Desktop is running:

```bash
# Check if Docker is running
docker info
```

If Docker is not running:
- Open **Docker Desktop** application
- Wait for it to fully start (whale icon in menu bar should be steady)

---

## Step 2: Start the V11 Backend

### Option A: Using Docker Compose (Recommended)
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT
docker-compose up aurigraph-v11-service -d
```

### Option B: Start All Services
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT
docker-compose up -d
```

### Check Container Status
```bash
docker ps | grep dlt-aurigraph-v11
```

Expected output: Container running with port `9004:9004`

---

## Step 3: Verify Backend Connectivity

Run the automated verification script:

```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT
./verify_backend_connectivity.sh
```

### Expected Results:
```
✅ Health Check Passed (HTTP 200)
✅ Ready Check Passed (HTTP 200)
✅ API Endpoint Reachable (HTTP 200/401/403)
🎉 All Connectivity Tests Passed!
```

### Manual Verification (Alternative)
```bash
# Test health endpoint
curl http://localhost:9004/q/health

# Test ready endpoint
curl http://localhost:9004/q/health/ready

# Test API endpoint
curl http://localhost:9004/api/v11/stats
```

---

## Step 4: Check Database Migration

Verify the UUID migration was applied:

```bash
# View backend logs
docker logs dlt-aurigraph-v11 | grep "V10__Ensure_User_UUID"
```

Expected: `Successfully applied 1 migration to schema "public" (execution time 00:00.XXXs)`

---

## Step 5: Test Portal Integration

### Start the Enterprise Portal (if not already running)

#### Option 1: Docker Compose
```bash
docker-compose up enterprise-portal -d
```

#### Option 2: Local Development
```bash
cd /Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend
npm install
npm run dev
```

### Verify Portal Configuration
The portal should automatically use port 9004 (updated in `.env.development`):
- API: `http://localhost:9004/api/v11`
- WebSocket: `ws://localhost:9004`

### Test Portal Connectivity
1. Open browser to portal URL (typically `http://localhost:3000`)
2. Open browser DevTools (F12) → Console
3. Look for successful API calls to `localhost:9004`
4. Check Network tab for WebSocket connections

---

## Troubleshooting

### Backend Won't Start
```bash
# Check logs
docker logs dlt-aurigraph-v11

# Check all container logs
docker-compose logs aurigraph-v11-service
```

Common issues:
- **Port already in use**: Check if something else is on 9004
  ```bash
  lsof -i :9004
  ```
- **Database connection failed**: Ensure PostgreSQL container is running
  ```bash
  docker ps | grep postgres
  ```

### Database Migration Failed
```bash
# View migration status
docker exec -it dlt-postgres psql -U aurigraph -d aurigraph_production -c "SELECT * FROM flyway_schema_history;"
```

### Portal Can't Connect to Backend
1. Verify backend is responding: `curl http://localhost:9004/q/health`
2. Check CORS configuration in `application.properties`
3. Verify `.env.development` has correct URL: `http://localhost:9004/api/v11`

---

## Next Steps After Verification

Once backend is running and connectivity is verified:

1. **Manual Portal Testing**: Test API calls from the portal UI
2. **WebSocket Testing**: Verify real-time connections work
3. **E2E Tests**: Run Node Creation and Scaling workflow tests

---

## Quick Reference Commands

```bash
# Start backend
docker-compose up aurigraph-v11-service -d

# Verify connectivity
./verify_backend_connectivity.sh

# View logs
docker logs dlt-aurigraph-v11 -f

# Stop backend
docker-compose down aurigraph-v11-service

# Restart backend
docker-compose restart aurigraph-v11-service
```
