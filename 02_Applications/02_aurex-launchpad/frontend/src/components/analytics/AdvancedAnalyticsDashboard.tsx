// ================================================================================
// AUREX LAUNCHPAD™ ADVANCED ANALYTICS DASHBOARD
// Data Analytics Agent - Comprehensive ESG Analytics and Business Intelligence
// VIBE Framework Implementation - Intelligence & Excellence
// ================================================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// Chart components
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from 'recharts';

// Icons
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Refresh,
  Filter,
  Settings,
  Eye,
  Users,
  DollarSign,
  Leaf,
  Shield,
  Zap,
  Brain,
  Scale,
  Award,
  Calendar,
  Clock,
  FileText,
  Bell,
  Info,
} from 'lucide-react';

import { analyticsAPI } from '@/lib/api/analytics';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Types
interface VIBEMetrics {
  velocity: number;
  intelligence: number;
  balance: number;
  excellence: number;
  overall: number;
}

interface KPIData {
  id: string;
  name: string;
  current_value: number;
  target_value: number;
  trend: 'up' | 'down' | 'stable';
  category: string;
  performance_ratio: number;
}

interface AlertData {
  id: string;
  metric_name: string;
  alert_status: 'warning' | 'critical';
  current_value: number;
  threshold_exceeded: number;
  measurement_timestamp: string;
}

interface RealtimeMetric {
  metric_name: string;
  current_value: number;
  change_percentage: number;
  alert_status: 'normal' | 'warning' | 'critical';
  data_quality_score: number;
}

const AdvancedAnalyticsDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  // Data states
  const [vibeMetrics, setVibeMetrics] = useState<VIBEMetrics>({
    velocity: 0,
    intelligence: 0,
    balance: 0,
    excellence: 0,
    overall: 0,
  });
  const [kpis, setKpis] = useState<KPIData[]>([]);
  const [alerts, setAlerts] = useState<AlertData[]>([]);
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealtimeMetric[]>([]);
  const [trends, setTrends] = useState<any>({});
  const [benchmarkData, setBenchmarkData] = useState<any>([]);

  // Color schemes
  const colors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    warning: '#EF4444',
    success: '#22C55E',
    neutral: '#6B7280',
  };

  const vibeColors = {
    velocity: '#3B82F6',
    intelligence: '#8B5CF6',
    balance: '#10B981',
    excellence: '#F59E0B',
  };

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Load VIBE metrics
      const vibeResponse = await analyticsAPI.getVibeOverview(timeRange);
      setVibeMetrics(vibeResponse.vibe_scores);

      // Load KPIs
      const kpiResponse = await analyticsAPI.getKPIs();
      setKpis(kpiResponse);

      // Load alerts
      const alertsResponse = await analyticsAPI.getActiveAlerts();
      setAlerts(alertsResponse.alerts);

      // Load real-time metrics
      const realtimeResponse = await analyticsAPI.getRealtimeMetrics();
      setRealtimeMetrics(realtimeResponse.metrics);

      // Load trends data
      const trendsResponse = await analyticsAPI.getTrends(timeRange, [
        'emissions',
        'assessments',
        'energy',
      ]);
      setTrends(trendsResponse.trends);

      // Load benchmark data
      const benchmarkResponse = await analyticsAPI.getBenchmarks();
      setBenchmarkData(benchmarkResponse);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [timeRange, toast]);

  // Auto-refresh functionality
  useEffect(() => {
    loadDashboardData();

    // Set up auto-refresh for real-time data
    const interval = setInterval(() => {
      if (activeTab === 'realtime') {
        setRefreshing(true);
        loadDashboardData().finally(() => setRefreshing(false));
      }
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [loadDashboardData, activeTab]);

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast({
      title: 'Success',
      description: 'Dashboard data refreshed',
    });
  };

  // Generate executive report
  const handleGenerateReport = async () => {
    try {
      const reportConfig = {
        time_range: timeRange,
        include_vibe_analysis: true,
        include_benchmarks: true,
        include_recommendations: true,
      };

      const response = await analyticsAPI.generateExecutiveSummary(reportConfig);
      
      if (response.download_url) {
        window.open(response.download_url, '_blank');
        toast({
          title: 'Success',
          description: 'Executive report generated successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    }
  };

  // VIBE Framework Performance Component
  const VIBEFrameworkCard = () => {
    const vibeData = [
      {
        name: 'Velocity',
        score: vibeMetrics.velocity,
        color: vibeColors.velocity,
        icon: Zap,
        description: 'Project delivery speed',
      },
      {
        name: 'Intelligence',
        score: vibeMetrics.intelligence,
        color: vibeColors.intelligence,
        icon: Brain,
        description: 'AI-driven insights',
      },
      {
        name: 'Balance',
        score: vibeMetrics.balance,
        color: vibeColors.balance,
        icon: Scale,
        description: 'Resource optimization',
      },
      {
        name: 'Excellence',
        score: vibeMetrics.excellence,
        color: vibeColors.excellence,
        icon: Award,
        description: 'Quality & compliance',
      },
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            VIBE Framework Performance
          </CardTitle>
          <CardDescription>
            Overall Score: {vibeMetrics.overall.toFixed(1)}/100
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {vibeData.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" style={{ color: item.color }} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <Badge variant="outline">
                      {item.score.toFixed(1)}
                    </Badge>
                  </div>
                  <Progress
                    value={item.score}
                    className="h-2"
                    style={{
                      backgroundColor: `${item.color}20`,
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Overall VIBE Chart */}
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { name: 'Velocity', value: vibeMetrics.velocity },
                  { name: 'Intelligence', value: vibeMetrics.intelligence },
                  { name: 'Balance', value: vibeMetrics.balance },
                  { name: 'Excellence', value: vibeMetrics.excellence },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={colors.primary}
                  fill={colors.primary}
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Key Performance Indicators Component
  const KPIGrid = () => {
    const getKPIStatus = (kpi: KPIData) => {
      const ratio = kpi.performance_ratio;
      if (ratio >= 90) return { status: 'excellent', color: colors.success };
      if (ratio >= 70) return { status: 'good', color: colors.primary };
      if (ratio >= 50) return { status: 'fair', color: colors.accent };
      return { status: 'poor', color: colors.warning };
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const status = getKPIStatus(kpi);
          const TrendIcon = kpi.trend === 'up' ? TrendingUp : kpi.trend === 'down' ? TrendingDown : Activity;

          return (
            <Card key={kpi.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{kpi.name}</CardTitle>
                  <TrendIcon 
                    className={`h-4 w-4 ${
                      kpi.trend === 'up' ? 'text-green-500' : 
                      kpi.trend === 'down' ? 'text-red-500' : 
                      'text-gray-500'
                    }`} 
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold">
                      {kpi.current_value.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {kpi.target_value.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={kpi.performance_ratio} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{kpi.category}</span>
                    <Badge 
                      variant="outline" 
                      style={{ borderColor: status.color, color: status.color }}
                    >
                      {status.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // Alerts Component
  const AlertsPanel = () => {
    const criticalAlerts = alerts.filter(alert => alert.alert_status === 'critical');
    const warningAlerts = alerts.filter(alert => alert.alert_status === 'warning');

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Active Alerts
            {alerts.length > 0 && (
              <Badge variant="destructive">{alerts.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {criticalAlerts.map((alert) => (
                <Alert key={alert.id} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="text-sm">
                    Critical: {alert.metric_name}
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    Value: {alert.current_value} exceeds threshold: {alert.threshold_exceeded}
                    <br />
                    <span className="text-muted-foreground">
                      {new Date(alert.measurement_timestamp).toLocaleString()}
                    </span>
                  </AlertDescription>
                </Alert>
              ))}

              {warningAlerts.map((alert) => (
                <Alert key={alert.id} variant="default" className="border-yellow-500">
                  <Info className="h-4 w-4 text-yellow-500" />
                  <AlertTitle className="text-sm">
                    Warning: {alert.metric_name}
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    Value: {alert.current_value} near threshold: {alert.threshold_exceeded}
                    <br />
                    <span className="text-muted-foreground">
                      {new Date(alert.measurement_timestamp).toLocaleString()}
                    </span>
                  </AlertDescription>
                </Alert>
              ))}

              {alerts.length === 0 && (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  No active alerts
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  // Trends Chart Component
  const TrendsChart = () => {
    const emissionsData = trends.emissions || [];
    const assessmentsData = trends.assessments || [];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Trends
          </CardTitle>
          <CardDescription>
            {timeRange === '7d' ? 'Last 7 days' : 
             timeRange === '30d' ? 'Last 30 days' : 
             timeRange === '90d' ? 'Last 90 days' : 
             'Last year'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={emissionsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={colors.primary}
                  strokeWidth={2}
                  name="Emissions (tCO2e)"
                />
                <Line
                  type="monotone"
                  dataKey="change_percentage"
                  stroke={colors.secondary}
                  strokeWidth={2}
                  name="Change %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Real-time Metrics Component
  const RealTimeMetrics = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {realtimeMetrics.map((metric, index) => {
          const isPositiveChange = metric.change_percentage > 0;
          const alertColor = 
            metric.alert_status === 'critical' ? colors.warning :
            metric.alert_status === 'warning' ? colors.accent :
            colors.success;

          return (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {metric.metric_name}
                  </CardTitle>
                  <Badge 
                    variant="outline" 
                    style={{ borderColor: alertColor, color: alertColor }}
                  >
                    {metric.alert_status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-end gap-2">
                    <span className="text-lg font-bold">
                      {metric.current_value.toFixed(2)}
                    </span>
                    <div className={`flex items-center text-xs ${
                      isPositiveChange ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {isPositiveChange ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {Math.abs(metric.change_percentage).toFixed(1)}%
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Quality:</span>
                    <span>{metric.data_quality_score.toFixed(0)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // Benchmark Comparison Component
  const BenchmarkChart = () => {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Industry Benchmarks
          </CardTitle>
          <CardDescription>
            Compare your performance against industry standards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={benchmarkData.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="current_value" 
                  fill={colors.primary} 
                  name="Your Value"
                />
                <Bar 
                  dataKey="industry_average" 
                  fill={colors.neutral} 
                  name="Industry Average"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive ESG performance insights and business intelligence
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <Refresh className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button 
            size="sm" 
            onClick={handleGenerateReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Main Dashboard */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VIBEFrameworkCard />
            <AlertsPanel />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Key Performance Indicators</h3>
            <KPIGrid />
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <VIBEFrameworkCard />
            <BenchmarkChart />
          </div>
          <KPIGrid />
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <TrendsChart />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VIBEFrameworkCard />
            <AlertsPanel />
          </div>
        </TabsContent>

        {/* Real-time Tab */}
        <TabsContent value="realtime" className="space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground">
              Auto-refreshing every 30 seconds
            </span>
            {refreshing && <LoadingSpinner size="sm" />}
          </div>
          
          <RealTimeMetrics />
          <AlertsPanel />
        </TabsContent>

        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks" className="space-y-6">
          <BenchmarkChart />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VIBEFrameworkCard />
            <KPIGrid />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalyticsDashboard;