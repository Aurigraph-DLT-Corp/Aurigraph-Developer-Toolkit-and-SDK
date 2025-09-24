// ================================================================================
// AUREX LAUNCHPAD™ CARBON MATURITY NAVIGATOR PROGRESS TRACKER
// Sub-Application #13: Assessment Progress Visualization Component
// Module ID: LAU-MAT-013-FE-PROGRESS - Progress Tracker Component
// Created: August 7, 2025
// ================================================================================

import React from 'react';
import { AssessmentProgress, LevelProgress } from '../../types/carbonMaturityNavigator';

interface ProgressTrackerProps {
  progress: AssessmentProgress;
  showDetails?: boolean;
  className?: string;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  progress,
  showDetails = false,
  className = ''
}) => {
  const getMaturityLevelColor = (level: number): string => {
    const colors = {
      1: 'bg-red-500',
      2: 'bg-orange-500',
      3: 'bg-yellow-500', 
      4: 'bg-blue-500',
      5: 'bg-green-500'
    };
    return colors[level] || 'bg-gray-500';
  };

  const getMaturityLevelLabel = (level: number): string => {
    const labels = {
      1: 'Initial',
      2: 'Managed', 
      3: 'Defined',
      4: 'Quantitatively Managed',
      5: 'Optimizing'
    };
    return labels[level] || 'Unknown';
  };

  const getProgressBarColor = (percentage: number): string => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Assessment Progress</h3>
            <p className="text-sm text-gray-600">
              Last updated: {formatDate(progress.last_updated)}
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {progress.progress_percentage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">Complete</div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Overall Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm text-gray-500">
              {progress.completed_questions} / {progress.total_questions} questions
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressBarColor(progress.progress_percentage)}`}
              style={{ width: `${Math.min(progress.progress_percentage, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Current Level Focus */}
        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full ${getMaturityLevelColor(progress.current_level_focus)} flex items-center justify-center text-white font-bold text-sm`}>
              {progress.current_level_focus}
            </div>
            
            <div className="ml-3">
              <h4 className="text-sm font-semibold text-gray-900">
                Currently Working On: Level {progress.current_level_focus}
              </h4>
              <p className="text-sm text-gray-600">
                {getMaturityLevelLabel(progress.current_level_focus)} - Focus on this level's requirements
              </p>
            </div>
          </div>
        </div>

        {/* Maturity Level Progress */}
        {showDetails && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Maturity Level Progress</h4>
            
            <div className="space-y-4">
              {progress.level_progress.map((levelProgress: LevelProgress) => (
                <div key={levelProgress.level} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${getMaturityLevelColor(levelProgress.level)}`}>
                        {levelProgress.level}
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          Level {levelProgress.level}: {getMaturityLevelLabel(levelProgress.level)}
                        </span>
                        
                        {levelProgress.is_complete && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Complete
                          </span>
                        )}
                        
                        {progress.current_level_focus === levelProgress.level && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <svg className="w-3 h-3 mr-1 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-sm text-gray-900 font-medium">
                        {levelProgress.completed_questions} / {levelProgress.total_questions}
                      </span>
                      <div className="text-xs text-gray-500">
                        {((levelProgress.completed_questions / levelProgress.total_questions) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Level Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 ml-9">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        levelProgress.is_complete 
                          ? 'bg-green-500' 
                          : progress.current_level_focus === levelProgress.level
                          ? 'bg-blue-500'
                          : 'bg-gray-400'
                      }`}
                      style={{ 
                        width: `${(levelProgress.completed_questions / levelProgress.total_questions) * 100}%` 
                      }}
                    />
                  </div>
                  
                  {/* Score Display */}
                  {levelProgress.score > 0 && (
                    <div className="ml-9 mt-2 text-xs text-gray-600">
                      Current Score: {levelProgress.score.toFixed(1)}
                    </div>
                  )}

                  {/* Unlock Date */}
                  {levelProgress.unlock_date && !levelProgress.is_complete && (
                    <div className="ml-9 mt-1 text-xs text-gray-500">
                      Available from: {new Date(levelProgress.unlock_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {progress.completed_questions}
            </div>
            <div className="text-sm text-gray-600">Questions Completed</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {progress.evidence_items}
            </div>
            <div className="text-sm text-gray-600">Evidence Files</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {progress.current_level_focus}
            </div>
            <div className="text-sm text-gray-600">Current Level</div>
          </div>
        </div>

        {/* Quick Actions */}
        {showDetails && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
            <button className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Details
            </button>
            
            <button className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Progress
            </button>
            
            <button className="inline-flex items-center px-3 py-2 rounded-md text-sm font-medium bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Share Progress
            </button>
          </div>
        )}

        {/* Progress Indicators Legend */}
        {showDetails && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="text-sm font-semibold text-gray-700 mb-3">Legend</h5>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Level 5: Optimizing</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Level 4: Quantitatively Managed</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">Level 3: Defined</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-gray-600">Level 2: Managed</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">Level 1: Initial</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-gray-600">Not Started</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressTracker;