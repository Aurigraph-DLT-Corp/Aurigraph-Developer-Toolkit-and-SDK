#!/bin/bash
# =============================================================================
# Aurigraph DLT - Multi-Node Launcher
# =============================================================================
# Launches multiple Aurigraph nodes within a single container for efficient
# resource utilization and simplified orchestration.
# =============================================================================

set -e

# Configuration from environment
NODE_COUNT=${NODE_COUNT:-1}
NODE_TYPE=${NODE_TYPE:-VALIDATOR}
NODE_ID_PREFIX=${NODE_ID_PREFIX:-node}
BASE_PORT=${BASE_PORT:-9000}
BASE_GRPC_PORT=${BASE_GRPC_PORT:-9100}
MEMORY_PER_NODE_MB=${MEMORY_PER_NODE_MB:-512}
MAX_HEAP_PER_NODE_MB=${MAX_HEAP_PER_NODE_MB:-256}

echo "=============================================="
echo "  Aurigraph DLT Multi-Node Launcher"
echo "=============================================="
echo "Node Type:    ${NODE_TYPE}"
echo "Node Count:   ${NODE_COUNT}"
echo "Base Port:    ${BASE_PORT}"
echo "Memory/Node:  ${MEMORY_PER_NODE_MB}MB"
echo "=============================================="

# Array to store PIDs of child processes
declare -a NODE_PIDS

# Cleanup function
cleanup() {
    echo "Shutting down all nodes..."
    for pid in "${NODE_PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            echo "Stopping node with PID: $pid"
            kill -TERM "$pid" 2>/dev/null || true
        fi
    done
    wait
    echo "All nodes stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT SIGQUIT

# Calculate total memory
TOTAL_MEMORY=$((NODE_COUNT * MEMORY_PER_NODE_MB))
echo "Total memory allocation: ${TOTAL_MEMORY}MB"

# Validate memory constraints
AVAILABLE_MEMORY=$(free -m 2>/dev/null | awk '/^Mem:/{print $2}' || echo "8192")
if [ "$TOTAL_MEMORY" -gt "$AVAILABLE_MEMORY" ]; then
    echo "WARNING: Requested memory (${TOTAL_MEMORY}MB) exceeds available (${AVAILABLE_MEMORY}MB)"
    echo "Reducing node count to fit available memory..."
    NODE_COUNT=$((AVAILABLE_MEMORY / MEMORY_PER_NODE_MB))
    if [ "$NODE_COUNT" -lt 1 ]; then
        NODE_COUNT=1
    fi
    echo "Adjusted node count: $NODE_COUNT"
fi

# Launch nodes
for i in $(seq 0 $((NODE_COUNT - 1))); do
    NODE_ID="${NODE_ID_PREFIX}-${NODE_TYPE,,}-$(printf '%03d' $i)"
    HTTP_PORT=$((BASE_PORT + i))
    GRPC_PORT=$((BASE_GRPC_PORT + i))

    echo ""
    echo "Starting node: $NODE_ID"
    echo "  HTTP Port: $HTTP_PORT"
    echo "  gRPC Port: $GRPC_PORT"

    # Create node-specific data directory
    mkdir -p "/app/data/${NODE_ID}"
    mkdir -p "/app/logs/${NODE_ID}"

    # Build JVM options for this node
    NODE_JAVA_OPTS="-Xms${MAX_HEAP_PER_NODE_MB}m -Xmx${MAX_HEAP_PER_NODE_MB}m"
    NODE_JAVA_OPTS="$NODE_JAVA_OPTS -XX:+UseG1GC -XX:+UseContainerSupport"
    NODE_JAVA_OPTS="$NODE_JAVA_OPTS -Dquarkus.http.port=${HTTP_PORT}"
    NODE_JAVA_OPTS="$NODE_JAVA_OPTS -Dquarkus.grpc.server.port=${GRPC_PORT}"
    NODE_JAVA_OPTS="$NODE_JAVA_OPTS -Daurigraph.node.id=${NODE_ID}"
    NODE_JAVA_OPTS="$NODE_JAVA_OPTS -Daurigraph.node.type=${NODE_TYPE}"
    NODE_JAVA_OPTS="$NODE_JAVA_OPTS -Daurigraph.data.dir=/app/data/${NODE_ID}"
    NODE_JAVA_OPTS="$NODE_JAVA_OPTS -Daurigraph.cluster.name=${CLUSTER_NAME:-aurigraph}"
    NODE_JAVA_OPTS="$NODE_JAVA_OPTS -Daurigraph.discovery.mode=${DISCOVERY_MODE:-kubernetes}"

    # Launch the node in background
    java $NODE_JAVA_OPTS -jar /app/quarkus-app/quarkus-run.jar \
        >> "/app/logs/${NODE_ID}/node.log" 2>&1 &

    NODE_PIDS+=($!)
    echo "  Started with PID: ${NODE_PIDS[-1]}"

    # Small delay between node starts to avoid resource contention
    sleep 2
done

echo ""
echo "=============================================="
echo "  All ${NODE_COUNT} nodes launched"
echo "=============================================="
echo ""

# Wait for all nodes to be ready
echo "Waiting for nodes to become ready..."
sleep 10

# Health check all nodes
HEALTHY_COUNT=0
for i in $(seq 0 $((NODE_COUNT - 1))); do
    HTTP_PORT=$((BASE_PORT + i))
    if curl -sf "http://localhost:${HTTP_PORT}/api/v11/health" > /dev/null 2>&1; then
        HEALTHY_COUNT=$((HEALTHY_COUNT + 1))
        echo "  Node $i (port $HTTP_PORT): HEALTHY"
    else
        echo "  Node $i (port $HTTP_PORT): STARTING..."
    fi
done

echo ""
echo "Healthy nodes: ${HEALTHY_COUNT}/${NODE_COUNT}"
echo ""

# Keep container running and monitor child processes
echo "Monitoring nodes... (Press Ctrl+C to stop)"
while true; do
    # Check if all child processes are still running
    RUNNING=0
    for pid in "${NODE_PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            RUNNING=$((RUNNING + 1))
        fi
    done

    if [ "$RUNNING" -eq 0 ]; then
        echo "All nodes have exited"
        exit 1
    fi

    # Sleep and continue monitoring
    sleep 30

    # Log node status periodically
    if [ $((SECONDS % 300)) -lt 30 ]; then
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] Running nodes: ${RUNNING}/${NODE_COUNT}"
    fi
done
