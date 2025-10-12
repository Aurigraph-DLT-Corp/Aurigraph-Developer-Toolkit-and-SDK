# Remote Deployment Instructions - Aurigraph V11

## Quick Start

The V11 JAR has been built and is ready for deployment to the remote server.

### Run Deployment Script

```bash
./deploy-to-remote.sh
```

**Password Required**: `subbuFuture@2025` (will be prompted multiple times for SSH/SCP)

---

## Manual Deployment Steps

If you prefer manual deployment or the script fails:

### 1. Upload JAR to Remote Server

```bash
scp target/aurigraph-v11-standalone-11.1.0-runner.jar subbu@dlt.aurigraph.io:/home/subbu/aurigraph-v11/
```

Password: `subbuFuture@2025`

### 2. SSH into Remote Server

```bash
ssh subbu@dlt.aurigraph.io
```

Password: `subbuFuture@2025`

### 3. Stop Existing Service (if running)

```bash
pkill -f 'aurigraph-v11-standalone.*runner.jar'
```

### 4. Start New Service

```bash
cd /home/subbu/aurigraph-v11
nohup java -Xmx4g -Xms2g -XX:+UseG1GC -jar aurigraph-v11-standalone-11.1.0-runner.jar > aurigraph-v11.log 2>&1 &
```

### 5. Verify Service is Running

Wait 30 seconds, then check health:

```bash
curl http://localhost:9003/api/v11/health
```

Expected response: `{"status":"UP",...}`

### 6. View Logs

```bash
tail -f /home/subbu/aurigraph-v11/aurigraph-v11.log
```

---

## Remote Server Details

- **Host**: dlt.aurigraph.io
- **User**: subbu
- **Password**: subbuFuture@2025
- **Deploy Directory**: /home/subbu/aurigraph-v11
- **Service Port**: 9003
- **System**: Ubuntu 24.04.3 LTS
- **RAM**: 49Gi
- **CPU**: 16 vCPUs (Intel Xeon Skylake @ 2.0GHz)

---

## Service Endpoints (Remote)

Once deployed, access these endpoints:

- **Health**: http://dlt.aurigraph.io:9003/api/v11/health
- **System Info**: http://dlt.aurigraph.io:9003/api/v11/info
- **Performance**: http://dlt.aurigraph.io:9003/api/v11/performance
- **Statistics**: http://dlt.aurigraph.io:9003/api/v11/stats
- **Quarkus Health**: http://dlt.aurigraph.io:9003/q/health
- **Prometheus Metrics**: http://dlt.aurigraph.io:9003/q/metrics

---

## Troubleshooting

### Service Won't Start

1. Check logs:
   ```bash
   ssh subbu@dlt.aurigraph.io 'tail -100 /home/subbu/aurigraph-v11/aurigraph-v11.log'
   ```

2. Check if port 9003 is already in use:
   ```bash
   ssh subbu@dlt.aurigraph.io 'lsof -i :9003'
   ```

3. Check Java version:
   ```bash
   ssh subbu@dlt.aurigraph.io 'java --version'
   ```
   (Requires Java 21+)

### Connection Refused

- Ensure service started successfully (check logs)
- Verify port 9003 is open in firewall:
  ```bash
  ssh subbu@dlt.aurigraph.io 'sudo ufw status | grep 9003'
  ```

### Out of Memory

Increase heap size in startup command:
```bash
java -Xmx8g -Xms4g -XX:+UseG1GC -jar aurigraph-v11-standalone-11.1.0-runner.jar
```

---

## Performance Testing on Remote Server

Once deployed, run performance tests:

```bash
# From local machine
curl http://dlt.aurigraph.io:9003/api/v11/performance

# SSH into remote and run load test
ssh subbu@dlt.aurigraph.io
cd /home/subbu/aurigraph-v11
# Run your performance tests here
```

---

## Stopping the Service

```bash
ssh subbu@dlt.aurigraph.io 'pkill -f aurigraph-v11-standalone.*runner.jar'
```

---

## JAR Details

- **File**: aurigraph-v11-standalone-11.1.0-runner.jar
- **Size**: ~118MB (uber JAR with all dependencies)
- **Build Date**: 2025-10-12
- **Version**: 11.1.0
- **Features**:
  - Hash-based conflict detection (O(n) performance)
  - Ethereum bridge integration (Web3j)
  - TestContainers support
  - JMH benchmarking
  - Quantum cryptography
  - gRPC services
  - Virtual thread support

---

## What's New in This Deployment

### Week 1, Day 1 Enhancements

1. **Performance Optimization** (BDA)
   - Hash-based conflict detection: 145K+ TPS
   - O(n²) → O(n) algorithm optimization
   - Greedy graph coloring for transaction grouping

2. **Integration Testing** (QAA)
   - TestContainers environment
   - Ethereum bridge tests (7 test cases)
   - Web3j integration

3. **Code Quality** (DDA)
   - Cleaned up duplicate dependencies
   - No build warnings
   - 19/20 tests passing

---

## Continuous Deployment

For future deployments, simply run:

```bash
# From local aurigraph-v11-standalone directory
./mvnw clean package -DskipTests
./deploy-to-remote.sh
```

---

**Last Updated**: 2025-10-12
**Deployed Version**: 11.1.0
**Status**: Ready for deployment
