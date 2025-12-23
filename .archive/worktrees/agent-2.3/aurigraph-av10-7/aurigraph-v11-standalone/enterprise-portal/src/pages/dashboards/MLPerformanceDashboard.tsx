import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, LinearProgress,
  Chip, Alert, Paper, Tabs, Tab, Button, AlertTitle
} from '@mui/material';
import { TrendingUp, Psychology, Speed, CheckCircle, Warning, Refresh, ErrorOutline } from '@mui/icons-material';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { apiService, safeApiCall } from '../../services/api';

const MLPerformanceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [mlMetrics, setMLMetrics] = useState<any>(null);
  const [mlPredictions, setMLPredictions] = useState<any>(null);
  const [mlPerformance, setMLPerformance] = useState<any>(null);
  const [mlConfidence, setMLConfidence] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, Error>>({});
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchMLData();
    const interval = setInterval(fetchMLData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMLData = async () => {
    setLoading(true);
    const errorMap: Record<string, Error> = {};

    // Use Promise.allSettled for graceful partial failure handling
    const results = await Promise.allSettled([
      safeApiCall(
        () => apiService.getMLMetrics(),
        {
          mlShardSelections: 0,
          mlShardFallbacks: 0,
          mlShardSuccessRate: 0,
          avgShardConfidence: 0,
          avgShardLatencyMs: 0,
          mlOrderingCalls: 0,
          mlOrderingFallbacks: 0,
          mlOrderingSuccessRate: 0,
          totalOrderedTransactions: 0,
          avgOrderingLatencyMs: 0
        }
      ),
      safeApiCall(
        () => apiService.getMLPredictions(),
        {
          nextDayTpsForecast: 0,
          weeklyGrowthRate: 0,
          monthlyVolumePrediction: 0,
          anomalyScore: 0
        }
      ),
      safeApiCall(
        () => apiService.getMLPerformance(),
        {
          baselineTPS: 0,
          mlOptimizedTPS: 0,
          performanceGainPercent: 0,
          mlShardSuccessRate: 0,
          avgShardLatencyMs: 0,
          mlOrderingSuccessRate: 0,
          avgOrderingLatencyMs: 0
        }
      ),
      safeApiCall(
        () => apiService.getMLConfidence(),
        {
          avgShardConfidence: 0,
          overallHealth: 'UNKNOWN',
          anomaliesDetected: 0
        }
      )
    ]);

    // Process results and collect errors
    if (results[0].status === 'fulfilled') {
      const metricsResult = results[0].value;
      setMLMetrics(metricsResult.data);
      if (!metricsResult.success) errorMap.metrics = metricsResult.error!;
    }

    if (results[1].status === 'fulfilled') {
      const predictionsResult = results[1].value;
      setMLPredictions(predictionsResult.data);
      if (!predictionsResult.success) errorMap.predictions = predictionsResult.error!;
    }

    if (results[2].status === 'fulfilled') {
      const performanceResult = results[2].value;
      setMLPerformance(performanceResult.data);
      if (!performanceResult.success) errorMap.performance = performanceResult.error!;
    }

    if (results[3].status === 'fulfilled') {
      const confidenceResult = results[3].value;
      setMLConfidence(confidenceResult.data);
      if (!confidenceResult.success) errorMap.confidence = confidenceResult.error!;
    }

    setErrors(errorMap);
    setLoading(false);
    setLastRefresh(new Date());
  };

  if (loading || !mlMetrics || !mlPerformance) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  const performanceData = [
    { name: 'Baseline', tps: mlPerformance.baselineTPS, color: '#82ca9d' },
    { name: 'ML-Optimized', tps: mlPerformance.mlOptimizedTPS, color: '#8884d8' }
  ];

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'EXCELLENT': return 'success';
      case 'GOOD': return 'info';
      case 'FAIR': return 'warning';
      default: return 'error';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">
            <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
            ML Performance Dashboard - Phase 1 Integration
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Last updated: {lastRefresh.toLocaleTimeString()} | Auto-refresh: Every 5s
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchMLData}
            disabled={loading}
          >
            Refresh
          </Button>
          {Object.keys(errors).length > 0 && (
            <Chip
              label={`${Object.keys(errors).length} Endpoints Failed`}
              color="warning"
              icon={<ErrorOutline />}
            />
          )}
        </Box>
      </Box>

      {/* Error Notifications */}
      {Object.keys(errors).length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Some endpoints are unavailable</AlertTitle>
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {errors.metrics && <li>ML Metrics endpoint failed</li>}
            {errors.predictions && <li>ML Predictions endpoint failed</li>}
            {errors.performance && <li>ML Performance endpoint failed</li>}
            {errors.confidence && <li>ML Confidence endpoint failed</li>}
          </Box>
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            Showing fallback data for failed endpoints. Dashboard functionality may be limited.
          </Typography>
        </Alert>
      )}

      {/* ML Health Status */}
      <Alert
        severity={mlConfidence ? getHealthColor(mlConfidence.overallHealth) as any : 'info'}
        sx={{ mb: 3 }}
        icon={errors.confidence ? <ErrorOutline /> : undefined}
      >
        {errors.confidence ? (
          <>
            <strong>ML System Health: Data Unavailable</strong>
            {' - '}
            Unable to fetch ML confidence metrics
          </>
        ) : (
          <>
            <strong>ML System Health: {mlConfidence.overallHealth}</strong>
            {' - '}
            Shard Success Rate: {mlPerformance.mlShardSuccessRate.toFixed(1)}%,
            Ordering Success Rate: {mlPerformance.mlOrderingSuccessRate.toFixed(1)}%
          </>
        )}
      </Alert>

      {/* Key Performance Indicators */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                <Speed fontSize="small" sx={{ verticalAlign: 'middle' }} /> Performance Gain
              </Typography>
              {errors.performance ? (
                <>
                  <Typography variant="h5" color="text.secondary">
                    Data Unavailable
                  </Typography>
                  <Typography variant="caption" color="error">
                    Endpoint not responding
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h3" color="success.main">
                    +{mlPerformance.performanceGainPercent.toFixed(1)}%
                  </Typography>
                  <Typography variant="caption">
                    {mlPerformance.baselineTPS.toLocaleString()} → {mlPerformance.mlOptimizedTPS.toLocaleString()} TPS
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                <CheckCircle fontSize="small" sx={{ verticalAlign: 'middle' }} /> ML Confidence
              </Typography>
              {errors.confidence ? (
                <>
                  <Typography variant="h5" color="text.secondary">
                    Data Unavailable
                  </Typography>
                  <Typography variant="caption" color="error">
                    Endpoint not responding
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h3">
                    {(mlConfidence.avgShardConfidence * 100).toFixed(1)}%
                  </Typography>
                  <Typography variant="caption">
                    Avg shard selection confidence
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                <TrendingUp fontSize="small" sx={{ verticalAlign: 'middle' }} /> Next Day Forecast
              </Typography>
              {errors.predictions ? (
                <>
                  <Typography variant="h5" color="text.secondary">
                    Data Unavailable
                  </Typography>
                  <Typography variant="caption" color="error">
                    Endpoint not responding
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h4">
                    {mlPredictions.nextDayTpsForecast.toLocaleString()}
                  </Typography>
                  <Typography variant="caption">
                    TPS prediction
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                <Warning fontSize="small" sx={{ verticalAlign: 'middle' }} /> Anomaly Score
              </Typography>
              {errors.predictions || errors.confidence ? (
                <>
                  <Typography variant="h5" color="text.secondary">
                    Data Unavailable
                  </Typography>
                  <Typography variant="caption" color="error">
                    Endpoint not responding
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h3" color={mlPredictions.anomalyScore > 0.5 ? 'error.main' : 'success.main'}>
                    {mlPredictions.anomalyScore.toFixed(2)}
                  </Typography>
                  <Typography variant="caption">
                    {mlConfidence.anomaliesDetected} detected
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Card>
        <CardContent>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
            <Tab label="Performance Comparison" />
            <Tab label="ML Metrics" />
            <Tab label="Predictions" />
          </Tabs>

          {activeTab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>Baseline vs ML-Optimized Performance</Typography>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tps" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>

              <Grid container spacing={2} sx={{ mt: 2 }}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2">Shard Selection</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={mlPerformance.mlShardSuccessRate}
                      sx={{ my: 1, height: 10 }}
                      color="success"
                    />
                    <Typography variant="caption">
                      Success Rate: {mlPerformance.mlShardSuccessRate.toFixed(2)}%
                      <br/>
                      Avg Latency: {mlPerformance.avgShardLatencyMs.toFixed(2)}ms
                      <br/>
                      Confidence: {(mlConfidence.avgShardConfidence * 100).toFixed(1)}%
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2">Transaction Ordering</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={mlPerformance.mlOrderingSuccessRate}
                      sx={{ my: 1, height: 10 }}
                      color="info"
                    />
                    <Typography variant="caption">
                      Success Rate: {mlPerformance.mlOrderingSuccessRate.toFixed(2)}%
                      <br/>
                      Avg Latency: {mlPerformance.avgOrderingLatencyMs.toFixed(2)}ms
                      <br/>
                      Total Ordered: {mlMetrics.totalOrderedTransactions.toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Detailed ML Metrics</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>Shard Selection Metrics</Typography>
                      <Typography>ML Selections: <strong>{mlMetrics.mlShardSelections.toLocaleString()}</strong></Typography>
                      <Typography>Fallbacks: <strong>{mlMetrics.mlShardFallbacks.toLocaleString()}</strong></Typography>
                      <Typography>Success Rate: <Chip label={`${mlMetrics.mlShardSuccessRate.toFixed(2)}%`} color="success" size="small" /></Typography>
                      <Typography>Avg Confidence: <strong>{mlMetrics.avgShardConfidence.toFixed(3)}</strong></Typography>
                      <Typography>Avg Latency: <strong>{mlMetrics.avgShardLatencyMs.toFixed(2)}ms</strong></Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom>Transaction Ordering Metrics</Typography>
                      <Typography>ML Ordering Calls: <strong>{mlMetrics.mlOrderingCalls.toLocaleString()}</strong></Typography>
                      <Typography>Fallbacks: <strong>{mlMetrics.mlOrderingFallbacks.toLocaleString()}</strong></Typography>
                      <Typography>Success Rate: <Chip label={`${mlMetrics.mlOrderingSuccessRate.toFixed(2)}%`} color="info" size="small" /></Typography>
                      <Typography>Total Ordered Txs: <strong>{mlMetrics.totalOrderedTransactions.toLocaleString()}</strong></Typography>
                      <Typography>Avg Latency: <strong>{mlMetrics.avgOrderingLatencyMs.toFixed(2)}ms</strong></Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>AI Predictions & Forecasts</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: 'primary.light', color: 'white' }}>
                    <Typography variant="subtitle2">Next Day TPS Forecast</Typography>
                    <Typography variant="h4">{mlPredictions.nextDayTpsForecast.toLocaleString()}</Typography>
                    <Typography variant="caption">Based on current growth trends</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: 'success.light', color: 'white' }}>
                    <Typography variant="subtitle2">Weekly Growth Rate</Typography>
                    <Typography variant="h4">+{mlPredictions.weeklyGrowthRate.toFixed(1)}%</Typography>
                    <Typography variant="caption">Projected performance gain</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, bgcolor: 'info.light', color: 'white' }}>
                    <Typography variant="subtitle2">Monthly Volume Prediction</Typography>
                    <Typography variant="h4">{(mlPredictions.monthlyVolumePrediction / 1e9).toFixed(1)}B</Typography>
                    <Typography variant="caption">Total transactions</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default MLPerformanceDashboard;
