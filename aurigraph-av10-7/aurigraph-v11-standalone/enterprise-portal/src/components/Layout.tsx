import { Outlet } from 'react-router-dom'
import { Box, AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemIcon, ListItemText, IconButton, Divider, Chip } from '@mui/material'
import { Dashboard, Receipt, Speed, Hub, Analytics, Settings, Logout, PlayCircleOutline,
  AccountTree, Code, Token, Gavel, SwapHoriz, Inventory, AccountBalance, ShowChart,
  VerifiedUser, Assessment, TrendingUp } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch } from '../hooks'
import { logout } from '../store/authSlice'

const drawerWidth = 260

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  { text: 'Live Demo', icon: <PlayCircleOutline />, path: '/demo' },
  { divider: true, label: 'Core Features' },
  { text: 'Transactions', icon: <Receipt />, path: '/transactions' },
  { text: 'Performance', icon: <Speed />, path: '/performance' },
  { text: 'Nodes', icon: <Hub />, path: '/nodes' },
  { text: 'Analytics', icon: <Analytics />, path: '/analytics' },
  { divider: true, label: 'Channels & Contracts' },
  { text: 'Multi-Channel', icon: <AccountTree />, path: '/channels', badge: 'NEW' },
  { text: 'Smart Contracts', icon: <Code />, path: '/contracts', badge: 'NEW' },
  { text: 'Active Contracts', icon: <Gavel />, path: '/active-contracts' },
  { divider: true, label: 'Tokenization' },
  { text: 'Token Registry', icon: <Token />, path: '/tokens', badge: '3.1' },
  { text: 'Tokenization', icon: <SwapHoriz />, path: '/tokenization' },
  { divider: true, label: 'RWA Tokenization', badge: 'NEW' },
  { text: 'Tokenize Asset', icon: <AccountBalance />, path: '/rwa/tokenize', badge: 'NEW' },
  { text: 'My Portfolio', icon: <TrendingUp />, path: '/rwa/portfolio' },
  { text: 'Asset Valuation', icon: <ShowChart />, path: '/rwa/valuation' },
  { text: 'Dividends', icon: <Assessment />, path: '/rwa/dividends' },
  { text: 'Compliance', icon: <VerifiedUser />, path: '/rwa/compliance' },
  { divider: true, label: 'Management' },
  { text: 'Channel Config', icon: <Inventory />, path: '/channel-management' },
  { text: 'Settings', icon: <Settings />, path: '/settings' },
]

export default function Layout() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Aurigraph V11 Enterprise Portal - Release 3.1
          </Typography>
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: '#1A1F3A',
            color: 'white',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item, index) => (
              item.divider ? (
                <Box key={index}>
                  <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
                  {item.label && (
                    <Typography variant="caption" sx={{ px: 2, color: 'rgba(255,255,255,0.5)' }}>
                      {item.label}
                    </Typography>
                  )}
                </Box>
              ) : (
                <ListItem
                  button
                  key={item.text}
                  onClick={() => navigate(item.path)}
                  sx={{
                    '&:hover': {
                      bgcolor: 'rgba(0, 191, 165, 0.1)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: '#00BFA5' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                  {item.badge && (
                    <Chip
                      label={item.badge}
                      size="small"
                      color={item.badge === 'NEW' ? 'primary' : 'secondary'}
                      sx={{ height: 20 }}
                    />
                  )}
                </ListItem>
              )
            ))}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}