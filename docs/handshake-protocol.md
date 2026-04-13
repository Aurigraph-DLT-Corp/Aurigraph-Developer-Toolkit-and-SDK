# SDK Handshake Protocol

The handshake protocol establishes an authenticated, capability-negotiated session between a 3rd-party application and the Aurigraph DLT platform. Every integration begins with a handshake.

## Phases

```
Client                                    Server
  │                                         │
  │── hello() ──────────────────────────────▶│  Registration + server metadata
  │◀──────────────── HelloResponse ─────────│
  │                                         │
  │── heartbeat() ──────────────────────────▶│  Liveness probe (every 30s)
  │◀──────────────── HeartbeatResponse ─────│
  │                                         │
  │── capabilities() ───────────────────────▶│  Feature negotiation
  │◀──────────────── CapabilitiesResponse ──│
  │                                         │
  │── config() ─────────────────────────────▶│  Runtime configuration
  │◀──────────────── ConfigResponse ────────│
```

## 1. Hello — Registration

**Endpoint**: `GET /api/v11/sdk/handshake/hello`

First call after authentication. Server responds with:
- `sessionId` — unique handshake session identifier
- `serverVersion` — platform version (e.g., `v12.1.52`)
- `supportedApiVersions` — array like `["v11"]`
- `partnerProfile` — your tier, usage, scope set

```java
// Java
HelloResponse hello = client.handshake().hello();
System.out.println("Session: " + hello.sessionId());
System.out.println("Tier: " + hello.partnerProfile().tier());
```

```typescript
// TypeScript
const hello = await client.handshake.hello();
console.log('Tier:', hello.partnerProfile.tier);
```

```python
# Python
hello = client.handshake.hello()
print(f"Tier: {hello.partner_profile.tier}")
```

## 2. Heartbeat — Liveness

**Endpoint**: `POST /api/v11/sdk/handshake/heartbeat`

Sent every 30 seconds by the SDK auto-heartbeat thread. Keeps the session active and detects network partitions.

If the server doesn't receive a heartbeat for 90 seconds, the session enters `STALE` state. After 300 seconds, it's revoked.

The Java and TypeScript SDKs manage heartbeats automatically. Disable with `.enableAutoHeartbeat(false)` on the builder.

## 3. Capabilities — Feature Negotiation

**Endpoint**: `GET /api/v11/sdk/handshake/capabilities`

Returns the complete feature set available to your tier:

```json
{
  "tier": "BUSINESS",
  "features": {
    "mintRate": 1000,
    "maxPayloadBytes": 1048576,
    "supportedAssetTypes": ["COMMODITY", "CARBON_CREDIT", "REAL_ESTATE", ...],
    "webhookCount": 10,
    "concurrentRequests": 50
  },
  "tokenTypes": [
    { "code": "UC_GOLD", "minMint": 0.001, "maxMint": 1000000 },
    { "code": "UC_CARBON", "minMint": 1, "maxMint": 1000000 },
    ...
  ]
}
```

Use this to adapt your integration to your tier's capabilities rather than hardcoding limits.

## 4. Config — Runtime Parameters

**Endpoint**: `GET /api/v11/sdk/handshake/config`

Returns tier-specific runtime configuration the SDK should use:

```json
{
  "rateLimitRpm": 600,
  "idempotencyTtlSeconds": 3600,
  "retryBackoffMs": 100,
  "maxRetries": 3,
  "webhookUrls": ["https://yourapp.io/webhook"]
}
```

The SDK applies these values automatically — you don't need to configure them manually.

## Error Cases

| HTTP Status | Error Code | Cause |
|-------------|-----------|-------|
| 401 | ERR_SDK_HANDSHAKE_001 | Missing `Authorization: ApiKey <appId>:<rawKey>` header |
| 403 | ERR_SDK_HANDSHAKE_002 | API key revoked or partner suspended |
| 429 | ERR_SDK_RATE_LIMIT | Tier rate limit exceeded — back off per `Retry-After` header |

## Security

- All handshake endpoints require `Authorization: ApiKey <appId>:<rawKey>`
- Session IDs are opaque — don't parse or modify them
- Sessions are bound to the source IP range of the original hello call
- Rotate API keys quarterly via the admin portal

## See Also

- [Authentication](authentication.md) — obtaining an API key
- [Tier System](tier-system.md) — what each tier unlocks
- [Error Handling](error-handling.md) — RFC 7807 error parsing
