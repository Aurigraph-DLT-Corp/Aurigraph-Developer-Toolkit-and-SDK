# Aurigraph Security & Cryptography Architecture

**Version**: 11.1.0 | **Section**: Cryptography & Security | **Status**: 🟢 NIST Level 5
**Last Updated**: 2025-11-17 | **Related**: [ARCHITECTURE-MAIN.md](./ARCHITECTURE-MAIN.md)

---

## Multi-Layer Security Model (6 Layers)

```
┌─────────────────────────────────────────────────────┐
│         Application Layer Security                  │
│  - Input validation (SQL injection, XSS)            │
│  - Output encoding                                  │
│  - CSRF protection (token validation)               │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│           API Layer Security                        │
│  - OAuth 2.0 / OpenID Connect                       │
│  - JWT tokens (1 hour expiry, 7 day refresh)        │
│  - Rate limiting (1000 req/min per user)            │
│  - API key validation & rotation                    │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│         Transport Layer Security                    │
│  - TLS 1.3 minimum (1.2 supported)                  │
│  - HTTP/2 with ALPN                                 │
│  - Certificate pinning (cross-chain comms)          │
│  - HSTS (31536000 seconds)                          │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│        Cryptography Layer Security                  │
│  - CRYSTALS-Dilithium (digital signatures)          │
│  - CRYSTALS-Kyber (encryption)                      │
│  - NIST Level 5 quantum resistance                  │
│  - Zero-knowledge proofs (privacy)                  │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│         Consensus Layer Security                    │
│  - Byzantine fault tolerance (f < n/3)              │
│  - Quorum-based validation (2f + 1)                 │
│  - Sybil attack prevention                          │
│  - Leader election with term numbers                │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│          Network Layer Security                     │
│  - Encrypted P2P channels (TLS 1.3)                 │
│  - DDoS protection (rate limiting)                  │
│  - IP filtering & ACLs                              │
│  - Gossip protocol with signature verification      │
└─────────────────────────────────────────────────────┘
```

---

## Quantum-Resistant Cryptography

### NIST Level 5 Certification
All cryptographic algorithms meet NIST Post-Quantum Cryptography standards

### CRYSTALS-Dilithium (Digital Signatures)

**Algorithm**: Lattice-based cryptography (Module-LWE)
**Security Level**: NIST Level 5 (≥256-bit quantum security)
**Key Sizes**:
- Public Key: 2,592 bytes
- Secret Key: 4,896 bytes
- Signature Size: 3,309 bytes

**Performance**:
```
Key Generation: ~50 microseconds
Sign Operation: ~100 microseconds
Verify Operation: ~200 microseconds
```

**Use Cases**:
- Transaction signing
- Block signing
- Oracle verification
- Smart contract signatures

### CRYSTALS-Kyber (Encryption)

**Algorithm**: Module-LWE (Key Encapsulation Mechanism)
**Security Level**: NIST Level 5
**Key Sizes**:
- Public Key: 1,568 bytes
- Secret Key: 3,168 bytes
- Ciphertext Size: 1,568 bytes
- Shared Secret: 32 bytes

**Performance**:
```
Key Generation: ~100 microseconds
Encapsulation: ~150 microseconds
Decapsulation: ~200 microseconds
```

**Use Cases**:
- Session key establishment
- Encryption of sensitive data
- Inter-validator communication
- Cross-chain bridge keys

---

## Security Guardrails

### Cryptographic Standards
- **Mandatory**: NIST Level 5 quantum-resistant cryptography
- **Prohibited**: SHA-1, MD5, DES, RSA < 4096 bits
- **Required**: CRYSTALS-Dilithium (signatures), CRYSTALS-Kyber (encryption)
- **Key Rotation**: Every 90 days for production keys

### API Security
- **Rate Limiting**: 1000 req/min per authenticated user
- **Authentication**: OAuth 2.0 + JWT mandatory
- **Authorization**: Role-based access control (RBAC)
- **Encryption**: TLS 1.3 minimum, no downgrade allowed

### Access Control
- **Admin Actions**: Require 2FA + audit log
- **Sensitive Operations**: Multi-signature approval (2-of-3)
- **Key Storage**: Hardware security modules (HSM) only
- **Backup Encryption**: AES-256-GCM mandatory

---

## Zero-Knowledge Proofs

### Implementation
- **Use Case**: Privacy-preserving transactions
- **Protocol**: Bulletproofs (range proofs)
- **Proof Size**: ~650 bytes per range proof
- **Verification Time**: ~10ms

### Privacy Features
- **Transaction Hiding**: Amount, sender, recipient obfuscation
- **Selective Disclosure**: Prove facts without revealing data
- **Compliance**: Support GDPR "right to be forgotten"

---

## Key Management

### Production Key Lifecycle

```
1. Key Generation (HSM)
   ├─ FIPS 140-2 Level 3 device
   ├─ Cryptographically secure random
   └─ Immediate backup in HSM

2. Key Distribution
   ├─ Sealed transport (encrypted, signed)
   ├─ Multi-party computation (no single key exposure)
   └─ Per-environment isolation

3. Key Storage
   ├─ Hardware Security Module (HSM)
   ├─ Encrypted at-rest (AES-256)
   └─ Access logs (audit trail)

4. Key Rotation
   ├─ Every 90 days (scheduled)
   ├─ On demand (compromise suspected)
   └─ Dual-key operation during transition (30-day overlap)

5. Key Retirement
   ├─ Secure destruction (overwrite + physical destruction)
   ├─ Audit trail (destruction verification)
   └─ Archive retention (7 years legal hold)
```

### Encryption Key Hierarchy

```
Root Key (HSM, quarterly rotation)
    │
    ├─ Database Encryption Key (monthly rotation)
    │   └─ TDE (Transparent Data Encryption) for PostgreSQL
    │
    ├─ API Key Encryption Key (monthly rotation)
    │   └─ API key encryption at-rest
    │
    ├─ Session Key Encryption Key (weekly rotation)
    │   └─ WebSocket and JWT secret encryption
    │
    └─ Backup Encryption Key (quarterly rotation)
        └─ AES-256-GCM for backup files
```

---

## Certificate Management

### TLS Certificates

**Provider**: Let's Encrypt (ACME protocol)
**Validity**: 90 days (auto-renewal at 30 days)
**Encryption**: ECDSA P-384 (post-quantum migration planned)

### Certificate Pinning

**For Cross-Chain Communication**:
- Pin SHA-256 hash of oracle certificates
- Pin root CA certificate chain
- Expire pins every 6 months
- Automated rollout of new pins

---

## Threat Model & Mitigations

### Threat 1: Quantum Computing Attack
**Mitigation**: NIST Level 5 cryptography (CRYSTALS)
**Timeline**: Protected against quantum computers up to 2030+

### Threat 2: Private Key Compromise
**Mitigation**:
- HSM storage (physical security)
- Multi-sig for sensitive operations
- 2FA for admin access
- Immediate rotation capability

### Threat 3: Network Eavesdropping
**Mitigation**:
- TLS 1.3 encryption (256-bit keys)
- Perfect forward secrecy (DHE)
- Certificate pinning (cross-chain)

### Threat 4: Consensus Attack
**Mitigation**:
- Byzantine fault tolerance (f < n/3)
- Digital signature verification
- Quorum-based decisions
- Cryptographic sortition

### Threat 5: Sybil Attack
**Mitigation**:
- Stake-based node identity
- Validator registration (KYC)
- Reputation scoring
- Slashing for misbehavior

---

## Audit & Compliance

### Security Audits
- **Internal**: Monthly code review + static analysis
- **External**: Quarterly by certified firm
- **Penetration Testing**: Semi-annually
- **Vulnerability Disclosure**: 48-hour patch timeline for P0/P1

### Compliance Standards
- **Data Privacy**: GDPR, CCPA compliant
- **Financial**: AML/KYC integration required for RWA
- **Audit Logging**: Immutable, tamper-proof, 7-year retention
- **Encryption**: FIPS 140-2 Level 3 for HSM

---

## Security Configuration

### TLS Configuration
```
Minimum Version: TLS 1.2
Preferred Version: TLS 1.3
Cipher Suites:
  - TLS_AES_256_GCM_SHA384
  - TLS_CHACHA20_POLY1305_SHA256
  - ECDHE-ECDSA-AES256-GCM-SHA384
Session Resumption: Enabled with tickets
OCSP Stapling: Enabled
```

### Content Security Policy
```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net
style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://fonts.googleapis.com
img-src 'self' data: https:
font-src 'self' data: https://fonts.gstatic.com https://cdnjs.cloudflare.com
connect-src 'self' https://dlt.aurigraph.io https://iam2.aurigraph.io https://cdn.jsdelivr.net
frame-ancestors 'self'
```

### Security Headers
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), camera=()
```

---

## Incident Response

### Crypto-Related Incident Procedures
1. **Detection** (<1 minute): Automated monitoring alerts
2. **Triage** (<5 minutes): Severity assessment
3. **Containment** (<30 minutes): Isolate affected systems
4. **Mitigation** (<1 hour): Rotate compromised keys
5. **Recovery** (<4 hours): Full service restoration
6. **Post-Mortem** (48 hours): Root cause analysis

---

## Future Enhancements

### Quantum-Safe Migration
- **2026**: Hybrid ECDSA/CRYSTALS (gradual transition)
- **2027**: Full CRYSTALS migration
- **2028**: Legacy ECDSA sunset

### Zero-Knowledge Enhancement
- StarkProof integration (scalable ZK proofs)
- Succinct universal arguments (SNARK)
- Privacy pool implementation (coin mixing)

---

**Navigation**: [Main](./ARCHITECTURE-MAIN.md) | [Technology Stack](./ARCHITECTURE-TECHNOLOGY-STACK.md) | [Components](./ARCHITECTURE-V11-COMPONENTS.md) | [APIs](./ARCHITECTURE-API-ENDPOINTS.md) | [Consensus](./ARCHITECTURE-CONSENSUS.md) | [Security](./ARCHITECTURE-CRYPTOGRAPHY.md) ←

🤖 Phase 2 Documentation Chunking - Security & Cryptography Document
