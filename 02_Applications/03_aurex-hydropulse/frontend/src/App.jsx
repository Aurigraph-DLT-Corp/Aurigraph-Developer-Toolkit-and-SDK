import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.tsx';
import AppNavigation from './components/AppNavigation.jsx';
import HydroPulseAWDLanding from './pages/HydroPulseAWDLanding.tsx';
import HomePage from './pages/HomePage.tsx';
import Dashboard from './pages/Dashboard.tsx';
import SensorMonitoring from './pages/SensorMonitoring.tsx';
import FacilityManagement from './pages/FacilityManagement.tsx';
import LoginPage from './pages/LoginPage.tsx';
import ProtectedRoute from './components/auth/ProtectedRoute.tsx';

function App() {
  return (
    <AuthProvider>
      <AppNavigation currentApp="hydropulse" />
      <Router basename={import.meta.env.BASE_URL}>
        <Routes>
          {/* Login route */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* Main landing page - public */}
          <Route path="/" element={<HydroPulseAWDLanding />} />
          
          {/* Legacy homepage - protected */}
          <Route path="/home" element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />
          
          {/* Protected application pages */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/monitoring" element={
            <ProtectedRoute>
              <SensorMonitoring />
            </ProtectedRoute>
          } />
          <Route path="/facilities" element={
            <ProtectedRoute>
              <FacilityManagement />
            </ProtectedRoute>
          } />
          
          {/* Public AWD education page */}
          <Route path="/awd-education" element={<HydroPulseAWDLanding />} />
          
          {/* Fallback to landing page */}
          <Route path="*" element={<HydroPulseAWDLanding />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;