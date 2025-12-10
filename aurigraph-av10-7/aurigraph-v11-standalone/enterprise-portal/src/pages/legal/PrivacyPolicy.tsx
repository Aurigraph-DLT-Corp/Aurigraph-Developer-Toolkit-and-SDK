/**
 * Privacy Policy Page
 * GDPR, CCPA, and International Privacy Law Compliant
 */

import { Box, Card, CardContent, Typography, Divider, List, ListItem, ListItemText } from '@mui/material'

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

export default function PrivacyPolicy() {
  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Card sx={CARD_STYLE}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ color: '#fff', mb: 1 }}>Privacy Policy</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
            Last Updated: December 10, 2025
          </Typography>

          <Typography sx={{ color: 'rgba(255,255,255,0.9)', mb: 3 }}>
            Aurigraph DLT Corp ("Aurigraph", "we", "us", or "our") is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
            you use our Enterprise Portal and Demo Services.
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>1. Information We Collect</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            We collect information you provide directly to us, including:
          </Typography>
          <List>
            {[
              'Personal identifiers (name, email address, phone number)',
              'Professional information (company name, job title)',
              'Geographic location (country)',
              'Areas of interest in tokenization services',
              'Usage data and interaction with our demo services',
              'Device and browser information',
            ].map((item, i) => (
              <ListItem key={i} sx={{ py: 0 }}>
                <ListItemText primary={item} primaryTypographyProps={{ color: 'rgba(255,255,255,0.7)' }} />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>2. How We Use Your Information</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            We use the information we collect to:
          </Typography>
          <List>
            {[
              'Provide, maintain, and improve our demo services',
              'Send you technical notices and support messages',
              'Respond to your comments and questions',
              'Provide sales and marketing communications (with consent)',
              'Share with Aurigraph Hermes for customer relationship management',
              'Analyze usage patterns to improve our platform',
              'Comply with legal obligations',
            ].map((item, i) => (
              <ListItem key={i} sx={{ py: 0 }}>
                <ListItemText primary={item} primaryTypographyProps={{ color: 'rgba(255,255,255,0.7)' }} />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>3. Data Sharing</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            Your information may be shared with:
          </Typography>
          <List>
            {[
              'Aurigraph Hermes (our CRM subsidiary) for customer engagement',
              'Service providers who assist in operating our platform',
              'Legal authorities when required by law',
              'Business partners with your explicit consent',
            ].map((item, i) => (
              <ListItem key={i} sx={{ py: 0 }}>
                <ListItemText primary={item} primaryTypographyProps={{ color: 'rgba(255,255,255,0.7)' }} />
              </ListItem>
            ))}
          </List>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mt: 2 }}>
            We do NOT sell your personal information to third parties.
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>4. Your Rights (GDPR/CCPA)</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            Depending on your location, you have the following rights:
          </Typography>
          <List>
            {[
              'Right to Access: Request a copy of your personal data',
              'Right to Rectification: Correct inaccurate personal data',
              'Right to Erasure: Request deletion of your personal data',
              'Right to Data Portability: Receive your data in a portable format',
              'Right to Object: Object to processing for marketing purposes',
              'Right to Withdraw Consent: Withdraw consent at any time',
              'Right to Lodge a Complaint: File a complaint with a supervisory authority',
            ].map((item, i) => (
              <ListItem key={i} sx={{ py: 0 }}>
                <ListItemText primary={item} primaryTypographyProps={{ color: 'rgba(255,255,255,0.7)' }} />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>5. Data Retention</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            Demo registration data is retained for 24 months from last activity. You may request
            deletion at any time by contacting privacy@aurigraph.io.
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>6. International Transfers</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            Your data may be transferred to and processed in countries outside your residence.
            We ensure appropriate safeguards (Standard Contractual Clauses, adequacy decisions)
            are in place for such transfers.
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>7. Contact Us</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
            For privacy inquiries or to exercise your rights:
          </Typography>
          <Typography sx={{ color: '#00BFA5', mt: 1 }}>
            Email: privacy@aurigraph.io
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Aurigraph DLT Corp, Data Protection Officer
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
