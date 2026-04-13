"""Namespace for /api/v11/nodes endpoints -- node management."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from aurigraph_sdk.models import NodeInfo, NodeMetrics

if TYPE_CHECKING:
    from aurigraph_sdk.client import AurigraphClient


class NodesApi:
    """Node management operations."""

    def __init__(self, client: AurigraphClient) -> None:
        self._client = client

    def list(self, page: int = 0, page_size: int = 50) -> dict[str, Any]:
        """List network nodes with pagination.

        Args:
            page: Page number (0-based).
            page_size: Number of nodes per page.

        Returns:
            Paginated node list response.
        """
        return self._client._get(f"/nodes?page={page}&pageSize={page_size}")

    def get(self, node_id: str) -> NodeInfo:
        """Get a specific node by ID.

        Args:
            node_id: The node identifier.
        """
        data = self._client._get(f"/nodes/{node_id}")
        return NodeInfo.model_validate(data)

    def metrics(self) -> NodeMetrics:
        """Get aggregate node metrics (totalNodes, activeNodes, etc.)."""
        data = self._client._get("/nodes/metrics")
        return NodeMetrics.model_validate(data)

    def stats(self) -> dict[str, Any]:
        """Get node statistics."""
        return self._client._get("/nodes/stats")

    def register(self, request: dict[str, Any]) -> NodeInfo:
        """Register a new node on the network.

        Args:
            request: Node registration payload (name, type, host, port, etc.).

        Returns:
            The registered node info.
        """
        data = self._client._post("/nodes", request)
        return NodeInfo.model_validate(data)
