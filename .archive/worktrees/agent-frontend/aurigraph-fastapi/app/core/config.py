"""
Application configuration using Pydantic Settings
"""

from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """
    Application settings with environment variable support
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )
    
    # Application
    VERSION: str = "11.0.0"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=False, env="DEBUG")
    
    # Server
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=9003, env="PORT")
    GRPC_PORT: int = Field(default=9004, env="GRPC_PORT")
    WORKERS: int = Field(default=4, env="WORKERS")
    
    # Node Configuration
    NODE_ID: str = Field(default="aurigraph-primary", env="NODE_ID")
    VALIDATORS: List[str] = Field(
        default=["aurigraph-primary", "validator-2", "validator-3"],
        env="VALIDATORS"
    )
    
    # Performance
    TARGET_TPS: int = Field(default=2000000, env="TARGET_TPS")
    BATCH_SIZE: int = Field(default=10000, env="BATCH_SIZE")
    PARALLEL_THREADS: int = Field(default=256, env="PARALLEL_THREADS")
    PIPELINE_DEPTH: int = Field(default=4, env="PIPELINE_DEPTH")
    FINALITY_MS: int = Field(default=100, env="FINALITY_MS")
    
    # Consensus
    CONSENSUS_ALGORITHM: str = Field(default="HyperRAFT++", env="CONSENSUS_ALGORITHM")
    ELECTION_TIMEOUT_MS: int = Field(default=1000, env="ELECTION_TIMEOUT_MS")
    HEARTBEAT_INTERVAL_MS: int = Field(default=1000, env="HEARTBEAT_INTERVAL_MS")
    
    # Quantum Cryptography
    QUANTUM_ENABLED: bool = Field(default=True, env="QUANTUM_ENABLED")
    QUANTUM_LEVEL: int = Field(default=5, env="QUANTUM_LEVEL")  # NIST Level 1-5
    QUANTUM_ALGORITHM: str = Field(default="CRYSTALS-Dilithium", env="QUANTUM_ALGORITHM")
    
    # AI Optimization
    AI_OPTIMIZATION_ENABLED: bool = Field(default=True, env="AI_OPTIMIZATION_ENABLED")
    AI_MODEL_PATH: Optional[str] = Field(default=None, env="AI_MODEL_PATH")
    AI_LEARNING_RATE: float = Field(default=0.001, env="AI_LEARNING_RATE")
    
    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://aurigraph:password@localhost/aurigraph_db",
        env="DATABASE_URL"
    )
    REDIS_URL: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    
    # Security
    SECRET_KEY: str = Field(default="change-this-in-production", env="SECRET_KEY")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    JWT_EXPIRATION_HOURS: int = Field(default=24, env="JWT_EXPIRATION_HOURS")
    
    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:8080"],
        env="CORS_ORIGINS"
    )
    
    # Monitoring
    PROMETHEUS_ENABLED: bool = Field(default=True, env="PROMETHEUS_ENABLED")
    METRICS_PORT: int = Field(default=9090, env="METRICS_PORT")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = Field(default="json", env="LOG_FORMAT")
    
    # Network
    P2P_PORT: int = Field(default=30303, env="P2P_PORT")
    MAX_PEERS: int = Field(default=100, env="MAX_PEERS")
    BOOTSTRAP_NODES: List[str] = Field(default=[], env="BOOTSTRAP_NODES")
    
    # Storage
    DATA_DIR: str = Field(default="./data", env="DATA_DIR")
    BLOCKCHAIN_DB_PATH: str = Field(default="./data/blockchain.db", env="BLOCKCHAIN_DB_PATH")
    STATE_DB_PATH: str = Field(default="./data/state.db", env="STATE_DB_PATH")
    
    # Features
    ZK_PROOFS_ENABLED: bool = Field(default=True, env="ZK_PROOFS_ENABLED")
    CROSS_CHAIN_ENABLED: bool = Field(default=True, env="CROSS_CHAIN_ENABLED")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Create settings instance
settings = Settings()