# Aurigraph V11 Mobile Nodes Architecture
## Cross-Platform Mobile Application for Android & iOS

**Date:** October 26, 2025
**Status:** Design Phase - Ready for Implementation
**Target Platforms:** iOS 13+, Android 10+
**Framework:** React Native or Flutter (TBD)
**Deployment:** App Store, Google Play Store

---

## Executive Summary

Mobile nodes extend Aurigraph V11 blockchain access to mobile devices, enabling users to manage fractional token holdings, participate in distributions, and interact with governance on-the-go.

### Key Capabilities
- **Fractional Token Wallet:** Hold, view, and transfer fractional ownership
- **Distribution Management:** Real-time yield notifications and claims
- **Merkle Proof Verification:** On-device verification of asset proofs
- **Governance Participation:** Vote on contract proposals and policy changes
- **Portfolio Analytics:** Real-time performance metrics and rebalancing alerts
- **Offline Support:** Full functionality with periodic sync

---

## Architecture Overview

### 1. Application Stack

#### Cross-Platform Framework Selection
**Recommended: React Native** (leveraging web team's expertise)
- Shared JavaScript codebase for iOS and Android
- Native performance for crypto operations via JSI (JavaScript Interface)
- Existing React knowledge from Enterprise Portal team
- Rich ecosystem for blockchain integrations

**Alternative: Flutter** (if native performance critical)
- Better performance for complex animations
- Stronger type safety
- Learning curve for existing team

#### Technology Stack
```
Frontend Layer:
├── React Native 0.72+
├── React Navigation 6.x (navigation)
├── Redux Toolkit (state management)
├── TypeScript (strict mode)
├── TailwindCSS (styling)
└── Expo (development/publishing)

Backend Integration:
├── Axios (HTTP client)
├── Socket.io (WebSocket real-time)
├── JWT (authentication)
└── OAuth 2.0 (secure login)

Cryptography:
├── react-native-crypto (WebAssembly crypto)
├── TweetNaCl.js (Ed25519 signatures)
├── libsodium.js (encrypted storage)
└── @noble/curves (quantum-resistant prep)

Storage:
├── SQLite (local database via expo-sqlite)
├── React Native AsyncStorage (key-value)
├── Encrypted SharedPreferences (secrets)
└── MMKV (fast KV store)

Push Notifications:
├── Firebase Cloud Messaging (FCM)
├── APNs (Apple Push Notification)
└── Expo Push Notifications (abstraction)
```

---

## 2. Core Modules

### 2.1 Mobile Wallet Module

#### Overview
Manages user's fractional token holdings across multiple pools and assets.

#### Key Components
```
WalletModule/
├── HoldingsScreen.tsx (320 LOC)
│   ├─ Portfolio overview card
│   ├─ Pool holdings list
│   ├─ Search and filter
│   ├─ Sort by value/recent
│   └─ Pull-to-refresh
│
├── PoolDetailScreen.tsx (280 LOC)
│   ├─ Pool composition display
│   ├─ Asset breakdown
│   ├─ Historical value chart
│   ├─ Holder statistics
│   └─ Transaction history
│
├── TransferFractionsScreen.tsx (250 LOC)
│   ├─ Recipient address input
│   ├─ QR code scanner
│   ├─ Amount selection
│   ├─ Gas estimation
│   ├─ Review and confirm
│   └─ Transaction signing
│
├── models/
│   ├─ Wallet.ts (model definitions)
│   ├─ Holding.ts
│   └─ Transaction.ts
│
└── services/
    ├─ WalletService.ts (holdings management)
    ├─ TransactionService.ts (signing & broadcast)
    └─ PriceService.ts (real-time pricing)
```

#### Features
- **Portfolio Dashboard:** Total value, 24h change, holdings breakdown
- **Pool Details:** Composition, weighting strategy, performance metrics
- **Transfer UI:** Send fractional tokens with address validation
- **QR Code Scanning:** Recipient address via camera
- **Transaction History:** Full ledger of transfers and distributions
- **Watch List:** Track additional pools without holding

#### State Management
```typescript
// Redux store structure
{
  wallet: {
    address: string,
    holdings: Record<tokenId, Holding>,
    totalValue: BigDecimal,
    lastUpdated: Timestamp,
  },
  transactions: {
    pending: Transaction[],
    history: Transaction[],
    filters: TransactionFilter,
  },
  prices: {
    cache: Record<tokenId, Price>,
    lastUpdate: Timestamp,
  }
}
```

---

### 2.2 Distribution Management Module

#### Overview
Tracks yield distributions, notifies users, and enables quick claims.

#### Key Components
```
DistributionModule/
├── YieldDashboard.tsx (300 LOC)
│   ├─ Next distribution countdown
│   ├─ Pending yield amount
│   ├─ Historical distribution chart
│   ├─ Distribution schedule
│   └─ Auto-claim toggle
│
├── DistributionDetailsScreen.tsx (220 LOC)
│   ├─ Distribution breakdown by pool
│   ├─ Holder tiers display
│   ├─ Claim button
│   ├─ Transaction confirmation
│   └─ Proof of claim
│
├── NotificationCenter.tsx (180 LOC)
│   ├─ Distribution notifications
│   ├─ Governance alerts
│   ├─ Rebalancing notifications
│   ├─ Price alerts
│   └─ Notification history
│
├── models/
│   ├─ Distribution.ts
│   ├─ Yield.ts
│   └─ Notification.ts
│
└── services/
    ├─ DistributionService.ts (claims & ledger)
    ├─ NotificationService.ts (push notifications)
    └─ YieldCalculator.ts (real-time yield calc)
```

#### Features
- **Yield Dashboard:** Next distribution date, pending amount, tier status
- **Distribution History:** All historical distributions with amounts
- **One-Tap Claim:** Claim pending yield in single transaction
- **Push Notifications:** Real-time alerts for distributions
- **Auto-Claim Configuration:** Automatic claiming when enabled
- **Tax Reporting:** Export distribution history for tax purposes

#### Push Notification Structure
```json
{
  "type": "DISTRIBUTION",
  "poolId": "pool-123",
  "amount": "1500.50",
  "timestamp": "2025-10-26T14:30:00Z",
  "action": "claim",
  "deepLink": "aurigraph://distribution/claim/pool-123"
}
```

---

### 2.3 Merkle Proof Verification Module

#### Overview
On-device verification of asset composition Merkle proofs.

#### Key Components
```
MerkleVerificationModule/
├── ProofVerificationScreen.tsx (200 LOC)
│   ├─ QR code scanner for proof
│   ├─ Verification status display
│   ├─ Asset breakdown verification
│   ├─ Proof validity timeline
│   └─ Custody validation
│
├── ProofDetailScreen.tsx (150 LOC)
│   ├─ Merkle root display
│   ├─ Asset list with hashes
│   ├─ Verification path visualization
│   ├─ Timestamp validation
│   └─ Third-party verification status
│
├── models/
│   ├─ MerkleProof.ts
│   ├─ AssetComposition.ts
│   └─ VerificationResult.ts
│
└── services/
    ├─ MerkleVerificationService.ts (proof validation)
    ├─ CryptoService.ts (SHA3-256 hashing)
    └─ CustodyValidator.ts (custody verification)
```

#### Features
- **QR Code Scanning:** Scan proof QR from pool documentation
- **On-Device Verification:** Full SHA3-256 Merkle proof validation
- **Asset Breakdown:** Display all assets included in proof
- **Custody Verification:** Confirm custody provider information
- **Validity Timeline:** Show proof generation date and expiration
- **Share Verification:** Generate shareable verification certificate

#### Merkle Proof Data Format (QR Encoded)
```json
{
  "type": "MERKLE_PROOF",
  "poolId": "pool-123",
  "merkleRoot": "0x...",
  "assets": [
    {"assetId": "asset-1", "hash": "0x..."},
    {"assetId": "asset-2", "hash": "0x..."}
  ],
  "timestamp": "2025-10-26T10:00:00Z",
  "custody": "Custody Provider A",
  "proof": "0x..."
}
```

---

### 2.4 Governance Module

#### Overview
Mobile participation in smart contract governance and voting.

#### Key Components
```
GovernanceModule/
├── ProposalsScreen.tsx (280 LOC)
│   ├─ Active proposals list
│   ├─ Proposal status (voting, passed, rejected)
│   ├─ Voting power display
│   ├─ Time remaining countdown
│   └─ Vote casting
│
├── ProposalDetailScreen.tsx (240 LOC)
│   ├─ Proposal description
│   ├─ Parameters and changes
│   ├─ Vote breakdown pie chart
│   ├─ Your vote status
│   ├─ Vote delegation option
│   └─ Historical proposal archive
│
├── models/
│   ├─ Proposal.ts
│   ├─ Vote.ts
│   └─ Delegation.ts
│
└── services/
    ├─ GovernanceService.ts (proposal fetching)
    ├─ VotingService.ts (vote submission)
    └─ DelegationService.ts (vote delegation)
```

#### Features
- **Active Proposals:** View ongoing governance proposals
- **Voting Power Calculation:** Display voting weight based on holdings
- **Vote Submission:** Cast votes with biometric confirmation
- **Vote Delegation:** Delegate voting power to other addresses
- **Vote History:** Track all votes and outcomes
- **Proposal Archive:** Research past governance decisions

#### Vote Transaction Structure
```typescript
interface VoteTransaction {
  proposalId: string,
  vote: 'FOR' | 'AGAINST' | 'ABSTAIN',
  weight: BigDecimal,
  reason?: string,
  signature: string,
  timestamp: Timestamp,
}
```

---

### 2.5 Analytics Module

#### Overview
Real-time portfolio analytics and performance metrics.

#### Key Components
```
AnalyticsModule/
├── PortfolioScreen.tsx (320 LOC)
│   ├─ Net portfolio value
│   ├─ 7-day value chart
│   ├─ Monthly yield breakdown
│   ├─ Allocation pie chart
│   ├─ Performance metrics (ROI, Sharpe ratio)
│   └─ Rebalancing recommendations
│
├── PerformanceCharts.tsx (200 LOC)
│   ├─ Candlestick charts (daily/weekly)
│   ├─ Volume analysis
│   ├─ Moving averages
│   └─ Technical indicators
│
├── models/
│   ├─ PortfolioMetrics.ts
│   ├─ PriceHistory.ts
│   └─ PerformanceData.ts
│
└── services/
    ├─ AnalyticsService.ts (metrics calculation)
    ├─ ChartDataService.ts (chart preparation)
    ├─ RebalancingAdviser.ts (AI recommendations)
    └─ PriceHistoryService.ts (data caching)
```

#### Features
- **Portfolio Value Chart:** 7-day, 30-day, YTD views
- **Allocation Breakdown:** Pie chart of holdings by pool
- **Performance Metrics:** ROI, yield rate, Sharpe ratio
- **Yield Tracking:** Monthly/annual yield accumulation
- **Rebalancing Alerts:** When allocation drifts >5%
- **Price Alerts:** Set alerts for specific price levels

---

## 3. Security Architecture

### 3.1 Authentication & Authorization

#### Biometric Authentication
```
User Login Flow:
1. Biometric (Face ID / Fingerprint) ✓
2. PIN backup authentication
3. OAuth 2.0 to Aurigraph backend
4. JWT token storage (encrypted)
5. Token refresh via refresh token rotation
```

#### Key Management
```
Private Key Storage:
- Hardware-backed Secure Enclave (iOS) / Keystore (Android)
- Never exported from device
- Biometric gated access
- Support for hardware wallets (Ledger, Trezor) via Bluetooth
```

### 3.2 Transaction Signing

```typescript
// Transaction signing flow
async function signTransaction(tx: Transaction): Promise<SignedTx> {
  // 1. User confirms on biometric
  const confirmed = await BiometricAuth.authenticate();

  // 2. Retrieve private key from secure storage
  const privateKey = await SecureStorage.getPrivateKey();

  // 3. Sign with Ed25519 signature
  const signature = await CryptoService.sign(tx.hash, privateKey);

  // 4. Return signed transaction
  return { transaction: tx, signature, timestamp };
}
```

### 3.3 Data Encryption

```
At-Rest Encryption:
- SQLite database: SQLCipher (AES-256)
- AsyncStorage secrets: libsodium.js
- SharedPreferences: EncryptedSharedPreferences

In-Transit Encryption:
- TLS 1.3 for all HTTP requests
- WebSocket WSS (secure WebSocket)
- Certificate pinning for API endpoints
```

---

## 4. Offline Support & Sync

### 4.1 Offline-First Architecture

```
Local State:
├── Holdings (read-only cache)
├── Transaction history (synced)
├─ Governance proposals (cached)
└─ Price data (periodic updates)

Sync Strategy:
├─ On app launch: Full sync
├─ Every 5 minutes: Incremental sync
├─ On WiFi: Background sync
└─ Manual: Pull-to-refresh
```

### 4.2 Conflict Resolution

```typescript
// When offline changes conflict with server state
function resolveConflict(local: State, server: State): State {
  // For read-only data: Always prefer server
  // For transactions: Merge with deduplication
  // For preferences: Always prefer local

  return {
    ...server,  // Server state as base
    ...local.localOnly,  // Preserve local-only changes
  };
}
```

---

## 5. Performance Optimization

### 5.1 Bundle Size Targets
```
App Bundle:
├─ Base iOS: <100 MB
├─ Base Android: <80 MB
└─ Per-module lazy loading: <5 MB each

Network:
├─ Initial load: <2 seconds
├─ Screen transitions: <500ms
└─ Data refresh: <3 seconds
```

### 5.2 Memory Management
```
RAM Usage Targets:
├─ Idle: <100 MB
├─ Active use: <200 MB
└─ Heavy trading: <300 MB
```

---

## 6. Push Notification Strategy

### 6.1 Notification Types
```
Distribution Events:
- Distribution scheduled (24h before)
- Distribution ready to claim
- Distribution claimed (confirmation)
- Yield paid (summary)

Governance Events:
- New proposal (when voting power >0)
- Voting started / ending soon
- Vote acknowledged
- Proposal outcome (passed/rejected)

Price Events:
- Price alert triggered
- Rebalancing recommended
- Breaking change detected
- Portfolio milestone (100K+ value)

Portfolio Events:
- Daily market summary
- Weekly performance report
- Monthly tax summary
- Holder tier upgrade
```

### 6.2 Notification Preferences
```
User Settings:
├─ Distributions: Enabled/Disabled
├─ Governance: All/Important/None
├─ Prices: Threshold-based, Daily summary
├─ Portfolio: Weekly report, None
└─ Quiet hours: 9PM-9AM
```

---

## 7. Development Roadmap

### Phase 1: MVP (4 weeks)
- ✓ Wallet module (holdings, transfers)
- ✓ Distribution management
- ✓ Basic analytics
- ✓ Biometric authentication

### Phase 2: Enhanced Features (2 weeks)
- ✓ Merkle proof verification
- ✓ Governance voting
- ✓ Advanced analytics (charts)
- ✓ Price alerts

### Phase 3: Advanced (2 weeks)
- ✓ Hardware wallet support
- ✓ Multiple accounts
- ✓ Portfolio export (PDF)
- ✓ DeFi integrations

### Phase 4: Optimization (1 week)
- ✓ Performance tuning
- ✓ App Store submission
- ✓ Beta testing
- ✓ App launch

---

## 8. File Structure

```
aurigraph-mobile/
├── src/
│   ├── components/
│   │   ├── WalletModule/
│   │   ├── DistributionModule/
│   │   ├── GovernanceModule/
│   │   ├── AnalyticsModule/
│   │   └── Common/
│   │
│   ├── screens/
│   │   ├── HomeScreen.tsx
│   │   ├── WalletScreens/
│   │   ├── DistributionScreens/
│   │   ├── GovernanceScreens/
│   │   ├── SettingsScreens/
│   │   └── ProfileScreens/
│   │
│   ├── services/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── crypto/
│   │   ├── storage/
│   │   └── notifications/
│   │
│   ├── store/
│   │   ├── slices/
│   │   └── store.ts
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── WalletNavigator.tsx
│   │   ├── GovernanceNavigator.tsx
│   │   └── SettingsNavigator.tsx
│   │
│   ├── utils/
│   │   ├── formatting/
│   │   ├── validation/
│   │   └── helpers/
│   │
│   ├── hooks/
│   │   ├── useWallet.ts
│   │   ├── useDistributions.ts
│   │   └── useGovernance.ts
│   │
│   ├── constants/
│   │   └── config.ts
│   │
│   └── App.tsx
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── app.json (Expo config)
├── tsconfig.json
├── package.json
└── README.md
```

---

## 9. Testing Strategy

### Unit Tests (400+ tests)
- Redux selectors and actions
- Service functions
- Utility helpers
- Validation logic

### Integration Tests (50+ tests)
- Authentication flow
- Transaction signing and broadcast
- Offline sync logic
- Data consistency

### E2E Tests (20+ tests)
- Complete user journeys
- Wallet transfer flow
- Distribution claiming
- Governance voting

### Performance Tests
- App startup time
- Screen load times
- Network request latency
- Memory usage under load

---

## 10. Deployment Strategy

### iOS Deployment
```
1. Development builds: TestFlight beta
2. Staging: Adhoc distribution
3. Production: App Store release
4. Auto-updates: CodePush for hotfixes
```

### Android Deployment
```
1. Development builds: Firebase App Distribution
2. Staging: Google Play Internal Testing
3. Production: Google Play Store release
4. Auto-updates: CodePush for hotfixes
```

### CodePush Configuration
```javascript
{
  "ios": {
    "deploymentKey": "...",
    "shouldDeployNow": true,
  },
  "android": {
    "deploymentKey": "...",
    "shouldDeployNow": true,
  },
}
```

---

## Success Metrics

### Functional Metrics
- ✅ All features implemented per spec
- ✅ Zero critical bugs
- ✅ 95%+ test coverage
- ✅ Authentication success rate >99.9%

### Performance Metrics
- ✅ App startup <3 seconds
- ✅ Screen transitions <500ms
- ✅ Network requests <2 seconds
- ✅ Memory usage <300MB peak

### User Adoption
- ✅ 1000+ downloads in first month
- ✅ 4.5+ app store rating
- ✅ <2% daily churn rate
- ✅ 80% retention at 7 days

---

## Conclusion

Mobile nodes extend Aurigraph V11 to the mobile ecosystem, enabling fractional token holders to:
- **Manage holdings** on-the-go
- **Claim distributions** instantly
- **Vote on governance** from anywhere
- **Verify proofs** without external tools
- **Track analytics** in real-time
- **Stay informed** via push notifications

With robust security, offline support, and cross-platform compatibility, mobile nodes provide a seamless blockchain experience on iOS and Android.

---

**Status:** Design Complete - Ready for Implementation
**Estimated Effort:** 240 hours (6 weeks)
**Team Allocation:** 2 FTE mobile developers
**Start Date:** November 2, 2025

🤖 Generated with Claude Code
