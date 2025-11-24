#!/bin/bash

# Quick Local Deployment Script for Aurigraph
# Simplified wrapper for the main deployment master script

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAIN_SCRIPT="$SCRIPT_DIR/local-deployment-master.sh"
VALIDATOR_SCRIPT="$SCRIPT_DIR/local-deployment-validator.js"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    AURIGRAPH LOCAL DEPLOY                   ║"
    echo "║                                                              ║"
    echo "║  🚀 High-Performance Blockchain Platform                    ║"
    echo "║  🔵 V10 Platform (TypeScript) + ⚡ V11 Platform (Java)       ║"
    echo "║  📊 Management Dashboard + 🌐 Domain Configuration          ║"
    echo "║                                                              ║"
    echo "║  Domain: aurigraphdlt.dev4.aurex.in                        ║"
    echo "║  No Docker Required - Pure Node.js + Java                   ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo
}

print_help() {
    echo -e "${CYAN}Aurigraph Local Deployment Tool${NC}"
    echo
    echo -e "${YELLOW}Usage:${NC}"
    echo "  $0 [command] [options]"
    echo
    echo -e "${YELLOW}Commands:${NC}"
    echo -e "  ${GREEN}start${NC}     - Start all services (default)"
    echo -e "  ${GREEN}stop${NC}      - Stop all services"
    echo -e "  ${GREEN}restart${NC}   - Restart all services"
    echo -e "  ${GREEN}status${NC}    - Show service status"
    echo -e "  ${GREEN}validate${NC}  - Run validation tests"
    echo -e "  ${GREEN}logs${NC}      - Follow deployment logs"
    echo -e "  ${GREEN}clean${NC}     - Clean logs and temporary files"
    echo -e "  ${GREEN}help${NC}      - Show this help"
    echo
    echo -e "${YELLOW}Options:${NC}"
    echo -e "  ${BLUE}--domain DOMAIN${NC}     - Set domain (default: aurigraphdlt.dev4.aurex.in)"
    echo -e "  ${BLUE}--v10-port PORT${NC}     - Set V10 port (default: 4004)"
    echo -e "  ${BLUE}--v11-port PORT${NC}     - Set V11 port (default: 9004)"
    echo -e "  ${BLUE}--mgmt-port PORT${NC}    - Set management port (default: 3040)"
    echo -e "  ${BLUE}--nginx-port PORT${NC}   - Set nginx port (default: 8080)"
    echo -e "  ${BLUE}--wait-validation${NC}   - Run validation after startup"
    echo
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 start --wait-validation    # Start and validate"
    echo "  $0 restart --v10-port 4005    # Restart with custom V10 port"
    echo "  $0 validate                   # Run validation tests only"
    echo
    echo -e "${YELLOW}Service URLs (default ports):${NC}"
    echo -e "  📊 Management: ${GREEN}http://localhost:3040${NC}"
    echo -e "  🔵 V10 API:    ${GREEN}http://localhost:4004${NC}"
    echo -e "  ⚡ V11 API:    ${GREEN}http://localhost:9004${NC}"
    echo -e "  🌐 Nginx:      ${GREEN}http://localhost:8080${NC}"
}

check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"

    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        echo -e "${RED}❌ Node.js not found. Please install Node.js 20+${NC}"
        echo "   Download from: https://nodejs.org/"
        exit 1
    fi

    local node_version=$(node --version | sed 's/v//' | cut -d. -f1)
    if [[ $node_version -lt 20 ]]; then
        echo -e "${RED}❌ Node.js version $node_version is too old. Please install Node.js 20+${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Node.js $(node --version) found${NC}"

    # Check npm
    if ! command -v npm >/dev/null 2>&1; then
        echo -e "${RED}❌ npm not found. Please install npm${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ npm $(npm --version) found${NC}"

    # Check scripts exist
    if [[ ! -f "$MAIN_SCRIPT" ]]; then
        echo -e "${RED}❌ Main deployment script not found: $MAIN_SCRIPT${NC}"
        exit 1
    fi

    if [[ ! -f "$VALIDATOR_SCRIPT" ]]; then
        echo -e "${RED}❌ Validator script not found: $VALIDATOR_SCRIPT${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ All prerequisites met${NC}"
    echo
}

wait_for_services() {
    echo -e "${BLUE}⏳ Waiting for services to start...${NC}"

    local max_attempts=30
    local attempt=0

    while [[ $attempt -lt $max_attempts ]]; do
        if curl -s "http://localhost:${V10_PORT:-4004}/health" >/dev/null 2>&1 && \
           curl -s "http://localhost:${V11_PORT:-9004}/api/v11/health" >/dev/null 2>&1 && \
           curl -s "http://localhost:${MANAGEMENT_PORT:-3040}/health" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ All services are ready!${NC}"
            return 0
        fi

        echo -n "."
        sleep 2
        ((attempt++))
    done

    echo -e "\n${YELLOW}⚠️  Services took longer than expected to start${NC}"
    echo -e "${BLUE}ℹ️  You can check status with: $0 status${NC}"
    return 1
}

run_validation() {
    echo -e "${PURPLE}🧪 Running validation tests...${NC}"
    echo

    if [[ -f "$VALIDATOR_SCRIPT" ]]; then
        node "$VALIDATOR_SCRIPT"
        local exit_code=$?

        if [[ $exit_code -eq 0 ]]; then
            echo -e "\n${GREEN}🎉 All validation tests passed!${NC}"
        else
            echo -e "\n${YELLOW}⚠️  Some validation tests failed. Check the logs for details.${NC}"
        fi

        return $exit_code
    else
        echo -e "${RED}❌ Validator script not found${NC}"
        return 1
    fi
}

clean_deployment() {
    echo -e "${BLUE}🧹 Cleaning deployment files...${NC}"

    # Clean logs
    if [[ -d "$SCRIPT_DIR/logs" ]]; then
        find "$SCRIPT_DIR/logs" -name "*.log" -mtime +7 -delete 2>/dev/null || true
        find "$SCRIPT_DIR/logs" -name "*.json" -mtime +7 -delete 2>/dev/null || true
        echo -e "${GREEN}✅ Cleaned old logs${NC}"
    fi

    # Clean temporary service files
    rm -f "$SCRIPT_DIR/local-v10-service.js"
    rm -f "$SCRIPT_DIR/local-v11-mock.js"
    rm -f "$SCRIPT_DIR/local-management-dashboard.js"

    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Parse command line arguments
COMMAND=""
WAIT_VALIDATION=false

while [[ $# -gt 0 ]]; do
    case $1 in
        start|stop|restart|status|validate|logs|clean|help)
            COMMAND="$1"
            shift
            ;;
        --domain)
            export DOMAIN="$2"
            shift 2
            ;;
        --v10-port)
            export V10_PORT="$2"
            shift 2
            ;;
        --v11-port)
            export V11_PORT="$2"
            shift 2
            ;;
        --mgmt-port)
            export MANAGEMENT_PORT="$2"
            shift 2
            ;;
        --nginx-port)
            export NGINX_PORT="$2"
            shift 2
            ;;
        --wait-validation)
            WAIT_VALIDATION=true
            shift
            ;;
        -h|--help)
            print_help
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            echo -e "${BLUE}Use '$0 help' for usage information${NC}"
            exit 1
            ;;
    esac
done

# Default command
if [[ -z "$COMMAND" ]]; then
    COMMAND="start"
fi

# Print banner for interactive commands
if [[ "$COMMAND" != "help" && "$COMMAND" != "logs" ]]; then
    print_banner
fi

# Execute command
case "$COMMAND" in
    "start")
        check_prerequisites
        echo -e "${GREEN}🚀 Starting Aurigraph local deployment...${NC}"
        echo -e "${BLUE}📍 Domain: ${DOMAIN:-aurigraphdlt.dev4.aurex.in}${NC}"
        echo -e "${BLUE}🔧 Ports: V10=${V10_PORT:-4004}, V11=${V11_PORT:-9004}, Mgmt=${MANAGEMENT_PORT:-3040}${NC}"
        echo

        # Start services in background
        "$MAIN_SCRIPT" start &
        DEPLOY_PID=$!

        # Wait for services to be ready
        sleep 5
        if wait_for_services; then
            echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
            echo
            echo -e "${YELLOW}🔗 Service URLs:${NC}"
            echo -e "  📊 Management Dashboard: ${GREEN}http://localhost:${MANAGEMENT_PORT:-3040}${NC}"
            echo -e "  🔵 V10 Platform:         ${GREEN}http://localhost:${V10_PORT:-4004}${NC}"
            echo -e "  ⚡ V11 Platform:         ${GREEN}http://localhost:${V11_PORT:-9004}${NC}"
            echo

            if [[ "$WAIT_VALIDATION" == "true" ]]; then
                run_validation
            fi

            echo -e "${BLUE}📡 Services are running in the background.${NC}"
            echo -e "${BLUE}📝 Use '$0 status' to check service status${NC}"
            echo -e "${BLUE}🛑 Use '$0 stop' to stop all services${NC}"
            echo -e "${BLUE}🧪 Use '$0 validate' to run tests${NC}"
        else
            echo -e "${RED}❌ Some services may not have started properly${NC}"
            echo -e "${BLUE}📝 Check logs with: $0 logs${NC}"
        fi
        ;;

    "stop")
        echo -e "${YELLOW}🛑 Stopping all services...${NC}"
        "$MAIN_SCRIPT" stop
        clean_deployment
        echo -e "${GREEN}✅ All services stopped${NC}"
        ;;

    "restart")
        echo -e "${YELLOW}🔄 Restarting all services...${NC}"
        "$MAIN_SCRIPT" stop
        sleep 3
        check_prerequisites
        "$MAIN_SCRIPT" start &
        sleep 5
        if wait_for_services; then
            echo -e "${GREEN}✅ Restart completed successfully!${NC}"
            if [[ "$WAIT_VALIDATION" == "true" ]]; then
                run_validation
            fi
        fi
        ;;

    "status")
        echo -e "${BLUE}📊 Service Status:${NC}"
        "$MAIN_SCRIPT" status
        echo
        echo -e "${BLUE}🔍 Quick connectivity test:${NC}"

        # Test each service
        if curl -s "http://localhost:${V10_PORT:-4004}/health" >/dev/null 2>&1; then
            echo -e "  🔵 V10 Platform:  ${GREEN}✅ Online${NC}"
        else
            echo -e "  🔵 V10 Platform:  ${RED}❌ Offline${NC}"
        fi

        if curl -s "http://localhost:${V11_PORT:-9004}/api/v11/health" >/dev/null 2>&1; then
            echo -e "  ⚡ V11 Platform:  ${GREEN}✅ Online${NC}"
        else
            echo -e "  ⚡ V11 Platform:  ${RED}❌ Offline${NC}"
        fi

        if curl -s "http://localhost:${MANAGEMENT_PORT:-3040}/health" >/dev/null 2>&1; then
            echo -e "  📊 Management:    ${GREEN}✅ Online${NC}"
        else
            echo -e "  📊 Management:    ${RED}❌ Offline${NC}"
        fi
        ;;

    "validate")
        echo -e "${PURPLE}🧪 Running comprehensive validation...${NC}"
        run_validation
        ;;

    "logs")
        echo -e "${BLUE}📝 Following deployment logs...${NC}"
        "$MAIN_SCRIPT" logs
        ;;

    "clean")
        clean_deployment
        ;;

    "help")
        print_help
        ;;

    *)
        echo -e "${RED}❌ Unknown command: $COMMAND${NC}"
        echo -e "${BLUE}Use '$0 help' for usage information${NC}"
        exit 1
        ;;
esac
