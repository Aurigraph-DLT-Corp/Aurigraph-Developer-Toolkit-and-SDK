#!/bin/bash
# =============================================================================
# Aurigraph DLT - Node Manager
# =============================================================================
# Utility script for managing multi-node deployments
# =============================================================================

ACTION=${1:-help}
NODE_COUNT=${NODE_COUNT:-1}
BASE_PORT=${BASE_PORT:-9000}

case "$ACTION" in
    health-check)
        # Check health of all nodes
        HEALTHY=0
        for i in $(seq 0 $((NODE_COUNT - 1))); do
            PORT=$((BASE_PORT + i))
            if curl -sf "http://localhost:${PORT}/api/v11/health" > /dev/null 2>&1; then
                HEALTHY=$((HEALTHY + 1))
            fi
        done

        # At least one node must be healthy
        if [ "$HEALTHY" -gt 0 ]; then
            echo "Healthy: ${HEALTHY}/${NODE_COUNT}"
            exit 0
        else
            echo "No healthy nodes"
            exit 1
        fi
        ;;

    status)
        echo "Node Status:"
        echo "============"
        for i in $(seq 0 $((NODE_COUNT - 1))); do
            PORT=$((BASE_PORT + i))
            STATUS=$(curl -sf "http://localhost:${PORT}/api/v11/health" 2>/dev/null || echo '{"status":"DOWN"}')
            echo "Node $i (port $PORT): $(echo $STATUS | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
        done
        ;;

    metrics)
        echo "Node Metrics:"
        echo "============="
        for i in $(seq 0 $((NODE_COUNT - 1))); do
            PORT=$((BASE_PORT + i))
            echo "--- Node $i (port $PORT) ---"
            curl -sf "http://localhost:${PORT}/api/v11/stats" 2>/dev/null || echo "Unavailable"
            echo ""
        done
        ;;

    logs)
        NODE_NUM=${2:-0}
        NODE_ID="${NODE_ID_PREFIX:-node}-${NODE_TYPE,,}-$(printf '%03d' $NODE_NUM)"
        if [ -f "/app/logs/${NODE_ID}/node.log" ]; then
            tail -100 "/app/logs/${NODE_ID}/node.log"
        else
            echo "No logs found for node $NODE_NUM"
        fi
        ;;

    restart)
        NODE_NUM=${2:-all}
        if [ "$NODE_NUM" = "all" ]; then
            echo "Restarting all nodes..."
            kill -HUP 1
        else
            echo "Single node restart not implemented - restart container"
        fi
        ;;

    help|*)
        echo "Aurigraph Node Manager"
        echo ""
        echo "Usage: $0 <action> [options]"
        echo ""
        echo "Actions:"
        echo "  health-check  Check health of all nodes"
        echo "  status        Show status of all nodes"
        echo "  metrics       Show metrics from all nodes"
        echo "  logs [n]      Show logs for node n (default: 0)"
        echo "  restart [n]   Restart node n or all nodes"
        echo "  help          Show this help message"
        ;;
esac
