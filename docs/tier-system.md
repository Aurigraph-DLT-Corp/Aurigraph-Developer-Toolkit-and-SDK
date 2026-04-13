# SDK Tier System

The SDK operates under a 4-tier partner system. Each tier unlocks different rate limits, quotas, and scope sets.

## Tiers

| Tier | Price | Rate Limit | Monthly Mints | Scopes | Support |
|------|-------|-----------|---------------|--------|---------|
| **SANDBOX** | Free | 30 RPM | 100 | 6 read-only (auto-approved) | Community |
| **STARTER** | $99/mo | 120 RPM | 1,000 | All read + basic write | Email |
| **BUSINESS** | $499/mo | 600 RPM | 10,000 | All scopes (admin-gated) | Priority |
| **ENTERPRISE** | Custom | Unlimited | Unlimited | Custom + SLA | Dedicated |

## Upgrade Path

Every new integration starts at SANDBOX automatically. Check your tier:

```java
TierConfig tier = client.tier().getPartnerTier();
System.out.println("Current tier: " + tier.tier());
System.out.println("Rate limit: " + tier.rateLimitRpm() + " req/min");
```

Request an upgrade:

```java
UpgradeRequest req = client.tier().requestUpgrade("BUSINESS");
System.out.println("Request ID: " + req.requestId());
// Review happens in the admin portal; you'll get a webhook when approved
```

## Enforcement (3-Layer Chain)

The platform enforces tier limits at three layers with progressive cost:

```
Incoming request
      │
      ▼
┌─────────────────────────────────┐
│ Layer 1: Token bucket (<1ms)    │ ← Lock-free CAS, rejects most overages here
│ RateLimitService                 │
└─────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│ Layer 2: @TierRequired (<5ms)   │ ← CDI interceptor, checks scope permissions
│ TierEnforcementInterceptor       │
└─────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────┐
│ Layer 3: Atomic DB quota (10ms) │ ← REQUIRES_NEW + PESSIMISTIC_WRITE
│ UsageTrackingService             │   (only for write operations)
└─────────────────────────────────┘
      │
      ▼
   Business logic
```

**Why three layers?** The fast path (rate limiting) rejects 99% of abusive traffic at <1ms. The medium path (interceptor) verifies scope grants without DB round-trips. The slow path (atomic DB quota) only runs for writes that affect billing. Total overhead for legitimate requests: ~5-10ms.

## Usage Tracking

Query your current usage:

```java
UsageStats usage = client.tier().getUsage();
System.out.println("Mints this month: " + usage.mintsThisMonth());
System.out.println("Mints remaining: " + usage.mintsRemaining());
System.out.println("Requests last hour: " + usage.requestsLastHour());
```

Check quota before expensive operations:

```java
MintQuota quota = client.tier().getQuota();
if (quota.remaining() < 10) {
  // Avoid triggering quota-exceeded errors
  deferMintOperations();
}
```

## Rate Limit Response

When you exceed your tier's rate limit, the server returns HTTP 429 with headers:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 12
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1731511200
```

The SDK respects `Retry-After` automatically with exponential backoff. You won't need to handle this manually in most cases.

## Scope Model (Option B — Admin-Gated Writes)

The platform uses a hybrid scope model:

**Auto-approved scopes** (all tiers):
- `rwa:read` — query assets
- `contracts:read` — view contract templates
- `nodes:read` — query node metrics
- `channels:read` — list channels
- `stats:read` — platform stats
- `compliance:read` — read compliance frameworks

**Admin-gated scopes** (require approval):
- `rwa:write` — mint assets
- `contracts:deploy` — deploy smart contracts
- `transactions:submit` — submit transactions
- `governance:vote` — cast governance votes
- `wallet:transfer` — initiate transfers

Request admin-gated scopes via the admin portal. Approval typically takes 24 hours for BUSINESS tier, immediate for ENTERPRISE.

## See Also

- [Authentication](authentication.md) — obtaining an API key
- [Handshake Protocol](handshake-protocol.md) — capability negotiation
- [Error Handling](error-handling.md) — ERR_SDK_RATE_LIMIT responses
