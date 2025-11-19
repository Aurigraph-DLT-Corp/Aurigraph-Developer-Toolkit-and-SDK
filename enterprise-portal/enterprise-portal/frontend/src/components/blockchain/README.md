# Aurigraph DLT Phase 11 - Blockchain Components

Comprehensive blockchain management UI components for the Aurigraph DLT Enterprise Portal. Supports 6 major blockchain ecosystems with 30+ networks.

## Quick Start

### Installation

All components are pre-built and ready to use. No additional installation required.

### Import Components

```typescript
import {
  BlockchainDashboard,
  ERC20TokenManager,
  EventFilterExplorer,
  BitcoinUTXOManager,
  CosmosChainManager,
  SolanaManager,
  SubstrateManager,
} from './components/blockchain';
```

### Basic Usage

```typescript
import { BlockchainDashboard } from './components/blockchain';

function App() {
  return (
    <div>
      <BlockchainDashboard />
    </div>
  );
}
```

## Components Overview

### 1. BlockchainDashboard
Central hub providing access to all blockchain managers.

**Features**:
- Manager cards with quick access
- Network statistics overview
- Network explorer tabs
- Feature discovery

**Location**: `BlockchainDashboard.tsx`

### 2. ERC20TokenManager
EVM-based token management for multiple chains.

**Chains Supported**: Ethereum, Polygon, Arbitrum, Optimism, BSC

**Features**:
- Token list with search
- Balance queries
- Token details display
- Statistics dashboard

**Location**: `ERC20TokenManager.tsx`

**Example Usage**:
```typescript
import { ERC20TokenManager } from './components/blockchain';

<ERC20TokenManager />
```

### 3. EventFilterExplorer
Advanced blockchain event filtering and querying.

**Chains Supported**: Ethereum, Polygon, Arbitrum, Optimism

**Features**:
- Event filtering with custom criteria
- Historical event queries
- Event statistics
- Detailed event view

**Location**: `EventFilterExplorer.tsx`

**Example Usage**:
```typescript
import { EventFilterExplorer } from './components/blockchain';

<EventFilterExplorer />
```

### 4. BitcoinUTXOManager
UTXO-based blockchain management.

**Chains Supported**: Bitcoin (mainnet/testnet), Litecoin, Dogecoin

**Features**:
- UTXO querying
- Fee estimation with SegWit support
- Address validation
- Change calculation

**Location**: `BitcoinUTXOManager.tsx`

**Example Usage**:
```typescript
import { BitcoinUTXOManager } from './components/blockchain';

<BitcoinUTXOManager />
```

### 5. CosmosChainManager
Cosmos ecosystem chain management.

**Chains Supported**: Cosmos Hub, Osmosis, Akash, Juno, Stargaze

**Features**:
- Account querying
- Transaction submission with validation
- Denomination handling
- Transaction history

**Location**: `CosmosChainManager.tsx`

**Example Usage**:
```typescript
import { CosmosChainManager } from './components/blockchain';

<CosmosChainManager />
```

### 6. SolanaManager
Solana blockchain account and transaction management.

**Chains Supported**: Mainnet Beta, Testnet, Devnet

**Features**:
- Account connection
- SOL transfers
- Transaction tracking
- Cluster selection

**Location**: `SolanaManager.tsx`

**Example Usage**:
```typescript
import { SolanaManager } from './components/blockchain';

<SolanaManager />
```

### 7. SubstrateManager
Substrate/Polkadot ecosystem management.

**Chains Supported**: Polkadot, Kusama, Acala, Moonbeam

**Features**:
- Account querying with SS58 validation
- Extrinsic submission
- Runtime metadata viewing
- Nonce tracking

**Location**: `SubstrateManager.tsx`

**Example Usage**:
```typescript
import { SubstrateManager } from './components/blockchain';

<SubstrateManager />
```

## Hooks

### useBlockchainAPI

General-purpose API client for blockchain operations.

```typescript
import { useBlockchainAPI } from '../hooks/useBlockchainAPI';

const { loading, error, data, callAPI } = useBlockchainAPI();

const result = await callAPI('get', '/blockchain/erc20/tokens', { chain: 'ethereum' });
```

### useERC20

Specialized hook for ERC20 operations.

```typescript
import { useERC20 } from '../hooks/useBlockchainAPI';

const { getTokens, getBalance, getTokenDetails, loading } = useERC20();

const balance = await getBalance(tokenAddress, walletAddress, 'ethereum');
```

### useBitcoinUTXO

Specialized hook for Bitcoin UTXO operations.

```typescript
import { useBitcoinUTXO } from '../hooks/useBlockchainAPI';

const { getUTXOs, estimateFee, validateAddress, loading } = useBitcoinUTXO();

const utxos = await getUTXOs(address, 'bitcoin');
```

### useCosmos

Specialized hook for Cosmos operations.

```typescript
import { useCosmos } from '../hooks/useBlockchainAPI';

const { getAccount, submitTransaction, queryTransactionStatus, loading } = useCosmos();

const account = await getAccount(address, 'cosmoshub');
```

### useSolana

Specialized hook for Solana operations.

```typescript
import { useSolana } from '../hooks/useBlockchainAPI';

const { getAccount, sendTransaction, loading } = useSolana();

const account = await getAccount(publicKey, 'mainnet');
```

### useSubstrate

Specialized hook for Substrate operations.

```typescript
import { useSubstrate } from '../hooks/useBlockchainAPI';

const { getAccount, submitExtrinsic, getRuntimeMetadata, validateAddress, loading } = useSubstrate();

const account = await getAccount(address, 'polkadot');
```

### useBlockchainEvents

Specialized hook for event filtering.

```typescript
import { useBlockchainEvents } from '../hooks/useBlockchainAPI';

const { queryEvents, loading } = useBlockchainEvents();

const events = await queryEvents({
  eventSignatures: ['Transfer(address,address,uint256)'],
  fromBlock: 1000000,
  toBlock: 1000100,
});
```

## Configuration

### BLOCKCHAIN_MANAGERS

Array of manager metadata for routing and navigation.

```typescript
import { BLOCKCHAIN_MANAGERS } from './index';

BLOCKCHAIN_MANAGERS.forEach(manager => {
  console.log(manager.name, manager.chains, manager.features);
});
```

### BLOCKCHAIN_NETWORKS

Centralized network configuration.

```typescript
import { BLOCKCHAIN_NETWORKS } from './index';

const ethConfig = BLOCKCHAIN_NETWORKS.ethereum;
console.log(ethConfig.name, ethConfig.chainId, ethConfig.rpcEndpoint);
```

## Environment Variables

Required environment variables for proper operation:

```bash
# API Base URL
REACT_APP_API_BASE_URL=https://dlt.aurigraph.io/api/v11

# Authentication (if required)
REACT_APP_API_KEY=your-api-key-here

# Optional: Custom RPC endpoints per chain
REACT_APP_ETH_RPC=https://eth-mainnet.g.alchemy.com/v2/...
REACT_APP_POLYGON_RPC=https://polygon-rpc.com
```

## API Endpoints

All components use the following base endpoints (assuming `REACT_APP_API_BASE_URL` is set):

### ERC20
- `GET /blockchain/erc20/tokens` - List tokens
- `POST /blockchain/erc20/balance` - Query balance
- `GET /blockchain/erc20/{address}` - Token details

### Events
- `POST /blockchain/events/query` - Query events

### Bitcoin/UTXO
- `GET /blockchain/utxo/address/{address}` - Get UTXOs
- `POST /blockchain/utxo/estimate-fee` - Estimate fee
- `GET /blockchain/utxo/validate-address/{address}` - Validate address
- `POST /blockchain/utxo/calculate-change` - Calculate change

### Cosmos
- `GET /blockchain/cosmos/account/{address}` - Get account
- `POST /blockchain/cosmos/validate-tx` - Validate transaction
- `POST /blockchain/cosmos/submit-tx` - Submit transaction
- `GET /blockchain/cosmos/tx/{hash}` - Query transaction

### Solana
- `GET /blockchain/solana/account/{publicKey}` - Get account
- `POST /blockchain/solana/send-transaction` - Send transaction

### Substrate
- `GET /blockchain/substrate/account/{address}` - Get account
- `POST /blockchain/substrate/submit-tx` - Submit extrinsic
- `GET /blockchain/substrate/runtime-metadata` - Get metadata
- `GET /blockchain/substrate/validate-address/{address}` - Validate address

## Styling

All components use Ant Design styling. To customize:

```typescript
import { ConfigProvider } from 'antd';

<ConfigProvider theme={{
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
  },
}}>
  <YourApp />
</ConfigProvider>
```

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  ERC20Token,
  TokenBalance,
  BlockchainEvent,
  UTXO,
  FeeEstimate,
  CosmosAccount,
  AccountBalance,
  TransactionStatus,
  SolanaAccount,
  SolanaTransaction,
  SubstrateAccount,
  ExtrinsicStatus,
  RuntimeMetadata,
  Balance,
} from './components/blockchain';
```

## Error Handling

Components include built-in error handling:

```typescript
import { message } from 'antd';

// Errors are automatically displayed via Ant Design message notifications
// For custom error handling:

const { error, clearError } = useBlockchainAPI();

if (error) {
  console.error(error.message, error.code, error.details);
  clearError();
}
```

## Performance Considerations

### Lazy Loading

```typescript
import { lazy, Suspense } from 'react';

const BlockchainDashboard = lazy(() => import('./BlockchainDashboard'));

<Suspense fallback={<Spin />}>
  <BlockchainDashboard />
</Suspense>
```

### Memoization

Components are already optimized with React.memo where appropriate.

### Pagination

Large data sets use pagination by default:
- Events: 10 per page
- UTXOs: 10 per page
- Transactions: 5 per page
- Tokens: 10 per page

## Security

### Best Practices

1. **Environment Variables**: Store sensitive data in `.env` files
2. **HTTPS Only**: All API calls use HTTPS
3. **Input Validation**: All user inputs are validated
4. **No Hardcoded Credentials**: Credentials from environment only
5. **Rate Limiting**: Implemented server-side
6. **CORS**: Configured on backend

### Address Validation

All components validate addresses based on blockchain format:
- EVM: 0x checksum validation
- Bitcoin: P2PKH, P2SH, Bech32 support
- Cosmos: Bech32 format validation
- Solana: Base58 validation
- Substrate: SS58 validation

## File Structure

```
src/components/blockchain/
├── README.md                      # This file
├── INTEGRATION_GUIDE.md           # Integration instructions
├── index.ts                       # Exports and configuration
├── BlockchainDashboard.tsx        # Main dashboard component
├── ERC20TokenManager.tsx          # ERC20 management
├── EventFilterExplorer.tsx        # Event filtering
├── BitcoinUTXOManager.tsx         # UTXO management
├── CosmosChainManager.tsx         # Cosmos management
├── SolanaManager.tsx              # Solana management
└── SubstrateManager.tsx           # Substrate management

src/hooks/
└── useBlockchainAPI.ts            # Blockchain API hooks
```

## Supported Chains

**Total: 30+ Networks**

- **EVM**: 5 networks (Ethereum, Polygon, Arbitrum, Optimism, BSC)
- **UTXO**: 4 networks (Bitcoin mainnet/testnet, Litecoin, Dogecoin)
- **Cosmos**: 5 networks (Cosmos Hub, Osmosis, Akash, Juno, Stargaze)
- **Solana**: 3 networks (Mainnet, Testnet, Devnet)
- **Substrate**: 4 networks (Polkadot, Kusama, Acala, Moonbeam)

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Dependencies

- React 18.2.0
- TypeScript 5.3.3
- Ant Design 5.11.5
- Axios
- React Hooks (built-in)

## Testing

Run tests with:

```bash
npm test
```

Test coverage for components:
- Rendering and loading states
- Form submission and validation
- API error handling
- Modal interactions
- Network selection
- Address validation

## Troubleshooting

### API Connection Failed
1. Check `REACT_APP_API_BASE_URL` environment variable
2. Verify backend service is running
3. Check CORS configuration
4. Check browser console for network errors

### Component Not Displaying
1. Verify component is imported correctly
2. Check that `ConfigProvider` wraps your app
3. Verify Ant Design CSS is imported
4. Check browser console for errors

### Type Errors
1. Ensure TypeScript types are imported
2. Verify component props match interfaces
3. Check hook return type usage

## Documentation

- **INTEGRATION_GUIDE.md** - Step-by-step integration instructions
- **index.ts** - Configuration objects and exports
- **hooks/useBlockchainAPI.ts** - Hook documentation with examples
- **PHASE_11_UI_SUMMARY.md** - Complete implementation summary

## Version

**v11.4.4** - Phase 11 Initial Release

## License

Part of Aurigraph DLT Project

## Support

For issues or questions, refer to:
- INTEGRATION_GUIDE.md for integration help
- Component JSDoc comments for API details
- Ant Design documentation for UI component details
