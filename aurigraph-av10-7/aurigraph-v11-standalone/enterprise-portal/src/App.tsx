import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@mui/material'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Performance from './pages/Performance'
import NodeManagement from './pages/NodeManagement'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Login from './pages/Login'
import DemoApp from './DemoApp'
import MultiChannelDashboard from './components/MultiChannelDashboard'
import ChannelDemo from './components/ChannelDemo'
import SmartContractRegistry from './components/SmartContractRegistry'
import TokenizationRegistry from './components/TokenizationRegistry'
import ActiveContracts from './components/ActiveContracts'
import ChannelManagement from './components/ChannelManagement'
import Tokenization from './components/Tokenization'
import ErrorBoundary from './components/ErrorBoundary'
import { useAppSelector } from './hooks'
import {
  SystemHealth,
  BlockchainOperations,
  ConsensusMonitoring,
  ExternalAPIIntegration,
  OracleService,
  PerformanceMetrics,
  SecurityAudit,
  DeveloperDashboard,
  RicardianContracts,
} from './pages/dashboards'

function App() {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)

  return (
    <ErrorBoundary>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<Dashboard />} />
          <Route path="demo" element={<DemoApp />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="performance" element={<Performance />} />
          <Route path="nodes" element={<NodeManagement />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="channels" element={<MultiChannelDashboard />} />
          <Route path="channels/:channelId/demo" element={<ChannelDemo channelId="main" />} />
          <Route path="contracts" element={<SmartContractRegistry />} />
          <Route path="active-contracts" element={<ActiveContracts />} />
          <Route path="tokens" element={<TokenizationRegistry />} />
          <Route path="tokenization" element={<Tokenization />} />
          <Route path="channel-management" element={<ChannelManagement />} />
          {/* Dashboard Routes */}
          <Route path="dashboards/system-health" element={<SystemHealth />} />
          <Route path="dashboards/blockchain-operations" element={<BlockchainOperations />} />
          <Route path="dashboards/consensus-monitoring" element={<ConsensusMonitoring />} />
          <Route path="dashboards/external-api" element={<ExternalAPIIntegration />} />
          <Route path="dashboards/oracle-service" element={<OracleService />} />
          <Route path="dashboards/performance-metrics" element={<PerformanceMetrics />} />
          <Route path="dashboards/security-audit" element={<SecurityAudit />} />
          <Route path="dashboards/developer" element={<DeveloperDashboard />} />
          <Route path="dashboards/ricardian-contracts" element={<RicardianContracts />} />
        </Route>
      </Routes>
      </Box>
    </ErrorBoundary>
  )
}

export default App