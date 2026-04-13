# Aurigraph DLT SDK — Developer Guide

**From zero to production in 45 minutes.**

This guide walks you through building a complete integration with Aurigraph DLT: signing up as a partner, writing your first integration, testing it in the sandbox, and deploying to production.

---

## Table of Contents

1. [What You'll Build](#1-what-youll-build)
2. [Prerequisites](#2-prerequisites)
3. [Register as a Partner](#3-register-as-a-partner)
4. [Hello, Aurigraph — Your First Call](#4-hello-aurigraph)
5. [Build an Integration](#5-build-an-integration)
6. [Test in the Sandbox](#6-test-in-the-sandbox)
7. [Handle Errors Gracefully](#7-handle-errors)
8. [Production Readiness Checklist](#8-production-readiness)
9. [Deploy to Production](#9-deploy-to-production)
10. [Operate: Monitoring, Upgrades, Incidents](#10-operate)

---

## 1. What You'll Build

By the end of this guide, you'll have a working **carbon credit tokenization service** that:

- Registers with Aurigraph DLT as a partner app
- Creates carbon credit tokens (UC_CARBON use case)
- Lists tokens by channel and use case
- Handles errors, retries, and rate limits correctly
- Exposes a REST API consumed by your users
- Deploys via Docker to any cloud or on-prem

**Why carbon credits?** The example is simple enough to grasp in one sitting but exercises most SDK features: minting, querying, multi-channel, compliance, and tier enforcement.

**Estimated time**: 45 minutes (15 min setup, 30 min coding).

---

## 2. Prerequisites

### System requirements

- **Java**: 21+ LTS (for Java SDK path) — `sdkman install java 21.0.5-tem`
- **Node**: 20+ LTS (for TypeScript SDK path) — `nvm install 20`
- **Python**: 3.10+ (for Python SDK path) — `pyenv install 3.12`
- **Rust**: 1.75+ (for Rust SDK path) — `rustup update stable`

Pick any one language — the SDK is identical across all four.

### Tool requirements

- **Git** — `git --version` should show ≥ 2.30
- **Docker** — `docker --version` should show ≥ 24.0 (needed for production deploy)
- **curl** — for ad-hoc API testing

### Account requirements

- An Aurigraph partner account (free, signup below)
- Access to register a test email domain

### Knowledge prerequisites

- Basic understanding of REST APIs
- Familiarity with async programming in your chosen language
- 30 minutes of focused attention

---

## 3. Register as a Partner

### 3.1 Sign up

Navigate to **[dlt.aurigraph.io](https://dlt.aurigraph.io)** and click **Sign In** → **Register**.

Fill in:
- Full name
- Email (use a real domain — disposable emails are rejected)
- Company name
- Your role

You'll receive a Keycloak magic-link email. Click it to verify.

### 3.2 Create your first SDK application

Once verified, navigate to **`/sdk-admin`** from the top nav → **"Register new application"**.

Fill the application form:

| Field | Example |
|-------|---------|
| App name | `my-carbon-tokenizer` |
| Use cases | ☑️ UC_CARBON, ☑️ UC_COMPLIANCE |
| Redirect URIs | `http://localhost:3000/callback` (for dev) |
| Webhook URLs | Leave blank for now |

Click **Create**. The response shows your credentials **exactly once**:

```json
{
  "appId": "bc2ce4fa-e82d-4b7c-a561-5a0e40888999",
  "rawKey": "aG8VN7aVtfm0_ZrN2-H6vU2XwP3JfBtsRjGnKa4vPp_d7Q8s",
  "tier": "SANDBOX",
  "scopes": ["rwa:read", "contracts:read", "nodes:read", "channels:read", "stats:read", "compliance:read"]
}
```

**CRITICAL**: Copy `rawKey` to your password manager RIGHT NOW. If you lose it, you must regenerate the keypair (which invalidates the old one).

### 3.3 Configure your environment

Create a `.env` file in your integration project:

```bash
# .env
AURIGRAPH_BASE_URL=https://dlt.aurigraph.io
AURIGRAPH_APP_ID=bc2ce4fa-e82d-4b7c-a561-5a0e40888999
AURIGRAPH_API_KEY=aG8VN7aVtfm0_ZrN2-H6vU2XwP3JfBtsRjGnKa4vPp_d7Q8s
```

Add `.env` to your `.gitignore`. **Never commit API keys.**

---

## 4. Hello, Aurigraph — Your First Call

### 4.1 Install the SDK

Choose your language:

=== "Java"

    ```xml
    <!-- pom.xml -->
    <dependency>
        <groupId>io.aurigraph.dlt</groupId>
        <artifactId>aurigraph-sdk</artifactId>
        <version>1.2.0</version>
    </dependency>
    ```

=== "TypeScript"

    ```bash
    npm install @aurigraph/dlt-sdk
    ```

=== "Python"

    ```bash
    pip install aurigraph-sdk
    ```

=== "Rust"

    ```toml
    # Cargo.toml
    [dependencies]
    aurigraph-sdk = "0.1"
    tokio = { version = "1", features = ["full"] }
    ```

### 4.2 First call — health check

Write the simplest possible program that proves the connection works:

=== "Java"

    ```java
    import io.aurigraph.dlt.sdk.AurigraphClient;

    public class Hello {
        public static void main(String[] args) {
            var client = AurigraphClient.builder()
                .baseUrl(System.getenv("AURIGRAPH_BASE_URL"))
                .appId(System.getenv("AURIGRAPH_APP_ID"))
                .apiKey(System.getenv("AURIGRAPH_API_KEY"))
                .build();

            var health = client.health();
            System.out.println("Platform status: " + health.status());

            var hello = client.handshake().hello();
            System.out.println("You are on tier: " + hello.partnerProfile().tier());

            client.close();
        }
    }
    ```

=== "TypeScript"

    ```typescript
    import { AurigraphClient } from '@aurigraph/dlt-sdk';

    const client = new AurigraphClient({
      baseUrl: process.env.AURIGRAPH_BASE_URL!,
      appId: process.env.AURIGRAPH_APP_ID,
      apiKey: process.env.AURIGRAPH_API_KEY,
    });

    const health = await client.health.get();
    console.log('Platform status:', health.status);

    const hello = await client.handshake.hello();
    console.log('You are on tier:', hello.partnerProfile.tier);

    await client.dispose();
    ```

=== "Python"

    ```python
    import os
    from aurigraph_sdk import AurigraphClient

    with AurigraphClient(
        base_url=os.environ["AURIGRAPH_BASE_URL"],
        app_id=os.environ["AURIGRAPH_APP_ID"],
        api_key=os.environ["AURIGRAPH_API_KEY"],
    ) as client:
        health = client.health()
        print(f"Platform status: {health.status}")

        hello = client.handshake.hello()
        print(f"You are on tier: {hello.partner_profile.tier}")
    ```

=== "Rust"

    ```rust
    use aurigraph_sdk::AurigraphClient;

    #[tokio::main]
    async fn main() -> anyhow::Result<()> {
        let client = AurigraphClient::builder()
            .base_url(std::env::var("AURIGRAPH_BASE_URL")?)
            .app_id(std::env::var("AURIGRAPH_APP_ID")?)
            .api_key(std::env::var("AURIGRAPH_API_KEY")?)
            .build()?;

        let health = client.health().await?;
        println!("Platform status: {}", health.status);

        let hello = client.handshake().hello().await?;
        println!("You are on tier: {}", hello.partner_profile.tier);

        Ok(())
    }
    ```

### 4.3 Run it

Expected output:

```
Platform status: HEALTHY
You are on tier: SANDBOX
```

If you see that, you're connected! If you see `401 Unauthorized`, double-check:
1. `.env` is loaded (in Python: `load_dotenv()`, in Node: `dotenv.config()`)
2. `AURIGRAPH_APP_ID` and `AURIGRAPH_API_KEY` have no whitespace
3. You're using the raw key from registration, not a UUID

---

## 5. Build an Integration

Let's build the carbon credit tokenizer. It accepts carbon retirement claims from users and converts them to on-chain tokens.

### 5.1 Domain model

A **carbon credit retirement** represents 1 tonne of CO₂ equivalent (tCO2e) that has been permanently removed or avoided. When tokenized, it becomes tradable and auditable.

```
Carbon Credit Retirement
├── sourceProjectId: e.g., "VCS-2356" (Verified Carbon Standard)
├── vintageYear: e.g., 2024
├── quantityTonnes: e.g., 100
├── methodology: e.g., "VM0009" (Methodology for afforestation)
├── retiredBy: organization name
└── retiredFor: beneficiary name
```

### 5.2 Write the service

=== "TypeScript (recommended for this example)"

    ```typescript
    // src/carbon-service.ts
    import { AurigraphClient } from '@aurigraph/dlt-sdk';

    interface CarbonRetirement {
      sourceProjectId: string;
      vintageYear: number;
      quantityTonnes: number;
      methodology: string;
      retiredBy: string;
      retiredFor: string;
    }

    export class CarbonService {
      constructor(private client: AurigraphClient) {}

      async tokenize(retirement: CarbonRetirement): Promise<{ tokenId: string; txHash: string }> {
        // 1. Verify capabilities (your tier must support UC_CARBON)
        const caps = await this.client.handshake.capabilities();
        const supported = caps.tokenTypes.some(t => t.code === 'UC_CARBON');
        if (!supported) {
          throw new Error('UC_CARBON not in your tier capabilities. Upgrade to STARTER+.');
        }

        // 2. Check quota before minting
        const quota = await this.client.tier.getQuota();
        if (quota.remaining < 1) {
          throw new Error(`Monthly mint quota exhausted (${quota.used}/${quota.limit})`);
        }

        // 3. Deploy Ricardian contract + mint token in a single atomic op
        // The contract references carbon-specific templates (VCS, Gold Standard, Verra)
        const result = await this.client.contracts.deploy({
          templateId: 'UC_CARBON',
          useCaseId: 'UC_CARBON',
          channelId: 'marketplace-channel',  // retail-tradable
          terms: {
            sourceProjectId: retirement.sourceProjectId,
            vintageYear: retirement.vintageYear,
            quantityTonnes: retirement.quantityTonnes,
            methodology: retirement.methodology,
            retiredBy: retirement.retiredBy,
            retiredFor: retirement.retiredFor,
          },
        });

        return {
          tokenId: result.contractId,
          txHash: result.txHash,
        };
      }

      async listMyCredits(): Promise<Record<string, unknown>[]> {
        const response = await this.client.assets.listByUseCase('UC_CARBON');
        return response.assets as Record<string, unknown>[];
      }

      async getComplianceStatus(tokenId: string): Promise<unknown> {
        // Check the token against the VCM (Voluntary Carbon Market) framework
        return this.client.compliance.assess({
          assetId: tokenId,
          frameworks: ['VCM', 'EU_ETS', 'CBAM'],
        });
      }
    }
    ```

### 5.3 Expose via REST API

Use your framework of choice — here's Fastify:

```typescript
// src/server.ts
import Fastify from 'fastify';
import { AurigraphClient } from '@aurigraph/dlt-sdk';
import { CarbonService } from './carbon-service.js';

const server = Fastify({ logger: true });

const client = new AurigraphClient({
  baseUrl: process.env.AURIGRAPH_BASE_URL!,
  appId: process.env.AURIGRAPH_APP_ID,
  apiKey: process.env.AURIGRAPH_API_KEY,
});

const carbonService = new CarbonService(client);

server.post<{ Body: CarbonRetirement }>('/api/retirements', async (request, reply) => {
  try {
    const result = await carbonService.tokenize(request.body);
    return reply.code(201).send(result);
  } catch (err) {
    request.log.error(err);
    return reply.code(500).send({ error: String(err) });
  }
});

server.get('/api/my-credits', async (_request, reply) => {
  const credits = await carbonService.listMyCredits();
  return reply.send({ credits, count: credits.length });
});

server.get('/health', async () => ({ status: 'OK' }));

const port = Number(process.env.PORT) || 3000;
server.listen({ port, host: '0.0.0.0' })
  .then(() => server.log.info(`Listening on :${port}`))
  .catch(err => { server.log.error(err); process.exit(1); });

// Graceful shutdown
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, async () => {
    server.log.info(`Received ${signal}, shutting down`);
    await server.close();
    await client.dispose();
    process.exit(0);
  });
});
```

**Design decisions worth noting**:

1. **Single `AurigraphClient` instance** — shared across all request handlers. The SDK is thread-safe and manages its own connection pool.
2. **Service class** — business logic lives in `CarbonService`, not in route handlers. This makes testing much easier.
3. **Graceful shutdown** — `client.dispose()` flushes the offline queue and cancels auto-heartbeat before process exit.
4. **No custom retry logic** — the SDK handles retries automatically. Don't wrap calls in your own retry loops.

---

## 6. Test in the Sandbox

### 6.1 Run your service locally

```bash
npm run dev
# Server listening on :3000
```

### 6.2 Issue a test retirement

```bash
curl -X POST http://localhost:3000/api/retirements \
  -H "Content-Type: application/json" \
  -d '{
    "sourceProjectId": "VCS-2356",
    "vintageYear": 2024,
    "quantityTonnes": 100,
    "methodology": "VM0009",
    "retiredBy": "Acme Corp",
    "retiredFor": "Bob Smith"
  }'
```

Expected response:

```json
{
  "tokenId": "RWA-CC-SBX-001",
  "txHash": "0xabc123..."
}
```

The `SBX-` prefix in the tokenId tells you this is a sandbox token (not production data).

### 6.3 Run the sandbox checklist

The sandbox tracks your integration progress:

```bash
curl https://dlt.aurigraph.io/api/v11/sdk/sandbox/checklist \
  -H "Authorization: ApiKey $AURIGRAPH_APP_ID:$AURIGRAPH_API_KEY" | jq
```

Response:

```json
{
  "items": [
    { "name": "Handshake hello received", "status": "COMPLETE" },
    { "name": "Capabilities queried", "status": "COMPLETE" },
    { "name": "First mint operation", "status": "COMPLETE" },
    { "name": "Webhook registered", "status": "PENDING" },
    { "name": "10+ heartbeats sent", "status": "COMPLETE" },
    { "name": "GDPR export tested", "status": "PENDING" },
    { "name": "Rate limit hit once", "status": "PENDING" }
  ],
  "completion": "4/7"
}
```

Each pending item is a capability you need to test before going to production.

### 6.4 Test the rate limiter (deliberately)

The sandbox tier caps at 30 req/min. Exercise your SDK's backoff behavior:

```typescript
// tests/rate-limit.test.ts
import { AurigraphClient, AurigraphServerError } from '@aurigraph/dlt-sdk';

test('SDK handles 429 with automatic backoff', async () => {
  const client = new AurigraphClient({ /* ... */ });

  // Hit the API hard
  const results = await Promise.allSettled(
    Array.from({ length: 50 }, () => client.assets.list())
  );

  const rejected = results.filter(r => r.status === 'rejected');
  // The SDK auto-retries 429s, so most should succeed eventually
  expect(rejected.length).toBeLessThan(5);
});
```

### 6.5 Test error paths

Test every failure mode you'll see in production:

```typescript
// tests/error-paths.test.ts
test('404 returns structured error', async () => {
  const client = new AurigraphClient({ /* ... */ });

  await expect(client.assets.get('RWA-DOES-NOT-EXIST'))
    .rejects.toMatchObject({
      problem: {
        status: 404,
        errorCode: 'ERR_RWA_002',
      },
    });
});

test('401 without auth', async () => {
  const noAuthClient = new AurigraphClient({ baseUrl: /* ... */, apiKey: 'wrong' });

  await expect(noAuthClient.handshake.hello())
    .rejects.toMatchObject({
      problem: { status: 401, errorCode: 'ERR_SDK_HANDSHAKE_001' },
    });
});
```

---

## 7. Handle Errors Gracefully

The RFC 7807 Problem Details format gives you three fields you should always use:

1. **`errorCode`** — stable, machine-readable. Use for conditional logic.
2. **`traceId`** — include in support tickets for fast debugging.
3. **`userMessage`** — safe to show end users verbatim.

```typescript
try {
  await carbonService.tokenize(retirement);
} catch (err) {
  if (err instanceof AurigraphClientError) {
    // Client-side error — don't retry
    switch (err.problem.errorCode) {
      case 'ERR_SDK_QUOTA_EXCEEDED':
        notifyUser('Monthly quota reached. Upgrade your plan.');
        break;
      case 'ERR_COMPLIANCE_001':
        notifyUser('This retirement failed VCM validation: ' + err.problem.detail);
        break;
      default:
        notifyUser(err.problem.userMessage);
    }
    log.warn({ errorCode: err.problem.errorCode, traceId: err.problem.traceId });
  } else if (err instanceof AurigraphServerError) {
    // Server-side — SDK already retried. Report and move on.
    log.error('Platform error', { traceId: err.problem.traceId });
    notifyUser('Service temporarily unavailable. We are investigating.');
  } else {
    // Unexpected
    log.error('Unknown error', err);
    throw err;
  }
}
```

**Rule of thumb**: never swallow errors silently. Every caught exception should be logged with `traceId` so you can correlate with platform-side logs.

See [docs/error-handling.md](docs/error-handling.md) for the full error code registry.

---

## 8. Production Readiness Checklist

Before requesting a tier upgrade, verify:

### 8.1 Security
- [ ] API keys loaded from environment variables, never hardcoded
- [ ] `.env` is in `.gitignore`
- [ ] API keys stored in a secret manager (AWS Secrets, HashiCorp Vault, etc.)
- [ ] API keys rotated at least quarterly (set a calendar reminder)
- [ ] Webhook HMAC signatures verified on every receipt
- [ ] No API keys in client-side code (browser, mobile)

### 8.2 Reliability
- [ ] Error handling covers 4xx and 5xx paths
- [ ] SDK's automatic retry is NOT double-wrapped
- [ ] Graceful shutdown calls `client.dispose()` / `client.close()`
- [ ] Timeouts configured appropriately for your latency budget
- [ ] Health endpoint (`GET /health`) exposed for your orchestrator

### 8.3 Observability
- [ ] All SDK calls log `traceId` on error
- [ ] Metrics emitted for request count, latency, error rate
- [ ] Alerts configured for error-rate spikes and auth failures
- [ ] Dashboard shows your quota usage trends

### 8.4 Testing
- [ ] Unit tests mock the SDK (respx/wiremock/etc.)
- [ ] Integration tests hit sandbox
- [ ] Rate limit handling verified
- [ ] 404/500 error paths exercised
- [ ] Sandbox checklist: 7/7 complete

### 8.5 Compliance
- [ ] Privacy policy updated to mention Aurigraph DLT
- [ ] DPA signed (you as controller, Aurigraph as processor)
- [ ] Data retention policy aligned with your jurisdiction
- [ ] GDPR erasure workflow documented and tested

### 8.6 Operational
- [ ] Runbook for common incidents (401 spike, quota exhaustion, webhook failure)
- [ ] Contact for `security@aurigraph.io` and `support@aurigraph.io` documented
- [ ] Upgrade path to next tier identified (you'll hit the ceiling eventually)

Once all boxes are checked, call the production-ready endpoint:

```bash
curl -X POST https://dlt.aurigraph.io/api/v11/sdk/sandbox/checklist/mark-production-ready \
  -H "Authorization: ApiKey $AURIGRAPH_APP_ID:$AURIGRAPH_API_KEY"
```

You'll receive a webhook when admin review approves your upgrade (typically 24 hours for STARTER, immediate for ENTERPRISE).

---

## 9. Deploy to Production

### 9.1 Dockerize your service

```dockerfile
# Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', r => process.exit(r.statusCode === 200 ? 0 : 1))"

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### 9.2 docker-compose for local/staging

```yaml
# docker-compose.yml
services:
  carbon-service:
    build: .
    image: my-carbon-tokenizer:${TAG:-latest}
    ports:
      - "3000:3000"
    environment:
      AURIGRAPH_BASE_URL: https://dlt.aurigraph.io
      AURIGRAPH_APP_ID: ${AURIGRAPH_APP_ID}
      AURIGRAPH_API_KEY: ${AURIGRAPH_API_KEY}
      NODE_ENV: production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

### 9.3 Deploy

=== "Docker (any host)"

    ```bash
    docker compose up -d
    docker compose ps  # verify healthy
    ```

=== "Vercel (for Next.js/Node apps)"

    ```bash
    npm i -g vercel
    vercel login
    vercel env add AURIGRAPH_APP_ID
    vercel env add AURIGRAPH_API_KEY
    vercel --prod
    ```

=== "Kubernetes"

    ```yaml
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: carbon-service
    spec:
      replicas: 3
      selector:
        matchLabels: { app: carbon-service }
      template:
        metadata:
          labels: { app: carbon-service }
        spec:
          containers:
          - name: carbon-service
            image: my-carbon-tokenizer:1.0.0
            ports:
            - containerPort: 3000
            envFrom:
            - secretRef:
                name: aurigraph-credentials
            livenessProbe:
              httpGet: { path: /health, port: 3000 }
              initialDelaySeconds: 10
            readinessProbe:
              httpGet: { path: /health, port: 3000 }
              initialDelaySeconds: 5
    ```

    Create secrets:
    ```bash
    kubectl create secret generic aurigraph-credentials \
      --from-literal=AURIGRAPH_APP_ID=$PROD_APP_ID \
      --from-literal=AURIGRAPH_API_KEY=$PROD_API_KEY
    ```

### 9.4 Verify production

After deploying with **production** credentials (different `appId`/`apiKey` than sandbox):

```bash
# Hit your production endpoint
curl https://your-service.com/health
# {"status":"OK"}

# Make a real retirement
curl -X POST https://your-service.com/api/retirements \
  -H "Content-Type: application/json" \
  -d '{"sourceProjectId":"VCS-2356", "vintageYear":2024, "quantityTonnes":1, "methodology":"VM0009", "retiredBy":"Acme", "retiredFor":"Alice"}'
```

### 9.5 Monitor

At minimum, your dashboard should track:

- **Request rate** — calls to your service (not to Aurigraph)
- **Aurigraph SDK latency** — p50/p95/p99 on minting
- **Error rate by `errorCode`** — group all 4xx and 5xx
- **Quota headroom** — `remaining` / `limit` from `client.tier().getQuota()`
- **Tier utilization** — are you approaching the next tier break?

Aurigraph emits these metrics on `GET /q/metrics` (Prometheus format) if you self-host the platform. For managed Aurigraph, the dashboard at `/sdk-admin` shows them.

---

## 10. Operate

### 10.1 Common incidents

**Scenario: `401 Unauthorized` spike**
- **Likely cause**: API key rotated, deployment still using old key
- **Fix**: Check `/sdk-admin` for key status. Redeploy with current key.
- **Prevention**: Enable key overlap window (7 days) on rotation.

**Scenario: `429 Too Many Requests` surge**
- **Likely cause**: Traffic exceeded tier rate limit
- **Fix**: Verify SDK retry is enabled. Consider tier upgrade.
- **Prevention**: Alert on `quota.remaining < 20%` hourly.

**Scenario: Minting succeeds, webhook never arrives**
- **Likely cause**: Your webhook endpoint is unreachable or rejecting
- **Fix**: Check webhook URL, HMAC verification logic, non-200 responses
- **Prevention**: Test webhooks in sandbox before production

**Scenario: `ERR_COMPLIANCE_*` rejections**
- **Likely cause**: Input data fails a regulatory framework check
- **Fix**: Log the `detail` field, it specifies which framework rejected
- **Prevention**: Run `client.compliance().assess()` before mint

### 10.2 Upgrading tiers

When you approach the SANDBOX → STARTER → BUSINESS → ENTERPRISE ceiling:

```typescript
const usage = await client.tier.getUsage();
const quota = await client.tier.getQuota();

if (quota.remaining / quota.limit < 0.2) {
  // Less than 20% headroom — time to upgrade
  const upgrade = await client.tier.requestUpgrade('BUSINESS');
  console.log('Upgrade request submitted:', upgrade.requestId);
}
```

The upgrade request triggers admin review. You'll get a webhook or email when approved.

### 10.3 Getting help

| Issue | Contact |
|-------|---------|
| Security vulnerability | `security@aurigraph.io` + PGP |
| Production outage | `support@aurigraph.io` (BUSINESS+ gets priority) |
| SDK bug | Open issue on [GitHub](https://github.com/Aurigraph-DLT-Corp/Aurigraph-Developer-Toolkit-and-SDK/issues) |
| Compliance question | `compliance@aurigraph.io` |
| API key rotation | Self-service in `/sdk-admin` |

**Always include in support tickets**:
- `traceId` from the failing request
- Your `appId` (never the raw API key)
- SDK version + language runtime version
- Approximate timestamp (your local time + UTC)

---

## Appendix A: Cheat Sheet

```typescript
// Most common operations
await client.health.get()                                 // Platform health
await client.handshake.hello()                            // Session + tier info
await client.assets.listByUseCase('UC_CARBON')            // Query by use case
await client.assets.listByChannel('marketplace-channel')  // Query by channel
await client.assets.get('RWA-CC-001')                     // Get single asset
await client.contracts.deploy({ templateId, terms })      // Mint token
await client.compliance.assess({ assetId, frameworks })   // Check compliance
await client.tier.getUsage()                              // Quota remaining
await client.gdpr.exportUserData(userId)                  // GDPR export
```

## Appendix B: Links

- [Concept docs](docs/) — deep dives on asset-agnostic design, multi-channel, etc.
- [API reference](docs/api-reference/README.md) — every method in every namespace
- [SDK-specific guides](docs/sdks/) — language-specific notes
- [Policies](docs/policies.md) — Terms, Privacy, DPA, DMCA, etc.
- [JIRA board](https://aurigraphdlt.atlassian.net/jira/software/c/projects/ADTS/boards/1020) — SDK roadmap

---

**Congratulations** — you've gone from zero to production. Your carbon credit service is live, monitored, and ready to scale.

If this guide saved you time, star the repo on GitHub. If it didn't, file an issue telling us why — we'd rather hear hard feedback than nothing.

Happy building. 🌍
