"""Namespace for /api/v11/gdpr endpoints -- GDPR data export and erasure."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any
from urllib.parse import quote

from aurigraph_sdk.models import ErasureReceipt, GdprExportPayload

if TYPE_CHECKING:
    from aurigraph_sdk.client import AurigraphClient


class GdprApi:
    """GDPR data export and erasure operations."""

    def __init__(self, client: AurigraphClient) -> None:
        self._client = client

    def export_user_data(self, user_id: str) -> GdprExportPayload:
        """Export all user data (GDPR Article 20 -- data portability).

        Args:
            user_id: The user identifier to export data for.

        Returns:
            The exported data payload.
        """
        enc = quote(user_id, safe="")
        data = self._client._get(f"/gdpr/export/{enc}")
        return GdprExportPayload.model_validate(data)

    def download_user_data(self, user_id: str) -> dict[str, Any]:
        """Download user data as a raw archive.

        Args:
            user_id: The user identifier to download data for.

        Returns:
            The download response (may contain binary data reference).
        """
        enc = quote(user_id, safe="")
        return self._client._get(f"/gdpr/export/{enc}/download")

    def request_erasure(self, user_id: str) -> ErasureReceipt:
        """Request erasure of all user data (GDPR Article 17 -- right to be forgotten).

        Args:
            user_id: The user identifier to erase.

        Returns:
            Erasure receipt confirming the request.
        """
        enc = quote(user_id, safe="")
        data = self._client._delete(f"/gdpr/erasure/{enc}")
        return ErasureReceipt.model_validate(data)
