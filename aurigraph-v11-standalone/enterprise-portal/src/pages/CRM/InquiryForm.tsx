/**
 * InquiryForm Component
 *
 * Lead capture form for the Aurigraph Enterprise Portal
 * Collects customer inquiries and creates lead records with:
 * - Contact information (name, email, phone, company)
 * - Inquiry context (inquiry type, company size, industry, budget)
 * - GDPR compliance (consent collection)
 * - Automatic lead scoring based on input
 */

import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { createLead } from '../../slices/leadSlice';
import { CreateLeadRequest, LeadSource } from '../../services/CrmService';
import { AppDispatch, RootState } from '../../store';

interface InquiryFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  jobTitle: string;
  source: LeadSource | '';
  inquiryType: string;
  companySizeRange: string;
  industry: string;
  budgetRange: string;
  gdprConsent: boolean;
  message: string;
}

const InquiryForm: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { status, error } = useSelector((state: RootState) => state.leads);

  const [formData, setFormData] = useState<InquiryFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    companyName: '',
    jobTitle: '',
    source: '',
    inquiryType: '',
    companySizeRange: '',
    industry: '',
    budgetRange: '',
    gdprConsent: false,
    message: '',
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
    if (!formData.companyName.trim()) errors.companyName = 'Company name is required';
    if (!formData.gdprConsent) errors.gdprConsent = 'GDPR consent is required';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const request: CreateLeadRequest = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || undefined,
      companyName: formData.companyName,
      jobTitle: formData.jobTitle || undefined,
      source: (formData.source as LeadSource) || undefined,
      inquiryType: formData.inquiryType || undefined,
      companySizeRange: formData.companySizeRange || undefined,
      industry: formData.industry || undefined,
      budgetRange: formData.budgetRange || undefined,
      gdprConsentGiven: formData.gdprConsent,
      message: formData.message || undefined,
    };

    await dispatch(createLead(request));
    setSubmitted(true);

    // Reset form after successful submission
    if (status === 'succeeded') {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        companyName: '',
        jobTitle: '',
        source: '',
        inquiryType: '',
        companySizeRange: '',
        industry: '',
        budgetRange: '',
        gdprConsent: false,
        message: '',
      });
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Request a Demo
        </Typography>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          Tell us about your organization and we'll schedule a personalized demo of the Aurigraph
          platform.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {submitted && status === 'succeeded' && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Thank you! Your inquiry has been submitted. We'll contact you soon to schedule your
            demo.
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Contact Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2, fontWeight: 600 }}>
                Contact Information
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="First Name *"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                error={!!validationErrors.firstName}
                helperText={validationErrors.firstName}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Last Name *"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                error={!!validationErrors.lastName}
                helperText={validationErrors.lastName}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!validationErrors.email}
                helperText={validationErrors.email}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </Grid>

            {/* Company Information */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2, fontWeight: 600 }}>
                Company Information
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Company Name *"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                error={!!validationErrors.companyName}
                helperText={validationErrors.companyName}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Job Title"
                name="jobTitle"
                value={formData.jobTitle}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Company Size</InputLabel>
                <Select
                  name="companySizeRange"
                  value={formData.companySizeRange}
                  label="Company Size"
                  onChange={handleInputChange}
                >
                  <MenuItem value="">Select...</MenuItem>
                  <MenuItem value="1-50">1-50 employees</MenuItem>
                  <MenuItem value="51-200">51-200 employees</MenuItem>
                  <MenuItem value="201-500">201-500 employees</MenuItem>
                  <MenuItem value="500+">500+ employees</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                placeholder="e.g., Finance, Energy, Healthcare"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Budget Range</InputLabel>
                <Select
                  name="budgetRange"
                  value={formData.budgetRange}
                  label="Budget Range"
                  onChange={handleInputChange}
                >
                  <MenuItem value="">Select...</MenuItem>
                  <MenuItem value="$10K-50K">$10K-50K</MenuItem>
                  <MenuItem value="$50K-100K">$50K-100K</MenuItem>
                  <MenuItem value="$100K-500K">$100K-500K</MenuItem>
                  <MenuItem value="$500K+">$500K+</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Inquiry Details */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mb: 2, mt: 2, fontWeight: 600 }}>
                Inquiry Details
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>How did you hear about us?</InputLabel>
                <Select
                  name="source"
                  value={formData.source}
                  label="How did you hear about us?"
                  onChange={handleInputChange}
                >
                  <MenuItem value="">Select...</MenuItem>
                  <MenuItem value={LeadSource.WEBSITE}>Website</MenuItem>
                  <MenuItem value={LeadSource.REFERRAL}>Referral</MenuItem>
                  <MenuItem value={LeadSource.OUTBOUND}>Sales Outreach</MenuItem>
                  <MenuItem value={LeadSource.EVENT}>Event</MenuItem>
                  <MenuItem value={LeadSource.PARTNERSHIP}>Partner</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Inquiry Type</InputLabel>
                <Select
                  name="inquiryType"
                  value={formData.inquiryType}
                  label="Inquiry Type"
                  onChange={handleInputChange}
                >
                  <MenuItem value="">Select...</MenuItem>
                  <MenuItem value="Platform Demo">Platform Demo</MenuItem>
                  <MenuItem value="Technical Details">Technical Details</MenuItem>
                  <MenuItem value="Pricing Information">Pricing Information</MenuItem>
                  <MenuItem value="Partnership">Partnership</MenuItem>
                  <MenuItem value="Integration">Integration</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                multiline
                rows={4}
                placeholder="Tell us more about your needs and use case"
              />
            </Grid>

            {/* GDPR Consent */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="gdprConsent"
                    checked={formData.gdprConsent}
                    onChange={handleCheckboxChange}
                  />
                }
                label={
                  <span>
                    I consent to Aurigraph processing my information in accordance with the{' '}
                    <strong>Privacy Policy</strong> *
                  </span>
                }
              />
              {validationErrors.gdprConsent && (
                <Typography color="error" variant="caption">
                  {validationErrors.gdprConsent}
                </Typography>
              )}
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFormData({
                      firstName: '',
                      lastName: '',
                      email: '',
                      phone: '',
                      companyName: '',
                      jobTitle: '',
                      source: '',
                      inquiryType: '',
                      companySizeRange: '',
                      industry: '',
                      budgetRange: '',
                      gdprConsent: false,
                      message: '',
                    });
                    setValidationErrors({});
                  }}
                >
                  Clear
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={status === 'loading'}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  {status === 'loading' ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} /> Submitting...
                    </>
                  ) : (
                    'Request Demo'
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default InquiryForm;
