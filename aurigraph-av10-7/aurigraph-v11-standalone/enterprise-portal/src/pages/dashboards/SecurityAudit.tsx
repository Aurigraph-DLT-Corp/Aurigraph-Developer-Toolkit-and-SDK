import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Shield, Warning, Error as ErrorIcon, Security } from '@mui/icons-material';
import axios from 'axios';

interface SecurityEvent {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  source: string;
  resolved: boolean;
}

interface SecurityMetrics {
  securityScore: number;
  encryptionStatus: 'enabled' | 'disabled';
  quantumResistance: boolean;
  activeThreats: number;
  resolvedThreats: number;
  recentEvents: SecurityEvent[];
  cryptoAlgorithms: Array<{
    name: string;
    status: 'active' | 'deprecated';
    strength: string;
  }>;
}

const SecurityAudit: React.FC = () => {
  const [data, setData] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/v11/security/audit');
        setData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch security audit data');
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Security & Audit Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'No data available'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Security & Audit Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Shield color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Security Score
                </Typography>
              </Box>
              <Typography variant="h4">{data.securityScore}/100</Typography>
              <LinearProgress
                variant="determinate"
                value={data.securityScore}
                color={data.securityScore > 80 ? 'success' : 'error'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Security color="primary" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Encryption
                </Typography>
              </Box>
              <Chip
                label={data.encryptionStatus.toUpperCase()}
                color={data.encryptionStatus === 'enabled' ? 'success' : 'error'}
              />
              <Typography variant="body2" sx={{ mt: 1 }}>
                Quantum Resistant: {data.quantumResistance ? 'Yes' : 'No'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Active Threats
                </Typography>
              </Box>
              <Typography variant="h4">{data.activeThreats}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning color="success" sx={{ mr: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">
                  Resolved Threats
                </Typography>
              </Box>
              <Typography variant="h4">{data.resolvedThreats}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Cryptographic Algorithms
              </Typography>
              <Grid container spacing={2}>
                {data.cryptoAlgorithms.map((algo, index) => (
                  <Grid item xs={12} key={index}>
                    <Box
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="subtitle2">{algo.name}</Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip
                          label={algo.status.toUpperCase()}
                          color={algo.status === 'active' ? 'success' : 'warning'}
                          size="small"
                        />
                        <Chip label={algo.strength} size="small" />
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {data.activeThreats > 0 && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {data.activeThreats} active security threat(s) detected. Immediate action required.
            </Alert>
          )}
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Security Events
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.recentEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>{new Date(event.timestamp).toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip
                            label={event.severity.toUpperCase()}
                            color={getSeverityColor(event.severity) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{event.type}</TableCell>
                        <TableCell>{event.description}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>{event.source}</TableCell>
                        <TableCell>
                          <Chip
                            label={event.resolved ? 'RESOLVED' : 'ACTIVE'}
                            color={event.resolved ? 'success' : 'error'}
                            size="small"
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
    </Box>
  );
};

export default SecurityAudit;
