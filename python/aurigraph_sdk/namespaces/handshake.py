"""Namespace for /api/v11/sdk/handshake endpoints -- SDK handshake protocol."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

from aurigraph_sdk.models import (
    CapabilitiesResponse,
    ConfigResponse,
    HeartbeatResponse,
    HelloResponse,
)

if TYPE_CHECKING:
    from aurigraph_sdk.client import AurigraphClient


class HandshakeApi:
    """SDK handshake protocol operations (hello / heartbeat / capabilities / config)."""

    def __init__(self, client: AurigraphClient) -> None:
        self._client = client

    def hello(self) -> HelloResponse:
        """Bootstrap call -- returns full server metadata and app permissions."""
        data = self._client._get("/sdk/handshake/hello")
        return HelloResponse.model_validate(data)

    def heartbeat(self, client_version: str = "aurigraph-python-sdk/1.3.0") -> HeartbeatResponse:
        """Liveness ping -- call every 5 minutes.

        Args:
            client_version: The SDK client version string.

        Returns:
            Heartbeat acknowledgment.
        """
        data = self._client._post(
            "/sdk/handshake/heartbeat",
            {
                "clientVersion": client_version,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
        return HeartbeatResponse.model_validate(data)

    def capabilities(self) -> CapabilitiesResponse:
        """Returns endpoint list filtered by this app's approved scopes."""
        data = self._client._get("/sdk/handshake/capabilities")
        return CapabilitiesResponse.model_validate(data)

    def config(self) -> ConfigResponse:
        """Lightweight refresh -- detects scope/status changes."""
        data = self._client._get("/sdk/handshake/config")
        return ConfigResponse.model_validate(data)
