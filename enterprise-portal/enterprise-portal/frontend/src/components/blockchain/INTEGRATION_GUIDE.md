# Phase 11 Blockchain Components - Integration Guide

## Overview

This guide provides instructions for integrating all Phase 11 blockchain management components into the Aurigraph DLT Enterprise Portal.

**Components Included:**
1. ERC20TokenManager - EVM-based token management
2. EventFilterExplorer - Blockchain event filtering
3. BitcoinUTXOManager - UTXO chain management
4. CosmosChainManager - Cosmos ecosystem management
5. SolanaManager - Solana blockchain management
6. SubstrateManager - Substrate/Polkadot ecosystem management
7. BlockchainDashboard - Central hub for all managers

## File Structure

```
src/
├── components/
│   └── blockchain/
│       ├── index.ts                  # Exports all components and config
│       ├── INTEGRATION_GUIDE.md      # This file
│       ├── ERC20TokenManager.tsx     # EVM token management
│       ├── EventFilterExplorer.tsx   # Event filtering
│       ├── BitcoinUTXOManager.tsx    # UTXO management
│       ├── CosmosChainManager.tsx    # Cosmos management
│       ├── SolanaManager.tsx         # Solana management
│       ├── SubstrateManager.tsx      # Substrate management
│       └── BlockchainDashboard.tsx   # Central dashboard
└── hooks/
    └── useBlockchainAPI.ts          # Blockchain API hooks
```

## Step 1: Import Components

In your main App.tsx or routing file:

```typescript
import {
  BlockchainDashboard,
  ERC20TokenManager,
  EventFilterExplorer,
  BitcoinUTXOManager,
  CosmosChainManager,
  SolanaManager,
  SubstrateManager,
  BLOCKCHAIN_MANAGERS,
} from './components/blockchain';
```

## Step 2: Add Routes (React Router)

Add these routes to your application's routing configuration:

```typescript
import { Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Routes>
      {/* Blockchain routes */}
      <Route path="/blockchain" element={<BlockchainDashboard />} />
      <Route path="/blockchain/erc20" element={<ERC20TokenManager />} />
      <Route path="/blockchain/events" element={<EventFilterExplorer />} />
      <Route path="/blockchain/utxo" element={<BitcoinUTXOManager />} />
      <Route path="/blockchain/cosmos" element={<CosmosChainManager />} />
      <Route path="/blockchain/solana" element={<SolanaManager />} />
      <Route path="/blockchain/substrate" element={<SubstrateManager />} />

      {/* Other routes */}
    </Routes>
  );
}
```

## Step 3: Add Navigation Links

Add blockchain navigation items to your sidebar or menu:

```typescript
import { BLOCKCHAIN_MANAGERS } from './components/blockchain';

const navigationItems = [
  {
    key: 'blockchain',
    icon: <BlockOutlined />,
    label: 'Blockchain',
    children: BLOCKCHAIN_MANAGERS.map(manager => ({
      key: manager.id,
      label: manager.name,
      onClick: () => navigate(`/blockchain/${manager.id}`),
    })),
  },
];
```

## Step 4: Configure API Base URL

Set the API base URL in your environment configuration:

**.env.local** or **.env**:
```
REACT_APP_API_BASE_URL=https://dlt.aurigraph.io/api/v11
```

**For development**:
```
REACT_APP_API_BASE_URL=http://localhost:9003/api/v11
```

## Step 5: Using Blockchain Hooks

The library provides specialized hooks for each blockchain type. Use them in your custom components:

### ERC20 Operations

```typescript
import { useERC20 } from './hooks/useBlockchainAPI';

function MyComponent() {
  const { getBalance, getTokens, loading } = useERC20();

  const fetchBalance = async () => {
    try {
      const balance = await getBalance(
        '0x...', // token address
        '0x...', // wallet address
        'ethereum' // chain
      );
      console.log(balance);
    } catch (error) {
      console.error(error);
    }
  };

  return <button onClick={fetchBalance}>Get Balance</button>;
}
```

### Bitcoin UTXO Operations

```typescript
import { useBitcoinUTXO } from './hooks/useBlockchainAPI';

function MyComponent() {
  const { getUTXOs, estimateFee, loading } = useBitcoinUTXO();

  const fetchUTXOs = async () => {
    try {
      const utxos = await getUTXOs('1A1z7agoat...', 'bitcoin');
      console.log(utxos);
    } catch (error) {
      console.error(error);
    }
  };

  return <button onClick={fetchUTXOs}>Get UTXOs</button>;
}
```

### Cosmos Operations

```typescript
import { useCosmos } from './hooks/useBlockchainAPI';

function MyComponent() {
  const { getAccount, submitTransaction, loading } = useCosmos();

  const fetchAccount = async () => {
    try {
      const account = await getAccount('cosmos1...', 'cosmoshub');
      console.log(account);
    } catch (error) {
      console.error(error);
    }
  };

  return <button onClick={fetchAccount}>Get Account</button>;
}
```

### Solana Operations

```typescript
import { useSolana } from './hooks/useBlockchainAPI';

function MyComponent() {
  const { getAccount, sendTransaction, loading } = useSolana();

  const fetchAccount = async () => {
    try {
      const account = await getAccount('1XXXXXX...', 'mainnet');
      console.log(account);
    } catch (error) {
      console.error(error);
    }
  };

  return <button onClick={fetchAccount}>Get Account</button>;
}
```

### Substrate Operations

```typescript
import { useSubstrate } from './hooks/useBlockchainAPI';

function MyComponent() {
  const { getAccount, submitExtrinsic, getRuntimeMetadata, loading } = useSubstrate();

  const fetchAccount = async () => {
    try {
      const account = await getAccount('1XXXXXX...', 'polkadot');
      console.log(account);
    } catch (error) {
      console.error(error);
    }
  };

  return <button onClick={fetchAccount}>Get Account</button>;
}
```

### Event Filtering

```typescript
import { useBlockchainEvents } from './hooks/useBlockchainAPI';

function MyComponent() {
  const { queryEvents, loading } = useBlockchainEvents();

  const filterEvents = async () => {
    try {
      const events = await queryEvents({
        eventSignatures: ['Transfer(address,address,uint256)'],
        fromBlock: 1000000,
        toBlock: 1000100,
      });
      console.log(events);
    } catch (error) {
      console.error(error);
    }
  };

  return <button onClick={filterEvents}>Query Events</button>;
}
```

## Backend API Endpoints

All components communicate with the V11 backend through the following endpoints:

### ERC20 Endpoints
- `GET /blockchain/erc20/tokens` - List available tokens
- `POST /blockchain/erc20/balance` - Query token balance
- `GET /blockchain/erc20/{tokenAddress}` - Get token details

### Event Endpoints
- `POST /blockchain/events/query` - Query blockchain events

### Bitcoin/UTXO Endpoints
- `GET /blockchain/utxo/address/{address}` - Get UTXOs
- `POST /blockchain/utxo/estimate-fee` - Estimate transaction fee
- `GET /blockchain/utxo/validate-address/{address}` - Validate address
- `POST /blockchain/utxo/calculate-change` - Calculate change amount

### Cosmos Endpoints
- `GET /blockchain/cosmos/account/{address}` - Get account details
- `POST /blockchain/cosmos/validate-tx` - Validate transaction
- `POST /blockchain/cosmos/submit-tx` - Submit transaction
- `GET /blockchain/cosmos/tx/{txHash}` - Query transaction status

### Solana Endpoints
- `GET /blockchain/solana/account/{publicKey}` - Get account info
- `POST /blockchain/solana/send-transaction` - Send transaction

### Substrate Endpoints
- `GET /blockchain/substrate/account/{address}` - Get account info
- `POST /blockchain/substrate/submit-tx` - Submit extrinsic
- `GET /blockchain/substrate/runtime-metadata` - Get runtime metadata
- `GET /blockchain/substrate/validate-address/{address}` - Validate SS58 address

## Configuration Objects

### BLOCKCHAIN_MANAGERS

Array of manager objects with metadata:

```typescript
[
  {
    id: 'erc20',
    name: 'ERC20 Token Manager',
    description: 'Manage ERC20 tokens across EVM-compatible networks',
    component: 'ERC20TokenManager',
    chains: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'bsc'],
    features: ['token-list', 'balance-query', 'token-details'],
  },
  // ... more managers
]
```

### BLOCKCHAIN_NETWORKS

Configuration for all supported networks:

```typescript
{
  ethereum: {
    name: 'Ethereum',
    type: 'evm',
    chainId: 1,
    rpcEndpoint: '...',
    blockExplorer: '...',
  },
  // ... more networks
}
```

## Styling and Customization

All components use Ant Design (antd) for consistent styling. To customize the theme:

```typescript
import { ConfigProvider } from 'antd';
import theme from 'antd/theme';

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      {/* Your app components */}
    </ConfigProvider>
  );
}
```

## Error Handling

All API hooks include built-in error handling:

```typescript
const { loading, error, callAPI, clearError } = useBlockchainAPI();

if (error) {
  return (
    <Alert
      type="error"
      message={error.message}
      closable
      onClose={clearError}
    />
  );
}
```

## Security Considerations

1. **API Keys**: Never hardcode API keys in the frontend. Use environment variables.
2. **CORS**: Configure CORS properly on your backend.
3. **Rate Limiting**: Implement rate limiting on the backend to prevent abuse.
4. **Validation**: Always validate user inputs on both frontend and backend.
5. **TLS/HTTPS**: Use HTTPS for all API communications.

## Performance Optimization

1. **Lazy Loading**: Load blockchain components only when needed
2. **Caching**: Implement caching for frequently accessed data
3. **Pagination**: Use pagination for large data sets (events, transactions, UTXOs)
4. **Debouncing**: Debounce search and filter inputs

Example lazy loading:

```typescript
import { lazy, Suspense } from 'react';

const BlockchainDashboard = lazy(() => import('./BlockchainDashboard'));

function App() {
  return (
    <Suspense fallback={<Spin />}>
      <BlockchainDashboard />
    </Suspense>
  );
}
```

## Testing

### Unit Tests

```typescript
import { renderHook, act } from '@testing-library/react';
import { useERC20 } from './hooks/useBlockchainAPI';

test('should fetch token balance', async () => {
  const { result } = renderHook(() => useERC20());

  await act(async () => {
    await result.current.getBalance('0x...', '0x...', 'ethereum');
  });

  expect(result.current.data).toBeDefined();
});
```

### Integration Tests

```typescript
import { render, screen } from '@testing-library/react';
import ERC20TokenManager from './ERC20TokenManager';

test('should render token manager', () => {
  render(<ERC20TokenManager />);
  expect(screen.getByText(/ERC20 Token Manager/i)).toBeInTheDocument();
});
```

## Troubleshooting

### API Connection Issues

1. Verify the API base URL is correct
2. Check CORS configuration on backend
3. Ensure backend service is running
4. Check network requests in browser DevTools

### Type Errors

1. Ensure TypeScript types are properly imported
2. Check that component props match interface definitions
3. Verify hook return types are used correctly

### Styling Issues

1. Ensure Ant Design CSS is imported in your main App
2. Check that ConfigProvider wraps your entire app
3. Verify CSS-in-JS library is properly configured

## Support and Documentation

For more information, refer to:

- **Ant Design Documentation**: https://ant.design/
- **React Documentation**: https://react.dev/
- **TypeScript Documentation**: https://www.typescriptlang.org/
- **Axios Documentation**: https://axios-http.com/

## Version History

### v11.4.4 - Phase 11 Initial Release
- ERC20 Token Manager
- Event Filter Explorer
- Bitcoin UTXO Manager
- Cosmos Chain Manager
- Solana Manager
- Substrate Manager
- Blockchain Dashboard
- Unified API hooks

## Future Enhancements

Planned features for upcoming releases:

1. **Advanced Event Filtering**: Support for custom event topics and parameters
2. **Transaction History**: Persistent transaction history storage
3. **Multi-chain Swaps**: DEX integration for cross-chain swaps
4. **Portfolio Tracking**: Unified portfolio view across all chains
5. **Advanced Analytics**: Charts and graphs for transaction analysis
6. **Batch Operations**: Support for batch transactions
7. **Hardware Wallet Integration**: Ledger, Trezor support
8. **Gas Optimization**: Intelligent gas estimation and optimization
