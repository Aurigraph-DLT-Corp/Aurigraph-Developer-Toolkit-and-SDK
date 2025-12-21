# ActiveContracts System Documentation

## Overview

ActiveContracts is Aurigraph's implementation of Ricardian Contracts - legally binding agreements that combine:
1. **Prose (Legal Text)** - Human-readable legal terms
2. **Parameters (Configuration)** - Structured data fields
3. **Programming (Smart Code)** - Executable blockchain logic

This three-part structure ensures contracts are both legally enforceable and automatically executable.

---

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────────────┐
│                    ActiveContracts System                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Prose      │  │  Parameters  │  │  Programming │          │
│  │  (Legal)     │  │  (Config)    │  │  (Logic)     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           ▼                                      │
│                 ┌──────────────────┐                            │
│                 │  ActiveContract  │                            │
│                 └────────┬─────────┘                            │
│                          │                                       │
│    ┌─────────────────────┼─────────────────────┐                │
│    ▼                     ▼                     ▼                │
│  ┌────────────┐   ┌────────────┐   ┌────────────────────┐      │
│  │ Signature  │   │   Token    │   │    Trigger         │      │
│  │ Workflow   │   │  Binding   │   │   Execution        │      │
│  └────────────┘   └────────────┘   └────────────────────┘      │
│                          │                                       │
│                          ▼                                       │
│                 ┌──────────────────┐                            │
│                 │ VVB Verification │                            │
│                 └──────────────────┘                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### ContractProse
Legal text component with enforceability scoring.

```java
public class ContractProse {
    String proseId;
    String legalText;
    String jurisdiction;
    String governingLaw;
    double enforceabilityScore;  // 0-100
    List<LegalClause> clauses;
    String hash;  // SHA-256 hash for integrity
}
```

### ContractParameters
Structured configuration data.

```java
public class ContractParameters {
    String parameterId;
    Map<String, Object> parameters;
    String schemaVersion;
    List<ParameterValidation> validations;
}
```

### ContractProgramming
Executable smart contract logic.

```java
public class ContractProgramming {
    String programmingId;
    String sourceCode;
    String bytecode;
    String abi;
    String language;  // Solidity, Vyper, etc.
    boolean audited;
    String auditReport;
}
```

---

## Services

### 1. SignatureWorkflowService

Manages multi-party signature collection with RBAC support.

**Roles:**
| Role | Priority | Signature Required | Description |
|------|----------|-------------------|-------------|
| OWNER | 1 | Yes | Contract owner/creator |
| PARTY | 2 | Yes | Contract party with signing rights |
| WITNESS | 3 | No | Witness to contract execution |
| VVB | 4 | Yes | Validation and Verification Body |
| REGULATOR | 5 | No | Regulatory authority oversight |

**Collection Modes:**
- `SEQUENTIAL` - Signatures must be collected in priority order
- `PARALLEL` - Signatures can be collected in any order

**Workflow States:**
```
DRAFT → PENDING_SIGNATURES → PARTIALLY_SIGNED → FULLY_SIGNED
                                     ↓
                                 EXPIRED/REJECTED
```

**API Endpoints:**
```
GET  /api/v12/signatures/contract/{contractId}/status
POST /api/v12/signatures/contract/{contractId}/request/{partyId}
POST /api/v12/signatures/contract/{contractId}/submit
GET  /api/v12/signatures/contract/{contractId}/verify/{partyId}
GET  /api/v12/signatures/contract/{contractId}/requirements
PUT  /api/v12/signatures/contract/{contractId}/mode
POST /api/v12/signatures/contract/{contractId}/role-requirement
```

---

### 2. TokenBindingService

Binds tokens to contracts for RWA tokenization.

**Token Types:**
| Type | Description |
|------|-------------|
| PRIMARY | Main asset token (e.g., property deed) |
| SECONDARY | Revenue shares, royalties |
| COMPOSITE | Bundle of multiple tokens |

**API Endpoints:**
```
POST   /api/v12/token-bindings/contract/{contractId}/bind
GET    /api/v12/token-bindings/contract/{contractId}
DELETE /api/v12/token-bindings/contract/{contractId}/token/{tokenId}
GET    /api/v12/token-bindings/token/{tokenId}
POST   /api/v12/token-bindings/contract/{contractId}/composite
GET    /api/v12/token-bindings/status
```

---

### 3. VVBVerificationService

Manages Validation and Verification Body (VVB) approval workflow.

**Verification States:**
```
FULLY_SIGNED → VVB_REVIEW → VVB_APPROVED → ACTIVE
                   ↓
              VVB_REJECTED
```

**VVB Types:**
- PROPERTY_VALUATOR
- LEGAL_VERIFIER
- ENVIRONMENTAL_AUDITOR
- FINANCIAL_AUDITOR
- CARBON_VERIFIER

**API Endpoints:**
```
POST /api/v12/vvb/contract/{contractId}/submit
GET  /api/v12/vvb/contract/{contractId}/status
POST /api/v12/vvb/contract/{contractId}/approve
POST /api/v12/vvb/contract/{contractId}/reject
GET  /api/v12/vvb/pending
GET  /api/v12/vvb/verifier/{verifierId}/history
POST /api/v12/vvb/verifier/register
```

---

### 4. TriggerExecutionService

Manages contract trigger registration and execution.

**Trigger Types:**
| Type | Description |
|------|-------------|
| TIME_BASED | Execute at specific time or interval |
| EVENT_BASED | Execute on blockchain events |
| ORACLE_BASED | Execute based on external data |
| CONDITION_BASED | Execute when conditions are met |

**API Endpoints:**
```
POST   /api/v12/triggers/contract/{contractId}/register
GET    /api/v12/triggers/contract/{contractId}
DELETE /api/v12/triggers/{triggerId}
POST   /api/v12/triggers/{triggerId}/enable
POST   /api/v12/triggers/{triggerId}/disable
GET    /api/v12/triggers/{triggerId}/executions
POST   /api/v12/triggers/{triggerId}/test
GET    /api/v12/triggers/types
```

---

## Contract Lifecycle

```
1. DRAFT
   └── Contract created, parties being added

2. PENDING_SIGNATURES
   └── Signature requests sent to parties

3. PARTIALLY_SIGNED
   └── Some parties have signed

4. FULLY_SIGNED
   └── All required signatures collected

5. VVB_REVIEW
   └── Submitted for VVB verification

6. VVB_APPROVED / VVB_REJECTED
   └── VVB decision made

7. ACTIVE
   └── Contract is live and triggers can execute

8. EXECUTED
   └── Contract terms fulfilled

9. TERMINATED
   └── Contract ended (expired/cancelled)
```

---

## Quantum-Safe Cryptography

ActiveContracts uses CRYSTALS-Dilithium for quantum-resistant signatures:

- **Algorithm**: CRYSTALS-Dilithium (NIST Level 5)
- **Key Size**: 4880 bytes (public key)
- **Signature Size**: 4595 bytes
- **Security**: Post-quantum secure against Shor's algorithm

---

## Frontend Components

| Component | Description |
|-----------|-------------|
| `SignatureWorkflow.tsx` | Signature collection UI with role badges |
| `TokenBinding.tsx` | Token binding management |
| `VVBVerification.tsx` | VVB verification workflow |
| `TriggerManagement.tsx` | Trigger registration and monitoring |
| `ActiveContracts.tsx` | Main contract management view |
| `ContractLibrary.tsx` | Template library browser |

---

## Sprint Implementation (SPARC Plan)

| Sprint | Focus | Story Points | Status |
|--------|-------|--------------|--------|
| Sprint 1 | Core Data Model | 13 SP | Complete |
| Sprint 2 | Wizard - Prose | 8 SP | Complete |
| Sprint 3 | Wizard - Params/Programming | 13 SP | Complete |
| Sprint 4 | Version Control + RBAC | 15 SP | Complete |
| Sprint 5 | Token Binding | 16 SP | Complete |
| Sprint 6 | VVB Integration | 16 SP | Complete |
| Sprint 7 | Trigger Execution | 15 SP | Complete |
| Sprint 8 | Frontend Components | 18 SP | Complete |
| Sprint 9 | Testing & Documentation | 15 SP | Complete |
| **Total** | | **129 SP** | **Complete** |

---

## Testing

### Unit Tests
- `SignatureWorkflowServiceTest.java`
- `TokenBindingServiceTest.java`
- `VVBVerificationServiceTest.java`
- `TriggerExecutionServiceTest.java`
- `RicardianContractTest.java`

### API Tests
- `SignatureWorkflowResourceTest.java`
- `TokenBindingResourceTest.java`
- `VVBVerificationResourceTest.java`
- `TriggerExecutionResourceTest.java`

### E2E Tests
- Playwright tests for frontend components

---

## Configuration

```properties
# application.properties

# ActiveContracts Settings
activecontracts.signature.expiry.days=7
activecontracts.vvb.min-verifiers=2
activecontracts.trigger.scheduler.interval=1000
activecontracts.quantum.signature.algorithm=CRYSTALS-Dilithium
```

---

## Related Documentation

- [Ricardian Contracts Specification](./contracts/RICARDIAN_SPEC.md)
- [RBAC Implementation Guide](./security/RBAC_GUIDE.md)
- [Token Standards (ERC-721/1155)](./tokens/TOKEN_STANDARDS.md)
- [VVB Verification Protocol](./verification/VVB_PROTOCOL.md)

---

*Generated by Claude Code - ActiveContracts Sprint 9 Documentation*
*Version: 12.0.0 | December 2025*
