# HMS Integration Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Architecture Overview](#architecture-overview)
3. [Getting Started](#getting-started)
4. [Core Concepts](#core-concepts)
5. [Implementation Guide](#implementation-guide)
6. [Testing](#testing)
7. [Deployment](#deployment)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [FAQ](#faq)

---

## Introduction

The Healthcare Management System (HMS) Integration module provides a comprehensive solution for tokenizing healthcare assets with multi-verifier consensus, compliance validation, and secure asset management on the Aurigraph blockchain platform.

### Key Features

- **Healthcare Asset Tokenization**: Medical Records, Prescriptions, Diagnostic Reports
- **Multi-Verifier Consensus**: 3-of-5 verifier system with configurable tiers
- **Compliance Validation**: HIPAA and GDPR compliance checks
- **Fraud Detection**: Real-time fraud detection algorithms
- **Secure Transfers**: Verification-gated asset transfers
- **Performance**: 100K tokenizations per day target

### Use Cases

1. **Medical Records Management**: Secure, compliant medical record tokenization
2. **Prescription Tracking**: Blockchain-based prescription verification
3. **Diagnostic Report Sharing**: Secure diagnostic report distribution
4. **Insurance Claims**: Verified insurance claim processing
5. **Research Data**: Compliant research data tokenization

---

## Architecture Overview

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      HMS Integration Layer                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   HMSResource│  │ HMSIntegration│  │ Verification │      │
│  │   (REST API) │◄─┤    Service    │◄─┤   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ▲                 ▲                   ▲               │
│         │                 │                   │               │
│         ▼                 ▼                   ▼               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Compliance │  │ Asset Models  │  │  Verifier    │      │
│  │   Service    │  │  (MR/RX/DR)   │  │  Registry    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                    Aurigraph Blockchain Core                  │
└─────────────────────────────────────────────────────────────┘
```

### Service Layer

1. **HMSResource**: REST API endpoints for HMS operations
2. **HMSIntegrationService**: Core tokenization and asset management
3. **VerificationService**: Multi-verifier consensus engine
4. **ComplianceService**: HIPAA/GDPR compliance validation
5. **Asset Models**: Healthcare asset data structures

### Data Flow

```
Client Request
     │
     ▼
REST API (HMSResource)
     │
     ▼
Compliance Validation (ComplianceService)
     │
     ▼
Asset Tokenization (HMSIntegrationService)
     │
     ▼
Blockchain Transaction
     │
     ▼
Token Response
```

---

## Getting Started

### Prerequisites

- Java 21+
- Maven 3.9+
- Quarkus 3.28.2+
- Aurigraph V11 platform running
- Docker (optional, for containers)

### Installation

1. **Clone Repository**

```bash
git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git
cd Aurigraph-DLT/aurigraph-av10-7/aurigraph-v11-standalone
```

2. **Build Project**

```bash
./mvnw clean package
```

3. **Run in Development Mode**

```bash
./mvnw quarkus:dev
```

4. **Verify Installation**

```bash
curl http://localhost:9003/api/v11/hms/stats
```

### Quick Start Example

```bash
# 1. Tokenize a medical record
curl -X POST http://localhost:9003/api/v11/hms/assets \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "MR-QUICKSTART-001",
    "assetType": "MEDICAL_RECORD",
    "patientId": "PATIENT-001",
    "providerId": "PROVIDER-001",
    "ownerId": "OWNER-001",
    "hipaaCompliant": true,
    "gdprCompliant": true,
    "consentSignature": "CONSENT-001",
    "metadata": {
      "access_controls": "role-based",
      "audit_trail": "enabled",
      "lawful_basis": "consent"
    }
  }'

# 2. Check asset status
curl http://localhost:9003/api/v11/hms/assets/MR-QUICKSTART-001/status
```

---

## Core Concepts

### Healthcare Asset Types

#### Medical Record

Represents a patient's medical record with diagnosis, treatment notes, and vital signs.

```java
MedicalRecord record = new MedicalRecord(
    "MR-2024-001",
    "PATIENT-12345",
    "PROVIDER-678"
);
record.setDiagnosis("Hypertension");
record.setTreatmentNotes("Prescribed medication");
record.addVitalSign("Blood Pressure", "120/80");
```

#### Prescription

Represents a medication prescription with dosage and frequency.

```java
Prescription prescription = new Prescription(
    "RX-2024-001",
    "PATIENT-12345",
    "PRESCRIBER-678"
);
Prescription.Medication medication = new Prescription.Medication(
    "Lisinopril",
    "10mg",
    "Once daily"
);
prescription.addMedication(medication);
```

#### Diagnostic Report

Represents a diagnostic report with findings and test results.

```java
DiagnosticReport report = new DiagnosticReport(
    "DR-2024-001",
    "PATIENT-12345",
    "PROVIDER-678",
    "X-Ray"
);
report.setFindings("No abnormalities detected");
report.addTestResult("Chest X-Ray", "Normal");
```

### Verification Tiers

Verification requirements based on asset value:

| Tier | Value Range | Verifiers | Use Case |
|------|-------------|-----------|----------|
| Tier 1 | < $100K | 1 | Routine prescriptions, basic records |
| Tier 2 | $100K - $1M | 2 | Complex diagnoses, specialized care |
| Tier 3 | $1M - $10M | 3 | Major surgeries, experimental treatments |
| Tier 4 | > $10M | 5 | Clinical trials, high-value claims |

### Consensus Mechanism

**Threshold**: 51%+ approval required

**Examples**:
- 3 verifiers, 2 approve = 66.7% = APPROVED
- 3 verifiers, 1 approve = 33.3% = REJECTED
- 5 verifiers, 3 approve = 60% = APPROVED

### Compliance Requirements

#### HIPAA (US Healthcare)

1. **Encryption**: PHI encrypted at rest and in transit
2. **Access Controls**: Role-based access control
3. **Audit Trail**: Comprehensive audit logging
4. **Consent**: Patient consent signature required

#### GDPR (EU Data Protection)

1. **Lawful Basis**: Legal basis for data processing
2. **Data Minimization**: Collect only necessary data
3. **Right to Erasure**: Support data deletion
4. **Consent**: Explicit, informed consent

---

## Implementation Guide

### Step 1: Define Healthcare Asset

```java
// Create medical record
MedicalRecord medicalRecord = new MedicalRecord(
    "MR-2024-001",
    "PATIENT-12345",
    "PROVIDER-678"
);

// Set basic fields
medicalRecord.setOwner("HOSPITAL-001");
medicalRecord.setDiagnosis("Type 2 Diabetes");
medicalRecord.setTreatmentNotes("Insulin therapy initiated");

// Add vital signs
medicalRecord.addVitalSign("Blood Glucose", "180 mg/dL");
medicalRecord.addVitalSign("Blood Pressure", "130/85");
medicalRecord.addVitalSign("Heart Rate", "72 bpm");
```

### Step 2: Configure Compliance

```java
// Create compliance info
ComplianceInfo complianceInfo = new ComplianceInfo();
complianceInfo.setHipaaCompliant(true);
complianceInfo.setGdprCompliant(true);
complianceInfo.setConsentSignature("PATIENT-SIGNATURE-ABC123");
complianceInfo.setConsentTimestamp(Instant.now());
complianceInfo.setJurisdiction("US");

// Attach to asset
medicalRecord.setComplianceInfo(complianceInfo);

// Add required metadata
medicalRecord.addMetadata("access_controls", "role-based");
medicalRecord.addMetadata("audit_trail", "enabled");
medicalRecord.addMetadata("lawful_basis", "consent");
medicalRecord.addMetadata("erasure_capable", "true");

// Configure encryption
medicalRecord.setEncrypted(true);
medicalRecord.setEncryptionKeyId("ENC-KEY-2024-001");
```

### Step 3: Tokenize Asset

```java
@Inject
HMSIntegrationService hmsService;

// Tokenize asset
Uni<HMSIntegrationService.TokenizationResult> resultUni =
    hmsService.tokenizeAsset(medicalRecord);

// Wait for result
TokenizationResult result = resultUni.await().indefinitely();

if (result.isSuccess()) {
    System.out.println("Token ID: " + result.getTokenId());
    System.out.println("Transaction: " + result.getTransactionHash());
    System.out.println("Block: " + result.getBlockNumber());
} else {
    System.err.println("Error: " + result.getErrorMessage());
}
```

### Step 4: Request Verification

```java
@Inject
VerificationService verificationService;

// Register verifiers first
for (int i = 1; i <= 3; i++) {
    VerifierInfo verifier = new VerifierInfo(
        "VERIFIER-" + i,
        "Verifier " + i,
        "Healthcare Verification Inc.",
        Arrays.asList("CERT-HIPAA", "CERT-MEDICAL"),
        Arrays.asList("Endocrinology", "Internal Medicine")
    );
    verificationService.registerVerifier(verifier).await().indefinitely();
}

// Request verification
VerificationResult verificationRequest = hmsService.requestVerification(
    "MR-2024-001",
    "REQUESTER-001",
    VerificationTier.TIER_3
).await().indefinitely();

String verificationId = verificationRequest.getVerificationId();
System.out.println("Verification ID: " + verificationId);
System.out.println("Required Verifiers: " + verificationRequest.getRequiredVerifiers());
```

### Step 5: Submit Verification Votes

```java
// Each verifier submits a vote
for (int i = 1; i <= 3; i++) {
    VoteResult voteResult = verificationService.submitVote(
        verificationId,
        "VERIFIER-" + i,
        true, // approved
        "Asset meets all compliance requirements"
    ).await().indefinitely();

    System.out.println("Verifier " + i + " voted");
    System.out.println("Consensus reached: " + voteResult.isConsensusReached());

    if (voteResult.isConsensusReached()) {
        System.out.println("Verification complete: " +
            (voteResult.isApproved() ? "APPROVED" : "REJECTED"));
    }
}
```

### Step 6: Transfer Asset

```java
// Transfer asset (requires verification)
TransferResult transferResult = hmsService.transferAsset(
    "MR-2024-001",
    "HOSPITAL-001",  // from owner
    "SPECIALIST-CLINIC-002",  // to owner
    "AUTHORIZATION-SIGNATURE-XYZ"
).await().indefinitely();

if (transferResult.isSuccess()) {
    System.out.println("Transfer ID: " + transferResult.getTransferId());
    System.out.println("New Owner: " + transferResult.getNewOwner());
    System.out.println("Transaction: " + transferResult.getTransactionHash());
} else {
    System.err.println("Transfer failed: " + transferResult.getErrorMessage());
}
```

### Step 7: Monitor and Audit

```java
// Get asset status
AssetStatusInfo status = hmsService.getAssetStatus("MR-2024-001")
    .await().indefinitely();

System.out.println("Current Owner: " + status.getCurrentOwner());
System.out.println("State: " + status.getState());
System.out.println("Verification Status: " + status.getVerificationStatus());
System.out.println("Compliant: " + status.getComplianceInfo().isFullyCompliant());

// Get HMS statistics
HMSStatistics stats = hmsService.getStatistics().await().indefinitely();

System.out.println("Total Assets: " + stats.getTotalAssets());
System.out.println("Daily Tokenizations: " + stats.getDailyTokenizations());
System.out.println("Total Verifications: " +
    stats.getVerificationStatistics().getTotalVerifications());
```

---

## Testing

### Unit Testing

```java
@QuarkusTest
public class HMSIntegrationServiceTest {

    @Inject
    HMSIntegrationService hmsService;

    @Test
    public void testTokenizeMedicalRecord() {
        MedicalRecord record = createCompliantMedicalRecord();

        TokenizationResult result = hmsService.tokenizeAsset(record)
            .await().indefinitely();

        assertTrue(result.isSuccess());
        assertNotNull(result.getTokenId());
    }

    private MedicalRecord createCompliantMedicalRecord() {
        // Create compliant medical record for testing
        // ... implementation
    }
}
```

### Integration Testing

```bash
# Run integration tests
./mvnw test -Dtest=HMSIntegrationTest

# Run all HMS tests
./mvnw test -Dtest="io.aurigraph.v11.hms.**"

# Run with coverage
./mvnw test jacoco:report
```

### Performance Testing

```bash
# Load test tokenization endpoint
ab -n 1000 -c 10 -T application/json \
  -p tokenization_request.json \
  http://localhost:9003/api/v11/hms/assets
```

---

## Deployment

### Development Environment

```bash
# Start in dev mode
./mvnw quarkus:dev

# Access dev UI
open http://localhost:9003/q/dev
```

### Production Deployment

```bash
# Build native executable
./mvnw package -Pnative

# Run native executable
./target/aurigraph-v11-standalone-11.3.4-runner

# Docker deployment
docker build -f src/main/docker/Dockerfile.native -t hms-integration .
docker run -p 9003:9003 hms-integration
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hms-integration
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hms-integration
  template:
    metadata:
      labels:
        app: hms-integration
    spec:
      containers:
      - name: hms-integration
        image: aurigraph/hms-integration:11.3.4
        ports:
        - containerPort: 9003
        env:
        - name: QUARKUS_HTTP_PORT
          value: "9003"
        resources:
          requests:
            memory: "256Mi"
            cpu: "500m"
          limits:
            memory: "512Mi"
            cpu: "1000m"
```

---

## Best Practices

### Security

1. **Always encrypt PHI**: Use AES-256 encryption for all healthcare data
2. **Validate consent**: Ensure patient consent is current (< 2 years old)
3. **Use TLS 1.3**: All API communications over TLS 1.3
4. **Implement RBAC**: Role-based access control for all endpoints
5. **Audit everything**: Comprehensive audit logging for compliance

### Performance

1. **Batch operations**: Use batch tokenization for multiple assets
2. **Async processing**: Leverage reactive programming with Mutiny
3. **Cache verifiers**: Cache active verifier list
4. **Monitor metrics**: Track tokenization rate and verification time
5. **Scale horizontally**: Deploy multiple instances for high load

### Compliance

1. **Regular audits**: Perform compliance audits regularly
2. **Update policies**: Keep HIPAA/GDPR policies current
3. **Train staff**: Ensure staff understand compliance requirements
4. **Document everything**: Maintain comprehensive documentation
5. **Test compliance**: Include compliance tests in CI/CD pipeline

---

## Troubleshooting

### Common Issues

#### Issue: Tokenization Fails with Compliance Error

```
Error: Compliance validation failed: Asset is not marked as HIPAA compliant
```

**Solution**:
```java
ComplianceInfo info = new ComplianceInfo();
info.setHipaaCompliant(true);
info.setGdprCompliant(true);
info.setConsentSignature("VALID-SIGNATURE");
info.setConsentTimestamp(Instant.now());
asset.setComplianceInfo(info);
```

#### Issue: Verification Stuck in PENDING

**Solution**: Check that enough verifiers have submitted votes. For Tier 3, you need 3 votes.

```bash
# Check verification details
curl http://localhost:9003/api/v11/hms/verifications/{verificationId}
```

#### Issue: Transfer Fails with "Asset must be verified"

**Solution**: Ensure asset has APPROVED verification status before transferring.

```bash
# Check asset status
curl http://localhost:9003/api/v11/hms/assets/{assetId}/status
```

### Debug Logging

Enable debug logging in `application.properties`:

```properties
quarkus.log.category."io.aurigraph.v11.hms".level=DEBUG
```

---

## FAQ

**Q: How long does tokenization take?**
A: Average tokenization time is 50ms. Verification takes 2-5 minutes depending on tier.

**Q: Can I change verification tier after creation?**
A: No, verification tier is determined at verification request time based on asset value.

**Q: What happens if a verifier vote is rejected?**
A: If consensus threshold (51%) is not met, the verification is REJECTED and asset cannot be transferred.

**Q: How is fraud detected?**
A: Fraud detection checks for suspicious patterns: future timestamps, missing compliance data, duplicate asset IDs.

**Q: Can I transfer an asset without verification?**
A: No, all transfers require APPROVED verification status for security and compliance.

**Q: How do I renew expired consent?**
A: Update the ComplianceInfo with new consent signature and current timestamp, then re-tokenize.

**Q: What encryption algorithm is used?**
A: AES-256 for data at rest, TLS 1.3 for data in transit.

**Q: Can I delete a tokenized asset?**
A: Yes, to comply with GDPR right to erasure. Set erasure_capable metadata and implement erasure process.

---

## Additional Resources

- [HMS API Documentation](./HMS_API_DOCUMENTATION.md)
- [Aurigraph V11 Documentation](../README.md)
- [HIPAA Compliance Guide](https://www.hhs.gov/hipaa)
- [GDPR Official Text](https://gdpr-info.eu/)
- [Quarkus Documentation](https://quarkus.io/guides/)

---

## Support

For technical support or questions:

- **Email**: support@aurigraph.io
- **GitHub Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
- **Slack**: #hms-integration
- **Documentation**: https://docs.aurigraph.io

---

**Version**: 11.3.4 (Sprint 9)
**Last Updated**: October 21, 2025
