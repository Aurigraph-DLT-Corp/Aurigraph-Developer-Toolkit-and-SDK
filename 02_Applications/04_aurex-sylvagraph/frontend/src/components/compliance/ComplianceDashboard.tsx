/**
 * DMRV Compliance Dashboard
 * Comprehensive dashboard for managing DMRV compliance workflows and monitoring
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Progress
} from "../ui/progress";
import {
  Shield,
  FileText,
  CheckCircle,
  AlertTriangle,
  Clock,
  TrendingUp,
  Calendar,
  Users,
  Download,
  Plus
} from 'lucide-react';

interface ComplianceSummary {
  total_projects: number;
  compliant_projects: number;
  pending_verification: number;
  overdue_monitoring: number;
  active_alerts: number;
}

interface ProjectCompliance {
  project_id: string;
  project_name: string;
  status: string;
  alerts: number;
  next_actions: number;
}

interface ComplianceWorkflow {
  workflow_id: string;
  standard: string;
  stage: string;
  status: string;
  progress_percentage: number;
  assigned_vvb: string;
  expected_completion: string;
  created_at: string;
}

interface ComplianceDashboardData {
  summary: ComplianceSummary;
  projects: ProjectCompliance[];
  standards_breakdown: Record<string, number>;
  upcoming_deadlines: Array<{
    project_id: string;
    project_name: string;
    deadline_type: string;
    due_date: string;
  }>;
}

export const ComplianceDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<ComplianceDashboardData | null>(null);
  const [workflows, setWorkflows] = useState<ComplianceWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedStandard, setSelectedStandard] = useState<string>('all');

  useEffect(() => {
    fetchDashboardData();
    fetchWorkflows();
  }, [selectedProject, selectedStandard]);

  const fetchDashboardData = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedProject !== 'all') {
        params.append('project_ids', selectedProject);
      }

      const response = await fetch(`/api/v1/dmrv/dashboard?${params}`);
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const fetchWorkflows = async () => {
    try {
      // This would fetch workflows for selected project
      // For now, we'll use mock data
      const mockWorkflows: ComplianceWorkflow[] = [
        {
          workflow_id: '1',
          standard: 'verra_vcs',
          stage: 'validation',
          status: 'in_progress',
          progress_percentage: 65,
          assigned_vvb: 'SCS Global Services',
          expected_completion: '2024-03-15',
          created_at: '2024-01-10'
        },
        {
          workflow_id: '2',
          standard: 'gold_standard',
          stage: 'verification',
          status: 'pending',
          progress_percentage: 25,
          assigned_vvb: 'DNV',
          expected_completion: '2024-04-20',
          created_at: '2024-01-15'
        }
      ];
      
      setWorkflows(mockWorkflows);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'non_compliant':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'non_compliant':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatStandard = (standard: string) => {
    switch (standard) {
      case 'verra_vcs':
        return 'Verra VCS';
      case 'gold_standard':
        return 'Gold Standard';
      case 'iso_14064_2':
        return 'ISO 14064-2';
      case 'art_trees':
        return 'ART TREES';
      default:
        return standard;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Shield className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading compliance data...</span>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <span className="ml-2">Failed to load compliance data</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">DMRV Compliance Dashboard</h1>
          <p className="text-gray-600">Monitor compliance workflows and generate reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Generate Report
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData.summary.total_projects}
            </div>
            <p className="text-xs text-muted-foreground">Active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardData.summary.compliant_projects}
            </div>
            <p className="text-xs text-muted-foreground">
              {((dashboardData.summary.compliant_projects / dashboardData.summary.total_projects) * 100).toFixed(0)}% compliant
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {dashboardData.summary.pending_verification}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting VVB review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Monitoring</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dashboardData.summary.overdue_monitoring}
            </div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {dashboardData.summary.active_alerts}
            </div>
            <p className="text-xs text-muted-foreground">Need review</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects and Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle>Project Compliance Status</CardTitle>
            <CardDescription>Overview of project compliance across standards</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Alerts</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.projects.slice(0, 5).map((project) => (
                  <TableRow key={project.project_id}>
                    <TableCell>
                      <div className="font-medium">{project.project_name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(project.status)}
                        <Badge variant={getStatusBadgeVariant(project.status)}>
                          {project.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {project.alerts > 0 ? (
                        <Badge variant="destructive">{project.alerts}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {project.next_actions > 0 ? (
                        <Badge variant="secondary">{project.next_actions}</Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Active Workflows */}
        <Card>
          <CardHeader>
            <CardTitle>Active Workflows</CardTitle>
            <CardDescription>Current VVB workflows and progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflows.map((workflow) => (
                <div key={workflow.workflow_id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{formatStandard(workflow.standard)}</div>
                      <div className="text-sm text-gray-500 capitalize">
                        {workflow.stage} • {workflow.status}
                      </div>
                    </div>
                    <Badge variant="outline">
                      {workflow.progress_percentage}%
                    </Badge>
                  </div>
                  
                  <Progress value={workflow.progress_percentage} className="h-2" />
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {workflow.assigned_vvb}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Due: {new Date(workflow.expected_completion).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Standards Breakdown and Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Standards Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Standards Distribution</CardTitle>
            <CardDescription>Projects by compliance standard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(dashboardData.standards_breakdown).map(([standard, count]) => (
                <div key={standard} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">{formatStandard(standard)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{count}</Badge>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ 
                          width: `${(count / dashboardData.summary.total_projects) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Important dates and milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.upcoming_deadlines.slice(0, 5).map((deadline, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{deadline.project_name}</div>
                    <div className="text-sm text-gray-500 capitalize">
                      {deadline.deadline_type.replace('_', ' ')}
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {new Date(deadline.due_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
              
              {dashboardData.upcoming_deadlines.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No upcoming deadlines
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};