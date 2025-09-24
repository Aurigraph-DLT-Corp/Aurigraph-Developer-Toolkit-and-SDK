import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_ADMIN_API_URL || 'http://localhost:8005';

export interface ContainerStatus {
  id: string;
  name: string;
  image: string;
  status: 'running' | 'stopped' | 'starting' | 'error';
  health: 'healthy' | 'unhealthy' | 'starting' | 'none';
  created: string;
  ports: string[];
  networks: string[];
  mounts: string[];
  cpu_percent: number;
  memory_percent: number;
  memory_usage: string;
  memory_limit: string;
  network_io: {
    rx_bytes: number;
    tx_bytes: number;
  };
  disk_io: {
    read_bytes: number;
    write_bytes: number;
  };
  uptime: string;
  labels: Record<string, string>;
}

export interface InfrastructureStats {
  total_containers: number;
  running_containers: number;
  stopped_containers: number;
  healthy_containers: number;
  unhealthy_containers: number;
  total_cpu_usage: number;
  total_memory_usage: number;
  total_memory_limit: number;
  total_disk_usage: number;
  network_usage: {
    total_rx: number;
    total_tx: number;
  };
}

export interface ContainerLogs {
  container_id: string;
  container_name: string;
  logs: Array<{
    timestamp: string;
    level: string;
    message: string;
    source: string;
  }>;
  total_lines: number;
}

class ContainerService {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: `${API_BASE_URL}/api/v1`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async getAllContainers(): Promise<ContainerStatus[]> {
    try {
      const response = await this.axiosInstance.get('/containers');
      return response.data.containers || [];
    } catch (error) {
      console.error('Failed to fetch containers:', error);
      throw error;
    }
  }

  async getContainer(containerId: string): Promise<ContainerStatus> {
    try {
      const response = await this.axiosInstance.get(`/containers/${containerId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch container:', error);
      throw error;
    }
  }

  async getInfrastructureStats(): Promise<InfrastructureStats> {
    try {
      const response = await this.axiosInstance.get('/infrastructure/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch infrastructure stats:', error);
      throw error;
    }
  }

  async controlContainer(containerId: string, action: 'start' | 'stop' | 'restart'): Promise<void> {
    try {
      await this.axiosInstance.post(`/containers/${containerId}/${action}`);
    } catch (error) {
      console.error(`Failed to ${action} container:`, error);
      throw error;
    }
  }

  async getContainerLogs(
    containerId: string, 
    lines: number = 100,
    since?: string,
    until?: string
  ): Promise<ContainerLogs> {
    try {
      const params = new URLSearchParams({
        lines: lines.toString(),
      });
      
      if (since) params.append('since', since);
      if (until) params.append('until', until);

      const response = await this.axiosInstance.get(`/containers/${containerId}/logs?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch container logs:', error);
      throw error;
    }
  }

  async getContainerMetrics(containerId: string, timeRange: string = '1h'): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/containers/${containerId}/metrics?range=${timeRange}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch container metrics:', error);
      throw error;
    }
  }

  async executeCommand(containerId: string, command: string): Promise<{ output: string; exit_code: number }> {
    try {
      const response = await this.axiosInstance.post(`/containers/${containerId}/exec`, {
        command,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to execute command:', error);
      throw error;
    }
  }

  async getDockerSystemInfo(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/docker/system/info');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch Docker system info:', error);
      throw error;
    }
  }

  async getDockerImages(): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get('/docker/images');
      return response.data.images || [];
    } catch (error) {
      console.error('Failed to fetch Docker images:', error);
      throw error;
    }
  }

  async getDockerVolumes(): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get('/docker/volumes');
      return response.data.volumes || [];
    } catch (error) {
      console.error('Failed to fetch Docker volumes:', error);
      throw error;
    }
  }

  async getDockerNetworks(): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get('/docker/networks');
      return response.data.networks || [];
    } catch (error) {
      console.error('Failed to fetch Docker networks:', error);
      throw error;
    }
  }

  async pruneSystem(options: {
    containers?: boolean;
    images?: boolean;
    volumes?: boolean;
    networks?: boolean;
  } = {}): Promise<{ message: string; reclaimed_space: number }> {
    try {
      const response = await this.axiosInstance.post('/docker/prune', options);
      return response.data;
    } catch (error) {
      console.error('Failed to prune Docker system:', error);
      throw error;
    }
  }

  async deployService(serviceName: string, options: any = {}): Promise<void> {
    try {
      await this.axiosInstance.post(`/services/${serviceName}/deploy`, options);
    } catch (error) {
      console.error('Failed to deploy service:', error);
      throw error;
    }
  }

  async scaleService(serviceName: string, replicas: number): Promise<void> {
    try {
      await this.axiosInstance.post(`/services/${serviceName}/scale`, { replicas });
    } catch (error) {
      console.error('Failed to scale service:', error);
      throw error;
    }
  }

  async getServiceStatus(serviceName: string): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/services/${serviceName}/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get service status:', error);
      throw error;
    }
  }

  async getHealthChecks(): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get('/health/checks');
      return response.data.checks || [];
    } catch (error) {
      console.error('Failed to fetch health checks:', error);
      throw error;
    }
  }

  async runHealthCheck(checkName?: string): Promise<any> {
    try {
      const response = await this.axiosInstance.post('/health/run', { check: checkName });
      return response.data;
    } catch (error) {
      console.error('Failed to run health check:', error);
      throw error;
    }
  }

  async getBackupStatus(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/backup/status');
      return response.data;
    } catch (error) {
      console.error('Failed to get backup status:', error);
      throw error;
    }
  }

  async triggerBackup(type: 'full' | 'postgres' | 'redis' | 'app-data'): Promise<void> {
    try {
      await this.axiosInstance.post('/backup/trigger', { type });
    } catch (error) {
      console.error('Failed to trigger backup:', error);
      throw error;
    }
  }

  async getSecurityStatus(): Promise<any> {
    try {
      const response = await this.axiosInstance.get('/security/status');
      return response.data;
    } catch (error) {
      console.error('Failed to get security status:', error);
      throw error;
    }
  }

  async getAlerts(limit: number = 50): Promise<any[]> {
    try {
      const response = await this.axiosInstance.get(`/alerts?limit=${limit}`);
      return response.data.alerts || [];
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      throw error;
    }
  }
}

export const containerService = new ContainerService();