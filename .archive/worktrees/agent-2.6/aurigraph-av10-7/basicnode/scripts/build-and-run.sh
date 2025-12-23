#!/bin/bash

# Aurigraph Basic Node - Build and Run Script
# User-friendly deployment for Docker + Quarkus

echo "═══════════════════════════════════════════════════════"
echo "🚀 Aurigraph Basic Node v10.19.0"
echo "═══════════════════════════════════════════════════════"
echo "📋 Building and deploying basic node..."
echo ""

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"

# Check if AV10-18 platform is accessible
echo "🔗 Checking AV10-18 platform connectivity..."
if curl -s http://localhost:3018/api/v18/status >/dev/null 2>&1; then
    echo "✅ AV10-18 platform detected on port 3018"
    PLATFORM_URL="http://host.docker.internal:3018"
else
    echo "⚠️ AV10-18 platform not detected - basic node will run in standalone mode"
    PLATFORM_URL="http://localhost:3018"
fi

# Build the native image
echo ""
echo "🔨 Building Quarkus native image..."
./mvnw package -Dnative -DskipTests=true

if [ $? -eq 0 ]; then
    echo "✅ Native build completed successfully"
else
    echo "❌ Native build failed. Falling back to JVM mode..."
    ./mvnw package -DskipTests=true
fi

# Build Docker image
echo ""
echo "🐳 Building Docker image..."
docker build -t aurigraph/basicnode:10.19.0 .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully"
else
    echo "❌ Docker build failed"
    exit 1
fi

# Stop existing container if running
echo ""
echo "🛑 Stopping existing basic node container..."
docker stop aurigraph-basicnode 2>/dev/null || true
docker rm aurigraph-basicnode 2>/dev/null || true

# Run the container
echo ""
echo "🚀 Starting Aurigraph Basic Node..."
docker run -d \
    --name aurigraph-basicnode \
    --memory=512m \
    --cpus=2.0 \
    -p 8080:8080 \
    -e AURIGRAPH_PLATFORM_URL=$PLATFORM_URL \
    -e AURIGRAPH_NODE_ID=basic-node-$(date +%s) \
    --restart unless-stopped \
    --health-cmd="curl -f http://localhost:8080/q/health || exit 1" \
    --health-interval=30s \
    --health-timeout=10s \
    --health-retries=3 \
    aurigraph/basicnode:10.19.0

if [ $? -eq 0 ]; then
    echo "✅ Basic node container started successfully"
    echo ""
    echo "═══════════════════════════════════════════════════════"
    echo "🎉 Aurigraph Basic Node is ready!"
    echo "═══════════════════════════════════════════════════════"
    echo "📊 Web Interface: http://localhost:8080"
    echo "📡 API Endpoints: http://localhost:8080/api/node/*"
    echo "🏥 Health Check: http://localhost:8080/q/health"
    echo "📚 API Docs: http://localhost:8080/q/swagger-ui"
    echo "═══════════════════════════════════════════════════════"
    echo ""
    echo "🔍 Container Status:"
    docker ps --filter name=aurigraph-basicnode --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "📋 To view logs: docker logs -f aurigraph-basicnode"
    echo "🛑 To stop: docker stop aurigraph-basicnode"
else
    echo "❌ Failed to start basic node container"
    echo "📋 Checking Docker logs..."
    docker logs aurigraph-basicnode 2>/dev/null || echo "No logs available"
    exit 1
fi