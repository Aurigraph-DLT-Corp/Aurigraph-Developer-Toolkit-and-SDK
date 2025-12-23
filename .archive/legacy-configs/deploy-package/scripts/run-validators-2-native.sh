#!/bin/sh
# Aurigraph V12 - Validator Cluster 2 Runner (Native GraalVM Mode)
# Runs 3 validator nodes in a single container using native executable
# Each node runs on ports 9007-9009 (HTTP) and 9107-9109 (gRPC)
# Memory: ~200MB per node vs ~1GB in JVM mode

set -e

NATIVE_BINARY="/app/aurigraph-v12-runner"
DB_URL="${QUARKUS_DATASOURCE_JDBC_URL:-jdbc:postgresql://host.docker.internal:5432/j4c_db}"
DB_USER="${QUARKUS_DATASOURCE_USERNAME:-j4c_user}"
DB_PASS="${QUARKUS_DATASOURCE_PASSWORD:-j4c_password}"

echo "=== Aurigraph V12 Validator Cluster 2 (Native GraalVM Mode) ==="
echo "Starting 3 validator nodes (5-7)..."
echo "Database: $DB_URL"
echo "Binary: $NATIVE_BINARY"

# Verify native binary exists and is executable
if [ ! -x "$NATIVE_BINARY" ]; then
    echo "ERROR: Native binary not found or not executable: $NATIVE_BINARY"
    ls -la /app/
    exit 1
fi

# Function to start a validator node
start_validator() {
    local node_id=$1
    local http_port=$((9003 + node_id - 1))  # node 5 = port 9007, node 6 = port 9008, node 7 = port 9009
    local grpc_port=$((9103 + node_id - 1))

    echo "Starting validator-$node_id on port $http_port (gRPC: $grpc_port)..."

    $NATIVE_BINARY \
        -Dquarkus.http.port=$http_port \
        -Dquarkus.grpc.server.port=$grpc_port \
        -Dquarkus.datasource.jdbc.url="$DB_URL" \
        -Dquarkus.datasource.username="$DB_USER" \
        -Dquarkus.datasource.password="$DB_PASS" \
        -Dquarkus.flyway.migrate-at-start=false \
        -Dquarkus.profile=validator \
        -Dnode.type=validator \
        -Dnode.id=validator-$node_id \
        -Dcurby.quantum.api-key=placeholder \
        > /var/log/validator-$node_id.log 2>&1 &

    echo "validator-$node_id started (PID: $!)"
}

# Start validators 5-7 with staggered startup
for i in 5 6 7; do
    start_validator $i
    sleep 3  # Shorter stagger for native (faster startup)
done

echo ""
echo "All 3 validators (5-7) started!"
echo "HTTP Ports: 9007-9009"
echo "gRPC Ports: 9107-9109"
echo ""

# Wait for initial startup (native starts in <1s vs 18s JVM)
echo "Waiting 20s for all nodes to start..."
sleep 20

# Health check loop
echo "Monitoring node health..."
while true; do
    healthy=0
    for i in 5 6 7; do
        port=$((9003 + i - 1))
        if wget -q --spider http://localhost:$port/q/health/live 2>/dev/null; then
            healthy=$((healthy + 1))
        fi
    done

    echo "$(date '+%Y-%m-%d %H:%M:%S') - Healthy validators (cluster 2): $healthy/3"

    # Only exit if no nodes are responding after retry
    if [ $healthy -eq 0 ]; then
        echo "WARNING: No healthy nodes, waiting 30s before retry..."
        sleep 30
        # Recheck before exiting
        healthy=0
        for i in 5 6 7; do
            port=$((9003 + i - 1))
            if wget -q --spider http://localhost:$port/q/health/live 2>/dev/null; then
                healthy=$((healthy + 1))
            fi
        done
        if [ $healthy -eq 0 ]; then
            echo "ERROR: All validator nodes in cluster 2 still down after retry! Exiting..."
            exit 1
        fi
    fi

    sleep 30
done
