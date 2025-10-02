// ================================================================================
// AUREX LAUNCHPAD™ CARBON MATURITY NAVIGATOR SCORE DASHBOARD
// Sub-Application #13: Results Visualization and Analytics Interface
// Module ID: LAU-MAT-013-FE-SCORE - Score Dashboard Component
// Created: August 7, 2025
// ================================================================================

import React, { useState, useEffect } from 'react';
import { 
  Assessment, 
  AssessmentScoring, 
  BenchmarkComparison,
  IndustryCategory
} from '../../types/carbonMaturityNavigator';
import carbonMaturityNavigatorApi from '../../services/carbonMaturityNavigatorApi';
import LoadingSpinner from '../LoadingSpinner';
import MaturityRadarChart from './MaturityRadarChart';
import BenchmarkChart from './BenchmarkChart';
import ScoreBreakdown from './ScoreBreakdown';

interface ScoreDashboardProps {
  assessment: Assessment;
  onStartNewAssessment: () => void;
  onViewRoadmap: () => void;
}

const ScoreDashboard: React.FC<ScoreDashboardProps> = ({
  assessment,
  onStartNewAssessment,
  onViewRoadmap
}) => {
  const [scoringData, setScoringData] = useState<AssessmentScoring | null>(null);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkComparison | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'detailed' | 'benchmark'>('overview');

  useEffect(() => {
    loadScoringData();
  }, [assessment.id]);

  const loadScoringData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [scoring, benchmark] = await Promise.all([
        carbonMaturityNavigatorApi.calculateScoring(assessment.id, false),
        carbonMaturityNavigatorApi.getIndustryBenchmarks(
          IndustryCategory.MANUFACTURING, // This would come from assessment
          'medium'
        )
      ]);

      setScoringData(scoring);
      setBenchmarkData(benchmark);
    } catch (err: any) {
      console.error('Failed to load scoring data:', err);
      setError(err.message || 'Failed to load scoring data');
    } finally {
      setIsLoading(false);
    }
  };

  const getMaturityLevelInfo = (level: number) => {
    const levels = {
      1: { 
        name: 'Initial', 
        description: 'Ad hoc processes with limited structure',
        color: 'bg-red-500',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      },
      2: { 
        name: 'Managed', 
        description: 'Basic processes established and managed',
        color: 'bg-orange-500',
        textColor: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      },
      3: { 
        name: 'Defined', 
        description: 'Standardized processes across organization',
        color: 'bg-yellow-500',
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200'
      },
      4: { 
        name: 'Quantitatively Managed', 
        description: 'Data-driven process control and optimization',
        color: 'bg-blue-500',
        textColor: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      },
      5: { 
        name: 'Optimizing', 
        description: 'Continuous improvement and innovation',
        color: 'bg-green-500',
        textColor: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      }
    };
    return levels[level] || levels[1];
  };

  const getScoreInterpretation = (percentage: number) => {
    if (percentage >= 90) return { level: 'excellent', text: 'Excellent', color: 'text-green-600' };
    if (percentage >= 80) return { level: 'good', text: 'Good', color: 'text-blue-600' };
    if (percentage >= 70) return { level: 'fair', text: 'Fair', color: 'text-yellow-600' };
    if (percentage >= 60) return { level: 'needs-improvement', text: 'Needs Improvement', color: 'text-orange-600' };
    return { level: 'critical', text: 'Critical', color: 'text-red-600' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Results</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4">
                <button
                  onClick={loadScoringData}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const maturityLevel = scoringData?.calculated_level || assessment.current_maturity_level || 1;
  const levelInfo = getMaturityLevelInfo(maturityLevel);
  const scoreInterpretation = getScoreInterpretation(scoringData?.score_percentage || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{assessment.title}</h1>
            <p className="text-gray-600">
              Assessment Results • {assessment.assessment_number}
            </p>
            <p className="text-sm text-gray-500">
              Completed on {formatDate(assessment.updated_at)}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onViewRoadmap}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 inline-flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 0V7m0 2v10m0-10l-6-3" />
              </svg>
              View Roadmap
            </button>
            
            <button
              onClick={onStartNewAssessment}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              New Assessment
            </button>
          </div>
        </div>
      </div>

      {/* Key Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Overall Score */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overall Score</p>
              <p className="text-3xl font-bold text-gray-900">
                {scoringData?.score_percentage?.toFixed(1) || '0.0'}%
              </p>
              <p className={`text-sm ${scoreInterpretation.color}`}>
                {scoreInterpretation.text}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Maturity Level */}
        <div className={`rounded-lg shadow-lg p-6 ${levelInfo.bgColor} ${levelInfo.borderColor} border-2`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Maturity Level</p>
              <p className="text-3xl font-bold text-gray-900">Level {maturityLevel}</p>
              <p className={`text-sm ${levelInfo.textColor}`}>{levelInfo.name}</p>
            </div>
            <div className={`w-12 h-12 ${levelInfo.color} rounded-full flex items-center justify-center text-white font-bold text-lg`}>
              {maturityLevel}
            </div>
          </div>
        </div>

        {/* Confidence Level */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confidence</p>
              <p className="text-3xl font-bold text-gray-900">
                {scoringData?.level_confidence?.toFixed(1) || '0.0'}%
              </p>
              <p className="text-sm text-gray-500">Statistical confidence</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Data Quality */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Data Quality</p>
              <p className="text-3xl font-bold text-gray-900">
                {scoringData?.data_quality?.quality_score?.toFixed(1) || '0.0'}%
              </p>
              <p className="text-sm text-gray-500">Evidence completeness</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Maturity Level Description */}
      <div className={`rounded-lg p-6 mb-8 ${levelInfo.bgColor} ${levelInfo.borderColor} border-2`}>
        <div className="flex items-start space-x-4">
          <div className={`w-16 h-16 ${levelInfo.color} rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0`}>
            {maturityLevel}
          </div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Level {maturityLevel}: {levelInfo.name}
            </h3>
            <p className="text-gray-700 mb-4">{levelInfo.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Key Characteristics:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {maturityLevel === 1 && (
                    <>
                      <li>• Basic awareness of carbon management needs</li>
                      <li>• Limited formal processes or documentation</li>
                      <li>• Reactive approach to environmental requirements</li>
                    </>
                  )}
                  {maturityLevel === 2 && (
                    <>
                      <li>• Formal carbon management policies established</li>
                      <li>• Basic data collection and reporting processes</li>
                      <li>• Management oversight and accountability</li>
                    </>
                  )}
                  {maturityLevel === 3 && (
                    <>
                      <li>• Standardized processes across organization</li>
                      <li>• Comprehensive GHG inventory and monitoring</li>
                      <li>• Regular internal and external reporting</li>
                    </>
                  )}
                  {maturityLevel === 4 && (
                    <>
                      <li>• Quantitative performance management</li>
                      <li>• Data-driven decision making processes</li>
                      <li>• Statistical process control and optimization</li>
                    </>
                  )}
                  {maturityLevel === 5 && (
                    <>
                      <li>• Continuous improvement culture</li>
                      <li>• Innovation in carbon management practices</li>
                      <li>• Industry leadership and best practices</li>
                    </>
                  )}
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Next Steps:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  {maturityLevel < 5 ? (
                    <>
                      <li>• Review improvement roadmap recommendations</li>
                      <li>• Focus on Level {maturityLevel + 1} requirements</li>
                      <li>• Implement priority improvement actions</li>
                    </>
                  ) : (
                    <>
                      <li>• Maintain continuous improvement practices</li>
                      <li>• Share best practices with industry peers</li>
                      <li>• Explore innovation opportunities</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          
          <button
            onClick={() => setActiveTab('detailed')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'detailed'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Detailed Analysis
          </button>
          
          <button
            onClick={() => setActiveTab('benchmark')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'benchmark'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Benchmarking
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-8">
        {activeTab === 'overview' && (
          <>
            {/* Maturity Radar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Maturity Profile
                </h3>
                {scoringData && (
                  <MaturityRadarChart 
                    data={{
                      labels: Object.keys(scoringData.category_scores || {}),
                      datasets: [{
                        label: 'Current Maturity',
                        data: Object.values(scoringData.category_scores || {}),
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 2
                      }]
                    }}
                    className="w-full h-80"
                  />
                )}
              </div>

              {/* Level Progress */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Level Progress
                </h3>
                
                <div className="space-y-4">
                  {scoringData?.level_scores && Object.entries(scoringData.level_scores).map(([levelKey, levelData]) => {
                    const level = parseInt(levelKey.split('_')[1]);
                    const levelInfo = getMaturityLevelInfo(level);
                    const percentage = (levelData.score / levelData.max_score) * 100;
                    
                    return (
                      <div key={levelKey} className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-6 h-6 ${levelInfo.color} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                              {level}
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              Level {level}: {levelInfo.name}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            {levelData.score.toFixed(1)} / {levelData.max_score.toFixed(1)}
                          </div>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              level <= maturityLevel ? levelInfo.color.replace('bg-', 'bg-') : 'bg-gray-400'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-1">
                          {percentage.toFixed(0)}% complete
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'detailed' && scoringData && (
          <ScoreBreakdown scoring={scoringData} />
        )}

        {activeTab === 'benchmark' && benchmarkData && (
          <BenchmarkChart 
            benchmarkData={benchmarkData}
            currentScore={scoringData?.score_percentage || 0}
            currentLevel={maturityLevel}
          />
        )}
      </div>

      {/* Action Cards */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-400">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 0V7m0 2v10m0-10l-6-3" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-900">
                Improvement Roadmap
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Get a detailed plan to advance to the next maturity level
              </p>
              <button
                onClick={onViewRoadmap}
                className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
              >
                View Roadmap
              </button>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-400">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-900">
                Generate Report
              </h3>
              <p className="text-sm text-green-700 mt-1">
                Create a comprehensive assessment report for stakeholders
              </p>
              <button className="mt-3 bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700">
                Generate Report
              </button>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-400">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-purple-900">
                Share Results
              </h3>
              <p className="text-sm text-purple-700 mt-1">
                Share your assessment results with team members
              </p>
              <button className="mt-3 bg-purple-600 text-white px-4 py-2 rounded-md text-sm hover:bg-purple-700">
                Share Assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreDashboard;