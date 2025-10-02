/**
 * Aurex CarbonTrace™ - Homepage
 * Carbon footprint tracking and lifecycle assessment platform
 */

import React, { useState, useEffect } from 'react';
import AurexHeader from '../components/AurexHeader';

const HomePage = () => {
  const [healthData, setHealthData] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealthData(data))
      .catch(err => console.error('Health check failed:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <AurexHeader 
        appName="Aurex CarbonTrace™" 
        appIcon="🌡️" 
        appColor="orange"
      />
      
      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <span className="text-6xl mr-4">🌡️</span>
              <h1 className="text-5xl md:text-6xl font-bold text-orange-900">
                Aurex CarbonTrace™
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
              Comprehensive carbon footprint tracking and lifecycle assessment with real-time emissions monitoring
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/dashboard"
                className="bg-orange-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                Carbon Dashboard
              </a>
              <a
                href="/assessment"
                className="bg-white text-orange-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-orange-600 hover:bg-orange-50 transition-colors"
              >
                Start Assessment
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete Carbon Intelligence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Track, measure, and reduce your carbon footprint with precision across all scopes and activities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-orange-50 rounded-xl">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Tracking</h3>
              <p className="text-gray-600">
                Continuous monitoring of Scope 1, 2, and 3 emissions with automated data collection
              </p>
            </div>

            <div className="text-center p-6 bg-red-50 rounded-xl">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">LCA Analysis</h3>
              <p className="text-gray-600">
                Complete lifecycle assessment from cradle to grave with impact categorization
              </p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Carbon Offsetting</h3>
              <p className="text-gray-600">
                Verified carbon offset marketplace with transparent project tracking and verification
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-orange-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Carbon Management Excellence
              </h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-orange-500 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">99.5% Data Accuracy</h3>
                    <p className="text-gray-600">Precision measurement with automated verification and validation</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-orange-500 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Science-Based Targets</h3>
                    <p className="text-gray-600">Align with SBTi standards and 1.5°C climate goals</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-orange-500 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Supply Chain Visibility</h3>
                    <p className="text-gray-600">End-to-end visibility across your entire value chain</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-orange-500 mr-3 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Automated Reporting</h3>
                    <p className="text-gray-600">GRI, CDP, TCFD, and SASB compliant reporting automation</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Carbon Insights</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Emissions (tCO₂e)</span>
                  <span className="text-2xl font-bold text-orange-600">45.7K</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Scope 3 Coverage</span>
                  <span className="text-2xl font-bold text-red-600">87%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Reduction Target</span>
                  <span className="text-2xl font-bold text-green-600">42%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Verified Offsets (tCO₂e)</span>
                  <span className="text-2xl font-bold text-purple-600">12.3K</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Status */}
      {healthData && (
        <section className="py-8 bg-orange-100">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-orange-800 font-medium">System Status: Operational</span>
            </div>
            <p className="text-orange-700 text-sm">
              All services running • Version {healthData.version} • Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Start Your Carbon Journey Today
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Measure, reduce, and offset your carbon footprint with precision and transparency
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/dashboard"
              className="bg-white text-orange-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started
            </a>
            <a
              href="/"
              className="bg-transparent text-white px-8 py-4 rounded-lg text-lg font-semibold border-2 border-white hover:bg-white hover:text-orange-600 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;