"""
Aurigraph SDK Client - Async implementation
"""

import logging
from typing import Optional, Any, Dict, Union
import aiohttp

from .models import AurigraphClientConfig, Account, Transaction

logger = logging.getLogger(__name__)


class AurigraphClient:
    """
    Main Aurigraph SDK Client

    Async client for interacting with Aurigraph V11 blockchain

    Example:
        ```python
        import asyncio
        from aurigraph import AurigraphClient

        async def main():
            client = AurigraphClient(
                base_url="https://dlt.aurigraph.io/api/v11",
                api_key="sk_..."
            )

            async with client:
                await client.connect()
                account = await client.get_account("auri1...")
                print(f"Balance: {account.balance}")

        asyncio.run(main())
        ```
    """

    def __init__(self, config: Union[AurigraphClientConfig, Dict[str, Any]]) -> None:
        """
        Initialize the Aurigraph client

        Args:
            config: Client configuration (AurigraphClientConfig or dict)
        """
        if isinstance(config, dict):
            self.config = AurigraphClientConfig(**config)
        else:
            self.config = config

        self._session: Optional[aiohttp.ClientSession] = None
        self._connected = False

    async def __aenter__(self):
        """Async context manager entry"""
        await self.connect()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self.disconnect()

    async def connect(self) -> None:
        """
        Connect to the Aurigraph network

        Raises:
            RuntimeError: If connection fails
        """
        try:
            timeout = aiohttp.ClientTimeout(total=self.config.timeout / 1000)
            headers = {
                "Content-Type": "application/json",
            }
            if self.config.api_key:
                headers["X-API-Key"] = self.config.api_key

            self._session = aiohttp.ClientSession(
                base_url=self.config.base_url,
                timeout=timeout,
                headers=headers,
            )

            async with self._session.get("/health") as response:
                if response.status == 200:
                    self._connected = True
                    logger.info("✅ Connected to Aurigraph network")
                else:
                    raise RuntimeError(f"Health check failed with status {response.status}")

        except Exception as e:
            self._connected = False
            raise RuntimeError(f"Failed to connect to Aurigraph: {str(e)}") from e

    async def disconnect(self) -> None:
        """Disconnect from the network"""
        if self._session:
            await self._session.close()
        self._connected = False
        logger.info("✅ Disconnected from Aurigraph network")

    def is_connected(self) -> bool:
        """
        Check if connected to the network

        Returns:
            True if connected, False otherwise
        """
        return self._connected and self._session is not None

    async def get_account(self, address: str) -> Account:
        """
        Get account information

        Args:
            address: Account address

        Returns:
            Account object with balance, nonce, public key

        Raises:
            RuntimeError: If request fails or client not connected
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.get(f"/accounts/{address}") as response:
                if response.status == 200:
                    data = await response.json()
                    return Account(**data)
                else:
                    raise RuntimeError(f"Failed to get account: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to get account: {str(e)}") from e

    async def get_balance(self, address: str) -> str:
        """
        Get balance for an address

        Args:
            address: Account address

        Returns:
            Balance as string

        Raises:
            RuntimeError: If request fails
        """
        try:
            account = await self.get_account(address)
            return account.balance
        except Exception as e:
            raise RuntimeError(f"Failed to get balance: {str(e)}") from e

    async def submit_transaction(self, tx: Dict[str, Any]) -> Transaction:
        """
        Submit a transaction to the network

        Args:
            tx: Transaction data (from, to, amount, nonce, etc.)

        Returns:
            Transaction object with hash and status

        Raises:
            RuntimeError: If submission fails
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post("/transactions", json=tx) as response:
                if response.status == 200:
                    data = await response.json()
                    return Transaction(**data)
                else:
                    raise RuntimeError(
                        f"Failed to submit transaction: {response.status}"
                    )
        except Exception as e:
            raise RuntimeError(f"Failed to submit transaction: {str(e)}") from e

    async def get_transaction(self, tx_hash: str) -> Transaction:
        """
        Get transaction details

        Args:
            tx_hash: Transaction hash

        Returns:
            Transaction object with full details

        Raises:
            RuntimeError: If request fails
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.get(f"/transactions/{tx_hash}") as response:
                if response.status == 200:
                    data = await response.json()
                    return Transaction(**data)
                else:
                    raise RuntimeError(f"Failed to get transaction: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to get transaction: {str(e)}") from e

    async def get_latest_block(self) -> Dict[str, Any]:
        """
        Get latest block on the blockchain

        Returns:
            Block data including hash, height, timestamp

        Raises:
            RuntimeError: If request fails
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.get("/blocks/latest") as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to get latest block: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to get latest block: {str(e)}") from e

    # ===========================
    # RWAT WHITE LABELING FEATURES
    # ===========================

    async def initialize_white_label(self, config: Dict[str, Any]) -> None:
        """
        Initialize white label provider with custom branding and pricing

        Args:
            config: WhiteLabelConfig with provider details
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post("/rwat/white-label/initialize", json=config) as response:
                if response.status == 200:
                    logger.info(f"✅ White label provider initialized: {config.get('providerName')}")
                else:
                    raise RuntimeError(f"Failed to initialize white label: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to initialize white label: {str(e)}") from e

    async def get_pricing_tiers(self, provider_id: str) -> list[Dict[str, Any]]:
        """
        Get pricing tiers for white label provider

        Args:
            provider_id: White label provider ID

        Returns:
            List of pricing tier configurations
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.get(f"/rwat/white-label/{provider_id}/pricing") as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to get pricing tiers: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to get pricing tiers: {str(e)}") from e

    async def update_pricing_tier(self, provider_id: str, tier: Dict[str, Any]) -> None:
        """
        Update pricing tier configuration

        Args:
            provider_id: White label provider ID
            tier: Updated tier configuration
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            tier_name = tier.get('tier')
            async with self._session.put(f"/rwat/white-label/{provider_id}/pricing/{tier_name}", json=tier) as response:
                if response.status == 200:
                    logger.info(f"✅ Pricing tier updated: {tier_name}")
                else:
                    raise RuntimeError(f"Failed to update pricing tier: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to update pricing tier: {str(e)}") from e

    async def register_rwat(self, asset: Dict[str, Any]) -> Dict[str, Any]:
        """
        Register a real-world asset for tokenization

        Args:
            asset: Asset configuration with type, name, value, etc.

        Returns:
            Registered asset with ID and registry hash
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post("/rwat/assets/register", json=asset) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to register RWAT asset: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to register RWAT asset: {str(e)}") from e

    async def create_rwat_tokens(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create tokens from a registered asset

        Args:
            config: Token configuration with supply, symbol, etc.

        Returns:
            Token creation result with token IDs
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post("/rwat/tokens/create", json=config) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to create RWAT tokens: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to create RWAT tokens: {str(e)}") from e

    # ===========================
    # ACTIVE CONTRACTS & WORKFLOWS
    # ===========================

    async def create_active_contract(self, contract: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new Active Contract with workflow

        Args:
            contract: Contract configuration with workflow steps

        Returns:
            Created contract with ID
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post("/contracts/active/create", json=contract) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to create active contract: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to create active contract: {str(e)}") from e

    async def execute_active_contract(self, contract_id: str, input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute an active contract workflow

        Args:
            contract_id: ID of the contract to execute
            input_data: Input data for the workflow

        Returns:
            Execution result
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post(f"/contracts/active/{contract_id}/execute", json={"data": input_data}) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to execute active contract: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to execute active contract: {str(e)}") from e

    # ===========================
    # TOKEN NAVIGATION & TRACKING
    # ===========================

    async def get_token_navigation(self, token_id: str) -> Dict[str, Any]:
        """
        Get token navigation details (ownership, history, dividends)

        Args:
            token_id: Token ID

        Returns:
            Token navigation information
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.get(f"/tokens/navigation/{token_id}") as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to get token navigation: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to get token navigation: {str(e)}") from e

    async def get_token_trading_history(self, token_id: str, limit: int = 100) -> list[Dict[str, Any]]:
        """
        Get trading history for a token

        Args:
            token_id: Token ID
            limit: Maximum number of records

        Returns:
            List of token transactions
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.get(f"/tokens/{token_id}/history", params={"limit": limit}) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to get token trading history: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to get token trading history: {str(e)}") from e

    async def get_address_tokens(self, address: str) -> list[Dict[str, Any]]:
        """
        Get all tokens held by an address

        Args:
            address: Account address

        Returns:
            List of tokens held by the address
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.get(f"/tokens/holder/{address}") as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to get address tokens: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to get address tokens: {str(e)}") from e

    async def transfer_rwat_token(self, token_id: str, to: str, quantity: str, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Transfer RWAT tokens with compliance checks

        Args:
            token_id: Token ID
            to: Recipient address
            quantity: Quantity to transfer
            metadata: Optional transfer metadata

        Returns:
            Transaction result
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post(f"/tokens/{token_id}/transfer", json={"to": to, "quantity": quantity, "metadata": metadata}) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to transfer RWAT token: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to transfer RWAT token: {str(e)}") from e

    async def get_token_dividends(self, token_id: str) -> Dict[str, Any]:
        """
        Get dividend information for token holders

        Args:
            token_id: Token ID

        Returns:
            Dividend information
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.get(f"/tokens/{token_id}/dividends") as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to get token dividends: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to get token dividends: {str(e)}") from e

    async def claim_dividends(self, token_id: str, holder_address: str) -> Dict[str, Any]:
        """
        Claim dividends for a token holding

        Args:
            token_id: Token ID
            holder_address: Holder's address

        Returns:
            Claim result with amount and transaction details
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post(f"/tokens/{token_id}/claim-dividends", json={"holderAddress": holder_address}) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to claim dividends: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to claim dividends: {str(e)}") from e
