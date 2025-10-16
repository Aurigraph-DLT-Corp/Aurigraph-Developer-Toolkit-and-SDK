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
  Alert,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { Add, Description, Check, Close } from '@mui/icons-material';

interface Contract {
  id: string;
  name: string;
  type: 'ricardian' | 'smart' | 'hybrid';
  status: 'draft' | 'active' | 'executed' | 'terminated';
  parties: string[];
  value: number;
  createdAt: Date;
  terms: string;
  legalText?: string;
  code?: string;
}

interface TripleEntry {
  id: string;
  debit: string;
  credit: string;
  amount: number;
  contractId: string;
  timestamp: Date;
  verified: boolean;
}

export const ActiveContracts: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [contracts, setContracts] = useState<Contract[]>([
    {
      id: 'ac1',
      name: 'Supply Agreement 2025',
      type: 'ricardian',
      status: 'active',
      parties: ['Company A', 'Company B'],
      value: 500000,
      createdAt: new Date(),
      terms: 'Monthly delivery of 1000 units',
      legalText: 'This agreement is entered into...',
    },
  ]);

  const [entries] = useState<TripleEntry[]>([
    {
      id: 'te1',
      debit: 'Account A',
      credit: 'Account B',
      amount: 10000,
      contractId: 'ac1',
      timestamp: new Date(),
      verified: true,
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [contractForm, setContractForm] = useState({
    name: '',
    type: 'ricardian',
    parties: '',
    value: 0,
    terms: '',
    legalText: '',
    code: '',
  });

  const steps = ['Basic Info', 'Legal Terms', 'Smart Code', 'Review & Deploy'];

  const deployContract = () => {
    const newContract: Contract = {
      id: `ac_${Date.now()}`,
      name: contractForm.name,
      type: contractForm.type as any,
      status: 'active',
      parties: contractForm.parties.split(','),
      value: contractForm.value,
      createdAt: new Date(),
      terms: contractForm.terms,
      legalText: contractForm.legalText,
      code: contractForm.code,
    };
    setContracts([...contracts, newContract]);
    setDialogOpen(false);
    setActiveStep(0);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        ActiveContracts© Management
      </Typography>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Contracts
              </Typography>
              <Typography variant="h4">
                {contracts.filter((c) => c.status === 'active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Value Locked
              </Typography>
              <Typography variant="h4">
                ${contracts.reduce((sum, c) => sum + c.value, 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Triple Entries
              </Typography>
              <Typography variant="h4">{entries.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Tabs
              value={activeTab}
              onChange={(_: React.SyntheticEvent, v: number) => setActiveTab(v)}
            >
              <Tab label="Contracts" />
              <Tab label="Triple-Entry Ledger" />
              <Tab label="Templates" />
            </Tabs>
            <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
              Create Contract
            </Button>
          </Box>

          {activeTab === 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Contract Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Parties</TableCell>
                    <TableCell>Value</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>{contract.name}</TableCell>
                      <TableCell>
                        <Chip label={contract.type} size="small" />
                      </TableCell>
                      <TableCell>{contract.parties.join(', ')}</TableCell>
                      <TableCell>${contract.value.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip
                          label={contract.status}
                          color={contract.status === 'active' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small">View</Button>
                        <Button size="small">Execute</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {activeTab === 1 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Entry ID</TableCell>
                    <TableCell>Debit Account</TableCell>
                    <TableCell>Credit Account</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Contract</TableCell>
                    <TableCell>Verified</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.id}</TableCell>
                      <TableCell>{entry.debit}</TableCell>
                      <TableCell>{entry.credit}</TableCell>
                      <TableCell>${entry.amount.toLocaleString()}</TableCell>
                      <TableCell>{entry.contractId}</TableCell>
                      <TableCell>
                        {entry.verified ? <Check color="success" /> : <Close color="error" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {activeTab === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card sx={{ cursor: 'pointer' }}>
                  <CardContent>
                    <Description fontSize="large" color="primary" />
                    <Typography variant="h6">Purchase Agreement</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Standard purchase agreement with escrow
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ cursor: 'pointer' }}>
                  <CardContent>
                    <Description fontSize="large" color="primary" />
                    <Typography variant="h6">Service Contract</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Milestone-based service agreement
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ cursor: 'pointer' }}>
                  <CardContent>
                    <Description fontSize="large" color="primary" />
                    <Typography variant="h6">Token Vesting</Typography>
                    <Typography variant="body2" color="textSecondary">
                      Time-locked token release schedule
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Create Contract Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create ActiveContract</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box>
              <TextField
                fullWidth
                label="Contract Name"
                value={contractForm.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setContractForm({ ...contractForm, name: e.target.value })
                }
                margin="normal"
              />
              <TextField
                fullWidth
                label="Parties (comma-separated)"
                value={contractForm.parties}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setContractForm({ ...contractForm, parties: e.target.value })
                }
                margin="normal"
              />
              <TextField
                fullWidth
                label="Contract Value"
                type="number"
                value={contractForm.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setContractForm({ ...contractForm, value: parseInt(e.target.value) })
                }
                margin="normal"
              />
            </Box>
          )}

          {activeStep === 1 && (
            <TextField
              fullWidth
              label="Legal Terms"
              multiline
              rows={10}
              value={contractForm.legalText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setContractForm({ ...contractForm, legalText: e.target.value })
              }
              margin="normal"
            />
          )}

          {activeStep === 2 && (
            <TextField
              fullWidth
              label="Smart Contract Code"
              multiline
              rows={10}
              value={contractForm.code}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setContractForm({ ...contractForm, code: e.target.value })
              }
              margin="normal"
              placeholder="// Solidity or JavaScript code"
            />
          )}

          {activeStep === 3 && (
            <Alert severity="info">
              Review your contract details before deployment. Once deployed, the contract will be
              immutable on the blockchain.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          {activeStep > 0 && <Button onClick={() => setActiveStep(activeStep - 1)}>Back</Button>}
          {activeStep < steps.length - 1 ? (
            <Button variant="contained" onClick={() => setActiveStep(activeStep + 1)}>
              Next
            </Button>
          ) : (
            <Button variant="contained" color="primary" onClick={deployContract}>
              Deploy
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActiveContracts;
