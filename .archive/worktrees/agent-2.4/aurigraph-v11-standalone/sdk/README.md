# Aurigraph SDK - Official Integration Toolkit

[![npm version](https://img.shields.io/npm/v/@aurigraph/sdk)](https://www.npmjs.com/package/@aurigraph/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)

The official TypeScript SDK for integrating with the **Aurigraph DLT V11** blockchain platform. Build applications with enterprise-grade features, real-time streaming, and full API coverage.

---

## 🚀 Features

- **Complete REST API Coverage** - All Aurigraph V11 endpoints in one unified client
- **Multiple Auth Methods** - API Key, JWT, OAuth 2.0, and wallet-based signing
- **Real-Time Events** - Server-Sent Events (SSE) for transaction and block updates
- **Type Safety** - Full TypeScript support with comprehensive type definitions
- **Error Handling** - Built-in retry logic, rate limit handling, and custom error types
- **Production Ready** - Used by Aurigraph enterprise portal and third-party integrations

---

## 📦 Installation

```bash
# npm
npm install @aurigraph/sdk

# yarn
yarn add @aurigraph/sdk

# pnpm
pnpm add @aurigraph/sdk
```

### Requirements
- Node.js 20.0.0 or higher
- TypeScript 5.0+ (for development)

---

## ⚡ Quick Start

### 1. Basic Setup with API Key

```typescript
import { AurigraphClient } from '@aurigraph/sdk';

const client = new AurigraphClient({
  baseURL: 'https://api.aurigraph.io', // or http://localhost:9003
  auth: {
    apiKey: 'your-api-key-here'
  }
});

// Get network status
const status = await client.getNetworkStatus();
console.log('Current block height:', status.currentHeight);
console.log('TPS:', status.tps);

// Get account balance
const balance = await client.getBalance('0x1234...');
console.log('Balance:', balance);
```

### 2. Transaction Retrieval

```typescript
// Get transaction by hash
const tx = await client.getTransaction(
  '0xabcd...1234'
);

console.log('Status:', tx.status);
console.log('From:', tx.from);
console.log('To:', tx.to);
console.log('Value:', tx.value);

// Get all transactions for an address
const transactions = await client.getTransactions('0x1234...', {
  limit: 50,
  offset: 0,
  sort: 'desc'
});

console.log('Total transactions:', transactions.total);
transactions.data.forEach(tx => {
  console.log(`${tx.hash}: ${tx.value}`);
});
```

### 3. Smart Contract Interaction

```typescript
// Call a read-only contract function
const result = await client.callContract(
  '0xcontractAddress',
  'balanceOf',
  ['0x1234...']
);

console.log('Balance:', result);

// Get contract ABI
const abi = await client.getContractABI('0xcontractAddress');
console.log('Functions:', abi.filter(item => item.type === 'function'));
```

### 4. Real-World Assets (RWA)

```typescript
// Get RWA asset details
const asset = await client.getRWAAsset('gold-2024-01');
console.log('Asset:', asset.name);
console.log('Underlying:', asset.underlyingAsset);
console.log('Valuation:', asset.metadata.valuation);

// List all RWA assets
const assets = await client.listRWAAssets({
  limit: 100,
  sort: 'desc'
});

// Get portfolio for address
const portfolio = await client.getRWAPortfolio('0x1234...');
console.log('Total portfolio value:', portfolio.totalValue);
```

### 5. Validator Monitoring

```typescript
// Get validator details
const validator = await client.getValidator('0xvalidatorAddress');
console.log('Status:', validator.status);
console.log('Stake:', validator.stake);

// Get performance metrics
const performance = await client.getValidatorPerformance('0xvalidatorAddress');
console.log('Uptime:', performance.uptime + '%');
console.log('Blocks proposed:', performance.blocksProposed);

// List all validators
const validators = await client.listValidators({
  limit: 50,
  sort: 'asc'
});
```

---

## 🔐 Authentication

### API Key Authentication

```typescript
const client = new AurigraphClient({
  baseURL: 'https://api.aurigraph.io',
  auth: {
    apiKey: 'your-api-key'
  }
});
```

### JWT Token Authentication

```typescript
const client = new AurigraphClient({
  baseURL: 'https://api.aurigraph.io',
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIs...'
  }
});
```

### OAuth 2.0 (Client Credentials Flow)

```typescript
const client = new AurigraphClient({
  baseURL: 'https://api.aurigraph.io',
  auth: {
    oauth: {
      clientId: 'your-client-id',
      clientSecret: 'your-client-secret',
      grantType: 'client_credentials',
      scope: ['read:transactions', 'write:transactions']
    }
  }
});

// Token is automatically requested and refreshed
```

### Wallet-Based Signing

```typescript
const client = new AurigraphClient({
  baseURL: 'https://api.aurigraph.io',
  auth: {
    privateKey: '0xprivateKeyHex'
  }
});

// Sign transactions
const signature = client.signTransaction('transaction data');
```

---

## 📡 Real-Time Event Streaming

Subscribe to real-time blockchain events using Server-Sent Events (SSE):

```typescript
import { EventType } from '@aurigraph/sdk';

const client = new AurigraphClient(config);

// Subscribe to transaction events
client.subscribeToEvents(
  ['transaction.created', 'transaction.confirmed'],
  (event) => {
    console.log('New event:', event);
    if (event.type === 'transaction.created') {
      console.log('New transaction:', event.data.hash);
    }
  },
  (error) => {
    console.error('Event stream error:', error);
  }
);

// Listen to emitted events
client.on('event', (event) => {
  console.log('Received event:', event);
});

client.on('error', (error) => {
  console.error('Error:', error);
});
```

### Available Event Types

```typescript
type EventType =
  | 'transaction.created'     // New transaction pending
  | 'transaction.confirmed'   // Transaction confirmed in block
  | 'transaction.failed'      // Transaction failed
  | 'block.created'           // New block created
  | 'contract.deployed'       // Smart contract deployed
  | 'contract.call'           // Smart contract called
  | 'validator.joined'        // Validator joined network
  | 'validator.left'          // Validator left network
  | 'rwa.created'             // New RWA asset created
  | 'rwa.transferred';        // RWA transferred
```

---

## 🔗 API Methods Reference

### Network

```typescript
// Get network status
const status = await client.getNetworkStatus();
// Returns: NetworkStatus

// Get network metrics
const metrics = await client.getNetworkMetrics();

// Get connected peers
const peers = await client.getPeers();

// Health check
const health = await client.healthCheck();
```

### Transactions

```typescript
// Get transaction by hash
const tx = await client.getTransaction('0xhash');

// Get transactions for address
const txs = await client.getTransactions('0xaddress', { limit: 50 });

// Send signed transaction
const receipt = await client.sendTransaction('0xsignedTx');

// Get transaction receipt
const receipt = await client.getTransactionReceipt('0xhash');

// Search transactions
const results = await client.searchTransactions('query', { limit: 100 });
```

### Blocks

```typescript
// Get block by number or hash
const block = await client.getBlock(12345);
const block = await client.getBlock('0xblockhash');

// Get latest block
const latest = await client.getLatestBlock();

// Get blocks in range
const blocks = await client.getBlocks(12000, 12100);
```

### Accounts

```typescript
// Get account details
const account = await client.getAccount('0xaddress');

// Get balance
const balance = await client.getBalance('0xaddress');

// Get nonce (for transaction construction)
const nonce = await client.getNonce('0xaddress');
```

### Smart Contracts

```typescript
// Call read-only function
const result = await client.callContract(
  '0xcontractAddress',
  'functionName',
  [param1, param2]
);

// Get contract ABI
const abi = await client.getContractABI('0xcontractAddress');

// Get contract details
const contract = await client.getContract('0xcontractAddress');
```

### Real-World Assets (RWA)

```typescript
// Get RWA asset
const asset = await client.getRWAAsset('asset-id');

// List RWA assets
const assets = await client.listRWAAssets({ limit: 50 });

// Get RWA portfolio
const portfolio = await client.getRWAPortfolio('0xaddress');
```

### Validators

```typescript
// Get validator details
const validator = await client.getValidator('0xaddress');

// List validators
const validators = await client.listValidators({ limit: 100 });

// Get validator performance
const perf = await client.getValidatorPerformance('0xaddress');
```

---

## ⚙️ Configuration Options

```typescript
interface AurigraphConfig {
  // API base URL
  baseURL: string;

  // API version (default: 'v11')
  apiVersion?: string;

  // Authentication credentials
  auth: AuthCredentials;

  // Request timeout in ms (default: 30000)
  timeout?: number;

  // Enable debug logging (default: false)
  debug?: boolean;

  // WebSocket configuration
  websocket?: {
    enabled: boolean;
    url?: string;
    reconnect?: boolean;
    reconnectInterval?: number;
    maxReconnectAttempts?: number;
  };

  // Retry configuration
  retry?: {
    maxRetries: number;
    retryDelay: number;
    retryableStatusCodes: number[];
    exponentialBackoff: boolean;
  };
}
```

---

## 📝 Environment Variables

Create a `.env` file:

```env
# API Configuration
AURIGRAPH_BASE_URL=https://api.aurigraph.io
AURIGRAPH_API_VERSION=v11

# Authentication
AURIGRAPH_API_KEY=your-api-key
# or
AURIGRAPH_TOKEN=your-jwt-token
# or
AURIGRAPH_PRIVATE_KEY=0x...

# Logging
AURIGRAPH_DEBUG=false
```

Load in your application:

```typescript
import dotenv from 'dotenv';

dotenv.config();

const client = new AurigraphClient({
  baseURL: process.env.AURIGRAPH_BASE_URL || 'http://localhost:9003',
  auth: {
    apiKey: process.env.AURIGRAPH_API_KEY,
    token: process.env.AURIGRAPH_TOKEN,
    privateKey: process.env.AURIGRAPH_PRIVATE_KEY,
  },
  debug: process.env.AURIGRAPH_DEBUG === 'true'
});
```

---

## 🛠️ Error Handling

The SDK provides custom error types for better error handling:

```typescript
import {
  AurigraphError,
  AuthError,
  ValidationError,
  RateLimitError
} from '@aurigraph/sdk';

try {
  const tx = await client.getTransaction('0xhash');
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}ms`);
    await new Promise(resolve => setTimeout(resolve, error.retryAfter));
  } else if (error instanceof ValidationError) {
    console.error('Invalid input:', error.details);
  } else if (error instanceof AuthError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof AurigraphError) {
    console.error(`API Error [${error.code}]:`, error.message);
  }
}
```

---

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run watch
```

---

## 📚 Examples

See the `/examples` directory for complete sample applications:

1. **Transaction Monitor** - Real-time transaction tracking with WebSocket
2. **Asset Portfolio Tracker** - RWA portfolio management and monitoring
3. **Smart Contract Interaction** - Deploy and interact with contracts
4. **Metrics Dashboard** - Build a real-time metrics dashboard

---

## 🔄 Rate Limiting

The API enforces rate limits:

- **Public Endpoints**: 100 requests/second
- **Private Endpoints**: 50 requests/second
- **WebSocket Streams**: 10 concurrent connections per account

The SDK automatically handles rate limit errors with exponential backoff:

```typescript
const client = new AurigraphClient({
  baseURL: 'https://api.aurigraph.io',
  auth: { apiKey: 'xxx' },
  retry: {
    maxRetries: 3,
    retryDelay: 1000,
    retryableStatusCodes: [429, 503],
    exponentialBackoff: true
  }
});
```

---

## 🔐 Security Best Practices

1. **Store credentials securely**
   ```typescript
   // ❌ Don't hardcode credentials
   const apiKey = 'your-api-key'; // WRONG

   // ✅ Use environment variables
   const apiKey = process.env.AURIGRAPH_API_KEY;
   ```

2. **Use HTTPS in production**
   ```typescript
   const client = new AurigraphClient({
     baseURL: 'https://api.aurigraph.io', // Always HTTPS in production
     auth: { apiKey: process.env.AURIGRAPH_API_KEY }
   });
   ```

3. **Rotate API keys regularly**
   - Implement key rotation every 90 days
   - Revoke compromised keys immediately

4. **Validate webhook signatures**
   ```typescript
   import crypto from 'crypto';

   function verifyWebhook(payload: string, signature: string, secret: string) {
     const expectedSignature = crypto
       .createHmac('sha256', secret)
       .update(payload)
       .digest('hex');
     return signature === expectedSignature;
   }
   ```

---

## 📖 Documentation

- [Full API Reference](./docs/API.md)
- [Integration Guides](./docs/GUIDES.md)
- [Examples](./examples)
- [TypeScript Types](./src/types/index.ts)

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md)

---

## 📄 License

MIT © Aurigraph DLT

---

## 💬 Support

- **GitHub Issues**: [Report bugs](https://github.com/Aurigraph-DLT/issues)
- **Email**: support@aurigraph.io
- **Slack Community**: [Join our developer community](https://aurigraph.slack.com)
- **Documentation**: [https://docs.aurigraph.io](https://docs.aurigraph.io)

---

## 🎯 Roadmap

- [ ] WebSocket real-time streaming (replacing SSE)
- [ ] GraphQL API client
- [ ] Go SDK
- [ ] Python SDK
- [ ] Web3.js compatibility layer
- [ ] Transaction builder utilities
- [ ] Contract deployment framework

---

**Happy coding! 🚀**
