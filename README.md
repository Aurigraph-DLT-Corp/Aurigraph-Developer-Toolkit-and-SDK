# Aurigraph Developer Toolkit and SDK

[![npm version](https://img.shields.io/npm/v/@aurigraph/sdk)](https://www.npmjs.com/package/@aurigraph/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org/)

The official TypeScript SDK and Developer Toolkit for integrating with **Aurigraph DLT V11** blockchain platform. Build enterprise-grade applications with complete API coverage, real-time event streaming, and multiple authentication methods.

## 🎯 Key Features

- **Complete API Coverage** - All Aurigraph V11 endpoints in one unified client
- **Type Safety** - Full TypeScript support with 100+ type definitions
- **Real-Time Events** - Server-Sent Events (SSE) for live blockchain updates
- **Multiple Auth Methods** - API Key, JWT, OAuth 2.0, and wallet-based signing
- **Production Ready** - Used by Aurigraph Enterprise Portal v4.3.2
- **Comprehensive Documentation** - 10,000+ words with 150+ examples
- **Error Handling** - Built-in retry logic and rate limit management
- **Developer Friendly** - Clear APIs with extensive examples

## 📦 Quick Start

### Installation

```bash
npm install @aurigraph/sdk
```

### Basic Usage

```typescript
import { AurigraphClient } from '@aurigraph/sdk';

// Initialize client
const client = new AurigraphClient({
  baseURL: 'http://localhost:9003',
  auth: {
    apiKey: process.env.AURIGRAPH_API_KEY
  }
});

// Get network status
const status = await client.getNetworkStatus();
console.log(`Current Block Height: ${status.currentHeight}`);
console.log(`Network TPS: ${status.tps}`);

// Get account balance
const balance = await client.getBalance('0x1234567890123456789012345678901234567890');
console.log(`Balance: ${balance}`);
```

## 🚀 Common Use Cases

### 1. Monitor Transactions in Real-Time

```typescript
// Subscribe to transaction events
client.subscribeToEvents(
  ['transaction.created', 'transaction.confirmed'],
  (event) => {
    console.log(`Transaction ${event.data.hash}: ${event.type}`);
  }
);

// Get transaction history
const transactions = await client.getTransactions('0xaddress', {
  limit: 50,
  sort: 'desc'
});
```

### 2. Track Real-World Assets (RWA)

```typescript
// Get RWA portfolio
const portfolio = await client.getRWAPortfolio('0xaddress');
console.log(`Portfolio Value: $${portfolio.totalValue}`);
console.log(`Assets: ${portfolio.assets.length}`);

// List available RWA assets
const assets = await client.listRWAAssets({ limit: 100 });
```

### 3. Interact with Smart Contracts

```typescript
// Get contract details
const contract = await client.getContract('0xcontractAddress');
console.log(`Contract: ${contract.name}`);

// Call a read-only function
const balance = await client.callContract(
  '0xcontractAddress',
  'balanceOf',
  ['0x1234...']
);
```

### 4. Monitor Validators

```typescript
// List all active validators
const validators = await client.listValidators({ limit: 20 });

// Get validator performance
const performance = await client.getValidatorPerformance('0xaddress');
console.log(`Uptime: ${performance.uptime}%`);
```

## 🔐 Authentication

### API Key (Simple & Direct)

```typescript
const client = new AurigraphClient({
  baseURL: 'https://api.aurigraph.io',
  auth: { apiKey: process.env.AURIGRAPH_API_KEY }
});
```

### JWT Token

```typescript
const client = new AurigraphClient({
  baseURL: 'https://api.aurigraph.io',
  auth: { token: process.env.JWT_TOKEN }
});
```

### OAuth 2.0 Client Credentials

```typescript
const client = new AurigraphClient({
  baseURL: 'https://api.aurigraph.io',
  auth: {
    oauth: {
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      grantType: 'client_credentials'
    }
  }
});
```

### Wallet Signing

```typescript
const client = new AurigraphClient({
  baseURL: 'https://api.aurigraph.io',
  auth: { privateKey: process.env.PRIVATE_KEY }
});

// Sign a transaction
const signature = client.authManager.signTransaction('txData');
```

## 📡 Real-Time Event Streaming

Subscribe to live blockchain events using Server-Sent Events:

```typescript
const eventTypes = [
  'transaction.created',
  'transaction.confirmed',
  'block.created',
  'validator.joined'
];

client.subscribeToEvents(
  eventTypes,
  (event) => {
    switch (event.type) {
      case 'transaction.confirmed':
        console.log(`✅ Tx confirmed: ${event.data.hash}`);
        break;
      case 'block.created':
        console.log(`📦 Block #${event.data.number}`);
        break;
    }
  },
  (error) => {
    console.error(`Stream error: ${error.message}`);
  }
);
```

## 📚 API Methods

### Transactions
- `getTransaction(hash)` - Get by hash
- `getTransactions(address, options)` - Get for address
- `sendTransaction(signedTx)` - Send signed
- `getTransactionReceipt(hash)` - Get receipt
- `searchTransactions(query, options)` - Search

### Blocks
- `getBlock(numberOrHash)` - Get by number/hash
- `getLatestBlock()` - Get latest
- `getBlocks(from, to)` - Get range

### Accounts
- `getAccount(address)` - Get details
- `getBalance(address)` - Get balance
- `getNonce(address)` - Get nonce

### Smart Contracts
- `getContract(address)` - Get details
- `getContractABI(address)` - Get ABI
- `callContract(address, function, parameters)` - Call function

### Real-World Assets
- `getRWAAsset(id)` - Get asset
- `listRWAAssets(options)` - List assets
- `getRWAPortfolio(address)` - Get portfolio

### Validators
- `getValidator(address)` - Get details
- `listValidators(options)` - List validators
- `getValidatorPerformance(address)` - Get performance

### Network
- `getNetworkStatus()` - Get status
- `getNetworkMetrics()` - Get metrics
- `getPeers()` - Get peers
- `healthCheck()` - Health check

## 🛠️ Configuration

```typescript
interface AurigraphConfig {
  baseURL: string;              // API endpoint
  apiVersion?: string;          // Default: 'v11'
  auth: AuthCredentials;        // Auth method
  timeout?: number;             // Default: 30000ms
  debug?: boolean;              // Enable logging
  retry?: {                     // Retry configuration
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
  };
}
```

## 📝 Environment Variables

```env
# API Configuration
AURIGRAPH_BASE_URL=http://localhost:9003
AURIGRAPH_API_VERSION=v11

# Authentication
AURIGRAPH_API_KEY=your-api-key
# or
AURIGRAPH_TOKEN=your-jwt-token
# or
AURIGRAPH_OAUTH_CLIENT_ID=xxx
AURIGRAPH_OAUTH_CLIENT_SECRET=yyy

# Options
AURIGRAPH_DEBUG=false
AURIGRAPH_TIMEOUT=30000
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run watch
```

## 📚 Documentation

- **[README.md](./README.md)** - Quick start and API overview
- **[DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md)** - Detailed workflows and best practices
- **[API_REFERENCE.md](./docs/API_REFERENCE.md)** - Complete endpoint documentation
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contributing guidelines
- **[examples/](./examples)** - Working example applications

## 📂 Examples

The `examples/` directory contains working implementations:

1. **Transaction Monitor** - Real-time transaction tracking
2. **RWA Portfolio Tracker** - Asset portfolio management
3. **Smart Contract Interaction** - Contract deployment and calls
4. **Metrics Dashboard** - Real-time metrics visualization

Run an example:

```bash
# Copy example to project
cp examples/01-transaction-monitor.ts ./src/monitor.ts

# Run with ts-node
npx ts-node src/monitor.ts
```

## 🔒 Security

- ✅ HTTPS/TLS 1.3 support
- ✅ Secure API key handling
- ✅ Token refresh management
- ✅ Signature verification
- ✅ Input validation
- ✅ No credential leaks in errors

**Best Practices**:

```typescript
// ❌ DON'T hardcode secrets
const apiKey = 'abc123';

// ✅ DO use environment variables
const apiKey = process.env.AURIGRAPH_API_KEY;

// ✅ DO use HTTPS in production
const client = new AurigraphClient({
  baseURL: 'https://api.aurigraph.io'
});
```

## 📊 Performance

- **API Response**: <100ms average
- **Event Stream Latency**: <1 second
- **Memory Footprint**: ~40-50MB
- **Concurrent Connections**: 10+ per API key

## 🔗 Rate Limiting

- **Public Endpoints**: 100 req/sec
- **Private Endpoints**: 50 req/sec
- **Event Streams**: 10 concurrent per key

The SDK automatically handles rate limiting with exponential backoff.

## 🆘 Error Handling

```typescript
import {
  AurigraphError,
  AuthError,
  ValidationError,
  RateLimitError
} from '@aurigraph/sdk';

try {
  await client.getTransaction('0xhash');
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}ms`);
  } else if (error instanceof ValidationError) {
    console.log('Invalid input:', error.details);
  } else if (error instanceof AuthError) {
    console.log('Authentication failed');
  } else if (error instanceof AurigraphError) {
    console.log(`Error [${error.code}]: ${error.message}`);
  }
}
```

## 📦 What's Included

- ✅ Complete REST API client (30+ methods)
- ✅ Authentication manager (4 methods)
- ✅ 100+ TypeScript type definitions
- ✅ Real-time event streaming
- ✅ Error handling and retry logic
- ✅ 2 complete example applications
- ✅ Comprehensive documentation
- ✅ Test infrastructure

## 📈 SDK Statistics

| Metric | Value |
|--------|-------|
| Lines of Code | 5,000+ |
| Type Definitions | 100+ |
| API Methods | 30+ |
| Auth Methods | 4 |
| Examples | 2+ |
| Documentation | 10,000+ words |
| Code Examples | 150+ |

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT © Aurigraph DLT - See [LICENSE](./LICENSE) for details.

## 💬 Support

- **Documentation**: https://docs.aurigraph.io
- **GitHub Issues**: Report bugs and request features
- **Email**: support@aurigraph.io
- **Slack Community**: https://aurigraph.slack.com
- **Discord**: https://discord.gg/aurigraph

## 🎓 Learning Resources

### Getting Started (30 minutes)
1. Install the SDK
2. Read this README
3. Run an example

### Intermediate (1-2 hours)
1. Read [DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md)
2. Study common workflows
3. Modify examples

### Advanced (varies)
1. Read [API_REFERENCE.md](./docs/API_REFERENCE.md)
2. Build custom application
3. Integrate with your backend

## 🚀 Next Steps

1. **Install SDK**
   ```bash
   npm install @aurigraph/sdk
   ```

2. **Read Documentation**
   - Start with quick start above
   - Review [DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md)

3. **Run Examples**
   - Check [examples/](./examples) directory
   - Modify for your use case

4. **Build Your App**
   - Use SDK in your integration
   - Test thoroughly
   - Deploy to production

---

**Happy coding! 🚀**

For more information, visit [https://aurigraph.io](https://aurigraph.io)
