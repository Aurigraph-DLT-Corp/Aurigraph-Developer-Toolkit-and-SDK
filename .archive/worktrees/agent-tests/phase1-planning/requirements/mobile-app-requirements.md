# Mobile App Requirements Specification
**Phase 1, Task 1.1.2 - Mobile App Requirements**
**Date**: October 9, 2025
**Project**: AV11-DEMO-MOBILE-2025
**Version**: 1.0

---

## Document Overview

This document defines the functional and non-functional requirements for the Aurigraph DLT mobile applications (Flutter and React Native). Both apps will provide real-time blockchain visualization, node management, and external data feed integration optimized for mobile devices.

---

## 1. Platform Requirements

### 1.1 Flutter Mobile App

#### Target Platforms
- **iOS**: 14.0+ (iPhone 8 and newer)
- **Android**: API 21+ (Android 5.0 Lollipop and newer)
- **Screen Sizes**: 4.7" to 6.7" (iPhone SE to iPhone 14 Pro Max equivalent)
- **Orientations**: Portrait (primary), Landscape (supported)

#### Development Environment
- **Flutter SDK**: 3.13+ (stable channel)
- **Dart**: 3.0+
- **IDE**: VS Code or Android Studio with Flutter/Dart plugins
- **Target Devices**:
  - iOS: iPhone 8, iPhone 12, iPhone 14 Pro
  - Android: Samsung Galaxy S10, Pixel 6, OnePlus 9

#### Dependencies (Estimated)
```yaml
dependencies:
  flutter: sdk: flutter

  # State Management
  flutter_bloc: ^8.1.3          # BLoC pattern for state management
  equatable: ^2.0.5              # Value equality

  # Networking
  http: ^1.1.0                   # HTTP client
  web_socket_channel: ^2.4.0     # WebSocket support
  dio: ^5.3.3                    # Advanced HTTP client (retry, interceptors)

  # Charts
  fl_chart: ^0.64.0              # Real-time charting library

  # Storage
  shared_preferences: ^2.2.2     # Persistent key-value storage
  hive: ^2.2.3                   # Lightweight NoSQL database
  hive_flutter: ^1.1.0           # Hive Flutter integration

  # UI/UX
  flutter_animate: ^4.2.0        # Smooth animations
  flutter_svg: ^2.0.7            # SVG support
  google_fonts: ^6.1.0           # Custom fonts

  # Utilities
  intl: ^0.18.1                  # Internationalization
  logger: ^2.0.2                 # Logging
  flutter_launcher_icons: ^0.13.1 # App icons

dev_dependencies:
  flutter_test: sdk: flutter
  flutter_lints: ^2.0.3
  mockito: ^5.4.2                # Mocking for tests
  bloc_test: ^9.1.4              # BLoC testing
  integration_test: sdk: flutter # Integration tests
```

### 1.2 React Native Mobile App

#### Target Platforms
- **iOS**: 14.0+ (iPhone 8 and newer)
- **Android**: API 21+ (Android 5.0 Lollipop and newer)
- **Screen Sizes**: 4.7" to 6.7"
- **Orientations**: Portrait (primary), Landscape (supported)

#### Development Environment
- **React Native**: 0.72+ (New Architecture enabled)
- **Node.js**: 18+ LTS
- **TypeScript**: 5.0+
- **IDE**: VS Code with React Native Tools
- **Target Devices**: Same as Flutter

#### Dependencies (Estimated)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-native": "^0.72.0",

    // State Management
    "@reduxjs/toolkit": "^1.9.7",
    "react-redux": "^8.1.3",
    "redux-persist": "^6.0.0",

    // Navigation
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",

    // Networking
    "axios": "^1.5.1",
    "@react-native-community/netinfo": "^11.1.0",

    // Charts
    "victory-native": "^36.8.6",
    "react-native-svg": "^13.14.0",

    // Storage
    "@react-native-async-storage/async-storage": "^1.19.3",

    // UI/UX
    "react-native-vector-icons": "^10.0.2",
    "react-native-gesture-handler": "^2.13.4",
    "react-native-reanimated": "^3.5.4",

    // Utilities
    "dayjs": "^1.11.10",
    "react-native-config": "^1.5.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-native": "^0.72.5",
    "typescript": "^5.2.2",
    "@testing-library/react-native": "^12.3.2",
    "jest": "^29.7.0",
    "detox": "^20.13.5"
  }
}
```

---

## 2. Functional Requirements

### FR-1: Node Management

#### FR-1.1: Configure Node Types
**Priority**: Must Have
**User Story**: As a user, I want to configure 4 types of nodes to simulate different blockchain components.

**Acceptance Criteria**:
- ✅ Support 4 node types:
  1. **Channel Nodes**: Message routing with 3 algorithms (round-robin, least-connections, weighted)
  2. **Validator Nodes**: HyperRAFT++ consensus with FOLLOWER/CANDIDATE/LEADER states
  3. **Business Nodes**: Transaction processing with queue management
  4. **Slim Nodes**: External feed integration (Alpaca, Weather, X/Twitter)

- ✅ Each node type has configurable parameters:
  - Channel: maxConnections (10-500), routingAlgorithm, bufferSize (1K-100K), timeout (5s-60s)
  - Validator: stakeAmount, votingPower, consensusTimeout, maxBlockSize
  - Business: processingCapacity, queueSize, batchSize, parallelThreads
  - Slim: feedType, updateFrequency, apiKey, symbols/locations/topics

- ✅ Add/remove nodes dynamically (minimum 1 node, maximum 50 nodes total)
- ✅ Enable/disable individual nodes
- ✅ Save/load node configurations

#### FR-1.2: Node State Visualization
**Priority**: Must Have
**User Story**: As a user, I want to see real-time state of all configured nodes.

**Acceptance Criteria**:
- ✅ Display node list with:
  - Node type icon (color-coded)
  - Node name
  - Current state (badge with color indicator)
  - Key metrics (1-2 primary metrics per type)
- ✅ Tap node to view detailed metrics
- ✅ Long-press node for quick actions (pause/resume, delete)
- ✅ Visual indicators for state changes (animated transitions)

### FR-2: Real-Time Dashboards

#### FR-2.1: Spatial Dashboard (3D/Spatial View)
**Priority**: Must Have
**User Story**: As a user, I want to see nodes arranged in a spatial layout with visual connections.

**Acceptance Criteria**:
- ✅ 2D spatial canvas (3D optional for iOS/Android AR if time permits)
- ✅ Nodes positioned in logical groups:
  - Slim nodes (top) → Channel nodes (middle) → Validator nodes (bottom)
  - Business nodes (side panel or integrated)
- ✅ Animated connections showing message flow
- ✅ Color-coded nodes by state:
  - Green: Active/healthy
  - Yellow: Warning/overload
  - Red: Error/disconnected
  - Blue: Leader (validators only)
- ✅ Tap node to highlight connections
- ✅ Pinch-to-zoom, pan gestures
- ✅ Auto-layout algorithm (force-directed or hierarchical)

#### FR-2.2: Vizor Real-Time Dashboard
**Priority**: Must Have
**User Story**: As a user, I want to monitor system performance through real-time charts and metrics.

**Acceptance Criteria**:
- ✅ **4 Primary Charts**:
  1. **TPS Chart** (Line): System-wide transactions per second
  2. **Consensus Chart** (Multi-line): Blocks validated + Consensus rounds
  3. **API Feeds Chart** (Bar): API calls and data points per provider
  4. **Finality Latency Chart** (Line): Block finalization time

- ✅ **6 Key Metrics Cards**:
  1. Current TPS (large number with trend indicator)
  2. Target TPS (with efficiency percentage)
  3. Total Transactions (cumulative count)
  4. Active Nodes (count by type)
  5. Consensus State (current leader, term number)
  6. Avg Finality Latency (milliseconds)

- ✅ Charts update every 1-5 seconds (configurable based on performance mode)
- ✅ 60-second data window (60 data points)
- ✅ Tap chart to view full-screen
- ✅ Export chart data as CSV/JSON

#### FR-2.3: Dashboard Switching
**Priority**: Must Have
**User Story**: As a user, I want to switch between Spatial and Vizor dashboards seamlessly.

**Acceptance Criteria**:
- ✅ Tab navigation or swipe gesture to switch
- ✅ Preserve state when switching (no data loss)
- ✅ Both dashboards update simultaneously in background
- ✅ Visual indicator showing active dashboard

### FR-3: External Feed Integration (Slim Nodes)

#### FR-3.1: Alpaca Market Data Feed
**Priority**: Must Have
**User Story**: As a user, I want to integrate live stock market data from Alpaca API.

**Acceptance Criteria**:
- ✅ Configure Alpaca API credentials (key + secret)
- ✅ Select 1-8 stock symbols (AAPL, GOOGL, MSFT, AMZN, TSLA, META, NVDA, AMD)
- ✅ Update frequency: 1-60 seconds (configurable)
- ✅ Display real-time:
  - Current price
  - Price change ($)
  - Price change (%)
  - Volume
  - Timestamp
- ✅ Demo mode with realistic mock data when API key is missing
- ✅ Rate limiting: 60 requests/minute (Alpaca free tier)
- ✅ Error handling with retry (3 attempts with exponential backoff)

#### FR-3.2: OpenWeatherMap Feed
**Priority**: Must Have
**User Story**: As a user, I want to integrate weather data from OpenWeatherMap API.

**Acceptance Criteria**:
- ✅ Configure OpenWeatherMap API key
- ✅ Select 1-4 locations (default: New York, London, Tokyo, Singapore)
- ✅ Update frequency: 5-300 seconds (configurable, API allows 60 calls/minute)
- ✅ Display real-time:
  - Temperature (Celsius)
  - Humidity (%)
  - Pressure (hPa)
  - Wind speed (m/s)
  - Weather description
  - Timestamp
- ✅ Demo mode with mock weather data
- ✅ Rate limiting: 60 requests/minute
- ✅ Error handling with retry

#### FR-3.3: X.com (Twitter) Social Feed
**Priority**: Should Have
**User Story**: As a user, I want to integrate social media sentiment from X/Twitter API.

**Acceptance Criteria**:
- ✅ Configure X API Bearer token
- ✅ Select 1-5 topics/hashtags (default: #blockchain, #crypto, #DeFi, #Web3, #Aurigraph)
- ✅ Update frequency: 10-300 seconds (rate limited by X API)
- ✅ Display for each topic:
  - Sample tweet text
  - Username
  - Likes/retweets/replies count
  - Sentiment analysis (positive/neutral/negative)
  - Sentiment score (0.0-1.0)
  - Engagement score
  - Timestamp
- ✅ Demo mode with realistic mock tweets and sentiment
- ✅ Rate limiting: Respect X API tier limits
- ✅ Error handling with retry

### FR-4: Performance Modes (Scalability Tiers)

#### FR-4.1: Mode Selection
**Priority**: Must Have
**User Story**: As a user, I want to select different performance modes to test various throughput levels.

**Acceptance Criteria**:
- ✅ Support 4 performance modes:
  | Mode | Target TPS | Update Interval | Use Case |
  |------|-----------|-----------------|----------|
  | Educational 📚 | 3K | 100ms | Learning |
  | Development 📻 | 30K | 50ms | Testing |
  | Staging 🔬 | 300K | 25ms | Pre-prod |
  | Production 🚀 | 2M+ | 10ms | Max perf |

- ✅ Mode selector with icons and descriptions
- ✅ Auto-adjust node configuration when switching modes
- ✅ Display current mode in status bar
- ✅ Warn before switching to Production mode (high CPU/battery usage)

#### FR-4.2: Performance Statistics
**Priority**: Must Have
**User Story**: As a user, I want to see how well the system performs against the target TPS.

**Acceptance Criteria**:
- ✅ Display metrics:
  - Actual TPS (real-time)
  - Target TPS (based on mode)
  - Efficiency % (actual/target * 100)
  - Elapsed time
  - Total transactions processed
- ✅ Color-coded efficiency indicator:
  - Green: 90%+ efficiency
  - Yellow: 70-89% efficiency
  - Red: <70% efficiency
- ✅ Historical performance graph (last 5 minutes)

### FR-5: Configuration Management

#### FR-5.1: Save/Load Configurations
**Priority**: Must Have
**User Story**: As a user, I want to save my node configurations for later use.

**Acceptance Criteria**:
- ✅ Save configuration with user-defined name
- ✅ Load saved configurations from list
- ✅ Display configuration metadata:
  - Name
  - Creation timestamp
  - Node count (by type)
  - Performance mode
- ✅ Delete saved configurations
- ✅ Duplicate configuration (create copy)
- ✅ Set default configuration (auto-load on startup)

#### FR-5.2: Import/Export Configurations
**Priority**: Should Have
**User Story**: As a user, I want to import/export configurations as JSON files for sharing.

**Acceptance Criteria**:
- ✅ Export configuration as JSON file
- ✅ Share exported file via native share sheet
- ✅ Import configuration from JSON file (file picker)
- ✅ Validate imported configuration (schema validation)
- ✅ Preview configuration before applying
- ✅ Error handling for invalid JSON

### FR-6: V11 Backend Integration

#### FR-6.1: Connection Management
**Priority**: Must Have
**User Story**: As a user, I want to connect to the Aurigraph V11 backend for real blockchain data.

**Acceptance Criteria**:
- ✅ Configure V11 backend URL (default: http://localhost:9003)
- ✅ Test connection (health check endpoint)
- ✅ Display connection status:
  - Green: Connected
  - Yellow: Connecting/reconnecting
  - Red: Disconnected
- ✅ Auto-reconnect with exponential backoff (10 attempts max)
- ✅ Switch between demo mode (mock data) and live mode (V11 backend)

#### FR-6.2: Real-Time Data Sync
**Priority**: Must Have
**User Story**: As a user, I want to see real-time blockchain data from the V11 backend.

**Acceptance Criteria**:
- ✅ WebSocket connection to `ws://<backend>/ws`
- ✅ Subscribe to channels:
  - `node-updates`: Node state changes
  - `system-metrics`: System-wide metrics
  - `consensus-state`: Consensus updates
- ✅ Fallback to REST API polling if WebSocket unavailable
- ✅ Display data freshness indicator (last update timestamp)
- ✅ Handle disconnections gracefully (show stale data with indicator)

#### FR-6.3: Transaction Submission
**Priority**: Should Have
**User Story**: As a user, I want to submit test transactions to the V11 backend.

**Acceptance Criteria**:
- ✅ Transaction submission form:
  - From address (optional, auto-generated)
  - To address
  - Amount
  - Data/memo (optional)
- ✅ Submit transaction via `POST /api/v11/transactions`
- ✅ Display transaction ID and status
- ✅ Track transaction in blockchain explorer view
- ✅ Error handling for failed transactions

---

## 3. Non-Functional Requirements

### NFR-1: Performance

#### NFR-1.1: Responsiveness
**Priority**: Must Have

**Requirements**:
- ✅ App launch time: <3 seconds (cold start), <1 second (warm start)
- ✅ Screen transition time: <300ms
- ✅ Chart render time: <100ms for 60 data points
- ✅ UI remains responsive during 2M TPS simulation (60 FPS maintained)
- ✅ Node state updates reflected within 500ms of event
- ✅ API request timeout: 30 seconds
- ✅ WebSocket reconnection time: <5 seconds

#### NFR-1.2: Memory Usage
**Priority**: Must Have

**Requirements**:
- ✅ Maximum memory footprint: 150MB (idle), 250MB (active simulation)
- ✅ No memory leaks during 30-minute continuous use
- ✅ Graceful degradation on low-memory devices (reduce chart update frequency)

#### NFR-1.3: Battery Efficiency
**Priority**: Must Have

**Requirements**:
- ✅ Background mode: Pause real-time updates, reduce WebSocket ping frequency
- ✅ Battery saver mode: Reduce chart updates from 1s to 5s, pause animations
- ✅ Maximum battery drain: 10% per hour (active use), 1% per hour (background)
- ✅ Efficient data fetching: Batch API requests, implement request coalescing

### NFR-2: Reliability

#### NFR-2.1: Error Handling
**Priority**: Must Have

**Requirements**:
- ✅ Network errors: Retry with exponential backoff (max 3 attempts)
- ✅ API errors: Display user-friendly error messages
- ✅ Invalid data: Graceful degradation, log errors for debugging
- ✅ Crash-free rate: 99.5%+ (measured over 30-day period)
- ✅ Automatic crash reporting (opt-in, via Firebase Crashlytics or Sentry)

#### NFR-2.2: Offline Support
**Priority**: Should Have

**Requirements**:
- ✅ Demo mode works offline (uses mock data generators)
- ✅ Cached configurations available offline
- ✅ Graceful degradation when backend unreachable
- ✅ Queue transactions for submission when connection restored
- ✅ Display offline indicator in UI

### NFR-3: Usability

#### NFR-3.1: User Interface
**Priority**: Must Have

**Requirements**:
- ✅ Follow platform design guidelines:
  - iOS: Human Interface Guidelines (iOS 14+)
  - Android: Material Design 3
- ✅ Dark mode support (system theme aware)
- ✅ Accessibility:
  - VoiceOver/TalkBack support for all interactive elements
  - Minimum touch target size: 44x44 points (iOS), 48x48 dp (Android)
  - Color contrast ratio: 4.5:1 for text, 3:1 for UI components
  - Dynamic type support (adjustable font sizes)
- ✅ Responsive layouts for tablets (iPad, Android tablets)
- ✅ Smooth animations (60 FPS, no jank)

#### NFR-3.2: Onboarding
**Priority**: Should Have

**Requirements**:
- ✅ First-time user tutorial (3-5 screens):
  1. Welcome + app overview
  2. Node types explanation
  3. Dashboard walkthrough
  4. Performance modes overview
  5. Quick start guide
- ✅ Interactive tooltips for complex features
- ✅ Skip tutorial option
- ✅ Replayable tutorial from settings

#### NFR-3.3: Internationalization (i18n)
**Priority**: Could Have (Phase 2)

**Requirements**:
- ✅ Support for English (default)
- 🔄 Future: Spanish, Chinese (Simplified), Japanese
- ✅ All user-facing strings externalized
- ✅ RTL (Right-to-Left) layout support prepared

### NFR-4: Security

#### NFR-4.1: API Key Storage
**Priority**: Must Have

**Requirements**:
- ✅ Store API keys securely:
  - iOS: Keychain Services
  - Android: EncryptedSharedPreferences (AndroidX Security)
- ✅ Never log API keys in debug/crash reports
- ✅ Mask API keys in UI (show last 4 characters only)
- ✅ Option to clear all API keys

#### NFR-4.2: Network Security
**Priority**: Must Have

**Requirements**:
- ✅ Use HTTPS for all API requests
- ✅ Certificate pinning for production V11 backend
- ✅ WebSocket over TLS (wss://) for production
- ✅ Validate SSL certificates (no self-signed in production)

#### NFR-4.3: Data Privacy
**Priority**: Must Have

**Requirements**:
- ✅ No analytics collection without user consent
- ✅ Privacy policy accessible from settings
- ✅ GDPR compliance (EU users):
  - Opt-in for data collection
  - Right to delete user data
  - Data export functionality
- ✅ No third-party trackers

### NFR-5: Compatibility

#### NFR-5.1: Operating System Versions
**Priority**: Must Have

**Requirements**:
- **Flutter**:
  - iOS: 14.0+ (covers 95%+ of active iPhones as of 2025)
  - Android: API 21+ (Android 5.0+, covers 99%+ of active devices)
- **React Native**:
  - iOS: 14.0+
  - Android: API 21+

#### NFR-5.2: Device Compatibility
**Priority**: Must Have

**Requirements**:
- **iOS**:
  - iPhone: SE (2nd gen), 8, X, 11, 12, 13, 14 series
  - iPad: 7th gen+, Air 3+, Pro 2018+
  - Screen sizes: 4.7" to 12.9"
- **Android**:
  - Manufacturers: Samsung, Google Pixel, OnePlus, Xiaomi
  - Screen sizes: 5.0" to 11" (phones and tablets)
  - Screen densities: mdpi to xxxhdpi (1.0x to 4.0x)

#### NFR-5.3: Network Conditions
**Priority**: Must Have

**Requirements**:
- ✅ Functional on 4G/LTE (1-10 Mbps)
- ✅ Optimized for 5G/WiFi (50+ Mbps)
- ✅ Graceful degradation on 3G (reduce update frequency)
- ✅ Offline mode for demo scenarios

### NFR-6: Maintainability

#### NFR-6.1: Code Quality
**Priority**: Must Have

**Requirements**:
- ✅ Code coverage: 80%+ (unit tests)
- ✅ Linting: Zero errors, minimal warnings
- ✅ Static analysis: Dart Analyzer (Flutter), ESLint + TypeScript (React Native)
- ✅ Code review: All PRs reviewed by 1+ team member
- ✅ Documentation: Inline comments for complex logic, README for each module

#### NFR-6.2: Testing Strategy
**Priority**: Must Have

**Requirements**:
- ✅ **Unit Tests**:
  - All business logic classes
  - Data models and transformations
  - API clients and parsers
  - Target: 80%+ coverage

- ✅ **Widget/Component Tests** (Flutter) / **Component Tests** (React Native):
  - All custom widgets/components
  - User interactions (taps, swipes, form inputs)
  - Target: 70%+ coverage

- ✅ **Integration Tests**:
  - End-to-end user flows (onboarding, node creation, dashboard navigation)
  - API integration with mock server
  - WebSocket reconnection scenarios
  - Target: 5-10 critical paths

- ✅ **Performance Tests**:
  - Chart rendering with 60 data points
  - UI responsiveness during 2M TPS simulation
  - Memory profiling (30-minute continuous use)

#### NFR-6.3: CI/CD Pipeline
**Priority**: Should Have

**Requirements**:
- ✅ Automated builds on commit (GitHub Actions or GitLab CI)
- ✅ Automated testing (unit + integration)
- ✅ Code quality checks (linting, static analysis)
- ✅ Automated deployment to TestFlight (iOS) and Google Play Internal Testing (Android)
- ✅ Build time: <15 minutes

---

## 4. User Interface Requirements

### UI-1: Navigation Structure

#### Primary Navigation (Bottom Tab Bar)
1. **Dashboard Tab** 🏠
   - Default landing screen
   - Toggle between Spatial and Vizor views
   - Quick stats summary

2. **Nodes Tab** 🔗
   - Node list (grouped by type)
   - Add node button (FAB)
   - Node configuration screens

3. **Feeds Tab** 📡
   - External feed management
   - Configure Alpaca, Weather, X APIs
   - Feed data preview

4. **Settings Tab** ⚙️
   - V11 backend configuration
   - Performance mode selection
   - Configuration import/export
   - About and privacy policy

#### Secondary Navigation
- **Node Detail Screen**: Tap node in list or spatial view
- **Chart Full-Screen**: Tap chart to expand
- **Configuration Editor**: Long-press node or tap edit icon

### UI-2: Screen Specifications

#### UI-2.1: Dashboard Screen (Spatial View)

**Layout**:
```
┌─────────────────────────────────────┐
│ [≡] Aurigraph DLT  [Vizor] [⚙️]    │  Header (60dp)
├─────────────────────────────────────┤
│                                     │
│         ┌────┐   ┌────┐            │
│   📡    │ S1 │   │ S2 │   📡       │  Slim Nodes (top)
│         └─┬──┘   └─┬──┘            │
│           │  ╲   ╱  │              │
│           │   ╲ ╱   │              │
│         ┌─▼───▼▼───▼┐              │
│         │  C1    C2 │              │  Channel Nodes (middle)
│         └─┬────┬───┬┘              │
│           │ ╲  │  ╱                │
│           │  ╲ │ ╱                 │
│         ┌─▼───▼▼──▼┐               │
│         │ V1 V2 V3 │               │  Validator Nodes (bottom)
│         └──────────┘               │
│                                     │
│  📊 TPS: 1.2M  ⚡ Efficiency: 95%  │  Metrics Bar
├─────────────────────────────────────┤
│  [Dashboard] [Nodes] [Feeds] [⚙️]  │  Bottom Tab Bar (56dp)
└─────────────────────────────────────┘
```

**Interactions**:
- Pinch-to-zoom spatial canvas (0.5x - 3.0x)
- Pan to move viewport
- Tap node → highlight connections + show quick stats popup
- Double-tap node → navigate to Node Detail screen
- Long-press node → quick actions menu (pause/resume, delete)

**Animations**:
- Message flow: animated dots traveling along connections (60 FPS)
- Node pulse: scale animation on state change (200ms duration)
- Connection fade: opacity animation when node disabled

#### UI-2.2: Dashboard Screen (Vizor View)

**Layout**:
```
┌─────────────────────────────────────┐
│ [≡] Aurigraph DLT [Spatial] [⚙️]   │  Header
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │   TPS: 1,246,392                │ │  Primary Metric Card (large)
│ │   ▲ 12.5% vs target             │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌───────────┐ ┌───────────┐       │
│ │ Blocks    │ │ Consensus │       │  Secondary Metrics (2-column)
│ │ 12,345    │ │ Leader V2 │       │
│ └───────────┘ └───────────┘       │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ TPS Chart                       │ │  Charts (scrollable)
│ │      [Line chart visualization] │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Consensus Chart                 │ │
│ │   [Multi-line chart]            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [More charts scroll down...]        │
├─────────────────────────────────────┤
│  [Dashboard] [Nodes] [Feeds] [⚙️]  │  Bottom Tab Bar
└─────────────────────────────────────┘
```

**Interactions**:
- Vertical scroll to view all charts
- Tap chart → full-screen view with extended history (5 minutes)
- Tap metric card → detailed breakdown
- Pull-to-refresh to reset chart data

#### UI-2.3: Nodes Screen

**Layout**:
```
┌─────────────────────────────────────┐
│ [≡] Nodes              [+] [≡]     │  Header (+ = Add, ≡ = Filter)
├─────────────────────────────────────┤
│ 📡 Slim Nodes (3)          [▼]     │  Expandable Section
│ ┌───────────────────────────────┐ │
│ │ 📈 Alpaca Feed       [ACTIVE] │ │  Node Card
│ │ TPS: 0.2  │  Data: 24         │ │
│ └───────────────────────────────┘ │
│ ┌───────────────────────────────┐ │
│ │ 🌤️ Weather Feed     [ACTIVE] │ │
│ │ TPS: 0.06 │  Data: 4          │ │
│ └───────────────────────────────┘ │
│                                     │
│ 🔗 Channel Nodes (2)       [▼]     │
│ ┌───────────────────────────────┐ │
│ │ Channel 1           [ROUTING] │ │
│ │ Throughput: 120K  │  Queue: 0 │ │
│ └───────────────────────────────┘ │
│                                     │
│ ⚡ Validator Nodes (3)     [▼]     │
│ 🏢 Business Nodes (1)      [▼]     │
│                                     │
├─────────────────────────────────────┤
│  [Dashboard] [Nodes] [Feeds] [⚙️]  │
└─────────────────────────────────────┘
```

**Interactions**:
- Tap section header → expand/collapse section
- Tap node card → Node Detail screen
- Swipe node card left → Delete action
- Swipe node card right → Pause/Resume toggle
- Tap [+] button → Add Node bottom sheet

#### UI-2.4: Add Node Bottom Sheet

**Layout**:
```
┌─────────────────────────────────────┐
│                                     │  Backdrop (darkened)
│     ╭───────────────────────────╮  │
│     │ Add Node              [✕] │  │  Bottom Sheet (70% height)
│     ├───────────────────────────┤  │
│     │                           │  │
│     │ Select Node Type:         │  │
│     │                           │  │
│     │ [ 📡 Slim Node        ] │  │
│     │ [ 🔗 Channel Node     ] │  │
│     │ [ ⚡ Validator Node   ] │  │
│     │ [ 🏢 Business Node    ] │  │
│     │                           │  │
│     ╰───────────────────────────╯  │
└─────────────────────────────────────┘
```

**Interaction**:
- Tap node type → Configuration form for selected type
- Swipe down or tap [✕] → Dismiss bottom sheet
- Animated slide-up entrance (300ms)

#### UI-2.5: Node Detail Screen

**Layout**:
```
┌─────────────────────────────────────┐
│ [←] Alpaca Feed            [⋮]     │  Header (back + actions menu)
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Status: ACTIVE ✅               │ │  Status Card
│ │ Type: Slim (Alpaca)             │ │
│ │ Uptime: 2h 15m                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Metrics                         │ │  Metrics Card
│ │ Feed Rate: 1.6 data/sec         │ │
│ │ Total Data: 11,520 points       │ │
│ │ API Calls: 144                  │ │
│ │ Success Rate: 98.6%             │ │
│ │ Latency: 125ms                  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Configuration                   │ │  Config Card (expandable)
│ │ Symbols: AAPL, GOOGL, MSFT...   │ │
│ │ Update Frequency: 5s            │ │
│ │ Rate Limit: 60 req/min          │ │
│ │ [Edit Configuration]            │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Live Data                       │ │  Live Data Card
│ │ AAPL: $175.24 (+0.82%)          │ │
│ │ GOOGL: $140.15 (-0.23%)         │ │
│ │ [See All]                       │ │
│ └─────────────────────────────────┘ │
│                                     │
├─────────────────────────────────────┤
│ [Pause Node]  [Delete Node]        │  Action Buttons
└─────────────────────────────────────┘
```

#### UI-2.6: Settings Screen

**Layout**:
```
┌─────────────────────────────────────┐
│ [≡] Settings                       │  Header
├─────────────────────────────────────┤
│ V11 Backend                         │  Section
│ ┌───────────────────────────────┐ │
│ │ URL: http://localhost:9003    │ │
│ │ Status: Connected ✅          │ │
│ │ [Test Connection]             │ │
│ └───────────────────────────────┘ │
│                                     │
│ Performance Mode                    │  Section
│ ┌───────────────────────────────┐ │
│ │ ○ Educational (3K TPS)        │ │
│ │ ● Development (30K TPS)       │ │
│ │ ○ Staging (300K TPS)          │ │
│ │ ○ Production (2M+ TPS)        │ │
│ └───────────────────────────────┘ │
│                                     │
│ Configuration                       │  Section
│ │ [📥 Import Configuration]     │ │
│ │ [📤 Export Configuration]     │ │
│ │ [🗑️ Clear All Data]           │ │
│                                     │
│ App                                 │  Section
│ │ Version: 1.0.0 (Build 1)      │ │
│ │ [Privacy Policy]              │ │
│ │ [About]                       │ │
│ │ [Send Feedback]               │ │
│                                     │
├─────────────────────────────────────┤
│  [Dashboard] [Nodes] [Feeds] [⚙️]  │
└─────────────────────────────────────┘
```

---

## 5. Data Requirements

### DR-1: Local Storage Schema

#### DR-1.1: Configuration Storage (JSON)

**Storage Location**:
- Flutter: SharedPreferences + Hive
- React Native: AsyncStorage

**Schema**:
```json
{
  "configs": [
    {
      "id": "uuid-v4",
      "name": "Production Test Config",
      "created": "2025-10-09T12:00:00Z",
      "modified": "2025-10-09T14:30:00Z",
      "isDefault": true,
      "performanceMode": "development",
      "nodes": [
        {
          "id": "node-slim-alpaca-001",
          "type": "slim",
          "name": "Alpaca Market Feed",
          "enabled": true,
          "config": { ... }
        }
      ]
    }
  ],
  "settings": {
    "v11Backend": {
      "url": "http://localhost:9003",
      "wsUrl": "ws://localhost:9003/ws",
      "useDemo": false
    },
    "theme": "system",
    "performanceMode": "development",
    "tutorialCompleted": true
  },
  "apiKeys": {
    // Stored in secure storage (Keychain/EncryptedSharedPreferences)
    "alpaca": { "key": "...", "secret": "..." },
    "openweathermap": "...",
    "twitter": "..."
  }
}
```

#### DR-1.2: Metrics Cache (Short-lived)

**Purpose**: Cache real-time metrics for offline viewing and chart rendering
**TTL**: 5 minutes
**Max Size**: 10MB

**Schema**:
```json
{
  "timestamp": "2025-10-09T14:30:00Z",
  "systemMetrics": {
    "tps": 1246392,
    "totalTransactions": 12453920000,
    "activeNodes": 12,
    "consensusState": {
      "currentLeader": "node-validator-002",
      "term": 42,
      "blocksValidated": 12345
    }
  },
  "nodeMetrics": {
    "node-channel-001": { ... },
    "node-validator-001": { ... }
  },
  "chartData": {
    "tps": [
      { "time": "14:29:00", "value": 1200000 },
      { "time": "14:29:01", "value": 1250000 }
      // ... 60 data points
    ],
    "consensus": { ... }
  }
}
```

---

## 6. API Integration Requirements

### API-1: V11 Backend REST API

**Base URL**: `http://localhost:9003/api/v11` (configurable)

#### Required Endpoints

| Method | Endpoint | Purpose | Response Time |
|--------|----------|---------|---------------|
| GET | `/health` | Health check | <50ms |
| GET | `/info` | System info | <50ms |
| GET | `/performance` | Perf stats | <100ms |
| GET | `/stats` | Transaction stats | <100ms |
| GET | `/consensus/nodes` | Consensus state | <100ms |
| GET | `/nodes` | All nodes | <100ms |
| POST | `/transactions` | Submit transaction | <200ms |
| GET | `/channels` | All channels | <100ms |
| POST | `/channels` | Create channel | <200ms |

#### Error Handling
- **Timeout**: 30 seconds
- **Retry**: 3 attempts with exponential backoff (1s, 2s, 4s)
- **Fallback**: Switch to demo mode on repeated failures

### API-2: WebSocket (V11 Backend)

**URL**: `ws://localhost:9003/ws` (configurable)

#### Message Protocol

**Client → Server**:
```json
{
  "type": "subscribe|unsubscribe|ping|request",
  "data": {
    "channel": "node-updates|system-metrics|consensus-state",
    "nodeId": "optional-node-id"
  },
  "timestamp": 1696867200000,
  "id": "msg-uuid"
}
```

**Server → Client**:
```json
{
  "type": "pong|node-update|system-metrics|consensus-update",
  "data": { ... },
  "timestamp": 1696867200000
}
```

#### Reconnection Strategy
- Initial connect timeout: 10 seconds
- Reconnect attempts: 10
- Reconnect delay: Exponential backoff (1s, 2s, 4s, 8s, ..., 60s max)
- Heartbeat interval: 30 seconds
- Pong timeout: 10 seconds

### API-3: External Feeds (Slim Nodes)

#### API-3.1: Alpaca Markets API
- **Endpoint**: `https://data.alpaca.markets/v2/stocks/quotes/latest`
- **Auth**: `APCA-API-KEY-ID` + `APCA-API-SECRET-KEY` headers
- **Rate Limit**: 200 requests/minute (free tier)
- **Response Time**: <500ms (typical)

#### API-3.2: OpenWeatherMap API
- **Endpoint**: `https://api.openweathermap.org/data/2.5/weather`
- **Auth**: `appid` query parameter
- **Rate Limit**: 60 requests/minute (free tier)
- **Response Time**: <300ms (typical)

#### API-3.3: X.com (Twitter) API v2
- **Endpoint**: `https://api.twitter.com/2/tweets/search/recent`
- **Auth**: `Authorization: Bearer <token>` header
- **Rate Limit**: Varies by tier (15-450 requests/15min)
- **Response Time**: <1000ms (typical)

---

## 7. Testing Requirements

### Test-1: Unit Testing

**Target Coverage**: 80%+

**Test Suites** (Flutter):
- `test/models/` - Data models and serialization
- `test/blocs/` - BLoC state management logic
- `test/repositories/` - API clients and data fetching
- `test/services/` - Business logic services
- `test/utils/` - Utility functions

**Test Suites** (React Native):
- `__tests__/models/` - Data models
- `__tests__/redux/` - Redux reducers and actions
- `__tests__/api/` - API clients
- `__tests__/services/` - Business logic
- `__tests__/utils/` - Utilities

**Example Test Cases**:
```dart
// Flutter: BLoC test
test('ChannelNodeBloc emits routing state when started', () async {
  final bloc = ChannelNodeBloc(config);

  bloc.add(InitializeChannelNode());
  await expectLater(
    bloc.stream,
    emitsInOrder([
      isA<ChannelNodeConnected>(),
    ]),
  );

  bloc.add(StartChannelNode());
  await expectLater(
    bloc.stream,
    emitsInOrder([
      isA<ChannelNodeRouting>(),
    ]),
  );
});
```

```typescript
// React Native: Redux test
describe('channelNodeReducer', () => {
  it('should start routing when START_CHANNEL_NODE is dispatched', () => {
    const initialState = {
      state: 'CONNECTED',
      metrics: { ... }
    };

    const action = { type: 'START_CHANNEL_NODE' };
    const nextState = channelNodeReducer(initialState, action);

    expect(nextState.state).toBe('ROUTING');
  });
});
```

### Test-2: Widget/Component Testing

**Target Coverage**: 70%+

**Test Scenarios**:
- Render node card with correct data
- Tap node card navigates to detail screen
- Swipe node card shows delete action
- Chart renders with 60 data points
- Dashboard switches between Spatial and Vizor views
- Add node bottom sheet displays and dismisses correctly

**Example Test**:
```dart
// Flutter: Widget test
testWidgets('Node card displays correct data', (tester) async {
  final node = ChannelNode(id: '1', name: 'Channel 1', ...);

  await tester.pumpWidget(
    MaterialApp(
      home: NodeCard(node: node),
    ),
  );

  expect(find.text('Channel 1'), findsOneWidget);
  expect(find.text('ROUTING'), findsOneWidget);
  expect(find.byIcon(Icons.router), findsOneWidget);
});
```

### Test-3: Integration Testing

**Test Flows**:
1. **Onboarding Flow**:
   - Launch app → Tutorial screens → Skip → Dashboard

2. **Node Management Flow**:
   - Navigate to Nodes → Add Slim Node → Configure Alpaca → Save → Verify in list

3. **Dashboard Flow**:
   - Dashboard → Switch to Vizor → Tap TPS chart → Full-screen → Back

4. **Configuration Flow**:
   - Settings → Export config → Import config → Verify nodes loaded

5. **V11 Backend Flow**:
   - Settings → Configure V11 URL → Test connection → Subscribe to metrics → Verify real-time updates

**Example Test** (Flutter):
```dart
// Integration test
testWidgets('Add Alpaca slim node end-to-end', (tester) async {
  await tester.pumpWidget(MyApp());

  // Navigate to Nodes tab
  await tester.tap(find.byIcon(Icons.developer_board));
  await tester.pumpAndSettle();

  // Tap Add button
  await tester.tap(find.byIcon(Icons.add));
  await tester.pumpAndSettle();

  // Select Slim Node
  await tester.tap(find.text('Slim Node'));
  await tester.pumpAndSettle();

  // Configure
  await tester.enterText(find.byKey(Key('node_name')), 'Alpaca Feed');
  await tester.tap(find.text('Alpaca'));
  await tester.tap(find.text('Save'));
  await tester.pumpAndSettle();

  // Verify node appears in list
  expect(find.text('Alpaca Feed'), findsOneWidget);
});
```

### Test-4: Performance Testing

**Metrics to Measure**:
1. **App Launch Time**: <3s (cold), <1s (warm)
2. **Chart Render Time**: <100ms (60 data points)
3. **Memory Usage**: <250MB (active)
4. **Frame Rate**: 60 FPS (no jank)
5. **Battery Drain**: <10% per hour

**Tools**:
- Flutter: Flutter DevTools (Performance tab)
- React Native: Flipper Performance Monitor

**Test Scenarios**:
- Launch app and measure startup time
- Simulate 2M TPS in Production mode → measure FPS
- Run app for 30 minutes → measure memory usage
- Run app for 1 hour on battery → measure battery drain

---

## 8. Deployment Requirements

### Deploy-1: App Store Requirements

#### iOS (App Store)
- **Bundle ID**: `io.aurigraph.dlt.mobile` (Flutter), `io.aurigraph.dlt.rn` (React Native)
- **Min iOS Version**: 14.0
- **Categories**: Utilities, Developer Tools
- **Privacy Manifest**: Required (iOS 17+)
- **Screenshots**: 6.7" (iPhone 14 Pro Max), 12.9" (iPad Pro)
- **App Store Description**: 250 characters (short), 4000 characters (long)
- **Keywords**: blockchain, DLT, visualization, demo, aurigraph
- **App Icon**: 1024x1024px (required sizes generated)

#### Android (Google Play)
- **Package Name**: `io.aurigraph.dlt.mobile` (Flutter), `io.aurigraph.dlt.rn` (React Native)
- **Min SDK**: 21 (Android 5.0)
- **Target SDK**: 34 (Android 14)
- **Categories**: Tools, Business
- **Screenshots**: Phone (5"), Tablet (10")
- **Feature Graphic**: 1024x500px
- **Google Play Description**: 80 characters (short), 4000 characters (long)
- **Keywords**: Same as iOS
- **App Icon**: 512x512px (adaptive icon for Android 8+)

### Deploy-2: Build Configuration

#### Flutter
**Flavors**:
- `development`: Points to localhost V11 backend, debug logging
- `staging`: Points to staging server, limited logging
- `production`: Points to production server, crash reporting only

**Build Commands**:
```bash
# Development
flutter build apk --flavor development --debug
flutter build ios --flavor development --debug

# Staging
flutter build apk --flavor staging --release
flutter build ios --flavor staging --release

# Production
flutter build appbundle --flavor production --release  # Android
flutter build ipa --flavor production --release        # iOS
```

#### React Native
**Schemes** (iOS) / **Product Flavors** (Android):
- `Development`, `Staging`, `Production`

**Build Commands**:
```bash
# Development (iOS)
npx react-native run-ios --scheme Development

# Production (iOS)
cd ios && xcodebuild -workspace AurigraphDLT.xcworkspace \
  -scheme Production -configuration Release archive

# Production (Android)
cd android && ./gradlew assembleProductionRelease
```

### Deploy-3: Release Process

#### Beta Testing
1. **Internal Testing** (Week 1-2):
   - Deploy to TestFlight (iOS) and Google Play Internal Testing (Android)
   - Test on 5-10 devices (various models and OS versions)
   - Collect crash reports and feedback

2. **Closed Beta** (Week 3-4):
   - Expand to 50-100 beta testers
   - Use Firebase App Distribution for additional feedback
   - Iterate on bug fixes and UX improvements

3. **Open Beta** (Optional, Week 5-6):
   - Google Play Open Beta (Android only, easier than TestFlight)
   - Collect public feedback

#### Production Release
1. **Pre-launch Checklist**:
   - ✅ All unit tests passing (80%+ coverage)
   - ✅ Integration tests passing (5-10 flows)
   - ✅ Performance tests passing (launch time, memory, FPS)
   - ✅ Security review completed (API key storage, HTTPS)
   - ✅ Privacy policy published
   - ✅ App Store/Play Store metadata ready (screenshots, descriptions)
   - ✅ Crash reporting enabled (Firebase Crashlytics or Sentry)

2. **Phased Rollout**:
   - **Day 1**: 10% rollout (monitor crash rate)
   - **Day 3**: 25% rollout (if crash-free rate >99%)
   - **Day 5**: 50% rollout
   - **Day 7**: 100% rollout

3. **Post-launch Monitoring**:
   - Daily crash rate monitoring (target: <1%)
   - User reviews monitoring (respond within 24h)
   - Analytics monitoring (DAU, retention rate)

---

## 9. Success Metrics

### SM-1: Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Crash-free rate | 99.5%+ | 30-day rolling average |
| App launch time (cold) | <3s | Firebase Performance |
| App launch time (warm) | <1s | Firebase Performance |
| API response time | <500ms | Custom logging |
| Chart render time | <100ms | Custom logging |
| Memory footprint (active) | <250MB | DevTools/Flipper |
| Battery drain (active) | <10%/hour | Manual testing |
| Frame rate | 60 FPS | DevTools/Flipper |

### SM-2: User Experience Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Tutorial completion rate | >70% | Analytics |
| Average session duration | >5 minutes | Analytics |
| Daily active users (DAU) | 100+ (Month 1) | Analytics |
| Retention rate (Day 7) | >40% | Analytics |
| App Store rating | >4.0/5.0 | App Store/Play Store |
| Average reviews | >50 reviews | App Store/Play Store |

### SM-3: Functional Metrics

| Feature | Success Criteria | Measurement |
|---------|-----------------|-------------|
| Node creation | >80% of users create ≥1 node | Analytics |
| Dashboard usage | >60% switch between Spatial/Vizor | Analytics |
| Configuration save | >50% save ≥1 config | Analytics |
| External feed usage | >30% configure ≥1 slim node | Analytics |
| V11 backend connection | >20% connect to live backend | Analytics |

---

## 10. Out of Scope (Phase 2+)

### Features NOT Included in Phase 1

1. **Advanced Analytics**:
   - Historical data export (CSV, Excel)
   - Custom chart builder
   - Alerting and notifications

2. **Multi-user Features**:
   - User accounts and authentication
   - Cloud sync of configurations
   - Sharing configurations with other users

3. **Advanced Networking**:
   - P2P node discovery
   - LAN-based node clustering
   - Multi-backend support (connect to multiple V11 instances)

4. **AR/VR Features**:
   - ARKit/ARCore spatial visualization
   - VR headset support

5. **Web Version**:
   - Flutter Web build
   - React Native Web (not officially supported)

6. **Desktop Apps**:
   - macOS app (Flutter Desktop)
   - Windows app (Flutter Desktop)

7. **Advanced Customization**:
   - Custom node types (user-defined)
   - Plugin system
   - Scripting/automation

---

## 11. Dependencies and Risks

### External Dependencies

| Dependency | Risk Level | Mitigation |
|------------|-----------|------------|
| Aurigraph V11 Backend | Medium | Demo mode works offline |
| Alpaca API | Low | Demo mode with mock data |
| OpenWeatherMap API | Low | Demo mode with mock data |
| X.com API | Medium | Demo mode, X API often rate-limited |
| Chart.js (web) | Low | Mature, stable library |
| FL Chart (Flutter) | Medium | Well-maintained, but mobile-specific issues possible |
| Victory Native (RN) | Medium | Well-maintained, but performance tuning may be needed |

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Poor chart performance on low-end devices | High | Medium | Adaptive update intervals, reduce to 5s on slow devices |
| Battery drain from real-time updates | Medium | High | Background pause, battery saver mode |
| WebSocket instability on mobile networks | Medium | Medium | Auto-reconnect, fallback to REST polling |
| Complex BLoC/Redux state management | Medium | Low | Use proven patterns, extensive testing |
| API rate limiting (external feeds) | Low | Medium | Built-in rate limiting, demo mode fallback |
| App Store rejection | High | Low | Follow guidelines, privacy policy, no dynamic code execution |

---

## 12. Acceptance Criteria Summary

### Must-Have Features (Phase 1 MVP)
✅ 4 node types (Channel, Validator, Business, Slim)
✅ 2 dashboards (Spatial, Vizor)
✅ 3 external feeds (Alpaca, Weather, X)
✅ 4 performance modes (Educational, Development, Staging, Production)
✅ Real-time charts (TPS, Consensus, API Feeds, Finality Latency)
✅ V11 backend integration (REST + WebSocket)
✅ Configuration management (save/load/import/export)
✅ Demo mode (works offline with mock data)
✅ Dark mode support
✅ iOS 14+ and Android 5.0+ support

### Should-Have Features (If Time Permits)
🔄 Transaction submission to V11 backend
🔄 Onboarding tutorial
🔄 Configuration import/export (JSON files)

### Could-Have Features (Phase 2)
⏭️ Internationalization (Spanish, Chinese, Japanese)
⏭️ Cloud sync
⏭️ Advanced analytics and alerts

---

## 13. Approval and Sign-off

**Prepared by**: Claude Code (Aurigraph DLT Development Team)
**Date**: October 9, 2025
**Status**: ✅ Ready for Review

### Reviewers
- [ ] Product Owner: _________________ (Date: ________)
- [ ] Technical Lead: _________________ (Date: ________)
- [ ] QA Lead: _________________ (Date: ________)

### Change Log
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-09 | Claude Code | Initial requirements document |

---

**Next Steps**:
1. ✅ Complete Task 1.1.2 (this document)
2. 🔄 Proceed to Task 1.1.3: API Integration Planning
3. 🔄 Proceed to Task 1.2.1: Enterprise Portal Integration Architecture

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
