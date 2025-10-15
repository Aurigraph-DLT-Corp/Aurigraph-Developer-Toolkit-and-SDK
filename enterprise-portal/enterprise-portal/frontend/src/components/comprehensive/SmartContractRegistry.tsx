import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, TextField, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, FormControl, InputLabel, Select, MenuItem, Badge, Tooltip,
  List, ListItem, ListItemText, ListItemSecondaryAction, ListItemIcon,
  Accordion, AccordionSummary, AccordionDetails, LinearProgress, Switch,
  FormControlLabel, Checkbox, InputAdornment, CircularProgress
} from '@mui/material';
import {
  Code, Upload, PlayArrow, Stop, Check, Close, Warning, Info,
  ExpandMore, Search, FilterList, Download, Security, Speed,
  Storage, VerifiedUser, Description, History, GitHub, ContentCopy,
  Gavel, AttachMoney, AccountTree, Functions, BugReport, CheckCircle
} from '@mui/icons-material';
// Syntax highlighting removed for build compatibility
import { channelService } from '../../services/ChannelService';
import { contractsApi, Contract as ApiContract } from '../../services/contractsApi';

// Smart Contract Types
interface SmartContract {
  id: string;
  name: string;
  version: string;
  channelId: string;
  address?: string;
  deployedBy: string;
  deployedAt: Date;
  status: 'deployed' | 'pending' | 'failed' | 'auditing';
  language: 'solidity' | 'vyper' | 'rust' | 'go' | 'javascript';
  abi: any[];
  bytecode: string;
  sourceCode?: string;
  verified: boolean;
  audited: boolean;
  auditReports?: AuditReport[];
  gasUsed?: number;
  tags: string[];
  methods: ContractMethod[];
  events: ContractEvent[];
  usage: {
    totalCalls: number;
    dailyCalls: number;
    uniqueUsers: number;
    gasSpent: number;
  };
}

interface ContractMethod {
  name: string;
  type: 'function' | 'constructor' | 'fallback';
  visibility: 'public' | 'private' | 'internal' | 'external';
  stateMutability: 'pure' | 'view' | 'nonpayable' | 'payable';
  inputs: Array<{ name: string; type: string }>;
  outputs: Array<{ name: string; type: string }>;
}

interface ContractEvent {
  name: string;
  inputs: Array<{ name: string; type: string; indexed: boolean }>;
}

interface AuditReport {
  id: string;
  auditor: string;
  date: Date;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  issues: number;
  status: 'passed' | 'failed' | 'pending';
  report: string;
}

// Contract Templates
const contractTemplates = [
  {
    id: 'erc20',
    name: 'ERC-20 Token',
    language: 'solidity',
    description: 'Standard fungible token contract',
    code: `pragma solidity ^0.8.0;

contract ERC20Token {
    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;
    uint256 public totalSupply;
    string public name;
    string public symbol;
    uint8 public decimals;

    constructor(string memory _name, string memory _symbol, uint256 _supply) {
        name = _name;
        symbol = _symbol;
        decimals = 18;
        totalSupply = _supply * 10**decimals;
        balances[msg.sender] = totalSupply;
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
        return true;
    }
}`
  },
  {
    id: 'erc721',
    name: 'ERC-721 NFT',
    language: 'solidity',
    description: 'Non-fungible token contract',
    code: `pragma solidity ^0.8.0;

contract NFTCollection {
    mapping(uint256 => address) public owners;
    mapping(address => uint256) public balances;
    uint256 public nextTokenId;
    string public name;
    string public symbol;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function mint(address to) public returns (uint256) {
        uint256 tokenId = nextTokenId++;
        owners[tokenId] = to;
        balances[to]++;
        return tokenId;
    }
}`
  },
  {
    id: 'multisig',
    name: 'Multi-Signature Wallet',
    language: 'solidity',
    description: 'Multi-signature wallet for secure transactions',
    code: `pragma solidity ^0.8.0;

contract MultiSigWallet {
    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public required;

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
    }

    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations;

    constructor(address[] memory _owners, uint256 _required) {
        require(_owners.length > 0 && _required > 0 && _required <= _owners.length);
        for (uint i = 0; i < _owners.length; i++) {
            isOwner[_owners[i]] = true;
        }
        owners = _owners;
        required = _required;
    }
}`
  }
];

const SmartContractRegistry: React.FC = () => {
  const [contracts, setContracts] = useState<SmartContract[]>([]);
  const [selectedContract, setSelectedContract] = useState<SmartContract | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(contractTemplates[0]);
  const [deploymentForm, setDeploymentForm] = useState({
    name: '',
    channelId: '',
    language: 'solidity' as const,
    sourceCode: '',
    compile: true,
    verify: true
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isCompiling, setIsCompiling] = useState(false);
  const [_compilationResult, _setCompilationResult] = useState<any>(null);

  useEffect(() => {
    // Load contracts from backend API
    loadContracts();

    // Cleanup: cancel all pending requests on unmount
    return () => {
      contractsApi.cancelAll();
    };
  }, []);

  const loadContracts = async () => {
    try {
      const data = await contractsApi.getContracts();

      // Transform backend data to frontend format
      const transformedContracts = data.contracts.map((c: ApiContract) => ({
        id: c.id,
        name: c.name,
        version: '1.0.0',
        channelId: c.channelId || 'main',
        address: c.address,
        deployedBy: c.deployedBy,
        deployedAt: new Date(c.deployedAt),
        status: c.status,
        language: 'solidity' as const,
        abi: [],
        bytecode: c.code || '',
        sourceCode: c.code,
        verified: c.verified || false,
        audited: c.audited || false,
        auditReports: c.auditReport ? [{
          id: 'audit_' + c.id,
          auditor: 'System Audit',
          date: new Date(c.deployedAt),
          severity: 'low' as const,
          issues: 0,
          status: 'passed' as const,
          report: JSON.stringify(c.auditReport)
        }] : [],
        gasUsed: c.metrics?.gasUsed || 0,
        tags: [],
        methods: [],
        events: [],
        usage: {
          totalCalls: c.metrics?.transactions || 0,
          dailyCalls: Math.floor((c.metrics?.transactions || 0) / 30),
          uniqueUsers: c.metrics?.holders || 0,
          gasSpent: c.metrics?.totalValue || 0
        }
      }));

      setContracts(transformedContracts);
    } catch (error) {
      console.error('Failed to load contracts:', error);
      // Set empty array on error - NO FALLBACK DATA
      setContracts([]);
    }
  };

  const handleDeploy = async () => {
    setIsCompiling(true);

    try {
      // Deploy via contractsApi service
      const data = await contractsApi.deployContract({
        templateId: selectedTemplate?.id || '',
        name: deploymentForm.name,
        channelId: deploymentForm.channelId,
        deployedBy: '0xCurrentUser',
        parameters: {}
      });

      if (data.success) {
        // Reload contracts from backend
        await loadContracts();
        setDeployDialogOpen(false);
      }
    } catch (error) {
      console.error('Deployment failed:', error);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleAudit = (contract: SmartContract) => {
    setSelectedContract(contract);
    setAuditDialogOpen(true);

    // Simulate audit process
    setTimeout(() => {
      const auditReport: AuditReport = {
        id: `audit_${Date.now()}`,
        auditor: 'AI Security Scanner',
        date: new Date(),
        severity: 'low',
        issues: Math.floor(Math.random() * 5),
        status: Math.random() > 0.3 ? 'passed' : 'failed',
        report: 'Automated security scan completed'
      };

      setContracts(prev => prev.map(c =>
        c.id === contract.id
          ? {
              ...c,
              audited: true,
              auditReports: [...(c.auditReports || []), auditReport]
            }
          : c
      ));
      setAuditDialogOpen(false);
    }, 3000);
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          contract.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = filterChannel === 'all' || contract.channelId === filterChannel;
    const matchesStatus = filterStatus === 'all' || contract.status === filterStatus;
    return matchesSearch && matchesChannel && matchesStatus;
  });

  const channels = channelService.getAllChannels();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Smart Contract Registry</Typography>

      {/* Header Actions */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search contracts..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
          }}
          sx={{ flexGrow: 1, maxWidth: 400 }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Channel</InputLabel>
          <Select value={filterChannel} onChange={(e: any) => setFilterChannel(e.target.value)}>
            <MenuItem value="all">All Channels</MenuItem>
            {channels.map((ch: any) => (
              <MenuItem key={ch.id} value={ch.id}>{ch.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={filterStatus} onChange={(e: any) => setFilterStatus(e.target.value)}>
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="deployed">Deployed</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="auditing">Auditing</MenuItem>
            <MenuItem value="failed">Failed</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" startIcon={<Upload />} onClick={() => setDeployDialogOpen(true)}>
          Deploy Contract
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Total Contracts</Typography>
              <Typography variant="h4">{contracts.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Deployed</Typography>
              <Typography variant="h4" color="success.main">
                {contracts.filter(c => c.status === 'deployed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Audited</Typography>
              <Typography variant="h4" color="primary">
                {contracts.filter(c => c.audited).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Total Gas Used</Typography>
              <Typography variant="h4">
                {(contracts.reduce((sum, c) => sum + (c.gasUsed || 0), 0) / 1000000).toFixed(1)}M
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Contracts Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Contract Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Channel</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Language</TableCell>
              <TableCell>Verified</TableCell>
              <TableCell>Audited</TableCell>
              <TableCell>Usage</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredContracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {contract.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      v{contract.version}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Tooltip title={contract.address || 'Not deployed'}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {contract.address ? `${contract.address.substring(0, 10)}...` : 'Pending'}
                    </Typography>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Chip label={channels.find((c: any) => c.id === contract.channelId)?.name || contract.channelId} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={contract.status}
                    size="small"
                    color={
                      contract.status === 'deployed' ? 'success' :
                      contract.status === 'pending' ? 'warning' :
                      contract.status === 'auditing' ? 'info' : 'error'
                    }
                  />
                </TableCell>
                <TableCell>
                  <Chip label={contract.language} size="small" variant="outlined" />
                </TableCell>
                <TableCell>
                  {contract.verified ? (
                    <CheckCircle color="success" fontSize="small" />
                  ) : (
                    <Close color="disabled" fontSize="small" />
                  )}
                </TableCell>
                <TableCell>
                  {contract.audited ? (
                    <VerifiedUser color="primary" fontSize="small" />
                  ) : (
                    <Warning color="warning" fontSize="small" />
                  )}
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="caption">
                      {contract.usage.dailyCalls.toLocaleString()} calls/day
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => setSelectedContract(contract)}>
                    <Info />
                  </IconButton>
                  {!contract.audited && (
                    <IconButton size="small" onClick={() => handleAudit(contract)}>
                      <Security />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Deploy Contract Dialog */}
      <Dialog open={deployDialogOpen} onClose={() => setDeployDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Deploy Smart Contract</DialogTitle>
        <DialogContent>
          <Tabs value={activeTab} onChange={(_: any, v: number) => setActiveTab(v)} sx={{ mb: 2 }}>
            <Tab label="Templates" />
            <Tab label="Custom Code" />
            <Tab label="Import" />
          </Tabs>

          {activeTab === 0 && (
            <Box>
              <Grid container spacing={2}>
                {contractTemplates.map(template => (
                  <Grid item xs={12} md={4} key={template.id}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: selectedTemplate?.id === template.id ? 2 : 0,
                        borderColor: 'primary.main'
                      }}
                      onClick={() => {
                        setSelectedTemplate(template);
                        setDeploymentForm({
                          ...deploymentForm,
                          sourceCode: template.code,
                          language: template.language as any
                        });
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6">{template.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {template.description}
                        </Typography>
                        <Chip label={template.language} size="small" sx={{ mt: 1 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              {selectedTemplate && (
                <Box sx={{ mt: 2, maxHeight: 300, overflow: 'auto' }}>
                  <Paper sx={{ p: 2, bgcolor: '#1e1e1e' }}>
                    <pre style={{ color: '#d4d4d4', fontFamily: 'monospace', fontSize: '12px', overflow: 'auto' }}>
                      <code>{selectedTemplate?.code}</code>
                    </pre>
                  </Paper>
                </Box>
              )}
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <TextField
                fullWidth
                label="Contract Name"
                value={deploymentForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeploymentForm({ ...deploymentForm, name: e.target.value })}
                margin="normal"
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Channel</InputLabel>
                <Select
                  value={deploymentForm.channelId}
                  onChange={(e: any) => setDeploymentForm({ ...deploymentForm, channelId: e.target.value })}
                >
                  {channels.map((ch: any) => (
                    <MenuItem key={ch.id} value={ch.id}>{ch.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Language</InputLabel>
                <Select
                  value={deploymentForm.language}
                  onChange={(e: any) => setDeploymentForm({ ...deploymentForm, language: e.target.value as any })}
                >
                  <MenuItem value="solidity">Solidity</MenuItem>
                  <MenuItem value="vyper">Vyper</MenuItem>
                  <MenuItem value="rust">Rust</MenuItem>
                  <MenuItem value="go">Go</MenuItem>
                  <MenuItem value="javascript">JavaScript</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                multiline
                rows={10}
                label="Source Code"
                value={deploymentForm.sourceCode}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDeploymentForm({ ...deploymentForm, sourceCode: e.target.value })}
                margin="normal"
              />
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={deploymentForm.compile}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeploymentForm({ ...deploymentForm, compile: e.target.checked })}
                    />
                  }
                  label="Compile before deployment"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={deploymentForm.verify}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeploymentForm({ ...deploymentForm, verify: e.target.checked })}
                    />
                  }
                  label="Verify contract source"
                />
              </Box>
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Import contracts from GitHub, IPFS, or upload compiled bytecode
              </Alert>
              <Button variant="outlined" startIcon={<GitHub />} fullWidth sx={{ mb: 2 }}>
                Import from GitHub
              </Button>
              <Button variant="outlined" startIcon={<Upload />} fullWidth>
                Upload Compiled Contract
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeployDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleDeploy}
            disabled={isCompiling || !deploymentForm.name || !deploymentForm.channelId}
            startIcon={isCompiling ? <CircularProgress size={20} /> : <Upload />}
          >
            {isCompiling ? 'Compiling...' : 'Deploy'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Contract Details Dialog */}
      {selectedContract && (
        <Dialog
          open={Boolean(selectedContract)}
          onClose={() => setSelectedContract(null)}
          maxWidth="lg"
          fullWidth
        >
          <DialogTitle>
            {selectedContract.name} Details
            <Chip label={selectedContract.version} size="small" sx={{ ml: 2 }} />
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Contract Address</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
                  {selectedContract.address}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Deployed By</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 2 }}>
                  {selectedContract.deployedBy}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Methods</Typography>
                <List dense>
                  {selectedContract.methods.map((method, idx) => (
                    <ListItem key={idx}>
                      <ListItemIcon>
                        <Functions />
                      </ListItemIcon>
                      <ListItemText
                        primary={`${method.name}(${method.inputs.map(i => i.type).join(', ')})`}
                        secondary={`${method.visibility} • ${method.stateMutability}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>Audit Reports</Typography>
                {selectedContract.auditReports?.map((report, idx) => (
                  <Alert
                    key={idx}
                    severity={report.status === 'passed' ? 'success' : 'error'}
                    sx={{ mb: 1 }}
                  >
                    {report.auditor} - {report.issues} issues found - {report.status}
                  </Alert>
                ))}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedContract(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default SmartContractRegistry;