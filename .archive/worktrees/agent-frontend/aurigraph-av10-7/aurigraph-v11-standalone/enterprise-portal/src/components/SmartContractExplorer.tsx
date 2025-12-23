/**
 * SmartContractExplorer.tsx
 * List and explore deployed smart contracts with read-only interactions
 * AV11-282, AV11-283: Smart Contract Explorer
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
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Tooltip,
  IconButton,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Code as CodeIcon,
  VerifiedUser as VerifiedIcon,
  UnpublishedOutlined as UnverifiedIcon,
  Search as SearchIcon,
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  PlayArrow as CallIcon,
} from '@mui/icons-material'
import { contractApi } from '../services/phase2Api'
import type { SmartContract, ContractMethod, ContractInteraction } from '../types/phase2'

// ============================================================================
// CONSTANTS
// ============================================================================

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
  marginBottom: 2,
}

const CONTRACT_TYPE_COLORS = {
  ERC20: 'primary',
  ERC721: 'secondary',
  ERC1155: 'info',
  CUSTOM: 'default',
  SYSTEM: 'warning',
} as const

// ============================================================================
// TYPES
// ============================================================================

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const shortenAddress = (address: string, chars: number = 6): string => {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

const formatBalance = (balance: string): string => {
  try {
    const num = parseFloat(balance)
    return num.toLocaleString(undefined, { maximumFractionDigits: 8 })
  } catch {
    return balance
  }
}

// ============================================================================
// TAB PANEL COMPONENT
// ============================================================================

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
)

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const SmartContractExplorer: React.FC = () => {
  const [contracts, setContracts] = useState<SmartContract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [filterType, setFilterType] = useState<string>('')
  const [searchAddress, setSearchAddress] = useState('')

  // Dialog states
  const [selectedContract, setSelectedContract] = useState<SmartContract | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [contractMethods, setContractMethods] = useState<ContractMethod[]>([])
  const [sourceCode, setSourceCode] = useState<string>('')
  const [methodResults, setMethodResults] = useState<Record<string, ContractInteraction>>({})
  const [methodParams, setMethodParams] = useState<Record<string, any[]>>({})

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchContracts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await contractApi.getContracts(
        page + 1,
        rowsPerPage,
        filterType || undefined
      )
      setContracts(response.items)
      setTotalCount(response.totalCount)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch contracts'
      setError(errorMessage)
      console.error('Failed to fetch contracts:', err)
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, filterType])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  // ============================================================================
  // CONTRACT DETAILS
  // ============================================================================

  const openContractDetails = async (contract: SmartContract) => {
    setSelectedContract(contract)
    setDialogOpen(true)
    setTabValue(0)

    try {
      // Fetch contract methods
      const methods = await contractApi.getContractMethods(contract.address)
      setContractMethods(methods)

      // Fetch source code if verified
      if (contract.isVerified) {
        const source = await contractApi.getContractSource(contract.address)
        setSourceCode(source.sourceCode)
      }
    } catch (err) {
      console.error('Failed to fetch contract details:', err)
    }
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setSelectedContract(null)
    setContractMethods([])
    setSourceCode('')
    setMethodResults({})
    setMethodParams({})
  }

  // ============================================================================
  // CONTRACT METHOD INTERACTION
  // ============================================================================

  const callContractMethod = async (method: ContractMethod) => {
    if (!selectedContract) return

    try {
      const params = methodParams[method.name] || []
      const result = await contractApi.callContractMethod(
        selectedContract.address,
        method.name,
        params
      )
      setMethodResults({
        ...methodResults,
        [method.name]: result,
      })
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Method call failed'
      setMethodResults({
        ...methodResults,
        [method.name]: { method: method.name, params: [], error },
      })
    }
  }

  const updateMethodParam = (methodName: string, index: number, value: string) => {
    const params = methodParams[methodName] || []
    const newParams = [...params]
    newParams[index] = value
    setMethodParams({
      ...methodParams,
      [methodName]: newParams,
    })
  }

  // ============================================================================
  // CLIPBOARD
  // ============================================================================

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // ============================================================================
  // RENDER FUNCTIONS
  // ============================================================================

  const renderVerificationBadge = (contract: SmartContract) => (
    <Chip
      icon={contract.isVerified ? <VerifiedIcon /> : <UnverifiedIcon />}
      label={contract.verificationStatus}
      color={contract.isVerified ? 'success' : 'default'}
      size="small"
    />
  )

  const renderContractTable = () => (
    <TableContainer component={Paper} sx={{ background: 'transparent' }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Balance</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Verification</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Deployed</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow key={contract.address} hover>
              <TableCell sx={{ fontFamily: 'monospace' }}>
                <Tooltip title={contract.address}>
                  <span>{shortenAddress(contract.address)}</span>
                </Tooltip>
                <IconButton
                  size="small"
                  onClick={() => copyToClipboard(contract.address)}
                  sx={{ ml: 1 }}
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
              </TableCell>
              <TableCell>{contract.name || 'Unknown'}</TableCell>
              <TableCell>
                <Chip
                  label={contract.type}
                  color={CONTRACT_TYPE_COLORS[contract.type]}
                  size="small"
                />
              </TableCell>
              <TableCell>{formatBalance(contract.balance)} ETH</TableCell>
              <TableCell>{renderVerificationBadge(contract)}</TableCell>
              <TableCell>
                Block {contract.deploymentBlock.toLocaleString()}
              </TableCell>
              <TableCell>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<CodeIcon />}
                  onClick={() => openContractDetails(contract)}
                >
                  Explore
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )

  const renderMethodInteraction = (method: ContractMethod) => {
    const result = methodResults[method.name]
    const params = methodParams[method.name] || []

    return (
      <Accordion key={method.name} sx={{ background: 'rgba(0,0,0,0.2)', mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" width="100%">
            <Typography sx={{ fontFamily: 'monospace', flexGrow: 1 }}>
              {method.name}
            </Typography>
            <Chip
              label={method.stateMutability}
              size="small"
              color={method.stateMutability === 'view' || method.stateMutability === 'pure' ? 'success' : 'warning'}
              sx={{ mr: 1 }}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            {/* Method Inputs */}
            {method.inputs.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Parameters:
                </Typography>
                {method.inputs.map((input, idx) => (
                  <TextField
                    key={idx}
                    label={`${input.name || `param${idx}`} (${input.type})`}
                    fullWidth
                    size="small"
                    value={params[idx] || ''}
                    onChange={(e) => updateMethodParam(method.name, idx, e.target.value)}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
            )}

            {/* Call Button */}
            {(method.stateMutability === 'view' || method.stateMutability === 'pure') && (
              <Button
                variant="contained"
                size="small"
                startIcon={<CallIcon />}
                onClick={() => callContractMethod(method)}
                sx={{ mb: 2 }}
              >
                Call Method
              </Button>
            )}

            {/* Result Display */}
            {result && (
              <Paper sx={{ p: 2, background: 'rgba(0,0,0,0.3)' }}>
                {result.error ? (
                  <Alert severity="error">{result.error}</Alert>
                ) : (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Result:
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                        wordBreak: 'break-all',
                      }}
                    >
                      {JSON.stringify(result.result, null, 2)}
                    </Typography>
                  </Box>
                )}
              </Paper>
            )}
          </Box>
        </AccordionDetails>
      </Accordion>
    )
  }

  // ============================================================================
  // LOADING & ERROR STATES
  // ============================================================================

  if (loading && contracts.length === 0) {
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

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <Box>
      {/* Header & Filters */}
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight={600}>
              Smart Contract Explorer
            </Typography>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchContracts}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Search by Address"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                InputProps={{
                  endAdornment: <SearchIcon />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Filter by Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Filter by Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="ERC20">ERC20</MenuItem>
                  <MenuItem value="ERC721">ERC721</MenuItem>
                  <MenuItem value="ERC1155">ERC1155</MenuItem>
                  <MenuItem value="CUSTOM">Custom</MenuItem>
                  <MenuItem value="SYSTEM">System</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Contracts Table */}
      <Card sx={CARD_STYLE}>
        <CardContent>
          {renderContractTable()}
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10))
              setPage(0)
            }}
          />
        </CardContent>
      </Card>

      {/* Contract Details Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        {selectedContract && (
          <>
            <DialogTitle>
              <Typography variant="h6" fontWeight={600}>
                {selectedContract.name || 'Contract Details'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                {selectedContract.address}
              </Typography>
            </DialogTitle>
            <DialogContent>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                <Tab label="Information" />
                <Tab label="Methods" />
                {selectedContract.isVerified && <Tab label="Source Code" />}
              </Tabs>

              <TabPanel value={tabValue} index={0}>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                        <TableCell>{selectedContract.type}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Balance</TableCell>
                        <TableCell>{formatBalance(selectedContract.balance)} ETH</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Transactions</TableCell>
                        <TableCell>{selectedContract.transactionCount.toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Contract Size</TableCell>
                        <TableCell>{selectedContract.contractSize} bytes</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                        <TableCell>{new Date(selectedContract.createdAt).toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Deployment Block</TableCell>
                        <TableCell>{selectedContract.deploymentBlock.toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                {contractMethods.length > 0 ? (
                  contractMethods.map((method) => renderMethodInteraction(method))
                ) : (
                  <Alert severity="info">No methods available</Alert>
                )}
              </TabPanel>

              {selectedContract.isVerified && (
                <TabPanel value={tabValue} index={2}>
                  <Paper
                    sx={{
                      p: 2,
                      background: 'rgba(0,0,0,0.2)',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      maxHeight: 500,
                      overflow: 'auto',
                    }}
                  >
                    <pre>{sourceCode || 'Loading source code...'}</pre>
                  </Paper>
                </TabPanel>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}

export default SmartContractExplorer
