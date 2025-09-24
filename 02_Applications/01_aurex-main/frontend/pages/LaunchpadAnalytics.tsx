import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';

interface GHGEmissionData {
  scope1: number; // Direct emissions
  scope2: number; // Electricity indirect emissions
  scope3: number; // Other indirect emissions
  total: number;
  unit: string;
  period: string;
}

interface IndustryBenchmark {
  industry: string;
  averageEmissions: number;
  topPerformers: number;
  yourPosition: number;
  percentile: number;
}

interface EmissionTrend {
  month: string;
  emissions: number;
  target: number;
  reduction: number;
}

interface ComplianceStatus {
  standard: string;
  status: 'compliant' | 'non-compliant' | 'partial';
  score: number;
  lastAssessment: string;
  nextDue: string;
}

interface AnalyticsData {
  currentEmissions: GHGEmissionData;
  industryBenchmark: IndustryBenchmark;
  emissionTrends: EmissionTrend[];
  complianceStatus: ComplianceStatus[];
  reductionOpportunities: Array<{
    category: string;
    potentialReduction: number;
    investment: number;
    roi: number;
    timeline: string;
  }>;
  certifications: Array<{
    name: string;
    status: 'active' | 'pending' | 'expired';
    expiryDate: string;
    issuer: string;
  }>;
}

const LaunchpadAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'month' | 'quarter' | 'year'>('quarter');
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'compliance' | 'opportunities'>('overview');

  useEffect(() => {
    const loadAnalyticsData = async () => {
      try {
        setLoading(true);
        // In real implementation, this would fetch from API Gateway
        const data = await mockAnalyticsData();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Failed to load analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [selectedPeriod]);

  const mockAnalyticsData = async (): Promise<AnalyticsData> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      currentEmissions: {
        scope1: 1245.5,
        scope2: 892.3,
        scope3: 2156.8,
        total: 4294.6,
        unit: 'tCO2e',
        period: 'Q3 2024'
      },
      industryBenchmark: {
        industry: 'Manufacturing',
        averageEmissions: 5200.0,
        topPerformers: 3100.0,
        yourPosition: 4294.6,
        percentile: 72
      },
      emissionTrends: [
        { month: 'Jan', emissions: 4523, target: 4200, reduction: -7.1 },
        { month: 'Feb', emissions: 4401, target: 4150, reduction: -6.0 },
        { month: 'Mar', emissions: 4289, target: 4100, reduction: -4.6 },
        { month: 'Apr', emissions: 4156, target: 4050, reduction: -2.6 },
        { month: 'May', emissions: 4087, target: 4000, reduction: -2.2 },
        { month: 'Jun', emissions: 3954, target: 3950, reduction: -0.1 },
        { month: 'Jul', emissions: 3876, target: 3900, reduction: 0.6 },
        { month: 'Aug', emissions: 3823, target: 3850, reduction: 0.7 },
        { month: 'Sep', emissions: 3745, target: 3800, reduction: 1.4 }
      ],
      complianceStatus: [
        {
          standard: 'ISO 14001',
          status: 'compliant',
          score: 94.2,
          lastAssessment: '2024-06-15',
          nextDue: '2024-12-15'
        },
        {
          standard: 'CDP Climate Change',
          status: 'compliant',
          score: 87.5,
          lastAssessment: '2024-07-20',
          nextDue: '2025-01-20'
        },
        {
          standard: 'SBTi Targets',
          status: 'partial',
          score: 68.3,
          lastAssessment: '2024-05-10',
          nextDue: '2024-11-10'
        },
        {
          standard: 'EU Taxonomy',
          status: 'non-compliant',
          score: 42.1,
          lastAssessment: '2024-04-05',
          nextDue: '2024-10-05'
        }
      ],
      reductionOpportunities: [
        {
          category: 'Energy Efficiency',
          potentialReduction: 245.6,
          investment: 125000,
          roi: 2.8,
          timeline: '6 months'
        },
        {
          category: 'Renewable Energy',
          potentialReduction: 892.3,
          investment: 450000,
          roi: 3.2,
          timeline: '12 months'
        },
        {
          category: 'Supply Chain Optimization',
          potentialReduction: 156.8,
          investment: 75000,
          roi: 4.1,
          timeline: '9 months'
        },
        {
          category: 'Process Improvements',
          potentialReduction: 198.4,
          investment: 95000,
          roi: 3.5,
          timeline: '8 months'
        }
      ],
      certifications: [
        {
          name: 'Carbon Neutral Certification',
          status: 'active',
          expiryDate: '2025-03-15',
          issuer: 'Carbon Trust'
        },
        {
          name: 'B-Corp Certification',
          status: 'active',
          expiryDate: '2025-08-20',
          issuer: 'B Lab'
        },
        {
          name: 'ISO 50001',
          status: 'pending',
          expiryDate: '2024-12-01',
          issuer: 'ISO International'
        },
        {
          name: 'LEED Gold',
          status: 'expired',
          expiryDate: '2024-01-15',
          issuer: 'USGBC'
        }
      ]
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'partial':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'non-compliant':
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatNumber = (value: number, decimals: number = 1) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Analytics Unavailable</h2>
          <p className="text-gray-600">Unable to load analytics data. Please try again later.</p>
        </div>
      </div>
    );
  }

  const { currentEmissions, industryBenchmark, emissionTrends, complianceStatus, reductionOpportunities, certifications } = analyticsData;

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">GHG Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive greenhouse gas emissions reporting and analytics</p>
          </div>
          <div className="flex gap-2">
            {(['month', 'quarter', 'year'] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
                className="capitalize"
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {([
              { key: 'overview', label: 'Overview' },
              { key: 'trends', label: 'Trends' },
              { key: 'compliance', label: 'Compliance' },
              { key: 'opportunities', label: 'Opportunities' }
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Emissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(currentEmissions.total)} {currentEmissions.unit}
                </div>
                <p className="text-xs text-gray-600">{currentEmissions.period}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Industry Percentile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{industryBenchmark.percentile}th</div>
                <p className="text-xs text-gray-600">Better than average</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Reduction Potential</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(reductionOpportunities.reduce((sum, opp) => sum + opp.potentialReduction, 0))} tCO2e
                </div>
                <p className="text-xs text-gray-600">Available opportunities</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Compliance Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {formatNumber(complianceStatus.reduce((sum, c) => sum + c.score, 0) / complianceStatus.length)}%
                </div>
                <p className="text-xs text-gray-600">Average across standards</p>
              </CardContent>
            </Card>
          </div>

          {/* Emissions Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Emissions by Scope</CardTitle>
                <CardDescription>Breakdown of GHG emissions by reporting scope</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { scope: 'Scope 1 (Direct)', value: currentEmissions.scope1, color: 'bg-blue-500' },
                    { scope: 'Scope 2 (Electricity)', value: currentEmissions.scope2, color: 'bg-green-500' },
                    { scope: 'Scope 3 (Other Indirect)', value: currentEmissions.scope3, color: 'bg-purple-500' }
                  ].map((item, index) => {
                    const percentage = (item.value / currentEmissions.total) * 100;
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">{item.scope}</span>
                          <span className="text-sm text-gray-600">
                            {formatNumber(item.value)} {currentEmissions.unit} ({formatNumber(percentage)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Industry Benchmark</CardTitle>
                <CardDescription>Your performance vs. industry standards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Industry Average</span>
                    <span className="text-sm text-gray-600">
                      {formatNumber(industryBenchmark.averageEmissions)} tCO2e
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Top Performers</span>
                    <span className="text-sm text-gray-600">
                      {formatNumber(industryBenchmark.topPerformers)} tCO2e
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-600">Your Performance</span>
                    <span className="text-sm font-bold text-blue-600">
                      {formatNumber(industryBenchmark.yourPosition)} tCO2e
                    </span>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Great work!</strong> You're performing {formatNumber(((industryBenchmark.averageEmissions - industryBenchmark.yourPosition) / industryBenchmark.averageEmissions) * 100)}% better than industry average.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Emission Trends</CardTitle>
              <CardDescription>Monthly emissions vs. targets and reduction progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">-12.3%</div>
                    <div className="text-sm text-gray-600">Year-to-date reduction</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">6/9</div>
                    <div className="text-sm text-gray-600">Months on target</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">1.4%</div>
                    <div className="text-sm text-gray-600">Latest month improvement</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Month</th>
                        <th className="text-right py-2">Emissions (tCO2e)</th>
                        <th className="text-right py-2">Target (tCO2e)</th>
                        <th className="text-right py-2">vs Target (%)</th>
                        <th className="text-center py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emissionTrends.map((trend, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 font-medium">{trend.month}</td>
                          <td className="text-right py-2">{formatNumber(trend.emissions)}</td>
                          <td className="text-right py-2">{formatNumber(trend.target)}</td>
                          <td className="text-right py-2">
                            <span className={trend.reduction > 0 ? 'text-green-600' : 'text-red-600'}>
                              {trend.reduction > 0 ? '+' : ''}{formatNumber(trend.reduction)}%
                            </span>
                          </td>
                          <td className="text-center py-2">
                            <Badge className={trend.reduction > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {trend.reduction > 0 ? 'On Target' : 'Off Target'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
                <CardDescription>Current status across environmental standards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceStatus.map((compliance, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{compliance.standard}</div>
                        <div className="text-sm text-gray-600">
                          Score: {formatNumber(compliance.score)}% | Next due: {new Date(compliance.nextDue).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge className={getStatusColor(compliance.status)}>
                        {compliance.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Certifications</CardTitle>
                <CardDescription>Current certifications and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {certifications.map((cert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{cert.name}</div>
                        <div className="text-sm text-gray-600">
                          {cert.issuer} | Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge className={getStatusColor(cert.status)}>
                        {cert.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Opportunities Tab */}
      {activeTab === 'opportunities' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reduction Opportunities</CardTitle>
              <CardDescription>Identified opportunities for emissions reduction with ROI analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Category</th>
                      <th className="text-right py-2">Potential Reduction (tCO2e)</th>
                      <th className="text-right py-2">Investment Required</th>
                      <th className="text-right py-2">ROI</th>
                      <th className="text-center py-2">Timeline</th>
                      <th className="text-center py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reductionOpportunities.map((opportunity, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-3 font-medium">{opportunity.category}</td>
                        <td className="text-right py-3">{formatNumber(opportunity.potentialReduction)}</td>
                        <td className="text-right py-3">{formatCurrency(opportunity.investment)}</td>
                        <td className="text-right py-3">
                          <span className="text-green-600 font-medium">{formatNumber(opportunity.roi)}x</span>
                        </td>
                        <td className="text-center py-3">
                          <Badge variant="outline">{opportunity.timeline}</Badge>
                        </td>
                        <td className="text-center py-3">
                          <Button size="sm" variant="outline">
                            Explore
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Total Impact Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700 font-medium">Total Reduction Potential:</span>
                    <div className="text-lg font-bold text-blue-900">
                      {formatNumber(reductionOpportunities.reduce((sum, opp) => sum + opp.potentialReduction, 0))} tCO2e
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Total Investment:</span>
                    <div className="text-lg font-bold text-blue-900">
                      {formatCurrency(reductionOpportunities.reduce((sum, opp) => sum + opp.investment, 0))}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-700 font-medium">Average ROI:</span>
                    <div className="text-lg font-bold text-blue-900">
                      {formatNumber(reductionOpportunities.reduce((sum, opp) => sum + opp.roi, 0) / reductionOpportunities.length)}x
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default LaunchpadAnalytics;