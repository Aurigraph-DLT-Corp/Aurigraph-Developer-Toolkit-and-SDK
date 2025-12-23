# Aurigraph V11 Node Configuration Examples

This directory contains example configuration files for all four node types in the Aurigraph V11 blockchain platform.

## Node Types

### 1. Channel Node (`channel-node-example.json`)
**Purpose**: Coordinate multi-channel data flows and participant management

**Key Configuration Properties**:
- `maxChannels`: Maximum concurrent channels (default: 10,000)
- `maxParticipantsPerChannel`: Maximum participants per channel (default: 1,000)
- `messageQueueSize`: Message queue capacity (default: 100,000)
- `enableOffChainData`: Enable off-chain data storage
- `routingStrategy`: Message routing strategy (direct, broadcast, multicast)

**Performance Targets**:
- Channel creation: <10ms
- Message routing: <5ms
- Throughput: 500K messages/sec per node

---

### 2. Validator Node (`validator-node-example.json`)
**Purpose**: Participate in HyperRAFT++ consensus and validate transactions

**Key Configuration Properties**:
- `consensusAlgorithm`: Consensus algorithm (HyperRAFT++)
- `minValidators`: Minimum validators required (default: 4)
- `quorumPercentage`: Quorum percentage for consensus (default: 67%)
- `blockTime`: Target block time in milliseconds (default: 500ms)
- `blockSize`: Maximum transactions per block (default: 10,000)
- `enableAIOptimization`: Enable ML-based consensus optimization
- `stakingAmount`: Required staking amount

**Performance Targets**:
- Block proposal time: <500ms
- Consensus finality: <1s
- TPS per validator: 200K+
- Total network TPS: 2M+ (with 10+ validators)

---

### 3. Business Node (`business-node-example.json`)
**Purpose**: Execute business logic and smart contract operations

**Key Configuration Properties**:
- `maxConcurrentTransactions`: Maximum concurrent transactions (default: 10,000)
- `contractExecutionTimeout`: Smart contract timeout in ms (default: 5,000ms)
- `workflowEngine`: Workflow engine (Camunda, Flowable, Activiti, builtin)
- `enableRicardianContracts`: Enable Ricardian contract support
- `complianceMode`: Compliance mode (strict, moderate, permissive)
- `auditLogging`: Enable comprehensive audit logging
- `maxGasLimit`: Maximum gas limit for contracts

**Performance Targets**:
- Transaction execution: <20ms
- Contract execution: <100ms
- Throughput: 100K transactions/sec per node
- Contract call throughput: 50K calls/sec per node

---

### 4. API Integration Node (`api-node-example.json`)
**Purpose**: Integrate with external APIs and data sources

**Key Configuration Properties**:
- `apiConfigs`: External API configurations (Alpaca, Weather, etc.)
- `cacheSize`: Cache size for API responses (default: "5GB")
- `cacheTTL`: Cache time-to-live in seconds (default: 300)
- `enableOracleService`: Enable oracle service for smart contracts
- `oracleVerificationMode`: Verification mode (single_source, multi_source, consensus)
- `enableCircuitBreaker`: Enable circuit breaker pattern
- `maxRetryAttempts`: Maximum retry attempts (default: 3)

**Performance Targets**:
- API call latency: <100ms (with caching)
- Cache hit rate: >90%
- Data freshness: <5s for critical data
- Throughput: 10K external API calls/sec

---

## Common Configuration Properties

All node types share these common configuration sections:

### Network Configuration
```json
"network": {
  "networkId": "aurigraph-mainnet",
  "bootstrapNodes": ["node1:9000", "node2:9000"],
  "maxPeers": 100,
  "enableDiscovery": true
}
```

### Performance Configuration
```json
"performance": {
  "threadPoolSize": 256,
  "queueSize": 100000,
  "batchSize": 1000
}
```

### Security Configuration
```json
"security": {
  "enableTLS": true,
  "tlsCertPath": "/etc/aurigraph/tls/cert.pem",
  "tlsKeyPath": "/etc/aurigraph/tls/key.pem",
  "quantumResistant": true
}
```

### Monitoring Configuration
```json
"monitoring": {
  "metricsEnabled": true,
  "metricsPort": 9090,
  "healthCheckPort": 9091,
  "logLevel": "INFO"
}
```

---

## Usage

### Loading a Configuration

```java
@Inject
NodeConfigurationService configService;

// Load from file
NodeConfiguration config = configService.loadConfiguration("config/channel-node-1.json");

// Validate configuration
configService.validateConfiguration(config);

// Get configuration summary
String summary = configService.getConfigurationSummary(config);
```

### Creating a Default Configuration

```java
// Create default configuration
NodeConfiguration config = configService.createDefaultConfiguration(
    NodeType.VALIDATOR,
    "validator-node-001"
);

// Save to file
configService.saveConfiguration(config, "config/new-validator.json");
```

### Batch Loading Configurations

```java
// Load all configurations from a directory
List<NodeConfiguration> configs = configService.loadConfigurationsFromDirectory("config/");

// Validate all configurations
List<String> errors = configService.validateConfigurations(configs);
```

---

## Configuration Validation

The `NodeConfigurationService` performs comprehensive validation:

1. **Base Validation**:
   - Node ID uniqueness
   - Valid node type
   - Version format (MAJOR.MINOR.PATCH)
   - Network configuration validity
   - Performance settings validation
   - Security settings validation
   - Monitoring configuration validation

2. **Node-Specific Validation**:
   - Channel Node: Channel limits, routing strategy, persistence backend
   - Validator Node: Consensus parameters, block settings, staking amount
   - Business Node: Transaction limits, workflow engine, compliance mode
   - API Integration Node: API configurations, cache settings, circuit breaker

3. **Error Reporting**:
   - Detailed error messages
   - Configuration path in error
   - Validation failure reason

---

## Best Practices

1. **Environment-Specific Configurations**: Create separate configuration files for each environment (dev, staging, production)

2. **Security**: Never commit API keys or certificates to version control. Use environment variables or secure vaults.

3. **Performance Tuning**: Start with default values and adjust based on monitoring data

4. **Validation**: Always validate configurations before deployment

5. **Documentation**: Document any custom configuration parameters

6. **Backup**: Keep backup copies of working configurations

7. **Version Control**: Track configuration changes in version control (excluding sensitive data)

---

## Configuration File Locations

- **Development**: `config-examples/*.json` (examples only)
- **Production**: `/etc/aurigraph/config/*.json` (recommended)
- **Docker**: `/app/config/*.json` (container path)
- **Kubernetes**: ConfigMaps or Secrets

---

## Troubleshooting

### Configuration Load Failures

```
Error: Configuration file not found
Solution: Check file path is absolute or relative to working directory
```

```
Error: Invalid JSON format
Solution: Validate JSON syntax using a JSON validator
```

```
Error: Validation failed - Node ID cannot be null
Solution: Ensure all required fields are present
```

### Performance Issues

- If node performance is poor, check `threadPoolSize` and `queueSize`
- For high-throughput scenarios, increase `batchSize`
- Monitor memory usage and adjust cache sizes accordingly

### Network Connectivity

- Verify `bootstrapNodes` are reachable
- Check `maxPeers` is not too restrictive
- Ensure `enableDiscovery` is true for dynamic networks

---

## Related Documentation

- [Node Architecture Design](../docs/NODE-ARCHITECTURE-DESIGN.md)
- [Deployment Guide](../docs/DEPLOYMENT.md)
- [API Documentation](../docs/API.md)

---

**Version**: 11.0.0
**Last Updated**: October 11, 2025
**JIRA**: AV11-215
