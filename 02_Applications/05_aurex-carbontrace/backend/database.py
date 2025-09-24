
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Database configuration - CarbonTrace specific schema
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://aurex:aurex_password@localhost:5432/aurex_platform")

# Create engine with carbontrace schema
engine = create_engine(
    DATABASE_URL,
    connect_args={
        "options": "-csearch_path=aurex_carbontrace_schema,public"
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
