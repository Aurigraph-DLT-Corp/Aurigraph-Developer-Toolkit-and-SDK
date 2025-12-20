/**
 * Compliance API Service
 * Integrates with V11 compliance endpoints
 */

import axios, { AxiosInstance } from 'axios';

export interface ComplianceMetrics {
  totalIdentities: number;
  activeIdentities: number;
  revokedIdentities: number;
  totalTransfers: number;
  approvedTransfers: number;
  rejectedTransfers: number;
  approvalRate: number;
  complianceRate: number;
}

export interface ComplianceAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface TokenCompliance {
  tokenId: string;
  jurisdiction: string;
  complianceStatus: 'compliant' | 'non_compliant' | 'pending';
  lastCheckDate: string;
  complianceRate: number;
  issues: string[];
}

export interface IdentityRecord {
  address: string;
  kycLevel: string;
  country: string;
  verified: boolean;
  registeredAt: string;
  expiryDate?: string;
  status: 'active' | 'revoked' | 'expired';
}

export interface TransferComplianceRequest {
  tokenId: string;
  from: string;
  to: string;
  amount: number;
}

export interface TransferComplianceResponse {
  allowed: boolean;
  violations: string[];
  reason?: string;
}

export interface ComplianceReport {
  tokenId: string;
  reportType: string;
  reportDate: string;
  jurisdiction: string;
  complianceStatus: string;
  transferStats: {
    total: number;
    approved: number;
    rejected: number;
    approvalRate: string;
  };
  identityStats: {
    total: number;
    active: number;
    revoked: number;
  };
  riskAssessment: {
    riskScore: number;
    flaggedTransactions: number;
    issues: string[];
  };
}

// Helper to get production-safe base URL
const getProductionBaseURL = (): string => {
  const isProduction = typeof window !== 'undefined' &&
    (window.location.hostname === 'dlt.aurigraph.io' || window.location.protocol === 'https:');
  return isProduction
    ? 'https://dlt.aurigraph.io/api/v11'
    : (import.meta.env.VITE_API_URL || 'http://localhost:9003') + '/api/v11';
};

class ComplianceApiService {
  private apiClient: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = getProductionBaseURL()) {
    this.baseURL = baseURL;
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Identity Management
  async registerIdentity(address: string, kycLevel: string, country: string, documentHash: string) {
    const response = await this.apiClient.post('/compliance/erc3643/identities/register', {
      address,
      kycLevel,
      country,
      documentHash,
    });
    return response.data;
  }

  async getIdentity(address: string): Promise<IdentityRecord> {
    const response = await this.apiClient.get(`/compliance/erc3643/identities/${address}`);
    return response.data;
  }

  async validateIdentity(address: string): Promise<boolean> {
    const response = await this.apiClient.get(`/compliance/erc3643/identities/${address}/valid`);
    return response.data.valid;
  }

  async revokeIdentity(address: string, reason: string) {
    const response = await this.apiClient.post(`/compliance/erc3643/identities/${address}/revoke`, {
      reason,
    });
    return response.data;
  }

  async getIdentityStats() {
    const response = await this.apiClient.get('/compliance/erc3643/identities/stats');
    return response.data;
  }

  // Transfer Compliance
  async checkTransferCompliance(request: TransferComplianceRequest): Promise<TransferComplianceResponse> {
    const response = await this.apiClient.post('/compliance/erc3643/transfers/check', request);
    return response.data;
  }

  async executeTransfer(tokenId: string, from: string, to: string, amount: number) {
    const response = await this.apiClient.post('/compliance/erc3643/transfers/execute', {
      tokenId,
      from,
      to,
      amount,
    });
    return response.data;
  }

  async getTransferStats() {
    const response = await this.apiClient.get('/compliance/erc3643/transfers/stats');
    return response.data;
  }

  async getTransferHistory(tokenId: string) {
    const response = await this.apiClient.get(`/compliance/erc3643/transfers/history/${tokenId}`);
    return response.data;
  }

  // Compliance Registry
  async registerTokenCompliance(tokenId: string, jurisdiction: string, rules: string[]) {
    const response = await this.apiClient.post(`/compliance/erc3643/tokens/${tokenId}/compliance/register`, {
      jurisdiction,
      rules: rules.join(','),
    });
    return response.data;
  }

  async checkTokenCompliance(tokenId: string): Promise<TokenCompliance> {
    const response = await this.apiClient.post(`/compliance/erc3643/tokens/${tokenId}/compliance/check`);
    return response.data;
  }

  async addCertification(tokenId: string, certName: string, issuer: string, expiryDate: string) {
    const response = await this.apiClient.post(`/compliance/erc3643/tokens/${tokenId}/certifications/add`, {
      name: certName,
      issuer,
      expiryDate,
      certificateHash: '',
    });
    return response.data;
  }

  async getComplianceStats() {
    const response = await this.apiClient.get('/compliance/erc3643/compliance/stats');
    return response.data;
  }

  // Country Restrictions
  async restrictCountry(countryCode: string) {
    const response = await this.apiClient.post(`/compliance/erc3643/countries/restrict/${countryCode}`);
    return response.data;
  }

  async unrestrictCountry(countryCode: string) {
    const response = await this.apiClient.post(`/compliance/erc3643/countries/unrestrict/${countryCode}`);
    return response.data;
  }

  // Reporting
  async getTokenComplianceReport(tokenId: string, startDate?: string, endDate?: string): Promise<ComplianceReport> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await this.apiClient.get(
      `/compliance/reports/token/${tokenId}?${params.toString()}`
    );
    return response.data;
  }

  async getTransferReport(tokenId: string) {
    const response = await this.apiClient.get(`/compliance/reports/transfers/${tokenId}`);
    return response.data;
  }

  async getKYCAMLReport() {
    const response = await this.apiClient.get('/compliance/reports/kyc-aml');
    return response.data;
  }

  async getAuditTrailReport(tokenId: string, limit: number = 100) {
    const response = await this.apiClient.get(
      `/compliance/reports/audit-trail/${tokenId}?limit=${limit}`
    );
    return response.data;
  }

  async exportTokenReport(tokenId: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await this.apiClient.get(
      `/compliance/reports/export/token/${tokenId}?${params.toString()}`,
      { responseType: 'blob' }
    );
    return response.data;
  }

  // Dashboard
  async getDashboardMetrics() {
    const response = await this.apiClient.get('/compliance/dashboard/metrics');
    return response.data;
  }

  async getAlerts() {
    const response = await this.apiClient.get('/compliance/dashboard/alerts');
    return response.data;
  }

  async getComplianceStatus() {
    const response = await this.apiClient.get('/compliance/dashboard/status');
    return response.data;
  }

  async getTopRisks(limit: number = 10) {
    const response = await this.apiClient.get(`/compliance/dashboard/risks?limit=${limit}`);
    return response.data;
  }

  async getSystemHealth() {
    const response = await this.apiClient.get('/compliance/dashboard/health');
    return response.data;
  }

  // Smart Contract Bridge
  async registerContract(contractAddress: string, tokenId: string) {
    const response = await this.apiClient.post('/compliance/bridge/contracts/register', {
      contractAddress,
      tokenId,
    });
    return response.data;
  }

  async processTransferApproval(
    contractAddress: string,
    from: string,
    to: string,
    amount: number
  ) {
    const response = await this.apiClient.post('/compliance/bridge/transfers/approve', {
      contractAddress,
      from,
      to,
      amount,
    });
    return response.data;
  }

  async syncIdentity(contractAddress: string, address: string, identityData: Record<string, string>) {
    const response = await this.apiClient.post('/compliance/bridge/identities/sync', {
      contractAddress,
      address,
      identityData,
    });
    return response.data;
  }

  async getContractState(contractAddress: string) {
    const response = await this.apiClient.get(`/compliance/bridge/contracts/${contractAddress}/state`);
    return response.data;
  }

  async getBridgeStats() {
    const response = await this.apiClient.get('/compliance/bridge/stats');
    return response.data;
  }

  // Health Check
  async healthCheck() {
    const response = await this.apiClient.get('/compliance/erc3643/health');
    return response.data;
  }
}

export default new ComplianceApiService();
