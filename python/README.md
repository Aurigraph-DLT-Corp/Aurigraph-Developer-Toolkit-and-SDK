# Aurigraph Python SDK

Official Python SDK for the Aurigraph DLT V12 platform (V11 API).

## Installation

```bash
pip install aurigraph-sdk
```

For development:

```bash
pip install aurigraph-sdk[dev]
```

## Quickstart

```python
from aurigraph_sdk import AurigraphClient

# Initialize with paired API key (production)
client = AurigraphClient(
    base_url="https://dlt.aurigraph.io",
    app_id="your-app-id",
    api_key="your-api-key",
)

# Or with JWT token
client = AurigraphClient(
    base_url="https://dlt.aurigraph.io",
    jwt_token="your-jwt-token",
)

# Platform health and stats
health = client.health()
print(f"Status: {health.status}")

stats = client.stats()
print(f"TPS: {stats.tps}, Active Nodes: {stats.active_nodes}")

# List assets by use case
gold_assets = client.assets.list_by_use_case("UC_GOLD")

# Query nodes
metrics = client.nodes.metrics()
print(f"Total Nodes: {metrics.total_nodes}")

# GraphQL query
result = client.graphql.query_channels()

# SDK handshake
hello = client.handshake.hello()

# Always close when done (or use context manager)
client.close()
```

### Context Manager

```python
with AurigraphClient(base_url="https://dlt.aurigraph.io", api_key="key") as client:
    health = client.health()
```

## API Namespaces

| Namespace | Access | Description |
|-----------|--------|-------------|
| `assets` | `client.assets` | Asset-agnostic RWA operations (any asset type) |
| `gdpr` | `client.gdpr` | GDPR data export and erasure |
| `graphql` | `client.graphql` | GraphQL gateway |
| `tier` | `client.tier` | SDK tier management |
| `governance` | `client.governance` | On-chain governance proposals and voting |
| `wallet` | `client.wallet` | Wallet balances and transfers |
| `compliance` | `client.compliance` | Regulatory compliance assessment |
| `nodes` | `client.nodes` | Network node management |
| `channels` | `client.channels` | Channel management |
| `transactions` | `client.transactions` | Transaction submission and querying |
| `dmrv` | `client.dmrv` | Digital MRV (Measurement, Reporting, Verification) |
| `contracts` | `client.contracts` | Smart contract and Ricardian contract operations |
| `handshake` | `client.handshake` | SDK handshake protocol |

## Error Handling

All errors extend `AurigraphError` and include RFC 7807 Problem Details when available:

```python
from aurigraph_sdk.errors import AurigraphClientError, AurigraphServerError

try:
    asset = client.assets.get("invalid-id")
except AurigraphClientError as e:
    print(f"Client error {e.status}: {e}")
    if e.problem:
        print(f"Error code: {e.problem.error_code}")
except AurigraphServerError as e:
    print(f"Server error {e.status}: {e}")
```

## Requirements

- Python 3.10+
- httpx >= 0.27
- pydantic >= 2.0

## Links

- [Aurigraph DLT Platform](https://dlt.aurigraph.io)
- [API Documentation](https://dlt.aurigraph.io/docs/api)
- [Main Repository](https://github.com/Aurigraph-DLT-Corp/Aurigraph-Developer-Toolkit-and-SDK)
