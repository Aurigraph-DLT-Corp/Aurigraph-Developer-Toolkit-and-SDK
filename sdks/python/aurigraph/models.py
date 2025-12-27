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
