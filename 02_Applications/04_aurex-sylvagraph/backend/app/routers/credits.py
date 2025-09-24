"""
Aurex Sylvagraph - Carbon Credits Router
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from app.models.credits import CarbonCreditBatch, CreditStatus
from app.models.users import User
from app.routers.auth import get_current_user

router = APIRouter()

@router.post("/batches", response_model=dict)
async def create_credit_batch(
    batch_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create new carbon credit batch"""
    batch = CarbonCreditBatch(**batch_data, created_by=current_user.id)
    db.add(batch)
    await db.commit()
    
    return {
        "message": "Credit batch created",
        "batch_id": batch.id
    }

@router.get("/batches", response_model=List[dict])
async def list_credit_batches(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List carbon credit batches"""
    result = await db.execute(select(CarbonCreditBatch))
    batches = result.scalars().all()
    
    return [
        {
            "id": b.id,
            "batch_id": b.batch_id,
            "vintage_year": b.vintage_year,
            "total_credits": float(b.total_credits),
            "status": b.status,
            "registry": b.registry,
            "created_at": b.created_at
        }
        for b in batches
    ]