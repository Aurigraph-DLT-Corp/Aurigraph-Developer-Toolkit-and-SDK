#!/bin/sh
# Aurigraph V12 - Multi-Business Node Runner
# Runs 20 business nodes in a single container using native GraalVM executable
# Each node runs on ports 9020-9039 (HTTP)

set -e

NATIVE_BINARY="/app/aurigraph-v12-runner"
DB_URL="${QUARKUS_DATASOURCE_JDBC_URL:-jdbc:postgresql://host.docker.internal:5432/j4c_db}"
DB_USER="${QUARKUS_DATASOURCE_USERNAME:-j4c_user}"
DB_PASS="${QUARKUS_DATASOURCE_PASSWORD:-j4c_password}"

echo "=== Aurigraph V12 Business Node Cluster ==="
echo "Starting 20 business nodes..."
echo "Database: $DB_URL"

# Function to start a business node
start_business() {
    local node_id=$1
    local http_port=$((9020 + node_id - 1))

    echo "Starting business-$node_id on port $http_port..."

    $NATIVE_BINARY \
        -Dquarkus.http.port=$http_port \
        -Dquarkus.datasource.jdbc.url="$DB_URL" \
        -Dquarkus.datasource.username="$DB_USER" \
        -Dquarkus.datasource.password="$DB_PASS" \
        -Dquarkus.flyway.migrate-at-start=false \
        -Dquarkus.profile=business \
        -Dnode.type=business \
        -Dnode.id=business-$node_id \
        -Dcurby.quantum.api-key=placeholder \
        > /var/log/business-$node_id.log 2>&1 &

    echo "business-$node_id started (PID: $!)"
}

# Start all 20 business nodes
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
    start_business $i
    sleep 1  # Stagger startup
done

echo ""
echo "All 20 business nodes started!"
echo "Ports: 9020-9039 (HTTP)"
echo ""

# Health check loop
echo "Monitoring node health..."
while true; do
    sleep 30

    healthy=0
    for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
        port=$((9020 + i - 1))
        if wget -q --spider http://localhost:$port/q/health/live 2>/dev/null; then
            healthy=$((healthy + 1))
        fi
    done

    echo "$(date '+%Y-%m-%d %H:%M:%S') - Healthy business nodes: $healthy/20"

    # If all nodes died, exit container
    if [ $healthy -eq 0 ]; then
        echo "ERROR: All business nodes down! Exiting..."
        exit 1
    fi
done
