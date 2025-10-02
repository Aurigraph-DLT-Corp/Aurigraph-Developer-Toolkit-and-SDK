"""
Aurex Sylvagraph - Carbon Credits and Tokenization Models
Registry integration, credit issuance, and blockchain tokenization
"""

from enum import Enum
from decimal import Decimal
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, Float, Boolean, Text, JSON, ForeignKey, DECIMAL, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, IPFSMixin


class CreditStatus(str, Enum):
    """Carbon credit lifecycle status"""
    DRAFT = "draft"
    PENDING_VERIFICATION = "pending_verification"
    VERIFIED = "verified"
    REGISTERED = "registered"
    TOKENIZED = "tokenized"
    LISTED = "listed"
    SOLD = "sold"
    RETIRED = "retired"
    CANCELLED = "cancelled"


class RegistryType(str, Enum):
    """Carbon credit registries"""
    VERRA_VCS = "verra_vcs"
    GOLD_STANDARD = "gold_standard"
    ART_TREES = "art_trees"
    AMERICAN_CARBON_REGISTRY = "american_carbon_registry"
    CLIMATE_ACTION_RESERVE = "climate_action_reserve"
    PLAN_VIVO = "plan_vivo"


class TokenStandard(str, Enum):
    """Blockchain token standards"""
    ERC20 = "erc20"
    ERC721 = "erc721"
    ERC1155 = "erc1155"
    HYPERLEDGER_FABRIC = "hyperledger_fabric"
    CORDA = "corda"


class BlockchainNetwork(str, Enum):
    """Supported blockchain networks"""
    POLYGON = "polygon"
    ETHEREUM = "ethereum"
    CELO = "celo"
    ALGORAND = "algorand"
    TEZOS = "tezos"
    HYPERLEDGER_FABRIC = "hyperledger_fabric"


class CarbonCreditBatch(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, IPFSMixin):
    """Carbon credit batch management and registry integration"""
    
    __tablename__ = "carbon_credit_batches"
    
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("agroforestry_projects.id"), nullable=False)
    monitoring_session_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("monitoring_sessions.id"), nullable=True)
    
    # Batch identification
    batch_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    vintage_year: Mapped[int] = mapped_column(Integer, nullable=False)
    issuance_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Credit quantity and quality
    total_credits: Mapped[Decimal] = mapped_column(DECIMAL(15, 4), nullable=False)  # tCO2e
    credits_available: Mapped[Decimal] = mapped_column(DECIMAL(15, 4), nullable=False)
    credits_sold: Mapped[Decimal] = mapped_column(DECIMAL(15, 4), default=0.0)
    credits_retired: Mapped[Decimal] = mapped_column(DECIMAL(15, 4), default=0.0)
    
    # Registry integration
    registry: Mapped[RegistryType] = mapped_column(String(50), nullable=False)
    registry_project_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    registry_batch_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    registry_serial_numbers: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    registry_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Verification and validation
    vvb_organization_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=True)
    verification_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verification_report_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    verification_standard: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Credit characteristics
    methodology_used: Mapped[str] = mapped_column(String(100), nullable=False)
    additionality_proven: Mapped[bool] = mapped_column(Boolean, default=False)
    permanence_guarantee: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    leakage_assessment: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Co-benefits and SDGs
    biodiversity_benefits: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    social_benefits: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    sdg_impacts: Mapped[Optional[List[int]]] = mapped_column(JSON, nullable=True)
    
    # Pricing and market data
    base_price_usd: Mapped[Optional[Decimal]] = mapped_column(DECIMAL(10, 2), nullable=True)
    premium_percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    market_price_history: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSON, nullable=True)
    
    # Status and compliance
    status: Mapped[CreditStatus] = mapped_column(String(50), default=CreditStatus.DRAFT)
    compliance_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    expiry_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Buffer and risk management
    buffer_percentage: Mapped[float] = mapped_column(Float, default=10.0)
    buffer_credits: Mapped[Decimal] = mapped_column(DECIMAL(15, 4), default=0.0)
    risk_assessment: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    project: Mapped["AgroforestryProject"] = relationship("AgroforestryProject", back_populates="credit_batches")
    monitoring_session: Mapped[Optional["MonitoringSession"]] = relationship("MonitoringSession")
    
    tokens: Mapped[List["CarbonCreditToken"]] = relationship(
        "CarbonCreditToken",
        back_populates="credit_batch",
        cascade="all, delete-orphan"
    )
    
    transactions: Mapped[List["CreditTransaction"]] = relationship(
        "CreditTransaction",
        back_populates="credit_batch",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<CarbonCreditBatch(id='{self.batch_id}', credits='{self.total_credits}')>"
    
    @property
    def available_for_sale(self) -> Decimal:
        """Calculate credits available for sale"""
        return self.credits_available - self.buffer_credits


class CarbonCreditToken(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin, IPFSMixin):
    """Blockchain tokenization of carbon credits"""
    
    __tablename__ = "carbon_credit_tokens"
    
    credit_batch_id: Mapped[str] = mapped_column(String(36), ForeignKey("carbon_credit_batches.id"), nullable=False)
    
    # Token identification
    token_id: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    token_standard: Mapped[TokenStandard] = mapped_column(String(20), nullable=False)
    blockchain_network: Mapped[BlockchainNetwork] = mapped_column(String(30), nullable=False)
    
    # Smart contract details
    contract_address: Mapped[str] = mapped_column(String(100), nullable=False)
    token_contract_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Token supply and distribution
    total_supply: Mapped[Decimal] = mapped_column(DECIMAL(15, 4), nullable=False)
    circulating_supply: Mapped[Decimal] = mapped_column(DECIMAL(15, 4), nullable=False)
    
    # Token metadata (on-chain)
    metadata_uri: Mapped[str] = mapped_column(String(500), nullable=False)
    metadata_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    
    # Minting details
    minting_transaction_hash: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    minting_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    minting_gas_cost: Mapped[Optional[Decimal]] = mapped_column(DECIMAL(18, 8), nullable=True)
    
    # Token properties
    is_fractionalized: Mapped[bool] = mapped_column(Boolean, default=False)
    minimum_trade_unit: Mapped[Decimal] = mapped_column(DECIMAL(15, 4), default=1.0)
    
    # Compliance and bridging
    kyc_required: Mapped[bool] = mapped_column(Boolean, default=True)
    accredited_investor_only: Mapped[bool] = mapped_column(Boolean, default=False)
    bridge_protocols: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    
    # Market integration
    listed_exchanges: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    liquidity_pools: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    
    # Status
    token_status: Mapped[str] = mapped_column(String(50), default="minted")
    is_tradable: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Relationships
    credit_batch: Mapped[CarbonCreditBatch] = relationship("CarbonCreditBatch", back_populates="tokens")
    
    token_transactions: Mapped[List["TokenTransaction"]] = relationship(
        "TokenTransaction",
        back_populates="token",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<CarbonCreditToken(id='{self.token_id}', network='{self.blockchain_network}')>"


class CreditTransaction(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    """Traditional carbon credit transactions (pre-tokenization)"""
    
    __tablename__ = "credit_transactions"
    
    credit_batch_id: Mapped[str] = mapped_column(String(36), ForeignKey("carbon_credit_batches.id"), nullable=False)
    
    # Transaction details
    transaction_type: Mapped[str] = mapped_column(String(50), nullable=False)  # sale, retirement, transfer
    quantity: Mapped[Decimal] = mapped_column(DECIMAL(15, 4), nullable=False)
    price_per_credit: Mapped[Optional[Decimal]] = mapped_column(DECIMAL(10, 2), nullable=True)
    total_amount: Mapped[Optional[Decimal]] = mapped_column(DECIMAL(18, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    
    # Parties involved
    seller_organization_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=True)
    buyer_organization_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=True)
    broker_organization_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("organizations.id"), nullable=True)
    
    # Transaction execution
    transaction_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    settlement_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    registry_transaction_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Market and exchange information
    exchange_platform: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    trading_session_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Status and validation
    transaction_status: Mapped[str] = mapped_column(String(50), default="completed")
    verification_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    # Documentation
    purchase_agreement_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    retirement_certificate_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Relationships
    credit_batch: Mapped[CarbonCreditBatch] = relationship("CarbonCreditBatch", back_populates="transactions")
    
    def __repr__(self):
        return f"<CreditTransaction(type='{self.transaction_type}', quantity='{self.quantity}')>"


class TokenTransaction(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    """Blockchain token transactions and transfers"""
    
    __tablename__ = "token_transactions"
    
    token_id: Mapped[str] = mapped_column(String(36), ForeignKey("carbon_credit_tokens.id"), nullable=False)
    
    # Blockchain transaction details
    transaction_hash: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    block_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    block_hash: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Transaction specifics
    transaction_type: Mapped[str] = mapped_column(String(50), nullable=False)  # transfer, mint, burn, retire
    from_address: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    to_address: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    token_amount: Mapped[Decimal] = mapped_column(DECIMAL(15, 4), nullable=False)
    
    # Transaction costs and gas
    gas_used: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    gas_price: Mapped[Optional[Decimal]] = mapped_column(DECIMAL(18, 8), nullable=True)
    transaction_fee: Mapped[Optional[Decimal]] = mapped_column(DECIMAL(18, 8), nullable=True)
    
    # Market transaction details (if applicable)
    trade_price: Mapped[Optional[Decimal]] = mapped_column(DECIMAL(10, 2), nullable=True)
    trade_currency: Mapped[Optional[str]] = mapped_column(String(3), nullable=True)
    exchange_platform: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Status and confirmation
    confirmation_count: Mapped[int] = mapped_column(Integer, default=0)
    is_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Compliance and KYC
    kyc_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    compliance_checked: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Relationships
    token: Mapped[CarbonCreditToken] = relationship("CarbonCreditToken", back_populates="token_transactions")
    
    def __repr__(self):
        return f"<TokenTransaction(hash='{self.transaction_hash}', type='{self.transaction_type}')>"


class ExchangeIntegration(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    """Exchange platform integrations for credit trading"""
    
    __tablename__ = "exchange_integrations"
    
    # Exchange details
    exchange_name: Mapped[str] = mapped_column(String(100), nullable=False)
    exchange_type: Mapped[str] = mapped_column(String(50), nullable=False)  # voluntary, compliance, hybrid
    api_endpoint: Mapped[str] = mapped_column(String(300), nullable=False)
    
    # Integration configuration
    api_key_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    webhook_url: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    supported_standards: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    supported_networks: Mapped[List[str]] = mapped_column(JSON, nullable=False)
    
    # Trading configuration
    minimum_lot_size: Mapped[Decimal] = mapped_column(DECIMAL(15, 4), default=1.0)
    trading_fees_percentage: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    settlement_period_days: Mapped[int] = mapped_column(Integer, default=3)
    
    # KYC and compliance requirements
    kyc_required: Mapped[bool] = mapped_column(Boolean, default=True)
    accredited_only: Mapped[bool] = mapped_column(Boolean, default=False)
    jurisdiction_restrictions: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
    
    # Status and monitoring
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    last_sync_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    sync_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    
    def __repr__(self):
        return f"<ExchangeIntegration(name='{self.exchange_name}', type='{self.exchange_type}')>"


class FarmerPaymentDistribution(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin, AuditMixin):
    """Smart contract-based farmer benefit distribution tracking"""
    
    __tablename__ = "farmer_payment_distributions"
    
    credit_batch_id: Mapped[str] = mapped_column(String(36), ForeignKey("carbon_credit_batches.id"), nullable=False)
    token_transaction_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("token_transactions.id"), nullable=True)
    
    # Distribution details
    total_sale_amount: Mapped[Decimal] = mapped_column(DECIMAL(18, 2), nullable=False)
    farmer_share_percentage: Mapped[float] = mapped_column(Float, nullable=False)
    farmer_share_amount: Mapped[Decimal] = mapped_column(DECIMAL(18, 2), nullable=False)
    
    # Smart contract execution
    smart_contract_address: Mapped[str] = mapped_column(String(100), nullable=False)
    distribution_transaction_hash: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    execution_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Distribution status
    distribution_status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, executed, failed
    total_farmers: Mapped[int] = mapped_column(Integer, nullable=False)
    successful_payments: Mapped[int] = mapped_column(Integer, default=0)
    failed_payments: Mapped[int] = mapped_column(Integer, default=0)
    
    # Gas and fees
    gas_cost_total: Mapped[Optional[Decimal]] = mapped_column(DECIMAL(18, 8), nullable=True)
    platform_fee: Mapped[Optional[Decimal]] = mapped_column(DECIMAL(18, 2), nullable=True)
    
    # Relationships
    credit_batch: Mapped[CarbonCreditBatch] = relationship("CarbonCreditBatch")
    token_transaction: Mapped[Optional[TokenTransaction]] = relationship("TokenTransaction")
    
    def __repr__(self):
        return f"<FarmerPaymentDistribution(batch='{self.credit_batch_id}', amount='{self.farmer_share_amount}')>"