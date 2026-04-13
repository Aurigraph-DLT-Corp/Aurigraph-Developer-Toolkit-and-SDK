"""Namespace for /api/v11/wallet endpoints -- wallet management and transfers."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any
from urllib.parse import quote

from aurigraph_sdk.models import Transaction, TransferReceipt, TransferRequest, WalletBalance

if TYPE_CHECKING:
    from aurigraph_sdk.client import AurigraphClient


class WalletApi:
    """Wallet management and transfer operations."""

    def __init__(self, client: AurigraphClient) -> None:
        self._client = client

    def get_balance(self, address: str) -> WalletBalance:
        """Get the balance for a wallet address.

        Args:
            address: The wallet address.

        Returns:
            Current wallet balance.
        """
        enc = quote(address, safe="")
        data = self._client._get(f"/wallet/{enc}/balance")
        return WalletBalance.model_validate(data)

    def transfer(self, request: TransferRequest) -> TransferReceipt:
        """Transfer tokens between wallets.

        Args:
            request: The transfer request details.

        Returns:
            Transfer receipt.
        """
        data = self._client._post("/wallet/transfer", request.model_dump())
        return TransferReceipt.model_validate(data)

    def get_history(self, address: str) -> list[Transaction]:
        """Get transaction history for a wallet address.

        Args:
            address: The wallet address.

        Returns:
            List of transactions for the address.
        """
        enc = quote(address, safe="")
        data = self._client._get(f"/wallet/{enc}/history")
        items: list[dict[str, Any]] = data if isinstance(data, list) else data.get("transactions", [])  # type: ignore[assignment]
        return [Transaction.model_validate(tx) for tx in items]
