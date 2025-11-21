#!/bin/sh
# Multi-Node Startup Script for Aurigraph V11
# Runs multiple node instances within a single container
# Usage: ./start-multi-nodes.sh [node_type] [num_instances] [base_port] [base_node_id]

set -e

NODE_TYPE=${1:-validator}
NUM_INSTANCES=${2:-5}
BASE_PORT=${3:-9003}
BASE_NODE_ID=${4:-1}

echo "🚀 Starting $NUM_INSTANCES $NODE_TYPE nodes (Base Port: $BASE_PORT, Base ID: $BASE_NODE_ID)"

# Create a temporary directory for node processes
NODES_DIR="/tmp/aurigraph-nodes-$NODE_TYPE"
mkdir -p "$NODES_DIR"

# Function to start a single node instance
start_node_instance() {
    local instance=$1
    local node_id=$2
    local port=$((BASE_PORT + (instance - 1)))
    local grpc_port=$((BASE_PORT + 1000 + (instance - 1)))
    local log_file="$NODES_DIR/node-$node_id.log"

    echo "  ▶ Starting $NODE_TYPE node-$node_id (Port: $port, gRPC: $grpc_port)"

    # Set environment variables for this node instance
    export QUARKUS_PROFILE=production
    export QUARKUS_HTTP_HOST=0.0.0.0
    export QUARKUS_HTTP_PORT=$port
    export QUARKUS_HTTP_HTTP2=true
    export AURIGRAPH_NODE_ID=$NODE_TYPE-$node_id
    export AURIGRAPH_NODE_TYPE=$NODE_TYPE
    export AURIGRAPH_MODE=production

    # Node-specific configurations
    export CONSENSUS_LEADER_ELECTION=true
    export CONSENSUS_HEARTBEAT_INTERVAL=50
    export CONSENSUS_ELECTION_TIMEOUT_MIN=150
    export CONSENSUS_ELECTION_TIMEOUT_MAX=300
    export CONSENSUS_TARGET_TPS=776000

    # Database Configuration
    export QUARKUS_DATASOURCE_JDBC_URL=jdbc:postgresql://postgres:5432/aurigraph_production
    export QUARKUS_DATASOURCE_USERNAME=aurigraph
    export QUARKUS_DATASOURCE_PASSWORD=aurigraph-prod-secure-2025
    export QUARKUS_HIBERNATE_ORM_DATABASE_GENERATION=validate

    # Performance Configuration
    export AI_OPTIMIZATION_ENABLED=true
    export QUANTUM_CRYPTO_ENABLED=true
    export NATIVE_MODE=true

    # Memory optimization per instance
    export MALLOC_ARENA_MAX=2
    export MALLOC_MMAP_THRESHOLD_=65536
    export JAVA_OPTS="-Xms128m -Xmx512m"

    # LevelDB Configuration for node persistence
    export LEVELDB_PATH=/deployments/data/$NODE_TYPE-$node_id
    export LEVELDB_CACHE_SIZE=32MB
    export LEVELDB_WRITE_BUFFER_SIZE=16MB

    # Start the node in background
    java -jar /deployments/app.jar > "$log_file" 2>&1 &
    local pid=$!

    echo "$pid" >> "$NODES_DIR/pids.txt"
    echo "    PID: $pid"
}

# Clean up previous PIDs
> "$NODES_DIR/pids.txt"

# Start all node instances
for i in $(seq 1 $NUM_INSTANCES); do
    NODE_ID=$((BASE_NODE_ID + i - 1))
    start_node_instance $i $NODE_ID
    sleep 2  # Stagger startup to avoid resource contention
done

echo ""
echo "✅ All $NUM_INSTANCES $NODE_TYPE nodes started"
echo "📋 Log files: $NODES_DIR/"
echo "📌 PIDs: $(cat $NODES_DIR/pids.txt | tr '\n' ' ')"
echo ""
echo "🔍 To monitor nodes:"
echo "  - Tail logs: tail -f $NODES_DIR/node-*.log"
echo "  - Health check: curl http://localhost:PORT/q/health"
echo ""

# Keep container running - wait for all background processes
wait_for_nodes() {
    while true; do
        # Check if all processes are still running
        all_running=true
        while IFS= read -r pid; do
            if ! kill -0 "$pid" 2>/dev/null; then
                all_running=false
                echo "⚠️  Process $pid is no longer running"
            fi
        done < "$NODES_DIR/pids.txt"

        if [ "$all_running" = false ]; then
            echo "❌ Some node processes have exited"
            sleep 5
        fi

        sleep 30
    done
}

wait_for_nodes
