# Aurigraph Flutter Demo App

Complete demonstration of the Aurigraph DLT Flutter SDK featuring:
- Wallet Management
- Transaction Processing
- Cross-Chain Bridge
- Analytics Dashboard
- **Business Node Management** (NEW)

## Features

### 1. Wallet Management
- Create/import wallets with quantum-resistant cryptography
- Biometric authentication (Face ID, Touch ID, Fingerprint)
- Balance checking
- Transaction history

### 2. Cross-Chain Bridge
- Bridge assets between chains
- Real-time bridge status tracking
- Multi-chain support

### 3. Analytics Dashboard
- Network statistics
- Transaction metrics
- Performance monitoring

### 4. Business Nodes (NEW)
- Create and configure business nodes
- Real-time TPS (transactions per second) monitoring
- Queue management
- CPU and memory usage tracking
- Live performance charts
- Multiple processing strategies (FIFO, LIFO, priority, round-robin, least-busy)

## Prerequisites

### 1. Install Flutter
```bash
# macOS (using Homebrew)
brew install flutter

# Or download from: https://docs.flutter.dev/get-started/install
```

### 2. Verify Flutter Installation
```bash
flutter doctor
```

Ensure all required components are installed:
- ✅ Flutter SDK
- ✅ Xcode (for iOS development)
- ✅ Android Studio (for Android development)
- ✅ VS Code or Android Studio with Flutter plugins

### 3. Install Dependencies
From the demo app directory:
```bash
cd /Users/subbujois/Documents/GitHub/Aurigraph-DLT/aurigraph-av10-7/aurigraph-mobile-sdk/demos/flutter-demo

flutter pub get
```

## Building the App

### Run on iOS Simulator
```bash
# List available simulators
flutter emulators

# Launch simulator
flutter emulators --launch <simulator_id>

# Run app
flutter run
```

### Run on Android Emulator
```bash
# List available emulators
flutter emulators

# Launch emulator
flutter emulators --launch <emulator_id>

# Run app
flutter run
```

### Run on Physical Device

#### iOS Device
1. Connect iPhone/iPad via USB
2. Trust the computer on your device
3. Open Xcode and configure signing
4. Run:
```bash
flutter run
```

#### Android Device
1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect via USB
4. Run:
```bash
flutter run
```

### Build Release APK (Android)
```bash
flutter build apk --release

# Output: build/app/outputs/flutter-apk/app-release.apk
```

### Build Release IPA (iOS)
```bash
flutter build ios --release

# Then archive in Xcode
open ios/Runner.xcworkspace
```

### Build for App Store/Play Store

#### Android (AAB)
```bash
flutter build appbundle --release

# Output: build/app/outputs/bundle/release/app-release.aab
```

#### iOS
```bash
flutter build ipa --release

# Output: build/ios/ipa/aurigraph_demo.ipa
```

## Quick Start Guide

### 1. Launch the App
```bash
cd /Users/subbujois/Documents/GitHub/Aurigraph-DLT/aurigraph-av10-7/aurigraph-mobile-sdk/demos/flutter-demo

flutter run
```

### 2. Navigate Through Features
The app has 4 main tabs:
- **Wallet**: Create wallets, send transactions, check balances
- **Bridge**: Cross-chain asset transfers
- **Analytics**: Network and performance metrics
- **Nodes**: Business node management (NEW)

### 3. Create Your First Business Node
1. Tap the **Nodes** tab
2. Tap the **+** icon (top-right)
3. Configure your node:
   - Name: e.g., "My Business Node"
   - Processing Capacity: 1000 TPS (default)
   - Queue Size: 10000 transactions
   - Batch Size: 100
   - Parallel Threads: 4
   - Strategy: FIFO
4. Tap **Create Node**
5. Tap the play button to start processing
6. Watch real-time metrics update!

## Development

### Hot Reload
While the app is running:
- Press `r` for hot reload (preserves state)
- Press `R` for hot restart (resets state)
- Press `q` to quit

### Debug Mode Features
- Detailed logging
- Network request/response inspection
- Performance overlay

### Enable Performance Overlay
```bash
flutter run --profile
```

Then in the app, tap the top-right to show debug menu.

## Project Structure

```
flutter-demo/
├── lib/
│   └── main.dart              # Main app with 4 tabs
├── pubspec.yaml               # Dependencies
└── README.md                  # This file

Related SDK files:
├── flutter/lib/
│   ├── aurigraph_sdk.dart     # Main SDK entry point
│   └── src/
│       ├── business_node_models.dart    # Business node data models
│       ├── business_node_manager.dart   # Business node service
│       ├── business_node_widgets.dart   # Business node UI
│       ├── wallet_manager.dart
│       ├── transaction_manager.dart
│       ├── bridge_manager.dart
│       ├── crypto_manager.dart
│       └── network_manager.dart
```

## Troubleshooting

### "Flutter not found"
Install Flutter SDK and add to PATH:
```bash
export PATH="$PATH:`pwd`/flutter/bin"
```

### "No devices found"
- Ensure simulator/emulator is running
- For physical devices, check USB connection and developer mode

### Build Errors
Clean and rebuild:
```bash
flutter clean
flutter pub get
flutter run
```

### iOS Code Signing Issues
Open in Xcode and configure signing:
```bash
open ios/Runner.xcworkspace
```

### Android SDK Issues
Ensure Android SDK is installed via Android Studio.

## Performance

The demo app includes:
- Real-time metrics simulation
- Efficient state management
- Optimized rendering with Flutter widgets
- Minimal memory footprint

**Expected Performance:**
- Startup: <2 seconds
- Memory: ~150MB
- Business Node Metrics: Updates every 1 second
- Smooth 60 FPS UI

## Testing

### Run Unit Tests
```bash
cd ../../flutter
flutter test
```

### Run Integration Tests
```bash
flutter test integration_test/
```

## Configuration

### Network Endpoint
Edit `lib/main.dart` line 61-67:
```dart
final config = AurigraphConfiguration(
  networkEndpoint: 'https://testnet-api.aurigraph.io',  // Change this
  environment: Environment.testnet,
  enableBiometrics: true,
  debugMode: true,
);
```

### Business Node Defaults
Edit business node configuration in the creation screen or programmatically:
```dart
final config = BusinessNodeConfig(
  id: 'my-node',
  name: 'Custom Node',
  processingCapacity: 2000,  // 2K TPS
  queueSize: 20000,
  batchSize: 200,
  parallelThreads: 8,
  strategy: ProcessingStrategy.priority,
);
```

## Support

- **Documentation**: https://docs.aurigraph.io/mobile-sdk/flutter
- **Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
- **JIRA**: https://aurigraphdlt.atlassian.net/

## License

Copyright © 2025 Aurigraph DLT Corp. All rights reserved.

## Version

- **App Version**: 1.0.0
- **SDK Version**: 11.0.0
- **Flutter SDK**: >=3.0.0 <4.0.0
- **Last Updated**: October 12, 2025

---

**Happy Building! 🚀**

*Powered by Aurigraph DLT V11 with Quantum-Resistant Cryptography*
