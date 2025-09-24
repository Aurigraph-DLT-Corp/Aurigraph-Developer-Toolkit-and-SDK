// ================================================================================
// AUREX LAUNCHPAD™ CARBON MATURITY NAVIGATOR SCORE BREAKDOWN
// Sub-Application #13: Detailed Score Analysis Component
// Module ID: LAU-MAT-013-FE-BREAKDOWN - Score Breakdown Component
// Created: August 7, 2025
// ================================================================================

import React, { useState } from 'react';
import { AssessmentScoring } from '../../types/carbonMaturityNavigator';

interface ScoreBreakdownProps {
  scoring: AssessmentScoring;
  className?: string;
}

const ScoreBreakdown: React.FC<ScoreBreakdownProps> = ({
  scoring,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'levels' | 'categories' | 'kpis' | 'quality'>('levels');

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getMaturityLevelInfo = (level: number) => {
    const levels = {
      1: { name: 'Initial', color: 'bg-red-500', description: 'Ad hoc processes with limited structure' },
      2: { name: 'Managed', color: 'bg-orange-500', description: 'Basic processes established and managed' },
      3: { name: 'Defined', color: 'bg-yellow-500', description: 'Standardized processes across organization' },
      4: { name: 'Quantitatively Managed', color: 'bg-blue-500', description: 'Data-driven process control and optimization' },
      5: { name: 'Optimizing', color: 'bg-green-500', description: 'Continuous improvement and innovation' }
    };
    return levels[level] || levels[1];
  };

  const renderLevelBreakdown = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Maturity Level Analysis</h3>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Detailed breakdown of your performance across all five Carbon Maturity Model levels. 
          Each level builds upon the previous one, representing increasingly sophisticated carbon management capabilities.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scoring.level_scores && Object.entries(scoring.level_scores).map(([levelKey, levelData]) => {
          const level = parseInt(levelKey.split('_')[1]);
          const levelInfo = getMaturityLevelInfo(level);
          const percentage = (levelData.score / levelData.max_score) * 100;
          const weightedPercentage = levelData.weighted_score ? (levelData.weighted_score / levelData.score) * percentage : percentage;

          return (
            <div key={levelKey} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-start space-x-4 mb-4">
                <div className={`w-12 h-12 ${levelInfo.color} rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                  {level}
                </div>
                
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Level {level}: {levelInfo.name}
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {levelInfo.description}
                  </p>
                  
                  <div className="space-y-3">
                    {/* Raw Score */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">Raw Score</span>
                        <span className={`text-sm font-semibold ${getScoreColor(percentage)}`}>
                          {levelData.score.toFixed(1)} / {levelData.max_score.toFixed(1)} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(percentage)}`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Weighted Score */}
                    {levelData.weighted_score && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">Weighted Score</span>
                          <span className={`text-sm font-semibold ${getScoreColor(weightedPercentage)}`}>
                            {levelData.weighted_score.toFixed(1)} ({weightedPercentage.toFixed(1)}%)
                          </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(weightedPercentage)}`}
                            style={{ width: `${Math.min(weightedPercentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Level Status */}
              <div className={`mt-4 p-3 rounded-lg ${
                level <= scoring.calculated_level 
                  ? 'bg-green-50 border-l-4 border-green-400'
                  : percentage >= 70
                  ? 'bg-yellow-50 border-l-4 border-yellow-400'
                  : 'bg-red-50 border-l-4 border-red-400'
              }`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {level <= scoring.calculated_level ? (
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : percentage >= 70 ? (
                      <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      level <= scoring.calculated_level 
                        ? 'text-green-800'
                        : percentage >= 70
                        ? 'text-yellow-800'
                        : 'text-red-800'
                    }`}>
                      {level <= scoring.calculated_level 
                        ? 'Level Achieved'
                        : percentage >= 70
                        ? 'Partially Achieved'
                        : 'Needs Improvement'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCategoryBreakdown = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Category Performance Analysis</h3>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Performance breakdown across key carbon management categories. 
          These categories represent the fundamental areas of organizational carbon capability.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scoring.category_scores && Object.entries(scoring.category_scores).map(([category, score]) => (
          <div key={category} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 capitalize">
                {category.replace('_', ' ')}
              </h4>
              <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                {score.toFixed(1)}%
              </span>
            </div>

            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(score)}`}
                  style={{ width: `${Math.min(score, 100)}%` }}
                />
              </div>
            </div>

            <div className="text-sm text-gray-600">
              {getCategoryDescription(category)}
            </div>

            <div className={`mt-4 p-3 rounded-lg ${
              score >= 80
                ? 'bg-green-50 text-green-700'
                : score >= 60
                ? 'bg-yellow-50 text-yellow-700'
                : 'bg-red-50 text-red-700'
            }`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {score >= 80 ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : score >= 60 ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium">
                    {score >= 80 ? 'Strong Performance' : score >= 60 ? 'Moderate Performance' : 'Improvement Needed'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderKPIBreakdown = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Detailed analysis of individual KPIs that contribute to your overall maturity score.
        </p>
      </div>

      {scoring.kpi_scores && Object.keys(scoring.kpi_scores).length > 0 ? (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h4 className="text-lg font-semibold text-gray-900">KPI Performance Summary</h4>
          </div>
          
          <div className="divide-y divide-gray-200">
            {Object.entries(scoring.kpi_scores).map(([kpi, score]) => (
              <div key={kpi} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900">
                      {formatKPIName(kpi)}
                    </h5>
                    <p className="text-xs text-gray-500 mt-1">
                      {getKPIDescription(kpi)}
                    </p>
                  </div>
                  
                  <div className="ml-4 flex items-center space-x-3">
                    <div className="text-right">
                      <span className={`text-lg font-semibold ${getScoreColor(typeof score === 'number' ? score : 0)}`}>
                        {typeof score === 'number' ? score.toFixed(1) : 'N/A'}%
                      </span>
                    </div>
                    
                    <div className="w-20">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(typeof score === 'number' ? score : 0)}`}
                          style={{ width: `${Math.min(typeof score === 'number' ? score : 0, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-lg">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-gray-500">No KPI data available</p>
        </div>
      )}
    </div>
  );

  const renderQualityAnalysis = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Quality Analysis</h3>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Assessment of data completeness, evidence quality, and overall reliability of your maturity evaluation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Completeness */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-4">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              scoring.data_quality.completeness >= 90 ? 'bg-green-100' :
              scoring.data_quality.completeness >= 70 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <svg className={`w-8 h-8 ${
                scoring.data_quality.completeness >= 90 ? 'text-green-600' :
                scoring.data_quality.completeness >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h4 className="text-lg font-semibold text-gray-900 mt-3">Data Completeness</h4>
            <p className={`text-3xl font-bold mt-2 ${getScoreColor(scoring.data_quality.completeness)}`}>
              {scoring.data_quality.completeness.toFixed(1)}%
            </p>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(scoring.data_quality.completeness)}`}
              style={{ width: `${Math.min(scoring.data_quality.completeness, 100)}%` }}
            />
          </div>
          
          <p className="text-sm text-gray-600 text-center">
            Percentage of required questions answered
          </p>
        </div>

        {/* Evidence Completeness */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-4">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              scoring.data_quality.evidence_completeness >= 90 ? 'bg-green-100' :
              scoring.data_quality.evidence_completeness >= 70 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <svg className={`w-8 h-8 ${
                scoring.data_quality.evidence_completeness >= 90 ? 'text-green-600' :
                scoring.data_quality.evidence_completeness >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            
            <h4 className="text-lg font-semibold text-gray-900 mt-3">Evidence Quality</h4>
            <p className={`text-3xl font-bold mt-2 ${getScoreColor(scoring.data_quality.evidence_completeness)}`}>
              {scoring.data_quality.evidence_completeness.toFixed(1)}%
            </p>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(scoring.data_quality.evidence_completeness)}`}
              style={{ width: `${Math.min(scoring.data_quality.evidence_completeness, 100)}%` }}
            />
          </div>
          
          <p className="text-sm text-gray-600 text-center">
            Quality and completeness of supporting evidence
          </p>
        </div>

        {/* Overall Quality */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-4">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${
              scoring.data_quality.quality_score >= 90 ? 'bg-green-100' :
              scoring.data_quality.quality_score >= 70 ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <svg className={`w-8 h-8 ${
                scoring.data_quality.quality_score >= 90 ? 'text-green-600' :
                scoring.data_quality.quality_score >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            
            <h4 className="text-lg font-semibold text-gray-900 mt-3">Overall Quality</h4>
            <p className={`text-3xl font-bold mt-2 ${getScoreColor(scoring.data_quality.quality_score)}`}>
              {scoring.data_quality.quality_score.toFixed(1)}%
            </p>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(scoring.data_quality.quality_score)}`}
              style={{ width: `${Math.min(scoring.data_quality.quality_score, 100)}%` }}
            />
          </div>
          
          <p className="text-sm text-gray-600 text-center">
            Overall assessment reliability and accuracy
          </p>
        </div>
      </div>

      {/* Quality Recommendations */}
      <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-400">
        <h4 className="text-lg font-semibold text-blue-900 mb-4">Data Quality Recommendations</h4>
        
        <div className="space-y-3">
          {scoring.data_quality.completeness < 90 && (
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <strong>Improve Data Completeness:</strong> Answer remaining questions to increase assessment accuracy.
                </p>
              </div>
            </div>
          )}
          
          {scoring.data_quality.evidence_completeness < 80 && (
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <strong>Upload Supporting Evidence:</strong> Provide documentation to strengthen your responses and increase credibility.
                </p>
              </div>
            </div>
          )}
          
          {scoring.data_quality.quality_score < 85 && (
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <strong>Review Response Quality:</strong> Consider revising responses with more detailed and accurate information.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const getCategoryDescription = (category: string): string => {
    const descriptions = {
      governance: 'Leadership, oversight, and strategic direction for carbon management initiatives.',
      strategy: 'Long-term planning, goal setting, and integration of carbon considerations into business strategy.',
      risk_management: 'Identification, assessment, and management of climate-related risks and opportunities.',
      metrics_targets: 'Measurement systems, KPI tracking, and target setting for carbon performance.',
      disclosure: 'External reporting, transparency, and stakeholder communication on carbon performance.',
      operations: 'Day-to-day management of carbon-related activities and operational efficiency.',
      innovation: 'Research, development, and implementation of new carbon management technologies and practices.'
    };
    return descriptions[category] || 'Performance in this carbon management category.';
  };

  const formatKPIName = (kpi: string): string => {
    return kpi.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getKPIDescription = (kpi: string): string => {
    // This would typically come from a KPI metadata service
    return 'Key performance indicator for carbon management maturity assessment.';
  };

  return (
    <div className={className}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('levels')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'levels'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Maturity Levels
          </button>
          
          <button
            onClick={() => setActiveTab('categories')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Categories
          </button>
          
          <button
            onClick={() => setActiveTab('kpis')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'kpis'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            KPIs
          </button>
          
          <button
            onClick={() => setActiveTab('quality')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'quality'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Data Quality
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'levels' && renderLevelBreakdown()}
      {activeTab === 'categories' && renderCategoryBreakdown()}
      {activeTab === 'kpis' && renderKPIBreakdown()}
      {activeTab === 'quality' && renderQualityAnalysis()}
    </div>
  );
};

export default ScoreBreakdown;