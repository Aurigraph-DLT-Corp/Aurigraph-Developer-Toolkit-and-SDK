# Aurigraph AV10-7 Testing Framework

## Overview
Comprehensive automated testing suite for the AV10-7 Quantum Nexus blockchain platform, covering unit, functional, smoke, regression, performance, and security testing.

## Quick Start

### Run All Tests
```bash
npm test                    # All tests with coverage
npm run test:quick          # Fast feedback (unit + smoke)
npm run test:ci             # CI pipeline tests
```

### Run Specific Test Types
```bash
npm run test:unit           # Unit tests only
npm run test:smoke          # Smoke tests only
npm run test:integration    # Integration tests only
npm run test:performance    # Performance benchmarks
npm run test:regression     # Regression validation
npm run test:security       # Security tests
```

### Generate Reports
```bash
npm run test:report         # Comprehensive test report
node scripts/testing/generate-performance-report.js  # Performance report
```

## Test Framework Structure

```
tests/
├── unit/                   # Unit tests (isolated components)
│   ├── crypto/            # Quantum cryptography tests
│   ├── consensus/         # HyperRAFT++ consensus tests
│   ├── ai/               # AI optimizer tests
│   ├── crosschain/       # Cross-chain bridge tests
│   ├── network/          # Network infrastructure tests
│   └── api/              # API endpoint tests
├── integration/           # Integration tests (feature workflows)
├── performance/           # Performance and load tests
├── regression/           # Regression prevention tests
├── smoke/                # Critical path validation tests
├── security/             # Security validation tests
├── fixtures/             # Test data and configurations
└── utils/                # Test utilities and helpers
```

## Test Categories

### 1. Unit Tests
- **Purpose**: Test individual components in isolation
- **Coverage**: 95%+ code coverage target
- **Focus**: Crypto, consensus, AI, network, API components
- **Runtime**: <5 minutes

### 2. Smoke Tests
- **Purpose**: Validate critical system operations
- **Coverage**: Essential functionality verification
- **Focus**: Platform startup, API availability, basic operations
- **Runtime**: <2 minutes

### 3. Integration Tests  
- **Purpose**: Test feature interactions and workflows
- **Coverage**: End-to-end transaction processing
- **Focus**: Cross-component integration, data flow
- **Runtime**: <10 minutes

### 4. Performance Tests
- **Purpose**: Validate TPS and latency requirements
- **Coverage**: 1M+ TPS target validation
- **Focus**: Throughput, latency, scalability, resource usage
- **Runtime**: <30 minutes

### 5. Regression Tests
- **Purpose**: Prevent functionality degradation
- **Coverage**: API compatibility, feature stability
- **Focus**: Backward compatibility, configuration stability
- **Runtime**: <10 minutes

### 6. Security Tests
- **Purpose**: Validate security implementations
- **Coverage**: Quantum cryptography, API security
- **Focus**: Vulnerability prevention, encryption validation
- **Runtime**: <15 minutes

## Performance Targets

### Throughput
- **Target**: 1,000,000+ TPS sustained
- **Measurement**: Real-time TPS monitoring
- **Success Criteria**: Maintain target ±5%

### Latency
- **Target**: <500ms transaction finality
- **Measurement**: End-to-end transaction time
- **Success Criteria**: 95th percentile under target

### Success Rate
- **Target**: 99%+ transaction success rate
- **Measurement**: Successful vs failed transactions
- **Success Criteria**: Maintain rate under load

## Security Validation

### Quantum Cryptography
- NIST Level 5 compliance verification
- CRYSTALS-Kyber/Dilithium implementation testing
- SPHINCS+ signature validation
- Key generation entropy verification

### Network Security
- Encrypted channel validation
- P2P communication security
- API endpoint protection
- DDoS resistance testing

### Privacy Protection
- Zero-knowledge proof soundness
- Transaction privacy validation
- Data encryption verification
- No sensitive data exposure

## Test Automation

### Local Development
```bash
# Watch mode for development
npm test -- --watch

# Coverage with watch
npm test -- --coverage --watch

# Specific component testing
npm test -- --testPathPattern=crypto

# Debug mode
npm test -- --runInBand --verbose
```

### CI/CD Integration
- **Pre-commit**: Unit tests + linting
- **Pull Request**: Unit + smoke + integration tests
- **Merge**: Full test suite including regression
- **Nightly**: Performance + security comprehensive testing

### Test Scripts
```bash
# Run complete test suite
./scripts/testing/run-test-suite.sh all

# Quick validation
./scripts/testing/run-test-suite.sh quick

# Performance benchmarking
./scripts/testing/run-test-suite.sh performance

# Generate reports
node scripts/testing/generate-comprehensive-report.js
```

## Coverage Requirements

### Global Thresholds
- **Lines**: 95%+ coverage required
- **Functions**: 90%+ coverage required  
- **Branches**: 85%+ coverage required
- **Statements**: 95%+ coverage required

### Component-Specific Thresholds
- **Cryptography**: 98%+ (critical security component)
- **Consensus**: 95%+ (core functionality)
- **Cross-chain**: 90%+ (complex integrations)
- **AI**: 85%+ (machine learning algorithms)

## Test Data Management

### Mock Data
- Quantum key pairs for crypto testing
- Transaction datasets for performance testing
- Validator configurations for consensus testing
- Network topologies for infrastructure testing

### Fixtures
- Blockchain state snapshots
- Cross-chain bridge configurations  
- AI model training datasets
- Performance baseline metrics

## Troubleshooting

### Common Issues
1. **Platform Not Running**: Tests require platform to be started
   ```bash
   npm start  # Start platform first
   npm test   # Then run tests
   ```

2. **Coverage Thresholds**: Adjust thresholds in `jest.config.js`
   ```javascript
   coverageThreshold: {
     global: { lines: 95, functions: 90 }
   }
   ```

3. **Test Timeouts**: Increase timeout for slow tests
   ```javascript
   jest.setTimeout(30000); // 30 seconds
   ```

### Debug Commands
```bash
# Verbose test output
npm test -- --verbose

# Run specific test file
npm test -- tests/unit/crypto/QuantumCryptoManager.test.ts

# Debug mode (no parallel execution)
npm test -- --runInBand

# Update snapshots
npm test -- --updateSnapshot
```

## Reporting

### HTML Reports
- **Location**: `reports/comprehensive/`
- **Content**: Test results, coverage, performance metrics
- **Access**: Open `latest-comprehensive-report.html` in browser

### JSON Reports  
- **Location**: `reports/comprehensive/`
- **Content**: Machine-readable test data
- **Usage**: CI/CD integration, automated analysis

### Coverage Reports
- **Location**: `coverage/`
- **Format**: HTML, LCOV, JSON
- **Integration**: Codecov, SonarQube compatible

## Contributing

### Adding New Tests
1. Place tests in appropriate category directory
2. Follow naming convention: `ComponentName.test.ts`
3. Include setup/teardown as needed
4. Add meaningful assertions and error messages
5. Update coverage thresholds if needed

### Test Guidelines
- Use descriptive test names
- Include both positive and negative test cases
- Mock external dependencies
- Test error conditions and edge cases
- Maintain test independence (no shared state)

### Performance Test Guidelines
- Use realistic data volumes
- Include warmup periods for accurate measurements
- Test under various load conditions
- Monitor resource usage during tests
- Document performance baselines

This testing framework ensures the AV10-7 platform maintains its quantum-resilient, high-performance, and secure operation through comprehensive automated validation.