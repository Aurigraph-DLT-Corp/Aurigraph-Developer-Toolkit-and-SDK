#!/bin/sh
# Aurigraph V12 - Multi-Validator Node Runner
# Runs 7 validator nodes in a single container using native GraalVM executable
# Each node runs on ports 9003-9009 (HTTP) and 9103-9109 (gRPC)

set -e

NATIVE_BINARY="/app/aurigraph-v12-runner"
DB_URL="${QUARKUS_DATASOURCE_JDBC_URL:-jdbc:postgresql://host.docker.internal:5432/j4c_db}"
DB_USER="${QUARKUS_DATASOURCE_USERNAME:-j4c_user}"
DB_PASS="${QUARKUS_DATASOURCE_PASSWORD:-j4c_password}"

echo "=== Aurigraph V12 Validator Cluster ==="
echo "Starting 7 validator nodes..."
echo "Database: $DB_URL"

# Function to start a validator node
start_validator() {
    local node_id=$1
    local http_port=$((9003 + node_id - 1))
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

# Start all 7 validators
for i in 1 2 3 4 5 6 7; do
    start_validator $i
    sleep 2  # Stagger startup to reduce DB connection surge
done

echo ""
echo "All 7 validators started!"
echo "Ports: 9003-9009 (HTTP), 9103-9109 (gRPC)"
echo ""

# Health check loop
echo "Monitoring node health..."
while true; do
    sleep 30

    healthy=0
    for i in 1 2 3 4 5 6 7; do
        port=$((9003 + i - 1))
        if wget -q --spider http://localhost:$port/q/health/live 2>/dev/null; then
            healthy=$((healthy + 1))
        else
            echo "WARNING: validator-$i (port $port) not responding"
        fi
    done

    echo "$(date '+%Y-%m-%d %H:%M:%S') - Healthy validators: $healthy/7"

    # If all nodes died, exit container
    if [ $healthy -eq 0 ]; then
        echo "ERROR: All validators down! Exiting..."
        exit 1
    fi
done
