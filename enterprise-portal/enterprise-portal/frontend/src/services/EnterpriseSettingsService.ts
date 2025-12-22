/**
 * Enterprise Settings Service
 *
 * Handles advanced configuration settings for the Enterprise Portal
 */

import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from '../utils/constants';

export interface RWATSettings {
  assetStoragePath: string;
  maxAssetSizeMB: number;
  allowedExtensions: string[];
  versioningEnabled: boolean;
  encryptionEnabled: boolean;
}

export interface AdvancedSettings {
  systemConfiguration: Record<string, any>;
  securitySettings: Record<string, any>;
  performanceSettings: Record<string, any>;
  featureFlags: Record<string, any>;
  notificationSettings: Record<string, any>;
  integrationSettings: Record<string, any>;
  uiSettings: Record<string, any>;
  rwatSettings: RWATSettings;
  timestamp: number;
}

class EnterpriseSettingsService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get all advanced settings
   */
  async getAdvancedSettings(): Promise<AdvancedSettings> {
    const response = await this.client.get<AdvancedSettings>('/api/v12/enterprise/advanced-settings');
    return response.data;
  }

  /**
   * Update advanced settings
   */
  async updateAdvancedSettings(settings: Partial<AdvancedSettings>): Promise<any> {
    const response = await this.client.put('/api/v12/enterprise/advanced-settings', settings);
    return response.data;
  }

  /**
   * Get settings for a specific category
   */
  async getSettingsByCategory(category: string): Promise<any> {
    const response = await this.client.get(`/api/v12/enterprise/settings/category/${category}`);
    return response.data;
  }
}

export const enterpriseSettingsService = new EnterpriseSettingsService();
export default EnterpriseSettingsService;
