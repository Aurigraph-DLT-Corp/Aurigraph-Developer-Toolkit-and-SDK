import React, { useState } from 'react';

export interface ESGFramework {
  id: string;
  name: string;
  acronym: string;
  description: string;
  categories: ESGCategory[];
  icon: string;
  color: string;
}

export interface ESGCategory {
  id: string;
  name: string;
  description: string;
  metrics: ESGMetric[];
}

export interface ESGMetric {
  id: string;
  name: string;
  description: string;
  unit: string;
  required: boolean;
  dataType: 'number' | 'text' | 'boolean' | 'percentage';
}

export interface ESGAssessmentData {
  frameworkId: string;
  responses: Record<string, any>;
  completionPercentage: number;
  complianceScore: number;
}

const esgFrameworks: ESGFramework[] = [
  {
    id: 'sasb',
    name: 'Sustainability Accounting Standards Board',
    acronym: 'SASB',
    description: 'Industry-specific sustainability accounting standards for material ESG factors.',
    icon: '📊',
    color: 'blue',
    categories: [
      {
        id: 'environment',
        name: 'Environment',
        description: 'Environmental impact metrics including emissions, resource use, and waste.',
        metrics: [
          { id: 'ghg_scope1', name: 'Scope 1 GHG Emissions', description: 'Direct greenhouse gas emissions', unit: 'tCO2e', required: true, dataType: 'number' },
          { id: 'ghg_scope2', name: 'Scope 2 GHG Emissions', description: 'Indirect emissions from purchased energy', unit: 'tCO2e', required: true, dataType: 'number' },
          { id: 'water_usage', name: 'Total Water Withdrawn', description: 'Water usage across operations', unit: 'm³', required: true, dataType: 'number' },
          { id: 'waste_generated', name: 'Total Waste Generated', description: 'Waste generated in operations', unit: 'tons', required: true, dataType: 'number' },
          { id: 'energy_consumption', name: 'Total Energy Consumed', description: 'Energy consumption across facilities', unit: 'MWh', required: true, dataType: 'number' }
        ]
      },
      {
        id: 'social_capital',
        name: 'Social Capital',
        description: 'Human rights, community relations, and customer welfare metrics.',
        metrics: [
          { id: 'employee_turnover', name: 'Employee Turnover Rate', description: 'Annual employee turnover percentage', unit: '%', required: true, dataType: 'percentage' },
          { id: 'diversity_board', name: 'Board Diversity', description: 'Percentage of diverse board members', unit: '%', required: true, dataType: 'percentage' },
          { id: 'safety_incidents', name: 'Total Recordable Incident Rate', description: 'Workplace safety incidents per 100 employees', unit: 'incidents/100 employees', required: true, dataType: 'number' },
          { id: 'community_investment', name: 'Community Investment', description: 'Investment in community programs', unit: 'USD', required: false, dataType: 'number' }
        ]
      },
      {
        id: 'governance',
        name: 'Leadership & Governance',
        description: 'Business ethics, competitive behavior, and management quality.',
        metrics: [
          { id: 'board_independence', name: 'Board Independence', description: 'Percentage of independent board members', unit: '%', required: true, dataType: 'percentage' },
          { id: 'ethics_training', name: 'Ethics Training', description: 'Percentage of employees receiving ethics training', unit: '%', required: true, dataType: 'percentage' },
          { id: 'cyber_security', name: 'Data Security', description: 'Data breaches in reporting period', unit: 'incidents', required: true, dataType: 'number' },
          { id: 'anti_corruption', name: 'Anti-corruption Policy', description: 'Formal anti-corruption policy in place', unit: 'yes/no', required: true, dataType: 'boolean' }
        ]
      }
    ]
  },
  {
    id: 'tcfd',
    name: 'Task Force on Climate-related Financial Disclosures',
    acronym: 'TCFD',
    description: 'Framework for climate-related financial risk disclosures.',
    icon: '🌡️',
    color: 'green',
    categories: [
      {
        id: 'governance',
        name: 'Governance',
        description: 'Climate-related governance structure and oversight.',
        metrics: [
          { id: 'board_oversight', name: 'Board Oversight of Climate Risks', description: 'Board-level oversight of climate-related risks', unit: 'yes/no', required: true, dataType: 'boolean' },
          { id: 'management_role', name: 'Management Role in Climate Risk', description: 'Management processes for climate risks', unit: 'description', required: true, dataType: 'text' },
          { id: 'climate_expertise', name: 'Climate Expertise on Board', description: 'Board members with climate expertise', unit: 'count', required: true, dataType: 'number' }
        ]
      },
      {
        id: 'strategy',
        name: 'Strategy',
        description: 'Climate-related risks and opportunities impact on strategy.',
        metrics: [
          { id: 'physical_risks', name: 'Physical Climate Risks', description: 'Identified physical climate risks', unit: 'description', required: true, dataType: 'text' },
          { id: 'transition_risks', name: 'Transition Risks', description: 'Identified transition risks', unit: 'description', required: true, dataType: 'text' },
          { id: 'climate_opportunities', name: 'Climate Opportunities', description: 'Identified climate-related opportunities', unit: 'description', required: true, dataType: 'text' },
          { id: 'scenario_analysis', name: 'Scenario Analysis Conducted', description: 'Climate scenario analysis performed', unit: 'yes/no', required: true, dataType: 'boolean' }
        ]
      },
      {
        id: 'risk_management',
        name: 'Risk Management',
        description: 'Climate risk identification, assessment, and management processes.',
        metrics: [
          { id: 'risk_identification', name: 'Risk Identification Process', description: 'Process for identifying climate risks', unit: 'description', required: true, dataType: 'text' },
          { id: 'risk_assessment', name: 'Risk Assessment Process', description: 'Process for assessing climate risks', unit: 'description', required: true, dataType: 'text' },
          { id: 'risk_integration', name: 'Risk Management Integration', description: 'Integration with overall risk management', unit: 'description', required: true, dataType: 'text' }
        ]
      },
      {
        id: 'metrics_targets',
        name: 'Metrics and Targets',
        description: 'Climate-related metrics and targets used to assess performance.',
        metrics: [
          { id: 'climate_metrics', name: 'Climate-related Metrics', description: 'Key climate-related metrics tracked', unit: 'description', required: true, dataType: 'text' },
          { id: 'ghg_emissions_total', name: 'Total GHG Emissions', description: 'Scope 1, 2, and 3 emissions', unit: 'tCO2e', required: true, dataType: 'number' },
          { id: 'climate_targets', name: 'Climate Targets', description: 'Climate-related targets set', unit: 'description', required: true, dataType: 'text' },
          { id: 'science_based_targets', name: 'Science-based Targets', description: 'Committed to science-based targets', unit: 'yes/no', required: true, dataType: 'boolean' }
        ]
      }
    ]
  },
  {
    id: 'cdp',
    name: 'Carbon Disclosure Project',
    acronym: 'CDP',
    description: 'Global disclosure system for environmental impact measurement.',
    icon: '🌍',
    color: 'emerald',
    categories: [
      {
        id: 'climate_change',
        name: 'Climate Change',
        description: 'Climate-related data and strategy disclosures.',
        metrics: [
          { id: 'scope1_emissions', name: 'Scope 1 Emissions', description: 'Direct GHG emissions', unit: 'tCO2e', required: true, dataType: 'number' },
          { id: 'scope2_emissions', name: 'Scope 2 Emissions', description: 'Electricity indirect GHG emissions', unit: 'tCO2e', required: true, dataType: 'number' },
          { id: 'scope3_emissions', name: 'Scope 3 Emissions', description: 'Other indirect GHG emissions', unit: 'tCO2e', required: true, dataType: 'number' },
          { id: 'renewable_energy', name: 'Renewable Energy Consumption', description: 'Renewable energy as % of total', unit: '%', required: true, dataType: 'percentage' },
          { id: 'climate_strategy', name: 'Climate Change Strategy', description: 'Comprehensive climate strategy in place', unit: 'yes/no', required: true, dataType: 'boolean' }
        ]
      },
      {
        id: 'water_security',
        name: 'Water Security',
        description: 'Water usage, risks, and management practices.',
        metrics: [
          { id: 'water_withdrawal', name: 'Total Water Withdrawal', description: 'Total water withdrawn by source', unit: 'm³', required: true, dataType: 'number' },
          { id: 'water_discharge', name: 'Total Water Discharge', description: 'Total water discharged by quality', unit: 'm³', required: true, dataType: 'number' },
          { id: 'water_consumption', name: 'Total Water Consumption', description: 'Net water consumption', unit: 'm³', required: true, dataType: 'number' },
          { id: 'water_stress_areas', name: 'Operations in Water Stress Areas', description: 'Facilities in water-stressed areas', unit: '%', required: true, dataType: 'percentage' }
        ]
      },
      {
        id: 'forests',
        name: 'Forests',
        description: 'Forest-related risks and deforestation policies.',
        metrics: [
          { id: 'deforestation_policy', name: 'Deforestation Policy', description: 'Policy to address deforestation', unit: 'yes/no', required: true, dataType: 'boolean' },
          { id: 'forest_commodities', name: 'Forest Risk Commodities', description: 'Forest risk commodities in supply chain', unit: 'description', required: true, dataType: 'text' },
          { id: 'certification_scheme', name: 'Certification Schemes', description: 'Forest certification schemes used', unit: 'description', required: false, dataType: 'text' },
          { id: 'supplier_engagement', name: 'Supplier Engagement on Forests', description: 'Engagement with suppliers on forest risks', unit: 'yes/no', required: true, dataType: 'boolean' }
        ]
      }
    ]
  }
];

interface ESGFrameworksProps {
  onComplete?: (assessments: ESGAssessmentData[]) => void;
}

const ESGFrameworks: React.FC<ESGFrameworksProps> = ({ onComplete }) => {
  const [selectedFramework, setSelectedFramework] = useState<ESGFramework | null>(null);
  const [assessmentData, setAssessmentData] = useState<Record<string, ESGAssessmentData>>({});
  const [currentCategory, setCurrentCategory] = useState(0);

  const handleFrameworkSelect = (framework: ESGFramework) => {
    setSelectedFramework(framework);
    setCurrentCategory(0);
    
    // Initialize assessment data if not exists
    if (!assessmentData[framework.id]) {
      setAssessmentData(prev => ({
        ...prev,
        [framework.id]: {
          frameworkId: framework.id,
          responses: {},
          completionPercentage: 0,
          complianceScore: 0
        }
      }));
    }
  };

  const handleInputChange = (metricId: string, value: any) => {
    if (!selectedFramework) return;

    setAssessmentData(prev => ({
      ...prev,
      [selectedFramework.id]: {
        ...prev[selectedFramework.id],
        responses: {
          ...prev[selectedFramework.id]?.responses,
          [metricId]: value
        }
      }
    }));
  };

  const calculateCompletion = (frameworkId: string) => {
    const framework = esgFrameworks.find(f => f.id === frameworkId);
    if (!framework) return 0;

    const totalMetrics = framework.categories.reduce((sum, cat) => sum + cat.metrics.length, 0);
    const completedMetrics = Object.keys(assessmentData[frameworkId]?.responses || {}).length;
    
    return Math.round((completedMetrics / totalMetrics) * 100);
  };

  const calculateComplianceScore = (frameworkId: string) => {
    const framework = esgFrameworks.find(f => f.id === frameworkId);
    if (!framework) return 0;

    const responses = assessmentData[frameworkId]?.responses || {};
    const requiredMetrics = framework.categories.reduce((acc, cat) => {
      return acc.concat(cat.metrics.filter(m => m.required));
    }, [] as ESGMetric[]);

    const completedRequired = requiredMetrics.filter(metric => responses[metric.id] !== undefined).length;
    return Math.round((completedRequired / requiredMetrics.length) * 100);
  };

  const renderFrameworkSelection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">ESG Frameworks Assessment</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Select from industry-leading ESG frameworks to assess your organization's 
          sustainability performance and compliance readiness.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {esgFrameworks.map((framework) => {
          const completion = calculateCompletion(framework.id);
          const compliance = calculateComplianceScore(framework.id);
          
          return (
            <div
              key={framework.id}
              onClick={() => handleFrameworkSelect(framework)}
              className={`bg-white rounded-xl shadow-lg border-2 border-gray-200 hover:border-${framework.color}-500 hover:shadow-xl transition-all cursor-pointer group`}
            >
              <div className={`h-32 bg-gradient-to-r from-${framework.color}-500 to-${framework.color}-600 flex items-center justify-center`}>
                <span className="text-6xl">{framework.icon}</span>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900">{framework.acronym}</h3>
                  {completion > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold bg-${framework.color}-100 text-${framework.color}-800`}>
                      {completion}% Complete
                    </span>
                  )}
                </div>
                
                <h4 className="text-sm font-semibold text-gray-700 mb-2">{framework.name}</h4>
                <p className="text-gray-600 mb-4 text-sm">{framework.description}</p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Categories: {framework.categories.length}</span>
                    <span>Metrics: {framework.categories.reduce((sum, cat) => sum + cat.metrics.length, 0)}</span>
                  </div>
                  
                  {completion > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Completion</span>
                        <span>{completion}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`bg-${framework.color}-600 h-1.5 rounded-full transition-all duration-300`}
                          style={{ width: `${completion}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
                
                <button className={`w-full mt-4 bg-${framework.color}-600 text-white py-2 px-4 rounded-lg hover:bg-${framework.color}-700 transition-colors group-hover:scale-105 transform transition-transform`}>
                  {completion > 0 ? 'Continue Assessment' : 'Start Assessment'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderFrameworkAssessment = () => {
    if (!selectedFramework) return null;

    const currentCat = selectedFramework.categories[currentCategory];
    const responses = assessmentData[selectedFramework.id]?.responses || {};

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => setSelectedFramework(null)}
              className="text-gray-500 hover:text-gray-700 mb-2 flex items-center"
            >
              ← Back to Frameworks
            </button>
            <h2 className="text-2xl font-bold text-gray-900">
              {selectedFramework.acronym} Assessment
            </h2>
            <p className="text-gray-600">{selectedFramework.name}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Progress</div>
            <div className="text-2xl font-bold text-green-600">
              {calculateCompletion(selectedFramework.id)}%
            </div>
          </div>
        </div>

        {/* Category Navigation */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {selectedFramework.categories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => setCurrentCategory(index)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                currentCategory === index
                  ? `bg-${selectedFramework.color}-600 text-white`
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Current Category Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{currentCat.name}</h3>
            <p className="text-gray-600">{currentCat.description}</p>
          </div>

          <div className="space-y-6">
            {currentCat.metrics.map((metric) => (
              <div key={metric.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <label className="text-sm font-semibold text-gray-900 flex items-center">
                      {metric.name}
                      {metric.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <p className="text-xs text-gray-600 mt-1">{metric.description}</p>
                  </div>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{metric.unit}</span>
                </div>

                <div>
                  {metric.dataType === 'number' && (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={responses[metric.id] || ''}
                      onChange={(e) => handleInputChange(metric.id, parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Enter ${metric.unit}`}
                    />
                  )}
                  
                  {metric.dataType === 'percentage' && (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={responses[metric.id] || ''}
                      onChange={(e) => handleInputChange(metric.id, parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter percentage (0-100)"
                    />
                  )}
                  
                  {metric.dataType === 'boolean' && (
                    <select
                      value={responses[metric.id] || ''}
                      onChange={(e) => handleInputChange(metric.id, e.target.value === 'true')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  )}
                  
                  {metric.dataType === 'text' && (
                    <textarea
                      rows={3}
                      value={responses[metric.id] || ''}
                      onChange={(e) => handleInputChange(metric.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter description..."
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentCategory(Math.max(0, currentCategory - 1))}
            disabled={currentCategory === 0}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous Category
          </button>
          
          {currentCategory < selectedFramework.categories.length - 1 ? (
            <button
              onClick={() => setCurrentCategory(currentCategory + 1)}
              className={`px-6 py-2 bg-${selectedFramework.color}-600 text-white rounded-md hover:bg-${selectedFramework.color}-700`}
            >
              Next Category
            </button>
          ) : (
            <button
              onClick={() => {
                // Update final scores
                const completion = calculateCompletion(selectedFramework.id);
                const compliance = calculateComplianceScore(selectedFramework.id);
                
                setAssessmentData(prev => ({
                  ...prev,
                  [selectedFramework.id]: {
                    ...prev[selectedFramework.id],
                    completionPercentage: completion,
                    complianceScore: compliance
                  }
                }));
                
                setSelectedFramework(null);
              }}
              className="px-8 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
            >
              Complete Assessment
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        {selectedFramework ? renderFrameworkAssessment() : renderFrameworkSelection()}
      </div>
    </div>
  );
};

export default ESGFrameworks;