import { Outlet } from 'react-router-dom'
import { Box, AppBar, Toolbar, Typography, IconButton, Menu, MenuItem, Button, Chip } from '@mui/material'
import { Dashboard, Receipt, Speed, Hub, Analytics, Settings, Logout, PlayCircleOutline,
  AccountTree, Code, Token, Gavel, SwapHoriz, Inventory, AccountBalance, ShowChart,
  VerifiedUser, Assessment, TrendingUp, HealthAndSafety, Storage, Schema, Api,
  Security, DeveloperBoard, Description, Insights, ArrowDropDown } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../hooks'
import { logout } from '../store/authSlice'
import { useState } from 'react'

const navigationMenus = [
  {
    title: 'Main',
    items: [
      { text: 'Dashboard', path: '/' },
    ]
  },
  {
    title: 'Core',
    items: [
      { text: 'Transactions', path: '/transactions' },
      { text: 'Performance', path: '/performance' },
      { text: 'ML Performance', path: '/ml-performance', badge: 'NEW' },
      { text: 'Nodes', path: '/nodes' },
      { text: 'Analytics', path: '/analytics' },
    ]
  },
  {
    title: 'Channels',
    badge: 'NEW',
    items: [
      { text: 'Multi-Channel', path: '/channels', badge: 'NEW' },
      { text: 'Smart Contracts', path: '/contracts', badge: 'NEW' },
      { text: 'Active Contracts', path: '/active-contracts' },
    ]
  },
  {
    title: 'Tokenization',
    items: [
      { text: 'Token Registry', path: '/tokens', badge: '3.1' },
      { text: 'Tokenization', path: '/tokenization' },
      { text: 'Merkle Tree Registry', path: '/merkle-tree', badge: 'NEW' },
    ]
  },
  {
    title: 'RWA',
    badge: 'NEW',
    items: [
      { text: 'Tokenize Asset', path: '/rwa/tokenize', badge: 'NEW' },
      { text: 'My Portfolio', path: '/rwa/portfolio' },
      { text: 'Asset Valuation', path: '/rwa/valuation' },
      { text: 'Dividends', path: '/rwa/dividends' },
      { text: 'Compliance', path: '/rwa/compliance' },
    ]
  },
  {
    title: 'Dashboards',
    badge: 'NEW',
    items: [
      { text: 'System Health', path: '/dashboards/system-health' },
      { text: 'Blockchain Ops', path: '/dashboards/blockchain-operations' },
      { text: 'Consensus', path: '/dashboards/consensus-monitoring' },
      { text: 'External APIs', path: '/dashboards/external-api' },
      { text: 'Oracles', path: '/dashboards/oracle-service' },
      { text: 'Performance', path: '/dashboards/performance-metrics' },
      { text: 'Security', path: '/dashboards/security-audit' },
      { text: 'Developer', path: '/dashboards/developer' },
      { text: 'Ricardian', path: '/dashboards/ricardian-contracts' },
    ]
  },
  {
    title: 'Settings',
    items: [
      { text: 'Channel Config', path: '/channel-management' },
      { text: 'Settings', path: '/settings' },
    ]
  },
]

export default function Layout() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [anchorEls, setAnchorEls] = useState<{ [key: string]: HTMLElement | null }>({})

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const handleMenuOpen = (menu: string, event: React.MouseEvent<HTMLElement>) => {
    setAnchorEls({ ...anchorEls, [menu]: event.currentTarget })
  }

  const handleMenuClose = (menu: string) => {
    setAnchorEls({ ...anchorEls, [menu]: null })
  }

  const handleNavigate = (path: string, menu: string) => {
    navigate(path)
    handleMenuClose(menu)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: '#1A1F3A',
        boxShadow: '0 4px 20px rgba(0, 255, 163, 0.1)',
        borderBottom: '1px solid rgba(0, 255, 163, 0.1)'
      }}>
        <Toolbar sx={{ gap: 3, py: 1.5 }}>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              mr: 2,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #00FFA3, #0A84FF)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              minWidth: 'fit-content'
            }}
          >
            Aurigraph V11 Enterprise Portal - v4.8.0
          </Typography>

          {/* Top Navigation Menus */}
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {/* Demo Tab - Direct Access */}
            <Button
              color="inherit"
              onClick={() => navigate('/demo')}
              startIcon={<PlayCircleOutline />}
              sx={{
                textTransform: 'none',
                bgcolor: 'rgba(0, 191, 165, 0.15)',
                '&:hover': { bgcolor: 'rgba(0, 191, 165, 0.25)' },
                borderRadius: 1,
                px: 2,
              }}
            >
              Demo
              <Chip
                label="LIVE"
                size="small"
                color="success"
                sx={{ ml: 1, height: 18, fontSize: '0.65rem', fontWeight: 'bold' }}
              />
            </Button>

            {navigationMenus.map((menu) => (
              <Box key={menu.title}>
                <Button
                  color="inherit"
                  onClick={(e) => handleMenuOpen(menu.title, e)}
                  endIcon={<ArrowDropDown />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    fontSize: '0.95rem',
                    px: 1.5,
                    py: 1,
                    transition: 'all 0.2s ease',
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'rgba(0, 255, 163, 0.15)',
                      transform: 'translateY(-2px)',
                    },
                    '&:active': {
                      bgcolor: 'rgba(0, 255, 163, 0.25)',
                    }
                  }}
                >
                  {menu.title}
                  {menu.badge && (
                    <Chip
                      label={menu.badge}
                      size="small"
                      color="primary"
                      sx={{ ml: 1, height: 18, fontSize: '0.65rem' }}
                    />
                  )}
                </Button>
                <Menu
                  anchorEl={anchorEls[menu.title]}
                  open={Boolean(anchorEls[menu.title])}
                  onClose={() => handleMenuClose(menu.title)}
                  PaperProps={{
                    sx: {
                      bgcolor: '#1A1F3A',
                      color: 'white',
                      minWidth: 200,
                    }
                  }}
                >
                  {menu.items.map((item) => (
                    <MenuItem
                      key={item.path}
                      onClick={() => handleNavigate(item.path, menu.title)}
                      sx={{
                        '&:hover': { bgcolor: 'rgba(0, 191, 165, 0.1)' }
                      }}
                    >
                      {item.text}
                      {item.badge && (
                        <Chip
                          label={item.badge}
                          size="small"
                          color={item.badge === 'NEW' ? 'primary' : 'secondary'}
                          sx={{ ml: 'auto', height: 18, fontSize: '0.65rem' }}
                        />
                      )}
                    </MenuItem>
                  ))}
                </Menu>
              </Box>
            ))}
          </Box>

          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        <Outlet />
      </Box>
    </Box>
  )
}