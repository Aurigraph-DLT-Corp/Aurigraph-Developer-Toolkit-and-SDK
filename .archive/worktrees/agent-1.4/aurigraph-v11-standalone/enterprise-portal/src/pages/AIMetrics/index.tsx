import React, { useState, useEffect } from 'react';
import { Container, Paper, CircularProgress, Alert, Box, Typography, Grid, Card, CardContent } from '@mui/material';
import { getAIMetrics, AIMetricsData } from '../../services/AIMetricsService';

/**
 * AIMetrics Component (FDA-4)
 * API Endpoint: /api/v11/ai/metrics
 */
export const AIMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<AIMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getAIMetrics();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetch();
    const interval = setInterval(fetch, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!metrics) return <Alert severity="warning">No AI metrics available</Alert>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        AI Optimization Metrics
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Model Accuracy</Typography>
              <Typography variant="h5">{metrics.modelAccuracy}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Predictions/sec</Typography>
              <Typography variant="h5">{metrics.predictionsPerSecond}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Latency (ms)</Typography>
              <Typography variant="h5">{metrics.averageLatency}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary">Model Status</Typography>
              <Typography variant="h5">{metrics.modelStatus}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AIMetrics;
