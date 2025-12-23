import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, TextField, Button,
  Stepper, Step, StepLabel, Alert, LinearProgress, Select, MenuItem,
  FormControl, InputLabel, Chip
} from '@mui/material';
import { AccountBalance, CheckCircle } from '@mui/icons-material';
import axios from 'axios';

const API_BASE_URL = 'https://dlt.aurigraph.io/api/v11';

const TokenizeAsset: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const steps = ['Asset Info', 'Legal', 'Token Config', 'Documents', 'Review'];

  const submitTokenization = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/rwa/tokenize`, {});
      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        <AccountBalance sx={{ mr: 1 }} />
        Tokenize Real-World Asset
      </Typography>
      <Card>
        <CardContent>
          <Stepper activeStep={activeStep}>
            {steps.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>
          {loading && <LinearProgress />}
          {success && <Alert severity="success"><CheckCircle /> Tokenization Complete!</Alert>}
        </CardContent>
      </Card>
    </Box>
  );
};

export default TokenizeAsset;
