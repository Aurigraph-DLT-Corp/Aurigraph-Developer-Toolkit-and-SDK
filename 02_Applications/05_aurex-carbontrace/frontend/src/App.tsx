/**
 * Aurex HydroPulse™ - AWD Application
 * Alternate Wetting & Drying for paddy farmers
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import FarmerDashboard from './pages/FarmerDashboard';
import SensorData from './pages/SensorData';
import Layout from './components/Layout';
import './index.css';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<FarmerDashboard />} />
          <Route path="/sensors" element={<SensorData />} />
          <Route path="/health" element={
            <div className="p-4">
              <h1>HydroPulse Health Check</h1>
              <p>Status: OK</p>
            </div>
          } />
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-blue-900 mb-4">404</h1>
                <p className="text-gray-600 mb-8">Page not found</p>
                <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                  Go Home
                </a>
              </div>
            </div>
          } />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
