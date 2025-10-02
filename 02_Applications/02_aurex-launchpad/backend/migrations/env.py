#!/usr/bin/env python3
# ================================================================================
# AUREX LAUNCHPAD™ ALEMBIC ENVIRONMENT CONFIGURATION
# Migration environment setup for database schema management
# Agent: Database Management Agent
# ================================================================================

from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
current_path = Path(__file__).parent.parent
sys.path.insert(0, str(current_path))

# Import models and configuration
from models.base_models import Base
from models.auth_models import *  # Import all auth models
from models.esg_models import *   # Import all ESG models
from models.project_models import *  # Import all project models
from models.ghg_emissions_models import *  # Import all GHG models
from models.sustainability_models import *  # Import all sustainability models
from models.notification_models import *  # Import all notification models
from models.analytics_models import *  # Import all analytics models
from config import get_settings

# Alembic Config object
config = context.config

# Interpret the config file for Python logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Set target metadata for 'autogenerate' support
target_metadata = Base.metadata

# Get database URL from settings
settings = get_settings()
database_url = settings.DATABASE_URL

# Override the sqlalchemy.url in alembic.ini with environment variable
if database_url:
    config.set_main_option("sqlalchemy.url", database_url)

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well. By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
        render_as_batch=False,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.
    """
    
    # Create engine configuration
    configuration = config.get_section(config.config_ini_section)
    configuration["sqlalchemy.url"] = database_url
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
            render_as_batch=False,
            # Include schemas if using multiple schemas
            include_schemas=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()