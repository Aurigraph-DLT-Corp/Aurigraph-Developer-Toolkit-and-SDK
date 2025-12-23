#!/bin/bash

# Quick Start Script for Aurigraph DLT Dev4
# Minimal deployment for testing and development

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo "🚀 Aurigraph DLT Dev4 - Quick Start"
echo "Domain: aurigraphdlt.dev4.aurex.in"
echo "=================================="

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Clear port 4004
log "Clearing port 4004..."
lsof -ti:4004 | xargs kill -9 2>/dev/null || true

# Quick cleanup
log "Quick cleanup..."
docker-compose -f docker-compose.production-dev4.yml down --remove-orphans 2>/dev/null || true

# Start core services only
log "Starting core services..."
docker-compose -f docker-compose.production-dev4.yml up -d aurigraph-v10 aurigraph-mock nginx management-dashboard

# Wait a moment for services to start
log "Waiting for services to start..."
sleep 10

# Check health
log "Checking service health..."
if curl -sf http://localhost:4004/health >/dev/null 2>&1; then
    log_success "✅ V10 service is healthy"
    PRIMARY_SERVICE="V10 (TypeScript)"
    PRIMARY_URL="http://localhost:4004"
elif curl -sf http://localhost:8080/health >/dev/null 2>&1; then
    log_success "✅ Mock service is healthy"
    PRIMARY_SERVICE="Mock (Fallback)"
    PRIMARY_URL="http://localhost:8080"
else
    log_warn "⚠️  Services may still be starting..."
    PRIMARY_SERVICE="Starting..."
    PRIMARY_URL="http://localhost"
fi

# Management dashboard check
if curl -sf http://localhost:3040/health >/dev/null 2>&1; then
    log_success "✅ Management dashboard is healthy"
fi

log_success "🎉 Quick start completed!"
echo ""
echo "📍 Access Points:"
echo "   Primary Service:      $PRIMARY_URL"
echo "   Management Dashboard: http://localhost:3040"
echo "   Mock Fallback:        http://localhost:8080"
echo ""
echo "🎯 Primary Service: $PRIMARY_SERVICE"
echo ""
echo "💡 For full deployment with monitoring: ./deploy-aurigraphdlt-dev4.sh"
echo "💡 To stop services: docker-compose -f docker-compose.production-dev4.yml down"