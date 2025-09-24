from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, func
from typing import List, Optional
from datetime import datetime, timedelta

from database import get_db
from app.models.user import User
from app.models.portfolio import Portfolio, PortfolioHolding, WalletBalance
from app.models.trading import CarbonCredit
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_user_portfolios(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's portfolios"""
    
    portfolios = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()
    
    return [
        {
            "id": str(portfolio.id),
            "name": portfolio.name,
            "description": portfolio.description,
            "total_value": float(portfolio.total_value),
            "total_cost_basis": float(portfolio.total_cost_basis),
            "unrealized_pnl": float(portfolio.unrealized_pnl),
            "total_return": float(portfolio.total_return),
            "is_default": portfolio.is_default,
            "created_at": portfolio.created_at,
            "updated_at": portfolio.updated_at
        } for portfolio in portfolios
    ]

@router.post("/")
async def create_portfolio(
    portfolio_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new portfolio"""
    
    new_portfolio = Portfolio(
        user_id=current_user.id,
        name=portfolio_data["name"],
        description=portfolio_data.get("description", ""),
        auto_rebalance=portfolio_data.get("auto_rebalance", False),
        rebalance_threshold=portfolio_data.get("rebalance_threshold", 0.05)
    )
    
    db.add(new_portfolio)
    db.commit()
    db.refresh(new_portfolio)
    
    return {
        "id": str(new_portfolio.id),
        "name": new_portfolio.name,
        "message": "Portfolio created successfully"
    }

@router.get("/{portfolio_id}/holdings")
async def get_portfolio_holdings(
    portfolio_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get holdings for a specific portfolio"""
    
    holdings = db.query(PortfolioHolding).join(Portfolio).filter(
        and_(
            Portfolio.user_id == current_user.id,
            Portfolio.id == portfolio_id
        )
    ).all()
    
    return [
        {
            "id": str(holding.id),
            "carbon_credit_id": str(holding.carbon_credit_id),
            "carbon_credit": {
                "symbol": holding.carbon_credit.symbol,
                "name": holding.carbon_credit.name,
                "current_price": float(holding.carbon_credit.current_price) if holding.carbon_credit.current_price else None
            },
            "quantity": float(holding.quantity),
            "average_cost": float(holding.average_cost),
            "current_value": float(holding.current_value),
            "unrealized_pnl": float(holding.unrealized_pnl),
            "unrealized_pnl_percent": float(holding.unrealized_pnl_percent),
            "weight_percent": float(holding.weight_percent)
        } for holding in holdings
    ]

@router.get("/performance")
async def get_portfolio_performance(
    portfolio_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get portfolio performance metrics"""
    
    if portfolio_id:
        portfolio = db.query(Portfolio).filter(
            and_(
                Portfolio.id == portfolio_id,
                Portfolio.user_id == current_user.id
            )
        ).first()
        
        if not portfolio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio not found"
            )
        
        portfolios = [portfolio]
    else:
        portfolios = db.query(Portfolio).filter(Portfolio.user_id == current_user.id).all()
    
    performance_data = []
    for portfolio in portfolios:
        performance_data.append({
            "portfolio_id": str(portfolio.id),
            "portfolio_name": portfolio.name,
            "total_value": float(portfolio.total_value),
            "total_cost_basis": float(portfolio.total_cost_basis),
            "unrealized_pnl": float(portfolio.unrealized_pnl),
            "realized_pnl": float(portfolio.realized_pnl),
            "daily_return": float(portfolio.daily_return),
            "monthly_return": float(portfolio.monthly_return),
            "yearly_return": float(portfolio.yearly_return),
            "total_return": float(portfolio.total_return),
            "volatility": float(portfolio.volatility),
            "sharpe_ratio": float(portfolio.sharpe_ratio),
            "max_drawdown": float(portfolio.max_drawdown)
        })
    
    return performance_data

@router.get("/balances")
async def get_wallet_balances(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's wallet balances across all carbon credits"""
    
    balances = db.query(WalletBalance).join(WalletBalance.wallet).filter(
        WalletBalance.wallet.has(user_id=current_user.id)
    ).all()
    
    return [
        {
            "carbon_credit_id": str(balance.carbon_credit_id),
            "carbon_credit": {
                "symbol": balance.carbon_credit.symbol,
                "name": balance.carbon_credit.name,
                "current_price": float(balance.carbon_credit.current_price) if balance.carbon_credit.current_price else None
            },
            "available_balance": float(balance.available_balance),
            "locked_balance": float(balance.locked_balance),
            "total_balance": float(balance.total_balance),
            "current_value": float(balance.total_balance * (balance.carbon_credit.current_price or 0)),
            "updated_at": balance.updated_at
        } for balance in balances
    ]