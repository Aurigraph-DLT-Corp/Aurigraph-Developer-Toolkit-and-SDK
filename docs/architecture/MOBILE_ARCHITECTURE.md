# 📱 Mobile Apps Architecture - iOS/Android Wallet & Dashboard

**Document Version**: 1.0
**Status**: ✅ Active
**Epic**: AV11-907
**Team**: @MobileDevTeam
**Target Platforms**: iOS 14+, Android 10+

---

## Overview

The Aurigraph V11 Mobile App provides native wallet functionality and blockchain dashboard across iOS and Android using React Native, enabling users to manage assets, track transactions, and monitor network metrics on-the-go.

### Goals
- ✅ Native look & feel on both iOS and Android
- ✅ Secure wallet with biometric authentication
- ✅ Real-time transaction notifications
- ✅ Offline-first architecture with sync
- ✅ Sub-100ms transaction confirmation UI

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           React Native Application              │
│  (Shared TypeScript codebase)                   │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│      Application Layer                          │
│  ┌──────────────────────────────────────┐       │
│  │  Navigation & Routing (React Nav)    │       │
│  └──────────────────────────────────────┘       │
│  ┌──────────────────────────────────────┐       │
│  │  Screens & Components                │       │
│  │  (Wallet, Dashboard, Send, Receive)  │       │
│  └──────────────────────────────────────┘       │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│      State Management Layer                     │
│  ┌──────────────────────────────────────┐       │
│  │  Redux Store + Redux Saga            │       │
│  │  (Global state management)           │       │
│  └──────────────────────────────────────┘       │
│  ┌──────────────────────────────────────┐       │
│  │  Redux Persist (Encryption + Backup) │       │
│  └──────────────────────────────────────┘       │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│      Business Logic Layer                       │
│  ┌──────────────────────────────────────┐       │
│  │  Wallet Module (Key Mgmt, Signing)   │       │
│  │  Transaction Module (Build & Submit) │       │
│  │  Account Module (Balance, History)   │       │
│  │  Notification Module (FCM/APNS)      │       │
│  └──────────────────────────────────────┘       │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│      Data Layer                                 │
│  ┌──────────────────────────────────────┐       │
│  │  Local Storage (SQLite/Realm)        │       │
│  │  Encrypted Key Storage               │       │
│  │  Transaction Cache                   │       │
│  └──────────────────────────────────────┘       │
│  ┌──────────────────────────────────────┐       │
│  │  REST API Client (Aurigraph SDK)     │       │
│  │  WebSocket Connection (Real-time)    │       │
│  │  Push Notification Handlers          │       │
│  └──────────────────────────────────────┘       │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│      Native Bridge Layer                        │
│  ┌──────────────────────────────────────┐       │
│  │  Biometric Authentication (Touch ID) │       │
│  │  Native Notifications (FCM/APNS)     │       │
│  │  Camera (QR Code Scanner)            │       │
│  │  Platform Specific Code              │       │
│  └──────────────────────────────────────┘       │
└────────────┬────────────────────────────────────┘
             │
┌────────────▼────────────────────────────────────┐
│      Aurigraph V11 Backend Services             │
│  (REST API + WebSocket)                         │
└─────────────────────────────────────────────────┘
```

---

## Project Structure

```
aurigraph-mobile/
├── ios/                               # Native iOS code
│   ├── Podfile                        # CocoaPods dependencies
│   ├── AurigraphWallet/
│   │   ├── Info.plist
│   │   ├── RootViewController.swift
│   │   └── Supporting Files
│   └── AurigraphWalletTests/
│
├── android/                           # Native Android code
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   ├── java/io/aurigraph/wallet/
│   │   │   └── res/
│   │   └── build.gradle
│   ├── gradle/
│   └── settings.gradle
│
├── src/
│   ├── App.tsx                        # Root component
│   ├── navigation/
│   │   ├── AppNavigator.tsx           # App navigation stack
│   │   ├── WalletNavigator.tsx        # Wallet screens
│   │   ├── DashboardNavigator.tsx     # Dashboard screens
│   │   └── SettingsNavigator.tsx      # Settings screens
│   │
│   ├── screens/
│   │   ├── wallet/
│   │   │   ├── WalletScreen.tsx       # Main wallet view
│   │   │   ├── SendScreen.tsx         # Send transaction
│   │   │   ├── ReceiveScreen.tsx      # Receive address
│   │   │   └── TransactionHistoryScreen.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardScreen.tsx    # Portfolio overview
│   │   │   ├── AssetsScreen.tsx       # Asset list
│   │   │   ├── AnalyticsScreen.tsx    # Charts & analytics
│   │   │   └── MarketScreen.tsx       # Market data
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── SignupScreen.tsx
│   │   │   ├── RecoveryScreen.tsx     # Seed phrase recovery
│   │   │   └── BiometricScreen.tsx
│   │   └── settings/
│   │       ├── SettingsScreen.tsx
│   │       ├── SecurityScreen.tsx
│   │       ├── NotificationScreen.tsx
│   │       └── AboutScreen.tsx
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Loading.tsx
│   │   ├── wallet/
│   │   │   ├── BalanceCard.tsx        # Display balance
│   │   │   ├── TransactionItem.tsx    # Transaction list item
│   │   │   ├── QRCodeDisplay.tsx      # Show QR code
│   │   │   └── TransactionForm.tsx    # Send/receive form
│   │   └── dashboard/
│   │       ├── Chart.tsx              # Chart component
│   │       ├── StatCard.tsx           # Stat display
│   │       ├── PortfolioWidget.tsx
│   │       └── PriceWidget.tsx
│   │
│   ├── redux/
│   │   ├── store.ts                   # Redux store config
│   │   ├── rootReducer.ts
│   │   ├── slices/
│   │   │   ├── walletSlice.ts         # Wallet state
│   │   │   ├── transactionSlice.ts    # Transaction state
│   │   │   ├── accountSlice.ts        # Account state
│   │   │   ├── dashboardSlice.ts      # Dashboard state
│   │   │   ├── authSlice.ts           # Auth state
│   │   │   └── settingsSlice.ts       # Settings state
│   │   └── sagas/
│   │       ├── walletSaga.ts          # Wallet logic
│   │       ├── transactionSaga.ts     # Transaction logic
│   │       ├── authSaga.ts            # Auth flows
│   │       ├── notificationSaga.ts    # Notification handling
│   │       └── rootSaga.ts
│   │
│   ├── services/
│   │   ├── api/
│   │   │   ├── client.ts              # API client setup
│   │   │   ├── wallet.ts              # Wallet API calls
│   │   │   ├── transaction.ts         # Transaction APIs
│   │   │   ├── account.ts             # Account APIs
│   │   │   └── dashboard.ts           # Dashboard APIs
│   │   ├── storage/
│   │   │   ├── secure.ts              # Secure storage (passwords, keys)
│   │   │   ├── database.ts            # SQLite/Realm DB
│   │   │   └── cache.ts               # Transaction cache
│   │   ├── wallet/
│   │   │   ├── keyManager.ts          # Key generation & storage
│   │   │   ├── signer.ts              # Transaction signing
│   │   │   └── recovery.ts            # Seed phrase recovery
│   │   ├── push/
│   │   │   ├── notification.ts        # FCM/APNS setup
│   │   │   ├── handler.ts             # Notification handling
│   │   │   └── deep-linking.ts        # Deep link handling
│   │   ├── biometric/
│   │   │   └── auth.ts                # Biometric authentication
│   │   └── websocket/
│   │       └── connection.ts          # WebSocket for real-time
│   │
│   ├── utils/
│   │   ├── validation.ts              # Form validation
│   │   ├── formatting.ts              # Number/date formatting
│   │   ├── crypto.ts                  # Crypto utilities
│   │   ├── logger.ts                  # Logging
│   │   ├── error.ts                   # Error handling
│   │   └── constants.ts               # App constants
│   │
│   ├── hooks/
│   │   ├── useWallet.ts               # Wallet hook
│   │   ├── useTransaction.ts          # Transaction hook
│   │   ├── useNotifications.ts        # Notification hook
│   │   ├── useBiometric.ts            # Biometric hook
│   │   └── useWebSocket.ts            # WebSocket hook
│   │
│   ├── styles/
│   │   ├── theme.ts                   # Color, typography
│   │   ├── spacing.ts                 # Spacing constants
│   │   └── global.ts                  # Global styles
│   │
│   └── types/
│       ├── index.ts                   # All TypeScript types
│       ├── wallet.ts
│       ├── transaction.ts
│       ├── account.ts
│       └── api.ts
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   ├── utils/
│   │   └── redux/
│   ├── integration/
│   │   ├── wallet.test.ts
│   │   ├── transaction.test.ts
│   │   └── auth.test.ts
│   └── fixtures/
│       ├── mocks/
│       └── test-data.ts
│
├── package.json                       # Dependencies
├── tsconfig.json                      # TypeScript config
├── metro.config.js                    # React Native bundler
├── app.json                           # App configuration
├── babel.config.js                    # Babel config
├── jest.config.js                     # Jest test config
└── .env.example                       # Environment template
```

---

## Core Screens & Flows

### 1. Authentication Flow
```
Splash Screen
    ↓
[Existing User?]
├─→ Yes → Biometric Auth / Pin Code → Wallet
└─→ No → Signup Flow
         ├→ Create Wallet (Generate Keys)
         ├→ Backup Seed Phrase
         ├→ Confirm Seed
         ├→ Set Pin/Biometric
         └→ Wallet
```

### 2. Wallet Screen
- Balance display (AUR token)
- Quick actions (Send, Receive)
- Recent transactions
- Portfolio value & change
- Quick access to dashboard

### 3. Send Transaction Flow
```
Send Button
    ↓
Enter Recipient Address
    ↓
Enter Amount
    ↓
Review Transaction
    ↓
[Biometric/Pin Auth]
    ↓
Confirm
    ↓
Transaction Submitted (Real-time status)
    ↓
Confirmation Notification
```

### 4. Dashboard Screen
- Portfolio overview (total value, change %)
- Asset breakdown (pie chart)
- Transaction history
- Market data
- Network statistics

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Framework | React Native 0.73+ |
| Language | TypeScript |
| Navigation | React Navigation 6 |
| State | Redux Toolkit + Redux Saga |
| Storage | SQLite / Realm + Redux Persist |
| HTTP | axios |
| WebSocket | ws library |
| Notifications | Firebase Cloud Messaging (FCM) + APNS |
| Biometric | react-native-biometrics |
| Camera | react-native-vision-camera |
| Charts | Victory + react-native-chart-kit |
| UI Library | React Native Paper / Galio |
| Testing | Jest + detox |
| Build | EAS Build |
| CI/CD | EAS Update + GitHub Actions |

---

## Key Features Implementation

### 1. Secure Wallet
```typescript
// Key storage (encrypted)
await keyManager.generateKeys()
await secureStorage.savePrivateKey(key, password)

// Transaction signing
const signature = await signer.sign(transaction)
```

### 2. Biometric Auth
```typescript
const canUseBiometric = await biometric.isAvailable()
if (canUseBiometric) {
  const authenticated = await biometric.authenticate()
}
```

### 3. Push Notifications
```typescript
// Setup FCM/APNS
notificationService.initialize()
notificationService.subscribe('transactions')

// Handle notification
notificationService.onNotification((notification) => {
  // Update UI with transaction status
})
```

### 4. Real-time Updates
```typescript
const ws = new WebSocketConnection('wss://dlt.aurigraph.io/ws')
ws.subscribe('transactions', (tx) => {
  // Update transaction status
  dispatch(updateTransaction(tx))
})
```

### 5. Offline-First Sync
```typescript
// Local cache while offline
offlineQueue.add(transaction)

// Sync when online
networkListener.onOnline(() => {
  offlineQueue.syncAll()
})
```

---

## Security Considerations

### Private Key Management
- ✅ Never transmitted over network
- ✅ Encrypted in local storage (AES-256)
- ✅ Biometric-protected access
- ✅ Seed phrase backup (user-controlled)

### API Security
- ✅ JWT token in Authorization header
- ✅ HTTPS/TLS for all connections
- ✅ Certificate pinning (optional)
- ✅ Request signing for sensitive ops

### Storage Security
- ✅ SQLite encrypted at rest
- ✅ Redux Persist encrypted state
- ✅ Secure storage for credentials
- ✅ No sensitive data in logs

---

## Testing Strategy

### Unit Tests
- Service & utility functions
- Redux reducers & selectors
- Component logic (pure functions)

### Integration Tests
- Transaction flows
- API integration
- Storage operations

### E2E Tests (Detox)
- Full user journeys
- Biometric auth flow
- Transaction submission
- Push notification handling

---

## Performance Targets

| Metric | Target |
|--------|--------|
| App startup | <2 seconds |
| Screen transition | <300ms |
| Transaction confirmation | <100ms UI update |
| List scrolling | 60fps |
| Memory usage | <150MB |
| Battery impact | <5% per hour usage |

---

## Deployment & Distribution

### iOS
- Build: XCode + EAS Build
- Distribution: Apple App Store
- Minimum iOS: 14.0
- Sign: Apple Developer Certificate

### Android
- Build: Gradle + EAS Build
- Distribution: Google Play Store
- Minimum Android: 10 (API 29)
- Sign: Keystore certificate

### CI/CD
- EAS Update for instant bug fixes
- GitHub Actions for build automation
- Over-the-air updates for JavaScript changes

---

**Version**: 1.0
**Last Updated**: December 27, 2025
**Status**: ✅ Architecture Approved
