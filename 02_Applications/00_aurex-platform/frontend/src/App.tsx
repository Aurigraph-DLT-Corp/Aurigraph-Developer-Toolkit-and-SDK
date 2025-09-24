import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import { AppNavigation } from './components/AppNavigation';

// Pages
import LandingPage from './pages/LandingPage';
import NotFound from './pages/NotFound';

// Utils
import { initAnalytics } from './utils/analytics';

// Initialize analytics in production
if (import.meta.env.PROD) {
  initAnalytics();
}

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <AppNavigation currentApp="platform" />
      <AnimatePresence mode="wait">
        <Routes>
          <Route
            path="/"
            element={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <LandingPage />
              </motion.div>
            }
          />
          
          <Route
            path="/full"
            element={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <LandingPage />
              </motion.div>
            }
          />
          
          {/* Additional routes for landing page sections */}
          <Route path="/products" element={<LandingPage scrollTo="products" />} />
          <Route path="/solutions" element={<LandingPage scrollTo="solutions" />} />
          <Route path="/pricing" element={<LandingPage scrollTo="pricing" />} />
          <Route path="/about" element={<LandingPage scrollTo="about" />} />
          <Route path="/contact" element={<LandingPage scrollTo="contact" />} />
          
          {/* 404 Page */}
          <Route
            path="*"
            element={
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <NotFound />
              </motion.div>
            }
          />
        </Routes>
      </AnimatePresence>
    </div>
  );
};

export default App;