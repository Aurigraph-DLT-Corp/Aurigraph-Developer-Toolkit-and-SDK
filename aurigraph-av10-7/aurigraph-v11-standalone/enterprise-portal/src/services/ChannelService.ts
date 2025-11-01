// Channel Service - Core multi-channel management

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
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    super();
    this.initializeDefaultChannels();
    this.connectWebSocket();
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

  private connectWebSocket() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/channels`;

      console.log(`🔌 Attempting to connect to WebSocket: ${wsUrl}`);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('✅ Channel WebSocket connected');
        this.reconnectAttempts = 0;
        this.emit('connected');
        this.subscribeToChannelUpdates();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ Channel WebSocket error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = () => {
        console.log('⚠️ Channel WebSocket disconnected');
        this.emit('disconnected');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error);
      this.attemptReconnect(); // Still try to reconnect
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const waitTime = 2000 * this.reconnectAttempts;
      console.log(`⏳ Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${waitTime}ms`);
      setTimeout(() => {
        this.connectWebSocket();
      }, waitTime);
    } else {
      console.log('⚠️ Max reconnection attempts reached, using simulation mode');
      console.log('💡 Backend server appears to be offline. Using local simulation for channel data.');
      this.emit('fallback_mode_enabled', {
        reason: 'Backend unavailable after 5 reconnection attempts',
        message: 'Using local simulation for channel metrics'
      });
      this.simulateChannelUpdates();
    }
  }

  private subscribeToChannelUpdates() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        channels: Array.from(this.channels.keys())
      }));
    }
  }

  private handleWebSocketMessage(message: any) {
    switch (message.type) {
      case 'channel_update':
        this.updateChannelMetrics(message.channelId, message.metrics);
        break;
      case 'transaction':
        this.handleTransaction(message.channelId, message.transaction);
        break;
      case 'block':
        this.handleNewBlock(message.channelId, message.block);
        break;
      case 'participant_update':
        this.updateParticipant(message.channelId, message.participant);
        break;
      case 'contract_deployed':
        this.addSmartContract(message.channelId, message.contract);
        break;
    }
  }

  private simulateChannelUpdates() {
    // Fallback simulation for when WebSocket is not available
    setInterval(() => {
      this.channels.forEach((channel) => {
        // Simulate metrics updates
        const metrics = channel.metrics;
        metrics.tps = Math.floor(metrics.tps + (Math.random() - 0.5) * 10000);
        metrics.totalTransactions += Math.floor(Math.random() * 1000);
        metrics.blockHeight += Math.random() > 0.7 ? 1 : 0;
        metrics.latency = Math.max(1, metrics.latency + (Math.random() - 0.5) * 2);
        metrics.throughput = Math.floor(metrics.throughput + (Math.random() - 0.5) * 5000);

        this.emit('metrics_updated', { channelId: channel.id, metrics });
      });
    }, 1000);

    // Simulate transactions
    setInterval(() => {
      const channelIds = Array.from(this.channels.keys());
      const randomChannel = channelIds[Math.floor(Math.random() * channelIds.length)];

      this.emit('transaction', {
        channelId: randomChannel,
        transaction: {
          id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          from: `0x${Math.random().toString(16).substr(2, 40)}`,
          to: `0x${Math.random().toString(16).substr(2, 40)}`,
          value: Math.floor(Math.random() * 1000),
          timestamp: new Date()
        }
      });
    }, 500);
  }

  // Public API methods
  public createChannel(channel: Channel): void {
    this.channels.set(channel.id, channel);
    this.emit('channel_created', channel);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'create_channel',
        channel
      }));
    }
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

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          action: 'update_config',
          channelId: id,
          config
        }));
      }
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

  private updateChannelMetrics(channelId: string, metrics: Partial<ChannelMetrics>) {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.metrics = { ...channel.metrics, ...metrics };
      this.emit('metrics_updated', { channelId, metrics: channel.metrics });
    }
  }

  private handleTransaction(channelId: string, transaction: any) {
    this.emit('transaction', { channelId, transaction });
  }

  private handleNewBlock(channelId: string, block: any) {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.metrics.blockHeight++;
      this.emit('new_block', { channelId, block });
    }
  }

  private updateParticipant(channelId: string, participant: Partial<Participant>) {
    const channel = this.channels.get(channelId);
    if (channel && participant.id) {
      const index = channel.participants.findIndex(p => p.id === participant.id);
      if (index >= 0) {
        channel.participants[index] = { ...channel.participants[index], ...participant };
        this.emit('participant_updated', { channelId, participant });
      }
    }
  }

  private addSmartContract(channelId: string, contract: SmartContract) {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.smartContracts.push(contract);
      channel.metrics.activeContracts++;
      this.emit('contract_deployed', { channelId, contract });
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Singleton instance
export const ChannelService = new ChannelServiceClass();
export default ChannelService;