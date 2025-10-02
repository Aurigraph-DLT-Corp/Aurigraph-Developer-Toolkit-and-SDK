import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.tsx';
import SylvaGraphLandingPage from './pages/SylvaGraphLandingPage.tsx';
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
          <Route path="/" element={<SylvaGraphLandingPage />} />
          
          {/* Legacy homepage - protected */}
          <Route path="/home" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          
          {/* Protected application pages */}
          <Route path="/satellite-monitoring" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                  <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Satellite Forest Monitoring
                  </h1>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600">
                      Real-time satellite monitoring dashboard will be available here.
                    </p>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/carbon-sequestration" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                  <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Carbon Sequestration Analytics
                  </h1>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600">
                      Carbon sequestration tracking and analytics dashboard will be available here.
                    </p>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/forest-inventory" element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-7xl mx-auto">
                  <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Forest Inventory Management
                  </h1>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-600">
                      Forest inventory management tools will be available here.
                    </p>
                  </div>
                </div>
              </div>
            </ProtectedRoute>
          } />
          
          {/* Fallback to landing page */}
          <Route path="*" element={<SylvaGraphLandingPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;