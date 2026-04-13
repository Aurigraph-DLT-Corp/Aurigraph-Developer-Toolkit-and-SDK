# Python SDK

Official Python SDK for Aurigraph DLT V12. Built on `httpx` + `pydantic` for robust HTTP and typed models.

**Current Version**: `1.3.0`
**Minimum Python**: 3.10
**Dependencies**: `httpx>=0.27`, `pydantic>=2.0`

## Install

```bash
pip install aurigraph-sdk
# or
poetry add aurigraph-sdk
# or
uv add aurigraph-sdk
```

> Note: PyPI publishing begins with v2.0. For v1.x, install from the source repo.

## Quickstart

### Sync Client

```python
from aurigraph_sdk import AurigraphClient

client = AurigraphClient(
    base_url="https://dlt.aurigraph.io",
    app_id=os.environ["AURIGRAPH_APP_ID"],
    api_key=os.environ["AURIGRAPH_API_KEY"],
)

# Health check (public)
health = client.health()
print(f"Platform: {health.status}")

# Handshake (auth required)
hello = client.handshake.hello()
print(f"Tier: {hello.partner_profile.tier}")

# Query assets
gold = client.assets.list_by_use_case("UC_GOLD")
print(f"Gold assets: {gold['filtered']}")

# Always close
client.close()
```

### Context Manager (Recommended)

```python
with AurigraphClient(base_url=..., api_key=...) as client:
    hello = client.handshake.hello()
    # ...
# Client auto-closes on exit
```

### Async Client

```python
import asyncio
from aurigraph_sdk import AsyncAurigraphClient

async def main():
    async with AsyncAurigraphClient(
        base_url="https://dlt.aurigraph.io",
        api_key=api_key,
    ) as client:
        hello = await client.handshake.hello()
        gold = await client.assets.list_by_use_case("UC_GOLD")
        print(f"Tier: {hello.partner_profile.tier}")

asyncio.run(main())
```

## Pydantic Models

All responses are parsed into Pydantic v2 models with camelCase→snake_case conversion:

```python
from aurigraph_sdk.models import HealthResponse, PlatformStats, HelloResponse

hello: HelloResponse = client.handshake.hello()
print(hello.session_id)              # sessionId in JSON
print(hello.partner_profile.tier)    # partnerProfile.tier in JSON

# JSON serialization preserves camelCase
print(hello.model_dump_json())        # camelCase output
print(hello.model_dump())             # snake_case Python dict
```

Unknown fields are tolerated (`extra="allow"` on all models) — SDK stays compatible with future API versions.

## asyncio Integration

The async client integrates with any asyncio framework:

### FastAPI

```python
from fastapi import FastAPI
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.aurigraph = AsyncAurigraphClient(
        base_url=BASE_URL,
        api_key=API_KEY,
    )
    yield
    await app.state.aurigraph.close()

app = FastAPI(lifespan=lifespan)

@app.get("/assets/{asset_id}")
async def get_asset(asset_id: str):
    return await app.state.aurigraph.assets.get(asset_id)
```

### Django (async views)

```python
async def asset_view(request, asset_id: str):
    async with AsyncAurigraphClient(...) as client:
        return JsonResponse(await client.assets.get(asset_id))
```

## Type Checking

The SDK is fully type-hinted (tested with `mypy --strict`):

```python
# mypy will catch this
client.assets.list_by_use_case(42)  # error: expected str, got int

# All response types are accurate
health = client.health()
reveal_type(health)  # HealthResponse
```

## Error Handling

```python
from aurigraph_sdk.errors import (
    AurigraphError,
    AurigraphClientError,
    AurigraphServerError,
    AurigraphNetworkError,
)

try:
    client.assets.get("nonexistent")
except AurigraphClientError as e:
    # HTTP 4xx
    print(f"Error code: {e.problem.error_code}")
    print(f"Trace ID: {e.problem.trace_id}")
    print(f"User message: {e.problem.user_message}")
except AurigraphServerError as e:
    # HTTP 5xx — already retried
    print(f"Server error after retries: {e}")
except AurigraphNetworkError as e:
    # Connection failure
    print(f"Network error: {e}")
```

## Idempotency

Auto-generated SHA-256 idempotency keys for POST/PUT:

```python
# Retrying this 100x results in ONE mint
client.contracts.deploy(template_id="UC_GOLD", terms={...})
```

Override with custom key:

```python
client.transactions.submit(
    transaction,
    idempotency_key=user_transaction_uuid,
)
```

## Logging

Uses Python's standard `logging`. Configure your backend:

```python
import logging
logging.basicConfig(level=logging.INFO)
logging.getLogger("aurigraph_sdk").setLevel(logging.DEBUG)
```

At `DEBUG`, every request logs URL, method, duration, trace ID.

## Testing with Mocks

Use `respx` (httpx-native mocker):

```python
import respx
from aurigraph_sdk import AurigraphClient

@respx.mock
def test_get_asset():
    respx.get("https://dlt.aurigraph.io/api/v11/rwa/assets/RWA-CO-001").mock(
        return_value=httpx.Response(200, json={"id": "RWA-CO-001", "type": "COMMODITY"})
    )

    client = AurigraphClient(base_url="https://dlt.aurigraph.io", api_key="test")
    asset = client.assets.get("RWA-CO-001")
    assert asset["type"] == "COMMODITY"
```

## Threading

The sync client is thread-safe — `httpx.Client` uses a connection pool. Share one client across threads:

```python
# Singleton pattern
_client: AurigraphClient | None = None

def get_client() -> AurigraphClient:
    global _client
    if _client is None:
        _client = AurigraphClient(base_url=..., api_key=...)
    return _client
```

For asyncio, create one `AsyncAurigraphClient` per event loop (typically per-process).

## Packaging Best Practices

For applications that embed the SDK, pin minor versions:

```toml
# pyproject.toml
[project]
dependencies = [
    "aurigraph-sdk>=1.3,<2.0",
]
```

This gets bug fixes (1.3.x patches) but not breaking changes (2.0+).

## See Also

- [API Reference](../api-reference/) — all namespaces
- [Getting Started](../getting-started.md) — first integration
- [Error Handling](../error-handling.md) — RFC 7807 errors
