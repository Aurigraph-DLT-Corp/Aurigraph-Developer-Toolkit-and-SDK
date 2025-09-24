# Aurex Launchpad Networking Fix Guide

## Problem Analysis

The aurex-launchpad containers were failing on dev.aurigraph.io due to networking issues:

### Main Issues Identified:
1. **Network Isolation**: Frontend and backend containers were on different Docker networks
   - Frontend: `aurex-frontend-prod` network only
   - Backend: `aurex-backend-prod` and `aurex-database-prod` networks
   - No shared network for communication

2. **Incorrect Service Names**: Nginx configuration was using wrong container names
   - Configured: `aurex-launchpad-backend:8001`
   - Actual: `aurex-launchpad-backend-production:8001`

3. **Missing Cross-Network Communication**: Containers couldn't resolve each other's hostnames

## Files Modified

### 1. nginx.conf (`02_Applications/02_aurex-launchpad/nginx.conf`)
**Changes:**
- Fixed backend service name from `aurex-launchpad-backend` to `aurex-launchpad-backend-production`
- Added proper proxy headers
- Added timeout configurations
- Changed `/api` to `/api/` for proper routing

```nginx
# API proxy to backend - using production container name
location /api/ {
    proxy_pass http://aurex-launchpad-backend-production:8001/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
}
```

### 2. docker-compose.production.yml
**Changes:**
- Added `aurex-frontend` network to the backend service
- This allows frontend and backend containers to communicate

```yaml
aurex-launchpad-backend:
  # ... other config
  networks:
    - aurex-backend
    - aurex-frontend    # Added this line
    - aurex-database
```

### 3. docker-compose.launchpad-fix.yml (New)
**Purpose:**
- Standalone configuration for quick deployment of launchpad fixes
- Uses existing production networks
- Ensures proper network connectivity

## Deployment Steps

### Option 1: Quick Fix (Recommended)
Run the automated fix script:

```bash
# Navigate to project root
cd /Users/yogesh/00_MyCode/04_Aurigraph/04_aurex-trace-platform/aurex-trace-platform

# Run the fix script
./fix-launchpad-networking.sh
```

### Option 2: Manual Deployment
If you prefer to deploy manually:

```bash
# 1. SSH to production server
ssh -p 2224 yogesh@dev.aurigraph.io

# 2. Navigate to aurex platform directory
cd /opt/aurex-platform

# 3. Stop current launchpad containers
docker stop aurex-launchpad-frontend-production aurex-launchpad-backend-production
docker rm aurex-launchpad-frontend-production aurex-launchpad-backend-production

# 4. Copy updated files (from local machine)
scp -P 2224 docker-compose.production.yml yogesh@dev.aurigraph.io:/opt/aurex-platform/
scp -P 2224 -r 02_Applications/02_aurex-launchpad yogesh@dev.aurigraph.io:/opt/aurex-platform/02_Applications/

# 5. Rebuild and start containers (on production server)
cd /opt/aurex-platform
export VERSION_TAG="production-fix"
docker-compose -f docker-compose.production.yml up -d aurex-launchpad-backend aurex-launchpad-frontend
```

## Verification Commands

After deployment, verify the fix:

```bash
# Check container status
docker ps | grep launchpad

# Check network connectivity
docker exec aurex-launchpad-frontend-production nslookup aurex-launchpad-backend-production

# Test API connectivity
docker exec aurex-launchpad-frontend-production curl http://aurex-launchpad-backend-production:8001/health

# Test external access
curl -f http://localhost:3001/health
curl -f https://dev.aurigraph.io/launchpad
```

## Expected Results

After applying the fixes:

1. ✅ **DNS Resolution**: Frontend container can resolve backend hostname
2. ✅ **API Connectivity**: Frontend can successfully make HTTP requests to backend
3. ✅ **External Access**: Launchpad frontend is accessible from external requests
4. ✅ **Container Health**: Both containers start and maintain healthy status
5. ✅ **Network Isolation**: Maintains security while enabling necessary communication

## Rollback Plan

If issues occur, the fix script automatically creates backups and can rollback:

```bash
# The script stores backup information and can rollback automatically
# Manual rollback if needed:
ssh -p 2224 yogesh@dev.aurigraph.io
cd /opt/aurex-platform
docker-compose -f docker-compose.launchpad-fix.yml down
# Restore from backup files in /opt/aurex-platform/backups/
```

## Monitoring

After deployment, monitor:
- Container logs: `docker logs aurex-launchpad-frontend-production`
- Network connectivity between containers
- External access to launchpad application
- Overall application health and performance

## Technical Notes

- The fix maintains all existing security configurations
- No changes to database or authentication systems
- Preserves all existing environment variables and secrets
- Uses existing Docker networks (no new network creation)
- Backward compatible with existing infrastructure