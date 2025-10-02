import { apiClientV1 } from './api';

export interface AnalyticsMetric {
  id: number;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  category: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DashboardData {
  total_assessments: number;
  completed_assessments: number;
  in_progress_assessments: number;
  average_score: number;
  total_users: number;
  active_users: number;
  recent_activity: ActivityItem[];
}

export interface ActivityItem {
  id: number;
  activity_type: string;
  description: string;
  user_id: number;
  user_email?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ScoreDistribution {
  score_range: string;
  count: number;
  percentage: number;
}

export interface TrendData {
  period: string;
  value: number;
  change_percentage?: number;
}

export interface ESGMetrics {
  environmental: {
    score: number;
    trends: TrendData[];
    key_indicators: Record<string, number>;
  };
  social: {
    score: number;
    trends: TrendData[];
    key_indicators: Record<string, number>;
  };
  governance: {
    score: number;
    trends: TrendData[];
    key_indicators: Record<string, number>;
  };
}

export interface AnalyticsFilters {
  start_date?: string;
  end_date?: string;
  framework_type?: string;
  category?: string;
  organization_id?: number;
  user_id?: number;
}

class AnalyticsService {
  // Dashboard analytics
  async getDashboardData(filters?: AnalyticsFilters): Promise<DashboardData> {
    return apiClientV1.get<DashboardData>('/analytics/dashboard', filters);
  }

  async getRecentActivity(limit: number = 10): Promise<ActivityItem[]> {
    return apiClientV1.get<ActivityItem[]>('/analytics/activity', { limit });
  }

  // Assessment analytics
  async getAssessmentAnalytics(filters?: AnalyticsFilters): Promise<{
    total_assessments: number;
    completion_rate: number;
    average_score: number;
    score_distribution: ScoreDistribution[];
    completion_trends: TrendData[];
  }> {
    return apiClientV1.get('/analytics/assessments', filters);
  }

  async getFrameworkAnalytics(frameworkType?: string, filters?: AnalyticsFilters): Promise<{
    framework_type: string;
    total_assessments: number;
    average_score: number;
    category_scores: Record<string, {
      average_score: number;
      total_responses: number;
    }>;
    trends: TrendData[];
  }> {
    const params = { ...filters };
    if (frameworkType) {
      params.framework_type = frameworkType;
    }
    return apiClientV1.get('/analytics/frameworks', params);
  }

  // ESG Analytics
  async getESGMetrics(filters?: AnalyticsFilters): Promise<ESGMetrics> {
    return apiClientV1.get<ESGMetrics>('/analytics/esg', filters);
  }

  async getEnvironmentalMetrics(filters?: AnalyticsFilters): Promise<{
    carbon_footprint: TrendData[];
    energy_consumption: TrendData[];
    waste_reduction: TrendData[];
    water_usage: TrendData[];
  }> {
    return apiClientV1.get('/analytics/environmental', filters);
  }

  async getSocialMetrics(filters?: AnalyticsFilters): Promise<{
    employee_satisfaction: TrendData[];
    diversity_index: TrendData[];
    community_impact: TrendData[];
    safety_metrics: TrendData[];
  }> {
    return apiClientV1.get('/analytics/social', filters);
  }

  async getGovernanceMetrics(filters?: AnalyticsFilters): Promise<{
    compliance_score: TrendData[];
    board_diversity: TrendData[];
    transparency_index: TrendData[];
    ethics_violations: TrendData[];
  }> {
    return apiClientV1.get('/analytics/governance', filters);
  }

  // Performance analytics
  async getPerformanceMetrics(filters?: AnalyticsFilters): Promise<{
    user_engagement: TrendData[];
    assessment_completion_time: TrendData[];
    system_performance: TrendData[];
    error_rates: TrendData[];
  }> {
    return apiClientV1.get('/analytics/performance', filters);
  }

  // Comparative analytics
  async getOrganizationComparison(organizationIds: number[], filters?: AnalyticsFilters): Promise<{
    organizations: Array<{
      id: number;
      name: string;
      total_score: number;
      category_scores: Record<string, number>;
      rank: number;
    }>;
    benchmarks: Record<string, {
      industry_average: number;
      best_in_class: number;
    }>;
  }> {
    return apiClientV1.post('/analytics/compare/organizations', {
      organization_ids: organizationIds,
      ...filters
    });
  }

  async getUserComparison(userIds: number[], filters?: AnalyticsFilters): Promise<{
    users: Array<{
      id: number;
      email: string;
      total_assessments: number;
      average_score: number;
      completion_rate: number;
    }>;
    team_averages: Record<string, number>;
  }> {
    return apiClientV1.post('/analytics/compare/users', {
      user_ids: userIds,
      ...filters
    });
  }

  // Export analytics
  async exportAnalytics(
    type: 'dashboard' | 'assessments' | 'esg' | 'performance',
    format: 'json' | 'csv' | 'pdf' = 'json',
    filters?: AnalyticsFilters
  ): Promise<Blob> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    params.append('format', format);

    const response = await fetch(
      `${apiClientV1.baseURL}/analytics/export/${type}?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response.blob();
  }

  // Real-time analytics
  async getRealtimeMetrics(): Promise<{
    active_users: number;
    assessments_in_progress: number;
    system_load: number;
    last_updated: string;
  }> {
    return apiClientV1.get('/analytics/realtime');
  }

  // Custom metrics
  async createCustomMetric(data: {
    metric_name: string;
    metric_value: number;
    metric_unit?: string;
    category: string;
    metadata?: Record<string, any>;
  }): Promise<AnalyticsMetric> {
    return apiClientV1.post<AnalyticsMetric>('/analytics/metrics', data);
  }

  async getCustomMetrics(filters?: AnalyticsFilters): Promise<AnalyticsMetric[]> {
    return apiClientV1.get<AnalyticsMetric[]>('/analytics/metrics', filters);
  }

  async updateCustomMetric(id: number, data: Partial<AnalyticsMetric>): Promise<AnalyticsMetric> {
    return apiClientV1.put<AnalyticsMetric>(`/analytics/metrics/${id}`, data);
  }

  async deleteCustomMetric(id: number): Promise<void> {
    return apiClientV1.delete<void>(`/analytics/metrics/${id}`);
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;