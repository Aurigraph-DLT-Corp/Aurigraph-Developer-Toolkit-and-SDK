import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'

// Pages
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Organizations from './pages/Organizations'
import SystemSettings from './pages/SystemSettings'
import Applications from './pages/Applications'
import Monitoring from './pages/Monitoring'
import AuditLogs from './pages/AuditLogs'
import Login from './pages/Login'
import NotFound from './pages/NotFound'

// Components
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error) => {
        if (error && typeof error === 'object' && 'status' in error) {
          // Don't retry for authentication errors
          if (error.status === 401 || error.status === 403) {
            return false
          }
        }
        return failureCount < 3
      },
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router basename={import.meta.env.BASE_URL}>
        <div className="min-h-screen bg-admin-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="organizations" element={<Organizations />} />
              <Route path="applications" element={<Applications />} />
              <Route path="monitoring" element={<Monitoring />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="settings" element={<SystemSettings />} />
            </Route>

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                borderRadius: '8px',
                border: '1px solid #334155',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f1f5f9',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f1f5f9',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  )
}

export default App