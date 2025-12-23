"""
Monitoring Service
Real-time performance monitoring and metrics collection
"""

import asyncio
import logging
import time
import psutil
from typing import Dict, Any, List, Optional
from collections import deque
from dataclasses import dataclass
import statistics

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class MetricSnapshot:
    """Single metrics snapshot"""
    timestamp: float
    tps: float
    finality_time_ms: float
    cpu_usage: float
    memory_usage: float
    network_latency_ms: float
    active_connections: int


class MonitoringService:
    """
    Comprehensive monitoring service
    Tracks performance, health, and system metrics
    """
    
    def __init__(self):
        self.initialized = False
        self.running = False
        self.start_time = time.time()
        
        # Metrics storage
        self.metrics_history: deque = deque(maxlen=10000)  # Keep last 10k metrics
        self.alert_history: List[Dict[str, Any]] = []
        
        # Performance counters
        self.total_transactions = 0
        self.total_blocks = 0
        self.transaction_rate_history = deque(maxlen=60)  # Last 60 seconds
        self.block_rate_history = deque(maxlen=60)
        
        # System metrics
        self.cpu_history = deque(maxlen=100)
        self.memory_history = deque(maxlen=100)
        self.disk_history = deque(maxlen=100)
        self.network_history = deque(maxlen=100)
        
        # Health status
        self.service_health = {
            'consensus': True,
            'transaction_processor': True,
            'quantum_crypto': True,
            'p2p_network': True,
            'database': True,
            'grpc_server': True,
        }
        
        # Alert thresholds
        self.alert_thresholds = {
            'cpu_usage_critical': 90.0,
            'memory_usage_critical': 85.0,
            'tps_low_warning': 100000,  # Warning if TPS drops below 100k
            'finality_high_warning': 500,  # Warning if finality > 500ms
            'disk_usage_critical': 90.0,
        }
        
        # Active alerts
        self.active_alerts: Dict[str, Dict[str, Any]] = {}
        
        logger.info("MonitoringService initialized")
    
    async def initialize(self) -> None:
        """
        Initialize the monitoring service
        """
        try:
            if self.initialized:
                return
                
            logger.info("Initializing monitoring service...")
            
            # Start background monitoring tasks
            asyncio.create_task(self._collect_system_metrics())
            asyncio.create_task(self._collect_performance_metrics())
            asyncio.create_task(self._health_checker())
            asyncio.create_task(self._alert_processor())
            asyncio.create_task(self._metrics_cleanup())
            
            self.initialized = True
            self.running = True
            
            logger.info("Monitoring service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize monitoring service: {e}")
            raise
    
    async def start(self) -> None:
        """
        Start the monitoring service (alias for initialize)
        """
        await self.initialize()
    
    async def stop(self) -> None:
        """
        Stop the monitoring service
        """
        self.running = False
        logger.info("Monitoring service stopped")
    
    async def get_current_metrics(self) -> Dict[str, Any]:
        """
        Get current performance metrics
        """
        try:
            current_time = time.time()
            
            # Calculate current TPS
            tps = await self._calculate_current_tps()
            
            # Get finality time
            finality_time = await self._get_average_finality_time()
            
            # Get system metrics
            cpu_usage = psutil.cpu_percent(interval=None)
            memory = psutil.virtual_memory()
            memory_usage = memory.percent
            
            # Network latency (mock)
            network_latency = await self._measure_network_latency()
            
            return {
                'tps': tps,
                'finality_time_ms': finality_time,
                'total_transactions': self.total_transactions,
                'total_blocks': self.total_blocks,
                'network_latency_ms': network_latency,
                'cpu_usage': cpu_usage,
                'memory_usage': memory_usage,
                'timestamp': int(current_time * 1000)
            }
            
        except Exception as e:
            logger.error(f"Error getting current metrics: {e}")
            return self._get_default_metrics()
    
    async def get_health_status(self) -> Dict[str, Any]:
        """
        Get comprehensive health status
        """
        try:
            uptime = time.time() - self.start_time
            overall_healthy = all(self.service_health.values())
            
            return {
                'healthy': overall_healthy,
                'services': self.service_health.copy(),
                'uptime_seconds': int(uptime),
                'version': settings.VERSION,
                'active_alerts': len(self.active_alerts),
                'total_alerts': len(self.alert_history),
                'metrics_collected': len(self.metrics_history)
            }
            
        except Exception as e:
            logger.error(f"Error getting health status: {e}")
            return {
                'healthy': False,
                'services': {'error': False},
                'uptime_seconds': 0,
                'version': settings.VERSION
            }
    
    def update_transaction_count(self, count: int):
        """
        Update transaction count
        """
        self.total_transactions += count
        self.transaction_rate_history.append((time.time(), count))
    
    def update_block_count(self, count: int = 1):
        """
        Update block count
        """
        self.total_blocks += count
        self.block_rate_history.append((time.time(), count))
    
    def update_service_health(self, service: str, healthy: bool):
        """
        Update service health status
        """
        if service in self.service_health:
            old_status = self.service_health[service]
            self.service_health[service] = healthy
            
            if old_status != healthy:
                logger.info(f"Service {service} health changed: {old_status} -> {healthy}")
                
                if not healthy:
                    await self._trigger_alert(
                        alert_type='service_unhealthy',
                        message=f"Service {service} is unhealthy",
                        severity='critical',
                        details={'service': service}
                    )
    
    async def add_custom_metric(self, name: str, value: Any, tags: Optional[Dict[str, str]] = None):
        """
        Add a custom metric
        """
        try:
            metric = {
                'name': name,
                'value': value,
                'timestamp': time.time(),
                'tags': tags or {}
            }
            
            # Store custom metrics (could be extended to use a time-series database)
            if not hasattr(self, 'custom_metrics'):
                self.custom_metrics = deque(maxlen=1000)
            
            self.custom_metrics.append(metric)
            
        except Exception as e:
            logger.error(f"Error adding custom metric {name}: {e}")
    
    async def _collect_system_metrics(self):
        """
        Collect system metrics (CPU, memory, disk, network)
        """
        while self.running:
            try:
                # CPU metrics
                cpu_usage = psutil.cpu_percent(interval=1.0)
                self.cpu_history.append(cpu_usage)
                
                # Memory metrics
                memory = psutil.virtual_memory()
                self.memory_history.append(memory.percent)
                
                # Disk metrics
                disk = psutil.disk_usage('/')
                disk_usage = (disk.used / disk.total) * 100
                self.disk_history.append(disk_usage)
                
                # Network metrics (basic)
                network_stats = psutil.net_io_counters()
                self.network_history.append({
                    'bytes_sent': network_stats.bytes_sent,
                    'bytes_recv': network_stats.bytes_recv,
                    'packets_sent': network_stats.packets_sent,
                    'packets_recv': network_stats.packets_recv
                })
                
                # Check alert thresholds
                await self._check_system_alerts(cpu_usage, memory.percent, disk_usage)
                
            except Exception as e:
                logger.error(f"Error collecting system metrics: {e}")
            
            await asyncio.sleep(5.0)  # Collect every 5 seconds
    
    async def _collect_performance_metrics(self):
        """
        Collect performance metrics (TPS, finality, etc.)
        """
        while self.running:
            try:
                current_time = time.time()
                
                # Calculate current TPS
                tps = await self._calculate_current_tps()
                
                # Get finality time
                finality_time = await self._get_average_finality_time()
                
                # Get system metrics
                cpu_usage = psutil.cpu_percent(interval=None)
                memory_usage = psutil.virtual_memory().percent
                network_latency = await self._measure_network_latency()
                
                # Create metrics snapshot
                snapshot = MetricSnapshot(
                    timestamp=current_time,
                    tps=tps,
                    finality_time_ms=finality_time,
                    cpu_usage=cpu_usage,
                    memory_usage=memory_usage,
                    network_latency_ms=network_latency,
                    active_connections=await self._get_active_connections()
                )
                
                self.metrics_history.append(snapshot)
                
                # Check performance alerts
                await self._check_performance_alerts(tps, finality_time)
                
            except Exception as e:
                logger.error(f"Error collecting performance metrics: {e}")
            
            await asyncio.sleep(1.0)  # Collect every second
    
    async def _health_checker(self):
        """
        Periodic health checking
        """
        while self.running:
            try:
                # Check database health
                await self._check_database_health()
                
                # Check consensus health
                await self._check_consensus_health()
                
                # Check transaction processor health
                await self._check_transaction_processor_health()
                
                # Check gRPC server health
                await self._check_grpc_server_health()
                
            except Exception as e:
                logger.error(f"Error in health checker: {e}")
            
            await asyncio.sleep(30.0)  # Check every 30 seconds
    
    async def _alert_processor(self):
        """
        Process and manage alerts
        """
        while self.running:
            try:
                # Clean up resolved alerts
                current_time = time.time()
                resolved_alerts = []
                
                for alert_id, alert in self.active_alerts.items():
                    # Auto-resolve alerts after 5 minutes if not critical
                    if (alert['severity'] != 'critical' and 
                        current_time - alert['timestamp'] > 300):
                        resolved_alerts.append(alert_id)
                
                for alert_id in resolved_alerts:
                    await self._resolve_alert(alert_id)
                
            except Exception as e:
                logger.error(f"Error in alert processor: {e}")
            
            await asyncio.sleep(60.0)  # Process every minute
    
    async def _metrics_cleanup(self):
        """
        Clean up old metrics to prevent memory bloat
        """
        while self.running:
            try:
                # Clean up history deques (they have maxlen, so this is mostly for custom metrics)
                if hasattr(self, 'custom_metrics') and len(self.custom_metrics) > 1000:
                    # Keep only last 1000 custom metrics
                    self.custom_metrics = deque(list(self.custom_metrics)[-1000:], maxlen=1000)
                
                # Clean up old alert history (keep last 1000)
                if len(self.alert_history) > 1000:
                    self.alert_history = self.alert_history[-1000:]
                
                logger.debug("Metrics cleanup completed")
                
            except Exception as e:
                logger.error(f"Error in metrics cleanup: {e}")
            
            await asyncio.sleep(3600.0)  # Cleanup every hour
    
    async def _calculate_current_tps(self) -> float:
        """
        Calculate current transactions per second
        """
        try:
            current_time = time.time()
            
            # Remove entries older than 1 second
            while (self.transaction_rate_history and 
                   current_time - self.transaction_rate_history[0][0] > 1.0):
                self.transaction_rate_history.popleft()
            
            # Sum transactions in the last second
            total_transactions = sum(count for _, count in self.transaction_rate_history)
            
            return float(total_transactions)
            
        except Exception as e:
            logger.error(f"Error calculating TPS: {e}")
            return 0.0
    
    async def _get_average_finality_time(self) -> float:
        """
        Get average finality time from recent metrics
        """
        try:
            if not self.metrics_history:
                return 100.0  # Default finality time
            
            # Get finality times from last 10 metrics
            recent_finality_times = [
                m.finality_time_ms for m in list(self.metrics_history)[-10:]
                if hasattr(m, 'finality_time_ms')
            ]
            
            if recent_finality_times:
                return statistics.mean(recent_finality_times)
            
            return 100.0
            
        except Exception as e:
            logger.error(f"Error getting average finality time: {e}")
            return 100.0
    
    async def _measure_network_latency(self) -> float:
        """
        Measure network latency (mock implementation)
        """
        try:
            # Mock network latency measurement
            import random
            return random.uniform(10.0, 50.0)  # 10-50ms mock latency
            
        except Exception as e:
            logger.error(f"Error measuring network latency: {e}")
            return 25.0
    
    async def _get_active_connections(self) -> int:
        """
        Get number of active connections
        """
        try:
            # Mock active connections
            return len(psutil.net_connections())
            
        except Exception as e:
            logger.error(f"Error getting active connections: {e}")
            return 0
    
    async def _check_system_alerts(self, cpu_usage: float, memory_usage: float, disk_usage: float):
        """
        Check system-level alerts
        """
        try:
            # CPU usage alert
            if cpu_usage > self.alert_thresholds['cpu_usage_critical']:
                await self._trigger_alert(
                    'cpu_usage_high',
                    f'CPU usage critical: {cpu_usage:.1f}%',
                    'critical',
                    {'cpu_usage': cpu_usage}
                )
            
            # Memory usage alert
            if memory_usage > self.alert_thresholds['memory_usage_critical']:
                await self._trigger_alert(
                    'memory_usage_high',
                    f'Memory usage critical: {memory_usage:.1f}%',
                    'critical',
                    {'memory_usage': memory_usage}
                )
            
            # Disk usage alert
            if disk_usage > self.alert_thresholds['disk_usage_critical']:
                await self._trigger_alert(
                    'disk_usage_high',
                    f'Disk usage critical: {disk_usage:.1f}%',
                    'critical',
                    {'disk_usage': disk_usage}
                )
                
        except Exception as e:
            logger.error(f"Error checking system alerts: {e}")
    
    async def _check_performance_alerts(self, tps: float, finality_time: float):
        """
        Check performance-related alerts
        """
        try:
            # Low TPS alert
            if tps < self.alert_thresholds['tps_low_warning']:
                await self._trigger_alert(
                    'tps_low',
                    f'TPS below threshold: {tps:.0f}',
                    'warning',
                    {'tps': tps, 'threshold': self.alert_thresholds['tps_low_warning']}
                )
            
            # High finality time alert
            if finality_time > self.alert_thresholds['finality_high_warning']:
                await self._trigger_alert(
                    'finality_high',
                    f'Finality time high: {finality_time:.1f}ms',
                    'warning',
                    {'finality_time_ms': finality_time, 'threshold': self.alert_thresholds['finality_high_warning']}
                )
                
        except Exception as e:
            logger.error(f"Error checking performance alerts: {e}")
    
    async def _trigger_alert(self, alert_type: str, message: str, severity: str, details: Dict[str, Any]):
        """
        Trigger an alert
        """
        try:
            alert_id = f"{alert_type}_{int(time.time())}"
            
            alert = {
                'id': alert_id,
                'type': alert_type,
                'message': message,
                'severity': severity,
                'timestamp': time.time(),
                'details': details,
                'resolved': False
            }
            
            # Add to active alerts
            self.active_alerts[alert_id] = alert
            
            # Add to history
            self.alert_history.append(alert)
            
            # Log alert
            log_level = logging.CRITICAL if severity == 'critical' else logging.WARNING
            logger.log(log_level, f"Alert triggered: {message} ({alert_type})")
            
        except Exception as e:
            logger.error(f"Error triggering alert: {e}")
    
    async def _resolve_alert(self, alert_id: str):
        """
        Resolve an alert
        """
        try:
            if alert_id in self.active_alerts:
                alert = self.active_alerts[alert_id]
                alert['resolved'] = True
                alert['resolved_at'] = time.time()
                
                del self.active_alerts[alert_id]
                
                logger.info(f"Alert resolved: {alert['message']} ({alert['type']})")
                
        except Exception as e:
            logger.error(f"Error resolving alert {alert_id}: {e}")
    
    async def _check_database_health(self):
        """
        Check database health
        """
        try:
            from app.models.base import AsyncSessionLocal
            
            async with AsyncSessionLocal() as session:
                await session.execute("SELECT 1")
                self.update_service_health('database', True)
                
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            self.update_service_health('database', False)
    
    async def _check_consensus_health(self):
        """
        Check consensus health
        """
        try:
            # Mock consensus health check
            self.update_service_health('consensus', True)
            
        except Exception as e:
            logger.error(f"Consensus health check failed: {e}")
            self.update_service_health('consensus', False)
    
    async def _check_transaction_processor_health(self):
        """
        Check transaction processor health
        """
        try:
            # Mock transaction processor health check
            self.update_service_health('transaction_processor', True)
            
        except Exception as e:
            logger.error(f"Transaction processor health check failed: {e}")
            self.update_service_health('transaction_processor', False)
    
    async def _check_grpc_server_health(self):
        """
        Check gRPC server health
        """
        try:
            # Mock gRPC server health check
            self.update_service_health('grpc_server', True)
            
        except Exception as e:
            logger.error(f"gRPC server health check failed: {e}")
            self.update_service_health('grpc_server', False)
    
    def _get_default_metrics(self) -> Dict[str, Any]:
        """
        Get default metrics when errors occur
        """
        return {
            'tps': 0.0,
            'finality_time_ms': 0.0,
            'total_transactions': 0,
            'total_blocks': 0,
            'network_latency_ms': 0.0,
            'cpu_usage': 0.0,
            'memory_usage': 0.0,
            'timestamp': int(time.time() * 1000)
        }
    
    def get_stats(self) -> Dict[str, Any]:
        """
        Get monitoring service statistics
        """
        uptime = time.time() - self.start_time
        
        return {
            'initialized': self.initialized,
            'running': self.running,
            'uptime_seconds': uptime,
            'metrics_collected': len(self.metrics_history),
            'active_alerts': len(self.active_alerts),
            'total_alerts': len(self.alert_history),
            'total_transactions': self.total_transactions,
            'total_blocks': self.total_blocks,
            'services_healthy': sum(1 for health in self.service_health.values() if health),
            'total_services': len(self.service_health),
            'current_tps': await self._calculate_current_tps() if self.running else 0.0,
        }