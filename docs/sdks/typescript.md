# TypeScript SDK

Official TypeScript/JavaScript SDK for Aurigraph DLT V12. Zero runtime dependencies — uses native `fetch`.

**Current Version**: `1.2.0`
**Minimum Node**: 20 LTS (also works in modern browsers, Deno, Bun)
**TypeScript**: 5.0+ (strict mode compatible)

## Install

```bash
npm install @aurigraph/dlt-sdk
# or
pnpm add @aurigraph/dlt-sdk
# or
yarn add @aurigraph/dlt-sdk
# or
bun add @aurigraph/dlt-sdk
```

## Quickstart

```typescript
import { AurigraphClient } from '@aurigraph/dlt-sdk';

const client = new AurigraphClient({
  baseUrl: 'https://dlt.aurigraph.io',
  appId: process.env.AURIGRAPH_APP_ID,
  apiKey: process.env.AURIGRAPH_API_KEY,
});

// Health check (public)
const health = await client.health.get();
console.log('Platform:', health.status);

// Handshake (auth required)
const hello = await client.handshake.hello();
console.log('Tier:', hello.partnerProfile.tier);

// Query assets
const gold = await client.assets.listByUseCase('UC_GOLD');
console.log('Gold assets:', gold.filtered);
```

## Configuration Options

```typescript
const client = new AurigraphClient({
  baseUrl: 'https://dlt.aurigraph.io',
  appId: 'bc2ce4fa...',
  apiKey: 'aG8VN7aV...',
  timeout: 30000,              // milliseconds
  maxRetries: 3,
  debug: false,                 // logs all requests
  enableQueue: true,            // offline queue
  autoIdempotency: true,       // auto-generate idempotency keys
  fetch: customFetch,          // inject custom fetch (testing)
});
```

## Project Adapters

TypeScript ships with 3 pre-built adapters for domain-specific integrations:

### Battua Adapter

```typescript
import { createBattuaAdapter } from '@aurigraph/dlt-sdk';

const battua = createBattuaAdapter(client);
const balance = await battua.wallet.getBalance('0x742d35...');
const tx = await battua.wallet.p2pTransfer({ to, amount, currency: 'USDC' });
```

### Provenews Adapter

```typescript
import { createProvenewsAdapter } from '@aurigraph/dlt-sdk';

const provenews = createProvenewsAdapter(client);
const contract = await provenews.contracts.create({
  name: 'Video Asset #001',
  c2paManifest: { /* ... */ },
});
```

### Hermes Adapter

```typescript
import { createHermesAdapter } from '@aurigraph/dlt-sdk';

const hermes = createHermesAdapter(client);
const bridgeOp = await hermes.bridge.initiate({ fromChain, toChain, amount });
```

## CLI Wizard

The SDK includes a CLI for scaffolding new integrations:

```bash
npx @aurigraph/dlt-sdk tokenize
```

The wizard prompts for:
1. Use case (UC_GOLD, UC_CARBON, etc.)
2. Framework (Next.js, Express, Hono, Nest, Vite)
3. Auth strategy (API key, Keycloak OIDC, JWT)
4. Sample operations (mint, list, transfer)

Then generates:
- `aurigraph.config.ts` — typed configuration
- `aurigraph.service.ts` — reusable service layer
- `example.ts` — runnable demo

## Offline Queue

Requests queued during network outages replay automatically when connectivity returns:

```typescript
const client = new AurigraphClient({
  baseUrl: 'https://dlt.aurigraph.io',
  apiKey,
  enableQueue: true,
  queueOptions: {
    maxSize: 1000,
    persistPath: './.aurigraph-queue',  // Node only
    maxAgeMs: 86400000,                  // 24h
  },
});

// In the browser, queue persists to IndexedDB automatically
```

## Idempotency

Writes automatically include an `Idempotency-Key: <sha256>` header when `autoIdempotency: true`. The server deduplicates retries of the same logical request:

```typescript
// Retrying this call 100x will result in ONE mint
await client.contracts.deploy({
  templateId: 'UC_GOLD',
  terms: {...},
});
```

Override with a custom key:

```typescript
await client.transactions.submit(
  { to, amount, signature },
  { idempotencyKey: userTransactionId },  // your own UUID
);
```

## TypeScript Types

All responses are strongly typed:

```typescript
import type { HealthResponse, PlatformStats, Asset } from '@aurigraph/dlt-sdk';

const health: HealthResponse = await client.health.get();
//      ^? { status: 'HEALTHY' | 'DEGRADED'; uptime: number; ... }
```

For the asset-agnostic `get(id)` method which returns varying shapes, use the `useCase` field to narrow:

```typescript
const asset = await client.assets.get('RWA-CO-001');
if (asset.useCase === 'UC_GOLD') {
  const weightOz = asset.weightOz as number;
  const purity = asset.purity as string;
}
```

## Browser Usage

The SDK works in modern browsers (Chrome 90+, Firefox 88+, Safari 14+):

```html
<script type="module">
  import { AurigraphClient } from 'https://cdn.aurigraph.io/sdk/1.2.0/index.js';

  const client = new AurigraphClient({
    baseUrl: 'https://dlt.aurigraph.io',
    // NEVER embed API keys in browser code.
    // Use JWT from your own backend's OAuth flow.
    jwtToken: await fetchJwtFromBackend(),
  });
</script>
```

**Security note**: API keys must NEVER ship to the browser. Use JWT tokens obtained via your backend's OAuth flow.

## Bundle Size

Zero dependencies keep the bundle small:

| Format | Minified | Gzip |
|--------|----------|------|
| ESM | 42 KB | 13 KB |
| CommonJS | 46 KB | 14 KB |
| UMD | 48 KB | 15 KB |

## ESM / CommonJS

The package is dual-published:

```typescript
// ESM (preferred)
import { AurigraphClient } from '@aurigraph/dlt-sdk';

// CommonJS
const { AurigraphClient } = require('@aurigraph/dlt-sdk');
```

## Graceful Shutdown

```typescript
process.on('SIGTERM', async () => {
  await client.dispose();  // flushes queue, cancels heartbeats
  process.exit(0);
});
```

## See Also

- [API Reference](../api-reference/) — all namespaces
- [Getting Started](../getting-started.md) — first integration
- [Adapters](../../typescript/src/adapters/) — Battua, Provenews, Hermes
