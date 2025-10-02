from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, func
from typing import List, Optional
from datetime import datetime, timedelta
import random

from database import get_db
from app.models.trading import CarbonCredit, Trade

router = APIRouter()

@router.get("/prices")
async def get_market_prices(
    symbols: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get current market prices for carbon credits"""
    
    query = db.query(CarbonCredit).filter(CarbonCredit.is_tradeable == True)
    
    if symbols:
        symbol_list = [s.strip() for s in symbols.split(",")]
        query = query.filter(CarbonCredit.symbol.in_(symbol_list))
    
    credits = query.all()
    
    return [
        {
            "symbol": credit.symbol,
            "name": credit.name,
            "current_price": float(credit.current_price) if credit.current_price else None,
            "last_trade_price": float(credit.last_trade_price) if credit.last_trade_price else None,
            "daily_volume": float(credit.daily_volume),
            "price_change_24h": random.uniform(-5.0, 5.0),  # Mock data
            "price_change_percent_24h": random.uniform(-10.0, 10.0),  # Mock data
            "market_cap": float(credit.available_supply * (credit.current_price or 0)),
            "updated_at": credit.updated_at
        } for credit in credits
    ]

@router.get("/stats")
async def get_market_stats(db: Session = Depends(get_db)):
    """Get overall market statistics"""
    
    # Get total market metrics
    total_credits = db.query(func.count(CarbonCredit.id)).filter(CarbonCredit.is_tradeable == True).scalar()
    total_supply = db.query(func.sum(CarbonCredit.available_supply)).filter(CarbonCredit.is_tradeable == True).scalar()
    
    # Get 24h trading volume
    yesterday = datetime.utcnow() - timedelta(days=1)
    daily_volume = db.query(func.sum(Trade.total_value)).filter(Trade.created_at >= yesterday).scalar()
    daily_trades = db.query(func.count(Trade.id)).filter(Trade.created_at >= yesterday).scalar()
    
    # Get top traded credits
    top_credits = db.query(CarbonCredit).order_by(desc(CarbonCredit.daily_volume)).limit(5).all()
    
    return {
        "market_overview": {
            "total_credits": total_credits or 0,
            "total_supply": float(total_supply or 0),
            "daily_volume_usd": float(daily_volume or 0),
            "daily_trades": daily_trades or 0,
            "market_cap": 2500000000.0,  # Mock data
            "active_traders": 50000,  # Mock data
            "price_change_24h": random.uniform(-2.0, 3.0)  # Mock data
        },
        "top_credits": [
            {
                "symbol": credit.symbol,
                "name": credit.name,
                "current_price": float(credit.current_price) if credit.current_price else None,
                "daily_volume": float(credit.daily_volume),
                "price_change_percent": random.uniform(-5.0, 5.0)  # Mock data
            } for credit in top_credits
        ],
        "timestamp": datetime.utcnow()
    }

@router.get("/chart/{symbol}")
async def get_price_chart(
    symbol: str,
    timeframe: str = "1h",
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get price chart data for a specific carbon credit"""
    
    credit = db.query(CarbonCredit).filter(CarbonCredit.symbol == symbol).first()
    if not credit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carbon credit not found"
        )
    
    # Generate mock OHLCV data
    # In production, this would come from a proper time-series database
    base_price = float(credit.current_price) if credit.current_price else 45.0
    chart_data = []
    
    for i in range(limit):
        timestamp = datetime.utcnow() - timedelta(hours=limit-i)
        price_variation = random.uniform(-2.0, 2.0)
        open_price = base_price + price_variation
        close_price = open_price + random.uniform(-1.0, 1.0)
        high_price = max(open_price, close_price) + random.uniform(0, 0.5)
        low_price = min(open_price, close_price) - random.uniform(0, 0.5)
        volume = random.uniform(1000, 5000)
        
        chart_data.append({
            "timestamp": timestamp,
            "open": round(open_price, 2),
            "high": round(high_price, 2),
            "low": round(low_price, 2),
            "close": round(close_price, 2),
            "volume": round(volume, 2)
        })
    
    return {
        "symbol": symbol,
        "timeframe": timeframe,
        "data": chart_data
    }

@router.get("/news")
async def get_market_news():
    """Get carbon market news and updates"""
    
    # Mock news data - in production, this would come from news APIs
    news_items = [
        {
            "id": "1",
            "title": "Global Carbon Credit Markets Hit Record High in Q3 2024",
            "summary": "Trading volume reaches $2.5B as institutional adoption accelerates",
            "category": "market",
            "impact": "positive",
            "published_at": datetime.utcnow() - timedelta(hours=2),
            "source": "Carbon Market Watch"
        },
        {
            "id": "2",
            "title": "New EU Carbon Border Adjustment Mechanism Implementation",
            "summary": "CBAM enters full implementation phase, affecting global carbon pricing",
            "category": "regulation",
            "impact": "neutral",
            "published_at": datetime.utcnow() - timedelta(hours=6),
            "source": "EU Commission"
        },
        {
            "id": "3",
            "title": "Blockchain Verification Platform Launches for Carbon Credits",
            "summary": "New technology promises to eliminate double-counting in carbon markets",
            "category": "technology",
            "impact": "positive",
            "published_at": datetime.utcnow() - timedelta(hours=12),
            "source": "Climate Tech News"
        }
    ]
    
    return {
        "news": news_items,
        "total_count": len(news_items),
        "timestamp": datetime.utcnow()
    }

@router.get("/analytics/{symbol}")
async def get_credit_analytics(
    symbol: str,
    period: str = "30d",
    db: Session = Depends(get_db)
):
    """Get detailed analytics for a specific carbon credit"""
    
    credit = db.query(CarbonCredit).filter(CarbonCredit.symbol == symbol).first()
    if not credit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Carbon credit not found"
        )
    
    # Mock analytics data
    return {
        "symbol": symbol,
        "name": credit.name,
        "current_price": float(credit.current_price) if credit.current_price else None,
        "analytics": {
            "volatility_30d": random.uniform(0.15, 0.35),
            "average_daily_volume": float(credit.daily_volume),
            "market_depth": {
                "bid_depth": random.uniform(10000, 50000),
                "ask_depth": random.uniform(10000, 50000)
            },
            "liquidity_score": random.uniform(0.7, 0.95),
            "price_trend": "bullish" if random.random() > 0.5 else "bearish",
            "support_levels": [
                float(credit.current_price or 45) * 0.95,
                float(credit.current_price or 45) * 0.90
            ],
            "resistance_levels": [
                float(credit.current_price or 45) * 1.05,
                float(credit.current_price or 45) * 1.10
            ]
        },
        "timestamp": datetime.utcnow()
    }