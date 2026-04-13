"""Namespace for /api/v11/graphql -- GraphQL gateway."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from aurigraph_sdk.models import GraphQLResponse

if TYPE_CHECKING:
    from aurigraph_sdk.client import AurigraphClient


class GraphQLApi:
    """GraphQL gateway operations."""

    def __init__(self, client: AurigraphClient) -> None:
        self._client = client

    def query(
        self,
        query: str,
        variables: dict[str, Any] | None = None,
    ) -> GraphQLResponse:
        """Execute an arbitrary GraphQL query with optional variables.

        Args:
            query: The GraphQL query string.
            variables: Optional variables for the query.

        Returns:
            The GraphQL response with data and/or errors.
        """
        body: dict[str, Any] = {"query": query}
        if variables:
            body["variables"] = variables
        data = self._client._post("/graphql", body)
        return GraphQLResponse.model_validate(data)

    def query_channels(self) -> GraphQLResponse:
        """Query all channels via GraphQL."""
        return self.query(
            "{ channels { id name type status stakeholders { id role } } }"
        )

    def query_assets(self, channel_id: str) -> GraphQLResponse:
        """Query assets for a specific channel via GraphQL.

        Args:
            channel_id: The channel ID to query assets for.
        """
        return self.query(
            "query($channelId: ID!) { assets(channelId: $channelId) { id type status owner } }",
            variables={"channelId": channel_id},
        )

    def query_contracts(self) -> GraphQLResponse:
        """Query all contracts via GraphQL."""
        return self.query(
            "{ contracts { id title status templateId parties { name role } } }"
        )

    def query_node_metrics(self) -> GraphQLResponse:
        """Query node metrics via GraphQL."""
        return self.query(
            "{ nodeMetrics { totalNodes activeNodes validatorCount networkStatus } }"
        )
