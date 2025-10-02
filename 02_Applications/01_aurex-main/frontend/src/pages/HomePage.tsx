/**
 * Aurex Platform™ - Homepage
 * Main landing page showcasing all Aurex applications
 */

import React from 'react';

const HomePage: React.FC = () => {
  const applications = [
    {
      name: 'Aurex HydroPulse™',
      description: 'AWD (Alternate Wetting & Drying) for paddy farmers with sensor integration and DMRV compliance',
      url: 'http://localhost:3002',
      color: 'from-blue-500 to-cyan-600',
      icon: '💧',
      features: ['Sensor Integration', 'DMRV Compliance', 'Farmer Onboarding', 'Water Management']
    },
    {
      name: 'Aurex Sylvagraph™',
      description: 'Drone-based agroforestry monitoring with satellite imagery and carbon accounting',
      url: 'http://localhost:3003',
      color: 'from-green-500 to-emerald-600',
      icon: '🌳',
      features: ['Satellite Imagery', 'Polygon Digitization', 'Carbon Accounting', 'Forest Monitoring']
    },
    {
      name: 'Aurex CarbonTrace™',
      description: 'Carbon credit issuance and trading platform with registry integration',
      url: 'http://localhost:3004',
      color: 'from-gray-700 to-gray-900',
      icon: '🌍',
      features: ['Credit Issuance', 'Registry Integration', 'Tokenization', 'Marketplace']
    },
    {
      name: 'Aurex Launchpad™',
      description: 'GHG analytics and carbon management tools for your Net Zero journey',
      url: 'https://dev.aurigraph.io/launchpad',
      color: 'from-purple-500 to-indigo-600',
      icon: '🚀',
      features: ['GHG Analytics', 'Free Tools', 'Premium Services', 'Advisory']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Aurex Platform™
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
              Accelerate Your Journey to Net Zero with DLT-Powered Carbon Credit Management
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="https://dev.aurigraph.io/launchpad"
                className="bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Get Started Free
              </a>
              <a
                href="/contact"
                className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-semibold border-2 border-green-600 hover:bg-green-50 transition-colors"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Applications Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Applications
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive suite of applications for carbon management, monitoring, and trading
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {applications.map((app, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-shadow group"
              >
                <div className={`h-32 bg-gradient-to-r ${app.color} flex items-center justify-center`}>
                  <span className="text-6xl">{app.icon}</span>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {app.name}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {app.description}
                  </p>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Key Features:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {app.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors group-hover:scale-105 transform transition-transform"
                  >
                    Launch Application
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Platform Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for scale, security, and compliance with industry standards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">DMRV Compliant</h3>
              <p className="text-gray-600">
                Digital MRV (DMRV) compliance with immutable audit trails and ISO 14064 standards
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Monitoring</h3>
              <p className="text-gray-600">
                Live sensor data, satellite imagery, and automated reporting for continuous monitoring
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Integrated Platform</h3>
              <p className="text-gray-600">
                Single sign-on across all applications with centralized user management and data sharing
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Start Your Net Zero Journey?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of organizations using Aurex Platform™ to achieve their sustainability goals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://dev.aurigraph.io/launchpad"
              className="bg-white text-green-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Free Trial
            </a>
            <a
              href="/contact"
              className="bg-transparent text-white px-8 py-4 rounded-lg text-lg font-semibold border-2 border-white hover:bg-white hover:text-green-600 transition-colors"
            >
              Schedule Demo
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
