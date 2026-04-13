"""Namespace for /api/v11/transactions endpoints -- transaction management."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any
from urllib.parse import quote

from aurigraph_sdk.models import Transaction

if TYPE_CHECKING:
    from aurigraph_sdk.client import AurigraphClient


class TransactionsApi:
    """Transaction submission and querying."""

    def __init__(self, client: AurigraphClient) -> None:
        self._client = client

    def submit(self, transaction: dict[str, Any]) -> dict[str, Any]:
        """Submit a new transaction to the network.

        Args:
            transaction: The transaction payload.

        Returns:
            Transaction receipt with tx_hash and status.
        """
        return self._client._post("/transactions", transaction)

    def get(self, tx_hash: str) -> Transaction:
        """Get a transaction by its hash.

        Args:
            tx_hash: The transaction hash.

        Returns:
            The transaction record.
        """
        enc = quote(tx_hash, safe="")
        data = self._client._get(f"/transactions/{enc}")
        return Transaction.model_validate(data)

    def list_recent(self, limit: int = 20) -> list[Transaction]:
        """List recent transactions.

        Args:
            limit: Maximum number of transactions to return.

        Returns:
            List of recent transactions.
        """
        data = self._client._get(f"/transactions/recent?limit={limit}")
        items: list[dict[str, Any]]
        if isinstance(data, list):  # type: ignore[arg-type]
            items = data  # type: ignore[assignment]
        elif isinstance(data, dict):
            items = data.get("transactions", data.get("items", []))
        else:
            items = []
        return [Transaction.model_validate(tx) for tx in items]
