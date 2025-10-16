/**
 * Channel Service
 *
 * Manages blockchain channels for multi-channel architecture
 */

import { API_BASE_URL } from '../utils/constants';

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private' | 'consortium';
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: string;
  nodeCount: number;
  transactionCount: number;
  config?: {
    consensusAlgorithm?: string;
    blockTime?: number;
    maxBlockSize?: number;
  };
}

export interface ChannelStats {
  totalChannels: number;
  activeChannels: number;
  totalTransactions: number;
  avgLatency: number;
}

class ChannelService {
  private baseUrl: string;
  private demoMode: boolean;
  private channels: Channel[] | null = null;

  constructor(baseUrl: string = API_BASE_URL, demoMode: boolean = false) {
    this.baseUrl = baseUrl;
    this.demoMode = demoMode;
  }

  /**
   * Enable or disable demo mode
   */
  setDemoMode(enabled: boolean) {
    this.demoMode = enabled;
    // Clear cache when mode changes
    this.channels = null;
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    maxRetries: number = 3
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        if (response.ok) {
          return await response.json();
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        if (attempt < maxRetries - 1) {
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        } else {
          throw error;
        }
      }
    }
    throw new Error('Max retries exceeded');
  }

  /**
   * Get all channels
   */
  getAllChannels(): Channel[] {
    // Return cached channels if available
    if (this.channels) {
      return this.channels;
    }

    // Generate mock channels for demo/fallback
    this.channels = this.generateMockChannels();
    return this.channels;
  }

  /**
   * Get all channels asynchronously from backend
   */
  async fetchChannels(): Promise<Channel[]> {
    if (this.demoMode) {
      this.channels = this.generateMockChannels();
      return this.channels;
    }

    try {
      const data = await this.fetchWithRetry<{ channels: Channel[] }>('/api/v11/channels');
      this.channels = data.channels;
      return this.channels;
    } catch (error) {
      console.error('Failed to fetch channels:', error);
      // Fallback to mock data
      this.channels = this.generateMockChannels();
      return this.channels;
    }
  }

  /**
   * Get channel by ID
   */
  async getChannel(channelId: string): Promise<Channel | null> {
    if (this.demoMode) {
      return this.generateMockChannels().find((c) => c.id === channelId) || null;
    }

    try {
      return await this.fetchWithRetry<Channel>(`/api/v11/channels/${channelId}`);
    } catch (error) {
      console.error(`Failed to fetch channel ${channelId}:`, error);
      return null;
    }
  }

  /**
   * Get channel statistics
   */
  async getChannelStats(): Promise<ChannelStats> {
    if (this.demoMode) {
      return this.generateMockStats();
    }

    try {
      return await this.fetchWithRetry<ChannelStats>('/api/v11/channels/stats');
    } catch (error) {
      console.error('Failed to fetch channel stats:', error);
      return this.generateMockStats();
    }
  }

  /**
   * Create a new channel
   */
  async createChannel(request: {
    name: string;
    description?: string;
    type: 'public' | 'private' | 'consortium';
    config?: Record<string, any>;
  }): Promise<Channel> {
    if (this.demoMode) {
      return this.generateMockChannel(request.name, request.type);
    }

    try {
      const channel = await this.fetchWithRetry<Channel>('/api/v11/channels/create', {
        method: 'POST',
        body: JSON.stringify(request),
      });
      // Invalidate cache
      this.channels = null;
      return channel;
    } catch (error) {
      console.error('Failed to create channel:', error);
      throw error;
    }
  }

  // ==========================================================================
  // Mock Data Generators (Demo Mode)
  // ==========================================================================

  private generateMockChannels(): Channel[] {
    return [
      {
        id: 'main',
        name: 'Main Channel',
        description: 'Primary public blockchain channel',
        type: 'public',
        status: 'active',
        createdAt: '2025-01-01T00:00:00Z',
        nodeCount: 25,
        transactionCount: 5000000,
        config: {
          consensusAlgorithm: 'HyperRAFT++',
          blockTime: 3,
          maxBlockSize: 4096,
        },
      },
      {
        id: 'finance',
        name: 'Finance Channel',
        description: 'Private channel for financial transactions',
        type: 'private',
        status: 'active',
        createdAt: '2025-01-15T00:00:00Z',
        nodeCount: 10,
        transactionCount: 2000000,
        config: {
          consensusAlgorithm: 'HyperRAFT++',
          blockTime: 2,
          maxBlockSize: 2048,
        },
      },
      {
        id: 'supply-chain',
        name: 'Supply Chain Channel',
        description: 'Consortium channel for supply chain tracking',
        type: 'consortium',
        status: 'active',
        createdAt: '2025-02-01T00:00:00Z',
        nodeCount: 15,
        transactionCount: 1500000,
        config: {
          consensusAlgorithm: 'HyperRAFT++',
          blockTime: 5,
          maxBlockSize: 8192,
        },
      },
      {
        id: 'iot',
        name: 'IoT Channel',
        description: 'Channel for IoT device data',
        type: 'public',
        status: 'active',
        createdAt: '2025-03-01T00:00:00Z',
        nodeCount: 30,
        transactionCount: 10000000,
        config: {
          consensusAlgorithm: 'HyperRAFT++',
          blockTime: 1,
          maxBlockSize: 1024,
        },
      },
      {
        id: 'governance',
        name: 'Governance Channel',
        description: 'Channel for governance and voting',
        type: 'consortium',
        status: 'active',
        createdAt: '2025-03-15T00:00:00Z',
        nodeCount: 12,
        transactionCount: 500000,
        config: {
          consensusAlgorithm: 'HyperRAFT++',
          blockTime: 10,
          maxBlockSize: 2048,
        },
      },
      {
        id: 'test',
        name: 'Test Channel',
        description: 'Testing and development channel',
        type: 'private',
        status: 'maintenance',
        createdAt: '2025-04-01T00:00:00Z',
        nodeCount: 5,
        transactionCount: 100000,
        config: {
          consensusAlgorithm: 'HyperRAFT++',
          blockTime: 1,
          maxBlockSize: 512,
        },
      },
    ];
  }

  private generateMockChannel(name: string, type: 'public' | 'private' | 'consortium'): Channel {
    return {
      id: `channel-${Date.now()}`,
      name,
      type,
      status: 'active',
      createdAt: new Date().toISOString(),
      nodeCount: Math.floor(Math.random() * 20) + 5,
      transactionCount: Math.floor(Math.random() * 1000000),
      config: {
        consensusAlgorithm: 'HyperRAFT++',
        blockTime: Math.floor(Math.random() * 5) + 1,
        maxBlockSize: 2048,
      },
    };
  }

  private generateMockStats(): ChannelStats {
    const channels = this.generateMockChannels();
    return {
      totalChannels: channels.length,
      activeChannels: channels.filter((c) => c.status === 'active').length,
      totalTransactions: channels.reduce((sum, c) => sum + c.transactionCount, 0),
      avgLatency: 12.5 + Math.random() * 5,
    };
  }
}

// Export singleton instance
export const channelService = new ChannelService();
export default ChannelService;
