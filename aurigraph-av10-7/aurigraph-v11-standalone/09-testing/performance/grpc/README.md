# Aurigraph V12 gRPC Performance Testing Suite

**JIRA Ticket:** AV11-517
**Version:** 12.0.0
**Sprint:** Sprint 2 - gRPC & Streaming Implementation

## Overview

This directory contains the comprehensive gRPC performance testing suite for Aurigraph V12. The suite uses [ghz](https://ghz.sh/), a gRPC benchmarking and load testing tool, to evaluate the performance of TransactionService and BlockchainService.

## Prerequisites

1. **Install ghz:**
   ```bash
   # macOS
   brew install ghz

   # Go (any platform)
   go install github.com/bojand/ghz/cmd/ghz@latest
   ```

2. **Start Aurigraph V12 Backend:**
   ```bash
   cd ../../..
   ./mvnw quarkus:dev
   ```
   The gRPC server should be running on `localhost:9004`

3. **jq (for report parsing):**
   ```bash
   brew install jq  # macOS
   apt install jq   # Debian/Ubuntu
   ```

## Quick Start

```bash
# Run all performance tests
./run-grpc-perf-tests.sh

# Run quick smoke test (reduced load)
./run-grpc-perf-tests.sh --quick

# Run only TransactionService tests
./run-grpc-perf-tests.sh transaction

# Run only BlockchainService tests
./run-grpc-perf-tests.sh blockchain
```

## Test Scenarios

### TransactionService

| Scenario | Method | Description | Target RPS | Target P95 |
|----------|--------|-------------|------------|------------|
| `transaction_submit` | submitTransaction | Single transaction submission | 10,000 | <50ms |
| `transaction_status` | getTransactionStatus | Transaction status lookup | 50,000 | <20ms |
| `gas_estimation` | estimateGasCost | Gas cost estimation | 20,000 | <20ms |
| `get_pending` | getPendingTransactions | Pending transaction list | 5,000 | <50ms |
| `txpool_size` | getTxPoolSize | Transaction pool statistics | 10,000 | <20ms |

### BlockchainService

| Scenario | Method | Description | Target RPS | Target P95 |
|----------|--------|-------------|------------|------------|
| `get_block_by_number` | GetBlockByNumber | Block lookup by height | 50,000 | <20ms |
| `get_block_by_hash` | GetBlockByHash | Block lookup by hash | 50,000 | <20ms |
| `get_latest_block` | GetLatestBlock | Latest block retrieval | 50,000 | <20ms |
| `blockchain_statistics` | getBlockchainStatistics | Network metrics | 5,000 | <100ms |
| `create_block` | createBlock | Block creation | 100 | <30ms |

## Configuration

Edit `ghz-config.json` to customize:
- Target host and port
- Concurrency levels
- Request counts
- Duration limits
- Performance targets

## Reports

Test reports are saved to the `reports/` directory:
- Individual JSON reports per scenario
- Summary markdown report with all metrics

### Sample Report Structure

```
reports/
  ├── transaction_submit-20251221-120000.json
  ├── transaction_status-20251221-120000.json
  ├── get_block_by_number-20251221-120000.json
  └── summary-20251221-120000.md
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GRPC_HOST` | localhost:9004 | Target gRPC host:port |
| `GRPC_INSECURE` | true | Use insecure connection (no TLS) |

## Performance Targets

The Aurigraph V12 platform targets:

- **Transaction Processing:** 2M+ TPS sustained
- **Block Lookups:** <5ms average latency (cached)
- **gRPC Protocol Benefits:**
  - 10x faster serialization (Protocol Buffers vs JSON)
  - 50-70% smaller payloads
  - HTTP/2 multiplexing for parallel requests

## Integration with CI/CD

Add to your CI pipeline:

```yaml
- name: Run gRPC Performance Tests
  run: |
    cd aurigraph-v11-standalone/09-testing/performance/grpc
    ./run-grpc-perf-tests.sh --quick

- name: Upload Performance Reports
  uses: actions/upload-artifact@v3
  with:
    name: grpc-performance-reports
    path: aurigraph-v11-standalone/09-testing/performance/grpc/reports/
```

## Troubleshooting

### Connection Refused
Ensure the gRPC server is running:
```bash
curl -v localhost:9004
```

### Proto File Not Found
Check the proto directory path in the script matches your project structure.

### High Error Rate
- Reduce concurrency for your hardware
- Check server logs for exceptions
- Verify proto definitions match server implementation

## Related Documentation

- [gRPC API Documentation](../../../GRPC-API.md)
- [Streaming Protocol Summary](../../../STREAMING_PROTOCOL_SUMMARY.md)
- [Proto Definitions](../../../src/main/proto/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 12.0.0 | 2025-12-21 | Initial release for Sprint 2 |
