// ================================================================================
// AUREX LAUNCHPAD™ CARBON MATURITY NAVIGATOR API SERVICE
// Sub-Application #13: Frontend API Integration Layer
// Module ID: LAU-MAT-013-FE-API - Carbon Maturity Navigator API Service
// Created: August 7, 2025
// ================================================================================

import {
  Assessment,
  AssessmentFormData,
  AssessmentQuestion,
  AssessmentResponse,
  AssessmentEvidence,
  AssessmentScoring,
  AssessmentProgress,
  BenchmarkComparison,
  ImprovementRoadmap,
  AssessmentReport,
  ResponseSubmission,
  AssessmentStartResponse,
  ResponseSubmissionResponse,
  EvidenceUploadResponse,
  IndustryCategory,
  EvidenceType,
  ReportType,
  ReportFormat,
  ApiError
} from '../types/carbonMaturityNavigator';

// Base API configuration
const API_BASE_URL = '/api/maturity-navigator';
const API_TIMEOUT = 30000; // 30 seconds

class CarbonMaturityNavigatorApiService {
  private baseUrl: string;
  private timeout: number;

  constructor(baseUrl: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  // ================================================================================
  // PRIVATE UTILITY METHODS
  // ================================================================================

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers here
        // 'Authorization': `Bearer ${getAuthToken()}`
      },
      ...options,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...defaultOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: `HTTP ${response.status}: ${response.statusText}`,
          status_code: response.status,
          timestamp: new Date().toISOString()
        }));
        throw new ApiError(errorData.detail, response.status);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      
      throw new ApiError(`Network error: ${error.message}`, 0);
    }
  }

  private async uploadFile(
    endpoint: string,
    formData: FormData
  ): Promise<EvidenceUploadResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout * 2); // Double timeout for file uploads

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          // Don't set Content-Type for FormData, let browser set it with boundary
          // 'Authorization': `Bearer ${getAuthToken()}`
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          detail: `HTTP ${response.status}: ${response.statusText}`,
          status_code: response.status,
          timestamp: new Date().toISOString()
        }));
        throw new ApiError(errorData.detail, response.status);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error.name === 'AbortError') {
        throw new ApiError('File upload timeout', 408);
      }
      
      throw new ApiError(`Upload error: ${error.message}`, 0);
    }
  }

  // ================================================================================
  // ASSESSMENT LIFECYCLE METHODS
  // ================================================================================

  /**
   * Start a new carbon maturity assessment
   */
  async startAssessment(data: AssessmentFormData): Promise<AssessmentStartResponse> {
    return this.makeRequest<AssessmentStartResponse>('/assessment/start', {
      method: 'POST',
      body: JSON.stringify({
        title: data.title,
        organization_id: data.organization_id,
        framework_id: data.framework_id,
        industry_category: data.industry_category,
        planned_start_date: data.planned_start_date?.toISOString(),
        planned_completion_date: data.planned_completion_date?.toISOString(),
        assessment_scope: data.assessment_scope,
      }),
    });
  }

  /**
   * Get assessment details by ID
   */
  async getAssessment(assessmentId: string): Promise<Assessment> {
    return this.makeRequest<Assessment>(`/assessment/${assessmentId}`);
  }

  /**
   * Get questions for specific maturity level
   */
  async getQuestionsByLevel(
    frameworkId: string,
    level: number,
    industry: IndustryCategory,
    assessmentId?: string
  ): Promise<AssessmentQuestion[]> {
    const params = new URLSearchParams({
      industry: industry.toString(),
      ...(assessmentId && { assessment_id: assessmentId }),
    });

    return this.makeRequest<AssessmentQuestion[]>(
      `/questions/${frameworkId}/${level}?${params.toString()}`
    );
  }

  /**
   * Submit assessment responses
   */
  async submitResponses(data: ResponseSubmission): Promise<ResponseSubmissionResponse> {
    return this.makeRequest<ResponseSubmissionResponse>('/responses/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Get assessment progress
   */
  async getAssessmentProgress(assessmentId: string): Promise<AssessmentProgress> {
    return this.makeRequest<AssessmentProgress>(`/progress/${assessmentId}`);
  }

  /**
   * Auto-save assessment responses (background operation)
   */
  async autoSaveResponses(data: ResponseSubmission): Promise<{ status: string }> {
    return this.makeRequest<{ status: string }>('/responses/autosave', {
      method: 'POST',
      body: JSON.stringify({ ...data, auto_save: true }),
    });
  }

  // ================================================================================
  // EVIDENCE MANAGEMENT METHODS
  // ================================================================================

  /**
   * Upload evidence file for assessment
   */
  async uploadEvidence(
    assessmentId: string,
    file: File,
    evidenceData: {
      response_id?: string;
      evidence_type: EvidenceType;
      title: string;
      description?: string;
    }
  ): Promise<EvidenceUploadResponse> {
    const formData = new FormData();
    formData.append('assessment_id', assessmentId);
    formData.append('file', file);
    formData.append('evidence_type', evidenceData.evidence_type);
    formData.append('title', evidenceData.title);
    
    if (evidenceData.response_id) {
      formData.append('response_id', evidenceData.response_id);
    }
    
    if (evidenceData.description) {
      formData.append('description', evidenceData.description);
    }

    return this.uploadFile('/evidence/upload', formData);
  }

  /**
   * Get all evidence for assessment
   */
  async getAssessmentEvidence(assessmentId: string): Promise<AssessmentEvidence[]> {
    return this.makeRequest<AssessmentEvidence[]>(`/evidence/${assessmentId}`);
  }

  /**
   * Delete evidence file
   */
  async deleteEvidence(evidenceId: string): Promise<{ status: string }> {
    return this.makeRequest<{ status: string }>(`/evidence/${evidenceId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Download evidence file
   */
  async downloadEvidence(evidenceId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/evidence/download/${evidenceId}`, {
      headers: {
        // 'Authorization': `Bearer ${getAuthToken()}`
      },
    });

    if (!response.ok) {
      throw new ApiError('Failed to download evidence', response.status);
    }

    return await response.blob();
  }

  // ================================================================================
  // SCORING AND BENCHMARKING METHODS
  // ================================================================================

  /**
   * Calculate assessment scoring
   */
  async calculateScoring(
    assessmentId: string,
    forceRecalculation: boolean = false
  ): Promise<AssessmentScoring> {
    const params = new URLSearchParams();
    if (forceRecalculation) {
      params.append('force_recalculation', 'true');
    }

    const response = await this.makeRequest<{
      assessment_id: string;
      scoring_results: AssessmentScoring;
      calculation_date: string;
      next_steps: string[];
    }>(`/scoring/calculate/${assessmentId}?${params.toString()}`);

    return response.scoring_results;
  }

  /**
   * Get industry benchmarks
   */
  async getIndustryBenchmarks(
    industry: IndustryCategory,
    organizationSize: string = 'medium',
    region?: string
  ): Promise<BenchmarkComparison> {
    const params = new URLSearchParams({
      organization_size: organizationSize,
    });
    
    if (region) {
      params.append('region', region);
    }

    return this.makeRequest<BenchmarkComparison>(
      `/benchmarks/${industry}?${params.toString()}`
    );
  }

  /**
   * Compare with peer organizations
   */
  async getPeerComparison(
    assessmentId: string,
    industry: IndustryCategory
  ): Promise<BenchmarkComparison> {
    return this.makeRequest<BenchmarkComparison>(
      `/benchmarks/compare/${assessmentId}?industry=${industry}`
    );
  }

  // ================================================================================
  // IMPROVEMENT ROADMAP METHODS
  // ================================================================================

  /**
   * Generate improvement roadmap
   */
  async generateRoadmap(
    assessmentId: string,
    targetLevel: number
  ): Promise<ImprovementRoadmap> {
    return this.makeRequest<ImprovementRoadmap>('/roadmap/generate', {
      method: 'POST',
      body: JSON.stringify({
        assessment_id: assessmentId,
        target_level: targetLevel,
      }),
    });
  }

  /**
   * Get existing roadmap for assessment
   */
  async getAssessmentRoadmap(assessmentId: string): Promise<ImprovementRoadmap> {
    return this.makeRequest<ImprovementRoadmap>(`/roadmap/${assessmentId}`);
  }

  /**
   * Update roadmap priorities
   */
  async updateRoadmapPriorities(
    roadmapId: string,
    priorities: { action_id: string; priority_level: number }[]
  ): Promise<ImprovementRoadmap> {
    return this.makeRequest<ImprovementRoadmap>(`/roadmap/${roadmapId}/priorities`, {
      method: 'PUT',
      body: JSON.stringify({ priorities }),
    });
  }

  // ================================================================================
  // REPORTING METHODS
  // ================================================================================

  /**
   * Generate assessment report
   */
  async generateReport(
    assessmentId: string,
    reportType: ReportType,
    reportFormat: ReportFormat = ReportFormat.PDF,
    config?: any
  ): Promise<AssessmentReport> {
    return this.makeRequest<AssessmentReport>('/reports/generate', {
      method: 'POST',
      body: JSON.stringify({
        assessment_id: assessmentId,
        report_type: reportType,
        report_format: reportFormat,
        report_config: config,
      }),
    });
  }

  /**
   * Get report status
   */
  async getReportStatus(reportId: string): Promise<AssessmentReport> {
    return this.makeRequest<AssessmentReport>(`/reports/${reportId}/status`);
  }

  /**
   * Download generated report
   */
  async downloadReport(reportId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/reports/download/${reportId}`, {
      headers: {
        // 'Authorization': `Bearer ${getAuthToken()}`
      },
    });

    if (!response.ok) {
      throw new ApiError('Failed to download report', response.status);
    }

    return await response.blob();
  }

  /**
   * Get assessment reports list
   */
  async getAssessmentReports(assessmentId: string): Promise<AssessmentReport[]> {
    return this.makeRequest<AssessmentReport[]>(`/reports/assessment/${assessmentId}`);
  }

  // ================================================================================
  // SEARCH AND FILTER METHODS
  // ================================================================================

  /**
   * Search assessments
   */
  async searchAssessments(query: {
    search?: string;
    status?: string[];
    industry?: IndustryCategory[];
    level?: number[];
    date_range?: { start: string; end: string };
    limit?: number;
    offset?: number;
  }): Promise<{
    assessments: Assessment[];
    total: number;
    has_more: boolean;
  }> {
    return this.makeRequest<{
      assessments: Assessment[];
      total: number;
      has_more: boolean;
    }>('/assessments/search', {
      method: 'POST',
      body: JSON.stringify(query),
    });
  }

  /**
   * Get assessment statistics
   */
  async getAssessmentStatistics(organizationId?: string): Promise<{
    total_assessments: number;
    completed_assessments: number;
    average_score: number;
    average_level: number;
    industry_distribution: Record<string, number>;
    level_distribution: Record<string, number>;
  }> {
    const params = organizationId 
      ? `?organization_id=${organizationId}` 
      : '';

    return this.makeRequest<{
      total_assessments: number;
      completed_assessments: number;
      average_score: number;
      average_level: number;
      industry_distribution: Record<string, number>;
      level_distribution: Record<string, number>;
    }>(`/statistics${params}`);
  }

  // ================================================================================
  // ADMIN METHODS
  // ================================================================================

  /**
   * Get assessment audit trail
   */
  async getAuditTrail(assessmentId: string): Promise<{
    events: {
      id: string;
      action_type: string;
      action_description: string;
      user_id: string;
      timestamp: string;
      affected_entity: string;
      entity_id: string;
      old_values?: Record<string, any>;
      new_values?: Record<string, any>;
    }[];
    total: number;
  }> {
    return this.makeRequest<{
      events: any[];
      total: number;
    }>(`/audit/${assessmentId}`);
  }

  /**
   * Export assessment data
   */
  async exportAssessmentData(
    assessmentId: string,
    format: 'json' | 'excel' = 'json'
  ): Promise<Blob> {
    const response = await fetch(
      `${this.baseUrl}/export/${assessmentId}?format=${format}`,
      {
        headers: {
          // 'Authorization': `Bearer ${getAuthToken()}`
        },
      }
    );

    if (!response.ok) {
      throw new ApiError('Failed to export assessment data', response.status);
    }

    return await response.blob();
  }
}

// Custom API Error class
class ApiError extends Error {
  public status_code: number;
  public timestamp: string;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.status_code = statusCode;
    this.timestamp = new Date().toISOString();
  }
}

// Create singleton instance
export const carbonMaturityNavigatorApi = new CarbonMaturityNavigatorApiService();

// Export the service class for testing or custom instances
export { CarbonMaturityNavigatorApiService, ApiError };

// Export utility functions
export const createApiService = (baseUrl?: string, timeout?: number) => 
  new CarbonMaturityNavigatorApiService(baseUrl, timeout);

// Export for debugging in development
if (process.env.NODE_ENV === 'development') {
  (window as any).carbonMaturityApi = carbonMaturityNavigatorApi;
}

export default carbonMaturityNavigatorApi;