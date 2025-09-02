#!/bin/bash

# 🚀 Aurigraph-DLT Development Environment Setup
# Comprehensive development environment initialization for quantum blockchain development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_header() {
    echo -e "\n${PURPLE}=== $1 ===${NC}\n"
}

# Check if running on macOS or Linux
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        log_info "Detected macOS"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        log_info "Detected Linux"
    else
        log_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log_header "Checking Prerequisites"
    
    # Check Node.js version
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        REQUIRED_NODE="20.0.0"
        if [ "$(printf '%s\n' "$REQUIRED_NODE" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_NODE" ]; then
            log_success "Node.js $NODE_VERSION is installed (>= $REQUIRED_NODE required)"
        else
            log_error "Node.js $NODE_VERSION is too old. Please install Node.js >= $REQUIRED_NODE"
            exit 1
        fi
    else
        log_error "Node.js is not installed. Please install Node.js >= 20.0.0"
        exit 1
    fi
    
    # Check npm version
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        log_success "npm $NPM_VERSION is installed"
    else
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check Git
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version | cut -d' ' -f3)
        log_success "Git $GIT_VERSION is installed"
    else
        log_error "Git is not installed"
        exit 1
    fi
    
    # Check Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
        log_success "Docker $DOCKER_VERSION is installed"
    else
        log_warning "Docker is not installed. Some features may not work."
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        COMPOSE_VERSION=$(docker-compose --version | cut -d' ' -f3 | cut -d',' -f1)
        log_success "Docker Compose $COMPOSE_VERSION is installed"
    else
        log_warning "Docker Compose is not installed. Some features may not work."
    fi
}

# Install development dependencies
install_dev_dependencies() {
    log_header "Installing Development Dependencies"
    
    # Install global npm packages
    log_info "Installing global npm packages..."
    npm install -g \
        typescript \
        ts-node \
        nodemon \
        prettier \
        eslint \
        @typescript-eslint/cli \
        hardhat-shorthand \
        solhint \
        mythril \
        slither-analyzer \
        @commitlint/cli \
        husky \
        lint-staged \
        concurrently \
        cross-env \
        rimraf \
        npm-run-all
    
    log_success "Global npm packages installed"
    
    # Install project dependencies
    log_info "Installing project dependencies..."
    
    # Root level dependencies
    if [ -f "package.json" ]; then
        log_info "Installing root dependencies..."
        npm install
    fi
    
    # AV10-7 dependencies
    if [ -d "aurigraph-av10-7" ]; then
        log_info "Installing AV10-7 dependencies..."
        cd aurigraph-av10-7
        npm install
        cd ..
    fi
    
    # UI dependencies
    if [ -d "aurigraph-av10-7/ui" ]; then
        log_info "Installing UI dependencies..."
        cd aurigraph-av10-7/ui
        npm install
        cd ../..
    fi
    
    # V9 dependencies
    if [ -d "aurigraph-v9" ]; then
        log_info "Installing V9 dependencies..."
        cd aurigraph-v9
        npm install
        cd ..
    fi
    
    log_success "All project dependencies installed"
}

# Setup environment variables
setup_environment() {
    log_header "Setting Up Environment Variables"
    
    # Create .env files if they don't exist
    if [ ! -f ".env" ]; then
        log_info "Creating root .env file..."
        cat > .env << EOF
# Aurigraph-DLT Development Environment Configuration
NODE_ENV=development
DEBUG=aurigraph:*

# Quantum Nexus Configuration
QUANTUM_NEXUS_PORT=8081
QUANTUM_NEXUS_HOST=localhost
QUANTUM_UNIVERSES=5
CONSCIOUSNESS_INTERFACE_ENABLED=true

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=aurigraph_dev
DB_USER=aurigraph
DB_PASSWORD=dev_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Monitoring Configuration
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
METRICS_ENABLED=true

# Security Configuration
JWT_SECRET=dev_jwt_secret_change_in_production
ENCRYPTION_KEY=dev_encryption_key_change_in_production

# API Configuration
API_PORT=3000
API_HOST=localhost
CORS_ORIGIN=http://localhost:3000,http://localhost:4000

# Blockchain Configuration
NETWORK=development
PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000001
RPC_URL=http://localhost:8545

# Testing Configuration
TEST_TIMEOUT=30000
COVERAGE_THRESHOLD=80

# Development Configuration
HOT_RELOAD=true
SOURCE_MAPS=true
VERBOSE_LOGGING=true
EOF
        log_success "Root .env file created"
    fi
    
    # AV10-7 environment
    if [ -d "aurigraph-av10-7" ] && [ ! -f "aurigraph-av10-7/.env" ]; then
        log_info "Creating AV10-7 .env file..."
        cat > aurigraph-av10-7/.env << EOF
# AV10-7 Quantum Nexus Development Configuration
NODE_ENV=development
PORT=8081
HOST=localhost

# Quantum Configuration
QUANTUM_UNIVERSES=5
PARALLEL_PROCESSING=true
CONSCIOUSNESS_INTERFACE=true
AUTONOMOUS_EVOLUTION=true
QUANTUM_SECURITY_LEVEL=6

# Consensus Configuration
CONSENSUS_ALGORITHM=HyperRAFT++
BLOCK_TIME=1000
MAX_TPS=5000000
FINALITY_TIME=3000

# Network Configuration
NETWORK_ID=10007
CHAIN_ID=10007
GENESIS_TIMESTAMP=1640995200

# Storage Configuration
DATA_DIR=./data
LOGS_DIR=./logs
BACKUP_DIR=./backups

# Monitoring Configuration
METRICS_PORT=9091
HEALTH_CHECK_PORT=8082
PROMETHEUS_ENABLED=true

# Development Configuration
DEBUG_MODE=true
VERBOSE_LOGS=true
HOT_RELOAD=true
AUTO_RESTART=true
EOF
        log_success "AV10-7 .env file created"
    fi
    
    log_success "Environment configuration completed"
}

# Main execution
main() {
    log_header "🌌 Aurigraph-DLT Development Environment Setup"
    log_info "Initializing comprehensive development environment for quantum blockchain development"
    
    detect_os
    check_prerequisites
    install_dev_dependencies
    setup_environment
    
    log_header "🎉 Development Environment Setup Complete!"
    log_success "Your Aurigraph-DLT development environment is ready!"
    log_info "Next steps:"
    echo -e "  ${CYAN}1.${NC} Review and customize .env files"
    echo -e "  ${CYAN}2.${NC} Run: ${YELLOW}cd aurigraph-av10-7 && npm run dev${NC}"
    echo -e "  ${CYAN}3.${NC} Run: ${YELLOW}cd aurigraph-av10-7/ui && npm run dev${NC}"
    echo -e "  ${CYAN}4.${NC} Access Quantum Nexus: ${YELLOW}http://localhost:8081${NC}"
    echo -e "  ${CYAN}5.${NC} Access UI Dashboard: ${YELLOW}http://localhost:3000${NC}"
}

# Run main function
main "$@"
