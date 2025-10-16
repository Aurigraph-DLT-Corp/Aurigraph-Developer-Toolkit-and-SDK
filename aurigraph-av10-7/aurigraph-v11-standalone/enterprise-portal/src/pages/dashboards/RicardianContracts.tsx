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
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { Description, CheckCircle, Pending, Error as ErrorIcon } from '@mui/icons-material';
import axios from 'axios';

interface RicardianContract {
  id: string;
  title: string;
  parties: string[];
  status: 'draft' | 'pending' | 'active' | 'completed' | 'disputed';
  createdAt: string;
  updatedAt: string;
  signatures: number;
  requiredSignatures: number;
}

const RicardianContracts: React.FC = () => {
  const [contracts, setContracts] = useState<RicardianContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('/api/v11/ricardian/contracts');
        setContracts(response.data.contracts || []);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch Ricardian contracts data');
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return <CheckCircle color="success" />;
      case 'pending':
        return <Pending color="warning" />;
      case 'disputed':
        return <ErrorIcon color="error" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'draft':
        return 'default';
      case 'disputed':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Ricardian Contracts Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const stats = {
    total: contracts.length,
    active: contracts.filter(c => c.status === 'active').length,
    pending: contracts.filter(c => c.status === 'pending').length,
    completed: contracts.filter(c => c.status === 'completed').length,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Ricardian Contracts Dashboard</Typography>
        <Button variant="contained" startIcon={<Description />}>
          Create New Contract
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Total Contracts
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Active Contracts
              </Typography>
              <Typography variant="h4">{stats.active}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Pending Signatures
              </Typography>
              <Typography variant="h4">{stats.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">
                Completed
              </Typography>
              <Typography variant="h4">{stats.completed}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Contracts
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Status</TableCell>
                      <TableCell>Contract ID</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Parties</TableCell>
                      <TableCell>Signatures</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contracts.map((contract) => (
                      <TableRow key={contract.id}>
                        <TableCell>{getStatusIcon(contract.status)}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace' }}>
                          {contract.id.substring(0, 12)}...
                        </TableCell>
                        <TableCell>{contract.title}</TableCell>
                        <TableCell>{contract.parties.join(', ')}</TableCell>
                        <TableCell>
                          {contract.signatures}/{contract.requiredSignatures}
                        </TableCell>
                        <TableCell>{new Date(contract.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button size="small" variant="outlined">
                            View
                          </Button>
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

export default RicardianContracts;
