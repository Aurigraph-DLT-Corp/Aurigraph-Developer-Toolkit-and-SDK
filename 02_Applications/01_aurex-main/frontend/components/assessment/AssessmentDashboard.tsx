import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Leaf,
  User,
  LogOut,
  FileText,
  BarChart3,
  Clock,
  Download,
  Plus,
  Eye,
  CreditCard,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAssessmentAuth } from '../../contexts/AssessmentAuthContext';
import AssessmentForm from './AssessmentForm';
import ReportViewer from './ReportViewer';

interface AssessmentReport {
  id: string;
  title: string;
  score: number;
  status: 'completed' | 'in_progress' | 'draft';
  createdAt: string;
  completedAt?: string;
  reportType: 'basic' | 'detailed';
  isPaid: boolean;
}

const AssessmentDashboard = () => {
  const { user, logout } = useAssessmentAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'assessment' | 'report'>('dashboard');
  const [reports, setReports] = useState<AssessmentReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<AssessmentReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState<number | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('aurex_auth_token') || localStorage.getItem('assessment_auth_token');

      // Get API base URL
      const apiBaseUrl = window.location.hostname === 'dev.aurigraph.io'
        ? 'https://dev.aurigraph.io/api'
        : 'http://localhost:8000/api';

      const response = await fetch(`${apiBaseUrl}/assessments/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || data || []);
      } else {
        console.log('No reports found or endpoint not available');
        setReports([]);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      setReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const generateDetailedReport = async (assessmentId: number) => {
    setIsGeneratingReport(assessmentId);

    try {
      const token = localStorage.getItem('aurex_auth_token') || localStorage.getItem('assessment_auth_token');

      // Get API base URL
      const apiBaseUrl = window.location.hostname === 'dev.aurigraph.io'
        ? 'https://dev.aurigraph.io/api'
        : 'http://localhost:8000/api';

      const response = await fetch(`${apiBaseUrl}/assessments/${assessmentId}/generate-report`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assessment_id: assessmentId,
          report_type: 'detailed',
          include_charts: true,
          include_recommendations: true
        })
      });

      if (response.ok) {
        // Get the PDF blob
        const blob = await response.blob();

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `GHG_Assessment_Report_${assessmentId}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        alert('✅ Detailed AI-powered report generated and downloaded successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      alert(`❌ Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingReport(null);
    }
  };

  const previewReport = async (assessmentId: number) => {
    try {
      const token = localStorage.getItem('aurex_auth_token') || localStorage.getItem('assessment_auth_token');

      // Get API base URL
      const apiBaseUrl = window.location.hostname === 'dev.aurigraph.io'
        ? 'https://dev.aurigraph.io/api'
        : 'http://localhost:8000/api';

      const response = await fetch(`${apiBaseUrl}/assessments/${assessmentId}/report-preview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const previewData = await response.json();
        console.log('Report preview:', previewData);

        // Show preview in a modal or new window
        const previewWindow = window.open('', '_blank', 'width=800,height=600');
        if (previewWindow) {
          previewWindow.document.write(`
            <html>
              <head>
                <title>Assessment Report Preview</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  .header { background: #1976D2; color: white; padding: 20px; margin: -20px -20px 20px -20px; }
                  .section { margin: 20px 0; }
                  .score { font-size: 24px; font-weight: bold; color: #1976D2; }
                  .recommendation { background: #f5f5f5; padding: 10px; margin: 5px 0; border-left: 4px solid #1976D2; }
                </style>
              </head>
              <body>
                <div class="header">
                  <h1>GHG Assessment Report Preview</h1>
                  <p>Generated by AI for: ${previewData.user.name}</p>
                </div>

                <div class="section">
                  <h2>Overall Score</h2>
                  <div class="score">${previewData.assessment.score}%</div>
                </div>

                <div class="section">
                  <h2>Executive Summary</h2>
                  <p>${previewData.ai_insights.executive_summary}</p>
                </div>

                <div class="section">
                  <h2>Key Recommendations</h2>
                  ${Array.isArray(previewData.ai_insights.recommendations)
                    ? previewData.ai_insights.recommendations.map((rec, i) =>
                        `<div class="recommendation">${i + 1}. ${rec}</div>`
                      ).join('')
                    : `<div class="recommendation">${previewData.ai_insights.recommendations}</div>`
                  }
                </div>

                <div class="section">
                  <p><em>This is a preview. Download the full PDF report for complete analysis, charts, and detailed recommendations.</em></p>
                </div>
              </body>
            </html>
          `);
        }
      } else {
        throw new Error('Failed to generate preview');
      }
    } catch (error) {
      console.error('Preview error:', error);
      alert(`❌ Failed to generate preview: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const handleViewReport = (report: AssessmentReport) => {
    setSelectedReport(report);
    setCurrentView('report');
  };

  if (currentView === 'assessment') {
    return (
      <AssessmentForm
        onComplete={() => {
          setCurrentView('dashboard');
          fetchReports();
        }}
        onBack={() => setCurrentView('dashboard')}
      />
    );
  }

  if (currentView === 'report' && selectedReport) {
    return (
      <ReportViewer
        assessmentId={selectedReport.id}
        score={selectedReport.score}
        title={selectedReport.title}
        completedAt={selectedReport.completedAt || selectedReport.createdAt}
        onBack={() => {
          setCurrentView('dashboard');
          setSelectedReport(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
              <Leaf className="h-8 w-8" />
              GHG Assessment Dashboard
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user?.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Track your GHG readiness assessments and download detailed reports.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assessments</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reports.length}</div>
              <p className="text-xs text-muted-foreground">
                {reports.filter(r => r.status === 'completed').length} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reports.length > 0 ? `${reports[0]?.score || 0}%` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {reports.length > 0 ? getScoreLabel(reports[0]?.score || 0) : 'Take your first assessment'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Account Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs text-muted-foreground">
                Free tier with basic reports
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Button
            onClick={() => setCurrentView('assessment')}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Start New Assessment
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export All Reports
          </Button>
        </div>

        {/* Reports List */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Reports</CardTitle>
            <CardDescription>
              View and download your GHG readiness assessment reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading reports...</p>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assessments yet</h3>
                <p className="text-gray-500 mb-4">
                  Start your first GHG readiness assessment to see reports here.
                </p>
                <Button
                  onClick={() => setCurrentView('assessment')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Start Assessment
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-gray-900">{report.title}</h3>
                          <Badge
                            variant={report.status === 'completed' ? 'default' : 'secondary'}
                            className={report.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {report.status === 'completed' ? 'Completed' : 'In Progress'}
                          </Badge>
                          {report.score && (
                            <Badge className={getScoreColor(report.score)}>
                              {report.score}% - {getScoreLabel(report.score)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>Created: {formatDate(report.createdAt)}</span>
                          </div>
                          {report.completedAt && (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" />
                              <span>Completed: {formatDate(report.completedAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => previewReport(report.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Preview Report
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateDetailedReport(report.id)}
                          disabled={isGeneratingReport === report.id}
                        >
                          {isGeneratingReport === report.id ? (
                            <>
                              <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                              Generating...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              Download AI Report
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          onClick={() => generateDetailedReport(report.id)}
                          disabled={isGeneratingReport === report.id}
                        >
                          {isGeneratingReport === report.id ? (
                            <>
                              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></div>
                              AI Processing...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              AI Detailed Report
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AssessmentDashboard;
