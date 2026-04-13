"""Namespace for /api/v11/active-contracts and /api/v11/contract-bindings endpoints."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any
from urllib.parse import quote

if TYPE_CHECKING:
    from aurigraph_sdk.client import AurigraphClient


class ContractsApi:
    """Smart contract and Ricardian contract operations."""

    def __init__(self, client: AurigraphClient) -> None:
        self._client = client

    def deploy(self, contract: dict[str, Any]) -> dict[str, Any]:
        """Deploy a new contract.

        Args:
            contract: The contract deployment payload.

        Returns:
            Deployment receipt.
        """
        return self._client._post("/contracts", contract)

    def invoke(self, contract_id: str, method: str, args: dict[str, Any] | None = None) -> dict[str, Any]:
        """Invoke a method on a deployed contract.

        Args:
            contract_id: The contract to invoke.
            method: The method name to call.
            args: Optional method arguments.

        Returns:
            Invocation result.
        """
        enc = quote(contract_id, safe="")
        body: dict[str, Any] = {"method": method}
        if args:
            body["args"] = args
        return self._client._post(f"/contracts/{enc}/invoke", body)

    def get(self, contract_id: str) -> dict[str, Any]:
        """Get contract details by ID.

        Args:
            contract_id: The contract identifier.

        Returns:
            Contract details.
        """
        enc = quote(contract_id, safe="")
        return self._client._get(f"/active-contracts/{enc}")

    def get_tokens(self, contract_id: str) -> list[dict[str, Any]]:
        """Get tokens bound to a contract.

        Args:
            contract_id: The contract identifier.

        Returns:
            List of token bindings.
        """
        enc = quote(contract_id, safe="")
        data = self._client._get(f"/active-contracts/{enc}/tokens")
        if isinstance(data, list):  # type: ignore[arg-type]
            return data  # type: ignore[return-value]
        if isinstance(data, dict):
            return data.get("tokens", data.get("items", data.get("data", [])))
        return []

    def bind_composite(self, request: dict[str, Any]) -> dict[str, Any]:
        """Bind a composite token to a contract.

        Args:
            request: The composite bind request payload.

        Returns:
            Binding result.
        """
        return self._client._post("/contract-bindings/composite", request)

    def get_bindings_for_contract(self, contract_id: str) -> list[dict[str, Any]]:
        """Get all bindings for a contract.

        Args:
            contract_id: The contract identifier.

        Returns:
            List of composite bindings.
        """
        enc = quote(contract_id, safe="")
        data = self._client._get(f"/contract-bindings/contract/{enc}")
        if isinstance(data, list):  # type: ignore[arg-type]
            return data  # type: ignore[return-value]
        if isinstance(data, dict):
            return data.get("bindings", data.get("items", data.get("data", [])))
        return []
