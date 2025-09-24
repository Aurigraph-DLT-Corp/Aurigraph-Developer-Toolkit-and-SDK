from fastapi import APIRouter; router = APIRouter(); 
@router.get("/")
async def geospatial_data(): return {"geospatial": "active"}