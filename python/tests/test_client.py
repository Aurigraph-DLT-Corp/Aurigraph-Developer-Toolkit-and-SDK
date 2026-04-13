"""Tests for the Aurigraph Python SDK client and namespaces.

Uses ``respx`` to mock httpx transports.
"""

from __future__ import annotations

import json

import httpx
import pytest
import respx

from aurigraph_sdk import AurigraphClient
from aurigraph_sdk.errors import (
    AurigraphClientError,
    AurigraphConfigError,
    AurigraphNetworkError,
    AurigraphServerError,
)
from aurigraph_sdk.idempotency import generate_idempotency_key
from aurigraph_sdk.models import (
    Channel,
    GraphQLResponse,
    HealthResponse,
    NodeMetrics,
    PlatformStats,
    Proposal,
    Transaction,
    WalletBalance,
)

BASE_URL = "https://dlt.aurigraph.io"
API_PREFIX = "/api/v11"


def _url(path: str) -> str:
    return f"{BASE_URL}{API_PREFIX}{path}"


# ── Client Initialization ────────────────────────────────────────────────────


class TestClientInit:
    def test_init_requires_base_url(self) -> None:
        with pytest.raises(AurigraphConfigError, match="base_url is required"):
            AurigraphClient(base_url="")

    def test_init_strips_trailing_slash(self) -> None:
        with respx.mock:
            client = AurigraphClient(base_url="https://dlt.aurigraph.io/")
            assert client._base_url == "https://dlt.aurigraph.io"
            client.close()

    def test_context_manager(self) -> None:
        with AurigraphClient(base_url=BASE_URL) as client:
            assert client._base_url == BASE_URL


# ── Health & Stats ────────────────────────────────────────────────────────────


class TestHealthAndStats:
    @respx.mock
    def test_health(self) -> None:
        respx.get(_url("/health")).mock(
            return_value=httpx.Response(
                200,
                json={"status": "HEALTHY", "version": "12.1.34", "uptime": "48h"},
            )
        )
        with AurigraphClient(base_url=BASE_URL) as client:
            result = client.health()
            assert isinstance(result, HealthResponse)
            assert result.status == "HEALTHY"
            assert result.version == "12.1.34"

    @respx.mock
    def test_stats(self) -> None:
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
        with AurigraphClient(base_url=BASE_URL) as client:
            result = client.stats()
            assert isinstance(result, PlatformStats)
            assert result.tps == 1934728.0
            assert result.active_nodes == 37


# ── Auth Headers ──────────────────────────────────────────────────────────────


class TestAuthHeaders:
    @respx.mock
    def test_jwt_auth(self) -> None:
        route = respx.get(_url("/health")).mock(
            return_value=httpx.Response(200, json={"status": "HEALTHY"})
        )
        with AurigraphClient(base_url=BASE_URL, jwt_token="my-jwt") as client:
            client.health()
        assert route.calls[0].request.headers["authorization"] == "Bearer my-jwt"

    @respx.mock
    def test_paired_api_key_auth(self) -> None:
        route = respx.get(_url("/health")).mock(
            return_value=httpx.Response(200, json={"status": "HEALTHY"})
        )
        with AurigraphClient(base_url=BASE_URL, app_id="app-1", api_key="raw-key") as client:
            client.health()
        assert route.calls[0].request.headers["authorization"] == "ApiKey app-1:raw-key"

    @respx.mock
    def test_legacy_api_key_auth(self) -> None:
        route = respx.get(_url("/health")).mock(
            return_value=httpx.Response(200, json={"status": "HEALTHY"})
        )
        with AurigraphClient(base_url=BASE_URL, api_key="legacy-key") as client:
            client.health()
        assert route.calls[0].request.headers["x-api-key"] == "legacy-key"


# ── Error Handling ────────────────────────────────────────────────────────────


class TestErrorHandling:
    @respx.mock
    def test_client_error_4xx(self) -> None:
        respx.get(_url("/health")).mock(
            return_value=httpx.Response(
                404,
                json={"type": "about:blank", "title": "Not Found", "status": 404},
            )
        )
        with AurigraphClient(base_url=BASE_URL) as client:
            with pytest.raises(AurigraphClientError) as exc_info:
                client.health()
            assert exc_info.value.status == 404

    @respx.mock
    def test_server_error_5xx_retries(self) -> None:
        route = respx.get(_url("/health")).mock(
            return_value=httpx.Response(
                500,
                json={"type": "about:blank", "title": "Server Error", "status": 500},
            )
        )
        with AurigraphClient(base_url=BASE_URL, max_retries=2, timeout=1.0) as client:
            with pytest.raises(AurigraphServerError):
                client.health()
        assert route.call_count == 2


# ── Namespace: Assets ─────────────────────────────────────────────────────────


class TestAssetsApi:
    @respx.mock
    def test_list_by_use_case(self) -> None:
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
        with AurigraphClient(base_url=BASE_URL) as client:
            result = client.assets.list_by_use_case("UC_GOLD")
            assert "items" in result
            assert result["items"][0]["useCaseId"] == "UC_GOLD"

    @respx.mock
    def test_get_compliance_status(self) -> None:
        respx.get(_url("/rwa/asset-1/compliance/MiCA")).mock(
            return_value=httpx.Response(
                200, json={"status": "COMPLIANT", "score": 0.95}
            )
        )
        with AurigraphClient(base_url=BASE_URL) as client:
            result = client.assets.get_compliance_status("asset-1", "MiCA")
            assert result["status"] == "COMPLIANT"


# ── Namespace: GraphQL ────────────────────────────────────────────────────────


class TestGraphQLApi:
    @respx.mock
    def test_query(self) -> None:
        respx.post(_url("/graphql")).mock(
            return_value=httpx.Response(
                200,
                json={
                    "data": {
                        "channels": [
                            {"id": "ch-1", "name": "Home", "type": "HOME", "status": "ACTIVE"}
                        ]
                    },
                    "errors": None,
                },
            )
        )
        with AurigraphClient(base_url=BASE_URL) as client:
            result = client.graphql.query_channels()
            assert isinstance(result, GraphQLResponse)
            assert result.data is not None
            assert len(result.data["channels"]) == 1


# ── Namespace: Nodes ──────────────────────────────────────────────────────────


class TestNodesApi:
    @respx.mock
    def test_metrics(self) -> None:
        respx.get(_url("/nodes/metrics")).mock(
            return_value=httpx.Response(
                200,
                json={
                    "totalNodes": 37,
                    "activeNodes": 37,
                    "validatorCount": 7,
                    "networkStatus": "HEALTHY",
                },
            )
        )
        with AurigraphClient(base_url=BASE_URL) as client:
            result = client.nodes.metrics()
            assert isinstance(result, NodeMetrics)
            assert result.total_nodes == 37


# ── Namespace: Transactions ───────────────────────────────────────────────────


class TestTransactionsApi:
    @respx.mock
    def test_list_recent(self) -> None:
        respx.get(_url("/transactions/recent"), params__contains={"limit": "10"}).mock(
            return_value=httpx.Response(
                200,
                json={
                    "transactions": [
                        {"txHash": "0xabc", "type": "TRANSFER", "status": "CONFIRMED"}
                    ]
                },
            )
        )
        with AurigraphClient(base_url=BASE_URL) as client:
            result = client.transactions.list_recent(limit=10)
            assert len(result) == 1
            assert isinstance(result[0], Transaction)


# ── Idempotency ──────────────────────────────────────────────────────────────


class TestIdempotency:
    def test_deterministic_key(self) -> None:
        payload = {"amount": 100, "to": "addr-1", "from": "addr-2"}
        key1 = generate_idempotency_key("POST /wallet/transfer", payload)
        key2 = generate_idempotency_key("POST /wallet/transfer", payload)
        assert key1 == key2
        assert len(key1) == 64

    def test_key_order_independent(self) -> None:
        payload_a = {"from": "addr-2", "to": "addr-1", "amount": 100}
        payload_b = {"amount": 100, "to": "addr-1", "from": "addr-2"}
        key_a = generate_idempotency_key("POST /wallet/transfer", payload_a)
        key_b = generate_idempotency_key("POST /wallet/transfer", payload_b)
        assert key_a == key_b

    def test_different_operations_different_keys(self) -> None:
        payload = {"amount": 100}
        key1 = generate_idempotency_key("POST /wallet/transfer", payload)
        key2 = generate_idempotency_key("POST /dmrv/events", payload)
        assert key1 != key2

    @respx.mock
    def test_idempotency_header_sent(self) -> None:
        route = respx.post(_url("/wallet/transfer")).mock(
            return_value=httpx.Response(200, json={"txHash": "0xabc", "status": "OK"})
        )
        with AurigraphClient(base_url=BASE_URL) as client:
            client._post("/wallet/transfer", {"from": "a", "to": "b", "amount": 50})
        assert "idempotency-key" in route.calls[0].request.headers
        assert len(route.calls[0].request.headers["idempotency-key"]) == 64
