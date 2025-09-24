from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, List, Any, Optional
import docker
import psutil
import json
from datetime import datetime
import logging

from ..auth.dependencies import get_current_admin_user
from ..models.user import User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/infrastructure", tags=["infrastructure"])

# Initialize Docker client
try:
    docker_client = docker.from_env()
except Exception as e:
    logger.error(f"Failed to initialize Docker client: {e}")
    docker_client = None

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

@router.get("/stats")
async def get_infrastructure_stats(current_user: User = Depends(get_current_admin_user)):
    """Get comprehensive infrastructure statistics"""
    
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker client not available")
    
    try:
        # Get all containers
        containers = docker_client.containers.list(all=True)
        
        # Container counts
        total_containers = len(containers)
        running_containers = len([c for c in containers if c.status == 'running'])
        stopped_containers = total_containers - running_containers
        
        # Health counts
        healthy_containers = 0
        unhealthy_containers = 0
        
        # Resource totals
        total_cpu_usage = 0.0
        total_memory_usage = 0
        total_memory_limit = 0
        total_network_rx = 0
        total_network_tx = 0
        
        for container in containers:
            if container.status == 'running':
                try:
                    # Get health status
                    if hasattr(container.attrs, 'State') and 'Health' in container.attrs.get('State', {}):
                        health_status = container.attrs['State']['Health']['Status']
                        if health_status == 'healthy':
                            healthy_containers += 1
                        else:
                            unhealthy_containers += 1
                    else:
                        healthy_containers += 1  # Assume healthy if no health check
                    
                    # Get resource usage
                    stats = container.stats(stream=False)
                    
                    # CPU calculation
                    cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - \
                               stats['precpu_stats']['cpu_usage']['total_usage']
                    system_cpu_delta = stats['cpu_stats']['system_cpu_usage'] - \
                                      stats['precpu_stats']['system_cpu_usage']
                    
                    if system_cpu_delta > 0 and cpu_delta > 0:
                        cpu_percent = (cpu_delta / system_cpu_delta) * \
                                     len(stats['cpu_stats']['cpu_usage']['percpu_usage']) * 100.0
                        total_cpu_usage += cpu_percent
                    
                    # Memory calculation
                    memory_usage = stats['memory_stats'].get('usage', 0)
                    memory_limit = stats['memory_stats'].get('limit', 0)
                    total_memory_usage += memory_usage
                    total_memory_limit += memory_limit
                    
                    # Network I/O
                    if 'networks' in stats:
                        for interface in stats['networks'].values():
                            total_network_rx += interface.get('rx_bytes', 0)
                            total_network_tx += interface.get('tx_bytes', 0)
                            
                except Exception as e:
                    logger.warning(f"Failed to get stats for container {container.name}: {e}")
                    continue
        
        # System-level stats
        cpu_count = psutil.cpu_count()
        system_cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "total_containers": total_containers,
            "running_containers": running_containers,
            "stopped_containers": stopped_containers,
            "healthy_containers": healthy_containers,
            "unhealthy_containers": unhealthy_containers,
            "total_cpu_usage": round(total_cpu_usage, 2),
            "total_memory_usage": total_memory_usage,
            "total_memory_limit": total_memory_limit,
            "total_disk_usage": disk.used,
            "network_usage": {
                "total_rx": total_network_rx,
                "total_tx": total_network_tx
            },
            "system_stats": {
                "cpu_cores": cpu_count,
                "system_cpu_percent": system_cpu_percent,
                "system_memory_total": memory.total,
                "system_memory_used": memory.used,
                "system_memory_percent": memory.percent,
                "disk_total": disk.total,
                "disk_used": disk.used,
                "disk_percent": round((disk.used / disk.total) * 100, 2)
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching infrastructure stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch infrastructure stats: {str(e)}")

@router.get("/system/info")
async def get_system_info(current_user: User = Depends(get_current_admin_user)):
    """Get Docker system information"""
    
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker client not available")
    
    try:
        info = docker_client.info()
        version = docker_client.version()
        
        return {
            "docker_info": {
                "containers": info.get('Containers', 0),
                "containers_running": info.get('ContainersRunning', 0),
                "containers_paused": info.get('ContainersPaused', 0),
                "containers_stopped": info.get('ContainersStopped', 0),
                "images": info.get('Images', 0),
                "server_version": info.get('ServerVersion', 'unknown'),
                "kernel_version": info.get('KernelVersion', 'unknown'),
                "operating_system": info.get('OperatingSystem', 'unknown'),
                "architecture": info.get('Architecture', 'unknown'),
                "memory_total": info.get('MemTotal', 0),
                "cpu_cores": info.get('NCPU', 0)
            },
            "docker_version": version,
            "system_time": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error fetching system info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch system info: {str(e)}")

@router.get("/images")
async def get_docker_images(current_user: User = Depends(get_current_admin_user)):
    """Get Docker images"""
    
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker client not available")
    
    try:
        images = docker_client.images.list()
        image_list = []
        
        for image in images:
            try:
                image_info = {
                    "id": image.id,
                    "short_id": image.short_id,
                    "tags": image.tags,
                    "size": image.attrs.get('Size', 0),
                    "size_formatted": format_bytes(image.attrs.get('Size', 0)),
                    "created": image.attrs.get('Created', ''),
                    "parent_id": image.attrs.get('Parent', ''),
                    "repo_digests": image.attrs.get('RepoDigests', []),
                    "labels": image.attrs.get('Config', {}).get('Labels') or {}
                }
                image_list.append(image_info)
            except Exception as e:
                logger.warning(f"Error processing image {image.id}: {e}")
                continue
        
        return {"images": image_list}
        
    except Exception as e:
        logger.error(f"Error fetching Docker images: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch images: {str(e)}")

@router.get("/volumes")
async def get_docker_volumes(current_user: User = Depends(get_current_admin_user)):
    """Get Docker volumes"""
    
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker client not available")
    
    try:
        volumes = docker_client.volumes.list()
        volume_list = []
        
        for volume in volumes:
            try:
                volume_info = {
                    "name": volume.name,
                    "driver": volume.attrs.get('Driver', 'unknown'),
                    "mountpoint": volume.attrs.get('Mountpoint', ''),
                    "created": volume.attrs.get('CreatedAt', ''),
                    "labels": volume.attrs.get('Labels') or {},
                    "options": volume.attrs.get('Options') or {},
                    "scope": volume.attrs.get('Scope', 'local')
                }
                volume_list.append(volume_info)
            except Exception as e:
                logger.warning(f"Error processing volume {volume.name}: {e}")
                continue
        
        return {"volumes": volume_list}
        
    except Exception as e:
        logger.error(f"Error fetching Docker volumes: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch volumes: {str(e)}")

@router.get("/networks")
async def get_docker_networks(current_user: User = Depends(get_current_admin_user)):
    """Get Docker networks"""
    
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker client not available")
    
    try:
        networks = docker_client.networks.list()
        network_list = []
        
        for network in networks:
            try:
                network_info = {
                    "id": network.id,
                    "name": network.name,
                    "driver": network.attrs.get('Driver', 'unknown'),
                    "scope": network.attrs.get('Scope', 'local'),
                    "created": network.attrs.get('Created', ''),
                    "ipam": network.attrs.get('IPAM', {}),
                    "containers": network.attrs.get('Containers', {}),
                    "options": network.attrs.get('Options') or {},
                    "labels": network.attrs.get('Labels') or {}
                }
                network_list.append(network_info)
            except Exception as e:
                logger.warning(f"Error processing network {network.name}: {e}")
                continue
        
        return {"networks": network_list}
        
    except Exception as e:
        logger.error(f"Error fetching Docker networks: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch networks: {str(e)}")

@router.post("/prune")
async def prune_docker_system(
    containers: bool = False,
    images: bool = False,
    volumes: bool = False,
    networks: bool = False,
    current_user: User = Depends(get_current_admin_user)
):
    """Prune Docker system resources"""
    
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker client not available")
    
    try:
        total_reclaimed = 0
        results = {}
        
        if containers:
            result = docker_client.containers.prune()
            results['containers'] = result
            total_reclaimed += result.get('SpaceReclaimed', 0)
        
        if images:
            result = docker_client.images.prune(filters={'dangling': False})
            results['images'] = result
            total_reclaimed += result.get('SpaceReclaimed', 0)
        
        if volumes:
            result = docker_client.volumes.prune()
            results['volumes'] = result
            total_reclaimed += result.get('SpaceReclaimed', 0)
        
        if networks:
            result = docker_client.networks.prune()
            results['networks'] = result
            # Networks don't typically report space reclaimed
        
        logger.info(f"Docker system pruned by user {current_user.email}. Space reclaimed: {format_bytes(total_reclaimed)}")
        
        return {
            "message": "Docker system pruned successfully",
            "reclaimed_space": total_reclaimed,
            "reclaimed_space_formatted": format_bytes(total_reclaimed),
            "details": results
        }
        
    except Exception as e:
        logger.error(f"Error pruning Docker system: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to prune system: {str(e)}")

@router.get("/services")
async def get_aurex_services(current_user: User = Depends(get_current_admin_user)):
    """Get Aurex platform services status"""
    
    if not docker_client:
        raise HTTPException(status_code=503, detail="Docker client not available")
    
    try:
        containers = docker_client.containers.list(all=True)
        aurex_services = []
        
        # Define Aurex service categories
        service_categories = {
            'core': ['aurex-platform-backend', 'aurex-launchpad-backend', 'aurex-postgres-container', 'aurex-redis-master'],
            'applications': ['aurex-hydropulse-backend', 'aurex-sylvagraph-backend', 'aurex-carbontrace-backend'],
            'monitoring': ['aurex-prometheus-container', 'aurex-grafana-container', 'aurex-alertmanager'],
            'security': ['aurex-waf-proxy', 'aurex-ids-monitor', 'aurex-fail2ban'],
            'infrastructure': ['aurex-backup-controller', 'aurex-nginx-ssl-proxy']
        }
        
        for container in containers:
            # Check if container belongs to Aurex platform
            labels = container.attrs.get('Config', {}).get('Labels') or {}
            if labels.get('com.aurex.platform') == 'true':
                
                # Determine service category
                category = 'other'
                for cat, services in service_categories.items():
                    if any(service in container.name for service in services):
                        category = cat
                        break
                
                # Get service type from labels
                service_type = labels.get('com.aurex.service', 'unknown')
                
                service_info = {
                    'container_id': container.id,
                    'name': container.name,
                    'service_type': service_type,
                    'category': category,
                    'status': container.status,
                    'image': container.image.tags[0] if container.image.tags else container.image.id[:12],
                    'created': container.attrs.get('Created', ''),
                    'ports': [],
                    'health': 'unknown',
                    'labels': labels
                }
                
                # Get port mappings
                if 'Ports' in container.attrs.get('NetworkSettings', {}):
                    for port_config in container.attrs['NetworkSettings']['Ports'].values():
                        if port_config:
                            for port in port_config:
                                service_info['ports'].append(f"{port.get('HostPort', 'N/A')}")
                
                # Get health status
                if hasattr(container.attrs, 'State') and 'Health' in container.attrs.get('State', {}):
                    service_info['health'] = container.attrs['State']['Health']['Status'].lower()
                elif container.status == 'running':
                    service_info['health'] = 'healthy'
                else:
                    service_info['health'] = 'unhealthy'
                
                aurex_services.append(service_info)
        
        # Group services by category
        grouped_services = {}
        for service in aurex_services:
            category = service['category']
            if category not in grouped_services:
                grouped_services[category] = []
            grouped_services[category].append(service)
        
        return {
            "services": aurex_services,
            "grouped_services": grouped_services,
            "total_services": len(aurex_services),
            "services_by_status": {
                "running": len([s for s in aurex_services if s['status'] == 'running']),
                "stopped": len([s for s in aurex_services if s['status'] != 'running']),
                "healthy": len([s for s in aurex_services if s['health'] == 'healthy']),
                "unhealthy": len([s for s in aurex_services if s['health'] in ['unhealthy', 'starting']])
            }
        }
        
    except Exception as e:
        logger.error(f"Error fetching Aurex services: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch services: {str(e)}")

@router.get("/health/summary")
async def get_health_summary(current_user: User = Depends(get_current_admin_user)):
    """Get overall infrastructure health summary"""
    
    try:
        # Get infrastructure stats
        stats_response = await get_infrastructure_stats(current_user)
        
        # Get Aurex services
        services_response = await get_aurex_services(current_user)
        
        # Calculate health scores
        total_containers = stats_response['total_containers']
        running_containers = stats_response['running_containers']
        healthy_containers = stats_response['healthy_containers']
        
        availability_score = (running_containers / total_containers * 100) if total_containers > 0 else 0
        health_score = (healthy_containers / total_containers * 100) if total_containers > 0 else 0
        
        # System resource health
        system_stats = stats_response['system_stats']
        cpu_health = 100 - system_stats['system_cpu_percent']
        memory_health = 100 - system_stats['system_memory_percent']
        disk_health = 100 - system_stats['disk_percent']
        
        resource_health = (cpu_health + memory_health + disk_health) / 3
        
        # Overall health score
        overall_health = (availability_score + health_score + resource_health) / 3
        
        # Determine health status
        if overall_health >= 90:
            health_status = "excellent"
        elif overall_health >= 75:
            health_status = "good"
        elif overall_health >= 60:
            health_status = "fair"
        else:
            health_status = "poor"
        
        return {
            "overall_health": round(overall_health, 2),
            "health_status": health_status,
            "scores": {
                "availability": round(availability_score, 2),
                "health": round(health_score, 2),
                "resources": round(resource_health, 2)
            },
            "metrics": {
                "total_containers": total_containers,
                "running_containers": running_containers,
                "healthy_containers": healthy_containers,
                "cpu_usage": system_stats['system_cpu_percent'],
                "memory_usage": system_stats['system_memory_percent'],
                "disk_usage": system_stats['disk_percent']
            },
            "services_summary": services_response['services_by_status'],
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error generating health summary: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate health summary: {str(e)}")