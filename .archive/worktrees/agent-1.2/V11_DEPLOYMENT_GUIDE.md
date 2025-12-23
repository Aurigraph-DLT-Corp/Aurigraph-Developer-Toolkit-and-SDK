# V11 Platform Deployment Guide

## Overview

V11 platform (Java/Quarkus) version 11.4.4 with CRM user registration and social media sharing features has been built and is being deployed to the remote server.

**Deployment Date**: November 13, 2025
**Status**: In Progress (JAR chunks uploading)
**Platform**: Aurigraph DLT V11 Standalone

---

## Build Information

### JAR File Details
- **File**: `aurigraph-v11-standalone-11.4.4-runner.jar`
- **Original Size**: 177 MB
- **Build Time**: 37.5 seconds
- **Build Status**: ✅ SUCCESS (0 errors)
- **Java Version**: Java 21
- **Framework**: Quarkus 3.29.0

### Build Command
```bash
./mvnw clean package -DskipTests
```

---

## Deployment Process

### Step 1: Upload Chunks (In Progress)
The JAR file has been split into 4 chunks for reliable transfer:

```
jar_chunk_aa - 50 MB (chunk 1/4)
jar_chunk_ab - 50 MB (chunk 2/4)
jar_chunk_ac - 50 MB (chunk 3/4)
jar_chunk_ad - 27 MB (chunk 4/4)
```

**Destination**: `/home/subbu/` on remote server (dlt.aurigraph.io)

### Step 2: Reassemble JAR (Pending)
Once all chunks are uploaded, run the reassemble script:

```bash
ssh subbu@dlt.aurigraph.io
cd /home/subbu
bash reassemble.sh
```

This will:
1. Combine all chunks back into the full JAR
2. Verify the file integrity
3. Make the JAR executable
4. Clean up temporary chunks
5. Display the final result

### Step 3: Run the Application (Next)

#### Option A: Direct Execution
```bash
java -jar aurigraph-v11-standalone-11.4.4-runner.jar
```

#### Option B: Background Execution
```bash
nohup java -jar aurigraph-v11-standalone-11.4.4-runner.jar > v11.log 2>&1 &
```

#### Option C: Using Systemd Service
Create `/etc/systemd/system/aurigraph-v11.service`:

```ini
[Unit]
Description=Aurigraph V11 Platform
After=network.target

[Service]
Type=simple
User=subbu
WorkingDirectory=/home/subbu
ExecStart=/usr/bin/java -jar aurigraph-v11-standalone-11.4.4-runner.jar
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Then start with:
```bash
sudo systemctl start aurigraph-v11
sudo systemctl enable aurigraph-v11
sudo systemctl status aurigraph-v11
```

---

## New Features in V11 11.4.4

### User Registration & CRM Integration

#### New Endpoints
```
POST   /api/v11/demo/users/register           - Register demo user
GET    /api/v11/demo/users/{registrationId}   - Get registration details
POST   /api/v11/demo/users/track-share        - Track social media share
GET    /api/v11/demo/users/by-email           - CRM email lookup
GET    /api/v11/demo/users/{registrationId}/export - Export as CSV
```

#### Registration Data Captured
- Full Name
- Email Address
- Company Name
- Job Title
- Phone Number
- Country
- Demo Metrics (Peak TPS, Latency, Success Rate)
- Timestamp
- Source (demo-app)

#### Social Media Tracking
Platforms supported:
- LinkedIn (professional network)
- Facebook (extended audience)
- X/Twitter (social updates)
- Instagram (copy-to-clipboard)

### Request/Response Examples

#### Register User
```bash
curl -X POST https://dlt.aurigraph.io/api/v11/demo/users/register \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_test_dev_key_12345" \
  -H "Authorization: Bearer internal-portal-access" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "company": "Tech Corp",
    "jobTitle": "Blockchain Engineer",
    "phone": "+1-555-0123",
    "country": "United States",
    "demoMetrics": {
      "channelId": "demo-channel-123",
      "peakTps": 1000000,
      "avgLatency": 45.2,
      "successRate": 99.8,
      "duration": 300,
      "nodeCount": 22
    },
    "source": "demo-app"
  }'
```

#### Track Social Share
```bash
curl -X POST https://dlt.aurigraph.io/api/v11/demo/users/track-share \
  -H "Content-Type: application/json" \
  -H "X-API-Key: sk_test_dev_key_12345" \
  -d '{
    "registrationId": "550e8400-e29b-41d4-a716-446655440000",
    "platform": "linkedin",
    "sharedAt": 1700000000000
  }'
```

---

## Configuration

### application.properties
Key settings in V11:

```properties
# Server
quarkus.http.port=9003
quarkus.http.http2=true

# Database (if using PostgreSQL)
quarkus.datasource.db-kind=postgresql
quarkus.datasource.username=aurigraph
quarkus.datasource.password=secure_password
quarkus.datasource.jdbc.url=jdbc:postgresql://localhost:5432/aurigraph

# Logging
quarkus.log.level=INFO
quarkus.log.category."io.aurigraph".level=DEBUG

# Virtual Threads
quarkus.virtual-threads.executor.max-threads=1000

# gRPC (when enabled)
quarkus.grpc.server.port=9004
quarkus.grpc.server.enabled=true
```

---

## Health Checks

### API Health Endpoint
```bash
curl http://localhost:9003/api/v11/health
```

### Metrics Endpoint
```bash
curl http://localhost:9003/q/metrics
```

### OpenAPI/Swagger Docs
```
http://localhost:9003/q/openapi
http://localhost:9003/swagger-ui.html
```

---

## Monitoring

### View Logs
```bash
# If using journalctl
sudo journalctl -u aurigraph-v11 -f

# If using nohup
tail -f v11.log

# If running in foreground
# Ctrl+C to stop
```

### Monitor Performance
```bash
# CPU and Memory
watch 'ps aux | grep "aurigraph-v11"'

# Port listening
netstat -tulpn | grep 9003

# Check connectivity
curl -v http://localhost:9003/api/v11/health
```

---

## Troubleshooting

### Port Already in Use
```bash
# Check what's using port 9003
lsof -i :9003

# Kill the process
kill -9 <PID>
```

### Out of Memory
If the JAR runs out of memory, adjust JVM heap:

```bash
java -Xmx2g -Xms1g -jar aurigraph-v11-standalone-11.4.4-runner.jar
```

### Configuration Issues
Check application.properties for typos:
```bash
grep -n "^[a-z]" /path/to/application.properties
```

### Connection Refused
Ensure the service is running:
```bash
ps aux | grep aurigraph
netstat -tulpn | grep 9003
```

---

## Integration with Enterprise Portal

The Enterprise Portal (React/TypeScript) at https://dlt.aurigraph.io integrates with V11 API endpoints:

### Frontend Service Integration
- **Location**: `enterprise-portal/enterprise-portal/frontend/src/services/HighThroughputDemoService.ts`
- **Base URL**: `https://dlt.aurigraph.io/api/v11/` (production)
- **Methods**: 20+ service methods for all demo operations

### Authentication
```
API Key: sk_test_dev_key_12345
Authorization: Bearer internal-portal-access
X-Internal-Request: true
```

---

## Deployment Verification Checklist

- [ ] All JAR chunks uploaded successfully
- [ ] Reassemble script executed without errors
- [ ] JAR file verified (177 MB size)
- [ ] Application started on port 9003
- [ ] Health endpoint responds (GET /api/v11/health)
- [ ] Metrics endpoint available (GET /q/metrics)
- [ ] Registration endpoint accessible (POST /api/v11/demo/users/register)
- [ ] Portal connects to API successfully
- [ ] Demo app registration modal functional
- [ ] Social media sharing working
- [ ] CRM data being captured
- [ ] Logs show no errors

---

## Performance Notes

### JVM Performance
- **Startup Time**: ~3-5 seconds (JVM mode)
- **Memory Footprint**: ~512 MB base + request load
- **Throughput**: Tested at 776K TPS baseline
- **Virtual Threads**: Supports 1000+ concurrent requests

### For Native Image (Optional)
To build a native executable (requires GraalVM):

```bash
./mvnw package -Pnative -Dquarkus.native.container-build=true
./target/aurigraph-v11-standalone-11.4.4-runner
```

Native benefits:
- Startup: <1 second
- Memory: <256 MB
- Better for Kubernetes/serverless

---

## Support & Documentation

### Related Files
- **Source Code**: `/aurigraph-av10-7/aurigraph-v11-standalone/`
- **Frontend Service**: `/enterprise-portal/frontend/src/services/HighThroughputDemoService.ts`
- **Component**: `/enterprise-portal/frontend/src/components/demo/`

### Documentation
- `DEMO_APP_GUIDE.md` - Comprehensive user guide
- `DEMO_APP_QUICK_REFERENCE.md` - Quick reference
- `DEMO_APP_IMPLEMENTATION_SUMMARY.md` - Technical details
- `V11_DEPLOYMENT_GUIDE.md` - This document

### GitHub
- **Repository**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **Latest Commit**: 51ef1d99 (demo app + registration features)

---

## Next Steps

1. **Confirm Chunk Upload**: Wait for chunk uploads to complete
2. **Reassemble JAR**: Execute `reassemble.sh` on remote server
3. **Start Application**: Launch the JAR with appropriate JVM settings
4. **Verify Endpoints**: Test health and registration endpoints
5. **Monitor Logs**: Watch for any startup errors
6. **Load Testing**: Run performance tests against new endpoints
7. **Production Monitoring**: Set up logging, metrics, and alerting

---

**Document Created**: November 13, 2025
**Version**: 1.0.0
**Status**: Deployment In Progress
**Next Update**: Once JAR deployment completes

