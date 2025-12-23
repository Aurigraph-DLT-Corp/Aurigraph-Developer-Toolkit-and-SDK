/**
 * AV10-11: Living Asset Tokenizer with Consciousness Interface
 *
 * Revolutionary consciousness-aware tokenization system for living assets
 * with AI-powered consciousness detection, communication interfaces,
 * welfare monitoring, and ethical consent management.
 *
 * Performance Targets:
 * - Consciousness detection accuracy: 95%+
 * - Response time for welfare issues: <1 hour
 * - Emergency response time: <5 minutes
 * - Multi-species support: 5+ types
 */
import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../crypto/QuantumCryptoManagerV2';
import * as tf from '@tensorflow/tfjs-node';
export interface ConsciousnessSignature {
    id: string;
    timestamp: Date;
    species: SpeciesType;
    level: ConsciousnessLevel;
    patterns: NeuralPattern[];
    confidence: number;
    verified: boolean;
    signature: string;
}
export interface NeuralPattern {
    type: 'COGNITIVE' | 'EMOTIONAL' | 'SENSORY' | 'MOTOR' | 'SOCIAL';
    intensity: number;
    frequency: number;
    complexity: number;
    coherence: number;
    data: number[][];
}
export interface ConsciousnessLevel {
    value: number;
    category: 'MINIMAL' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'COMPLEX';
    subCategories: string[];
    capabilities: ConsciousnessCapability[];
}
export interface ConsciousnessCapability {
    type: CapabilityType;
    level: number;
    verified: boolean;
    evidence: any[];
}
export declare enum CapabilityType {
    SELF_AWARENESS = "SELF_AWARENESS",
    EMOTION_RECOGNITION = "EMOTION_RECOGNITION",
    PROBLEM_SOLVING = "PROBLEM_SOLVING",
    COMMUNICATION = "COMMUNICATION",
    MEMORY_FORMATION = "MEMORY_FORMATION",
    LEARNING = "LEARNING",
    SOCIAL_INTERACTION = "SOCIAL_INTERACTION",
    TOOL_USE = "TOOL_USE",
    ABSTRACT_THINKING = "ABSTRACT_THINKING"
}
export declare enum SpeciesType {
    CANINE = "CANINE",
    FELINE = "FELINE",
    EQUINE = "EQUINE",
    BOVINE = "BOVINE",
    AVIAN = "AVIAN",
    PRIMATE = "PRIMATE",
    CETACEAN = "CETACEAN",
    REPTILIAN = "REPTILIAN",
    OTHER = "OTHER"
}
export interface CommunicationChannel {
    id: string;
    assetId: string;
    species: SpeciesType;
    protocol: CommunicationProtocol;
    established: Date;
    status: 'ACTIVE' | 'INACTIVE' | 'DEGRADED';
    quality: number;
    bidirectional: boolean;
    translator: SpeciesTranslator;
}
export interface CommunicationProtocol {
    type: 'VISUAL' | 'AUDITORY' | 'TACTILE' | 'CHEMICAL' | 'ELECTROMAGNETIC' | 'MULTIMODAL';
    encoding: string;
    decoding: string;
    bandwidth: number;
    latency: number;
    reliability: number;
}
export interface SpeciesTranslator {
    sourceLanguage: string;
    targetLanguage: string;
    model: tf.LayersModel | null;
    accuracy: number;
    vocabulary: Map<string, string>;
}
export interface WelfareStatus {
    assetId: string;
    timestamp: Date;
    overallScore: number;
    physicalHealth: HealthMetric;
    mentalWellbeing: WellbeingMetric;
    environmentalConditions: EnvironmentalMetric;
    socialInteraction: SocialMetric;
    nutritionalStatus: NutritionalMetric;
    alerts: WelfareAlert[];
    recommendations: string[];
}
export interface HealthMetric {
    score: number;
    vitals: {
        heartRate?: number;
        temperature?: number;
        respiration?: number;
        bloodPressure?: string;
    };
    conditions: string[];
    medications: string[];
    lastCheckup: Date;
}
export interface WellbeingMetric {
    score: number;
    stressLevel: number;
    anxietyLevel: number;
    happiness: number;
    engagement: number;
    behaviors: string[];
}
export interface EnvironmentalMetric {
    score: number;
    temperature: number;
    humidity: number;
    lightLevel: number;
    noiseLevel: number;
    spaceAdequacy: number;
    cleanliness: number;
}
export interface SocialMetric {
    score: number;
    interactions: number;
    companionship: boolean;
    isolation: number;
    aggression: number;
    playfulness: number;
}
export interface NutritionalMetric {
    score: number;
    feedingSchedule: string;
    waterAccess: boolean;
    dietQuality: number;
    bodyCondition: number;
    specialNeeds: string[];
}
export interface WelfareAlert {
    id: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
    type: string;
    description: string;
    detected: Date;
    actionRequired: boolean;
    autoResponse: boolean;
    resolved: boolean;
}
export interface EthicalConsent {
    id: string;
    assetId: string;
    type: ConsentType;
    granted: boolean;
    method: ConsentMethod;
    timestamp: Date;
    evidence: ConsentEvidence[];
    validator: string;
    expiresAt?: Date;
    conditions: string[];
}
export declare enum ConsentType {
    TOKENIZATION = "TOKENIZATION",
    DATA_COLLECTION = "DATA_COLLECTION",
    MEDICAL_PROCEDURE = "MEDICAL_PROCEDURE",
    LOCATION_TRACKING = "LOCATION_TRACKING",
    BEHAVIORAL_MONITORING = "BEHAVIORAL_MONITORING",
    INTERACTION = "INTERACTION",
    RESEARCH = "RESEARCH"
}
export declare enum ConsentMethod {
    BEHAVIORAL_INDICATION = "BEHAVIORAL_INDICATION",
    GUARDIAN_CONSENT = "GUARDIAN_CONSENT",
    INFERRED_PREFERENCE = "INFERRED_PREFERENCE",
    ESTABLISHED_PATTERN = "ESTABLISHED_PATTERN",
    LEGAL_FRAMEWORK = "LEGAL_FRAMEWORK"
}
export interface ConsentEvidence {
    type: string;
    data: any;
    timestamp: Date;
    confidence: number;
}
export interface LivingAssetToken {
    id: string;
    assetId: string;
    species: SpeciesType;
    name?: string;
    consciousness: ConsciousnessSignature;
    communication: CommunicationChannel | null;
    welfare: WelfareStatus;
    consent: EthicalConsent[];
    owner: string;
    guardian?: string;
    location?: string;
    metadata: Map<string, any>;
    created: Date;
    lastUpdated: Date;
    active: boolean;
}
export interface TokenizationRequest {
    assetType: 'LIVING_ENTITY';
    species: SpeciesType;
    identifier: string;
    owner: string;
    guardian?: string;
    location?: string;
    metadata?: Record<string, any>;
    ethicalReview: boolean;
    welfareMonitoring: boolean;
    communicationEnabled: boolean;
}
export declare class AV10_11_LivingAssetTokenizer extends EventEmitter {
    private logger;
    private consciousnessAgent;
    private communicationAgent;
    private welfareAgent;
    private consentManager;
    private quantumCrypto;
    private tokens;
    private initialized;
    constructor();
    private setupAgentListeners;
    initialize(quantumCrypto?: QuantumCryptoManagerV2): Promise<void>;
    tokenizeLivingAsset(request: TokenizationRequest): Promise<LivingAssetToken>;
    updateTokenWelfare(tokenId: string): Promise<WelfareStatus>;
    communicateWithAsset(tokenId: string, message: string, type?: 'COMMAND' | 'QUERY' | 'COMFORT' | 'PLAY'): Promise<any>;
    receiveFromAsset(tokenId: string): Promise<any>;
    verifyConsciousness(tokenId: string): Promise<boolean>;
    renewConsent(tokenId: string, consentId: string, guardian?: string): Promise<EthicalConsent>;
    getToken(tokenId: string): LivingAssetToken | undefined;
    getAllTokens(): LivingAssetToken[];
    getTokensBySpecies(species: SpeciesType): LivingAssetToken[];
    getSystemStatus(): Promise<any>;
    shutdown(): Promise<void>;
}
export default AV10_11_LivingAssetTokenizer;
//# sourceMappingURL=AV10-11-LivingAssetTokenizer.d.ts.map