"""
Aurigraph SDK Client - Async implementation
"""

import logging
from typing import Optional, Any, Dict
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

    def __init__(self, config: AurigraphClientConfig | Dict[str, Any]) -> None:
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
