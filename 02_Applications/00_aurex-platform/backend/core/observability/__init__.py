"""
Enhanced Observability with Distributed Tracing
OpenTelemetry integration for comprehensive monitoring
"""
from opentelemetry import trace, metrics
from opentelemetry.exporter.prometheus import PrometheusMetricReader
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from prometheus_client import Counter, Histogram, Gauge, generate_latest
import time
from functools import wraps
import os

# Configuration
JAEGER_HOST = os.getenv("JAEGER_HOST", "localhost")
JAEGER_PORT = int(os.getenv("JAEGER_PORT", "6831"))
SERVICE_NAME = os.getenv("SERVICE_NAME", "aurex-platform")

class ObservabilityManager:
    """Comprehensive observability management"""
    
    def __init__(self):
        self.tracer = None
        self.meter = None
        self._setup_tracing()
        self._setup_metrics()
    
    def _setup_tracing(self):
        """Setup distributed tracing with Jaeger"""
        resource = Resource.create({"service.name": SERVICE_NAME})
        
        # Setup tracer provider
        trace.set_tracer_provider(TracerProvider(resource=resource))
        self.tracer = trace.get_tracer(__name__)
        
        # Setup Jaeger exporter
        jaeger_exporter = JaegerExporter(
            agent_host_name=JAEGER_HOST,
            agent_port=JAEGER_PORT,
        )
        
        # Add span processor
        span_processor = BatchSpanProcessor(jaeger_exporter)
        trace.get_tracer_provider().add_span_processor(span_processor)
    
    def _setup_metrics(self):
        """Setup metrics collection with Prometheus"""
        # Setup meter provider
        reader = PrometheusMetricReader()
        provider = MeterProvider(resource=Resource.create({"service.name": SERVICE_NAME}), metric_readers=[reader])
        metrics.set_meter_provider(provider)
        self.meter = metrics.get_meter(__name__)
    
    def instrument_app(self, app):
        """Instrument FastAPI application"""
        FastAPIInstrumentor.instrument_app(app)
        SQLAlchemyInstrumentor().instrument()
    
    def create_span(self, name: str, attributes: dict = None):
        """Create a new span for tracing"""
        with self.tracer.start_as_current_span(name) as span:
            if attributes:
                for key, value in attributes.items():
                    span.set_attribute(key, value)
            return span

# Prometheus metrics
class Metrics:
    """Application metrics for Prometheus"""
    
    # Request metrics
    REQUEST_COUNT = Counter(
        'http_requests_total',
        'Total number of HTTP requests',
        ['method', 'endpoint', 'status']
    )
    
    REQUEST_DURATION = Histogram(
        'http_request_duration_seconds',
        'HTTP request duration in seconds',
        ['method', 'endpoint']
    )
    
    # Business metrics
    ACTIVE_USERS = Gauge(
        'active_users_total',
        'Number of currently active users',
        ['organization']
    )
    
    ASSESSMENTS_CREATED = Counter(
        'assessments_created_total',
        'Total number of assessments created',
        ['organization', 'standard']
    )
    
    # System metrics
    DATABASE_CONNECTIONS = Gauge(
        'database_connections_active',
        'Number of active database connections'
    )
    
    CACHE_HIT_RATE = Gauge(
        'cache_hit_rate',
        'Cache hit rate percentage'
    )
    
    # Security metrics
    FAILED_LOGINS = Counter(
        'failed_login_attempts_total',
        'Total number of failed login attempts',
        ['reason']
    )
    
    SECURITY_EVENTS = Counter(
        'security_events_total',
        'Total number of security events',
        ['event_type', 'severity']
    )

def traced(span_name: str = None):
    """Decorator for adding tracing to functions"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            name = span_name or f"{func.__module__}.{func.__name__}"
            with observability.tracer.start_as_current_span(name) as span:
                span.set_attribute("function", func.__name__)
                try:
                    result = await func(*args, **kwargs)
                    span.set_attribute("status", "success")
                    return result
                except Exception as e:
                    span.set_attribute("status", "error")
                    span.set_attribute("error", str(e))
                    raise
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            name = span_name or f"{func.__module__}.{func.__name__}"
            with observability.tracer.start_as_current_span(name) as span:
                span.set_attribute("function", func.__name__)
                try:
                    result = func(*args, **kwargs)
                    span.set_attribute("status", "success")
                    return result
                except Exception as e:
                    span.set_attribute("status", "error")
                    span.set_attribute("error", str(e))
                    raise
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    return decorator

def measure_time(metric_name: str):
    """Decorator for measuring function execution time"""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                # Record metric
                if hasattr(Metrics, metric_name):
                    getattr(Metrics, metric_name).observe(duration)
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                return result
            finally:
                duration = time.time() - start_time
                # Record metric
                if hasattr(Metrics, metric_name):
                    getattr(Metrics, metric_name).observe(duration)
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    return decorator

# Health check implementation
class HealthChecker:
    """System health checking"""
    
    @staticmethod
    async def check_database() -> dict:
        """Check database connectivity"""
        try:
            from ..database import db_manager
            async with db_manager.get_session() as session:
                await session.execute("SELECT 1")
            return {"status": "healthy", "details": "Database connection successful"}
        except Exception as e:
            return {"status": "unhealthy", "details": str(e)}
    
    @staticmethod
    async def check_cache() -> dict:
        """Check cache connectivity"""
        try:
            from ..cache import cache_manager
            await cache_manager.set("health_check", "ok", ttl=10)
            value = await cache_manager.get("health_check")
            if value == "ok":
                return {"status": "healthy", "details": "Cache connection successful"}
            return {"status": "unhealthy", "details": "Cache read/write failed"}
        except Exception as e:
            return {"status": "unhealthy", "details": str(e)}
    
    @staticmethod
    async def check_all() -> dict:
        """Comprehensive health check"""
        checks = {
            "database": await HealthChecker.check_database(),
            "cache": await HealthChecker.check_cache(),
        }
        
        overall_status = "healthy" if all(
            check["status"] == "healthy" for check in checks.values()
        ) else "unhealthy"
        
        return {
            "status": overall_status,
            "checks": checks,
            "timestamp": time.time()
        }

# Global instance
import asyncio
observability = ObservabilityManager()
health_checker = HealthChecker()

__all__ = [
    "ObservabilityManager",
    "Metrics",
    "HealthChecker",
    "observability",
    "health_checker",
    "traced",
    "measure_time"
]