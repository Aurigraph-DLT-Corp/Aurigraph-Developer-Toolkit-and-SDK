#!/bin/bash

# Aurigraph AV10-7 Comprehensive Test Suite Runner
# Usage: ./scripts/testing/run-test-suite.sh [test-type] [options]

set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPORTS_DIR="$PROJECT_ROOT/reports"
TEST_RESULTS_DIR="$REPORTS_DIR/test-results"
COVERAGE_DIR="$REPORTS_DIR/coverage"
PERFORMANCE_DIR="$REPORTS_DIR/performance"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
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

cleanup() {
    log_info "Cleaning up test processes..."
    pkill -f "node dist/index-simple.js" 2>/dev/null || true
    pkill -f "npm run ui:dev" 2>/dev/null || true
    sleep 2
}

setup_test_environment() {
    log_info "Setting up test environment..."
    
    # Create reports directories
    mkdir -p "$TEST_RESULTS_DIR" "$COVERAGE_DIR" "$PERFORMANCE_DIR"
    
    # Set test environment variables
    export NODE_ENV=test
    export LOG_LEVEL=error
    export TEST_TIMEOUT=30000
    
    # Clean previous test artifacts
    rm -rf "$PROJECT_ROOT/coverage" 2>/dev/null || true
    rm -f "$PROJECT_ROOT/test-results.xml" 2>/dev/null || true
}

build_platform() {
    log_info "Building platform..."
    cd "$PROJECT_ROOT"
    
    if ! npm run build; then
        log_error "Platform build failed"
        return 1
    fi
    
    log_success "Platform build completed"
}

start_platform() {
    log_info "Starting platform for testing..."
    cd "$PROJECT_ROOT"
    
    # Start main platform
    npm start > "$TEST_RESULTS_DIR/platform.log" 2>&1 &
    PLATFORM_PID=$!
    
    # Wait for platform to be ready
    local retries=0
    local max_retries=30
    
    while [ $retries -lt $max_retries ]; do
        if curl -s http://localhost:3001/health > /dev/null 2>&1; then
            log_success "Platform is ready"
            return 0
        fi
        
        retries=$((retries + 1))
        log_info "Waiting for platform startup... ($retries/$max_retries)"
        sleep 2
    done
    
    log_error "Platform failed to start within timeout"
    return 1
}

run_unit_tests() {
    log_info "Running unit tests..."
    cd "$PROJECT_ROOT"
    
    if npm test -- --testPathPattern="unit" --coverage --coverageDirectory="$COVERAGE_DIR"; then
        log_success "Unit tests passed"
        return 0
    else
        log_error "Unit tests failed"
        return 1
    fi
}

run_smoke_tests() {
    log_info "Running smoke tests..."
    cd "$PROJECT_ROOT"
    
    if npm test -- --testPathPattern="smoke" --verbose; then
        log_success "Smoke tests passed"
        return 0
    else
        log_error "Smoke tests failed"
        return 1
    fi
}

run_integration_tests() {
    log_info "Running integration tests..."
    cd "$PROJECT_ROOT"
    
    if npm test -- --testPathPattern="integration" --verbose; then
        log_success "Integration tests passed"
        return 0
    else
        log_error "Integration tests failed"
        return 1
    fi
}

run_performance_tests() {
    log_info "Running performance tests..."
    cd "$PROJECT_ROOT"
    
    # Ensure platform is running for performance tests
    if ! curl -s http://localhost:3001/health > /dev/null; then
        log_warning "Platform not running, starting for performance tests..."
        start_platform
    fi
    
    if npm test -- --testPathPattern="performance" --testTimeout=180000 --verbose; then
        log_success "Performance tests passed"
        return 0
    else
        log_error "Performance tests failed"
        return 1
    fi
}

run_regression_tests() {
    log_info "Running regression tests..."
    cd "$PROJECT_ROOT"
    
    if npm test -- --testPathPattern="regression" --verbose; then
        log_success "Regression tests passed"
        return 0
    else
        log_error "Regression tests failed"
        return 1
    fi
}

run_security_tests() {
    log_info "Running security tests..."
    cd "$PROJECT_ROOT"
    
    # NPM security audit
    if ! npm audit --audit-level=moderate; then
        log_warning "Security audit found issues"
    fi
    
    # Snyk security scan (if token available)
    if [ ! -z "$SNYK_TOKEN" ]; then
        if ! npx snyk test; then
            log_warning "Snyk security scan found issues"
        fi
    fi
    
    # Run security-specific tests
    if npm test -- --testPathPattern="security" --verbose; then
        log_success "Security tests passed"
        return 0
    else
        log_error "Security tests failed"
        return 1
    fi
}

generate_test_report() {
    log_info "Generating comprehensive test report..."
    
    local report_file="$REPORTS_DIR/test-summary-$(date +%Y%m%d-%H%M%S).html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Aurigraph AV10-7 Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .error { color: #dc3545; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #007bff; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Aurigraph AV10-7 Test Report</h1>
        <p>Generated: $(date)</p>
        <p>Platform Version: 10.7.0</p>
    </div>
    
    <div class="section">
        <h2>Test Execution Summary</h2>
        <p>Test results for commit: $(git rev-parse --short HEAD)</p>
        <p>Branch: $(git branch --show-current)</p>
    </div>
    
    <div class="section">
        <h2>Coverage Information</h2>
        <p>Coverage reports available in: <code>$COVERAGE_DIR</code></p>
    </div>
    
    <div class="section">
        <h2>Performance Metrics</h2>
        <p>Performance test results available in: <code>$PERFORMANCE_DIR</code></p>
    </div>
</body>
</html>
EOF
    
    log_success "Test report generated: $report_file"
}

# Main execution logic
main() {
    local test_type="${1:-all}"
    local exit_code=0
    
    log_info "Starting Aurigraph AV10-7 Test Suite"
    log_info "Test type: $test_type"
    
    # Setup
    trap cleanup EXIT
    setup_test_environment
    
    case "$test_type" in
        "unit")
            build_platform && run_unit_tests
            exit_code=$?
            ;;
        "smoke")
            build_platform && run_smoke_tests
            exit_code=$?
            ;;
        "integration")
            build_platform && start_platform && run_integration_tests
            exit_code=$?
            ;;
        "performance")
            build_platform && start_platform && run_performance_tests
            exit_code=$?
            ;;
        "regression")
            build_platform && start_platform && run_regression_tests
            exit_code=$?
            ;;
        "security")
            build_platform && run_security_tests
            exit_code=$?
            ;;
        "quick")
            build_platform && run_unit_tests && run_smoke_tests
            exit_code=$?
            ;;
        "ci")
            # CI pipeline execution
            build_platform && run_unit_tests && run_smoke_tests && start_platform && run_integration_tests && run_regression_tests
            exit_code=$?
            ;;
        "all"|*)
            # Full test suite
            log_info "Running comprehensive test suite..."
            
            build_platform || exit_code=1
            run_unit_tests || exit_code=1
            run_smoke_tests || exit_code=1
            start_platform || exit_code=1
            run_integration_tests || exit_code=1
            run_regression_tests || exit_code=1
            run_performance_tests || exit_code=1
            run_security_tests || exit_code=1
            ;;
    esac
    
    # Generate report
    generate_test_report
    
    if [ $exit_code -eq 0 ]; then
        log_success "All tests completed successfully"
    else
        log_error "Some tests failed (exit code: $exit_code)"
    fi
    
    return $exit_code
}

# Help function
show_help() {
    cat << EOF
Aurigraph AV10-7 Test Suite Runner

Usage: $0 [test-type] [options]

Test Types:
    unit        Run only unit tests
    smoke       Run only smoke tests  
    integration Run only integration tests
    performance Run only performance tests
    regression  Run only regression tests
    security    Run only security tests
    quick       Run unit + smoke tests (fast feedback)
    ci          Run CI pipeline tests (unit + smoke + integration + regression)
    all         Run complete test suite (default)

Options:
    --help      Show this help message
    --verbose   Enable verbose output
    --coverage  Generate coverage report
    --report    Generate detailed HTML report

Examples:
    $0 unit                    # Run unit tests only
    $0 quick                   # Fast feedback tests
    $0 ci                      # CI pipeline tests
    $0 performance --verbose   # Performance tests with verbose output
    $0 all --coverage         # Full suite with coverage

Environment Variables:
    NODE_ENV=test             # Test environment (set automatically)
    LOG_LEVEL=error           # Reduce log noise (set automatically)
    SNYK_TOKEN               # Snyk security scanning token
    TEST_TIMEOUT=30000       # Test timeout in milliseconds

EOF
}

# Parse command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    show_help
    exit 0
fi

# Execute main function
main "$@"