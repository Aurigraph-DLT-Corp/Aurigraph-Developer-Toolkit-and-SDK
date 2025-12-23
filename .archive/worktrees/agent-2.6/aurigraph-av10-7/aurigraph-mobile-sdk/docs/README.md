# Aurigraph Mobile SDK Documentation

![Aurigraph Logo](https://img.shields.io/badge/Aurigraph-DLT-blue?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjMDA3QUZGIi8+Cjwvc3ZnPgo=)

[![Version](https://img.shields.io/badge/version-11.0.0-green)](https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android%20%7C%20React%20Native%20%7C%20Flutter-lightgrey)](#platforms)

## Overview

The Aurigraph Mobile SDK provides complete blockchain functionality for mobile developers, offering:

- **Quantum-Resistant Cryptography** - NIST Level 5 security with CRYSTALS-Kyber/Dilithium
- **AI-Driven Consensus** - HyperRAFT++ with predictive optimization
- **Cross-Chain Interoperability** - Bridge to 21+ major blockchains
- **Enterprise-Grade Security** - Hardware security modules and biometric authentication
- **Offline Capability** - Transaction signing and storage without internet connectivity
- **Multi-Platform Support** - Native iOS, Android, React Native, and Flutter implementations

## Quick Start

### iOS (Swift)

```swift
import AurigraphSDK

// Initialize SDK
let config = AurigraphConfiguration(
    networkEndpoint: "https://api.aurigraph.io",
    environment: .testnet,
    enableBiometrics: true
)

try await AurigraphSDK.shared.initialize(configuration: config)

// Create wallet
let wallet = try await AurigraphSDK.shared.wallet().createWallet(
    name: "My Wallet",
    useBiometrics: true
)

// Send transaction
let hash = try await AurigraphSDK.shared.transactions().sendTransaction(
    from: wallet.address,
    to: "0x742d35cc6cf34c3...",
    amount: Decimal(1.5),
    wallet: wallet,
    privateKey: privateKey
)
```

### React Native

```tsx
import Aurigraph from '@aurigraph/react-native-sdk';
import { WalletSelector, SendTransaction } from '@aurigraph/react-native-sdk/components';

// Initialize SDK
await Aurigraph.initialize({
  networkEndpoint: 'https://api.aurigraph.io',
  environment: 'testnet',
  enableBiometrics: true,
});

// Use pre-built components
export const App = () => (
  <View>
    <WalletSelector onWalletSelect={setSelectedWallet} />
    <SendTransaction 
      fromWallet={selectedWallet}
      onTransactionSent={handleTransactionSent}
    />
  </View>
);
```

### Flutter

```dart
import 'package:aurigraph_sdk/aurigraph_sdk.dart';

// Initialize SDK
await AurigraphSDK.instance.initialize(AurigraphConfiguration(
  networkEndpoint: 'https://api.aurigraph.io',
  environment: Environment.testnet,
  enableBiometrics: true,
));

// Create wallet
final wallet = await AurigraphSDK.instance.wallet.createWallet(
  name: 'My Wallet',
  useBiometrics: true,
);

// Send transaction
final hash = await AurigraphSDK.instance.transactions.sendTransaction(
  from: wallet.address,
  to: '0x742d35cc6cf34c3...',
  amount: '1.5',
  walletId: wallet.id,
  useBiometrics: true,
);
```

## Features

### 🔐 Quantum-Resistant Security

The SDK implements NIST-approved post-quantum cryptographic algorithms:

- **CRYSTALS-Kyber** for key encapsulation mechanisms
- **CRYSTALS-Dilithium** for digital signatures  
- **Hardware Security Module** integration
- **Biometric authentication** with fallback to passcode

### 🌐 Cross-Chain Bridge

Seamlessly bridge assets across 21+ blockchains:

```typescript
const bridgeTransaction = await sdk.bridge.initiate({
  fromChain: 'aurigraph',
  toChain: 'ethereum',
  amount: '100',
  recipientAddress: '0x742d35cc6cf34c3...'
});

// Monitor bridge progress
const status = await sdk.bridge.getStatus(bridgeTransaction.id);
```

### 📱 Offline Capabilities

Continue working even without internet connectivity:

- Sign transactions offline
- Store pending transactions locally
- Automatic broadcast when connection restored
- Encrypted local storage with biometric protection

### 🎨 Advanced UI Components

Pre-built, customizable components for common blockchain operations:

- **Wallet Selector** - Choose from multiple wallets
- **Transaction History** - View past transactions with filtering
- **Send Transaction** - Complete transaction flow
- **Balance Display** - Real-time balance updates
- **Cross-Chain Bridge** - Bridge assets between chains
- **Price Charts** - Visualize token price movements
- **Portfolio Pie Chart** - Asset allocation overview

### 🌙 Theming System

Complete theming support with multiple built-in themes:

- **Light Theme** - Clean, professional appearance
- **Dark Theme** - OLED-friendly dark mode
- **Quantum Theme** - Futuristic purple/pink gradient theme
- **Custom Themes** - Create your own brand themes

## Installation

### iOS

Add to your `Podfile`:

```ruby
pod 'AurigraphSDK', '~> 11.0'
```

Then run:

```bash
pod install
```

### Android

Add to your `build.gradle`:

```gradle
dependencies {
    implementation 'io.aurigraph:android-sdk:11.0.0'
}
```

### React Native

```bash
npm install @aurigraph/react-native-sdk
# or
yarn add @aurigraph/react-native-sdk

# iOS only
cd ios && pod install
```

### Flutter

Add to your `pubspec.yaml`:

```yaml
dependencies:
  aurigraph_sdk: ^11.0.0
```

Then run:

```bash
flutter pub get
```

## Architecture

### Core Components

```
┌─────────────────────────────────────────────────────────┐
│                  Aurigraph Mobile SDK                   │
├─────────────────┬─────────────────┬─────────────────────┤
│   Wallet        │   Transaction   │   Cross-Chain       │
│   Manager       │   Manager       │   Bridge Manager    │
├─────────────────┼─────────────────┼─────────────────────┤
│   Quantum       │   Network       │   Storage           │
│   Crypto        │   Manager       │   Manager           │
├─────────────────┼─────────────────┼─────────────────────┤
│   UI Components │   Themes        │   Charts            │
└─────────────────┴─────────────────┴─────────────────────┘
```

### Security Architecture

- **Hardware Security Module (HSM)** - Private keys stored in device secure enclave
- **Biometric Authentication** - Face ID, Touch ID, Fingerprint support
- **Encrypted Storage** - All sensitive data encrypted at rest
- **Network Security** - TLS 1.3 with certificate pinning
- **Code Obfuscation** - Protection against reverse engineering

### Performance Optimization

- **Native Modules** - Platform-specific optimizations
- **Connection Pooling** - Efficient network resource usage
- **Background Processing** - Non-blocking UI operations
- **Memory Management** - Automatic cleanup and optimization
- **Binary Size Optimization** - Minimal impact on app size

## Examples

### Complete Wallet App

See the [complete example apps](examples/) for each platform:

- [iOS Example App](examples/ios/) - SwiftUI wallet application
- [Android Example App](examples/android/) - Kotlin Compose wallet
- [React Native Example](examples/react-native/) - Cross-platform wallet
- [Flutter Example](examples/flutter/) - Multi-platform wallet

### Common Use Cases

#### Portfolio Management

```typescript
// Get portfolio balance
const balance = await sdk.getBalance(wallet.address);

// Get transaction history
const transactions = await sdk.getTransactionHistory(
  wallet.address, 
  { limit: 50, offset: 0 }
);

// Monitor real-time price
sdk.onPriceUpdate((price) => {
  updatePortfolioValue(price);
});
```

#### DeFi Integration

```typescript
// Stake tokens
const stakeHash = await sdk.defi.stake({
  amount: '100',
  validator: 'validator_address',
  duration: 30, // days
});

// Provide liquidity
const lpHash = await sdk.defi.provideLiquidity({
  tokenA: 'AUR',
  tokenB: 'ETH',
  amountA: '50',
  amountB: '2.5',
});
```

#### NFT Management

```typescript
// Mint NFT
const nftHash = await sdk.nft.mint({
  recipient: wallet.address,
  tokenURI: 'ipfs://Qm...',
  royalty: 5.0, // 5% royalty
});

// Transfer NFT
const transferHash = await sdk.nft.transfer({
  tokenId: 'token_123',
  from: wallet.address,
  to: 'recipient_address',
});
```

## API Reference

### Core Classes

#### AurigraphSDK
- `initialize(config: AurigraphConfiguration): Promise<void>`
- `wallet(): WalletManager`
- `transactions(): TransactionManager`
- `bridge(): BridgeManager`
- `shutdown(): Promise<void>`

#### WalletManager
- `createWallet(name: string, options?: WalletOptions): Promise<Wallet>`
- `importWallet(privateKey: string, options?: WalletOptions): Promise<Wallet>`
- `listWallets(): Promise<Wallet[]>`
- `exportPrivateKey(walletId: string, auth: AuthOptions): Promise<string>`
- `deleteWallet(walletId: string, auth: AuthOptions): Promise<void>`

#### TransactionManager
- `createTransaction(params: TransactionParams): Promise<Transaction>`
- `signTransaction(transaction: Transaction, auth: AuthOptions): Promise<SignedTransaction>`
- `broadcastTransaction(signedTx: SignedTransaction): Promise<string>`
- `sendTransaction(params: SendParams): Promise<string>`
- `getTransactionStatus(hash: string): Promise<TransactionStatus>`
- `getTransactionHistory(address: string, options?: HistoryOptions): Promise<Transaction[]>`

### Data Types

```typescript
interface Wallet {
  id: string;
  name: string;
  address: string;
  publicKey: string;
  createdAt: Date;
}

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: string;
  hash?: string;
  status: TransactionStatus;
  createdAt: Date;
}

interface BridgeTransaction {
  id: string;
  fromChain: string;
  toChain: string;
  amount: string;
  status: BridgeStatus;
  sourceTransactionHash?: string;
  targetTransactionHash?: string;
}
```

## Error Handling

```typescript
try {
  const transaction = await sdk.sendTransaction(params);
} catch (error) {
  if (error instanceof AurigraphError) {
    switch (error.code) {
      case 'INSUFFICIENT_BALANCE':
        showError('Not enough balance for transaction');
        break;
      case 'NETWORK_ERROR':
        showError('Network connection failed');
        break;
      case 'BIOMETRIC_AUTH_FAILED':
        showError('Biometric authentication required');
        break;
      default:
        showError(error.message);
    }
  }
}
```

## Testing

### Unit Tests

```bash
# iOS
xcodebuild test -workspace AurigraphSDK.xcworkspace -scheme AurigraphSDKTests

# Android
./gradlew test

# React Native
npm test

# Flutter
flutter test
```

### Integration Tests

```bash
# Run integration tests
npm run test:integration

# Run performance tests
npm run test:performance
```

## Security Considerations

### Best Practices

1. **Never store private keys in plain text**
2. **Always use biometric authentication when available**
3. **Validate all user inputs**
4. **Use secure network connections**
5. **Implement proper error handling**
6. **Regularly update the SDK**

### Vulnerability Reporting

If you discover a security vulnerability, please email security@aurigraph.io with:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Performance

### Benchmarks

| Operation | iOS | Android | React Native | Flutter |
|-----------|-----|---------|--------------|---------|
| Wallet Creation | ~500ms | ~600ms | ~700ms | ~650ms |
| Transaction Signing | ~100ms | ~120ms | ~150ms | ~130ms |
| Network Request | ~200ms | ~220ms | ~250ms | ~230ms |
| Biometric Auth | ~300ms | ~350ms | ~400ms | ~380ms |

### Memory Usage

- **iOS**: ~15MB average, 25MB peak
- **Android**: ~20MB average, 35MB peak
- **React Native**: ~25MB average, 40MB peak
- **Flutter**: ~22MB average, 38MB peak

## Troubleshooting

### Common Issues

#### "SDK not initialized" Error
```typescript
// Ensure you call initialize before using other methods
await AurigraphSDK.initialize(config);
```

#### Biometric Authentication Fails
```typescript
// Check if biometric authentication is available
const biometricType = await sdk.getBiometricType();
if (biometricType === 'none') {
  // Fallback to passcode authentication
}
```

#### Network Connection Issues
```typescript
// Enable offline mode for better resilience
const config = new AurigraphConfiguration({
  enableOfflineMode: true
});
```

### Debug Mode

Enable debug mode for detailed logging:

```typescript
const config = new AurigraphConfiguration({
  debugMode: true
});
```

## Migration Guide

### From v10.x to v11.x

1. **Update imports**: Package names have changed
2. **New initialization**: Configuration object required
3. **Async/await**: All methods now return Promises
4. **Quantum crypto**: New cryptographic implementations
5. **UI components**: New component library available

See [MIGRATION.md](MIGRATION.md) for detailed migration steps.

## Changelog

### v11.0.0 (2024-01-15)

- ✨ **New**: Quantum-resistant cryptography
- ✨ **New**: Cross-chain bridge support
- ✨ **New**: Advanced UI components
- ✨ **New**: Offline transaction capability
- ✨ **New**: Comprehensive theming system
- 🔧 **Changed**: Unified API across all platforms
- 🔧 **Changed**: Improved error handling
- 🛠️ **Fixed**: Memory leaks in background tasks
- 🛠️ **Fixed**: Network timeout issues

See [CHANGELOG.md](CHANGELOG.md) for complete history.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

```bash
# Clone repository
git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git
cd aurigraph-mobile-sdk

# Install dependencies
npm install

# Run tests
npm test

# Build all platforms
npm run build:all
```

## Support

- **Documentation**: [docs.aurigraph.io](https://docs.aurigraph.io)
- **Discord**: [Join our community](https://discord.gg/aurigraph)
- **Twitter**: [@AurigraphDLT](https://twitter.com/AurigraphDLT)
- **Email**: dev@aurigraph.io

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>Built with ❤️ by the Aurigraph team</strong>
</p>