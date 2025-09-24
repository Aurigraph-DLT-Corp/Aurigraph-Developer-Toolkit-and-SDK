import React from 'react';

const SimpleLandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Header */}
      <header className="container-padding py-6">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-heading font-bold gradient-primary bg-clip-text text-transparent">
            Aurex
          </div>
          <div className="space-x-6">
            <a href="#" className="text-secondary-600 hover:text-primary-600 transition-colors">Solutions</a>
            <a href="#" className="text-secondary-600 hover:text-primary-600 transition-colors">About</a>
            <a href="#" className="btn-primary">Get Started</a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto container-padding text-center">
          <div className="animate-fade-in-up">
            <h1 className="text-hero font-heading font-bold text-secondary-900 mb-6 text-balance">
              Transform Your ESG Impact with
              <span className="gradient-primary bg-clip-text text-transparent"> Aurex Platform</span>
            </h1>
            <p className="text-xl text-secondary-600 mb-8 max-w-3xl mx-auto text-pretty">
              Comprehensive Environmental, Social & Governance management platform with advanced monitoring, 
              reporting, and analytics for sustainable business operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button className="btn-primary animate-scale-in">
                Start Free Trial
              </button>
              <button className="btn-outline animate-slide-in-right">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section-padding bg-secondary-50/50">
        <div className="max-w-7xl mx-auto container-padding">
          <div className="text-center mb-16">
            <h2 className="text-xl-display font-heading font-bold text-secondary-900 mb-4">
              Complete ESG Management Suite
            </h2>
            <p className="text-lg text-secondary-600 max-w-2xl mx-auto">
              Six integrated applications working together to provide comprehensive environmental monitoring
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Platform Card */}
            <div className="card p-8 animate-slide-in-left">
              <div className="w-12 h-12 gradient-primary rounded-xl mb-6 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-heading font-semibold text-secondary-900 mb-3">Main Platform</h3>
              <p className="text-secondary-600 mb-4">Central hub for ESG reporting and environmental monitoring with real-time dashboards</p>
              <div className="text-sm text-primary-600 font-medium">Port 3000 • Core System</div>
            </div>

            {/* Launchpad Card */}
            <div className="card p-8 animate-slide-in-up">
              <div className="w-12 h-12 gradient-accent rounded-xl mb-6 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-heading font-semibold text-secondary-900 mb-3">ESG Launchpad</h3>
              <p className="text-secondary-600 mb-4">Comprehensive ESG assessment tools and automated reporting workflows</p>
              <div className="text-sm text-accent-600 font-medium">Port 3001 • Assessment</div>
            </div>

            {/* HydroPulse Card */}
            <div className="card p-8 animate-slide-in-right">
              <div className="w-12 h-12 bg-blue-500 rounded-xl mb-6 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-heading font-semibold text-secondary-900 mb-3">HydroPulse</h3>
              <p className="text-secondary-600 mb-4">Advanced water management and AWD education platform</p>
              <div className="text-sm text-blue-600 font-medium">Port 3002 • Water Management</div>
            </div>

            {/* More cards... */}
            <div className="card p-8">
              <div className="w-12 h-12 bg-green-500 rounded-xl mb-6 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" />
                </svg>
              </div>
              <h3 className="text-xl font-heading font-semibold text-secondary-900 mb-3">SylvaGraph</h3>
              <p className="text-secondary-600 mb-4">Forest management and carbon sequestration tracking</p>
              <div className="text-sm text-green-600 font-medium">Port 3003 • Forest Mgmt</div>
            </div>

            <div className="card p-8">
              <div className="w-12 h-12 bg-gray-600 rounded-xl mb-6 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" />
                </svg>
              </div>
              <h3 className="text-xl font-heading font-semibold text-secondary-900 mb-3">CarbonTrace</h3>
              <p className="text-secondary-600 mb-4">Comprehensive carbon footprint tracking and analytics</p>
              <div className="text-sm text-gray-600 font-medium">Port 3004 • Carbon Tracking</div>
            </div>

            <div className="card p-8">
              <div className="w-12 h-12 bg-purple-500 rounded-xl mb-6 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" />
                </svg>
              </div>
              <h3 className="text-xl font-heading font-semibold text-secondary-900 mb-3">Admin Dashboard</h3>
              <p className="text-secondary-600 mb-4">Administrative tools and system management interface</p>
              <div className="text-sm text-purple-600 font-medium">Port 3005 • Administration</div>
            </div>
          </div>
        </div>
      </section>

      {/* Status Section */}
      <section className="section-padding">
        <div className="max-w-4xl mx-auto container-padding">
          <div className="glass rounded-2xl p-8 text-center">
            <div className="inline-flex items-center px-4 py-2 bg-success/10 text-success rounded-full text-sm font-medium mb-4">
              <div className="w-2 h-2 bg-success rounded-full mr-2 animate-pulse"></div>
              System Status: Online
            </div>
            <h2 className="text-2xl font-heading font-bold text-secondary-900 mb-4">
              Platform Successfully Deployed
            </h2>
            <p className="text-secondary-600 mb-6">
              All 6 applications are running on dev.aurigraph.io with full Docker containerization,
              PostgreSQL database, Redis caching, and nginx reverse proxy.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-secondary-900">Frontend</div>
                <div className="text-primary-600">React + TypeScript</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-secondary-900">Backend</div>
                <div className="text-primary-600">FastAPI + Python</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-secondary-900">Database</div>
                <div className="text-primary-600">PostgreSQL + Redis</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-secondary-900">Infrastructure</div>
                <div className="text-primary-600">Docker + nginx</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary-900 text-white py-12">
        <div className="max-w-7xl mx-auto container-padding text-center">
          <div className="text-2xl font-heading font-bold mb-4">Aurex Platform</div>
          <p className="text-secondary-300 mb-6">Transforming ESG management through innovative technology</p>
          <div className="text-secondary-400 text-sm">
            © 2025 Aurex Platform. Built with sustainability in mind.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SimpleLandingPage;