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

export class KYCManager extends EventEmitter {
  private profiles: Map<string, KYCProfile> = new Map();
  private sanctionLists: Map<string, string[]> = new Map();
  private pepLists: Map<string, string[]> = new Map();
  private cryptoManager: QuantumCryptoManagerV2;
  private complianceRules: Map<string, any> = new Map();

  constructor(cryptoManager: QuantumCryptoManagerV2) {
    super();
    this.cryptoManager = cryptoManager;
    this.initializeSanctionLists();
    this.initializeComplianceRules();
  }

  private initializeSanctionLists(): void {
    // Initialize major sanction lists
    this.sanctionLists.set('OFAC_SDN', []);
    this.sanctionLists.set('UN_CONSOLIDATED', []);
    this.sanctionLists.set('EU_SANCTIONS', []);
    this.sanctionLists.set('UK_HMT', []);
    
    // Initialize PEP lists
    this.pepLists.set('GLOBAL_PEP', []);
    this.pepLists.set('US_PEP', []);
    this.pepLists.set('EU_PEP', []);
  }

  private initializeComplianceRules(): void {
    // US Compliance Rules
    this.complianceRules.set('US', {
      maxInvestment: 250000,
      requiredDocuments: ['IDENTITY', 'ADDRESS', 'SOURCE_OF_FUNDS'],
      sanctionScreening: true,
      pepScreening: true,
      adverseMediaCheck: true,
      selfCertification: true
    });

    // EU Compliance Rules (MiCA)
    this.complianceRules.set('EU', {
      maxInvestment: 200000,
      requiredDocuments: ['IDENTITY', 'ADDRESS', 'SOURCE_OF_FUNDS'],
      gdprCompliance: true,
      sanctionScreening: true,
      pepScreening: true,
      dataRetention: 2555 // 7 years in days
    });

    // Singapore Rules
    this.complianceRules.set('SG', {
      maxInvestment: 300000,
      requiredDocuments: ['IDENTITY', 'ADDRESS', 'ACCREDITED_INVESTOR'],
      sanctionScreening: true,
      pepScreening: true,
      masCompliance: true
    });
  }

  async createKYCProfile(userData: Partial<KYCProfile>): Promise<string> {
    const userId = userData.userId || this.generateUserId();
    
    const profile: KYCProfile = {
      userId,
      personalInfo: userData.personalInfo!,
      identityVerification: {
        documentType: 'PASSPORT',
        documentNumber: '',
        documentCountry: '',
        expiryDate: new Date(),
        verified: false,
        verificationMethod: 'MANUAL',
        verificationScore: 0,
        documentImages: []
      },
      addressVerification: {
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        verified: false,
        verificationMethod: 'UTILITY_BILL',
        documentImages: []
      },
      sourceOfFunds: {
        primarySource: 'EMPLOYMENT',
        annualIncome: 0,
        netWorth: 0,
        sourceDocuments: [],
        verified: false
      },
      riskAssessment: {
        riskLevel: 'MEDIUM',
        riskScore: 50,
        factors: [],
        pepStatus: false,
        sanctionStatus: false,
        adverseMediaCheck: false,
        assessmentDate: new Date(),
        reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
      },
      complianceStatus: {
        status: 'PENDING',
        restrictions: [],
        jurisdictions: [userData.personalInfo?.residenceCountry || 'US'],
        lastReview: new Date(),
        nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      },
      created: new Date(),
      updated: new Date()
    };

    // Encrypt sensitive data
    const encryptedProfile = await this.encryptKYCData(profile);
    
    this.profiles.set(userId, profile);
    
    this.emit('kycProfileCreated', { userId });
    
    return userId;
  }

  async updateIdentityVerification(userId: string, identity: IdentityVerification): Promise<boolean> {
    const profile = this.profiles.get(userId);
    if (!profile) return false;

    profile.identityVerification = identity;
    profile.updated = new Date();

    // Perform automatic verification
    const verificationResult = await this.performIdentityVerification(identity);
    profile.identityVerification.verified = verificationResult.verified;
    profile.identityVerification.verificationScore = verificationResult.score;

    this.emit('identityVerificationUpdated', { userId, verified: verificationResult.verified });
    
    return true;
  }

  async performSanctionScreening(userId: string): Promise<SanctionScreeningResult> {
    const profile = this.profiles.get(userId);
    if (!profile) {
      throw new Error('KYC profile not found');
    }

    const result: SanctionScreeningResult = {
      userId,
      screened: true,
      matches: [],
      screeningDate: new Date(),
      lists: [],
      riskLevel: 'LOW'
    };

    // Screen against all sanction lists
    for (const [listName, entries] of this.sanctionLists.entries()) {
      const matches = this.screenAgainstList(profile.personalInfo, entries, listName);
      result.matches.push(...matches);
      result.lists.push(listName);
    }

    // Update risk assessment
    if (result.matches.length > 0) {
      profile.riskAssessment.sanctionStatus = true;
      profile.riskAssessment.riskLevel = 'HIGH';
      profile.riskAssessment.riskScore = 90;
      result.riskLevel = 'HIGH';
    }

    profile.updated = new Date();
    
    this.emit('sanctionScreeningCompleted', { userId, matches: result.matches.length });
    
    return result;
  }

  async performPEPScreening(userId: string): Promise<boolean> {
    const profile = this.profiles.get(userId);
    if (!profile) return false;

    let isPEP = false;

    // Screen against PEP lists
    for (const [listName, entries] of this.pepLists.entries()) {
      const matches = this.screenAgainstList(profile.personalInfo, entries, listName);
      if (matches.length > 0) {
        isPEP = true;
        break;
      }
    }

    profile.riskAssessment.pepStatus = isPEP;
    
    if (isPEP) {
      profile.riskAssessment.riskLevel = 'HIGH';
      profile.riskAssessment.riskScore = Math.max(profile.riskAssessment.riskScore, 80);
    }

    profile.updated = new Date();
    
    this.emit('pepScreeningCompleted', { userId, isPEP });
    
    return isPEP;
  }

  async calculateRiskScore(userId: string): Promise<number> {
    const profile = this.profiles.get(userId);
    if (!profile) return 100; // Maximum risk if no profile

    let riskScore = 0;
    const factors: RiskFactor[] = [];

    // Country risk
    const countryRisk = this.getCountryRisk(profile.personalInfo.residenceCountry);
    riskScore += countryRisk;
    factors.push({
      type: 'COUNTRY_RISK',
      description: `Residence country risk: ${profile.personalInfo.residenceCountry}`,
      severity: countryRisk > 30 ? 'HIGH' : countryRisk > 15 ? 'MEDIUM' : 'LOW',
      score: countryRisk
    });

    // Verification status
    const verificationRisk = this.calculateVerificationRisk(profile);
    riskScore += verificationRisk;
    factors.push({
      type: 'VERIFICATION_RISK',
      description: 'Document verification status',
      severity: verificationRisk > 20 ? 'HIGH' : verificationRisk > 10 ? 'MEDIUM' : 'LOW',
      score: verificationRisk
    });

    // PEP/Sanction status
    if (profile.riskAssessment.pepStatus || profile.riskAssessment.sanctionStatus) {
      riskScore += 40;
      factors.push({
        type: 'PEP_SANCTION',
        description: 'PEP or sanction match found',
        severity: 'HIGH',
        score: 40
      });
    }

    // Update profile
    profile.riskAssessment.riskScore = Math.min(riskScore, 100);
    profile.riskAssessment.factors = factors;
    
    if (riskScore < 30) profile.riskAssessment.riskLevel = 'LOW';
    else if (riskScore < 60) profile.riskAssessment.riskLevel = 'MEDIUM';
    else profile.riskAssessment.riskLevel = 'HIGH';

    profile.updated = new Date();
    
    return profile.riskAssessment.riskScore;
  }

  async approveKYC(userId: string, approverId: string, restrictions: string[] = []): Promise<boolean> {
    const profile = this.profiles.get(userId);
    if (!profile) return false;

    // Final risk calculation
    await this.calculateRiskScore(userId);

    if (profile.riskAssessment.riskLevel === 'HIGH' && restrictions.length === 0) {
      throw new Error('High-risk profiles require specific restrictions');
    }

    profile.complianceStatus.status = 'APPROVED';
    profile.complianceStatus.approvedDate = new Date();
    profile.complianceStatus.approvedBy = approverId;
    profile.complianceStatus.restrictions = restrictions;
    
    // Set investment limits based on jurisdiction
    const jurisdiction = profile.personalInfo.residenceCountry;
    const rules = this.complianceRules.get(jurisdiction);
    if (rules) {
      profile.complianceStatus.maxInvestmentLimit = rules.maxInvestment;
    }

    profile.updated = new Date();
    
    this.emit('kycApproved', { userId, riskLevel: profile.riskAssessment.riskLevel });
    
    return true;
  }

  async getKYCProfile(userId: string): Promise<KYCProfile | null> {
    return this.profiles.get(userId) || null;
  }

  async getComplianceReport(): Promise<{
    totalProfiles: number;
    statusBreakdown: Record<string, number>;
    riskBreakdown: Record<string, number>;
    jurisdictionBreakdown: Record<string, number>;
    averageProcessingTime: number;
  }> {
    const report = {
      totalProfiles: this.profiles.size,
      statusBreakdown: {
        PENDING: 0,
        APPROVED: 0,
        REJECTED: 0,
        SUSPENDED: 0,
        UNDER_REVIEW: 0
      },
      riskBreakdown: {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        PROHIBITED: 0
      },
      jurisdictionBreakdown: {} as Record<string, number>,
      averageProcessingTime: 0
    };

    let totalProcessingTime = 0;
    let processedCount = 0;

    this.profiles.forEach(profile => {
      // Status breakdown
      report.statusBreakdown[profile.complianceStatus.status]++;
      
      // Risk breakdown
      report.riskBreakdown[profile.riskAssessment.riskLevel]++;
      
      // Jurisdiction breakdown
      const jurisdiction = profile.personalInfo.residenceCountry;
      report.jurisdictionBreakdown[jurisdiction] = (report.jurisdictionBreakdown[jurisdiction] || 0) + 1;
      
      // Processing time calculation
      if (profile.complianceStatus.approvedDate) {
        const processingTime = profile.complianceStatus.approvedDate.getTime() - profile.created.getTime();
        totalProcessingTime += processingTime;
        processedCount++;
      }
    });

    report.averageProcessingTime = processedCount > 0 ? totalProcessingTime / processedCount : 0;
    
    return report;
  }

  private async performIdentityVerification(identity: IdentityVerification): Promise<{ verified: boolean; score: number }> {
    // Simulate advanced identity verification
    let score = 0;
    
    // Document validity check
    if (identity.expiryDate > new Date()) score += 30;
    
    // Document format validation
    if (identity.documentNumber.length >= 8) score += 20;
    
    // Country validation
    if (['US', 'EU', 'SG', 'UK', 'CA'].includes(identity.documentCountry)) score += 20;
    
    // Verification method bonus
    switch (identity.verificationMethod) {
      case 'BIOMETRIC': score += 30; break;
      case 'HYBRID': score += 25; break;
      case 'OCR': score += 15; break;
      case 'MANUAL': score += 10; break;
    }

    return {
      verified: score >= 70,
      score
    };
  }

  private screenAgainstList(personalInfo: PersonalInfo, list: string[], listName: string): SanctionMatch[] {
    const matches: SanctionMatch[] = [];
    const fullName = `${personalInfo.firstName} ${personalInfo.lastName}`.toLowerCase();
    
    // Simulate screening (real implementation would use fuzzy matching algorithms)
    list.forEach(entry => {
      if (entry.toLowerCase().includes(fullName) || fullName.includes(entry.toLowerCase())) {
        matches.push({
          listName,
          matchType: entry.toLowerCase() === fullName ? 'EXACT' : 'FUZZY',
          confidence: entry.toLowerCase() === fullName ? 100 : 75,
          details: `Match found in ${listName}: ${entry}`
        });
      }
    });
    
    return matches;
  }

  private getCountryRisk(country: string): number {
    // Simplified country risk scoring
    const lowRiskCountries = ['US', 'CA', 'GB', 'DE', 'FR', 'SG', 'AU', 'JP'];
    const mediumRiskCountries = ['BR', 'IN', 'ZA', 'MX', 'TR'];
    
    if (lowRiskCountries.includes(country)) return 5;
    if (mediumRiskCountries.includes(country)) return 15;
    return 30; // High risk for others
  }

  private calculateVerificationRisk(profile: KYCProfile): number {
    let risk = 0;
    
    if (!profile.identityVerification.verified) risk += 20;
    if (!profile.addressVerification.verified) risk += 15;
    if (!profile.sourceOfFunds.verified) risk += 25;
    
    return risk;
  }

  private async encryptKYCData(profile: KYCProfile): Promise<string> {
    const sensitiveData = {
      personalInfo: profile.personalInfo,
      identityVerification: profile.identityVerification,
      sourceOfFunds: profile.sourceOfFunds
    };
    return await this.cryptoManager.encryptData(JSON.stringify(sensitiveData));
  }

  private generateUserId(): string {
    return `KYC-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  async updateSanctionLists(listName: string, entries: string[]): Promise<void> {
    this.sanctionLists.set(listName, entries);
    this.emit('sanctionListUpdated', { listName, entryCount: entries.length });
  }

  async bulkScreening(userIds: string[]): Promise<Map<string, SanctionScreeningResult>> {
    const results = new Map<string, SanctionScreeningResult>();
    
    for (const userId of userIds) {
      try {
        const result = await this.performSanctionScreening(userId);
        results.set(userId, result);
      } catch (error: unknown) {
        console.error(`Bulk screening failed for user ${userId}:`, error);
      }
    }
    
    return results;
  }
}