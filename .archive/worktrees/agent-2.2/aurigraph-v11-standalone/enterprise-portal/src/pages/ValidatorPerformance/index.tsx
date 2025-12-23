import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material';
import { getValidatorPerformance, ValidatorMetrics } from '../../services/ValidatorPerformanceService';

/**
 * ValidatorPerformance Component (FDA-3)
 *
 * Displays validator performance metrics including:
 * - Block production rate
 * - Uptime
 * - Slash history
 * - Rewards
 *
 * API Endpoint: /api/v11/validators/performance
 */
export const ValidatorPerformance: React.FC = () => {
  const [validators, setValidators] = useState<ValidatorMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const data = await getValidatorPerformance();
        setValidators(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setValidators([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Validator Performance
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Validator</TableCell>
              <TableCell>Uptime</TableCell>
              <TableCell>Blocks Produced</TableCell>
              <TableCell>Commission</TableCell>
              <TableCell>Delegators</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {validators.map((v) => (
              <TableRow key={v.address}>
                <TableCell>{v.moniker}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={v.uptime}
                      sx={{ flexGrow: 1, minWidth: 100 }}
                    />
                    {v.uptime}%
                  </Box>
                </TableCell>
                <TableCell>{v.blocksProduced}</TableCell>
                <TableCell>{v.commission}%</TableCell>
                <TableCell>{v.delegatorsCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default ValidatorPerformance;
