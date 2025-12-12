/**
 * User Profile Page
 *
 * Displays and allows editing of the current user's profile.
 * Includes account settings, password change, and activity history.
 *
 * @author Aurigraph DLT Development Team
 * @since V12.0.0
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Grid,
  Divider,
  Avatar,
  Tab,
  Tabs,
  CircularProgress,
  Chip,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Person,
  Email,
  Lock,
  Security,
  History,
  Edit,
  Save,
  Cancel,
  Visibility,
  VisibilityOff,
  VerifiedUser,
  Warning,
} from '@mui/icons-material'
import { useAppSelector, useAppDispatch } from '../../hooks'
import { logout } from '../../store/authSlice'

const CARD_STYLE = {
  background: 'linear-gradient(135deg, #1A1F3A 0%, #2A3050 100%)',
  border: '1px solid rgba(255,255,255,0.1)',
}

const THEME_COLORS = {
  primary: '#00BFA5',
  secondary: '#4ECDC4',
  warning: '#FFD93D',
  error: '#E74C3C',
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

interface UserProfile {
  id: string
  username: string
  email: string
  roleName: string
  roleId: string
  status: string
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  failedLoginAttempts: number
  isLocked: boolean
}

export default function Profile() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { user, token } = useAppSelector(state => state.auth)

  const [activeTab, setActiveTab] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  })
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Edit form state
  const [editForm, setEditForm] = useState({
    email: '',
  })

  useEffect(() => {
    if (user?.id) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [user?.id])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/v12/users/${user?.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setEditForm({ email: data.email })
      } else if (response.status === 401) {
        dispatch(logout())
        navigate('/login')
      } else {
        setError('Failed to load profile')
      }
    } catch (err) {
      // Fallback to local user data if API fails
      if (user) {
        setProfile({
          id: user.id,
          username: user.username,
          email: '',
          roleName: user.role,
          roleId: '',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLoginAt: null,
          failedLoginAttempts: 0,
          isLocked: false,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/v12/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: editForm.email,
        }),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setProfile(updatedProfile)
        setEditing(false)
        setSuccess('Profile updated successfully')
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to update profile')
      }
    } catch (err) {
      setError('Unable to save changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError(null)

    if (passwords.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    try {
      const response = await fetch(`/api/v12/users/${user?.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          newPassword: passwords.newPassword,
        }),
      })

      if (response.ok) {
        setPasswordDialogOpen(false)
        setPasswords({ newPassword: '', confirmPassword: '' })
        setSuccess('Password changed successfully')
      } else {
        const data = await response.json()
        setPasswordError(data.message || 'Failed to change password')
      }
    } catch (err) {
      setPasswordError('Unable to change password. Please try again.')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success'
      case 'INACTIVE': return 'default'
      case 'SUSPENDED': return 'error'
      case 'PENDING_VERIFICATION': return 'warning'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: THEME_COLORS.primary }} />
      </Box>
    )
  }

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Please log in to view your profile.</Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      {/* Header Card */}
      <Card sx={{ ...CARD_STYLE, mb: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: THEME_COLORS.primary,
                  fontSize: '2rem',
                }}
              >
                {(profile?.username || user.username)?.charAt(0).toUpperCase()}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h4" sx={{ color: '#fff', mb: 1 }}>
                {profile?.username || user.username}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={profile?.roleName || user.role}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(0, 191, 165, 0.2)',
                    color: THEME_COLORS.primary,
                    border: `1px solid ${THEME_COLORS.primary}`,
                  }}
                />
                <Chip
                  label={profile?.status || 'ACTIVE'}
                  size="small"
                  color={getStatusColor(profile?.status || 'ACTIVE') as any}
                />
                {profile?.isLocked && (
                  <Chip
                    icon={<Warning />}
                    label="Account Locked"
                    size="small"
                    color="error"
                  />
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Alerts */}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Main Content */}
      <Card sx={CARD_STYLE}>
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': { color: 'rgba(255,255,255,0.7)' },
              '& .Mui-selected': { color: THEME_COLORS.primary },
              '& .MuiTabs-indicator': { bgcolor: THEME_COLORS.primary },
            }}
          >
            <Tab icon={<Person />} label="Profile" iconPosition="start" />
            <Tab icon={<Security />} label="Security" iconPosition="start" />
            <Tab icon={<History />} label="Activity" iconPosition="start" />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {/* Profile Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
              {editing ? (
                <>
                  <Button
                    startIcon={<Cancel />}
                    onClick={() => {
                      setEditing(false)
                      setEditForm({ email: profile?.email || '' })
                    }}
                    sx={{ mr: 1, color: 'rgba(255,255,255,0.7)' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                    onClick={handleSaveProfile}
                    disabled={saving}
                    sx={{ bgcolor: THEME_COLORS.primary }}
                  >
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  startIcon={<Edit />}
                  onClick={() => setEditing(true)}
                  sx={{ color: THEME_COLORS.primary }}
                >
                  Edit Profile
                </Button>
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Username"
                  value={profile?.username || user.username}
                  disabled
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: 'rgba(255,255,255,0.5)' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': { color: '#fff' },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '& .Mui-disabled': { color: 'rgba(255,255,255,0.5)', '-webkit-text-fill-color': 'rgba(255,255,255,0.5)' },
                  }}
                  helperText="Username cannot be changed"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={editing ? editForm.email : profile?.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: 'rgba(255,255,255,0.5)' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': { color: '#fff' },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '& .Mui-disabled': { color: 'rgba(255,255,255,0.5)', '-webkit-text-fill-color': 'rgba(255,255,255,0.5)' },
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Role"
                  value={profile?.roleName || user.role}
                  disabled
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VerifiedUser sx={{ color: 'rgba(255,255,255,0.5)' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': { color: '#fff' },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '& .Mui-disabled': { color: 'rgba(255,255,255,0.5)', '-webkit-text-fill-color': 'rgba(255,255,255,0.5)' },
                  }}
                  helperText="Contact admin to change role"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Account Status"
                  value={profile?.status || 'ACTIVE'}
                  disabled
                  sx={{
                    '& .MuiOutlinedInput-root': { color: '#fff' },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                    '& .Mui-disabled': { color: 'rgba(255,255,255,0.5)', '-webkit-text-fill-color': 'rgba(255,255,255,0.5)' },
                  }}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Security Tab */}
          <TabPanel value={activeTab} index={1}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
              Security Settings
            </Typography>

            <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 3, borderRadius: 2, mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography sx={{ color: '#fff', fontWeight: 500 }}>
                    Password
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Change your account password
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<Lock />}
                  onClick={() => setPasswordDialogOpen(true)}
                  sx={{
                    borderColor: THEME_COLORS.primary,
                    color: THEME_COLORS.primary,
                  }}
                >
                  Change Password
                </Button>
              </Box>
            </Box>

            <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 3, borderRadius: 2 }}>
              <Typography sx={{ color: '#fff', fontWeight: 500, mb: 2 }}>
                Account Security Info
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Failed Login Attempts
                  </Typography>
                  <Typography sx={{ color: profile?.failedLoginAttempts ? THEME_COLORS.warning : '#fff' }}>
                    {profile?.failedLoginAttempts || 0}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                    Account Locked
                  </Typography>
                  <Typography sx={{ color: profile?.isLocked ? THEME_COLORS.error : THEME_COLORS.primary }}>
                    {profile?.isLocked ? 'Yes' : 'No'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          {/* Activity Tab */}
          <TabPanel value={activeTab} index={2}>
            <Typography variant="h6" sx={{ color: '#fff', mb: 3 }}>
              Account Activity
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 3, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                    Account Created
                  </Typography>
                  <Typography sx={{ color: '#fff' }}>
                    {formatDate(profile?.createdAt || null)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 3, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                    Last Updated
                  </Typography>
                  <Typography sx={{ color: '#fff' }}>
                    {formatDate(profile?.updatedAt || null)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 3, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                    Last Login
                  </Typography>
                  <Typography sx={{ color: '#fff' }}>
                    {formatDate(profile?.lastLoginAt || null)}
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 3, borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1 }}>
                    User ID
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {profile?.id || user.id}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Password Change Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={() => {
          setPasswordDialogOpen(false)
          setPasswords({ newPassword: '', confirmPassword: '' })
          setPasswordError(null)
        }}
        PaperProps={{
          sx: {
            bgcolor: '#1A1F3A',
            color: '#fff',
            minWidth: 400,
          },
        }}
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          {passwordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {passwordError}
            </Alert>
          )}

          <TextField
            fullWidth
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    sx={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': { color: '#fff' },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
            }}
          />

          <TextField
            fullWidth
            label="Confirm New Password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    sx={{ color: 'rgba(255,255,255,0.5)' }}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mt: 2,
              '& .MuiOutlinedInput-root': { color: '#fff' },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setPasswordDialogOpen(false)
              setPasswords({ newPassword: '', confirmPassword: '' })
              setPasswordError(null)
            }}
            sx={{ color: 'rgba(255,255,255,0.7)' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleChangePassword}
            sx={{ bgcolor: THEME_COLORS.primary }}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
