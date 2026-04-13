"""Namespace for /api/v11/governance endpoints -- on-chain governance."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any
from urllib.parse import quote

from aurigraph_sdk.models import Proposal, TreasuryStats, VoteReceipt

if TYPE_CHECKING:
    from aurigraph_sdk.client import AurigraphClient


class GovernanceApi:
    """On-chain governance operations."""

    def __init__(self, client: AurigraphClient) -> None:
        self._client = client

    def list_proposals(self) -> list[Proposal]:
        """List all governance proposals."""
        data = self._client._get("/governance/proposals")
        items: list[dict[str, Any]] = data if isinstance(data, list) else data.get("proposals", [])  # type: ignore[assignment]
        return [Proposal.model_validate(p) for p in items]

    def get_proposal(self, proposal_id: str) -> Proposal:
        """Get a specific governance proposal.

        Args:
            proposal_id: The proposal identifier.
        """
        enc = quote(proposal_id, safe="")
        data = self._client._get(f"/governance/proposals/{enc}")
        return Proposal.model_validate(data)

    def vote(self, proposal_id: str, approve: bool) -> VoteReceipt:
        """Cast a vote on a governance proposal.

        Args:
            proposal_id: The proposal to vote on.
            approve: True to vote in favor, False to vote against.

        Returns:
            Vote receipt confirming the vote was recorded.
        """
        enc = quote(proposal_id, safe="")
        data = self._client._post(
            f"/governance/proposals/{enc}/vote", {"approve": approve}
        )
        return VoteReceipt.model_validate(data)

    def get_treasury(self) -> TreasuryStats:
        """Get governance treasury statistics."""
        data = self._client._get("/governance/treasury")
        return TreasuryStats.model_validate(data)
