from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Dict, Optional, Any
import docker
import json
from datetime import datetime, timedelta
from pydantic import BaseModel
import logging
import psutil
import asyncio

from ..auth.dependencies import get_current_admin_user
from ..models.user import User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/containers", tags=["containers"])

# Initialize Docker client
try:
    docker_client = docker.from_env()
except Exception as e:
    logger.error(f"Failed to initialize Docker client: {e}")
    docker_client = None

class ContainerStatus(BaseModel):
    id: str
    name: str
    image: str
    status: str
    health: str
    created: str
    ports: List[str]
    networks: List[str]
    mounts: List[str]
    cpu_percent: float
    memory_percent: float
    memory_usage: str
    memory_limit: str
    network_io: Dict[str, int]
    disk_io: Dict[str, int]
    uptime: str
    labels: Dict[str, str]

class InfrastructureStats(BaseModel):
    total_containers: int
    running_containers: int
    stopped_containers: int
    healthy_containers: int
    unhealthy_containers: int
    total_cpu_usage: float
    total_memory_usage: int
    total_memory_limit: int
    total_disk_usage: int
    network_usage: Dict[str, int]

class ContainerAction(BaseModel):
    action: str

def format_bytes(bytes_value: int) -> str:
    """Format bytes to human readable format"""
    if bytes_value == 0:
        return "0 B"
    
    sizes = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while bytes_value >= 1024 and i < len(sizes) - 1:
        bytes_value /= 1024.0
        i += 1
    
    return f"{bytes_value:.1f} {sizes[i]}"

def get_container_stats(container) -> Dict[str, Any]:
    """Get container statistics"""
    try:
        stats = container.stats(stream=False)
        
        # Calculate CPU percentage
        cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - \
                   stats['precpu_stats']['cpu_usage']['total_usage']
        system_cpu_delta = stats['cpu_stats']['system_cpu_usage'] - \
                          stats['precpu_stats']['system_cpu_usage']
        
        cpu_percent = 0.0
        if system_cpu_delta > 0 and cpu_delta > 0:
            cpu_percent = (cpu_delta / system_cpu_delta) * \
                         len(stats['cpu_stats']['cpu_usage']['percpu_usage']) * 100.0
        
        # Calculate memory usage
        memory_usage = stats['memory_stats'].get('usage', 0)
        memory_limit = stats['memory_stats'].get('limit', 0)
        memory_percent = (memory_usage / memory_limit * 100) if memory_limit > 0 else 0
        
        # Network I/O
        network_io = {'rx_bytes': 0, 'tx_bytes': 0}
        if 'networks' in stats:
            for interface in stats['networks'].values():
                network_io['rx_bytes'] += interface.get('rx_bytes', 0)
                network_io['tx_bytes'] += interface.get('tx_bytes', 0)
        
        # Disk I/O
        disk_io = {'read_bytes': 0, 'write_bytes': 0}
        if 'blkio_stats' in stats and 'io_service_bytes_recursive' in stats['blkio_stats']:
            for item in stats['blkio_stats']['io_service_bytes_recursive']:
                if item['op'] == 'Read':
                    disk_io['read_bytes'] += item['value']
                elif item['op'] == 'Write':
                    disk_io['write_bytes'] += item['value']
        
        return {
            'cpu_percent': round(cpu_percent, 2),
            'memory_percent': round(memory_percent, 2),
            'memory_usage': format_bytes(memory_usage),
            'memory_limit': format_bytes(memory_limit),
            'network_io': network_io,
            'disk_io': disk_io
        }
    except Exception as e:
        logger.warning(f"Failed to get stats for container {container.name}: {e}")
        return {
            'cpu_percent': 0.0,
            'memory_percent': 0.0,
            'memory_usage': "0 B",
            'memory_limit': "0 B",
            'network_io': {'rx_bytes': 0, 'tx_bytes': 0},
            'disk_io': {'read_bytes': 0, 'write_bytes': 0}
        }

def get_container_health(container) -> str:
    """Get container health status"""
    try:
        if hasattr(container.attrs, 'State') and 'Health' in container.attrs['State']:
            health_status = container.attrs['State']['Health']['Status']
            return health_status.lower()
        return 'none'
    except:
        return 'none'

def calculate_uptime(created_at: str) -> str:
    """Calculate container uptime"""
    try:
        created = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        uptime_delta = datetime.now(created.tzinfo) - created
        
        days = uptime_delta.days
        hours, remainder = divmod(uptime_delta.seconds, 3600)
        minutes, _ = divmod(remainder, 60)
        
        if days > 0:
            return f"{days}d {hours}h {minutes}m"
        elif hours > 0:
            return f"{hours}h {minutes}m"
        else:
            return f"{minutes}m"
    except:
        return "unknown"

@router.get("/", response_model=Dict[str, List[ContainerStatus]])
async def get_all_containers(current_user: User = Depends(get_current_admin_user)):
    """Get all Docker containers with their status and metrics"""
    
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker client not available")
    
    try:
        containers = docker_client.containers.list(all=True)
        container_list = []
        
        for container in containers:
            try:
                # Get container basic info
                attrs = container.attrs
                config = attrs.get('Config', {})
                state = attrs.get('State', {})
                network_settings = attrs.get('NetworkSettings', {})
                
                # Get container stats
                stats = get_container_stats(container) if container.status == 'running' else {
                    'cpu_percent': 0.0,
                    'memory_percent': 0.0,
                    'memory_usage': "0 B",
                    'memory_limit': "0 B",
                    'network_io': {'rx_bytes': 0, 'tx_bytes': 0},
                    'disk_io': {'read_bytes': 0, 'write_bytes': 0}
                }
                
                # Extract port mappings
                ports = []
                if 'Ports' in attrs['NetworkSettings']:
                    for port_config in attrs['NetworkSettings']['Ports'].values():
                        if port_config:
                            for port in port_config:
                                ports.append(f"{port.get('HostIp', '0.0.0.0')}:{port.get('HostPort', 'N/A')}")
                
                # Extract network names
                networks = list(network_settings.get('Networks', {}).keys())
                
                # Extract mount points
                mounts = []
                for mount in attrs.get('Mounts', []):
                    mounts.append(f"{mount.get('Source', 'N/A')}:{mount.get('Destination', 'N/A')}")
                
                container_info = ContainerStatus(
                    id=container.id,
                    name=container.name,
                    image=container.image.tags[0] if container.image.tags else container.image.id[:12],
                    status=container.status,
                    health=get_container_health(container),
                    created=attrs.get('Created', ''),
                    ports=ports,
                    networks=networks,
                    mounts=mounts[:5],  # Limit to first 5 mounts
                    cpu_percent=stats['cpu_percent'],
                    memory_percent=stats['memory_percent'],
                    memory_usage=stats['memory_usage'],
                    memory_limit=stats['memory_limit'],
                    network_io=stats['network_io'],
                    disk_io=stats['disk_io'],
                    uptime=calculate_uptime(attrs.get('Created', '')),
                    labels=config.get('Labels', {}) or {}
                )
                
                container_list.append(container_info)
                
            except Exception as e:
                logger.error(f"Error processing container {container.name}: {e}")
                continue
        
        return {"containers": container_list}
        
    except Exception as e:
        logger.error(f"Error fetching containers: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch containers: {str(e)}")

@router.get("/{container_id}", response_model=ContainerStatus)
async def get_container(container_id: str, current_user: User = Depends(get_current_admin_user)):
    """Get specific container details"""
    
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker client not available")
    
    try:
        container = docker_client.containers.get(container_id)
        attrs = container.attrs
        config = attrs.get('Config', {})
        
        stats = get_container_stats(container) if container.status == 'running' else {
            'cpu_percent': 0.0,
            'memory_percent': 0.0,
            'memory_usage': "0 B",
            'memory_limit': "0 B",
            'network_io': {'rx_bytes': 0, 'tx_bytes': 0},
            'disk_io': {'read_bytes': 0, 'write_bytes': 0}
        }
        
        return ContainerStatus(
            id=container.id,
            name=container.name,
            image=container.image.tags[0] if container.image.tags else container.image.id[:12],
            status=container.status,
            health=get_container_health(container),
            created=attrs.get('Created', ''),
            ports=[],
            networks=[],
            mounts=[],
            cpu_percent=stats['cpu_percent'],
            memory_percent=stats['memory_percent'],
            memory_usage=stats['memory_usage'],
            memory_limit=stats['memory_limit'],
            network_io=stats['network_io'],
            disk_io=stats['disk_io'],
            uptime=calculate_uptime(attrs.get('Created', '')),
            labels=config.get('Labels', {}) or {}
        )
        
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Container not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch container: {str(e)}")

@router.post("/{container_id}/start")
async def start_container(container_id: str, current_user: User = Depends(get_current_admin_user)):
    """Start a container"""
    
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker client not available")
    
    try:
        container = docker_client.containers.get(container_id)
        container.start()
        logger.info(f"Container {container.name} started by user {current_user.email}")
        return {"message": f"Container {container.name} started successfully"}
        
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Container not found")
    except docker.errors.APIError as e:
        raise HTTPException(status_code=400, detail=f"Failed to start container: {str(e)}")

@router.post("/{container_id}/stop")
async def stop_container(container_id: str, current_user: User = Depends(get_current_admin_user)):
    """Stop a container"""
    
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker client not available")
    
    try:
        container = docker_client.containers.get(container_id)
        container.stop(timeout=30)
        logger.info(f"Container {container.name} stopped by user {current_user.email}")
        return {"message": f"Container {container.name} stopped successfully"}
        
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Container not found")
    except docker.errors.APIError as e:
        raise HTTPException(status_code=400, detail=f"Failed to stop container: {str(e)}")

@router.post("/{container_id}/restart")
async def restart_container(container_id: str, current_user: User = Depends(get_current_admin_user)):
    """Restart a container"""
    
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker client not available")
    
    try:
        container = docker_client.containers.get(container_id)
        container.restart(timeout=30)
        logger.info(f"Container {container.name} restarted by user {current_user.email}")
        return {"message": f"Container {container.name} restarted successfully"}
        
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Container not found")
    except docker.errors.APIError as e:
        raise HTTPException(status_code=400, detail=f"Failed to restart container: {str(e)}")

@router.get("/{container_id}/logs")
async def get_container_logs(
    container_id: str,
    lines: int = 100,
    since: Optional[str] = None,
    until: Optional[str] = None,
    current_user: User = Depends(get_current_admin_user)
):
    """Get container logs"""
    
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker client not available")
    
    try:
        container = docker_client.containers.get(container_id)
        
        kwargs = {
            'tail': lines,
            'timestamps': True
        }
        
        if since:
            kwargs['since'] = since
        if until:
            kwargs['until'] = until
            
        logs = container.logs(**kwargs).decode('utf-8', errors='replace')
        
        # Parse logs into structured format
        log_lines = []
        for line in logs.strip().split('\n'):
            if line:
                try:
                    # Try to extract timestamp
                    if line.startswith('2'):  # Assuming ISO timestamp
                        timestamp = line[:30]
                        message = line[31:] if len(line) > 31 else line
                    else:
                        timestamp = datetime.now().isoformat()
                        message = line
                    
                    # Extract log level
                    level = 'INFO'
                    if 'ERROR' in message.upper():
                        level = 'ERROR'
                    elif 'WARN' in message.upper():
                        level = 'WARNING'
                    elif 'DEBUG' in message.upper():
                        level = 'DEBUG'
                    
                    log_lines.append({
                        'timestamp': timestamp,
                        'level': level,
                        'message': message.strip(),
                        'source': container.name
                    })
                except:
                    log_lines.append({
                        'timestamp': datetime.now().isoformat(),
                        'level': 'INFO',
                        'message': line,
                        'source': container.name
                    })
        
        return {
            'container_id': container_id,
            'container_name': container.name,
            'logs': log_lines,
            'total_lines': len(log_lines)
        }
        
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Container not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch logs: {str(e)}")

@router.get("/{container_id}/metrics")
async def get_container_metrics(
    container_id: str,
    range_param: str = "1h",
    current_user: User = Depends(get_current_admin_user)
):
    """Get container metrics over time"""
    
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker client not available")
    
    try:
        container = docker_client.containers.get(container_id)
        
        if container.status != 'running':
            raise HTTPException(status_code=400, detail="Container is not running")
        
        # Get current stats
        stats = get_container_stats(container)
        
        # For now, return current stats - in production you'd query time series DB
        return {
            'container_id': container_id,
            'container_name': container.name,
            'range': range_param,
            'current_metrics': stats,
            'time_series': {
                'cpu_usage': [stats['cpu_percent']],
                'memory_usage': [stats['memory_percent']],
                'network_rx': [stats['network_io']['rx_bytes']],
                'network_tx': [stats['network_io']['tx_bytes']],
                'timestamps': [datetime.now().isoformat()]
            }
        }
        
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Container not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch metrics: {str(e)}")

@router.post("/{container_id}/exec")
async def execute_command(
    container_id: str,
    command: str,
    current_user: User = Depends(get_current_admin_user)
):
    """Execute command in container"""
    
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker client not available")
    
    try:
        container = docker_client.containers.get(container_id)
        
        if container.status != 'running':
            raise HTTPException(status_code=400, detail="Container is not running")
        
        # Execute command
        result = container.exec_run(command)
        
        logger.info(f"Command '{command}' executed in container {container.name} by user {current_user.email}")
        
        return {
            'output': result.output.decode('utf-8', errors='replace'),
            'exit_code': result.exit_code
        }
        
    except docker.errors.NotFound:
        raise HTTPException(status_code=404, detail="Container not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute command: {str(e)}")