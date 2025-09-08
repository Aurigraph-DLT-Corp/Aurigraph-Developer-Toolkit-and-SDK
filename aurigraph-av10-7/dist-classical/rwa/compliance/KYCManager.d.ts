import { EventEmitter } from 'events';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';
export interface KYCProfile {
    userId: string;
    personalInfo: PersonalInfo;
    identityVerification: IdentityVerification;
    addressVerification: AddressVerification;
    sourceOfFunds: SourceOfFunds;
    riskAssessment: RiskAssessment;
    complianceStatus: ComplianceStatus;
    created: Date;
    updated: Date;
}
export interface PersonalInfo {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    nationality: string;
    residenceCountry: string;
    phoneNumber: string;
    email: string;
    occupation: string;
    employer?: string;
}
export interface IdentityVerification {
    documentType: 'PASSPORT' | 'DRIVERS_LICENSE' | 'NATIONAL_ID';
    documentNumber: string;
    documentCountry: string;
    expiryDate: Date;
    verified: boolean;
    verificationMethod: 'MANUAL' | 'OCR' | 'BIOMETRIC' | 'HYBRID';
    verificationDate?: Date;
    verificationScore: number;
    documentImages: string[];
}
export interface AddressVerification {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    verified: boolean;
    verificationMethod: 'UTILITY_BILL' | 'BANK_STATEMENT' | 'GOVERNMENT_LETTER';
    verificationDate?: Date;
    documentImages: string[];
}
export interface SourceOfFunds {
    primarySource: 'EMPLOYMENT' | 'BUSINESS' | 'INVESTMENT' | 'INHERITANCE' | 'OTHER';
    employmentDetails?: EmploymentDetails;
    businessDetails?: BusinessDetails;
    annualIncome: number;
    netWorth: number;
    sourceDocuments: string[];
    verified: boolean;
}
export interface EmploymentDetails {
    employer: string;
    position: string;
    yearsEmployed: number;
    salary: number;
    employerAddress: string;
}
export interface BusinessDetails {
    businessName: string;
    businessType: string;
    registrationNumber: string;
    yearsInBusiness: number;
    annualRevenue: number;
}
export interface RiskAssessment {
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'PROHIBITED';
    riskScore: number;
    factors: RiskFactor[];
    pepStatus: boolean;
    sanctionStatus: boolean;
    adverseMediaCheck: boolean;
    assessmentDate: Date;
    reviewDate: Date;
}
export interface RiskFactor {
    type: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH';
    score: number;
}
export interface ComplianceStatus {
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'UNDER_REVIEW';
    approvedDate?: Date;
    approvedBy?: string;
    restrictions: string[];
    maxInvestmentLimit?: number;
    jurisdictions: string[];
    lastReview: Date;
    nextReview: Date;
}
export interface SanctionScreeningResult {
    userId: string;
    screened: boolean;
    matches: SanctionMatch[];
    screeningDate: Date;
    lists: string[];
    riskLevel: string;
}
export interface SanctionMatch {
    listName: string;
    matchType: 'EXACT' | 'FUZZY' | 'PHONETIC';
    confidence: number;
    details: string;
}
export declare class KYCManager extends EventEmitter {
    private profiles;
    private sanctionLists;
    private pepLists;
    private cryptoManager;
    private complianceRules;
    constructor(cryptoManager: QuantumCryptoManagerV2);
    private initializeSanctionLists;
    private initializeComplianceRules;
    createKYCProfile(userData: Partial<KYCProfile>): Promise<string>;
    updateIdentityVerification(userId: string, identity: IdentityVerification): Promise<boolean>;
    performSanctionScreening(userId: string): Promise<SanctionScreeningResult>;
    performPEPScreening(userId: string): Promise<boolean>;
    calculateRiskScore(userId: string): Promise<number>;
    approveKYC(userId: string, approverId: string, restrictions?: string[]): Promise<boolean>;
    getKYCProfile(userId: string): Promise<KYCProfile | null>;
    getComplianceReport(): Promise<{
        totalProfiles: number;
        statusBreakdown: Record<string, number>;
        riskBreakdown: Record<string, number>;
        jurisdictionBreakdown: Record<string, number>;
        averageProcessingTime: number;
    }>;
    private performIdentityVerification;
    private screenAgainstList;
    private getCountryRisk;
    private calculateVerificationRisk;
    private encryptKYCData;
    private generateUserId;
    updateSanctionLists(listName: string, entries: string[]): Promise<void>;
    bulkScreening(userIds: string[]): Promise<Map<string, SanctionScreeningResult>>;
}
//# sourceMappingURL=KYCManager.d.ts.map