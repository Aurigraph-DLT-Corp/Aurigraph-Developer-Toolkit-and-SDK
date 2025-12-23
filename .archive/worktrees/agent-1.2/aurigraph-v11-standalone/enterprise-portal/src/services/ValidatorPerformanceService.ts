/**
 * ValidatorPerformanceService
 * Endpoint: /api/v11/validators/performance
 */

export interface ValidatorMetrics {
  address: string;
  moniker: string;
  uptime: number;
  blocksProduced: number;
  commission: number;
  delegatorsCount: number;
  totalStaked: string;
  rewardsEarned: string;
}

export const getValidatorPerformance = async (): Promise<ValidatorMetrics[]> => {
  try {
    const response = await fetch('/api/v11/validators/performance');
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error('Failed to fetch validator performance:', error);
    throw error;
  }
};

export const getValidatorByAddress = async (address: string): Promise<ValidatorMetrics> => {
  const metrics = await getValidatorPerformance();
  const validator = metrics.find((v) => v.address === address);
  if (!validator) throw new Error(`Validator ${address} not found`);
  return validator;
};
