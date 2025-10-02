/**
 * Farmer Onboarding API Service
 * Handles all API communications for the enhanced farmer onboarding system
 * Includes RBAC-aware requests and error handling
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// Types
interface APIResponse<T = any> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

interface FarmerOnboardingData {
  user_id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  father_name?: string;
  phone_number: string;
  email?: string;
  date_of_birth?: string;
  gender?: string;
  government_id_type: 'AADHAAR' | 'PAN' | 'VOTER_ID' | 'DRIVING_LICENSE' | 'MGNREGA';
  aadhaar_last_four?: string;
  address_street?: string;
  address_village: string;
  address_district: string;
  address_state: string;
  address_pincode?: string;
  bank_account_number?: string;
  bank_ifsc_code?: string;
  bank_name?: string;
  farming_experience_years?: number;
  primary_crop: string;
  total_land_area?: string;
  preferred_language: string;
}

interface OnboardingResponse {
  id: string;
  farmer_id: string;
  generated_farmer_id?: string;
  onboarding_status: string;
  mobile_verified: boolean;
  consent_completed: boolean;
  profile_photo_verified: boolean;
  data_quality_score?: number;
  approval_stage_progress: {
    submitted: boolean;
    supervisor: boolean;
    qc: boolean;
    pm: boolean;
    business_owner: boolean;
    final: boolean;
  };
  days_in_process: number;
}

interface ApprovalRequest {
  farmer_id: string;
  action: 'approve' | 'reject';
  notes?: string;
  stage: 'supervisor' | 'qc' | 'pm' | 'business_owner';
}

interface UserContext {
  user_id: string;
  role: string;
  permissions: string[];
  token: string;
}

class FarmerOnboardingAPIService {
  private api: AxiosInstance;
  private baseURL = '/api/v1/enhanced-farmer-onboarding';
  private userContext: UserContext | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        if (this.userContext?.token) {
          config.headers.Authorization = `Bearer ${this.userContext.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        return this.handleAPIError(error);
      }
    );
  }

  /**
   * Set user context for RBAC
   */
  setUserContext(userContext: UserContext): void {
    this.userContext = userContext;
  }

  /**
   * Check if user has required role
   */
  private hasRole(requiredRoles: string[]): boolean {
    if (!this.userContext) return false;
    return requiredRoles.includes(this.userContext.role) || this.userContext.role === 'admin';
  }

  /**
   * Handle API errors with RBAC context
   */
  private handleAPIError(error: AxiosError): Promise<never> {
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = '/login';
      return Promise.reject(new Error('Authentication required'));
    }

    if (error.response?.status === 403) {
      // Forbidden - RBAC violation
      const errorMessage = error.response.data?.detail || 'Access denied';
      return Promise.reject(new Error(`RBAC Error: ${errorMessage}`));
    }

    if (error.response?.status >= 500) {
      return Promise.reject(new Error('Server error. Please try again later.'));
    }

    return Promise.reject(error);
  }

  /**
   * Initiate farmer onboarding (Farmers, Field Agents, Admins)
   */
  async initiateFarmerOnboarding(data: FarmerOnboardingData): Promise<OnboardingResponse> {
    // RBAC check
    if (!this.hasRole(['farmer', 'field_agent', 'admin'])) {
      throw new Error('Access denied. Required roles: farmer, field_agent, or admin');
    }

    const response = await this.api.post<APIResponse<OnboardingResponse>>('/initiate', data);
    return response.data.data;
  }

  /**
   * Upload government ID documents (Farmers, Field Agents, Admins)
   */
  async uploadGovernmentID(
    onboardingId: string,
    idType: string,
    idNumber: string,
    frontImage: File,
    backImage: File
  ): Promise<any> {
    // RBAC check
    if (!this.hasRole(['farmer', 'field_agent', 'admin'])) {
      throw new Error('Access denied. Required roles: farmer, field_agent, or admin');
    }

    const formData = new FormData();
    formData.append('id_type', idType);
    formData.append('id_number', idNumber);
    formData.append('front_image', frontImage);
    formData.append('back_image', backImage);

    const response = await this.api.post(
      `/upload-government-id/${onboardingId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  /**
   * Capture bank details (Farmers, Field Agents, Admins)
   */
  async captureBankDetails(
    onboardingId: string,
    bankDetails: {
      account_number: string;
      ifsc_code: string;
      account_holder_name: string;
    }
  ): Promise<any> {
    // RBAC check
    if (!this.hasRole(['farmer', 'field_agent', 'admin'])) {
      throw new Error('Access denied. Required roles: farmer, field_agent, or admin');
    }

    const formData = new FormData();
    formData.append('account_number', bankDetails.account_number);
    formData.append('ifsc_code', bankDetails.ifsc_code);
    formData.append('account_holder_name', bankDetails.account_holder_name);

    const response = await this.api.post(`/bank-details/${onboardingId}`, formData);
    return response.data;
  }

  /**
   * Register land parcels (Farmers, Field Agents, Admins)
   */
  async registerLandParcels(onboardingId: string, parcelsData: any[]): Promise<any> {
    // RBAC check
    if (!this.hasRole(['farmer', 'field_agent', 'admin'])) {
      throw new Error('Access denied. Required roles: farmer, field_agent, or admin');
    }

    const response = await this.api.post(`/land-parcels/${onboardingId}`, parcelsData);
    return response.data;
  }

  /**
   * Allocate AWD area (Farmers, Field Agents, Admins)
   */
  async allocateAWDArea(
    onboardingId: string,
    allocationData: {
      farmer_id: string;
      parcel_allocations: Array<{
        parcel_id: string;
        awd_area_hectares: number;
      }>;
    }
  ): Promise<any> {
    // RBAC check
    if (!this.hasRole(['farmer', 'field_agent', 'admin'])) {
      throw new Error('Access denied. Required roles: farmer, field_agent, or admin');
    }

    const response = await this.api.post(`/awd-allocation/${onboardingId}`, allocationData);
    return response.data;
  }

  /**
   * Add co-owner (Field Agents, Admins)
   */
  async addCoOwner(
    onboardingId: string,
    coOwnerData: {
      land_parcel_id: string;
      full_name: string;
      relation_to_farmer?: string;
      mobile_number: string;
      government_id_type: string;
      government_id_number: string;
      ownership_percentage: number;
    }
  ): Promise<any> {
    // RBAC check
    if (!this.hasRole(['field_agent', 'admin'])) {
      throw new Error('Access denied. Required roles: field_agent or admin');
    }

    const response = await this.api.post(`/co-owners/${onboardingId}`, coOwnerData);
    return response.data;
  }

  /**
   * Capture consent (Farmers, Field Agents, Admins)
   */
  async captureConsent(
    onboardingId: string,
    consentData: {
      farmer_id: string;
      consent_type: string;
      consent_method: string;
      consent_text: string;
      consent_given: boolean;
      consent_location_lat?: number;
      consent_location_lng?: number;
      device_info?: any;
    }
  ): Promise<any> {
    // RBAC check
    if (!this.hasRole(['farmer', 'field_agent', 'admin'])) {
      throw new Error('Access denied. Required roles: farmer, field_agent, or admin');
    }

    const response = await this.api.post(`/consent/${onboardingId}`, consentData);
    return response.data;
  }

  /**
   * Process approval (Role-specific based on stage)
   */
  async processApproval(onboardingId: string, approvalData: ApprovalRequest): Promise<any> {
    // Stage-specific RBAC checks
    const stageRoleMapping: { [key: string]: string[] } = {
      supervisor: ['supervisor', 'admin'],
      qc: ['qaqc_officer', 'admin'],
      pm: ['project_manager', 'admin'],
      business_owner: ['business_owner', 'agency_admin', 'admin'],
    };

    const allowedRoles = stageRoleMapping[approvalData.stage] || ['admin'];
    if (!this.hasRole(allowedRoles)) {
      throw new Error(
        `Access denied. Stage '${approvalData.stage}' requires roles: ${allowedRoles.join(', ')}`
      );
    }

    const response = await this.api.post(`/approval/${onboardingId}`, approvalData);
    return response.data;
  }

  /**
   * Get onboarding status (All authenticated users)
   */
  async getOnboardingStatus(onboardingId: string): Promise<OnboardingResponse> {
    const response = await this.api.get<APIResponse<OnboardingResponse>>(`/status/${onboardingId}`);
    return response.data.data;
  }

  /**
   * Check user permissions for UI rendering
   */
  getUserPermissions(): {
    canInitiateOnboarding: boolean;
    canUploadDocuments: boolean;
    canAddCoOwners: boolean;
    canApproveAtStage: (stage: string) => boolean;
    canViewAllOnboardings: boolean;
  } {
    if (!this.userContext) {
      return {
        canInitiateOnboarding: false,
        canUploadDocuments: false,
        canAddCoOwners: false,
        canApproveAtStage: () => false,
        canViewAllOnboardings: false,
      };
    }

    const role = this.userContext.role;

    return {
      canInitiateOnboarding: this.hasRole(['farmer', 'field_agent', 'admin']),
      canUploadDocuments: this.hasRole(['farmer', 'field_agent', 'admin']),
      canAddCoOwners: this.hasRole(['field_agent', 'admin']),
      canApproveAtStage: (stage: string) => {
        const stageRoles: { [key: string]: string[] } = {
          supervisor: ['supervisor', 'admin'],
          qc: ['qaqc_officer', 'admin'],
          pm: ['project_manager', 'admin'],
          business_owner: ['business_owner', 'agency_admin', 'admin'],
        };
        return this.hasRole(stageRoles[stage] || []);
      },
      canViewAllOnboardings: this.hasRole(['supervisor', 'qaqc_officer', 'project_manager', 'business_owner', 'admin']),
    };
  }

  /**
   * Offline mode support
   */
  async syncOfflineData(offlineData: any[]): Promise<any> {
    const response = await this.api.post('/sync-offline', {
      device_id: this.getDeviceId(),
      sync_data: offlineData,
      last_sync_timestamp: this.getLastSyncTimestamp(),
    });

    this.setLastSyncTimestamp(new Date().toISOString());
    return response.data;
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  private getLastSyncTimestamp(): string | null {
    return localStorage.getItem('last_sync_timestamp');
  }

  private setLastSyncTimestamp(timestamp: string): void {
    localStorage.setItem('last_sync_timestamp', timestamp);
  }
}

// Export singleton instance
export const farmerOnboardingAPI = new FarmerOnboardingAPIService();

// Export types for use in components
export type {
  FarmerOnboardingData,
  OnboardingResponse,
  ApprovalRequest,
  UserContext,
};

export default FarmerOnboardingAPIService;