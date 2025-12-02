import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stepper,
  Step,
  StepLabel,
  Alert,
} from '@mui/material'
import {
  VerifiedUser,
  Security,
  Assignment,
  Description,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Refresh,
  Upload,
  Gavel,
  AccountBalance,
  Shield,
} from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { apiService, safeApiCall } from '../../services/api'

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

const THEME_COLORS = {
  primary: '#00BFA5',
  secondary: '#4ECDC4',
  warning: '#FFD93D',
  success: '#00BFA5',
  error: '#FF6B6B',
}

interface ComplianceStatus {
  category: string
  status: 'Completed' | 'In Progress' | 'Required' | 'Failed'
  icon: JSX.Element
  description: string
  completionDate?: string
}

interface AuditRecord {
  id: string
  action: string
  timestamp: string
  user: string
  status: string
  details: string
}

interface ComplianceRequirement {
  title: string
  description: string
  required: boolean
  completed: boolean
}

const COMPLIANCE_STATUSES: ComplianceStatus[] = [
  {
    category: 'KYC Verification',
    status: 'Completed',
    icon: <VerifiedUser />,
    description: 'Identity verification completed',
    completionDate: '2024-09-15',
  },
  {
    category: 'AML Screening',
    status: 'Completed',
    icon: <Security />,
    description: 'Anti-money laundering checks passed',
    completionDate: '2024-09-15',
  },
  {
    category: 'Accreditation',
    status: 'In Progress',
    icon: <Assignment />,
    description: 'Investor accreditation under review',
  },
  {
    category: 'Tax Compliance',
    status: 'Completed',
    icon: <AccountBalance />,
    description: 'Tax documentation submitted',
    completionDate: '2024-09-20',
  },
  {
    category: 'Regulatory Filing',
    status: 'Required',
    icon: <Gavel />,
    description: 'SEC filing required for next transaction',
  },
]

const AUDIT_TRAIL: AuditRecord[] = [
  {
    id: '1',
    action: 'KYC Document Upload',
    timestamp: '2024-10-18 14:30:00',
    user: 'user@example.com',
    status: 'Success',
    details: 'Driver license and proof of address uploaded',
  },
  {
    id: '2',
    action: 'AML Screening',
    timestamp: '2024-10-18 14:35:00',
    user: 'System',
    status: 'Success',
    details: 'Automated screening completed - No flags',
  },
  {
    id: '3',
    action: 'Asset Tokenization Request',
    timestamp: '2024-10-18 15:00:00',
    user: 'user@example.com',
    status: 'Pending',
    details: 'Manhattan Office Building - Under review',
  },
  {
    id: '4',
    action: 'Compliance Review',
    timestamp: '2024-10-18 15:30:00',
    user: 'Compliance Officer',
    status: 'In Progress',
    details: 'Manual review initiated',
  },
]

const COMPLIANCE_REQUIREMENTS: ComplianceRequirement[] = [
  {
    title: 'Identity Verification (KYC)',
    description: 'Government-issued ID and proof of address',
    required: true,
    completed: true,
  },
  {
    title: 'Anti-Money Laundering (AML) Check',
    description: 'Automated screening against sanctions lists',
    required: true,
    completed: true,
  },
  {
    title: 'Investor Accreditation',
    description: 'Proof of accredited investor status (if applicable)',
    required: false,
    completed: false,
  },
  {
    title: 'Tax Information',
    description: 'W-9 or W-8BEN form submission',
    required: true,
    completed: true,
  },
  {
    title: 'Source of Funds Declaration',
    description: 'Documentation of fund origins',
    required: true,
    completed: true,
  },
  {
    title: 'Regulatory Disclosures',
    description: 'Acknowledge risk disclosures and terms',
    required: true,
    completed: true,
  },
]

const VERIFICATION_STEPS = [
  'Identity Verification',
  'Document Review',
  'AML Screening',
  'Compliance Approval',
  'Account Activation',
]

export default function Compliance() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [complianceData, setComplianceData] = useState<any>(null)
  const activeStep = 3 // Current step in verification process

  const fetchComplianceData = async () => {
    setLoading(true)
    setError(null)

    // Use security audit log endpoint for compliance tracking
    const result = await safeApiCall(
      () => apiService.getSecurityAuditLog({ limit: 10 }),
      { events: [] }
    )

    if (result.success && result.data.events) {
      setComplianceData(result.data)
      // Could transform audit events to compliance status here
    } else if (!result.success) {
      setError(result.error?.message || 'Failed to load compliance data')
      // Keep sample data on error
    }

    setLoading(false)
  }

  const handleRefresh = () => {
    fetchComplianceData()
  }

  useEffect(() => {
    fetchComplianceData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Success':
        return THEME_COLORS.success
      case 'In Progress':
      case 'Pending':
        return THEME_COLORS.warning
      case 'Required':
        return THEME_COLORS.secondary
      case 'Failed':
        return THEME_COLORS.error
      default:
        return 'rgba(255,255,255,0.7)'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
      case 'Success':
        return <CheckCircle sx={{ fontSize: 20, color: THEME_COLORS.success }} />
      case 'In Progress':
      case 'Pending':
        return <Warning sx={{ fontSize: 20, color: THEME_COLORS.warning }} />
      case 'Failed':
        return <ErrorIcon sx={{ fontSize: 20, color: THEME_COLORS.error }} />
      default:
        return null
    }
  }

  const completedRequirements = COMPLIANCE_REQUIREMENTS.filter((r) => r.completed).length
  const totalRequirements = COMPLIANCE_REQUIREMENTS.filter((r) => r.required).length
  const complianceProgress = (completedRequirements / totalRequirements) * 100

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Compliance Monitoring
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            KYC/AML status and regulatory compliance tracking
          </Typography>
        </Box>
        <IconButton
          onClick={handleRefresh}
          sx={{
            bgcolor: 'rgba(0, 191, 165, 0.1)',
            '&:hover': { bgcolor: 'rgba(0, 191, 165, 0.2)' },
          }}
        >
          <Refresh sx={{ color: THEME_COLORS.primary }} />
        </IconButton>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error} - Displaying sample data
        </Alert>
      )}

      {/* Overall Compliance Status */}
      <Card sx={{ ...CARD_STYLE, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h6" sx={{ color: '#fff', mb: 1 }}>
                Overall Compliance Status
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                {completedRequirements} of {totalRequirements} required checks completed
              </Typography>
            </Box>
            <Chip
              label={complianceProgress === 100 ? 'Fully Compliant' : 'In Progress'}
              sx={{
                bgcolor:
                  complianceProgress === 100
                    ? 'rgba(0, 191, 165, 0.2)'
                    : 'rgba(255, 217, 61, 0.2)',
                color: complianceProgress === 100 ? THEME_COLORS.success : THEME_COLORS.warning,
                fontSize: '1rem',
                fontWeight: 700,
                px: 2,
                py: 1,
              }}
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={complianceProgress}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: 'rgba(255,255,255,0.1)',
              '& .MuiLinearProgress-bar': {
                bgcolor: complianceProgress === 100 ? THEME_COLORS.success : THEME_COLORS.warning,
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Verification Process Stepper */}
      <Card sx={{ ...CARD_STYLE, mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3, color: '#fff' }}>
            Verification Process
          </Typography>
          <Stepper activeStep={activeStep} alternativeLabel>
            {VERIFICATION_STEPS.map((label) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': {
                      color: 'rgba(255,255,255,0.7)',
                    },
                    '& .MuiStepLabel-label.Mui-active': {
                      color: THEME_COLORS.primary,
                    },
                    '& .MuiStepLabel-label.Mui-completed': {
                      color: THEME_COLORS.success,
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Compliance Status Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {COMPLIANCE_STATUSES.map((item, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Card sx={{ ...CARD_STYLE, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: `${getStatusColor(item.status)}20`,
                      color: getStatusColor(item.status),
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Chip
                    icon={getStatusIcon(item.status)}
                    label={item.status}
                    size="small"
                    sx={{
                      bgcolor: `${getStatusColor(item.status)}20`,
                      color: getStatusColor(item.status),
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Typography variant="h6" sx={{ color: '#fff', mb: 1, fontWeight: 600 }}>
                  {item.category}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                  {item.description}
                </Typography>
                {item.completionDate && (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    Completed: {new Date(item.completionDate).toLocaleDateString()}
                  </Typography>
                )}
                {item.status === 'Required' && (
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<Upload />}
                    sx={{
                      mt: 2,
                      borderColor: THEME_COLORS.secondary,
                      color: THEME_COLORS.secondary,
                      '&:hover': {
                        borderColor: THEME_COLORS.secondary,
                        bgcolor: 'rgba(78, 205, 196, 0.1)',
                      },
                    }}
                  >
                    Submit Documents
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Compliance Requirements Checklist */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={CARD_STYLE}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
                Compliance Requirements
              </Typography>
              <List>
                {COMPLIANCE_REQUIREMENTS.map((req, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      bgcolor: req.completed
                        ? 'rgba(0, 191, 165, 0.1)'
                        : 'rgba(255,255,255,0.05)',
                    }}
                  >
                    <ListItemIcon>
                      {req.completed ? (
                        <CheckCircle sx={{ color: THEME_COLORS.success }} />
                      ) : (
                        <Warning sx={{ color: THEME_COLORS.warning }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" sx={{ color: '#fff' }}>
                            {req.title}
                          </Typography>
                          {req.required && (
                            <Chip
                              label="Required"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                bgcolor: 'rgba(255, 107, 107, 0.2)',
                                color: THEME_COLORS.error,
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          {req.description}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Audit Trail */}
        <Grid item xs={12} md={6}>
          <Card sx={CARD_STYLE}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#fff' }}>
                Recent Audit Trail
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        Action
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        Timestamp
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {AUDIT_TRAIL.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Typography variant="body2">{record.action}</Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            {record.user}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.75rem' }}>
                          {new Date(record.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <Chip
                            label={record.status}
                            size="small"
                            sx={{
                              bgcolor: `${getStatusColor(record.status)}20`,
                              color: getStatusColor(record.status),
                              fontSize: '0.7rem',
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Regulatory Information */}
      <Card sx={CARD_STYLE}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Shield sx={{ color: THEME_COLORS.primary, mr: 1 }} />
            <Typography variant="h6" sx={{ color: '#fff' }}>
              Regulatory Framework
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(0, 191, 165, 0.1)',
                  border: `1px solid ${THEME_COLORS.primary}`,
                }}
              >
                <Typography variant="subtitle2" sx={{ color: THEME_COLORS.primary, mb: 1 }}>
                  Securities Compliance
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Tokenized assets comply with SEC Regulation D (506c) for accredited investors
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(78, 205, 196, 0.1)',
                  border: `1px solid ${THEME_COLORS.secondary}`,
                }}
              >
                <Typography variant="subtitle2" sx={{ color: THEME_COLORS.secondary, mb: 1 }}>
                  AML/KYC Standards
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Adheres to FinCEN guidance and FATF recommendations for digital assets
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 217, 61, 0.1)',
                  border: `1px solid ${THEME_COLORS.warning}`,
                }}
              >
                <Typography variant="subtitle2" sx={{ color: THEME_COLORS.warning, mb: 1 }}>
                  Data Protection
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  GDPR and CCPA compliant data handling and privacy protection measures
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  )
}
