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

const GHGReportAnalytics = () => {
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
    // Handle authentication check
    const initializeData = async () => {
      try {
        if (!isLoading && !isAuthenticated) {
          navigate('/auth');
          return;
        }

        // Simulate loading data with error handling
        await new Promise(resolve => setTimeout(resolve, 1000));
        setReports(mockReports);
        setAuditLogs(mockAuditLogs);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing data:', error);
        setError('Failed to load application data');
        setLoading(false);
      }
    };

    initializeData();
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

  // Event handlers
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    handleFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
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
      console.error('Upload error:', error);
      setError('Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  // Action handlers
  const downloadReport = (reportId: string) => {
    setSuccess('Report download started...');
    setTimeout(() => setSuccess(''), 3000);
  };

  const viewReport = (reportId: string) => {
    setSuccess('Opening detailed report view...');
    setTimeout(() => setSuccess(''), 3000);
  };

  const retryAnalysis = (reportId: string) => {
    setSuccess('Retrying analysis...');
    setTimeout(() => setSuccess(''), 3000);
  };

  const exportAuditLogs = () => {
    const csvContent = "data:text/csv;charset=utf-8," +
      "Timestamp,User,Action,Report,Analysis Hash\n" +
      mockAuditLogs.map(log =>
        `${log.timestamp},${log.userName},${log.action},${log.reportName || ''},${log.analysisHash || ''}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "audit_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccess('Audit logs exported successfully');
    setTimeout(() => setSuccess(''), 3000);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/launchpad" className="text-green-600 hover:text-green-700 mr-4">
                <ArrowLeft className="h-5 w-5 inline mr-1" />
                Back to Launchpad
              </Link>
              <div className="flex items-center">
                <FileCheck className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">GHG Reporting Analytics</h1>
                  <p className="text-sm text-gray-600">ISO 14064 Compliance Analysis</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Shield className="h-3 w-3 mr-1" />
                DMRV Compliant
              </Badge>
              {user && (
                <div className="text-sm text-gray-600">
                  Welcome, {user.firstName} {user.lastName}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error and Success Messages */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload Reports
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Analysis History
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Audit Trail
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload GHG Reports
                </CardTitle>
                <CardDescription>
                  Upload up to 3 Annual/BSBR reports for ISO 14064 compliance analysis.
                  Supported formats: PDF, DOCX, XLSX (max 50MB each)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Organization Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Name *
                    </label>
                    <Input
                      value={uploadData.organizationName}
                      onChange={(e) => setUploadData(prev => ({ ...prev, organizationName: e.target.value }))}
                      placeholder="Enter organization name"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Year
                    </label>
                    <Select
                      value={uploadData.reportYear.toString()}
                      onValueChange={(value) => setUploadData(prev => ({ ...prev, reportYear: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Type
                    </label>
                    <Select
                      value={uploadData.reportType}
                      onValueChange={(value: 'Annual' | 'BSBR') => setUploadData(prev => ({ ...prev, reportType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Annual">Annual Report</SelectItem>
                        <SelectItem value="BSBR">BSBR Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-green-400 bg-green-50'
                      : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop files here or click to browse
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    PDF, DOCX, XLSX files up to 50MB each (max 3 files)
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.docx,.xlsx"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      Select Files
                    </label>
                  </Button>
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Selected Files:</h4>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium text-gray-900">{file.name}</p>
                            <p className="text-sm text-gray-600">{formatFileSize(file.size / (1024 * 1024))}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading files...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

                {/* Upload Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleUpload}
                    disabled={selectedFiles.length === 0 || !uploadData.organizationName.trim() || isUploading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Start Analysis
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports History Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Analysis History
                </CardTitle>
                <CardDescription>
                  View and manage all uploaded reports and their analysis results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  <Select value={filterYear} onValueChange={setFilterYear}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                      <SelectItem value="2022">2022</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Annual">Annual</SelectItem>
                      <SelectItem value="BSBR">BSBR</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reports Table */}
                <div className="space-y-4">
                  {reports.filter(report => {
                    const matchesYear = filterYear === 'all' || report.reportYear.toString() === filterYear;
                    const matchesType = filterType === 'all' || report.reportType === filterType;
                    const matchesStatus = filterStatus === 'all' || report.analysisStatus === filterStatus;
                    const matchesSearch = searchTerm === '' ||
                      report.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      report.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      report.uploaderName.toLowerCase().includes(searchTerm.toLowerCase());

                    return matchesYear && matchesType && matchesStatus && matchesSearch;
                  }).map((report) => (
                    <Card key={report.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg text-gray-900">
                                {report.organizationName}
                              </h3>
                              {getStatusBadge(report.analysisStatus)}
                              <Badge variant="outline">
                                {report.reportType} {report.reportYear}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                {report.fileName}
                              </div>
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4" />
                                {formatFileSize(report.fileSize)}
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {formatDate(report.uploadTimestamp)}
                              </div>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {report.uploaderName}
                              </div>
                            </div>

                            {/* Analysis Results */}
                            {report.analysisStatus === 'completed' && report.analysisResults && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                  <div className="text-2xl font-bold text-green-600">
                                    {report.confidenceScore}%
                                  </div>
                                  <div className="text-xs text-gray-600">Confidence</div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                  <div className="text-2xl font-bold text-orange-600">
                                    {report.gapsIdentified}
                                  </div>
                                  <div className="text-xs text-gray-600">Gaps Found</div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                  <div className="text-2xl font-bold text-blue-600">
                                    {report.analysisResults.methodologyAlignment}%
                                  </div>
                                  <div className="text-xs text-gray-600">Methodology</div>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                  <div className="text-2xl font-bold text-purple-600">
                                    {report.analysisResults.disclosureCompleteness}%
                                  </div>
                                  <div className="text-xs text-gray-600">Disclosure</div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 ml-4">
                            {report.analysisStatus === 'completed' && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => viewReport(report.id)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => downloadReport(report.id)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </>
                            )}
                            {report.analysisStatus === 'processing' && (
                              <div className="flex items-center gap-2 text-sm text-blue-600">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Processing...
                              </div>
                            )}
                            {report.analysisStatus === 'failed' && (
                              <Button size="sm" variant="outline" className="text-red-600" onClick={() => retryAnalysis(report.id)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Retry
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {reports.length === 0 && (
                  <div className="text-center py-12">
                    <FileX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
                    <p className="text-gray-600">Upload your first report to get started with analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Summary Stats */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Reports</p>
                      <p className="text-3xl font-bold text-gray-900">{reports.length}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Completed</p>
                      <p className="text-3xl font-bold text-green-600">
                        {reports.filter(r => r.analysisStatus === 'completed').length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Processing</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {reports.filter(r => r.analysisStatus === 'processing').length}
                      </p>
                    </div>
                    <RefreshCw className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Avg. Score</p>
                      <p className="text-3xl font-bold text-purple-600">
                        {Math.round(reports.filter(r => r.confidenceScore).reduce((acc, r) => acc + (r.confidenceScore || 0), 0) / reports.filter(r => r.confidenceScore).length) || 0}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gap Categories Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Gap Analysis Summary
                </CardTitle>
                <CardDescription>
                  Common compliance gaps identified across all analyzed reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockGapCategories.map((gap, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            gap.severity === 'high' ? 'bg-red-500' :
                            gap.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                          <span className="font-medium text-gray-900">{gap.category}</span>
                          <Badge className={getSeverityColor(gap.severity)}>
                            {gap.severity.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium text-gray-600">{gap.count} reports</span>
                      </div>
                      <p className="text-sm text-gray-600 ml-6">{gap.description}</p>
                      <div className="ml-6">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              gap.severity === 'high' ? 'bg-red-500' :
                              gap.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${(gap.count / reports.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Compliance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  ISO 14064 Compliance Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Layers className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-green-900">Scope Coverage</h4>
                    <p className="text-sm text-green-700 mt-2">
                      Scope 1, 2, and 3 emissions reporting completeness
                    </p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-blue-900">Methodology</h4>
                    <p className="text-sm text-blue-700 mt-2">
                      Alignment with ISO 14064 calculation methods
                    </p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <FileCheck className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-purple-900">Disclosure</h4>
                    <p className="text-sm text-purple-700 mt-2">
                      Required disclosure elements completeness
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Trail Tab */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Audit Trail
                    </CardTitle>
                    <CardDescription>
                      DMRV-compliant logging of all system activities and analysis operations
                    </CardDescription>
                  </div>
                  <Button onClick={exportAuditLogs} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockAuditLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{log.action}</h4>
                          <span className="text-sm text-gray-500">{formatDate(log.timestamp)}</span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>User:</strong> {log.userName} ({log.userId})</p>
                          {log.reportName && <p><strong>Report:</strong> {log.reportName}</p>}
                          {log.analysisHash && <p><strong>Analysis Hash:</strong> {log.analysisHash}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {mockAuditLogs.length === 0 && (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs</h3>
                    <p className="text-gray-600">System activities will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GHGReportAnalytics;