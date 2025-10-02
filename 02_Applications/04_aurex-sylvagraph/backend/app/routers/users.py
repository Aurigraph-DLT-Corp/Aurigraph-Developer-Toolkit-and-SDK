"""
Aurex Sylvagraph - Users Management Router
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from database import get_db
from app.models.users import User, UserRole
from app.routers.auth import get_current_user, require_role

router = APIRouter()

@router.get("/", response_model=List[dict])
async def list_users(
    current_user: User = Depends(require_role([UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER])),
    db: AsyncSession = Depends(get_db)
):
    """List all users (admin only)"""
    result = await db.execute(select(User).where(User.is_deleted == False))
    users = result.scalars().all()
    
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "primary_role": u.primary_role,
            "status": u.status,
            "created_at": u.created_at
        }
        for u in users
    ]