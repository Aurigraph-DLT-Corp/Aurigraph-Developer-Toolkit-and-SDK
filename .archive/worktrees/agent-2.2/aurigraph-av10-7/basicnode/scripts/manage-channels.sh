#!/bin/bash

# Channel-Based Multi-Node Management Script
# Manages multiple nodes joining specific channels

command=$1
channel_type=$2
node_count=${3:-2}

show_help() {
    echo "═══════════════════════════════════════════════════════"
    echo "🎯 Aurigraph Channel-Based Node Management"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "Usage: $0 <command> [channel_type] [node_count]"
    echo ""
    echo "Commands:"
    echo "  start <type> [N]  - Start N nodes for specific channel type"
    echo "  stop <type>       - Stop nodes for specific channel type"
    echo "  all               - Start all channel types"
    echo "  status            - Show status of all channel nodes"
    echo "  channels          - List available channels"
    echo "  join <id>         - Join specific channel"
    echo "  leave <id>        - Leave specific channel"
    echo "  health            - Check health of all channels"
    echo "  logs <type>       - Show logs for channel type"
    echo "  scale <type> N    - Scale channel to N nodes"
    echo "  clean             - Remove all channel containers"
    echo ""
    echo "Channel Types:"
    echo "  consensus         - Consensus participation nodes"
    echo "  defi              - DeFi transaction processing nodes"
    echo "  geo-us            - US geographic region nodes"
    echo "  processing        - General transaction processing"
    echo "  security          - Security-specialized nodes"
    echo ""
    echo "Examples:"
    echo "  $0 start consensus 3      # Start 3 consensus nodes"
    echo "  $0 start defi 5           # Start 5 DeFi processing nodes"
    echo "  $0 all                    # Start all channel types"
    echo "  $0 join consensus-primary # Join consensus channel"
    echo "  $0 scale defi 10          # Scale DeFi to 10 nodes"
    echo "═══════════════════════════════════════════════════════"
}

start_channel_nodes() {
    local type=$1
    local count=$2
    
    echo "🚀 Starting $count nodes for channel type: $type"
    
    case "$type" in
        "consensus")
            start_consensus_nodes $count
            ;;
        "defi")
            start_defi_nodes $count
            ;;
        "geo-us")
            start_geo_us_nodes $count
            ;;
        "all")
            start_all_channels
            ;;
        *)
            echo "❌ Unknown channel type: $type"
            echo "Available types: consensus, defi, geo-us"
            exit 1
            ;;
    esac
}

start_consensus_nodes() {
    local count=$1
    echo "🏛️ Starting $count consensus nodes..."
    
    # Use the consensus profile from docker-compose
    docker-compose -f docker-compose.channels.yml up -d consensus-node1 consensus-node2 consensus-node3 consensus-lb
    
    echo "✅ Consensus nodes started:"
    echo "   Node 1: http://localhost:8100"
    echo "   Node 2: http://localhost:8101"
    echo "   Node 3: http://localhost:8102"
    echo "   Load Balancer: http://localhost:9100"
}

start_defi_nodes() {
    local count=$1
    echo "💰 Starting $count DeFi processing nodes..."
    
    docker-compose -f docker-compose.channels.yml up -d defi-node1 defi-node2 defi-lb
    
    echo "✅ DeFi nodes started:"
    echo "   Node 1: http://localhost:8110"
    echo "   Node 2: http://localhost:8111"
    echo "   Load Balancer: http://localhost:9110"
}

start_geo_us_nodes() {
    local count=$1
    echo "🌎 Starting $count US geographic nodes..."
    
    docker-compose -f docker-compose.channels.yml up -d geo-us-node1 geo-us-node2 geo-us-lb
    
    echo "✅ US geographic nodes started:"
    echo "   Node 1: http://localhost:8120"
    echo "   Node 2: http://localhost:8121"
    echo "   Load Balancer: http://localhost:9120"
}

start_all_channels() {
    echo "🌟 Starting all channel types..."
    
    docker-compose -f docker-compose.channels.yml up -d
    
    echo "✅ All channels started:"
    echo ""
    echo "🏛️ Consensus Channel:"
    echo "   Nodes: http://localhost:8100-8102"
    echo "   Load Balancer: http://localhost:9100"
    echo ""
    echo "💰 DeFi Processing Channel:"
    echo "   Nodes: http://localhost:8110-8111"
    echo "   Load Balancer: http://localhost:9110"
    echo ""
    echo "🌎 US Geographic Channel:"
    echo "   Nodes: http://localhost:8120-8121"
    echo "   Load Balancer: http://localhost:9120"
    echo ""
    echo "🎯 Channel Manager: http://localhost:8200"
}

stop_channel_nodes() {
    local type=$1
    
    echo "🛑 Stopping $type channel nodes..."
    
    case "$type" in
        "consensus")
            docker-compose -f docker-compose.channels.yml stop consensus-node1 consensus-node2 consensus-node3 consensus-lb
            ;;
        "defi")
            docker-compose -f docker-compose.channels.yml stop defi-node1 defi-node2 defi-lb
            ;;
        "geo-us")
            docker-compose -f docker-compose.channels.yml stop geo-us-node1 geo-us-node2 geo-us-lb
            ;;
        "all")
            docker-compose -f docker-compose.channels.yml down
            ;;
        *)
            echo "❌ Unknown channel type: $type"
            exit 1
            ;;
    esac
    
    echo "✅ $type nodes stopped"
}

show_status() {
    echo "📊 Channel Node Status:"
    echo ""
    
    # Check consensus nodes
    echo "🏛️ Consensus Channel:"
    docker ps --filter label=com.aurigraph.channel=consensus-primary --format "   {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    # Check DeFi nodes
    echo ""
    echo "💰 DeFi Processing Channel:"
    docker ps --filter label=com.aurigraph.channel=processing-defi --format "   {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    # Check geographic nodes
    echo ""
    echo "🌎 US Geographic Channel:"
    docker ps --filter label=com.aurigraph.channel=geographic-us --format "   {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    # Check load balancers
    echo ""
    echo "⚖️ Load Balancers:"
    docker ps --filter label=com.aurigraph.service=load-balancer --format "   {{.Names}}\t{{.Status}}\t{{.Ports}}"
    
    # Check channel manager
    echo ""
    echo "🎯 Channel Manager:"
    docker ps --filter label=com.aurigraph.service=channel-manager --format "   {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

list_channels() {
    echo "📋 Available Channels:"
    echo ""
    echo "🏛️ consensus-primary (CONSENSUS)"
    echo "   Purpose: HyperRAFT++ consensus participation"
    echo "   Nodes: 3 recommended minimum"
    echo "   Load Balancer: http://localhost:9100"
    echo ""
    echo "💰 processing-defi (PROCESSING)"
    echo "   Purpose: DeFi transaction processing"
    echo "   Specialization: Trading, liquidity, yield"
    echo "   Load Balancer: http://localhost:9110"
    echo ""
    echo "🌎 geographic-us (GEOGRAPHIC)"
    echo "   Purpose: US regional compliance"
    echo "   Jurisdiction: US regulations"
    echo "   Load Balancer: http://localhost:9120"
    echo ""
    echo "🎯 Channel Manager API: http://localhost:8200/api/channels/*"
}

join_channel() {
    local channel_id=$2
    
    if [ -z "$channel_id" ]; then
        echo "❌ Channel ID required"
        echo "Usage: $0 join <channel_id>"
        echo "Example: $0 join consensus-primary"
        exit 1
    fi
    
    echo "🔗 Joining channel: $channel_id"
    
    # Use channel manager API to join channel
    response=$(curl -s -X POST http://localhost:8200/api/channels/$channel_id/join)
    
    if echo "$response" | grep -q "Successfully joined"; then
        echo "✅ Successfully joined channel: $channel_id"
    else
        echo "❌ Failed to join channel: $channel_id"
        echo "Response: $response"
    fi
}

leave_channel() {
    local channel_id=$2
    
    if [ -z "$channel_id" ]; then
        echo "❌ Channel ID required"
        echo "Usage: $0 leave <channel_id>"
        exit 1
    fi
    
    echo "👋 Leaving channel: $channel_id"
    
    # Use channel manager API to leave channel
    response=$(curl -s -X DELETE http://localhost:8200/api/channels/$channel_id/leave)
    
    if echo "$response" | grep -q "Successfully left"; then
        echo "✅ Successfully left channel: $channel_id"
    else
        echo "❌ Failed to leave channel: $channel_id"
        echo "Response: $response"
    fi
}

check_health() {
    echo "🏥 Channel Health Check:"
    echo ""
    
    # Check consensus channel
    echo "🏛️ Consensus Channel Health:"
    for port in 8100 8101 8102; do
        if curl -s -f http://localhost:$port/q/health >/dev/null 2>&1; then
            echo "   ✅ Consensus node (port $port): Healthy"
        else
            echo "   ❌ Consensus node (port $port): Unhealthy"
        fi
    done
    
    # Check DeFi channel
    echo ""
    echo "💰 DeFi Processing Channel Health:"
    for port in 8110 8111; do
        if curl -s -f http://localhost:$port/q/health >/dev/null 2>&1; then
            echo "   ✅ DeFi node (port $port): Healthy"
        else
            echo "   ❌ DeFi node (port $port): Unhealthy"
        fi
    done
    
    # Check geographic channel
    echo ""
    echo "🌎 US Geographic Channel Health:"
    for port in 8120 8121; do
        if curl -s -f http://localhost:$port/q/health >/dev/null 2>&1; then
            echo "   ✅ US geo node (port $port): Healthy"
        else
            echo "   ❌ US geo node (port $port): Unhealthy"
        fi
    done
    
    # Check load balancers
    echo ""
    echo "⚖️ Load Balancer Health:"
    for port in 9100 9110 9120; do
        if curl -s -f http://localhost:$port/lb/status >/dev/null 2>&1; then
            echo "   ✅ Load balancer (port $port): Healthy"
        else
            echo "   ❌ Load balancer (port $port): Unhealthy"
        fi
    done
    
    # Check channel manager
    echo ""
    echo "🎯 Channel Manager Health:"
    if curl -s -f http://localhost:8200/q/health >/dev/null 2>&1; then
        echo "   ✅ Channel Manager: Healthy"
    else
        echo "   ❌ Channel Manager: Unhealthy"
    fi
}

show_logs() {
    local type=$2
    
    echo "📋 Logs for $type channel:"
    
    case "$type" in
        "consensus")
            docker-compose -f docker-compose.channels.yml logs -f consensus-node1 consensus-node2 consensus-node3
            ;;
        "defi")
            docker-compose -f docker-compose.channels.yml logs -f defi-node1 defi-node2
            ;;
        "geo-us")
            docker-compose -f docker-compose.channels.yml logs -f geo-us-node1 geo-us-node2
            ;;
        "manager")
            docker-compose -f docker-compose.channels.yml logs -f channel-manager
            ;;
        *)
            echo "❌ Specify channel type: consensus, defi, geo-us, manager"
            exit 1
            ;;
    esac
}

scale_channel() {
    local type=$2
    local target_count=$3
    
    echo "📈 Scaling $type channel to $target_count nodes..."
    
    # For now, scaling requires manual docker-compose modification
    # In production, this would use Kubernetes or Docker Swarm
    
    case "$type" in
        "consensus")
            if [ "$target_count" -lt 3 ]; then
                echo "⚠️ Consensus requires minimum 3 nodes for HyperRAFT++"
                target_count=3
            fi
            echo "🏛️ Consensus channel scaled to $target_count nodes"
            ;;
        "defi")
            echo "💰 DeFi processing channel scaled to $target_count nodes"
            ;;
        "geo-us")
            echo "🌎 US geographic channel scaled to $target_count nodes"
            ;;
        *)
            echo "❌ Unknown channel type: $type"
            exit 1
            ;;
    esac
    
    echo "⚠️ Note: Actual scaling requires updating docker-compose.channels.yml"
    echo "   Or use Kubernetes/Swarm for dynamic scaling"
}

clean_all() {
    echo "🧹 Cleaning all channel containers and volumes..."
    
    docker-compose -f docker-compose.channels.yml down -v
    
    # Remove any orphaned containers
    docker rm -f $(docker ps -a --filter label=com.aurigraph.channel --format "{{.Names}}") 2>/dev/null || true
    
    echo "✅ All channel containers and volumes removed"
}

# Performance monitoring
monitor_performance() {
    echo "📊 Channel Performance Monitor:"
    echo ""
    
    # Get metrics from each channel type
    echo "🏛️ Consensus Channel Performance:"
    curl -s http://localhost:9100/lb/consensus/stats | jq 2>/dev/null || echo "   Load balancer not available"
    
    echo ""
    echo "💰 DeFi Channel Performance:"
    curl -s http://localhost:9110/lb/defi/stats | jq 2>/dev/null || echo "   Load balancer not available"
    
    echo ""
    echo "🌎 Geographic Channel Performance:"
    curl -s http://localhost:9120/lb/geo/stats | jq 2>/dev/null || echo "   Load balancer not available"
    
    echo ""
    echo "📈 Resource Usage:"
    docker stats --no-stream --filter label=com.aurigraph.channel
}

# Main command handling
case "$command" in
    "start")
        start_channel_nodes $channel_type $node_count
        ;;
    "stop")
        stop_channel_nodes $channel_type
        ;;
    "all")
        start_all_channels
        ;;
    "status")
        show_status
        ;;
    "channels")
        list_channels
        ;;
    "join")
        join_channel $@
        ;;
    "leave")
        leave_channel $@
        ;;
    "health")
        check_health
        ;;
    "logs")
        show_logs $@
        ;;
    "scale")
        scale_channel $@
        ;;
    "monitor")
        monitor_performance
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