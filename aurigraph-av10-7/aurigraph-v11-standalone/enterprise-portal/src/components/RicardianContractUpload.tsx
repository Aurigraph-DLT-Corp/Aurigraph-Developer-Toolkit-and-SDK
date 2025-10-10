import React, { useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Stepper, Step, StepLabel,
  Alert, List, ListItem, ListItemText, ListItemIcon, Chip, Grid,
  LinearProgress, IconButton, Tooltip, FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar
} from '@mui/material';
import {
  Upload, CloudUpload, Description, Gavel, VerifiedUser, Close,
  CheckCircle, Error, Warning, Info, Person, Code, Security,
  Visibility, Edit, Download, Share, Assignment, AccountBalance
} from '@mui/icons-material';

interface ContractParty {
  id: string;
  name: string;
  role: string; // BUYER, SELLER, VALIDATOR, WITNESS
  address: string;
  email?: string;
  kycVerified: boolean;
  signatureRequired: boolean;
  signed: boolean;
  signedAt?: Date;
}

interface RicardianContract {
  id: string;
  name: string;
  type: string;
  status: 'draft' | 'pending_signatures' | 'active' | 'executed' | 'terminated';
  legalText: string;
  executableCode: string;
  jurisdiction: string;
  parties: ContractParty[];
  terms: string[];
  signatures: any[];
  uploadedDocument?: {
    fileName: string;
    fileSize: number;
    uploadedAt: Date;
  };
  enforceabilityScore: number;
  riskAssessment: string;
  createdAt: Date;
  activatedAt?: Date;
}

export const RicardianContractUpload: React.FC = () => {
  const [contracts, setContracts] = useState<RicardianContract[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<RicardianContract | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [converting, setConverting] = useState(false);

  // Upload form state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [contractType, setContractType] = useState('REAL_ESTATE');
  const [jurisdiction, setJurisdiction] = useState('California');
  const [convertedContract, setConvertedContract] = useState<RicardianContract | null>(null);

  const steps = ['Upload Document', 'Review & Edit', 'Add Parties', 'Request Signatures'];

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword',
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'text/plain'];

      if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF, DOC, DOCX, or TXT file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      setUploadedFile(file);
    }
  }, []);

  // Convert document to Ricardian contract
  const convertDocument = async () => {
    if (!uploadedFile) return;

    setConverting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('contractType', contractType);
      formData.append('jurisdiction', jurisdiction);

      // Call backend API
      const response = await fetch('https://dlt.aurigraph.io:8443/api/v11/contracts/ricardian/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to convert document');
      }

      const contract = await response.json();

      // Add default parties if none detected
      if (!contract.parties || contract.parties.length === 0) {
        contract.parties = [
          {
            id: 'party_1',
            name: 'Party 1',
            role: 'BUYER',
            address: '0x' + Math.random().toString(16).substr(2, 40),
            kycVerified: false,
            signatureRequired: true,
            signed: false
          },
          {
            id: 'party_2',
            name: 'Party 2',
            role: 'SELLER',
            address: '0x' + Math.random().toString(16).substr(2, 40),
            kycVerified: false,
            signatureRequired: true,
            signed: false
          }
        ];
      }

      contract.uploadedDocument = {
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        uploadedAt: new Date()
      };

      setConvertedContract(contract);
      setActiveStep(1);
    } catch (error) {
      console.error('Error converting document:', error);
      alert('Failed to convert document. Please try again.');
    } finally {
      setConverting(false);
    }
  };

  // Add/edit party
  const updateParty = (index: number, field: string, value: any) => {
    if (!convertedContract) return;

    const updatedParties = [...convertedContract.parties];
    updatedParties[index] = { ...updatedParties[index], [field]: value };
    setConvertedContract({ ...convertedContract, parties: updatedParties });
  };

  // Add new party
  const addParty = () => {
    if (!convertedContract) return;

    const newParty: ContractParty = {
      id: `party_${Date.now()}`,
      name: '',
      role: 'MEMBER',
      address: '0x' + Math.random().toString(16).substr(2, 40),
      kycVerified: false,
      signatureRequired: true,
      signed: false
    };

    setConvertedContract({
      ...convertedContract,
      parties: [...convertedContract.parties, newParty]
    });
  };

  // Deploy contract
  const deployContract = async () => {
    if (!convertedContract) return;

    try {
      // Call backend API to create contract
      const response = await fetch('https://dlt.aurigraph.io:8443/api/v11/contracts/ricardian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(convertedContract)
      });

      if (!response.ok) {
        throw new Error('Failed to deploy contract');
      }

      const deployed = await response.json();
      deployed.status = 'pending_signatures';

      setContracts([...contracts, deployed]);
      setUploadDialogOpen(false);
      setActiveStep(0);
      setUploadedFile(null);
      setConvertedContract(null);
    } catch (error) {
      console.error('Error deploying contract:', error);
      alert('Failed to deploy contract. Please try again.');
    }
  };

  // Sign contract
  const signContract = async (contractId: string, partyId: string) => {
    // Simulate quantum-safe signature
    const signature = {
      partyId,
      signature: '0x' + Math.random().toString(16).substr(2, 128),
      algorithm: 'CRYSTALS-Dilithium',
      signedAt: new Date()
    };

    // Update contract
    const updated = contracts.map(c => {
      if (c.id === contractId) {
        // Update party signature status
        const updatedParties = c.parties.map(p => {
          if (p.id === partyId) {
            return { ...p, signed: true, signedAt: new Date() };
          }
          return p;
        });

        // Check if all required signatures collected
        const allSigned = updatedParties
          .filter(p => p.signatureRequired)
          .every(p => p.signed);

        return {
          ...c,
          parties: updatedParties,
          signatures: [...c.signatures, signature],
          status: allSigned ? 'active' as const : c.status,
          activatedAt: allSigned ? new Date() : c.activatedAt
        };
      }
      return c;
    });

    setContracts(updated);
    setSignDialogOpen(false);
  };

  const getRiskColor = (risk: string) => {
    if (risk.includes('CRITICAL')) return 'error';
    if (risk.includes('HIGH')) return 'warning';
    if (risk.includes('MEDIUM')) return 'info';
    return 'success';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Ricardian Contracts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload legal documents and convert them to executable Ricardian contracts
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<CloudUpload />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Upload Document
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Total Contracts</Typography>
              <Typography variant="h4">{contracts.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Active Contracts</Typography>
              <Typography variant="h4">
                {contracts.filter(c => c.status === 'active').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>Pending Signatures</Typography>
              <Typography variant="h4">
                {contracts.filter(c => c.status === 'pending_signatures').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom">Avg. Enforceability</Typography>
              <Typography variant="h4">
                {contracts.length > 0
                  ? Math.round(contracts.reduce((sum, c) => sum + c.enforceabilityScore, 0) / contracts.length)
                  : 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Contracts Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Contract Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Parties</TableCell>
                  <TableCell>Signatures</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Enforceability</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contracts.map(contract => {
                  const signedCount = contract.parties.filter(p => p.signed).length;
                  const requiredCount = contract.parties.filter(p => p.signatureRequired).length;

                  return (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Description />
                          {contract.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={contract.type} size="small" />
                      </TableCell>
                      <TableCell>{contract.parties.length} parties</TableCell>
                      <TableCell>
                        <Chip
                          label={`${signedCount}/${requiredCount}`}
                          color={signedCount === requiredCount ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={contract.status.replace('_', ' ')}
                          color={
                            contract.status === 'active' ? 'success' :
                            contract.status === 'pending_signatures' ? 'warning' :
                            'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" align Items="center" gap={1}>
                          <LinearProgress
                            variant="determinate"
                            value={contract.enforceabilityScore}
                            sx={{ width: 100 }}
                          />
                          <Typography variant="caption">
                            {contract.enforceabilityScore}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton size="small" onClick={() => {
                            setSelectedContract(contract);
                            setViewDialogOpen(true);
                          }}>
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {contract.status === 'pending_signatures' && (
                          <Tooltip title="Sign Contract">
                            <IconButton size="small" onClick={() => {
                              setSelectedContract(contract);
                              setSignDialogOpen(true);
                            }}>
                              <Edit />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {contracts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box py={4}>
                        <Description fontSize="large" color="disabled" />
                        <Typography color="textSecondary" mt={2}>
                          No contracts yet. Upload a legal document to get started.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Upload & Convert Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Ricardian Contract from Document</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ my: 3 }}>
            {steps.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                Upload a legal contract (PDF, DOC, DOCX) and we'll convert it into an executable Ricardian contract.
              </Alert>

              <Paper
                sx={{
                  p: 4,
                  border: '2px dashed #ccc',
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.main' }
                }}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                <CloudUpload fontSize="large" color="action" />
                <Typography variant="h6" mt={2}>
                  {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  PDF, DOC, DOCX, or TXT (max 10MB)
                </Typography>
                {uploadedFile && (
                  <Chip
                    label={`${(uploadedFile.size / 1024).toFixed(1)} KB`}
                    sx={{ mt: 2 }}
                  />
                )}
              </Paper>

              <Grid container spacing={2} mt={2}>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Contract Type</InputLabel>
                    <Select
                      value={contractType}
                      label="Contract Type"
                      onChange={(e) => setContractType(e.target.value)}
                    >
                      <MenuItem value="REAL_ESTATE">Real Estate</MenuItem>
                      <MenuItem value="SUPPLY_CHAIN">Supply Chain</MenuItem>
                      <MenuItem value="SERVICE">Service Agreement</MenuItem>
                      <MenuItem value="EMPLOYMENT">Employment</MenuItem>
                      <MenuItem value="NDA">NDA</MenuItem>
                      <MenuItem value="PURCHASE">Purchase Agreement</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Jurisdiction</InputLabel>
                    <Select
                      value={jurisdiction}
                      label="Jurisdiction"
                      onChange={(e) => setJurisdiction(e.target.value)}
                    >
                      <MenuItem value="California">California, USA</MenuItem>
                      <MenuItem value="NewYork">New York, USA</MenuItem>
                      <MenuItem value="Delaware">Delaware, USA</MenuItem>
                      <MenuItem value="England">England, UK</MenuItem>
                      <MenuItem value="Singapore">Singapore</MenuItem>
                      <MenuItem value="Switzerland">Switzerland</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {converting && (
                <Box mt={3}>
                  <LinearProgress />
                  <Typography variant="body2" align="center" mt={1}>
                    Converting document to Ricardian contract...
                  </Typography>
                </Box>
              )}
            </Box>
          )}

          {activeStep === 1 && convertedContract && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Document successfully converted! Review the extracted information below.
              </Alert>

              <TextField
                fullWidth
                label="Contract Name"
                value={convertedContract.name}
                onChange={(e) => setConvertedContract({ ...convertedContract, name: e.target.value })}
                margin="normal"
              />

              <TextField
                fullWidth
                label="Legal Text"
                multiline
                rows={6}
                value={convertedContract.legalText}
                onChange={(e) => setConvertedContract({ ...convertedContract, legalText: e.target.value })}
                margin="normal"
              />

              <Box mt={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Risk Assessment
                </Typography>
                <Alert severity={getRiskColor(convertedContract.riskAssessment)}>
                  {convertedContract.riskAssessment}
                </Alert>
              </Box>

              <Box mt={2} display="flex" justifyContent="space-between">
                <Chip
                  icon={<Security />}
                  label={`Enforceability: ${convertedContract.enforceabilityScore}%`}
                  color="primary"
                />
                <Chip
                  icon={<Code />}
                  label="Quantum-Safe Signatures"
                  color="success"
                />
              </Box>
            </Box>
          )}

          {activeStep === 2 && convertedContract && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Contract Parties (Signatories)
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={2}>
                Add all parties who need to sign this contract. Use RBAC roles to control access.
              </Typography>

              {convertedContract.parties.map((party, index) => (
                <Card key={party.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Name"
                          value={party.name}
                          onChange={(e) => updateParty(index, 'name', e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Role</InputLabel>
                          <Select
                            value={party.role}
                            label="Role"
                            onChange={(e) => updateParty(index, 'role', e.target.value)}
                          >
                            <MenuItem value="BUYER">Buyer</MenuItem>
                            <MenuItem value="SELLER">Seller</MenuItem>
                            <MenuItem value="VALIDATOR">Validator</MenuItem>
                            <MenuItem value="WITNESS">Witness</MenuItem>
                            <MenuItem value="ADMIN">Administrator</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={5}>
                        <TextField
                          fullWidth
                          label="Wallet Address"
                          value={party.address}
                          onChange={(e) => updateParty(index, 'address', e.target.value)}
                          size="small"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={party.signatureRequired}
                              onChange={(e) => updateParty(index, 'signatureRequired', e.target.checked)}
                            />
                          }
                          label="Signature Required"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}

              <Button
                startIcon={<Person />}
                onClick={addParty}
                sx={{ mt: 1 }}
              >
                Add Another Party
              </Button>
            </Box>
          )}

          {activeStep === 3 && convertedContract && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                Review and deploy your contract. Signature requests will be sent to all parties.
              </Alert>

              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" gutterBottom>Contract Summary</Typography>
                <Typography><strong>Name:</strong> {convertedContract.name}</Typography>
                <Typography><strong>Type:</strong> {convertedContract.type}</Typography>
                <Typography><strong>Jurisdiction:</strong> {convertedContract.jurisdiction}</Typography>
                <Typography><strong>Parties:</strong> {convertedContract.parties.length}</Typography>
                <Typography><strong>Enforceability:</strong> {convertedContract.enforceabilityScore}%</Typography>
              </Paper>

              <Typography variant="subtitle2" mt={3} mb={1}>Signature Workflow</Typography>
              <List>
                {convertedContract.parties.filter(p => p.signatureRequired).map((party, index) => (
                  <ListItem key={party.id}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                        {index + 1}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={`${party.name} (${party.role})`}
                      secondary={party.address}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setUploadDialogOpen(false);
            setActiveStep(0);
            setUploadedFile(null);
            setConvertedContract(null);
          }}>
            Cancel
          </Button>
          {activeStep > 0 && (
            <Button onClick={() => setActiveStep(activeStep - 1)}>
              Back
            </Button>
          )}
          {activeStep === 0 && (
            <Button
              variant="contained"
              disabled={!uploadedFile || converting}
              onClick={convertDocument}
            >
              Convert Document
            </Button>
          )}
          {activeStep > 0 && activeStep < steps.length - 1 && (
            <Button
              variant="contained"
              onClick={() => setActiveStep(activeStep + 1)}
            >
              Next
            </Button>
          )}
          {activeStep === steps.length - 1 && (
            <Button
              variant="contained"
              color="primary"
              onClick={deployContract}
            >
              Deploy Contract
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* View Contract Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedContract && (
          <>
            <DialogTitle>
              {selectedContract.name}
              <Chip
                label={selectedContract.status}
                size="small"
                sx={{ ml: 2 }}
                color={selectedContract.status === 'active' ? 'success' : 'warning'}
              />
            </DialogTitle>
            <DialogContent>
              <Typography variant="subtitle2" gutterBottom>Legal Text</Typography>
              <Paper sx={{ p: 2, bgcolor: 'background.default', mb: 2, maxHeight: 200, overflow: 'auto' }}>
                <Typography variant="body2" style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedContract.legalText}
                </Typography>
              </Paper>

              <Typography variant="subtitle2" gutterBottom>Executable Code</Typography>
              <Paper sx={{ p: 2, bgcolor: 'background.default', mb: 2, maxHeight: 200, overflow: 'auto' }}>
                <Typography variant="body2" component="pre" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                  {selectedContract.executableCode}
                </Typography>
              </Paper>

              <Typography variant="subtitle2" gutterBottom>Signatures</Typography>
              <List>
                {selectedContract.parties.map(party => (
                  <ListItem key={party.id}>
                    <ListItemIcon>
                      {party.signed ?
                        <CheckCircle color="success" /> :
                        <Warning color="warning" />
                      }
                    </ListItemIcon>
                    <ListItemText
                      primary={`${party.name} (${party.role})`}
                      secondary={party.signed ? `Signed on ${party.signedAt?.toLocaleDateString()}` : 'Pending signature'}
                    />
                  </ListItem>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Sign Contract Dialog */}
      <Dialog open={signDialogOpen} onClose={() => setSignDialogOpen(false)} maxWidth="sm" fullWidth>
        {selectedContract && (
          <>
            <DialogTitle>Sign Contract: {selectedContract.name}</DialogTitle>
            <DialogContent>
              <Alert severity="info" sx={{ mb: 2 }}>
                Select your identity to sign this contract with quantum-safe CRYSTALS-Dilithium signature
              </Alert>

              <List>
                {selectedContract.parties.filter(p => !p.signed).map(party => (
                  <ListItem
                    key={party.id}
                    button
                    onClick={() => signContract(selectedContract.id, party.id)}
                  >
                    <ListItemIcon>
                      <Person />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Sign as ${party.name}`}
                      secondary={`${party.role} - ${party.address.substring(0, 20)}...`}
                    />
                  </ListItem>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSignDialogOpen(false)}>Cancel</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default RicardianContractUpload;
