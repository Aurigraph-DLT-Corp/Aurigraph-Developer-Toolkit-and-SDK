import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider, useToastContext } from './contexts/ToastContext.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import ToastContainer from './components/common/ToastContainer.tsx';
import AppNavigation from './components/AppNavigation.jsx';
import LaunchpadLandingPage from './pages/LaunchpadLandingPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import ProtectedRoute from './components/auth/ProtectedRoute.tsx';

const AppContent = () => {
  const { toasts, removeToast } = useToastContext();

  return (
    <>
      <AppNavigation currentApp="launchpad" />
      <Router
        basename={import.meta.env.BASE_URL}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          {/* Login route */}
          <Route path="/login" element={
            <ErrorBoundary>
              <LoginPage />
            </ErrorBoundary>
          } />

          {/* Main landing page - public */}
          <Route path="/" element={
            <ErrorBoundary>
              <LaunchpadLandingPage />
            </ErrorBoundary>
          } />

          {/* Protected dashboard route */}
          <Route path="/dashboard" element={
            <ErrorBoundary>
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-50 p-8">
                  <div className="max-w-7xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">
                      ESG Assessment Dashboard
                    </h1>
                    <div className="bg-white rounded-lg shadow p-6">
                      <p className="text-gray-600">
                        Welcome to your ESG assessment platform. Your personalized dashboard will be available here.
                      </p>
                    </div>
                  </div>
                </div>
              </ProtectedRoute>
            </ErrorBoundary>
          } />

          {/* All other routes redirect to landing page */}
          <Route path="*" element={
            <ErrorBoundary>
              <LaunchpadLandingPage />
            </ErrorBoundary>
          } />
        </Routes>
      </Router>

      <ToastContainer
        toasts={toasts}
        onRemoveToast={removeToast}
        position="top-right"
      />
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;