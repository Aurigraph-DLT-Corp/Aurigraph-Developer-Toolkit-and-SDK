import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Upload,
  FileText,
  BarChart3,
  Download,
  Eye,
  Calendar,
  Building,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Shield,
  Users,
  FileCheck,
  ArrowLeft,
  TrendingUp,
  XCircle,
  RefreshCw,
  FileX,
  Target,
  Layers,
  BookOpen
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';

// Interfaces
interface AnalysisReport {
  id: string;
  organizationName: string;
  reportYear: number;
  reportType: 'Annual' | 'BSBR';
  uploadTimestamp: string;
  uploaderName: string;
  analysisStatus: 'pending' | 'processing' | 'completed' | 'failed';
  confidenceScore?: number;
  gapsIdentified?: number;
  fileName: string;
  fileSize: number;
  analysisResults?: {
    scope1Coverage: boolean;
    scope2Coverage: boolean;
    scope3Coverage: boolean;
    methodologyAlignment: number;
    targetVsBaseline: boolean;
    disclosureCompleteness: number;
    mitigationPlans: boolean;
  };
}

interface GapCategory {
  category: string;
  count: number;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  reportId?: string;
  reportName?: string;
  analysisHash?: string;
}

const ReportAnalytics = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth();

  // State management
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadData, setUploadData] = useState({
    organizationName: '',
    reportYear: new Date().getFullYear(),
    reportType: 'Annual' as 'Annual' | 'BSBR'
  });

  // Filters and search
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [viewDetailsModal, setViewDetailsModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AnalysisReport | null>(null);

  // Mock data for demonstration
  const mockReports: AnalysisReport[] = [
    {
      id: '1',
      organizationName: 'Green Tech Industries',
      reportYear: 2023,
      reportType: 'Annual',
      uploadTimestamp: '2024-01-15T10:30:00Z',
      uploaderName: 'John Smith',
      analysisStatus: 'completed',
      confidenceScore: 87,
      gapsIdentified: 3,
      fileName: 'GreenTech_Annual_2023.pdf',
      fileSize: 2.5,
      analysisResults: {
        scope1Coverage: true,
        scope2Coverage: true,
        scope3Coverage: false,
        methodologyAlignment: 85,
        targetVsBaseline: true,
        disclosureCompleteness: 78,
        mitigationPlans: false
      }
    },
    {
      id: '2',
      organizationName: 'Sustainable Solutions Ltd',
      reportYear: 2023,
      reportType: 'BSBR',
      uploadTimestamp: '2024-01-10T14:20:00Z',
      uploaderName: 'Sarah Johnson',
      analysisStatus: 'completed',
      confidenceScore: 92,
      gapsIdentified: 1,
      fileName: 'SustainableSolutions_BSBR_2023.pdf',
      fileSize: 1.8,
      analysisResults: {
        scope1Coverage: true,
        scope2Coverage: true,
        scope3Coverage: true,
        methodologyAlignment: 95,
        targetVsBaseline: true,
        disclosureCompleteness: 88,
        mitigationPlans: true
      }
    },
    {
      id: '3',
      organizationName: 'EcoManufacturing Corp',
      reportYear: 2022,
      reportType: 'Annual',
      uploadTimestamp: '2024-01-08T09:15:00Z',
      uploaderName: 'Mike Chen',
      analysisStatus: 'processing',
      fileName: 'EcoManufacturing_Annual_2022.pdf',
      fileSize: 3.2
    }
  ];

  const mockGapCategories: GapCategory[] = [
    { category: 'Scope 3 Coverage', count: 8, severity: 'high', description: 'Missing or incomplete Scope 3 emissions reporting' },
    { category: 'Methodology Alignment', count: 5, severity: 'medium', description: 'Calculation methods not aligned with ISO 14064 standards' },
    { category: 'Target vs Baseline', count: 3, severity: 'medium', description: 'Unclear baseline establishment or target setting' },
    { category: 'Disclosure Completeness', count: 7, severity: 'high', description: 'Missing required disclosure elements' },
    { category: 'Mitigation Plans', count: 2, severity: 'low', description: 'Insufficient detail in emission reduction strategies' }
  ];

  const mockAuditLogs: AuditLogEntry[] = [
    {
      id: '1',
      timestamp: '2024-01-15T10:30:00Z',
      userId: 'user1',
      userName: 'John Smith',
      action: 'Report Analysis Completed',
      reportId: '1',
      reportName: 'GreenTech_Annual_2023.pdf',
      analysisHash: 'sha256:abc123...'
    },
    {
      id: '2',
      timestamp: '2024-01-10T14:20:00Z',
      userId: 'user2',
      userName: 'Sarah Johnson',
      action: 'Report Uploaded',
      reportId: '2',
      reportName: 'SustainableSolutions_BSBR_2023.pdf'
    }
  ];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }

    // Simulate loading data
    setTimeout(() => {
      setReports(mockReports);
      setAuditLogs(mockAuditLogs);
      setLoading(false);
    }, 1000);
  }, [isAuthenticated, isLoading, navigate]);

  // Helper functions
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatFileSize = (sizeInMB: number) => {
    return `${sizeInMB.toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files: File[]) => {
    if (files.length > 3) {
      setError('Maximum 3 files allowed');
      return;
    }

    const validFiles = files.filter(file => {
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      const validSize = file.size <= 50 * 1024 * 1024; // 50MB
      return validTypes.includes(file.type) && validSize;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were rejected. Please ensure files are PDF, DOCX, or XLSX and under 50MB.');
    } else {
      setError('');
    }

    setSelectedFiles(validFiles);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    if (!uploadData.organizationName.trim()) {
      setError('Please enter organization name');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            setSelectedFiles([]);
            setSuccess('Files uploaded successfully! Analysis will begin shortly.');

            // Add new reports to the list
            const newReports = selectedFiles.map((file, index) => ({
              id: Date.now().toString() + index,
              organizationName: uploadData.organizationName,
              reportYear: uploadData.reportYear,
              reportType: uploadData.reportType,
              uploadTimestamp: new Date().toISOString(),
              uploaderName: `${user?.firstName} ${user?.lastName}`,
              analysisStatus: 'pending' as const,
              fileName: file.name,
              fileSize: file.size / (1024 * 1024)
            }));

            setReports(prev => [...newReports, ...prev]);

            // Clear success message after 5 seconds
            setTimeout(() => setSuccess(''), 5000);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

    } catch (error) {
      setError('Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();

    if (selectedFiles.length === 0 || !uploadData.organization.trim()) {
      setError('Please select files and enter organization name');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    for (const fileObj of selectedFiles) {
      if (fileObj.status !== 'pending') continue;

      try {
        // Update file status
        setSelectedFiles(prev => prev.map(f =>
          f.id === fileObj.id ? { ...f, status: 'uploading', progress: 0 } : f
        ));

        const formData = new FormData();
        formData.append('file', fileObj.file);
        formData.append('organization', uploadData.organization);
        formData.append('report_year', uploadData.report_year.toString());
        formData.append('report_type', uploadData.report_type);

        const response = await fetch('/api/ghg/reports/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          // Update file status to completed
          setSelectedFiles(prev => prev.map(f =>
            f.id === fileObj.id ? { ...f, status: 'completed', progress: 100 } : f
          ));
        } else {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Upload failed');
        }
      } catch (error) {
        console.error('Upload error:', error);
        setSelectedFiles(prev => prev.map(f =>
          f.id === fileObj.id ? { ...f, status: 'error', error: error.message } : f
        ));
      }
    }

    // Check if all uploads completed successfully
    const completedFiles = selectedFiles.filter(f => f.status === 'completed').length;
    if (completedFiles > 0) {
      setSuccess(`${completedFiles} file(s) uploaded successfully!`);
      setSelectedFiles([]);
      setUploadData({
        organization: '',
        report_year: new Date().getFullYear(),
        report_type: 'annual'
      });
      loadData(); // Reload data
    }

    setUploading(false);
  };

  const startAnalysis = async (reportId) => {
    try {
      const response = await fetch(`/api/ghg/reports/${reportId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          analysis_type: 'iso_14064_compliance',
          include_recommendations: true
        })
      });

      if (response.ok) {
        setSuccess('Analysis started successfully!');
        loadData(); // Reload to update status
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to start analysis');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError('Failed to start analysis');
    }
  };

  const deleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/ghg/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setSuccess('Report deleted successfully!');
        loadData(); // Reload data
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Failed to delete report');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Failed to delete report');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'analyzed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  // View details modal handler
  const handleViewDetails = (report: AnalysisReport) => {
    setSelectedReport(report);
    setViewDetailsModal(true);
  };

  // Download functionality
  const handleDownloadReport = async (report: AnalysisReport) => {
    try {
      setSuccess('Starting download...');
      
      // In a real implementation, this would call your API
      // For now, we'll simulate the download
      if (report.analysisStatus === 'completed' && report.analysisResults) {
        // Create downloadable content
        const reportData = {
          reportInfo: {
            id: report.id,
            organizationName: report.organizationName,
            reportYear: report.reportYear,
            reportType: report.reportType,
            fileName: report.fileName,
            uploadDate: report.uploadTimestamp,
            uploaderName: report.uploaderName,
            confidenceScore: report.confidenceScore,
            gapsIdentified: report.gapsIdentified
          },
          analysisResults: report.analysisResults,
          generatedOn: new Date().toISOString(),
          version: "1.0"
        };

        // Create blob and download
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${report.organizationName}_${report.reportType}_${report.reportYear}_Analysis.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        setSuccess('Report downloaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Report analysis not yet completed. Please wait for analysis to finish.');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download report. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };



  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading GHG Reporting Analytics...</p>
        </div>
      </div>
    );
  }

  // Show authentication required
  if (!user || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access GHG Report Analytics</p>
          <Button asChild>
            <Link to="/signin">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Navigation Header */}
      <nav className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" asChild>
              <Link to="/launchpad">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Launchpad
              </Link>
            </Button>
            <div className="flex items-center gap-2 font-bold text-xl text-green-600">
              <BarChart3 className="h-8 w-8" />
              GHG Report Analytics
            </div>
            <div className="w-32"></div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">GHG Report Analytics</h1>
          <p className="text-gray-600">Upload and analyze your GHG reports for ISO 14064 compliance</p>

          {/* Alert Messages */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <button
                  onClick={() => setError('')}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
                <button
                  onClick={() => setSuccess('')}
                  className="ml-auto text-green-400 hover:text-green-600"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Reports</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_reports}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed Analyses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed_analyses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Analyses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pending_analyses}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Compliance</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.average_compliance_score}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Report
                </CardTitle>
                <CardDescription>
                  Upload your GHG report for analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization *
                    </label>
                    <input
                      type="text"
                      value={uploadData.organization}
                      onChange={(e) => setUploadData({...uploadData, organization: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter organization name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Year *
                    </label>
                    <select
                      value={uploadData.report_year}
                      onChange={(e) => setUploadData({...uploadData, report_year: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Type *
                    </label>
                    <select
                      value={uploadData.report_type}
                      onChange={(e) => setUploadData({...uploadData, report_type: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="annual">Annual Report</option>
                      <option value="sustainability">Sustainability Report</option>
                      <option value="carbon_footprint">Carbon Footprint Report</option>
                    </select>
                  </div>

                  {/* Drag and Drop File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Files * (Max 3 files)
                    </label>

                    {/* Drop Zone */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        dragActive
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-400'
                      }`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('file-input').click()}
                    >
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {dragActive ? 'Drop files here...' : 'Drag & drop files here, or click to select'}
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, DOCX, XLSX files up to 50MB each
                      </p>
                    </div>

                    <input
                      id="file-input"
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      accept=".pdf,.docx,.xlsx"
                      className="hidden"
                    />

                    {/* Selected Files List */}
                    {selectedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          Selected Files ({selectedFiles.length}/3)
                        </p>
                        {selectedFiles.map((fileObj) => (
                          <div
                            key={fileObj.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                          >
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(fileObj.status)}
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {fileObj.file.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(fileObj.file.size / (1024 * 1024)).toFixed(2)} MB
                                </p>
                                {fileObj.error && (
                                  <p className="text-xs text-red-500">{fileObj.error}</p>
                                )}
                              </div>
                            </div>

                            {fileObj.status === 'pending' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFile(fileObj.id);
                                }}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                      disabled={uploading || selectedFiles.length === 0 || !uploadData.organization.trim()}
                    >
                      {uploading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={loadData}
                      disabled={loading}
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Reports List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>
                  Your uploaded GHG reports and analysis status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No reports uploaded yet</p>
                    <p className="text-sm text-gray-400">Upload your first GHG report to get started</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Report
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Organization
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Year
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reports.map((report) => (
                          <tr key={report.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {getStatusIcon(report.status)}
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">{report.filename}</p>
                                  <p className="text-sm text-gray-500">{report.file_size_mb} MB</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {report.organization}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {report.report_year}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={getStatusBadge(report.status)}>
                                {report.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => startAnalysis(report.id)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Start Analysis"
                                  disabled={report.status === 'processing'}
                                >
                                  <Play className="h-4 w-4" />
                                </button>
                                <button
                                  className="text-blue-600 hover:text-blue-900"
                                  title="View Details"
                                  onClick={() => handleViewDetails(report)}
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  className="text-gray-600 hover:text-gray-900"
                                  title="Download Report"
                                  onClick={() => handleDownloadReport(report)}
                                  disabled={report.analysisStatus !== 'completed'}
                                >
                                  <Download className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteReport(report.id)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Delete Report"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* View Details Modal */}
      {viewDetailsModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                Report Analysis Details
              </h3>
              <button
                onClick={() => setViewDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Report Information */}
              <div className="mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5 text-green-600" />
                  Report Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-600">Organization</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedReport.organizationName}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-600">Report Year</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedReport.reportYear}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-600">Report Type</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedReport.reportType}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-600">File Name</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedReport.fileName}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-600">File Size</label>
                    <p className="text-lg font-semibold text-gray-900">{formatFileSize(selectedReport.fileSize)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-600">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedReport.analysisStatus)}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-600">Uploaded By</label>
                    <p className="text-lg font-semibold text-gray-900">{selectedReport.uploaderName}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <label className="block text-sm font-medium text-gray-600">Upload Date</label>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(selectedReport.uploadTimestamp)}</p>
                  </div>
                  {selectedReport.confidenceScore && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="block text-sm font-medium text-gray-600">Confidence Score</label>
                      <p className="text-lg font-semibold text-green-600">{selectedReport.confidenceScore}%</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Analysis Results */}
              {selectedReport.analysisResults && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Analysis Results
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Emissions Coverage */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h5 className="font-semibold text-gray-900 mb-4">Emissions Scope Coverage</h5>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span>Scope 1 (Direct)</span>
                          <div className="flex items-center gap-2">
                            {selectedReport.analysisResults.scope1Coverage ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span className={selectedReport.analysisResults.scope1Coverage ? 'text-green-600' : 'text-red-600'}>
                              {selectedReport.analysisResults.scope1Coverage ? 'Covered' : 'Missing'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Scope 2 (Indirect)</span>
                          <div className="flex items-center gap-2">
                            {selectedReport.analysisResults.scope2Coverage ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span className={selectedReport.analysisResults.scope2Coverage ? 'text-green-600' : 'text-red-600'}>
                              {selectedReport.analysisResults.scope2Coverage ? 'Covered' : 'Missing'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Scope 3 (Value Chain)</span>
                          <div className="flex items-center gap-2">
                            {selectedReport.analysisResults.scope3Coverage ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span className={selectedReport.analysisResults.scope3Coverage ? 'text-green-600' : 'text-red-600'}>
                              {selectedReport.analysisResults.scope3Coverage ? 'Covered' : 'Missing'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Compliance Metrics */}
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h5 className="font-semibold text-gray-900 mb-4">Compliance Metrics</h5>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Methodology Alignment</span>
                            <span className="text-sm font-bold text-blue-600">
                              {selectedReport.analysisResults.methodologyAlignment}%
                            </span>
                          </div>
                          <Progress value={selectedReport.analysisResults.methodologyAlignment} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Disclosure Completeness</span>
                            <span className="text-sm font-bold text-green-600">
                              {selectedReport.analysisResults.disclosureCompleteness}%
                            </span>
                          </div>
                          <Progress value={selectedReport.analysisResults.disclosureCompleteness} className="h-2" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Target vs Baseline</span>
                          <div className="flex items-center gap-2">
                            {selectedReport.analysisResults.targetVsBaseline ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span className={selectedReport.analysisResults.targetVsBaseline ? 'text-green-600' : 'text-red-600'}>
                              {selectedReport.analysisResults.targetVsBaseline ? 'Defined' : 'Missing'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Mitigation Plans</span>
                          <div className="flex items-center gap-2">
                            {selectedReport.analysisResults.mitigationPlans ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <span className={selectedReport.analysisResults.mitigationPlans ? 'text-green-600' : 'text-red-600'}>
                              {selectedReport.analysisResults.mitigationPlans ? 'Present' : 'Missing'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gap Analysis Summary */}
              {selectedReport.gapsIdentified && selectedReport.gapsIdentified > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Gap Analysis Summary
                  </h4>
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-yellow-800">
                      <strong>{selectedReport.gapsIdentified} gaps identified</strong> in this report that require attention 
                      to achieve full ISO 14064 compliance. Common gaps include missing Scope 3 emissions, 
                      incomplete methodology documentation, and insufficient mitigation planning.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Last updated: {formatDate(selectedReport.uploadTimestamp)}
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={() => handleDownloadReport(selectedReport)}
                  disabled={selectedReport.analysisStatus !== 'completed'}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download Analysis
                </Button>
                <Button 
                  onClick={() => setViewDetailsModal(false)}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <LaunchpadFooter />
    </div>
  );
};

export default ReportAnalytics;
