import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  Leaf,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart3
} from "lucide-react";

interface AssessmentFormProps {
  onComplete: () => void;
  onBack: () => void;
}

interface Question {
  id: string;
  category: string;
  question: string;
  description?: string;
  type: 'multiple_choice' | 'yes_no' | 'scale';
  options?: string[];
  weight: number;
}

interface Answer {
  questionId: string;
  value: string | number;
  score: number;
}

const AssessmentForm: React.FC<AssessmentFormProps> = ({ onComplete, onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ISO 14064-based assessment questions
  const questions: Question[] = [
    // Organizational Boundaries & Scope
    {
      id: 'org_boundary',
      category: 'Organizational Boundaries',
      question: 'Has your organization clearly defined its organizational boundaries for GHG reporting?',
      description: 'This includes identifying which operations, facilities, and subsidiaries are included in your GHG inventory.',
      type: 'multiple_choice',
      options: [
        'Yes, fully defined with documented procedures',
        'Partially defined, some documentation exists',
        'Basic understanding but not documented',
        'No, not defined'
      ],
      weight: 10
    },
    {
      id: 'operational_control',
      category: 'Organizational Boundaries',
      question: 'Does your organization have operational control over the facilities included in your GHG inventory?',
      type: 'multiple_choice',
      options: [
        'Yes, full operational control over all facilities',
        'Operational control over most facilities (>80%)',
        'Mixed operational control (50-80%)',
        'Limited operational control (<50%)'
      ],
      weight: 8
    },

    // Scope 1 Emissions
    {
      id: 'scope1_identification',
      category: 'Scope 1 Emissions',
      question: 'Has your organization identified all direct GHG emission sources (Scope 1)?',
      description: 'Direct emissions from sources owned or controlled by your organization (combustion, process emissions, fugitive emissions).',
      type: 'multiple_choice',
      options: [
        'Yes, comprehensive identification with detailed inventory',
        'Most sources identified (>80%)',
        'Some sources identified (50-80%)',
        'Limited identification (<50%)'
      ],
      weight: 12
    },
    {
      id: 'scope1_monitoring',
      category: 'Scope 1 Emissions',
      question: 'Do you have monitoring systems in place for Scope 1 emissions?',
      type: 'multiple_choice',
      options: [
        'Automated monitoring systems with real-time data',
        'Regular monitoring with documented procedures',
        'Periodic monitoring with some documentation',
        'No systematic monitoring'
      ],
      weight: 10
    },

    // Scope 2 Emissions
    {
      id: 'scope2_electricity',
      category: 'Scope 2 Emissions',
      question: 'Does your organization track electricity consumption and associated emissions?',
      description: 'Indirect emissions from purchased electricity, steam, heating, and cooling.',
      type: 'multiple_choice',
      options: [
        'Yes, detailed tracking with location and market-based methods',
        'Good tracking with one method (location or market-based)',
        'Basic tracking of consumption only',
        'No systematic tracking'
      ],
      weight: 10
    },

    // Scope 3 Emissions
    {
      id: 'scope3_assessment',
      category: 'Scope 3 Emissions',
      question: 'Has your organization assessed Scope 3 emissions relevance?',
      description: 'Indirect emissions from value chain activities (upstream and downstream).',
      type: 'multiple_choice',
      options: [
        'Yes, comprehensive assessment of all 15 categories',
        'Assessment of most relevant categories (>10)',
        'Assessment of some categories (5-10)',
        'No systematic assessment'
      ],
      weight: 8
    },

    // Data Management
    {
      id: 'data_quality',
      category: 'Data Management',
      question: 'What is the quality of your GHG data collection and management?',
      type: 'multiple_choice',
      options: [
        'High quality with automated systems and regular validation',
        'Good quality with documented procedures',
        'Moderate quality with some manual processes',
        'Poor quality with mostly manual/estimated data'
      ],
      weight: 12
    },
    {
      id: 'data_retention',
      category: 'Data Management',
      question: 'Do you have data retention and archival procedures for GHG data?',
      type: 'yes_no',
      weight: 6
    },

    // Verification & Assurance
    {
      id: 'internal_verification',
      category: 'Verification',
      question: 'Does your organization have internal verification procedures for GHG data?',
      type: 'multiple_choice',
      options: [
        'Yes, comprehensive internal audit procedures',
        'Some internal verification processes',
        'Basic review procedures',
        'No internal verification'
      ],
      weight: 8
    },
    {
      id: 'external_verification',
      category: 'Verification',
      question: 'Has your GHG inventory been externally verified?',
      type: 'multiple_choice',
      options: [
        'Yes, annually by accredited third party',
        'Yes, periodically by third party',
        'Planning for external verification',
        'No external verification'
      ],
      weight: 10
    },

    // Reporting & Disclosure
    {
      id: 'ghg_reporting',
      category: 'Reporting',
      question: 'Does your organization regularly report GHG emissions?',
      type: 'multiple_choice',
      options: [
        'Yes, annual public reporting with detailed methodology',
        'Yes, annual reporting with basic information',
        'Irregular or internal reporting only',
        'No formal reporting'
      ],
      weight: 8
    },

    // Management & Governance
    {
      id: 'ghg_policy',
      category: 'Management',
      question: 'Does your organization have a formal GHG management policy?',
      type: 'multiple_choice',
      options: [
        'Yes, comprehensive policy with clear roles and responsibilities',
        'Yes, basic policy document exists',
        'Informal policy or guidelines',
        'No formal policy'
      ],
      weight: 8
    },
    {
      id: 'reduction_targets',
      category: 'Management',
      question: 'Has your organization set GHG reduction targets?',
      type: 'multiple_choice',
      options: [
        'Yes, science-based targets with detailed plans',
        'Yes, targets set with some planning',
        'Considering setting targets',
        'No targets set'
      ],
      weight: 10
    }
  ];

  const totalQuestions = questions.length;
  const progress = ((currentStep + 1) / totalQuestions) * 100;
  const currentQuestion = questions[currentStep];

  const getScoreForAnswer = (question: Question, answerValue: string | number): number => {
    if (question.type === 'yes_no') {
      return answerValue === 'yes' ? question.weight : 0;
    }

    if (question.type === 'multiple_choice' && question.options) {
      const optionIndex = question.options.indexOf(answerValue as string);
      const maxScore = question.weight;
      const scorePercentage = (question.options.length - 1 - optionIndex) / (question.options.length - 1);
      return Math.round(maxScore * scorePercentage);
    }

    return 0;
  };

  const handleAnswer = (value: string | number) => {
    const score = getScoreForAnswer(currentQuestion, value);

    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      value,
      score
    };

    setAnswers(prev => {
      const filtered = prev.filter(a => a.questionId !== currentQuestion.id);
      return [...filtered, newAnswer];
    });
  };

  const getCurrentAnswer = () => {
    return answers.find(a => a.questionId === currentQuestion.id);
  };

  const canProceed = () => {
    return getCurrentAnswer() !== undefined;
  };

  const handleNext = () => {
    if (currentStep < totalQuestions - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateFinalScore = () => {
    const totalPossibleScore = questions.reduce((sum, q) => sum + q.weight, 0);
    const actualScore = answers.reduce((sum, a) => sum + a.score, 0);
    return Math.round((actualScore / totalPossibleScore) * 100);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const finalScore = calculateFinalScore();
      const token = localStorage.getItem('aurex_auth_token') || localStorage.getItem('assessment_auth_token');

      // Get API base URL
      const apiBaseUrl = window.location.hostname === 'dev.aurigraph.io'
        ? 'https://dev.aurigraph.io/api'
        : 'http://localhost:8000/api';

      const response = await fetch(`${apiBaseUrl}/assessments/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          answers,
          score: finalScore,
          title: `GHG Readiness Assessment - ${new Date().toLocaleDateString()}`,
          assessment_type: 'ghg_readiness',
          status: 'completed'
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Assessment submitted successfully:', result);

        // Show success message
        alert(`Assessment submitted successfully! Your score: ${finalScore.toFixed(1)}%`);

        onComplete();
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Assessment submission failed:', errorData);
        throw new Error(errorData.detail || `Failed to submit assessment (${response.status})`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert(`Failed to submit assessment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Navigation Header */}
      <nav className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2 font-bold text-xl text-green-600">
              <Leaf className="h-8 w-8" />
              GHG Readiness Assessment
            </div>
            <div className="text-sm text-gray-600">
              Question {currentStep + 1} of {totalQuestions}
            </div>
          </div>
        </div>
      </nav>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Assessment Progress</span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <Card className="border-2 border-green-100">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {currentQuestion.category}
                </Badge>
              </div>
              <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
              {currentQuestion.description && (
                <CardDescription className="text-base">
                  {currentQuestion.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentQuestion.type === 'yes_no' ? (
                  <>
                    <button
                      onClick={() => handleAnswer('yes')}
                      className={`w-full p-4 text-left border rounded-lg transition-colors ${
                        getCurrentAnswer()?.value === 'yes'
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Yes</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleAnswer('no')}
                      className={`w-full p-4 text-left border rounded-lg transition-colors ${
                        getCurrentAnswer()?.value === 'no'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5" />
                        <span className="font-medium">No</span>
                      </div>
                    </button>
                  </>
                ) : (
                  currentQuestion.options?.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(option)}
                      className={`w-full p-4 text-left border rounded-lg transition-colors ${
                        getCurrentAnswer()?.value === option
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          getCurrentAnswer()?.value === option
                            ? 'border-green-500 bg-green-500'
                            : 'border-gray-300'
                        }`}>
                          {getCurrentAnswer()?.value === option && (
                            <div className="w-full h-full rounded-full bg-white scale-50"></div>
                          )}
                        </div>
                        <span className="font-medium">{option}</span>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!canProceed() || isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : currentStep === totalQuestions - 1 ? (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Complete Assessment
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AssessmentForm;
