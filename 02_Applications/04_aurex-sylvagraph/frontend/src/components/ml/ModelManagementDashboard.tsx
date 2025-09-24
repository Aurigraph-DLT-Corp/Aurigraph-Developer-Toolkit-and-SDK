/**
 * ML Model Management Dashboard
 * Comprehensive dashboard for managing ML models, training, and performance monitoring
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
  Brain,
  TrendingUp,
  Activity,
  CheckCircle,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  Download
} from 'lucide-react';

interface ModelMetadata {
  id: string;
  name: string;
  model_type: string;
  version: string;
  status: string;
  accuracy: number;
  created_at: string;
  deployed_at?: string;
  description?: string;
}

interface PerformanceMetrics {
  total_predictions: number;
  successful_predictions: number;
  success_rate: number;
  average_confidence: number;
  average_processing_time_ms: number;
  predictions_by_type: Record<string, number>;
}

export const ModelManagementDashboard: React.FC = () => {
  const [models, setModels] = useState<ModelMetadata[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModelType, setSelectedModelType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    fetchModels();
    fetchPerformanceMetrics();
  }, [selectedModelType, selectedStatus]);

  const fetchModels = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedModelType !== 'all') params.append('model_type', selectedModelType);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const response = await fetch(`/api/v1/ml/models?${params}`);
      const data = await response.json();
      setModels(data);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    }
  };

  const fetchPerformanceMetrics = async () => {
    try {
      const params = new URLSearchParams({ days: '30' });
      if (selectedModelType !== 'all') params.append('model_type', selectedModelType);

      const response = await fetch(`/api/v1/ml/analytics/performance?${params}`);
      const data = await response.json();
      setPerformanceMetrics(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
      setLoading(false);
    }
  };

  const handleDeployModel = async (modelId: string) => {
    try {
      // Implementation would call deployment API
      console.log('Deploying model:', modelId);
      await fetchModels(); // Refresh data
    } catch (error) {
      console.error('Failed to deploy model:', error);
    }
  };

  const handleRetireModel = async (modelId: string) => {
    try {
      // Implementation would call retirement API
      console.log('Retiring model:', modelId);
      await fetchModels(); // Refresh data
    } catch (error) {
      console.error('Failed to retire model:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'training':
        return <Activity className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'registered':
        return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'retired':
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'deployed':
        return 'default';
      case 'training':
        return 'secondary';
      case 'registered':
        return 'outline';
      case 'retired':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatModelType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Activity className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading ML models...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">ML Model Management</h1>
          <p className="text-gray-600">Manage machine learning models and monitor performance</p>
        </div>
        <Button className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          Train New Model
        </Button>
      </div>

      {/* Performance Overview */}
      {performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {performanceMetrics.total_predictions.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(performanceMetrics.success_rate * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {performanceMetrics.successful_predictions} successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(performanceMetrics.average_confidence * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">Model confidence</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(performanceMetrics.average_processing_time_ms)}ms
              </div>
              <p className="text-xs text-muted-foreground">Processing time</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Models</CardTitle>
          <CardDescription>Filter models by type and status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Model Type</label>
              <Select value={selectedModelType} onValueChange={setSelectedModelType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select model type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="biomass_estimation">Biomass Estimation</SelectItem>
                  <SelectItem value="change_detection">Change Detection</SelectItem>
                  <SelectItem value="carbon_sequestration">Carbon Sequestration</SelectItem>
                  <SelectItem value="biodiversity_assessment">Biodiversity Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="training">Training</SelectItem>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="deployed">Deployed</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Models Table */}
      <Card>
        <CardHeader>
          <CardTitle>Model Registry</CardTitle>
          <CardDescription>
            {models.length} model{models.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Accuracy</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-gray-500">{model.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {formatModelType(model.model_type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{model.version}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(model.status)}
                      <Badge variant={getStatusBadgeVariant(model.status)}>
                        {model.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">
                        {(model.accuracy * 100).toFixed(1)}%
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${model.accuracy * 100}%` }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(model.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {model.status === 'registered' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeployModel(model.id)}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Deploy
                        </Button>
                      )}
                      {model.status === 'deployed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetireModel(model.id)}
                        >
                          <Pause className="h-3 w-3 mr-1" />
                          Retire
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {models.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No models found matching the current filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};