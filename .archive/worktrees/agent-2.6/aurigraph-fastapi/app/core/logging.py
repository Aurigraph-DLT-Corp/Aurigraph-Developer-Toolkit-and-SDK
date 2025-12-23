"""
Logging configuration for Aurigraph DLT Platform
"""

import logging
import logging.config
import sys
from typing import Dict, Any
import json
from datetime import datetime

from app.core.config import settings


def setup_logging(name: str = None) -> logging.Logger:
    """
    Setup logging configuration for the application
    """
    
    # Define log format
    if settings.LOG_FORMAT.lower() == "json":
        formatter = JsonFormatter()
        console_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    else:
        formatter = StandardFormatter()
        console_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper()),
        format=console_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Get logger
    logger = logging.getLogger(name or __name__)
    
    # Add file handler if needed
    if settings.ENVIRONMENT == "production":
        file_handler = logging.FileHandler("aurigraph.log")
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    # Set specific log levels for external libraries
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("grpc").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy").setLevel(logging.WARNING)
    
    return logger


class JsonFormatter(logging.Formatter):
    """
    JSON formatter for structured logging
    """
    
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
            "process": record.process,
            "thread": record.thread,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        for key, value in record.__dict__.items():
            if key not in [
                "name", "msg", "args", "levelname", "levelno", "pathname",
                "filename", "module", "lineno", "funcName", "created",
                "msecs", "relativeCreated", "thread", "threadName",
                "processName", "process", "stack_info", "exc_info", "exc_text"
            ]:
                log_entry[key] = value
        
        return json.dumps(log_entry)


class StandardFormatter(logging.Formatter):
    """
    Standard formatter with colors for console output
    """
    
    # Color codes
    COLORS = {
        'DEBUG': '\033[36m',    # Cyan
        'INFO': '\033[32m',     # Green
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',    # Red
        'CRITICAL': '\033[35m', # Magenta
        'RESET': '\033[0m'      # Reset
    }
    
    def format(self, record: logging.LogRecord) -> str:
        # Add colors if not in production
        if settings.ENVIRONMENT != "production" and sys.stdout.isatty():
            levelname = record.levelname
            if levelname in self.COLORS:
                record.levelname = f"{self.COLORS[levelname]}{levelname}{self.COLORS['RESET']}"
        
        formatted = super().format(record)
        
        # Reset levelname for next use
        record.levelname = record.levelname.replace(self.COLORS.get(record.levelname, ''), '').replace(self.COLORS['RESET'], '')
        
        return formatted


class LoggingMiddleware:
    """
    FastAPI middleware for request/response logging
    """
    
    def __init__(self, app, logger: logging.Logger):
        self.app = app
        self.logger = logger
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            start_time = datetime.utcnow()
            
            # Log request
            self.logger.info(
                "Request started",
                extra={
                    "method": scope["method"],
                    "path": scope["path"],
                    "query_string": scope.get("query_string", b"").decode(),
                    "client": scope.get("client", ("unknown", 0))[0]
                }
            )
            
            # Process request
            async def send_wrapper(message):
                if message["type"] == "http.response.start":
                    duration = (datetime.utcnow() - start_time).total_seconds()
                    status_code = message["status"]
                    
                    # Log response
                    self.logger.info(
                        "Request completed",
                        extra={
                            "method": scope["method"],
                            "path": scope["path"],
                            "status_code": status_code,
                            "duration_seconds": duration,
                            "client": scope.get("client", ("unknown", 0))[0]
                        }
                    )
                
                await send(message)
            
            await self.app(scope, receive, send_wrapper)
        else:
            await self.app(scope, receive, send)


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the specified name
    """
    return logging.getLogger(name)


def log_performance(logger: logging.Logger, operation: str, duration_ms: float, **kwargs):
    """
    Log performance metrics
    """
    logger.info(
        f"Performance: {operation}",
        extra={
            "operation": operation,
            "duration_ms": duration_ms,
            "performance_metric": True,
            **kwargs
        }
    )


def log_error(logger: logging.Logger, error: Exception, context: Dict[str, Any] = None):
    """
    Log error with context
    """
    extra_data = {
        "error_type": type(error).__name__,
        "error_message": str(error),
        "error_context": context or {}
    }
    
    logger.error(
        f"Error occurred: {str(error)}",
        exc_info=error,
        extra=extra_data
    )


def log_business_event(logger: logging.Logger, event: str, **kwargs):
    """
    Log business events
    """
    logger.info(
        f"Business event: {event}",
        extra={
            "business_event": event,
            "event_data": kwargs
        }
    )