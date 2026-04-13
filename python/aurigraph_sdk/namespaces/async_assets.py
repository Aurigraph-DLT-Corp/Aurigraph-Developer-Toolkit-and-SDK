"""Async asset-agnostic namespace for /api/v11/rwa and /api/v11/use-cases endpoints.

Async counterpart of :class:`AssetsApi`. All methods are ``async def``.

Example::

    async with AsyncAurigraphClient(...) as client:
        assets = await client.assets.list()
        gold = await client.assets.list_by_use_case("UC_GOLD")
        asset = await client.assets.get("asset-uuid")
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from aurigraph_sdk.async_client import AsyncAurigraphClient


class AsyncAssetsApi:
    """Async asset-agnostic RWA operations."""

    def __init__(self, client: AsyncAurigraphClient) -> None:
        self._client = client

    # ── Use Cases ─────────────────────────────────────────────────────────────

    async def list_use_cases(self) -> list[dict[str, Any]]:
        """List all registered use cases (UC_GOLD, UC_CARBON, UC_REAL_ESTATE, etc.)."""
        resp = await self._client._get("/use-cases")
        return resp if isinstance(resp, list) else resp.get("useCases", [])  # type: ignore[return-value]

    async def get_use_case(self, use_case_id: str) -> dict[str, Any]:
        """Get a specific use case by ID."""
        return await self._client._get(f"/use-cases/{use_case_id}")

    # ── Assets (generic) ──────────────────────────────────────────────────────

    async def query(
        self,
        use_case: str | None = None,
        asset_type: str | None = None,
        status: str | None = None,
        channel_id: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> dict[str, Any]:
        """Query assets with optional filters. Returns paginated results."""
        params = f"?limit={limit}&offset={offset}"
        if use_case:
            params += f"&useCase={use_case}"
        if asset_type:
            params += f"&type={asset_type}"
        if status:
            params += f"&status={status}"
        if channel_id:
            params += f"&channelId={channel_id}"
        return await self._client._get(f"/rwa/query{params}")

    async def list(self) -> dict[str, Any]:
        """List all RWA assets across all use cases."""
        return await self.query()

    async def get(self, asset_id: str) -> dict[str, Any]:
        """Get a single asset by ID (any asset type)."""
        return await self._client._get(f"/rwa/assets/{asset_id}")

    async def list_by_use_case(self, use_case_id: str) -> dict[str, Any]:
        """List assets filtered by use case (e.g. 'UC_GOLD', 'UC_CARBON')."""
        return await self.query(use_case=use_case_id)

    async def list_by_type(self, asset_type: str) -> dict[str, Any]:
        """List assets filtered by asset type (e.g. 'COMMODITY', 'REAL_ESTATE')."""
        return await self.query(asset_type=asset_type)

    async def list_by_channel(self, channel_id: str) -> dict[str, Any]:
        """List assets filtered by channel ID."""
        return await self.query(channel_id=channel_id)

    async def use_case_summary(self) -> dict[str, Any]:
        """Get use case summary with asset counts per use case."""
        return await self._client._get("/rwa/query/use-cases")

    async def type_summary(self) -> dict[str, Any]:
        """Get type summary with asset counts per type."""
        return await self._client._get("/rwa/query/types")

    # ── Public Ledger ─────────────────────────────────────────────────────────

    async def get_public_ledger(self, use_case_id: str) -> dict[str, Any]:
        """Get public ledger for a specific use case (asset-agnostic)."""
        path_map: dict[str, str] = {
            "UC_GOLD": "/rwa/gold/public/ledger",
            "UC_PROVENEWS": "/provenews/contracts",
        }
        path = path_map.get(use_case_id, f"/use-cases/{use_case_id}/assets")
        return await self._client._get(path)

    # ── Contracts (per use case) ──────────────────────────────────────────────

    async def list_contracts(self, use_case_id: str) -> list[dict[str, Any]]:
        """List active contracts for a use case."""
        resp = await self._client._get(f"/use-cases/{use_case_id}/contracts")
        return resp if isinstance(resp, list) else resp.get("contracts", [])  # type: ignore[return-value]

    # ── Multi-Channel Assignments ─────────────────────────────────────────────

    async def channels_for_asset(self, asset_id: str) -> dict[str, Any]:
        """List all channels an asset is assigned to (many-to-many)."""
        return await self._client._get(f"/asset-channels/{asset_id}")

    async def assets_in_channel(self, channel_id: str) -> dict[str, Any]:
        """List all assets in a channel."""
        return await self._client._get(f"/asset-channels/channel/{channel_id}")

    # ── Derived Tokens ────────────────────────────────────────────────────────

    async def list_derived_tokens(self, asset_id: str) -> list[dict[str, Any]]:
        """List derived/secondary tokens for an asset."""
        resp = await self._client._get(f"/rwa/{asset_id}/derived-tokens")
        return resp if isinstance(resp, list) else resp.get("tokens", [])  # type: ignore[return-value]

    # ── Compliance ────────────────────────────────────────────────────────────

    async def get_compliance_status(self, asset_id: str, framework: str) -> dict[str, Any]:
        """Get compliance status for an asset against a specific framework."""
        return await self._client._get(f"/rwa/{asset_id}/compliance/{framework}")
