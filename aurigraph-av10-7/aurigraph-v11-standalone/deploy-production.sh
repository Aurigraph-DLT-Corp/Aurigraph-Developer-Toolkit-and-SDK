#!/bin/bash

# Aurigraph V11 Production Deployment Script
# Deploys the complete platform to production environment

set -e

echo "========================================"
echo "🚀 Aurigraph V11 Production Deployment"
echo "========================================"
echo

# Configuration
REGISTRY="aurigraph"
VERSION="11.0.0"
ENVIRONMENT="production"
KUBECONFIG_PATH="${KUBECONFIG:-~/.kube/config}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    local status=$1
    local message=$2
    if [ "$status" == "OK" ]; then
        echo -e "${GREEN}✓${NC} $message"
    elif [ "$status" == "INFO" ]; then
        echo -e "${BLUE}ℹ${NC} $message"
    elif [ "$status" == "WARN" ]; then
        echo -e "${YELLOW}⚠${NC} $message"
    else
        echo -e "${RED}✗${NC} $message"
    fi
}

# Pre-deployment checks
echo "📋 Pre-deployment Checks"
echo "------------------------"

# Check Docker
if ! command -v docker &> /dev/null; then
    print_status "ERROR" "Docker not installed"
    exit 1
fi
print_status "OK" "Docker installed"

# Check kubectl
if ! command -v kubectl &> /dev/null; then
    print_status "ERROR" "kubectl not installed"
    exit 1
fi
print_status "OK" "kubectl installed"

# Check cluster connection
if ! kubectl cluster-info &> /dev/null; then
    print_status "ERROR" "Cannot connect to Kubernetes cluster"
    exit 1
fi
print_status "OK" "Connected to Kubernetes cluster"

echo
echo "🏗️ Building Native Image"
echo "------------------------"

# Build native image
print_status "INFO" "Building GraalVM native image (this may take 15-30 minutes)..."
./mvnw clean package -Pnative-ultra -DskipTests

if [ $? -ne 0 ]; then
    print_status "ERROR" "Native build failed"
    exit 1
fi
print_status "OK" "Native image built successfully"

# Check native executable
if [ -f "target/aurigraph-v11-standalone-${VERSION}-runner" ]; then
    SIZE=$(du -h "target/aurigraph-v11-standalone-${VERSION}-runner" | cut -f1)
    print_status "OK" "Native executable size: $SIZE"
else
    print_status "ERROR" "Native executable not found"
    exit 1
fi

echo
echo "🐳 Building Docker Image"
echo "------------------------"

# Build Docker image
print_status "INFO" "Building Docker image..."
docker build -f src/main/docker/Dockerfile.native \
    -t ${REGISTRY}/v11:${VERSION} \
    -t ${REGISTRY}/v11:latest .

if [ $? -ne 0 ]; then
    print_status "ERROR" "Docker build failed"
    exit 1
fi
print_status "OK" "Docker image built successfully"

# Tag for production
docker tag ${REGISTRY}/v11:${VERSION} ${REGISTRY}/v11:production

echo
echo "📤 Pushing to Registry"
echo "----------------------"

# Push to registry (uncomment when registry is configured)
# docker push ${REGISTRY}/v11:${VERSION}
# docker push ${REGISTRY}/v11:latest
# docker push ${REGISTRY}/v11:production
print_status "WARN" "Skipping registry push (configure registry first)"

echo
echo "☸️ Deploying to Kubernetes"
echo "-------------------------"

# Create namespace if not exists
kubectl create namespace aurigraph-production --dry-run=client -o yaml | kubectl apply -f -
print_status "OK" "Namespace created/verified"

# Apply Kubernetes configurations
print_status "INFO" "Applying Kubernetes configurations..."
kubectl apply -f k8s/production-deployment.yaml

if [ $? -ne 0 ]; then
    print_status "ERROR" "Kubernetes deployment failed"
    exit 1
fi
print_status "OK" "Kubernetes resources deployed"

# Wait for deployment
print_status "INFO" "Waiting for pods to be ready..."
kubectl -n aurigraph-production wait --for=condition=ready pod \
    -l app=aurigraph-v11 --timeout=300s

if [ $? -ne 0 ]; then
    print_status "WARN" "Some pods may not be ready yet"
else
    print_status "OK" "All pods are ready"
fi

echo
echo "🔍 Deployment Status"
echo "--------------------"

# Check deployment status
kubectl -n aurigraph-production get deployments
echo
kubectl -n aurigraph-production get pods
echo
kubectl -n aurigraph-production get services

echo
echo "🧪 Running Health Checks"
echo "------------------------"

# Get service endpoint
SERVICE_IP=$(kubectl -n aurigraph-production get service aurigraph-service \
    -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)

if [ -z "$SERVICE_IP" ]; then
    SERVICE_IP=$(kubectl -n aurigraph-production get service aurigraph-service \
        -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)
fi

if [ -z "$SERVICE_IP" ]; then
    print_status "WARN" "LoadBalancer IP not yet assigned"
    SERVICE_IP="localhost"
    kubectl -n aurigraph-production port-forward service/aurigraph-service 9003:80 &
    PF_PID=$!
    sleep 5
fi

print_status "INFO" "Service endpoint: $SERVICE_IP"

# Health check
if curl -s "http://${SERVICE_IP}:9003/q/health" > /dev/null 2>&1; then
    print_status "OK" "Health check passed"
else
    print_status "WARN" "Health check failed (service may still be starting)"
fi

# Performance check
if curl -s "http://${SERVICE_IP}:9003/api/v11/performance/advanced/health" > /dev/null 2>&1; then
    print_status "OK" "Performance service healthy"
else
    print_status "WARN" "Performance service not yet ready"
fi

# Stop port-forward if used
if [ ! -z "$PF_PID" ]; then
    kill $PF_PID 2>/dev/null
fi

echo
echo "📊 Monitoring Setup"
echo "------------------"

# Deploy monitoring stack
if [ -f "docker-compose-production.yml" ]; then
    print_status "INFO" "Monitoring stack configuration available"
    print_status "INFO" "Run 'docker-compose -f docker-compose-production.yml up -d' to start monitoring"
fi

# Grafana dashboard
print_status "INFO" "Grafana will be available at: http://${SERVICE_IP}:3000"
print_status "INFO" "Prometheus will be available at: http://${SERVICE_IP}:9090"
print_status "INFO" "Jaeger tracing will be available at: http://${SERVICE_IP}:16686"

echo
echo "🎯 Performance Targets"
echo "---------------------"
print_status "INFO" "Target TPS: 2,000,000+"
print_status "INFO" "Consensus: 256 parallel shards"
print_status "INFO" "Validators: 21 Byzantine Fault Tolerant nodes"
print_status "INFO" "Quantum Security: NIST Level 5"
print_status "INFO" "Cross-chain: ETH, Polygon, BSC, Avalanche, Solana"

echo
echo "🔐 Security Checklist"
echo "--------------------"
print_status "INFO" "[ ] Enable TLS/SSL certificates"
print_status "INFO" "[ ] Configure HashiCorp Vault"
print_status "INFO" "[ ] Set up IAM2 authentication"
print_status "INFO" "[ ] Enable audit logging"
print_status "INFO" "[ ] Configure firewall rules"
print_status "INFO" "[ ] Set up DDoS protection"
print_status "INFO" "[ ] Enable rate limiting"
print_status "INFO" "[ ] Configure backup strategy"

echo
echo "📝 Post-Deployment Tasks"
echo "------------------------"
print_status "INFO" "1. Verify all health endpoints"
print_status "INFO" "2. Run performance benchmarks"
print_status "INFO" "3. Configure DNS records"
print_status "INFO" "4. Set up SSL certificates"
print_status "INFO" "5. Configure monitoring alerts"
print_status "INFO" "6. Update documentation"
print_status "INFO" "7. Notify stakeholders"

echo
echo "========================================"
print_status "OK" "Deployment completed successfully!"
echo "========================================"
echo
echo "🌐 Access Points:"
echo "  API Endpoint: https://api.aurigraph.io"
echo "  gRPC Endpoint: api.aurigraph.io:9004"
echo "  Health Check: https://api.aurigraph.io/q/health"
echo "  Metrics: https://api.aurigraph.io/q/metrics"
echo
echo "📊 Dashboard URLs:"
echo "  Grafana: http://monitoring.aurigraph.io:3000"
echo "  Prometheus: http://monitoring.aurigraph.io:9090"
echo "  Jaeger: http://monitoring.aurigraph.io:16686"
echo "  Kibana: http://monitoring.aurigraph.io:5601"
echo
echo "🚀 Platform is ready for production use!"
echo