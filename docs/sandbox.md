# SDK Sandbox

The Sandbox is a free, isolated environment where developers can test integrations end-to-end without affecting production data or incurring fees. Every new partner starts in SANDBOX automatically.

## What the Sandbox Provides

| Feature | SANDBOX | Production |
|---------|---------|-----------|
| API endpoint | `https://dlt.aurigraph.io/api/v11` | Same |
| Auth header | `Authorization: ApiKey <appId>:<rawKey>` | Same |
| Rate limit | 30 req/min | Tier-dependent |
| Monthly mints | 100 | Tier-dependent |
| Data isolation | Sandbox channel only | Home channel |
| Fees | Zero | Per-operation |
| Fixtures | Pre-seeded | Production data |
| Reset | On-demand | Never |

You use the **same SDK, same endpoints, same auth mechanism** — only the `channelId` and tier quotas change.

## Sandbox-Only Endpoints

### Fixtures — `GET /api/v11/sdk/sandbox/fixtures`

Returns pre-seeded test data (no auth required):

```bash
curl https://dlt.aurigraph.io/api/v11/sdk/sandbox/fixtures
```

Response:
```json
{
  "testAssets": [
    { "id": "SBX-GOLD-001", "type": "COMMODITY", "useCase": "UC_GOLD", "weight": "1oz" },
    { "id": "SBX-CARBON-001", "type": "CARBON_CREDIT", "useCase": "UC_CARBON", "tonnes": 100 }
  ],
  "testChannels": ["sandbox-home-channel"],
  "testWallets": ["0xSANDBOX0000000000000000000000000000001"],
  "mockOraclePrices": { "XAU_USD": 2050.50, "EUR_USD": 1.08 }
}
```

Use these IDs in your tests — they're guaranteed to exist and have known values.

### Integration Checklist — `GET /api/v11/sdk/sandbox/checklist`

Returns an ordered list of integration milestones with your current completion status:

```java
// Auth required (API key)
Map<String, Object> checklist = client.sdk().sandbox().checklist();
List<Map<String, Object>> items = (List<Map<String, Object>>) checklist.get("items");
for (var item : items) {
    String status = (String) item.get("status");  // PENDING, COMPLETE
    String name = (String) item.get("name");
    System.out.println(status + " — " + name);
}
```

Typical checklist:
1. ✅ Handshake hello received
2. ✅ Capabilities queried
3. ⏳ First mint operation (requires `rwa:write` scope)
4. ⏳ Webhook registered
5. ⏳ 10+ heartbeats sent
6. ⏳ GDPR export tested
7. ⏳ Rate limit hit once (required to verify backoff)

### Request Log — `GET /api/v11/sdk/sandbox/requests`

Returns your last 100 requests with full trace details:

```typescript
const { requests } = await client.sdk.sandbox.requests();
// Useful for debugging — see exactly what the SDK sent and what the server returned
```

### Mark Production-Ready — `POST /api/v11/sdk/sandbox/checklist/mark-production-ready`

Request a tier upgrade once your checklist reaches 100%. This triggers human review; you'll get a webhook when approved.

```bash
curl -X POST https://dlt.aurigraph.io/api/v11/sdk/sandbox/checklist/mark-production-ready \
  -H "Authorization: ApiKey bc2ce4fa:your-raw-key"
```

## Sandbox Best Practices

**1. Test the rate limiter early.** The sandbox rate limit is 30 RPM — low enough to hit easily. Your SDK should handle 429 responses gracefully.

```python
# Deliberately exceed rate limit to verify backoff behavior
for i in range(50):
    try:
        client.assets.list()
    except AurigraphServerError as e:
        if e.problem.status == 429:
            print(f"Rate limited at request {i} — SDK retry working ✓")
            break
```

**2. Test all 3 error categories.** Sandbox simulates:
- `4xx client errors` — try `client.assets.get("DOES-NOT-EXIST")`
- `5xx server errors` — use `GET /api/v11/sdk/sandbox/simulate-500` (sandbox-only)
- `network errors` — configure client with unreachable baseUrl

**3. Test GDPR erasure.** Sandbox erasure completes in <60 seconds (vs 7 days production):

```python
client.gdpr.request_erasure("sandbox-test-user")
time.sleep(60)
# Verify second export returns 404
```

**4. Use fixture IDs, not random IDs.** The `SBX-*` prefix is reserved for sandbox fixtures; production rejects IDs with this prefix.

**5. Don't test load/performance in sandbox.** Sandbox quotas are low by design. For load testing, request a dedicated LOAD_TEST environment via support.

## Sandbox Data Reset

Sandbox data isn't reset automatically. To reset:

```bash
curl -X POST https://dlt.aurigraph.io/api/v11/sdk/sandbox/reset \
  -H "Authorization: ApiKey bc2ce4fa:your-raw-key"
```

This deletes all your sandbox assets, contracts, and transactions but keeps your partner profile intact.

## Moving from Sandbox to Production

Promotion checklist:

1. **Complete the sandbox checklist** — all items ✅
2. **Request tier upgrade** via `client.tier().requestUpgrade("STARTER")`  
3. **Sign the Production Terms** (link provided in upgrade response)
4. **Receive new API key** — sandbox key is deactivated, production key is issued
5. **Update your environment variable** — different key, same endpoint
6. **Verify with a health check** — your app should work identically

No code changes are required — the SDK, endpoints, and contracts are identical between environments.

## See Also

- [Getting Started](getting-started.md) — initial SDK setup
- [Registration](registration.md) — how to register as a partner
- [Tier System](tier-system.md) — upgrade paths and quotas
