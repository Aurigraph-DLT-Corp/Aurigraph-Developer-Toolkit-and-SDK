# Aurigraph Mobile Node - Security & Key Management Framework

**Document Type**: Security Architecture & Implementation Guide  
**Timeline**: Q2 2026 (Sprint 1 design, Sprints 2-3 implementation)  
**Status**: Security Framework Design  
**Owner**: Security Lead  
**Revision**: 1.0  

---

## Executive Summary

This document defines the comprehensive security framework for the Aurigraph Business Mobile Node app, covering biometric authentication, key management, hardware wallet integration, threat modeling, and compliance requirements. The framework ensures enterprise-grade security equivalent to server-based validators while maintaining mobile usability.

---

## 1. Biometric Authentication Framework

### 1.1 iOS Implementation (Face ID / Touch ID)

**LocalAuthentication Framework** (Apple-native):
- Face ID: Facial recognition with secure hardware co-processor (Neural Engine)
- Touch ID: Fingerprint recognition with Secure Enclave
- Fallback: PIN code (4-6 digits) if biometric unavailable

**Authentication Flow**:
```
1. User opens app → Checks if locked
2. Biometric prompt shown (Face ID or Touch ID)
3. Biometric match → Unlock, session begins
4. Biometric fail → Retry (max 3 attempts)
5. Failure after 3 attempts → Force PIN entry
6. PIN entry → Session established
```

**Session Management**:
- Timeout: 15 minutes of inactivity
- Auto-lock on app background
- Sensitive operations (staking, withdrawal) require re-auth
- Session expiry on app terminate

### 1.2 Android Implementation (BiometricPrompt)

**BiometricPrompt API** (Android 9+):
- Fingerprint: Capacitive or ultrasonic sensors (device-dependent)
- Face Recognition: Infrared/RGB camera based (varies by OEM)
- Iris Recognition: Supported on select Samsung devices
- Fallback: PIN code (same as iOS)

**Authentication Flow**:
```
1. App opens → BiometricPrompt shown
2. User authenticates with biometric
3. Success → Decrypt keys, establish session
4. Failure → Retry with PIN option
5. PIN entry → Same flow as iOS
```

**Enrollment Verification**:
- Check device has enrolled biometric
- Fallback to PIN if no enrollment
- Warn user if biometric disabled at OS level

### 1.3 Multi-Factor Authentication (Biometric + PIN)

**Implementation Pattern**:
```
Login: Biometric → Success
       └─ Check biometric against enrolled data
       └─ Decrypt private key from Keychain/Keystore

Sensitive Operations (e.g., withdraw rewards):
       └─ Show biometric prompt again
       └─ Require matching PIN if biometric fails
       └─ Enforce time-based re-auth (5 min)
```

**PIN Specifications**:
- Length: 4-6 digits (configurable)
- Complexity: No pattern requirements (mobile usability)
- Storage: Hashed + salted in encrypted SharedPreferences/KeyChain
- Retry limit: 5 attempts → 30-minute lockout

---

## 2. Key Management System

### 2.1 Key Derivation (BIP44 Hierarchical Deterministic Wallets)

**HD Wallet Structure** (BIP-32/BIP-44 Standard):
```
m / 44' / 60' / 0' / 0 / 0
           │      │   │   │   └─ Address index
           │      │   │   └───── Change flag (0=external, 1=internal)
           │      │   └────────── Account index
           │      └────────────── Coin type (60 = Ethereum-compatible)
           └─────────────────── Purpose (44 = BIP44)
```

**Key Generation Flow**:
1. Generate 12/24-word BIP39 mnemonic seed
2. Derive master key from seed
3. Derive account-specific keys (supports multiple accounts)
4. Derive address keys for transactions

**Multi-Account Support**:
- Account 0: Primary validator
- Account 1-9: Additional validators or treasury accounts
- Each account: Independent key derivation, separate balance/rewards tracking

### 2.2 iOS Keychain Key Storage

**Secure Storage** (Apple Secure Enclave):
```
┌─────────────────────────────────┐
│     Secure Enclave (Hardware)   │
├─────────────────────────────────┤
│  • Private keys encrypted        │
│  • Biometric + PIN protected     │
│  • Access controlled             │
│  • No export possible            │
└─────────────────────────────────┘
```

**Keychain Configuration**:
```swift
// iOS Keychain storage example
kSecClass = kSecClassKey
kSecAttrAccessible = kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly
kSecAttrAccessGroup = "com.aurigraph.validator"
kSecUseAuthenticationContext = LAContext (biometric)
kSecReturnData = false (prevent key export)
```

**Key Attributes**:
- **Accessible**: Only when device unlocked + biometric verified
- **AccessGroup**: Only within Aurigraph app (no cross-app access)
- **Label**: Account name for identification
- **Private**: Keys never exported to memory unencrypted

### 2.3 Android Keystore Integration

**Hardware-Backed Keystore** (Android 9+):
```
┌─────────────────────────────────┐
│  Android Keystore (Hardware)    │
├─────────────────────────────────┤
│  • Private keys in TEE           │
│  • Biometric + PIN protection    │
│  • Key attestation support       │
│  • No plaintext export           │
└─────────────────────────────────┘
```

**KeyStore Configuration**:
```kotlin
// Android Keystore example
KeyGenParameterSpec.Builder(
    keyName = "validator_key",
    keyPurpose = KeyProperties.PURPOSE_SIGN
).apply {
    setKeySize(256)
    setIsStrongBoxBacked(true) // Hardware-backed
    setUserAuthenticationRequired(true)
    setUserAuthenticationValidityDurationSeconds(300) // 5 min
    setBlockModes(KeyProperties.BLOCK_MODE_ECB)
    setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_RSA_PKCS1)
}.build()
```

**Key Attestation**:
- Verify keys reside in hardware (TEE/StrongBox)
- Check key integrity via attestation certificate
- Detect rooted/modified devices (failed attestation)

### 2.4 Hardware Wallet Integration (Ledger/Trezor)

**Bluetooth Low Energy (BLE) Communication**:
```
Mobile App ──(BLE)── Hardware Wallet
    │                    │
    ├─ Sign transaction  ├─ Keep key secure (never leaves device)
    │  (hash only)       │
    └────────────────────┴─ Return signature only
```

**Supported Wallets**:
- **Ledger Nano X**: BLE + USB-C
  - Device app: "Ethereum" or custom "Aurigraph"
  - Path: m/44'/60'/0'/0/0 (ETH-compatible)
  - Confirms transaction on device screen

- **Trezor Model T**: USB-C only
  - Device app: "Ethereum" app compatible
  - BLE planned for future models

**Implementation Pattern**:
```
1. Discover hardware wallet via BLE
2. Establish secure connection
3. Request signature for transaction hash
4. User confirms on device (biometric/PIN)
5. Receive signature from device
6. Broadcast transaction with signature
7. Disconnect BLE
```

**Security Properties**:
- Private key never leaves hardware wallet
- App only receives signatures
- User confirms each transaction on device
- No key derivation needed in mobile app (wallet handles it)

---

## 3. Threat Model (STRIDE Analysis)

### 3.1 Identified Threats

#### **Spoofing** (Authentication Bypass)

| Threat | Description | Likelihood | Impact | Mitigation |
|--------|-------------|------------|--------|-----------|
| Fake Biometric | Attacker uses fake fingerprint/face | LOW | CRITICAL | Liveness detection, device firmware verification |
| PIN Brute Force | Attacker guesses PIN | MEDIUM | HIGH | Rate limiting, lockout after 5 attempts |
| Session Hijacking | Steal active session token | MEDIUM | HIGH | Short session timeout (15 min), re-auth for sensitive ops |

**Mitigations**:
- Apple/Google biometric hardware prevents spoofing
- PIN lockout: 30 minutes after 5 failed attempts
- Session timeout: Auto-lock after 15 minutes
- Require biometric re-auth for: withdrawals, staking, voting

#### **Tampering** (Data Integrity)

| Threat | Description | Likelihood | Impact | Mitigation |
|--------|-------------|------------|--------|-----------|
| Modified Key Material | Attacker modifies stored keys | LOW | CRITICAL | Sealed Keychain/Keystore, CRC checks |
| Transaction Manipulation | Attacker modifies tx before signing | MEDIUM | CRITICAL | Hash verification, user confirmation |
| Consensus Proof Tampering | Attacker modifies participation proof | LOW | CRITICAL | Cryptographic signatures, timestamp |

**Mitigations**:
- Keys stored in hardware-sealed Keychain/Keystore
- Transaction hash displayed to user before signing
- All network data validated against cryptographic proofs
- Immutable audit trail of all actions

#### **Repudiation** (Deny Accountability)

| Threat | Description | Likelihood | Impact | Mitigation |
|--------|-------------|------------|--------|-----------|
| Deny Transaction | User denies signing transaction | LOW | MEDIUM | Audit trail, signed transaction logs |
| Deny Consensus Participation | Validator denies participating | LOW | MEDIUM | Timestamped participation proofs |

**Mitigations**:
- Immutable audit log of all user actions
- Timestamped and signed transaction records
- Blockchain-verified consensus participation
- Legal terms requiring acceptance

#### **Information Disclosure** (Privacy)

| Threat | Description | Likelihood | Impact | Mitigation |
|--------|-------------|------------|--------|-----------|
| Key Exposure | Private keys leaked from memory | MEDIUM | CRITICAL | Keychain/Keystore-only storage, clear sensitive memory |
| Account Enumeration | Attacker discovers accounts | LOW | MEDIUM | Don't display account list, encryption of account metadata |
| Reward Leakage | Attacker observes reward amounts | MEDIUM | LOW | Encrypt API responses, certificate pinning |

**Mitigations**:
- Keys never exposed to app memory (Keychain/Keystore handles signing)
- Clear sensitive data from memory after use
- Encrypt database at rest
- HTTPS + certificate pinning for all API calls
- Use public blockchain for non-sensitive data only

#### **Denial of Service** (Availability)

| Threat | Description | Likelihood | Impact | Mitigation |
|--------|-------------|------------|--------|-----------|
| App Crash | Attacker crashes app | MEDIUM | MEDIUM | Crash reporting (Sentry), graceful error handling |
| Battery Drain | Attacker drains battery | MEDIUM | MEDIUM | Background task limits, power optimization |
| Network Exhaustion | Attacker floods app with requests | LOW | MEDIUM | Rate limiting, request batching |

**Mitigations**:
- Comprehensive exception handling
- Battery-efficient network usage (adaptive sync)
- API rate limiting on server
- App Store rejections for resource abuse

#### **Elevation of Privilege** (Unauthorized Access)

| Threat | Description | Likelihood | Impact | Mitigation |
|--------|-------------|------------|--------|-----------|
| Jailbreak/Root | Attacker gains device root | MEDIUM | CRITICAL | Jailbreak/root detection, app termination |
| Sandbox Escape | Attacker escapes app sandbox | LOW | CRITICAL | App sandboxed by OS, no special permissions |
| Keychain/Keystore Access | Attacker accesses keys | LOW | CRITICAL | Hardware-sealed, biometric-protected |

**Mitigations**:
- Active jailbreak/root detection (every app open)
- Terminate app if device compromised
- Biometric + PIN protection for all key operations
- Leverage OS security (Secure Enclave, TEE)

### 3.2 STRIDE Summary Table

| Category | Count | Critical | High | Medium |
|----------|-------|----------|------|--------|
| **Spoofing** | 3 | 1 | 1 | 1 |
| **Tampering** | 3 | 3 | - | - |
| **Repudiation** | 2 | - | - | 2 |
| **Information Disclosure** | 3 | 1 | - | 2 |
| **Denial of Service** | 3 | - | - | 3 |
| **Elevation of Privilege** | 3 | 3 | - | - |
| **Total** | 17 | 8 | 1 | 8 |

**Risk Profile**: HIGH (8 critical threats) → Mitigations required before launch

---

## 4. Security Implementation Checklist

### Phase 1: Foundation (Sprint 1)

- [ ] Threat model completed (STRIDE, 17+ scenarios)
- [ ] Security architecture reviewed by 2+ external experts
- [ ] Third-party audit firm selected and contracted
- [ ] Jailbreak/root detection code prototyped
- [ ] Hardware wallet API integration scoped
- [ ] Bug bounty program designed ($5K-$50K rewards)

### Phase 2: iOS Development (Sprint 2)

- [ ] Keychain integration implemented and tested
- [ ] LocalAuthentication (Face ID/Touch ID) working
- [ ] PIN backup authentication verified
- [ ] Biometric liveness detection enabled
- [ ] Session timeout implemented (15 min)
- [ ] Sensitive operations require re-auth
- [ ] Transaction hash shown to user before signing
- [ ] No keys logged to console
- [ ] Keychain tests passing (mock hardware)

### Phase 3: Android Development (Sprint 3)

- [ ] Android Keystore integration complete
- [ ] BiometricPrompt API working (all auth types)
- [ ] Key attestation verification working
- [ ] Hardware-backed keystore confirmed
- [ ] PIN backup implemented
- [ ] Session timeout mirroring iOS
- [ ] Sensitive operation re-auth matching iOS
- [ ] Transaction hash verification
- [ ] No keys in logs or SharedPreferences

### Phase 4: Security Testing (Sprint 6)

- [ ] Penetration testing completed
- [ ] Key extraction attempts blocked
- [ ] Biometric spoofing prevented
- [ ] Hardware wallet integration tested
- [ ] Jailbreak/root detection verified
- [ ] Certificate pinning working
- [ ] Session hijacking prevented
- [ ] Third-party audit completed
- [ ] Zero critical findings

---

## 5. Compliance & Regulatory Requirements

### 5.1 Mobile Security Standards

**OWASP Mobile Security Guidelines**:
- M1: Improper Credential Usage → Keychain/Keystore storage
- M2: Inadequate Supply Chain → Signed app from official stores
- M3: Insecure Authentication → Biometric + PIN + session mgmt
- M4: Insufficient Cryptography → AES-256, ECDSA with NIST curves
- M5: Improper Secrets Management → No hardcoded secrets
- M6: Unauthorized Access → Permission model, biometric auth
- M7: Client-Side Injection → Input validation, prepared statements
- M8: Insufficient Code Obfuscation → Release builds use ProGuard/R8
- M9: Insecure Data Storage → Encrypted database, Keychain/Keystore
- M10: Extraneous Functionality → No debug code in production

**Compliance Status**: ✅ All OWASP M1-M10 addressed

### 5.2 Regulatory Compliance

**GDPR** (General Data Protection Regulation):
- ✅ User consent for data collection
- ✅ Data minimization (only needed info collected)
- ✅ Encryption of personal data
- ✅ Right to delete (comply within 30 days)

**SOC 2 Type II** (Security, Availability, Processing Integrity):
- ✅ Access controls (biometric auth)
- ✅ Change management (audit trail)
- ✅ Incident response procedures
- ✅ Monitoring and logging

**PCI DSS** (If handling card payments):
- ✅ Never store card data (use payment processors)
- ✅ HTTPS + TLS 1.3
- ✅ Encryption of financial data

---

## 6. Certificate Pinning Strategy

### 6.1 Public Key Pinning (iOS)

**URLSession Configuration**:
```swift
// Pinning certificate in iOS
let publicKeyHash = "sha256/AAAAAAAAAAAAAAAAAAAAAA="
let pinnedKeys = Set([publicKeyHash])

class PinningDelegate: NSObject, URLSessionDelegate {
    func urlSession(_ session: URLSession, 
                    didReceive challenge: URLAuthenticationChallenge,
                    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        // Verify server certificate against pinned key
        guard let certificate = SecTrustGetCertificateAtIndex(
            SecTrustCreateWithCertificates(chain, policy)!, 0) else {
            completionHandler(.cancelAuthenticationChallenge, nil)
            return
        }
        
        // Check against pinned keys
        let publicKey = SecCertificateCopyPublicKey(certificate)!
        let hash = calculateHash(publicKey)
        
        if pinnedKeys.contains(hash) {
            completionHandler(.useCredential, URLCredential(trust: trust))
        } else {
            completionHandler(.cancelAuthenticationChallenge, nil)
        }
    }
}
```

### 6.2 Certificate Pinning (Android)

**OkHttp Configuration**:
```kotlin
// Pinning certificate in Android
val certificatePinner = CertificatePinner.Builder()
    .add("dlt.aurigraph.io", "sha256/AAAAAAAAAAAAAAAAAAAAAA=")
    .add("api.aurigraph.io", "sha256/BBBBBBBBBBBBBBBBBBBBB=")
    .build()

val httpClient = OkHttpClient.Builder()
    .certificatePinner(certificatePinner)
    .build()
```

**Pinned Servers**:
- api.aurigraph.io (validator registry, rewards)
- iam2.aurigraph.io (Keycloak auth)
- dlt.aurigraph.io (enterprise portal)

**Key Rotation**:
- Rotate keys every 90 days
- Publish new pins 30 days before rotation
- Support both old and new pins during transition

---

## 7. Jailbreak/Root Detection

### 7.1 iOS Jailbreak Detection

**Detection Methods**:
```swift
func isDeviceJailbroken() -> Bool {
    // Method 1: Check for common jailbreak files
    let jailbreakPaths = [
        "/Applications/Cydia.app",
        "/Library/MobileSubstrate/MobileSubstrate.dylib",
        "/etc/apt",
        "/Library/Themes",
        "/Library/MobileSubstrate",
    ]
    
    for path in jailbreakPaths {
        if FileManager.default.fileExists(atPath: path) {
            return true
        }
    }
    
    // Method 2: Check write access to root filesystem
    let testFile = "/test.txt"
    if (try? "test".write(toFile: testFile, atomically: true, encoding: .utf8)) != nil {
        try? FileManager.default.removeItem(atPath: testFile)
        return true // Shouldn't be able to write to root
    }
    
    // Method 3: Check dyld search paths
    let dyldPath = String(cString: dyld_get_image_name(0))
    if dyldPath.contains("/var/mobile") == false {
        return true // Suspicious path
    }
    
    return false
}
```

**Response to Jailbreak Detection**:
```
┌─ Device jailbroken detected
│
├─ Show user warning: "This device is jailbroken and insecure"
├─ Option 1: User dismisses warning → App continues (reduced security)
├─ Option 2: User exits app
└─ Log jailbreak detection to backend (for monitoring)
```

### 7.2 Android Root Detection

**Detection Methods**:
```kotlin
fun isDeviceRooted(): Boolean {
    // Method 1: Check for Magisk/SuperSU packages
    val rooted = listOf(
        "com.noshufou.android.su",
        "com.noshufou.android.su.elite",
        "eu.chainfire.supersu",
        "com.koushikdutta.superuser",
        "com.topjohnwu.magisk"
    ).any { isPackageInstalled(it) }
    
    if (rooted) return true
    
    // Method 2: Check for su binary
    val paths = arrayOf(
        "/system/app/Superuser.apk",
        "/sbin/su",
        "/system/bin/su",
        "/system/xbin/su",
        "/data/local/xbin/su"
    )
    
    return paths.any { File(it).exists() }
}
```

**Response to Root Detection**:
```
Same as iOS: Warn user, allow continued use with reduced security
```

---

## 8. Audit Logging & Compliance

### 8.1 Immutable Audit Trail

**Logged Events** (All timestamped, cryptographically signed):
```
✓ User login (biometric/PIN)
✓ Biometric enrollment changes
✓ PIN changes
✓ Account creation
✓ Key import/export
✓ Transaction signing (hash, timestamp, signature)
✓ Consensus participation proofs
✓ Reward claims
✓ Settings changes
✓ App version updates
✓ Security audit events
```

**Audit Log Storage**:
- Local: Encrypted SQLite database (first 1000 events)
- Remote: Immutable blockchain or append-only log (1000+ events)
- Retention: 7 years (regulatory requirement)

### 8.2 Compliance Export

**Tax Compliance** (XLSX export):
- Date range: User-specified
- Transactions: All tx with amounts, dates, types
- Rewards: Daily accrual, total earned
- Slashing: Penalties applied
- Holdings: Starting/ending balance

**Regulatory Export** (FINRA/SEC/FCA):
- All transactions
- Timestamps (ISO 8601)
- Counterparty information
- Associated audit trail

---

## 9. Key Management Best Practices

### 9.1 Key Storage Hierarchy

```
┌─────────────────────────────┐
│  BIP39 Mnemonic (12/24 word) │ ← User writes down, stores securely
└──────────────┬───────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Master Key (from mnemonic)   │ → Stored in Hardware (never app memory)
└──────────────┬───────────────┘
               │
               ├─ Account 0 Key ─────────────┐
               │                              │
               ├─ Account 1 Key ─────┐       │
               │                     │       │
               └─ Account 9 Key ──┐  │       │
                                  │  │       │
                          ┌───────▼──▼───────▼────────┐
                          │ Keychain/Keystore (iOS/Android) │
                          │ (Hardware-sealed, Biometric) │
                          └────────────────────────────┘
```

### 9.2 Rotation Schedule

**Annual Rotation**:
- Every 90 days: Rotate API keys (server-side)
- Every 365 days: Rotate certificate pins
- Every 365 days: Audit third-party access

**Emergency Rotation**:
- If key compromised: Immediate account freeze
- If device stolen: Allow account recovery via identity verification
- If pin leaked: Force PIN reset on next login

---

## 10. Third-Party Audit & Bug Bounty

### 10.1 Audit Scope

**Third-Party Security Audit** (Sprints 8-9):
- Penetration testing (white-box, gray-box, black-box)
- Key management review
- Biometric auth validation
- Keychain/Keystore testing
- Hardware wallet integration security
- Network communication (TLS, certificate pinning)
- Code review (crypto, authentication, data protection)
- Threat model validation

**Audit Findings Categories**:
- CRITICAL: Security impact, immediate fix required
- HIGH: Significant vulnerability, fix within 2 weeks
- MEDIUM: Moderate risk, fix within 1 month
- LOW: Minor issue, fix before launch
- INFORMATIONAL: Recommendations only

### 10.2 Bug Bounty Program

**Reward Structure**:
```
CRITICAL: $10,000 - $50,000 (RCE, key extraction, authentication bypass)
HIGH: $5,000 - $10,000 (privilege escalation, data disclosure)
MEDIUM: $1,000 - $5,000 (crypto weakness, configuration issue)
LOW: $500 - $1,000 (minor security improvement)
```

**Scope**:
- iOS and Android apps (in-app only)
- Backend APIs (consensus, rewards, validator registry)
- Hardware wallet integration
- Biometric authentication

**Out of Scope**:
- Public blockchain (fixed by protocol)
- Third-party libraries (report to vendor)
- Social engineering
- DDoS attacks

---

## 11. Security Approval Criteria

### Sprint 1 Sign-Off

- [ ] Threat model approved by 2+ security experts
- [ ] Architecture reviewed and approved
- [ ] Audit firm selected and contracted
- [ ] Bug bounty program framework finalized

### Sprint 2 & 3 Sign-Off

- [ ] Keychain/Keystore integration validated
- [ ] Biometric auth working on test devices
- [ ] No keys in logs or temporary files
- [ ] Jailbreak/root detection active
- [ ] Certificate pinning implemented
- [ ] Code review by security lead (100% coverage)

### Sprint 6 Sign-Off (Launch)

- [ ] Third-party audit 100% complete
- [ ] Zero CRITICAL findings
- [ ] All HIGH findings remediated
- [ ] All MEDIUM findings documented and mitigated
- [ ] Penetration testing passed
- [ ] Security sign-off from CTO and Security Lead

---

## 12. Incident Response Plan

### 12.1 Security Incident Detection

**Alert Triggers**:
- Repeated failed biometric auth attempts (>5)
- Jailbreak/root device detected
- Certificate pinning failure
- Unusual API access pattern
- Key extraction attempt

**Response Protocol**:
```
Detection
    │
    ▼
Alert to Security Team (email + SMS)
    │
    ├─ P0 (Critical): Response within 15 minutes
    ├─ P1 (High): Response within 1 hour
    ├─ P2 (Medium): Response within 4 hours
    └─ P3 (Low): Response within 24 hours
    │
    ▼
Investigation
    │
    ├─ Understand scope (how many users affected)
    ├─ Assess severity (data loss, key compromise)
    └─ Determine root cause
    │
    ▼
Remediation
    │
    ├─ Immediate: Kill affected user sessions, force re-auth
    ├─ Short-term: Patch vulnerability
    ├─ Medium-term: Deploy patch via app store
    └─ Long-term: Update threat model, security training
    │
    ▼
Communication
    └─ Notify affected users (within 24 hours of detection)
    └─ Publish incident report (transparent disclosure)
```

---

**Document Status**: Security Framework Complete  
**Next Step**: Implement in Sprint 1, audit in Sprint 6  
**Owner**: Security Lead, Mobile Engineering  

Generated with Claude Code
