"""
Aurigraph SDK Client - Async implementation
"""

import logging
from typing import Optional, Any, Dict, Union
import aiohttp

from .models import (
    AurigraphClientConfig,
    Account,
    Transaction,
    ThirdPartyIntegration,
    PaymentIntegration,
    KYCIntegration,
    OracleIntegration,
    DataIntegration,
    NotificationIntegration,
    APICallConfig,
    IntegrationResult,
    WebhookEvent,
)

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

    # ===========================
    # 3RD PARTY INTEGRATIONS
    # ===========================

    async def register_integration(self, integration: Dict[str, Any]) -> Dict[str, Any]:
        """
        Register a new 3rd party integration

        Args:
            integration: Integration configuration

        Returns:
            Registered integration with ID
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post("/integrations/register", json=integration) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to register integration: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to register integration: {str(e)}") from e

    async def get_integration(self, integration_id: str) -> Dict[str, Any]:
        """
        Get integration details

        Args:
            integration_id: Integration ID

        Returns:
            Integration configuration
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.get(f"/integrations/{integration_id}") as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to get integration: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to get integration: {str(e)}") from e

    async def list_integrations(self, integration_type: Optional[str] = None) -> list[Dict[str, Any]]:
        """
        List all integrations

        Args:
            integration_type: Optional integration type filter

        Returns:
            List of integrations
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            params = {"type": integration_type} if integration_type else {}
            async with self._session.get("/integrations/list", params=params) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to list integrations: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to list integrations: {str(e)}") from e

    async def update_integration(self, integration_id: str, config: Dict[str, Any]) -> None:
        """
        Update integration configuration

        Args:
            integration_id: Integration ID
            config: Updated configuration
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.put(f"/integrations/{integration_id}", json=config) as response:
                if response.status != 200:
                    raise RuntimeError(f"Failed to update integration: {response.status}")
                logger.info(f"✅ Integration updated: {integration_id}")
        except Exception as e:
            raise RuntimeError(f"Failed to update integration: {str(e)}") from e

    async def delete_integration(self, integration_id: str) -> None:
        """
        Delete an integration

        Args:
            integration_id: Integration ID
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.delete(f"/integrations/{integration_id}") as response:
                if response.status != 200:
                    raise RuntimeError(f"Failed to delete integration: {response.status}")
                logger.info(f"✅ Integration deleted: {integration_id}")
        except Exception as e:
            raise RuntimeError(f"Failed to delete integration: {str(e)}") from e

    async def test_integration(self, integration_id: str) -> bool:
        """
        Test an integration's connectivity

        Args:
            integration_id: Integration ID

        Returns:
            True if test passed, False otherwise
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post(f"/integrations/{integration_id}/test") as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get("success", False)
                else:
                    return False
        except Exception as e:
            logger.error(f"Integration test failed: {str(e)}")
            return False

    async def call_external_api(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Make a call to an external API through integration

        Args:
            config: APICallConfig as dictionary

        Returns:
            Integration result
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post("/integrations/call-api", json=config) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to call external API: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to call external API: {str(e)}") from e

    # ===========================
    # PAYMENT INTEGRATION
    # ===========================

    async def register_payment_integration(self, payment: Dict[str, Any]) -> Dict[str, Any]:
        """
        Register a payment processor integration

        Args:
            payment: PaymentIntegration configuration

        Returns:
            Registered payment integration
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post("/integrations/payment/register", json=payment) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to register payment integration: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to register payment integration: {str(e)}") from e

    async def process_payment(
        self,
        integration_id: str,
        amount: str,
        currency: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Process a payment through integration

        Args:
            integration_id: Payment integration ID
            amount: Payment amount
            currency: Currency code
            metadata: Optional metadata

        Returns:
            Payment result
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post(
                f"/integrations/payment/{integration_id}/process",
                json={"amount": amount, "currency": currency, "metadata": metadata},
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to process payment: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to process payment: {str(e)}") from e

    # ===========================
    # KYC INTEGRATION
    # ===========================

    async def register_kyc_integration(self, kyc: Dict[str, Any]) -> Dict[str, Any]:
        """
        Register a KYC provider integration

        Args:
            kyc: KYCIntegration configuration

        Returns:
            Registered KYC integration
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post("/integrations/kyc/register", json=kyc) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to register KYC integration: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to register KYC integration: {str(e)}") from e

    async def start_kyc_session(
        self,
        integration_id: str,
        user_id: str,
        redirect_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Start a KYC verification session

        Args:
            integration_id: KYC integration ID
            user_id: User ID
            redirect_url: Optional redirect URL

        Returns:
            Session details
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post(
                f"/integrations/kyc/{integration_id}/session",
                json={"user_id": user_id, "redirect_url": redirect_url},
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to start KYC session: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to start KYC session: {str(e)}") from e

    async def get_kyc_status(self, integration_id: str, user_id: str) -> Dict[str, Any]:
        """
        Get KYC verification status

        Args:
            integration_id: KYC integration ID
            user_id: User ID

        Returns:
            KYC status
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.get(
                f"/integrations/kyc/{integration_id}/status",
                params={"user_id": user_id},
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to get KYC status: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to get KYC status: {str(e)}") from e

    # ===========================
    # ORACLE INTEGRATION
    # ===========================

    async def register_oracle_integration(self, oracle: Dict[str, Any]) -> Dict[str, Any]:
        """
        Register an oracle service integration

        Args:
            oracle: OracleIntegration configuration

        Returns:
            Registered oracle integration
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post("/integrations/oracle/register", json=oracle) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to register oracle integration: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to register oracle integration: {str(e)}") from e

    async def get_oracle_price(self, integration_id: str, symbol: str) -> Dict[str, Any]:
        """
        Get price from oracle

        Args:
            integration_id: Oracle integration ID
            symbol: Price symbol (e.g., BTC/USD)

        Returns:
            Price data
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.get(
                f"/integrations/oracle/{integration_id}/price",
                params={"symbol": symbol},
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to get oracle price: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to get oracle price: {str(e)}") from e

    async def get_oracle_valuation(self, integration_id: str, asset_id: str) -> Dict[str, Any]:
        """
        Get asset valuation from oracle

        Args:
            integration_id: Oracle integration ID
            asset_id: Asset ID

        Returns:
            Valuation data
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.get(
                f"/integrations/oracle/{integration_id}/valuation",
                params={"asset_id": asset_id},
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to get oracle valuation: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to get oracle valuation: {str(e)}") from e

    async def subscribe_oracle_updates(
        self,
        integration_id: str,
        symbol: str,
        callback,
    ) -> None:
        """
        Subscribe to real-time oracle updates via WebSocket

        Args:
            integration_id: Oracle integration ID
            symbol: Price symbol
            callback: Async callback function for updates
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            ws_url = f"{self.config.base_url.replace('http', 'ws')}/integrations/oracle/{integration_id}/updates"
            async with self._session.ws_connect(ws_url, params={"symbol": symbol}) as ws:
                async for msg in ws:
                    if msg.type == aiohttp.WSMsgType.JSON:
                        await callback(msg.json())
                    elif msg.type == aiohttp.WSMsgType.ERROR:
                        logger.error(f"WebSocket error: {msg}")
                        break
        except Exception as e:
            raise RuntimeError(f"Failed to subscribe to oracle updates: {str(e)}") from e

    # ===========================
    # DATA INTEGRATION
    # ===========================

    async def register_data_integration(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Register a data provider integration

        Args:
            data: DataIntegration configuration

        Returns:
            Registered data integration
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post("/integrations/data/register", json=data) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to register data integration: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to register data integration: {str(e)}") from e

    async def query_data_provider(
        self,
        integration_id: str,
        query: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Query a data provider

        Args:
            integration_id: Data integration ID
            query: Query parameters

        Returns:
            Query result
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post(
                f"/integrations/data/{integration_id}/query",
                json=query,
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to query data provider: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to query data provider: {str(e)}") from e

    # ===========================
    # NOTIFICATION INTEGRATION
    # ===========================

    async def register_notification_integration(self, notification: Dict[str, Any]) -> Dict[str, Any]:
        """
        Register a notification service integration

        Args:
            notification: NotificationIntegration configuration

        Returns:
            Registered notification integration
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post("/integrations/notification/register", json=notification) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to register notification integration: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to register notification integration: {str(e)}") from e

    async def send_notification(
        self,
        integration_id: str,
        channel: str,
        recipient: str,
        message: str,
        template_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Send a notification through integration

        Args:
            integration_id: Notification integration ID
            channel: Notification channel (sms, email, webhook, push)
            recipient: Recipient address
            message: Message content
            template_data: Optional template variables

        Returns:
            Notification result
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post(
                f"/integrations/notification/{integration_id}/send",
                json={
                    "channel": channel,
                    "recipient": recipient,
                    "message": message,
                    "template_data": template_data,
                },
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to send notification: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to send notification: {str(e)}") from e

    # ===========================
    # WEBHOOK & MONITORING
    # ===========================

    async def handle_webhook(self, event: Dict[str, Any]) -> None:
        """
        Handle incoming webhook event

        Args:
            event: WebhookEvent as dictionary
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post("/integrations/webhook/handle", json=event) as response:
                if response.status != 200:
                    raise RuntimeError(f"Failed to handle webhook: {response.status}")
                logger.info(f"✅ Webhook handled: {event.get('event_id')}")
        except Exception as e:
            raise RuntimeError(f"Failed to handle webhook: {str(e)}") from e

    async def get_integration_metrics(
        self,
        integration_id: str,
        time_range: Optional[Dict[str, int]] = None,
    ) -> Dict[str, Any]:
        """
        Get integration performance metrics

        Args:
            integration_id: Integration ID
            time_range: Optional time range {start, end} as timestamps

        Returns:
            Metrics data
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.get(
                f"/integrations/{integration_id}/metrics",
                params={"start": time_range.get("start"), "end": time_range.get("end")}
                if time_range
                else {},
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to get integration metrics: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to get integration metrics: {str(e)}") from e

    async def get_integration_logs(
        self,
        integration_id: str,
        limit: int = 100,
    ) -> list[Dict[str, Any]]:
        """
        Get integration operation logs

        Args:
            integration_id: Integration ID
            limit: Maximum number of logs

        Returns:
            List of logs
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.get(
                f"/integrations/{integration_id}/logs",
                params={"limit": limit},
            ) as response:
                if response.status == 200:
                    return await response.json()
                else:
                    raise RuntimeError(f"Failed to get integration logs: {response.status}")
        except Exception as e:
            raise RuntimeError(f"Failed to get integration logs: {str(e)}") from e

    async def configure_rate_limit(
        self,
        integration_id: str,
        requests_per_second: int,
        requests_per_day: Optional[int] = None,
    ) -> None:
        """
        Configure rate limiting for integration

        Args:
            integration_id: Integration ID
            requests_per_second: Requests per second limit
            requests_per_day: Optional requests per day limit
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post(
                f"/integrations/{integration_id}/rate-limit",
                json={"requests_per_second": requests_per_second, "requests_per_day": requests_per_day},
            ) as response:
                if response.status != 200:
                    raise RuntimeError(f"Failed to configure rate limit: {response.status}")
                logger.info(f"✅ Rate limit configured: {integration_id}")
        except Exception as e:
            raise RuntimeError(f"Failed to configure rate limit: {str(e)}") from e

    async def set_integration_status(self, integration_id: str, enabled: bool) -> None:
        """
        Enable or disable an integration

        Args:
            integration_id: Integration ID
            enabled: Whether integration is enabled
        """
        if not self.is_connected() or not self._session:
            raise RuntimeError("Client not connected")

        try:
            async with self._session.post(
                f"/integrations/{integration_id}/status",
                json={"enabled": enabled},
            ) as response:
                if response.status != 200:
                    raise RuntimeError(f"Failed to set integration status: {response.status}")
                status = "enabled" if enabled else "disabled"
                logger.info(f"✅ Integration {status}: {integration_id}")
        except Exception as e:
            raise RuntimeError(f"Failed to set integration status: {str(e)}") from e
