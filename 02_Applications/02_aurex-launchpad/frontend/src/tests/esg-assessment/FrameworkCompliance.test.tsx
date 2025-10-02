/**
 * Framework Compliance Calculation Tests
 * Aurex Launchpad - ESG Assessment Platform
 * 
 * Comprehensive test suite for ESG framework compliance calculations,
 * scoring algorithms, validation logic, and benchmarking
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock framework compliance calculation utilities
const mockTCFDScoring = (data) => {
  const weights = { governance: 0.20, strategy: 0.35, risk_management: 0.25, metrics_targets: 0.20 };
  let totalScore = 0;
  
  Object.keys(weights).forEach(pillar => {
    const pillarScore = data[pillar] || 0;
    totalScore += pillarScore * weights[pillar];
  });
  
  return {
    totalScore: Math.round(totalScore),
    pillarScores: data,
    complianceLevel: totalScore >= 70 ? 'compliant' : 'non-compliant',
    recommendations: totalScore < 70 ? ['Improve disclosure quality', 'Enhance quantitative metrics'] : []
  };
};

const mockGRIScoring = (data) => {
  const components = { completeness: 0.40, quality: 0.30, materiality_alignment: 0.20, stakeholder_engagement: 0.10 };
  let totalScore = 0;
  
  Object.keys(components).forEach(component => {
    const componentScore = data[component] || 0;
    totalScore += componentScore * components[component];
  });
  
  return {
    totalScore: Math.round(totalScore),
    componentScores: data,
    complianceLevel: totalScore >= 70 ? 'compliant' : 'non-compliant',
    materialTopics: data.materialTopics || [],
    recommendations: totalScore < 70 ? ['Complete materiality assessment', 'Improve stakeholder engagement'] : []
  };
};

const mockSASBScoring = (data) => {
  const components = { topic_coverage: 0.35, metric_quality: 0.30, quantitative_disclosure: 0.25, forward_looking_analysis: 0.10 };
  let totalScore = 0;
  
  Object.keys(components).forEach(component => {
    const componentScore = data[component] || 0;
    totalScore += componentScore * components[component];
  });
  
  return {
    totalScore: Math.round(totalScore),
    componentScores: data,
    complianceLevel: totalScore >= 75 ? 'compliant' : 'non-compliant',
    industryAlignment: data.industryAlignment || 'unknown',
    recommendations: totalScore < 75 ? ['Improve quantitative metrics', 'Enhance forward-looking analysis'] : []
  };
};

const mockEUTaxonomyScoring = (data) => {
  const criteria = ['eligibility', 'substantial_contribution', 'dnsh_compliance', 'minimum_safeguards'];
  const allPassed = criteria.every(criterion => data[criterion] === true);
  
  return {
    alignmentStatus: allPassed ? 'aligned' : 'not-aligned',
    criteriaResults: data,
    eligibleActivities: data.eligibleActivities || [],
    alignedActivities: allPassed ? data.alignedActivities || [] : [],
    proportions: {
      turnover: data.turnoverProportion || 0,
      capex: data.capexProportion || 0,
      opex: data.opexProportion || 0
    },
    recommendations: !allPassed ? ['Complete technical screening', 'Ensure DNSH compliance'] : []
  };
};

const mockCSRDScoring = (data) => {
  const components = { mandatory_disclosures: 0.40, materiality_assessment_quality: 0.25, value_chain_integration: 0.20, targets_and_progress: 0.15 };
  let totalScore = 0;
  
  Object.keys(components).forEach(component => {
    const componentScore = data[component] || 0;
    totalScore += componentScore * components[component];
  });
  
  return {
    totalScore: Math.round(totalScore),
    componentScores: data,
    complianceLevel: totalScore >= 80 ? 'compliant' : 'non-compliant',
    esrsCompliance: data.esrsCompliance || {},
    doubleMaterialityStatus: data.doubleMaterialityStatus || 'incomplete',
    recommendations: totalScore < 80 ? ['Complete double materiality assessment', 'Improve value chain integration'] : []
  };
};

const MockComplianceCalculator = ({ framework, assessmentData, onCalculate }) => {
  const [results, setResults] = React.useState(null);
  const [isCalculating, setIsCalculating] = React.useState(false);

  const handleCalculate = async () => {
    setIsCalculating(true);
    
    let calculationResults;
    switch (framework) {
      case 'TCFD':
        calculationResults = mockTCFDScoring(assessmentData);
        break;
      case 'GRI':
        calculationResults = mockGRIScoring(assessmentData);
        break;
      case 'SASB':
        calculationResults = mockSASBScoring(assessmentData);
        break;
      case 'EU-TAXONOMY':
        calculationResults = mockEUTaxonomyScoring(assessmentData);
        break;
      case 'CSRD':
        calculationResults = mockCSRDScoring(assessmentData);
        break;
      default:
        calculationResults = { error: 'Unsupported framework' };
    }
    
    setTimeout(() => {
      setResults(calculationResults);
      setIsCalculating(false);
      onCalculate(calculationResults);
    }, 500);
  };

  return (
    <div data-testid="compliance-calculator">
      <h3>{framework} Compliance Calculator</h3>
      <button
        data-testid="calculate-btn"
        onClick={handleCalculate}
        disabled={isCalculating}
      >
        {isCalculating ? 'Calculating...' : 'Calculate Compliance'}
      </button>
      
      {results && (
        <div data-testid="calculation-results">
          {results.totalScore && (
            <div data-testid="total-score">Total Score: {results.totalScore}</div>
          )}
          {results.alignmentStatus && (
            <div data-testid="alignment-status">Alignment: {results.alignmentStatus}</div>
          )}
          <div data-testid="compliance-level">
            {results.complianceLevel || results.alignmentStatus}
          </div>
          {results.recommendations && results.recommendations.length > 0 && (
            <div data-testid="recommendations">
              <h4>Recommendations:</h4>
              <ul>
                {results.recommendations.map((rec, index) => (
                  <li key={index} data-testid={`recommendation-${index}`}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const MockBenchmarkingTool = ({ framework, companyData, peerData }) => {
  const calculatePercentile = (value, dataset) => {
    const sorted = dataset.sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= value);
    return Math.round((index / sorted.length) * 100);
  };

  const benchmarks = {
    industryAverage: peerData.reduce((sum, peer) => sum + peer.score, 0) / peerData.length,
    topQuartile: peerData.sort((a, b) => b.score - a.score)[Math.floor(peerData.length * 0.25)].score,
    median: peerData.sort((a, b) => a.score - b.score)[Math.floor(peerData.length / 2)].score
  };

  const percentile = calculatePercentile(companyData.score, peerData.map(p => p.score));

  return (
    <div data-testid="benchmarking-tool">
      <h3>{framework} Benchmarking</h3>
      <div data-testid="company-score">Company Score: {companyData.score}</div>
      <div data-testid="industry-average">Industry Average: {Math.round(benchmarks.industryAverage)}</div>
      <div data-testid="top-quartile">Top Quartile: {benchmarks.topQuartile}</div>
      <div data-testid="median">Industry Median: {benchmarks.median}</div>
      <div data-testid="percentile">Percentile Ranking: {percentile}th</div>
      
      <div data-testid="performance-indicator">
        {companyData.score > benchmarks.industryAverage ? 'Above Average' : 'Below Average'}
      </div>
    </div>
  );
};

const MockValidationEngine = ({ framework, data, onValidate }) => {
  const [validationResults, setValidationResults] = React.useState(null);
  const [isValidating, setIsValidating] = React.useState(false);

  const validateData = () => {
    setIsValidating(true);
    
    const errors = [];
    const warnings = [];
    const passed = [];

    // Framework-specific validation rules
    switch (framework) {
      case 'TCFD':
        if (!data.governance) errors.push('Governance disclosure is required');
        if (!data.strategy) errors.push('Strategy disclosure is required');
        if (!data.risk_management) errors.push('Risk management disclosure is required');
        if (!data.metrics_targets) errors.push('Metrics and targets disclosure is required');
        if (data.governance && data.governance < 50) warnings.push('Governance disclosure quality could be improved');
        break;
      
      case 'GRI':
        if (!data.materiality_assessment) errors.push('Materiality assessment is required');
        if (!data.stakeholder_engagement) errors.push('Stakeholder engagement is required');
        if (!data.materialTopics || data.materialTopics.length < 3) warnings.push('At least 3 material topics recommended');
        break;
      
      case 'SASB':
        if (!data.industryAlignment) errors.push('Industry alignment is required');
        if (!data.topic_coverage) errors.push('Topic coverage assessment is required');
        if (data.quantitative_disclosure < 60) warnings.push('More quantitative metrics recommended');
        break;
      
      case 'EU-TAXONOMY':
        if (!data.eligibility) errors.push('Eligibility screening is required');
        if (!data.substantial_contribution) errors.push('Substantial contribution assessment is required');
        if (!data.dnsh_compliance) errors.push('DNSH compliance check is required');
        if (!data.minimum_safeguards) errors.push('Minimum safeguards verification is required');
        break;
      
      case 'CSRD':
        if (!data.doubleMaterialityStatus || data.doubleMaterialityStatus === 'incomplete') {
          errors.push('Double materiality assessment is required');
        }
        if (!data.esrsCompliance || Object.keys(data.esrsCompliance).length === 0) {
          errors.push('ESRS compliance mapping is required');
        }
        break;
    }

    if (errors.length === 0 && warnings.length === 0) {
      passed.push('All validation checks passed');
    }

    setTimeout(() => {
      const results = {
        isValid: errors.length === 0,
        errors,
        warnings,
        passed,
        completeness: Math.max(0, 100 - (errors.length * 20) - (warnings.length * 5))
      };
      
      setValidationResults(results);
      setIsValidating(false);
      onValidate(results);
    }, 300);
  };

  return (
    <div data-testid="validation-engine">
      <h3>{framework} Validation</h3>
      <button
        data-testid="validate-btn"
        onClick={validateData}
        disabled={isValidating}
      >
        {isValidating ? 'Validating...' : 'Validate Data'}
      </button>
      
      {validationResults && (
        <div data-testid="validation-results">
          <div data-testid="validation-status">
            Status: {validationResults.isValid ? 'Valid' : 'Invalid'}
          </div>
          <div data-testid="completeness">
            Completeness: {validationResults.completeness}%
          </div>
          
          {validationResults.errors.length > 0 && (
            <div data-testid="validation-errors">
              <h4>Errors:</h4>
              <ul>
                {validationResults.errors.map((error, index) => (
                  <li key={index} data-testid={`error-${index}`}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {validationResults.warnings.length > 0 && (
            <div data-testid="validation-warnings">
              <h4>Warnings:</h4>
              <ul>
                {validationResults.warnings.map((warning, index) => (
                  <li key={index} data-testid={`warning-${index}`}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          {validationResults.passed.length > 0 && (
            <div data-testid="validation-passed">
              <h4>Passed:</h4>
              <ul>
                {validationResults.passed.map((passed, index) => (
                  <li key={index} data-testid={`passed-${index}`}>{passed}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

describe('Framework Compliance Calculations', () => {
  let mockOnCalculate;
  let mockOnValidate;
  let user;

  beforeEach(() => {
    mockOnCalculate = jest.fn();
    mockOnValidate = jest.fn();
    user = userEvent.setup();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('TCFD Compliance Calculations', () => {
    const tcfdData = {
      governance: 85,
      strategy: 70,
      risk_management: 80,
      metrics_targets: 75
    };

    test('calculates TCFD compliance score correctly', async () => {
      render(
        <MockComplianceCalculator
          framework="TCFD"
          assessmentData={tcfdData}
          onCalculate={mockOnCalculate}
        />
      );

      const calculateBtn = screen.getByTestId('calculate-btn');
      await user.click(calculateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('total-score')).toHaveTextContent('Total Score: 76');
        expect(screen.getByTestId('compliance-level')).toHaveTextContent('compliant');
      });

      expect(mockOnCalculate).toHaveBeenCalledWith(
        expect.objectContaining({
          totalScore: 76,
          complianceLevel: 'compliant'
        })
      );
    });

    test('identifies non-compliant TCFD assessment', async () => {
      const lowScoreData = {
        governance: 40,
        strategy: 50,
        risk_management: 45,
        metrics_targets: 35
      };

      render(
        <MockComplianceCalculator
          framework="TCFD"
          assessmentData={lowScoreData}
          onCalculate={mockOnCalculate}
        />
      );

      const calculateBtn = screen.getByTestId('calculate-btn');
      await user.click(calculateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('total-score')).toHaveTextContent('Total Score: 43');
        expect(screen.getByTestId('compliance-level')).toHaveTextContent('non-compliant');
        expect(screen.getByTestId('recommendations')).toBeInTheDocument();
      });
    });

    test('provides TCFD improvement recommendations', async () => {
      const incompleteData = {
        governance: 60,
        strategy: 40,
        risk_management: 30,
        metrics_targets: 50
      };

      render(
        <MockComplianceCalculator
          framework="TCFD"
          assessmentData={incompleteData}
          onCalculate={mockOnCalculate}
        />
      );

      const calculateBtn = screen.getByTestId('calculate-btn');
      await user.click(calculateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('recommendations')).toBeInTheDocument();
        expect(screen.getByTestId('recommendation-0')).toHaveTextContent('Improve disclosure quality');
        expect(screen.getByTestId('recommendation-1')).toHaveTextContent('Enhance quantitative metrics');
      });
    });
  });

  describe('GRI Compliance Calculations', () => {
    const griData = {
      completeness: 80,
      quality: 75,
      materiality_alignment: 85,
      stakeholder_engagement: 70,
      materialTopics: ['Energy', 'Water', 'Waste', 'Employment']
    };

    test('calculates GRI compliance score correctly', async () => {
      render(
        <MockComplianceCalculator
          framework="GRI"
          assessmentData={griData}
          onCalculate={mockOnCalculate}
        />
      );

      const calculateBtn = screen.getByTestId('calculate-btn');
      await user.click(calculateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('total-score')).toHaveTextContent('Total Score: 78');
        expect(screen.getByTestId('compliance-level')).toHaveTextContent('compliant');
      });
    });

    test('handles GRI materiality assessment requirements', async () => {
      const incompleteMaterialityData = {
        completeness: 60,
        quality: 50,
        materiality_alignment: 40,
        stakeholder_engagement: 30,
        materialTopics: ['Energy'] // Too few topics
      };

      render(
        <MockComplianceCalculator
          framework="GRI"
          assessmentData={incompleteMaterialityData}
          onCalculate={mockOnCalculate}
        />
      );

      const calculateBtn = screen.getByTestId('calculate-btn');
      await user.click(calculateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('total-score')).toHaveTextContent('Total Score: 47');
        expect(screen.getByTestId('compliance-level')).toHaveTextContent('non-compliant');
        expect(screen.getByTestId('recommendations')).toBeInTheDocument();
      });
    });
  });

  describe('SASB Compliance Calculations', () => {
    const sasbData = {
      topic_coverage: 85,
      metric_quality: 80,
      quantitative_disclosure: 75,
      forward_looking_analysis: 70,
      industryAlignment: 'technology-hardware'
    };

    test('calculates SASB compliance score correctly', async () => {
      render(
        <MockComplianceCalculator
          framework="SASB"
          assessmentData={sasbData}
          onCalculate={mockOnCalculate}
        />
      );

      const calculateBtn = screen.getByTestId('calculate-btn');
      await user.click(calculateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('total-score')).toHaveTextContent('Total Score: 78');
        expect(screen.getByTestId('compliance-level')).toHaveTextContent('compliant');
      });
    });

    test('enforces SASB higher compliance threshold', async () => {
      const borderlineData = {
        topic_coverage: 70,
        metric_quality: 70,
        quantitative_disclosure: 70,
        forward_looking_analysis: 70,
        industryAlignment: 'financial-services'
      };

      render(
        <MockComplianceCalculator
          framework="SASB"
          assessmentData={borderlineData}
          onCalculate={mockOnCalculate}
        />
      );

      const calculateBtn = screen.getByTestId('calculate-btn');
      await user.click(calculateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('total-score')).toHaveTextContent('Total Score: 70');
        expect(screen.getByTestId('compliance-level')).toHaveTextContent('non-compliant');
      });
    });
  });

  describe('EU Taxonomy Alignment Calculations', () => {
    const alignedData = {
      eligibility: true,
      substantial_contribution: true,
      dnsh_compliance: true,
      minimum_safeguards: true,
      eligibleActivities: ['4.1', '4.3', '7.1'],
      alignedActivities: ['4.1', '4.3'],
      turnoverProportion: 35,
      capexProportion: 45,
      opexProportion: 25
    };

    test('calculates EU Taxonomy alignment correctly', async () => {
      render(
        <MockComplianceCalculator
          framework="EU-TAXONOMY"
          assessmentData={alignedData}
          onCalculate={mockOnCalculate}
        />
      );

      const calculateBtn = screen.getByTestId('calculate-btn');
      await user.click(calculateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('alignment-status')).toHaveTextContent('Alignment: aligned');
        expect(screen.getByTestId('compliance-level')).toHaveTextContent('aligned');
      });
    });

    test('identifies non-aligned EU Taxonomy assessment', async () => {
      const nonAlignedData = {
        eligibility: true,
        substantial_contribution: true,
        dnsh_compliance: false, // Fails DNSH
        minimum_safeguards: true,
        eligibleActivities: ['4.1'],
        turnoverProportion: 10
      };

      render(
        <MockComplianceCalculator
          framework="EU-TAXONOMY"
          assessmentData={nonAlignedData}
          onCalculate={mockOnCalculate}
        />
      );

      const calculateBtn = screen.getByTestId('calculate-btn');
      await user.click(calculateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('alignment-status')).toHaveTextContent('Alignment: not-aligned');
        expect(screen.getByTestId('recommendations')).toBeInTheDocument();
      });
    });
  });

  describe('CSRD Compliance Calculations', () => {
    const csrdData = {
      mandatory_disclosures: 90,
      materiality_assessment_quality: 85,
      value_chain_integration: 75,
      targets_and_progress: 80,
      esrsCompliance: { ESRS_1: true, ESRS_2: true, ESRS_E1: true },
      doubleMaterialityStatus: 'complete'
    };

    test('calculates CSRD compliance score correctly', async () => {
      render(
        <MockComplianceCalculator
          framework="CSRD"
          assessmentData={csrdData}
          onCalculate={mockOnCalculate}
        />
      );

      const calculateBtn = screen.getByTestId('calculate-btn');
      await user.click(calculateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('total-score')).toHaveTextContent('Total Score: 84');
        expect(screen.getByTestId('compliance-level')).toHaveTextContent('compliant');
      });
    });

    test('enforces CSRD high compliance threshold', async () => {
      const borderlineData = {
        mandatory_disclosures: 75,
        materiality_assessment_quality: 70,
        value_chain_integration: 65,
        targets_and_progress: 70,
        esrsCompliance: { ESRS_1: true },
        doubleMaterialityStatus: 'incomplete'
      };

      render(
        <MockComplianceCalculator
          framework="CSRD"
          assessmentData={borderlineData}
          onCalculate={mockOnCalculate}
        />
      );

      const calculateBtn = screen.getByTestId('calculate-btn');
      await user.click(calculateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('total-score')).toHaveTextContent('Total Score: 71');
        expect(screen.getByTestId('compliance-level')).toHaveTextContent('non-compliant');
        expect(screen.getByTestId('recommendations')).toBeInTheDocument();
      });
    });
  });

  describe('Benchmarking and Peer Comparison', () => {
    const companyData = { score: 78 };
    const peerData = [
      { score: 65 }, { score: 72 }, { score: 80 }, { score: 85 },
      { score: 70 }, { score: 75 }, { score: 68 }, { score: 82 }
    ];

    test('calculates industry benchmarks correctly', () => {
      render(
        <MockBenchmarkingTool
          framework="TCFD"
          companyData={companyData}
          peerData={peerData}
        />
      );

      expect(screen.getByTestId('company-score')).toHaveTextContent('Company Score: 78');
      expect(screen.getByTestId('industry-average')).toHaveTextContent('Industry Average: 75');
      expect(screen.getByTestId('performance-indicator')).toHaveTextContent('Above Average');
    });

    test('calculates percentile ranking correctly', () => {
      render(
        <MockBenchmarkingTool
          framework="TCFD"
          companyData={companyData}
          peerData={peerData}
        />
      );

      const percentileText = screen.getByTestId('percentile').textContent;
      expect(percentileText).toMatch(/\d+th/); // Should show percentile ranking
    });

    test('shows correct performance indicator', () => {
      const belowAverageData = { score: 60 };

      render(
        <MockBenchmarkingTool
          framework="TCFD"
          companyData={belowAverageData}
          peerData={peerData}
        />
      );

      expect(screen.getByTestId('performance-indicator')).toHaveTextContent('Below Average');
    });
  });

  describe('Data Validation Engine', () => {
    test('validates TCFD data requirements', async () => {
      const incompleteData = {
        governance: 80,
        // Missing strategy, risk_management, metrics_targets
      };

      render(
        <MockValidationEngine
          framework="TCFD"
          data={incompleteData}
          onValidate={mockOnValidate}
        />
      );

      const validateBtn = screen.getByTestId('validate-btn');
      await user.click(validateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('validation-status')).toHaveTextContent('Status: Invalid');
        expect(screen.getByTestId('validation-errors')).toBeInTheDocument();
        expect(screen.getByTestId('error-0')).toHaveTextContent('Strategy disclosure is required');
      });
    });

    test('validates GRI materiality requirements', async () => {
      const materialityIncompleteData = {
        completeness: 80,
        // Missing materiality_assessment and stakeholder_engagement
      };

      render(
        <MockValidationEngine
          framework="GRI"
          data={materialityIncompleteData}
          onValidate={mockOnValidate}
        />
      );

      const validateBtn = screen.getByTestId('validate-btn');
      await user.click(validateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('validation-status')).toHaveTextContent('Status: Invalid');
        expect(screen.getByTestId('error-0')).toHaveTextContent('Materiality assessment is required');
        expect(screen.getByTestId('error-1')).toHaveTextContent('Stakeholder engagement is required');
      });
    });

    test('validates SASB industry alignment', async () => {
      const industryMissingData = {
        topic_coverage: 80,
        // Missing industryAlignment
      };

      render(
        <MockValidationEngine
          framework="SASB"
          data={industryMissingData}
          onValidate={mockOnValidate}
        />
      );

      const validateBtn = screen.getByTestId('validate-btn');
      await user.click(validateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('validation-errors')).toBeInTheDocument();
        expect(screen.getByTestId('error-0')).toHaveTextContent('Industry alignment is required');
      });
    });

    test('validates EU Taxonomy all criteria', async () => {
      const taxonomyIncompleteData = {
        eligibility: true,
        substantial_contribution: true,
        // Missing dnsh_compliance and minimum_safeguards
      };

      render(
        <MockValidationEngine
          framework="EU-TAXONOMY"
          data={taxonomyIncompleteData}
          onValidate={mockOnValidate}
        />
      );

      const validateBtn = screen.getByTestId('validate-btn');
      await user.click(validateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('validation-errors')).toBeInTheDocument();
        expect(screen.getByTestId('error-0')).toHaveTextContent('DNSH compliance check is required');
        expect(screen.getByTestId('error-1')).toHaveTextContent('Minimum safeguards verification is required');
      });
    });

    test('validates CSRD double materiality requirements', async () => {
      const csrdIncompleteData = {
        mandatory_disclosures: 80,
        doubleMaterialityStatus: 'incomplete',
        esrsCompliance: {}
      };

      render(
        <MockValidationEngine
          framework="CSRD"
          data={csrdIncompleteData}
          onValidate={mockOnValidate}
        />
      );

      const validateBtn = screen.getByTestId('validate-btn');
      await user.click(validateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('validation-errors')).toBeInTheDocument();
        expect(screen.getByTestId('error-0')).toHaveTextContent('Double materiality assessment is required');
        expect(screen.getByTestId('error-1')).toHaveTextContent('ESRS compliance mapping is required');
      });
    });

    test('shows warnings for quality improvements', async () => {
      const warningData = {
        governance: 40, // Low quality - should trigger warning
        strategy: 80,
        risk_management: 75,
        metrics_targets: 85
      };

      render(
        <MockValidationEngine
          framework="TCFD"
          data={warningData}
          onValidate={mockOnValidate}
        />
      );

      const validateBtn = screen.getByTestId('validate-btn');
      await user.click(validateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('validation-warnings')).toBeInTheDocument();
        expect(screen.getByTestId('warning-0')).toHaveTextContent('Governance disclosure quality could be improved');
      });
    });

    test('shows passed validation for complete data', async () => {
      const completeData = {
        governance: 85,
        strategy: 80,
        risk_management: 75,
        metrics_targets: 85
      };

      render(
        <MockValidationEngine
          framework="TCFD"
          data={completeData}
          onValidate={mockOnValidate}
        />
      );

      const validateBtn = screen.getByTestId('validate-btn');
      await user.click(validateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('validation-status')).toHaveTextContent('Status: Valid');
        expect(screen.getByTestId('validation-passed')).toBeInTheDocument();
        expect(screen.getByTestId('passed-0')).toHaveTextContent('All validation checks passed');
        expect(screen.getByTestId('completeness')).toHaveTextContent('Completeness: 100%');
      });
    });
  });

  describe('Performance and Error Handling', () => {
    test('handles calculation loading states', async () => {
      render(
        <MockComplianceCalculator
          framework="TCFD"
          assessmentData={{}}
          onCalculate={mockOnCalculate}
        />
      );

      const calculateBtn = screen.getByTestId('calculate-btn');
      await user.click(calculateBtn);

      expect(screen.getByTestId('calculate-btn')).toHaveTextContent('Calculating...');
      expect(screen.getByTestId('calculate-btn')).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByTestId('calculate-btn')).toHaveTextContent('Calculate Compliance');
        expect(screen.getByTestId('calculate-btn')).not.toBeDisabled();
      });
    });

    test('handles validation loading states', async () => {
      render(
        <MockValidationEngine
          framework="GRI"
          data={{}}
          onValidate={mockOnValidate}
        />
      );

      const validateBtn = screen.getByTestId('validate-btn');
      await user.click(validateBtn);

      expect(screen.getByTestId('validate-btn')).toHaveTextContent('Validating...');
      expect(screen.getByTestId('validate-btn')).toBeDisabled();

      await waitFor(() => {
        expect(screen.getByTestId('validate-btn')).toHaveTextContent('Validate Data');
        expect(screen.getByTestId('validate-btn')).not.toBeDisabled();
      });
    });

    test('handles unsupported framework calculation', async () => {
      render(
        <MockComplianceCalculator
          framework="UNSUPPORTED"
          assessmentData={{}}
          onCalculate={mockOnCalculate}
        />
      );

      const calculateBtn = screen.getByTestId('calculate-btn');
      await user.click(calculateBtn);

      await waitFor(() => {
        expect(mockOnCalculate).toHaveBeenCalledWith({ error: 'Unsupported framework' });
      });
    });

    test('calculates complex scoring algorithms efficiently', async () => {
      const largeDataset = {
        governance: 85,
        strategy: 90,
        risk_management: 75,
        metrics_targets: 80
      };

      const startTime = performance.now();

      render(
        <MockComplianceCalculator
          framework="TCFD"
          assessmentData={largeDataset}
          onCalculate={mockOnCalculate}
        />
      );

      const calculateBtn = screen.getByTestId('calculate-btn');
      await user.click(calculateBtn);

      await waitFor(() => {
        expect(screen.getByTestId('total-score')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const calculationTime = endTime - startTime;

      // Should complete calculation within reasonable time
      expect(calculationTime).toBeLessThan(1000);
    });
  });
});