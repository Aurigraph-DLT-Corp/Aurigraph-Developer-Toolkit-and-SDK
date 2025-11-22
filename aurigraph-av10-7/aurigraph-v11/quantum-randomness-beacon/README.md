# Quantum Randomness Beacon Integration

## Overview

This module integrates **CURBy** (CU Randomness Beacon) with Aurigraph V11 to provide quantum-certified random number generation for cryptographic operations.

### What is CURBy?

CURBy is a quantum randomness generation service developed at the University of Colorado that provides:

- **Quantum randomness** derived from Bell test experiments
- **Certification** that the randomness is genuinely quantum-derived (not algorithmic)
- **NIST compliance** (NIST SP 800-90B standard)
- **Bell test verification** of quantum origins

### Why Quantum Randomness?

Aurigraph V11 employs quantum-resistant cryptography (CRYSTALS-Dilithium, CRYSTALS-Kyber) and uses randomness in:

1. **Key Generation**: High-entropy random seeds for cryptographic keys
2. **Transaction Nonces**: Preventing transaction replay attacks
3. **Consensus Tie-Breaking**: HyperRAFT++ consensus randomization
4. **Validator Entropy**: Distributing validator selection randomly

Quantum-certified randomness ensures these operations cannot be predicted or manipulated by adversaries.

## Module Structure

```
quantum-randomness-beacon/
├── src/main/java/io/aurigraph/v11/quantum/randomness/
│   ├── CURByClient.java         # Core integration service
│   └── CURByResource.java       # REST API endpoints
├── pom.xml                       # Maven configuration
└── README.md                     # This file
```

## API Endpoints

### Get Quantum Random Bytes

```http
GET /api/v11/quantum/randomness/random-bytes?size=32
```

Returns cryptographically-secure quantum random bytes (Base64-encoded).

**Parameters:**
- `size`: Number of bytes (1-1024, default: 32)

**Response:**
```json
{
  "bytes": "base64-encoded-random-data",
  "size": 32,
  "source": "CURBY_QUANTUM_BEACON",
  "verified": true
}
```

### Generate Transaction Nonce

```http
GET /api/v11/quantum/randomness/transaction-nonce
```

Creates a unique transaction identifier using quantum randomness.

**Response:**
```json
{
  "nonce": 9223372036854775807,
  "source": "CURBY_QUANTUM_BEACON",
  "timestamp": 1700668800000
}
```

### Generate Cryptographic Seed

```http
GET /api/v11/quantum/randomness/crypto-seed?length=32
```

Generates a seed for cryptographic key derivation.

**Parameters:**
- `length`: Seed length in bytes (16-256, default: 32)

**Response:**
```json
{
  "seed": "base64-encoded-seed",
  "length": 32,
  "source": "CURBY_QUANTUM_BEACON",
  "verified": true
}
```

### Check Service Health

```http
GET /api/v11/quantum/randomness/health
```

Verifies connectivity and functionality of the quantum randomness service.

**Response:**
```json
{
  "status": "operational",
  "service": "CURBy Quantum Randomness Beacon",
  "endpoint": "https://beacon.colorado.edu",
  "capabilities": [
    "quantum_random_generation",
    "bell_test_certification",
    "nist_compliant"
  ],
  "timestamp": 1700668800000
}
```

### Get Service Information

```http
GET /api/v11/quantum/randomness/info
```

Returns service details and specifications.

## Integration Points

### 1. Cryptographic Key Generation

```java
@Inject
private CURByClient curbyClient;

// Generate 32-byte seed for CRYSTALS-Dilithium key generation
byte[] seed = curbyClient.generateQuantumSeed(32);
```

### 2. Transaction Processing

```java
// Generate unique transaction nonce to prevent replay attacks
long nonce = curbyClient.generateQuantumNonce();
transaction.setNonce(nonce);
```

### 3. Consensus Algorithm

```java
// HyperRAFT++ leader election tie-breaking
byte[] randomBytes = curbyClient.getQuantumRandomBytes(8);
long randomValue = ByteBuffer.wrap(randomBytes).getLong();
if (randomValue % 2 == 0) {
    // Break tie in favor of candidate A
} else {
    // Break tie in favor of candidate B
}
```

### 4. Validator Node Entropy

```java
// Entropy for validator node randomization
byte[] validatorSeed = curbyClient.generateQuantumSeed(64);
validatorSelector.initializeWithQuantumEntropy(validatorSeed);
```

## Configuration

### application.properties

```properties
# CURBy Configuration
quarkus.rest-client."io.aurigraph.v11.quantum.randomness.CURByClient".url=https://beacon.colorado.edu
quarkus.rest-client."io.aurigraph.v11.quantum.randomness.CURByClient".connect-timeout=10000
quarkus.rest-client."io.aurigraph.v11.quantum.randomness.CURByClient".read-timeout=30000

# Cache TTL (seconds)
io.aurigraph.quantum.randomness.cache.ttl=3600
```

## Fallback Mechanism

If CURBy is unavailable (network outage, service maintenance), the module automatically falls back to:

- **Java SecureRandom**: Cryptographically-secure pseudorandom number generator
- **Logging**: Warning entries indicating fallback usage

This ensures system reliability while maintaining strong randomness properties.

## Performance Characteristics

- **Latency**: ~100-500ms per call to CURBy (including network round-trip)
- **Caching**: 1-hour TTL for repeated requests of same size
- **Throughput**: ~10 requests/second (network-limited)
- **Fallback**: <1ms using SecureRandom

## Security Considerations

1. **Transport Security**: All CURBy communications use TLS 1.3
2. **Certification Validation**: Bell test proof verification on receipt
3. **No Predictability**: Quantum randomness cannot be predicted even with perfect information
4. **NIST Compliance**: Meets NIST SP 800-90B requirements

## Testing

Unit tests verify:
- Quantum randomness availability
- Cache behavior
- Fallback activation
- Response format validation

```bash
mvn test
```

## References

- [CU Randomness Beacon Project](https://github.com/buff-beacon-project)
- [NIST SP 800-90B: Recommendation for the Entropy Sources Used for Random Bit Generation](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-90B.pdf)
- [Bell Test Quantum Randomness](https://en.wikipedia.org/wiki/Bell_test)
- [Quantum Cryptography Standards](https://csrc.nist.gov/projects/post-quantum-cryptography/)

## License

This integration module is part of Aurigraph DLT and follows the same licensing terms as the main project.

## Support

For issues or questions about CURBy integration, contact:
- Aurigraph Development Team
- CU Randomness Beacon Project: https://github.com/buff-beacon-project
