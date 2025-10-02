import React, { useState } from 'react';
import { 
  Trees, 
  Satellite, 
  BarChart3, 
  Shield, 
  Zap, 
  Globe, 
  Award, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle, 
  Leaf,
  Camera,
  MapPin,
  Calculator,
  FileCheck,
  Smartphone,
  Activity,
  Database
} from 'lucide-react';

const SylvaGraphLandingPage: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const forestManagementSolutions = [
    {
      id: 'satellite-monitoring',
      title: 'Satellite Forest Monitoring',
      description: 'Advanced satellite imagery analysis for real-time forest health monitoring, deforestation tracking, and biodiversity assessment.',
      icon: Satellite,
      features: [
        'Real-time satellite imagery',
        'Deforestation alerts',
        'Forest health analytics',
        'Biodiversity mapping'
      ],
      benefits: 'Monitor forest changes with 99% accuracy using advanced AI and satellite technology',
      cta: 'Start Monitoring',
      route: '/satellite-monitoring'
    },
    {
      id: 'carbon-sequestration',
      title: 'Carbon Sequestration Tracking',
      description: 'Comprehensive carbon storage measurement and tracking for forest carbon credit generation and verification.',
      icon: Calculator,
      features: [
        'Carbon storage calculations',
        'Growth rate monitoring',
        'Carbon credit verification',
        'Sequestration reporting'
      ],
      benefits: 'Maximize carbon credit potential with accurate sequestration measurement and verification',
      cta: 'Calculate Carbon',
      route: '/carbon-sequestration'
    },
    {
      id: 'forest-inventory',
      title: 'Digital Forest Inventory',
      description: 'Complete forest asset management with tree species identification, health assessment, and growth tracking.',
      icon: Database,
      features: [
        'Tree species identification',
        'Health assessment tools',
        'Growth tracking systems',
        'Inventory management'
      ],
      benefits: 'Optimize forest management with comprehensive digital inventory and analytics',
      cta: 'Manage Inventory',
      route: '/forest-inventory'
    }
  ];

  const platformFeatures = [
    {
      icon: Satellite,
      title: 'Satellite Integration',
      description: 'Advanced satellite imagery analysis with AI-powered forest monitoring and change detection.'
    },
    {
      icon: Activity,
      title: 'Real-Time Analytics',
      description: 'Live forest health monitoring with predictive analytics and automated alert systems.'
    },
    {
      icon: Shield,
      title: 'Verified Data',
      description: 'Blockchain-verified forest data for carbon credit certification and compliance reporting.'
    },
    {
      icon: Globe,
      title: 'Global Standards',
      description: 'Aligned with REDD+, VCS, and Gold Standard for forest carbon project certification.'
    }
  ];

  const stats = [
    { number: '2.5M', label: 'Hectares Monitored' },
    { number: '15K', label: 'Carbon Projects' },
    { number: '250K', label: 'Tons CO₂ Sequestered' },
    { number: '99.2%', label: 'Monitoring Accuracy' }
  ];

  const forestMetrics = [
    { label: 'Forest Coverage', value: '85.3%', status: 'healthy', icon: Trees },
    { label: 'Carbon Storage', value: '450 tCO₂/ha', status: 'high', icon: Leaf },
    { label: 'Biodiversity Index', value: '8.7/10', status: 'excellent', icon: Activity },
    { label: 'Growth Rate', value: '+2.3% YoY', status: 'positive', icon: TrendingUp }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Trees className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">SylvaGraph™</div>
                <div className="text-xs text-green-600">Forest Management & Carbon</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 text-green-600 hover:text-green-800 font-medium transition-colors">
                Solutions
              </button>
              <button className="px-4 py-2 text-green-600 hover:text-green-800 font-medium transition-colors">
                Carbon Credits
              </button>
              <button className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all duration-200">
                Start Monitoring
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl font-bold text-gray-900 leading-tight">
                  Advanced Forest Management with
                  <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent"> SylvaGraph™</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Satellite-powered forest monitoring, carbon sequestration tracking, and comprehensive forest 
                  inventory management for sustainable forestry and carbon credit generation.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all duration-200 group">
                  Start Forest Monitoring
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="inline-flex items-center justify-center px-8 py-4 border-2 border-green-600 text-green-600 rounded-xl hover:bg-green-50 transition-colors">
                  Carbon Credit Calculator
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  REDD+ Certified
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  VCS Verified
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Satellite Powered
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  99% Accuracy
                </div>
              </div>
            </div>

            {/* Live Forest Dashboard */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-green-100 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Live Forest Metrics</h3>
                <div className="flex items-center text-green-600 text-sm">
                  <Satellite className="w-4 h-4 mr-2" />
                  Satellite Data
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {forestMetrics.map((metric, index) => (
                  <div key={index} className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <metric.icon className={`w-5 h-5 ${
                        metric.status === 'healthy' || metric.status === 'excellent' || metric.status === 'positive' 
                          ? 'text-green-500' 
                          : metric.status === 'high' 
                            ? 'text-emerald-500' 
                            : 'text-green-500'
                      }`} />
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        metric.status === 'healthy' || metric.status === 'excellent' || metric.status === 'positive'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {metric.status}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                    <div className="text-xs text-gray-500">{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-4xl font-bold">{stat.number}</div>
                <div className="text-green-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Forest Management Solutions */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Forest Management Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced satellite monitoring, carbon sequestration tracking, and digital forest inventory for sustainable forestry
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {forestManagementSolutions.map((solution, index) => {
              const Icon = solution.icon;
              return (
                <div
                  key={solution.id}
                  className="bg-white rounded-2xl border border-green-100 hover:border-green-300 p-8 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="text-center mb-6">
                    <div className="inline-flex p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{solution.title}</h3>
                    <p className="text-gray-600">{solution.description}</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <h4 className="font-semibold text-gray-900">Key Features:</h4>
                    <div className="space-y-2">
                      {solution.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-xl p-4 mb-6">
                    <p className="text-sm text-gray-700">
                      <strong>Benefits:</strong> {solution.benefits}
                    </p>
                  </div>

                  <button className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 group">
                    {solution.cta}
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose SylvaGraph™
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced forest management platform built for sustainability and carbon credit generation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {platformFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="inline-flex p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Carbon Credit Highlight */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-12 text-white text-center">
            <Calculator className="w-16 h-16 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">
              Carbon Credit Generation & Verification
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
              Generate verified carbon credits through sustainable forest management. Our platform provides accurate 
              carbon sequestration measurement, monitoring, and verification aligned with VCS, Gold Standard, and REDD+ requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center px-8 py-3 bg-white text-green-600 rounded-xl hover:shadow-lg transition-all duration-200">
                Calculate Carbon Credits
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button className="inline-flex items-center px-8 py-3 border-2 border-white text-white rounded-xl hover:bg-white/10 transition-colors">
                Download Methodology
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* REDD+ Compliance Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              REDD+ & Carbon Standards Compliance
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our forest monitoring and carbon tracking systems are certified and aligned with leading international standards
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              'REDD+',
              'VCS',
              'Gold Standard',
              'CDM',
              'CAR',
              'ACR',
              'Plan Vivo',
              'CCBS',
              'FSC',
              'PEFC',
              'SBTi',
              'TCFD'
            ].map((standard, index) => (
              <div key={index} className="bg-white rounded-xl p-4 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="font-semibold text-gray-900 text-sm">{standard}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Ready to Transform Your Forest Management?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join forest managers worldwide using SylvaGraph™ for sustainable forestry and carbon credit generation
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all duration-200">
              Start Forest Monitoring
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="inline-flex items-center justify-center px-8 py-4 border-2 border-green-600 text-green-600 rounded-xl hover:bg-green-50 transition-colors">
              Contact Forest Experts
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Trees className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold">SylvaGraph™</div>
            </div>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              Advanced Forest Management Platform with Satellite Monitoring, Carbon Sequestration Tracking, and Digital Inventory
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 mb-6">
              <button className="hover:text-white transition-colors">Privacy Policy</button>
              <button className="hover:text-white transition-colors">Terms of Service</button>
              <button className="hover:text-white transition-colors">REDD+ Resources</button>
              <button className="hover:text-white transition-colors">Carbon Credits Guide</button>
            </div>
            <div className="text-gray-500 text-sm">
              © 2024 Aurigraph DLT Corp. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SylvaGraphLandingPage;