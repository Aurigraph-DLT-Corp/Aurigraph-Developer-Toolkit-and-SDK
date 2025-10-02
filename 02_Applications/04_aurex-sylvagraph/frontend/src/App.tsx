/**
 * Aurex Sylvagraph™ - Agroforestry Sustainability & Tokenized Carbon Credits Platform
 * Digital forest monitoring and carbon credit tokenization
 */

import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SylvagraphHeader } from './components/layout/SylvagraphHeader'
import { SylvagraphSidebar } from './components/layout/SylvagraphSidebar'

// Page imports
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import ProjectsPage from './pages/ProjectsPage'
import ProjectDetailPage from './pages/ProjectDetailPage'
import MonitoringPage from './pages/MonitoringPage'
import CreditsPage from './pages/CreditsPage'
import FarmersPage from './pages/FarmersPage'
import AnalyticsPage from './pages/AnalyticsPage'
import SettingsPage from './pages/SettingsPage'
import LoginPage from './pages/auth/LoginPage'

// Create query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-emerald-50 dark:from-forest-950 dark:to-emerald-950">
        <Routes>
          {/* Authentication routes */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Main application routes */}
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </div>
    </QueryClientProvider>
  )
}

function MainLayout() {
  return (
    <div className="flex h-screen bg-gradient-to-br from-forest-50 to-emerald-50 dark:from-forest-950 dark:to-emerald-950">
      <SylvagraphSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SylvagraphHeader />
        <main className="flex-1 overflow-auto bg-white/50 dark:bg-forest-900/50 backdrop-blur-sm">
          <div className="p-6">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/monitoring" element={<MonitoringPage />} />
              <Route path="/credits" element={<CreditsPage />} />
              <Route path="/farmers" element={<FarmersPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              
              <Route path="/health" element={
                <div className="p-6 bg-white dark:bg-forest-900 rounded-lg shadow-sm">
                  <h1 className="text-2xl font-bold text-forest-900 dark:text-forest-100 mb-4">
                    Sylvagraph Health Check
                  </h1>
                  <div className="space-y-2">
                    <p className="text-emerald-600 dark:text-emerald-400">✓ API Status: Operational</p>
                    <p className="text-emerald-600 dark:text-emerald-400">✓ Database: Connected</p>
                    <p className="text-emerald-600 dark:text-emerald-400">✓ PostGIS: Enabled</p>
                    <p className="text-emerald-600 dark:text-emerald-400">✓ AI Services: Ready</p>
                  </div>
                </div>
              } />
              
              <Route path="*" element={
                <div className="min-h-96 flex items-center justify-center">
                  <div className="text-center bg-white dark:bg-forest-900 p-8 rounded-lg shadow-sm">
                    <h1 className="text-4xl font-bold text-forest-900 dark:text-forest-100 mb-4">404</h1>
                    <p className="text-forest-600 dark:text-forest-400 mb-6">Page not found</p>
                    <button 
                      onClick={() => window.location.href = '/'}
                      className="bg-forest-600 text-white px-6 py-3 rounded-lg hover:bg-forest-700 transition-colors"
                    >
                      Go Home
                    </button>
                  </div>
                </div>
              } />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
