# J4C Agents with Git Worktrees - Parallel Execution Plan

**Project**: RWA Features Portal v4.6.0
**Execution Model**: Multi-Agent Parallel Development
**Coordination**: Git Worktrees + MCP Agents
**Date**: November 13, 2025
**Status**: 🚀 READY FOR DEPLOYMENT

---

## Executive Summary

This document describes the parallel execution strategy using J4C agents (Just-for-Claude agents) with git worktrees. Five specialized agents will work concurrently on different feature modules, coordinating through git and merging changes systematically.

---

## Part 1: Agent Architecture

### 1.1 Agent Roles & Assignments

```
┌─────────────────────────────────────────────────────────────┐
│          J4C Agent Parallel Execution Teams                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ Agent 1: Asset Registry Agent                               │
│ ├─ Modules: 1.1 (Asset Registry Management)                │
│ ├─ Worktree: feature/1.1-asset-registry                    │
│ ├─ Focus: Dashboard, Upload, Visualization                │
│ └─ Duration: 4 weeks (Weeks 1-4)                          │
│                                                               │
│ Agent 2: Ricardian Contracts Agent                          │
│ ├─ Modules: 1.2 (Ricardian Contract Workflow)             │
│ ├─ Worktree: feature/1.2-ricardian-contracts              │
│ ├─ Focus: Upload, Parties, Signatures, Activation         │
│ └─ Duration: 5 weeks (Weeks 1-5)                          │
│                                                               │
│ Agent 3: ActiveContracts Agent                              │
│ ├─ Modules: 1.3 (ActiveContract Deployment)               │
│ ├─ Worktree: feature/1.3-active-contracts                 │
│ ├─ Focus: Wizard, Execution, State Inspector              │
│ └─ Duration: 5 weeks (Weeks 1-5)                          │
│                                                               │
│ Agent 4: Token Management Agent                             │
│ ├─ Modules: 1.4 (Token Management)                        │
│ ├─ Worktree: feature/1.4-token-management                 │
│ ├─ Focus: Portfolio, Creation, Transfer                   │
│ └─ Duration: 3 weeks (Weeks 1-3)                          │
│                                                               │
│ Agent 5: Portal Integration Agent                           │
│ ├─ Modules: 1.5 (Portal Integration & Navigation)         │
│ ├─ Worktree: feature/1.5-portal-integration               │
│ ├─ Focus: Navigation, Dashboard, Layout                   │
│ └─ Duration: 2 weeks (Weeks 2-3, then integration)        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Agent Specializations

| Agent | Primary Skills | Deliverables |
|-------|---|---|
| **Asset Registry** | Data visualization, D3.js, Tables | Dashboard, Tree viz, Filter UI |
| **Ricardian Contracts** | Form workflows, Document handling | Upload form, Party UI, Signatures |
| **ActiveContracts** | Wizards, Code editors, State mgmt | Deployment wizard, Execution UI |
| **Token Management** | Charts, Portfolio mgmt, Transfers | Portfolio dashboard, Trade UI |
| **Portal Integration** | Routing, Navigation, Layout | Sidebar, Dashboard, Auth flows |

---

## Part 2: Git Worktree Strategy

### 2.1 Repository Structure

```
Aurigraph-DLT/ (main branch)
├── main (production branch - stable)
├── develop (integration branch - active development)
├── feature/1.1-asset-registry (worktree 1)
├── feature/1.2-ricardian-contracts (worktree 2)
├── feature/1.3-active-contracts (worktree 3)
├── feature/1.4-token-management (worktree 4)
└── feature/1.5-portal-integration (worktree 5)
```

### 2.2 Worktree Management Commands

```bash
# Create all worktrees from develop branch
git worktree add --track -b feature/1.1-asset-registry \
  worktrees/agent-1.1 origin/develop

git worktree add --track -b feature/1.2-ricardian-contracts \
  worktrees/agent-1.2 origin/develop

git worktree add --track -b feature/1.3-active-contracts \
  worktrees/agent-1.3 origin/develop

git worktree add --track -b feature/1.4-token-management \
  worktrees/agent-1.4 origin/develop

git worktree add --track -b feature/1.5-portal-integration \
  worktrees/agent-1.5 origin/develop

# List all worktrees
git worktree list

# Clean up worktree after agent completes
git worktree remove worktrees/agent-1.1
```

### 2.3 Directory Layout

```
Aurigraph-DLT/
├── .git/                              # Main git repo
├── enterprise-portal/                 # Main working tree
│   └── enterprise-portal/
│       └── frontend/
│           ├── src/
│           │   ├── components/        # Shared components
│           │   ├── pages/             # Pages
│           │   ├── hooks/             # Custom hooks
│           │   └── utils/             # Utilities
│           └── package.json
│
├── worktrees/
│   ├── agent-1.1/                     # Asset Registry worktree
│   │   └── enterprise-portal/         # Isolated copy
│   │       └── frontend/
│   │           └── src/components/1.1-asset-registry/
│   │
│   ├── agent-1.2/                     # Ricardian Contracts worktree
│   │   └── enterprise-portal/frontend/src/components/1.2-ricardian-contracts/
│   │
│   ├── agent-1.3/                     # ActiveContracts worktree
│   │   └── enterprise-portal/frontend/src/components/1.3-active-contracts/
│   │
│   ├── agent-1.4/                     # Token Management worktree
│   │   └── enterprise-portal/frontend/src/components/1.4-token-management/
│   │
│   └── agent-1.5/                     # Portal Integration worktree
│       └── enterprise-portal/frontend/src/
│           ├── pages/                 # Integration
│           ├── layout/                # Navigation
│           └── hooks/                 # Auth integration
│
└── docs/
    └── parallel-execution/            # Coordination docs
        ├── agent-1.1-tasks.md
        ├── agent-1.2-tasks.md
        ├── integration-plan.md
        └── merge-strategy.md
```

---

## Part 3: Agent Task Assignments

### 3.1 Agent 1: Asset Registry Agent

**Branch**: `feature/1.1-asset-registry`
**Duration**: Weeks 1-4
**Effort**: 165 hours
**Path**: `worktrees/agent-1.1/enterprise-portal/frontend/src/components/1.1-asset-registry/`

**Deliverables**:

```
src/components/1.1-asset-registry/
├── AssetRegistryDashboard.tsx        # Main dashboard component
│   ├── SummaryCards.tsx              # Stats cards
│   ├── AssetTable.tsx                # Asset list table
│   ├── FilterBar.tsx                 # Search & filters
│   └── ActionButtons.tsx             # CRUD buttons
│
├── AssetUploadForm.tsx               # Upload form component
│   ├── FileUpload.tsx                # File upload handler
│   ├── MetadataForm.tsx              # Asset metadata input
│   ├── ValidationRules.tsx           # Form validation
│   └── ProgressBar.tsx               # Upload progress
│
├── MerkleTreeVisualization.tsx        # Tree visualization
│   ├── TreeRenderer.tsx              # D3.js tree rendering
│   ├── NodeDetail.tsx                # Selected node panel
│   ├── ZoomControls.tsx              # Pan/zoom controls
│   └── LegendPanel.tsx               # Legend & labels
│
├── AssetDetailsPage.tsx              # Asset detail view
│   ├── MetadataSection.tsx           # Asset info
│   ├── VerificationStatus.tsx        # Verification panel
│   ├── DocumentPreview.tsx           # Document viewer
│   ├── RelatedTokens.tsx             # Token links
│   └── RelatedContracts.tsx          # Contract links
│
├── hooks/
│   ├── useAssetRegistry.ts           # Hook for asset CRUD
│   ├── useMerkleTree.ts              # Hook for tree operations
│   ├── useAssetVerification.ts       # Hook for verification
│   └── useAssetFiltering.ts          # Hook for filtering
│
├── services/
│   ├── assetAPI.ts                   # API calls
│   ├── merkleTreeService.ts          # Tree operations
│   └── verificationService.ts        # Verification logic
│
├── types/
│   ├── asset.ts                      # Asset interfaces
│   ├── merkleTree.ts                 # Tree type definitions
│   └── verification.ts               # Verification types
│
├── __tests__/
│   ├── AssetRegistryDashboard.test.tsx
│   ├── AssetUploadForm.test.tsx
│   ├── MerkleTreeVisualization.test.tsx
│   └── assetAPI.test.ts
│
└── README.md                         # Component documentation
```

**Key Tasks**:

1. **Sprint 1 (Week 1)**: Asset Upload & Validation
   - [ ] Build AssetUploadForm component
   - [ ] Implement file upload handler
   - [ ] Add form validation
   - [ ] Create assetAPI.ts service
   - [ ] Write unit tests
   - **PR Target**: `develop`

2. **Sprint 2 (Week 2)**: Registry Dashboard
   - [ ] Build AssetRegistryDashboard component
   - [ ] Implement asset table with pagination
   - [ ] Add search & filter UI
   - [ ] Connect to API
   - [ ] Integration tests
   - **PR Target**: `develop`

3. **Sprint 3 (Week 3)**: Merkle Tree Visualization
   - [ ] Build MerkleTreeVisualization component
   - [ ] Integrate D3.js
   - [ ] Implement zoom/pan controls
   - [ ] Add node detail panel
   - [ ] Performance optimization
   - **PR Target**: `develop`

4. **Sprint 4 (Week 4)**: Asset Details & Integration
   - [ ] Build AssetDetailsPage component
   - [ ] Implement verification status display
   - [ ] Add document preview
   - [ ] Link to tokens/contracts
   - [ ] E2E tests
   - **PR Target**: `develop`

**API Endpoints Required**:
- `POST /api/v11/rwa/assets/register`
- `GET /api/v11/rwa/assets` (paginated)
- `GET /api/v11/rwa/assets/summary`
- `GET /api/v11/rwa/assets/{id}`
- `GET /api/v11/rwa/assets/{id}/merkle-tree`
- `GET /api/v11/rwa/assets/{id}/verification-status`
- `GET /api/v11/rwa/assets/{id}/tokens`
- `GET /api/v11/rwa/assets/{id}/contracts`

---

### 3.2 Agent 2: Ricardian Contracts Agent

**Branch**: `feature/1.2-ricardian-contracts`
**Duration**: Weeks 1-5
**Effort**: 235 hours
**Path**: `worktrees/agent-1.2/enterprise-portal/frontend/src/components/1.2-ricardian-contracts/`

**Deliverables**:

```
src/components/1.2-ricardian-contracts/
├── ContractUploadForm.tsx            # Document upload
│   ├── FileInput.tsx
│   ├── ContractTypeSelector.tsx
│   ├── JurisdictionSelector.tsx
│   └── ProgressIndicator.tsx
│
├── PartyManagementUI.tsx             # Party management
│   ├── PartyList.tsx
│   ├── AddPartyModal.tsx
│   ├── EditPartyForm.tsx
│   └── KYCStatusBadge.tsx
│
├── SignatureCollectionUI.tsx         # Signature workflow
│   ├── SignatureRequestList.tsx
│   ├── SignaturePage.tsx
│   ├── SignatureCanvas.tsx           # Visual signature capture
│   ├── PrivateKeyImport.tsx
│   └── SignatureVerification.tsx
│
├── ContractActivationUI.tsx          # Activation workflow
│   ├── ActivationChecklist.tsx
│   ├── ConfirmationDialog.tsx
│   └── ActivationButton.tsx
│
├── AuditTrailViewer.tsx              # Audit trail
│   ├── TimelineView.tsx
│   ├── ActivityEntryDetail.tsx
│   ├── FilterPanel.tsx
│   └── ExportButton.tsx
│
├── ComplianceReportGenerator.tsx      # Compliance reports
│   ├── ReportForm.tsx
│   ├── ReportPreview.tsx
│   ├── ExportOptions.tsx
│   └── ReportStatus.tsx
│
├── hooks/
│   ├── useContractUpload.ts
│   ├── usePartyManagement.ts
│   ├── useSignatureCollection.ts
│   ├── useContractActivation.ts
│   ├── useAuditTrail.ts
│   └── useCryptoSigning.ts
│
├── services/
│   ├── contractAPI.ts
│   ├── signatureService.ts           # CRYSTALS-Dilithium signing
│   ├── auditService.ts
│   ├── complianceService.ts
│   └── cryptoKeyManager.ts
│
├── types/
│   ├── contract.ts
│   ├── party.ts
│   ├── signature.ts
│   └── compliance.ts
│
├── __tests__/
│   ├── ContractUploadForm.test.tsx
│   ├── PartyManagementUI.test.tsx
│   ├── SignatureCollectionUI.test.tsx
│   ├── ContractActivationUI.test.tsx
│   ├── AuditTrailViewer.test.tsx
│   └── signatureService.test.ts
│
└── README.md
```

**Key Tasks**:

1. **Sprint 1 (Week 1)**: Contract Upload
   - [ ] Build ContractUploadForm
   - [ ] File upload handler
   - [ ] Contract type/jurisdiction validation
   - [ ] API integration
   - [ ] Unit tests
   - **PR Target**: `develop`

2. **Sprint 2 (Week 2)**: Party Management
   - [ ] Build PartyManagementUI
   - [ ] Party list with CRUD
   - [ ] Add party modal
   - [ ] KYC status display
   - [ ] Integration tests
   - **PR Target**: `develop`

3. **Sprint 3 (Week 3)**: Signature Collection
   - [ ] Build SignatureCollectionUI
   - [ ] Private key management
   - [ ] CRYSTALS-Dilithium signing
   - [ ] Signature verification
   - [ ] Signature progress tracking
   - **PR Target**: `develop`

4. **Sprint 4 (Week 4)**: Activation & Audit
   - [ ] Build ContractActivationUI
   - [ ] Activation checklist
   - [ ] Build AuditTrailViewer
   - [ ] Timeline rendering
   - [ ] E2E tests
   - **PR Target**: `develop`

5. **Sprint 5 (Week 5)**: Compliance Reporting
   - [ ] Build ComplianceReportGenerator
   - [ ] GDPR/SOC2/FDA report templates
   - [ ] Export functionality
   - [ ] Final integration tests
   - **PR Target**: `develop`

**API Endpoints Required**:
- `POST /api/v11/contracts/ricardian/upload`
- `GET /api/v11/contracts/ricardian`
- `GET /api/v11/contracts/ricardian/{id}`
- `POST /api/v11/contracts/ricardian/{id}/parties`
- `POST /api/v11/contracts/ricardian/{id}/sign`
- `POST /api/v11/contracts/ricardian/{id}/activate`
- `GET /api/v11/contracts/ricardian/{id}/audit`
- `GET /api/v11/contracts/ricardian/{id}/compliance/{framework}`

---

### 3.3 Agent 3: ActiveContracts Agent

**Branch**: `feature/1.3-active-contracts`
**Duration**: Weeks 1-5
**Effort**: 200 hours
**Path**: `worktrees/agent-1.3/enterprise-portal/frontend/src/components/1.3-active-contracts/`

**Deliverables**:

```
src/components/1.3-active-contracts/
├── ContractDeploymentWizard.tsx      # 5-step wizard
│   ├── Step1ContractInfo.tsx         # Contract metadata
│   ├── Step2CodeInput.tsx            # Code editor
│   ├── Step3Configuration.tsx        # Gas, timeouts
│   ├── Step4LinkContract.tsx         # Link Ricardian
│   ├── Step5Review.tsx               # Review & deploy
│   ├── Stepper.tsx                   # Progress indicator
│   └── WizardNav.tsx                 # Navigation
│
├── CodeEditor.tsx                    # Monaco code editor
│   ├── EditorConfig.ts               # Language configs
│   ├── SyntaxHighlighting.ts        # Language-specific
│   ├── CodeTemplates.ts              # Template library
│   └── CodeValidation.ts             # Validation logic
│
├── ContractExecutionUI.tsx           # Execution interface
│   ├── MethodSelector.tsx            # Method dropdown
│   ├── ParameterForm.tsx             # Dynamic parameters
│   ├── GasFeeEstimate.tsx
│   ├── ExecutionButton.tsx
│   ├── ResultViewer.tsx              # Output display
│   └── ExecutionHistoryList.tsx
│
├── ContractStateInspector.tsx        # State inspector
│   ├── StateVariablesTable.tsx
│   ├── StateVariableDetail.tsx
│   ├── StateHistory.tsx              # Timeline
│   ├── UpdateStateForm.tsx
│   └── StateSnapshot.tsx
│
├── ContractDetailView.tsx            # Main detail page
│   ├── ContractInfo.tsx
│   ├── SourceCode.tsx
│   ├── ExecutionHistoryPanel.tsx
│   └── ActionMenu.tsx
│
├── hooks/
│   ├── useContractDeployment.ts
│   ├── useCodeEditor.ts
│   ├── useContractExecution.ts
│   ├── useContractState.ts
│   └── useGasEstimation.ts
│
├── services/
│   ├── contractAPI.ts
│   ├── codeCompiler.ts               # Code compilation
│   ├── gasEstimator.ts
│   ├── stateManager.ts
│   └── executionTracker.ts
│
├── types/
│   ├── contract.ts
│   ├── execution.ts
│   └── state.ts
│
├── __tests__/
│   ├── ContractDeploymentWizard.test.tsx
│   ├── CodeEditor.test.tsx
│   ├── ContractExecutionUI.test.tsx
│   ├── ContractStateInspector.test.tsx
│   └── codeCompiler.test.ts
│
└── README.md
```

**Key Tasks**:

1. **Sprint 1 (Week 1)**: Deployment Wizard (Steps 1-2)
   - [ ] Build ContractDeploymentWizard
   - [ ] Implement Step1 (metadata)
   - [ ] Build CodeEditor with Monaco
   - [ ] Language support (Solidity, Java, JS, Python, WASM)
   - [ ] Unit tests
   - **PR Target**: `develop`

2. **Sprint 2 (Week 2)**: Deployment Wizard (Steps 3-5)
   - [ ] Implement Step3 (configuration)
   - [ ] Implement Step4 (link contract)
   - [ ] Implement Step5 (review)
   - [ ] API integration
   - [ ] Stepper navigation
   - **PR Target**: `develop`

3. **Sprint 3 (Week 3)**: Contract Execution
   - [ ] Build ContractExecutionUI
   - [ ] Method selector
   - [ ] Dynamic parameter forms
   - [ ] Gas fee estimation
   - [ ] Result display
   - **PR Target**: `develop`

4. **Sprint 4 (Week 4)**: State Inspector
   - [ ] Build ContractStateInspector
   - [ ] State variables table
   - [ ] State history timeline
   - [ ] Update state functionality
   - [ ] Integration tests
   - **PR Target**: `develop`

5. **Sprint 5 (Week 5)**: Contract Details & Integration
   - [ ] Build ContractDetailView
   - [ ] Source code viewer
   - [ ] Full execution history
   - [ ] Integration with asset registry
   - [ ] E2E tests
   - **PR Target**: `develop`

**API Endpoints Required**:
- `POST /api/v11/activecontracts/deploy`
- `GET /api/v11/activecontracts`
- `GET /api/v11/activecontracts/{id}`
- `POST /api/v11/activecontracts/{id}/execute`
- `GET /api/v11/activecontracts/{id}/executions`
- `GET /api/v11/activecontracts/{id}/state`
- `PUT /api/v11/activecontracts/{id}/state`

---

### 3.4 Agent 4: Token Management Agent

**Branch**: `feature/1.4-token-management`
**Duration**: Weeks 1-3
**Effort**: 130 hours
**Path**: `worktrees/agent-1.4/enterprise-portal/frontend/src/components/1.4-token-management/`

**Deliverables**:

```
src/components/1.4-token-management/
├── TokenPortfolioDashboard.tsx       # Portfolio overview
│   ├── PortfolioSummary.tsx         # Stats cards
│   ├── ValueChart.tsx               # 7-day value chart
│   ├── DistributionChart.tsx        # Pie chart
│   ├── HoldingsTable.tsx            # Token holdings
│   ├── RecentTransactions.tsx       # Transaction list
│   └── FilterBar.tsx                # Filters
│
├── TokenCreationForm.tsx             # Create token
│   ├── TokenMetadata.tsx            # Name, symbol, decimals
│   ├── AssetLinkSelector.tsx        # Link to RWA asset
│   ├── DistributionSettings.tsx     # Supply & distribution
│   ├── PreviewCard.tsx              # Token preview
│   └── ConfirmationDialog.tsx
│
├── TokenTransferUI.tsx              # Transfer tokens
│   ├── RecipientInput.tsx           # Recipient address
│   ├── AmountInput.tsx              # Transfer amount
│   ├── FeeCalculator.tsx            # Fee display
│   ├── TransactionPreview.tsx       # Preview
│   └── ConfirmationDialog.tsx
│
├── TokenDetailsPage.tsx             # Token detail view
│   ├── TokenInfo.tsx                # Metadata
│   ├── HoldersList.tsx              # Top holders
│   ├── TransactionHistory.tsx       # Transaction log
│   ├── PriceHistory.tsx             # Price chart
│   └── ActionMenu.tsx               # CRUD actions
│
├── hooks/
│   ├── useTokenPortfolio.ts
│   ├── useTokenCreation.ts
│   ├── useTokenTransfer.ts
│   ├── usePriceHistory.ts
│   └── useTokenMetrics.ts
│
├── services/
│   ├── tokenAPI.ts
│   ├── portfolioService.ts
│   ├── priceService.ts
│   └── transactionService.ts
│
├── types/
│   ├── token.ts
│   ├── portfolio.ts
│   └── transaction.ts
│
├── __tests__/
│   ├── TokenPortfolioDashboard.test.tsx
│   ├── TokenCreationForm.test.tsx
│   ├── TokenTransferUI.test.tsx
│   └── portfolioService.test.ts
│
└── README.md
```

**Key Tasks**:

1. **Sprint 1 (Week 1)**: Portfolio Dashboard
   - [ ] Build TokenPortfolioDashboard
   - [ ] Summary cards with stats
   - [ ] Value chart (Recharts)
   - [ ] Distribution pie chart
   - [ ] Holdings table
   - [ ] Unit tests
   - **PR Target**: `develop`

2. **Sprint 2 (Week 2)**: Token Creation & Transfer
   - [ ] Build TokenCreationForm
   - [ ] Build TokenTransferUI
   - [ ] Asset linking
   - [ ] Fee calculator
   - [ ] API integration
   - [ ] Integration tests
   - **PR Target**: `develop`

3. **Sprint 3 (Week 3)**: Token Details & Analytics
   - [ ] Build TokenDetailsPage
   - [ ] Price history chart
   - [ ] Holder list
   - [ ] Transaction history
   - [ ] E2E tests
   - **PR Target**: `develop`

**API Endpoints Required**:
- `GET /api/v11/rwa/tokens` (user's tokens)
- `POST /api/v11/rwa/tokens/create`
- `GET /api/v11/rwa/tokens/{id}`
- `GET /api/v11/rwa/tokens/{id}/balance`
- `GET /api/v11/rwa/tokens/{id}/price-history`
- `GET /api/v11/rwa/tokens/{id}/transactions`
- `POST /api/v11/rwa/tokens/{id}/transfer`

---

### 3.5 Agent 5: Portal Integration Agent

**Branch**: `feature/1.5-portal-integration`
**Duration**: Weeks 2-3 (starts after other agents complete foundation)
**Effort**: 75 hours
**Path**: `worktrees/agent-1.5/enterprise-portal/frontend/src/`

**Deliverables**:

```
src/
├── layout/
│   ├── MainLayout.tsx               # Main layout wrapper
│   ├── Sidebar.tsx                  # Left navigation
│   ├── TopBar.tsx                   # Header/top bar
│   ├── UserProfile.tsx              # User menu
│   ├── NotificationBell.tsx         # Notifications
│   └── Footer.tsx                   # Footer
│
├── pages/
│   ├── HomePage.tsx                 # Main dashboard
│   ├── AssetRegistryPage.tsx        # Asset routes
│   ├── RicardianContractsPage.tsx   # Contract routes
│   ├── ActiveContractsPage.tsx      # Smart contract routes
│   ├── TokenManagementPage.tsx      # Token routes
│   ├── AnalyticsPage.tsx            # Analytics dashboard
│   ├── SettingsPage.tsx             # User settings
│   └── NotFoundPage.tsx             # 404
│
├── components/
│   ├── Navigation/
│   │   ├── Breadcrumb.tsx           # Breadcrumb nav
│   │   ├── SidebarMenu.tsx          # Sidebar items
│   │   └── QuickSearch.tsx          # Global search
│   │
│   ├── Dashboard/
│   │   ├── FeatureCard.tsx          # Feature cards
│   │   ├── QuickStats.tsx           # Stats summary
│   │   ├── ActivityFeed.tsx         # Recent activity
│   │   ├── GettingStarted.tsx       # Onboarding
│   │   └── NotificationPanel.tsx    # Notifications
│   │
│   └── Common/
│       ├── Header.tsx
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── ConfirmDialog.tsx
│
├── hooks/
│   ├── useAuth.ts                   # Auth state
│   ├── useNavigation.ts             # Route navigation
│   ├── useNotifications.ts          # Notification mgmt
│   ├── useGlobalSearch.ts           # Global search
│   └── useTheme.ts                  # Theme switching
│
├── services/
│   ├── authService.ts               # Authentication
│   ├── navigationService.ts
│   ├── searchService.ts
│   └── notificationService.ts
│
├── context/
│   ├── AuthContext.ts               # Auth context
│   ├── ThemeContext.ts              # Theme context
│   └── NotificationContext.ts       # Notification context
│
├── types/
│   ├── auth.ts
│   ├── user.ts
│   └── navigation.ts
│
├── App.tsx                          # Main app component
├── index.tsx                        # Entry point
└── routing.ts                       # Route configuration
```

**Key Tasks**:

1. **Sprint 1 (Week 2)**: Navigation & Layout
   - [ ] Build MainLayout
   - [ ] Build Sidebar with menu
   - [ ] Build TopBar with user profile
   - [ ] Implement routing (React Router v6)
   - [ ] Add Breadcrumb component
   - [ ] Unit tests
   - **PR Target**: `develop`

2. **Sprint 2 (Week 3)**: Dashboard & Integration
   - [ ] Build HomePage dashboard
   - [ ] Feature cards for all modules
   - [ ] Quick stats section
   - [ ] Activity feed
   - [ ] Global search
   - [ ] Integration tests
   - **PR Target**: `develop`

3. **Integration Phase (Week 4)**: Final Integration
   - [ ] Merge all feature branches
   - [ ] Test cross-module navigation
   - [ ] Fix integration issues
   - [ ] Style consistency
   - [ ] E2E tests
   - **PR Target**: `develop`

---

## Part 4: Coordination & Synchronization

### 4.1 Daily Standup Structure

```
Time: 9:00 AM UTC Daily
Duration: 15 minutes
Format: Async (Slack messages) + Optional sync call

Each Agent Reports:
├─ Completed yesterday
├─ Working on today
├─ Blockers/dependencies
└─ ETA for next PR

Example:
─────────────────────────────────
Agent 1.1 (Asset Registry):
✅ Completed: AssetUploadForm component + tests
🔄 Working on: AssetRegistryDashboard layout
🚧 Blocker: Waiting for API pagination spec
📅 Next PR: Tomorrow (AssetTable component)
─────────────────────────────────
```

### 4.2 Dependency Management

**Critical Dependencies**:

```
1.1 Asset Registry
├─ No upstream dependencies
└─ Blocks: 1.1.3 (Merkle tree viz requires asset data)

1.2 Ricardian Contracts
├─ No upstream dependencies
└─ Blocks: 1.5 (Portal nav requires contract routes)

1.3 ActiveContracts
├─ Dependency on 1.2 (Link Ricardian contracts in wizard)
└─ Blocks: 1.5 (Portal nav requires contract routes)

1.4 Token Management
├─ Dependency on 1.1 (Assets link to tokens)
└─ Blocks: 1.5 (Portal nav requires token routes)

1.5 Portal Integration
├─ Dependency on all (1.1, 1.2, 1.3, 1.4)
└─ Integrates everything
```

### 4.3 Git Workflow

```
Main Workflow:
─────────────────────────────────

develop (integration branch)
    ↑
    ├─ ← Pull Request from feature/1.1-asset-registry (Week 1)
    ├─ ← Pull Request from feature/1.2-ricardian-contracts (Week 1)
    ├─ ← Pull Request from feature/1.3-active-contracts (Week 1)
    ├─ ← Pull Request from feature/1.4-token-management (Week 1)
    ├─ ← Pull Request from feature/1.5-portal-integration (Week 3)
    │
    └─ → main (production branch - after QA approval)

Each PR:
├─ Title: [AGENT] Module Name - Sprint Description
├─ Description: Task list + testing done + screenshots
├─ CI/CD: Automated tests required
├─ Review: Lead approves
└─ Merge: Squash commit to develop
```

### 4.4 Merge Strategy

**Weekly Integration Cadence**:

```
Week 1:
───────
Mon-Fri: All agents commit to their feature branches
Fri EOD: Each agent creates PR to develop
        └─ PR requirements:
           • All tests passing
           • Code review from lead
           • No conflicts with develop
Fri EOD: Lead reviews and merges all PRs
        └─ Squash merge: keep develop history clean

Week 2-4:
────────
Same weekly cycle
Additional: Integration testing between modules

Week 5:
──────
Final integration
QA sign-off
Merge develop → main for v4.6.0 release
```

### 4.5 Conflict Resolution

**When conflicts occur**:

```
1. Agent detects merge conflict
2. Report in standup + Slack
3. Lead determines priority:
   ├─ If independent: Agent rebases feature branch
   ├─ If dependent: Pair programming session (30 min)
   └─ If blocking: Stop-the-line protocol
4. Resolve in feature branch
5. Re-test locally
6. Create/update PR
```

---

## Part 5: Testing Strategy

### 5.1 Testing Pyramid

```
Each Agent Responsible For:

Level 1: Unit Tests (80% coverage minimum)
├─ Component tests (React Testing Library)
├─ Hook tests (testing-library/react-hooks)
├─ Service tests (Jest)
└─ Type tests (TypeScript type checking)

Level 2: Integration Tests (60% coverage minimum)
├─ Component + API integration
├─ Hook + Service integration
├─ Form submission flows
└─ Error handling

Level 3: E2E Tests (Critical paths only)
├─ Happy path workflows
├─ Error recovery
├─ Cross-component navigation
```

### 5.2 Test Execution Before PR

```bash
# Before creating PR, run:
npm run test:unit              # Unit tests
npm run test:integration       # Integration tests
npm run lint                   # ESLint
npm run typecheck             # TypeScript checking
npm run build                 # Production build
npm run test:coverage         # Coverage report

# Minimum requirements:
├─ Coverage: 80%+
├─ Lint errors: 0
├─ Type errors: 0
├─ Build size: <100KB per module
└─ Tests passing: 100%

# If all pass: Ready for PR
```

---

## Part 6: Deployment Pipeline

### 6.1 Staging Deployment

```
Trigger: PR merged to develop

1. Build Portal (from develop)
   └─ npm run build:staging

2. Run E2E tests (against staging backend)
   └─ npm run test:e2e:staging

3. Deploy to staging environment
   └─ dlt-staging.aurigraph.io

4. Smoke tests
   └─ Critical user flows

5. Performance tests
   └─ Lighthouse score >90

6. Manual QA (24 hours)
   └─ Cross-browser testing
   └─ Responsive design check
   └─ Security review
```

### 6.2 Production Deployment

```
Trigger: Approval to merge develop → main

1. Create release branch
   └─ git checkout -b release/v4.6.0

2. Version bump
   └─ package.json: 4.5.0 → 4.6.0

3. Update CHANGELOG

4. Final E2E tests (against production backend)
   └─ npm run test:e2e:prod

5. Build production bundle
   └─ npm run build:prod

6. Deploy to production
   └─ dlt.aurigraph.io

7. Rollback plan ready
   └─ Can revert to v4.5.0 if critical issues

8. Monitor for 48 hours
   └─ Error rates
   └─ Performance metrics
   └─ User feedback
```

---

## Part 7: Success Metrics & KPIs

### 7.1 Development Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Code Coverage | 80%+ | `npm run test:coverage` |
| Build Size | <500KB | `npm run build -- --analyze` |
| Page Load Time | <2s | Lighthouse |
| Time to Interactive | <3s | Lighthouse |
| API Response Time | <500ms | Network tab |
| Zero Critical Bugs | 100% | Bug tracker |

### 7.2 Process Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| PR Review Time | <24h | GitHub timestamps |
| Merge Conflict Rate | <5% | Git history |
| Test Pass Rate | 99%+ | CI/CD logs |
| Deployment Success | 100% | Deployment logs |
| Agent Adherence | 100% | Task completion |

### 7.3 Quality Gates

**Before PR can be merged**:
- ✅ All tests passing
- ✅ 80%+ code coverage
- ✅ Code review approved
- ✅ No merge conflicts
- ✅ No console errors/warnings
- ✅ Accessibility score > 90

**Before release to production**:
- ✅ All feature PRs merged to develop
- ✅ Integration tests passing
- ✅ E2E tests passing
- ✅ QA sign-off
- ✅ Performance benchmarks met
- ✅ Security review passed
- ✅ Documentation updated

---

## Part 8: Risk Mitigation

### 8.1 Potential Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| API delays | Medium | High | Mock API responses early |
| Merge conflicts | Medium | Medium | Frequent rebases, clear code ownership |
| Scope creep | Low | High | Strict sprint planning, change control |
| Team skill gaps | Low | Medium | Pair programming, documentation |
| Performance regression | Medium | High | Performance tests in every PR |

### 8.2 Contingency Plans

```
If Agent Falls Behind:
└─ Lead assists with critical path items
└─ Redistribute non-critical tasks to other agents
└─ Extend timeline by 1 week if necessary

If Critical Bug Found in Develop:
└─ Hotfix branch from develop
└─ Fix + test in hotfix branch
└─ Merge hotfix to develop + all feature branches
└─ Continue regular workflow

If Deployment Fails:
└─ Immediate rollback to v4.5.0
└─ Post-mortem analysis
└─ Fix in develop
└─ Retry deployment next day
```

---

## Part 9: Execution Checklist

### Pre-Launch (Day 1)

- [ ] Clone repository locally
- [ ] Create 5 git worktrees (one per agent)
- [ ] Set up each agent's development environment
- [ ] Share worktree paths with each agent
- [ ] Confirm npm dependencies installed
- [ ] Verify Node version (18+)
- [ ] Set up git hooks (pre-commit, pre-push)
- [ ] Schedule daily standups
- [ ] Create tracking issue in GitHub

### Week 1 Launch

- [ ] Agent 1.1 starts AssetRegistryDashboard
- [ ] Agent 1.2 starts ContractUploadForm
- [ ] Agent 1.3 starts DeploymentWizard
- [ ] Agent 1.4 starts PortfolioDashboard
- [ ] Agent 5 prepares layout components
- [ ] Daily standups begin
- [ ] Weekly sync meeting (Thu)

### Weekly Review (Every Friday)

- [ ] All agents create PRs
- [ ] Code reviews completed
- [ ] Merge to develop
- [ ] Integration tests pass
- [ ] Update timeline if needed
- [ ] Plan next week's sprint

### Final Integration (Week 4)

- [ ] Merge all feature branches to develop
- [ ] Comprehensive E2E testing
- [ ] Performance optimization
- [ ] Bug fixes & refinements
- [ ] QA approval
- [ ] Merge develop → main (v4.6.0)

---

## Part 10: Git Worktree Commands Reference

```bash
# ============================================
# SETUP (Run once on Day 1)
# ============================================

cd /path/to/Aurigraph-DLT

# Create all 5 worktrees
git worktree add --track -b feature/1.1-asset-registry \
  worktrees/agent-1.1 origin/develop

git worktree add --track -b feature/1.2-ricardian-contracts \
  worktrees/agent-1.2 origin/develop

git worktree add --track -b feature/1.3-active-contracts \
  worktrees/agent-1.3 origin/develop

git worktree add --track -b feature/1.4-token-management \
  worktrees/agent-1.4 origin/develop

git worktree add --track -b feature/1.5-portal-integration \
  worktrees/agent-1.5 origin/develop

# Verify all worktrees created
git worktree list

# ============================================
# AGENT WORKFLOW (Each agent runs these)
# ============================================

# Agent 1.1 example:
cd worktrees/agent-1.1

# Make changes
git add enterprise-portal/frontend/src/components/1.1-asset-registry/
git commit -m "feat(1.1): Implement AssetRegistryDashboard

- Add asset list table with pagination
- Implement search and filter UI
- Add summary statistics cards

Closes #ISSUE_NUMBER"

# Keep in sync with develop
git fetch origin
git rebase origin/develop

# Push to feature branch
git push origin feature/1.1-asset-registry

# ============================================
# LEAD WORKFLOW (Integration & Merging)
# ============================================

# Review all PRs
gh pr list --state open

# Approve and merge PR
gh pr merge 123 --squash --delete-branch

# Pull merged changes back to main working tree
cd /path/to/Aurigraph-DLT
git pull origin develop

# Update all worktrees with latest develop
for worktree in worktrees/agent-*; do
  (cd $worktree && git fetch origin && git rebase origin/develop)
done

# ============================================
# CLEANUP (After agent completes)
# ============================================

# Remove worktree after merge
git worktree remove worktrees/agent-1.1

# Delete remote branch
git push origin --delete feature/1.1-asset-registry
```

---

## Summary

This J4C parallel execution plan enables:

✅ **5 agents working independently** on different modules simultaneously
✅ **Git worktrees** for isolated development without interference
✅ **Weekly integration cadence** ensuring smooth merges
✅ **Clear dependency management** preventing blocking issues
✅ **Comprehensive testing** at each stage
✅ **Documented workflows** for reproducibility
✅ **Quality gates** ensuring production readiness

**Expected Outcome**: Portal v4.6.0 delivery in 14 weeks with 5 FTE + Lead oversight

**Start Date**: November 13, 2025
**Target Release**: December 24, 2025 (v4.6.0)

---

**Document Status**: ✅ READY FOR EXECUTION
**Requires**: Approval to proceed with agent launch

