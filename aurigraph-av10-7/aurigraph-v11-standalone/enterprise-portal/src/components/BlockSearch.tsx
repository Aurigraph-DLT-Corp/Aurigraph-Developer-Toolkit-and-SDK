/**
 * BlockSearch.tsx
 * Block search and filtering UI component
 * Allows users to search blocks by height, hash, validator, date range
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  InputAdornment,
  IconButton,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material'
import { blockSearchApi } from '../services/phase1Api'
import type { BlockInfo, BlockSearchFilters, BlockSearchResult } from '../types/phase1'

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

export const BlockSearch: React.FC = () => {
  const [searchResult, setSearchResult] = useState<BlockSearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [showFilters, setShowFilters] = useState(false)

  // Filter state
  const [filters, setFilters] = useState<BlockSearchFilters>({
    heightFrom: undefined,
    heightTo: undefined,
    dateFrom: undefined,
    dateTo: undefined,
    validator: undefined,
    minTransactions: undefined,
    maxTransactions: undefined,
  })

  // Quick search
  const [quickSearch, setQuickSearch] = useState('')

  const fetchBlocks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await blockSearchApi.searchBlocks(filters, page, pageSize)
      setSearchResult(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search blocks'
      setError(errorMessage)
      console.error('Failed to search blocks:', err)
    } finally {
      setLoading(false)
    }
  }, [filters, page, pageSize])

  useEffect(() => {
    fetchBlocks()
  }, [fetchBlocks])

  const handleSearch = useCallback(() => {
    setPage(1)
    fetchBlocks()
  }, [fetchBlocks])

  const handleQuickSearch = useCallback(async () => {
    if (!quickSearch.trim()) return

    try {
      setLoading(true)
      setError(null)

      // Try to parse as block height
      if (/^\d+$/.test(quickSearch)) {
        const block = await blockSearchApi.getBlockByHeight(parseInt(quickSearch))
        setSearchResult({
          blocks: [block],
          totalCount: 1,
          pageSize: 1,
          currentPage: 1,
        })
      } else {
        // Try as hash
        const block = await blockSearchApi.getBlockByHash(quickSearch)
        setSearchResult({
          blocks: [block],
          totalCount: 1,
          pageSize: 1,
          currentPage: 1,
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Block not found'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [quickSearch])

  const handleClearFilters = useCallback(() => {
    setFilters({
      heightFrom: undefined,
      heightTo: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      validator: undefined,
      minTransactions: undefined,
      maxTransactions: undefined,
    })
    setQuickSearch('')
    setPage(1)
  }, [])

  const handlePageChange = useCallback((_: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }, [])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
  }

  const formatHash = (hash: string) => {
    return `${hash.substring(0, 8)}...${hash.substring(hash.length - 8)}`
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Block Search
      </Typography>

      {/* Quick Search */}
      <Card sx={{ ...CARD_STYLE, mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search by block height or hash..."
                value={quickSearch}
                onChange={(e) => setQuickSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleQuickSearch()}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: quickSearch && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setQuickSearch('')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleQuickSearch}
                  disabled={loading || !quickSearch}
                >
                  Quick Search
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setShowFilters(!showFilters)}
                  startIcon={<FilterIcon />}
                >
                  Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Advanced Filters */}
      <Collapse in={showFilters}>
        <Card sx={{ ...CARD_STYLE, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Advanced Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Height From"
                  type="number"
                  value={filters.heightFrom || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, heightFrom: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Height To"
                  type="number"
                  value={filters.heightTo || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, heightTo: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Date From"
                  type="datetime-local"
                  value={filters.dateFrom || ''}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Date To"
                  type="datetime-local"
                  value={filters.dateTo || ''}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Validator"
                  value={filters.validator || ''}
                  onChange={(e) => setFilters({ ...filters, validator: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Min Transactions"
                  type="number"
                  value={filters.minTransactions || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      minTransactions: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Max Transactions"
                  type="number"
                  value={filters.maxTransactions || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      maxTransactions: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ display: 'flex', gap: 1, height: '100%', alignItems: 'center' }}>
                  <Button fullWidth variant="contained" onClick={handleSearch} disabled={loading}>
                    Apply Filters
                  </Button>
                  <Button variant="outlined" onClick={handleClearFilters}>
                    Clear
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Collapse>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Results */}
      <Card sx={CARD_STYLE}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Search Results {searchResult && `(${searchResult.totalCount} blocks)`}
            </Typography>
            {loading && <CircularProgress size={24} />}
          </Box>

          {searchResult && searchResult.blocks.length > 0 ? (
            <>
              <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Height</TableCell>
                      <TableCell>Hash</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Transactions</TableCell>
                      <TableCell>Validator</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {searchResult.blocks.map((block) => (
                      <TableRow key={block.height} hover>
                        <TableCell>
                          <Chip label={block.height} color="primary" size="small" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {formatHash(block.hash)}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(block.timestamp)}</TableCell>
                        <TableCell>{block.transactionCount}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {formatHash(block.validator)}
                          </Typography>
                        </TableCell>
                        <TableCell>{(block.size / 1024).toFixed(2)} KB</TableCell>
                        <TableCell>
                          <IconButton size="small" title="View Details">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={Math.ceil(searchResult.totalCount / pageSize)}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                />
              </Box>
            </>
          ) : (
            !loading && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="textSecondary">
                  No blocks found. Try adjusting your search criteria.
                </Typography>
              </Box>
            )
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default BlockSearch
