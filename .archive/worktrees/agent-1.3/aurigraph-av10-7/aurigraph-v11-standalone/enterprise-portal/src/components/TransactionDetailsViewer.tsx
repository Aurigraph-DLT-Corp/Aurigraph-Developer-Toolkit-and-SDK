/**
 * TransactionDetailsViewer.tsx
 * Display full transaction details with interactive features
 * AV11-281: Transaction Details Viewer
 */

import React, { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Paper,
  Tooltip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  ContentCopy as CopyIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  OpenInNew as ExternalIcon,
} from '@mui/icons-material'
import { transactionApi } from '../services/phase2Api'
import type { TransactionDetails } from '../types/phase2'

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG = {
  SUCCESS: { color: 'success' as const, icon: SuccessIcon, label: 'Success' },
  FAILED: { color: 'error' as const, icon: ErrorIcon, label: 'Failed' },
  PENDING: { color: 'warning' as const, icon: PendingIcon, label: 'Pending' },
}

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
  marginBottom: 2,
}

// ============================================================================
// TYPES
// ============================================================================

interface TransactionDetailsViewerProps {
  transactionHash: string
  onClose?: () => void
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const shortenAddress = (address: string, chars: number = 6): string => {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

const formatValue = (value: string): string => {
  try {
    const num = parseFloat(value)
    return num.toLocaleString(undefined, { maximumFractionDigits: 8 })
  } catch {
    return value
  }
}

const calculateFee = (gasUsed: number, gasPrice: string): string => {
  try {
    const fee = (gasUsed * parseFloat(gasPrice)) / 1e18
    return fee.toFixed(8)
  } catch {
    return '0'
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const TransactionDetailsViewer: React.FC<TransactionDetailsViewerProps> = ({
  transactionHash,
  onClose,
}) => {
  const [transaction, setTransaction] = useState<TransactionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchTransactionDetails = useCallback(async () => {
    if (!transactionHash) return

    try {
      setLoading(true)
      setError(null)
      const data = await transactionApi.getTransaction(transactionHash)
      setTransaction(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transaction details'
      setError(errorMessage)
      console.error('Failed to fetch transaction:', err)
    } finally {
      setLoading(false)
    }
  }, [transactionHash])

  useEffect(() => {
    fetchTransactionDetails()
  }, [fetchTransactionDetails])

  // ============================================================================
  // CLIPBOARD FUNCTIONS
  // ============================================================================

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    })
  }

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderStatusBadge = () => {
    if (!transaction) return null
    const config = STATUS_CONFIG[transaction.status]
    const StatusIcon = config.icon

    return (
      <Chip
        icon={<StatusIcon />}
        label={config.label}
        color={config.color}
        size="medium"
        sx={{ fontWeight: 600 }}
      />
    )
  }

  const renderCopyButton = (text: string, field: string) => (
    <Tooltip title={copiedField === field ? 'Copied!' : 'Copy'}>
      <IconButton
        size="small"
        onClick={() => copyToClipboard(text, field)}
        sx={{ ml: 1 }}
      >
        <CopyIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  )

  const renderDataRow = (label: string, value: string | React.ReactNode, copyable?: string) => (
    <TableRow>
      <TableCell
        sx={{
          fontWeight: 600,
          color: 'rgba(255,255,255,0.7)',
          borderColor: 'rgba(255,255,255,0.1)',
          width: '30%',
        }}
      >
        {label}
      </TableCell>
      <TableCell
        sx={{
          fontFamily: 'monospace',
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <Box display="flex" alignItems="center">
          {value}
          {copyable && renderCopyButton(copyable, label)}
        </Box>
      </TableCell>
    </TableRow>
  )

  // ============================================================================
  // LOADING & ERROR STATES
  // ============================================================================

  if (loading) {
    return (
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Box display="flex" gap={2}>
            <Button variant="outlined" onClick={fetchTransactionDetails} startIcon={<RefreshIcon />}>
              Retry
            </Button>
            {onClose && (
              <Button variant="outlined" onClick={onClose}>
                Close
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    )
  }

  if (!transaction) {
    return (
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Alert severity="info">No transaction data available</Alert>
        </CardContent>
      </Card>
    )
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <Box>
      {/* Header */}
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" fontWeight={600}>
              Transaction Details
            </Typography>
            <Box display="flex" gap={1}>
              {renderStatusBadge()}
              <Tooltip title="Refresh">
                <IconButton onClick={fetchTransactionDetails} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              {onClose && (
                <Button variant="outlined" size="small" onClick={onClose}>
                  Close
                </Button>
              )}
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {transaction.hash}
            {renderCopyButton(transaction.hash, 'Transaction Hash')}
          </Typography>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Basic Information
          </Typography>
          <TableContainer component={Paper} sx={{ background: 'transparent' }}>
            <Table size="small">
              <TableBody>
                {renderDataRow('Block Number', transaction.blockNumber.toLocaleString())}
                {renderDataRow(
                  'Timestamp',
                  new Date(transaction.timestamp).toLocaleString()
                )}
                {renderDataRow('Confirmations', transaction.confirmations.toString())}
                {renderDataRow(
                  'From',
                  <Tooltip title={transaction.from}>
                    <span>{shortenAddress(transaction.from)}</span>
                  </Tooltip>,
                  transaction.from
                )}
                {renderDataRow(
                  'To',
                  <Tooltip title={transaction.to}>
                    <span>{shortenAddress(transaction.to)}</span>
                  </Tooltip>,
                  transaction.to
                )}
                {renderDataRow('Value', `${formatValue(transaction.value)} ETH`)}
                {renderDataRow('Nonce', transaction.nonce.toString())}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Gas Information */}
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Gas Information
          </Typography>
          <TableContainer component={Paper} sx={{ background: 'transparent' }}>
            <Table size="small">
              <TableBody>
                {renderDataRow('Gas Used', transaction.gasUsed.toLocaleString())}
                {renderDataRow('Gas Price', `${formatValue(transaction.gasPrice)} Gwei`)}
                {transaction.maxFeePerGas &&
                  renderDataRow('Max Fee Per Gas', `${formatValue(transaction.maxFeePerGas)} Gwei`)}
                {transaction.maxPriorityFeePerGas &&
                  renderDataRow('Max Priority Fee', `${formatValue(transaction.maxPriorityFeePerGas)} Gwei`)}
                {renderDataRow(
                  'Transaction Fee',
                  `${calculateFee(transaction.gasUsed, transaction.gasPrice)} ETH`
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Input Data */}
      {transaction.input && transaction.input !== '0x' && (
        <Card sx={CARD_STYLE}>
          <CardContent>
            <Accordion sx={{ background: 'transparent', boxShadow: 'none' }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight={600}>
                  Input Data
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {transaction.decodedInput ? (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Method: {transaction.decodedInput.methodName}
                    </Typography>
                    <TableContainer component={Paper} sx={{ background: 'transparent', mt: 2 }}>
                      <Table size="small">
                        <TableBody>
                          {transaction.decodedInput.params.map((param, idx) => (
                            <TableRow key={idx}>
                              <TableCell sx={{ fontWeight: 600 }}>{param.name}</TableCell>
                              <TableCell sx={{ fontFamily: 'monospace' }}>
                                {param.type}
                              </TableCell>
                              <TableCell sx={{ fontFamily: 'monospace' }}>
                                {JSON.stringify(param.value)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ) : (
                  <Paper
                    sx={{
                      p: 2,
                      background: 'rgba(0,0,0,0.2)',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      wordBreak: 'break-all',
                    }}
                  >
                    {transaction.input}
                    {renderCopyButton(transaction.input, 'Input Data')}
                  </Paper>
                )}
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Logs */}
      {transaction.logs && transaction.logs.length > 0 && (
        <Card sx={CARD_STYLE}>
          <CardContent>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Event Logs ({transaction.logs.length})
            </Typography>
            {transaction.logs.map((log, idx) => (
              <Accordion key={idx} sx={{ background: 'transparent', mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="body2">
                    Log {idx} - {shortenAddress(log.address)}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} sx={{ background: 'transparent' }}>
                    <Table size="small">
                      <TableBody>
                        {renderDataRow('Address', shortenAddress(log.address), log.address)}
                        {renderDataRow('Log Index', log.logIndex.toString())}
                        {log.topics.map((topic, topicIdx) => (
                          renderDataRow(`Topic ${topicIdx}`, shortenAddress(topic), topic)
                        ))}
                        {renderDataRow('Data', shortenAddress(log.data), log.data)}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default TransactionDetailsViewer
