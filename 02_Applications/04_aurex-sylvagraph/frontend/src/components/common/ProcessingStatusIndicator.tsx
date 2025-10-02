/**
 * Aurex Sylvagraph - Processing Status Indicator Component
 * Real-time status display for satellite data processing and drone operations
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  Satellite, 
  Drone,
  Database,
  Zap,
  TrendingUp
} from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface ProcessingJob {
  job_id: string;
  job_name: string;
  job_type: string;
  project_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'archived';
  priority: number;
  progress_percentage: number;
  current_step: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  estimated_completion?: string;
  error_message?: string;
  service_type: 'satellite' | 'drone' | 'ipfs' | 'general';
}

interface ServiceStatus {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  details?: any;
  last_updated: string;
}

interface ProcessingStatusIndicatorProps {
  projectId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  showServices?: boolean;
  compact?: boolean;
}

export const ProcessingStatusIndicator: React.FC<ProcessingStatusIndicatorProps> = ({
  projectId,
  autoRefresh = true,
  refreshInterval = 5000,
  showServices = true,
  compact = false
}) => {
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch processing jobs
  const fetchJobs = useCallback(async () => {
    try {
      // Mock implementation - in real app this would fetch from API
      const mockJobs: ProcessingJob[] = [
        {
          job_id: 'sat_001',
          job_name: 'Sentinel-2 Analysis',
          job_type: 'vegetation_indices',
          project_id: projectId || 'proj-123',
          status: 'processing',
          priority: 1,
          progress_percentage: 65,
          current_step: 'Calculating NDVI',
          created_at: new Date(Date.now() - 300000).toISOString(),
          started_at: new Date(Date.now() - 240000).toISOString(),
          estimated_completion: new Date(Date.now() + 180000).toISOString(),
          service_type: 'satellite'
        },
        {
          job_id: 'drone_002',
          job_name: 'Orthomosaic Generation',
          job_type: 'orthomosaic',
          project_id: projectId || 'proj-123',
          status: 'completed',
          priority: 2,
          progress_percentage: 100,
          current_step: 'Completed',
          created_at: new Date(Date.now() - 1800000).toISOString(),
          started_at: new Date(Date.now() - 1740000).toISOString(),
          completed_at: new Date(Date.now() - 300000).toISOString(),
          service_type: 'drone'
        },
        {
          job_id: 'ipfs_003',
          job_name: 'Document Storage',
          job_type: 'upload',
          project_id: projectId || 'proj-123',
          status: 'pending',
          priority: 0,
          progress_percentage: 0,
          current_step: 'Queued',
          created_at: new Date().toISOString(),
          service_type: 'ipfs'
        }
      ];

      if (projectId) {
        setJobs(mockJobs.filter(job => job.project_id === projectId));
      } else {
        setJobs(mockJobs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch jobs');
    }
  }, [projectId]);

  // Fetch service status
  const fetchServiceStatus = useCallback(async () => {
    try {
      // Mock implementation - in real app this would fetch from multiple health endpoints
      const mockServices: ServiceStatus[] = [
        {
          service: 'remote_sensing',
          status: 'healthy',
          details: { earth_engine: { initialized: true, connection: 'connected' } },
          last_updated: new Date().toISOString()
        },
        {
          service: 'drone_operations',
          status: 'healthy',
          details: { fleet_management: 'operational', flight_planning: 'operational' },
          last_updated: new Date().toISOString()
        },
        {
          service: 'ipfs',
          status: 'healthy',
          details: { status: 'connected', version: '0.14.0' },
          last_updated: new Date().toISOString()
        }
      ];

      setServices(mockServices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service status');
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchJobs(),
        showServices ? fetchServiceStatus() : Promise.resolve()
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  }, [fetchJobs, fetchServiceStatus, showServices]);

  // Auto refresh effect
  useEffect(() => {
    refreshData();

    if (autoRefresh) {
      const interval = setInterval(refreshData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshData, autoRefresh, refreshInterval]);

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  // Get service icon
  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'remote_sensing':
        return <Satellite className="w-4 h-4" />;
      case 'drone_operations':
        return <Drone className="w-4 h-4" />;
      case 'ipfs':
        return <Database className="w-4 h-4" />;
      default:
        return <Zap className="w-4 h-4" />;
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'unhealthy':
        return 'bg-red-100 text-red-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - time.getTime()) / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  // Get active jobs count
  const activeJobsCount = jobs.filter(job => 
    job.status === 'processing' || job.status === 'pending'
  ).length;

  if (compact) {
    return (
      <div className="flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium">Processing</span>
        </div>
        
        <Badge className={getStatusBadgeColor(activeJobsCount > 0 ? 'processing' : 'completed')}>
          {activeJobsCount} active jobs
        </Badge>

        {showServices && (
          <div className="flex items-center gap-1">
            {services.map(service => (
              <div
                key={service.service}
                className={`w-2 h-2 rounded-full ${
                  service.status === 'healthy' ? 'bg-green-400' : 
                  service.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                title={`${service.service}: ${service.status}`}
              />
            ))}
          </div>
        )}

        <Button
          onClick={refreshData}
          variant="ghost"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Processing Status
        </h3>
        <Button
          onClick={refreshData}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-red-700 text-sm">{error}</div>
        </Card>
      )}

      {/* Services Status */}
      {showServices && services.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">Services Health</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {services.map(service => (
              <div key={service.service} className="flex items-center gap-3">
                {getServiceIcon(service.service)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium capitalize">
                    {service.service.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-gray-500">
                    Updated {formatTimeAgo(service.last_updated)}
                  </div>
                </div>
                <Badge className={getStatusBadgeColor(service.status)}>
                  {service.status}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Processing Jobs */}
      <Card className="p-4">
        <h4 className="font-medium mb-3">Processing Jobs</h4>
        
        {jobs.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No processing jobs found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => (
              <div
                key={job.job_id}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
              >
                {getStatusIcon(job.status)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{job.job_name}</span>
                    <Badge className={getStatusBadgeColor(job.status)}>
                      {job.status}
                    </Badge>
                    {job.priority > 0 && (
                      <Badge variant="outline">
                        Priority {job.priority}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mt-1">
                    {job.current_step}
                  </div>
                  
                  {job.status === 'processing' && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span>{job.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-1">
                    Created {formatTimeAgo(job.created_at)}
                    {job.estimated_completion && job.status === 'processing' && (
                      <span className="ml-2">
                        • ETA {formatTimeAgo(job.estimated_completion)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getServiceIcon(job.service_type)}
                  <span className="text-xs text-gray-500 capitalize">
                    {job.service_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProcessingStatusIndicator;