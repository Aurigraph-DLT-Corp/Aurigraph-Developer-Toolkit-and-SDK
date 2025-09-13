#!/bin/bash

# Aurigraph V11 Performance Test Runner
# AV11-4002: 2M+ TPS High-Performance Architecture Validation
#
# This script orchestrates comprehensive performance testing including:
# - System preparation and optimization
# - Graduated load testing
# - Peak performance validation (2M+ TPS)
# - Consensus performance testing
# - Network performance testing
# - Stress and endurance testing
# - Comprehensive reporting

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Performance test configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${SCRIPT_DIR}"
TARGET_DIR="${PROJECT_DIR}/target"
REPORT_DIR="${TARGET_DIR}/performance-reports"
LOG_DIR="${TARGET_DIR}/performance-logs"

# Test execution parameters
JAVA_OPTS="-Xmx4g -Xms2g -XX:+UseG1GC -XX:+UseStringDeduplication -XX:+OptimizeStringConcat"
QUARKUS_PROFILE="${QUARKUS_PROFILE:-test}"
TEST_TIMEOUT="${TEST_TIMEOUT:-1800}"  # 30 minutes
PARALLEL_TESTS="${PARALLEL_TESTS:-false}"

# Performance targets
TARGET_TPS=2000000
TARGET_P99_LATENCY_MS=100
TARGET_MEMORY_MB=256

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    AURIGRAPH V11 PERFORMANCE TEST SUITE                      ║${NC}"
echo -e "${CYAN}║                     AV11-4002 2M+ TPS VALIDATION                            ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo
echo -e "${BLUE}Performance Targets:${NC}"
echo -e "  • TPS: ${GREEN}${TARGET_TPS:+}${NC} transactions per second"
echo -e "  • P99 Latency: ${GREEN}<${TARGET_P99_LATENCY_MS}ms${NC}"
echo -e "  • Memory Usage: ${GREEN}<${TARGET_MEMORY_MB}MB${NC}"
echo -e "  • Concurrent Connections: ${GREEN}10,000+${NC}"
echo -e "  • Leader Election: ${GREEN}<500ms${NC}"
echo

# Function to print section headers
print_section() {
    echo -e "\n${PURPLE}═══ $1 ═══${NC}\n"
}

# Function to print status
print_status() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Function to print warning
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    print_section "CHECKING PREREQUISITES"
    
    # Check Java version
    if command -v java &> /dev/null; then
        JAVA_VERSION=$(java -version 2>&1 | grep -oP 'version "([0-9]+)' | cut -d'"' -f2)
        if [ "$JAVA_VERSION" -ge 21 ]; then
            print_success "Java $JAVA_VERSION detected"
        else
            print_error "Java 21+ required, found Java $JAVA_VERSION"
            exit 1
        fi
    else
        print_error "Java not found in PATH"
        exit 1
    fi
    
    # Check Maven
    if command -v mvn &> /dev/null; then
        MVN_VERSION=$(mvn --version | head -n1 | cut -d' ' -f3)
        print_success "Maven $MVN_VERSION detected"
    else
        print_error "Maven not found in PATH"
        exit 1
    fi
    
    # Check system resources
    TOTAL_RAM=$(free -m | awk 'NR==2{printf "%.0f", $2/1024}')
    if [ "$TOTAL_RAM" -ge 8 ]; then
        print_success "System RAM: ${TOTAL_RAM}GB"
    else
        print_warning "System RAM: ${TOTAL_RAM}GB (8GB+ recommended for peak performance tests)"
    fi
    
    CPU_CORES=$(nproc)
    print_success "CPU Cores: $CPU_CORES"
    
    # Check available disk space
    DISK_SPACE=$(df -BG "$TARGET_DIR" | tail -1 | awk '{print $4}' | sed 's/G//')
    if [ "$DISK_SPACE" -ge 5 ]; then
        print_success "Available disk space: ${DISK_SPACE}GB"
    else
        print_warning "Available disk space: ${DISK_SPACE}GB (5GB+ recommended)"
    fi
}

# Function to prepare environment
prepare_environment() {
    print_section "PREPARING ENVIRONMENT"
    
    # Create necessary directories
    mkdir -p "$LOG_DIR"
    mkdir -p "$REPORT_DIR"
    print_status "Created output directories"
    
    # Set system optimizations for performance testing
    print_status "Applying system optimizations..."
    
    # Increase file descriptor limits
    ulimit -n 65536 2>/dev/null || print_warning "Could not set file descriptor limit"
    
    # Set JVM optimizations
    export JAVA_OPTS="$JAVA_OPTS"
    export MAVEN_OPTS="$JAVA_OPTS"
    
    print_status "Environment prepared with optimizations"
    
    # Log system state
    echo "System Information:" > "$LOG_DIR/system-info.log"
    echo "===================" >> "$LOG_DIR/system-info.log"
    echo "Date: $(date)" >> "$LOG_DIR/system-info.log"
    echo "Hostname: $(hostname)" >> "$LOG_DIR/system-info.log"
    echo "OS: $(uname -a)" >> "$LOG_DIR/system-info.log"
    echo "Java: $(java -version 2>&1 | head -1)" >> "$LOG_DIR/system-info.log"
    echo "Maven: $(mvn --version | head -1)" >> "$LOG_DIR/system-info.log"
    echo "CPU Cores: $CPU_CORES" >> "$LOG_DIR/system-info.log"
    echo "Total RAM: ${TOTAL_RAM}GB" >> "$LOG_DIR/system-info.log"
    echo "Available Disk: ${DISK_SPACE}GB" >> "$LOG_DIR/system-info.log"
    echo "" >> "$LOG_DIR/system-info.log"
}

# Function to build the project
build_project() {
    print_section "BUILDING PROJECT"
    
    print_status "Compiling Aurigraph V11 with optimizations..."
    
    cd "$PROJECT_DIR"
    
    # Clean build
    mvn clean > "$LOG_DIR/build.log" 2>&1
    
    # Compile with test dependencies
    if mvn compile test-compile -P performance-testing >> "$LOG_DIR/build.log" 2>&1; then
        print_success "Project built successfully"
    else
        print_error "Build failed. Check $LOG_DIR/build.log"
        tail -20 "$LOG_DIR/build.log"
        exit 1
    fi
}

# Function to run performance tests
run_performance_tests() {
    print_section "EXECUTING PERFORMANCE TESTS"
    
    cd "$PROJECT_DIR"
    
    # Test execution timestamp
    TEST_START_TIME=$(date '+%Y%m%d_%H%M%S')
    CURRENT_LOG_DIR="$LOG_DIR/run_$TEST_START_TIME"
    mkdir -p "$CURRENT_LOG_DIR"
    
    print_status "Starting comprehensive performance test execution..."
    print_status "Logs will be written to: $CURRENT_LOG_DIR"
    
    # Set test-specific environment variables
    export QUARKUS_PROFILE="$QUARKUS_PROFILE"
    export QUARKUS_LOG_LEVEL=INFO
    export QUARKUS_LOG_FILE="$CURRENT_LOG_DIR/quarkus.log"
    
    # Test categories to run
    declare -a TEST_CATEGORIES=(
        "PerformanceBenchmarkSuite#testSystemWarmup"
        "PerformanceBenchmarkSuite#testGraduatedLoad"
        "PerformanceBenchmarkSuite#testPeakPerformance"
        "PerformanceBenchmarkSuite#testConsensusPerformance"
        "PerformanceBenchmarkSuite#testNetworkPerformance"
        "PerformanceBenchmarkSuite#testStressConditions"
        "PerformanceBenchmarkSuite#testEndurancePerformance"
    )
    
    # Track test results
    TOTAL_TESTS=${#TEST_CATEGORIES[@]}
    PASSED_TESTS=0
    FAILED_TESTS=0
    
    print_status "Running $TOTAL_TESTS test categories..."
    
    # Run each test category
    for i in "${!TEST_CATEGORIES[@]}"; do
        TEST_NAME="${TEST_CATEGORIES[$i]}"
        TEST_NUM=$((i + 1))
        
        print_status "[$TEST_NUM/$TOTAL_TESTS] Running: $TEST_NAME"
        
        # Create test-specific log file
        TEST_LOG="$CURRENT_LOG_DIR/test_${TEST_NUM}_$(echo $TEST_NAME | tr '#' '_').log"
        
        # Run the test with timeout
        if timeout "$TEST_TIMEOUT" mvn test \
            -Dtest="io.aurigraph.v11.performance.${TEST_NAME}" \
            -Dquarkus.profile="$QUARKUS_PROFILE" \
            -Dmaven.test.failure.ignore=true \
            > "$TEST_LOG" 2>&1; then
            
            # Check if test actually passed
            if grep -q "Tests run:.*, Failures: 0, Errors: 0" "$TEST_LOG"; then
                print_success "[$TEST_NUM/$TOTAL_TESTS] $TEST_NAME - PASSED"
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                print_error "[$TEST_NUM/$TOTAL_TESTS] $TEST_NAME - FAILED"
                FAILED_TESTS=$((FAILED_TESTS + 1))
                
                # Show last few lines of failure
                echo -e "${RED}Last 10 lines of failure log:${NC}"
                tail -10 "$TEST_LOG" | sed 's/^/  /'
            fi
        else
            print_error "[$TEST_NUM/$TOTAL_TESTS] $TEST_NAME - TIMEOUT/ERROR"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
        
        # Brief pause between tests
        sleep 2
    done
    
    # Test execution summary
    echo
    print_section "TEST EXECUTION SUMMARY"
    echo -e "${BLUE}Total Tests:${NC}  $TOTAL_TESTS"
    echo -e "${GREEN}Passed:${NC}       $PASSED_TESTS"
    echo -e "${RED}Failed:${NC}       $FAILED_TESTS"
    echo -e "${BLUE}Success Rate:${NC} $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%"
    
    # Overall result
    if [ $FAILED_TESTS -eq 0 ]; then
        print_success "ALL PERFORMANCE TESTS PASSED!"
        OVERALL_RESULT="PASS"
    else
        print_error "SOME PERFORMANCE TESTS FAILED"
        OVERALL_RESULT="FAIL"
    fi
    
    # Save test summary
    echo "Performance Test Summary" > "$CURRENT_LOG_DIR/summary.txt"
    echo "======================" >> "$CURRENT_LOG_DIR/summary.txt"
    echo "Date: $(date)" >> "$CURRENT_LOG_DIR/summary.txt"
    echo "Total Tests: $TOTAL_TESTS" >> "$CURRENT_LOG_DIR/summary.txt"
    echo "Passed: $PASSED_TESTS" >> "$CURRENT_LOG_DIR/summary.txt"
    echo "Failed: $FAILED_TESTS" >> "$CURRENT_LOG_DIR/summary.txt"
    echo "Success Rate: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%" >> "$CURRENT_LOG_DIR/summary.txt"
    echo "Overall Result: $OVERALL_RESULT" >> "$CURRENT_LOG_DIR/summary.txt"
}

# Function to generate reports
generate_reports() {
    print_section "GENERATING PERFORMANCE REPORTS"
    
    cd "$PROJECT_DIR"
    
    print_status "Collecting performance data and generating reports..."
    
    # Find the latest report directory
    LATEST_REPORT=$(find "$TARGET_DIR" -name "performance-reports" -type d | head -1)
    
    if [ -d "$LATEST_REPORT" ]; then
        print_success "Performance reports available in: $LATEST_REPORT"
        
        # List available reports
        echo -e "\n${BLUE}Generated Reports:${NC}"
        find "$LATEST_REPORT" -name "*.html" -o -name "*.json" -o -name "*.csv" -o -name "*.txt" | while read -r file; do
            echo -e "  📄 $(basename "$file")"
        done
    else
        print_warning "No performance reports found in target directory"
    fi
    
    # Create a summary report
    SUMMARY_FILE="$LOG_DIR/performance-test-summary.md"
    
    cat > "$SUMMARY_FILE" << EOF
# Aurigraph V11 Performance Test Results

## Test Execution Summary
- **Date**: $(date)
- **Duration**: Performance test execution
- **Environment**: $QUARKUS_PROFILE
- **Java Version**: $(java -version 2>&1 | head -1)
- **System**: $(uname -s) $(uname -r)
- **CPU Cores**: $CPU_CORES
- **Total RAM**: ${TOTAL_RAM}GB

## Performance Targets (AV11-4002)
- **TPS Target**: 2,000,000+ transactions per second
- **P99 Latency Target**: <100ms
- **Memory Usage Target**: <256MB
- **Leader Election Target**: <500ms
- **Concurrent Connections Target**: 10,000+

## Test Categories Executed
1. System Warmup and Baseline
2. Graduated Load Testing (1K → 2M TPS)
3. Peak Performance Validation
4. Consensus Performance Testing
5. Network Performance Testing
6. Stress Testing (beyond capacity)
7. Endurance Testing (sustained load)

## Results
- **Total Tests**: $TOTAL_TESTS
- **Passed**: $PASSED_TESTS
- **Failed**: $FAILED_TESTS
- **Success Rate**: $(( PASSED_TESTS * 100 / TOTAL_TESTS ))%
- **Overall Result**: $OVERALL_RESULT

## Recommendations
EOF
    
    if [ "$OVERALL_RESULT" = "PASS" ]; then
        echo "✅ **APPROVED FOR PRODUCTION**: All performance targets met" >> "$SUMMARY_FILE"
    else
        echo "❌ **REQUIRES OPTIMIZATION**: Some performance targets not met" >> "$SUMMARY_FILE"
    fi
    
    echo "" >> "$SUMMARY_FILE"
    echo "For detailed metrics, see the generated HTML dashboard and JSON reports." >> "$SUMMARY_FILE"
    
    print_success "Summary report generated: $SUMMARY_FILE"
}

# Function to cleanup
cleanup() {
    print_section "CLEANUP"
    
    print_status "Performing cleanup operations..."
    
    # Kill any remaining background processes
    pkill -f "aurigraph" 2>/dev/null || true
    
    # Reset system optimizations if needed
    # (ulimit changes are session-specific and will reset automatically)
    
    print_success "Cleanup completed"
}

# Function to display final results
display_final_results() {
    echo
    print_section "FINAL RESULTS"
    
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                         PERFORMANCE TEST COMPLETION                         ║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════════════════╝${NC}"
    
    if [ "$OVERALL_RESULT" = "PASS" ]; then
        echo -e "\n${GREEN}🚀 SUCCESS! Aurigraph V11 meets all AV11-4002 performance requirements${NC}"
        echo -e "${GREEN}   The system is ready for production deployment with 2M+ TPS capability${NC}\n"
    else
        echo -e "\n${RED}⚠️  ATTENTION: Some performance targets were not met${NC}"
        echo -e "${RED}   Review the detailed reports and optimize before production deployment${NC}\n"
    fi
    
    echo -e "${BLUE}📊 Performance Test Artifacts:${NC}"
    echo -e "   • Test Logs: $LOG_DIR"
    echo -e "   • Performance Reports: $REPORT_DIR"
    echo -e "   • Summary Report: $LOG_DIR/performance-test-summary.md"
    
    echo -e "\n${BLUE}📈 Next Steps:${NC}"
    if [ "$OVERALL_RESULT" = "PASS" ]; then
        echo -e "   1. Review detailed performance reports"
        echo -e "   2. Archive test results for compliance"
        echo -e "   3. Proceed with production deployment"
    else
        echo -e "   1. Analyze failed test details in logs"
        echo -e "   2. Optimize identified performance bottlenecks"
        echo -e "   3. Re-run performance tests"
        echo -e "   4. Repeat until all targets are met"
    fi
    
    echo
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Main execution flow
main() {
    # Start timestamp
    START_TIME=$(date +%s)
    
    # Execute test phases
    check_prerequisites
    prepare_environment
    build_project
    run_performance_tests
    generate_reports
    display_final_results
    
    # End timestamp and duration
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    echo -e "\n${BLUE}⏱️  Total execution time: $(( DURATION / 60 ))m $(( DURATION % 60 ))s${NC}\n"
    
    # Exit with appropriate code
    if [ "$OVERALL_RESULT" = "PASS" ]; then
        exit 0
    else
        exit 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --profile)
            QUARKUS_PROFILE="$2"
            shift 2
            ;;
        --timeout)
            TEST_TIMEOUT="$2"
            shift 2
            ;;
        --parallel)
            PARALLEL_TESTS="true"
            shift
            ;;
        --help)
            echo "Aurigraph V11 Performance Test Runner"
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  --profile PROFILE   Set Quarkus profile (dev|test|prod)"
            echo "  --timeout SECONDS   Set test timeout in seconds (default: 1800)"
            echo "  --parallel          Run tests in parallel (experimental)"
            echo "  --help              Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Execute main function
main