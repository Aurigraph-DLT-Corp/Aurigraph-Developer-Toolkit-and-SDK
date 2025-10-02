from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean, Text, DECIMAL, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime
import enum

class OrderType(enum.Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"

class OrderSide(enum.Enum):
    BUY = "buy"
    SELL = "sell"

class OrderStatus(enum.Enum):
    PENDING = "pending"
    PARTIALLY_FILLED = "partially_filled"
    FILLED = "filled"
    CANCELLED = "cancelled"
    REJECTED = "rejected"
    EXPIRED = "expired"

class CarbonCreditType(enum.Enum):
    VCS = "vcs"
    GOLD_STANDARD = "gold_standard"
    CAR = "car"
    CDM = "cdm"
    VOLUNTARY = "voluntary"
    COMPLIANCE = "compliance"

class CarbonCredit(Base):
    __tablename__ = "carbon_credits"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    symbol = Column(String(20), unique=True, nullable=False)  # e.g., VCS-2023-001
    name = Column(String(255), nullable=False)
    credit_type = Column(Enum(CarbonCreditType), nullable=False)
    
    # Project details
    project_id = Column(String(100), nullable=False)
    project_name = Column(String(255), nullable=False)
    project_country = Column(String(3))  # ISO country code
    project_type = Column(String(100))  # Renewable Energy, Forestry, etc.
    methodology = Column(String(100))
    
    # Registry information
    registry = Column(String(50), nullable=False)  # VCS, Gold Standard, etc.
    registry_id = Column(String(100), nullable=False)
    vintage_year = Column(Integer, nullable=False)
    
    # Credit details
    total_supply = Column(DECIMAL(15, 6), nullable=False)
    available_supply = Column(DECIMAL(15, 6), nullable=False)
    retired_amount = Column(DECIMAL(15, 6), default=0.0)
    
    # Verification and quality
    verification_standard = Column(String(100))
    additionality_verified = Column(Boolean, default=False)
    co_benefits = Column(Text)  # JSON string of co-benefits
    
    # Pricing and trading
    current_price = Column(DECIMAL(15, 2))
    last_trade_price = Column(DECIMAL(15, 2))
    daily_volume = Column(DECIMAL(15, 6), default=0.0)
    total_volume = Column(DECIMAL(15, 6), default=0.0)
    
    # Status
    is_tradeable = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<CarbonCredit(symbol={self.symbol}, project={self.project_name})>"

class TradingOrder(Base):
    __tablename__ = "trading_orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    carbon_credit_id = Column(UUID(as_uuid=True), ForeignKey("carbon_credits.id"), nullable=False)
    
    # Order details
    order_type = Column(Enum(OrderType), nullable=False)
    side = Column(Enum(OrderSide), nullable=False)
    quantity = Column(DECIMAL(15, 6), nullable=False)
    price = Column(DECIMAL(15, 2))  # Null for market orders
    stop_price = Column(DECIMAL(15, 2))  # For stop orders
    
    # Execution details
    filled_quantity = Column(DECIMAL(15, 6), default=0.0)
    remaining_quantity = Column(DECIMAL(15, 6))
    average_price = Column(DECIMAL(15, 2))
    total_value = Column(DECIMAL(15, 2))
    
    # Status and timing
    status = Column(Enum(OrderStatus), default=OrderStatus.PENDING)
    time_in_force = Column(String(20), default="GTC")  # GTC, IOC, FOK, etc.
    expires_at = Column(DateTime)
    
    # Trading fees
    trading_fee = Column(DECIMAL(15, 2), default=0.0)
    fee_percentage = Column(DECIMAL(5, 4), default=0.0025)  # 0.25% default
    
    # External integration
    external_order_id = Column(String(100))  # For integrated exchanges
    exchange_name = Column(String(50))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    filled_at = Column(DateTime)
    
    # Relationships
    user = relationship("User")
    carbon_credit = relationship("CarbonCredit")
    
    def __repr__(self):
        return f"<TradingOrder(id={self.id}, side={self.side}, quantity={self.quantity})>"

class Trade(Base):
    __tablename__ = "trades"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    buyer_order_id = Column(UUID(as_uuid=True), ForeignKey("trading_orders.id"), nullable=False)
    seller_order_id = Column(UUID(as_uuid=True), ForeignKey("trading_orders.id"), nullable=False)
    carbon_credit_id = Column(UUID(as_uuid=True), ForeignKey("carbon_credits.id"), nullable=False)
    
    # Trade details
    quantity = Column(DECIMAL(15, 6), nullable=False)
    price = Column(DECIMAL(15, 2), nullable=False)
    total_value = Column(DECIMAL(15, 2), nullable=False)
    
    # Settlement
    settlement_status = Column(String(20), default="pending")  # pending, settled, failed
    settled_at = Column(DateTime)
    
    # External integration
    external_trade_id = Column(String(100))
    exchange_name = Column(String(50))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    buyer_order = relationship("TradingOrder", foreign_keys=[buyer_order_id])
    seller_order = relationship("TradingOrder", foreign_keys=[seller_order_id])
    carbon_credit = relationship("CarbonCredit")
    
    def __repr__(self):
        return f"<Trade(id={self.id}, quantity={self.quantity}, price={self.price})>"