"""Namespace for /api/v11/channels endpoints -- channel management."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any
from urllib.parse import quote

from aurigraph_sdk.models import Channel

if TYPE_CHECKING:
    from aurigraph_sdk.client import AurigraphClient


class ChannelsApi:
    """Channel management operations."""

    def __init__(self, client: AurigraphClient) -> None:
        self._client = client

    def list(self) -> list[Channel]:
        """List all channels.

        Returns:
            List of channels. Handles both array and wrapped responses.
        """
        data = self._client._get("/channels")
        items: list[dict[str, Any]]
        if isinstance(data, list):  # type: ignore[arg-type]
            items = data  # type: ignore[assignment]
        elif isinstance(data, dict):
            items = data.get("channels", data.get("items", []))
        else:
            items = []
        return [Channel.model_validate(ch) for ch in items]

    def get(self, channel_id: str) -> Channel:
        """Get a specific channel by ID.

        Args:
            channel_id: The channel identifier.

        Returns:
            Channel information.
        """
        enc = quote(channel_id, safe="")
        data = self._client._get(f"/channels/{enc}")
        return Channel.model_validate(data)
