/**
 * Aurex HydroPulse™ - Professional Water Management Platform
 * Comprehensive AWD implementation with IoT integration and real-time monitoring
 */

import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import { PageLoading } from './components/ui/LoadingSpinner';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const FacilityManagement = React.lazy(() => import('./pages/FacilityManagement'));
const SensorMonitoring = React.lazy(() => import('./pages/SensorMonitoring'));
const WaterQuality = React.lazy(() => import('./pages/WaterQuality'));
const AWDEducation = React.lazy(() => import('./pages/AWDEducation'));
const Conservation = React.lazy(() => import('./pages/Conservation'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Support = React.lazy(() => import('./pages/Support'));

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ErrorBoundary>
          <Layout>
            <Suspense fallback={<PageLoading message="Loading HydroPulse..." />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                
                {/* Application Routes */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/facilities" element={<FacilityManagement />} />
                <Route path="/sensors" element={<SensorMonitoring />} />
                <Route path="/water-quality" element={<WaterQuality />} />
                <Route path="/education" element={<AWDEducation />} />
                <Route path="/conservation" element={<Conservation />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/support" element={<Support />} />
                
                {/* Legacy Routes for Backward Compatibility */}
                <Route path="/farmer-dashboard" element={<Dashboard />} />
                <Route path="/sensor-data" element={<SensorMonitoring />} />
                
                {/* Health Check Route */}
                <Route path="/health" element={
                  <div className="p-8">
                    <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-6 text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h1 className="text-xl font-bold text-gray-900 mb-2">HydroPulse Health Check</h1>
                      <p className="text-green-600 font-medium">Status: Operational</p>
                      <p className="text-sm text-gray-500 mt-2">All systems running normally</p>
                    </div>
                  </div>
                } />
                
                {/* 404 Error Route */}
                <Route path="*" element={
                  <div className="min-h-screen flex items-center justify-center bg-gray-50">
                    <div className="text-center px-4">
                      <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">💧</span>
                      </div>
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                      <p className="text-xl text-gray-600 mb-2">Page not found</p>
                      <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                        The page you're looking for doesn't exist or has been moved.
                      </p>
                      <div className="space-x-4">
                        <a 
                          href="/" 
                          className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                          Go Home
                        </a>
                        <a 
                          href="/dashboard" 
                          className="inline-flex items-center bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium"
                        >
                          Go to Dashboard
                        </a>
                      </div>
                    </div>
                  </div>
                } />
              </Routes>
            </Suspense>
          </Layout>
        </ErrorBoundary>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#374151',
              border: '1px solid #e5e7eb',
              borderRadius: '0.75rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </Router>
    </QueryClientProvider>
  );
};

export default App;
