# Aurigraph Mobile App - Download & Build Guide

**Complete guide to downloading, building, and running the Aurigraph Flutter mobile app with Business Nodes.**

---

## 📱 What's Included

The Aurigraph Flutter mobile app features:

✅ **Wallet Management** - Create/import wallets with quantum-resistant cryptography
✅ **Transaction Processing** - Send and receive transactions
✅ **Cross-Chain Bridge** - Bridge assets between blockchains
✅ **Analytics Dashboard** - Real-time network statistics
✅ **Business Node Management** - Create, configure, and monitor business nodes (NEW)

---

## 📋 Prerequisites

### 1. Install Flutter SDK

#### macOS
```bash
# Using Homebrew
brew install flutter

# Or download from: https://docs.flutter.dev/get-started/install/macos
```

#### Linux
```bash
# Download Flutter
cd ~
git clone https://github.com/flutter/flutter.git -b stable

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$PATH:$HOME/flutter/bin"

# Verify
flutter doctor
```

#### Windows
Download and install from: https://docs.flutter.dev/get-started/install/windows

### 2. Install Platform Tools

#### For iOS Development (macOS only)
- Install Xcode from App Store
- Install Xcode command line tools:
  ```bash
  xcode-select --install
  ```
- Accept licenses:
  ```bash
  sudo xcodebuild -license accept
  ```

#### For Android Development (All platforms)
- Install Android Studio: https://developer.android.com/studio
- Install Android SDK via Android Studio
- Accept licenses:
  ```bash
  flutter doctor --android-licenses
  ```

### 3. Verify Installation
```bash
flutter doctor

# You should see:
# ✓ Flutter (Channel stable)
# ✓ Android toolchain
# ✓ Xcode (macOS only)
# ✓ VS Code or Android Studio
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Clone the Repository (if not already)
```bash
cd ~
git clone https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT.git
cd Aurigraph-DLT
```

### Step 2: Navigate to Demo App
```bash
cd aurigraph-av10-7/aurigraph-mobile-sdk/demos/flutter-demo
```

### Step 3: Run the App
```bash
./run.sh
```

That's it! The app will:
- Install dependencies automatically
- Detect available devices/simulators
- Launch the app

---

## 🔧 Detailed Build Instructions

### Method 1: Quick Start Script (Recommended)
```bash
cd aurigraph-av10-7/aurigraph-mobile-sdk/demos/flutter-demo
./run.sh
```

### Method 2: Interactive Build Script
```bash
cd aurigraph-av10-7/aurigraph-mobile-sdk/demos/flutter-demo
./build.sh
```

Interactive menu with 7 options:
1. **Run on simulator/emulator** - Development mode
2. **Build Android APK** - Installable Android package
3. **Build Android AAB** - For Google Play Store
4. **Build iOS IPA** - For App Store
5. **Clean and rebuild** - Fresh build
6. **Install dependencies only** - Just get packages
7. **Run tests** - Execute test suite

### Method 3: Manual Build
```bash
cd aurigraph-av10-7/aurigraph-mobile-sdk/demos/flutter-demo

# Install dependencies
flutter pub get

# Run on default device
flutter run
```

---

## 📲 Running on Different Platforms

### iOS Simulator
```bash
# List available simulators
flutter emulators

# Launch simulator
flutter emulators --launch apple_ios_simulator

# Run app
cd aurigraph-av10-7/aurigraph-mobile-sdk/demos/flutter-demo
flutter run
```

### iOS Physical Device
1. Connect iPhone/iPad via USB
2. Trust computer on device
3. Open Xcode to configure code signing:
   ```bash
   cd aurigraph-av10-7/aurigraph-mobile-sdk/demos/flutter-demo
   open ios/Runner.xcworkspace
   ```
4. Select your development team in Xcode
5. Run:
   ```bash
   flutter run
   ```

### Android Emulator
```bash
# Launch Android Studio AVD Manager
# Or use command line:

# List available emulators
flutter emulators

# Launch emulator
flutter emulators --launch <emulator_id>

# Run app
cd aurigraph-av10-7/aurigraph-mobile-sdk/demos/flutter-demo
flutter run
```

### Android Physical Device
1. Enable **Developer Options** on Android device:
   - Settings → About Phone → Tap "Build Number" 7 times
2. Enable **USB Debugging**:
   - Settings → Developer Options → USB Debugging
3. Connect device via USB
4. Run:
   ```bash
   cd aurigraph-av10-7/aurigraph-mobile-sdk/demos/flutter-demo
   flutter run
   ```

---

## 📦 Building Release Versions

### Android APK (Direct Install)
```bash
cd aurigraph-av10-7/aurigraph-mobile-sdk/demos/flutter-demo
flutter build apk --release

# Output: build/app/outputs/flutter-apk/app-release.apk
```

Install on device:
```bash
adb install build/app/outputs/flutter-apk/app-release.apk
```

### Android AAB (Google Play Store)
```bash
cd aurigraph-av10-7/aurigraph-mobile-sdk/demos/flutter-demo
flutter build appbundle --release

# Output: build/app/outputs/bundle/release/app-release.aab
```

Upload to Google Play Console for distribution.

### iOS IPA (App Store)
```bash
cd aurigraph-av10-7/aurigraph-mobile-sdk/demos/flutter-demo
flutter build ios --release

# Then create archive in Xcode:
open ios/Runner.xcworkspace
```

In Xcode:
1. Product → Archive
2. Distribute App → App Store Connect

---

## 🎮 Using the App

### First Launch
1. App initializes Aurigraph SDK
2. Shows 4 main tabs:
   - **Wallet** 💰
   - **Bridge** 🔄
   - **Analytics** 📊
   - **Nodes** 🖥️ (NEW)

### Creating Your First Business Node

1. **Navigate to Nodes Tab**
   - Tap the "Nodes" icon in bottom navigation

2. **Create New Node**
   - Tap the **+** icon (top-right corner)

3. **Configure Node**
   ```
   Node Name: My First Node
   Processing Capacity: 1000 TPS
   Queue Size: 10000 transactions
   Batch Size: 100
   Parallel Threads: 4
   Strategy: FIFO (First-In-First-Out)
   Timeout: 30 seconds
   Auto Restart: Yes
   ```

4. **Start Processing**
   - Tap "Create Node"
   - Tap the ▶️ (play) button on the node card

5. **Watch Real-Time Metrics**
   - Current TPS (transactions per second)
   - Queue status
   - Success rate
   - CPU usage

6. **View Details**
   - Tap on any node card for full details
   - See live performance charts
   - Monitor TPS and latency graphs

### Node Operations

**Start Node**: Tap ▶️ play button
**Stop Node**: Tap ⏸️ pause button
**Edit Configuration**: Tap node → Edit icon
**Delete Node**: Tap node → Delete icon
**View Metrics**: Tap on node card

---

## 🛠️ Development Features

### Hot Reload
While app is running:
- Press **`r`** - Hot reload (keeps state)
- Press **`R`** - Hot restart (resets state)
- Press **`q`** - Quit

### Debug Menu
- Press **`d`** - Open debug menu
- Press **`p`** - Toggle performance overlay

### Console Logs
Watch real-time logs in terminal:
```bash
flutter run --verbose
```

---

## 🐛 Troubleshooting

### "Flutter not found"
**Solution**: Add Flutter to PATH
```bash
export PATH="$PATH:/path/to/flutter/bin"
```

### "No devices found"
**Solution**: Launch simulator/emulator first
```bash
# iOS
open -a Simulator

# Android
flutter emulators --launch <emulator_id>
```

### Build Errors
**Solution**: Clean and rebuild
```bash
flutter clean
flutter pub get
flutter run
```

### iOS Code Signing Issues
**Solution**: Configure in Xcode
```bash
cd aurigraph-av10-7/aurigraph-mobile-sdk/demos/flutter-demo
open ios/Runner.xcworkspace
# Select your team in Signing & Capabilities
```

### Android SDK Issues
**Solution**: Install via Android Studio
```bash
# Accept all licenses
flutter doctor --android-licenses
```

### Dependency Conflicts
**Solution**: Clear pub cache
```bash
flutter pub cache clean
flutter pub get
```

---

## 📊 Performance Expectations

**Startup Time**: < 2 seconds
**Memory Usage**: ~150MB
**Frame Rate**: 60 FPS
**Business Node Updates**: Every 1 second
**Simulated TPS**: 1-2000+ transactions/second

---

## 📚 Additional Resources

### Documentation
- **Full README**: `aurigraph-av10-7/aurigraph-mobile-sdk/demos/flutter-demo/README.md`
- **SDK Documentation**: https://docs.aurigraph.io/mobile-sdk/flutter
- **Flutter Docs**: https://docs.flutter.dev

### Project Links
- **GitHub**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT
- **JIRA**: https://aurigraphdlt.atlassian.net/
- **Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues

### Code Structure
```
flutter-demo/
├── lib/
│   └── main.dart              # Main app (749 lines)
├── pubspec.yaml               # Dependencies
├── build.sh                   # Interactive build script
├── run.sh                     # Quick start script
└── README.md                  # Detailed documentation

SDK Source:
├── flutter/lib/
│   ├── aurigraph_sdk.dart     # Main SDK
│   └── src/
│       ├── business_node_models.dart    # 359 lines
│       ├── business_node_manager.dart   # 434 lines
│       ├── business_node_widgets.dart   # 1,236 lines
│       └── ... (other managers)
```

---

## 🎯 Quick Reference Commands

```bash
# Navigate to app
cd ~/Aurigraph-DLT/aurigraph-av10-7/aurigraph-mobile-sdk/demos/flutter-demo

# Quick run
./run.sh

# Interactive build
./build.sh

# Manual commands
flutter pub get          # Install dependencies
flutter run              # Run app
flutter devices          # List devices
flutter clean            # Clean build
flutter doctor           # Check setup

# Build releases
flutter build apk --release        # Android APK
flutter build appbundle --release  # Android AAB
flutter build ios --release        # iOS build
```

---

## ✅ Checklist

Before running the app, ensure:

- [ ] Flutter SDK installed (`flutter --version`)
- [ ] Android Studio installed (for Android)
- [ ] Xcode installed (for iOS, macOS only)
- [ ] Device/emulator running (`flutter devices`)
- [ ] Repository cloned locally
- [ ] In correct directory (`flutter-demo/`)

---

## 🎉 Success!

If everything worked, you should see:

1. **App launches** on your device/simulator
2. **Bottom navigation** with 4 tabs (Wallet, Bridge, Analytics, Nodes)
3. **Business Nodes tab** ready to create nodes
4. **Real-time metrics** updating every second

**Congratulations! You're running the Aurigraph mobile app with Business Nodes! 🚀**

---

## 📝 Version Information

- **App Version**: 1.0.0
- **SDK Version**: 11.0.0
- **Flutter Requirement**: >=3.0.0 <4.0.0
- **Platform Support**: iOS 12+, Android 6.0+
- **Last Updated**: October 12, 2025

---

## 💬 Support

Need help? Contact us:
- **Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT/issues
- **Email**: support@aurigraph.io
- **Docs**: https://docs.aurigraph.io

---

**Happy Building! 📱🚀**

*Powered by Aurigraph DLT V11 with Quantum-Resistant Cryptography*

🤖 *Generated with [Claude Code](https://claude.com/claude-code)*
