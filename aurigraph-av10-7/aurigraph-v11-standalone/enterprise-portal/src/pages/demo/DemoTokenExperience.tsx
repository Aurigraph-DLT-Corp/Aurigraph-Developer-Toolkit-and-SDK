/**
 * Demo Token Experience
 *
 * Interactive click-through demo showcasing the complete tokenization workflow
 * including all stakeholders, composite tokens, and verification process.
 *
 * @author Aurigraph DLT Development Team
 * @since V12.0.0
 */

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Grid,
  Chip,
  Avatar,
  LinearProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Paper,
  Tabs,
  Tab,
  Badge,
} from '@mui/material'
import {
  PlayArrow,
  Pause,
  SkipNext,
  Replay,
  CheckCircle,
  Schedule,
  Person,
  AccountTree,
  Token,
  Verified,
  Assessment,
  Gavel,
  Security,
  TrendingUp,
  Info,
  Close,
  ExpandMore,
  Image,
  Description,
  PhotoLibrary,
  Timer,
  AutoAwesome,
} from '@mui/icons-material'
import {
  DemoTokenService,
  DemoToken,
  DemoWorkflowStep,
  DemoStakeholder,
  CompositeToken,
  FeaturedAsset,
  FEATURED_ASSETS,
} from '../../services/DemoTokenService'

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

const THEME_COLORS = {
  primary: '#00BFA5',
  secondary: '#4ECDC4',
  warning: '#FFD93D',
  success: '#27AE60',
  error: '#E74C3C',
}

const COMPOSITE_TOKEN_COLORS: Record<string, string> = {
  OWNER: '#4ECDC4',
  COLLATERAL: '#FFD93D',
  MEDIA: '#9B59B6',
  VERIFICATION: '#3498DB',
  VALUATION: '#E74C3C',
  COMPLIANCE: '#27AE60',
}

const STAKEHOLDER_ICONS: Record<string, JSX.Element> = {
  creator: <AutoAwesome />,
  owner: <Person />,
  custodian: <Security />,
  verifier: <Verified />,
  appraiser: <Assessment />,
  legal: <Gavel />,
  compliance: <Security />,
  investor: <TrendingUp />,
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  )
}

export default function DemoTokenExperience() {
  const [searchParams] = useSearchParams()
  const [demoToken, setDemoToken] = useState<DemoToken | null>(null)
  const [activeStep, setActiveStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [workflowSteps, setWorkflowSteps] = useState<DemoWorkflowStep[]>([])
  const [selectedStakeholder, setSelectedStakeholder] = useState<DemoStakeholder | null>(null)
  const [stakeholderDialogOpen, setStakeholderDialogOpen] = useState(false)
  const [tabValue, setTabValue] = useState(0)
  const [remainingTime, setRemainingTime] = useState<{ hours: number; minutes: number } | null>(null)

  // Get asset from URL or default to digital_art
  const assetFromUrl = searchParams.get('asset')
  const initialAssetId = assetFromUrl && FEATURED_ASSETS.some(a => a.id === assetFromUrl)
    ? assetFromUrl
    : 'digital_art'

  const [selectedAssetId, setSelectedAssetId] = useState<string>(initialAssetId)
  const [showAssetSelector, setShowAssetSelector] = useState(!assetFromUrl)

  // Load demo token for selected asset
  const loadDemoToken = (assetId: string) => {
    const token = DemoTokenService.getOrCreateDemoTokenForAsset(assetId)
    if (token) {
      setDemoToken(token)
      setActiveStep(0)
      setIsPlaying(false)
      const time = DemoTokenService.getRemainingTime(token.id)
      setRemainingTime(time)
    }
  }

  useEffect(() => {
    // Initialize demo token with asset from URL or default
    loadDemoToken(initialAssetId)
    setWorkflowSteps(DemoTokenService.getDemoWorkflowSteps())

    // Update remaining time every minute
    const interval = setInterval(() => {
      if (demoToken) {
        const time = DemoTokenService.getRemainingTime(demoToken.id)
        setRemainingTime(time)
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [initialAssetId])

  // Handle asset selection
  const handleAssetSelect = (assetId: string) => {
    setSelectedAssetId(assetId)
    loadDemoToken(assetId)
    setShowAssetSelector(false)
  }

  useEffect(() => {
    // Auto-play functionality
    if (isPlaying && activeStep < workflowSteps.length - 1) {
      const timer = setTimeout(() => {
        setActiveStep(prev => prev + 1)
      }, 3000)
      return () => clearTimeout(timer)
    } else if (activeStep >= workflowSteps.length - 1) {
      setIsPlaying(false)
    }
  }, [isPlaying, activeStep, workflowSteps.length])

  const handleNext = () => {
    setActiveStep(prev => Math.min(prev + 1, workflowSteps.length - 1))
  }

  const handleBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 0))
  }

  const handleReset = () => {
    setActiveStep(0)
    setIsPlaying(false)
  }

  const handleStakeholderClick = (stakeholder: DemoStakeholder) => {
    setSelectedStakeholder(stakeholder)
    setStakeholderDialogOpen(true)
  }

  const handleExtendDemo = () => {
    if (demoToken) {
      DemoTokenService.extendTokenExpiry(demoToken.id)
      const time = DemoTokenService.getRemainingTime(demoToken.id)
      setRemainingTime(time)
    }
  }

  if (!demoToken) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <LinearProgress sx={{ width: 200 }} />
      </Box>
    )
  }

  const currentStep = workflowSteps[activeStep]
  const currentStakeholder = currentStep
    ? DemoTokenService.getStakeholder(currentStep.stakeholder)
    : null

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Featured Assets Selector */}
      <Card sx={{ ...CARD_STYLE, mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                Select Tokenization Use Case
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                Choose an asset type to explore the complete tokenization workflow
              </Typography>
            </Box>
            <Button
              variant="text"
              onClick={() => setShowAssetSelector(!showAssetSelector)}
              sx={{ color: THEME_COLORS.primary }}
            >
              {showAssetSelector ? 'Hide' : 'Change Asset'}
            </Button>
          </Box>

          {showAssetSelector && (
            <Grid container spacing={2}>
              {FEATURED_ASSETS.map((asset) => (
                <Grid item xs={12} sm={6} md={3} key={asset.id}>
                  <Paper
                    onClick={() => handleAssetSelect(asset.id)}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      bgcolor: selectedAssetId === asset.id
                        ? 'rgba(0, 191, 165, 0.15)'
                        : 'rgba(255,255,255,0.03)',
                      border: selectedAssetId === asset.id
                        ? `2px solid ${THEME_COLORS.primary}`
                        : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.08)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Typography sx={{ fontSize: '1.8rem' }}>{asset.icon}</Typography>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: selectedAssetId === asset.id ? THEME_COLORS.primary : '#fff',
                            fontWeight: 600,
                            lineHeight: 1.2,
                          }}
                        >
                          {asset.useCase}
                        </Typography>
                      </Box>
                      {selectedAssetId === asset.id && (
                        <CheckCircle sx={{ color: THEME_COLORS.primary, fontSize: 20 }} />
                      )}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'rgba(255,255,255,0.7)',
                        display: 'block',
                        mb: 1,
                      }}
                    >
                      {asset.name}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {asset.highlights.slice(0, 2).map((h, i) => (
                        <Chip
                          key={i}
                          label={h}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            bgcolor: 'rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.7)',
                          }}
                        />
                      ))}
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: THEME_COLORS.secondary,
                        fontWeight: 600,
                        display: 'block',
                        mt: 1,
                      }}
                    >
                      ${asset.value.toLocaleString()} {asset.currency}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}

          {!showAssetSelector && (
            <Alert
              severity="info"
              sx={{
                bgcolor: 'rgba(0, 191, 165, 0.1)',
                color: '#fff',
                '& .MuiAlert-icon': { color: THEME_COLORS.primary },
              }}
            >
              <Typography variant="body2">
                Currently viewing: <strong>{FEATURED_ASSETS.find(a => a.id === selectedAssetId)?.useCase}</strong>
                {' '} - {FEATURED_ASSETS.find(a => a.id === selectedAssetId)?.name}
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Header */}
      <Card sx={{ ...CARD_STYLE, mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={demoToken.imageUrl}
                  sx={{ width: 80, height: 80, border: `3px solid ${THEME_COLORS.primary}` }}
                />
                <Box>
                  <Typography variant="h5" sx={{ color: '#fff', fontWeight: 600 }}>
                    {demoToken.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip
                      label={demoToken.symbol}
                      size="small"
                      sx={{ bgcolor: THEME_COLORS.primary, color: '#fff' }}
                    />
                    <Chip
                      label={demoToken.assetType.replace('_', ' ')}
                      size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' }}
                    />
                    <Chip
                      icon={<CheckCircle sx={{ color: THEME_COLORS.success + ' !important' }} />}
                      label={demoToken.status.toUpperCase()}
                      size="small"
                      sx={{ bgcolor: 'rgba(39, 174, 96, 0.2)', color: THEME_COLORS.success }}
                    />
                  </Box>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, flexWrap: 'wrap' }}>
                <Paper
                  sx={{
                    px: 2,
                    py: 1,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Timer sx={{ color: THEME_COLORS.warning }} />
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      Demo Expires In
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                      {remainingTime
                        ? `${remainingTime.hours}h ${remainingTime.minutes}m`
                        : 'Expired'}
                    </Typography>
                  </Box>
                </Paper>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleExtendDemo}
                  sx={{ borderColor: THEME_COLORS.primary, color: THEME_COLORS.primary }}
                >
                  Extend 48h
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Card sx={{ ...CARD_STYLE, mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          sx={{
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.6)' },
            '& .Mui-selected': { color: THEME_COLORS.primary },
            '& .MuiTabs-indicator': { backgroundColor: THEME_COLORS.primary },
          }}
        >
          <Tab label="Workflow Demo" icon={<PlayArrow />} iconPosition="start" />
          <Tab label="Stakeholders" icon={<Person />} iconPosition="start" />
          <Tab label="Composite Tokens" icon={<AccountTree />} iconPosition="start" />
          <Tab label="Timeline" icon={<Schedule />} iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <CardContent>
            {/* Playback Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
              <IconButton
                onClick={handleReset}
                sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' } }}
              >
                <Replay />
              </IconButton>
              <IconButton
                onClick={handleBack}
                disabled={activeStep === 0}
                sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' } }}
              >
                <SkipNext sx={{ transform: 'rotate(180deg)' }} />
              </IconButton>
              <IconButton
                onClick={() => setIsPlaying(!isPlaying)}
                sx={{
                  bgcolor: THEME_COLORS.primary,
                  color: '#fff',
                  '&:hover': { bgcolor: THEME_COLORS.secondary },
                  width: 56,
                  height: 56,
                }}
              >
                {isPlaying ? <Pause /> : <PlayArrow />}
              </IconButton>
              <IconButton
                onClick={handleNext}
                disabled={activeStep === workflowSteps.length - 1}
                sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#fff' } }}
              >
                <SkipNext />
              </IconButton>
            </Box>

            {/* Progress Bar */}
            <Box sx={{ mb: 3 }}>
              <LinearProgress
                variant="determinate"
                value={(activeStep / (workflowSteps.length - 1)) * 100}
                sx={{
                  height: 8,
                  borderRadius: 4,
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '& .MuiLinearProgress-bar': { bgcolor: THEME_COLORS.primary },
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5, display: 'block', textAlign: 'center' }}
              >
                Step {activeStep + 1} of {workflowSteps.length}
              </Typography>
            </Box>

            {/* Current Step Details */}
            {currentStep && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.05)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: THEME_COLORS.primary,
                          width: 48,
                          height: 48,
                        }}
                      >
                        {STAKEHOLDER_ICONS[currentStep.stakeholder]}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ color: '#fff' }}>
                          {currentStep.title}
                        </Typography>
                        <Chip
                          label={currentStep.duration}
                          size="small"
                          icon={<Schedule sx={{ color: 'rgba(255,255,255,0.6) !important' }} />}
                          sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
                        />
                      </Box>
                    </Box>

                    <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
                      {currentStep.description}
                    </Typography>

                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />

                    <Typography variant="subtitle2" sx={{ color: THEME_COLORS.primary, mb: 1 }}>
                      Actions Performed:
                    </Typography>
                    <List dense>
                      {currentStep.actions.map((action, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircle sx={{ color: THEME_COLORS.success, fontSize: 18 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={action}
                            primaryTypographyProps={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.05)' }}>
                    <Typography variant="subtitle2" sx={{ color: THEME_COLORS.secondary, mb: 2 }}>
                      Key Highlights
                    </Typography>
                    {currentStep.highlights.map((highlight, idx) => (
                      <Alert
                        key={idx}
                        severity="info"
                        icon={<Info />}
                        sx={{
                          mb: 1,
                          bgcolor: 'rgba(52, 152, 219, 0.1)',
                          color: 'rgba(255,255,255,0.9)',
                          '& .MuiAlert-icon': { color: THEME_COLORS.secondary },
                        }}
                      >
                        {highlight}
                      </Alert>
                    ))}

                    {currentStakeholder && (
                      <Box sx={{ mt: 3 }}>
                        <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                          Current Actor
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            p: 2,
                            bgcolor: 'rgba(255,255,255,0.05)',
                            borderRadius: 2,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                          }}
                          onClick={() => handleStakeholderClick(currentStakeholder)}
                        >
                          <Avatar src={currentStakeholder.avatar} />
                          <Box>
                            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                              {currentStakeholder.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                              {currentStakeholder.organization}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            )}

            {/* Step Overview */}
            <Box sx={{ mt: 3 }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {workflowSteps.map((step, index) => (
                  <Step key={step.id}>
                    <StepLabel
                      StepIconProps={{
                        sx: {
                          color:
                            index <= activeStep
                              ? THEME_COLORS.primary
                              : 'rgba(255,255,255,0.3)',
                          '&.Mui-active': { color: THEME_COLORS.primary },
                          '&.Mui-completed': { color: THEME_COLORS.success },
                        },
                      }}
                      sx={{
                        '& .MuiStepLabel-label': {
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '0.7rem',
                        },
                      }}
                    >
                      {step.title}
                    </StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
              All Stakeholders ({demoToken.stakeholders.length})
            </Typography>
            <Grid container spacing={2}>
              {demoToken.stakeholders.map(stakeholder => (
                <Grid item xs={12} sm={6} md={3} key={stakeholder.id}>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: 'rgba(255,255,255,0.05)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.1)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => handleStakeholderClick(stakeholder)}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                          stakeholder.verified ? (
                            <CheckCircle
                              sx={{ fontSize: 16, color: THEME_COLORS.success, bgcolor: '#1A1F3A', borderRadius: '50%' }}
                            />
                          ) : null
                        }
                      >
                        <Avatar src={stakeholder.avatar} sx={{ width: 48, height: 48 }} />
                      </Badge>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{ color: '#fff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {stakeholder.name}
                        </Typography>
                        <Chip
                          label={stakeholder.role.toUpperCase()}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(0, 191, 165, 0.2)',
                            color: THEME_COLORS.primary,
                            fontSize: '0.65rem',
                            height: 20,
                          }}
                        />
                      </Box>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}
                    >
                      {stakeholder.organization}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
              Composite Token Topology
            </Typography>

            {/* Primary Token */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
              <Box
                sx={{
                  bgcolor: THEME_COLORS.primary,
                  borderRadius: '50%',
                  width: 100,
                  height: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 30px ${THEME_COLORS.primary}40`,
                }}
              >
                <Token sx={{ color: '#fff', fontSize: 32 }} />
                <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600 }}>
                  PRIMARY
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#fff', mt: 1, fontWeight: 500 }}>
                {demoToken.name}
              </Typography>
              <Chip label="ERC-721" size="small" sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' }} />
            </Box>

            {/* Secondary Tokens */}
            <Grid container spacing={2}>
              {demoToken.compositeTokens.map(token => (
                <Grid item xs={12} sm={6} md={4} key={token.tokenId}>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: 'rgba(255,255,255,0.05)',
                      borderLeft: `4px solid ${COMPOSITE_TOKEN_COLORS[token.type]}`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: `${COMPOSITE_TOKEN_COLORS[token.type]}20`,
                          color: COMPOSITE_TOKEN_COLORS[token.type],
                        }}
                      >
                        {token.type === 'MEDIA' ? <PhotoLibrary /> : <Token />}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                          {token.type} Token
                        </Typography>
                        <Chip
                          label={token.standard}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '0.65rem',
                            height: 18,
                          }}
                        />
                      </Box>
                      <Chip
                        label={token.status}
                        size="small"
                        sx={{
                          ml: 'auto',
                          bgcolor:
                            token.status === 'verified'
                              ? 'rgba(39, 174, 96, 0.2)'
                              : 'rgba(255, 217, 61, 0.2)',
                          color:
                            token.status === 'verified' ? THEME_COLORS.success : THEME_COLORS.warning,
                          fontSize: '0.65rem',
                        }}
                      />
                    </Box>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 1 }} />
                    {Object.entries(token.data).slice(0, 3).map(([key, value]) => {
                      // Ensure value is a string before rendering
                      const displayValue = typeof value === 'string' ? value : JSON.stringify(value)
                      return (
                        <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: '60%', textAlign: 'right' }}
                          >
                            {displayValue.length > 30 ? displayValue.substring(0, 30) + '...' : displayValue}
                          </Typography>
                        </Box>
                      )
                    })}
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <CardContent>
            <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
              Complete Timeline
            </Typography>
            <Stepper orientation="vertical" activeStep={demoToken.timeline.length}>
              {demoToken.timeline.map((item, index) => (
                <Step key={item.step} completed>
                  <StepLabel
                    StepIconProps={{
                      sx: { color: THEME_COLORS.success },
                    }}
                    sx={{
                      '& .MuiStepLabel-label': { color: '#fff' },
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ color: '#fff' }}>
                      {item.title}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                      {item.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        icon={<Person sx={{ color: 'rgba(255,255,255,0.6) !important' }} />}
                        label={item.actor}
                        sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
                      />
                      <Chip
                        size="small"
                        icon={<Schedule sx={{ color: 'rgba(255,255,255,0.6) !important' }} />}
                        label={
                          item.completedAt
                            ? new Date(item.completedAt).toLocaleDateString()
                            : 'Pending'
                        }
                        sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
                      />
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </TabPanel>
      </Card>

      {/* Stakeholder Dialog */}
      <Dialog
        open={stakeholderDialogOpen}
        onClose={() => setStakeholderDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { ...CARD_STYLE } }}
      >
        {selectedStakeholder && (
          <>
            <DialogTitle sx={{ color: '#fff', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar src={selectedStakeholder.avatar} sx={{ width: 56, height: 56 }} />
              <Box>
                <Typography variant="h6">{selectedStakeholder.name}</Typography>
                <Chip
                  label={selectedStakeholder.role.toUpperCase()}
                  size="small"
                  sx={{ bgcolor: THEME_COLORS.primary, color: '#fff' }}
                />
              </Box>
              <IconButton
                onClick={() => setStakeholderDialogOpen(false)}
                sx={{ ml: 'auto', color: 'rgba(255,255,255,0.7)' }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 0.5 }}>
                Organization
              </Typography>
              <Typography sx={{ color: '#fff', mb: 2 }}>{selectedStakeholder.organization}</Typography>

              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                Permissions
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                {selectedStakeholder.permissions.map(perm => (
                  <Chip
                    key={perm}
                    label={perm.replace('_', ' ')}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}
                  />
                ))}
              </Box>

              <Alert
                severity={selectedStakeholder.verified ? 'success' : 'warning'}
                sx={{
                  bgcolor: selectedStakeholder.verified
                    ? 'rgba(39, 174, 96, 0.1)'
                    : 'rgba(255, 217, 61, 0.1)',
                  color: '#fff',
                }}
              >
                {selectedStakeholder.verified
                  ? 'Identity verified on Aurigraph DLT'
                  : 'Verification pending'}
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setStakeholderDialogOpen(false)}
                sx={{ color: THEME_COLORS.primary }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  )
}
