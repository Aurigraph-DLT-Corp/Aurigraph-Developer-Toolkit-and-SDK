import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { searchBlocks, BlockSearchResult } from '../../services/BlockSearchService';

/**
 * BlockSearch Component (FDA-2)
 *
 * Allows users to search for blocks by:
 * - Block height
 * - Block hash
 * - Transaction count range
 *
 * API Endpoint: /api/v11/blockchain/blocks/search
 */
export const BlockSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BlockSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await searchBlocks(query);
      setResults(data);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Block Search
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Search for blocks by height, hash, or transaction count
        </Typography>
      </Box>

      {/* Search Box */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Enter block height, hash, or search criteria..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            variant="outlined"
            size="small"
          />
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Search'}
          </Button>
        </Box>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {searched && (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">
              Results: {results.length} block{results.length !== 1 ? 's' : ''} found
            </Typography>
          </Box>

          {results.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Height</TableCell>
                    <TableCell>Hash</TableCell>
                    <TableCell>Validator</TableCell>
                    <TableCell>Transactions</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Size</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.map((block) => (
                    <TableRow key={block.hash}>
                      <TableCell>{block.height}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {block.hash.substring(0, 16)}...
                      </TableCell>
                      <TableCell>{block.validator}</TableCell>
                      <TableCell>{block.transactions}</TableCell>
                      <TableCell>{new Date(block.timestamp).toLocaleString()}</TableCell>
                      <TableCell>{block.size} bytes</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No blocks found matching your search criteria</Alert>
          )}
        </>
      )}
    </Container>
  );
};

export default BlockSearch;
