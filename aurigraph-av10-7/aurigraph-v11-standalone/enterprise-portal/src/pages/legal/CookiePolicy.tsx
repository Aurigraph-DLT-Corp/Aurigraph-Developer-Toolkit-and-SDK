/**
 * Cookie Policy Page
 */

import { Box, Card, CardContent, Typography, Divider, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

const cookies = [
  { name: 'aurigraph_session', purpose: 'Session management', type: 'Essential', duration: 'Session' },
  { name: 'aurigraph_demo_user', purpose: 'Demo user registration data', type: 'Essential', duration: '24 months' },
  { name: 'aurigraph_demo_tokens', purpose: 'Demo token persistence', type: 'Functional', duration: '48 hours' },
  { name: 'aurigraph_preferences', purpose: 'User preferences', type: 'Functional', duration: '12 months' },
  { name: 'aurigraph_analytics', purpose: 'Usage analytics', type: 'Analytics', duration: '12 months' },
]

export default function CookiePolicy() {
  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Card sx={CARD_STYLE}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ color: '#fff', mb: 1 }}>Cookie Policy</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
            Last Updated: December 10, 2025
          </Typography>

          <Typography sx={{ color: 'rgba(255,255,255,0.9)', mb: 3 }}>
            This Cookie Policy explains how Aurigraph DLT Corp ("Aurigraph") uses cookies and similar
            technologies on the Enterprise Portal and Demo Services.
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>1. What Are Cookies?</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            Cookies are small text files stored on your device when you visit our website. They help us
            provide a better user experience by remembering your preferences and enabling certain features.
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>2. Types of Cookies We Use</Typography>

          <Typography variant="subtitle1" sx={{ color: '#4ECDC4', mt: 2, mb: 1 }}>Essential Cookies</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            These cookies are necessary for the website to function and cannot be switched off. They are
            usually set in response to actions you take, such as setting your privacy preferences or
            logging in.
          </Typography>

          <Typography variant="subtitle1" sx={{ color: '#4ECDC4', mt: 2, mb: 1 }}>Functional Cookies</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            These cookies enable enhanced functionality and personalization. They may be set by us or
            third-party providers whose services we use. If you do not allow these cookies, some or all
            of these services may not function properly.
          </Typography>

          <Typography variant="subtitle1" sx={{ color: '#4ECDC4', mt: 2, mb: 1 }}>Analytics Cookies</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            These cookies help us understand how visitors interact with our website by collecting and
            reporting information anonymously.
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>3. Cookies We Use</Typography>

          <Table sx={{ '& td, & th': { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#00BFA5', fontWeight: 600 }}>Cookie Name</TableCell>
                <TableCell sx={{ color: '#00BFA5', fontWeight: 600 }}>Purpose</TableCell>
                <TableCell sx={{ color: '#00BFA5', fontWeight: 600 }}>Type</TableCell>
                <TableCell sx={{ color: '#00BFA5', fontWeight: 600 }}>Duration</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cookies.map(cookie => (
                <TableRow key={cookie.name}>
                  <TableCell sx={{ fontFamily: 'monospace', color: '#4ECDC4' }}>{cookie.name}</TableCell>
                  <TableCell>{cookie.purpose}</TableCell>
                  <TableCell>{cookie.type}</TableCell>
                  <TableCell>{cookie.duration}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>4. Local Storage</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            In addition to cookies, we use browser local storage to persist demo tokens and user
            registration data. This data is stored locally on your device and helps provide a seamless
            demo experience.
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
            Demo tokens expire after 48 hours. User registration data is retained in local storage
            until you clear your browser data or request deletion.
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>5. Managing Cookies</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
            You can control and/or delete cookies as you wish. You can delete all cookies that are
            already on your computer and you can set most browsers to prevent them from being placed.
            However, if you do this, you may have to manually adjust some preferences every time you
            visit our site, and some services and functionalities may not work.
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
            To manage cookies in your browser:
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', ml: 2 }}>
            • Chrome: Settings &gt; Privacy and Security &gt; Cookies
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', ml: 2 }}>
            • Firefox: Options &gt; Privacy & Security &gt; Cookies
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', ml: 2 }}>
            • Safari: Preferences &gt; Privacy &gt; Cookies
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', ml: 2 }}>
            • Edge: Settings &gt; Privacy, search, and services &gt; Cookies
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 3 }} />

          <Typography variant="h6" sx={{ color: '#00BFA5', mb: 2 }}>6. Contact Us</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
            If you have questions about our use of cookies:
          </Typography>
          <Typography sx={{ color: '#00BFA5', mt: 1 }}>
            Email: privacy@aurigraph.io
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}
