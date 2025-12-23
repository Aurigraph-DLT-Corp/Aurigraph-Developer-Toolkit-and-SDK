#!/bin/sh
# Aurigraph V12 - Multi-Slim Node Runner
# Runs 5 slim nodes in a single container using native GraalVM executable
# Each node runs on ports 9050-9054 (HTTP)

set -e

NATIVE_BINARY="/app/aurigraph-v12-runner"
DB_URL="${QUARKUS_DATASOURCE_JDBC_URL:-jdbc:postgresql://host.docker.internal:5432/j4c_db}"
DB_USER="${QUARKUS_DATASOURCE_USERNAME:-j4c_user}"
DB_PASS="${QUARKUS_DATASOURCE_PASSWORD:-j4c_password}"

echo "=== Aurigraph V12 Slim Node Cluster ==="
echo "Starting 5 slim nodes..."
echo "Database: $DB_URL"

# Function to start a slim node
start_slim() {
    local node_id=$1
    local http_port=$((9050 + node_id - 1))

    echo "Starting slim-$node_id on port $http_port..."

    $NATIVE_BINARY \
        -Dquarkus.http.port=$http_port \
        -Dquarkus.datasource.jdbc.url="$DB_URL" \
        -Dquarkus.datasource.username="$DB_USER" \
        -Dquarkus.datasource.password="$DB_PASS" \
        -Dquarkus.flyway.migrate-at-start=false \
        -Dquarkus.profile=slim \
        -Dnode.type=slim \
        -Dnode.id=slim-$node_id \
        -Dcurby.quantum.api-key=placeholder \
        > /var/log/slim-$node_id.log 2>&1 &

    echo "slim-$node_id started (PID: $!)"
}

# Start all 5 slim nodes
for i in 1 2 3 4 5; do
    start_slim $i
    sleep 1  # Stagger startup
done

echo ""
echo "All 5 slim nodes started!"
echo "Ports: 9050-9054 (HTTP)"
echo ""

# Health check loop
echo "Monitoring node health..."
while true; do
    sleep 30

    healthy=0
    for i in 1 2 3 4 5; do
        port=$((9050 + i - 1))
        if wget -q --spider http://localhost:$port/q/health/live 2>/dev/null; then
            healthy=$((healthy + 1))
        fi
    done

    echo "$(date '+%Y-%m-%d %H:%M:%S') - Healthy slim nodes: $healthy/5"

    # If all nodes died, exit container
    if [ $healthy -eq 0 ]; then
        echo "ERROR: All slim nodes down! Exiting..."
        exit 1
    fi
done
