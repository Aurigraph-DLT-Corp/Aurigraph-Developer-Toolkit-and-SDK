"""
Data models for Aurigraph SDK
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field


class AurigraphClientConfig(BaseModel):
    """Configuration for the Aurigraph client"""

    base_url: str = Field(..., description="Base URL for the Aurigraph API")
    api_key: Optional[str] = Field(None, description="Optional API key for authentication")
    timeout: int = Field(default=30000, description="Request timeout in milliseconds")

    class Config:
        """Pydantic config"""
        use_enum_values = True


class Account(BaseModel):
    """Account information"""

    address: str = Field(..., description="Account address")
    balance: str = Field(..., description="Account balance as string")
    nonce: int = Field(..., description="Account nonce for transaction ordering")
    public_key: str = Field(..., description="Account public key")


class Transaction(BaseModel):
    """Transaction model"""

    hash: str = Field(..., description="Transaction hash")
    from_addr: str = Field(..., alias="from", description="Sender address")
    to: str = Field(..., description="Recipient address")
    amount: str = Field(..., description="Transaction amount")
    nonce: int = Field(..., description="Transaction nonce")
    timestamp: int = Field(..., description="Transaction timestamp")
    status: Literal["pending", "confirmed", "failed"] = Field(
        ..., description="Transaction status"
    )

    class Config:
        """Pydantic config"""
        populate_by_name = True


# ========== 3RD PARTY INTEGRATION MODELS ==========


class RateLimit(BaseModel):
    """Rate limiting configuration"""

    requests_per_second: int = Field(..., description="Requests per second limit")
    requests_per_day: Optional[int] = Field(None, description="Requests per day limit")


class ThirdPartyIntegration(BaseModel):
    """Base model for 3rd party integrations"""

    id: str = Field(..., description="Integration ID")
    name: str = Field(..., description="Integration name")
    type: Literal["payment", "kyc", "oracle", "data", "notification", "custom"] = Field(
        ..., description="Integration type"
    )
    provider: str = Field(..., description="Provider name")
    api_key: Optional[str] = Field(None, description="API key")
    api_secret: Optional[str] = Field(None, description="API secret")
    webhook_url: Optional[str] = Field(None, description="Webhook URL")
    endpoints: dict = Field(default_factory=dict, description="Provider endpoints")
    rate_limit: Optional[RateLimit] = Field(None, description="Rate limiting config")
    enabled: bool = Field(default=True, description="Whether integration is enabled")
    metadata: Optional[dict] = Field(None, description="Additional metadata")


class PaymentIntegration(ThirdPartyIntegration):
    """Payment processor integration"""

    provider: Literal["stripe", "paypal", "square", "adyen"] = Field(
        ..., description="Payment provider"
    )
    account_id: str = Field(..., description="Provider account ID")
    currencies: list[str] = Field(default_factory=list, description="Supported currencies")
    webhook_secret: Optional[str] = Field(None, description="Webhook secret for verification")


class KYCIntegration(ThirdPartyIntegration):
    """KYC/AML verification integration"""

    provider: Literal["veriff", "jumio", "onfido", "sumsub"] = Field(
        ..., description="KYC provider"
    )
    session_timeout: int = Field(default=3600, description="Session timeout in seconds")
    required_documents: list[str] = Field(default_factory=list, description="Required documents")
    liveness_check: bool = Field(default=True, description="Whether liveness check is required")


class OracleDataFeed(BaseModel):
    """Oracle data feed configuration"""

    symbol: str = Field(..., description="Data symbol (e.g., BTC/USD)")
    pairs: Optional[list[str]] = Field(None, description="Trading pairs")
    update_frequency: int = Field(default=300, description="Update frequency in seconds")


class OracleIntegration(ThirdPartyIntegration):
    """Oracle service integration"""

    provider: Literal["chainlink", "band", "uniswap", "coingecko"] = Field(
        ..., description="Oracle provider"
    )
    data_feeds: list[OracleDataFeed] = Field(default_factory=list, description="Data feeds")
    update_frequency: int = Field(default=300, description="Update frequency in seconds")
    required_confirmations: Optional[int] = Field(None, description="Required confirmations")


class DataIntegration(ThirdPartyIntegration):
    """External data provider integration"""

    provider: Literal["zillow", "corelogic", "quandl", "iexcloud"] = Field(
        ..., description="Data provider"
    )
    data_categories: list[str] = Field(default_factory=list, description="Data categories")
    cache_expiry: int = Field(default=3600, description="Cache expiry in seconds")


class NotificationIntegration(ThirdPartyIntegration):
    """Notification service integration"""

    provider: Literal["twilio", "sendgrid", "mailgun", "vonage"] = Field(
        ..., description="Notification provider"
    )
    channels: list[Literal["sms", "email", "webhook", "push"]] = Field(
        default_factory=list, description="Supported channels"
    )
    default_sender: Optional[str] = Field(None, description="Default sender address")
    templates: Optional[dict] = Field(None, description="Message templates")


class APICallConfig(BaseModel):
    """Configuration for external API calls"""

    integration_id: str = Field(..., description="Integration ID")
    endpoint: str = Field(..., description="API endpoint")
    method: Literal["GET", "POST", "PUT", "DELETE", "PATCH"] = Field(
        default="POST", description="HTTP method"
    )
    headers: Optional[dict] = Field(None, description="Custom headers")
    params: Optional[dict] = Field(None, description="Query parameters")
    body: Optional[dict] = Field(None, description="Request body")
    timeout: int = Field(default=30, description="Request timeout in seconds")


class IntegrationResult(BaseModel):
    """Result from integration call"""

    success: bool = Field(..., description="Whether call succeeded")
    data: Optional[dict] = Field(None, description="Response data")
    error: Optional[str] = Field(None, description="Error message if failed")
    status_code: Optional[int] = Field(None, description="HTTP status code")
    timestamp: int = Field(..., description="Timestamp of result")


class WebhookEvent(BaseModel):
    """Webhook event model"""

    event_id: str = Field(..., description="Event ID")
    integration_id: str = Field(..., description="Integration ID")
    event_type: str = Field(..., description="Event type")
    data: dict = Field(..., description="Event data")
    signature: Optional[str] = Field(None, description="Webhook signature for verification")
    timestamp: int = Field(..., description="Event timestamp")
