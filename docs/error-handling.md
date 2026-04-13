# Error Handling

The SDK and platform consistently use [RFC 7807 Problem Details](https://datatracker.ietf.org/doc/html/rfc7807) for all error responses. This document explains the format and how to handle errors across all 4 SDK languages.

## RFC 7807 Response Shape

Every error response has `Content-Type: application/problem+json` and this structure:

```json
{
  "type": "https://aurigraph.io/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "No data found for userId: test-user",
  "instance": "/api/v11/gdpr/export/test-user",
  "errorCode": "ERR_GDPR_002",
  "userMessage": "No personal data was found for the specified user.",
  "traceId": "420131f7-bd4b-4160-b814-66f7ab24cc34",
  "requestId": "req-1775915736941",
  "service": "aurigraph-v11-standalone",
  "timestamp": "2026-04-11T13:55:36.941376439Z"
}
```

| Field | Purpose |
|-------|---------|
| `type` | Stable URI identifying the error class |
| `title` | Short human-readable summary (matches HTTP status reason phrase) |
| `status` | HTTP status code |
| `detail` | Machine-readable error detail (includes the offending value) |
| `instance` | URI of the specific failure (usually the request path) |
| `errorCode` | Aurigraph-specific error code (ERR_*) for programmatic handling |
| `userMessage` | Human-friendly message safe to show end users |
| `traceId` | Distributed trace ID — look this up in observability tools |
| `requestId` | Request ID — look this up in server logs |
| `service` | Which service produced the error |
| `timestamp` | ISO-8601 timestamp |

## Error Codes

Error codes follow the pattern `ERR_<DOMAIN>_<NUMBER>`:

| Code | HTTP Status | Meaning |
|------|------------|---------|
| ERR_AUTH_001 | 401 | Missing Authorization header |
| ERR_AUTH_002 | 401 | Invalid API key format |
| ERR_AUTH_003 | 403 | API key revoked |
| ERR_SDK_HANDSHAKE_001 | 401 | SDK handshake requires API key |
| ERR_SDK_HANDSHAKE_002 | 403 | Partner account suspended |
| ERR_SDK_RATE_LIMIT | 429 | Tier rate limit exceeded |
| ERR_SDK_QUOTA_EXCEEDED | 429 | Monthly mint quota exceeded |
| ERR_GDPR_001 | 400 | Invalid user ID format |
| ERR_GDPR_002 | 404 | No data found for user |
| ERR_GDPR_003 | 410 | Data already erased |
| ERR_RWA_001 | 400 | Invalid useCase filter |
| ERR_RWA_002 | 404 | Asset not found |
| ERR_RWA_003 | 409 | Asset already exists |
| ERR_VALIDATION_001 | 400 | Request body validation failed |
| ERR_NOT_FOUND_001 | 404 | Generic resource not found |
| ERR_INTERNAL_001 | 500 | Unexpected server error |

The full error code registry lives in the platform repo at `aurigraph-shared/error-codes-registry.json`.

## Handling in Each SDK

### Java

The SDK throws `AurigraphException` hierarchy:

```java
try {
    client.assets().get("nonexistent");
} catch (AurigraphException.ClientError e) {
    // HTTP 4xx
    System.err.println("Error code: " + e.errorCode());
    System.err.println("User message: " + e.userMessage());
    System.err.println("Trace ID: " + e.traceId());  // for support tickets
} catch (AurigraphException.ServerError e) {
    // HTTP 5xx — retryable
    System.err.println("Server error, retrying...");
} catch (AurigraphException.NetworkError e) {
    // Transport failure
    System.err.println("Network error: " + e.getMessage());
}
```

### TypeScript

```typescript
import {
  AurigraphClientError,
  AurigraphServerError,
  AurigraphNetworkError,
} from '@aurigraph/dlt-sdk';

try {
  await client.assets.get('nonexistent');
} catch (err) {
  if (err instanceof AurigraphClientError) {
    console.error('Error code:', err.problem.errorCode);
    console.error('User message:', err.problem.userMessage);
    console.error('Trace ID:', err.problem.traceId);
  } else if (err instanceof AurigraphServerError) {
    // 5xx — the SDK already retried, so this is final
    console.error('Server error:', err.message);
  } else if (err instanceof AurigraphNetworkError) {
    console.error('Network error:', err.message);
  }
}
```

### Python

```python
from aurigraph_sdk.errors import (
    AurigraphClientError,
    AurigraphServerError,
    AurigraphNetworkError,
)

try:
    client.assets.get("nonexistent")
except AurigraphClientError as e:
    print(f"Error code: {e.problem.error_code}")
    print(f"User message: {e.problem.user_message}")
    print(f"Trace ID: {e.problem.trace_id}")
except AurigraphServerError as e:
    print(f"Server error (retried): {e}")
except AurigraphNetworkError as e:
    print(f"Network error: {e}")
```

### Rust

```rust
use aurigraph_sdk::AurigraphError;

match client.assets().get("nonexistent").await {
    Ok(asset) => println!("Got asset: {:?}", asset),
    Err(AurigraphError::Server { status, message }) => {
        eprintln!("Server error {}: {}", status, message);
    }
    Err(AurigraphError::Client(msg)) => {
        eprintln!("Client error: {}", msg);
    }
    Err(AurigraphError::Network(e)) => {
        eprintln!("Network error: {}", e);
    }
    Err(e) => eprintln!("Other error: {}", e),
}
```

## Retry Strategy

The SDKs apply automatic retries with exponential backoff for **retryable** errors only:

| Error Type | Retryable? | Default Retries |
|------------|-----------|-----------------|
| HTTP 408, 429, 500, 502, 503, 504 | Yes | 3 |
| Network timeout | Yes | 3 |
| HTTP 4xx (except 429) | No | 0 |
| Invalid response body | No | 0 |

Default backoff: 100ms → 200ms → 400ms → 800ms (with jitter).

Configure retries at client construction:

```java
AurigraphClient client = AurigraphClient.builder()
    .baseUrl("https://dlt.aurigraph.io")
    .maxRetries(5)         // default 3
    .build();
```

## Including Trace IDs in Support Tickets

When filing support tickets, always include:
1. `errorCode`
2. `traceId`
3. `timestamp`

Support can look up the exact request in observability tooling using `traceId`. Without it, debugging takes hours instead of minutes.

## See Also

- [Authentication](authentication.md) — auth-related errors
- [Tier System](tier-system.md) — rate limit errors
- [GDPR Compliance](gdpr-compliance.md) — ERR_GDPR_* errors
