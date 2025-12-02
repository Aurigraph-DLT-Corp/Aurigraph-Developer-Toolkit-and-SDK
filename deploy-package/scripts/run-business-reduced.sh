#!/bin/sh
# Aurigraph V12 - Business Node Runner (Reduced - 10 nodes)
# Runs 10 business nodes in a single container using Quarkus JVM
# Each node runs on ports 9020-9029 (HTTP)

set -e

QUARKUS_JAR="/app/quarkus-app/quarkus-run.jar"
DB_URL="${QUARKUS_DATASOURCE_JDBC_URL:-jdbc:postgresql://host.docker.internal:5432/j4c_db}"
DB_USER="${QUARKUS_DATASOURCE_USERNAME:-j4c_user}"
DB_PASS="${QUARKUS_DATASOURCE_PASSWORD:-j4c_password}"
# Conservative JVM settings (~768MB per node)
JAVA_OPTS="${JAVA_OPTS:--Xms128m -Xmx512m -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -XX:+UseStringDeduplication -XX:InitiatingHeapOccupancyPercent=45 -XX:G1HeapRegionSize=2m -XX:MaxMetaspaceSize=160m -Xss384k}"

echo "=== Aurigraph V12 Business Node Cluster (Reduced - 10 nodes) ==="
echo "Starting 10 business nodes..."
echo "Database: $DB_URL"

# Function to start a business node
start_business() {
    local node_id=$1
    local http_port=$((9020 + node_id - 1))

    echo "Starting business-$node_id on port $http_port..."

    java $JAVA_OPTS \
        -Dquarkus.http.port=$http_port \
        -Dquarkus.datasource.jdbc.url="$DB_URL" \
        -Dquarkus.datasource.username="$DB_USER" \
        -Dquarkus.datasource.password="$DB_PASS" \
        -Dquarkus.flyway.migrate-at-start=false \
        -Dquarkus.profile=business \
        -Dnode.type=business \
        -Dnode.id=business-$node_id \
        -Dcurby.quantum.api-key=placeholder \
        -jar $QUARKUS_JAR \
        > /var/log/business-$node_id.log 2>&1 &

    echo "business-$node_id started (PID: $!)"
}

# Start all 10 business nodes with staggered startup
for i in 1 2 3 4 5 6 7 8 9 10; do
    start_business $i
    sleep 5  # Stagger startup to reduce resource contention
done

echo ""
echo "All 10 business nodes started!"
echo "Ports: 9020-9029 (HTTP)"
echo ""

# Wait for initial startup
echo "Waiting 90s for all nodes to start..."
sleep 90

# Health check loop
echo "Monitoring node health..."
while true; do
    healthy=0
    for i in 1 2 3 4 5 6 7 8 9 10; do
        port=$((9020 + i - 1))
        if wget -q --spider http://localhost:$port/q/health/live 2>/dev/null; then
            healthy=$((healthy + 1))
        fi
    done

    echo "$(date '+%Y-%m-%d %H:%M:%S') - Healthy business nodes: $healthy/10"

    # Only exit if no nodes are responding after retry
    if [ $healthy -eq 0 ]; then
        echo "WARNING: No healthy nodes, waiting 90s before retry..."
        sleep 90
        # Recheck before exiting
        healthy=0
        for i in 1 2 3 4 5 6 7 8 9 10; do
            port=$((9020 + i - 1))
            if wget -q --spider http://localhost:$port/q/health/live 2>/dev/null; then
                healthy=$((healthy + 1))
            fi
        done
        if [ $healthy -eq 0 ]; then
            echo "ERROR: All business nodes still down after retry! Exiting..."
            exit 1
        fi
    fi

    sleep 30
done
