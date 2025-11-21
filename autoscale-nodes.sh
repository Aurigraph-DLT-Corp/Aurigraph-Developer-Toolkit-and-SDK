#!/bin/bash
# autoscale-nodes.sh
# Aurigraph DLT Node Autoscaling Orchestrator
# Monitors node containers and dynamically scales them based on CPU/Memory metrics
# Purpose: Automatically adjust node count based on load to optimize resource utilization
# Usage: ./autoscale-nodes.sh [--check-interval 30] [--dry-run]

set -e

# Configuration
CHECK_INTERVAL=${1:-30}  # Default 30 seconds between checks
DRY_RUN=false
DOCKER_COMPOSE_CORE="docker-compose-core.yml"
DOCKER_COMPOSE_NODES="docker-compose-nodes.yml"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --check-interval)
            CHECK_INTERVAL="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🚀 Aurigraph DLT Node Autoscaler Starting${NC}"
echo "Check interval: ${CHECK_INTERVAL}s"
echo "Dry-run mode: ${DRY_RUN}"
echo ""

# Function to get container metrics
get_container_metrics() {
    local container=$1
    local output=$(docker stats --no-stream "$container" 2>/dev/null)

    # Extract CPU and Memory percentages
    cpu_percent=$(echo "$output" | tail -1 | awk '{print $3}' | tr -d '%')
    mem_percent=$(echo "$output" | tail -1 | awk '{print $7}' | tr -d '%')

    echo "$cpu_percent $mem_percent"
}

# Function to get autoscale config from labels
get_autoscale_config() {
    local container=$1

    local min=$(docker inspect "$container" --format='{{index .Config.Labels "com.dlt.autoscale.min"}}' 2>/dev/null || echo "0")
    local max=$(docker inspect "$container" --format='{{index .Config.Labels "com.dlt.autoscale.max"}}' 2>/dev/null || echo "0")
    local target_cpu=$(docker inspect "$container" --format='{{index .Config.Labels "com.dlt.autoscale.target-cpu"}}' 2>/dev/null || echo "70")
    local target_mem=$(docker inspect "$container" --format='{{index .Config.Labels "com.dlt.autoscale.target-memory"}}' 2>/dev/null || echo "80")
    local scale_up_threshold=$(docker inspect "$container" --format='{{index .Config.Labels "com.dlt.autoscale.scale-up-threshold"}}' 2>/dev/null || echo "85")
    local scale_down_threshold=$(docker inspect "$container" --format='{{index .Config.Labels "com.dlt.autoscale.scale-down-threshold"}}' 2>/dev/null || echo "20")

    echo "$min $max $target_cpu $target_mem $scale_up_threshold $scale_down_threshold"
}

# Function to get current instance count
get_current_instances() {
    local container=$1

    # Check the running processes in container to count node instances
    # This depends on the startup script implementation
    docker exec "$container" ps aux 2>/dev/null | grep -c 'quarkus' || echo "0"
}

# Function to scale a container
scale_container() {
    local container=$1
    local new_count=$2

    if [ "$DRY_RUN" = true ]; then
        echo -e "${YELLOW}[DRY-RUN]${NC} Would scale $container to $new_count instances"
        return
    fi

    echo -e "${BLUE}[SCALING]${NC} Scaling $container to $new_count instances..."

    # Update environment variable for node count
    docker exec -d "$container" env NODE_COUNT=$new_count 2>/dev/null || true

    echo -e "${GREEN}✓${NC} Scale command sent to $container"
}

# Function to check and scale a node container
check_and_scale_node() {
    local container=$1
    local service_name=$(docker inspect "$container" --format='{{index .Config.Labels "com.dlt.service"}}' 2>/dev/null || echo "unknown")

    # Get current metrics
    read cpu mem <<< "$(get_container_metrics "$container")"

    # Get autoscale configuration
    read min max target_cpu target_mem scale_up scale_down <<< "$(get_autoscale_config "$container")"

    # Skip if autoscaling is not configured
    if [ "$min" = "0" ] || [ "$max" = "0" ]; then
        return
    fi

    # Get current instance count
    current=$(get_current_instances "$container")

    # Determine if we need to scale
    local should_scale_up=false
    local should_scale_down=false

    # Check scale-up condition
    if (( $(echo "$cpu > $scale_up" | bc -l) )) || (( $(echo "$mem > $scale_up" | bc -l) )); then
        if [ "$current" -lt "$max" ]; then
            should_scale_up=true
        fi
    fi

    # Check scale-down condition
    if (( $(echo "$cpu < $scale_down" | bc -l) )) && (( $(echo "$mem < $scale_down" | bc -l) )); then
        if [ "$current" -gt "$min" ]; then
            should_scale_down=true
        fi
    fi

    # Perform scaling
    if [ "$should_scale_up" = true ]; then
        local new_count=$((current + 1))
        if [ "$new_count" -le "$max" ]; then
            echo -e "${YELLOW}⬆${NC} $service_name (CPU: ${cpu}% Mem: ${mem}%) → Scale UP to $new_count (max: $max)"
            scale_container "$container" "$new_count"
        fi
    elif [ "$should_scale_down" = true ]; then
        local new_count=$((current - 1))
        if [ "$new_count" -ge "$min" ]; then
            echo -e "${YELLOW}⬇${NC} $service_name (CPU: ${cpu}% Mem: ${mem}%) → Scale DOWN to $new_count (min: $min)"
            scale_container "$container" "$new_count"
        fi
    else
        echo -e "${GREEN}✓${NC} $service_name (CPU: ${cpu}% Mem: ${mem}%) - No scaling needed (current: $current, min: $min, max: $max)"
    fi
}

# Main loop
while true; do
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} Checking node autoscaling status..."

    # Check all node containers
    for container in dlt-validator-nodes-multi dlt-business-nodes-1-multi dlt-business-nodes-2-multi dlt-slim-nodes-multi; do
        if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
            check_and_scale_node "$container"
        else
            echo -e "${YELLOW}⚠${NC} Container $container not running"
        fi
    done

    echo ""
    sleep "$CHECK_INTERVAL"
done
