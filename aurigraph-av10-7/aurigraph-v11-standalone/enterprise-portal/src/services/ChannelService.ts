// Channel Service - Core multi-channel management (HTTP-only implementation)

// Simple EventEmitter implementation for browser
class EventEmitter {
  private events: Map<string, Function[]> = new Map();

  on(event: string, listener: Function) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
  }

  off(event: string, listener: Function) {
    const listeners = this.events.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]) {
    const listeners = this.events.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }
}

export interface Channel {
  id: string;
  name: string;
  type: 'public' | 'private' | 'consortium';
  status: 'active' | 'inactive' | 'pending';
  config: ChannelConfig;
  metrics: ChannelMetrics;
  participants: Participant[];
  smartContracts: SmartContract[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChannelConfig {
  consensusType: 'hyperraft' | 'pbft' | 'raft';
  blockSize: number;
  blockTimeout: number;
  maxMessageCount: number;
  batchTimeout: number;
  maxChannels: number;
  targetTps: number;
  privacyLevel: 'public' | 'private' | 'confidential';
  endorsementPolicy: string;
  cryptoConfig: {
    algorithm: string;
    keySize: number;
    quantumResistant: boolean;
  };
}

export interface ChannelMetrics {
  tps: number;
  totalTransactions: number;
  blockHeight: number;
  latency: number;
  throughput: number;
  nodeCount: number;
  activeContracts: number;
  storageUsed: number;
}

export interface Participant {
  id: string;
  name: string;
  role: 'admin' | 'validator' | 'observer' | 'business';
  publicKey: string;
  endpoint: string;
  status: 'online' | 'offline';
  joinedAt: Date;
}

export interface SmartContract {
  id: string;
  name: string;
  version: string;
  channelId: string;
  status: 'deployed' | 'pending' | 'failed';
  language: 'solidity' | 'golang' | 'javascript';
  endorsers: string[];
}

class ChannelServiceClass extends EventEmitter {
  private channels: Map<string, Channel> = new Map();
  private activeChannel: string | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeDefaultChannels();
    this.startPolling();
  }

  private startPolling() {
    // Use HTTP polling for real-time updates (every 30 seconds to avoid rate limiting)
    this.pollingInterval = setInterval(() => {
      this.fetchChannelUpdates();
    }, 30000);

    // Initial fetch after short delay
    setTimeout(() => this.fetchChannelUpdates(), 2000);
  }

  private async fetchChannelUpdates() {
    try {
      // Fetch channel metrics from backend API
      const response = await fetch('https://dlt.aurigraph.io/api/v12/channels');
      if (response.ok) {
        const data = await response.json();
        // Update channels with fetched data
        if (data && Array.isArray(data)) {
          data.forEach((channelData: any) => {
            const existingChannel = this.channels.get(channelData.id);
            if (existingChannel && channelData.metrics) {
              existingChannel.metrics = { ...existingChannel.metrics, ...channelData.metrics };
              this.emit('metrics_updated', { channelId: channelData.id, metrics: existingChannel.metrics });
            }
          });
        }
      }
    } catch (error) {
      // If API is unavailable, use local simulation
      this.simulateMetricsUpdate();
    }
  }

  private simulateMetricsUpdate() {
    // Local simulation for metrics when API is unavailable
    this.channels.forEach((channel) => {
      const metrics = channel.metrics;
      metrics.tps = Math.floor(metrics.tps + (Math.random() - 0.5) * 10000);
      metrics.totalTransactions += Math.floor(Math.random() * 1000);
      metrics.blockHeight += Math.random() > 0.7 ? 1 : 0;
      metrics.latency = Math.max(1, metrics.latency + (Math.random() - 0.5) * 2);
      metrics.throughput = Math.floor(metrics.throughput + (Math.random() - 0.5) * 5000);

      this.emit('metrics_updated', { channelId: channel.id, metrics });
    });
  }

  private initializeDefaultChannels() {
    // Main channel
    this.createChannel({
      id: 'main',
      name: 'Main Network',
      type: 'public',
      status: 'active',
      config: {
        consensusType: 'hyperraft',
        blockSize: 10000,
        blockTimeout: 2,
        maxMessageCount: 500,
        batchTimeout: 1,
        maxChannels: 100,
        targetTps: 2000000,
        privacyLevel: 'public',
        endorsementPolicy: 'ANY',
        cryptoConfig: {
          algorithm: 'CRYSTALS-Dilithium',
          keySize: 256,
          quantumResistant: true
        }
      },
      metrics: {
        tps: 776000,
        totalTransactions: 15234567,
        blockHeight: 98765,
        latency: 12,
        throughput: 850000,
        nodeCount: 25,
        activeContracts: 42,
        storageUsed: 1024 * 1024 * 500 // 500MB
      },
      participants: [],
      smartContracts: [],
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    });

    // Private channel
    this.createChannel({
      id: 'private-1',
      name: 'Enterprise Private',
      type: 'private',
      status: 'active',
      config: {
        consensusType: 'pbft',
        blockSize: 5000,
        blockTimeout: 1,
        maxMessageCount: 100,
        batchTimeout: 0.5,
        maxChannels: 10,
        targetTps: 100000,
        privacyLevel: 'confidential',
        endorsementPolicy: 'MAJORITY',
        cryptoConfig: {
          algorithm: 'CRYSTALS-Kyber',
          keySize: 512,
          quantumResistant: true
        }
      },
      metrics: {
        tps: 85000,
        totalTransactions: 523456,
        blockHeight: 12345,
        latency: 8,
        throughput: 95000,
        nodeCount: 7,
        activeContracts: 15,
        storageUsed: 1024 * 1024 * 100 // 100MB
      },
      participants: [],
      smartContracts: [],
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date()
    });

    // Consortium channel
    this.createChannel({
      id: 'consortium-1',
      name: 'Supply Chain Consortium',
      type: 'consortium',
      status: 'active',
      config: {
        consensusType: 'raft',
        blockSize: 2000,
        blockTimeout: 3,
        maxMessageCount: 200,
        batchTimeout: 2,
        maxChannels: 50,
        targetTps: 50000,
        privacyLevel: 'private',
        endorsementPolicy: 'AND(Org1.member, Org2.member)',
        cryptoConfig: {
          algorithm: 'Ed25519',
          keySize: 256,
          quantumResistant: false
        }
      },
      metrics: {
        tps: 35000,
        totalTransactions: 234567,
        blockHeight: 8765,
        latency: 15,
        throughput: 40000,
        nodeCount: 12,
        activeContracts: 8,
        storageUsed: 1024 * 1024 * 75 // 75MB
      },
      participants: [],
      smartContracts: [],
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date()
    });

    // Set default active channel
    this.activeChannel = 'main';
  }

  // Public API methods
  public createChannel(channel: Channel): void {
    this.channels.set(channel.id, channel);
    this.emit('channel_created', channel);
  }

  public getChannel(id: string): Channel | undefined {
    return this.channels.get(id);
  }

  public getAllChannels(): Channel[] {
    return Array.from(this.channels.values());
  }

  public setActiveChannel(id: string): void {
    if (this.channels.has(id)) {
      this.activeChannel = id;
      this.emit('active_channel_changed', id);
    }
  }

  public getActiveChannel(): Channel | undefined {
    return this.activeChannel ? this.channels.get(this.activeChannel) : undefined;
  }

  public updateChannelConfig(id: string, config: Partial<ChannelConfig>): void {
    const channel = this.channels.get(id);
    if (channel) {
      channel.config = { ...channel.config, ...config };
      channel.updatedAt = new Date();
      this.emit('channel_config_updated', { channelId: id, config });
    }
  }

  public addParticipant(channelId: string, participant: Participant): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.participants.push(participant);
      channel.metrics.nodeCount++;
      this.emit('participant_added', { channelId, participant });
    }
  }

  public removeParticipant(channelId: string, participantId: string): void {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.participants = channel.participants.filter(p => p.id !== participantId);
      channel.metrics.nodeCount--;
      this.emit('participant_removed', { channelId, participantId });
    }
  }

  public deploySmartContract(channelId: string, contract: SmartContract): Promise<void> {
    return new Promise((resolve, reject) => {
      const channel = this.channels.get(channelId);
      if (!channel) {
        reject(new Error('Channel not found'));
        return;
      }

      contract.channelId = channelId;
      contract.status = 'pending';
      channel.smartContracts.push(contract);

      // Simulate deployment
      setTimeout(() => {
        contract.status = 'deployed';
        channel.metrics.activeContracts++;
        this.emit('contract_deployed', { channelId, contract });
        resolve();
      }, 2000);
    });
  }

  public getChannelMetrics(channelId: string): ChannelMetrics | undefined {
    return this.channels.get(channelId)?.metrics;
  }

  public getChannelTransactions(channelId: string, limit: number = 100): Promise<any[]> {
    // This would typically fetch from the backend
    return Promise.resolve([]);
  }

  public getChannelBlocks(channelId: string, fromHeight: number, toHeight: number): Promise<any[]> {
    // This would typically fetch from the backend
    return Promise.resolve([]);
  }

  public disconnect() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }
}

// Singleton instance
export const ChannelService = new ChannelServiceClass();
export default ChannelService;
