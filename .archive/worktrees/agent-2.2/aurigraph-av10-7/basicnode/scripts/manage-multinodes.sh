#!/bin/bash

# Multi-Node Management Script for Aurigraph Basic Nodes
# Provides commands to manage multiple node deployments

command=$1
node_count=${2:-3}

show_help() {
    echo "═══════════════════════════════════════════════════════"
    echo "🚀 Aurigraph Multi-Node Management"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "Usage: $0 <command> [node_count]"
    echo ""
    echo "Commands:"
    echo "  start [N]     - Start N nodes in single container (default: 3)"
    echo "  individual    - Start nodes as individual containers"
    echo "  stop          - Stop all nodes"
    echo "  restart       - Restart all nodes"
    echo "  status        - Show status of all nodes"
    echo "  logs [N]      - Show logs for node N (or all if not specified)"
    echo "  health        - Check health of all nodes"
    echo "  scale N       - Scale to N nodes"
    echo "  clean         - Remove all containers and volumes"
    echo ""
    echo "Examples:"
    echo "  $0 start 5              # Start 5 nodes in single container"
    echo "  $0 individual           # Start 3 individual containers"
    echo "  $0 logs 2               # Show logs for node 2"
    echo "  $0 scale 10             # Scale to 10 nodes"
    echo "═══════════════════════════════════════════════════════"
}

start_multinodes() {
    echo "🚀 Starting $node_count nodes in single container..."
    
    # Stop existing container
    docker stop aurigraph-multinodes 2>/dev/null || true
    docker rm aurigraph-multinodes 2>/dev/null || true
    
    # Build multi-node image
    docker build -f Dockerfile.multi -t aurigraph/multinodes:10.19.0 .
    
    # Calculate resource requirements
    memory_mb=$((node_count * 128 + 256))  # 128MB per node + overhead
    cpu_cores=$((node_count + 1))          # 1 core per node + overhead
    
    # Create port mapping
    port_args=""
    for i in $(seq 1 $node_count); do
        port=$((8079 + i))
        port_args="$port_args -p $port:$port"
    done
    
    # Run multi-node container
    docker run -d \
        --name aurigraph-multinodes \
        --memory=${memory_mb}m \
        --cpus=$cpu_cores \
        $port_args \
        -p 9080:80 \
        -e NODE_COUNT=$node_count \
        -e AURIGRAPH_PLATFORM_URL=http://host.docker.internal:3018 \
        --restart unless-stopped \
        aurigraph/multinodes:10.19.0
    
    echo "✅ Multi-node container started with $node_count nodes"
    echo "📊 Access points:"
    for i in $(seq 1 $node_count); do
        port=$((8079 + i))
        echo "   Node $i: http://localhost:$port"
    done
    echo "   Load Balancer: http://localhost:9080"
}

start_individual() {
    echo "🚀 Starting individual node containers..."
    
    # Use individual profile
    docker-compose -f docker-compose.multi.yml --profile individual up -d
    
    echo "✅ Individual containers started:"
    echo "   Node 1: http://localhost:8080"
    echo "   Node 2: http://localhost:8081" 
    echo "   Node 3: http://localhost:8082"
    echo "   Load Balancer: http://localhost:9080"
}

stop_nodes() {
    echo "🛑 Stopping all Aurigraph nodes..."
    
    # Stop multi-node container
    docker stop aurigraph-multinodes 2>/dev/null || true
    
    # Stop individual containers
    docker-compose -f docker-compose.multi.yml --profile individual down
    
    echo "✅ All nodes stopped"
}

show_status() {
    echo "📊 Aurigraph Node Status:"
    echo ""
    
    # Check multi-node container
    if docker ps --filter name=aurigraph-multinodes --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q aurigraph-multinodes; then
        echo "🔗 Multi-Node Container:"
        docker ps --filter name=aurigraph-multinodes --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
    fi
    
    # Check individual containers
    if docker ps --filter name=aurigraph-node --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q aurigraph-node; then
        echo "📦 Individual Containers:"
        docker ps --filter name=aurigraph-node --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
    fi
    
    # Check nginx load balancer
    if docker ps --filter name=aurigraph-nginx-lb --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q nginx; then
        echo "⚖️ Load Balancer:"
        docker ps --filter name=aurigraph-nginx-lb --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    fi
}

show_logs() {
    local node_num=$2
    
    if [ -n "$node_num" ]; then
        echo "📋 Logs for Node $node_num:"
        docker logs -f aurigraph-node$node_num 2>/dev/null || \
        docker exec aurigraph-multinodes tail -f /work/logs/node$node_num.log 2>/dev/null || \
        echo "❌ No logs found for node $node_num"
    else
        echo "📋 All Node Logs:"
        docker logs -f aurigraph-multinodes 2>/dev/null || \
        docker-compose -f docker-compose.multi.yml --profile individual logs -f
    fi
}

check_health() {
    echo "🏥 Health Check for All Nodes:"
    echo ""
    
    # Check individual containers first
    for i in 1 2 3; do
        port=$((8079 + i))
        if curl -s -f http://localhost:$port/q/health >/dev/null 2>&1; then
            echo "✅ Node $i (port $port): Healthy"
        else
            echo "❌ Node $i (port $port): Unhealthy or not running"
        fi
    done
    
    # Check load balancer
    if curl -s -f http://localhost:9080/q/health >/dev/null 2>&1; then
        echo "✅ Load Balancer (port 9080): Healthy"
    else
        echo "❌ Load Balancer (port 9080): Unavailable"
    fi
}

scale_nodes() {
    local target_count=$2
    echo "📈 Scaling to $target_count nodes..."
    
    # Stop current deployment
    stop_nodes
    
    # Start with new count
    start_multinodes $target_count
    
    echo "✅ Scaled to $target_count nodes"
}

clean_all() {
    echo "🧹 Cleaning all containers and volumes..."
    
    # Stop and remove all containers
    docker stop aurigraph-multinodes aurigraph-node1 aurigraph-node2 aurigraph-node3 aurigraph-nginx-lb 2>/dev/null || true
    docker rm aurigraph-multinodes aurigraph-node1 aurigraph-node2 aurigraph-node3 aurigraph-nginx-lb 2>/dev/null || true
    
    # Remove volumes
    docker volume rm aurigraph-av10-7_multinodes_data aurigraph-av10-7_multinodes_logs \
                    aurigraph-av10-7_node1_data aurigraph-av10-7_node2_data aurigraph-av10-7_node3_data 2>/dev/null || true
    
    # Remove images
    docker rmi aurigraph/multinodes:10.19.0 aurigraph/basicnode:10.19.0 2>/dev/null || true
    
    echo "✅ Cleanup complete"
}

# Main command handling
case "$command" in
    "start")
        start_multinodes $node_count
        ;;
    "individual")
        start_individual
        ;;
    "stop")
        stop_nodes
        ;;
    "restart")
        stop_nodes
        sleep 3
        start_multinodes $node_count
        ;;
    "status")
        show_status
        ;;
    "logs")
        show_logs $@
        ;;
    "health")
        check_health
        ;;
    "scale")
        scale_nodes $@
        ;;
    "clean")
        clean_all
        ;;
    "help"|"--help"|"-h")
        show_help
        ;;
    *)
        echo "❌ Unknown command: $command"
        echo ""
        show_help
        exit 1
        ;;
esac