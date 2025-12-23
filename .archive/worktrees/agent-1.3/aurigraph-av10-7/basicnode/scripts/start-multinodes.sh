#!/bin/bash

# Multi-Node Startup Script for Aurigraph Basic Nodes
# Manages multiple node instances in a single container

echo "═══════════════════════════════════════════════════════"
echo "🚀 Aurigraph Multi-Node Container v10.19.0"
echo "═══════════════════════════════════════════════════════"

# Configuration
NODE_COUNT=${NODE_COUNT:-3}
BASE_PORT=8080
PLATFORM_URL=${AURIGRAPH_PLATFORM_URL:-"http://host.docker.internal:3018"}

echo "📊 Starting $NODE_COUNT basic nodes..."
echo "🌐 Platform URL: $PLATFORM_URL"
echo "🚪 Port range: $BASE_PORT-$((BASE_PORT + NODE_COUNT - 1))"
echo ""

# Create log directory
mkdir -p /work/logs

# Function to start a single node
start_node() {
    local node_num=$1
    local port=$((BASE_PORT + node_num - 1))
    local node_id="basic-node-$node_num"
    local work_dir="/work/node$node_num"
    
    echo "🎯 Starting node $node_num on port $port..."
    
    cd $work_dir
    nohup java \
        -Xmx128m \
        -XX:+UseG1GC \
        -XX:+UseStringDeduplication \
        -Dquarkus.http.port=$port \
        -Daurigraph.node.id=$node_id \
        -Daurigraph.node.port=$port \
        -Daurigraph.platform.url=$PLATFORM_URL \
        -jar quarkus-run.jar \
        > /work/logs/node$node_num.log 2>&1 &
    
    local pid=$!
    echo $pid > /work/node$node_num.pid
    echo "✅ Node $node_num started (PID: $pid)"
}

# Function to check node health
check_node_health() {
    local port=$1
    local node_num=$2
    local max_attempts=30
    local attempt=1
    
    echo "🏥 Checking health for node $node_num on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f http://localhost:$port/q/health >/dev/null 2>&1; then
            echo "✅ Node $node_num is healthy"
            return 0
        fi
        
        echo "⏳ Attempt $attempt/$max_attempts - waiting for node $node_num..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo "❌ Node $node_num failed health check after $max_attempts attempts"
    return 1
}

# Function to create nginx load balancer config
create_nginx_config() {
    cat > /work/nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream aurigraph_nodes {
$(for i in $(seq 1 $NODE_COUNT); do
    port=$((BASE_PORT + i - 1))
    echo "        server localhost:$port;"
done)
    }
    
    server {
        listen 80;
        server_name localhost;
        
        location / {
            proxy_pass http://aurigraph_nodes;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        location /api/ {
            proxy_pass http://aurigraph_nodes;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
        
        location /q/health {
            proxy_pass http://aurigraph_nodes;
        }
    }
}
EOF
    
    echo "🔧 Nginx load balancer configuration created"
}

# Start all nodes
echo "🚀 Starting $NODE_COUNT Aurigraph basic nodes..."
for i in $(seq 1 $NODE_COUNT); do
    start_node $i
    sleep 3  # Stagger startup to avoid resource conflicts
done

echo ""
echo "⏳ Waiting for nodes to start up..."
sleep 10

# Check health of all nodes
echo ""
echo "🏥 Performing health checks..."
all_healthy=true
for i in $(seq 1 $NODE_COUNT); do
    port=$((BASE_PORT + i - 1))
    if ! check_node_health $port $i; then
        all_healthy=false
    fi
done

# Create load balancer if nginx is available
if command -v nginx >/dev/null 2>&1; then
    create_nginx_config
    echo "🔧 Starting nginx load balancer..."
    nginx -c /work/nginx.conf -g "daemon off;" &
    echo $! > /work/nginx.pid
fi

echo ""
if [ "$all_healthy" = true ]; then
    echo "═══════════════════════════════════════════════════════"
    echo "🎉 All $NODE_COUNT Aurigraph nodes started successfully!"
    echo "═══════════════════════════════════════════════════════"
    echo "📊 Node Access Points:"
    for i in $(seq 1 $NODE_COUNT); do
        port=$((BASE_PORT + i - 1))
        echo "   Node $i: http://localhost:$port"
    done
    if command -v nginx >/dev/null 2>&1; then
        echo "   Load Balancer: http://localhost:80"
    fi
    echo "═══════════════════════════════════════════════════════"
else
    echo "❌ Some nodes failed to start. Check logs for details."
    exit 1
fi

# Monitor function
monitor_nodes() {
    echo "📊 Monitoring $NODE_COUNT nodes..."
    while true; do
        sleep 30
        
        for i in $(seq 1 $NODE_COUNT); do
            port=$((BASE_PORT + i - 1))
            pid_file="/work/node$i.pid"
            
            if [ -f "$pid_file" ]; then
                pid=$(cat $pid_file)
                if ! kill -0 $pid 2>/dev/null; then
                    echo "❌ Node $i (PID: $pid) has stopped. Restarting..."
                    start_node $i
                fi
            fi
        done
    done
}

# Start monitoring in background
monitor_nodes &
monitor_pid=$!
echo $monitor_pid > /work/monitor.pid

echo "🔍 Multi-node monitoring started (PID: $monitor_pid)"
echo "📋 Logs available in: /work/logs/"
echo "🛑 To stop all nodes: pkill -f 'java.*quarkus-run.jar'"

# Keep script running
wait