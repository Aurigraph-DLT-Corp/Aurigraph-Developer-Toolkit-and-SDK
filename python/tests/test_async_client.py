"""Tests for the Aurigraph async Python SDK client.

Uses ``respx`` to mock httpx async transports and ``pytest-asyncio`` for
async test execution.
"""

from __future__ import annotations

import httpx
import pytest
import respx

from aurigraph_sdk import AsyncAurigraphClient
from aurigraph_sdk.errors import (
    AurigraphClientError,
    AurigraphConfigError,
    AurigraphServerError,
)
from aurigraph_sdk.models import HealthResponse, PlatformStats

BASE_URL = "https://dlt.aurigraph.io"
API_PREFIX = "/api/v11"


def _url(path: str) -> str:
    return f"{BASE_URL}{API_PREFIX}{path}"


# ── Async Client Initialization ──────────────────────────────────────────────


class TestAsyncClientInit:
    def test_init_requires_base_url(self) -> None:
        with pytest.raises(AurigraphConfigError, match="base_url is required"):
            AsyncAurigraphClient(base_url="")

    def test_init_strips_trailing_slash(self) -> None:
        client = AsyncAurigraphClient(base_url="https://dlt.aurigraph.io/")
        assert client._base_url == "https://dlt.aurigraph.io"

    @respx.mock
    async def test_async_context_manager(self) -> None:
        respx.get(_url("/health")).mock(
            return_value=httpx.Response(200, json={"status": "HEALTHY"})
        )
        async with AsyncAurigraphClient(base_url=BASE_URL) as client:
            result = await client.health()
            assert result.status == "HEALTHY"


# ── Async Health & Stats ─────────────────────────────────────────────────────


class TestAsyncHealthAndStats:
    @respx.mock
    async def test_health(self) -> None:
        respx.get(_url("/health")).mock(
            return_value=httpx.Response(
                200,
                json={"status": "HEALTHY", "version": "12.1.34", "uptime": "48h"},
            )
        )
        async with AsyncAurigraphClient(base_url=BASE_URL) as client:
            result = await client.health()
            assert isinstance(result, HealthResponse)
            assert result.status == "HEALTHY"
            assert result.version == "12.1.34"

    @respx.mock
    async def test_stats(self) -> None:
        respx.get(_url("/stats")).mock(
            return_value=httpx.Response(
                200,
                json={
                    "tps": 1934728.0,
                    "totalTransactions": 50000,
                    "activeNodes": 37,
                    "networkStatus": "HEALTHY",
                },
            )
        )
        async with AsyncAurigraphClient(base_url=BASE_URL) as client:
            result = await client.stats()
            assert isinstance(result, PlatformStats)
            assert result.tps == 1934728.0
            assert result.active_nodes == 37


# ── Async Auth Headers ───────────────────────────────────────────────────────


class TestAsyncAuthHeaders:
    @respx.mock
    async def test_jwt_auth(self) -> None:
        route = respx.get(_url("/health")).mock(
            return_value=httpx.Response(200, json={"status": "HEALTHY"})
        )
        async with AsyncAurigraphClient(base_url=BASE_URL, jwt_token="my-jwt") as client:
            await client.health()
        assert route.calls[0].request.headers["authorization"] == "Bearer my-jwt"

    @respx.mock
    async def test_paired_api_key_auth(self) -> None:
        route = respx.get(_url("/health")).mock(
            return_value=httpx.Response(200, json={"status": "HEALTHY"})
        )
        async with AsyncAurigraphClient(
            base_url=BASE_URL, app_id="app-1", api_key="raw-key"
        ) as client:
            await client.health()
        assert route.calls[0].request.headers["authorization"] == "ApiKey app-1:raw-key"


# ── Async Error Handling ─────────────────────────────────────────────────────


class TestAsyncErrorHandling:
    @respx.mock
    async def test_client_error_4xx(self) -> None:
        respx.get(_url("/health")).mock(
            return_value=httpx.Response(
                404,
                json={"type": "about:blank", "title": "Not Found", "status": 404},
            )
        )
        async with AsyncAurigraphClient(base_url=BASE_URL) as client:
            with pytest.raises(AurigraphClientError) as exc_info:
                await client.health()
            assert exc_info.value.status == 404

    @respx.mock
    async def test_server_error_5xx_retries(self) -> None:
        route = respx.get(_url("/health")).mock(
            return_value=httpx.Response(
                500,
                json={"type": "about:blank", "title": "Server Error", "status": 500},
            )
        )
        async with AsyncAurigraphClient(
            base_url=BASE_URL, max_retries=2, timeout=1.0
        ) as client:
            with pytest.raises(AurigraphServerError):
                await client.health()
        assert route.call_count == 2


# ── Async Namespace: Assets ──────────────────────────────────────────────────


class TestAsyncAssetsApi:
    @respx.mock
    async def test_list_by_use_case(self) -> None:
        respx.get(_url("/rwa/query"), params__contains={"useCase": "UC_GOLD"}).mock(
            return_value=httpx.Response(
                200,
                json={
                    "items": [
                        {"id": "asset-1", "type": "COMMODITY", "useCaseId": "UC_GOLD"}
                    ],
                    "total": 1,
                },
            )
        )
        async with AsyncAurigraphClient(base_url=BASE_URL) as client:
            result = await client.assets.list_by_use_case("UC_GOLD")
            assert "items" in result
            assert result["items"][0]["useCaseId"] == "UC_GOLD"

    @respx.mock
    async def test_get_asset(self) -> None:
        respx.get(_url("/rwa/assets/asset-1")).mock(
            return_value=httpx.Response(
                200,
                json={"id": "asset-1", "type": "COMMODITY", "status": "ACTIVE"},
            )
        )
        async with AsyncAurigraphClient(base_url=BASE_URL) as client:
            result = await client.assets.get("asset-1")
            assert result["id"] == "asset-1"
            assert result["status"] == "ACTIVE"

    @respx.mock
    async def test_get_compliance_status(self) -> None:
        respx.get(_url("/rwa/asset-1/compliance/MiCA")).mock(
            return_value=httpx.Response(
                200, json={"status": "COMPLIANT", "score": 0.95}
            )
        )
        async with AsyncAurigraphClient(base_url=BASE_URL) as client:
            result = await client.assets.get_compliance_status("asset-1", "MiCA")
            assert result["status"] == "COMPLIANT"

    @respx.mock
    async def test_idempotency_header_on_post(self) -> None:
        route = respx.post(_url("/wallet/transfer")).mock(
            return_value=httpx.Response(200, json={"txHash": "0xabc", "status": "OK"})
        )
        async with AsyncAurigraphClient(base_url=BASE_URL) as client:
            await client._post("/wallet/transfer", {"from": "a", "to": "b", "amount": 50})
        assert "idempotency-key" in route.calls[0].request.headers
        assert len(route.calls[0].request.headers["idempotency-key"]) == 64
