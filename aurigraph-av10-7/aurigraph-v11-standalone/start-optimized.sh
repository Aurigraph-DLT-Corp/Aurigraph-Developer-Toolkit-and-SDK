#!/bin/bash
################################################################################
# Aurigraph V11 - Optimized Production Startup Script
#
# Performance Tuning Based On:
# - BDA Performance Analysis (October 16, 2025)
# - Proven Configuration (October 14, 2025 - 2.68M TPS average, 3.58M TPS peak)
#
# Server Specs:
# - RAM: 49GB
# - vCPU: 16 cores
# - OS: Ubuntu 24.04.3 LTS
#
# Target Performance:
# - 2M+ TPS sustained
# - <1s startup (native)
# - <256MB memory footprint (native)
################################################################################

set -e  # Exit on error

# Configuration
APP_NAME="aurigraph-v11-standalone"
APP_VERSION="11.3.1"
JAR_FILE="${APP_NAME}-${APP_VERSION}-runner.jar"
PID_FILE="/var/run/aurigraph/aurigraph-v11.pid"
LOG_DIR="/opt/aurigraph-v11/logs"
LOG_FILE="${LOG_DIR}/aurigraph-v11.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# JVM Performance Tuning (Proven Configuration - October 14, 2025)
# These settings achieved 2.68M TPS average, 3.58M TPS peak
JVM_OPTS="-Xms16g -Xmx32g"
JVM_OPTS="$JVM_OPTS -XX:+UseG1GC"
JVM_OPTS="$JVM_OPTS -XX:MaxGCPauseMillis=20"
JVM_OPTS="$JVM_OPTS -XX:G1ReservePercent=15"
JVM_OPTS="$JVM_OPTS -XX:InitiatingHeapOccupancyPercent=30"
JVM_OPTS="$JVM_OPTS -XX:+UseCompressedOops"
JVM_OPTS="$JVM_OPTS -XX:+UseCompressedClassPointers"
JVM_OPTS="$JVM_OPTS -XX:+AlwaysPreTouch"

# GC Logging (for monitoring and tuning)
JVM_OPTS="$JVM_OPTS -Xlog:gc*:file=${LOG_DIR}/gc.log:time,uptime,level,tags:filecount=5,filesize=100M"

# Performance Monitoring
JVM_OPTS="$JVM_OPTS -XX:+UnlockDiagnosticVMOptions"
JVM_OPTS="$JVM_OPTS -XX:+DebugNonSafepoints"

# Native Memory Tracking (optional - slight overhead)
# JVM_OPTS="$JVM_OPTS -XX:NativeMemoryTracking=summary"

# Thread Configuration (optimized for 16 cores)
JVM_OPTS="$JVM_OPTS -XX:ParallelGCThreads=16"
JVM_OPTS="$JVM_OPTS -XX:ConcGCThreads=4"

# Large Pages (if available on system)
# Uncomment if large pages are configured on the OS
# JVM_OPTS="$JVM_OPTS -XX:+UseLargePages"

# Application-Specific Properties
APP_OPTS="-Dquarkus.http.port=9003"
APP_OPTS="$APP_OPTS -Dquarkus.grpc.server.port=9004"
APP_OPTS="$APP_OPTS -Dquarkus.profile=prod"

# Logging
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Aurigraph DLT V11 - Optimized Production Startup${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
echo "  Application: ${APP_NAME} v${APP_VERSION}"
echo "  JVM Heap: 16GB initial, 32GB maximum"
echo "  GC: G1GC with 20ms max pause time"
echo "  HTTP Port: 9003"
echo "  gRPC Port: 9004"
echo "  Log File: ${LOG_FILE}"
echo ""

# Check if JAR exists
if [ ! -f "$JAR_FILE" ]; then
    echo -e "${RED}ERROR: JAR file not found: $JAR_FILE${NC}"
    echo "Please build the application first:"
    echo "  ./mvnw clean package"
    exit 1
fi

# Check if already running
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo -e "${RED}ERROR: Aurigraph V11 is already running (PID: $OLD_PID)${NC}"
        echo "Stop it first with: kill $OLD_PID"
        exit 1
    else
        echo -e "${YELLOW}WARNING: Stale PID file found, removing...${NC}"
        rm -f "$PID_FILE"
    fi
fi

# Create directories if needed
mkdir -p "$(dirname "$PID_FILE")"
mkdir -p "$LOG_DIR"

# Display memory info
echo -e "${YELLOW}System Memory:${NC}"
free -h | grep -E "^Mem|^Swap" || true
echo ""

# Display Java version
echo -e "${YELLOW}Java Version:${NC}"
java --version | head -1
echo ""

# Start application
echo -e "${GREEN}Starting Aurigraph V11...${NC}"
echo ""

# Start the application in the background
nohup java $JVM_OPTS $APP_OPTS -jar "$JAR_FILE" \
    >> "$LOG_FILE" 2>&1 &

# Save PID
APP_PID=$!
echo $APP_PID > "$PID_FILE"

# Wait a moment for startup
sleep 3

# Check if still running
if ps -p $APP_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Aurigraph V11 started successfully${NC}"
    echo "  PID: $APP_PID"
    echo "  Log: tail -f $LOG_FILE"
    echo "  Health: curl http://localhost:9003/q/health"
    echo ""
    echo -e "${YELLOW}Performance Monitoring:${NC}"
    echo "  TPS Test: curl http://localhost:9003/api/v11/performance?iterations=1000000&threads=50"
    echo "  Stats: curl http://localhost:9003/api/v11/stats"
    echo "  GC Log: tail -f ${LOG_DIR}/gc.log"
    echo ""
    echo -e "${GREEN}Expected Performance:${NC}"
    echo "  Target TPS: 2M+ sustained"
    echo "  Startup Time: <3s"
    echo "  Memory Usage: <30GB"
    echo ""
else
    echo -e "${RED}✗ Aurigraph V11 failed to start${NC}"
    echo "Check logs: tail -100 $LOG_FILE"
    rm -f "$PID_FILE"
    exit 1
fi

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
