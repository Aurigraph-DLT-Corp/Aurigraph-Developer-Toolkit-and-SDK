import { EventEmitter } from 'events';
import { KYCProfile } from './KYCManager';
import { Asset } from '../registry/AssetRegistry';
import { QuantumCryptoManagerV2 } from '../../crypto/QuantumCryptoManagerV2';

export interface JurisdictionRule {
  jurisdictionId: string;
  countryCode: string;
  jurisdictionName: string;
  regulations: RegulationFramework[];
  complianceRequirements: ComplianceRule[];
  restrictions: InvestmentRestriction[];
  reportingRequirements: ReportingRule[];
  taxImplications: TaxRule[];
  lastUpdated: Date;
  effectiveDate: Date;
}

export interface RegulationFramework {
  regulationId: string;
  name: string;
  authority: string;
  type: 'SECURITIES' | 'BANKING' | 'TAX' | 'AML' | 'DATA_PROTECTION' | 'ENVIRONMENTAL';
  applicability: string[];
  penalties: PenaltyStructure[];
  complianceDeadlines: ComplianceDeadline[];
}

export interface ComplianceRule {
  ruleId: string;
  name: string;
  description: string;
  category: string;
  mandatory: boolean;
  validationMethod: string;
  automation: AutomationConfig;
  exceptions: RuleException[];
}

export interface InvestmentRestriction {
  restrictionId: string;
  type: 'INVESTOR_TYPE' | 'AMOUNT_LIMIT' | 'ASSET_TYPE' | 'GEOGRAPHIC' | 'SECTORAL';
  description: string;
  threshold?: number;
  applicableAssets: string[];
  exemptions: string[];
}

export interface ReportingRule {
  reportId: string;
  reportType: string;
  frequency: 'REAL_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  deadline: string;
  format: 'XML' | 'JSON' | 'CSV' | 'PDF';
  recipients: string[];
  automation: boolean;
}

export interface TaxRule {
  taxId: string;
  taxType: 'CAPITAL_GAINS' | 'INCOME' | 'WITHHOLDING' | 'TRANSACTION' | 'STAMP_DUTY';
  rate: number;
  calculation: string;
  applicability: TaxApplicability;
  exemptions: TaxExemption[];
}

export interface TaxApplicability {
  assetTypes: string[];
  transactionTypes: string[];
  investorTypes: string[];
  minimumHolding?: number;
  residencyRequirement?: boolean;
}

export interface TaxExemption {
  exemptionId: string;
  description: string;
  conditions: string[];
  documentationRequired: string[];
}

export interface PenaltyStructure {
  violationType: string;
  penaltyType: 'FINE' | 'SUSPENSION' | 'REVOCATION' | 'CRIMINAL';
  amount?: number;
  description: string;
  escalation: string[];
}

export interface ComplianceDeadline {
  requirement: string;
  deadline: string;
  grace_period?: number;
  consequences: string[];
}

export interface AutomationConfig {
  automated: boolean;
  aiModel?: string;
  confidence: number;
  humanReview: boolean;
  escalationRules: string[];
}

export interface RuleException {
  exceptionId: string;
  conditions: string[];
  validUntil?: Date;
  approvedBy: string;
}

export interface ComplianceAssessment {
  assessmentId: string;
  userId: string;
  assetId?: string;
  jurisdictions: string[];
  overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'CONDITIONAL' | 'PENDING_REVIEW';
  jurisdictionResults: Map<string, JurisdictionComplianceResult>;
  restrictions: string[];
  requiredActions: string[];
  assessmentDate: Date;
  validUntil: Date;
}

export interface JurisdictionComplianceResult {
  jurisdiction: string;
  compliant: boolean;
  score: number;
  passedRules: string[];
  failedRules: string[];
  warnings: string[];
  requiredDocuments: string[];
  estimatedResolution: Date;
}

export interface AutomatedReporting {
  reportId: string;
  jurisdiction: string;
  reportType: string;
  generationDate: Date;
  submissionDate?: Date;
  status: 'GENERATED' | 'SUBMITTED' | 'ACKNOWLEDGED' | 'REJECTED';
  data: any;
  acknowledgment?: string;
}

export class CrossJurisdictionEngine extends EventEmitter {
  private jurisdictionRules: Map<string, JurisdictionRule> = new Map();
  private complianceAssessments: Map<string, ComplianceAssessment> = new Map();
  private automatedReports: Map<string, AutomatedReporting> = new Map();
  private cryptoManager: QuantumCryptoManagerV2;

  constructor(cryptoManager: QuantumCryptoManagerV2) {
    super();
    this.cryptoManager = cryptoManager;
    this.initializeJurisdictions();
    this.startAutomatedReporting();
  }

  private initializeJurisdictions(): void {
    // United States
    this.jurisdictionRules.set('US', {
      jurisdictionId: 'US',
      countryCode: 'US',
      jurisdictionName: 'United States',
      regulations: [
        {
          regulationId: 'SEC_RULE_506',
          name: 'Securities Act Rule 506',
          authority: 'SEC',
          type: 'SECURITIES',
          applicability: ['private_placement', 'tokenization'],
          penalties: [{
            violationType: 'UNREGISTERED_SALE',
            penaltyType: 'FINE',
            amount: 500000,
            description: 'Sale of unregistered securities',
            escalation: ['Civil penalties', 'Criminal charges']
          }],
          complianceDeadlines: [{
            requirement: 'Form D Filing',
            deadline: '15 days after first sale',
            consequences: ['Late filing penalties']
          }]
        }
      ],
      complianceRequirements: [
        {
          ruleId: 'US_KYC_001',
          name: 'Enhanced KYC for High-Value Assets',
          description: 'Additional verification for assets >$1M',
          category: 'IDENTITY_VERIFICATION',
          mandatory: true,
          validationMethod: 'AUTOMATED_WITH_REVIEW',
          automation: {
            automated: true,
            aiModel: 'US-KYC-AI-v2.1',
            confidence: 95,
            humanReview: true,
            escalationRules: ['high_risk_score', 'pep_match', 'sanction_hit']
          },
          exceptions: []
        }
      ],
      restrictions: [
        {
          restrictionId: 'US_ACCREDITED_001',
          type: 'INVESTOR_TYPE',
          description: 'Accredited investor requirement for securities >$1M',
          threshold: 1000000,
          applicableAssets: ['REAL_ESTATE', 'INFRASTRUCTURE'],
          exemptions: ['Regulation Crowdfunding']
        }
      ],
      reportingRequirements: [
        {
          reportId: 'US_SAR_001',
          reportType: 'Suspicious Activity Report',
          frequency: 'REAL_TIME',
          deadline: '30 days',
          format: 'XML',
          recipients: ['FinCEN'],
          automation: true
        }
      ],
      taxImplications: [
        {
          taxId: 'US_CAPITAL_GAINS',
          taxType: 'CAPITAL_GAINS',
          rate: 20, // 20% for high earners
          calculation: 'sale_price - purchase_price - costs',
          applicability: {
            assetTypes: ['ALL'],
            transactionTypes: ['SALE', 'REDEMPTION'],
            investorTypes: ['INDIVIDUAL', 'ENTITY'],
            minimumHolding: 365 // Long-term capital gains
          },
          exemptions: [
            {
              exemptionId: 'PRIMARY_RESIDENCE',
              description: 'Primary residence exemption',
              conditions: ['primary_residence', 'owned_2_years'],
              documentationRequired: ['Residence proof']
            }
          ]
        }
      ],
      lastUpdated: new Date(),
      effectiveDate: new Date()
    });

    // European Union  
    this.jurisdictionRules.set('EU', {
      jurisdictionId: 'EU',
      countryCode: 'EU',
      jurisdictionName: 'European Union',
      regulations: [
        {
          regulationId: 'MICA_2023',
          name: 'Markets in Crypto-Assets Regulation',
          authority: 'ESMA',
          type: 'SECURITIES',
          applicability: ['crypto_assets', 'tokenization'],
          penalties: [{
            violationType: 'UNLICENSED_OPERATION',
            penaltyType: 'FINE',
            amount: 5000000,
            description: 'Operating without MiCA license',
            escalation: ['Business suspension']
          }],
          complianceDeadlines: [{
            requirement: 'MiCA License Application',
            deadline: '18 months',
            consequences: ['Cannot operate in EU']
          }]
        }
      ],
      complianceRequirements: [
        {
          ruleId: 'EU_GDPR_001',
          name: 'Data Protection Compliance',
          description: 'GDPR compliance for personal data processing',
          category: 'DATA_PROTECTION',
          mandatory: true,
          validationMethod: 'AUTOMATED_PRIVACY_CHECK',
          automation: {
            automated: true,
            aiModel: 'EU-GDPR-AI-v1.3',
            confidence: 92,
            humanReview: false,
            escalationRules: ['consent_issues', 'data_breach']
          },
          exceptions: []
        }
      ],
      restrictions: [
        {
          restrictionId: 'EU_RETAIL_001',
          type: 'AMOUNT_LIMIT',
          description: 'Retail investor protection limits',
          threshold: 1000,
          applicableAssets: ['HIGH_RISK'],
          exemptions: ['Professional investors']
        }
      ],
      reportingRequirements: [
        {
          reportId: 'EU_TRANSACTION_001',
          reportType: 'Transaction Reporting',
          frequency: 'DAILY',
          deadline: 'T+1',
          format: 'XML',
          recipients: ['Local_Competent_Authority'],
          automation: true
        }
      ],
      taxImplications: [
        {
          taxId: 'EU_VAT',
          taxType: 'TRANSACTION',
          rate: 20, // Average EU VAT
          calculation: 'transaction_value * rate',
          applicability: {
            assetTypes: ['ART', 'COLLECTIBLES'],
            transactionTypes: ['SALE'],
            investorTypes: ['ALL']
          },
          exemptions: []
        }
      ],
      lastUpdated: new Date(),
      effectiveDate: new Date()
    });

    // Singapore
    this.jurisdictionRules.set('SG', {
      jurisdictionId: 'SG',
      countryCode: 'SG',
      jurisdictionName: 'Singapore',
      regulations: [
        {
          regulationId: 'MAS_PS_2023',
          name: 'Payment Services Act',
          authority: 'MAS',
          type: 'BANKING',
          applicability: ['digital_payment_tokens', 'tokenization'],
          penalties: [{
            violationType: 'UNLICENSED_DPT_SERVICE',
            penaltyType: 'FINE',
            amount: 250000,
            description: 'Providing DPT services without license',
            escalation: ['Criminal prosecution']
          }],
          complianceDeadlines: [{
            requirement: 'DPT License',
            deadline: 'Before commencing operations',
            consequences: ['Cannot operate DPT services']
          }]
        }
      ],
      complianceRequirements: [
        {
          ruleId: 'SG_ACCREDITED_001',
          name: 'Accredited Investor Verification',
          description: 'Verification of accredited investor status',
          category: 'INVESTOR_VERIFICATION',
          mandatory: true,
          validationMethod: 'AUTOMATED_FINANCIAL_CHECK',
          automation: {
            automated: true,
            aiModel: 'SG-AI-v1.0',
            confidence: 88,
            humanReview: true,
            escalationRules: ['insufficient_income', 'asset_verification_failure']
          },
          exceptions: []
        }
      ],
      restrictions: [
        {
          restrictionId: 'SG_RETAIL_001',
          type: 'INVESTOR_TYPE',
          description: 'Retail investors limited to specific products',
          applicableAssets: ['APPROVED_RETAIL_PRODUCTS'],
          exemptions: ['Accredited investors']
        }
      ],
      reportingRequirements: [
        {
          reportId: 'SG_STR_001',
          reportType: 'Suspicious Transaction Report',
          frequency: 'REAL_TIME',
          deadline: '15 days',
          format: 'XML',
          recipients: ['STRO'],
          automation: true
        }
      ],
      taxImplications: [
        {
          taxId: 'SG_NO_CAPITAL_GAINS',
          taxType: 'CAPITAL_GAINS',
          rate: 0,
          calculation: 'No capital gains tax for individuals',
          applicability: {
            assetTypes: ['ALL'],
            transactionTypes: ['SALE'],
            investorTypes: ['INDIVIDUAL']
          },
          exemptions: []
        }
      ],
      lastUpdated: new Date(),
      effectiveDate: new Date()
    });
  }

  async assessMultiJurisdictionCompliance(
    user: KYCProfile,
    asset?: Asset,
    transactionType?: string
  ): Promise<ComplianceAssessment> {
    
    const assessmentId = this.generateAssessmentId();
    const applicableJurisdictions = this.determineApplicableJurisdictions(user, asset);
    
    const assessment: ComplianceAssessment = {
      assessmentId,
      userId: user.userId,
      assetId: asset?.id,
      jurisdictions: applicableJurisdictions,
      overallStatus: 'PENDING_REVIEW',
      jurisdictionResults: new Map(),
      restrictions: [],
      requiredActions: [],
      assessmentDate: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    // Assess compliance for each jurisdiction
    for (const jurisdiction of applicableJurisdictions) {
      const result = await this.assessJurisdictionCompliance(jurisdiction, user, asset, transactionType);
      assessment.jurisdictionResults.set(jurisdiction, result);
      
      if (!result.compliant) {
        assessment.overallStatus = 'NON_COMPLIANT';
        assessment.requiredActions.push(...result.failedRules.map(rule => 
          `${jurisdiction}: Address ${rule}`
        ));
      }
      
      assessment.restrictions.push(...result.warnings);
    }

    // Determine overall status
    if (assessment.overallStatus !== 'NON_COMPLIANT') {
      const allCompliant = Array.from(assessment.jurisdictionResults.values())
        .every(r => r.compliant);
      assessment.overallStatus = allCompliant ? 'COMPLIANT' : 'CONDITIONAL';
    }

    this.complianceAssessments.set(assessmentId, assessment);
    
    this.emit('complianceAssessed', { assessmentId, status: assessment.overallStatus });
    
    return assessment;
  }

  private determineApplicableJurisdictions(user: KYCProfile, asset?: Asset): string[] {
    const jurisdictions = new Set<string>();
    
    // User's residence jurisdiction
    jurisdictions.add(user.personalInfo.residenceCountry);
    
    // User's nationality jurisdiction
    if (user.personalInfo.nationality !== user.personalInfo.residenceCountry) {
      jurisdictions.add(user.personalInfo.nationality);
    }

    // Asset jurisdiction
    if (asset?.metadata.location) {
      const assetCountry = this.extractCountryFromLocation(asset.metadata.location);
      if (assetCountry) {
        jurisdictions.add(assetCountry);
      }
    }

    // Platform operation jurisdictions
    jurisdictions.add('US'); // Platform registered in US
    
    return Array.from(jurisdictions);
  }

  private async assessJurisdictionCompliance(
    jurisdiction: string,
    user: KYCProfile,
    asset?: Asset,
    transactionType?: string
  ): Promise<JurisdictionComplianceResult> {
    
    const rules = this.jurisdictionRules.get(jurisdiction);
    if (!rules) {
      return {
        jurisdiction,
        compliant: false,
        score: 0,
        passedRules: [],
        failedRules: ['Jurisdiction rules not configured'],
        warnings: [],
        requiredDocuments: [],
        estimatedResolution: new Date()
      };
    }

    const result: JurisdictionComplianceResult = {
      jurisdiction,
      compliant: true,
      score: 100,
      passedRules: [],
      failedRules: [],
      warnings: [],
      requiredDocuments: [],
      estimatedResolution: new Date()
    };

    // Check compliance requirements
    for (const requirement of rules.complianceRequirements) {
      const ruleResult = await this.evaluateComplianceRule(requirement, user, asset, transactionType);
      
      if (ruleResult.passed) {
        result.passedRules.push(requirement.name);
      } else {
        result.failedRules.push(requirement.name);
        result.compliant = false;
        result.score -= 20;
        
        if (requirement.mandatory) {
          result.requiredDocuments.push(...(ruleResult.requiredDocuments || []));
        }
      }
    }

    // Check investment restrictions
    for (const restriction of rules.restrictions) {
      const restrictionResult = this.evaluateInvestmentRestriction(restriction, user, asset);
      
      if (!restrictionResult.compliant) {
        result.warnings.push(restrictionResult.message);
        result.score -= 10;
      }
    }

    // Check tax compliance
    for (const taxRule of rules.taxImplications) {
      const taxResult = this.evaluateTaxCompliance(taxRule, user, asset, transactionType);
      
      if (!taxResult.compliant) {
        result.warnings.push(`Tax compliance: ${taxResult.message}`);
        result.score -= 5;
      }
    }

    result.score = Math.max(0, result.score);
    
    return result;
  }

  private async evaluateComplianceRule(
    rule: ComplianceRule,
    user: KYCProfile,
    asset?: Asset,
    transactionType?: string
  ): Promise<{ passed: boolean; requiredDocuments?: string[] }> {
    
    switch (rule.category) {
      case 'IDENTITY_VERIFICATION':
        return {
          passed: user.identityVerification.verified && user.verification.score >= 85,
          requiredDocuments: user.identityVerification.verified ? [] : ['Enhanced ID verification']
        };
        
      case 'INVESTOR_VERIFICATION':
        return {
          passed: user.sourceOfFunds.verified && user.sourceOfFunds.netWorth >= 1000000,
          requiredDocuments: !user.sourceOfFunds.verified ? ['Financial statements', 'Income verification'] : []
        };
        
      case 'DATA_PROTECTION':
        // Simulate GDPR compliance check
        return {
          passed: true, // Assume GDPR compliance implemented
          requiredDocuments: []
        };
        
      default:
        // Use AI model if configured
        if (rule.automation.automated && rule.automation.aiModel) {
          return await this.aiEvaluateRule(rule, user, asset);
        }
        
        return { passed: false, requiredDocuments: ['Manual review required'] };
    }
  }

  private async aiEvaluateRule(
    rule: ComplianceRule,
    user: KYCProfile,
    asset?: Asset
  ): Promise<{ passed: boolean; requiredDocuments?: string[] }> {
    // Simulate AI-powered rule evaluation
    const aiScore = Math.random() * 100;
    const passed = aiScore >= rule.automation.confidence;
    
    return {
      passed,
      requiredDocuments: passed ? [] : ['AI flagged for manual review']
    };
  }

  private evaluateInvestmentRestriction(
    restriction: InvestmentRestriction,
    user: KYCProfile,
    asset?: Asset
  ): { compliant: boolean; message: string } {
    
    switch (restriction.type) {
      case 'INVESTOR_TYPE':
        // Check if user meets investor type requirements
        const isAccredited = user.sourceOfFunds.netWorth >= 1000000;
        return {
          compliant: isAccredited,
          message: isAccredited ? '' : 'Accredited investor status required'
        };
        
      case 'AMOUNT_LIMIT':
        // Check investment amount limits (would need transaction amount)
        return { compliant: true, message: '' }; // Default pass
        
      case 'ASSET_TYPE':
        if (asset && restriction.applicableAssets.includes(asset.type)) {
          return { compliant: false, message: `Asset type ${asset.type} restricted in this jurisdiction` };
        }
        return { compliant: true, message: '' };
        
      default:
        return { compliant: true, message: '' };
    }
  }

  private evaluateTaxCompliance(
    taxRule: TaxRule,
    user: KYCProfile,
    asset?: Asset,
    transactionType?: string
  ): { compliant: boolean; message: string; taxAmount?: number } {
    
    // Check if tax rule applies
    const applies = this.doesTaxRuleApply(taxRule, user, asset, transactionType);
    
    if (!applies) {
      return { compliant: true, message: 'Tax rule does not apply' };
    }

    // For now, assume tax compliance is handled automatically
    return {
      compliant: true,
      message: `${taxRule.taxType} tax will be applied at ${taxRule.rate}%`,
      taxAmount: 0 // Would calculate based on transaction amount
    };
  }

  private doesTaxRuleApply(
    taxRule: TaxRule,
    user: KYCProfile,
    asset?: Asset,
    transactionType?: string
  ): boolean {
    
    const applicability = taxRule.applicability;
    
    // Check asset type
    if (asset && applicability.assetTypes.length > 0 && 
        !applicability.assetTypes.includes('ALL') &&
        !applicability.assetTypes.includes(asset.type)) {
      return false;
    }

    // Check transaction type
    if (transactionType && applicability.transactionTypes.length > 0 &&
        !applicability.transactionTypes.includes(transactionType)) {
      return false;
    }

    // Check investor type (simplified)
    const investorType = user.sourceOfFunds.netWorth >= 1000000 ? 'ACCREDITED' : 'RETAIL';
    if (applicability.investorTypes.length > 0 &&
        !applicability.investorTypes.includes(investorType) &&
        !applicability.investorTypes.includes('ALL')) {
      return false;
    }

    return true;
  }

  async generateAutomatedReport(jurisdiction: string, reportType: string): Promise<string> {
    const rules = this.jurisdictionRules.get(jurisdiction);
    if (!rules) {
      throw new Error(`Jurisdiction rules not found: ${jurisdiction}`);
    }

    const reportRule = rules.reportingRequirements.find(r => r.reportType === reportType);
    if (!reportRule) {
      throw new Error(`Report type not found: ${reportType}`);
    }

    const reportId = this.generateReportId();
    
    // Generate report data based on type
    const reportData = await this.generateReportData(jurisdiction, reportType);
    
    const automatedReport: AutomatedReporting = {
      reportId,
      jurisdiction,
      reportType,
      generationDate: new Date(),
      status: 'GENERATED',
      data: reportData
    };

    // Auto-submit if configured
    if (reportRule.automation) {
      await this.submitReport(reportId);
    }

    this.automatedReports.set(reportId, automatedReport);
    
    this.emit('reportGenerated', { reportId, jurisdiction, reportType });
    
    return reportId;
  }

  private async generateReportData(jurisdiction: string, reportType: string): Promise<any> {
    const baseData = {
      reportingEntity: 'Aurigraph DLT Platform',
      jurisdiction,
      reportType,
      reportingPeriod: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      generatedAt: new Date()
    };

    switch (reportType) {
      case 'Suspicious Activity Report':
        return {
          ...baseData,
          suspiciousActivities: [], // Would populate with actual suspicious activities
          totalTransactions: 1250000,
          flaggedTransactions: 15,
          flagRate: 0.0012
        };
        
      case 'Transaction Reporting':
        return {
          ...baseData,
          totalTransactions: 1250000,
          totalValue: 2500000000,
          assetBreakdown: {
            'REAL_ESTATE': 45,
            'COMMODITIES': 25,
            'CARBON_CREDITS': 20,
            'OTHER': 10
          }
        };
        
      default:
        return baseData;
    }
  }

  private async submitReport(reportId: string): Promise<boolean> {
    const report = this.automatedReports.get(reportId);
    if (!report) return false;

    try {
      // Simulate report submission to regulatory authority
      const submissionResult = await this.simulateRegulatorySubmission(report);
      
      report.submissionDate = new Date();
      report.status = 'SUBMITTED';
      
      if (submissionResult.acknowledged) {
        report.status = 'ACKNOWLEDGED';
        report.acknowledgment = submissionResult.acknowledgmentNumber;
      }

      this.emit('reportSubmitted', { reportId, status: report.status });
      
      return true;
      
    } catch (error) {
      report.status = 'REJECTED';
      this.emit('reportRejected', { reportId, error: error.message });
      return false;
    }
  }

  private async simulateRegulatorySubmission(report: AutomatedReporting): Promise<{ acknowledged: boolean; acknowledgmentNumber?: string }> {
    // Simulate regulatory authority response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const acknowledged = Math.random() > 0.1; // 90% success rate
    
    return {
      acknowledged,
      acknowledgmentNumber: acknowledged ? `ACK-${Date.now()}` : undefined
    };
  }

  private startAutomatedReporting(): void {
    // Check for due reports every hour
    setInterval(async () => {
      await this.processAutomatedReporting();
    }, 3600000); // 1 hour
  }

  private async processAutomatedReporting(): Promise<void> {
    for (const [jurisdiction, rules] of this.jurisdictionRules.entries()) {
      for (const reportRule of rules.reportingRequirements) {
        if (reportRule.automation && this.isReportDue(reportRule)) {
          try {
            await this.generateAutomatedReport(jurisdiction, reportRule.reportType);
          } catch (error) {
            this.emit('automatedReportingError', { jurisdiction, reportType: reportRule.reportType, error });
          }
        }
      }
    }
  }

  private isReportDue(reportRule: ReportingRule): boolean {
    // Simplified due date calculation
    const now = new Date();
    const hour = now.getHours();
    
    switch (reportRule.frequency) {
      case 'DAILY':
        return hour === 0; // Midnight
      case 'WEEKLY':
        return now.getDay() === 1 && hour === 0; // Monday midnight
      case 'MONTHLY':
        return now.getDate() === 1 && hour === 0; // First of month
      case 'QUARTERLY':
        return [1, 4, 7, 10].includes(now.getMonth() + 1) && now.getDate() === 1 && hour === 0;
      case 'ANNUALLY':
        return now.getMonth() === 0 && now.getDate() === 1 && hour === 0; // January 1st
      default:
        return false;
    }
  }

  async updateJurisdictionRules(jurisdiction: string, updates: Partial<JurisdictionRule>): Promise<boolean> {
    const existing = this.jurisdictionRules.get(jurisdiction);
    if (!existing) return false;

    const updated = { ...existing, ...updates, lastUpdated: new Date() };
    this.jurisdictionRules.set(jurisdiction, updated);
    
    this.emit('jurisdictionRulesUpdated', { jurisdiction, updates: Object.keys(updates) });
    
    return true;
  }

  async getComplianceGaps(assessmentId: string): Promise<{
    criticalGaps: ComplianceGap[];
    warnings: ComplianceGap[];
    recommendations: string[];
  }> {
    const assessment = this.complianceAssessments.get(assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    const criticalGaps: ComplianceGap[] = [];
    const warnings: ComplianceGap[] = [];

    for (const [jurisdiction, result] of assessment.jurisdictionResults.entries()) {
      for (const failedRule of result.failedRules) {
        criticalGaps.push({
          jurisdiction,
          ruleType: failedRule,
          severity: 'CRITICAL',
          description: `Failed mandatory rule: ${failedRule}`,
          resolution: `Address ${failedRule} requirements for ${jurisdiction}`,
          estimatedTime: 7 // days
        });
      }

      for (const warning of result.warnings) {
        warnings.push({
          jurisdiction,
          ruleType: 'WARNING',
          severity: 'WARNING',
          description: warning,
          resolution: 'Consider addressing to improve compliance score',
          estimatedTime: 3 // days
        });
      }
    }

    return {
      criticalGaps,
      warnings,
      recommendations: this.generateComplianceRecommendations(assessment)
    };
  }

  private generateComplianceRecommendations(assessment: ComplianceAssessment): string[] {
    const recommendations: string[] = [];
    
    if (assessment.overallStatus === 'NON_COMPLIANT') {
      recommendations.push('Address all critical compliance gaps before proceeding');
      recommendations.push('Consider legal consultation for complex jurisdictions');
    }
    
    if (assessment.jurisdictions.length > 3) {
      recommendations.push('Consider simplifying jurisdiction exposure to reduce compliance complexity');
    }

    const lowScoreJurisdictions = Array.from(assessment.jurisdictionResults.entries())
      .filter(([_, result]) => result.score < 80);
      
    if (lowScoreJurisdictions.length > 0) {
      recommendations.push(`Focus compliance efforts on: ${lowScoreJurisdictions.map(([j, _]) => j).join(', ')}`);
    }

    return recommendations;
  }

  private extractCountryFromLocation(location: string): string | null {
    // Simplified country extraction - in real implementation would use geocoding
    if (location.includes('USA') || location.includes('United States')) return 'US';
    if (location.includes('UK') || location.includes('United Kingdom')) return 'UK';
    if (location.includes('Singapore')) return 'SG';
    if (location.includes('Germany')) return 'DE';
    if (location.includes('France')) return 'FR';
    
    return null;
  }

  async getJurisdictionRules(jurisdiction: string): Promise<JurisdictionRule | null> {
    return this.jurisdictionRules.get(jurisdiction) || null;
  }

  async getSupportedJurisdictions(): Promise<string[]> {
    return Array.from(this.jurisdictionRules.keys());
  }

  async getComplianceReport(): Promise<{
    totalAssessments: number;
    complianceRate: number;
    jurisdictionBreakdown: Record<string, number>;
    commonGaps: string[];
    automatedReports: number;
  }> {
    const assessments = Array.from(this.complianceAssessments.values());
    
    const report = {
      totalAssessments: assessments.length,
      complianceRate: 0,
      jurisdictionBreakdown: {} as Record<string, number>,
      commonGaps: [] as string[],
      automatedReports: this.automatedReports.size
    };

    if (assessments.length > 0) {
      const compliantCount = assessments.filter(a => a.overallStatus === 'COMPLIANT').length;
      report.complianceRate = (compliantCount / assessments.length) * 100;
    }

    // Jurisdiction breakdown
    for (const assessment of assessments) {
      for (const jurisdiction of assessment.jurisdictions) {
        report.jurisdictionBreakdown[jurisdiction] = (report.jurisdictionBreakdown[jurisdiction] || 0) + 1;
      }
    }

    // Common gaps analysis
    const gapCounts = new Map<string, number>();
    for (const assessment of assessments) {
      for (const action of assessment.requiredActions) {
        const gap = action.split(':')[1]?.trim() || action;
        gapCounts.set(gap, (gapCounts.get(gap) || 0) + 1);
      }
    }

    report.commonGaps = Array.from(gapCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([gap, _]) => gap);

    return report;
  }

  private generateAssessmentId(): string {
    return `ASSESS-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }

  private generateReportId(): string {
    return `RPT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  }
}

interface ComplianceGap {
  jurisdiction: string;
  ruleType: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  description: string;
  resolution: string;
  estimatedTime: number; // days
}