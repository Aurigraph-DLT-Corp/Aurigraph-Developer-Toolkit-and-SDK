# 01-source/ - Application Source Code

## Purpose
This directory contains all application source code for the Aurigraph V12 platform. It is organized following secure software development lifecycle (SSDLC) principles and ISO 27001 control A.14.2 (Security in development and support processes).

## Directory Structure

```
01-source/
├── main/                    # Production application code
│   ├── java/               # Java source files
│   │   └── io/aurigraph/v11/
│   │       ├── consensus/  # HyperRAFT++ consensus implementation
│   │       ├── crypto/     # Quantum-resistant cryptography
│   │       ├── ai/         # AI optimization services
│   │       ├── bridge/     # Cross-chain bridge
│   │       ├── rwa/        # Real-world asset tokenization
│   │       └── ...
│   ├── resources/          # Application resources
│   │   ├── application.properties
│   │   ├── META-INF/
│   │   └── static/
│   ├── docker/             # Docker-specific application files
│   └── proto/              # Protocol Buffer definitions
├── test/                    # Test source code
│   ├── java/               # Java test files
│   └── resources/          # Test resources
└── README.md               # This file
```

## Technology Stack

- **Language**: Java 21 with Virtual Threads
- **Framework**: Quarkus 3.29.0
- **Build Tool**: Maven 3.9+
- **Communication**: gRPC + Protocol Buffers, REST API
- **Reactive**: Mutiny for reactive streams
- **Database**: PostgreSQL with Panache, RocksDB
- **Native Compilation**: GraalVM

## Development Guidelines

### Code Organization
1. **Package Structure**: Follow domain-driven design
2. **Naming Conventions**: CamelCase for classes, camelCase for methods
3. **Documentation**: Javadoc for all public APIs
4. **Error Handling**: Use proper exception hierarchies

### Security Requirements
1. **Input Validation**: All external inputs must be validated
2. **Output Encoding**: Prevent injection attacks
3. **Cryptography**: Use approved cryptographic libraries only
4. **Secrets**: No hardcoded secrets or credentials
5. **Dependency Scanning**: Regular dependency vulnerability checks

### Code Quality Standards
- **Test Coverage**: Minimum 80% line coverage
- **Code Review**: All changes require peer review
- **Static Analysis**: SonarQube passing
- **Linting**: Checkstyle compliant

### Building the Application

```bash
# Development build
./mvnw clean compile

# Package application
./mvnw clean package

# Run in dev mode (hot reload)
./mvnw quarkus:dev

# Run tests
./mvnw test

# Build native image
./mvnw package -Pnative

# Run native executable
./target/aurigraph-v12-standalone-12.0.0-runner
```

## Key Components

### main/java/io/aurigraph/v11/

#### AurigraphResource.java
Main REST API endpoints for the platform.

**Endpoints**:
- `GET /api/v11/health` - Health check
- `GET /api/v11/info` - System information
- `GET /api/v11/stats` - Transaction statistics
- `POST /api/v11/transactions` - Submit transaction
- `GET /api/v11/blockchain/transactions` - Query transactions

#### consensus/HyperRAFTConsensusService.java
HyperRAFT++ consensus implementation with:
- Parallel log replication
- AI-driven optimization
- Byzantine fault tolerance
- Leader election (150-300ms timeout)

#### crypto/QuantumCryptoService.java
Quantum-resistant cryptography (NIST Level 5):
- CRYSTALS-Dilithium for signatures
- CRYSTALS-Kyber for encryption
- Key management and rotation

#### ai/AIOptimizationService.java
Machine learning-based optimization:
- Transaction ordering optimization
- Resource allocation
- Predictive scaling
- Performance tuning

#### bridge/CrossChainBridgeService.java
Cross-chain interoperability:
- Asset transfer between chains
- State verification
- Security validation
- Bridge monitoring

#### rwa/RWATRegistryService.java
Real-world asset tokenization:
- Asset registration
- Merkle tree tracking
- Oracle integration
- Compliance validation

### main/resources/

#### application.properties
Main application configuration:
- HTTP/gRPC ports
- Database connections
- Quarkus settings
- Logging configuration

**Key Settings**:
```properties
quarkus.http.port=9003
quarkus.http.http2=true
quarkus.native.container-build=true
```

### proto/
Protocol Buffer definitions for gRPC services:
- Transaction messages
- Consensus messages
- Bridge protocols
- API definitions

## Testing

### Test Structure
```
test/
├── java/io/aurigraph/v11/
│   ├── AurigraphResourceTest.java
│   ├── TransactionServiceTest.java
│   ├── consensus/HyperRAFTTest.java
│   ├── crypto/QuantumCryptoTest.java
│   └── ...
└── resources/
    └── test-config.properties
```

### Running Tests

```bash
# All tests
./mvnw test

# Specific test class
./mvnw test -Dtest=AurigraphResourceTest

# Specific test method
./mvnw test -Dtest=TransactionServiceTest#testHighThroughput

# With coverage
./mvnw verify

# View coverage report
open target/site/jacoco/index.html
```

### Test Categories
- **Unit Tests**: Test individual components
- **Integration Tests**: Test component interactions
- **Performance Tests**: Validate TPS requirements
- **Security Tests**: Cryptography and access control

## Performance Targets

- **TPS**: 2M+ sustained transactions per second
- **Finality**: <100ms transaction finality
- **Startup**: <1s (native), ~3s (JVM)
- **Memory**: <256MB (native), ~512MB (JVM)
- **Carbon Footprint**: <0.17 gCO₂/transaction

## Security Considerations

### Cryptographic Standards
- **Quantum-Resistant**: NIST-approved post-quantum cryptography
- **Key Size**: 2,592 bytes (Dilithium public key)
- **Signature**: 3,309 bytes (Dilithium signature)
- **Encryption**: Module-LWE based (Kyber)

### Secure Coding Practices
1. **Input Validation**: Validate all inputs at boundaries
2. **SQL Injection Prevention**: Use parameterized queries
3. **XSS Prevention**: Sanitize all outputs
4. **CSRF Protection**: Token-based protection
5. **Rate Limiting**: Implemented at API layer

### Dependency Management
- Regular dependency updates
- Vulnerability scanning (OWASP Dependency-Check)
- Approved dependency list
- License compliance

## CI/CD Integration

### Build Pipeline
1. Code checkout
2. Dependency download
3. Compilation
4. Unit tests
5. Static analysis
6. Security scanning
7. Package creation
8. Artifact upload

### Quality Gates
- Test coverage ≥ 80%
- No critical vulnerabilities
- Code smells < threshold
- Build time < 10 minutes

## Documentation Standards

### Code Documentation
```java
/**
 * Processes a blockchain transaction with validation and consensus.
 *
 * @param transaction The transaction to process
 * @return TransactionResult containing status and hash
 * @throws ValidationException if transaction is invalid
 * @throws ConsensusException if consensus fails
 */
public TransactionResult processTransaction(Transaction transaction) {
    // Implementation
}
```

### API Documentation
- OpenAPI 3.0 specifications
- Generated Swagger UI
- Request/response examples
- Error code documentation

## Access Control

**Access Level**: Developers only

**Permissions**:
- Read: All developers
- Write: Approved after code review
- Delete: Tech leads only

## Related Documentation

- [Architecture Documentation](../04-documentation/architecture/)
- [API Documentation](../04-documentation/api/)
- [Development Guidelines](../04-documentation/development/)
- [Testing Strategy](../09-testing/README.md)

## Support

- **Tech Lead**: tech-lead@aurigraph.io
- **Security Reviews**: security@aurigraph.io
- **Build Issues**: devops@aurigraph.io

---

**Document Classification**: Internal
**Last Updated**: 2025-11-25
**Next Review**: 2026-02-25
