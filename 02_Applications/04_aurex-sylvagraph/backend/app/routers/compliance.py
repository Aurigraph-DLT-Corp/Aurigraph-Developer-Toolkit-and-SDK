from fastapi import APIRouter; router = APIRouter(); 
@router.get("/")
async def compliance_status(): return {"status": "compliant"}