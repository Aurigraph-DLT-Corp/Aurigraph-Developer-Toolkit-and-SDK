export interface NTRUKeyPair {
    publicKey: Buffer;
    privateKey: Buffer;
    keySize: number;
    securityLevel: number;
    algorithm: 'NTRU-1024' | 'NTRU-2048' | 'NTRU-4096';
    generatedAt: number;
    expiresAt?: number;
}
export interface NTRUEncryptionResult {
    ciphertext: Buffer;
    algorithm: string;
    keyId: string;
    timestamp: number;
    nonce: Buffer;
    tag: Buffer;
}
export interface NTRUDecryptionResult {
    plaintext: Buffer;
    verified: boolean;
    keyId: string;
    timestamp: number;
}
export interface NTRUSignature {
    signature: Buffer;
    algorithm: string;
    keyId: string;
    timestamp: number;
    messageHash: string;
}
export interface NTRUPerformanceMetrics {
    keyGenerationTime: number;
    encryptionTime: number;
    decryptionTime: number;
    signatureTime: number;
    verificationTime: number;
    throughput: {
        keyGenPerSec: number;
        encryptionsPerSec: number;
        decryptionsPerSec: number;
        signaturesPerSec: number;
        verificationsPerSec: number;
    };
    memoryUsage: {
        keyGenMB: number;
        encryptionMB: number;
        decryptionMB: number;
        signatureMB: number;
    };
}
export interface NTRUConfiguration {
    securityLevel: 128 | 192 | 256;
    keySize: 1024 | 2048 | 4096;
    polynomialDegree: number;
    modulusQ: number;
    distributionParameter: number;
    hybridMode: boolean;
    hardwareAcceleration: boolean;
    performanceOptimization: boolean;
    sideChannelProtection: boolean;
    keyRotationInterval: number;
    maxConcurrentOperations: number;
}
export declare class NTRUCryptoEngine {
    private logger;
    private config;
    private keyPairs;
    private performanceMetrics;
    private isInitialized;
    private readonly ntruParams;
    private hardwareAccelerator;
    private quantumRandomGenerator;
    constructor(config?: Partial<NTRUConfiguration>);
    initialize(): Promise<void>;
    generateKeyPair(keyId: string, algorithm?: 'NTRU-1024' | 'NTRU-2048' | 'NTRU-4096'): Promise<NTRUKeyPair>;
    encrypt(data: Buffer, recipientKeyId: string): Promise<NTRUEncryptionResult>;
    decrypt(encryptedData: NTRUEncryptionResult, privateKeyId: string): Promise<NTRUDecryptionResult>;
    signMessage(message: Buffer, signerKeyId: string): Promise<NTRUSignature>;
    verifySignature(message: Buffer, signature: NTRUSignature, publicKeyId: string): Promise<boolean>;
    performKeyExchange(localKeyId: string, remotePublicKey: Buffer): Promise<Buffer>;
    getPerformanceMetrics(): NTRUPerformanceMetrics;
    getKeyPairInfo(keyId: string): Partial<NTRUKeyPair> | null;
    rotateKey(keyId: string): Promise<NTRUKeyPair>;
    private initializeHardwareAcceleration;
    private initializeQuantumRandom;
    private preGenerateKeyPairs;
    private startPerformanceMonitoring;
    private startKeyRotationScheduler;
    private generateNTRUKeys;
    private hybridEncrypt;
    private hybridDecrypt;
    private ntruEncrypt;
    private ntruDecrypt;
    private generateNTRUSignature;
    private verifyNTRUSignature;
    private ntruKeyExchange;
}
//# sourceMappingURL=NTRUCryptoEngine.d.ts.map