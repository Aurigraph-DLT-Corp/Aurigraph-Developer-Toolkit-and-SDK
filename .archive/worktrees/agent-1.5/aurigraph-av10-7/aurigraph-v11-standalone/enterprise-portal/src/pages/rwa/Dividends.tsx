import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  IconButton,
  Button,
} from '@mui/material'
import {
  Payments,
  TrendingUp,
  CalendarToday,
  AccountBalance,
  Refresh,
  Download,
  CheckCircle,
  Schedule,
  PendingActions,
} from '@mui/icons-material'
import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

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

interface DividendPayment {
  id: string
  assetName: string
  paymentDate: string
  amount: number
  status: 'Paid' | 'Pending' | 'Scheduled'
  tokensOwned: number
  perTokenAmount: number
}

interface DividendSchedule {
  assetName: string
  nextPaymentDate: string
  estimatedAmount: number
  frequency: string
}

const SAMPLE_DIVIDEND_HISTORY: DividendPayment[] = [
  {
    id: '1',
    assetName: 'Manhattan Office Building',
    paymentDate: '2024-10-01',
    amount: 2500,
    status: 'Paid',
    tokensOwned: 100,
    perTokenAmount: 25,
  },
  {
    id: '2',
    assetName: 'Gold Reserves',
    paymentDate: '2024-10-15',
    amount: 750,
    status: 'Paid',
    tokensOwned: 300,
    perTokenAmount: 2.5,
  },
  {
    id: '3',
    assetName: 'Manhattan Office Building',
    paymentDate: '2024-11-01',
    amount: 2500,
    status: 'Pending',
    tokensOwned: 100,
    perTokenAmount: 25,
  },
  {
    id: '4',
    assetName: 'Picasso Art Collection',
    paymentDate: '2024-11-15',
    amount: 1200,
    status: 'Scheduled',
    tokensOwned: 50,
    perTokenAmount: 24,
  },
]

const SAMPLE_SCHEDULE: DividendSchedule[] = [
  {
    assetName: 'Manhattan Office Building',
    nextPaymentDate: '2024-11-01',
    estimatedAmount: 2500,
    frequency: 'Monthly',
  },
  {
    assetName: 'Gold Reserves',
    nextPaymentDate: '2024-11-15',
    estimatedAmount: 750,
    frequency: 'Monthly',
  },
  {
    assetName: 'Picasso Art Collection',
    nextPaymentDate: '2024-11-15',
    estimatedAmount: 1200,
    frequency: 'Quarterly',
  },
]

const DIVIDEND_BREAKDOWN_DATA = [
  { name: 'Real Estate', value: 5000, color: THEME_COLORS.primary },
  { name: 'Commodities', value: 1500, color: THEME_COLORS.secondary },
  { name: 'Art', value: 1200, color: THEME_COLORS.warning },
]

export default function Dividends() {
  const [dividendHistory] = useState<DividendPayment[]>(SAMPLE_DIVIDEND_HISTORY)
  const [schedule] = useState<DividendSchedule[]>(SAMPLE_SCHEDULE)
  const [loading, setLoading] = useState(false)

  const handleRefresh = () => {
    setLoading(true)
    // TODO: Fetch from API
    setTimeout(() => setLoading(false), 1000)
  }

  const totalEarnings = dividendHistory
    .filter((d) => d.status === 'Paid')
    .reduce((sum, d) => sum + d.amount, 0)

  const pendingPayments = dividendHistory
    .filter((d) => d.status === 'Pending')
    .reduce((sum, d) => sum + d.amount, 0)

  const upcomingPayments = dividendHistory
    .filter((d) => d.status === 'Scheduled')
    .reduce((sum, d) => sum + d.amount, 0)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle sx={{ fontSize: 20, color: THEME_COLORS.success }} />
      case 'Pending':
        return <PendingActions sx={{ fontSize: 20, color: THEME_COLORS.warning }} />
      case 'Scheduled':
        return <Schedule sx={{ fontSize: 20, color: THEME_COLORS.secondary }} />
      default:
        return null
    }
  }

  const getStatusChip = (status: string) => {
    const statusConfig = {
      Paid: { bgcolor: 'rgba(0, 191, 165, 0.2)', color: THEME_COLORS.success },
      Pending: { bgcolor: 'rgba(255, 217, 61, 0.2)', color: THEME_COLORS.warning },
      Scheduled: { bgcolor: 'rgba(78, 205, 196, 0.2)', color: THEME_COLORS.secondary },
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    return <Chip label={status} size="small" sx={{ ...config, fontWeight: 600 }} />
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Dividend Distribution Tracker
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Track and manage dividend payments from tokenized assets
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={handleRefresh}
            sx={{
              bgcolor: 'rgba(0, 191, 165, 0.1)',
              '&:hover': { bgcolor: 'rgba(0, 191, 165, 0.2)' },
            }}
          >
            <Refresh sx={{ color: THEME_COLORS.primary }} />
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<Download />}
            sx={{
              borderColor: 'rgba(255,255,255,0.2)',
              color: '#fff',
              '&:hover': {
                borderColor: THEME_COLORS.primary,
                bgcolor: 'rgba(0, 191, 165, 0.1)',
              },
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Payments sx={{ color: THEME_COLORS.primary, mr: 1 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Total Earnings
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff' }}>
                ${totalEarnings.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
                All time
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PendingActions sx={{ color: THEME_COLORS.warning, mr: 1 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Pending Payments
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: THEME_COLORS.warning }}>
                ${pendingPayments.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
                Processing
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Schedule sx={{ color: THEME_COLORS.secondary, mr: 1 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Upcoming Payments
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: THEME_COLORS.secondary }}>
                ${upcomingPayments.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
                Scheduled
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={CARD_STYLE}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CalendarToday sx={{ color: THEME_COLORS.primary, mr: 1 }} />
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Next Payment
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff' }}>
                Nov 1, 2024
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
                $2,500 estimated
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts and Schedule */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Dividend Breakdown Chart */}
        <Grid item xs={12} md={5}>
          <Card sx={CARD_STYLE}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, color: '#fff' }}>
                Dividend Distribution by Asset Type
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={DIVIDEND_BREAKDOWN_DATA}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: $${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {DIVIDEND_BREAKDOWN_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1A1F3A',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Schedule */}
        <Grid item xs={12} md={7}>
          <Card sx={CARD_STYLE}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, color: '#fff' }}>
                Payment Schedule
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {schedule.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 600 }}>
                        {item.assetName}
                      </Typography>
                      <Chip
                        label={item.frequency}
                        size="small"
                        sx={{
                          bgcolor: 'rgba(0, 191, 165, 0.2)',
                          color: THEME_COLORS.primary,
                        }}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                          Next Payment: {new Date(item.nextPaymentDate).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ color: THEME_COLORS.primary, fontWeight: 700 }}>
                        ${item.estimatedAmount.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment History Table */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={CARD_STYLE}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3, color: '#fff' }}>
                Payment History
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        Asset
                      </TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        Date
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        Tokens Owned
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        Per Token
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        Amount
                      </TableCell>
                      <TableCell align="center" sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dividendHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell sx={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          {payment.assetName}
                        </TableCell>
                        <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          {payment.tokensOwned}
                        </TableCell>
                        <TableCell align="right" sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          ${payment.perTokenAmount.toFixed(2)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: THEME_COLORS.primary, fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          ${payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          {getStatusChip(payment.status)}
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
    </Box>
  )
}
