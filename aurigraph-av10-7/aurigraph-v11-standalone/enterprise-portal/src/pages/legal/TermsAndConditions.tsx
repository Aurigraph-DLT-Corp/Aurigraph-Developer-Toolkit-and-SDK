/**
 * Terms and Conditions Page
 */

import { Box, Card, CardContent, Typography, Divider } from '@mui/material'

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

export default function TermsAndConditions() {
  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Card sx={CARD_STYLE}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ color: '#fff', mb: 1 }}>Terms and Conditions</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
            Last Updated: December 10, 2025
          </Typography>

          <Typography sx={{ color: 'rgba(255,255,255,0.9)', mb: 3 }}>
            These Terms and Conditions ("Terms") govern your access to and use of the Aurigraph DLT
            Enterprise Portal and Demo Services ("Services") provided by Aurigraph DLT Corp ("Aurigraph").
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>1. Acceptance of Terms</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            By accessing or using our Services, you agree to be bound by these Terms. If you do not agree
            to these Terms, you may not access or use the Services.
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>2. Demo Services</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            The Demo Token Experience is provided for demonstration and evaluation purposes only.
            Demo tokens are temporary (48 hours) and have no real monetary value. The demo does not
            constitute financial advice or an offer to sell securities.
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>3. User Registration</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            To access certain features, you must register and provide accurate, complete information.
            You are responsible for maintaining the confidentiality of your account credentials.
            You agree to notify us immediately of any unauthorized use of your account.
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>4. Data Sharing Consent</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            By using the Demo Services, you consent to your registration data being shared with:
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', ml: 2, mb: 1 }}>
            • Aurigraph DLT Corp - for platform services and support
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', ml: 2, mb: 1 }}>
            • Aurigraph Hermes - for customer relationship management and follow-up communications
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mt: 2 }}>
            This sharing is necessary to provide you with the demo experience and potential
            business engagement opportunities.
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>5. Intellectual Property</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            All content, features, and functionality of the Services are owned by Aurigraph and are
            protected by international copyright, trademark, and other intellectual property laws.
            The demo content including "Cosmic Dreams #42" is for demonstration purposes only.
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>6. Prohibited Uses</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            You agree not to:
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', ml: 2, mb: 1 }}>
            • Use the Services for any unlawful purpose
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', ml: 2, mb: 1 }}>
            • Attempt to gain unauthorized access to any systems
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', ml: 2, mb: 1 }}>
            • Interfere with or disrupt the Services
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', ml: 2, mb: 1 }}>
            • Reverse engineer or decompile any part of the Services
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', ml: 2, mb: 1 }}>
            • Use demo data for any commercial purpose
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>7. Disclaimer of Warranties</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            THE SERVICES ARE PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. AURIGRAPH DISCLAIMS ALL
            WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE.
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>8. Limitation of Liability</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            AURIGRAPH SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR
            PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICES.
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>9. Governing Law</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            These Terms shall be governed by and construed in accordance with the laws of Delaware, USA,
            without regard to conflict of law provisions.
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>10. Contact</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Questions about these Terms should be sent to:
          </Typography>
          <Typography sx={{ color: '#00BFA5', mt: 1 }}>
            Email: legal@aurigraph.io
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
