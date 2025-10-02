from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean, Text, DECIMAL, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime
import enum

class WalletType(enum.Enum):
    HOT = "hot"
    COLD = "cold"
    MULTI_SIG = "multi_sig"

class TransactionType(enum.Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    TRADE_BUY = "trade_buy"
    TRADE_SELL = "trade_sell"
    TRANSFER = "transfer"
    FEE = "fee"
    RETIREMENT = "retirement"

class Portfolio(Base):
    __tablename__ = "portfolios"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    
    # Portfolio metrics
    total_value = Column(DECIMAL(15, 2), default=0.0)
    total_cost_basis = Column(DECIMAL(15, 2), default=0.0)
    unrealized_pnl = Column(DECIMAL(15, 2), default=0.0)
    realized_pnl = Column(DECIMAL(15, 2), default=0.0)
    
    # Performance metrics
    daily_return = Column(DECIMAL(10, 6), default=0.0)
    monthly_return = Column(DECIMAL(10, 6), default=0.0)
    yearly_return = Column(DECIMAL(10, 6), default=0.0)
    total_return = Column(DECIMAL(10, 6), default=0.0)
    
    # Risk metrics
    volatility = Column(DECIMAL(10, 6), default=0.0)
    sharpe_ratio = Column(DECIMAL(10, 6), default=0.0)
    max_drawdown = Column(DECIMAL(10, 6), default=0.0)
    
    # Settings
    is_default = Column(Boolean, default=False)
    auto_rebalance = Column(Boolean, default=False)
    rebalance_threshold = Column(DECIMAL(5, 4), default=0.05)  # 5%
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    
    def __repr__(self):
        return f"<Portfolio(id={self.id}, name={self.name}, value={self.total_value})>"

class PortfolioHolding(Base):
    __tablename__ = "portfolio_holdings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    portfolio_id = Column(UUID(as_uuid=True), ForeignKey("portfolios.id"), nullable=False)
    carbon_credit_id = Column(UUID(as_uuid=True), ForeignKey("carbon_credits.id"), nullable=False)
    
    # Holding details
    quantity = Column(DECIMAL(15, 6), nullable=False)
    average_cost = Column(DECIMAL(15, 2), nullable=False)
    total_cost_basis = Column(DECIMAL(15, 2), nullable=False)
    current_value = Column(DECIMAL(15, 2), nullable=False)
    
    # Performance
    unrealized_pnl = Column(DECIMAL(15, 2), default=0.0)
    unrealized_pnl_percent = Column(DECIMAL(10, 6), default=0.0)
    realized_pnl = Column(DECIMAL(15, 2), default=0.0)
    
    # Position details
    first_purchase_date = Column(DateTime, nullable=False)
    last_purchase_date = Column(DateTime, nullable=False)
    weight_percent = Column(DECIMAL(5, 4), default=0.0)  # Portfolio weight
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    portfolio = relationship("Portfolio")
    carbon_credit = relationship("CarbonCredit")
    
    def __repr__(self):
        return f"<PortfolioHolding(portfolio={self.portfolio_id}, credit={self.carbon_credit_id}, qty={self.quantity})>"

class Wallet(Base):
    __tablename__ = "wallets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Wallet details
    wallet_type = Column(Enum(WalletType), nullable=False)
    address = Column(String(255), unique=True, nullable=False)
    private_key_encrypted = Column(Text)  # Encrypted private key
    public_key = Column(Text, nullable=False)
    
    # Multi-signature details
    required_signatures = Column(Integer, default=1)
    total_signers = Column(Integer, default=1)
    
    # Security
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    backup_completed = Column(Boolean, default=False)
    
    # Balance tracking
    last_balance_update = Column(DateTime, default=datetime.utcnow)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    
    def __repr__(self):
        return f"<Wallet(id={self.id}, type={self.wallet_type}, address={self.address[:10]}...)>"

class WalletBalance(Base):
    __tablename__ = "wallet_balances"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False)
    carbon_credit_id = Column(UUID(as_uuid=True), ForeignKey("carbon_credits.id"), nullable=False)
    
    # Balance details
    available_balance = Column(DECIMAL(15, 6), nullable=False)
    locked_balance = Column(DECIMAL(15, 6), default=0.0)  # In open orders
    total_balance = Column(DECIMAL(15, 6), nullable=False)
    
    # Timestamps
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    wallet = relationship("Wallet")
    carbon_credit = relationship("CarbonCredit")
    
    def __repr__(self):
        return f"<WalletBalance(wallet={self.wallet_id}, credit={self.carbon_credit_id}, balance={self.available_balance})>"

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    wallet_id = Column(UUID(as_uuid=True), ForeignKey("wallets.id"), nullable=False)
    carbon_credit_id = Column(UUID(as_uuid=True), ForeignKey("carbon_credits.id"), nullable=False)
    
    # Transaction details
    transaction_type = Column(Enum(TransactionType), nullable=False)
    quantity = Column(DECIMAL(15, 6), nullable=False)
    price = Column(DECIMAL(15, 2))
    total_value = Column(DECIMAL(15, 2))
    fee = Column(DECIMAL(15, 2), default=0.0)
    
    # Blockchain details
    transaction_hash = Column(String(255), unique=True)
    block_number = Column(Integer)
    gas_used = Column(Integer)
    gas_price = Column(DECIMAL(20, 0))
    
    # Status
    status = Column(String(20), default="pending")  # pending, confirmed, failed
    confirmations = Column(Integer, default=0)
    
    # References
    order_id = Column(UUID(as_uuid=True), ForeignKey("trading_orders.id"))
    trade_id = Column(UUID(as_uuid=True), ForeignKey("trades.id"))
    
    # External references
    external_transaction_id = Column(String(255))
    exchange_name = Column(String(50))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    confirmed_at = Column(DateTime)
    
    # Relationships
    user = relationship("User")
    wallet = relationship("Wallet")
    carbon_credit = relationship("CarbonCredit")
    order = relationship("TradingOrder")
    trade = relationship("Trade")
    
    def __repr__(self):
        return f"<Transaction(id={self.id}, type={self.transaction_type}, quantity={self.quantity})>"