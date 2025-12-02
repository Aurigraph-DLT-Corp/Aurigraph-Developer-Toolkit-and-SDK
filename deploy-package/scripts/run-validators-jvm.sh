#!/bin/sh
# Aurigraph V12 - Multi-Validator Node Runner (JVM Mode)
# Runs 7 validator nodes in a single container using Quarkus JVM
# Each node runs on ports 9003-9009 (HTTP) and 9103-9109 (gRPC)

set -e

QUARKUS_JAR="/app/quarkus-app/quarkus-run.jar"
DB_URL="${QUARKUS_DATASOURCE_JDBC_URL:-jdbc:postgresql://host.docker.internal:5432/j4c_db}"
DB_USER="${QUARKUS_DATASOURCE_USERNAME:-j4c_user}"
DB_PASS="${QUARKUS_DATASOURCE_PASSWORD:-j4c_password}"
JAVA_OPTS="${JAVA_OPTS:--Xms256m -Xmx512m -XX:+UseG1GC}"

echo "=== Aurigraph V12 Validator Cluster (JVM Mode) ==="
echo "Starting 7 validator nodes..."
echo "Database: $DB_URL"

# Function to start a validator node
# First node (node_id=1) runs Flyway migrations to create tables
start_validator() {
    local node_id=$1
    local http_port=$((9003 + node_id - 1))
    local grpc_port=$((9103 + node_id - 1))
    local flyway_migrate="false"

    # Only first node runs migrations
    if [ "$node_id" -eq 1 ]; then
        flyway_migrate="true"
        echo "Starting validator-$node_id (PRIMARY) on port $http_port - will run Flyway migrations..."
    else
        echo "Starting validator-$node_id on port $http_port (gRPC: $grpc_port)..."
    fi

    java $JAVA_OPTS \
        -Dquarkus.http.port=$http_port \
        -Dquarkus.grpc.server.port=$grpc_port \
        -Dquarkus.datasource.jdbc.url="$DB_URL" \
        -Dquarkus.datasource.username="$DB_USER" \
        -Dquarkus.datasource.password="$DB_PASS" \
        -Dquarkus.flyway.migrate-at-start=$flyway_migrate \
        -Dquarkus.profile=validator \
        -Dnode.type=validator \
        -Dnode.id=validator-$node_id \
        -Dcurby.quantum.api-key=placeholder \
        -jar $QUARKUS_JAR \
        > /var/log/validator-$node_id.log 2>&1 &

    echo "validator-$node_id started (PID: $!)"
}

# Start validator-1 first (runs migrations)
start_validator 1

# Wait for validator-1 to complete startup and migrations
echo "Waiting for validator-1 to start and run migrations..."
for attempt in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do
    sleep 5
    if wget -q --spider http://localhost:9003/q/health/live 2>/dev/null; then
        echo "✓ validator-1 is healthy after $((attempt * 5))s"
        break
    fi
    echo "  Waiting... ($((attempt * 5))s)"
done

# Now start remaining validators
echo "Starting remaining validators..."
for i in 2 3 4 5 6 7; do
    start_validator $i
    sleep 5  # Stagger startup to reduce resource contention
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
