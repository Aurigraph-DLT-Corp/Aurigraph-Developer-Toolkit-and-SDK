import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  IconButton,
  Collapse
} from '@mui/material';
import {
  VerifiedUser,
  Error,
  CheckCircle,
  ContentCopy,
  ExpandMore,
  ExpandLess,
  AccountTree
} from '@mui/icons-material';
import { apiService } from '../services/api';

interface ProofElement {
  siblingHash: string;
  isLeft: boolean;
}

interface ProofData {
  leafHash: string;
  rootHash: string;
  leafIndex: number;
  proofPath: ProofElement[];
}

interface VerificationResponse {
  valid: boolean;
  message: string;
}

/**
 * MerkleVerification Component
 * Phase 2: Provides Merkle proof generation and verification for RWAT tokens
 * Endpoints: GET /api/v12/registry/rwat/{id}/merkle/proof, POST /api/v12/registry/rwat/merkle/verify
 */
const MerkleVerification: React.FC = () => {
  const [rwatId, setRwatId] = useState('');
  const [proofData, setProofData] = useState<ProofData | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedProof, setExpandedProof] = useState(false);

  const handleGenerateProof = async () => {
    if (!rwatId.trim()) {
      setError('Please enter an RWAT ID');
      return;
    }

    setLoading(true);
    setError(null);
    setProofData(null);
    setVerificationResult(null);

    try {
      const proof = await apiService.generateMerkleProof(rwatId);
      setProofData(proof);
      console.log('✅ Merkle proof generated:', proof);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to generate proof';
      setError(errorMsg);
      console.error('❌ Failed to generate Merkle proof:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyProof = async () => {
    if (!proofData) {
      setError('No proof data to verify');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiService.verifyMerkleProof(proofData);
      setVerificationResult(result);
      console.log('✅ Merkle proof verified:', result);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to verify proof';
      setError(errorMsg);
      setVerificationResult(null);
      console.error('❌ Failed to verify Merkle proof:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const truncateHash = (hash: string, length: number = 16) => {
    return hash.length > length
      ? `${hash.substring(0, length)}...${hash.substring(hash.length - 8)}`
      : hash;
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AccountTree sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
          <Box>
            <Typography variant="h6">Merkle Proof Verification - Phase 2</Typography>
            <Typography variant="caption" color="text.secondary">
              Cryptographic verification for RWAT token registry integrity
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Input Section */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="RWAT ID"
            value={rwatId}
            onChange={(e) => setRwatId(e.target.value)}
            placeholder="Enter RWAT ID (e.g., RWAT-001)"
            sx={{ mb: 2 }}
            disabled={loading}
          />

          <Button
            variant="contained"
            onClick={handleGenerateProof}
            disabled={loading || !rwatId.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <VerifiedUser />}
            fullWidth
          >
            Generate Merkle Proof
          </Button>
        </Box>

        {/* Proof Display */}
        {proofData && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              <strong>Proof Generated Successfully!</strong>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Proof contains {proofData.proofPath.length} hops from leaf to root
              </Typography>
            </Alert>

            {/* Leaf Hash */}
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Leaf Hash (Token Data)
                </Typography>
                <IconButton size="small" onClick={() => copyToClipboard(proofData.leafHash)}>
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Box>
              <Typography
                variant="body2"
                fontFamily="monospace"
                sx={{ wordBreak: 'break-all', fontSize: '0.8rem' }}
              >
                {proofData.leafHash}
              </Typography>
              <Chip label={`Index: ${proofData.leafIndex}`} size="small" sx={{ mt: 1 }} />
            </Paper>

            {/* Root Hash */}
            <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.light', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Merkle Root Hash
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => copyToClipboard(proofData.rootHash)}
                  sx={{ color: 'white' }}
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Box>
              <Typography
                variant="body2"
                fontFamily="monospace"
                sx={{ wordBreak: 'break-all', fontSize: '0.8rem' }}
              >
                {proofData.rootHash}
              </Typography>
            </Paper>

            {/* Proof Path */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Proof Path ({proofData.proofPath.length} steps)
                </Typography>
                <IconButton onClick={() => setExpandedProof(!expandedProof)}>
                  {expandedProof ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>

              <Collapse in={expandedProof}>
                <List dense>
                  {proofData.proofPath.map((element, index) => (
                    <ListItem key={index} sx={{ pl: 0 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Chip
                              label={element.isLeft ? 'LEFT' : 'RIGHT'}
                              size="small"
                              color={element.isLeft ? 'primary' : 'secondary'}
                              sx={{ mr: 1, minWidth: 70 }}
                            />
                            <Typography variant="caption" fontFamily="monospace">
                              {truncateHash(element.siblingHash, 32)}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => copyToClipboard(element.siblingHash)}
                              sx={{ ml: 1 }}
                            >
                              <ContentCopy fontSize="small" />
                            </IconButton>
                          </Box>
                        }
                        secondary={`Step ${index + 1} of ${proofData.proofPath.length}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </Paper>

            {/* Verify Button */}
            <Button
              variant="outlined"
              onClick={handleVerifyProof}
              disabled={loading}
              startIcon={<CheckCircle />}
              fullWidth
            >
              Verify This Proof
            </Button>
          </Box>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <Alert
            severity={verificationResult.valid ? 'success' : 'error'}
            icon={verificationResult.valid ? <CheckCircle /> : <Error />}
            sx={{ mt: 2 }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              {verificationResult.valid ? '✓ Proof Valid' : '✗ Proof Invalid'}
            </Typography>
            <Typography variant="body2">{verificationResult.message}</Typography>
            {verificationResult.valid && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                The token is cryptographically verified to be in the registry Merkle tree.
              </Typography>
            )}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default MerkleVerification;
