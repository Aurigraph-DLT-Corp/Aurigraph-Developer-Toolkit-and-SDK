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

The platform signs webhooks with HMAC-SHA256 using a per-webhook secret. Verify on receipt:

```typescript
// Express example
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-aurigraph-signature'] as string;
  const computed = hmacSha256(WEBHOOK_SECRET, req.rawBody);
  if (!timingSafeEqual(signature, computed)) {
    return res.status(401).send('Invalid signature');
  }
  // Process event
  res.status(200).send('OK');
});
```

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
