/**
 * CRM Service - API client for Aurigraph Enterprise Portal CRM module
 *
 * Handles communication with V11 backend REST API endpoints:
 * - Lead management (create, read, update, search)
 * - Demo scheduling (create, schedule, complete)
 * - Opportunity pipeline management
 */

import axios, { AxiosInstance } from 'axios';

// Type definitions for CRM domain models
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName: string;
  jobTitle?: string;
  source?: string;
  status: LeadStatus;
  leadScore: number;
  inquiryType?: string;
  companySizeRange?: string;
  industry?: string;
  budgetRange?: string;
  emailVerified: boolean;
  gdprConsentGiven: boolean;
  assignedToUserId?: string;
  assignedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum LeadStatus {
  NEW = 'NEW',
  ENGAGED = 'ENGAGED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL_SENT = 'PROPOSAL_SENT',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST',
  ARCHIVED = 'ARCHIVED'
}

export enum LeadSource {
  WEBSITE = 'WEBSITE',
  REFERRAL = 'REFERRAL',
  OUTBOUND = 'OUTBOUND',
  INBOUND = 'INBOUND',
  EVENT = 'EVENT',
  PARTNERSHIP = 'PARTNERSHIP',
  ADVERTISEMENT = 'ADVERTISEMENT'
}

export interface CreateLeadRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  companyName: string;
  jobTitle?: string;
  source?: LeadSource;
  inquiryType?: string;
  companySizeRange?: string;
  industry?: string;
  budgetRange?: string;
  gdprConsentGiven: boolean;
  message?: string;
}

export interface DemoRequest {
  id: string;
  leadId: string;
  demoType: DemoType;
  status: DemoStatus;
  scheduledAt?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  meetingPlatform?: string;
  meetingUrl?: string;
  meetingJoinUrl?: string;
  recordingUrl?: string;
  customerSatisfactionRating?: number;
  customerFeedbackText?: string;
  demoOutcome?: DemoOutcome;
  reminder24hSent: boolean;
  reminder1hSent: boolean;
  calendarInviteSent: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export enum DemoType {
  STANDARD_DEMO = 'STANDARD_DEMO',
  CUSTOM_DEMO = 'CUSTOM_DEMO',
  TECHNICAL_DEEP_DIVE = 'TECHNICAL_DEEP_DIVE',
  PROOF_OF_CONCEPT = 'PROOF_OF_CONCEPT',
  PILOT_PROGRAM = 'PILOT_PROGRAM',
  EXECUTIVE_BRIEFING = 'EXECUTIVE_BRIEFING'
}

export enum DemoStatus {
  REQUESTED = 'REQUESTED',
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED'
}

export enum DemoOutcome {
  VERY_INTERESTED = 'VERY_INTERESTED',
  INTERESTED = 'INTERESTED',
  NEUTRAL = 'NEUTRAL',
  NOT_INTERESTED = 'NOT_INTERESTED',
  NO_SHOW = 'NO_SHOW'
}

export interface ScheduleDemoRequest {
  leadId: string;
  demoType: DemoType;
  startTime: string; // ISO 8601 datetime
  durationMinutes: number;
  preferredTimezone?: string;
  notes?: string;
}

export interface Opportunity {
  id: string;
  leadId: string;
  name: string;
  description?: string;
  ownedByUserId: string;
  stage: OpportunityStage;
  estimatedValue?: number;
  actualValue?: number;
  currency: string;
  probabilityPercent: number;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  competingVendors?: string;
  competitiveAdvantage?: string;
  atRisk: boolean;
  atRiskReason?: string;
  riskProbabilityPercent?: number;
  isExpansion: boolean;
  parentOpportunityId?: string;
  createdAt: string;
  updatedAt: string;
}

export enum OpportunityStage {
  DISCOVERY = 'DISCOVERY',
  ASSESSMENT = 'ASSESSMENT',
  SOLUTION_DESIGN = 'SOLUTION_DESIGN',
  PROPOSAL = 'PROPOSAL',
  NEGOTIATION = 'NEGOTIATION',
  CLOSED_WON = 'CLOSED_WON',
  CLOSED_LOST = 'CLOSED_LOST'
}

export interface ApiError {
  message: string;
  timestamp?: string;
  status?: number;
}

/**
 * CRM Service - Manages all API calls to the V11 CRM backend
 */
class CrmServiceClass {
  private apiClient: AxiosInstance;
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_BASE_URL || 'https://dlt.aurigraph.io/api/v11';

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for global error handling
    this.apiClient.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          // Handle unauthorized - refresh token or redirect to login
          console.error('Unauthorized access - redirecting to login');
        }
        return Promise.reject(error);
      }
    );
  }

  // ==================== LEAD ENDPOINTS ====================

  /**
   * Create a new lead from inquiry form
   */
  async createLead(request: CreateLeadRequest): Promise<Lead> {
    try {
      const response = await this.apiClient.post<Lead>('/crm/leads', request);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to create lead');
    }
  }

  /**
   * Get lead by ID
   */
  async getLead(id: string): Promise<Lead> {
    try {
      const response = await this.apiClient.get<Lead>(`/crm/leads/${id}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error, `Failed to fetch lead ${id}`);
    }
  }

  /**
   * Get all leads
   */
  async getAllLeads(): Promise<Lead[]> {
    try {
      const response = await this.apiClient.get<Lead[]>('/crm/leads');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to fetch leads');
    }
  }

  /**
   * Get leads by status
   */
  async getLeadsByStatus(status: LeadStatus): Promise<Lead[]> {
    try {
      const response = await this.apiClient.get<Lead[]>(`/crm/leads/status/${status}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error, `Failed to fetch leads with status ${status}`);
    }
  }

  /**
   * Get high-value leads (score >= minScore)
   */
  async getHighValueLeads(minScore: number = 50): Promise<Lead[]> {
    try {
      const response = await this.apiClient.get<Lead[]>('/crm/leads/high-value', {
        params: { minScore },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to fetch high-value leads');
    }
  }

  /**
   * Get leads needing follow-up
   */
  async getLeadsNeedingFollowUp(): Promise<Lead[]> {
    try {
      const response = await this.apiClient.get<Lead[]>('/crm/leads/follow-up');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to fetch leads needing follow-up');
    }
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(id: string, status: LeadStatus): Promise<Lead> {
    try {
      const response = await this.apiClient.put<Lead>(
        `/crm/leads/${id}/status`,
        {},
        { params: { status } }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error, `Failed to update lead status`);
    }
  }

  /**
   * Update lead score
   */
  async updateLeadScore(id: string, score: number): Promise<Lead> {
    try {
      const response = await this.apiClient.put<Lead>(
        `/crm/leads/${id}/score`,
        {},
        { params: { score } }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error, `Failed to update lead score`);
    }
  }

  /**
   * Assign lead to sales representative
   */
  async assignLead(leadId: string, userId: string): Promise<Lead> {
    try {
      const response = await this.apiClient.post<Lead>(
        `/crm/leads/${leadId}/assign`,
        {},
        { params: { userId } }
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to assign lead');
    }
  }

  /**
   * Verify email address
   */
  async verifyEmail(id: string): Promise<Lead> {
    try {
      const response = await this.apiClient.post<Lead>(`/crm/leads/${id}/verify-email`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to verify email');
    }
  }

  // ==================== DEMO ENDPOINTS ====================

  /**
   * Create a new demo request
   */
  async createDemo(leadId: string, demoType: DemoType): Promise<DemoRequest> {
    try {
      const response = await this.apiClient.post<DemoRequest>('/crm/demos', {
        leadId,
        demoType,
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to create demo');
    }
  }

  /**
   * Schedule a demo
   */
  async scheduleDemo(demoId: string, request: ScheduleDemoRequest): Promise<void> {
    try {
      await this.apiClient.post(`/crm/demos/${demoId}/schedule`, request);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to schedule demo');
    }
  }

  /**
   * Create meeting link for demo
   */
  async createMeetingLink(demoId: string, platform: string): Promise<void> {
    try {
      await this.apiClient.post(
        `/crm/demos/${demoId}/meeting`,
        {},
        { params: { platform } }
      );
    } catch (error: any) {
      throw this.handleError(error, 'Failed to create meeting link');
    }
  }

  /**
   * Send calendar invite
   */
  async sendCalendarInvite(demoId: string): Promise<void> {
    try {
      await this.apiClient.post(`/crm/demos/${demoId}/send-invite`);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to send calendar invite');
    }
  }

  /**
   * Complete demo with feedback
   */
  async completeDemo(
    demoId: string,
    recordingUrl: string,
    satisfaction: number,
    feedback: string,
    outcome: DemoOutcome
  ): Promise<void> {
    try {
      await this.apiClient.post(`/crm/demos/${demoId}/complete`, {
        recordingUrl,
        satisfaction,
        feedback,
        outcome,
      });
    } catch (error: any) {
      throw this.handleError(error, 'Failed to complete demo');
    }
  }

  /**
   * Get pending demos
   */
  async getPendingDemos(): Promise<DemoRequest[]> {
    try {
      const response = await this.apiClient.get<DemoRequest[]>('/crm/demos/pending');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to fetch pending demos');
    }
  }

  /**
   * Get today's demos
   */
  async getTodaysDemos(): Promise<DemoRequest[]> {
    try {
      const response = await this.apiClient.get<DemoRequest[]>('/crm/demos/today');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to fetch today\'s demos');
    }
  }

  /**
   * Get demos needing follow-up
   */
  async getDemosNeedingFollowUp(): Promise<DemoRequest[]> {
    try {
      const response = await this.apiClient.get<DemoRequest[]>('/crm/demos/follow-up');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to fetch demos needing follow-up');
    }
  }

  /**
   * Cancel demo
   */
  async cancelDemo(demoId: string, reason: string): Promise<void> {
    try {
      await this.apiClient.post(
        `/crm/demos/${demoId}/cancel`,
        {},
        { params: { reason } }
      );
    } catch (error: any) {
      throw this.handleError(error, 'Failed to cancel demo');
    }
  }

  /**
   * Send 24-hour reminder
   */
  async sendReminder24h(demoId: string): Promise<void> {
    try {
      await this.apiClient.post(`/crm/demos/${demoId}/remind-24h`);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to send 24-hour reminder');
    }
  }

  /**
   * Send 1-hour reminder
   */
  async sendReminder1h(demoId: string): Promise<void> {
    try {
      await this.apiClient.post(`/crm/demos/${demoId}/remind-1h`);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to send 1-hour reminder');
    }
  }

  // ==================== ERROR HANDLING ====================

  private handleError(error: any, message: string): ApiError {
    if (error.response?.data?.message) {
      return {
        message: error.response.data.message,
        status: error.response.status,
      };
    }
    return {
      message: error.message || message,
      status: error.response?.status || 500,
    };
  }
}

// Export singleton instance
export const CrmService = new CrmServiceClass();
