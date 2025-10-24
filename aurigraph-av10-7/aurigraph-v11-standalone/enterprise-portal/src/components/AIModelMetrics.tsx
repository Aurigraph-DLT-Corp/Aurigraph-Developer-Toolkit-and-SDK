/**
 * AIModelMetrics.tsx - ML model performance display component
 * Shows AI optimization metrics, model accuracy, predictions
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress, Alert,
  Button, Switch, FormControlLabel, LinearProgress,
} from '@mui/material'
import { Psychology as AIIcon, TrendingUp, Speed, CheckCircle } from '@mui/icons-material'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { aiMetricsApi } from '../services/phase1Api'
import type { AIMetrics, MLModelInfo } from '../types/phase1'

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

const MODEL_TYPE_COLORS: Record<string, string> = {
  consensus_optimizer: '#00BFA5',
  transaction_predictor: '#4ECDC4',
  anomaly_detector: '#FF6B6B',
  load_balancer: '#FFD93D',
}

export const AIModelMetrics: React.FC = () => {
  const [aiMetrics, setAiMetrics] = useState<AIMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const data = await aiMetricsApi.getAIMetrics()
      setAiMetrics(data)
      setLoading(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch AI metrics'
      setError(errorMessage)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleToggleModel = useCallback(async (modelId: string, enabled: boolean) => {
    try {
      await aiMetricsApi.toggleModel(modelId, enabled)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle model')
    }
  }, [fetchData])

  const handleRetrainModel = useCallback(async (modelId: string) => {
    try {
      await aiMetricsApi.retrainModel(modelId)
      fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retrain model')
    }
  }, [fetchData])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button onClick={fetchData} sx={{ ml: 2 }}>Retry</Button>
      </Alert>
    )
  }

  if (!aiMetrics) return null

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        AI Model Metrics
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#00BFA5', fontWeight: 700 }}>
                {aiMetrics.overallAccuracy.toFixed(2)}%
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Overall Accuracy
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#4ECDC4', fontWeight: 700 }}>
                {aiMetrics.totalInferences.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Total Inferences
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#FFD93D', fontWeight: 700 }}>
                {aiMetrics.averageLatency.toFixed(0)}ms
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Avg Latency
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Typography variant="h4" sx={{ color: '#FF6B6B', fontWeight: 700 }}>
                +{aiMetrics.performanceGain.toFixed(1)}%
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Performance Gain
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Models Table */}
      <Card sx={{ ...CARD_STYLE, mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>ML Models</Typography>
          <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Model</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Accuracy</TableCell>
                  <TableCell>F1 Score</TableCell>
                  <TableCell>Latency</TableCell>
                  <TableCell>Inferences</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {aiMetrics.models.map((model) => (
                  <TableRow key={model.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{model.name}</Typography>
                      <Typography variant="caption" color="textSecondary">{model.version}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={model.type.replace('_', ' ')}
                        size="small"
                        sx={{
                          bgcolor: `${MODEL_TYPE_COLORS[model.type]}20`,
                          color: MODEL_TYPE_COLORS[model.type],
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={model.status}
                        size="small"
                        color={model.status === 'active' ? 'success' : model.status === 'training' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{(model.accuracy * 100).toFixed(2)}%</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={model.accuracy * 100}
                          sx={{ height: 4, mt: 0.5, bgcolor: 'rgba(255,255,255,0.1)' }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{(model.f1Score * 100).toFixed(2)}%</TableCell>
                    <TableCell>{model.latency.toFixed(0)}ms</TableCell>
                    <TableCell>{model.inferenceCount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={model.status === 'active'}
                              onChange={(e) => handleToggleModel(model.id, e.target.checked)}
                              size="small"
                            />
                          }
                          label=""
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleRetrainModel(model.id)}
                          disabled={model.status === 'training'}
                        >
                          Retrain
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Predictions Chart */}
      {aiMetrics.predictions.length > 0 && (
        <Card sx={CARD_STYLE}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Model Predictions vs Actuals</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={aiMetrics.predictions}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="timestamp" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip contentStyle={{ backgroundColor: '#1A1F3A', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Line type="monotone" dataKey="predicted" stroke="#00BFA5" name="Predicted" />
                <Line type="monotone" dataKey="actual" stroke="#4ECDC4" name="Actual" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default AIModelMetrics
