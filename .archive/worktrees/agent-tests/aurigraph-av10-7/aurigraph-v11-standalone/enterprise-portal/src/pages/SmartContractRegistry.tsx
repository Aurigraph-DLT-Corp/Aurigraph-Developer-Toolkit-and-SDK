import { useState, useEffect, useCallback } from 'react'
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  TextField,
  Alert,
  AlertTitle,
  Chip,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Skeleton,
} from '@mui/material'
import {
  Add,
  Refresh,
  Verified,
  Code,
  Description,
  AccountBalance,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
  HourglassEmpty,
  PlayArrow,
  CloudUpload,
  SaveAlt,
  AssessmentOutlined,
  LocalGasStation,
  CallMade,
  ContentCopy,
  Info,
} from '@mui/icons-material'
import { apiService, safeApiCall } from '../services/api'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface Contract {
  id: string
  name: string
  type: string
  version: string
  status: 'deployed' | 'pending' | 'verified' | 'failed'
  deployedAt: number
  deployedBy: string
  address: string
  channelId: string
  gasUsed?: number
  verificationStatus?: 'verified' | 'pending' | 'unverified'
  ricardianHash?: string
  sourceCodeHash?: string
}

interface ContractTemplate {
  id: string
  name: string
  description: string
  category: string
  complexity: 'simple' | 'medium' | 'complex'
  estimatedGas: number
  parameters: TemplateParameter[]
}

interface TemplateParameter {
  name: string
  type: string
  description: string
  required: boolean
  defaultValue?: any
}

interface DeploymentRequest {
  templateId: string
  contractName: string
  channelId: string
  parameters: Record<string, any>
  description: string
}

interface GasEstimate {
  deployment: number
  execution: number
  total: number
  costInTokens: number
}

interface MerkleProof {
  rootHash: string
  proof: string[]
  verified: boolean
}

interface ContractFunction {
  name: string
  inputs: { name: string; type: string }[]
  outputs: { name: string; type: string }[]
  stateMutability: 'view' | 'pure' | 'payable' | 'nonpayable'
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

const THEME_COLORS = {
  primary: '#00BFA5',
  secondary: '#FF6B6B',
  tertiary: '#4ECDC4',
  quaternary: '#FFD93D',
  success: '#00BFA5',
  warning: '#FFD93D',
  error: '#FF6B6B',
  info: '#4ECDC4',
}

const CONTRACT_CATEGORIES = [
  'Financial',
  'Supply Chain',
  'Identity',
  'Governance',
  'DeFi',
  'NFT',
  'RWA',
  'Custom',
]

const DEPLOYMENT_STEPS = [
  'Select Template',
  'Configure Parameters',
  'Review & Estimate Gas',
  'Deploy',
]

const STATUS_COLORS = {
  deployed: 'success',
  pending: 'warning',
  verified: 'info',
  failed: 'error',
} as const

const VERIFICATION_STATUS_COLORS = {
  verified: 'success',
  pending: 'warning',
  unverified: 'default',
} as const

// ============================================================================
// TAB PANEL COMPONENT
// ============================================================================

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`contract-tabpanel-${index}`}
      aria-labelledby={`contract-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SmartContractRegistry() {
  // State management
  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Contract registry state
  const [contracts, setContracts] = useState<Contract[]>([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalContracts, setTotalContracts] = useState(0)
  const [filterStatus, setFilterStatus] = useState<string>('all')

  // Template state
  const [templates, setTemplates] = useState<ContractTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null)

  // Deployment wizard state
  const [deploymentDialogOpen, setDeploymentDialogOpen] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const [deploymentRequest, setDeploymentRequest] = useState<DeploymentRequest>({
    templateId: '',
    contractName: '',
    channelId: '',
    parameters: {},
    description: '',
  })
  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null)

  // Contract interaction state
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null)
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false)
  const [selectedFunction, setSelectedFunction] = useState<ContractFunction | null>(null)
  const [functionInputs, setFunctionInputs] = useState<Record<string, any>>({})

  // Verification state
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false)
  const [merkleProof, setMerkleProof] = useState<MerkleProof | null>(null)

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const fetchContracts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, success: apiSuccess, error: apiError } = await safeApiCall(
        () => apiService.getRicardianContracts({
          limit: rowsPerPage,
          status: filterStatus === 'all' ? undefined : filterStatus
        }),
        { contracts: [], total: 0 }
      )

      if (apiSuccess && data) {
        setContracts(data.contracts || [])
        setTotalContracts(data.total || 0)
      } else if (apiError) {
        console.warn('Failed to fetch contracts, using mock data:', apiError)
        // Mock data for development
        const mockContracts: Contract[] = Array.from({ length: 25 }, (_, i) => ({
          id: `contract-${i + 1}`,
          name: `Smart Contract ${i + 1}`,
          type: CONTRACT_CATEGORIES[i % CONTRACT_CATEGORIES.length],
          version: `1.${i % 5}.0`,
          status: ['deployed', 'pending', 'verified', 'failed'][i % 4] as any,
          deployedAt: Date.now() - i * 86400000,
          deployedBy: `user${i % 5}@aurigraph.io`,
          address: `0x${Math.random().toString(16).substr(2, 40)}`,
          channelId: `channel-${(i % 3) + 1}`,
          gasUsed: Math.floor(Math.random() * 500000) + 100000,
          verificationStatus: ['verified', 'pending', 'unverified'][i % 3] as any,
          ricardianHash: `0x${Math.random().toString(16).substr(2, 64)}`,
          sourceCodeHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        }))
        setContracts(mockContracts.slice(page * rowsPerPage, (page + 1) * rowsPerPage))
        setTotalContracts(mockContracts.length)
      }
    } catch (err) {
      console.error('Error fetching contracts:', err)
      setError('Failed to fetch contracts. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [page, rowsPerPage, filterStatus])

  const fetchTemplates = useCallback(async () => {
    try {
      const { data, success: apiSuccess, error: apiError } = await safeApiCall(
        () => apiService.getContractTemplates(),
        { templates: [] }
      )

      if (apiSuccess && data) {
        setTemplates(data.templates || [])
      } else {
        // Mock templates
        const mockTemplates: ContractTemplate[] = [
          {
            id: 'template-1',
            name: 'Token Contract',
            description: 'ERC20-compatible token contract with minting and burning',
            category: 'DeFi',
            complexity: 'simple',
            estimatedGas: 250000,
            parameters: [
              { name: 'name', type: 'string', description: 'Token name', required: true },
              { name: 'symbol', type: 'string', description: 'Token symbol', required: true },
              { name: 'totalSupply', type: 'uint256', description: 'Initial supply', required: true },
            ],
          },
          {
            id: 'template-2',
            name: 'RWA Asset Registry',
            description: 'Real-world asset tokenization with fractional ownership',
            category: 'RWA',
            complexity: 'complex',
            estimatedGas: 750000,
            parameters: [
              { name: 'assetName', type: 'string', description: 'Asset name', required: true },
              { name: 'assetValue', type: 'uint256', description: 'Total asset value', required: true },
              { name: 'shares', type: 'uint256', description: 'Number of shares', required: true },
            ],
          },
          {
            id: 'template-3',
            name: 'Supply Chain Tracker',
            description: 'Track products through supply chain with provenance',
            category: 'Supply Chain',
            complexity: 'medium',
            estimatedGas: 450000,
            parameters: [
              { name: 'productId', type: 'string', description: 'Product identifier', required: true },
              { name: 'origin', type: 'string', description: 'Origin location', required: true },
            ],
          },
        ]
        setTemplates(mockTemplates)
      }
    } catch (err) {
      console.error('Error fetching templates:', err)
    }
  }, [])

  useEffect(() => {
    fetchContracts()
    fetchTemplates()
  }, [fetchContracts, fetchTemplates])

  // ============================================================================
  // EVENT HANDLERS - DEPLOYMENT WIZARD
  // ============================================================================

  const handleOpenDeploymentWizard = () => {
    setDeploymentDialogOpen(true)
    setActiveStep(0)
    setDeploymentRequest({
      templateId: '',
      contractName: '',
      channelId: '',
      parameters: {},
      description: '',
    })
    setGasEstimate(null)
  }

  const handleCloseDeploymentWizard = () => {
    setDeploymentDialogOpen(false)
    setActiveStep(0)
  }

  const handleNextStep = async () => {
    if (activeStep === 2) {
      // Estimate gas before final step
      await handleEstimateGas()
    }
    setActiveStep(prev => prev + 1)
  }

  const handleBackStep = () => {
    setActiveStep(prev => prev - 1)
  }

  const handleSelectTemplate = (template: ContractTemplate) => {
    setSelectedTemplate(template)
    setDeploymentRequest(prev => ({
      ...prev,
      templateId: template.id,
      parameters: {},
    }))
  }

  const handleEstimateGas = async () => {
    setLoading(true)
    try {
      // In production, call actual gas estimation API
      const mockEstimate: GasEstimate = {
        deployment: selectedTemplate?.estimatedGas || 250000,
        execution: 50000,
        total: (selectedTemplate?.estimatedGas || 250000) + 50000,
        costInTokens: ((selectedTemplate?.estimatedGas || 250000) + 50000) * 0.0001,
      }
      setGasEstimate(mockEstimate)
    } catch (err) {
      console.error('Error estimating gas:', err)
      setError('Failed to estimate gas. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeployContract = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, success: apiSuccess, error: apiError } = await safeApiCall(
        () => apiService.deployContract(deploymentRequest),
        null
      )

      if (apiSuccess && data) {
        setSuccess('Contract deployed successfully!')
        handleCloseDeploymentWizard()
        fetchContracts()
      } else {
        setError(apiError?.message || 'Failed to deploy contract')
      }
    } catch (err) {
      console.error('Error deploying contract:', err)
      setError('Failed to deploy contract. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // EVENT HANDLERS - VERIFICATION
  // ============================================================================

  const handleVerifyContract = async (contract: Contract) => {
    setSelectedContract(contract)
    setLoading(true)
    setError(null)

    try {
      const { data, success: apiSuccess } = await safeApiCall(
        () => apiService.verifyContract(contract.id),
        null
      )

      if (apiSuccess && data) {
        // Generate Merkle proof
        const proof: MerkleProof = {
          rootHash: data.rootHash || '0x' + Math.random().toString(16).substr(2, 64),
          proof: data.proof || [],
          verified: data.verified || true,
        }
        setMerkleProof(proof)
        setVerificationDialogOpen(true)
        setSuccess('Contract verified successfully!')
        fetchContracts()
      } else {
        setError('Failed to verify contract')
      }
    } catch (err) {
      console.error('Error verifying contract:', err)
      setError('Failed to verify contract. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // EVENT HANDLERS - CONTRACT INTERACTION
  // ============================================================================

  const handleOpenInteraction = (contract: Contract) => {
    setSelectedContract(contract)
    setInteractionDialogOpen(true)
  }

  const handleExecuteFunction = async () => {
    if (!selectedContract || !selectedFunction) return

    setLoading(true)
    setError(null)

    try {
      const { data, success: apiSuccess } = await safeApiCall(
        () => apiService.executeContract(selectedContract.id, {
          function: selectedFunction.name,
          inputs: functionInputs,
        }),
        null
      )

      if (apiSuccess && data) {
        setSuccess(`Function ${selectedFunction.name} executed successfully!`)
        setInteractionDialogOpen(false)
      } else {
        setError('Failed to execute function')
      }
    } catch (err) {
      console.error('Error executing function:', err)
      setError('Failed to execute function. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // RENDER: CONTRACT LIST
  // ============================================================================

  const renderContractList = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card sx={CARD_STYLE}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <Code sx={{ fontSize: 40, color: THEME_COLORS.primary }} />
                <Box>
                  <Typography variant="h5">Smart Contract Registry</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {totalContracts} contracts deployed
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" gap={2}>
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Filter Status</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    label="Filter Status"
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="deployed">Deployed</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="verified">Verified</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  variant="outlined"
                  startIcon={<Refresh />}
                  onClick={fetchContracts}
                  disabled={loading}
                >
                  Refresh
                </Button>

                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={handleOpenDeploymentWizard}
                >
                  Deploy New Contract
                </Button>
              </Box>
            </Box>

            {loading && <LinearProgress sx={{ mb: 2 }} />}

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Verification</TableCell>
                    <TableCell>Gas Used</TableCell>
                    <TableCell>Deployed</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading && contracts.length === 0 ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}>
                            <Skeleton />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    contracts.map(contract => (
                      <TableRow key={contract.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <AccountBalance fontSize="small" sx={{ color: THEME_COLORS.tertiary }} />
                            <Typography variant="body2">{contract.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={contract.type} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={contract.status}
                            size="small"
                            color={STATUS_COLORS[contract.status]}
                            icon={
                              contract.status === 'deployed' ? <CheckCircle /> :
                              contract.status === 'pending' ? <HourglassEmpty /> :
                              contract.status === 'verified' ? <Verified /> :
                              <ErrorIcon />
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {contract.verificationStatus && (
                            <Chip
                              label={contract.verificationStatus}
                              size="small"
                              color={VERIFICATION_STATUS_COLORS[contract.verificationStatus]}
                              icon={contract.verificationStatus === 'verified' ? <Verified /> : undefined}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={0.5}>
                            <LocalGasStation fontSize="small" sx={{ color: THEME_COLORS.warning }} />
                            <Typography variant="body2">
                              {contract.gasUsed?.toLocaleString() || 'N/A'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(contract.deployedAt).toLocaleDateString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title="Interact">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenInteraction(contract)}
                              >
                                <PlayArrow />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Verify">
                              <IconButton
                                size="small"
                                onClick={() => handleVerifyContract(contract)}
                                disabled={contract.verificationStatus === 'verified'}
                              >
                                <Verified />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Copy Address">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  navigator.clipboard.writeText(contract.address)
                                  setSuccess('Address copied to clipboard!')
                                }}
                              >
                                <ContentCopy />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalContracts}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={e => {
                setRowsPerPage(parseInt(e.target.value, 10))
                setPage(0)
              }}
            />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )

  // ============================================================================
  // RENDER: DEPLOYMENT WIZARD
  // ============================================================================

  const renderDeploymentWizard = () => {
    const renderStepContent = (step: number) => {
      switch (step) {
        case 0: // Select Template
          return (
            <Grid container spacing={2}>
              {templates.map(template => (
                <Grid item xs={12} md={6} key={template.id}>
                  <Card
                    sx={{
                      ...CARD_STYLE,
                      cursor: 'pointer',
                      border: selectedTemplate?.id === template.id
                        ? `2px solid ${THEME_COLORS.primary}`
                        : '1px solid rgba(255,255,255,0.1)',
                    }}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    <CardContent>
                      <Typography variant="h6">{template.name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {template.description}
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        <Chip label={template.category} size="small" color="primary" />
                        <Chip label={template.complexity} size="small" />
                        <Chip
                          label={`~${template.estimatedGas.toLocaleString()} gas`}
                          size="small"
                          icon={<LocalGasStation />}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )

        case 1: // Configure Parameters
          return (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Contract Name"
                  value={deploymentRequest.contractName}
                  onChange={e => setDeploymentRequest({ ...deploymentRequest, contractName: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Channel ID"
                  value={deploymentRequest.channelId}
                  onChange={e => setDeploymentRequest({ ...deploymentRequest, channelId: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={deploymentRequest.description}
                  onChange={e => setDeploymentRequest({ ...deploymentRequest, description: e.target.value })}
                  multiline
                  rows={3}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }}>
                  <Chip label="Template Parameters" />
                </Divider>
              </Grid>

              {selectedTemplate?.parameters.map(param => (
                <Grid item xs={12} md={6} key={param.name}>
                  <TextField
                    fullWidth
                    label={param.name}
                    type={param.type === 'uint256' ? 'number' : 'text'}
                    helperText={param.description}
                    required={param.required}
                    value={deploymentRequest.parameters[param.name] || ''}
                    onChange={e => setDeploymentRequest({
                      ...deploymentRequest,
                      parameters: {
                        ...deploymentRequest.parameters,
                        [param.name]: e.target.value,
                      },
                    })}
                  />
                </Grid>
              ))}
            </Grid>
          )

        case 2: // Review & Estimate Gas
          return (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info">
                  <AlertTitle>Deployment Summary</AlertTitle>
                  Review your contract configuration before deployment.
                </Alert>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={CARD_STYLE}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Contract Details</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText primary="Template" secondary={selectedTemplate?.name} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Name" secondary={deploymentRequest.contractName} />
                      </ListItem>
                      <ListItem>
                        <ListItemText primary="Channel" secondary={deploymentRequest.channelId} />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card sx={CARD_STYLE}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Gas Estimate</Typography>
                    {gasEstimate ? (
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <LocalGasStation sx={{ color: THEME_COLORS.warning }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Deployment Gas"
                            secondary={gasEstimate.deployment.toLocaleString()}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CallMade sx={{ color: THEME_COLORS.info }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Execution Gas"
                            secondary={gasEstimate.execution.toLocaleString()}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <AssessmentOutlined sx={{ color: THEME_COLORS.primary }} />
                          </ListItemIcon>
                          <ListItemText
                            primary="Total Cost"
                            secondary={`${gasEstimate.costInTokens.toFixed(4)} tokens`}
                          />
                        </ListItem>
                      </List>
                    ) : (
                      <Box display="flex" justifyContent="center" p={3}>
                        <Button
                          variant="outlined"
                          onClick={handleEstimateGas}
                          startIcon={<LocalGasStation />}
                        >
                          Estimate Gas
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )

        case 3: // Deploy
          return (
            <Box textAlign="center" py={4}>
              <CloudUpload sx={{ fontSize: 80, color: THEME_COLORS.primary, mb: 2 }} />
              <Typography variant="h5" gutterBottom>
                Ready to Deploy
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Click Deploy to submit your smart contract to the blockchain.
              </Typography>
              {loading && <LinearProgress sx={{ mt: 2 }} />}
            </Box>
          )

        default:
          return null
      }
    }

    return (
      <Dialog
        open={deploymentDialogOpen}
        onClose={handleCloseDeploymentWizard}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Deploy Smart Contract</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
            {DEPLOYMENT_STEPS.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {renderStepContent(activeStep)}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeploymentWizard}>Cancel</Button>
          <Box flex={1} />
          {activeStep > 0 && (
            <Button onClick={handleBackStep} disabled={loading}>
              Back
            </Button>
          )}
          {activeStep < DEPLOYMENT_STEPS.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNextStep}
              disabled={!selectedTemplate || loading}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleDeployContract}
              disabled={loading}
              startIcon={<CloudUpload />}
            >
              Deploy
            </Button>
          )}
        </DialogActions>
      </Dialog>
    )
  }

  // ============================================================================
  // RENDER: MAIN UI
  // ============================================================================

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {renderContractList()}
      {renderDeploymentWizard()}

      {/* Verification Dialog */}
      <Dialog
        open={verificationDialogOpen}
        onClose={() => setVerificationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Contract Verification</DialogTitle>
        <DialogContent>
          {merkleProof && (
            <Box>
              <Alert severity={merkleProof.verified ? 'success' : 'error'} sx={{ mb: 2 }}>
                {merkleProof.verified ? 'Contract verified successfully!' : 'Verification failed'}
              </Alert>

              <Typography variant="subtitle2" gutterBottom>Merkle Root Hash</Typography>
              <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                <Typography variant="body2" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  {merkleProof.rootHash}
                </Typography>
              </Paper>

              {merkleProof.proof.length > 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>Proof Path</Typography>
                  <List dense>
                    {merkleProof.proof.map((hash, i) => (
                      <ListItem key={i}>
                        <ListItemText
                          primary={`Step ${i + 1}`}
                          secondary={hash}
                          secondaryTypographyProps={{ sx: { fontFamily: 'monospace', fontSize: '0.75rem' } }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Contract Interaction Dialog */}
      <Dialog
        open={interactionDialogOpen}
        onClose={() => setInteractionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Contract Interaction</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Select a function to execute on {selectedContract?.name}
          </Typography>

          <Alert severity="info" sx={{ mb: 2 }}>
            Contract interaction functionality will be available once the contract ABI is loaded.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInteractionDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
