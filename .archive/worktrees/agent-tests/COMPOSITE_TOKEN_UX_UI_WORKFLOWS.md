# Composite Token Feature - Complete UX/UI & Workflow Design

**Document Purpose**: Detailed UI/UX specifications and user workflows for Composite Token feature
**Scope**: All 6 modules, complete user journeys, wireframe mockups, interaction patterns
**Target Audience**: Agents 2.1-2.6, UX/UI designers, QA engineers
**Status**: Ready for implementation

---

## Table of Contents

1. Design System & Components
2. User Personas & Journey Maps
3. Module 2.1: Primary Token UX/UI
4. Module 2.2: Secondary Token UX/UI
5. Module 2.3: Composite Token Creation UX/UI
6. Module 2.4: Contract Binding UX/UI
7. Module 2.5: Merkle Registry UX/UI
8. Module 2.6: Portal Integration UX/UI
9. End-to-End User Workflows
10. Accessibility & Performance Requirements

---

## 1. Design System & Components

### 1.1 Color Palette

```
Primary Colors:
  ✓ Blue (#0066CC):        Primary actions, buttons, links
  ✓ Green (#22C55E):       Success, verified status, positive actions
  ✓ Amber (#F59E0B):       Warning, pending, attention needed
  ✓ Red (#EF4444):         Error, rejected, critical issues
  ✓ Purple (#9333EA):      Secondary, advanced features
  ✓ Slate (#64748B):       Neutral, disabled states

Neutrals:
  ✓ White (#FFFFFF):       Background
  ✓ Gray-50 (#F9FAFB):     Secondary background
  ✓ Gray-100 (#F3F4F6):    Hover state
  ✓ Gray-800 (#1F2937):    Text primary
  ✓ Gray-600 (#4B5563):    Text secondary
```

### 1.2 Typography Scale

```
Headings:
  H1: 32px, Bold, 40px line-height
  H2: 24px, Bold, 32px line-height
  H3: 20px, SemiBold, 28px line-height
  H4: 16px, SemiBold, 24px line-height

Body:
  Large: 16px, Regular, 24px line-height
  Base: 14px, Regular, 20px line-height
  Small: 12px, Regular, 16px line-height

Captions:
  11px, Regular, 16px line-height, Gray-600
```

### 1.3 Spacing System

```
xs:   4px    (form labels, tight spacing)
sm:   8px    (button padding, tight components)
md:   16px   (standard padding, section spacing)
lg:   24px   (large gaps, section breaks)
xl:   32px   (major section spacing)
2xl:  48px   (page-level spacing)
```

### 1.4 Component Library (Ant Design v5)

**Reusable Components**:
```
Forms:
  ✓ Input (text, number, email, password)
  ✓ Select (single, multi-select with search)
  ✓ DatePicker (date range pickers)
  ✓ Upload (file drag-and-drop, progress)
  ✓ Checkbox, Radio
  ✓ Textarea (multi-line text)

Display:
  ✓ Card (content containers, borders)
  ✓ Table (data grids with pagination, sorting)
  ✓ Badge (status indicators)
  ✓ Tag (categorization)
  ✓ Alert (notifications, errors, warnings)
  ✓ Modal (dialogs, confirmations)

Navigation:
  ✓ Tabs (content switching)
  ✓ Breadcrumb (location indicator)
  ✓ Steps (workflow progress)
  ✓ Menu (navigation lists)
  ✓ Drawer (side panel navigation)

Feedback:
  ✓ Progress (loading states, completion bars)
  ✓ Skeleton (content loading placeholders)
  ✓ Spin (loading spinner)
  ✓ Notification (toast alerts)

Data Visualization:
  ✓ Charts (Recharts integration)
  ✓ Tree (hierarchical data, merkle trees)
  ✓ Timeline (event sequences)
```

---

## 2. User Personas & Journey Maps

### 2.1 User Personas

**Persona 1: Asset Owner (Primary Token Creator)**
- Name: Sarah Chen
- Role: Real estate investor
- Tech Level: Intermediate
- Goals: Tokenize property, create digital record, verify authenticity
- Pain Points: Understanding complex paperwork, slow verification process
- Actions: Upload asset, manage KYC, view primary token, monitor verification

**Persona 2: Document Curator (Secondary Token Uploader)**
- Name: Marcus Thompson
- Role: Property manager / notary
- Tech Level: Intermediate
- Goals: Upload supporting documents, track verification status
- Pain Points: Managing multiple file types, ensuring completeness
- Actions: Upload documents, check status, receive notifications

**Persona 3: Trusted Oracle (Verifier)**
- Name: Dr. Alice Patel
- Role: Certified auditor / 3rd-party verifier
- Tech Level: Advanced
- Goals: Verify authenticity, sign composite tokens, maintain audit trail
- Pain Points: Queue management, signature management, compliance tracking
- Actions: Review queue, verify documents, sign composites, report

**Persona 4: Contract Administrator (Binding Manager)**
- Name: James Wilson
- Role: Legal/contract administrator
- Tech Level: Intermediate-Advanced
- Goals: Bind composites to contracts, manage execution, track status
- Pain Points: Multiple systems, workflow coordination, compliance
- Actions: Create contracts, bind composites, monitor execution

**Persona 5: Platform Administrator (Registry Manager)**
- Name: Lisa Rodriguez
- Role: Platform administrator
- Tech Level: Advanced
- Goals: Monitor registries, ensure consistency, troubleshoot issues
- Pain Points: System complexity, data integrity, performance
- Actions: Monitor registries, verify proofs, generate reports

### 2.2 End-to-End User Journey

```
Day 1 (Monday):
  Sarah (Asset Owner)
  ├─ Logs into portal
  ├─ Views dashboard
  ├─ Clicks "Create Primary Token"
  ├─ Selects asset "Property in Manhattan"
  ├─ Confirms owner KYC ID
  ├─ Reviews primary token details
  ├─ Confirms and creates token
  └─ Sees "Primary Token Created: PT-001"

Day 2-3 (Tues-Wed):
  Marcus (Document Curator)
  ├─ Receives notification about primary token
  ├─ Accesses secondary token upload form
  ├─ Drags tax receipts (5 files)
  ├─ Uploads property photos (20 images)
  ├─ Uploads video tour (1 minute)
  ├─ Uploads 3rd-party appraisal
  ├─ Sees "Secondary Tokens Uploaded"
  └─ Waits for oracle verification

Day 4 (Thursday):
  Alice (Trusted Oracle)
  ├─ Logs into oracle dashboard
  ├─ Sees 3 tokens in verification queue
  ├─ Reviews primary token (PT-001)
  ├─ Checks all secondary tokens
  ├─ Verifies document hashes (SHA-256)
  ├─ Confirms digital twin accuracy
  ├─ Signs composite token (CRYSTALS-Dilithium)
  ├─ Composite Token Created: CT-001
  └─ Sends notification to Sarah

Day 5 (Friday):
  James (Contract Administrator)
  ├─ Logs into contracts dashboard
  ├─ Sees "Composite Token Ready for Binding"
  ├─ Selects ActiveContract AC-001
  ├─ Binds CT-001 to AC-001
  ├─ Reviews binding proof
  ├─ Confirms binding
  ├─ Contract ready for execution
  └─ All parties notified

Day 6-10 (Following week):
  Execution & Settlement
  ├─ Contract parties execute terms
  ├─ Settlement transactions
  ├─ Merkle registry updated
  ├─ Digital twin immutable
  └─ All parties can verify at any time

Next Month:
  Lisa (Administrator)
  ├─ Generates registry consistency report
  ├─ Verifies merkle tree integrity
  ├─ Confirms all 4 registries in sync
  ├─ Archives completed token
  └─ 🎉 Composite token lifecycle complete
```

---

## 3. Module 2.1: Primary Token UX/UI

### 3.1 Primary Token Creation Flow

```
WIREFRAME: Primary Token Creation Screen

┌─────────────────────────────────────────────────────────────┐
│ Create Primary Token                            [X]          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1 of 3: Select Asset                                  │
│  ───────────────────────────────────────────────            │
│                                                              │
│  Select Asset: [Dropdown ▼ "Choose asset"]                 │
│                                                              │
│  Available Assets:                                          │
│  ┌─────────────────────────────────┐                       │
│  │ ○ Manhattan Property (AID-001)  │                       │
│  │   Value: $5,000,000             │                       │
│  │ ○ Carbon Credits (AID-002)      │                       │
│  │   Value: 1,000 tons CO₂         │                       │
│  │ ○ Commodity Batch (AID-003)     │                       │
│  │   Value: 500 units              │                       │
│  └─────────────────────────────────┘                       │
│                                                              │
│  Selected Asset Details:                                    │
│  ┌─────────────────────────────────┐                       │
│  │ Asset ID: AID-001               │                       │
│  │ Type: Real Estate                │                       │
│  │ Location: Manhattan, NY          │                       │
│  │ Created: 2025-11-01              │                       │
│  │ Status: ACTIVE                   │                       │
│  └─────────────────────────────────┘                       │
│                                                              │
│  [Back]                                      [Next Step]    │
└─────────────────────────────────────────────────────────────┘

WIREFRAME: Owner Verification (Step 2)

┌─────────────────────────────────────────────────────────────┐
│ Create Primary Token                            [X]          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 2 of 3: Owner KYC Verification                        │
│  ───────────────────────────────────────────────────────     │
│                                                              │
│  Owner KYC ID: [Search Box] ________________ [Search]      │
│                                                              │
│  KYC Verification Status:                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✓ KYC-2025-001234                                  │   │
│  │   Sarah Chen                                       │   │
│  │   Status: VERIFIED (green badge)                  │   │
│  │   Verification Date: 2025-10-15                   │   │
│  │   ID Type: Passport                               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Back]                                      [Next Step]    │
└─────────────────────────────────────────────────────────────┘

WIREFRAME: Review & Confirm (Step 3)

┌─────────────────────────────────────────────────────────────┐
│ Create Primary Token                            [X]          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 3 of 3: Review & Confirm                              │
│  ───────────────────────────────────────────────────────    │
│                                                              │
│  Asset Information:                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Asset ID: AID-001                                  │   │
│  │ Type: Real Estate                                  │   │
│  │ Value: $5,000,000                                  │   │
│  │ Location: Manhattan, NY                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Owner Information:                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Owner: Sarah Chen                                  │   │
│  │ KYC ID: KYC-2025-001234                           │   │
│  │ KYC Status: ✓ VERIFIED                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Primary Token Details:                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Token ID: PT-001 (auto-generated)                  │   │
│  │ Token Value: $5,000,000                            │   │
│  │ Status: CREATED (will transition)                  │   │
│  │ Merkle Path: [empty, will be assigned]             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ⚠️  Important: Once created, this primary token cannot be  │
│      modified. Secondary tokens can be added later.        │
│                                                              │
│  ☑ I confirm the above information is accurate             │
│                                                              │
│  [Back]        [Create Primary Token]  (blue button)       │
└─────────────────────────────────────────────────────────────┘

SUCCESS MODAL:

┌─────────────────────────────────────────────────────────────┐
│ Primary Token Created Successfully!                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ✓ (large checkmark, green)                                │
│                                                              │
│  Token ID: PT-001                                           │
│  Created: Nov 13, 2025, 2:45 PM UTC                        │
│  Status: ACTIVE (awaiting secondary tokens)               │
│                                                              │
│  Next Steps:                                                │
│  1. Upload secondary tokens (documents, photos, videos)    │
│  2. Request oracle verification                            │
│  3. Once verified, composite token will be created         │
│                                                              │
│  Quick Actions:                                             │
│  [Upload Secondary Tokens] [View Token Details] [Close]    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Primary Token Details Page

```
WIREFRAME: Primary Token Details

┌─────────────────────────────────────────────────────────────┐
│ Primary Token: PT-001                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [< Back to Tokens]                                        │
│                                                              │
│  Status Badge: [ACTIVE - Green]                            │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Token ID:        PT-001                             │   │
│  │ Asset:           Manhattan Property (AID-001)       │   │
│  │ Owner:           Sarah Chen (KYC-2025-001234)       │   │
│  │ Token Value:     $5,000,000                         │   │
│  │ Created:         Nov 13, 2025, 2:45 PM             │   │
│  │ Status:          ACTIVE                             │   │
│  │ Merkle Path:     /root/token-001/leaf-0001         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Tabs: [Overview] [Merkle Proof] [History] [Actions]      │
│                                                              │
│  ┌─ Overview ────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │ Asset Information:                                  │ │
│  │ ┌──────────────────────────────────────────────┐   │ │
│  │ │ [Property Image Placeholder]                │   │ │
│  │ │                                              │   │ │
│  │ │ Manhattan Property                          │   │ │
│  │ │ Location: 1 E 42nd St, Manhattan, NY        │   │ │
│  │ │ Area: 5,000 sq ft                           │   │ │
│  │ │ Condition: Excellent                        │   │ │
│  │ │ Registered: Oct 15, 2025                    │   │ │
│  │ └──────────────────────────────────────────────┘   │ │
│  │                                                      │ │
│  │ Owner Information:                                  │ │
│  │ ┌──────────────────────────────────────────────┐   │ │
│  │ │ Owner: Sarah Chen                            │   │ │
│  │ │ KYC Status: ✓ VERIFIED                       │   │ │
│  │ │ KYC ID: KYC-2025-001234                      │   │ │
│  │ │ Verified: Oct 10, 2025                       │   │ │
│  │ └──────────────────────────────────────────────┘   │ │
│  │                                                      │ │
│  │ Ownership Proof:                                    │ │
│  │ ┌──────────────────────────────────────────────┐   │ │
│  │ │ Quantum Signature: [Collapse to show]        │   │ │
│  │ │ CRYSTALS-Dilithium: 3,309 bytes              │   │ │
│  │ │ Signed: 2025-11-13T14:45:00Z                │   │ │
│  │ └──────────────────────────────────────────────┘   │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                              │
│  Merkle Proof Tab:                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Merkle Tree Path (expandable):                       │  │
│  │ ┌──────────────────────────────────────────────────┐ │  │
│  │ │ Root: a7f3e9c2...                              │ │  │
│  │ │   ├─ Branch: 4d2b1c9f...                       │ │  │
│  │ │   │   ├─ Leaf (PT-001): 3e8d5f2a...           │ │  │
│  │ │   │   │   └─ Hash: SHA-256(token data)        │ │  │
│  │ │   │   └─ Sibling: 2c6b8d1e...                 │ │  │
│  │ │   └─ Branch: 9e7f4c3b...                       │ │  │
│  │ │       ├─ Leaf: 5a9c2d8f...                     │ │  │
│  │ │       └─ Leaf: 1f3c7e9d...                     │ │  │
│  │ └──────────────────────────────────────────────────┘ │  │
│  │                                                        │  │
│  │ [Verify Proof] [Download Proof] [Show Path Visualization]
│  │                                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [Upload Secondary Tokens] [Verify Token] [Share]          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Primary Token Search & List

```
WIREFRAME: Primary Token Search

┌─────────────────────────────────────────────────────────────┐
│ Primary Tokens                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Search by Token ID, Asset, Owner]  [Filter ▼] [Sort ▼]  │
│                                                              │
│  Showing 1-10 of 47 tokens                                  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Token ID  │ Asset           │ Owner      │ Value   │   │
│  ├───────────┼─────────────────┼────────────┼─────────┤   │
│  │ PT-001    │ Manhattan Prop  │ Sarah Chen │ $5.0M   │   │
│  │ ✓ ACTIVE  │ Location: NY    │ Ver: ✓     │         │   │
│  │           │                 │ KYC-001234 │         │   │
│  ├───────────┼─────────────────┼────────────┼─────────┤   │
│  │ PT-002    │ Carbon Credit   │ John Smith │ 1000T   │   │
│  │ ⏳ PENDING │ Offset Project  │ Ver: ✓     │         │   │
│  │           │                 │ KYC-001235 │         │   │
│  ├───────────┼─────────────────┼────────────┼─────────┤   │
│  │ PT-003    │ Commodity Batch │ Jane Doe   │ 500U    │   │
│  │ ✓ ACTIVE  │ Gold Ingots     │ Ver: ✓     │         │   │
│  │           │                 │ KYC-001236 │         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [< Previous]  [1] [2] [3] [4] [5]  [Next >]               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Module 2.2: Secondary Token UX/UI

### 4.1 Secondary Token Upload Flow

```
WIREFRAME: Secondary Token Upload

┌─────────────────────────────────────────────────────────────┐
│ Upload Supporting Documents                     [X]         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  For Primary Token: PT-001 (Manhattan Property)            │
│                                                              │
│  Document Type: [Dropdown ▼ "Select document type"]       │
│  ┌──────────────────────────────────┐                      │
│  │ ○ Tax Receipt / Invoice           │                      │
│  │ ○ Government Document / ID        │                      │
│  │ ○ Photo / Image Evidence          │                      │
│  │ ○ Video Recording                 │                      │
│  │ ○ 3rd Party Certification         │                      │
│  └──────────────────────────────────┘                      │
│                                                              │
│  File Upload (Drag & Drop):                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │  ▲ Drag files here or click to select              │   │
│  │  │                                                 │   │
│  │  Supported: PDF, DOCX, JPG, PNG, MP4              │   │
│  │  Max: 100 MB per file, 5 files at once             │   │
│  │                                                     │   │
│  │  [Click to Select Files]                           │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Files Selected:                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✓ property-tax-receipt-2025.pdf   (245 KB)         │ ✕  │
│  │ ✓ property-appraisal-2024.pdf     (1.2 MB)         │ ✕  │
│  │ ✓ property-photos.zip             (45 MB)          │ ✕  │
│  │                                                     │   │
│  │ Total: 3 files, 46.5 MB                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Cancel]                                  [Upload Files]   │
└─────────────────────────────────────────────────────────────┘

WIREFRAME: Upload Progress

┌─────────────────────────────────────────────────────────────┐
│ Uploading Files...                                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  property-tax-receipt-2025.pdf                              │
│  [████████████████████░░░░░░░░░░] 85% (210 KB / 245 KB)   │
│                                                              │
│  property-appraisal-2024.pdf                                │
│  [████████████████████████████░░] 95% (1.1 MB / 1.2 MB)   │
│                                                              │
│  property-photos.zip                                        │
│  [████░░░░░░░░░░░░░░░░░░░░░░░░░] 12% (5.4 MB / 45 MB)    │
│                                                              │
│  Overall: [████████████░░░░░░░░░░░░░░░░░░░░] 45%          │
│  Estimated time: 2 minutes remaining                       │
│                                                              │
│  [Cancel Upload]                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘

SUCCESS MODAL:

┌─────────────────────────────────────────────────────────────┐
│ Files Uploaded Successfully!                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ✓ (large checkmark, green)                                │
│                                                              │
│  3 secondary tokens created:                                │
│  • ST-001: Tax Receipt (PDF)                               │
│  • ST-002: Property Appraisal (PDF)                        │
│  • ST-003: Photo Evidence (ZIP)                            │
│                                                              │
│  Status: PENDING VERIFICATION                              │
│                                                              │
│  Next Steps:                                                │
│  A trusted oracle will verify these documents within 24hrs  │
│                                                              │
│  [View Secondary Tokens] [Continue] [Close]                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Secondary Token Management

```
WIREFRAME: Secondary Token List

┌─────────────────────────────────────────────────────────────┐
│ Secondary Tokens (PT-001: Manhattan Property)               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Filter ▼] [Sort ▼] [+ Upload More Documents]             │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Document Type  │ File           │ Status      │ ...  │   │
│  ├────────────────┼────────────────┼─────────────┼──────┤   │
│  │ Tax Receipt    │ property-tax...│ ✓ VERIFIED  │ [>]  │   │
│  │ ST-001         │ 245 KB, PDF    │ Oracle: Dr. P        │   │
│  │                │ Hash: 3e8d5f.. │ Nov 13, 3:20 PM    │   │
│  ├────────────────┼────────────────┼─────────────┼──────┤   │
│  │ Gov Document   │ property-ap... │ ✓ VERIFIED  │ [>]  │   │
│  │ ST-002         │ 1.2 MB, PDF    │ Oracle: Dr. P        │   │
│  │                │ Hash: 4f2c1e.. │ Nov 13, 3:20 PM    │   │
│  ├────────────────┼────────────────┼─────────────┼──────┤   │
│  │ Photo Evidence │ property-phot..│ ⏳ PENDING  │ [>]  │   │
│  │ ST-003         │ 45 MB, ZIP     │ Waiting for...       │   │
│  │                │ Hash: 5d9f7b.. │ oracle verification  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Overall Status: 2 verified, 1 pending                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘

WIREFRAME: Secondary Token Details

┌─────────────────────────────────────────────────────────────┐
│ Secondary Token: ST-001 (Tax Receipt)                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [< Back]                                                   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Document Type:      Tax Receipt / Invoice           │   │
│  │ Secondary Token ID: ST-001                          │   │
│  │ Primary Token:      PT-001                          │   │
│  │ File Name:          property-tax-receipt-2025.pdf   │   │
│  │ File Size:          245 KB                          │   │
│  │ MIME Type:          application/pdf                 │   │
│  │ Uploaded:           Nov 13, 2025, 2:50 PM           │   │
│  │ Status:             ✓ VERIFIED                      │   │
│  │ Document Hash:      3e8d5f2a1c4b7d9e...             │   │
│  │ Verification Method: Manual + Hash Validation       │   │
│  │ Verified By:        Dr. Alice Patel (Oracle)        │   │
│  │ Verified At:        Nov 13, 2025, 3:20 PM           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Verification Details:                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✓ Document Authenticity Verified                   │   │
│  │ ✓ Hash Match Confirmed (SHA-256)                   │   │
│  │ ✓ File Integrity Validated                         │   │
│  │ ✓ Oracle Signature Valid (CRYSTALS-Dilithium)     │   │
│  │                                                     │   │
│  │ Oracle Notes:                                       │   │
│  │ "Tax receipt is current and matches asset value."  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  File Preview:                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [PDF Preview - Tax Receipt Image]                  │   │
│  │                                                     │   │
│  │ Property Address: 1 E 42nd St, Manhattan, NY       │   │
│  │ Tax Year: 2025                                     │   │
│  │ Assessed Value: $5,000,000                         │   │
│  │ Tax Amount: $125,000                               │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Download Document] [View Verification Proof] [Share]     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Module 2.3: Composite Token Creation UX/UI

### 5.1 Composite Token Creation Wizard

```
WIREFRAME: Composite Token Summary (Pre-Creation)

┌─────────────────────────────────────────────────────────────┐
│ Create Composite Token                          [X]         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Create Digital Twin (Composite Token)                      │
│  ──────────────────────────────────────────────────────     │
│                                                              │
│  Status: Ready for Composite Creation                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✓ Primary Token Created: PT-001                     │   │
│  │ ✓ Secondary Tokens Verified: 3 documents           │   │
│  │ ✓ All components validated                          │   │
│  │ ○ Awaiting: Oracle final signature                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Composite Token Preview:                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Digital Twin: Manhattan Property (Complete)         │   │
│  │                                                     │   │
│  │ Components:                                         │   │
│  │ • Primary Token (PT-001)    ... asset ownership     │   │
│  │ • Secondary Tokens (3)      ... supporting evidence │   │
│  │ • Verification Status       ... all verified ✓      │   │
│  │                                                     │   │
│  │ Digital Twin Hash:                                  │   │
│  │ SHA-256 = a7f3e9c2d1b4f8e5c6a9d3f7e2b1c4f8...      │   │
│  │                                                     │   │
│  │ This hash is deterministic and unique to this       │   │
│  │ exact combination of assets and verification        │   │
│  │ outcome at this point in time.                      │   │
│  │                                                     │   │
│  │ Merkle Tree Root (4-level):                        │   │
│  │ [Primary] + [Secondary tokens] + [Binding proof]   │   │
│  │ = Root: 9e7f4c3b2d8f1a5c6e4b7d2f...                │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Cancel]                          [Create Composite Token] │
│                                                              │
└─────────────────────────────────────────────────────────────┘

WIREFRAME: Composite Token Created

┌─────────────────────────────────────────────────────────────┐
│ Composite Token Created!                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ✓ (large checkmark, green)                                │
│                                                              │
│  Composite Token ID: CT-001                                │
│  Status: CREATED (awaiting oracle verification)           │
│  Created: Nov 13, 2025, 3:45 PM UTC                       │
│                                                              │
│  Digital Twin Details:                                      │
│  ├─ Asset: Manhattan Property                              │
│  ├─ Primary Token: PT-001                                  │
│  ├─ Secondary Tokens: 3 verified documents                │
│  ├─ Digital Twin Hash: a7f3e9c2d1b4f8e5c6a9d3f7...       │
│  └─ Merkle Root: 9e7f4c3b2d8f1a5c6e4b7d2f...              │
│                                                              │
│  Next Steps:                                                │
│  The oracle will review and sign this composite token      │
│  within 24 hours. You'll receive a notification when       │
│  verification is complete.                                 │
│                                                              │
│  [View Composite Token] [View Status] [Close]              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Composite Token Details

```
WIREFRAME: Composite Token Details Page

┌─────────────────────────────────────────────────────────────┐
│ Composite Token: CT-001                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Status: ⏳ CREATED (waiting for oracle verification)      │
│  Created: Nov 13, 2025, 3:45 PM                            │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Digital Twin Summary                                │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ Asset: Manhattan Property                           │   │
│  │ Primary Token: PT-001                               │   │
│  │ Owner: Sarah Chen (KYC-001234)                      │   │
│  │ Token Value: $5,000,000                             │   │
│  │ Secondary Tokens: 3 (all verified)                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Tabs: [Overview] [Components] [Merkle] [Verification]    │
│                                                              │
│  ┌─ Overview ────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │ Digital Twin Information:                           │ │
│  │ ┌──────────────────────────────────────────────┐   │ │
│  │ │ Composite Token ID: CT-001                   │   │ │
│  │ │ Status: ⏳ CREATED                           │   │ │
│  │ │ Digital Twin Hash: a7f3e9c2d1b4f8e5...      │   │ │
│  │ │ Merkle Root: 9e7f4c3b2d8f1a5c6e4b7d2f...    │   │ │
│  │ │ Created: Nov 13, 2025, 3:45 PM               │   │ │
│  │ │ Awaiting: Oracle verification & signature    │   │ │
│  │ └──────────────────────────────────────────────┘   │ │
│  │                                                      │ │
│  │ Composition:                                        │ │
│  │ ┌──────────────────────────────────────────────┐   │ │
│  │ │ 1. Primary Token (PT-001)                    │   │ │
│  │ │    └─ Asset ownership proof, KYC verified    │   │ │
│  │ │                                              │   │ │
│  │ │ 2. Secondary Tokens (3)                      │   │ │
│  │ │    ├─ ST-001: Tax Receipt (✓ Verified)     │   │ │
│  │ │    ├─ ST-002: Property Appraisal (✓)       │   │ │
│  │ │    └─ ST-003: Photo Evidence (✓)           │   │ │
│  │ │                                              │   │ │
│  │ │ All components are verified and immutable   │   │ │
│  │ └──────────────────────────────────────────────┘   │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                              │
│  Components Tab (Expandable Tree View):                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ▼ Composite Token: CT-001 (Digital Twin)            │  │
│  │   ├─ ▼ Primary Token: PT-001                        │  │
│  │   │   ├─ Asset: Manhattan Property                  │  │
│  │   │   ├─ Owner: Sarah Chen (KYC-001234)            │  │
│  │   │   ├─ Value: $5,000,000                          │  │
│  │   │   └─ Hash: 3e8d5f2a1c4b7d9e...                 │  │
│  │   │                                                  │  │
│  │   ├─ ▼ Secondary Tokens (3)                         │  │
│  │   │   ├─ ▼ ST-001: Tax Receipt                      │  │
│  │   │   │   ├─ Type: Tax Receipt                      │  │
│  │   │   │   ├─ Status: ✓ VERIFIED                     │  │
│  │   │   │   ├─ Hash: 4f2c1e8d5b9a3f7c...             │  │
│  │   │   │   └─ Verified By: Dr. Alice Patel          │  │
│  │   │   │                                              │  │
│  │   │   ├─ ▼ ST-002: Property Appraisal              │  │
│  │   │   │   └─ [details...]                           │  │
│  │   │   │                                              │  │
│  │   │   └─ ▼ ST-003: Photo Evidence                   │  │
│  │   │       └─ [details...]                           │  │
│  │   │                                                  │  │
│  │   └─ Verification: Awaiting oracle signature        │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Merkle Proof Tab:                                          │
│  [Shows 4-level merkle tree with proofs and visualization]  │
│                                                              │
│  Verification Tab:                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ⏳ Awaiting Oracle Verification                      │  │
│  │                                                      │  │
│  │ Status: Composite token is in verification queue    │  │
│  │ Expected Time: Within 24 hours                      │  │
│  │                                                      │  │
│  │ When verified, oracle will:                         │  │
│  │ • Review all components                             │  │
│  │ • Validate merkle tree integrity                    │  │
│  │ • Sign with CRYSTALS-Dilithium quantum key         │  │
│  │ • Create immutable verification record              │  │
│  │                                                      │  │
│  │ [View Queue Position] [Notify Me]                   │  │
│  │                                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘

WIREFRAME: Composite Token Verified (After Oracle Signature)

┌─────────────────────────────────────────────────────────────┐
│ Composite Token: CT-001                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Status: ✓ VERIFIED (green badge)                          │
│  Verified: Nov 13, 2025, 5:30 PM                           │
│                                                              │
│  [Copy Composite Token ID]  [Share] [Download Proof]       │
│                                                              │
│  Verification Proof:                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✓ Oracle Verification Complete                      │   │
│  │ Verified By: Dr. Alice Patel (Trusted Oracle)      │   │
│  │ Verification Date: Nov 13, 2025, 5:30 PM           │   │
│  │                                                     │   │
│  │ Oracle Signature (CRYSTALS-Dilithium):             │   │
│  │ 9a3f2c1e8d7b4f6c5a9e2d3b1f7c4e9d...              │   │
│  │ (3,309 bytes, quantum-resistant)                   │   │
│  │                                                     │   │
│  │ Verification checks passed:                        │   │
│  │ ✓ Primary token valid                              │   │
│  │ ✓ All secondary tokens verified                    │   │
│  │ ✓ Digital twin hash matches                        │   │
│  │ ✓ Merkle tree integrity confirmed                  │   │
│  │ ✓ Oracle signature valid                           │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Next Step: Bind to ActiveContract                         │
│  This verified composite token can now be bound to an      │
│  ActiveContract for execution.                             │
│                                                              │
│  [Bind to Contract] [View Contract Options]                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Module 2.4: Contract Binding UX/UI

### 6.1 Contract Binding Flow

```
WIREFRAME: Select Contract to Bind

┌─────────────────────────────────────────────────────────────┐
│ Bind to ActiveContract                          [X]         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Composite Token: CT-001 (Verified ✓)                      │
│  Digital Twin: Manhattan Property                           │
│                                                              │
│  Select ActiveContract to Bind:                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Available Contracts (PENDING):                       │   │
│  │                                                     │   │
│  │ ○ AC-001: Property Sales Agreement                 │   │
│  │   Parties: Sarah Chen (Seller) vs. Michael Lee     │   │
│  │   Status: PENDING (awaiting digital asset)         │   │
│  │   Created: Nov 10, 2025                            │   │
│  │   Terms: $5,000,000 sale price                     │   │
│  │                                                     │   │
│  │ ○ AC-002: Lease Agreement                          │   │
│  │   Parties: Sarah Chen vs. Acme Corp                │   │
│  │   Status: PENDING                                  │   │
│  │   Created: Nov 8, 2025                             │   │
│  │   Terms: 5-year commercial lease                   │   │
│  │                                                     │   │
│  │ ○ AC-003: Mortgage Agreement                       │   │
│  │   Parties: Sarah Chen vs. City Bank                │   │
│  │   Status: PENDING                                  │   │
│  │   Created: Nov 5, 2025                             │   │
│  │   Terms: $3,000,000 loan @ 4.5% APR                │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Selected Contract Details:                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ AC-001: Property Sales Agreement                    │   │
│  │ Buyer: Michael Lee (KYC-001245)                    │   │
│  │ Seller: Sarah Chen (KYC-001234)                    │   │
│  │ Price: $5,000,000                                  │   │
│  │ Terms: Standard real estate sale terms             │   │
│  │ Binding Asset: This verified composite token       │   │
│  │             (CT-001: Manhattan Property)           │   │
│  │ Status: Ready for binding                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ⚠️  Important: Once bound, this composite token becomes    │
│      the definitive digital record for this contract.      │
│      All contract terms will reference this token.         │
│                                                              │
│  ☑ I confirm this binding is correct                       │
│                                                              │
│  [Cancel]                                  [Confirm Binding]│
│                                                              │
└─────────────────────────────────────────────────────────────┘

SUCCESS MODAL:

┌─────────────────────────────────────────────────────────────┐
│ Composite Token Bound Successfully!                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ✓ (large checkmark, green)                                │
│                                                              │
│  Composite Token: CT-001                                   │
│  Bound to Contract: AC-001                                 │
│  Binding Created: Nov 13, 2025, 6:45 PM                   │
│                                                              │
│  Digital Twin is now the official asset record for         │
│  this contract. All parties can verify the binding         │
│  at any time using the merkle proofs.                      │
│                                                              │
│  Binding Proof (Cryptographic):                            │
│  Hash: 7c4d2e9f8a1b5c3d6e2f9a4b...                        │
│  (Merkle proof linking all 4 registries)                   │
│                                                              │
│  Next Steps:                                                │
│  All contract parties can now:                              │
│  1. Review the bound composite token                       │
│  2. Verify the digital twin authenticity                   │
│  3. Proceed with contract execution                        │
│                                                              │
│  [View Contract] [Share Binding Proof] [Close]             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Composite ↔ Contract Link View

```
WIREFRAME: Contract with Bound Composite Token

┌─────────────────────────────────────────────────────────────┐
│ ActiveContract: AC-001                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Status: ✓ BOUND TO COMPOSITE TOKEN (green badge)         │
│  Bound: Nov 13, 2025, 6:45 PM                              │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Contract Details:                                   │   │
│  │ Contract ID: AC-001                                 │   │
│  │ Type: Property Sales Agreement                      │   │
│  │ Buyer: Michael Lee                                  │   │
│  │ Seller: Sarah Chen                                  │   │
│  │ Purchase Price: $5,000,000                          │   │
│  │ Status: BOUND TO DIGITAL ASSET                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Bound Digital Asset (Composite Token):                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Composite Token: CT-001 ✓ VERIFIED                  │   │
│  │ Digital Twin: Manhattan Property                    │   │
│  │ Asset: 1 E 42nd St, Manhattan, NY                  │   │
│  │ Primary Owner: Sarah Chen (KYC-001234)             │   │
│  │ Components:                                         │   │
│  │   • Primary Token (PT-001): ✓ Verified             │   │
│  │   • Secondary Tokens (3): ✓ All Verified           │   │
│  │     - Tax Receipt, Property Appraisal, Photos      │   │
│  │   • Oracle Signature: ✓ Valid (CRYSTALS-D)        │   │
│  │                                                     │   │
│  │ This composite token serves as the definitive      │   │
│  │ digital record for the property being transferred  │   │
│  │ under this contract.                               │   │
│  │                                                     │   │
│  │ [View Full Composite Token] [Verify Authenticity]  │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Binding Proof:                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Merkle Proof linking Contract Registry to:          │   │
│  │   ✓ Composite Token Registry (CT-001)              │   │
│  │   ✓ Token Registry (PT-001, ST-001-003)            │   │
│  │   ✓ Asset Registry (AID-001)                       │   │
│  │                                                     │   │
│  │ Any party can verify this binding is legitimate    │   │
│  │ by replaying the merkle proofs.                    │   │
│  │                                                     │   │
│  │ Binding Hash: 7c4d2e9f8a1b5c3d6e2f9a4b...          │   │
│  │ [View Merkle Proofs] [Export Proof] [Share]        │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Tabs: [Overview] [Terms] [Parties] [Execution] [History]  │
│                                                              │
│  [Execute Contract] [Archive] [More Actions ▼]             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Module 2.5: Merkle Registry UX/UI

### 7.1 Registry Explorer

```
WIREFRAME: Registry Explorer Dashboard

┌─────────────────────────────────────────────────────────────┐
│ Registry Explorer - Merkle Tree Verification                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Search by ID] [Filter ▼] [Sort ▼] [Export]               │
│                                                              │
│  Registry Status:                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Asset Registry          │ 847 assets, Root: a3f2... │   │
│  │ Token Registry          │ 2,143 tokens, Root: d7e1..│   │
│  │ Composite Registry      │ 156 composites, Root: 2f4│   │
│  │ Contract Registry       │ 1,024 contracts, Root:9a │   │
│  │                                                     │   │
│  │ All Registries Synchronized: ✓ YES                │   │
│  │ Last Verification: Nov 13, 2025, 2:30 PM           │   │
│  │ Consistency Status: ✓ HEALTHY                       │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Tree View (Expandable):                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ▼ Asset Registry Root                              │   │
│  │   ├─ ▼ Real Estate Assets (450)                    │   │
│  │   │   ├─ Manhattan Properties (23)                 │   │
│  │   │   │   ├─ AID-001: 1 E 42nd St ...             │   │
│  │   │   │   ├─ AID-002: Park Ave Residence ...      │   │
│  │   │   │   └─ AID-003: Brooklyn Townhouse ...      │   │
│  │   │   └─ California Properties (78)                │   │
│  │   ├─ ▼ Carbon Credits (180)                        │   │
│  │   │   ├─ Renewable Energy (95)                     │   │
│  │   │   └─ Reforestation (85)                        │   │
│  │   └─ ▼ Commodities (217)                           │   │
│  │       └─ [more...]                                 │   │
│  │                                                     │   │
│  │ ▼ Token Registry Root                              │   │
│  │   ├─ ▼ Primary Tokens (847)                        │   │
│  │   │   └─ [Linked to Assets above]                  │   │
│  │   └─ ▼ Secondary Tokens (1,296)                    │   │
│  │       ├─ Verified: 1,189 ✓                         │   │
│  │       ├─ Pending: 107 ⏳                           │   │
│  │       └─ Rejected: 0                               │   │
│  │                                                     │   │
│  │ ▼ Composite Registry Root                          │   │
│  │   ├─ ▼ Verified Composites (152) ✓                │   │
│  │   │   ├─ CT-001: Manhattan Property ...            │   │
│  │   │   ├─ CT-002: Carbon Credit Bundle ...          │   │
│  │   │   └─ [more...]                                 │   │
│  │   └─ ▼ Pending Composites (4) ⏳                   │   │
│  │       └─ [Awaiting oracle verification]           │   │
│  │                                                     │   │
│  │ ▼ Contract Registry Root                           │   │
│  │   ├─ ▼ Bound Contracts (986)                       │   │
│  │   │   ├─ Active: 512                               │   │
│  │   │   ├─ Executing: 387                            │   │
│  │   │   └─ Completed: 87                             │   │
│  │   └─ ▼ Pending Contracts (38)                      │   │
│  │       └─ [Awaiting composite binding]              │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Actions:                                                    │
│  [Verify Proof] [Generate Report] [Download Merkle] [Refresh]
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Merkle Proof Verification

```
WIREFRAME: Merkle Proof Verifier

┌─────────────────────────────────────────────────────────────┐
│ Merkle Proof Verifier                                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Verify Digital Twin Authenticity                           │
│  ───────────────────────────────────────────────────────    │
│                                                              │
│  Enter Composite Token ID or Upload Proof:                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Composite Token ID: [CT-001]                        │   │
│  │ OR                                                  │   │
│  │ Upload Merkle Proof File: [Choose File]             │   │
│  │                                                     │   │
│  │ [Verify Proof]                                      │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Verification Results:                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✓ VALID - Composite Token Verified                 │   │
│  │                                                     │   │
│  │ Digital Twin: CT-001 (Manhattan Property)           │   │
│  │ Status: ✓ VERIFIED by Oracle                        │   │
│  │ Verified: Nov 13, 2025, 5:30 PM                    │   │
│  │                                                     │   │
│  │ Component Verification:                             │   │
│  │ ✓ Primary Token (PT-001) exists in Token Registry   │   │
│  │ ✓ Secondary Tokens (3) verified in Token Registry   │   │
│  │ ✓ Digital Twin Hash matches component hash          │   │
│  │ ✓ Merkle Root valid in Composite Registry          │   │
│  │ ✓ Oracle Signature valid (CRYSTALS-Dilithium)      │   │
│  │ ✓ Binding Proof valid (Contract Registry)          │   │
│  │                                                     │   │
│  │ Merkle Proof Path (Visualized):                     │   │
│  │                                                     │   │
│  │    ROOT: a7f3e9c2d1b4f8e5...                       │   │
│  │    /    \                                           │   │
│  │  Branch   Branch                                    │   │
│  │   /        \                                        │   │
│  │ Leaf (CT)  Sibling   (CT-001 is valid leaf)        │   │
│  │ ✓ OK      ✓ OK                                     │   │
│  │                                                     │   │
│  │ Verification Method: Independent Replay             │   │
│  │ This proof was verified WITHOUT relying on any     │   │
│  │ central authority - cryptography provides          │   │
│  │ certainty of authenticity.                         │   │
│  │                                                     │   │
│  │ [View Full Proof] [Download Verification] [Share]  │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Module 2.6: Portal Integration UX/UI

### 8.1 Main Navigation

```
WIREFRAME: Portal Sidebar with Composite Token Module

┌──────────────────────────────────────────────────────────────┐
│ Aurigraph Portal v4.6.0 + Composite Tokens                  │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Sidebar:                                                      │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ ≡ MENU                              [User] [Logout]   │   │
│ │                                                        │   │
│ │ Dashboard                                   [Home]    │   │
│ │                                                        │   │
│ │ ▼ Asset Management (Module 1.1)                       │   │
│ │   ├─ Asset Registry                                   │   │
│ │   ├─ Create New Asset                                 │   │
│ │   └─ My Assets                                        │   │
│ │                                                        │   │
│ │ ▼ RWA Tokens (Module 1.4)                            │   │
│ │   ├─ Token Portfolio                                  │   │
│ │   ├─ Create Token                                     │   │
│ │   └─ Transfer Token                                   │   │
│ │                                                        │   │
│ │ ▼ Ricardian Contracts (Module 1.2)                   │   │
│ │   ├─ My Contracts                                     │   │
│ │   ├─ Upload Contract                                  │   │
│ │   └─ Signatures                                       │   │
│ │                                                        │   │
│ │ ▼ Active Contracts (Module 1.3)                       │   │
│ │   ├─ Contracts                                        │   │
│ │   ├─ Deploy Contract                                  │   │
│ │   └─ Execution Status                                 │   │
│ │                                                        │   │
│ │ ▼ Digital Twins (NEW - Module 2)      [NEW]          │   │
│ │   ├─ Primary Tokens                                   │   │
│ │   ├─ Secondary Documents                              │   │
│ │   ├─ Composite Tokens                                 │   │
│ │   ├─ Contract Binding                                 │   │
│ │   ├─ Registry Explorer                                │   │
│ │   └─ Oracle Dashboard                                 │   │
│ │                                                        │   │
│ │ Administration                                         │   │
│ │   ├─ Users & Roles                                    │   │
│ │   ├─ Audit Log                                        │   │
│ │   └─ System Status                                    │   │
│ │                                                        │   │
│ └────────────────────────────────────────────────────────┘   │
│                                                               │
└──────────────────────────────────────────────────────────────┘

CONTENT AREA (Example: Composite Tokens Dashboard):

┌──────────────────────────────────────────────────────────────┐
│ Composite Tokens Dashboard                                   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ Welcome back, Sarah! Here's your digital twin portfolio:     │
│                                                               │
│ ┌─────────────────┬─────────────────┬─────────────────┐     │
│ │ Created:     156 │ Verified:     144 │ Bound:       134 │   │
│ │ Digital Twins    │ Ready for Binding  │ In Contracts    │   │
│ └─────────────────┴─────────────────┴─────────────────┘     │
│                                                               │
│ Quick Actions:                                                │
│ [Create Primary Token] [Upload Documents] [View Composites]  │
│ [Bind to Contract] [Verify Authenticity] [Registry Status]   │
│                                                               │
│ My Recent Composite Tokens:                                   │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ ID    │ Asset          │ Status      │ Verified    │ ...  │ │
│ ├───────┼────────────────┼─────────────┼─────────────┼──────┤ │
│ │ CT-001│ Manhattan Prop │ ✓ VERIFIED  │ Dr. P, Nov 13 │   │ │
│ │       │ $5,000,000     │ Bound to AC │ [View]          │   │ │
│ ├───────┼────────────────┼─────────────┼─────────────┼──────┤ │
│ │ CT-002│ Carbon Credits │ ✓ VERIFIED  │ Dr. P, Nov 12│   │ │
│ │       │ 1,000 tons     │ Bound to AC │ [View]          │   │ │
│ ├───────┼────────────────┼─────────────┼─────────────┼──────┤ │
│ │ CT-003│ Commodity Batch│ ⏳ PENDING  │ Awaiting ...  │   │ │
│ │       │ 500 units      │ Created     │ [View]          │   │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. End-to-End User Workflows

### 9.1 Complete Asset-to-Execution Workflow

```
WORKFLOW 1: Asset Owner Creates Digital Twin & Executes Contract

Day 1 (Monday):
  Sarah logs in → Dashboard shows "Create Primary Token"
  ├─ Clicks [Create Primary Token]
  ├─ Selects Asset: Manhattan Property
  ├─ Confirms Owner: Sarah Chen (KYC verified)
  ├─ System Creates: PT-001
  └─ Status: PT-001 CREATED, awaiting secondary tokens

Day 2 (Tuesday):
  Sarah logs in → Notification: "Upload supporting documents for PT-001"
  ├─ Clicks [Upload Secondary Documents]
  ├─ Selects Document Type: Tax Receipt
  ├─ Drags file: property-tax-receipt-2025.pdf
  ├─ System creates: ST-001
  ├─ Repeats for photos and appraisal
  ├─ Uploads 3 more files
  └─ Status: 4 secondary tokens created, status PENDING_VERIFICATION

Day 3 (Wednesday):
  Oracle (Dr. Patel) logs in → Dashboard: "4 tokens in verification queue"
  ├─ Clicks [Review Queue]
  ├─ Views PT-001 and ST-001-003
  ├─ Verifies each document:
  │  ├─ Checks authenticity
  │  ├─ Validates hashes
  │  └─ Confirms accuracy
  ├─ All documents verified ✓
  └─ Oracle queues for composite creation

Day 4 (Thursday):
  System (automated) → All secondary tokens verified
  ├─ Creates composite token: CT-001
  ├─ Computes digital twin hash
  ├─ Builds 4-level merkle tree
  ├─ Status: CT-001 CREATED, awaiting oracle signature
  └─ Notification sent to Dr. Patel

Day 4 (Thursday, afternoon):
  Dr. Patel → Dashboard: "1 composite token in verification"
  ├─ Clicks [Review CT-001]
  ├─ Verifies:
  │  ├─ Primary token valid ✓
  │  ├─ All secondary tokens present ✓
  │  ├─ Digital twin hash matches ✓
  │  ├─ Merkle tree integrity confirmed ✓
  ├─ Signs with CRYSTALS-Dilithium key
  ├─ Status: CT-001 VERIFIED with oracle signature
  └─ Notification sent to Sarah

Day 5 (Friday):
  James (Contract Admin) → Dashboard: "Awaiting binding"
  ├─ Clicks [Bind CT-001 to Contract]
  ├─ Selects ActiveContract: AC-001 (Property Sales)
  ├─ Reviews binding details
  ├─ Confirms binding
  ├─ System creates binding proof
  ├─ Status: CT-001 BOUND TO AC-001
  └─ Notifications to all contract parties

Day 6-10 (Following week):
  Contract Parties → Execute terms
  ├─ Buyer reviews composite token
  ├─ Seller confirms digital twin accuracy
  ├─ Payment processed
  ├─ Asset transfer initiated
  ├─ Settlement recorded
  └─ Contract Status: EXECUTED

Ongoing:
  Any party → Can verify digital twin at any time
  ├─ Access Registry Explorer
  ├─ Enter CT-001 ID
  ├─ System verifies merkle proofs
  ├─ Confirms oracle signature
  └─ Result: "Digital Twin VERIFIED - No tampering detected"

RESULT:
  ✓ Physical asset fully represented by immutable digital twin
  ✓ Complete audit trail of all verifications
  ✓ External parties can verify independently (no central authority needed)
  ✓ Contract execution permanently recorded
```

### 9.2 Oracle Verification Workflow

```
WORKFLOW 2: Trusted Oracle Verification Process

Morning (9:00 AM):
  Dr. Patel (Oracle) logs in
  ├─ Dashboard shows: "5 documents waiting for verification"
  ├─ Verification Queue:
  │  ├─ PT-001 + ST-001: Tax Receipt (Property A)
  │  ├─ PT-002 + ST-002: Property Appraisal (Property A)
  │  ├─ PT-003 + ST-003: Photos (Property A)
  │  ├─ PT-004 + ST-004: Gov ID (Property B)
  │  └─ PT-005 + ST-005: Composite Ready (Property C)
  └─ [Review Queue]

Process (10:00 AM - 12:30 PM):
  For each token:
    1. View primary token details
    2. Review secondary document
    3. Verify document authenticity
    4. Check SHA-256 hash matches
    5. Confirm asset value alignment
    6. Validate KYC owner information
    7. Sign verification (CRYSTALS-Dilithium)
    8. Submit with notes
    9. Move to next

  Results:
    ✓ PT-001 + ST-001: VERIFIED (Tax receipt authentic)
    ✓ PT-002 + ST-002: VERIFIED (Appraisal accurate)
    ✓ PT-003 + ST-003: VERIFIED (Photos match asset)
    ✓ PT-004 + ST-004: VERIFIED (Gov ID valid)
    ✓ PT-005: Ready for composite (all components verified)

Afternoon (2:00 PM):
  System → Automatically creates composite tokens
  ├─ CT-001 created for PT-001
  ├─ CT-002 created for PT-002
  ├─ CT-003 created for PT-003
  ├─ CT-004 created for PT-004
  └─ CT-005: Already created, awaiting signature

Composite Verification (3:00 PM):
  Dr. Patel → Dashboard: "4 new composites + 1 waiting"

  For each composite:
    1. View all components (primary + all secondary)
    2. Verify digital twin hash matches
    3. Validate merkle tree structure
    4. Confirm all secondary tokens verified ✓
    5. Check no discrepancies
    6. Sign composite (CRYSTALS-Dilithium)
    7. Submit for binding

  Results:
    ✓ CT-001: VERIFIED + SIGNED
    ✓ CT-002: VERIFIED + SIGNED
    ✓ CT-003: VERIFIED + SIGNED
    ✓ CT-004: VERIFIED + SIGNED
    ✓ CT-005: VERIFIED + SIGNED

End of Day:
  Dashboard Summary:
    • 5 documents verified and signed ✓
    • 5 composites verified and signed ✓
    • All signatures recorded in oracle_verifications table ✓
    • All signatures added to immutable audit trail ✓
    • Asset owners notified ✓

  Dr. Patel's Compliance Report (auto-generated):
    Date: Nov 13, 2025
    Verifications: 5
    All Passed: ✓ YES
    False Positives: 0
    Rejections: 0
    Average Time per Verification: 18 minutes
    Oracle Signature Success Rate: 100%
```

---

## 10. Accessibility & Performance Requirements

### 10.1 Accessibility (WCAG 2.1 AA)

```
Color Contrast:
  ✓ Text vs Background: Minimum 4.5:1 ratio (AA)
  ✓ Large Text: Minimum 3:1 ratio
  ✓ Interactive Elements: Clearly distinguishable
  ✓ Color Not Only Indicator: Icons + text for status

Keyboard Navigation:
  ✓ All functionality keyboard accessible
  ✓ Tab order logical and intuitive
  ✓ Focus indicators visible and prominent
  ✓ No keyboard traps
  ✓ Shortcuts documented

Screen Reader Support:
  ✓ Semantic HTML (heading, nav, main, article)
  ✓ ARIA labels for icons and buttons
  ✓ Form labels associated with inputs
  ✓ Alt text for all images (merkle tree diagrams)
  ✓ Table headers marked correctly

Motion & Animations:
  ✓ Prefers-reduced-motion respected
  ✓ No auto-playing animations > 5 seconds
  ✓ Animations can be paused

Mobile Responsiveness:
  ✓ Viewport meta tag: width=device-width, initial-scale=1
  ✓ Responsive design breakpoints: 320px, 768px, 1024px, 1440px
  ✓ Touch targets: minimum 48x48px
  ✓ No horizontal scrolling required
```

### 10.2 Performance Targets

```
Load Time:
  ✓ Page Load Time: < 3 seconds (First Contentful Paint)
  ✓ Time to Interactive: < 5 seconds
  ✓ Largest Contentful Paint: < 2.5 seconds

Interaction Performance:
  ✓ Button Click Response: < 100ms
  ✓ Form Submit: < 2 seconds
  ✓ Modal Open: < 500ms
  ✓ Tab Switch: < 300ms

API Response Times:
  ✓ Primary token creation: < 2 seconds
  ✓ Secondary token upload: < 5 seconds per file
  ✓ Composite creation: < 5 seconds
  ✓ Oracle verification: < 10 seconds
  ✓ Contract binding: < 3 seconds
  ✓ Registry queries: < 1 second
  ✓ Merkle proof verification: < 1 second

Bundle Sizes:
  ✓ Main JS: < 300 KB (gzipped)
  ✓ CSS: < 50 KB (gzipped)
  ✓ Per module: < 100 KB (gzipped)
  ✓ Images/Assets: Lazy loaded, optimized

SEO & Web Vitals:
  ✓ Core Web Vitals: All Green
  ✓ Lighthouse Score: > 90
  ✓ Mobile Friendly: 100%
```

---

## Implementation Checkpoints

### Unit 1: Module 2.1 (Primary Token)
- [ ] Form components built and tested
- [ ] Primary Token Creation wizard implemented
- [ ] API integration complete
- [ ] Merkle tree visualization working
- [ ] Unit tests: 60+ tests, 80%+ coverage
- [ ] Accessibility audit passed
- [ ] Performance targets met

### Unit 2: Module 2.2 (Secondary Token)
- [ ] Document upload component working
- [ ] File storage integration (S3) complete
- [ ] Oracle verification workflow implemented
- [ ] Secondary Token List display complete
- [ ] Unit tests: 75+ tests, 80%+ coverage

### Unit 3: Module 2.3 (Composite Creation)
- [ ] Composite creation wizard complete
- [ ] Digital twin hash computation verified
- [ ] Merkle tree building tested
- [ ] Oracle verification UI working
- [ ] Unit tests: 95+ tests, 80%+ coverage

### Unit 4: Module 2.4 (Contract Binding)
- [ ] Contract selection interface working
- [ ] Binding confirmation flow complete
- [ ] Binding proof generation verified
- [ ] Contract-composite link view implemented
- [ ] Unit tests: 90+ tests, 80%+ coverage

### Unit 5: Module 2.5 (Merkle Registry)
- [ ] Registry explorer dashboard working
- [ ] Tree view visualization complete
- [ ] Merkle proof verifier implemented
- [ ] Consistency checking working
- [ ] Unit tests: 90+ tests, 80%+ coverage

### Unit 6: Module 2.6 (Portal Integration)
- [ ] Sidebar navigation updated
- [ ] Main dashboard implemented
- [ ] Asset tracking visualization working
- [ ] Oracle management interface complete
- [ ] Unit tests: 75+ tests, 80%+ coverage

---

## Sign-Off Requirements

**Before Deployment to Staging**:
- ✓ All UX/UI components implemented per wireframes
- ✓ All user workflows tested end-to-end
- ✓ Accessibility audit passed (WCAG 2.1 AA)
- ✓ Performance targets achieved
- ✓ 80%+ code coverage across all modules
- ✓ 0 critical issues identified in QA
- ✓ Security audit completed
- ✓ Oracle integration tested with real oracles

---

**Document Status**: ✅ COMPLETE & READY FOR IMPLEMENTATION
**Version**: 1.0
**Last Updated**: November 13, 2025
