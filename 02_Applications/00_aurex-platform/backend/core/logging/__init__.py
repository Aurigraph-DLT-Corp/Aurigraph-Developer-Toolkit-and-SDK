"""Logging configuration for Aurex Platform"""
import logging
import sys
from loguru import logger

def setup_logging(level: str = "INFO"):
    """Setup structured logging with loguru"""
    # Remove default logger
    logger.remove()
    
    # Add console logger with formatting
    logger.add(
        sys.stderr,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
        level=level,
        colorize=True
    )
    
    # Add file logger (disabled in container - use volume mount if needed)
    # logger.add(
    #     "logs/aurex-platform.log",
    #     rotation="10 MB",
    #     retention="7 days",
    #     format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    #     level=level
    # )
    
    return logger

def get_logger(name: str):
    """Get a logger instance"""
    return logger.bind(name=name)

# Export for convenience
__all__ = ["setup_logging", "get_logger", "logger"]