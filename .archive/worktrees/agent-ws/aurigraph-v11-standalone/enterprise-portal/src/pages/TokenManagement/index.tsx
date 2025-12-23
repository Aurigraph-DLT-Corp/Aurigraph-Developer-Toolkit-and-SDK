import React, { useState, useEffect } from 'react';
import { Container, Paper, CircularProgress, Alert, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button } from '@mui/material';
import { getTokens, Token } from '../../services/TokenManagementService';

/**
 * TokenManagement Component (FDA-7)
 * API Endpoint: /api/v11/tokens/manage
 */
export const TokenManagement: React.FC = () => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getTokens();
        setTokens(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Token Management</Typography>
        <Button variant="contained">Create Token</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Token Symbol</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Total Supply</TableCell>
              <TableCell>Decimals</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tokens.map((token) => (
              <TableRow key={token.symbol}>
                <TableCell>{token.symbol}</TableCell>
                <TableCell>{token.name}</TableCell>
                <TableCell>{token.totalSupply.toLocaleString()}</TableCell>
                <TableCell>{token.decimals}</TableCell>
                <TableCell>{token.status}</TableCell>
                <TableCell>
                  <Button size="small">Edit</Button>
                  <Button size="small" color="error">Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default TokenManagement;
