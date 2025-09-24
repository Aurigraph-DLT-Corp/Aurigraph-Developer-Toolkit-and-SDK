import { apiClientV1 } from './api';

export interface Assessment {
  id: number;
  title: string;
  description?: string;
  framework_type: string;
  status: 'draft' | 'in_progress' | 'completed' | 'archived';
  score?: number;
  max_score?: number;
  percentage?: number;
  user_id: number;
  organization_id?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface AssessmentQuestion {
  id: number;
  assessment_id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'text' | 'numeric' | 'boolean' | 'scale';
  options?: string[];
  required: boolean;
  weight: number;
  category: string;
  subcategory?: string;
  order_index: number;
}

export interface AssessmentResponse {
  id: number;
  assessment_id: number;
  question_id: number;
  response_value: string | number | boolean;
  response_text?: string;
  score?: number;
  created_at: string;
  updated_at: string;
}

export interface AssessmentResult {
  assessment: Assessment;
  questions: AssessmentQuestion[];
  responses: AssessmentResponse[];
  category_scores: Record<string, {
    score: number;
    max_score: number;
    percentage: number;
  }>;
  recommendations: string[];
}

export interface CreateAssessmentRequest {
  title: string;
  description?: string;
  framework_type: string;
}

export interface SubmitResponseRequest {
  question_id: number;
  response_value: string | number | boolean;
  response_text?: string;
}

class AssessmentService {
  // Assessment CRUD operations
  async getAssessments(params?: {
    status?: string;
    framework_type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Assessment[]> {
    return apiClientV1.get<Assessment[]>('/assessments', params);
  }

  async getAssessment(id: number): Promise<Assessment> {
    return apiClientV1.get<Assessment>(`/assessments/${id}`);
  }

  async createAssessment(data: CreateAssessmentRequest): Promise<Assessment> {
    return apiClientV1.post<Assessment>('/assessments', data);
  }

  async updateAssessment(id: number, data: Partial<Assessment>): Promise<Assessment> {
    return apiClientV1.put<Assessment>(`/assessments/${id}`, data);
  }

  async deleteAssessment(id: number): Promise<void> {
    return apiClientV1.delete<void>(`/assessments/${id}`);
  }

  // Assessment questions
  async getAssessmentQuestions(assessmentId: number): Promise<AssessmentQuestion[]> {
    return apiClientV1.get<AssessmentQuestion[]>(`/assessments/${assessmentId}/questions`);
  }

  async getQuestion(assessmentId: number, questionId: number): Promise<AssessmentQuestion> {
    return apiClientV1.get<AssessmentQuestion>(`/assessments/${assessmentId}/questions/${questionId}`);
  }

  // Assessment responses
  async getAssessmentResponses(assessmentId: number): Promise<AssessmentResponse[]> {
    return apiClientV1.get<AssessmentResponse[]>(`/assessments/${assessmentId}/responses`);
  }

  async submitResponse(assessmentId: number, response: SubmitResponseRequest): Promise<AssessmentResponse> {
    return apiClientV1.post<AssessmentResponse>(`/assessments/${assessmentId}/responses`, response);
  }

  async updateResponse(assessmentId: number, responseId: number, data: Partial<SubmitResponseRequest>): Promise<AssessmentResponse> {
    return apiClientV1.put<AssessmentResponse>(`/assessments/${assessmentId}/responses/${responseId}`, data);
  }

  async deleteResponse(assessmentId: number, responseId: number): Promise<void> {
    return apiClientV1.delete<void>(`/assessments/${assessmentId}/responses/${responseId}`);
  }

  // Assessment completion
  async completeAssessment(assessmentId: number): Promise<Assessment> {
    return apiClientV1.post<Assessment>(`/assessments/${assessmentId}/complete`);
  }

  async getAssessmentResults(assessmentId: number): Promise<AssessmentResult> {
    return apiClientV1.get<AssessmentResult>(`/assessments/${assessmentId}/results`);
  }

  // Framework templates
  async getFrameworkTypes(): Promise<string[]> {
    return apiClientV1.get<string[]>('/assessments/frameworks');
  }

  async getFrameworkTemplate(frameworkType: string): Promise<{
    questions: Omit<AssessmentQuestion, 'id' | 'assessment_id'>[];
    metadata: Record<string, any>;
  }> {
    return apiClientV1.get(`/assessments/frameworks/${frameworkType}`);
  }

  // Assessment analytics
  async getAssessmentProgress(assessmentId: number): Promise<{
    total_questions: number;
    answered_questions: number;
    percentage_complete: number;
    estimated_completion_time: number;
  }> {
    return apiClientV1.get(`/assessments/${assessmentId}/progress`);
  }

  async getAssessmentComparison(assessmentIds: number[]): Promise<{
    assessments: Assessment[];
    comparison_data: Record<string, any>;
  }> {
    return apiClientV1.post('/assessments/compare', { assessment_ids: assessmentIds });
  }

  // Bulk operations
  async submitMultipleResponses(assessmentId: number, responses: SubmitResponseRequest[]): Promise<AssessmentResponse[]> {
    return apiClientV1.post<AssessmentResponse[]>(`/assessments/${assessmentId}/responses/bulk`, {
      responses
    });
  }

  async exportAssessment(assessmentId: number, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<Blob> {
    const response = await fetch(`${apiClientV1.baseURL}/assessments/${assessmentId}/export?format=${format}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }
}

export const assessmentService = new AssessmentService();
export default assessmentService;