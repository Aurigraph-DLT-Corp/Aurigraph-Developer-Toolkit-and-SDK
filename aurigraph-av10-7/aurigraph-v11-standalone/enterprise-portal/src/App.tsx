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
import Registration from './pages/auth/Registration'
import Profile from './pages/auth/Profile'
import DemoApp from './DemoApp'
import DemoTokenExperience from './pages/demo/DemoTokenExperience'
import DemoRegistration from './pages/demo/DemoRegistration'
import DemoProtectedRoute from './components/DemoProtectedRoute'
import PrivacyPolicy from './pages/legal/PrivacyPolicy'
import TermsAndConditions from './pages/legal/TermsAndConditions'
import CookiePolicy from './pages/legal/CookiePolicy'
import HighThroughputDemo from './components/HighThroughputDemo'
import MultiChannelDashboard from './components/MultiChannelDashboard'
import ChannelDemo from './components/ChannelDemo'
import SmartContractRegistry from './components/SmartContractRegistry'
import TokenizationRegistry from './components/TokenizationRegistry'
import ActiveContracts from './components/ActiveContracts'
import ChannelManagement from './components/ChannelManagement'
import Tokenization from './components/Tokenization'
import ErrorBoundary from './components/ErrorBoundary'
import { useAppSelector } from './hooks'

// ML Performance
import MLPerformanceDashboard from './pages/dashboards/MLPerformanceDashboard'

// Tokenization - Merkle Tree & QuantConnect
import MerkleTreeRegistry from './components/MerkleTreeRegistry'
import QuantConnectRegistry from './components/QuantConnectRegistry'
import RWARegistryNavigation from './components/RWARegistryNavigation'

// RWA Pages
import TokenizeAsset from './pages/rwa/TokenizeAsset'
import Portfolio from './pages/rwa/Portfolio'
import Valuation from './pages/rwa/Valuation'
import Dividends from './pages/rwa/Dividends'
import Compliance from './pages/rwa/Compliance'

// Dashboard Pages
import SystemHealth from './pages/dashboards/SystemHealth'
import BlockchainOperations from './pages/dashboards/BlockchainOperations'
import ConsensusMonitoring from './pages/dashboards/ConsensusMonitoring'
import ExternalAPIIntegration from './pages/dashboards/ExternalAPIIntegration'
import OracleService from './pages/dashboards/OracleService'
import PerformanceMetrics from './pages/dashboards/PerformanceMetrics'
import SecurityAudit from './pages/dashboards/SecurityAudit'
import DeveloperDashboard from './pages/dashboards/DeveloperDashboard'
import RicardianContracts from './pages/dashboards/RicardianContracts'

// Sprint 4: Portal & Analytics Enhancement Dashboards (AV11-308 EPIC)
import StreamingDataDashboard from './pages/dashboards/StreamingDataDashboard'
import BusinessMetricsDashboard from './pages/dashboards/BusinessMetricsDashboard'
import NetworkTopologyDashboard from './pages/dashboards/NetworkTopologyDashboard'
import CostOptimizationDashboard from './pages/dashboards/CostOptimizationDashboard'

function App() {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated)

  return (
    <ErrorBoundary>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Registration />} />
          <Route path="/" element={isAuthenticated ? <Layout /> : <Navigate to="/login" replace />}>
            <Route index element={<Dashboard />} />
            <Route path="demo" element={<DemoApp />} />
            <Route path="demo/high-throughput" element={<HighThroughputDemo />} />
            <Route path="demo/token-experience" element={
              <DemoProtectedRoute>
                <DemoTokenExperience />
              </DemoProtectedRoute>
            } />
            <Route path="demo/register" element={<DemoRegistration />} />

            {/* Legal Pages */}
            <Route path="legal/privacy" element={<PrivacyPolicy />} />
            <Route path="legal/terms" element={<TermsAndConditions />} />
            <Route path="legal/cookies" element={<CookiePolicy />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="performance" element={<Performance />} />
            <Route path="nodes" element={<NodeManagement />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
            <Route path="channels" element={<MultiChannelDashboard />} />
            <Route path="channels/:channelId/demo" element={<ChannelDemo channelId="main" />} />
            <Route path="contracts" element={<SmartContractRegistry />} />
            <Route path="active-contracts" element={<ActiveContracts />} />
            <Route path="tokens" element={<TokenizationRegistry />} />
            <Route path="tokenization" element={<Tokenization />} />
            <Route path="channel-management" element={<ChannelManagement />} />

            {/* ML Performance */}
            <Route path="ml-performance" element={<MLPerformanceDashboard />} />

            {/* Tokenization - Merkle Tree & QuantConnect */}
            <Route path="merkle-tree" element={<MerkleTreeRegistry />} />
            <Route path="quantconnect" element={<QuantConnectRegistry />} />

            {/* RWA Routes */}
            <Route path="rwa/tokenize" element={<TokenizeAsset />} />
            <Route path="rwa/portfolio" element={<Portfolio />} />
            <Route path="rwa/valuation" element={<Valuation />} />
            <Route path="rwa/dividends" element={<Dividends />} />
            <Route path="rwa/compliance" element={<Compliance />} />
            <Route path="rwa/registry-navigation" element={<RWARegistryNavigation />} />

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

            {/* Sprint 4: Portal & Analytics Enhancement (AV11-308 EPIC) */}
            <Route path="dashboards/streaming-data" element={<StreamingDataDashboard />} />
            <Route path="dashboards/business-metrics" element={<BusinessMetricsDashboard />} />
            <Route path="dashboards/network-topology" element={<NetworkTopologyDashboard />} />
            <Route path="dashboards/cost-optimization" element={<CostOptimizationDashboard />} />
          </Route>
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
        </Routes>
      </Box>
    </ErrorBoundary>
  )
}

export default App
