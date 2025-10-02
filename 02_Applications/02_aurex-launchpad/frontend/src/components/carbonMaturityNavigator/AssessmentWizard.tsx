// ================================================================================
// AUREX LAUNCHPAD™ CARBON MATURITY NAVIGATOR ASSESSMENT WIZARD
// Sub-Application #13: Multi-Step Assessment Interface with Conditional Logic
// Module ID: LAU-MAT-013-FE-WIZARD - Assessment Wizard Component  
// Created: August 7, 2025
// ================================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Assessment, 
  AssessmentQuestion, 
  AssessmentFormData,
  QuestionResponse,
  WizardState,
  NavigationState,
  AssessmentScope,
  IndustryCategory,
  EvidenceType,
  AssessmentStartResponse
} from '../../types/carbonMaturityNavigator';
import carbonMaturityNavigatorApi from '../../services/carbonMaturityNavigatorApi';
import LoadingSpinner from '../LoadingSpinner';
import EvidenceUploader from './EvidenceUploader';
import ProgressTracker from './ProgressTracker';

interface AssessmentWizardProps {
  assessmentId?: string;
  onComplete: (assessment: Assessment) => void;
  onCancel: () => void;
}

const AssessmentWizard: React.FC<AssessmentWizardProps> = ({
  assessmentId,
  onComplete,
  onCancel
}) => {
  // State Management
  const [wizardState, setWizardState] = useState<WizardState>({
    currentStep: 0,
    totalSteps: 1,
    currentLevel: 1,
    completedLevels: [],
    answers: {},
    evidence: {},
    progress: 0,
    isSubmitting: false,
    autoSaveStatus: 'idle'
  });

  const [navigationState, setNavigationState] = useState<NavigationState>({
    canGoBack: false,
    canGoForward: false
  });

  const [currentQuestions, setCurrentQuestions] = useState<AssessmentQuestion[]>([]);
  const [currentAssessment, setCurrentAssessment] = useState<Assessment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSetupForm, setShowSetupForm] = useState(!assessmentId);

  // Setup form state
  const [setupForm, setSetupForm] = useState<AssessmentFormData>({
    title: '',
    organization_id: '123e4567-e89b-12d3-a456-426614174000', // This would come from auth context
    framework_id: '123e4567-e89b-12d3-a456-426614174001', // Default CMM framework
    industry_category: IndustryCategory.MANUFACTURING,
    planned_completion_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    assessment_scope: {
      facilities_included: [],
      business_units: [],
      scope_1_included: true,
      scope_2_included: true,
      scope_3_included: false
    }
  });

  // Auto-save functionality
  const autoSaveTimer = React.useRef<NodeJS.Timeout>();
  
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    
    autoSaveTimer.current = setTimeout(() => {
      if (currentAssessment && Object.keys(wizardState.answers).length > 0) {
        performAutoSave();
      }
    }, 10000); // Auto-save every 10 seconds
  }, [currentAssessment, wizardState.answers]);

  const performAutoSave = async () => {
    if (!currentAssessment) return;

    setWizardState(prev => ({ ...prev, autoSaveStatus: 'saving' }));

    try {
      const responses: QuestionResponse[] = Object.entries(wizardState.answers).map(([questionId, answer]) => ({
        question_id: questionId,
        answer_value: answer
      }));

      await carbonMaturityNavigatorApi.autoSaveResponses({
        assessment_id: currentAssessment.id,
        responses,
        auto_save: true,
        submit_for_review: false
      });

      setWizardState(prev => ({ 
        ...prev, 
        autoSaveStatus: 'saved',
        lastSaved: new Date()
      }));

      // Reset to idle after 3 seconds
      setTimeout(() => {
        setWizardState(prev => ({ ...prev, autoSaveStatus: 'idle' }));
      }, 3000);

    } catch (error) {
      console.error('Auto-save failed:', error);
      setWizardState(prev => ({ ...prev, autoSaveStatus: 'error' }));
    }
  };

  // Load existing assessment if assessmentId provided
  useEffect(() => {
    if (assessmentId) {
      loadExistingAssessment();
    }
  }, [assessmentId]);

  // Trigger auto-save when answers change
  useEffect(() => {
    if (currentAssessment && Object.keys(wizardState.answers).length > 0) {
      triggerAutoSave();
    }
  }, [wizardState.answers, triggerAutoSave, currentAssessment]);

  const loadExistingAssessment = async () => {
    if (!assessmentId) return;

    setIsLoading(true);
    try {
      const assessment = await carbonMaturityNavigatorApi.getAssessment(assessmentId);
      setCurrentAssessment(assessment);
      
      // Load questions for current level
      await loadQuestionsForLevel(assessment.current_maturity_level || 1);
      
      setShowSetupForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to load assessment');
    } finally {
      setIsLoading(false);
    }
  };

  const loadQuestionsForLevel = async (level: number) => {
    if (!currentAssessment) return;

    setIsLoading(true);
    try {
      const questions = await carbonMaturityNavigatorApi.getQuestionsByLevel(
        currentAssessment.framework_id,
        level,
        IndustryCategory.MANUFACTURING, // This would come from assessment
        currentAssessment.id
      );

      setCurrentQuestions(questions);
      setWizardState(prev => ({
        ...prev,
        currentLevel: level,
        totalSteps: questions.length,
        currentStep: 0
      }));

      updateNavigationState();
    } catch (err: any) {
      setError(err.message || 'Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response: AssessmentStartResponse = await carbonMaturityNavigatorApi.startAssessment(setupForm);
      
      // Create assessment object from response
      const newAssessment: Assessment = {
        id: response.assessment_id,
        assessment_number: response.assessment_number,
        title: setupForm.title,
        organization_id: setupForm.organization_id,
        framework_id: setupForm.framework_id,
        status: 'in_progress' as any,
        progress_percentage: 0,
        assessment_scope: setupForm.assessment_scope,
        industry_customizations: { industry: setupForm.industry_category },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setCurrentAssessment(newAssessment);
      setCurrentQuestions(response.initial_questions);
      setShowSetupForm(false);

      setWizardState({
        currentStep: 0,
        totalSteps: response.initial_questions.length,
        currentLevel: 1,
        completedLevels: [],
        answers: {},
        evidence: {},
        progress: 0,
        isSubmitting: false,
        autoSaveStatus: 'idle'
      });

      updateNavigationState();
    } catch (err: any) {
      setError(err.message || 'Failed to start assessment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setWizardState(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: value
      }
    }));

    updateNavigationState();
  };

  const handleNextQuestion = () => {
    if (wizardState.currentStep < currentQuestions.length - 1) {
      setWizardState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1
      }));
    } else {
      // Check if we can move to next level
      handleLevelCompletion();
    }
    updateNavigationState();
  };

  const handlePreviousQuestion = () => {
    if (wizardState.currentStep > 0) {
      setWizardState(prev => ({
        ...prev,
        currentStep: prev.currentStep - 1
      }));
    }
    updateNavigationState();
  };

  const handleLevelCompletion = async () => {
    if (!currentAssessment) return;

    // Submit current level responses
    const responses: QuestionResponse[] = currentQuestions.map(question => ({
      question_id: question.id,
      answer_value: wizardState.answers[question.id] || '',
    })).filter(response => response.answer_value !== '');

    try {
      const submitResponse = await carbonMaturityNavigatorApi.submitResponses({
        assessment_id: currentAssessment.id,
        responses,
        auto_save: false,
        submit_for_review: false
      });

      // Update wizard state with progress
      setWizardState(prev => ({
        ...prev,
        completedLevels: [...prev.completedLevels, prev.currentLevel],
        progress: submitResponse.assessment_progress.percentage
      }));

      // Check if there are next level questions
      if (submitResponse.next_questions.length > 0 && wizardState.currentLevel < 5) {
        setCurrentQuestions(submitResponse.next_questions);
        setWizardState(prev => ({
          ...prev,
          currentLevel: prev.currentLevel + 1,
          currentStep: 0,
          totalSteps: submitResponse.next_questions.length
        }));
      } else {
        // Assessment complete
        handleAssessmentComplete();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit responses');
    }
  };

  const handleAssessmentComplete = () => {
    if (currentAssessment) {
      onComplete({
        ...currentAssessment,
        progress_percentage: 100,
        status: 'completed' as any
      });
    }
  };

  const updateNavigationState = () => {
    const currentQuestion = currentQuestions[wizardState.currentStep];
    const hasAnswer = currentQuestion && wizardState.answers[currentQuestion.id];

    setNavigationState({
      canGoBack: wizardState.currentStep > 0,
      canGoForward: !currentQuestion?.is_required || hasAnswer,
      nextQuestionId: wizardState.currentStep < currentQuestions.length - 1 
        ? currentQuestions[wizardState.currentStep + 1]?.id 
        : undefined,
      previousQuestionId: wizardState.currentStep > 0 
        ? currentQuestions[wizardState.currentStep - 1]?.id 
        : undefined
    });
  };

  const renderSetupForm = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Start New Carbon Maturity Assessment</h2>
          <p className="text-gray-600 mt-2">
            Configure your assessment parameters to get the most accurate and relevant results.
          </p>
        </div>

        <form onSubmit={handleSetupFormSubmit} className="p-6 space-y-6">
          {/* Assessment Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assessment Title *
            </label>
            <input
              type="text"
              required
              value={setupForm.title}
              onChange={(e) => setSetupForm(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Q4 2025 Carbon Maturity Assessment"
            />
          </div>

          {/* Industry Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry Category *
            </label>
            <select
              required
              value={setupForm.industry_category}
              onChange={(e) => setSetupForm(prev => ({ ...prev, industry_category: e.target.value as IndustryCategory }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.values(IndustryCategory).map((industry) => (
                <option key={industry} value={industry}>
                  {industry.charAt(0).toUpperCase() + industry.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Assessment Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emission Scopes to Include *
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={setupForm.assessment_scope.scope_1_included}
                  onChange={(e) => setSetupForm(prev => ({
                    ...prev,
                    assessment_scope: {
                      ...prev.assessment_scope,
                      scope_1_included: e.target.checked
                    }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Scope 1 - Direct GHG emissions
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={setupForm.assessment_scope.scope_2_included}
                  onChange={(e) => setSetupForm(prev => ({
                    ...prev,
                    assessment_scope: {
                      ...prev.assessment_scope,
                      scope_2_included: e.target.checked
                    }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Scope 2 - Indirect GHG emissions from purchased energy
                </span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={setupForm.assessment_scope.scope_3_included}
                  onChange={(e) => setSetupForm(prev => ({
                    ...prev,
                    assessment_scope: {
                      ...prev.assessment_scope,
                      scope_3_included: e.target.checked
                    }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Scope 3 - Other indirect GHG emissions (value chain)
                </span>
              </label>
            </div>
          </div>

          {/* Target Completion Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Completion Date
            </label>
            <input
              type="date"
              value={setupForm.planned_completion_date?.toISOString().split('T')[0]}
              onChange={(e) => setSetupForm(prev => ({ 
                ...prev, 
                planned_completion_date: e.target.value ? new Date(e.target.value) : undefined 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {isLoading && <LoadingSpinner className="w-4 h-4 mr-2" />}
              Start Assessment
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderQuestion = () => {
    const currentQuestion = currentQuestions[wizardState.currentStep];
    if (!currentQuestion) return null;

    const currentAnswer = wizardState.answers[currentQuestion.id];

    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-blue-600">
              Question {wizardState.currentStep + 1} of {wizardState.totalSteps}
            </span>
            <div className="flex items-center space-x-2">
              {currentQuestion.is_required && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded">
                  Required
                </span>
              )}
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                Level {wizardState.currentLevel}
              </span>
            </div>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {currentQuestion.question_text}
          </h3>
          
          {currentQuestion.description && (
            <p className="text-gray-600 mb-4">{currentQuestion.description}</p>
          )}
          
          {currentQuestion.help_text && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">{currentQuestion.help_text}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Answer Input */}
        <div className="mb-6">
          {currentQuestion.question_type === 'single_select' && (
            <div className="space-y-3">
              {currentQuestion.answer_options.map((option) => (
                <label key={option.value} className="flex items-start">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.value}
                    checked={currentAnswer === option.value}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">{option.label}</span>
                    {option.description && (
                      <p className="text-xs text-gray-500 mt-1">{option.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}

          {currentQuestion.question_type === 'text' && (
            <textarea
              value={currentAnswer || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Enter your response..."
            />
          )}

          {currentQuestion.question_type === 'numeric' && (
            <input
              type="number"
              value={currentAnswer || ''}
              onChange={(e) => handleAnswerChange(currentQuestion.id, parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter a number..."
            />
          )}

          {currentQuestion.question_type === 'boolean' && (
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value="true"
                  checked={currentAnswer === 'true'}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-900">Yes</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name={`question-${currentQuestion.id}`}
                  value="false"
                  checked={currentAnswer === 'false'}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-900">No</span>
              </label>
            </div>
          )}
        </div>

        {/* Evidence Upload Section */}
        {currentQuestion.requires_evidence && (
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-3">Supporting Evidence</h4>
            <p className="text-sm text-gray-600 mb-4">
              {currentQuestion.evidence_description || 'Upload documents to support your response'}
            </p>
            
            <EvidenceUploader
              assessmentId={currentAssessment?.id || ''}
              responseId={currentQuestion.id}
              requiredTypes={currentQuestion.evidence_types}
              onUploadComplete={(evidence) => {
                setWizardState(prev => ({
                  ...prev,
                  evidence: {
                    ...prev.evidence,
                    [currentQuestion.id]: [...(prev.evidence[currentQuestion.id] || []), evidence]
                  }
                }));
              }}
              className="mb-4"
            />
          </div>
        )}
      </div>
    );
  };

  const renderAutoSaveStatus = () => {
    if (wizardState.autoSaveStatus === 'idle') return null;

    const statusConfig = {
      saving: { icon: '⏳', text: 'Saving...', color: 'text-yellow-600' },
      saved: { icon: '✅', text: 'Saved', color: 'text-green-600' },
      error: { icon: '❌', text: 'Save failed', color: 'text-red-600' }
    };

    const config = statusConfig[wizardState.autoSaveStatus];

    return (
      <div className={`flex items-center ${config.color} text-sm`}>
        <span className="mr-1">{config.icon}</span>
        <span>{config.text}</span>
        {wizardState.lastSaved && wizardState.autoSaveStatus === 'saved' && (
          <span className="ml-2 text-gray-400">
            {wizardState.lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (showSetupForm) {
    return renderSetupForm();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentAssessment?.title}
            </h1>
            <p className="text-gray-600">
              {currentAssessment?.assessment_number} • Level {wizardState.currentLevel} Assessment
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            {renderAutoSaveStatus()}
            
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Progress Tracker */}
        {currentAssessment && (
          <ProgressTracker
            progress={{
              assessment_id: currentAssessment.id,
              progress_percentage: wizardState.progress,
              completed_questions: Object.keys(wizardState.answers).length,
              total_questions: wizardState.totalSteps,
              evidence_items: Object.values(wizardState.evidence).flat().length,
              last_updated: new Date().toISOString(),
              current_level_focus: wizardState.currentLevel,
              level_progress: Array.from({ length: 5 }, (_, i) => ({
                level: i + 1,
                total_questions: 10, // This would come from the API
                completed_questions: wizardState.completedLevels.includes(i + 1) ? 10 : 0,
                score: 0,
                is_complete: wizardState.completedLevels.includes(i + 1)
              }))
            }}
            showDetails={true}
            className="mb-6"
          />
        )}
      </div>

      {/* Question Content */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {renderQuestion()}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePreviousQuestion}
          disabled={!navigationState.canGoBack}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="text-center">
          <p className="text-sm text-gray-600">
            Level {wizardState.currentLevel} Progress: {wizardState.currentStep + 1} / {wizardState.totalSteps}
          </p>
        </div>

        <button
          onClick={handleNextQuestion}
          disabled={!navigationState.canGoForward}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {wizardState.currentStep === wizardState.totalSteps - 1 
            ? (wizardState.currentLevel === 5 ? 'Complete Assessment' : 'Next Level')
            : 'Next'
          }
        </button>
      </div>
    </div>
  );
};

export default AssessmentWizard;