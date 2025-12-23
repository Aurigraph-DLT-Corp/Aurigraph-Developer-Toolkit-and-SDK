export interface ChannelConfig {
    id: string;
    name: string;
    description: string;
    environment: 'development' | 'testing' | 'staging' | 'production';
    encryption: boolean;
    quantumSecurity: boolean;
    consensusType: 'HyperRAFT++' | 'PBFT' | 'PoS';
    targetTPS: number;
    maxNodes: number;
    created: Date;
    status: 'active' | 'inactive' | 'maintenance' | 'error';
}
export interface ValidatorConfig {
    id: string;
    channelId: string;
    stake: number;
    role: 'LEADER' | 'FOLLOWER';
    port: number;
    p2pPort: number;
    status: 'running' | 'stopped' | 'syncing' | 'error';
    performance: {
        tps: number;
        latency: number;
        uptime: number;
    };
}
export interface BasicNodeConfig {
    id: string;
    channelId: string;
    type: 'FULL' | 'LIGHT' | 'ARCHIVE' | 'BRIDGE';
    port: number;
    p2pPort: number;
    status: 'running' | 'stopped' | 'syncing' | 'error';
    connections: number;
    resourceUsage: {
        cpu: number;
        memory: number;
        disk: number;
    };
}
export interface ChannelMetrics {
    channelId: string;
    totalTPS: number;
    averageLatency: number;
    totalNodes: number;
    activeValidators: number;
    blockHeight: number;
    consensusRounds: number;
    transactionVolume: number;
    errorRate: number;
}
export declare class ChannelManager {
    private logger;
    private channels;
    private validators;
    private basicNodes;
    private channelMetrics;
    private runningNodes;
    constructor();
    private initializeDefaultChannels;
    createChannel(config: Omit<ChannelConfig, 'created' | 'status'>): Promise<ChannelConfig>;
    deleteChannel(channelId: string): Promise<boolean>;
    updateChannel(channelId: string, updates: Partial<ChannelConfig>): ChannelConfig | null;
    getChannel(channelId: string): ChannelConfig | null;
    getAllChannels(): ChannelConfig[];
    createValidator(channelId: string, config: Omit<ValidatorConfig, 'channelId' | 'status' | 'performance'>): Promise<ValidatorConfig>;
    startValidator(validatorId: string): Promise<boolean>;
    stopValidator(validatorId: string): Promise<boolean>;
    createBasicNode(channelId: string, config: Omit<BasicNodeConfig, 'channelId' | 'status' | 'connections' | 'resourceUsage'>): Promise<BasicNodeConfig>;
    startBasicNode(nodeId: string): Promise<boolean>;
    stopBasicNode(nodeId: string): Promise<boolean>;
    activateChannel(channelId: string): Promise<boolean>;
    deactivateChannel(channelId: string): Promise<boolean>;
    private stopAllNodesInChannel;
    createValidatorSet(channelId: string, count: number, startingPort?: number): Promise<ValidatorConfig[]>;
    createNodeSet(channelId: string, nodeTypes: Record<string, number>, startingPort?: number): Promise<BasicNodeConfig[]>;
    updateChannelMetrics(channelId: string): void;
    getChannelMetrics(channelId: string): ChannelMetrics | null;
    getAllChannelMetrics(): ChannelMetrics[];
    getValidatorsInChannel(channelId: string): ValidatorConfig[];
    getNodesInChannel(channelId: string): BasicNodeConfig[];
    getAllValidators(): ValidatorConfig[];
    getAllNodes(): BasicNodeConfig[];
    getSystemOverview(): any;
    startMonitoring(): void;
}
//# sourceMappingURL=ChannelManager.d.ts.map