export interface QuantumKeyPair {
    publicKey: string;
    privateKey: string;
    algorithm: 'CRYSTALS-Kyber' | 'CRYSTALS-Dilithium' | 'SPHINCS+';
}
export interface QuantumSignature {
    signature: string;
    algorithm: string;
    timestamp: number;
}
export interface HomomorphicCipher {
    ciphertext: string;
    publicKey: string;
    operations: string[];
}
export declare class QuantumCryptoManager {
    private logger;
    private keyPairs;
    private securityLevel;
    private readonly algorithms;
    constructor();
    initialize(): Promise<void>;
    private initializeQuantumAlgorithms;
    private generateMasterKeys;
    private setupHomomorphicEncryption;
    generateChannelKey(): Promise<Buffer>;
    generateEncryptionKey(): Promise<Buffer>;
    encryptWithChannel(data: Buffer, channelKey: Buffer): Promise<Buffer>;
    decryptWithChannel(encryptedData: Buffer, channelKey: Buffer): Promise<Buffer>;
    generateKyberKeyPair(): Promise<QuantumKeyPair>;
    generateDilithiumKeyPair(): Promise<QuantumKeyPair>;
    generateSphincsKeyPair(): Promise<QuantumKeyPair>;
    sign(data: string, algorithm?: string): Promise<string>;
    verify(data: string, signature: string, publicKey?: string): Promise<boolean>;
    hash(data: string): Promise<string>;
    encryptHomomorphic(data: any): Promise<HomomorphicCipher>;
    computeOnEncrypted(cipher: HomomorphicCipher, operation: 'add' | 'multiply', operand: HomomorphicCipher): Promise<HomomorphicCipher>;
    decryptHomomorphic(cipher: HomomorphicCipher): Promise<any>;
    generateMultiPartyKey(parties: string[], threshold: number): Promise<any>;
    combineMultiPartySignatures(signatures: string[], threshold: number): Promise<string>;
    rotateKeys(): void;
    getSecurityLevel(): number;
    generateKeyPair(algorithm: 'CRYSTALS-Kyber' | 'CRYSTALS-Dilithium' | 'SPHINCS+'): Promise<QuantumKeyPair>;
    homomorphicEncrypt(value: number): Promise<HomomorphicCipher>;
    homomorphicAdd(cipher1: HomomorphicCipher, cipher2: HomomorphicCipher): Promise<HomomorphicCipher>;
    homomorphicMultiply(cipher1: HomomorphicCipher, cipher2: HomomorphicCipher): Promise<HomomorphicCipher>;
    getMetrics(): any;
    benchmark(): Promise<any>;
    initializeQuantumConsensus(): Promise<void>;
    preSign(data: string): Promise<string>;
    generateConsensusProof(data: any): Promise<any>;
    generateQuantumRandom(bytes: number): Promise<Buffer>;
    quantumHash(data: string): Promise<string>;
    quantumSign(data: string): Promise<string>;
    generateLeadershipProof(data: any): Promise<any>;
}
//# sourceMappingURL=QuantumCryptoManager.d.ts.map