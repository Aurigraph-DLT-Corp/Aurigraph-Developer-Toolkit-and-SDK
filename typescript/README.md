# @aurigraph/dlt-sdk

Official TypeScript SDK for the **Aurigraph DLT** V12 platform (V11 API).

Zero runtime dependencies — uses native `fetch` (Node 18+ or any modern browser).

## Installation

```bash
npm install @aurigraph/dlt-sdk
```

## One-click setup

Run the interactive wizard in your project root — it detects your framework,
calls the Aurigraph V12 handshake endpoint, and generates a ready-to-use
config + sample integration file:

```bash
npx @aurigraph/dlt-sdk init
```

**Flags**:

| Flag            | Meaning                                                  |
|-----------------|----------------------------------------------------------|
| `--dry-run`     | Run the wizard but do not write files or call the server |
| `--yes`, `-y`   | Overwrite existing files without prompting               |
| `--cwd <dir>`   | Target directory (default: current working directory)    |
| `--help`, `-h`  | Show help                                                |
| `--version`     | Show SDK version                                         |

**Project type examples**:

```bash
# Provenews (device attestation + C2PA contracts)
cd my-provenews-app && npx @aurigraph/dlt-sdk init
# → select "Provenews" → scopes: registry:read, dmrv:write, contracts:write

# Battua (stablecoin wallet + transfer DMRV)
cd my-battua-app && npx @aurigraph/dlt-sdk init
# → select "Battua" → scopes: registry:write, dmrv:write, mint:token
# Note: the Battua wallet service itself lives in github.com/Aurigraph-DLT-Corp/Battua.
# This SDK adapter is for recording Battua transfer events on the V12 DMRV registry.

# Hermes (algorithmic trading + audit-trail DMRV)
cd my-hermes-app && npx @aurigraph/dlt-sdk init
# → select "Hermes" → scopes: registry:read, channels:read, contracts:write
```

## Tokenization Wizard

After `init`, run the **tokenization wizard** to configure your app for the
full RWAT tokenization, minting, and issuance pipeline. Unlike `init` (which
wires authentication + basic client), `tokenize` generates a service class
that maps your existing app lifecycle into Aurigraph's 5-stage pipeline:

1. **Register** → `POST /api/v11/provenews/ledger/assets`
2. **DMRV event** → `POST /api/v11/dmrv/events`
3. **Verify** → recorded as a DMRV `VERIFICATION` event
4. **Mint / issue** → use-case-specific mint endpoint (e.g. Battua, generic token registry)
5. **Assemble** (COMPOSITE only) → `POST /api/v11/provenews/tokens/composite`

```bash
# First, make sure you've run init:
npx @aurigraph/dlt-sdk init

# Then configure tokenization:
npx @aurigraph/dlt-sdk tokenize
```

The wizard walks you through 10 steps:

1. Load `.env.aurigraph` from the init wizard
2. Verify the handshake (`client.sdk.hello()`) — fetches approved/pending scopes
3. **Use case** — choose from 20 canonical RWAT use cases (Provenews, Battua,
   Gold, Carbon, Real Estate, IP, Art, Infrastructure, Content, Battery
   Aadhar, Battery Passport, AGCS, Agri, Trade Finance, Water Rights,
   Royalty Streams, PE/VC, Private Debt, ESG, Custom)
4. **Token type** — `PRIMARY`, `SECONDARY`, or `COMPOSITE`
5. **DMRV framework** — auto-derived from use case with override
   (C2PA, LBMA, VCM, EU-ETS, ISO-14064, GHG-Protocol, AIS-156, etc.)
6. **Jurisdiction** — IN, EU, US, UAE, SG, ZA, IN_EU, GLOBAL
7. **Asset metadata schema** — paste your app's asset model fields
8. **Lifecycle hook mapping** — describe when each of the 5 stages fires in
   your app (used as comments in the generated service)
9. Confirm + generate
10. Summary with scope status + next steps

### Generated files

| File | Purpose |
|------|---------|
| `aurigraph-tokenization.config.ts` | Use case, token type, framework, jurisdiction, credentials loaded from env vars, `MyAsset` interface matching your schema |
| `aurigraph-tokenization.service.ts` | `AurigraphTokenizationService` class with 5-stage methods (`registerAsset`, `recordDmrvEvent`, `verifyAsset`, `mintToken`, and optionally `assembleComposite` / `deriveToken`) |
| `aurigraph-tokenization.example.ts` | End-to-end runnable example showing all 5 stages in sequence |
| `TOKENIZATION_INTEGRATION.md` | Scope requirements table, current scope status, error code reference, admin approval curl command |

### Non-TTY / CI usage

In CI environments, the wizard reads defaults from env vars:

```bash
AURIGRAPH_WIZARD_USE_CASE=PROVENEWS \
AURIGRAPH_WIZARD_TOKEN_TYPE=COMPOSITE \
AURIGRAPH_WIZARD_FRAMEWORK=C2PA \
AURIGRAPH_WIZARD_JURISDICTION=EU \
AURIGRAPH_WIZARD_FIELDS='assetId:string,ownerId:string,contentHash:string,createdAt:Date' \
  npx @aurigraph/dlt-sdk tokenize --yes
```

See the [handshake protocol docs](https://dlt.aurigraph.io/docs/handshake)
and the [Tokenization Wizard Guide](../../aurigraph-v12/docs/TOKENIZATION_WIZARD_GUIDE.md)
for the full pipeline specification.


**Generated files** (in your project root):

```
.env.aurigraph              # AURIGRAPH_BASE_URL / APP_ID / API_KEY / ... (gitignore this!)
aurigraph-sdk.config.json   # Non-secret config (safe to commit)
aurigraph-integration.ts    # Express/Next/Nest/Fastify/Vite sample
AurigraphConfig.java        # Quarkus sample
aurigraph_integration.py    # FastAPI / Flask / Django sample
aurigraph-sdk-example.ts    # Generic Node fallback
```

The wizard is idempotent — re-running it will skip existing files unless you
pass `--yes`. In CI (non-TTY), all prompts fall back to defaults from env
vars (`AURIGRAPH_APP_NAME`, `AURIGRAPH_BASE_URL`, `AURIGRAPH_PROJECT_TYPE`,
`AURIGRAPH_SCOPES`, `AURIGRAPH_CALLBACK_URL`).

## Quickstart

### 1. Health check

```ts
import { AurigraphClient } from '@aurigraph/dlt-sdk';

const client = new AurigraphClient({
  baseUrl: 'https://dlt.aurigraph.io',
  apiKey: process.env.AURIGRAPH_API_KEY,
});

const health = await client.health.get();
console.log(health.status); // "HEALTHY"

const stats = await client.stats.get();
console.log(`TPS: ${stats.tps}, nodes: ${stats.activeNodes}`);
```

### 2. Query nodes and registries

```ts
// List all registered nodes
const { nodes, total } = await client.nodes.list(0, 100);
console.log(`${total} nodes registered`);

// Aggregate metrics
const metrics = await client.nodes.getMetrics();
console.log(`${metrics.activeNodes}/${metrics.totalNodes} active`);

// Battua token registry
const tokens = await client.registries.battua.tokens();

// 9 RWAT use cases
const useCases = await client.useCases.list();
useCases.forEach((uc) => console.log(uc.id, uc.name));
```

### 3. Submit a signed transaction

```ts
const receipt = await client.transactions.submit({
  fromAddress: '0xsender...',
  toAddress:   '0xrecipient...',
  amount:      '100.50',
  asset:       'USDT',
  memo:        'invoice-42',
  signature:   '<ed25519-hex>',
  publicKey:   '<sender-pubkey-hex>',
});

console.log(`tx ${receipt.txHash} → ${receipt.status}`);

// Query recent transactions
const recent = await client.transactions.recent(20);
```

## Configuration

```ts
new AurigraphClient({
  baseUrl:    'https://dlt.aurigraph.io', // required
  appId:      '...',                      // required for production SDK auth (UUID)
  apiKey:     '...',                      // paired with appId → Authorization: ApiKey <appId>:<apiKey>
  jwtToken:   '...',                      // OR a Keycloak JWT → Authorization: Bearer <jwt>
  timeoutMs:  10000,                      // default 10s
  maxRetries: 3,                          // default 3 (exponential backoff on 5xx)
  debug:      false,                      // enable console.debug logging

  // Optional — SDK Handshake Protocol
  autoHandshake: true,                    // fire sdk.hello() on construction (default false)
  autoHeartbeat: true,                    // start 5-min sdk.heartbeat() interval (default false)
  clientVersion: '1.0.0',                 // reported in heartbeat requests
  onHandshake: (hello) => {
    console.log('approved scopes:', hello.approvedScopes);
    console.log('rate limit:', hello.rateLimit.requestsPerMinute, 'req/min');
  },
});
```

### Authentication header

The client sends exactly one auth header, chosen in this precedence order:

| Config                        | Header sent                                     |
|-------------------------------|-------------------------------------------------|
| `jwtToken`                    | `Authorization: Bearer <jwt>`                   |
| `appId` **+** `apiKey`        | `Authorization: ApiKey <appId>:<apiKey>` **(production SDK auth)** |
| `apiKey` alone  _(deprecated)_| `X-API-Key: <apiKey>` + one-time console warning |

> **Migration note**: Existing callers that pass only `apiKey` continue to
> work (the SDK sends the legacy `X-API-Key` header for backward compatibility)
> but will see a one-time deprecation warning on stdout. The backend
> `SdkApiKeyAuthFilter` on production expects `Authorization: ApiKey
> <appId>:<apiKey>` — add the `appId` field to your config to migrate.

## Handshake Protocol

The V12 backend exposes a 4-endpoint SDK Handshake Protocol under
`/api/v11/sdk/handshake/*` that lets 3rd-party apps:

- **bootstrap** — announce themselves and discover their approved scopes,
  rate limits, server version, and enabled features
- **heartbeat** — keep the app session alive (every 5 minutes)
- **capabilities** — list the endpoints this app is permitted to call
- **config** — lightweight refresh to detect scope/status changes

### Manual usage

```ts
const client = new AurigraphClient({
  baseUrl: 'https://dlt.aurigraph.io',
  appId:   process.env.AURIGRAPH_APP_ID,
  apiKey:  process.env.AURIGRAPH_API_KEY,
});

// 1. Bootstrap — returns full server metadata + this app's permissions
const hello = await client.sdk.hello();
console.log(`connected to v${hello.serverVersion}, scopes: ${hello.approvedScopes.join(', ')}`);
console.log(`rate limit: ${hello.rateLimit.requestsPerMinute} req/min`);
console.log(`features:`, hello.features); // { dmrv: true, contracts: true, ... }

// 2. Heartbeat — call every 5 minutes (or set autoHeartbeat: true)
const hb = await client.sdk.heartbeat('my-app/1.0.0');
console.log(`next heartbeat due at ${hb.nextHeartbeatAt}`);

// 3. Capabilities — endpoint listing filtered by approved scopes
const caps = await client.sdk.capabilities();
console.log(`${caps.totalEndpoints} endpoints available:`);
caps.endpoints.forEach(e => console.log(`  ${e.method} ${e.path}  (${e.requiredScope})`));

// 4. Config refresh — detects scope/status changes without full hello
const cfg = await client.sdk.config();
if (cfg.pendingScopes.length > 0) {
  console.warn('pending scope approvals:', cfg.pendingScopes);
}
```

### Automatic handshake + heartbeat

Set `autoHandshake: true` and `autoHeartbeat: true` to have the client
bootstrap on construction and keep the session alive automatically:

```ts
const client = new AurigraphClient({
  baseUrl: 'https://dlt.aurigraph.io',
  appId:   process.env.AURIGRAPH_APP_ID,
  apiKey:  process.env.AURIGRAPH_API_KEY,
  autoHandshake: true,
  autoHeartbeat: true,
  clientVersion: '1.0.0',
  onHandshake: (hello) => {
    // Called once the initial hello() resolves successfully.
    if (hello.pendingScopes.length > 0) {
      console.warn('App has pending scope approvals:', hello.pendingScopes);
    }
  },
});

// ... use client normally ...

// On graceful shutdown, stop the heartbeat interval.
process.on('SIGTERM', () => {
  client.dispose();
});
```

Both auto-flags are **best-effort** — a failed handshake or heartbeat will be
logged (when `debug: true`) but will not throw, so your app startup and
runtime are never blocked by the handshake subsystem.

### Scope approval model (Option B)

Scopes come in two tiers — read scopes auto-approve at registration time,
write scopes require an admin to explicitly grant them.

**Auto-approved (effective immediately on registration)**:

- `registry:read`
- `dmrv:read`
- `stats:read`
- `channels:read`
- `contracts:read`
- `health:read`

**Admin-gated (pending until an operator approves them)**:

- `registry:write`
- `dmrv:write`
- `mint:token`
- `contracts:write`
- `channels:write`

When you register an app with write scopes, they land in `requestedScopes`
and `pendingScopes` but **not** in `approvedScopes`. Call `client.sdk.hello()`
or `client.sdk.config()` to check whether an admin has approved them. Using
an endpoint whose required scope is still pending returns
HTTP 403 with `errorCode: ERR_SDK_SCOPE_PENDING`.

```ts
const hello = await client.sdk.hello();
if (hello.pendingScopes.includes('mint:token')) {
  console.warn('mint:token awaiting admin approval — minting will fail');
}
```

### Header format (important)

SDK requests authenticate with a single header:

```
Authorization: ApiKey <appId-uuid>:<rawKey>
```

**NOT** `X-API-Key`. The legacy `X-API-Key` header remains supported for
backward compatibility but emits a one-time deprecation warning at runtime
and will be removed in a future release. Pass both `appId` and `apiKey` in
the client config to use the modern `ApiKey` scheme.

See also: [`aurigraph-v12/docs/HANDSHAKE_PROTOCOL.md`](../../aurigraph-v12/docs/HANDSHAKE_PROTOCOL.md)
for the full protocol reference, state machine, error-code catalog, and
rate-limit policy.

## Tier Management

The V12 backend enforces per-partner tier limits on minting, DMRV recording,
and webhook registration. The SDK exposes these endpoints under `client.sdk.*`:

```ts
// Check your tier and quota
const tier = await client.sdk.tier();
console.log(`Tier: ${tier.tierName}, mint limit: ${tier.limits.mintMonthly}/month`);

const quota = await client.sdk.mintQuota();
console.log(`Remaining: ${quota.mintMonthlyRemaining} mints this month`);

// List available token types for your tier
const types = await client.sdk.tokenTypes();
types.forEach(t => console.log(`${t.typeCode}: ${t.displayName} (min tier: ${t.tierMinLevel})`));

// Mint with automatic Battua default
const receipt = await client.sdk.mint({
  typeCode: 'PRIMARY',
  amount: 1,
  metadata: { assetId: 'asset-001', valuation: '1000', custodian: 'acme', jurisdiction: 'IN' },
});
// useCaseId defaults to UC_BATTUA on the server

// Safe mint with pre-flight quota check
const receipt2 = await client.sdk.mintSafe({
  typeCode: 'NFT',
  amount: 1,
  metadata: { mediaUri: '...', attributes: {} },
});

// Partner profile and usage
const profile = await client.sdk.profile();
console.log(`App: ${profile.appName}, KYC: ${profile.kycStatus}`);

const usage = await client.sdk.usage();
console.log(`Today: ${usage.today.mintCount} mints, ${usage.today.dmrvCount} DMRV events`);

// Webhooks
const hooks = await client.sdk.webhooks();
const { webhookId } = await client.sdk.registerWebhook({
  url: 'https://myapp.example.com/webhooks/aurigraph',
  events: ['mint.completed', 'dmrv.recorded'],
});
await client.sdk.deleteWebhook(webhookId);

// DMRV with daily quota enforcement
const dmrvResult = await client.sdk.recordDmrv({
  deviceId: 'sensor-42',
  eventType: 'METER_READING',
  quantity: 100,
  unit: 'kWh',
});
console.log(`DMRV daily remaining: ${dmrvResult.dmrvDailyRemaining}`);
```

## Error handling

All errors extend `AurigraphError` and expose the RFC 7807 `problem+json` body:

```ts
import { AurigraphClientError, AurigraphServerError } from '@aurigraph/dlt-sdk';

try {
  await client.nodes.register({ nodeId: '', nodeType: 'VALIDATOR' });
} catch (err) {
  if (err instanceof AurigraphClientError) {
    console.error('4xx:', err.problem?.errorCode, err.problem?.detail);
  } else if (err instanceof AurigraphServerError) {
    console.error('5xx after retries:', err.message);
  }
}
```

## API surface

| Namespace | Methods |
|-----------|---------|
| `client.sdk`                            | `hello()`, `heartbeat()`, `capabilities()`, `config()`, `profile()`, `tier()`, `usage()`, `mintQuota()`, `tokenTypes()`, `mint()`, `mintSafe()`, `recordDmrv()`, `webhooks()`, `registerWebhook()`, `deleteWebhook()` |
| `client.health`                         | `get()` |
| `client.stats`                          | `get()` |
| `client.nodes`                          | `list()`, `get()`, `register()`, `getMetrics()` |
| `client.registries.battua`              | `tokens()`, `getToken()`, `getTokenByTxHash()`, `mint()`, `nodes()`, `getNode()`, `registerNodeHeartbeat()`, `nodeStats()`, `stats()` |
| `client.registries.provenews`           | `contracts()`, `createContract()`, `getContract()`, `getContractByToken()`, `getContractsByOwner()`, `recordRevenue()`, `listRevenue()`, `suspendContract()`, `terminateContract()`, `assets()`, `registerAsset()`, `getAsset()`, `getAssetProof()`, `checkpoints()`, `getCheckpoint()`, `org()` |
| `client.registries.provenews.tokens`    | `assembleComposite()`, `getToken()`, `verifyToken()`, `listByOwner()` |
| `client.registries.provenews.devices`   | `register()`, `listByUser()`, `get()` |
| `client.registries.provenews.tokenization` | `nodes()`, `assignValidators()`, `status()` |
| `client.registries.tokens`              | `list()`, `get()`, `create()`, `mint()`, `getHolders()`, `getTransfers()`, `stats()` |
| `client.useCases`                       | `list()`, `get()` |
| `client.channels`                       | `list()`, `get()`, `create()` |
| `client.transactions`                   | `recent()`, `submit()`, `get()`, `list()` |
| `client.dmrv`                           | `recordEvent()`, `batchRecord()`, `getAuditTrail()`, `triggerMint()` |
| `client.contracts`                      | `getTokens()`, `bindComposite()`, `issueDerivedFromComposite()`, `getBindingsForContract()`, `getBindingsForToken()` |

## DMRV namespace

Record sensor / meter / device events and trigger on-chain mints on
active Ricardian contracts.

```ts
// Single event
await client.dmrv.recordEvent({
  deviceId: 'battery-ABC123',
  eventType: 'BATTERY_SWAP',
  quantity: 1,
  unit: 'count',
});

// Batched (SDK splits into chunks of 50 automatically)
await client.dmrv.batchRecord(
  meterReadings.map((r) => ({
    deviceId: r.meterId,
    eventType: 'METER_READING',
    quantity: r.kWh,
    unit: 'kWh',
    timestamp: r.iso,
  })),
);

// DMRV-triggered mint (contractId must be a UUID — validated client-side)
const receipt = await client.dmrv.triggerMint(
  '11111111-2222-4333-8444-555555555555',
  'CARBON_OFFSET',
  2.5,
);
console.log(receipt.tokenId, receipt.txHash);
```

## Generic Token Registry

Create and mint tokens on your own entries in the V12 generic token
registry (`/api/v11/registries/tokens`). This is the 3rd-party path —
tokens you create here belong to your organisation, not to a specific
RWAT use case.

```ts
import { AurigraphClient } from '@aurigraph/dlt-sdk';

const client = new AurigraphClient({
  baseUrl: 'https://dlt.aurigraph.io',
  apiKey: process.env.AURIGRAPH_API_KEY, // requires registry:write + mint:token scopes
  autoIdempotency: true,
});

// 1. List tokens with filter + pagination
const page = await client.registries.tokens.list({
  standard: 'PRIMARY',
  active: true,
  size: 20,
});
console.log(`${page.totalElements} PRIMARY tokens`);

// 2. Create your own token
const token = await client.registries.tokens.create({
  tokenType: 'UTILITY',
  name: 'My Utility Token',
  symbol: 'MUT',
  totalSupply: 1_000_000,
  decimals: 18,
  metadata: { purpose: 'rewards', issuer: 'acme-corp' },
});
console.log(`created ${token.id}`);

// 3. Mint additional supply to a recipient — Idempotency-Key is auto-attached
const receipt = await client.registries.tokens.mint(token.id, {
  toAddress: '0xrecipient',
  amount: 1000,
  metadata: { invoiceId: 'INV-42' },
});
console.log(`minted ${receipt.amount}, new supply = ${receipt.newTotalSupply}`);

// 4. Aggregate stats (computed client-side — V12 has no /stats endpoint)
const stats = await client.registries.tokens.stats();
console.log(`${stats.activeTokens}/${stats.totalTokens} active`, stats.byType);
```

All list-style calls (`list`, `getHolders`, `getTransfers`, `stats`)
return empty collections on transport failure — they never throw — so
dashboards stay resilient (Session #117 pattern). `get`, `create` and
`mint` propagate 4xx/5xx errors as `AurigraphClientError` /
`AurigraphServerError` so callers can surface validation failures.

## Offline queue + idempotency

The SDK can transparently buffer mutating requests (POST/PUT/DELETE) that
fail due to 5xx or network errors, and replay them when the network returns.

```ts
import { AurigraphClient } from '@aurigraph/dlt-sdk';

const client = new AurigraphClient({
  baseUrl: 'https://dlt.aurigraph.io',
  apiKey: process.env.AURIGRAPH_API_KEY,
  enableQueue: true,             // opt-in offline queue
  autoIdempotency: true,         // auto-attach Idempotency-Key header
  queueOptions: {
    maxSize: 1000,               // drops oldest when full
    flushIntervalMs: 30_000,     // auto-flush every 30 s
    storage: globalThis.localStorage, // optional persistence
  },
});

// Subscribe to queue events
client.queue()?.onEvent('flush', (op) => console.log('replayed', op));
client.queue()?.onEvent('drop',  (op) => console.warn('dropped', op));

// This call is auto-queued if the server is down:
await client.dmrv.recordEvent({
  deviceId: 'sensor-1',
  eventType: 'METER_READING',
  quantity: 42,
}).catch((e) => console.warn('queued for retry:', e.message));

// Manual flush (e.g. on 'online' event)
window.addEventListener('online', () => client.queue()?.flush());
```

**How idempotency works**: when `autoIdempotency` is enabled, every
mutating request gets a deterministic SHA-256 header
(`Idempotency-Key: <hex>`) derived from its method, path and canonicalised
JSON body. Identical payloads produce identical keys, so the V12 server
can safely dedupe duplicate submissions on retry.

## Provenews integration

Record content-provenance events (C2PA framework) and mint attribution
tokens for signed Ricardian contracts.

```ts
import { AurigraphClient, ProvenewsAdapter } from '@aurigraph/dlt-sdk';

const client = new AurigraphClient({ baseUrl: 'https://dlt.aurigraph.io' });
const provenews = new ProvenewsAdapter(client);

await provenews.recordAssetEvent({
  assetId:     'article-4242',
  eventType:   'ContentRegistered',
  contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  ownerId:     'newsroom-alpha',
  timestamp:   new Date().toISOString(),
});

const mint = await provenews.mintAttributionToken('550e8400-e29b-41d4-a716-446655440000');
console.log(`attribution token ${mint.tokenId} → ${mint.status}`);
```

## Battua integration

Record stablecoin transfers and settlement finality events (ISO_14064
framework) plus Battua node heartbeats.

> **Repository note**: The Battua wallet service, mobile apps, and UI live in
> [`Aurigraph-DLT-Corp/Battua`](https://github.com/Aurigraph-DLT-Corp/Battua).
> This SDK adapter is the **integration interface** that 3rd parties use to
> push Battua transfer events into the V12 DMRV registry — it is NOT the
> Battua wallet itself. The wallet calls these same V12 endpoints internally.

```ts
import { AurigraphClient, BattuaAdapter } from '@aurigraph/dlt-sdk';

const client = new AurigraphClient({ baseUrl: 'https://dlt.aurigraph.io' });
const battua = new BattuaAdapter(client);

await battua.recordTransferEvent({
  txHash:     '0xdeadbeefcafe',
  fromWallet: 'aur1alice123',
  toWallet:   'aur1bob456789',
  amount:     '1000.50',
  symbol:     'USDT',
  memo:       'invoice-42',
});

await battua.registerNodeHeartbeat('battua-node-1');
const status = await battua.getNodeStatus('battua-node-1');
console.log(status.status);
```

## Hermes integration

Record trades, batches and settlement events for the Hermes (HMS) trading
platform (GHG_PROTOCOL framework). Batches larger than 50 trades are
split into 50-trade chunks automatically.

```ts
import { AurigraphClient, HermesAdapter } from '@aurigraph/dlt-sdk';

const client = new AurigraphClient({ baseUrl: 'https://dlt.aurigraph.io' });
const hermes = new HermesAdapter(client);

await hermes.recordTrade({
  tradeId:       'trade-0001',
  symbol:        'BTC/USD',
  side:          'BUY',
  quantity:      '0.5',
  price:         '65000.00',
  traderAddress: '0x1234567890abcdef1234567890abcdef12345678',
  timestamp:     new Date().toISOString(),
});

// Batches > 50 trades are chunked automatically.
await hermes.recordBatch({ batchId: 'batch-1', trades: manyTrades, totalVolume: '123.4' });

const auditTrail = await hermes.getTradeAuditTrail(
  '0x1234567890abcdef1234567890abcdef12345678',
);
```

## Development

```bash
npm install
npm run typecheck     # tsc --noEmit
npm test              # vitest run
npm run build         # emit dist/
```

## License

Apache-2.0
