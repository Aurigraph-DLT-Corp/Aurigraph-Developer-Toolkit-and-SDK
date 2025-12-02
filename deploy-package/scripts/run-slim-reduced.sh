#!/bin/sh
# Aurigraph V12 - Slim Node Runner (Reduced - 3 nodes)
# Runs 3 slim nodes in a single container using Quarkus JVM
# Each node runs on ports 9050-9052 (HTTP)

set -e

QUARKUS_JAR="/app/quarkus-app/quarkus-run.jar"
DB_URL="${QUARKUS_DATASOURCE_JDBC_URL:-jdbc:postgresql://host.docker.internal:5432/j4c_db}"
DB_USER="${QUARKUS_DATASOURCE_USERNAME:-j4c_user}"
DB_PASS="${QUARKUS_DATASOURCE_PASSWORD:-j4c_password}"
# Conservative JVM settings (~512MB per node)
JAVA_OPTS="${JAVA_OPTS:--Xms64m -Xmx384m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UseStringDeduplication -XX:InitiatingHeapOccupancyPercent=45 -XX:G1HeapRegionSize=2m -XX:MaxMetaspaceSize=96m -Xss384k}"

echo "=== Aurigraph V12 Slim Node Cluster (Reduced - 3 nodes) ==="
echo "Starting 3 slim nodes..."
echo "Database: $DB_URL"

# Function to start a slim node
start_slim() {
    local node_id=$1
    local http_port=$((9050 + node_id - 1))

    echo "Starting slim-$node_id on port $http_port..."

    java $JAVA_OPTS \
        -Dquarkus.http.port=$http_port \
        -Dquarkus.datasource.jdbc.url="$DB_URL" \
        -Dquarkus.datasource.username="$DB_USER" \
        -Dquarkus.datasource.password="$DB_PASS" \
        -Dquarkus.flyway.migrate-at-start=false \
        -Dquarkus.profile=slim \
        -Dnode.type=slim \
        -Dnode.id=slim-$node_id \
        -Dcurby.quantum.api-key=placeholder \
        -jar $QUARKUS_JAR \
        > /var/log/slim-$node_id.log 2>&1 &

    echo "slim-$node_id started (PID: $!)"
}

# Start all 3 slim nodes with staggered startup
for i in 1 2 3; do
    start_slim $i
    sleep 5  # Stagger startup to reduce resource contention
done

echo ""
echo "All 3 slim nodes started!"
echo "Ports: 9050-9052 (HTTP)"
echo ""

# Wait for initial startup
echo "Waiting 60s for all nodes to start..."
sleep 60

# Health check loop
echo "Monitoring node health..."
while true; do
    healthy=0
    for i in 1 2 3; do
        port=$((9050 + i - 1))
        if wget -q --spider http://localhost:$port/q/health/live 2>/dev/null; then
            healthy=$((healthy + 1))
        fi
    done

    echo "$(date '+%Y-%m-%d %H:%M:%S') - Healthy slim nodes: $healthy/3"

    # Only exit if no nodes are responding after retry
    if [ $healthy -eq 0 ]; then
        echo "WARNING: No healthy nodes, waiting 60s before retry..."
        sleep 60
        # Recheck before exiting
        healthy=0
        for i in 1 2 3; do
            port=$((9050 + i - 1))
            if wget -q --spider http://localhost:$port/q/health/live 2>/dev/null; then
                healthy=$((healthy + 1))
            fi
        done
        if [ $healthy -eq 0 ]; then
            echo "ERROR: All slim nodes still down after retry! Exiting..."
            exit 1
        fi
    fi

    sleep 30
done
