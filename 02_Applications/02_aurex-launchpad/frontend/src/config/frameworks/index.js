/**
 * ESG Framework Configuration Index
 * Aurex Launchpad - ESG Assessment Platform
 * 
 * Centralized configuration for all supported ESG frameworks:
 * - TCFD (Task Force on Climate-related Financial Disclosures)
 * - GRI (Global Reporting Initiative)
 * - SASB (Sustainability Accounting Standards Board)
 * - EU Taxonomy (EU Taxonomy Regulation)
 * - CSRD (Corporate Sustainability Reporting Directive)
 */

import tcfdConfig from './tcfd.json';
import griConfig from './gri.json';
import sasbConfig from './sasb.json';
import euTaxonomyConfig from './eu-taxonomy.json';
import csrdConfig from './csrd.json';

/**
 * Framework metadata for UI display and routing
 */
export const FRAMEWORK_METADATA = {
  TCFD: {
    id: 'tcfd',
    name: 'TCFD',
    fullName: 'Task Force on Climate-related Financial Disclosures',
    description: 'Framework for climate-related financial risk disclosures',
    version: '2023',
    color: '#1E40AF',
    icon: 'climate',
    category: 'Climate Risk',
    complexity: 'Medium',
    estimatedTime: '4-6 weeks',
    applicability: 'All organizations with climate-related risks',
    regulatoryStatus: 'Recommended/Mandatory in some jurisdictions',
    lastUpdated: '2023-10-16'
  },
  GRI: {
    id: 'gri',
    name: 'GRI',
    fullName: 'Global Reporting Initiative',
    description: 'Comprehensive sustainability reporting framework',
    version: '2021',
    color: '#059669',
    icon: 'globe',
    category: 'Comprehensive ESG',
    complexity: 'High',
    estimatedTime: '8-12 weeks',
    applicability: 'All organizations seeking comprehensive sustainability reporting',
    regulatoryStatus: 'Widely adopted global standard',
    lastUpdated: '2021-10-05'
  },
  SASB: {
    id: 'sasb',
    name: 'SASB',
    fullName: 'Sustainability Accounting Standards Board',
    description: 'Industry-specific financially material ESG standards',
    version: '2023',
    color: '#7C3AED',
    icon: 'industry',
    category: 'Financial Materiality',
    complexity: 'Medium',
    estimatedTime: '3-5 weeks',
    applicability: 'Public companies and investors',
    regulatoryStatus: 'Market-driven adoption',
    lastUpdated: '2023-10-01'
  },
  'EU_TAXONOMY': {
    id: 'eu-taxonomy',
    name: 'EU Taxonomy',
    fullName: 'EU Taxonomy Regulation',
    description: 'Classification system for environmentally sustainable activities',
    version: '2023',
    color: '#DC2626',
    icon: 'classification',
    category: 'Environmental Classification',
    complexity: 'High',
    estimatedTime: '6-10 weeks',
    applicability: 'Large public-interest entities and financial market participants in the EU',
    regulatoryStatus: 'EU Mandatory',
    lastUpdated: '2023-12-01'
  },
  CSRD: {
    id: 'csrd',
    name: 'CSRD',
    fullName: 'Corporate Sustainability Reporting Directive',
    description: 'Comprehensive EU sustainability reporting requirements',
    version: '2024',
    color: '#EA580C',
    icon: 'directive',
    category: 'EU Regulatory',
    complexity: 'High',
    estimatedTime: '10-16 weeks',
    applicability: 'Large companies and listed SMEs in the EU',
    regulatoryStatus: 'EU Mandatory',
    lastUpdated: '2024-01-05'
  }
};

/**
 * Framework configuration objects
 */
export const FRAMEWORKS = {
  TCFD: tcfdConfig,
  GRI: griConfig,
  SASB: sasbConfig,
  EU_TAXONOMY: euTaxonomyConfig,
  CSRD: csrdConfig
};

/**
 * Get framework configuration by ID
 * @param {string} frameworkId - The framework identifier
 * @returns {Object|null} Framework configuration object
 */
export const getFrameworkConfig = (frameworkId) => {
  const normalizedId = frameworkId.toUpperCase().replace('-', '_');
  return FRAMEWORKS[normalizedId] || null;
};

/**
 * Get framework metadata by ID
 * @param {string} frameworkId - The framework identifier
 * @returns {Object|null} Framework metadata object
 */
export const getFrameworkMetadata = (frameworkId) => {
  const normalizedId = frameworkId.toUpperCase().replace('-', '_');
  return FRAMEWORK_METADATA[normalizedId] || null;
};

/**
 * Get all available framework IDs
 * @returns {string[]} Array of framework IDs
 */
export const getAvailableFrameworks = () => {
  return Object.keys(FRAMEWORKS);
};

/**
 * Get frameworks by category
 * @param {string} category - The category to filter by
 * @returns {Object[]} Array of framework metadata objects
 */
export const getFrameworksByCategory = (category) => {
  return Object.values(FRAMEWORK_METADATA).filter(
    framework => framework.category === category
  );
};

/**
 * Get frameworks by complexity level
 * @param {string} complexity - The complexity level to filter by
 * @returns {Object[]} Array of framework metadata objects
 */
export const getFrameworksByComplexity = (complexity) => {
  return Object.values(FRAMEWORK_METADATA).filter(
    framework => framework.complexity === complexity
  );
};

/**
 * Get mandatory frameworks for a specific jurisdiction
 * @param {string} jurisdiction - The jurisdiction (e.g., 'EU', 'US', 'UK')
 * @returns {Object[]} Array of framework metadata objects
 */
export const getMandatoryFrameworks = (jurisdiction) => {
  const mandatoryKeywords = {
    EU: ['EU Mandatory', 'EU'],
    US: ['US Mandatory', 'SEC'],
    UK: ['UK Mandatory', 'UK'],
    GLOBAL: ['Mandatory']
  };
  
  const keywords = mandatoryKeywords[jurisdiction.toUpperCase()] || [];
  
  return Object.values(FRAMEWORK_METADATA).filter(framework => 
    keywords.some(keyword => 
      framework.regulatoryStatus.includes(keyword)
    )
  );
};

/**
 * Framework compatibility matrix
 * Defines which frameworks work well together
 */
export const FRAMEWORK_COMPATIBILITY = {
  TCFD: ['GRI', 'SASB', 'CSRD'],
  GRI: ['TCFD', 'SASB', 'EU_TAXONOMY', 'CSRD'],
  SASB: ['TCFD', 'GRI', 'CSRD'],
  EU_TAXONOMY: ['GRI', 'CSRD'],
  CSRD: ['TCFD', 'GRI', 'SASB', 'EU_TAXONOMY']
};

/**
 * Get compatible frameworks for a given framework
 * @param {string} frameworkId - The framework identifier
 * @returns {string[]} Array of compatible framework IDs
 */
export const getCompatibleFrameworks = (frameworkId) => {
  const normalizedId = frameworkId.toUpperCase().replace('-', '_');
  return FRAMEWORK_COMPATIBILITY[normalizedId] || [];
};

/**
 * Assessment workflow steps for each framework
 */
export const ASSESSMENT_WORKFLOWS = {
  TCFD: [
    'context_setup',
    'governance_assessment',
    'strategy_assessment', 
    'risk_management_assessment',
    'metrics_targets_assessment',
    'scenario_analysis',
    'integration_review',
    'final_review'
  ],
  GRI: [
    'context_setup',
    'stakeholder_engagement',
    'materiality_assessment',
    'general_disclosures',
    'topic_selection',
    'topic_disclosures',
    'quality_review',
    'final_review'
  ],
  SASB: [
    'context_setup',
    'industry_selection',
    'materiality_assessment',
    'topic_disclosures',
    'quantitative_metrics',
    'qualitative_discussion',
    'integration_review',
    'final_review'
  ],
  EU_TAXONOMY: [
    'context_setup',
    'eligibility_screening',
    'technical_screening',
    'dnsh_assessment',
    'minimum_safeguards',
    'proportion_calculation',
    'documentation_review',
    'final_review'
  ],
  CSRD: [
    'context_setup',
    'double_materiality',
    'impact_assessment',
    'risk_opportunity_assessment',
    'esrs_mapping',
    'value_chain_assessment',
    'governance_disclosures',
    'strategy_disclosures',
    'metrics_targets',
    'assurance_preparation',
    'final_review'
  ]
};

/**
 * Get assessment workflow for a framework
 * @param {string} frameworkId - The framework identifier
 * @returns {string[]} Array of workflow step IDs
 */
export const getAssessmentWorkflow = (frameworkId) => {
  const normalizedId = frameworkId.toUpperCase().replace('-', '_');
  return ASSESSMENT_WORKFLOWS[normalizedId] || [];
};

/**
 * Default export combining all framework utilities
 */
export default {
  FRAMEWORK_METADATA,
  FRAMEWORKS,
  getFrameworkConfig,
  getFrameworkMetadata,
  getAvailableFrameworks,
  getFrameworksByCategory,
  getFrameworksByComplexity,
  getMandatoryFrameworks,
  getCompatibleFrameworks,
  getAssessmentWorkflow,
  FRAMEWORK_COMPATIBILITY,
  ASSESSMENT_WORKFLOWS
};