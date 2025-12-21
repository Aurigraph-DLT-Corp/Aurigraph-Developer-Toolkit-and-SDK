# ActiveContracts SPARC Plan & WBS

## Ricardian Contract Implementation - Complete Specification

**Version**: 12.0.0
**Date**: December 2025
**Author**: J4C Development Agent
**Status**: Planning Phase

---

## Executive Summary

ActiveContracts are self-executing Ricardian Contracts that combine **legal prose**, **programmatic logic**, and **configurable parameters** into a unified, tokenized, and verifiable agreement framework. This document outlines the complete SPARC (Situation, Problem, Action, Result, Consequence) plan and Work Breakdown Structure (WBS) for implementing the full ActiveContracts ecosystem.

---

## SPARC Analysis

### S - Situation

**Current State:**
- Basic document conversion wizard exists (`DocumentConversionWizardResource.java`)
- Simple 5-step upload → parties → terms → preview → finalize flow
- No separation of Prose/Programming/Parameters
- No versioning system
- No RBAC workflow for multi-stakeholder signatures
- No token integration for stakeholder binding
- No VVB verification integration for listing approval
- No trigger-based execution engine

**Market Context:**
- Enterprise contracts require legal enforceability + automated execution
- Multi-party agreements need transparent, auditable signature workflows
- Real-world asset tokenization demands verifiable third-party attestation
- Smart contracts alone lack legal standing; legal contracts alone lack automation

### P - Problem

| Problem Area | Current Gap | Impact |
|--------------|-------------|--------|
| **Structure** | Single contract blob | Cannot separate legal, technical, and business concerns |
| **Versioning** | None | No audit trail for contract evolution |
| **RBAC** | Basic roles | No multi-stakeholder approval workflow |
| **Tokenization** | Disconnected | Stakeholder tokens not bound to contract lifecycle |
| **Verification** | Optional VVB | No mandatory verification before listing |
| **Execution** | Manual | Triggers don't auto-execute RBAC workflows |
| **Compliance** | Limited | Cannot meet regulatory requirements for RWA |

### A - Action

Implement a comprehensive **Three-Part Agreement System**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ACTIVECONTRACT STRUCTURE                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐           │
│  │    PROSE    │   │ PARAMETERS  │   │   PROGRAMMING   │           │
│  │  (Legal)    │   │  (Config)   │   │    (Logic)      │           │
│  ├─────────────┤   ├─────────────┤   ├─────────────────┤           │
│  │ - Preamble  │   │ - Parties   │   │ - Triggers      │           │
│  │ - Recitals  │   │ - Dates     │   │ - Conditions    │           │
│  │ - Terms     │   │ - Amounts   │   │ - Actions       │           │
│  │ - Clauses   │   │ - Assets    │   │ - Workflows     │           │
│  │ - Schedules │   │ - Tokens    │   │ - Events        │           │
│  │ - Exhibits  │   │ - Limits    │   │ - Oracles       │           │
│  └─────────────┘   └─────────────┘   └─────────────────┘           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    VERSION CONTROL                          │   │
│  │  v1.0.0 → v1.0.1 → v1.1.0 → v2.0.0 (Major/Minor/Patch)     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                 STAKEHOLDER SIGNATURES                      │   │
│  │  [Owner] [Party A] [Party B] [VVB] [Witness] [Regulator]   │   │
│  │  Each bound to Primary/Secondary/Composite tokens          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### R - Result

**Expected Outcomes:**
- Complete Ricardian Contract implementation with legal + technical integration
- Full versioning with semantic versioning (SemVer)
- RBAC-based multi-stakeholder signature workflow
- Token-bound stakeholder participation
- Mandatory VVB verification for listing
- Automated trigger-based workflow execution
- Enterprise-grade compliance and auditability

### C - Consequence

**Positive Consequences:**
- Legal enforceability with automated execution
- Transparent, auditable contract lifecycle
- Regulatory compliance for RWA tokenization
- Reduced dispute resolution time (contracts are unambiguous)
- Cross-jurisdictional validity with proper localization

**Risks if Not Implemented:**
- Legal exposure from unenforceable smart contracts
- Regulatory non-compliance penalties
- Market distrust in platform integrity
- Manual intervention required for every contract execution

---

## Work Breakdown Structure (WBS)

### WBS Overview

```
1.0 ActiveContracts Project
├── 1.1 Core Data Model
├── 1.2 Wizard Enhancement (Prose/Parameters/Programming)
├── 1.3 Version Control System
├── 1.4 RBAC Signature Workflow
├── 1.5 Token Binding Integration
├── 1.6 VVB Verification Integration
├── 1.7 Trigger Execution Engine
├── 1.8 Frontend Components
├── 1.9 Testing & QA
└── 1.10 Documentation & Deployment
```

---

## Fee Structure & Cost Model

### Fee Overview

Each stage of ActiveContract authoring incurs a fee denominated in **AURI tokens**. Fees are calculated based on complexity, storage, and computational requirements.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ACTIVECONTRACT FEE STRUCTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Stage                          │ Base Fee (AURI) │ Variable Component      │
│  ───────────────────────────────┼─────────────────┼─────────────────────────│
│  1. Document Upload             │      5.00       │ +0.01 per KB            │
│  2. Prose Editing               │     10.00       │ +0.50 per clause        │
│  3. Parameters Configuration    │      8.00       │ +1.00 per party         │
│  4. Programming (Triggers)      │     15.00       │ +2.00 per trigger       │
│  5. Version Creation            │      3.00       │ +0.10 per change        │
│  6. Signature Request           │      2.00       │ per stakeholder         │
│  7. VVB Submission              │     25.00       │ flat fee                │
│  8. Contract Activation         │     20.00       │ flat fee                │
│  ───────────────────────────────┼─────────────────┼─────────────────────────│
│  MINIMUM TOTAL                  │     88.00 AURI  │ (simple 2-party contract)│
│  TYPICAL TOTAL                  │   150-300 AURI  │ (standard RWA contract) │
│  COMPLEX CONTRACT               │   500+ AURI     │ (multi-party, triggers) │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Detailed Fee Breakdown by Stage

#### Stage 1: Document Upload Fee
| Component | Fee (AURI) | Description |
|-----------|------------|-------------|
| Base Upload | 5.00 | Processing and storage initialization |
| Storage | 0.01/KB | Document storage (max 10MB = 100 AURI) |
| Text Extraction | 2.00 | PDF/DOC parsing (if applicable) |
| **Typical Total** | **7-15 AURI** | |

#### Stage 2: Prose Editing Fee
| Component | Fee (AURI) | Description |
|-----------|------------|-------------|
| Base Editing | 10.00 | Prose section initialization |
| Per Clause | 0.50 | Each clause added/modified |
| Per Schedule | 1.00 | Each schedule/exhibit added |
| Legal Template | 5.00 | Using pre-approved template |
| **Typical Total** | **15-30 AURI** | |

#### Stage 3: Parameters Configuration Fee
| Component | Fee (AURI) | Description |
|-----------|------------|-------------|
| Base Config | 8.00 | Parameter section initialization |
| Per Party | 1.00 | Each party added |
| Per Token Binding | 2.00 | Binding to Primary/Secondary/Composite token |
| Asset Valuation | 3.00 | External valuation lookup |
| **Typical Total** | **15-25 AURI** | |

#### Stage 4: Programming (Triggers/Actions) Fee
| Component | Fee (AURI) | Description |
|-----------|------------|-------------|
| Base Programming | 15.00 | Programming section initialization |
| Per Trigger | 2.00 | Each trigger defined |
| Per Condition | 1.00 | Each IF/THEN condition |
| Per Action | 1.50 | Each action defined |
| Oracle Integration | 5.00 | External oracle data source |
| EI Node Connection | 3.00 | Per EI node data feed |
| **Typical Total** | **25-50 AURI** | |

#### Stage 5: Version Control Fee
| Component | Fee (AURI) | Description |
|-----------|------------|-------------|
| Version Creation | 3.00 | New version snapshot |
| Per Change Logged | 0.10 | Each tracked change |
| Amendment | 5.00 | Creating amendment from existing |
| **Typical Total** | **5-10 AURI** | |

#### Stage 6: Signature Collection Fee
| Component | Fee (AURI) | Description |
|-----------|------------|-------------|
| Per Signature Request | 2.00 | Sending signature request |
| Quantum Signature | 1.00 | CRYSTALS-Dilithium signing |
| Signature Verification | 0.50 | On-chain verification |
| **Typical Total** | **7-20 AURI** | (depending on parties) |

#### Stage 7: VVB Verification Fee
| Component | Fee (AURI) | Description |
|-----------|------------|-------------|
| VVB Submission | 25.00 | Flat fee for VVB review |
| Expedited Review | 50.00 | Priority processing (optional) |
| Re-submission | 10.00 | After rejection |
| **Typical Total** | **25-75 AURI** | |

#### Stage 8: Contract Activation Fee
| Component | Fee (AURI) | Description |
|-----------|------------|-------------|
| Activation | 20.00 | Deploy to active contract registry |
| Merkle Registration | 5.00 | Add to Merkle tree |
| Marketplace Listing | 10.00 | Optional: list on marketplace |
| **Typical Total** | **25-35 AURI** | |

### Fee Calculation Formula

```
Total Fee = Σ (Base Fee[stage] + Variable Fee[stage])

Where Variable Fee[stage] = Σ (unit_cost × quantity)

Example Calculation:
─────────────────────────────────────────────────────────────
Document Upload:     5.00 + (50KB × 0.01)           =   5.50
Prose Editing:      10.00 + (8 clauses × 0.50)      =  14.00
Parameters:          8.00 + (3 parties × 1.00)      =  11.00
                          + (2 tokens × 2.00)       =  +4.00
Programming:        15.00 + (3 triggers × 2.00)     =  21.00
                          + (5 conditions × 1.00)   =  +5.00
Version:             3.00 + (10 changes × 0.10)     =   4.00
Signatures:          2.00 × 3 parties               =   6.00
                          + (3 × 1.00 quantum)      =  +3.00
VVB:                25.00                           =  25.00
Activation:         20.00 + 5.00 merkle             =  25.00
─────────────────────────────────────────────────────────────
TOTAL CONTRACT FEE:                                 = 123.50 AURI
```

### Fee Summary Response Model

At draft completion, the system returns a comprehensive fee summary:

```json
{
  "contractId": "AC-2025-001",
  "feeEstimate": {
    "currency": "AURI",
    "breakdown": {
      "documentUpload": {
        "baseFee": 5.00,
        "storageFee": 0.50,
        "extractionFee": 2.00,
        "subtotal": 7.50
      },
      "proseEditing": {
        "baseFee": 10.00,
        "clauseFee": 4.00,
        "scheduleFee": 2.00,
        "subtotal": 16.00
      },
      "parameters": {
        "baseFee": 8.00,
        "partyFee": 3.00,
        "tokenBindingFee": 4.00,
        "subtotal": 15.00
      },
      "programming": {
        "baseFee": 15.00,
        "triggerFee": 6.00,
        "conditionFee": 5.00,
        "actionFee": 4.50,
        "subtotal": 30.50
      },
      "versionControl": {
        "baseFee": 3.00,
        "changeFee": 1.00,
        "subtotal": 4.00
      },
      "signatures": {
        "requestFee": 6.00,
        "signingFee": 3.00,
        "verificationFee": 1.50,
        "subtotal": 10.50
      },
      "vvbVerification": {
        "submissionFee": 25.00,
        "subtotal": 25.00
      },
      "activation": {
        "activationFee": 20.00,
        "merkleFee": 5.00,
        "subtotal": 25.00
      }
    },
    "totalEstimate": 133.50,
    "discount": {
      "type": "VOLUME",
      "percentage": 10,
      "amount": 13.35
    },
    "finalTotal": 120.15,
    "expiresAt": "2025-12-22T12:00:00Z"
  },
  "paymentOptions": {
    "payNow": true,
    "payOnActivation": true,
    "escrow": true
  }
}
```

### Fee-Related API Endpoints

```
GET    /api/v12/contracts/{id}/fees/estimate           # Get fee estimate before action
GET    /api/v12/contracts/{id}/fees/breakdown          # Detailed fee breakdown
POST   /api/v12/contracts/{id}/fees/calculate          # Calculate fees for planned changes
GET    /api/v12/contracts/{id}/fees/history            # Fee payment history
POST   /api/v12/contracts/{id}/fees/pay                # Pay outstanding fees
GET    /api/v12/contracts/fees/rates                   # Current fee rate schedule
```

### Fee Payment Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Wizard    │ ──▶ │   Draft     │ ──▶ │    Fee      │ ──▶ │   Payment   │
│   Steps     │     │   Complete  │     │   Summary   │     │   Required  │
└─────────────┘     └─────────────┘     └──────┬──────┘     └──────┬──────┘
                                               │                    │
                                               ▼                    ▼
                                        ┌─────────────┐     ┌─────────────┐
                                        │ Fee Details │     │   Pay Now   │
                                        │ - Per stage │     │    -or-     │
                                        │ - Discounts │     │ Pay Later   │
                                        │ - Total     │     │ (Escrow)    │
                                        └─────────────┘     └──────┬──────┘
                                                                   │
                                                                   ▼
                                                            ┌─────────────┐
                                                            │ Signature   │
                                                            │ Collection  │
                                                            │ (Unpaid     │
                                                            │ contracts   │
                                                            │ cannot      │
                                                            │ activate)   │
                                                            └─────────────┘
```

### Discount Structure

| Discount Type | Condition | Discount |
|---------------|-----------|----------|
| Volume | > 10 contracts/month | 10% off |
| Enterprise | Enterprise tier | 20% off |
| Template | Using approved template | 15% off |
| Early Payment | Pay within 24 hours | 5% off |
| Referral | Referred by partner | 10% off |
| Staking | Staking 10K+ AURI | 15% off |

### Fee Escrow for Multi-Party Contracts

For contracts with multiple stakeholders, fees can be split:

```json
{
  "feeSplit": {
    "method": "PROPORTIONAL",
    "allocation": [
      { "party": "0xOwner...", "role": "OWNER", "percentage": 50 },
      { "party": "0xBuyer...", "role": "BUYER", "percentage": 30 },
      { "party": "0xAgent...", "role": "AGENT", "percentage": 20 }
    ],
    "escrowRequired": true,
    "escrowReleaseCondition": "ALL_SIGNATURES"
  }
}
```

---

## Detailed WBS

### 1.1 Core Data Model (13 Story Points)

| ID | Task | Description | Estimate |
|----|------|-------------|----------|
| 1.1.1 | ActiveContract Entity Refactor | Restructure to Prose/Parameters/Programming sections | 3 SP |
| 1.1.2 | ContractProse Entity | Legal text with sections, clauses, schedules, exhibits | 3 SP |
| 1.1.3 | ContractParameters Entity | Key-value parameters, dates, amounts, assets, limits | 2 SP |
| 1.1.4 | ContractProgramming Entity | Triggers, conditions, actions, workflows, events | 3 SP |
| 1.1.5 | ContractVersion Entity | Version tracking with change history | 2 SP |

**Deliverables:**
- `ActiveContract.java` (refactored)
- `ContractProse.java`
- `ContractParameters.java`
- `ContractProgramming.java`
- `ContractVersion.java`
- Database migrations

---

### 1.2 Wizard Enhancement (21 Story Points)

#### 1.2.1 Prose Wizard Steps (8 SP)

| ID | Task | Description | Estimate |
|----|------|-------------|----------|
| 1.2.1.1 | Document Upload | PDF/DOC/DOCX upload with text extraction | 2 SP |
| 1.2.1.2 | Prose Section Editor | Edit preamble, recitals, terms, clauses | 3 SP |
| 1.2.1.3 | Schedule/Exhibit Manager | Add/edit contract schedules and exhibits | 2 SP |
| 1.2.1.4 | Prose Preview | Read-only preview with highlighting | 1 SP |

#### 1.2.2 Parameters Wizard Steps (7 SP)

| ID | Task | Description | Estimate |
|----|------|-------------|----------|
| 1.2.2.1 | Party Configuration | Add/edit parties with roles, addresses, tokens | 2 SP |
| 1.2.2.2 | Financial Parameters | Amounts, currencies, payment schedules | 2 SP |
| 1.2.2.3 | Asset Binding | Link contract to tokenized assets | 2 SP |
| 1.2.2.4 | Date/Duration Config | Effective dates, expiry, milestones | 1 SP |

#### 1.2.3 Programming Wizard Steps (6 SP)

| ID | Task | Description | Estimate |
|----|------|-------------|----------|
| 1.2.3.1 | Trigger Builder | Visual trigger configuration (time, event, oracle) | 2 SP |
| 1.2.3.2 | Condition Builder | IF/THEN condition logic builder | 2 SP |
| 1.2.3.3 | Action Builder | Define actions (transfer, notify, execute) | 2 SP |

**API Endpoints:**

```
POST   /api/v12/contracts/wizard/upload                    # Step 1: Upload
GET    /api/v12/contracts/wizard/{id}/prose                # Step 2a: Get prose
PUT    /api/v12/contracts/wizard/{id}/prose                # Step 2b: Update prose
GET    /api/v12/contracts/wizard/{id}/parameters           # Step 3a: Get params
PUT    /api/v12/contracts/wizard/{id}/parameters           # Step 3b: Update params
GET    /api/v12/contracts/wizard/{id}/programming          # Step 4a: Get programming
PUT    /api/v12/contracts/wizard/{id}/programming          # Step 4b: Update programming
GET    /api/v12/contracts/wizard/{id}/preview              # Step 5: Full preview
POST   /api/v12/contracts/wizard/{id}/finalize             # Step 6: Create contract
```

---

### 1.3 Version Control System (8 Story Points)

| ID | Task | Description | Estimate |
|----|------|-------------|----------|
| 1.3.1 | Version Schema | SemVer (Major.Minor.Patch) implementation | 2 SP |
| 1.3.2 | Change Tracking | Diff generation for prose/params/programming | 3 SP |
| 1.3.3 | Version History API | List versions, compare versions, rollback | 2 SP |
| 1.3.4 | Amendment Workflow | Create new version from existing contract | 1 SP |

**API Endpoints:**

```
GET    /api/v12/contracts/{id}/versions                    # List all versions
GET    /api/v12/contracts/{id}/versions/{version}          # Get specific version
POST   /api/v12/contracts/{id}/versions                    # Create new version
GET    /api/v12/contracts/{id}/versions/compare            # Compare two versions
POST   /api/v12/contracts/{id}/amend                       # Create amendment
```

---

### 1.4 RBAC Signature Workflow (13 Story Points)

| ID | Task | Description | Estimate |
|----|------|-------------|----------|
| 1.4.1 | Stakeholder Roles | Define OWNER, PARTY, WITNESS, VVB, REGULATOR roles | 2 SP |
| 1.4.2 | Signature Requirements | Configure required signatures per role | 2 SP |
| 1.4.3 | Signature Workflow | Sequential/parallel signature collection | 3 SP |
| 1.4.4 | Quantum-Safe Signatures | CRYSTALS-Dilithium integration | 2 SP |
| 1.4.5 | Signature Verification | Verify all signatures before activation | 2 SP |
| 1.4.6 | Signature Notifications | Email/webhook notifications for signature requests | 2 SP |

**Signature Workflow States:**

```
DRAFT → PENDING_SIGNATURES → PARTIALLY_SIGNED → FULLY_SIGNED → VVB_REVIEW → APPROVED → ACTIVE
                                    ↓
                              REJECTED (with reason)
```

**API Endpoints:**

```
GET    /api/v12/contracts/{id}/signatures                  # List signatures
POST   /api/v12/contracts/{id}/signatures                  # Submit signature
GET    /api/v12/contracts/{id}/signatures/requirements     # Get required signatures
POST   /api/v12/contracts/{id}/signatures/request          # Request signature from party
GET    /api/v12/contracts/{id}/signatures/status           # Workflow status
```

---

### 1.5 Token Binding Integration (10 Story Points)

| ID | Task | Description | Estimate |
|----|------|-------------|----------|
| 1.5.1 | Stakeholder Token Registry | Map stakeholders to their tokens | 2 SP |
| 1.5.2 | Primary Token Binding | Bind contract to primary asset token | 2 SP |
| 1.5.3 | Secondary Token Binding | Bind contract to secondary tokens (rights, revenue) | 2 SP |
| 1.5.4 | Composite Token Binding | Bind contract to composite token bundles | 2 SP |
| 1.5.5 | Token Verification | Verify stakeholder owns required tokens | 2 SP |

**Token Binding Model:**

```json
{
  "contractId": "AC-001",
  "tokenBindings": {
    "primaryToken": {
      "tokenId": "RWAT-PROP-001",
      "tokenType": "PRIMARY",
      "assetType": "REAL_ESTATE",
      "stakeholder": "0xOwner..."
    },
    "secondaryTokens": [
      {
        "tokenId": "RWAT-REV-001",
        "tokenType": "REVENUE_SHARE",
        "percentage": 10,
        "stakeholder": "0xInvestor1..."
      }
    ],
    "compositeTokens": [
      {
        "tokenId": "COMP-BUNDLE-001",
        "components": ["RWAT-PROP-001", "RWAT-REV-001"]
      }
    ]
  }
}
```

---

### 1.6 VVB Verification Integration (8 Story Points)

| ID | Task | Description | Estimate |
|----|------|-------------|----------|
| 1.6.1 | VVB Submission | Submit contract for VVB review | 2 SP |
| 1.6.2 | VVB Review Workflow | VVB reviews prose, params, programming | 2 SP |
| 1.6.3 | VVB Attestation | VVB signs attestation on verified data | 2 SP |
| 1.6.4 | Listing Approval | Only VVB-approved contracts can be listed | 2 SP |

**VVB Verification Flow:**

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Fully Signed   │ ──▶ │   VVB Review    │ ──▶ │   VVB Approved  │
│    Contract     │     │                 │     │   (Listed)      │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  VVB Rejected   │
                        │ (Revision Req)  │
                        └─────────────────┘
```

**API Endpoints:**

```
POST   /api/v12/contracts/{id}/vvb/submit                  # Submit for VVB review
GET    /api/v12/contracts/{id}/vvb/status                  # VVB review status
POST   /api/v12/contracts/{id}/vvb/approve                 # VVB approves (VVB only)
POST   /api/v12/contracts/{id}/vvb/reject                  # VVB rejects with reason
GET    /api/v12/contracts/{id}/vvb/attestation             # Get VVB attestation
```

---

### 1.6.5 EI Node Data Integration (8 Story Points)

| ID | Task | Description | Estimate |
|----|------|-------------|----------|
| 1.6.5.1 | Stakeholder Data Feed | Stakeholders provide data via API/upload | 2 SP |
| 1.6.5.2 | EI Node Data Ingestion | External data via EI nodes (exchanges, oracles) | 3 SP |
| 1.6.5.3 | Data Tokenization | Tokenize external data feeds for contract use | 2 SP |
| 1.6.5.4 | Data Attestation | VVB attests to data source validity | 1 SP |

**Data Sources Architecture:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONTRACT DATA SOURCES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐                    ┌──────────────────┐               │
│  │   STAKEHOLDER    │                    │    EI NODES      │               │
│  │   DATA INPUT     │                    │ (External Integ) │               │
│  ├──────────────────┤                    ├──────────────────┤               │
│  │ - Document Upload│                    │ - Binance Feed   │               │
│  │ - API Submission │                    │ - Coinbase Feed  │               │
│  │ - Form Entry     │                    │ - Oracle Data    │               │
│  │ - Asset Valuation│                    │ - IoT Sensors    │               │
│  │ - KYC Documents  │                    │ - Registry APIs  │               │
│  └────────┬─────────┘                    └────────┬─────────┘               │
│           │                                       │                         │
│           ▼                                       ▼                         │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │                    DATA VALIDATION LAYER                        │        │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │        │
│  │  │ Schema      │  │ Signature   │  │ VVB Attestation         │ │        │
│  │  │ Validation  │  │ Verification│  │ (for regulated data)    │ │        │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘ │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                 │                                           │
│                                 ▼                                           │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │                    DATA TOKENIZATION                            │        │
│  │  Data → Hash → Merkle Tree → Token Binding → Contract Params   │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                 │                                           │
│                                 ▼                                           │
│  ┌────────────────────────────────────────────────────────────────┐        │
│  │                 ACTIVECONTRACT PARAMETERS                       │        │
│  │  Parameters.externalData[] ← Validated, Attested, Tokenized    │        │
│  └────────────────────────────────────────────────────────────────┘        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**EI Node Data Types:**

| Data Source | EI Node Type | Use Case | Frequency |
|-------------|--------------|----------|-----------|
| Binance/Coinbase | CryptoExchange EI | Price feeds for asset valuation | Real-time |
| Verra/Gold Standard | Carbon Registry EI | Carbon credit verification | On-demand |
| Land Registry | Government EI | Property ownership verification | On-demand |
| IoT Sensors | IoT Gateway EI | Environmental/supply chain data | Streaming |
| Chainlink/Band | Oracle EI | Any external data feed | Configurable |

**API Endpoints for Data Input:**

```
POST   /api/v12/contracts/{id}/data/stakeholder             # Stakeholder submits data
POST   /api/v12/contracts/{id}/data/ei-node                 # EI node pushes data
GET    /api/v12/contracts/{id}/data/sources                 # List data sources
POST   /api/v12/contracts/{id}/data/validate                # Validate data
POST   /api/v12/contracts/{id}/data/attest                  # Request VVB attestation
GET    /api/v12/contracts/{id}/data/tokenized               # Get tokenized data
```

---

### 1.7 Trigger Execution Engine (15 Story Points)

| ID | Task | Description | Estimate |
|----|------|-------------|----------|
| 1.7.1 | Trigger Registry | Register and manage contract triggers | 2 SP |
| 1.7.2 | Time-Based Triggers | Cron-like scheduled triggers | 2 SP |
| 1.7.3 | Event-Based Triggers | Blockchain event triggers | 3 SP |
| 1.7.4 | Oracle Triggers | External data feed triggers | 3 SP |
| 1.7.5 | Condition Evaluator | Evaluate IF/THEN conditions | 2 SP |
| 1.7.6 | Action Executor | Execute actions (transfer, notify, call) | 3 SP |

**Trigger Types:**

```java
public enum TriggerType {
    TIME_BASED,      // At specific date/time or interval
    EVENT_BASED,     // On blockchain event (transfer, approval)
    ORACLE_BASED,    // On external data update (price feed)
    MANUAL,          // Requires user action
    CONDITIONAL      // Based on parameter value
}

public enum ActionType {
    TOKEN_TRANSFER,  // Transfer tokens between parties
    NOTIFICATION,    // Send notification to stakeholders
    STATE_CHANGE,    // Update contract state
    EXTERNAL_CALL,   // Call external smart contract
    WORKFLOW_START,  // Start RBAC workflow
    ESCROW_RELEASE   // Release escrowed assets
}
```

**Trigger Execution Flow:**

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌─────────────┐
│   Trigger   │ ──▶ │   Condition  │ ──▶ │   Action    │ ──▶ │   Audit     │
│   Fires     │     │   Evaluate   │     │   Execute   │     │   Log       │
└─────────────┘     └──────┬───────┘     └─────────────┘     └─────────────┘
                           │
                           ▼ (false)
                    ┌─────────────┐
                    │   No Action │
                    │   (logged)  │
                    └─────────────┘
```

**API Endpoints:**

```
GET    /api/v12/contracts/{id}/triggers                    # List triggers
POST   /api/v12/contracts/{id}/triggers                    # Add trigger
PUT    /api/v12/contracts/{id}/triggers/{triggerId}        # Update trigger
DELETE /api/v12/contracts/{id}/triggers/{triggerId}        # Remove trigger
POST   /api/v12/contracts/{id}/triggers/{triggerId}/test   # Test trigger
GET    /api/v12/contracts/{id}/triggers/history            # Execution history
```

---

### 1.8 Frontend Components (18 Story Points)

| ID | Task | Description | Estimate |
|----|------|-------------|----------|
| 1.8.1 | Contract Wizard UI | Multi-step wizard for Prose/Params/Programming | 5 SP |
| 1.8.2 | Prose Editor | Rich text editor with clause templates | 3 SP |
| 1.8.3 | Parameter Form | Dynamic form builder for parameters | 3 SP |
| 1.8.4 | Trigger Builder UI | Visual drag-and-drop trigger configuration | 3 SP |
| 1.8.5 | Signature Dashboard | Signature status and collection UI | 2 SP |
| 1.8.6 | Version Compare | Side-by-side version comparison | 2 SP |

---

### 1.9 Testing & QA (10 Story Points)

| ID | Task | Description | Estimate |
|----|------|-------------|----------|
| 1.9.1 | Unit Tests | Service and repository tests | 3 SP |
| 1.9.2 | Integration Tests | API endpoint tests | 3 SP |
| 1.9.3 | E2E Tests | Full wizard flow tests | 2 SP |
| 1.9.4 | Security Tests | RBAC and signature verification | 2 SP |

---

### 1.10 Documentation & Deployment (5 Story Points)

| ID | Task | Description | Estimate |
|----|------|-------------|----------|
| 1.10.1 | API Documentation | OpenAPI/Swagger documentation | 2 SP |
| 1.10.2 | User Guide | Contract wizard user guide | 2 SP |
| 1.10.3 | Deployment Guide | Production deployment checklist | 1 SP |

---

## Total Story Points: 129 SP

### Sprint Allocation (2-Week Sprints)

| Sprint | Focus Area | Story Points |
|--------|------------|--------------|
| Sprint 1 | Core Data Model (1.1) | 13 SP |
| Sprint 2 | Wizard Enhancement - Prose (1.2.1) | 8 SP |
| Sprint 3 | Wizard Enhancement - Params/Programming (1.2.2, 1.2.3) | 13 SP |
| Sprint 4 | Version Control (1.3) + RBAC Start (1.4.1-1.4.3) | 15 SP |
| Sprint 5 | RBAC Complete (1.4.4-1.4.6) + Token Binding (1.5) | 16 SP |
| Sprint 6 | VVB Integration (1.6.1-1.6.4) + EI Node Integration (1.6.5) | 16 SP |
| Sprint 7 | Trigger Engine (1.7) | 15 SP |
| Sprint 8 | Frontend Components (1.8) | 18 SP |
| Sprint 9 | Testing & QA (1.9) + Documentation (1.10) | 15 SP |

---

## Technical Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ACTIVECONTRACT LIFECYCLE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐      │
│  │ UPLOAD  │──▶│  EDIT   │──▶│ PREVIEW │──▶│FINALIZE │──▶│  SIGN   │      │
│  │Document │   │ Prose/  │   │ Full    │   │ Create  │   │ Multi-  │      │
│  │         │   │ Params/ │   │Contract │   │ v1.0.0  │   │ Party   │      │
│  │         │   │ Program │   │         │   │         │   │         │      │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └────┬────┘      │
│                                                                │            │
│                        ┌───────────────────────────────────────┘            │
│                        ▼                                                    │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐      │
│  │  VVB    │──▶│ APPROVE │──▶│  LIST   │──▶│TRIGGERS │──▶│WORKFLOW │      │
│  │ Review  │   │  (VVB)  │   │  (Mkt)  │   │  Fire   │   │ Execute │      │
│  │         │   │         │   │         │   │         │   │         │      │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Service Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND SERVICES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    ActiveContractWizardService                       │   │
│  │  - uploadDocument()  - editProse()  - editParams()  - editProgram() │   │
│  │  - preview()  - finalize()  - createVersion()                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │ ContractVersion │  │ SignatureWflow  │  │ TokenBinding    │            │
│  │ Service         │  │ Service         │  │ Service         │            │
│  │ - createVersion │  │ - requestSign   │  │ - bindPrimary   │            │
│  │ - compareVersions│ │ - submitSign    │  │ - bindSecondary │            │
│  │ - rollback      │  │ - verifyAll     │  │ - verifyOwnership│           │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │
│  │ VVBIntegration  │  │ TriggerEngine   │  │ WorkflowExecutor│            │
│  │ Service         │  │ Service         │  │ Service         │            │
│  │ - submitReview  │  │ - registerTrig  │  │ - executeAction │            │
│  │ - getAttestation│  │ - evaluateCond  │  │ - notifyParties │            │
│  │ - approve/reject│  │ - fireAction    │  │ - updateState   │            │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## API Summary

### Wizard Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v12/contracts/wizard/upload` | Upload document |
| GET | `/api/v12/contracts/wizard/{id}/prose` | Get prose section |
| PUT | `/api/v12/contracts/wizard/{id}/prose` | Update prose |
| GET | `/api/v12/contracts/wizard/{id}/parameters` | Get parameters |
| PUT | `/api/v12/contracts/wizard/{id}/parameters` | Update parameters |
| GET | `/api/v12/contracts/wizard/{id}/programming` | Get programming |
| PUT | `/api/v12/contracts/wizard/{id}/programming` | Update programming |
| GET | `/api/v12/contracts/wizard/{id}/preview` | Full preview |
| POST | `/api/v12/contracts/wizard/{id}/finalize` | Create contract |

### Version Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v12/contracts/{id}/versions` | List versions |
| POST | `/api/v12/contracts/{id}/versions` | Create version |
| GET | `/api/v12/contracts/{id}/versions/compare` | Compare versions |

### Signature Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v12/contracts/{id}/signatures` | List signatures |
| POST | `/api/v12/contracts/{id}/signatures` | Submit signature |
| POST | `/api/v12/contracts/{id}/signatures/request` | Request signature |

### VVB Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v12/contracts/{id}/vvb/submit` | Submit for review |
| POST | `/api/v12/contracts/{id}/vvb/approve` | Approve (VVB only) |
| POST | `/api/v12/contracts/{id}/vvb/reject` | Reject with reason |

### Trigger Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v12/contracts/{id}/triggers` | List triggers |
| POST | `/api/v12/contracts/{id}/triggers` | Add trigger |
| POST | `/api/v12/contracts/{id}/triggers/{tid}/test` | Test trigger |

### Data Input Endpoints (Stakeholder & EI Node)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v12/contracts/{id}/data/stakeholder` | Stakeholder submits data |
| POST | `/api/v12/contracts/{id}/data/ei-node` | EI node pushes data |
| GET | `/api/v12/contracts/{id}/data/sources` | List all data sources |
| POST | `/api/v12/contracts/{id}/data/validate` | Validate submitted data |
| POST | `/api/v12/contracts/{id}/data/attest` | Request VVB attestation |
| GET | `/api/v12/contracts/{id}/data/tokenized` | Get tokenized data |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Contract Creation Time | < 15 minutes | Average wizard completion |
| Signature Collection | < 48 hours | Time to full signatures |
| VVB Approval Rate | > 90% | First-submission approval |
| Trigger Execution | < 1 second | Trigger-to-action latency |
| Version Accuracy | 100% | No data loss in versioning |
| RBAC Compliance | 100% | Unauthorized action prevention |

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Complex UI | Medium | High | Iterative user testing |
| VVB Bottleneck | Medium | Medium | Multiple VVB support |
| Trigger Misfire | Low | High | Comprehensive testing, rollback |
| Token Depegging | Low | High | Multi-sig controls |
| Legal Ambiguity | Medium | High | Legal review of prose templates |

---

## Next Steps

1. **Immediate**: Create JIRA epics and stories from WBS
2. **Sprint 1 Start**: Begin Core Data Model implementation
3. **Parallel**: UX design for wizard enhancements
4. **Continuous**: Legal review of contract templates

---

**Approved By**: [Pending]
**Review Date**: [Pending]
**Implementation Start**: [Pending]
