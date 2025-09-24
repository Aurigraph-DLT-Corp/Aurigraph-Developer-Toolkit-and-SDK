import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.tsx';
import CarbonTraceLandingPage from './pages/CarbonTraceLandingPage.tsx';
import HomePage from './pages/HomePage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import ProtectedRoute from './components/auth/ProtectedRoute.tsx';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Login route */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Main landing page - public */}
          <Route path="/" element={<CarbonTraceLandingPage />} />
          
          {/* Legacy homepage - protected */}
          <Route path="/home" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          
          {/* Protected application pages */}
          <Route path="/emission-tracking" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                  <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Emission Tracking Dashboard
                  </h1>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600">
                      Real-time emission tracking and monitoring dashboard will be available here.
                    </p>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/carbon-accounting" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                  <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Carbon Accounting Suite
                  </h1>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600">
                      Comprehensive carbon accounting and reporting tools will be available here.
                    </p>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/supply-chain" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                  <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Supply Chain Carbon Tracking
                  </h1>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600">
                      Supply chain carbon footprint analysis and optimization tools will be available here.
                    </p>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          {/* Fallback to landing page */}
          <Route path="*" element={<CarbonTraceLandingPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;