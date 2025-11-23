# Aurigraph Enterprise Portal - API Configuration Analysis

## Executive Summary

The Aurigraph Enterprise Portal is a React/TypeScript frontend application (v4.6.0) that connects to the Aurigraph V11 Java/Quarkus backend via REST APIs. The application uses environment-based configuration for API endpoints with production and development modes.

---

## 1. API_BASE_URL Configuration

### Definition Location
**File**: `/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/src/utils/constants.ts`

```typescript
// Line 9
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
```

### Environment Configuration

#### Development (.env.development)
```
VITE_API_BASE_URL=http://localhost:9003/api/v11
VITE_WS_URL=ws://localhost:9003
```

#### Production (.env.production)
```
VITE_API_BASE_URL=https://dlt.aurigraph.io/api/v11
VITE_WS_URL=wss://dlt.aurigraph.io/api/v11
```

### Runtime Behavior
- Uses relative paths by default (empty string if env var not set)
- Proxied through NGINX at `/api/v11/`
- Works on both production and development environments
- Falls back to Vite proxy config if no explicit URL is set

---

## 2. Pages in the Application

### Portal Pages (1 found)

1. **Login.tsx** (`/Users/subbujois/subbuworkingdir/Aurigraph-DLT/enterprise-portal/enterprise-portal/frontend/src/pages/Login.tsx`)
   - Authentication entry point
   - No direct API calls in page (delegated to authService)

**Note**: The portal appears to be primarily component-based rather than page-based routing. Most functionality is implemented as reusable components.

---

## 3. Component API Usage Map

### Total Components: 60+ files

#### Core Dashboard Components
1. **Dashboard.tsx**
   - Uses Redux store (selectSystemMetrics, selectWsConnected)
   - No direct API calls - uses Redux state management
   - Displays mock data for recent activity, contracts, registries

2. **DashboardIntegrated.tsx**
   - Uses AurigraphAPIService for real API calls
   - Polling interval: 5 seconds
   - API Calls:
     - `aurigraphAPI.getBlockchainMetrics()`
     - `aurigraphAPI.getBlocks(10)`
     - `aurigraphAPI.getTransactions(10)`
     - `aurigraphAPI.getValidators()`
     - `aurigraphAPI.getConsensusStatus()`

#### Transaction Components
3. **TransactionExplorer.tsx**
   - Marked with TODO for API integration
   - Endpoint (commented): `/api/v11/blockchain/transactions?${queryParams}`
   - Currently uses mock data generator
   - Connects to Phase2BlockchainResource.java backend

#### Blockchain Explorer Components
4. **BlockExplorer.tsx**
   - Commented endpoint: `/api/v11/blockchain/blocks?limit=20`
   - Status: Awaiting backend integration

5. **EventFilterExplorer.tsx**
   - Endpoint: `/api/v11/blockchain/events/query`
   - Web3 event filtering and exploration

#### Cross-Chain Bridge Components
6. **CrossChainBridge.tsx**
   - Uses ComprehensivePortalService endpoints:
     - `/api/v11/bridge/bridges` (GET)
     - `/api/v11/bridge/transfers?page=${page}&pageSize=${pageSize}` (GET)
     - `/api/v11/bridge/chains` (GET)
     - `/api/v11/bridge/metrics` (GET)
     - `/api/v11/bridge/transfers` (POST)
     - `/api/v11/bridge/transfers/${id}` (GET)

#### Blockchain Integration Components
7. **ERC20TokenManager.tsx**
   - Endpoints:
     - `/api/v11/blockchain/erc20/tokens?chain=${selectedChain}` (GET)
     - `/api/v11/blockchain/erc20/balance` (POST)
     - `/api/v11/blockchain/erc20/${tokenAddress}?chain=${selectedChain}` (GET)

8. **BitcoinUTXOManager.tsx**
   - Endpoints:
     - `/api/v11/blockchain/utxo/address/${address}` (GET)
     - `/api/v11/blockchain/utxo/estimate-fee` (POST)
     - `/api/v11/blockchain/utxo/validate-address/${address}` (GET)

9. **SolanaManager.tsx**
   - Endpoints:
     - `/api/v11/blockchain/solana/account/${publicKey}` (GET)
     - `/api/v11/blockchain/solana/send-transaction` (POST)

10. **CosmosChainManager.tsx**
    - Endpoints:
      - `/api/v11/blockchain/cosmos/account/${cosmosAddress}` (GET)
      - `/api/v11/blockchain/cosmos/validate-tx` (POST)
      - `/api/v11/blockchain/cosmos/submit-tx` (POST)

11. **SubstrateManager.tsx**
    - Endpoints:
      - `/api/v11/blockchain/substrate/account/${substrateAddress}` (GET)
      - `/api/v11/blockchain/substrate/submit-tx` (POST)
      - `/api/v11/blockchain/substrate/runtime-metadata` (GET)
      - `/api/v11/blockchain/substrate/validate-address/${substrateAddress}` (GET)

#### AI & Optimization Components
12. **AIOptimizationControls.tsx**
    - Uses ComprehensivePortalService endpoints:
      - `/api/v11/ai/models` (GET)
      - `/api/v11/ai/metrics` (GET)
      - `/api/v11/ai/predictions` (GET)
      - `/api/v11/ai/models/${modelId}/retrain` (POST)

#### Quantum Security Components
13. **QuantumSecurityPanel.tsx**
    - Endpoint: `/api/v11/security/scan` (POST) (hardcoded: http://localhost:9003)
    - Uses ComprehensivePortalService:
      - `/api/v11/security/status` (GET)
      - `/api/v11/security/keys` (GET)
      - `/api/v11/security/metrics` (GET)
      - `/api/v11/security/audits` (GET)
      - `/api/v11/security/keys/rotate` (POST)

#### Smart Contract Components
14. **SmartContractRegistry.tsx**
    - Uses contractsApi endpoints:
      - `/api/v11/contracts?channelId=${channelId}` (GET)
      - `/api/v11/contracts/${contractId}` (GET)
      - `/api/v11/contracts/deploy` (POST)
      - `/api/v11/contracts/${contractId}/verify` (POST)
      - `/api/v11/contracts/${contractId}/audit` (POST)
      - `/api/v11/contracts/${contractId}/metrics` (GET)

15. **RicardianContractUpload.tsx**
    - Hardcoded endpoints (HTTPS):
      - `https://dlt.aurigraph.io:8443/api/v11/contracts/ricardian/upload` (POST)
      - `https://dlt.aurigraph.io:8443/api/v11/contracts/ricardian` (GET)

#### Real-World Asset Components
16. **RWATRegistry.tsx**
    - Real-world asset tokenization and registry management
    - Token management endpoints

17. **RWATTokenizationForm.tsx**
    - External tokenization form
    - RWAT-specific endpoints

#### Tokenization Components
18. **Tokenization.tsx** / **ExternalAPITokenization.tsx**
    - Hardcoded endpoints (localhost):
      - `http://localhost:9003/api/v11/tokenization/sources` (GET, POST)
      - `http://localhost:9003/api/v11/tokenization/transactions?limit=50` (GET)
      - `http://localhost:9003/api/v11/tokenization/channels/stats` (GET)
      - `http://localhost:9003/api/v11/tokenization/sources/${sourceId}/status` (GET)

#### Validator Components
19. **ValidatorDashboard.tsx**
    - Uses ComprehensivePortalService:
      - `/api/v11/validators` (GET)
      - `/api/v11/validators/${id}` (GET)
      - `/api/v11/validators/staking/info` (GET)
      - `/api/v11/validators/${validatorId}/stake` (POST)

#### Registry Components
20. **TokenizationRegistry.tsx** / **MerkleTreeRegistry.tsx**
    - Registry management
    - Hardcoded API base: `https://dlt.aurigraph.io/api/v11/demo/registry`

#### Demo Components
21. **MerkleRegistryViewer.tsx**
    - Demo registry viewer
    - Hardcoded: `https://dlt.aurigraph.io/api/v11/demo/registry`

---

## 4. API Service Layer

### Primary Services

#### 1. AurigraphAPIService (`AurigraphAPIService.ts`)
- **Framework**: Axios
- **Base URL Detection**:
  - Production: `https://dlt.aurigraph.io/api/v11`
  - Development: `http://localhost:9003/api/v11`
- **JWT Authentication**: Bearer token interceptor
- **Endpoints**:
  - `/health` - System health
  - `/info` - System information
  - `/blockchain/metrics` - Blockchain metrics
  - `/blockchain/stats` - Blockchain statistics
  - `/blocks` - List blocks
  - `/blocks/{hashOrHeight}` - Get specific block
  - `/transactions` - List transactions
  - `/transactions/{hash}` - Get specific transaction
  - `/transactions/submit` - Submit transaction
  - `/transactions/batch` - Batch transaction submission
  - `/validators` - List validators
  - `/validators/{id}` - Get specific validator
  - And many more (see Service file)

#### 2. V11BackendService (`V11BackendService.ts`)
- **Framework**: Fetch API with retry logic (exponential backoff)
- **Base URL**: Uses API_BASE_URL from constants
- **Features**:
  - Retry logic with max 3 attempts
  - Demo mode disabled permanently (only real API)
  - Endpoints:
    - `/api/v11/health`
    - `/api/v11/info`
    - `/api/v11/performance`
    - `/api/v11/stats`

#### 3. ComprehensivePortalService (`ComprehensivePortalService.ts`)
- **Framework**: Fetch API with retry logic
- **Base URL**: `http://localhost:9003` (hardcoded, should use API_BASE_URL)
- **Endpoints** (comprehensive list):
  - Transactions: blockchain/transactions, blockchain/transactions/{hash}, blockchain/transactions/stats
  - Blocks: blockchain/blocks, blockchain/blocks/{height}, blockchain/chain/info
  - Consensus: consensus/metrics
  - Validators: validators, validators/{id}, validators/staking/info, validators/{id}/stake
  - AI: ai/models, ai/metrics, ai/predictions, ai/models/{id}/retrain
  - Security: security/status, security/keys, security/metrics, security/audits, security/keys/rotate
  - Bridge: bridge/bridges, bridge/transfers, bridge/chains, bridge/metrics, bridge/transfers (POST), bridge/transfers/{id}

#### 4. APIClient (`apiClient.ts`)
- **Framework**: Fetch API
- **Features**:
  - JWT token interceptor
  - Token refresh on 401
  - Auto-refresh cookie support
  - Type-safe generic requests
  - Methods: GET, POST, PUT, DELETE

#### 5. ContractsApi (`contractsApi.ts`)
- **Framework**: Fetch API with retry
- **Endpoints**:
  - `/api/v11/contracts` - List/create
  - `/api/v11/contracts/{id}` - Get specific contract
  - `/api/v11/contracts/deploy` - Deploy contract
  - `/api/v11/contracts/{id}/verify` - Verify contract
  - `/api/v11/contracts/{id}/audit` - Audit contract
  - `/api/v11/contracts/{id}/metrics` - Get metrics

#### 6. AuthService (`authService.ts`)
- **Framework**: Fetch API
- **Base URL**: Uses API_BASE_URL
- **Endpoints**:
  - `/api/v11/login/authenticate` - Login
  - `/api/v11/login/verify` - Verify token
  - `/api/v11/login/refresh` - Refresh token
  - `/api/v11/login/logout` - Logout

#### 7. ChannelService (`ChannelService.ts`)
- **Endpoints**:
  - `/api/v11/channels` - List channels
  - `/api/v11/channels/{id}` - Get channel
  - `/api/v11/channels/stats` - Channel statistics
  - `/api/v11/channels/create` - Create channel

#### 8. TokenService (`TokenService.ts`)
- **Endpoints**:
  - `/api/v11/tokens/create` - Create token
  - `/api/v11/tokens/list` - List tokens
  - `/api/v11/tokens/{id}` - Get token
  - `/api/v11/tokens/burn` - Burn tokens
  - `/api/v11/tokens/mint` - Mint tokens
  - `/api/v11/tokens/transfer` - Transfer tokens
  - `/api/v11/tokens/{id}/balance/{address}` - Get balance
  - `/api/v11/tokens/stats` - Token statistics

#### 9. WebSocketService (`websocketService.ts`)
- **WebSocket Endpoint**: `/api/v11/live/stream`
- **Unified live data stream** for real-time updates

---

## 5. Complete V11 API Endpoints Summary

### Authentication
- `POST /api/v11/login/authenticate` - User authentication
- `POST /api/v11/login/verify` - Token verification
- `POST /api/v11/login/refresh` - Token refresh
- `POST /api/v11/login/logout` - Logout

### Health & System
- `GET /api/v11/health` - Health check
- `GET /api/v11/info` - System information
- `GET /api/v11/performance` - Performance metrics
- `GET /api/v11/stats` - All statistics

### Blockchain
- `GET /api/v11/blockchain/metrics` - Blockchain metrics
- `GET /api/v11/blockchain/stats` - Blockchain statistics
- `GET /api/v11/blockchain/blocks` - List blocks
- `GET /api/v11/blockchain/blocks/{height}` - Get block by height
- `GET /api/v11/blockchain/chain/info` - Chain information
- `GET /api/v11/blockchain/transactions` - List transactions
- `GET /api/v11/blockchain/transactions/{hash}` - Get transaction
- `POST /api/v11/blockchain/transactions` - Submit transaction
- `POST /api/v11/blockchain/transactions/batch` - Batch transactions
- `GET /api/v11/blockchain/transactions/stats` - Transaction statistics

### Validators
- `GET /api/v11/validators` - List validators
- `GET /api/v11/validators/{id}` - Get validator
- `GET /api/v11/validators/staking/info` - Staking information
- `POST /api/v11/validators/{id}/stake` - Stake tokens

### Consensus
- `GET /api/v11/consensus/metrics` - Consensus metrics
- `GET /api/v11/consensus/status` - Consensus status

### AI Optimization
- `GET /api/v11/ai/models` - List AI models
- `GET /api/v11/ai/metrics` - AI metrics
- `GET /api/v11/ai/predictions` - Get predictions
- `POST /api/v11/ai/models/{id}/retrain` - Retrain model

### Security
- `GET /api/v11/security/status` - Security status
- `GET /api/v11/security/keys` - List cryptographic keys
- `GET /api/v11/security/metrics` - Security metrics
- `GET /api/v11/security/audits` - Security audits
- `POST /api/v11/security/scan` - Security scan
- `POST /api/v11/security/keys/rotate` - Rotate keys

### Cross-Chain Bridge
- `GET /api/v11/bridge/bridges` - List bridges
- `GET /api/v11/bridge/transfers` - List transfers
- `GET /api/v11/bridge/chains` - Supported chains
- `GET /api/v11/bridge/metrics` - Bridge metrics
- `POST /api/v11/bridge/transfers` - Create transfer
- `GET /api/v11/bridge/transfers/{id}` - Get transfer

### Smart Contracts
- `GET /api/v11/contracts` - List contracts
- `GET /api/v11/contracts/{id}` - Get contract
- `POST /api/v11/contracts/deploy` - Deploy contract
- `POST /api/v11/contracts/{id}/verify` - Verify contract
- `POST /api/v11/contracts/{id}/audit` - Audit contract
- `GET /api/v11/contracts/{id}/metrics` - Contract metrics
- `POST /api/v11/contracts/ricardian/upload` - Upload Ricardian contract
- `GET /api/v11/contracts/ricardian` - List Ricardian contracts

### Channels
- `GET /api/v11/channels` - List channels
- `GET /api/v11/channels/{id}` - Get channel
- `GET /api/v11/channels/stats` - Channel statistics
- `POST /api/v11/channels/create` - Create channel

### Tokens
- `POST /api/v11/tokens/create` - Create token
- `GET /api/v11/tokens/list` - List tokens
- `GET /api/v11/tokens/{id}` - Get token
- `POST /api/v11/tokens/burn` - Burn tokens
- `POST /api/v11/tokens/mint` - Mint tokens
- `POST /api/v11/tokens/transfer` - Transfer tokens
- `GET /api/v11/tokens/{id}/balance/{address}` - Get balance
- `GET /api/v11/tokens/stats` - Token statistics

### Tokenization (External APIs)
- `GET /api/v11/tokenization/sources` - List tokenization sources
- `POST /api/v11/tokenization/sources` - Create source
- `GET /api/v11/tokenization/transactions` - List transactions
- `GET /api/v11/tokenization/channels/stats` - Channel statistics
- `GET /api/v11/tokenization/sources/{id}/status` - Source status

### Blockchain Integrations (ERC20, Bitcoin, Solana, Cosmos, Substrate)
- `GET /api/v11/blockchain/erc20/tokens` - ERC20 tokens
- `POST /api/v11/blockchain/erc20/balance` - ERC20 balance
- `GET /api/v11/blockchain/utxo/address/{address}` - Bitcoin UTXO
- `POST /api/v11/blockchain/utxo/estimate-fee` - Bitcoin fee
- `GET /api/v11/blockchain/solana/account/{publicKey}` - Solana account
- `POST /api/v11/blockchain/solana/send-transaction` - Solana transaction
- `GET /api/v11/blockchain/cosmos/account/{address}` - Cosmos account
- `GET /api/v11/blockchain/substrate/account/{address}` - Substrate account

### WebSocket
- `WS /api/v11/live/stream` - Real-time data stream

---

## 6. Configuration Issues & Hardcoded URLs

### Critical Issues Found

1. **Hardcoded Localhost URLs in Components**
   - `ExternalAPITokenization.tsx`: Uses `http://localhost:9003/api/v11/tokenization/*`
   - `QuantumSecurityPanel.tsx`: Uses `http://localhost:9003/api/v11/security/scan`
   - **Status**: Development only, should use API_BASE_URL
   - **Impact**: Will fail in production without configuration change

2. **Hardcoded Production URLs**
   - `RicardianContractUpload.tsx`: Uses `https://dlt.aurigraph.io:8443/api/v11/contracts/ricardian/*` (port 8443)
   - **Status**: Hardcoded production endpoint
   - **Issue**: Port 8443 may not be correct; should use same base URL as other endpoints

3. **Demo Registry with Hardcoded URL**
   - `MerkleRegistryViewer.tsx`: Uses `https://dlt.aurigraph.io/api/v11/demo/registry`
   - **Status**: Demo endpoint only

### Configuration Recommendations

1. Use environment variables for all API endpoints
2. Replace hardcoded localhost/production URLs with API_BASE_URL
3. Create unified API endpoint constants file
4. Update ComprehensivePortalService to use API_BASE_URL instead of hardcoded `http://localhost:9003`

---

## 7. Development Server Configuration

### Vite Proxy Settings (`vite.config.ts`)
```typescript
proxy: {
  '/api': {
    target: 'http://localhost:9003',
    changeOrigin: true,
    secure: false,
  },
  '/ws': {
    target: 'ws://localhost:9003',
    ws: true,
  },
}
```

### Development Server
- **Port**: 3000
- **Proxy Target**: `http://localhost:9003` (V11 Backend)
- **Open**: Auto-opens browser on `npm run dev`

---

## 8. Feature Flags

### Development (.env.development)
```
VITE_ENABLE_DEMO_MODE=true
VITE_ENABLE_EXTERNAL_API_TOKENIZATION=true
VITE_ENABLE_TOKEN_MANAGEMENT=true
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

### Production (.env.production)
```
VITE_ENABLE_DEMO_MODE=false
VITE_ENABLE_EXTERNAL_API_TOKENIZATION=true
VITE_ENABLE_TOKEN_MANAGEMENT=true
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=info
```

---

## 9. Summary & Recommendations

### Current State
- Portal v4.6.0 with 60+ React components
- Dual API client layer (Axios + Fetch)
- Environment-based configuration
- Production URL: `https://dlt.aurigraph.io/api/v11`
- Development URL: `http://localhost:9003/api/v11`

### Critical Actions Needed
1. Eliminate hardcoded localhost URLs in production components
2. Fix port 8443 in RicardianContractUpload.tsx
3. Update ComprehensivePortalService base URL configuration
4. Create centralized endpoint configuration file
5. Add configuration validation on app startup

### API Maturity Assessment
- Health & System: Complete
- Blockchain Core: In progress (multiple TODO markers)
- Authentication: Complete
- Validators & Consensus: Complete
- AI Optimization: Planned
- Security: Planned
- Cross-chain Bridge: Partial
- Smart Contracts: Partial
- Token Management: Partial
- Demo Features: In progress

