# Authentication

The Aurigraph SDK supports three authentication methods. The SDK automatically selects the correct method based on the credentials provided during client construction.

## Authentication Methods

### 1. Paired API Key (Recommended for SDK Integrations)

The canonical authentication method for third-party SDK applications. Your App ID and raw API key are issued when you register an application on the Aurigraph platform.

**Header format**: `Authorization: ApiKey <appId>:<rawKey>`

This method is required for the [handshake protocol](handshake-protocol.md) and [tier management](tier-system.md) endpoints.

=== "Java"

    ```java
    AurigraphClient client = AurigraphClient.builder()
        .baseUrl("https://dlt.aurigraph.io")
        .apiKey("app-a1b2c3d4", "sk_live_abcdef123456")
        .build();
    ```

=== "TypeScript"

    ```typescript
    const client = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      appId: 'app-a1b2c3d4',
      apiKey: 'sk_live_abcdef123456',
    });
    ```

=== "Python"

    ```python
    client = AurigraphClient(
        base_url="https://dlt.aurigraph.io",
        app_id="app-a1b2c3d4",
        api_key="sk_live_abcdef123456",
    )
    ```

=== "Rust"

    ```rust
    let client = AurigraphClient::builder()
        .base_url("https://dlt.aurigraph.io")
        .api_key("app-a1b2c3d4", "sk_live_abcdef123456")
        .build()?;
    ```

### 2. JWT Bearer Token (Keycloak OIDC)

For browser-based applications and services already authenticated through Keycloak. The JWT is obtained from the Aurigraph Keycloak realm (iam2.aurigraph.io) via standard OIDC flows (authorization code, client credentials).

**Header format**: `Authorization: Bearer <jwt-token>`

JWT takes precedence over API key if both are provided.

=== "Java"

    ```java
    AurigraphClient client = AurigraphClient.builder()
        .baseUrl("https://dlt.aurigraph.io")
        .jwtToken(accessToken)
        .build();
    ```

=== "TypeScript"

    ```typescript
    const client = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      jwtToken: accessToken,
    });
    ```

=== "Python"

    ```python
    client = AurigraphClient(
        base_url="https://dlt.aurigraph.io",
        jwt_token=access_token,
    )
    ```

=== "Rust"

    ```rust
    let client = AurigraphClient::builder()
        .base_url("https://dlt.aurigraph.io")
        .jwt_token(access_token)
        .build()?;
    ```

### 3. Legacy Single API Key (Deprecated)

The legacy single-argument API key sends credentials via the `X-API-Key` header. This method is deprecated and will be removed in v2.0. A warning is emitted on the first request.

**Header format**: `X-API-Key: <rawKey>`

=== "Java"

    ```java
    // Deprecated -- migrate to apiKey(appId, rawKey)
    @SuppressWarnings("deprecation")
    AurigraphClient client = AurigraphClient.builder()
        .baseUrl("https://dlt.aurigraph.io")
        .apiKey("sk_live_abcdef123456")
        .build();
    ```

=== "TypeScript"

    ```typescript
    // Deprecated -- migrate to { appId, apiKey } pair
    const client = new AurigraphClient({
      baseUrl: 'https://dlt.aurigraph.io',
      apiKey: 'sk_live_abcdef123456',
    });
    ```

## Auth Precedence

When multiple credentials are provided, the SDK applies them in this order:

1. **JWT token** -- `Authorization: Bearer <token>`
2. **Paired API key** -- `Authorization: ApiKey <appId>:<rawKey>`
3. **Legacy API key** -- `X-API-Key: <rawKey>` (deprecated)

Only one method is used per request. The first available credential wins.

## Keycloak OIDC Flow

For applications that need to authenticate end users through Keycloak:

```
1. Redirect user to:
   https://iam2.aurigraph.io/realms/aurigraph/protocol/openid-connect/auth
     ?client_id=your-client-id
     &redirect_uri=https://your-app.com/callback
     &response_type=code
     &scope=openid profile email

2. Exchange authorization code for tokens:
   POST https://iam2.aurigraph.io/realms/aurigraph/protocol/openid-connect/token
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code
   &code=AUTH_CODE
   &redirect_uri=https://your-app.com/callback
   &client_id=your-client-id
   &client_secret=your-client-secret

3. Use the access_token with the SDK:
   AurigraphClient.builder()
       .baseUrl("https://dlt.aurigraph.io")
       .jwtToken(accessToken)
       .build();
```

## Client Credentials Flow (Service-to-Service)

For backend services that authenticate without user interaction:

```bash
curl -X POST https://iam2.aurigraph.io/realms/aurigraph/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=your-service-id" \
  -d "client_secret=your-service-secret" \
  -d "scope=openid"
```

The response contains an `access_token` that can be passed to the SDK via `.jwtToken()`.

## Security Best Practices

- Store API keys and secrets in environment variables or a secret manager (OpenBao, AWS Secrets Manager).
- Never commit credentials to source control.
- Use the paired API key (`appId` + `rawKey`) for all new integrations.
- Rotate API keys periodically through the Aurigraph dashboard.
- Use the [handshake protocol](handshake-protocol.md) to validate your application's status on startup.

## Common Headers

Every request sent by the SDK includes:

| Header | Value |
|--------|-------|
| `Authorization` | One of the three auth methods above |
| `Content-Type` | `application/json` |
| `Accept` | `application/json` |
| `Idempotency-Key` | Auto-generated SHA-256 hash (if `autoIdempotency` is enabled) |

See also: [Handshake Protocol](handshake-protocol.md), [Tier System](tier-system.md)
