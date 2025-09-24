from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

from database import get_db
from app.models.user import User
from app.models.trading import TradingOrder, Trade, CarbonCredit, OrderType, OrderSide, OrderStatus
from app.models.portfolio import WalletBalance, Transaction, TransactionType
from app.routers.auth import get_current_user
from app.schemas.trading import OrderCreate, OrderResponse, TradeResponse, CarbonCreditResponse

router = APIRouter()

@router.get("/carbon-credits", response_model=List[CarbonCreditResponse])
async def get_available_carbon_credits(
    skip: int = 0,
    limit: int = 50,
    credit_type: Optional[str] = None,
    registry: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """Get list of available carbon credits for trading"""
    
    query = db.query(CarbonCredit).filter(
        and_(
            CarbonCredit.is_tradeable == True,
            CarbonCredit.available_supply > 0
        )
    )
    
    if credit_type:
        query = query.filter(CarbonCredit.credit_type == credit_type)
    
    if registry:
        query = query.filter(CarbonCredit.registry == registry)
    
    if min_price:
        query = query.filter(CarbonCredit.current_price >= min_price)
    
    if max_price:
        query = query.filter(CarbonCredit.current_price <= max_price)
    
    credits = query.offset(skip).limit(limit).all()
    
    return [
        CarbonCreditResponse(
            id=str(credit.id),
            symbol=credit.symbol,
            name=credit.name,
            credit_type=credit.credit_type.value,
            project_name=credit.project_name,
            project_country=credit.project_country,
            registry=credit.registry,
            vintage_year=credit.vintage_year,
            current_price=float(credit.current_price) if credit.current_price else None,
            available_supply=float(credit.available_supply),
            daily_volume=float(credit.daily_volume),
            is_verified=credit.is_verified
        ) for credit in credits
    ]

@router.post("/orders", response_model=OrderResponse)
async def create_trading_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new trading order"""
    
    # Validate carbon credit exists
    carbon_credit = db.query(CarbonCredit).filter(CarbonCredit.id == order_data.carbon_credit_id).first()
    if not carbon_credit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carbon credit not found"
        )
    
    if not carbon_credit.is_tradeable:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Carbon credit is not tradeable"
        )
    
    # Validate user verification status
    if not current_user.kyc_completed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="KYC verification required for trading"
        )
    
    # Check trading limits
    daily_volume = db.query(Trade).filter(
        and_(
            or_(
                Trade.buyer_order.has(TradingOrder.user_id == current_user.id),
                Trade.seller_order.has(TradingOrder.user_id == current_user.id)
            ),
            Trade.created_at >= datetime.utcnow() - timedelta(days=1)
        )
    ).count()
    
    order_value = order_data.quantity * (order_data.price or carbon_credit.current_price or 0)
    if order_value > current_user.daily_trading_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order exceeds daily trading limit"
        )
    
    # For sell orders, check user has sufficient balance
    if order_data.side == OrderSide.SELL:
        wallet_balance = db.query(WalletBalance).filter(
            and_(
                WalletBalance.wallet.has(user_id=current_user.id),
                WalletBalance.carbon_credit_id == order_data.carbon_credit_id
            )
        ).first()
        
        if not wallet_balance or wallet_balance.available_balance < order_data.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Insufficient balance for sell order"
            )
    
    # Create the order
    new_order = TradingOrder(
        user_id=current_user.id,
        carbon_credit_id=order_data.carbon_credit_id,
        order_type=order_data.order_type,
        side=order_data.side,
        quantity=order_data.quantity,
        price=order_data.price,
        stop_price=order_data.stop_price,
        remaining_quantity=order_data.quantity,
        time_in_force=order_data.time_in_force or "GTC"
    )
    
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    # TODO: Add order to matching engine
    # await order_matching_engine.process_order(new_order)
    
    return OrderResponse(
        id=str(new_order.id),
        carbon_credit_id=str(new_order.carbon_credit_id),
        order_type=new_order.order_type.value,
        side=new_order.side.value,
        quantity=float(new_order.quantity),
        price=float(new_order.price) if new_order.price else None,
        filled_quantity=float(new_order.filled_quantity),
        remaining_quantity=float(new_order.remaining_quantity),
        status=new_order.status.value,
        created_at=new_order.created_at
    )

@router.get("/orders", response_model=List[OrderResponse])
async def get_user_orders(
    status: Optional[str] = None,
    side: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's trading orders"""
    
    query = db.query(TradingOrder).filter(TradingOrder.user_id == current_user.id)
    
    if status:
        query = query.filter(TradingOrder.status == status)
    
    if side:
        query = query.filter(TradingOrder.side == side)
    
    orders = query.order_by(desc(TradingOrder.created_at)).offset(skip).limit(limit).all()
    
    return [
        OrderResponse(
            id=str(order.id),
            carbon_credit_id=str(order.carbon_credit_id),
            order_type=order.order_type.value,
            side=order.side.value,
            quantity=float(order.quantity),
            price=float(order.price) if order.price else None,
            filled_quantity=float(order.filled_quantity),
            remaining_quantity=float(order.remaining_quantity),
            status=order.status.value,
            created_at=order.created_at,
            filled_at=order.filled_at
        ) for order in orders
    ]

@router.delete("/orders/{order_id}")
async def cancel_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Cancel a trading order"""
    
    try:
        order_uuid = uuid.UUID(order_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid order ID format"
        )
    
    order = db.query(TradingOrder).filter(
        and_(
            TradingOrder.id == order_uuid,
            TradingOrder.user_id == current_user.id
        )
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    if order.status not in [OrderStatus.PENDING, OrderStatus.PARTIALLY_FILLED]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel order in current status"
        )
    
    order.status = OrderStatus.CANCELLED
    order.updated_at = datetime.utcnow()
    db.commit()
    
    return {"message": "Order cancelled successfully", "order_id": order_id}

@router.get("/trades", response_model=List[TradeResponse])
async def get_user_trades(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's trade history"""
    
    trades = db.query(Trade).filter(
        or_(
            Trade.buyer_order.has(TradingOrder.user_id == current_user.id),
            Trade.seller_order.has(TradingOrder.user_id == current_user.id)
        )
    ).order_by(desc(Trade.created_at)).offset(skip).limit(limit).all()
    
    return [
        TradeResponse(
            id=str(trade.id),
            carbon_credit_id=str(trade.carbon_credit_id),
            quantity=float(trade.quantity),
            price=float(trade.price),
            total_value=float(trade.total_value),
            side="buy" if trade.buyer_order.user_id == current_user.id else "sell",
            created_at=trade.created_at,
            settlement_status=trade.settlement_status
        ) for trade in trades
    ]

@router.get("/order-book/{carbon_credit_id}")
async def get_order_book(
    carbon_credit_id: str,
    depth: int = 20,
    db: Session = Depends(get_db)
):
    """Get order book for a specific carbon credit"""
    
    try:
        credit_uuid = uuid.UUID(carbon_credit_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid carbon credit ID format"
        )
    
    # Get buy orders (bids) - highest price first
    buy_orders = db.query(TradingOrder).filter(
        and_(
            TradingOrder.carbon_credit_id == credit_uuid,
            TradingOrder.side == OrderSide.BUY,
            TradingOrder.status == OrderStatus.PENDING,
            TradingOrder.remaining_quantity > 0
        )
    ).order_by(desc(TradingOrder.price)).limit(depth).all()
    
    # Get sell orders (asks) - lowest price first
    sell_orders = db.query(TradingOrder).filter(
        and_(
            TradingOrder.carbon_credit_id == credit_uuid,
            TradingOrder.side == OrderSide.SELL,
            TradingOrder.status == OrderStatus.PENDING,
            TradingOrder.remaining_quantity > 0
        )
    ).order_by(TradingOrder.price).limit(depth).all()
    
    return {
        "carbon_credit_id": carbon_credit_id,
        "bids": [
            {
                "price": float(order.price),
                "quantity": float(order.remaining_quantity),
                "total": float(order.price * order.remaining_quantity)
            } for order in buy_orders if order.price
        ],
        "asks": [
            {
                "price": float(order.price),
                "quantity": float(order.remaining_quantity),
                "total": float(order.price * order.remaining_quantity)
            } for order in sell_orders if order.price
        ],
        "timestamp": datetime.utcnow()
    }