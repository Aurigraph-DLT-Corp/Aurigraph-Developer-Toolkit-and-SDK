# API Reference

Quick reference for all 13 SDK namespaces across 4 languages. For deeper explanations, see the [concept docs](../).

## Namespace Overview

| Namespace | Purpose | Auth Required |
|-----------|---------|---------------|
| [assets](#assets) | Asset-agnostic RWA query API | Read scopes |
| [channels](#channels) | Channel registry + membership | Read scopes |
| [compliance](#compliance) | Regulatory frameworks + assessments | Read scopes |
| [contracts](#contracts) | Smart contract deploy/invoke/list | `contracts:*` |
| [dmrv](#dmrv) | Digital MRV events + audit trail | `dmrv:*` |
| [gdpr](#gdpr) | Data export + erasure (GDPR Art. 17/20) | Partner auth |
| [governance](#governance) | Proposals, voting, treasury | `governance:*` |
| [graphql](#graphql) | GraphQL gateway | Read scopes |
| [handshake](#handshake) | SDK handshake protocol | API key |
| [nodes](#nodes) | Node registry + metrics | Read scopes |
| [tier](#tier) | Partner tier + usage + quota | API key |
| [transactions](#transactions) | Submit/query transactions | `transactions:*` |
| [wallet](#wallet) | Balance + transfer + history | `wallet:*` |

---

## assets

Asset-agnostic RWA operations. Works with all 16 RWAT use cases.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `query(useCase?, type?, status?, channelId?, limit, offset)` | `GET /rwa/query?...` | Parameterized filter |
| `list()` | `GET /rwa/query` | All assets |
| `get(assetId)` | `GET /rwa/assets/{id}` | Single asset |
| `listByUseCase(ucId)` | `GET /rwa/query?useCase=...` | Filter by use case |
| `listByType(type)` | `GET /rwa/query?type=...` | Filter by type |
| `listByChannel(chId)` | `GET /rwa/query?channelId=...` | Filter by channel |
| `useCaseSummary()` | `GET /rwa/query/use-cases` | Grouped counts |
| `typeSummary()` | `GET /rwa/query/types` | Grouped counts |
| `channelsForAsset(id)` | `GET /asset-channels/{id}` | Channel memberships |
| `assetsInChannel(chId)` | `GET /asset-channels/channel/{id}` | Channel contents |
| `listDerivedTokens(id)` | `GET /rwa/{id}/derived-tokens` | Secondary tokens |
| `getComplianceStatus(id, fw)` | `GET /rwa/{id}/compliance/{fw}` | Framework status |

**Example** (all 4 languages):

```java
// Java
Map<String, Object> gold = client.assets().listByUseCase("UC_GOLD");
```

```typescript
// TypeScript
const gold = await client.assets.listByUseCase('UC_GOLD');
```

```python
# Python
gold = client.assets.list_by_use_case("UC_GOLD")
```

```rust
// Rust
let gold = client.assets().list_by_use_case("UC_GOLD").await?;
```

---

## channels

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `list()` | `GET /channels` | All channels |
| `get(channelId)` | `GET /channels/{id}` | Single channel |

See [Multi-Channel](../multi-channel.md) for channel types (ASSET/TRANSACTION/BRIDGE).

---

## compliance

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `listFrameworks()` | `GET /compliance/frameworks` | All 65 frameworks |
| `getFramework(code)` | `GET /compliance/frameworks/{code}` | Framework detail |
| `assess(assetId, framework)` | `POST /compliance/assess` | Run assessment |
| `getAssessments(assetId)` | `GET /rwa/{id}/compliance` | Past assessments |

Frameworks: MiCA, SFDR, GDPR, AMLD6, FATF-40, PMLA, BIS, RERA, ISO 28000, ISO 14064, and 55 more.

---

## contracts

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `deploy(request)` | `POST /contracts/deploy` | Deploy Ricardian contract |
| `invoke(contractId, method, args)` | `POST /contracts/{id}/invoke` | Call contract method |
| `get(contractId)` | `GET /contracts/{id}` | Contract state |
| `list()` | `GET /contracts` | All active contracts |

---

## dmrv

Digital Monitoring, Reporting & Verification — carbon credits, battery lifecycle, ESG events.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `recordEvent(event)` | `POST /dmrv/events` | Single event |
| `batchRecord(events)` | `POST /dmrv/events/batch` | Up to 50 events |
| `getEvents(filter)` | `GET /dmrv/events` | Query events |

---

## gdpr

See [GDPR Compliance](../gdpr-compliance.md) for the full erasure workflow.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `exportUserData(userId)` | `GET /gdpr/export/{id}` | Data export (Art. 20) |
| `downloadUserData(userId)` | `GET /gdpr/export/{id}/download` | As file attachment |
| `requestErasure(userId)` | `DELETE /gdpr/erasure/{id}` | Erasure (Art. 17) |

---

## governance

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `listProposals()` | `GET /governance/proposals` | All proposals |
| `getProposal(id)` | `GET /governance/proposals/{id}` | Detail |
| `vote(proposalId, approve)` | `POST /governance/proposals/{id}/vote` | Cast vote |
| `getTreasury()` | `GET /governance/treasury` | Treasury stats |

---

## graphql

REST-proxy GraphQL gateway. See [GraphQL](../graphql.md).

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `query(q, vars?)` | `POST /graphql` | Generic query |
| `queryChannels()` | `POST /graphql` | Typed helper |
| `queryAssets(channelId?)` | `POST /graphql` | Typed helper |
| `queryContracts()` | `POST /graphql` | Typed helper |
| `queryNodeMetrics()` | `POST /graphql` | Typed helper |

---

## handshake

See [Handshake Protocol](../handshake-protocol.md) for the 4-phase flow.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `hello()` | `GET /sdk/handshake/hello` | Registration |
| `heartbeat()` | `POST /sdk/handshake/heartbeat` | Liveness |
| `capabilities()` | `GET /sdk/handshake/capabilities` | Feature negotiation |
| `config()` | `GET /sdk/handshake/config` | Runtime params |

---

## nodes

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `list()` | `GET /nodes` | All nodes |
| `get(nodeId)` | `GET /nodes/{id}` | Detail |
| `metrics()` | `GET /nodes/metrics` | Aggregate metrics |
| `stats()` | `GET /nodes/stats` | Per-type stats |
| `register(request)` | `POST /nodes/register` | Register new node |

---

## tier

See [Tier System](../tier-system.md).

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `getPartnerTier()` | `GET /sdk/partner/tier` | Current tier + limits |
| `getUsage()` | `GET /sdk/partner/usage` | Usage stats |
| `getQuota()` | `GET /sdk/partner/quota` | Remaining quota |
| `requestUpgrade(targetTier)` | `POST /sdk/partner/tier/upgrade` | Submit upgrade request |

---

## transactions

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `submit(request)` | `POST /transactions` | Submit transaction |
| `get(txId)` | `GET /transactions/{id}` | Transaction state |
| `listRecent()` | `GET /transactions/recent` | Recent batch |

---

## wallet

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `getBalance(address)` | `GET /wallet/{addr}/balance` | Balance |
| `transfer(request)` | `POST /wallet/transfer` | Initiate transfer |
| `getHistory(address)` | `GET /wallet/{addr}/history` | Transaction history |

Wallet operations delegate to the Battua microservice.

---

## Common Response Shapes

### Paginated Response

```json
{
  "total": 1234,
  "filtered": 50,
  "offset": 0,
  "limit": 50,
  "assets": [ ... ]
}
```

### Error Response (RFC 7807)

See [Error Handling](../error-handling.md).

```json
{
  "type": "https://aurigraph.io/errors/not-found",
  "title": "Not Found",
  "status": 404,
  "detail": "No data found for userId: test",
  "errorCode": "ERR_GDPR_002",
  "traceId": "420131f7-...",
  "timestamp": "2026-04-13T..."
}
```

## See Also

- [Getting Started](../getting-started.md) — first integration
- [SDK-specific guides](../sdks/) — language-specific usage
- [Error Handling](../error-handling.md) — error parsing
