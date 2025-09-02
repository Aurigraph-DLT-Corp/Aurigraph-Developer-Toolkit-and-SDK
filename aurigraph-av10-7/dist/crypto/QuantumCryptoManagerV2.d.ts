export interface QuantumKeyPairV2 {
    publicKey: string;
    privateKey: string;
    algorithm: 'CRYSTALS-Kyber' | 'CRYSTALS-Dilithium' | 'SPHINCS+' | 'Falcon' | 'Rainbow' | 'NTRU';
    quantumLevel: number;
    distributionKey?: string;
}
export interface QuantumSignatureV2 {
    signature: string;
    algorithm: string;
    timestamp: number;
    quantumProof: any;
    distributionVerified: boolean;
}
export interface QuantumConsensusProof {
    proofData: string;
    validators: string[];
    quantumEntanglement: any;
    consensusRound: number;
    verificationHash: string;
}
export interface QuantumSecurityConfig {
    securityLevel: number;
    quantumKeyDistribution: boolean;
    quantumRandomGeneration: boolean;
    quantumStateChannels: boolean;
    quantumConsensusProofs: boolean;
    postQuantumSmartContracts: boolean;
    hardwareAcceleration: boolean;
}
export declare class QuantumCryptoManagerV2 {
    private logger;
    private config;
    private keyPairs;
    private distributionKeys;
    private quantumRandomPool;
    private consensusProofs;
    private quantumEntanglementRegistry;
    private quantumStateChannels;
    private hardwareQuantumAccelerator;
    private quantumRandomGenerator;
    private readonly algorithmsV2;
    private performanceMetrics;
    constructor(config?: QuantumSecurityConfig);
    initialize(): Promise<void>;
    private initializeQuantumAlgorithms;
    private initializeAlgorithm;
    private verifyAlgorithmReadiness;
    private initializeQuantumKeyDistribution;
    private initializeQuantumRandomGeneration;
    private generateTrueQuantumRandom;
    private startQuantumRandomGeneration;
    private initializeQuantumStateChannels;
    private generateQuantumEntanglement;
    private initializeQuantumConsensusProofs;
    private initializeQuantumBFT;
    private verifyQuantumBFTReadiness;
    private initializeHardwareAcceleration;
    private generateMasterQuantumKeys;
    generateQuantumKeyPair(algorithm: 'CRYSTALS-Kyber' | 'CRYSTALS-Dilithium' | 'SPHINCS+'): Promise<QuantumKeyPairV2>;
    private generateHardwareAcceleratedKeys;
    private generateSoftwareQuantumKeys;
    private generateDistributionKey;
    quantumSign(data: string): Promise<QuantumSignatureV2>;
    private generateEnhancedQuantumSignature;
    private generateHardwareQuantumSignature;
    private generateQuantumSignatureProof;
    private verifyQuantumDistribution;
    verify(data: string, signature: string, publicKey: string): Promise<boolean>;
    private hardwareVerifySignature;
    quantumHash(data: string): Promise<string>;
    private hardwareQuantumHash;
    generateQuantumRandom(bytes: number): Promise<Buffer>;
    private getQuantumRandom;
    generateConsensusProof(consensusData: any): Promise<QuantumConsensusProof>;
    private generateConsensusProofData;
    verifyConsensusProof(proof: QuantumConsensusProof): Promise<boolean>;
    private verifyQuantumCoherence;
    preSign(data: string): Promise<string>;
    generateLeadershipProof(leadershipData: any): Promise<any>;
    initializeQuantumConsensus(): Promise<void>;
    rotateKeys(): Promise<void>;
    private startPerformanceMonitoring;
    getQuantumStatus(): any;
    private calculateQuantumReadiness;
    private calculateDistributionEfficiency;
    private calculateConsensusProofEfficiency;
    generateKeyPair(algorithm: 'CRYSTALS-Kyber' | 'CRYSTALS-Dilithium' | 'SPHINCS+'): Promise<QuantumKeyPairV2>;
    sign(data: string): Promise<string>;
    hash(data: string): Promise<string>;
    generateChannelKey(): Promise<Buffer>;
    generateEncryptionKey(): Promise<Buffer>;
    encryptWithChannel(data: Buffer, channelKey: Buffer): Promise<Buffer>;
    decryptWithChannel(encryptedData: Buffer, channelKey: Buffer): Promise<Buffer>;
    generateKyberKeyPair(): Promise<any>;
    generateDilithiumKeyPair(): Promise<any>;
    generateSphincsKeyPair(): Promise<any>;
    generateNTRUKeyPair(): Promise<QuantumKeyPairV2>;
    ntruEncrypt(data: string, publicKey: string): Promise<string>;
    ntruDecrypt(encryptedData: string, privateKey: string): Promise<string>;
    ntruSign(data: string, privateKey: string): Promise<string>;
    ntruVerify(data: string, signature: string, publicKey: string): Promise<boolean>;
    ntruKeyExchange(privateKey: string, peerPublicKey: string): Promise<string>;
    private callNTRUService;
    generateQuantumKeyPairNTRU(): Promise<QuantumKeyPairV2>;
    getNTRUPerformanceMetrics(): any;
    hashData(data: string): Promise<string>;
    getMetrics(): any;
}
//# sourceMappingURL=QuantumCryptoManagerV2.d.ts.map