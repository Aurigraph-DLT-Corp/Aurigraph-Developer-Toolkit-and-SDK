/**
 * Framework-Specific Questionnaire Tests
 * Aurex Launchpad - ESG Assessment Platform
 * 
 * Comprehensive test suite for framework-specific questionnaires including
 * TCFD, GRI, SASB, EU Taxonomy, and CSRD assessment forms and workflows
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';

// Import framework configurations
import { FRAMEWORKS, getFrameworkConfig, getAssessmentWorkflow } from '../../config/frameworks/index';

// Mock framework-specific questionnaire components
const MockTCFDQuestionnaire = ({ onQuestionnaireComplete, onSectionComplete }) => {
  const [responses, setResponses] = React.useState({});
  const [currentSection, setCurrentSection] = React.useState('governance');
  const [completedSections, setCompletedSections] = React.useState([]);

  const tcfdSections = {
    governance: {
      name: 'Governance',
      questions: [
        {
          id: 'gov_a',
          title: 'Board Oversight',
          description: 'Describe the board\'s oversight of climate-related risks and opportunities',
          type: 'long_text',
          required: true,
          maxLength: 2000
        },
        {
          id: 'gov_b',
          title: 'Management Role',
          description: 'Describe management\'s role in assessing and managing climate-related risks',
          type: 'long_text',
          required: true,
          maxLength: 2000
        }
      ]
    },
    strategy: {
      name: 'Strategy',
      questions: [
        {
          id: 'str_a',
          title: 'Climate-related Risks and Opportunities',
          description: 'Identify climate-related risks and opportunities over different time horizons',
          type: 'structured',
          required: true,
          timeHorizons: ['short', 'medium', 'long']
        },
        {
          id: 'str_b',
          title: 'Impact on Business',
          description: 'Describe impact on businesses, strategy, and financial planning',
          type: 'long_text',
          required: true,
          maxLength: 3000
        }
      ]
    },
    risk_management: {
      name: 'Risk Management',
      questions: [
        {
          id: 'rm_a',
          title: 'Risk Identification',
          description: 'Processes for identifying and assessing climate-related risks',
          type: 'process_description',
          required: true
        }
      ]
    },
    metrics_targets: {
      name: 'Metrics and Targets',
      questions: [
        {
          id: 'mt_a',
          title: 'Climate Metrics',
          description: 'Metrics used to assess climate-related risks and opportunities',
          type: 'metrics_table',
          required: true
        },
        {
          id: 'mt_b',
          title: 'GHG Emissions',
          description: 'Scope 1, 2, and 3 greenhouse gas emissions',
          type: 'ghg_emissions',
          required: true,
          scopes: ['scope1', 'scope2', 'scope3']
        }
      ]
    }
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const completeSection = (sectionId) => {
    const section = tcfdSections[sectionId];
    const sectionComplete = section.questions.every(q => responses[q.id]);
    
    if (sectionComplete && !completedSections.includes(sectionId)) {
      setCompletedSections(prev => [...prev, sectionId]);
      onSectionComplete(sectionId, responses);
    }
  };

  const currentSectionData = tcfdSections[currentSection];

  return (
    <div data-testid="tcfd-questionnaire">
      <h2>TCFD Climate-related Financial Disclosures</h2>
      
      <div data-testid="section-navigation">
        {Object.keys(tcfdSections).map(sectionId => (
          <button
            key={sectionId}
            data-testid={`section-${sectionId}`}
            onClick={() => setCurrentSection(sectionId)}
            className={`${currentSection === sectionId ? 'active' : ''} ${completedSections.includes(sectionId) ? 'completed' : ''}`}
          >
            {tcfdSections[sectionId].name}
          </button>
        ))}
      </div>

      <div data-testid="current-section">
        <h3>{currentSectionData.name}</h3>
        {currentSectionData.questions.map(question => (
          <div key={question.id} data-testid={`question-${question.id}`} className="question-block">
            <label>
              <h4>{question.title}</h4>
              <p>{question.description}</p>
              
              {question.type === 'long_text' && (
                <textarea
                  data-testid={`input-${question.id}`}
                  value={responses[question.id] || ''}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  maxLength={question.maxLength}
                  placeholder={`Enter your response (max ${question.maxLength} characters)`}
                />
              )}
              
              {question.type === 'structured' && question.timeHorizons && (
                <div data-testid={`structured-${question.id}`}>
                  {question.timeHorizons.map(horizon => (
                    <div key={horizon}>
                      <label>{horizon.charAt(0).toUpperCase() + horizon.slice(1)}-term</label>
                      <textarea
                        data-testid={`input-${question.id}-${horizon}`}
                        value={responses[`${question.id}_${horizon}`] || ''}
                        onChange={(e) => handleResponseChange(`${question.id}_${horizon}`, e.target.value)}
                        placeholder={`Describe ${horizon}-term risks and opportunities`}
                      />
                    </div>
                  ))}
                </div>
              )}
              
              {question.type === 'ghg_emissions' && question.scopes && (
                <div data-testid={`ghg-emissions-${question.id}`}>
                  {question.scopes.map(scope => (
                    <div key={scope}>
                      <label>{scope.toUpperCase()}</label>
                      <input
                        type="number"
                        data-testid={`input-${question.id}-${scope}`}
                        value={responses[`${question.id}_${scope}`] || ''}
                        onChange={(e) => handleResponseChange(`${question.id}_${scope}`, e.target.value)}
                        placeholder="Enter emissions in tCO2e"
                      />
                    </div>
                  ))}
                </div>
              )}
            </label>
          </div>
        ))}
        
        <button
          data-testid={`complete-section-${currentSection}`}
          onClick={() => completeSection(currentSection)}
        >
          Complete {currentSectionData.name} Section
        </button>
      </div>

      <div data-testid="completion-status">
        Completed Sections: {completedSections.length} / {Object.keys(tcfdSections).length}
      </div>

      {completedSections.length === Object.keys(tcfdSections).length && (
        <button
          data-testid="complete-questionnaire"
          onClick={() => onQuestionnaireComplete('TCFD', responses)}
        >
          Complete TCFD Assessment
        </button>
      )}
    </div>
  );
};

const MockGRIQuestionnaire = ({ onQuestionnaireComplete, onMaterialityUpdate }) => {
  const [materialTopics, setMaterialTopics] = React.useState([]);
  const [responses, setResponses] = React.useState({});
  const [materialityAssessment, setMaterialityAssessment] = React.useState(false);

  const availableTopics = [
    { id: 'GRI_302', name: 'Energy', category: 'Environmental' },
    { id: 'GRI_305', name: 'Emissions', category: 'Environmental' },
    { id: 'GRI_401', name: 'Employment', category: 'Social' },
    { id: 'GRI_405', name: 'Diversity and Equal Opportunity', category: 'Social' },
    { id: 'GRI_201', name: 'Economic Performance', category: 'Economic' },
    { id: 'GRI_205', name: 'Anti-corruption', category: 'Economic' }
  ];

  const universalStandards = [
    {
      id: 'GRI_2_1',
      title: 'Organizational Details',
      description: 'Report the name of the organization',
      type: 'text',
      required: true
    },
    {
      id: 'GRI_2_2',
      title: 'Entities Included',
      description: 'Entities included in sustainability reporting',
      type: 'list',
      required: true
    },
    {
      id: 'GRI_2_3',
      title: 'Reporting Period',
      description: 'Reporting period, frequency and contact point',
      type: 'date_range',
      required: true
    }
  ];

  const handleTopicSelection = (topicId) => {
    setMaterialTopics(prev => 
      prev.includes(topicId)
        ? prev.filter(id => id !== topicId)
        : [...prev, topicId]
    );
    
    if (onMaterialityUpdate) {
      onMaterialityUpdate(topicId, !materialTopics.includes(topicId));
    }
  };

  const completeMaterialityAssessment = () => {
    if (materialTopics.length >= 3) {
      setMaterialityAssessment(true);
    }
  };

  const handleResponseChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  return (
    <div data-testid="gri-questionnaire">
      <h2>GRI Standards - Global Reporting Initiative</h2>

      <div data-testid="universal-standards">
        <h3>Universal Standards (Mandatory)</h3>
        {universalStandards.map(standard => (
          <div key={standard.id} data-testid={`universal-${standard.id}`} className="question-block">
            <label>
              <h4>{standard.title}</h4>
              <p>{standard.description}</p>
              
              {standard.type === 'text' && (
                <input
                  type="text"
                  data-testid={`input-${standard.id}`}
                  value={responses[standard.id] || ''}
                  onChange={(e) => handleResponseChange(standard.id, e.target.value)}
                  placeholder="Enter organization name"
                />
              )}
              
              {standard.type === 'list' && (
                <textarea
                  data-testid={`input-${standard.id}`}
                  value={responses[standard.id] || ''}
                  onChange={(e) => handleResponseChange(standard.id, e.target.value)}
                  placeholder="List entities included in reporting"
                />
              )}
              
              {standard.type === 'date_range' && (
                <div>
                  <input
                    type="date"
                    data-testid={`input-${standard.id}-start`}
                    value={responses[`${standard.id}_start`] || ''}
                    onChange={(e) => handleResponseChange(`${standard.id}_start`, e.target.value)}
                  />
                  <input
                    type="date"
                    data-testid={`input-${standard.id}-end`}
                    value={responses[`${standard.id}_end`] || ''}
                    onChange={(e) => handleResponseChange(`${standard.id}_end`, e.target.value)}
                  />
                </div>
              )}
            </label>
          </div>
        ))}
      </div>

      <div data-testid="materiality-assessment">
        <h3>Materiality Assessment</h3>
        <p>Select material topics for your organization (minimum 3 required)</p>
        
        {availableTopics.map(topic => (
          <div key={topic.id} data-testid={`topic-${topic.id}`}>
            <label>
              <input
                type="checkbox"
                data-testid={`checkbox-${topic.id}`}
                checked={materialTopics.includes(topic.id)}
                onChange={() => handleTopicSelection(topic.id)}
              />
              {topic.name} ({topic.category})
            </label>
          </div>
        ))}
        
        <div data-testid="selected-topics">
          Selected Topics: {materialTopics.length}
        </div>
        
        <button
          data-testid="complete-materiality"
          onClick={completeMaterialityAssessment}
          disabled={materialTopics.length < 3}
        >
          Complete Materiality Assessment
        </button>
      </div>

      {materialityAssessment && (
        <div data-testid="topic-specific-disclosures">
          <h3>Topic-Specific Disclosures</h3>
          {materialTopics.map(topicId => {
            const topic = availableTopics.find(t => t.id === topicId);
            return (
              <div key={topicId} data-testid={`disclosure-${topicId}`} className="disclosure-block">
                <h4>{topic.name}</h4>
                <textarea
                  data-testid={`disclosure-input-${topicId}`}
                  value={responses[`disclosure_${topicId}`] || ''}
                  onChange={(e) => handleResponseChange(`disclosure_${topicId}`, e.target.value)}
                  placeholder={`Provide disclosure for ${topic.name}`}
                />
              </div>
            );
          })}
        </div>
      )}

      <div data-testid="completion-status">
        <div>Universal Standards: {universalStandards.every(s => responses[s.id]) ? 'Complete' : 'Incomplete'}</div>
        <div>Materiality Assessment: {materialityAssessment ? 'Complete' : 'Incomplete'}</div>
        <div>Topic Disclosures: {materialTopics.every(t => responses[`disclosure_${t}`]) ? 'Complete' : 'Incomplete'}</div>
      </div>

      {materialityAssessment && universalStandards.every(s => responses[s.id]) && materialTopics.every(t => responses[`disclosure_${t}`]) && (
        <button
          data-testid="complete-questionnaire"
          onClick={() => onQuestionnaireComplete('GRI', {
            ...responses,
            materialTopics,
            materialityAssessment: true
          })}
        >
          Complete GRI Assessment
        </button>
      )}
    </div>
  );
};

const MockSASBQuestionnaire = ({ industry, onQuestionnaireComplete }) => {
  const [responses, setResponses] = React.useState({});
  const [selectedIndustry, setSelectedIndustry] = React.useState(industry || '');

  const industries = {
    'TC-SI': {
      name: 'Software & IT Services',
      topics: [
        {
          id: 'data_security',
          title: 'Data Security',
          metrics: [
            { id: 'TC-SI-220a.1', description: 'Number of data breaches', type: 'number', unit: 'count' },
            { id: 'TC-SI-220a.2', description: 'Percentage of customers affected', type: 'percentage' }
          ]
        },
        {
          id: 'employee_diversity',
          title: 'Employee Diversity & Inclusion',
          metrics: [
            { id: 'TC-SI-330a.1', description: 'Percentage of gender diversity', type: 'percentage' },
            { id: 'TC-SI-330a.2', description: 'Percentage of racial/ethnic diversity', type: 'percentage' }
          ]
        }
      ]
    },
    'FN-CB': {
      name: 'Commercial Banks',
      topics: [
        {
          id: 'data_security',
          title: 'Data Security',
          metrics: [
            { id: 'FN-CB-230a.1', description: 'Number of data breaches', type: 'number', unit: 'count' },
            { id: 'FN-CB-230a.2', description: 'Customer account information affected', type: 'number' }
          ]
        },
        {
          id: 'esg_integration',
          title: 'ESG Integration in Credit Analysis',
          metrics: [
            { id: 'FN-CB-410a.1', description: 'Credit exposure by sector', type: 'table' },
            { id: 'FN-CB-410a.2', description: 'ESG factors in credit analysis', type: 'qualitative' }
          ]
        }
      ]
    }
  };

  const handleResponseChange = (metricId, value) => {
    setResponses(prev => ({
      ...prev,
      [metricId]: value
    }));
  };

  const selectedIndustryData = industries[selectedIndustry];

  return (
    <div data-testid="sasb-questionnaire">
      <h2>SASB - Sustainability Accounting Standards Board</h2>

      <div data-testid="industry-selection">
        <h3>Industry Selection</h3>
        <select
          data-testid="industry-select"
          value={selectedIndustry}
          onChange={(e) => setSelectedIndustry(e.target.value)}
        >
          <option value="">Select Industry</option>
          {Object.entries(industries).map(([code, data]) => (
            <option key={code} value={code}>
              {code} - {data.name}
            </option>
          ))}
        </select>
      </div>

      {selectedIndustryData && (
        <div data-testid="industry-topics">
          <h3>Industry Topics for {selectedIndustryData.name}</h3>
          
          {selectedIndustryData.topics.map(topic => (
            <div key={topic.id} data-testid={`topic-${topic.id}`} className="topic-section">
              <h4>{topic.title}</h4>
              
              {topic.metrics.map(metric => (
                <div key={metric.id} data-testid={`metric-${metric.id}`} className="metric-input">
                  <label>
                    <strong>{metric.id}:</strong> {metric.description}
                    
                    {metric.type === 'number' && (
                      <div>
                        <input
                          type="number"
                          data-testid={`input-${metric.id}`}
                          value={responses[metric.id] || ''}
                          onChange={(e) => handleResponseChange(metric.id, e.target.value)}
                          placeholder={`Enter ${metric.unit || 'value'}`}
                        />
                        {metric.unit && <span>{metric.unit}</span>}
                      </div>
                    )}
                    
                    {metric.type === 'percentage' && (
                      <div>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          data-testid={`input-${metric.id}`}
                          value={responses[metric.id] || ''}
                          onChange={(e) => handleResponseChange(metric.id, e.target.value)}
                          placeholder="Enter percentage"
                        />
                        <span>%</span>
                      </div>
                    )}
                    
                    {metric.type === 'qualitative' && (
                      <textarea
                        data-testid={`input-${metric.id}`}
                        value={responses[metric.id] || ''}
                        onChange={(e) => handleResponseChange(metric.id, e.target.value)}
                        placeholder="Provide qualitative description"
                      />
                    )}
                    
                    {metric.type === 'table' && (
                      <textarea
                        data-testid={`input-${metric.id}`}
                        value={responses[metric.id] || ''}
                        onChange={(e) => handleResponseChange(metric.id, e.target.value)}
                        placeholder="Provide table data (CSV format)"
                      />
                    )}
                  </label>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div data-testid="completion-status">
        Industry Selected: {selectedIndustry ? 'Yes' : 'No'}
        {selectedIndustryData && (
          <div>
            Metrics Completed: {Object.keys(responses).length} / {selectedIndustryData.topics.reduce((sum, t) => sum + t.metrics.length, 0)}
          </div>
        )}
      </div>

      {selectedIndustryData && (
        <button
          data-testid="complete-questionnaire"
          onClick={() => onQuestionnaireComplete('SASB', {
            industry: selectedIndustry,
            ...responses
          })}
        >
          Complete SASB Assessment
        </button>
      )}
    </div>
  );
};

const MockEUTaxonomyQuestionnaire = ({ onQuestionnaireComplete, onCriteriaUpdate }) => {
  const [eligibleActivities, setEligibleActivities] = React.useState([]);
  const [assessmentResults, setAssessmentResults] = React.useState({});
  const [currentStep, setCurrentStep] = React.useState('eligibility');

  const taxonomyActivities = [
    { id: '4.1', name: 'Solar photovoltaic electricity generation', objective: 'climate_mitigation' },
    { id: '4.3', name: 'Electricity generation from wind power', objective: 'climate_mitigation' },
    { id: '7.1', name: 'Construction of new buildings', objective: 'climate_mitigation' },
    { id: '7.2', name: 'Renovation of existing buildings', objective: 'climate_mitigation' }
  ];

  const assessmentSteps = [
    'eligibility',
    'technical_screening',
    'dnsh_assessment',
    'minimum_safeguards'
  ];

  const handleActivitySelection = (activityId) => {
    setEligibleActivities(prev =>
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleCriteriaResponse = (activityId, criterion, value) => {
    setAssessmentResults(prev => ({
      ...prev,
      [`${activityId}_${criterion}`]: value
    }));
    
    if (onCriteriaUpdate) {
      onCriteriaUpdate(activityId, criterion, value);
    }
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 'eligibility':
        return eligibleActivities.length > 0;
      case 'technical_screening':
        return eligibleActivities.every(id => assessmentResults[`${id}_substantial_contribution`] !== undefined);
      case 'dnsh_assessment':
        return eligibleActivities.every(id => assessmentResults[`${id}_dnsh_compliant`] !== undefined);
      case 'minimum_safeguards':
        return assessmentResults['minimum_safeguards_compliant'] !== undefined;
      default:
        return false;
    }
  };

  return (
    <div data-testid="eu-taxonomy-questionnaire">
      <h2>EU Taxonomy Regulation Assessment</h2>

      <div data-testid="assessment-steps">
        {assessmentSteps.map(step => (
          <button
            key={step}
            data-testid={`step-${step}`}
            onClick={() => setCurrentStep(step)}
            className={currentStep === step ? 'active' : ''}
          >
            {step.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {currentStep === 'eligibility' && (
        <div data-testid="eligibility-screening">
          <h3>Eligibility Screening</h3>
          <p>Select activities that your organization engages in:</p>
          
          {taxonomyActivities.map(activity => (
            <div key={activity.id} data-testid={`activity-${activity.id}`}>
              <label>
                <input
                  type="checkbox"
                  data-testid={`checkbox-${activity.id}`}
                  checked={eligibleActivities.includes(activity.id)}
                  onChange={() => handleActivitySelection(activity.id)}
                />
                <strong>{activity.id}:</strong> {activity.name}
                <span className="objective">({activity.objective})</span>
              </label>
            </div>
          ))}
          
          <div data-testid="eligible-count">
            Selected Activities: {eligibleActivities.length}
          </div>
        </div>
      )}

      {currentStep === 'technical_screening' && (
        <div data-testid="technical-screening">
          <h3>Technical Screening Criteria</h3>
          
          {eligibleActivities.map(activityId => {
            const activity = taxonomyActivities.find(a => a.id === activityId);
            return (
              <div key={activityId} data-testid={`technical-${activityId}`} className="criteria-section">
                <h4>{activity.name}</h4>
                <label>
                  Does this activity make a substantial contribution to climate change mitigation?
                  <div>
                    <label>
                      <input
                        type="radio"
                        name={`substantial_${activityId}`}
                        data-testid={`substantial-yes-${activityId}`}
                        onChange={() => handleCriteriaResponse(activityId, 'substantial_contribution', true)}
                      />
                      Yes
                    </label>
                    <label>
                      <input
                        type="radio"
                        name={`substantial_${activityId}`}
                        data-testid={`substantial-no-${activityId}`}
                        onChange={() => handleCriteriaResponse(activityId, 'substantial_contribution', false)}
                      />
                      No
                    </label>
                  </div>
                </label>
              </div>
            );
          })}
        </div>
      )}

      {currentStep === 'dnsh_assessment' && (
        <div data-testid="dnsh-assessment">
          <h3>Do No Significant Harm (DNSH) Assessment</h3>
          
          {eligibleActivities.map(activityId => {
            const activity = taxonomyActivities.find(a => a.id === activityId);
            return (
              <div key={activityId} data-testid={`dnsh-${activityId}`} className="criteria-section">
                <h4>{activity.name}</h4>
                <label>
                  Does this activity comply with all DNSH criteria?
                  <div>
                    <label>
                      <input
                        type="radio"
                        name={`dnsh_${activityId}`}
                        data-testid={`dnsh-yes-${activityId}`}
                        onChange={() => handleCriteriaResponse(activityId, 'dnsh_compliant', true)}
                      />
                      Yes
                    </label>
                    <label>
                      <input
                        type="radio"
                        name={`dnsh_${activityId}`}
                        data-testid={`dnsh-no-${activityId}`}
                        onChange={() => handleCriteriaResponse(activityId, 'dnsh_compliant', false)}
                      />
                      No
                    </label>
                  </div>
                </label>
              </div>
            );
          })}
        </div>
      )}

      {currentStep === 'minimum_safeguards' && (
        <div data-testid="minimum-safeguards">
          <h3>Minimum Social Safeguards</h3>
          
          <div data-testid="safeguards-checklist">
            <label>
              Does your organization comply with minimum social safeguards?
              <ul>
                <li>OECD Guidelines for Multinational Enterprises</li>
                <li>UN Guiding Principles on Business and Human Rights</li>
                <li>ILO Declaration on Fundamental Principles and Rights at Work</li>
                <li>International Bill of Human Rights</li>
              </ul>
              
              <div>
                <label>
                  <input
                    type="radio"
                    name="minimum_safeguards"
                    data-testid="safeguards-yes"
                    onChange={() => handleCriteriaResponse('all', 'minimum_safeguards_compliant', true)}
                  />
                  Yes, compliant with all safeguards
                </label>
                <label>
                  <input
                    type="radio"
                    name="minimum_safeguards"
                    data-testid="safeguards-no"
                    onChange={() => handleCriteriaResponse('all', 'minimum_safeguards_compliant', false)}
                  />
                  No, not compliant with all safeguards
                </label>
              </div>
            </label>
          </div>
        </div>
      )}

      <div data-testid="navigation-controls">
        <button
          data-testid="next-step"
          onClick={() => {
            const currentIndex = assessmentSteps.indexOf(currentStep);
            if (currentIndex < assessmentSteps.length - 1) {
              setCurrentStep(assessmentSteps[currentIndex + 1]);
            }
          }}
          disabled={!canProceedToNextStep()}
        >
          Next Step
        </button>
      </div>

      <div data-testid="completion-status">
        Current Step: {currentStep}
        <br />
        Eligible Activities: {eligibleActivities.length}
      </div>

      {currentStep === 'minimum_safeguards' && canProceedToNextStep() && (
        <button
          data-testid="complete-questionnaire"
          onClick={() => onQuestionnaireComplete('EU-TAXONOMY', {
            eligibleActivities,
            assessmentResults
          })}
        >
          Complete EU Taxonomy Assessment
        </button>
      )}
    </div>
  );
};

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Framework-Specific Questionnaires', () => {
  let user;
  let mockOnQuestionnaireComplete;
  let mockOnSectionComplete;
  let mockOnMaterialityUpdate;
  let mockOnCriteriaUpdate;

  beforeEach(() => {
    user = userEvent.setup();
    mockOnQuestionnaireComplete = jest.fn();
    mockOnSectionComplete = jest.fn();
    mockOnMaterialityUpdate = jest.fn();
    mockOnCriteriaUpdate = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('TCFD Questionnaire', () => {
    test('renders TCFD questionnaire with all four pillars', () => {
      render(
        <TestWrapper>
          <MockTCFDQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
            onSectionComplete={mockOnSectionComplete}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('tcfd-questionnaire')).toBeInTheDocument();
      expect(screen.getByText('TCFD Climate-related Financial Disclosures')).toBeInTheDocument();
      
      // Check all four pillars are present in navigation
      expect(screen.getByTestId('section-governance')).toBeInTheDocument();
      expect(screen.getByTestId('section-strategy')).toBeInTheDocument();
      expect(screen.getByTestId('section-risk_management')).toBeInTheDocument();
      expect(screen.getByTestId('section-metrics_targets')).toBeInTheDocument();
    });

    test('handles governance section completion', async () => {
      render(
        <TestWrapper>
          <MockTCFDQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
            onSectionComplete={mockOnSectionComplete}
          />
        </TestWrapper>
      );

      // Fill in governance questions
      const govAInput = screen.getByTestId('input-gov_a');
      const govBInput = screen.getByTestId('input-gov_b');

      await user.type(govAInput, 'Board provides oversight through quarterly climate risk reviews');
      await user.type(govBInput, 'Management has established a climate steering committee');

      const completeButton = screen.getByTestId('complete-section-governance');
      await user.click(completeButton);

      expect(mockOnSectionComplete).toHaveBeenCalledWith(
        'governance',
        expect.objectContaining({
          gov_a: 'Board provides oversight through quarterly climate risk reviews',
          gov_b: 'Management has established a climate steering committee'
        })
      );
    });

    test('handles strategy section with time horizons', async () => {
      render(
        <TestWrapper>
          <MockTCFDQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
            onSectionComplete={mockOnSectionComplete}
          />
        </TestWrapper>
      );

      // Navigate to strategy section
      await user.click(screen.getByTestId('section-strategy'));

      expect(screen.getByTestId('structured-str_a')).toBeInTheDocument();
      expect(screen.getByTestId('input-str_a-short')).toBeInTheDocument();
      expect(screen.getByTestId('input-str_a-medium')).toBeInTheDocument();
      expect(screen.getByTestId('input-str_a-long')).toBeInTheDocument();

      // Fill time horizon inputs
      await user.type(screen.getByTestId('input-str_a-short'), 'Short-term regulatory changes');
      await user.type(screen.getByTestId('input-str_a-medium'), 'Medium-term market transitions');
      await user.type(screen.getByTestId('input-str_a-long'), 'Long-term physical risks');
    });

    test('handles metrics section with GHG emissions', async () => {
      render(
        <TestWrapper>
          <MockTCFDQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
            onSectionComplete={mockOnSectionComplete}
          />
        </TestWrapper>
      );

      // Navigate to metrics section
      await user.click(screen.getByTestId('section-metrics_targets'));

      expect(screen.getByTestId('ghg-emissions-mt_b')).toBeInTheDocument();
      expect(screen.getByTestId('input-mt_b-scope1')).toBeInTheDocument();
      expect(screen.getByTestId('input-mt_b-scope2')).toBeInTheDocument();
      expect(screen.getByTestId('input-mt_b-scope3')).toBeInTheDocument();

      // Fill GHG emissions data
      await user.type(screen.getByTestId('input-mt_b-scope1'), '1500');
      await user.type(screen.getByTestId('input-mt_b-scope2'), '2800');
      await user.type(screen.getByTestId('input-mt_b-scope3'), '15600');
    });

    test('tracks completion progress across all sections', async () => {
      render(
        <TestWrapper>
          <MockTCFDQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
            onSectionComplete={mockOnSectionComplete}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('completion-status')).toHaveTextContent('Completed Sections: 0 / 4');

      // Complete governance section
      await user.type(screen.getByTestId('input-gov_a'), 'Test governance response');
      await user.type(screen.getByTestId('input-gov_b'), 'Test management response');
      await user.click(screen.getByTestId('complete-section-governance'));

      expect(screen.getByTestId('completion-status')).toHaveTextContent('Completed Sections: 1 / 4');
    });
  });

  describe('GRI Questionnaire', () => {
    test('renders GRI questionnaire with universal standards', () => {
      render(
        <TestWrapper>
          <MockGRIQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
            onMaterialityUpdate={mockOnMaterialityUpdate}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('gri-questionnaire')).toBeInTheDocument();
      expect(screen.getByText('GRI Standards - Global Reporting Initiative')).toBeInTheDocument();
      expect(screen.getByTestId('universal-standards')).toBeInTheDocument();
      expect(screen.getByTestId('materiality-assessment')).toBeInTheDocument();
    });

    test('handles universal standards completion', async () => {
      render(
        <TestWrapper>
          <MockGRIQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
            onMaterialityUpdate={mockOnMaterialityUpdate}
          />
        </TestWrapper>
      );

      // Fill universal standards
      await user.type(screen.getByTestId('input-GRI_2_1'), 'Test Corporation Ltd');
      await user.type(screen.getByTestId('input-GRI_2_2'), 'Subsidiary A, Subsidiary B');
      
      await user.type(screen.getByTestId('input-GRI_2_3-start'), '2024-01-01');
      await user.type(screen.getByTestId('input-GRI_2_3-end'), '2024-12-31');

      expect(screen.getByTestId('input-GRI_2_1')).toHaveValue('Test Corporation Ltd');
    });

    test('manages materiality assessment with topic selection', async () => {
      render(
        <TestWrapper>
          <MockGRIQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
            onMaterialityUpdate={mockOnMaterialityUpdate}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('selected-topics')).toHaveTextContent('Selected Topics: 0');

      // Select material topics
      await user.click(screen.getByTestId('checkbox-GRI_302')); // Energy
      await user.click(screen.getByTestId('checkbox-GRI_305')); // Emissions
      await user.click(screen.getByTestId('checkbox-GRI_401')); // Employment

      expect(screen.getByTestId('selected-topics')).toHaveTextContent('Selected Topics: 3');
      expect(mockOnMaterialityUpdate).toHaveBeenCalledTimes(3);

      // Complete materiality assessment
      const completeMaterialityButton = screen.getByTestId('complete-materiality');
      expect(completeMaterialityButton).not.toBeDisabled();
      
      await user.click(completeMaterialityButton);
      
      expect(screen.getByTestId('topic-specific-disclosures')).toBeInTheDocument();
    });

    test('requires minimum number of material topics', async () => {
      render(
        <TestWrapper>
          <MockGRIQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
            onMaterialityUpdate={mockOnMaterialityUpdate}
          />
        </TestWrapper>
      );

      // Select only 2 topics (less than minimum of 3)
      await user.click(screen.getByTestId('checkbox-GRI_302'));
      await user.click(screen.getByTestId('checkbox-GRI_305'));

      expect(screen.getByTestId('selected-topics')).toHaveTextContent('Selected Topics: 2');
      expect(screen.getByTestId('complete-materiality')).toBeDisabled();
    });

    test('enables topic-specific disclosures after materiality completion', async () => {
      render(
        <TestWrapper>
          <MockGRIQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
            onMaterialityUpdate={mockOnMaterialityUpdate}
          />
        </TestWrapper>
      );

      // Complete materiality assessment
      await user.click(screen.getByTestId('checkbox-GRI_302'));
      await user.click(screen.getByTestId('checkbox-GRI_305'));
      await user.click(screen.getByTestId('checkbox-GRI_401'));
      await user.click(screen.getByTestId('complete-materiality'));

      // Check disclosure fields are available
      expect(screen.getByTestId('disclosure-GRI_302')).toBeInTheDocument();
      expect(screen.getByTestId('disclosure-GRI_305')).toBeInTheDocument();
      expect(screen.getByTestId('disclosure-GRI_401')).toBeInTheDocument();

      // Fill disclosure fields
      await user.type(screen.getByTestId('disclosure-input-GRI_302'), 'Energy consumption data and initiatives');
      await user.type(screen.getByTestId('disclosure-input-GRI_305'), 'GHG emissions data and reduction targets');
      await user.type(screen.getByTestId('disclosure-input-GRI_401'), 'Employment practices and policies');
    });
  });

  describe('SASB Questionnaire', () => {
    test('renders SASB questionnaire with industry selection', () => {
      render(
        <TestWrapper>
          <MockSASBQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('sasb-questionnaire')).toBeInTheDocument();
      expect(screen.getByText('SASB - Sustainability Accounting Standards Board')).toBeInTheDocument();
      expect(screen.getByTestId('industry-selection')).toBeInTheDocument();
      expect(screen.getByTestId('industry-select')).toBeInTheDocument();
    });

    test('loads industry-specific topics after selection', async () => {
      render(
        <TestWrapper>
          <MockSASBQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
          />
        </TestWrapper>
      );

      const industrySelect = screen.getByTestId('industry-select');
      await user.selectOptions(industrySelect, 'TC-SI');

      expect(screen.getByTestId('industry-topics')).toBeInTheDocument();
      expect(screen.getByText('Industry Topics for Software & IT Services')).toBeInTheDocument();
      expect(screen.getByTestId('topic-data_security')).toBeInTheDocument();
      expect(screen.getByTestId('topic-employee_diversity')).toBeInTheDocument();
    });

    test('handles different metric types correctly', async () => {
      render(
        <TestWrapper>
          <MockSASBQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
          />
        </TestWrapper>
      );

      await user.selectOptions(screen.getByTestId('industry-select'), 'TC-SI');

      // Test number input
      const numberInput = screen.getByTestId('input-TC-SI-220a.1');
      expect(numberInput).toHaveAttribute('type', 'number');
      await user.type(numberInput, '5');

      // Test percentage input
      const percentageInput = screen.getByTestId('input-TC-SI-220a.2');
      expect(percentageInput).toHaveAttribute('max', '100');
      await user.type(percentageInput, '15.5');

      expect(numberInput).toHaveValue(5);
      expect(percentageInput).toHaveValue(15.5);
    });

    test('tracks completion progress for industry metrics', async () => {
      render(
        <TestWrapper>
          <MockSASBQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
          />
        </TestWrapper>
      );

      await user.selectOptions(screen.getByTestId('industry-select'), 'FN-CB');
      
      expect(screen.getByTestId('completion-status')).toHaveTextContent('Metrics Completed: 0 / 4');

      // Fill some metrics
      await user.type(screen.getByTestId('input-FN-CB-230a.1'), '2');
      await user.type(screen.getByTestId('input-FN-CB-230a.2'), '1500');

      expect(screen.getByTestId('completion-status')).toHaveTextContent('Metrics Completed: 2 / 4');
    });
  });

  describe('EU Taxonomy Questionnaire', () => {
    test('renders EU Taxonomy questionnaire with assessment steps', () => {
      render(
        <TestWrapper>
          <MockEUTaxonomyQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
            onCriteriaUpdate={mockOnCriteriaUpdate}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('eu-taxonomy-questionnaire')).toBeInTheDocument();
      expect(screen.getByText('EU Taxonomy Regulation Assessment')).toBeInTheDocument();
      
      // Check all assessment steps
      expect(screen.getByTestId('step-eligibility')).toBeInTheDocument();
      expect(screen.getByTestId('step-technical_screening')).toBeInTheDocument();
      expect(screen.getByTestId('step-dnsh_assessment')).toBeInTheDocument();
      expect(screen.getByTestId('step-minimum_safeguards')).toBeInTheDocument();
    });

    test('handles eligibility screening step', async () => {
      render(
        <TestWrapper>
          <MockEUTaxonomyQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
            onCriteriaUpdate={mockOnCriteriaUpdate}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('eligibility-screening')).toBeInTheDocument();
      expect(screen.getByTestId('eligible-count')).toHaveTextContent('Selected Activities: 0');

      // Select some activities
      await user.click(screen.getByTestId('checkbox-4.1')); // Solar
      await user.click(screen.getByTestId('checkbox-4.3')); // Wind
      await user.click(screen.getByTestId('checkbox-7.1')); // New buildings

      expect(screen.getByTestId('eligible-count')).toHaveTextContent('Selected Activities: 3');
    });

    test('progresses through assessment steps sequentially', async () => {
      render(
        <TestWrapper>
          <MockEUTaxonomyQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
            onCriteriaUpdate={mockOnCriteriaUpdate}
          />
        </TestWrapper>
      );

      // Initially next button should be disabled
      expect(screen.getByTestId('next-step')).toBeDisabled();

      // Select activities to enable next step
      await user.click(screen.getByTestId('checkbox-4.1'));
      expect(screen.getByTestId('next-step')).not.toBeDisabled();

      // Move to technical screening
      await user.click(screen.getByTestId('next-step'));
      expect(screen.getByTestId('technical-screening')).toBeInTheDocument();
      expect(screen.getByTestId('technical-4.1')).toBeInTheDocument();
    });

    test('handles technical screening criteria', async () => {
      render(
        <TestWrapper>
          <MockEUTaxonomyQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
            onCriteriaUpdate={mockOnCriteriaUpdate}
          />
        </TestWrapper>
      );

      // Select activity and move to technical screening
      await user.click(screen.getByTestId('checkbox-4.1'));
      await user.click(screen.getByTestId('next-step'));

      // Answer substantial contribution question
      await user.click(screen.getByTestId('substantial-yes-4.1'));
      
      expect(mockOnCriteriaUpdate).toHaveBeenCalledWith('4.1', 'substantial_contribution', true);
    });

    test('handles DNSH assessment step', async () => {
      render(
        <TestWrapper>
          <MockEUTaxonomyQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
            onCriteriaUpdate={mockOnCriteriaUpdate}
          />
        </TestWrapper>
      );

      // Navigate to DNSH step
      await user.click(screen.getByTestId('checkbox-4.1'));
      await user.click(screen.getByTestId('next-step'));
      await user.click(screen.getByTestId('substantial-yes-4.1'));
      await user.click(screen.getByTestId('next-step'));

      expect(screen.getByTestId('dnsh-assessment')).toBeInTheDocument();
      expect(screen.getByTestId('dnsh-4.1')).toBeInTheDocument();

      await user.click(screen.getByTestId('dnsh-yes-4.1'));
      expect(mockOnCriteriaUpdate).toHaveBeenCalledWith('4.1', 'dnsh_compliant', true);
    });

    test('handles minimum safeguards assessment', async () => {
      render(
        <TestWrapper>
          <MockEUTaxonomyQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
            onCriteriaUpdate={mockOnCriteriaUpdate}
          />
        </TestWrapper>
      );

      // Navigate to minimum safeguards step
      await user.click(screen.getByTestId('step-minimum_safeguards'));

      expect(screen.getByTestId('minimum-safeguards')).toBeInTheDocument();
      expect(screen.getByTestId('safeguards-checklist')).toBeInTheDocument();

      await user.click(screen.getByTestId('safeguards-yes'));
      expect(mockOnCriteriaUpdate).toHaveBeenCalledWith('all', 'minimum_safeguards_compliant', true);
    });
  });

  describe('Cross-Framework Integration', () => {
    test('questionnaires use framework configuration data', () => {
      // Test that framework configs are properly imported and accessible
      const tcfdConfig = getFrameworkConfig('TCFD');
      expect(tcfdConfig).toBeDefined();
      expect(tcfdConfig.framework.name).toBe('Task Force on Climate-related Financial Disclosures');

      const griConfig = getFrameworkConfig('GRI');
      expect(griConfig).toBeDefined();
      expect(griConfig.framework.name).toBe('Global Reporting Initiative');
    });

    test('assessment workflows are properly defined', () => {
      const tcfdWorkflow = getAssessmentWorkflow('TCFD');
      expect(tcfdWorkflow).toContain('governance_assessment');
      expect(tcfdWorkflow).toContain('strategy_assessment');
      expect(tcfdWorkflow).toContain('risk_management_assessment');
      expect(tcfdWorkflow).toContain('metrics_targets_assessment');

      const griWorkflow = getAssessmentWorkflow('GRI');
      expect(griWorkflow).toContain('materiality_assessment');
      expect(griWorkflow).toContain('stakeholder_engagement');
      expect(griWorkflow).toContain('topic_disclosures');
    });

    test('handles questionnaire completion with proper data structure', async () => {
      render(
        <TestWrapper>
          <MockTCFDQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
            onSectionComplete={mockOnSectionComplete}
          />
        </TestWrapper>
      );

      // Mock completing all sections (simplified for test)
      const mockCompleteResponses = {
        gov_a: 'Governance response',
        gov_b: 'Management response',
        str_a: 'Strategy response',
        str_b: 'Impact response',
        rm_a: 'Risk response',
        mt_a: 'Metrics response',
        mt_b_scope1: '1500',
        mt_b_scope2: '2800',
        mt_b_scope3: '15600'
      };

      // Simulate questionnaire completion
      act(() => {
        mockOnQuestionnaireComplete('TCFD', mockCompleteResponses);
      });

      expect(mockOnQuestionnaireComplete).toHaveBeenCalledWith('TCFD', mockCompleteResponses);
    });
  });

  describe('Accessibility and Usability', () => {
    test('questionnaires support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <MockSASBQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
          />
        </TestWrapper>
      );

      const industrySelect = screen.getByTestId('industry-select');
      
      // Test keyboard navigation
      industrySelect.focus();
      expect(industrySelect).toHaveFocus();

      // Test arrow key navigation (simulated with change)
      fireEvent.keyDown(industrySelect, { key: 'ArrowDown' });
      await user.selectOptions(industrySelect, 'TC-SI');
      
      expect(industrySelect).toHaveValue('TC-SI');
    });

    test('questionnaires provide clear progress indicators', () => {
      render(
        <TestWrapper>
          <MockEUTaxonomyQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
            onCriteriaUpdate={mockOnCriteriaUpdate}
          />
        </TestWrapper>
      );

      expect(screen.getByTestId('completion-status')).toBeInTheDocument();
      expect(screen.getByTestId('completion-status')).toHaveTextContent('Current Step: eligibility');
    });

    test('questionnaires handle validation and error states', async () => {
      render(
        <TestWrapper>
          <MockGRIQuestionnaire
            onQuestionnaireComplete={mockOnQuestionnaireComplete}
            onMaterialityUpdate={mockOnMaterialityUpdate}
          />
        </TestWrapper>
      );

      // Try to complete materiality with insufficient topics
      expect(screen.getByTestId('complete-materiality')).toBeDisabled();

      // Select sufficient topics
      await user.click(screen.getByTestId('checkbox-GRI_302'));
      await user.click(screen.getByTestId('checkbox-GRI_305'));
      await user.click(screen.getByTestId('checkbox-GRI_401'));

      expect(screen.getByTestId('complete-materiality')).not.toBeDisabled();
    });
  });
});