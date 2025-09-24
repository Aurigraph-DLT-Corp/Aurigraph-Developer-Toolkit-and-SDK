/**
 * FastAPI Service for Aurex Launchpad
 * Handles communication with the FastAPI backend
 */

// Determine API URL based on environment
const getApiBaseUrl = () => {
  // Check if we're in production (dev.aurigraph.io)
  if (window.location.hostname === 'dev.aurigraph.io') {
    return 'https://dev.aurigraph.io';
  }

  // Check for environment variable
  const envApiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (envApiUrl) {
    return envApiUrl;
  }

  // Default to localhost for development
  return 'http://localhost:8000';
};

const FASTAPI_BASE_URL = getApiBaseUrl();

export interface User {
  id: number;
  name: string;
  email: string;
  provider: string;
  created_at: string;
  last_login?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AssessmentReport {
  id: number;
  title: string;
  score: number;
  status: string;
  createdAt: string;
  completedAt?: string;
  reportType: string;
  isPaid: boolean;
}

export interface AssessmentSubmission {
  title: string;
  answers: Array<{
    questionId: string;
    questionText?: string;
    value: string | number;
    score: number;
    weight?: number;
    category?: string;
  }>;
  score: number;
}

class FastApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = FASTAPI_BASE_URL;
    this.token = localStorage.getItem('fastapi_auth_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  // Authentication methods
  async register(name: string, email: string, password: string): Promise<TokenResponse> {
    const response = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, email, password }),
    });

    const data = await this.handleResponse<TokenResponse>(response);
    this.token = data.access_token;
    localStorage.setItem('fastapi_auth_token', this.token);
    return data;
  }

  async login(email: string, password: string): Promise<TokenResponse> {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, password }),
    });

    const data = await this.handleResponse<TokenResponse>(response);
    this.token = data.access_token;
    localStorage.setItem('fastapi_auth_token', this.token);
    return data;
  }

  async getCurrentUser(token?: string): Promise<User> {
    const headers = token ? {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    } : this.getHeaders();

    const response = await fetch(`${this.baseUrl}/api/auth/me`, {
      method: 'GET',
      headers,
    });

    return this.handleResponse<User>(response);
  }

  async logout(): Promise<void> {
    this.token = null;
    localStorage.removeItem('fastapi_auth_token');
  }

  // Assessment methods
  async submitAssessment(assessmentData: AssessmentSubmission): Promise<{ message: string; assessment_id: number; score: number }> {
    const response = await fetch(`${this.baseUrl}/api/assessments/submit`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(assessmentData),
    });

    return this.handleResponse(response);
  }

  async getUserReports(): Promise<{ reports: AssessmentReport[] }> {
    const response = await fetch(`${this.baseUrl}/api/assessments/reports`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getAssessmentDetails(assessmentId: number): Promise<{
    assessment: {
      id: number;
      title: string;
      score: number;
      status: string;
      createdAt: string;
      completedAt?: string;
    };
    answers: Array<{
      questionId: string;
      questionText: string;
      answerValue: string;
      score: number;
      weight: number;
      category: string;
    }>;
  }> {
    const response = await fetch(`${this.baseUrl}/api/assessments/${assessmentId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async deleteAssessment(assessmentId: number): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/api/assessments/${assessmentId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  async healthCheck(): Promise<{ message: string; status: string; timestamp: string }> {
    const response = await fetch(`${this.baseUrl}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    return this.handleResponse(response);
  }
}

// Export singleton instance
export const fastApiService = new FastApiService();
export default fastApiService;
