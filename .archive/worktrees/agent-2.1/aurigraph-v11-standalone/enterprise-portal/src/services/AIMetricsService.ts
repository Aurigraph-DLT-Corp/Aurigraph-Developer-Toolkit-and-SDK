export interface AIMetricsData {
  modelAccuracy: number;
  predictionsPerSecond: number;
  averageLatency: number;
  modelStatus: string;
  trainingDataPoints: number;
  lastUpdated: number;
}

export const getAIMetrics = async (): Promise<AIMetricsData> => {
  const response = await fetch('/api/v11/ai/metrics');
  if (!response.ok) throw new Error('Failed to fetch AI metrics');
  return response.json();
};
