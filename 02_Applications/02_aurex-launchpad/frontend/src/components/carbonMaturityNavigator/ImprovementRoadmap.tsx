// ================================================================================
// AUREX LAUNCHPAD™ CARBON MATURITY NAVIGATOR IMPROVEMENT ROADMAP
// Sub-Application #13: Interactive Roadmap and Action Planning Interface
// Module ID: LAU-MAT-013-FE-ROADMAP - Improvement Roadmap Component
// Created: August 7, 2025
// ================================================================================

import React, { useState, useEffect } from 'react';
import { 
  Assessment, 
  ImprovementRoadmap as RoadmapType, 
  RecommendedAction,
  PriorityArea,
  ImplementationPhase,
  ROIProjection
} from '../../types/carbonMaturityNavigator';
import carbonMaturityNavigatorApi from '../../services/carbonMaturityNavigatorApi';
import LoadingSpinner from '../LoadingSpinner';

interface ImprovementRoadmapProps {
  assessment: Assessment;
  onBack: () => void;
}

const ImprovementRoadmap: React.FC<ImprovementRoadmapProps> = ({
  assessment,
  onBack
}) => {
  const [roadmap, setRoadmap] = useState<RoadmapType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'phases' | 'roi'>('overview');
  const [targetLevel, setTargetLevel] = useState<number>(
    Math.min((assessment.current_maturity_level || 1) + 1, 5)
  );

  useEffect(() => {
    loadRoadmap();
  }, [assessment.id, targetLevel]);

  const loadRoadmap = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to get existing roadmap first
      let roadmapData: RoadmapType;
      try {
        roadmapData = await carbonMaturityNavigatorApi.getAssessmentRoadmap(assessment.id);
      } catch {
        // If no existing roadmap, generate new one
        roadmapData = await carbonMaturityNavigatorApi.generateRoadmap(assessment.id, targetLevel);
      }

      setRoadmap(roadmapData);
    } catch (err: any) {
      console.error('Failed to load roadmap:', err);
      setError(err.message || 'Failed to load improvement roadmap');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateNewRoadmap = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const roadmapData = await carbonMaturityNavigatorApi.generateRoadmap(assessment.id, targetLevel);
      setRoadmap(roadmapData);
    } catch (err: any) {
      console.error('Failed to generate roadmap:', err);
      setError(err.message || 'Failed to generate roadmap');
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: number): string => {
    const colors = {
      1: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
      2: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
      3: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' }
    };
    return colors[priority] || colors[3];
  };

  const getEffortBadge = (effort: 'low' | 'medium' | 'high') => {
    const badges = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800', 
      high: 'bg-red-100 text-red-800'
    };
    return badges[effort];
  };

  const getImpactBadge = (impact: 'low' | 'medium' | 'high') => {
    const badges = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-purple-100 text-purple-800'
    };
    return badges[impact];
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDuration = (weeks: number): string => {
    if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''}`;
    if (weeks < 52) return `${Math.round(weeks / 4)} month${Math.round(weeks / 4) !== 1 ? 's' : ''}`;
    return `${Math.round(weeks / 52)} year${Math.round(weeks / 52) !== 1 ? 's' : ''}`;
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
              <h3 className="text-sm font-medium text-red-800">Error Loading Roadmap</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4 flex space-x-3">
                <button
                  onClick={loadRoadmap}
                  className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                >
                  Retry
                </button>
                <button
                  onClick={onBack}
                  className="bg-gray-100 px-3 py-2 rounded-md text-sm font-medium text-gray-800 hover:bg-gray-200"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 0V7m0 2v10m0-10l-6-3" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Roadmap Available</h3>
          <p className="text-gray-600 mb-6">Generate a customized improvement roadmap for your organization.</p>
          <button
            onClick={handleGenerateNewRoadmap}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Generate Roadmap
          </button>
        </div>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Roadmap Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Roadmap to Level {roadmap.target_level}
            </h3>
            <p className="text-gray-700 mb-4">
              Strategic improvement plan generated for {assessment.title}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Timeline</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {roadmap.estimated_timeline_months} months
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Priority Areas</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {roadmap.priority_areas.length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-600">Actions</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {roadmap.recommended_actions.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <button
              onClick={() => {
                setTargetLevel(targetLevel === 5 ? roadmap.target_level : targetLevel + 1);
              }}
              className="mb-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
            >
              Adjust Target
            </button>
            
            <div className="text-sm text-gray-600">
              Created: {new Date(roadmap.created_date).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      {/* Priority Areas */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Priority Improvement Areas</h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {roadmap.priority_areas.map((area: PriorityArea, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-lg font-medium text-gray-900 capitalize">
                    {area.category.replace('_', ' ')}
                  </h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    area.priority_rank === 1 ? 'bg-red-100 text-red-800' :
                    area.priority_rank === 2 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    Priority {area.priority_rank}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{area.gap_analysis}</p>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Current Score</span>
                      <span className="font-medium">{area.current_score.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${area.current_score}%` }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Target Score</span>
                      <span className="font-medium">{area.target_score.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${area.target_score}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <div className="text-xs">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${getEffortBadge(area.estimated_effort)}`}>
                        {area.estimated_effort} effort
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${getImpactBadge(area.business_impact)}`}>
                        {area.business_impact} impact
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {roadmap.implementation_phases.length}
          </div>
          <p className="text-sm text-gray-600">Implementation Phases</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {roadmap.recommended_actions.filter(a => a.priority_level === 1).length}
          </div>
          <p className="text-sm text-gray-600">High Priority Actions</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">
            {formatCurrency(roadmap.roi_projections.reduce((sum, proj) => sum + proj.initial_investment, 0))}
          </div>
          <p className="text-sm text-gray-600">Total Investment</p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">
            {Math.round(roadmap.roi_projections.reduce((sum, proj) => sum + proj.payback_period_months, 0) / roadmap.roi_projections.length)}
          </div>
          <p className="text-sm text-gray-600">Avg Payback (months)</p>
        </div>
      </div>
    </div>
  );

  const renderActions = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Recommended Actions</h3>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Prioritized action items to help you progress toward your target maturity level. 
          Actions are ranked by impact, effort, and strategic importance.
        </p>
      </div>

      <div className="space-y-4">
        {roadmap.recommended_actions
          .sort((a, b) => a.priority_level - b.priority_level)
          .map((action: RecommendedAction, index) => {
            const priorityColor = getPriorityColor(action.priority_level);
            
            return (
              <div key={action.id} className={`bg-white rounded-lg shadow-lg border-l-4 ${priorityColor.border}`}>
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${priorityColor.bg} ${priorityColor.text}`}>
                          Priority {action.priority_level}
                        </span>
                        <span className="text-sm text-gray-500">
                          {action.category.replace('_', ' ')}
                        </span>
                      </div>
                      
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {action.title}
                      </h4>
                      
                      <p className="text-gray-600 mb-4">
                        {action.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span className="text-sm text-gray-700">
                            {formatCurrency(action.estimated_cost)}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm text-gray-700">
                            {formatDuration(action.estimated_timeline_weeks)}
                          </span>
                        </div>
                        
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                          </svg>
                          <span className="text-sm text-gray-700">
                            +{action.expected_score_improvement.toFixed(1)} points
                          </span>
                        </div>
                      </div>
                      
                      {/* Resources Required */}
                      {action.required_resources.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Resources Required:</h5>
                          <div className="flex flex-wrap gap-2">
                            {action.required_resources.map((resource, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                {resource}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Success Metrics */}
                      {action.success_metrics.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Success Metrics:</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {action.success_metrics.map((metric, idx) => (
                              <li key={idx} className="flex items-center">
                                <svg className="w-3 h-3 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {metric}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div className="flex space-x-3">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        View Details
                      </button>
                      <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                        Mark as Planned
                      </button>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      Action {index + 1} of {roadmap.recommended_actions.length}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  const renderPhases = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Implementation Phases</h3>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Structured implementation timeline with key milestones, deliverables, and success criteria for each phase.
        </p>
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300"></div>
        
        <div className="space-y-8">
          {roadmap.implementation_phases.map((phase: ImplementationPhase, index) => (
            <div key={phase.phase_number} className="relative flex items-start">
              {/* Timeline Node */}
              <div className="relative z-10 flex items-center justify-center w-12 h-12 bg-blue-600 rounded-full text-white font-bold">
                {phase.phase_number}
              </div>
              
              <div className="ml-6 flex-1 bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">
                      Phase {phase.phase_number}: {phase.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Duration: {formatDuration(phase.duration_weeks)}
                    </p>
                  </div>
                  
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {formatDuration(phase.duration_weeks)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Key Milestones */}
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 mb-3">Key Milestones</h5>
                    <ul className="space-y-2">
                      {phase.key_milestones.map((milestone, idx) => (
                        <li key={idx} className="flex items-start">
                          <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm text-gray-700">{milestone}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Deliverables */}
                  <div>
                    <h5 className="text-sm font-semibold text-gray-900 mb-3">Key Deliverables</h5>
                    <ul className="space-y-2">
                      {phase.deliverables.map((deliverable, idx) => (
                        <li key={idx} className="flex items-start">
                          <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-700">{deliverable}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Success Criteria */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h5 className="text-sm font-semibold text-gray-900 mb-3">Success Criteria</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {phase.success_criteria.map((criteria, idx) => (
                      <div key={idx} className="flex items-center">
                        <svg className="w-4 h-4 text-purple-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="text-sm text-gray-700">{criteria}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Risks */}
                {phase.risks && phase.risks.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <h5 className="text-sm font-semibold text-yellow-800 mb-2">Potential Risks</h5>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {phase.risks.map((risk, idx) => (
                        <li key={idx}>• {risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderROI = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Return on Investment Analysis</h3>
        <p className="text-gray-600 max-w-3xl mx-auto">
          Financial analysis of your carbon maturity improvement investments, including cost-benefit projections and payback timelines.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {roadmap.roi_projections.map((projection: ROIProjection, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
              {projection.investment_area.replace('_', ' ')}
            </h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-gray-600">Initial Investment</p>
                  <p className="text-xl font-bold text-red-600">
                    {formatCurrency(projection.initial_investment)}
                  </p>
                </div>
                
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Annual Savings</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(projection.annual_savings)}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Payback Period</p>
                  <p className="text-xl font-bold text-blue-600">
                    {projection.payback_period_months} months
                  </p>
                </div>
                
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600">NPV (5 years)</p>
                  <p className={`text-xl font-bold ${projection.net_present_value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(projection.net_present_value)}
                  </p>
                </div>
              </div>
              
              {/* Risk Factors */}
              {projection.risk_factors && projection.risk_factors.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <h5 className="text-sm font-semibold text-yellow-800 mb-2">Risk Factors</h5>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {projection.risk_factors.map((risk, idx) => (
                      <li key={idx}>• {risk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Total ROI Summary */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Total Investment Summary</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Total Initial Investment</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(roadmap.roi_projections.reduce((sum, p) => sum + p.initial_investment, 0))}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Total Annual Savings</p>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(roadmap.roi_projections.reduce((sum, p) => sum + p.annual_savings, 0))}
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Average Payback</p>
            <p className="text-2xl font-bold text-blue-600">
              {Math.round(roadmap.roi_projections.reduce((sum, p) => sum + p.payback_period_months, 0) / roadmap.roi_projections.length)} months
            </p>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Total NPV</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(roadmap.roi_projections.reduce((sum, p) => sum + p.net_present_value, 0))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={onBack}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Results
            </button>
            
            <h1 className="text-3xl font-bold text-gray-900">Improvement Roadmap</h1>
            <p className="text-gray-600">
              Strategic plan to advance from Level {assessment.current_maturity_level || 1} to Level {roadmap.target_level}
            </p>
          </div>
          
          <div className="flex space-x-3">
            <div className="text-right">
              <label className="block text-sm text-gray-600 mb-1">Target Level</label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2"
              >
                {[2, 3, 4, 5].map(level => (
                  <option key={level} value={level}>Level {level}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={handleGenerateNewRoadmap}
              className="self-end px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Regenerate
            </button>
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
            onClick={() => setActiveTab('actions')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'actions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Action Items
          </button>
          
          <button
            onClick={() => setActiveTab('phases')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'phases'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Implementation Phases
          </button>
          
          <button
            onClick={() => setActiveTab('roi')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'roi'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            ROI Analysis
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'actions' && renderActions()}
      {activeTab === 'phases' && renderPhases()}
      {activeTab === 'roi' && renderROI()}
    </div>
  );
};

export default ImprovementRoadmap;