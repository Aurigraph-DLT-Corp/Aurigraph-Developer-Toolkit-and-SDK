import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Eye,
  Download,
  Share2,
  Clock,
  Zap,
  Target,
  Award,
  Users,
  Building,
  ArrowRight,
  X,
  RefreshCw,
  Brain,
  FileSearch,
  ArrowLeftRight,
  BookOpen,
  ShieldCheck
} from 'lucide-react';

interface DocumentInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  analysisResults?: AnalysisResults;
}

interface AnalysisResults {
  overallScore: number;
  frameworkAlignment: {
    gri: { score: number; gaps: string[]; strengths: string[] };
    sasb: { score: number; gaps: string[]; strengths: string[] };
    tcfd: { score: number; gaps: string[]; strengths: string[] };
    cdp: { score: number; gaps: string[]; strengths: string[] };
  };
  contentQuality: {
    completeness: number;
    accuracy: number;
    transparency: number;
    materiality: number;
  };
  recommendations: {
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    category: string;
    description: string;
    impact: string;
    effort: string;
  }[];
  benchmarkData: {
    industryAverage: number;
    topPerformers: number;
    yourRanking: string;
  };
  keyInsights: string[];
  missingElements: string[];
  improvementAreas: string[];
}

interface AnnualReportAnalyticsProps {
  onComplete: (results: AnalysisResults) => void;
  onClose: () => void;
  organizationId: string;
  remainingUploads?: number;
}

const supportedFrameworks = [
  { id: 'gri', name: 'GRI Standards', description: 'Global Reporting Initiative' },
  { id: 'sasb', name: 'SASB Standards', description: 'Sustainability Accounting Standards Board' },
  { id: 'tcfd', name: 'TCFD', description: 'Task Force on Climate-related Financial Disclosures' },
  { id: 'cdp', name: 'CDP', description: 'Climate Disclosure Project' },
  { id: 'eu-taxonomy', name: 'EU Taxonomy', description: 'European Sustainable Finance Framework' },
  { id: 'sfdr', name: 'SFDR', description: 'Sustainable Finance Disclosure Regulation' }
];

const AnnualReportAnalytics: React.FC<AnnualReportAnalyticsProps> = ({
  onComplete,
  onClose,
  organizationId,
  remainingUploads = 3
}) => {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [currentStep, setCurrentStep] = useState<'upload' | 'processing' | 'results'>('upload');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResults | null>(null);
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>(['gri', 'sasb', 'tcfd']);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileUpload(files);
  };

  const handleFileUpload = (files: File[]) => {
    const validFiles = files.filter(file => {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/html'];
      const validSize = file.size <= 50 * 1024 * 1024; // 50MB
      return validTypes.includes(file.type) && validSize;
    });

    if (validFiles.length === 0) {
      alert('Please upload valid PDF, Word, or HTML files under 50MB');
      return;
    }

    const newDocuments: DocumentInfo[] = validFiles.map(file => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      status: 'uploading'
    }));

    setDocuments(prev => [...prev, ...newDocuments]);

    // Simulate upload and processing
    newDocuments.forEach((doc, index) => {
      setTimeout(() => {
        setDocuments(prev => prev.map(d => 
          d.id === doc.id ? { ...d, status: 'processing' } : d
        ));

        // Simulate AI processing
        setTimeout(() => {
          const mockResults = generateMockAnalysisResults();
          setDocuments(prev => prev.map(d => 
            d.id === doc.id ? { ...d, status: 'completed', analysisResults: mockResults } : d
          ));

          // If all documents are processed, move to results
          const allCompleted = documents.every(d => d.status === 'completed');
          if (allCompleted && index === newDocuments.length - 1) {
            setAnalysisResults(mockResults);
            setCurrentStep('results');
          }
        }, 3000 + index * 1000);
      }, 1000 + index * 500);
    });

    setCurrentStep('processing');
  };

  const generateMockAnalysisResults = (): AnalysisResults => {
    return {
      overallScore: Math.floor(Math.random() * 30 + 60), // 60-90
      frameworkAlignment: {
        gri: {
          score: Math.floor(Math.random() * 20 + 70),
          gaps: [
            'Missing detailed water consumption data (GRI 303)',
            'Incomplete biodiversity impact assessment (GRI 304)',
            'Limited supplier assessment information (GRI 308/414)'
          ],
          strengths: [
            'Comprehensive governance structure disclosure',
            'Strong stakeholder engagement reporting',
            'Detailed energy consumption data'
          ]
        },
        sasb: {
          score: Math.floor(Math.random() * 25 + 65),
          gaps: [
            'Industry-specific metrics not fully covered',
            'Missing quantitative targets for key KPIs',
            'Limited forward-looking performance indicators'
          ],
          strengths: [
            'Good coverage of material topics',
            'Industry-relevant metrics included',
            'Clear performance trend reporting'
          ]
        },
        tcfd: {
          score: Math.floor(Math.random() * 30 + 55),
          gaps: [
            'Climate scenario analysis needs strengthening',
            'Physical risk assessment requires more detail',
            'Financial quantification of climate risks incomplete'
          ],
          strengths: [
            'Strong governance structure for climate issues',
            'Clear climate strategy articulation',
            'Good disclosure of transition risks'
          ]
        },
        cdp: {
          score: Math.floor(Math.random() * 25 + 65),
          gaps: [
            'Scope 3 emissions data incomplete',
            'Limited supplier climate engagement details',
            'Missing verification of emissions data'
          ],
          strengths: [
            'Comprehensive Scope 1 and 2 reporting',
            'Clear emission reduction targets',
            'Good renewable energy tracking'
          ]
        }
      },
      contentQuality: {
        completeness: Math.floor(Math.random() * 20 + 70),
        accuracy: Math.floor(Math.random() * 15 + 75),
        transparency: Math.floor(Math.random() * 25 + 65),
        materiality: Math.floor(Math.random() * 20 + 70)
      },
      recommendations: [
        {
          priority: 'High',
          category: 'Data Quality',
          description: 'Enhance Scope 3 emissions data collection and validation',
          impact: 'Significantly improves credibility and completeness',
          effort: 'Medium'
        },
        {
          priority: 'Medium',
          category: 'Climate Risk',
          description: 'Strengthen climate scenario analysis and physical risk assessment',
          impact: 'Better alignment with TCFD requirements',
          effort: 'High'
        },
        {
          priority: 'High',
          category: 'Transparency',
          description: 'Add third-party verification for key environmental data',
          impact: 'Increases stakeholder trust and data reliability',
          effort: 'Low'
        }
      ],
      benchmarkData: {
        industryAverage: 72,
        topPerformers: 89,
        yourRanking: 'Above Average'
      },
      keyInsights: [
        'Strong governance and strategy disclosure compared to industry peers',
        'Environmental data quality is good but could benefit from third-party verification',
        'Social impact metrics are well-covered but lack quantitative targets',
        'Climate risk disclosure needs enhancement to meet best practice standards'
      ],
      missingElements: [
        'Detailed water stewardship metrics and targets',
        'Comprehensive biodiversity impact assessment',
        'Supply chain sustainability risk evaluation',
        'Forward-looking climate scenario analysis'
      ],
      improvementAreas: [
        'Enhance quantitative target setting across all ESG dimensions',
        'Improve integration of ESG factors into business strategy',
        'Strengthen stakeholder engagement process documentation',
        'Expand third-party assurance scope'
      ]
    };
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getOverallGrade = (score: number) => {
    if (score >= 85) return { grade: 'A', color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (score >= 75) return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-50' };
    if (score >= 65) return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-50' };
    if (score >= 55) return { grade: 'D', color: 'text-orange-600', bg: 'bg-orange-50' };
    return { grade: 'F', color: 'text-red-600', bg: 'bg-red-50' };
  };

  const renderUploadStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Brain className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          AI-Powered Report Analysis
        </h3>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Upload your sustainability reports for comprehensive analysis against major ESG frameworks. 
          Our AI will identify gaps, strengths, and provide actionable recommendations.
        </p>
        <div className="flex justify-center items-center space-x-6 mt-4 text-sm text-gray-500">
          <div className="flex items-center">
            <FileText className="w-4 h-4 mr-1" />
            PDF, DOC, HTML
          </div>
          <div className="flex items-center">
            <Upload className="w-4 h-4 mr-1" />
            Up to 50MB
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            {remainingUploads} uploads remaining
          </div>
        </div>
      </div>

      {/* Framework Selection */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">
          Analysis Frameworks
        </h4>
        <p className="text-sm text-gray-600 mb-4">
          Select which frameworks to analyze your report against:
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {supportedFrameworks.map(framework => (
            <label
              key={framework.id}
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedFrameworks.includes(framework.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedFrameworks(prev => [...prev, framework.id]);
                  } else {
                    setSelectedFrameworks(prev => prev.filter(f => f !== framework.id));
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">{framework.name}</div>
                <div className="text-xs text-gray-500">{framework.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <div className="space-y-4">
          <Upload className="w-12 h-12 text-gray-400 mx-auto" />
          <div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop your sustainability reports here
            </p>
            <p className="text-gray-600 mb-4">
              or click to select files from your computer
            </p>
            <label className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors">
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.html"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-sm text-gray-500">
            Supports: Annual Reports, Sustainability Reports, ESG Reports, Climate Disclosures
          </p>
        </div>
      </div>

      {/* Uploaded Files */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-gray-900">Uploaded Documents</h4>
          {documents.map(doc => (
            <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">{doc.name}</div>
                  <div className="text-sm text-gray-500">{formatFileSize(doc.size)}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {doc.status === 'completed' && (
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                )}
                {doc.status === 'processing' && (
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                )}
                {doc.status === 'uploading' && (
                  <Clock className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderProcessingStep = () => (
    <div className="text-center space-y-8">
      <div className="flex justify-center">
        <div className="relative">
          <div className="w-32 h-32 border-4 border-blue-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-32 h-32 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="w-12 h-12 text-blue-600" />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          AI Analysis in Progress
        </h3>
        <p className="text-gray-600 max-w-2xl mx-auto mb-6">
          Our advanced AI is analyzing your sustainability report against {selectedFrameworks.length} ESG frameworks.
          This process typically takes 3-5 minutes depending on document complexity.
        </p>
        
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-emerald-600 mr-2" />
              <span className="text-sm font-medium">Document Upload</span>
            </div>
            <span className="text-sm text-emerald-600">Complete</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <RefreshCw className="w-5 h-5 text-blue-600 mr-2 animate-spin" />
              <span className="text-sm font-medium">Content Extraction</span>
            </div>
            <span className="text-sm text-blue-600">Processing...</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <FileSearch className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium">Framework Analysis</span>
            </div>
            <span className="text-sm text-gray-400">Pending</span>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <ArrowLeftRight className="w-5 h-5 text-gray-400 mr-2" />
              <span className="text-sm font-medium">Benchmarking</span>
            </div>
            <span className="text-sm text-gray-400">Pending</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderResultsStep = () => {
    if (!analysisResults) return null;

    const gradeInfo = getOverallGrade(analysisResults.overallScore);

    return (
      <div className="space-y-8">
        {/* Header with Overall Score */}
        <div className={`rounded-2xl p-8 border ${gradeInfo.bg} border-opacity-50`}>
          <div className="text-center">
            <div className="flex justify-center items-center space-x-4 mb-4">
              <div className={`w-20 h-20 rounded-full ${gradeInfo.bg} flex items-center justify-center border-2 border-current ${gradeInfo.color}`}>
                <span className={`text-3xl font-bold ${gradeInfo.color}`}>{gradeInfo.grade}</span>
              </div>
              <div>
                <div className={`text-4xl font-bold ${gradeInfo.color}`}>
                  {analysisResults.overallScore}%
                </div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Analysis Complete!
            </h3>
            <p className="text-gray-600">
              Your sustainability report has been analyzed against {selectedFrameworks.length} major ESG frameworks
            </p>
          </div>
        </div>

        {/* Framework Scores */}
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(analysisResults.frameworkAlignment).map(([framework, data]) => (
            <div key={framework} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  {framework.toUpperCase()} Standards
                </h4>
                <div className="text-2xl font-bold text-blue-600">
                  {data.score}%
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full"
                  style={{ width: `${data.score}%` }}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <h5 className="text-sm font-medium text-emerald-700 mb-1">
                    Strengths ({data.strengths.length})
                  </h5>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {data.strengths.slice(0, 2).map((strength, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className="w-3 h-3 text-emerald-500 mr-1 mt-0.5 flex-shrink-0" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-orange-700 mb-1">
                    Gaps ({data.gaps.length})
                  </h5>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {data.gaps.slice(0, 2).map((gap, idx) => (
                      <li key={idx} className="flex items-start">
                        <AlertTriangle className="w-3 h-3 text-orange-500 mr-1 mt-0.5 flex-shrink-0" />
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Quality Metrics */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">Content Quality Assessment</h4>
          <div className="grid md:grid-cols-4 gap-6">
            {Object.entries(analysisResults.contentQuality).map(([metric, score]) => (
              <div key={metric} className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">{score}%</div>
                <div className="text-sm text-gray-600 capitalize">{metric}</div>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                  <div 
                    className="bg-blue-500 h-1 rounded-full"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Recommendations */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-6">
            Key Recommendations ({analysisResults.recommendations.length})
          </h4>
          <div className="space-y-4">
            {analysisResults.recommendations.map((rec, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      rec.priority === 'High' ? 'bg-red-100 text-red-800' :
                      rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {rec.priority} Priority
                    </span>
                    <span className="text-sm font-medium text-gray-900">{rec.category}</span>
                  </div>
                  <div className="text-xs text-gray-500">{rec.effort} Effort</div>
                </div>
                <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                <p className="text-xs text-gray-600">
                  <strong>Impact:</strong> {rec.impact}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Benchmark Comparison */}
        <div className="bg-gradient-to-r from-blue-50 to-emerald-50 border border-blue-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Industry Benchmark</h4>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {analysisResults.benchmarkData.industryAverage}%
              </div>
              <div className="text-sm text-gray-600">Industry Average</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-600">
                {analysisResults.benchmarkData.topPerformers}%
              </div>
              <div className="text-sm text-gray-600">Top Performers</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {analysisResults.benchmarkData.yourRanking}
              </div>
              <div className="text-sm text-gray-600">Your Ranking</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 pt-4">
          <button
            onClick={() => onComplete(analysisResults)}
            className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Full Report
          </button>
          <button className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Share2 className="w-4 h-4 mr-2" />
            Share Results
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <FileSearch className="w-8 h-8 text-blue-600 mr-3" />
                Annual Report Analytics
              </h2>
              <p className="text-gray-600 mt-1">
                AI-Powered ESG Report Analysis • {currentStep === 'upload' ? 'Upload Documents' : 
                currentStep === 'processing' ? 'Processing...' : 'Analysis Results'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center space-x-4 mt-4">
            {[
              { step: 'upload', label: 'Upload', icon: Upload },
              { step: 'processing', label: 'Analysis', icon: Brain },
              { step: 'results', label: 'Results', icon: BarChart3 }
            ].map((item, index) => {
              const Icon = item.icon;
              const isActive = item.step === currentStep;
              const isCompleted = ['upload', 'processing'].includes(item.step) && currentStep === 'results';
              
              return (
                <div key={item.step} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                    isActive ? 'bg-blue-600 text-white' :
                    isCompleted ? 'bg-emerald-600 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`ml-2 text-sm font-medium ${
                    isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {item.label}
                  </span>
                  {index < 2 && (
                    <ArrowRight className="w-4 h-4 text-gray-400 mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(95vh-160px)] p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 'upload' && renderUploadStep()}
              {currentStep === 'processing' && renderProcessingStep()}
              {currentStep === 'results' && renderResultsStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AnnualReportAnalytics;