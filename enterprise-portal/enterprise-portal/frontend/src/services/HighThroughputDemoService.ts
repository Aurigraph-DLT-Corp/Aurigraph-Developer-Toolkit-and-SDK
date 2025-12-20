/**
 * High-Throughput Demo Service
 *
 * Manages communication with Aurigraph V11 backend demo endpoints
 * Handles multi-channel configurations, node management, and performance metrics
 *
 * @version 1.0.0
 */

import axios, { AxiosInstance } from 'axios';

// ==================== TYPES ====================

export interface NodeConfig {
  nodeId: string;
  nodeType: 'validator' | 'business' | 'slim';
  name: string;
  enabled: boolean;
  port: number;
  cpuAllocation: number;
  memoryAllocation: number;
  maxConnections: number;
  consensusParticipation: boolean;
}

export interface ChannelConfig {
  channelId: string;
  name: string;
  createdAt: number;
  validatorNodes: NodeConfig[];
  businessNodes: NodeConfig[];
  slimNodes: NodeConfig[];
  enabled: boolean;
}

export interface TransactionMetric {
  timestamp: number;
  tps: number;
  avgLatency: number;
  successRate: number;
  cpuUsage: number;
  memoryUsage: number;
}

export interface NodeMetric {
  nodeId: string;
  nodeType: string;
  status: 'healthy' | 'degraded' | 'offline';
  tps: number;
  latency: number;
  cpuUsage: number;
  memoryUsage: number;
  transactionsProcessed: number;
  errorsCount: number;
}

export interface DemoChannelState {
  channelId: string;
  isRunning: boolean;
  createdAt: number;
  transactionCount: number;
  peakTPS: number;
  averageLatency: number;
  nodeMetrics: NodeMetric[];
}

export interface DemoResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: number;
}

// ==================== SERVICE ====================

class HighThroughputDemoService {
  private apiClient: AxiosInstance;
  private baseURL: string;
  private apiKey: string = 'sk_test_dev_key_12345'; // From Credentials.md

  constructor() {
    // Always use HTTPS in production, check both protocol and hostname
    const isProduction = typeof window !== 'undefined' &&
      (window.location.protocol === 'https:' || window.location.hostname === 'dlt.aurigraph.io');
    this.baseURL = isProduction
      ? 'https://dlt.aurigraph.io/api/v11'
      : (import.meta.env.VITE_API_URL || 'http://localhost:9003') + '/api/v11';

    this.apiClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        'X-Internal-Request': 'true',
        // Note: Authorization header removed due to backend auth issues
        // Backend requires valid JWT but current token format is not recognized
        // TODO: Update with valid JWT token once authentication is properly configured
      },
    });

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[HighThroughputDemoService] API Error:', error.response?.data || error.message);
        // Log authentication errors specifically for debugging
        if (error.response?.status === 401) {
          console.error('[HighThroughputDemoService] Authentication Error (401):', error.response?.data?.error);
        }
        throw error;
      }
    );
  }

  // ==================== CHANNEL MANAGEMENT ====================

  /**
   * Create a new demo channel with specified node configuration
   */
  async createDemoChannel(config: {
    name: string;
    validatorNodeCount: number;
    businessNodeCount: number;
    slimNodeCount: number;
  }): Promise<ChannelConfig> {
    try {
      const response = await this.apiClient.post<DemoResponse<ChannelConfig>>(
        '/demo/channels/create',
        {
          channelName: config.name,
          validatorNodeCount: config.validatorNodeCount,
          businessNodeCount: config.businessNodeCount,
          slimNodeCount: config.slimNodeCount,
          timestamp: Date.now(),
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Failed to create demo channel:', error);
      throw error;
    }
  }

  /**
   * Get all active demo channels
   */
  async listDemoChannels(): Promise<ChannelConfig[]> {
    try {
      const response = await this.apiClient.get<DemoResponse<ChannelConfig[]>>('/demo/channels');
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to list demo channels:', error);
      // Return empty array on error for graceful degradation
      return [];
    }
  }

  /**
   * Get specific demo channel details
   */
  async getDemoChannel(channelId: string): Promise<ChannelConfig> {
    try {
      const response = await this.apiClient.get<DemoResponse<ChannelConfig>>(
        `/demo/channels/${channelId}`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to get demo channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Update demo channel configuration
   */
  async updateChannelConfig(
    channelId: string,
    config: Partial<ChannelConfig>
  ): Promise<ChannelConfig> {
    try {
      const response = await this.apiClient.put<DemoResponse<ChannelConfig>>(
        `/demo/channels/${channelId}`,
        config
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to update demo channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a demo channel
   */
  async deleteDemoChannel(channelId: string): Promise<boolean> {
    try {
      await this.apiClient.delete(`/demo/channels/${channelId}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete demo channel ${channelId}:`, error);
      throw error;
    }
  }

  // ==================== DEMO EXECUTION ====================

  /**
   * Start high-throughput simulation on a channel
   */
  async startDemoSimulation(channelId: string, targetTPS: number): Promise<DemoChannelState> {
    try {
      const response = await this.apiClient.post<DemoResponse<DemoChannelState>>(
        `/demo/channels/${channelId}/start`,
        {
          targetTPS,
          enableAIOptimization: true,
          enableQuantumSecurity: true,
          timestamp: Date.now(),
        }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to start demo simulation on channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Stop demo simulation
   */
  async stopDemoSimulation(channelId: string): Promise<void> {
    try {
      await this.apiClient.post(`/demo/channels/${channelId}/stop`);
    } catch (error) {
      console.error(`Failed to stop demo simulation on channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Get current demo channel state
   */
  async getDemoChannelState(channelId: string): Promise<DemoChannelState> {
    try {
      const response = await this.apiClient.get<DemoResponse<DemoChannelState>>(
        `/demo/channels/${channelId}/state`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to get demo channel state for ${channelId}:`, error);
      throw error;
    }
  }

  // ==================== METRICS & MONITORING ====================

  /**
   * Get real-time metrics for a demo channel
   */
  async getDemoMetrics(channelId: string): Promise<TransactionMetric[]> {
    try {
      const response = await this.apiClient.get<DemoResponse<TransactionMetric[]>>(
        `/demo/channels/${channelId}/metrics`
      );
      return response.data.data || [];
    } catch (error) {
      console.error(`Failed to get demo metrics for ${channelId}:`, error);
      return [];
    }
  }

  /**
   * Get node-level metrics
   */
  async getNodeMetrics(channelId: string): Promise<NodeMetric[]> {
    try {
      const response = await this.apiClient.get<DemoResponse<NodeMetric[]>>(
        `/demo/channels/${channelId}/nodes/metrics`
      );
      return response.data.data || [];
    } catch (error) {
      console.error(`Failed to get node metrics for ${channelId}:`, error);
      return [];
    }
  }

  /**
   * Get performance report for a demo
   */
  async getDemoPerformanceReport(channelId: string): Promise<{
    peakTPS: number;
    averageLatency: number;
    successRate: number;
    totalTransactions: number;
    duration: number;
  }> {
    try {
      const response = await this.apiClient.get<
        DemoResponse<{
          peakTPS: number;
          averageLatency: number;
          successRate: number;
          totalTransactions: number;
          duration: number;
        }>
      >(`/demo/channels/${channelId}/report`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to get demo performance report for ${channelId}:`, error);
      throw error;
    }
  }

  // ==================== NODE MANAGEMENT ====================

  /**
   * Enable/disable specific nodes
   */
  async updateNodeStatus(
    channelId: string,
    nodeId: string,
    enabled: boolean
  ): Promise<NodeConfig> {
    try {
      const response = await this.apiClient.put<DemoResponse<NodeConfig>>(
        `/demo/channels/${channelId}/nodes/${nodeId}`,
        { enabled }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to update node ${nodeId} status:`, error);
      throw error;
    }
  }

  /**
   * Get all nodes in a channel
   */
  async getChannelNodes(channelId: string): Promise<NodeConfig[]> {
    try {
      const response = await this.apiClient.get<DemoResponse<NodeConfig[]>>(
        `/demo/channels/${channelId}/nodes`
      );
      return response.data.data || [];
    } catch (error) {
      console.error(`Failed to get nodes for channel ${channelId}:`, error);
      return [];
    }
  }

  /**
   * Get nodes by type
   */
  async getNodesByType(
    channelId: string,
    nodeType: 'validator' | 'business' | 'slim'
  ): Promise<NodeConfig[]> {
    try {
      const response = await this.apiClient.get<DemoResponse<NodeConfig[]>>(
        `/demo/channels/${channelId}/nodes`,
        {
          params: { type: nodeType },
        }
      );
      return response.data.data || [];
    } catch (error) {
      console.error(`Failed to get ${nodeType} nodes for channel ${channelId}:`, error);
      return [];
    }
  }

  // ==================== AI OPTIMIZATION ====================

  /**
   * Enable/disable AI optimization for a channel
   */
  async setAIOptimization(channelId: string, enabled: boolean): Promise<void> {
    try {
      await this.apiClient.post(`/demo/channels/${channelId}/ai/optimization`, {
        enabled,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`Failed to set AI optimization for channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Get AI optimization metrics
   */
  async getAIOptimizationMetrics(channelId: string): Promise<{
    enabled: boolean;
    tpsImprovement: number;
    latencyReduction: number;
    consensusOptimization: number;
  }> {
    try {
      const response = await this.apiClient.get<
        DemoResponse<{
          enabled: boolean;
          tpsImprovement: number;
          latencyReduction: number;
          consensusOptimization: number;
        }>
      >(`/demo/channels/${channelId}/ai/metrics`);
      return response.data.data;
    } catch (error) {
      console.error(`Failed to get AI optimization metrics for ${channelId}:`, error);
      throw error;
    }
  }

  // ==================== EXPORT & REPORTING ====================

  /**
   * Export demo metrics as JSON
   */
  async exportMetricsJSON(channelId: string): Promise<Blob> {
    try {
      const response = await this.apiClient.get(`/demo/channels/${channelId}/export`, {
        params: { format: 'json' },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to export metrics for ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Export demo metrics as CSV
   */
  async exportMetricsCSV(channelId: string): Promise<Blob> {
    try {
      const response = await this.apiClient.get(`/demo/channels/${channelId}/export`, {
        params: { format: 'csv' },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to export metrics as CSV for ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Download performance report
   */
  async downloadPerformanceReport(channelId: string): Promise<void> {
    try {
      const report = await this.getDemoPerformanceReport(channelId);
      const element = document.createElement('a');
      element.setAttribute(
        'href',
        'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2))
      );
      element.setAttribute('download', `demo-report-${channelId}-${Date.now()}.json`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.error(`Failed to download performance report for ${channelId}:`, error);
      throw error;
    }
  }

  // ==================== HEALTH & STATUS ====================

  /**
   * Check health of demo infrastructure
   */
  async checkDemoHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    activeChannels: number;
    totalNodes: number;
    systemLoad: number;
  }> {
    try {
      const response = await this.apiClient.get<
        DemoResponse<{
          status: 'healthy' | 'degraded' | 'unhealthy';
          activeChannels: number;
          totalNodes: number;
          systemLoad: number;
        }>
      >('/demo/health');
      return response.data.data;
    } catch (error) {
      console.error('Failed to check demo health:', error);
      throw error;
    }
  }

  /**
   * Get demo system statistics
   */
  async getDemoStats(): Promise<{
    totalChannels: number;
    activeChannels: number;
    totalNodes: number;
    totalTransactions: number;
    peakSystemTPS: number;
  }> {
    try {
      const response = await this.apiClient.get<
        DemoResponse<{
          totalChannels: number;
          activeChannels: number;
          totalNodes: number;
          totalTransactions: number;
          peakSystemTPS: number;
        }>
      >('/demo/stats');
      return response.data.data;
    } catch (error) {
      console.error('Failed to get demo stats:', error);
      throw error;
    }
  }

  // ==================== CRM REGISTRATION ====================

  /**
   * Register demo user with company and contact details
   * Data is stored in CRM system for follow-up and marketing purposes
   */
  async registerDemoUser(data: {
    fullName: string;
    email: string;
    company: string;
    jobTitle: string;
    phone: string;
    country: string;
    demoMetrics?: {
      channelId: string;
      peakTps: number;
      avgLatency: number;
      successRate: number;
      duration: number;
      nodeCount: number;
    };
  }): Promise<{
    success: boolean;
    registrationId: string;
    message: string;
  }> {
    try {
      const response = await this.apiClient.post<
        DemoResponse<{
          registrationId: string;
          message: string;
        }>
      >('/demo/users/register', {
        fullName: data.fullName,
        email: data.email,
        company: data.company,
        jobTitle: data.jobTitle,
        phone: data.phone,
        country: data.country,
        demoMetrics: data.demoMetrics || null,
        timestamp: Date.now(),
        source: 'demo-app',
      });

      return {
        success: response.data.success,
        registrationId: response.data.data.registrationId,
        message: response.data.data.message,
      };
    } catch (error) {
      console.error('Failed to register demo user:', error);
      throw error;
    }
  }

  /**
   * Get user registration by ID
   */
  async getUserRegistration(registrationId: string): Promise<{
    fullName: string;
    email: string;
    company: string;
    jobTitle: string;
    phone: string;
    country: string;
    demoMetrics: {
      channelId: string;
      peakTps: number;
      avgLatency: number;
      successRate: number;
      duration: number;
      nodeCount: number;
    } | null;
    registeredAt: number;
  }> {
    try {
      const response = await this.apiClient.get<DemoResponse<any>>(
        `/demo/users/${registrationId}`
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to get registration ${registrationId}:`, error);
      throw error;
    }
  }

  /**
   * Track social media share event for analytics
   */
  async trackSocialShare(data: {
    registrationId: string;
    platform: 'linkedin' | 'facebook' | 'twitter' | 'instagram';
    sharedAt: number;
  }): Promise<void> {
    try {
      await this.apiClient.post('/demo/users/track-share', {
        registrationId: data.registrationId,
        platform: data.platform,
        sharedAt: data.sharedAt,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Failed to track social share:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Get registered user by email (for CRM integration)
   */
  async getUserByEmail(email: string): Promise<{
    registrationId: string;
    fullName: string;
    company: string;
    jobTitle: string;
    totalDemos: number;
    lastDemoDate: number;
  } | null> {
    try {
      const response = await this.apiClient.get<DemoResponse<any>>(
        '/demo/users/by-email',
        {
          params: { email },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error(`Failed to get user by email ${email}:`, error);
      return null;
    }
  }

  /**
   * Export demo results for CRM
   */
  async exportDemoResultsForCRM(registrationId: string): Promise<Blob> {
    try {
      const response = await this.apiClient.get(
        `/demo/users/${registrationId}/export`,
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to export results for ${registrationId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const highThroughputDemoService = new HighThroughputDemoService();
export default HighThroughputDemoService;
