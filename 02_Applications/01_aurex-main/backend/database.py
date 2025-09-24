
from aurex_platform.core.database import db_manager

# Use centralized database management
async def get_db():
    async for session in db_manager.get_session():
        yield session
