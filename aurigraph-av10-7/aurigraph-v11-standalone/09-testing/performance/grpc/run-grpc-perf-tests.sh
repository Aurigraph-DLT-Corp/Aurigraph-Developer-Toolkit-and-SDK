#!/bin/bash
#
# Aurigraph V12 gRPC Performance Testing Suite
# JIRA Ticket: AV11-517
#
# This script runs comprehensive gRPC performance tests using ghz.
# Prerequisites:
#   - ghz installed (brew install ghz or go install github.com/bojand/ghz/cmd/ghz@latest)
#   - Aurigraph V12 backend running on localhost:9004
#   - Proto files compiled and available
#
# Usage:
#   ./run-grpc-perf-tests.sh [scenario] [options]
#
# Examples:
#   ./run-grpc-perf-tests.sh                    # Run all scenarios
#   ./run-grpc-perf-tests.sh transaction_submit # Run specific scenario
#   ./run-grpc-perf-tests.sh --quick            # Quick smoke test (reduced load)
#

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROTO_DIR="${SCRIPT_DIR}/../../../src/main/proto"
REPORT_DIR="${SCRIPT_DIR}/reports"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
HOST="${GRPC_HOST:-localhost:9004}"
INSECURE="${GRPC_INSECURE:-true}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Ensure report directory exists
mkdir -p "${REPORT_DIR}"

# Print banner
print_banner() {
    echo ""
    echo -e "${BLUE}=====================================================${NC}"
    echo -e "${BLUE}    Aurigraph V12 gRPC Performance Testing Suite     ${NC}"
    echo -e "${BLUE}    JIRA: AV11-517 | Version: 12.0.0                 ${NC}"
    echo -e "${BLUE}=====================================================${NC}"
    echo ""
}

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"

    # Check ghz
    if ! command -v ghz &> /dev/null; then
        echo -e "${RED}Error: ghz not found. Install with: brew install ghz${NC}"
        echo "Or: go install github.com/bojand/ghz/cmd/ghz@latest"
        exit 1
    fi
    echo -e "${GREEN}  [OK] ghz found: $(ghz --version 2>&1 | head -1)${NC}"

    # Check proto files
    if [[ ! -d "${PROTO_DIR}" ]]; then
        echo -e "${RED}Error: Proto directory not found: ${PROTO_DIR}${NC}"
        exit 1
    fi
    echo -e "${GREEN}  [OK] Proto directory found${NC}"

    # Check if gRPC server is running
    if ! nc -z localhost 9004 2>/dev/null; then
        echo -e "${YELLOW}  [WARN] gRPC server not running on localhost:9004${NC}"
        echo -e "${YELLOW}  Tests will fail - start the server first:${NC}"
        echo -e "${YELLOW}    cd ../../../ && ./mvnw quarkus:dev${NC}"
    else
        echo -e "${GREEN}  [OK] gRPC server accessible on ${HOST}${NC}"
    fi

    echo ""
}

# Run a single test scenario
run_scenario() {
    local scenario_name=$1
    local service=$2
    local method=$3
    local concurrency=$4
    local requests=$5
    local duration=$6
    local data_file=$7
    local extra_args=${8:-""}

    local report_file="${REPORT_DIR}/${scenario_name}-${TIMESTAMP}.json"
    local html_report="${REPORT_DIR}/${scenario_name}-${TIMESTAMP}.html"

    echo -e "${BLUE}Running: ${scenario_name}${NC}"
    echo "  Service: ${service}"
    echo "  Method: ${method}"
    echo "  Concurrency: ${concurrency}"
    echo "  Requests: ${requests}"
    echo "  Duration: ${duration}"

    # Build ghz command
    local cmd="ghz --proto ${PROTO_DIR}/${service##*.}.proto \
        --import-paths ${PROTO_DIR} \
        --call ${service}/${method} \
        --concurrency ${concurrency} \
        --total ${requests} \
        --duration ${duration} \
        --output ${report_file} \
        --format json"

    if [[ "${INSECURE}" == "true" ]]; then
        cmd="${cmd} --insecure"
    fi

    if [[ -f "${data_file}" ]]; then
        cmd="${cmd} --data-file ${data_file}"
    fi

    cmd="${cmd} ${extra_args} ${HOST}"

    # Execute test
    echo "  Executing..."
    if eval "${cmd}" 2>/dev/null; then
        echo -e "  ${GREEN}[PASS]${NC} Results saved to: ${report_file}"

        # Parse and display key metrics
        if [[ -f "${report_file}" ]]; then
            local avg_latency=$(jq -r '.average // 0' "${report_file}" 2>/dev/null)
            local p95_latency=$(jq -r '.latencyDistribution[] | select(.percentage == 95) | .latency // 0' "${report_file}" 2>/dev/null)
            local rps=$(jq -r '.rps // 0' "${report_file}" 2>/dev/null)
            local error_rate=$(jq -r '.errorDistribution | length // 0' "${report_file}" 2>/dev/null)

            echo "  Metrics:"
            echo "    - Avg Latency: ${avg_latency}"
            echo "    - P95 Latency: ${p95_latency}"
            echo "    - RPS: ${rps}"
            echo "    - Errors: ${error_rate}"
        fi
    else
        echo -e "  ${RED}[FAIL]${NC} Test failed"
        return 1
    fi

    echo ""
}

# Run TransactionService scenarios
run_transaction_scenarios() {
    local quick_mode=${1:-false}

    echo -e "${BLUE}=== TransactionService Scenarios ===${NC}"
    echo ""

    # Create data files
    local submit_data="${SCRIPT_DIR}/data/submit_transaction.json"
    mkdir -p "${SCRIPT_DIR}/data"

    cat > "${submit_data}" << 'EOF'
{
  "transaction": {
    "from_address": "0x1234567890abcdef1234567890abcdef12345678",
    "to_address": "0xabcdef1234567890abcdef1234567890abcdef12",
    "amount": "1000000000000000000",
    "gas_price": 50.0,
    "gas_limit": 21000.0,
    "nonce": 1,
    "data": "",
    "signature": "0x"
  },
  "prioritize": false,
  "timeout_seconds": 30
}
EOF

    local status_data="${SCRIPT_DIR}/data/get_status.json"
    cat > "${status_data}" << 'EOF'
{
  "transaction_hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  "include_block_info": true,
  "include_confirmations": true
}
EOF

    local gas_data="${SCRIPT_DIR}/data/estimate_gas.json"
    cat > "${gas_data}" << 'EOF'
{
  "from_address": "0x1234567890abcdef1234567890abcdef12345678",
  "to_address": "0xabcdef1234567890abcdef1234567890abcdef12",
  "data": "",
  "amount": "1000000000000000000"
}
EOF

    # Adjust parameters for quick mode
    local c=100; local n=10000; local d="30s"
    if [[ "${quick_mode}" == "true" ]]; then
        c=10; n=100; d="5s"
    fi

    # Submit Transaction
    run_scenario "transaction_submit" \
        "io.aurigraph.v11.proto.TransactionService" \
        "submitTransaction" \
        "${c}" "${n}" "${d}" \
        "${submit_data}"

    # Get Transaction Status
    run_scenario "transaction_status" \
        "io.aurigraph.v11.proto.TransactionService" \
        "getTransactionStatus" \
        "$((c * 2))" "$((n * 5))" "${d}" \
        "${status_data}"

    # Estimate Gas Cost
    run_scenario "gas_estimation" \
        "io.aurigraph.v11.proto.TransactionService" \
        "estimateGasCost" \
        "${c}" "$((n * 2))" "${d}" \
        "${gas_data}"

    # Get Pending Transactions
    local pending_data="${SCRIPT_DIR}/data/get_pending.json"
    cat > "${pending_data}" << 'EOF'
{
  "limit": 100,
  "sort_by_fee": true
}
EOF
    run_scenario "get_pending" \
        "io.aurigraph.v11.proto.TransactionService" \
        "getPendingTransactions" \
        "${c}" "$((n / 2))" "${d}" \
        "${pending_data}"

    # Get TxPool Size
    local pool_data="${SCRIPT_DIR}/data/get_pool.json"
    cat > "${pool_data}" << 'EOF'
{
  "include_detailed_stats": true
}
EOF
    run_scenario "txpool_size" \
        "io.aurigraph.v11.proto.TransactionService" \
        "getTxPoolSize" \
        "${c}" "${n}" "${d}" \
        "${pool_data}"
}

# Run BlockchainService scenarios
run_blockchain_scenarios() {
    local quick_mode=${1:-false}

    echo -e "${BLUE}=== BlockchainService Scenarios ===${NC}"
    echo ""

    mkdir -p "${SCRIPT_DIR}/data"

    # Adjust parameters for quick mode
    local c=100; local n=10000; local d="30s"
    if [[ "${quick_mode}" == "true" ]]; then
        c=10; n=100; d="5s"
    fi

    # GetBlockByNumber
    local block_num_data="${SCRIPT_DIR}/data/get_block_number.json"
    cat > "${block_num_data}" << 'EOF'
{
  "block_number": 1
}
EOF
    run_scenario "get_block_by_number" \
        "io.aurigraph.v11.proto.BlockchainService" \
        "GetBlockByNumber" \
        "$((c * 2))" "$((n * 5))" "${d}" \
        "${block_num_data}"

    # GetBlockByHash
    local block_hash_data="${SCRIPT_DIR}/data/get_block_hash.json"
    cat > "${block_hash_data}" << 'EOF'
{
  "hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
EOF
    run_scenario "get_block_by_hash" \
        "io.aurigraph.v11.proto.BlockchainService" \
        "GetBlockByHash" \
        "$((c * 2))" "$((n * 5))" "${d}" \
        "${block_hash_data}"

    # GetLatestBlock
    local latest_data="${SCRIPT_DIR}/data/get_latest.json"
    cat > "${latest_data}" << 'EOF'
{}
EOF
    run_scenario "get_latest_block" \
        "io.aurigraph.v11.proto.BlockchainService" \
        "GetLatestBlock" \
        "$((c * 2))" "$((n * 5))" "${d}" \
        "${latest_data}"

    # GetBlockchainStatistics
    local stats_data="${SCRIPT_DIR}/data/get_stats.json"
    cat > "${stats_data}" << 'EOF'
{
  "time_window_minutes": 5,
  "include_detailed_metrics": true
}
EOF
    run_scenario "blockchain_statistics" \
        "io.aurigraph.v11.proto.BlockchainService" \
        "getBlockchainStatistics" \
        "$((c / 2))" "$((n / 2))" "${d}" \
        "${stats_data}"

    # CreateBlock (lower concurrency for write operations)
    local create_data="${SCRIPT_DIR}/data/create_block.json"
    cat > "${create_data}" << 'EOF'
{
  "block_id": "perf-test-block",
  "state_root": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "transactions": [],
  "transaction_root": "0x0000000000000000000000000000000000000000000000000000000000000000",
  "validator_count": 5
}
EOF
    run_scenario "create_block" \
        "io.aurigraph.v11.proto.BlockchainService" \
        "createBlock" \
        "$((c / 10))" "$((n / 100))" "${d}" \
        "${create_data}"
}

# Generate summary report
generate_summary() {
    local summary_file="${REPORT_DIR}/summary-${TIMESTAMP}.md"

    echo -e "${BLUE}Generating summary report...${NC}"

    cat > "${summary_file}" << EOF
# Aurigraph V12 gRPC Performance Test Summary

**Date:** $(date '+%Y-%m-%d %H:%M:%S')
**JIRA Ticket:** AV11-517
**Test Host:** ${HOST}

## Test Results

| Scenario | RPS | Avg Latency | P95 Latency | P99 Latency | Error Rate | Status |
|----------|-----|-------------|-------------|-------------|------------|--------|
EOF

    # Parse each report and add to summary
    for report in "${REPORT_DIR}"/*-${TIMESTAMP}.json; do
        if [[ -f "${report}" ]]; then
            local scenario=$(basename "${report}" | sed "s/-${TIMESTAMP}.json//")
            local rps=$(jq -r '.rps // 0' "${report}" 2>/dev/null)
            local avg=$(jq -r '.average // "N/A"' "${report}" 2>/dev/null)
            local p95=$(jq -r '.latencyDistribution[] | select(.percentage == 95) | .latency // "N/A"' "${report}" 2>/dev/null | head -1)
            local p99=$(jq -r '.latencyDistribution[] | select(.percentage == 99) | .latency // "N/A"' "${report}" 2>/dev/null | head -1)
            local errors=$(jq -r '.errorDistribution | length // 0' "${report}" 2>/dev/null)
            local status="PASS"

            if [[ "${errors}" -gt 0 ]]; then
                status="WARN"
            fi

            echo "| ${scenario} | ${rps} | ${avg} | ${p95:-N/A} | ${p99:-N/A} | ${errors} | ${status} |" >> "${summary_file}"
        fi
    done

    cat >> "${summary_file}" << 'EOF'

## Performance Targets

| Metric | Target | Description |
|--------|--------|-------------|
| Transaction Submit P95 | <50ms | Single transaction submission latency |
| Transaction Submit RPS | >10,000 | Sustained throughput for transaction submission |
| Block Lookup P95 | <20ms | Block retrieval by hash or number |
| Block Lookup RPS | >50,000 | High-frequency block queries |
| Error Rate | <1% | Overall error rate across all operations |

## Notes

- All tests run against gRPC endpoint on port 9004
- Protocol Buffers serialization provides 10x faster encoding than JSON
- HTTP/2 multiplexing enables parallel requests on single connection
- Target TPS: 2M+ with optimized gRPC stack

---
Generated by Aurigraph V12 gRPC Performance Testing Suite
EOF

    echo -e "${GREEN}Summary saved to: ${summary_file}${NC}"
}

# Main execution
main() {
    print_banner
    check_prerequisites

    local scenario="${1:-all}"
    local quick_mode="false"

    # Check for quick mode flag
    if [[ "${1}" == "--quick" ]] || [[ "${2}" == "--quick" ]]; then
        quick_mode="true"
        echo -e "${YELLOW}Running in QUICK mode (reduced load)${NC}"
        echo ""
    fi

    case "${scenario}" in
        "transaction"|"tx")
            run_transaction_scenarios "${quick_mode}"
            ;;
        "blockchain"|"block")
            run_blockchain_scenarios "${quick_mode}"
            ;;
        "all"|"--quick")
            run_transaction_scenarios "${quick_mode}"
            run_blockchain_scenarios "${quick_mode}"
            ;;
        *)
            echo "Running specific scenario: ${scenario}"
            # For specific scenarios, would need to implement individual runners
            echo -e "${YELLOW}Specific scenario execution not yet implemented${NC}"
            ;;
    esac

    generate_summary

    echo ""
    echo -e "${GREEN}=====================================================${NC}"
    echo -e "${GREEN}    Performance Testing Complete!                     ${NC}"
    echo -e "${GREEN}    Reports: ${REPORT_DIR}                            ${NC}"
    echo -e "${GREEN}=====================================================${NC}"
}

# Run main function
main "$@"
