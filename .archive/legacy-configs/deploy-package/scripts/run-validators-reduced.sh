#!/bin/sh
# Aurigraph V12 - Validator Cluster Runner (Reduced - 4 nodes)
# Runs 4 validator nodes in a single container using Quarkus JVM
# Each node runs on ports 9003-9006 (HTTP) and 9103-9106 (gRPC)

set -e

QUARKUS_JAR="/app/quarkus-app/quarkus-run.jar"
DB_URL="${QUARKUS_DATASOURCE_JDBC_URL:-jdbc:postgresql://host.docker.internal:5432/j4c_db}"
DB_USER="${QUARKUS_DATASOURCE_USERNAME:-j4c_user}"
DB_PASS="${QUARKUS_DATASOURCE_PASSWORD:-j4c_password}"
# Conservative JVM settings (~1GB per node)
JAVA_OPTS="${JAVA_OPTS:--Xms256m -Xmx768m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UseStringDeduplication -XX:InitiatingHeapOccupancyPercent=45 -XX:G1HeapRegionSize=4m -XX:MaxMetaspaceSize=192m -Xss512k}"

echo "=== Aurigraph V12 Validator Cluster (Reduced - 4 nodes) ==="
echo "Starting 4 validator nodes (1-4)..."
echo "Database: $DB_URL"

# Function to start a validator node
start_validator() {
    local node_id=$1
    local http_port=$((9003 + node_id - 1))
    local grpc_port=$((9103 + node_id - 1))
    local migrate="false"

    # Only first validator runs migrations
    if [ "$node_id" -eq 1 ]; then
        migrate="true"
    fi

    echo "Starting validator-$node_id on port $http_port (gRPC: $grpc_port)..."

    java $JAVA_OPTS \
        -Dquarkus.http.port=$http_port \
        -Dquarkus.grpc.server.port=$grpc_port \
        -Dquarkus.datasource.jdbc.url="$DB_URL" \
        -Dquarkus.datasource.username="$DB_USER" \
        -Dquarkus.datasource.password="$DB_PASS" \
        -Dquarkus.flyway.migrate-at-start=$migrate \
        -Dquarkus.profile=validator \
        -Dnode.type=validator \
        -Dnode.id=validator-$node_id \
        -Dcurby.quantum.api-key=placeholder \
        -jar $QUARKUS_JAR \
        > /var/log/validator-$node_id.log 2>&1 &

    echo "validator-$node_id started (PID: $!)"
}

# Start validator 1 first (runs migrations)
start_validator 1
echo "Waiting 45s for validator-1 to complete migrations..."
sleep 45

# Start validators 2-4 with staggered startup
for i in 2 3 4; do
    start_validator $i
    sleep 10  # Stagger startup to reduce resource contention
done

echo ""
echo "All 4 validators (1-4) started!"
echo "HTTP Ports: 9003-9006"
echo "gRPC Ports: 9103-9106"
echo ""

# Wait for initial startup
echo "Waiting 120s for all nodes to start..."
sleep 120

# Health check loop
echo "Monitoring node health..."
while true; do
    healthy=0
    for i in 1 2 3 4; do
        port=$((9003 + i - 1))
        if wget -q --spider http://localhost:$port/q/health/live 2>/dev/null; then
            healthy=$((healthy + 1))
        fi
    done

    echo "$(date '+%Y-%m-%d %H:%M:%S') - Healthy validators: $healthy/4"

    # Only exit if no nodes are responding after retry
    if [ $healthy -eq 0 ]; then
        echo "WARNING: No healthy nodes, waiting 90s before retry..."
        sleep 90
        # Recheck before exiting
        healthy=0
        for i in 1 2 3 4; do
            port=$((9003 + i - 1))
            if wget -q --spider http://localhost:$port/q/health/live 2>/dev/null; then
                healthy=$((healthy + 1))
            fi
        done
        if [ $healthy -eq 0 ]; then
            echo "ERROR: All validator nodes still down after retry! Exiting..."
            exit 1
        fi
    fi

    sleep 30
done
