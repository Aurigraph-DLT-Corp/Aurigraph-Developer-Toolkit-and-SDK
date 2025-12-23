import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';
export interface VerificationProvider {
    id: string;
    name: string;
    type: 'APPRAISAL' | 'INSPECTION' | 'AUDIT' | 'IOT' | 'SATELLITE' | 'LEGAL';
    credentials: string[];
    confidence: number;
    cost: number;
    averageTime: number;
}
export interface VerificationRequest {
    assetId: string;
    methods: string[];
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    deadline?: Date;
    budget?: number;
}
export interface OracleDataSource {
    id: string;
    name: string;
    type: 'PRICE_FEED' | 'SATELLITE' | 'IOT' | 'LEGAL' | 'MARKET';
    endpoint: string;
    apiKey?: string;
    reliability: number;
    latency: number;
}
export declare class AssetVerifier extends EventEmitter {
    private providers;
    private oracleSources;
    private activeVerifications;
    private cryptoManager;
    constructor(cryptoManager: QuantumCryptoManagerV2);
    private initializeProviders;
    private initializeOracleSources;
    initiateVerification(request: VerificationRequest): Promise<string>;
    private startVerificationMethod;
    private selectOptimalProvider;
    private performVerification;
    private performAppraisal;
    private performPhysicalInspection;
    private performLegalVerification;
    private performIoTVerification;
    private performSatelliteVerification;
    getOracleData(assetId: string, dataType: string): Promise<any>;
    private selectOptimalOracle;
    private fetchOracleData;
    private generateVerificationId;
    private generateReportId;
    getVerificationStatus(verificationId: string): Promise<any>;
    getAvailableProviders(): VerificationProvider[];
    getOracleSources(): OracleDataSource[];
}
//# sourceMappingURL=AssetVerifier.d.ts.map