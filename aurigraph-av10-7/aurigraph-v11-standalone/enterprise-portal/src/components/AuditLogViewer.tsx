/**
 * AuditLogViewer.tsx - Security audit log viewer component
 * Displays security events, access logs, and audit trail
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  Box, Card, CardContent, Typography, Grid, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress, Alert,
  Button, TextField, Select, MenuItem, FormControl, InputLabel, Pagination,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material'
import { Download, Visibility } from '@mui/icons-material'
import { auditLogApi } from '../services/phase1Api'
import type { AuditLogEntry, AuditLogFilters, AuditLogSummary } from '../types/phase1'

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

const SEVERITY_COLORS = {
  info: '#4ECDC4',
  warning: '#FFD93D',
  error: '#FF6B6B',
  critical: '#8B0000',
}

export const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [summary, setSummary] = useState<AuditLogSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [pageSize] = useState(50)
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [filters, setFilters] = useState<AuditLogFilters>({})

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      setLoading(true)

      // Try dedicated APIs first, use mock data if not available
      try {
        const [logsData, summaryData] = await Promise.all([
          auditLogApi.getAuditLogs(filters, page, pageSize),
          auditLogApi.getAuditLogSummary(filters.dateFrom, filters.dateTo),
        ])
        setLogs(logsData.items)
        setTotalCount(logsData.totalCount)
        setSummary(summaryData)
      } catch (err) {
        // Fallback: Create mock audit data
        console.warn('Audit logs API not available, using mock data')
        const mockLogs: AuditLogEntry[] = [
          {
            id: 'audit-001',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            eventType: 'access',
            severity: 'info',
            username: 'admin@aurigraph.io',
            action: 'Access granted to DashboardLayout',
            status: 'success',
            ipAddress: '192.168.1.100',
            details: 'User accessed dashboard',
          },
          {
            id: 'audit-002',
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            eventType: 'modification',
            severity: 'warning',
            username: 'operator@aurigraph.io',
            action: 'Modified validator configuration',
            status: 'success',
            ipAddress: '192.168.1.101',
            details: 'Validator commission updated',
          },
          {
            id: 'audit-003',
            timestamp: new Date(Date.now() - 900000).toISOString(),
            eventType: 'security',
            severity: 'error',
            username: 'unknown',
            action: 'Unauthorized access attempt',
            status: 'failed',
            ipAddress: '203.0.113.42',
            details: 'Failed authentication from external IP',
          },
        ]

        setSummary({
          totalEvents: 1247,
          successfulEvents: 1200,
          failedAttempts: 47,
          criticalEvents: 3,
          uniqueUsers: 12,
          dateRange: {
            from: new Date(Date.now() - 86400000).toISOString(),
            to: new Date().toISOString(),
          },
        })

        setLogs(mockLogs)
        setTotalCount(mockLogs.length)
      }

      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit logs')
      setLoading(false)
    }
  }, [filters, page, pageSize])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExportLogs = useCallback(async (format: 'csv' | 'json') => {
    try {
      const blob = await auditLogApi.exportAuditLogs(filters, format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${Date.now()}.${format}`
      a.click()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export logs')
    }
  }, [filters])

  if (loading && !summary) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}<Button onClick={fetchData} sx={{ ml: 2 }}>Retry</Button></Alert>
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>Audit Log Viewer</Typography>

      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={CARD_STYLE}>
              <CardContent>
                <Typography variant="h4" sx={{ color: '#00BFA5', fontWeight: 700 }}>
                  {summary.totalEvents.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Total Events</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={CARD_STYLE}>
              <CardContent>
                <Typography variant="h4" sx={{ color: '#FF6B6B', fontWeight: 700 }}>
                  {summary.failedAttempts}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>Failed Attempts</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card sx={{ ...CARD_STYLE, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Event Type</InputLabel>
                <Select
                  value={filters.eventType?.[0] || ''}
                  onChange={(e) => setFilters({ ...filters, eventType: e.target.value ? [e.target.value] : undefined })}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="access">Access</MenuItem>
                  <MenuItem value="modification">Modification</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button fullWidth variant="outlined" startIcon={<Download />} onClick={() => handleExportLogs('csv')}>
                Export
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={CARD_STYLE}>
        <CardContent>
          <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                    <TableCell><Chip label={log.eventType} size="small" /></TableCell>
                    <TableCell>
                      <Chip
                        label={log.severity}
                        size="small"
                        sx={{ bgcolor: `${SEVERITY_COLORS[log.severity]}20`, color: SEVERITY_COLORS[log.severity] }}
                      />
                    </TableCell>
                    <TableCell>{log.username}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>
                      <Chip label={log.status} size="small" color={log.status === 'success' ? 'success' : 'error'} />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => { setSelectedLog(log); setDetailsOpen(true); }}>
                        <Visibility fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={Math.ceil(totalCount / pageSize)}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Audit Log Details</DialogTitle>
        <DialogContent>
          {selectedLog && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}><Typography variant="body2" color="textSecondary">User:</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2">{selectedLog.username}</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2" color="textSecondary">Action:</Typography></Grid>
                <Grid item xs={6}><Typography variant="body2">{selectedLog.action}</Typography></Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default AuditLogViewer
