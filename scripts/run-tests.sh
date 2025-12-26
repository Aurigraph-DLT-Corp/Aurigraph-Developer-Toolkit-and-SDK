#!/bin/bash

# Test Execution Helper for Aurigraph V11 TDD Strategy
# Provides convenient shortcuts for running different test profiles

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
V11_DIR="$PROJECT_ROOT/aurigraph-av10-7/aurigraph-v11-standalone"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Display usage
usage() {
    cat << EOF
${BLUE}Aurigraph V11 Test Execution Helper${NC}

Usage: $(basename "$0") [COMMAND] [OPTIONS]

Commands:
  unit              Run fast unit tests only (<30 seconds)
  integration       Run integration tests with Testcontainers (2-5 minutes)
  all               Run full test suite with coverage (10-15 minutes)
  quick             Run unit tests and show coverage summary
  coverage          Generate and open coverage report
  clean             Clean test artifacts

Options:
  -q, --quiet       Suppress output (unit tests only)
  -v, --verbose     Show detailed output
  --no-skip-cache   Don't skip test cache
  --help            Show this help message

Examples:
  $(basename "$0") unit               # Run unit tests
  $(basename "$0") all                # Run all tests
  $(basename "$0") coverage           # Generate coverage report
  $(basename "$0") quick              # Run unit + show coverage summary

EOF
}

# Parse command
COMMAND="${1:-unit}"
VERBOSE="${2:---quiet}"

case "$COMMAND" in
    unit)
        echo -e "${BLUE}Running unit tests...${NC}"
        cd "$V11_DIR"
        ./mvnw clean test -Punit-tests-only -B ${VERBOSE}
        echo -e "${GREEN}✅ Unit tests completed${NC}"
        ;;

    integration)
        echo -e "${BLUE}Running integration tests...${NC}"
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}❌ Docker not found. Integration tests require Docker.${NC}"
            exit 1
        fi
        cd "$V11_DIR"
        ./mvnw clean test -Pintegration-tests -B ${VERBOSE}
        echo -e "${GREEN}✅ Integration tests completed${NC}"
        ;;

    all|full)
        echo -e "${BLUE}Running full test suite with coverage...${NC}"
        cd "$V11_DIR"
        ./mvnw clean verify -Pfull-test-suite -B ${VERBOSE}
        echo -e "${GREEN}✅ Full test suite completed${NC}"
        echo -e "${YELLOW}Coverage report: ${NC}target/site/jacoco/index.html"
        ;;

    quick)
        echo -e "${BLUE}Running quick test validation...${NC}"
        cd "$V11_DIR"
        ./mvnw clean test -Punit-tests-only -q
        echo -e "${GREEN}✅ Quick tests completed${NC}"
        echo ""
        echo "To view detailed coverage:"
        echo "  $(basename "$0") coverage"
        ;;

    coverage)
        echo -e "${BLUE}Generating coverage report...${NC}"
        cd "$V11_DIR"
        if [ ! -d "target/site/jacoco" ]; then
            echo -e "${YELLOW}Coverage report not found. Running full test suite...${NC}"
            ./mvnw clean verify -Pfull-test-suite -q
        fi

        # Open coverage report in browser
        if [ -f "target/site/jacoco/index.html" ]; then
            echo -e "${GREEN}✅ Coverage report generated${NC}"
            if command -v open &> /dev/null; then
                open "target/site/jacoco/index.html"
            else
                echo -e "${YELLOW}Coverage report: target/site/jacoco/index.html${NC}"
            fi
        fi
        ;;

    clean)
        echo -e "${BLUE}Cleaning test artifacts...${NC}"
        cd "$V11_DIR"
        ./mvnw clean -q
        rm -rf target/
        echo -e "${GREEN}✅ Test artifacts cleaned${NC}"
        ;;

    -h|--help|help)
        usage
        ;;

    *)
        echo -e "${RED}❌ Unknown command: $COMMAND${NC}"
        echo ""
        usage
        exit 1
        ;;
esac

exit 0
