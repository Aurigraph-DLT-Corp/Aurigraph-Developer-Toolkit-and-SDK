# Aurigraph Developer Toolkit - FAQ

**Last Updated**: October 31, 2025
**Version**: 1.0.0

---

## Table of Contents

- [Getting Started](#getting-started)
- [Installation & Setup](#installation--setup)
- [Authentication](#authentication)
- [API Usage](#api-usage)
- [Transactions](#transactions)
- [Smart Contracts](#smart-contracts)
- [Real-World Assets (RWA)](#real-world-assets-rwa)
- [Event Streaming](#event-streaming)
- [Performance & Optimization](#performance--optimization)
- [Troubleshooting](#troubleshooting)
- [Security](#security)

---

## Getting Started

### Q: What is the Aurigraph Developer Toolkit?

**A:** The Aurigraph Developer Toolkit is a complete TypeScript SDK for building applications on the Aurigraph DLT V11 blockchain platform. It provides:

- REST API client with 30+ methods
- Multiple authentication methods
- Real-time event streaming
- Type-safe interfaces (100+ types)
- Working examples and templates
- Comprehensive documentation

### Q: Do I need blockchain experience to use the SDK?

**A:** No! The SDK is designed to be developer-friendly. You need:

- JavaScript/TypeScript knowledge
- Understanding of async/await
- Basic REST API concepts
- (Optional) Basic blockchain concepts

We provide examples for everything.

### Q: What Node.js versions are supported?

**A:** Node.js 20.0.0 and higher. We use modern JavaScript features like:

- Top-level await
- Optional chaining
- Nullish coalescing
- Class fields

Check your version with: `node --version`

### Q: Can I use this in a browser?

**A:** The SDK is designed for Node.js/server environments. For browser usage:

- Use the REST API directly with `fetch`
- Consider a frontend SDK (coming soon)
- Check our examples for browser-compatible patterns

### Q: Is the SDK open source?

**A:** Yes! The SDK is MIT licensed. You can:

- Use it in commercial projects
- Modify and distribute
- No warranty provided
- Attribution appreciated

---

## Installation & Setup

### Q: How do I install the SDK?

**A:** Use npm or yarn:

```bash
# npm
npm install @aurigraph/sdk

# yarn
yarn add @aurigraph/sdk

# pnpm
pnpm add @aurigraph/sdk
```

### Q: Where do I get the API key?

**A:** API keys are managed through your Aurigraph account:

1. Log in to your account at https://aurigraph.io
2. Navigate to API Management
3. Create a new API key
4. Store in environment variables (`.env`)

Never commit API keys to git!

### Q: Can I use the SDK without an API key?

**A:** No, all API calls require authentication. You have 4 options:

1. **API Key** - For development/testing
2. **JWT Token** - For user-specific access
3. **OAuth 2.0** - For service-to-service
4. **Wallet Signing** - For transaction signing

See [Authentication](#authentication) for details.

### Q: What should I set `baseURL` to?

**A:** It depends on your environment:

```typescript
// Local development
baseURL: 'http://localhost:9003'

// Testnet
baseURL: 'https://testnet.aurigraph.io'

// Mainnet
baseURL: 'https://api.aurigraph.io'

// Use environment variable
baseURL: process.env.AURIGRAPH_BASE_URL || 'http://localhost:9003'
```

### Q: How do I configure timeouts?

**A:** Pass `timeout` in config (milliseconds):

```typescript
const client = new AurigraphClient({
  baseURL: 'http://localhost:9003',
  auth: { apiKey: 'key' },
  timeout: 30000 // 30 seconds
});
```

Default is 10 seconds. Increase for slow networks.

### Q: Can I use TypeScript?

**A:** Yes! The SDK is written in TypeScript and fully typed. Example setup:

```bash
npm install --save-dev typescript ts-node

# Create tsconfig.json
npx tsc --init

# Run TypeScript
npx ts-node index.ts
```

### Q: How do I set up environment variables?

**A:** Create a `.env` file:

```bash
AURIGRAPH_BASE_URL=http://localhost:9003
AURIGRAPH_API_KEY=sk_test_1234567890
REQUEST_TIMEOUT=15000
MAX_RETRIES=3
DEBUG=aurigraph:*
```

Load with `dotenv`:

```bash
npm install dotenv

# In your code
import dotenv from 'dotenv';
dotenv.config();
```

---

## Authentication

### Q: Which authentication method should I use?

**A:** Choose based on your use case:

| Method | Use Case | Security | Complexity |
|--------|----------|----------|-----------|
| API Key | Development/Testing | ⚠️ Medium | ✅ Simple |
| JWT Token | Web applications | ✅ Good | 📝 Medium |
| OAuth 2.0 | Microservices | ✅✅ High | 🔧 Complex |
| Wallet Signing | Transactions | ✅✅ High | 🔧 Complex |

### Q: How do I secure my API key?

**A:** Best practices:

```bash
# ✅ DO: Use environment variables
AURIGRAPH_API_KEY=sk_test_xxx

# ❌ DON'T: Hardcode keys
const apiKey = 'sk_test_xxx';

# ❌ DON'T: Commit to git
git add .env  # Wrong!

# ✅ DO: Use .gitignore
echo ".env" >> .gitignore
```

### Q: How do JWT tokens work?

**A:** JWT tokens include expiration and are automatically refreshed:

```typescript
const client = new AurigraphClient({
  auth: { token: 'jwt_token_here' }
});

// Token is automatically refreshed when expired
// You don't need to handle refresh yourself
const status = await client.getNetworkStatus();
```

### Q: Can I switch authentication methods?

**A:** Yes, create a new `AuthManager`:

```typescript
import { AuthManager } from '@aurigraph/sdk';

const newAuth = new AuthManager({
  apiKey: 'new-key'
});

client.setAuthManager(newAuth);
```

### Q: How do I sign transactions?

**A:** Use wallet-based authentication:

```typescript
const client = new AurigraphClient({
  auth: {
    privateKey: process.env.PRIVATE_KEY
  }
});

// Transaction is automatically signed
const txHash = await client.sendTransaction({
  from: '0xYourAddress',
  to: '0xRecipient',
  value: '1000000000000000000'
});
```

### Q: What if my token expires?

**A:** The SDK handles token refresh automatically. If you manage tokens manually:

```typescript
try {
  const result = await client.getNetworkStatus();
} catch (error) {
  if (error instanceof AuthError) {
    // Refresh token and retry
    const newToken = await refreshToken();
    client.setAuthManager(new AuthManager({ token: newToken }));
    const result = await client.getNetworkStatus();
  }
}
```

---

## API Usage

### Q: How do I make API calls?

**A:** All methods are async:

```typescript
// Call a method
const status = await client.getNetworkStatus();

// Methods return typed responses
const tx: Transaction = await client.getTransaction(txHash);

// Handle errors
try {
  const result = await client.getTransaction(txHash);
} catch (error) {
  console.error('Error:', error.message);
}
```

### Q: What data types do API methods return?

**A:** All methods return typed objects. Examples:

```typescript
// Transaction object
interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: BigInt;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  gasUsed?: string;
  blockNumber?: number;
}

// Block object
interface Block {
  hash: string;
  height: number;
  timestamp: number;
  transactions: Transaction[];
  validator: string;
}
```

See `src/types/index.ts` for complete type definitions.

### Q: How do I handle errors?

**A:** SDK provides specific error types:

```typescript
import {
  AurigraphError,
  AuthError,
  ValidationError,
  RateLimitError
} from '@aurigraph/sdk';

try {
  await client.getTransaction(txHash);
} catch (error) {
  if (error instanceof AuthError) {
    console.error('Auth failed');
  } else if (error instanceof RateLimitError) {
    console.error('Rate limited');
    // Retry after: error.retryAfter seconds
  } else if (error instanceof ValidationError) {
    console.error('Validation error:', error.message);
  }
}
```

### Q: How do I paginate results?

**A:** Use `limit` and `offset` parameters:

```typescript
// Get first 100 transactions
const page1 = await client.getTransactions(address, {
  limit: 100,
  offset: 0
});

// Get next page
const page2 = await client.getTransactions(address, {
  limit: 100,
  offset: 100
});

// Check if more results exist
if (page2.data.length < 100) {
  console.log('This was the last page');
}
```

### Q: Can I filter API results?

**A:** Yes, use query parameters:

```typescript
// Filter transactions
const results = await client.searchTransactions({
  from: '0x...',
  to: '0x...',
  status: 'confirmed',
  minValue: '100000000000000000'
});

// Filter blocks
const blocks = await client.getBlocks(
  startHeight,
  endHeight
);
```

### Q: What's the rate limit?

**A:** Default rate limits:

- **Public API**: 100 requests/second
- **Private API**: 50 requests/second
- **Auth endpoints**: 5 requests/minute

The SDK includes:
- Rate limit headers in responses
- Automatic exponential backoff
- Request queuing

Check response headers:

```typescript
client.on('response', (response) => {
  console.log('Rate limit remaining:', response.headers['x-ratelimit-remaining']);
  console.log('Rate limit reset:', response.headers['x-ratelimit-reset']);
});
```

---

## Transactions

### Q: How do I send a transaction?

**A:** Use `sendTransaction` method:

```typescript
const txHash = await client.sendTransaction({
  from: '0xYourAddress',
  to: '0xRecipientAddress',
  value: '1000000000000000000', // 1 token
  data: '0x' // Optional: contract call data
});

console.log('Transaction sent:', txHash);
```

### Q: How do I wait for transaction confirmation?

**A:** Poll the transaction status:

```typescript
async function waitForConfirmation(txHash: string) {
  let confirmed = false;
  let attempts = 0;

  while (!confirmed && attempts < 60) {
    const tx = await client.getTransaction(txHash);

    if (tx.status === 'confirmed') {
      confirmed = true;
      console.log('✅ Confirmed!');
    } else if (tx.status === 'failed') {
      throw new Error('Transaction failed');
    }

    attempts++;
    await new Promise(r => setTimeout(r, 1000)); // Wait 1 second
  }

  return confirmed;
}
```

### Q: What's the difference between transaction and receipt?

**A:** Transaction is metadata, receipt is result:

```typescript
// Transaction object
const tx = await client.getTransaction(txHash);
// Contains: hash, from, to, value, status, timestamp

// Receipt object
const receipt = await client.getTransactionReceipt(txHash);
// Contains: blockNumber, gasUsed, confirmations, logs
```

### Q: How do I check if a transaction failed?

**A:** Check the status:

```typescript
const tx = await client.getTransaction(txHash);

if (tx.status === 'failed') {
  console.error('Transaction failed');
  const receipt = await client.getTransactionReceipt(txHash);
  console.log('Reason:', receipt.revertReason);
}
```

### Q: Can I retry a failed transaction?

**A:** Yes, but create a new transaction with same parameters:

```typescript
async function sendWithRetry(txData: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const txHash = await client.sendTransaction(txData);
      return await waitForConfirmation(txHash);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}...`);
      await new Promise(r => setTimeout(r, 2000 * (i + 1)));
    }
  }
}
```

### Q: How do I get gas estimates?

**A:** The API calculates gas automatically:

```typescript
const tx = await client.getTransaction(txHash);
const gasUsed = tx.gasUsed;

const receipt = await client.getTransactionReceipt(txHash);
const gasCost = BigInt(receipt.gasUsed) * BigInt(tx.gasPrice || 0);

console.log('Gas used:', gasUsed);
console.log('Gas cost:', gasCost.toString());
```

### Q: Can I batch transactions?

**A:** Yes, but send them sequentially or use `Promise.all`:

```typescript
// Sequential (safer)
async function sendSequential(transactions: any[]) {
  const results = [];
  for (const tx of transactions) {
    const hash = await client.sendTransaction(tx);
    results.push(hash);
  }
  return results;
}

// Parallel (faster, use with care)
async function sendParallel(transactions: any[]) {
  return Promise.all(
    transactions.map(tx => client.sendTransaction(tx))
  );
}
```

---

## Smart Contracts

### Q: How do I call a smart contract?

**A:** Use `callContract` for read-only calls:

```typescript
const result = await client.callContract({
  address: '0xContractAddress',
  functionName: 'balanceOf',
  params: ['0xAccountAddress']
});

console.log('Balance:', result);
```

### Q: How do I execute a contract function (write)?

**A:** Use `sendTransaction`:

```typescript
const txHash = await client.sendTransaction({
  to: '0xContractAddress',
  functionName: 'transfer',
  params: ['0xRecipient', '1000000000000000000'],
  from: '0xYourAddress'
});

console.log('Transaction:', txHash);
```

### Q: How do I get the contract ABI?

**A:** Use `getContractABI`:

```typescript
const abi = await client.getContractABI('0xContractAddress');

console.log('Functions:', abi.filter(item => item.type === 'function'));
console.log('Events:', abi.filter(item => item.type === 'event'));
```

### Q: How do I monitor contract events?

**A:** Subscribe to events:

```typescript
await client.subscribeToEvents({
  eventTypes: ['contract_event'],
  onEvent: (event) => {
    if (event.data.contract === '0xContractAddress') {
      console.log('Event:', event.data.eventName);
      console.log('Data:', event.data.args);
    }
  }
});
```

### Q: Can I interact with multiple contracts?

**A:** Yes, just change the address:

```typescript
const contracts = ['0xContract1', '0xContract2', '0xContract3'];

for (const address of contracts) {
  const result = await client.callContract({
    address,
    functionName: 'name'
  });
  console.log(`${address}: ${result}`);
}
```

---

## Real-World Assets (RWA)

### Q: What are Real-World Assets?

**A:** RWAs are tokenized real-world assets like:

- Real estate
- Commodities
- Securities
- Art/collectibles
- Physical goods

On Aurigraph, RWAs are managed through a registry system.

### Q: How do I get my RWA portfolio?

**A:** Use `getRWAPortfolio`:

```typescript
const portfolio = await client.getRWAPortfolio();

console.log('Total assets:', portfolio.assets.length);
console.log('Total value:', portfolio.totalValue);

// List each asset
portfolio.assets.forEach(asset => {
  console.log(`${asset.name}: ${asset.quantity} @ $${asset.unitValue}`);
});
```

### Q: How do I get details about a specific RWA?

**A:** Use `getRWAAsset`:

```typescript
const asset = await client.getRWAAsset('asset-id-123');

console.log('Name:', asset.name);
console.log('Type:', asset.assetType);
console.log('Status:', asset.status);
console.log('Current value:', asset.unitValue);
console.log('Metadata:', asset.metadata);
```

### Q: How do I find available RWA assets?

**A:** Use `listRWAAssets`:

```typescript
// Get first 100 available assets
const available = await client.listRWAAssets({
  limit: 100,
  offset: 0
});

// Filter by type
const realEstate = available.data.filter(a => a.assetType === 'real-estate');
console.log('Real estate assets:', realEstate.length);
```

### Q: How do I analyze RWA diversification?

**A:** Group by asset type:

```typescript
const portfolio = await client.getRWAPortfolio();

const byType = {};
portfolio.assets.forEach(asset => {
  if (!byType[asset.assetType]) {
    byType[asset.assetType] = 0;
  }
  byType[asset.assetType] += asset.quantity * asset.unitValue;
});

// Show breakdown
for (const [type, value] of Object.entries(byType)) {
  const percent = (value / portfolio.totalValue * 100).toFixed(1);
  console.log(`${type}: ${percent}%`);
}
```

### Q: Can I track RWA price changes?

**A:** Monitor asset prices over time:

```typescript
class RWAPriceTracker {
  private prices = new Map<string, number[]>();

  async trackAsset(assetId: string, interval = 60000) {
    if (!this.prices.has(assetId)) {
      this.prices.set(assetId, []);
    }

    setInterval(async () => {
      const asset = await client.getRWAAsset(assetId);
      const history = this.prices.get(assetId)!;
      history.push(asset.unitValue);

      if (history.length > 100) {
        history.shift(); // Keep last 100 prices
      }

      const change = this.calculateChange(history);
      console.log(`${assetId}: ${change}%`);
    }, interval);
  }

  private calculateChange(history: number[]): number {
    if (history.length < 2) return 0;
    const old = history[0];
    const new_ = history[history.length - 1];
    return ((new_ - old) / old) * 100;
  }
}
```

---

## Event Streaming

### Q: What are events?

**A:** Events are real-time blockchain occurrences:

- Transaction created/confirmed
- Block created
- Contract events
- Validator changes
- RWA updates

### Q: How do I subscribe to events?

**A:** Use `subscribeToEvents`:

```typescript
await client.subscribeToEvents({
  eventTypes: ['transaction_created', 'block_created'],
  onEvent: (event) => {
    console.log('Event type:', event.type);
    console.log('Event data:', event.data);
  },
  onError: (error) => {
    console.error('Event error:', error);
  },
  onClose: () => {
    console.log('Connection closed');
  }
});
```

### Q: Can I filter events?

**A:** Yes, subscribe and filter manually:

```typescript
const targetAddress = '0x...';

await client.subscribeToEvents({
  eventTypes: ['transaction_created'],
  onEvent: (event) => {
    const { from, to } = event.data;

    if (from === targetAddress || to === targetAddress) {
      console.log('⭐ Target address involved!');
      console.log('Details:', event.data);
    }
  }
});
```

### Q: What if the event connection drops?

**A:** Implement reconnection logic:

```typescript
async function subscribeWithReconnect() {
  let isConnected = false;

  async function connect() {
    try {
      await client.subscribeToEvents({
        onEvent: handleEvent,
        onClose: () => {
          console.log('Connection lost, reconnecting...');
          isConnected = false;
          setTimeout(connect, 5000);
        }
      });
      isConnected = true;
    } catch (error) {
      console.error('Connection failed:', error);
      setTimeout(connect, 5000);
    }
  }

  await connect();
}

function handleEvent(event: any) {
  console.log('Event:', event);
}
```

### Q: Can I buffer events for batch processing?

**A:** Yes, use an event aggregator:

```typescript
class EventBuffer {
  private buffer: any[] = [];
  private flushSize = 100;
  private flushInterval = 5000;

  constructor() {
    setInterval(() => this.flush(), this.flushInterval);
  }

  async start() {
    await client.subscribeToEvents({
      onEvent: (event) => this.add(event)
    });
  }

  add(event: any) {
    this.buffer.push(event);
    if (this.buffer.length >= this.flushSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.buffer.length === 0) return;

    const events = this.buffer.splice(0);
    console.log(`Processing ${events.length} events...`);
    // Process in batch
  }
}
```

---

## Performance & Optimization

### Q: How do I improve API call performance?

**A:** Use these techniques:

1. **Parallel requests** - Use `Promise.all`
2. **Caching** - Store recent results
3. **Pagination** - Fetch in batches
4. **Debouncing** - Limit rapid calls
5. **Request deduplication** - Avoid duplicate calls

See [Best Practices](./DEVELOPER_TUTORIAL.md#best-practices) for code examples.

### Q: How do I handle rate limiting?

**A:** The SDK includes automatic handling:

```typescript
// SDK automatically retries with exponential backoff
// No action needed!

// But you can customize retry behavior:
const client = new AurigraphClient({
  retryConfig: {
    maxRetries: 5,
    backoffMultiplier: 2,
    initialDelay: 1000
  }
});
```

### Q: How do I monitor API performance?

**A:** Track request timing:

```typescript
const timings = [];

client.on('request', () => {
  timings.push({ start: Date.now() });
});

client.on('response', () => {
  const last = timings[timings.length - 1];
  last.duration = Date.now() - last.start;
  console.log(`Request took ${last.duration}ms`);
});

// Average response time
const avg = timings.reduce((a, b) => a + b.duration, 0) / timings.length;
console.log(`Average: ${avg}ms`);
```

### Q: Should I use connection pooling?

**A:** For high-volume applications, yes:

```typescript
const pool = [];
for (let i = 0; i < 5; i++) {
  pool.push(new AurigraphClient({
    baseURL: 'http://localhost:9003',
    auth: { apiKey: 'key' }
  }));
}

// Use round-robin
let current = 0;
function getClient() {
  const client = pool[current % pool.length];
  current++;
  return client;
}
```

### Q: What's the best request timeout?

**A:** It depends on your use case:

```typescript
// Development/testing
timeout: 10000 // 10 seconds

// Production with good network
timeout: 15000 // 15 seconds

// Production with poor network
timeout: 30000 // 30 seconds

// Long-running operations
timeout: 60000 // 60 seconds
```

---

## Troubleshooting

### Q: I get "401 Unauthorized" errors

**A:** Check your authentication:

```bash
# 1. Verify API key exists
echo $AURIGRAPH_API_KEY

# 2. Check it's correctly formatted
# Should start with 'sk_test_' or 'sk_live_'

# 3. Verify it hasn't expired
# Check in your account settings

# 4. Check it has required permissions
# May need to grant scopes
```

### Q: I get "Connection refused" errors

**A:** Verify the server is running:

```bash
# Test connectivity
curl http://localhost:9003/api/v11/health

# Check running services
ps aux | grep aurigraph

# Try different base URL
# Local: http://localhost:9003
# Testnet: https://testnet.aurigraph.io
```

### Q: I get "Request timeout" errors

**A:** Try these solutions:

```typescript
// Increase timeout
const client = new AurigraphClient({
  timeout: 30000 // 30 seconds
});

// Check network speed
// On slow networks, increase timeout further
// Or split large requests into smaller ones
```

### Q: Memory usage keeps increasing

**A:** Check for event listener leaks:

```typescript
// ❌ Bad - Listener not removed
client.on('event', handler);

// ✅ Good - Remove when done
client.off('event', handler);

// ✅ Good - Clean up intervals
const interval = setInterval(() => {
  // ...
}, 5000);

// Clean up
clearInterval(interval);
```

### Q: Transactions are taking too long

**A:** Check these things:

```bash
# 1. Network is congested
# Watch TPS: client.getNetworkMetrics()

# 2. Gas price is too low
# Check current gas prices

# 3. Validator is down
# Check network status

# 4. Broadcasting issue
# Retry the transaction
```

### Q: TypeScript errors about types

**A:** Update dependencies:

```bash
# Update SDK
npm update @aurigraph/sdk

# Update TypeScript
npm update typescript

# Clear cache
rm -rf node_modules package-lock.json
npm install
```

---

## Security

### Q: How do I secure my application?

**A:** Follow these best practices:

1. **Never commit secrets**
   ```bash
   echo ".env" >> .gitignore
   ```

2. **Use environment variables**
   ```typescript
   const apiKey = process.env.AURIGRAPH_API_KEY;
   ```

3. **Validate user input**
   ```typescript
   if (!isValidAddress(address)) {
     throw new Error('Invalid address');
   }
   ```

4. **Use HTTPS in production**
   ```typescript
   baseURL: 'https://api.aurigraph.io'
   ```

5. **Implement rate limiting** on your endpoints
   ```typescript
   // Use express-rate-limit or similar
   ```

### Q: How do I handle private keys safely?

**A:** Never expose private keys:

```bash
# ✅ DO: Use secure vault
# Use AWS Secrets Manager, HashiCorp Vault, etc.

# ❌ DON'T: Hardcode or commit
const privateKey = '0x...'; // ❌ WRONG

# ❌ DON'T: Log or expose
console.log(privateKey); // ❌ WRONG
```

### Q: What should I do if my API key is compromised?

**A:** Immediately:

1. Go to API Management in your account
2. Revoke the compromised key
3. Generate a new key
4. Update your application
5. Rotate through all environments

### Q: How do I audit API usage?

**A:** Monitor API calls:

```typescript
client.on('request', (config) => {
  console.log({
    timestamp: new Date(),
    method: config.method,
    url: config.url,
    headers: config.headers
  });
});
```

### Q: Are there rate limits per IP?

**A:** Rate limits are per API key, not IP. Using multiple keys:

```typescript
const clients = [
  new AurigraphClient({ auth: { apiKey: 'key1' } }),
  new AurigraphClient({ auth: { apiKey: 'key2' } }),
  new AurigraphClient({ auth: { apiKey: 'key3' } })
];
```

Each has its own rate limit.

---

## Need Help?

- **GitHub Issues**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-Developer-Toolkit-and-SDK/issues
- **GitHub Discussions**: https://github.com/Aurigraph-DLT-Corp/Aurigraph-Developer-Toolkit-and-SDK/discussions
- **Email**: support@aurigraph.io
- **Confluence**: https://aurigraphdlt.atlassian.net/wiki/spaces/ADTAS/overview

---

*Generated: October 31, 2025*
*Aurigraph Developer Toolkit v1.0.0*
