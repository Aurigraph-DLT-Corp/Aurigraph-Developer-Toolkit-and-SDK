import React, { useState, useEffect } from 'react';
import { Assessment, AssessmentQuestion, SubmitResponseRequest } from '../../services/assessmentService';
import { assessmentService } from '../../services/assessmentService';
import LoadingSpinner from '../LoadingSpinner';
import { ChevronLeft, ChevronRight, Save, CheckCircle, AlertCircle } from 'lucide-react';

interface AssessmentFormProps {
  assessmentId: number;
  onComplete?: (assessment: Assessment) => void;
  onSave?: () => void;
}

interface FormResponse {
  questionId: number;
  value: string | number | boolean;
  text?: string;
}

const AssessmentForm: React.FC<AssessmentFormProps> = ({
  assessmentId,
  onComplete,
  onSave,
}) => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [responses, setResponses] = useState<Record<number, FormResponse>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ answered: 0, total: 0 });

  useEffect(() => {
    loadAssessmentData();
  }, [assessmentId]);

  useEffect(() => {
    calculateProgress();
  }, [responses, questions]);

  const loadAssessmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [assessmentData, questionsData, existingResponses] = await Promise.all([
        assessmentService.getAssessment(assessmentId),
        assessmentService.getAssessmentQuestions(assessmentId),
        assessmentService.getAssessmentResponses(assessmentId).catch(() => [])
      ]);

      setAssessment(assessmentData);
      setQuestions(questionsData.sort((a, b) => a.order_index - b.order_index));

      // Load existing responses
      const responseMap: Record<number, FormResponse> = {};
      existingResponses.forEach(response => {
        responseMap[response.question_id] = {
          questionId: response.question_id,
          value: response.response_value,
          text: response.response_text
        };
      });
      setResponses(responseMap);

    } catch (err) {
      console.error('Error loading assessment:', err);
      setError('Failed to load assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    const answered = Object.keys(responses).length;
    setProgress({ answered, total: questions.length });
  };

  const handleResponseChange = (questionId: number, value: string | number | boolean, text?: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        value,
        text
      }
    }));
  };

  const saveResponse = async (questionId: number) => {
    const response = responses[questionId];
    if (!response) return;

    try {
      const submitData: SubmitResponseRequest = {
        question_id: questionId,
        response_value: response.value,
        response_text: response.text
      };

      await assessmentService.submitResponse(assessmentId, submitData);
      console.log('Response saved successfully');
    } catch (err) {
      console.error('Error saving response:', err);
    }
  };

  const saveAllResponses = async () => {
    try {
      setSaving(true);
      
      const responsesToSave = Object.values(responses).map(response => ({
        question_id: response.questionId,
        response_value: response.value,
        response_text: response.text
      }));

      await assessmentService.submitMultipleResponses(assessmentId, responsesToSave);
      onSave?.();
      console.log('All responses saved successfully');
    } catch (err) {
      console.error('Error saving responses:', err);
      setError('Failed to save responses. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const completeAssessment = async () => {
    try {
      setSaving(true);
      
      // First save all responses
      await saveAllResponses();
      
      // Then complete the assessment
      const completedAssessment = await assessmentService.completeAssessment(assessmentId);
      onComplete?.(completedAssessment);
      console.log('Assessment completed successfully');
    } catch (err) {
      console.error('Error completing assessment:', err);
      setError('Failed to complete assessment. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const goToPrevious = () => {
    goToQuestion(currentQuestionIndex - 1);
  };

  const goToNext = () => {
    // Save current response before moving
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion && responses[currentQuestion.id]) {
      saveResponse(currentQuestion.id);
    }
    
    goToQuestion(currentQuestionIndex + 1);
  };

  const renderQuestionInput = (question: AssessmentQuestion) => {
    const currentResponse = responses[question.id];

    switch (question.question_type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={currentResponse?.value === option}
                  onChange={(e) => handleResponseChange(question.id, e.target.value)}
                  className="text-green-600 focus:ring-green-500"
                />
                <span className="text-gray-900">{option}</span>
              </label>
            )) || <p className="text-gray-500">No options available</p>}
          </div>
        );

      case 'boolean':
        return (
          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="true"
                checked={currentResponse?.value === true}
                onChange={() => handleResponseChange(question.id, true)}
                className="text-green-600 focus:ring-green-500"
              />
              <span className="text-gray-900">Yes</span>
            </label>
            <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name={`question-${question.id}`}
                value="false"
                checked={currentResponse?.value === false}
                onChange={() => handleResponseChange(question.id, false)}
                className="text-green-600 focus:ring-green-500"
              />
              <span className="text-gray-900">No</span>
            </label>
          </div>
        );

      case 'scale':
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">1 (Poor)</span>
              <input
                type="range"
                min="1"
                max="5"
                value={currentResponse?.value || 1}
                onChange={(e) => handleResponseChange(question.id, parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-sm text-gray-500">5 (Excellent)</span>
            </div>
            <div className="text-center">
              <span className="text-lg font-semibold text-green-600">
                {currentResponse?.value || 1}
              </span>
            </div>
          </div>
        );

      case 'numeric':
        return (
          <input
            type="number"
            value={currentResponse?.value || ''}
            onChange={(e) => handleResponseChange(question.id, parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Enter a number"
          />
        );

      case 'text':
      default:
        return (
          <textarea
            value={currentResponse?.value || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-vertical"
            placeholder="Enter your response..."
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <h3 className="text-lg font-medium text-red-900">Error</h3>
        </div>
        <p className="mt-2 text-red-700">{error}</p>
        <button
          onClick={loadAssessmentData}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!assessment || questions.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No Questions Available</h3>
        <p className="text-gray-500">This assessment doesn't have any questions yet.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const allQuestionsAnswered = progress.answered === progress.total;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{assessment.title}</h1>
            {assessment.description && (
              <p className="text-gray-600 mt-2">{assessment.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Question {currentQuestionIndex + 1} of {questions.length}</div>
            <div className="text-sm text-green-600">{progress.answered} answered</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(progress.answered / progress.total) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {currentQuestion.question_text}
              </h2>
              {currentQuestion.category && (
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  {currentQuestion.category}
                  {currentQuestion.subcategory && ` • ${currentQuestion.subcategory}`}
                </span>
              )}
            </div>
            {currentQuestion.required && (
              <span className="ml-2 text-red-500 text-sm">Required</span>
            )}
          </div>
        </div>

        {/* Question Input */}
        <div className="mb-8">
          {renderQuestionInput(currentQuestion)}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={goToPrevious}
            disabled={isFirstQuestion}
            className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
              isFirstQuestion
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </button>

          <div className="flex space-x-3">
            <button
              onClick={saveAllResponses}
              disabled={saving}
              className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {saving ? <LoadingSpinner /> : <Save className="w-4 h-4 mr-2" />}
              Save Progress
            </button>

            {isLastQuestion && allQuestionsAnswered ? (
              <button
                onClick={completeAssessment}
                disabled={saving}
                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {saving ? <LoadingSpinner /> : <CheckCircle className="w-4 h-4 mr-2" />}
                Complete Assessment
              </button>
            ) : (
              <button
                onClick={goToNext}
                disabled={isLastQuestion}
                className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                  isLastQuestion
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-medium text-gray-900 mb-3">Question Overview</h3>
        <div className="flex flex-wrap gap-2">
          {questions.map((question, index) => (
            <button
              key={question.id}
              onClick={() => goToQuestion(index)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                index === currentQuestionIndex
                  ? 'bg-green-600 text-white'
                  : responses[question.id]
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AssessmentForm;