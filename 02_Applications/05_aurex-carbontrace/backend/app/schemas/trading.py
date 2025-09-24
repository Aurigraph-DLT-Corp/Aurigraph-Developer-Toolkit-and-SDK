from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.trading import OrderType, OrderSide, CarbonCreditType

class OrderCreate(BaseModel):
    carbon_credit_id: str
    order_type: OrderType
    side: OrderSide
    quantity: Decimal
    price: Optional[Decimal] = None
    stop_price: Optional[Decimal] = None
    time_in_force: Optional[str] = "GTC"
    
    @validator('quantity')
    def quantity_positive(cls, v):
        assert v > 0, 'Quantity must be positive'
        return v
    
    @validator('price')
    def price_positive(cls, v):
        if v is not None:
            assert v > 0, 'Price must be positive'
        return v

class OrderResponse(BaseModel):
    id: str
    carbon_credit_id: str
    order_type: str
    side: str
    quantity: float
    price: Optional[float] = None
    filled_quantity: float
    remaining_quantity: float
    status: str
    created_at: datetime
    filled_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class TradeResponse(BaseModel):
    id: str
    carbon_credit_id: str
    quantity: float
    price: float
    total_value: float
    side: str
    created_at: datetime
    settlement_status: str
    
    class Config:
        from_attributes = True

class CarbonCreditResponse(BaseModel):
    id: str
    symbol: str
    name: str
    credit_type: str
    project_name: str
    project_country: Optional[str] = None
    registry: str
    vintage_year: int
    current_price: Optional[float] = None
    available_supply: float
    daily_volume: float
    is_verified: bool
    
    class Config:
        from_attributes = True