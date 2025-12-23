import React, { useState, useEffect } from 'react';
import { Container, Paper, CircularProgress, Alert, Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { getRWAAssets, RWAAsset } from '../../services/RWAAssetService';

/**
 * RWAAssetManager Component (FDA-6)
 * API Endpoint: /api/v11/rwa/portfolio
 */
export const RWAAssetManager: React.FC = () => {
  const [assets, setAssets] = useState<RWAAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await getRWAAssets();
        setAssets(data);
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
      <Typography variant="h4" gutterBottom>
        Real-World Asset Portfolio
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
              <TableCell>Asset ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell>{asset.id}</TableCell>
                <TableCell>{asset.name}</TableCell>
                <TableCell>{asset.type}</TableCell>
                <TableCell>${asset.value.toLocaleString()}</TableCell>
                <TableCell>{asset.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default RWAAssetManager;
