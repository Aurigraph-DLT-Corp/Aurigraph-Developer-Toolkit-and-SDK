#!/bin/bash

# Aurigraph AV11-7 Docker Deployment Script

echo "═══════════════════════════════════════════════════════"
echo "🚀 Aurigraph AV11-7 Docker Deployment"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH!"
    echo ""
    echo "Please install Docker Desktop:"
    echo "1. Open Docker Desktop from Applications"
    echo "2. Or download from: https://www.docker.com/products/docker-desktop"
    echo ""
    echo "For macOS, you can also add Docker to PATH:"
    echo "export PATH=/Applications/Docker.app/Contents/Resources/bin:\$PATH"
    echo ""
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running!"
    echo ""
    echo "Please start Docker Desktop:"
    echo "1. Open Docker Desktop from Applications"
    echo "2. Wait for Docker to start (icon in menu bar)"
    echo "3. Run this script again"
    echo ""
    exit 1
fi

echo "✅ Docker is installed and running"
echo ""

# Create missing Dockerfiles
echo "📝 Creating Dockerfile.monitoring..."
cat > Dockerfile.monitoring << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Run the application
CMD ["node", "dist/api/MonitoringAPIServer.js"]
EOF

echo "📝 Creating Dockerfile.vizor..."
cat > Dockerfile.vizor << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3038

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3038/health || exit 1

# Run the application
CMD ["node", "dist/monitoring/VizorDashboard.js"]
EOF

echo "📝 Creating Dockerfile.validator..."
cat > Dockerfile.validator << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Expose consensus port
EXPOSE 8181

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8181/health || exit 1

# Run validator node
CMD ["node", "dist/consensus/ValidatorNode.js"]
EOF

echo "📝 Creating prometheus.yml..."
cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'aurigraph-platform'
    static_configs:
      - targets: ['fastapi-platform:3100']
      
  - job_name: 'validators'
    static_configs:
      - targets: ['validator-1:8181', 'validator-2:8181', 'validator-3:8181']
      
  - job_name: 'monitoring'
    static_configs:
      - targets: ['monitoring-api:3001']
EOF

echo ""
echo "🔨 Building Docker images..."
echo ""

# Build images
docker-compose build --parallel

echo ""
echo "🚀 Starting Aurigraph AV11-7 containers..."
echo ""

# Start containers
docker-compose up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 10

echo ""
echo "📊 Container Status:"
docker-compose ps

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ Aurigraph AV11-7 Docker Deployment Complete!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "🌐 Access Points:"
echo "   • Web UI: http://localhost:8080"
echo "   • FastAPI Platform: http://localhost:3100"
echo "   • API Documentation: http://localhost:3100/docs"
echo "   • Management Dashboard: http://localhost:3040"
echo "   • Monitoring API: http://localhost:3001"
echo "   • Vizor Dashboard: http://localhost:3038"
echo "   • Prometheus: http://localhost:9090"
echo "   • Grafana: http://localhost:3000 (admin/admin)"
echo ""
echo "📊 Performance Targets:"
echo "   • TPS: 1,000,000+"
echo "   • Latency: <500ms"
echo "   • Validators: 3 (scalable)"
echo "   • Quantum Security: NIST Level 5"
echo ""
echo "🛠️ Useful Commands:"
echo "   • View logs: docker-compose logs -f [service-name]"
echo "   • Stop all: docker-compose down"
echo "   • Scale validators: docker-compose up -d --scale validator=10"
echo "   • View stats: docker stats"
echo ""
echo "═══════════════════════════════════════════════════════"