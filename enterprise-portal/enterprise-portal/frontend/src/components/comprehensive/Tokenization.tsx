import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import { Token, Add, TrendingUp, Image, AttachMoney, Lock } from '@mui/icons-material';

interface TokenData {
  id: string;
  name: string;
  symbol: string;
  type: 'fungible' | 'nft' | 'semi-fungible';
  supply: number;
  decimals: number;
  price: number;
  marketCap: number;
  holders: number;
  icon?: string;
}

interface NFTData {
  id: string;
  name: string;
  collection: string;
  owner: string;
  price: number;
  image: string;
  attributes: Record<string, any>;
}

export const Tokenization: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [tokens, setTokens] = useState<TokenData[]>([
    {
      id: 't1',
      name: 'Aurigraph Token',
      symbol: 'AUR',
      type: 'fungible',
      supply: 1000000000,
      decimals: 18,
      price: 0.5,
      marketCap: 500000000,
      holders: 10000,
    },
    {
      id: 't2',
      name: 'Real Estate Token',
      symbol: 'RET',
      type: 'fungible',
      supply: 100000,
      decimals: 6,
      price: 100,
      marketCap: 10000000,
      holders: 500,
    },
  ]);

  const [nfts] = useState<NFTData[]>([
    {
      id: 'nft1',
      name: 'Digital Art #001',
      collection: 'Aurigraph Genesis',
      owner: '0x123...abc',
      price: 1000,
      image: '/api/placeholder/200/200',
      attributes: { rarity: 'Legendary', edition: 1 },
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [tokenForm, setTokenForm] = useState({
    name: '',
    symbol: '',
    type: 'fungible',
    supply: 1000000,
    decimals: 18,
  });

  const createToken = () => {
    const newToken: TokenData = {
      id: `t_${Date.now()}`,
      name: tokenForm.name,
      symbol: tokenForm.symbol,
      type: tokenForm.type as any,
      supply: tokenForm.supply,
      decimals: tokenForm.decimals,
      price: 0,
      marketCap: 0,
      holders: 0,
    };
    setTokens([...tokens, newToken]);
    setDialogOpen(false);
  };

  const defiPools = [
    { name: 'AUR/USDC', tvl: 5000000, apy: 12.5 },
    { name: 'RET/AUR', tvl: 2000000, apy: 25.3 },
    { name: 'Staking Pool', tvl: 10000000, apy: 8.2 },
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Tokenization Platform
      </Typography>

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Tokens
              </Typography>
              <Typography variant="h4">{tokens.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Market Cap
              </Typography>
              <Typography variant="h4">
                ${tokens.reduce((sum, t) => sum + t.marketCap, 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                NFT Collections
              </Typography>
              <Typography variant="h4">{new Set(nfts.map((n) => n.collection)).size}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total TVL
              </Typography>
              <Typography variant="h4">
                ${defiPools.reduce((sum, p) => sum + p.tvl, 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Tabs
              value={activeTab}
              onChange={(_event: React.SyntheticEvent, value: number) => setActiveTab(value)}
            >
              <Tab label="Tokens" />
              <Tab label="NFTs" />
              <Tab label="DeFi" />
              <Tab label="Token Factory" />
            </Tabs>
            <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
              Create Token
            </Button>
          </Box>

          {/* Tokens Tab */}
          {activeTab === 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Token</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Supply</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Market Cap</TableCell>
                    <TableCell>Holders</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tokens.map((token) => (
                    <TableRow key={token.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Avatar sx={{ width: 24, height: 24 }}>{token.symbol[0]}</Avatar>
                          <Box>
                            <Typography variant="body2">{token.name}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {token.symbol}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={token.type} size="small" />
                      </TableCell>
                      <TableCell>{token.supply.toLocaleString()}</TableCell>
                      <TableCell>${token.price}</TableCell>
                      <TableCell>${token.marketCap.toLocaleString()}</TableCell>
                      <TableCell>{token.holders.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button size="small">Trade</Button>
                        <Button size="small">Info</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* NFTs Tab */}
          {activeTab === 1 && (
            <Grid container spacing={2}>
              {nfts.map((nft) => (
                <Grid item xs={12} md={3} key={nft.id}>
                  <Card>
                    <Box
                      sx={{
                        height: 200,
                        bgcolor: 'grey.200',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Image fontSize="large" />
                    </Box>
                    <CardContent>
                      <Typography variant="h6">{nft.name}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {nft.collection}
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                        {nft.price} AUR
                      </Typography>
                      <Button fullWidth variant="contained" sx={{ mt: 1 }}>
                        Buy Now
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* DeFi Tab */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              {defiPools.map((pool) => (
                <Grid item xs={12} md={4} key={pool.name}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{pool.name}</Typography>
                      <Box sx={{ my: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          Total Value Locked
                        </Typography>
                        <Typography variant="h5">${pool.tvl.toLocaleString()}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">
                          APY
                        </Typography>
                        <Typography variant="h5" color="success.main">
                          {pool.apy}%
                        </Typography>
                      </Box>
                      <Button fullWidth variant="contained">
                        Add Liquidity
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Token Factory Tab */}
          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Quick Token Creation
                </Typography>
                <Card>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Card sx={{ cursor: 'pointer', textAlign: 'center', p: 2 }}>
                          <Token fontSize="large" color="primary" />
                          <Typography variant="h6">ERC-20 Token</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Standard fungible token
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Card sx={{ cursor: 'pointer', textAlign: 'center', p: 2 }}>
                          <Image fontSize="large" color="primary" />
                          <Typography variant="h6">NFT Collection</Typography>
                          <Typography variant="body2" color="textSecondary">
                            ERC-721 NFTs
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Card sx={{ cursor: 'pointer', textAlign: 'center', p: 2 }}>
                          <AttachMoney fontSize="large" color="primary" />
                          <Typography variant="h6">Security Token</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Regulated assets
                          </Typography>
                        </Card>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Card sx={{ cursor: 'pointer', textAlign: 'center', p: 2 }}>
                          <Lock fontSize="large" color="primary" />
                          <Typography variant="h6">Wrapped Token</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Cross-chain assets
                          </Typography>
                        </Card>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Token Templates
                </Typography>
                <List>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <Token />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary="Governance Token" secondary="DAO voting and proposals" />
                    <Button size="small">Use Template</Button>
                  </ListItem>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <AttachMoney />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary="Stablecoin" secondary="Pegged to fiat currency" />
                    <Button size="small">Use Template</Button>
                  </ListItem>
                  <ListItem>
                    <ListItemAvatar>
                      <Avatar>
                        <TrendingUp />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary="Yield Token" secondary="Auto-compounding rewards" />
                    <Button size="small">Use Template</Button>
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Create Token Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Token</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Token Type</InputLabel>
            <Select
              value={tokenForm.type}
              onChange={(e: any) => setTokenForm({ ...tokenForm, type: e.target.value })}
            >
              <MenuItem value="fungible">Fungible (ERC-20)</MenuItem>
              <MenuItem value="nft">Non-Fungible (ERC-721)</MenuItem>
              <MenuItem value="semi-fungible">Semi-Fungible (ERC-1155)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Token Name"
            value={tokenForm.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTokenForm({ ...tokenForm, name: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Token Symbol"
            value={tokenForm.symbol}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTokenForm({ ...tokenForm, symbol: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Total Supply"
            type="number"
            value={tokenForm.supply}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTokenForm({ ...tokenForm, supply: parseInt(e.target.value) })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Decimals"
            type="number"
            value={tokenForm.decimals}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setTokenForm({ ...tokenForm, decimals: parseInt(e.target.value) })
            }
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={createToken}>
            Create Token
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tokenization;
