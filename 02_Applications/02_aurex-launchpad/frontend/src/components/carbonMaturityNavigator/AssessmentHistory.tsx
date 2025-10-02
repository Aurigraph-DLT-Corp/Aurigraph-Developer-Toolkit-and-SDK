// ================================================================================
// AUREX LAUNCHPAD™ CARBON MATURITY NAVIGATOR ASSESSMENT HISTORY
// Sub-Application #13: Assessment History and Management Interface
// Module ID: LAU-MAT-013-FE-HISTORY - Assessment History Component
// Created: August 7, 2025
// ================================================================================

import React, { useState, useEffect } from 'react';
import { 
  Assessment, 
  AssessmentStatus, 
  IndustryCategory,
  FilterOptions
} from '../../types/carbonMaturityNavigator';
import carbonMaturityNavigatorApi from '../../services/carbonMaturityNavigatorApi';

interface AssessmentHistoryProps {
  assessments: Assessment[];
  onViewAssessment: (assessment: Assessment) => void;
  onBack: () => void;
}

const AssessmentHistory: React.FC<AssessmentHistoryProps> = ({
  assessments: initialAssessments,
  onViewAssessment,
  onBack
}) => {
  const [assessments, setAssessments] = useState<Assessment[]>(initialAssessments);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>(initialAssessments);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'level' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    applyFiltersAndSearch();
  }, [assessments, filters, searchTerm, sortBy, sortOrder]);

  const applyFiltersAndSearch = () => {
    let filtered = [...assessments];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(assessment =>
        assessment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.assessment_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(assessment => assessment.status === filters.status);
    }

    // Apply level filter
    if (filters.level) {
      filtered = filtered.filter(assessment => assessment.current_maturity_level === filters.level);
    }

    // Apply industry filter
    if (filters.industry) {
      filtered = filtered.filter(assessment => 
        assessment.industry_customizations?.industry === filters.industry
      );
    }

    // Apply date range filter
    if (filters.dateRange) {
      filtered = filtered.filter(assessment => {
        const assessmentDate = new Date(assessment.created_at);
        return assessmentDate >= filters.dateRange!.start && assessmentDate <= filters.dateRange!.end;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'score':
          comparison = (a.score_percentage || 0) - (b.score_percentage || 0);
          break;
        case 'level':
          comparison = (a.current_maturity_level || 0) - (b.current_maturity_level || 0);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredAssessments(filtered);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setSortBy('date');
    setSortOrder('desc');
  };

  const getStatusColor = (status: AssessmentStatus) => {
    const colors = {
      [AssessmentStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [AssessmentStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
      [AssessmentStatus.SUBMITTED]: 'bg-yellow-100 text-yellow-800',
      [AssessmentStatus.UNDER_REVIEW]: 'bg-orange-100 text-orange-800',
      [AssessmentStatus.APPROVED]: 'bg-green-100 text-green-800',
      [AssessmentStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [AssessmentStatus.ARCHIVED]: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getMaturityLevelColor = (level?: number) => {
    if (!level) return 'bg-gray-500';
    const colors = {
      1: 'bg-red-500',
      2: 'bg-orange-500', 
      3: 'bg-yellow-500',
      4: 'bg-blue-500',
      5: 'bg-green-500'
    };
    return colors[level] || 'bg-gray-500';
  };

  const getMaturityLevelLabel = (level?: number) => {
    if (!level) return 'Not Set';
    const labels = {
      1: 'Initial',
      2: 'Managed',
      3: 'Defined', 
      4: 'Quantitatively Managed',
      5: 'Optimizing'
    };
    return labels[level] || 'Unknown';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const exportToCSV = () => {
    const headers = ['Title', 'Assessment Number', 'Status', 'Maturity Level', 'Score', 'Created Date', 'Updated Date'];
    const csvContent = [
      headers.join(','),
      ...filteredAssessments.map(assessment => [
        `"${assessment.title}"`,
        assessment.assessment_number,
        assessment.status,
        assessment.current_maturity_level || 'N/A',
        assessment.score_percentage?.toFixed(1) || 'N/A',
        formatDate(assessment.created_at),
        formatDate(assessment.updated_at)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assessment_history.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredAssessments.map((assessment) => (
        <div
          key={assessment.id}
          onClick={() => onViewAssessment(assessment)}
          className="bg-white rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
              {assessment.status.replace('_', ' ').toLowerCase()}
            </span>
            
            {assessment.current_maturity_level && (
              <div className={`w-8 h-8 ${getMaturityLevelColor(assessment.current_maturity_level)} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                {assessment.current_maturity_level}
              </div>
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
            {assessment.title}
          </h3>
          
          <p className="text-sm text-gray-600 mb-3">
            {assessment.assessment_number}
          </p>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{assessment.progress_percentage?.toFixed(0) || 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${assessment.progress_percentage || 0}%` }}
              />
            </div>
          </div>

          <div className="text-xs text-gray-500">
            <p>Created: {formatDate(assessment.created_at)}</p>
            {assessment.score_percentage && (
              <p>Score: {assessment.score_percentage.toFixed(1)}%</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  if (sortBy === 'title') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('title');
                    setSortOrder('asc');
                  }
                }}
              >
                Title
                {sortBy === 'title' && (
                  <span className="ml-1">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assessment #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  if (sortBy === 'level') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('level');
                    setSortOrder('desc');
                  }
                }}
              >
                Level
                {sortBy === 'level' && (
                  <span className="ml-1">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  if (sortBy === 'score') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('score');
                    setSortOrder('desc');
                  }
                }}
              >
                Score
                {sortBy === 'score' && (
                  <span className="ml-1">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => {
                  if (sortBy === 'date') {
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  } else {
                    setSortBy('date');
                    setSortOrder('desc');
                  }
                }}
              >
                Created
                {sortBy === 'date' && (
                  <span className="ml-1">
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAssessments.map((assessment) => (
              <tr key={assessment.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onViewAssessment(assessment)}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                    {assessment.title}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {assessment.assessment_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assessment.status)}`}>
                    {assessment.status.replace('_', ' ').toLowerCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {assessment.current_maturity_level ? (
                    <div className="flex items-center">
                      <div className={`w-6 h-6 ${getMaturityLevelColor(assessment.current_maturity_level)} rounded-full flex items-center justify-center text-white font-bold text-xs mr-2`}>
                        {assessment.current_maturity_level}
                      </div>
                      <span className="text-sm text-gray-600">
                        {getMaturityLevelLabel(assessment.current_maturity_level)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Not set</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {assessment.score_percentage ? `${assessment.score_percentage.toFixed(1)}%` : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${assessment.progress_percentage || 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      {assessment.progress_percentage?.toFixed(0) || 0}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(assessment.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewAssessment(assessment);
                    }}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
              Back to Dashboard
            </button>
            
            <h1 className="text-3xl font-bold text-gray-900">Assessment History</h1>
            <p className="text-gray-600">
              View and manage all your carbon maturity assessments
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-b border-r ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Grid
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assessments..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              status: e.target.value ? e.target.value as AssessmentStatus : undefined 
            }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {Object.values(AssessmentStatus).map((status) => (
              <option key={status} value={status}>
                {status.replace('_', ' ').toLowerCase()}
              </option>
            ))}
          </select>

          {/* Level Filter */}
          <select
            value={filters.level || ''}
            onChange={(e) => setFilters(prev => ({ 
              ...prev, 
              level: e.target.value ? parseInt(e.target.value) : undefined 
            }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Levels</option>
            {[1, 2, 3, 4, 5].map((level) => (
              <option key={level} value={level}>
                Level {level}
              </option>
            ))}
          </select>

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Clear Filters
          </button>
        </div>

        {/* Results Count */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredAssessments.length} of {assessments.length} assessments
          </span>
          
          {(searchTerm || filters.status || filters.level || filters.industry || filters.dateRange) && (
            <span>
              Filters active
            </span>
          )}
        </div>
      </div>

      {/* Assessment List/Grid */}
      {filteredAssessments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-lg">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Assessments Found</h3>
          <p className="text-gray-600">
            {searchTerm || filters.status || filters.level 
              ? 'Try adjusting your filters or search terms'
              : 'Start your first carbon maturity assessment to see it here'
            }
          </p>
        </div>
      ) : (
        viewMode === 'grid' ? renderGridView() : renderListView()
      )}
    </div>
  );
};

export default AssessmentHistory;