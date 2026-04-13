"""Namespace for /api/v11/sdk/partner endpoints -- SDK tier management."""

from __future__ import annotations

from typing import TYPE_CHECKING

from aurigraph_sdk.models import MintQuota, TierConfig, UpgradeRequest, UsageStats

if TYPE_CHECKING:
    from aurigraph_sdk.client import AurigraphClient


class TierApi:
    """SDK tier management operations."""

    def __init__(self, client: AurigraphClient) -> None:
        self._client = client

    def get_partner_tier(self) -> TierConfig:
        """Get the current partner tier configuration."""
        data = self._client._get("/sdk/partner/tier")
        return TierConfig.model_validate(data)

    def get_usage(self) -> UsageStats:
        """Get current SDK usage statistics."""
        data = self._client._get("/sdk/partner/usage")
        return UsageStats.model_validate(data)

    def get_quota(self) -> MintQuota:
        """Get remaining mint quota for the current billing period."""
        data = self._client._get("/sdk/partner/quota")
        return MintQuota.model_validate(data)

    def request_upgrade(self, target_tier: str) -> UpgradeRequest:
        """Request an upgrade to a higher SDK tier.

        Args:
            target_tier: The target tier to upgrade to (e.g. 'GOLD', 'ENTERPRISE').

        Returns:
            The upgrade request confirmation.
        """
        data = self._client._post(
            "/sdk/partner/tier/upgrade", {"targetTier": target_tier}
        )
        return UpgradeRequest.model_validate(data)
