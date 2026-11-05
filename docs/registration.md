# Partner Registration

Every integration begins with partner registration. This document walks through onboarding from sign-up to your first API call.

## Registration Flow

```
1. Create account at dlt.aurigraph.io
      │
      ▼
2. Verify email (Keycloak magic link)
      │
      ▼
3. Navigate to /sdk-admin — partner dashboard
      │
      ▼
4. Click "Register new application"
      │
      ▼
5. Fill application details:
   - Name (e.g., "Acme Trading")
   - Use cases (multi-select from 16)
   - Redirect URIs (for OAuth flows)
   - Webhook URLs (optional)
      │
      ▼
6. Receive appId + rawKey (ONE-TIME display)
      │
      ▼
7. Install SDK, configure credentials, make first call
```

## What You Get Back

After registration, you receive two credentials:

```json
{
  "appId": "bc2ce4fa-e82d-4b7c-a561-5a0e40888999",
  "rawKey": "aG8VN7aVtfm0_ZrN2-H6vU2XwP3JfBtsRjGnKa4vPp_d7Q8s",
  "createdAt": "2026-04-13T16:00:00Z",
  "tier": "SANDBOX",
  "scopes": [
    "rwa:read", "contracts:read", "nodes:read",
    "channels:read", "stats:read", "compliance:read"
  ]
}
```

**Critical**: `rawKey` is shown **once**. If you lose it, you must regenerate the key pair (which invalidates the old one). Store it in a secret manager immediately.

## Option B: Scope Approval Model

The platform uses a hybrid scope model:

**Auto-approved on registration** (all 6 read scopes):
- `rwa:read`
- `contracts:read`
- `nodes:read`
- `channels:read`
- `stats:read`
- `compliance:read`

**Admin-gated** (request after registration):
- `rwa:write` — mint assets
- `contracts:deploy` — deploy smart contracts
- `transactions:submit` — submit transactions
- `governance:vote` — cast governance votes
- `wallet:transfer` — initiate transfers

To request admin-gated scopes, go to `/sdk-admin` → your app → "Request scope" → select scope → provide justification. Approval SLA:

| Tier | SLA |
|------|-----|
| SANDBOX | Manual (no admin scopes available) |
| STARTER | 3 business days |
| BUSINESS | 1 business day |
| ENTERPRISE | Immediate (contractual) |

## Configuration

After registration, configure your environment:

```bash
# .env
AURIGRAPH_APP_ID=bc2ce4fa-e82d-4b7c-a561-5a0e40888999
AURIGRAPH_API_KEY=aG8VN7aVtfm0_ZrN2-H6vU2XwP3JfBtsRjGnKa4vPp_d7Q8s
AURIGRAPH_BASE_URL=https://dlt.aurigraph.io
```

Never commit these values. Add `.env` to `.gitignore`.

### Java

```java
AurigraphClient client = AurigraphClient.builder()
    .baseUrl(System.getenv("AURIGRAPH_BASE_URL"))
    .appId(System.getenv("AURIGRAPH_APP_ID"))
    .apiKey(System.getenv("AURIGRAPH_API_KEY"))
    .build();
```

### TypeScript

```typescript
const client = new AurigraphClient({
  baseUrl: process.env.AURIGRAPH_BASE_URL!,
  appId: process.env.AURIGRAPH_APP_ID,
  apiKey: process.env.AURIGRAPH_API_KEY,
});
```

### Python

```python
import os
from aurigraph_sdk import AurigraphClient

client = AurigraphClient(
    base_url=os.environ["AURIGRAPH_BASE_URL"],
    app_id=os.environ["AURIGRAPH_APP_ID"],
    api_key=os.environ["AURIGRAPH_API_KEY"],
)
```

### Rust

```rust
use aurigraph_sdk::AurigraphClient;

let client = AurigraphClient::builder()
    .base_url(std::env::var("AURIGRAPH_BASE_URL")?)
    .app_id(std::env::var("AURIGRAPH_APP_ID")?)
    .api_key(std::env::var("AURIGRAPH_API_KEY")?)
    .build()?;
```

## Verification — First Call

After configuring credentials, verify with a handshake:

```java
HelloResponse hello = client.handshake().hello();
System.out.println("✅ Registered as: " + hello.partnerProfile().name());
System.out.println("   Tier: " + hello.partnerProfile().tier());
System.out.println("   Session: " + hello.sessionId());
```

If you see `ERR_SDK_HANDSHAKE_001`, your credentials are wrong. Double-check:
1. No whitespace around `appId` or `apiKey`
2. Using the paired pattern `{appId}:{rawKey}` in the Authorization header
3. Key hasn't been revoked (check `/sdk-admin`)

## Webhooks

Register webhook URLs during application setup or later via the SDK:

```java
client.sdk().registerWebhook("https://your-app.io/webhook",
    List.of("asset.minted", "transaction.settled", "tier.upgraded"));
```

### Webhook signatures

Every webhook carries an `X-Aurigraph-Signature` header. It is an HMAC made with the platform's webhook signing key. The secret you receive when you register a webhook is stored hashed and is not the MAC key. Distribution of the verification key to partners is pending (AV11-3944); Aurigraph will issue you the key to verify with. There are two formats. Accept both during the migration.

| Format | Header value | What is MACed | Replay protection |
|---|---|---|---|
| **v2** (AV11-3950 standard; what production sends) | `t=<unix-seconds>,n=<32 hex>,v1=<64 hex>` | HMAC-SHA256 over `t + "." + n + "." + raw body bytes` | ±300 s window plus a single-use nonce |
| **Legacy** (sent by builds before AV11-3950; accept during the migration) | `sha256=<64 hex>` | HMAC-SHA256 over the raw body bytes only | None. A captured delivery can be replayed. |

**Status (2026-11-05).** Production is on build `b7c97dd`, which includes the AV11-3950 v2 emitter, so live deliveries carry v2 headers. Keep accepting the legacy `sha256=` format during the migration, for example for deliveries retried from before the upgrade. Remove the legacy branch when Aurigraph announces the end of the migration.

How to verify a v2 header:

1. Use the **raw** request bytes. Never re-serialize a parsed JSON object, because key order and whitespace would change the MAC.
2. Decode `v1` from hex and check that it is 32 bytes. Compare it with a **constant-time** function, such as `crypto.timingSafeEqual` on Buffers, `hmac.compare_digest`, `MessageDigest.isEqual` or `subtle.ConstantTimeCompare`. Never use `===` on strings.
3. Check the time window **after** the MAC, so a forged header cannot probe your clock. Reject when `|now - t| > 300` seconds.
4. Reject a nonce `n` you have already seen inside the window. If you run several receiver instances, use a store they all share.
5. The verification key is at least 32 bytes (UTF-8). The v2 signer refuses to sign with a shorter key.

**This is classical, symmetric cryptography.** HMAC-SHA256 with a shared secret proves the sender knew the secret. It is not a post-quantum signature (ML-DSA), and it is not a public-key signature. A 256-bit HMAC key is not considered at practical risk from known quantum attacks. Anyone who holds the key can forge deliveries, so keep the verification key in a secret manager.

```javascript
// Node 18+ (ESM). No SDK helper is needed.
import { createHmac, timingSafeEqual } from 'node:crypto';

const WINDOW_SECONDS = 300;
const seenNonces = new Map(); // nonce -> unix seconds. Use a shared store (e.g. Redis) if you run several receivers.

function equalHex(expectedHex, receivedHex) {
  if (!/^[0-9a-f]{64}$/.test(receivedHex)) return false;
  const a = Buffer.from(expectedHex, 'hex');
  const b = Buffer.from(receivedHex, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

// rawBody must be the exact bytes received (a Buffer), never JSON.stringify(req.body).
export function verifyAurigraphWebhook(secret, header, rawBody, now = Math.floor(Date.now() / 1000)) {
  if (Buffer.byteLength(secret, 'utf8') < 32) return false;   // keys shorter than 32 bytes are refused
  if (typeof header !== 'string') return false;

  // v2 (AV11-3950): t=<unix>,n=<32 hex>,v1=<64 hex>
  const f = Object.fromEntries(header.split(',').map((p) => p.trim().split('=', 2)));
  if (f.t && f.n && f.v1) {
    const t = Number.parseInt(f.t, 10);
    if (!Number.isFinite(t) || !/^[0-9a-f]{32}$/.test(f.n)) return false;
    const mac = createHmac('sha256', secret)
      .update(Buffer.concat([Buffer.from(`${t}.${f.n}.`, 'ascii'), rawBody]))
      .digest('hex');
    if (!equalHex(mac, f.v1)) return false;                    // MAC first ...
    if (Math.abs(now - t) > WINDOW_SECONDS) return false;      // ... then the time window
    for (const [n, at] of seenNonces) if (at < now - WINDOW_SECONDS) seenNonces.delete(n);
    if (seenNonces.has(f.n)) return false;                     // replayed delivery
    seenNonces.set(f.n, now);
    return true;
  }

  // Legacy (builds before AV11-3950; accept during the migration): sha256=<hex>, body only, no replay protection.
  if (header.startsWith('sha256=')) {
    const mac = createHmac('sha256', secret).update(rawBody).digest('hex');
    return equalHex(mac, header.slice('sha256='.length));
  }
  return false;
}

// Express: keep the raw bytes.
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!verifyAurigraphWebhook(process.env.AURIGRAPH_WEBHOOK_VERIFY_KEY, req.get('X-Aurigraph-Signature'), req.body)) {
    return res.status(401).send('Invalid signature');
  }
  const event = JSON.parse(req.body.toString('utf8'));
  // Process event, then:
  res.status(200).send('OK');
});
```

You can check your verifier with this published **test** vector. It is a test value, not a production secret. Key `av11-3950-test-key-32-bytes-ok!!`, body `{"ok":true}`, now `1700000000`:
`t=1700000000,n=0123456789abcdef0123456789abcdef,v1=aaa31b1100db0018d228f0903282d38b57e920daf2735e81fb47b3b1e5863c34` must verify. The same header with any other body must fail.

## Multi-Application Organizations

Organizations can register multiple applications under one account (e.g., `acme-trading-prod` + `acme-trading-staging`). Each app gets independent credentials, tier, and scope set.

Navigate to `/sdk-admin/organizations` to manage your organization's applications.

## Key Rotation

Rotate API keys quarterly for security:

1. Navigate to `/sdk-admin/apps/{appId}` → "Rotate key"
2. The old key remains valid for 7 days (overlap window)
3. Update your secret manager with the new key
4. Deploy with new key
5. Old key auto-expires after 7 days

During the overlap window, both keys work. Use this window to roll deploys without downtime.

## Deregistration

To permanently close an application:

1. Navigate to `/sdk-admin/apps/{appId}` → "Delete application"
2. Confirm with your account password
3. All active sessions terminate immediately
4. API keys are permanently revoked
5. Webhook subscriptions are cancelled
6. GDPR erasure is triggered for partner-specific data

Deregistration is **irreversible**. Integrations stop working immediately.

## See Also

- [Authentication](authentication.md) — how the paired auth header works
- [Sandbox](sandbox.md) — testing your integration
- [Tier System](tier-system.md) — upgrade paths
- [Policies](policies.md) — Terms, DPA, Privacy Policy
