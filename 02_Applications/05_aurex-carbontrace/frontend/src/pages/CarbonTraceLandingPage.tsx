import React, { useState } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  Shield, 
  Globe, 
  Award, 
  ArrowRight, 
  CheckCircle, 
  Coins,
  CreditCard,
  Users,
  Wallet,
  LineChart,
  Lock,
  Smartphone,
  Activity,
  Database,
  DollarSign,
  PieChart,
  ArrowUpDown,
  Eye,
  Zap
} from 'lucide-react';
import AppNavigation from '../components/AppNavigation';

const CarbonTraceLandingPage: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const tradingPlatformFeatures = [
    {
      id: 'marketplace',
      title: 'Carbon Credit Marketplace',
      description: 'Buy and sell verified carbon credits from global projects with real-time pricing, instant settlements, and transparent verification.',
      icon: Coins,
      features: [
        'Real-time trading engine',
        'Verified carbon credits',
        'Instant settlements',
        'Global project sourcing'
      ],
      benefits: 'Access the world\'s largest carbon credit marketplace with 24/7 trading and competitive pricing',
      cta: 'Start Trading',
      route: '/marketplace'
    },
    {
      id: 'portfolio',
      title: 'Portfolio Management',
      description: 'Professional-grade portfolio tracking with analytics, risk management, and automated offset strategies for institutions and individuals.',
      icon: PieChart,
      features: [
        'Real-time portfolio tracking',
        'Risk analytics dashboard',
        'Automated rebalancing',
        'Performance reporting'
      ],
      benefits: 'Optimize your carbon portfolio with advanced analytics and risk management tools',
      cta: 'Manage Portfolio',
      route: '/portfolio'
    },
    {
      id: 'analytics',
      title: 'Trading Analytics & Intelligence',
      description: 'Advanced market analytics with price predictions, trend analysis, and trading signals for professional carbon credit trading.',
      icon: LineChart,
      features: [
        'Price trend analysis',
        'Market intelligence',
        'Trading signals',
        'Liquidity analytics'
      ],
      benefits: 'Make informed trading decisions with professional-grade analytics and market intelligence',
      cta: 'View Analytics',
      route: '/analytics'
    }
  ];

  const platformFeatures = [
    {
      icon: Lock,
      title: 'Secure Trading',
      description: 'Military-grade security with multi-signature wallets, KYC/AML compliance, and transparent transaction records.'
    },
    {
      icon: Shield,
      title: 'Verified Credits',
      description: 'Blockchain-verified carbon credits with third-party validation, registry integration, and fraud prevention.'
    },
    {
      icon: Zap,
      title: 'Instant Settlement',
      description: 'Lightning-fast trade execution with instant settlements, real-time pricing, and low transaction fees.'
    },
    {
      icon: Globe,
      title: 'Global Marketplace',
      description: 'Access worldwide carbon projects with diverse offset opportunities and international compliance standards.'
    }
  ];

  const stats = [
    { number: '$2.5B+', label: 'Carbon Credits Traded' },
    { number: '50K+', label: 'Active Traders' },
    { number: '1M+', label: 'Credits Available' },
    { number: '99.9%', label: 'Trading Uptime' }
  ];

  const tradingMetrics = [
    { label: 'VCS Credits', value: '$45.30', status: 'buy', icon: TrendingUp, change: '+2.5%' },
    { label: 'Gold Standard', value: '$52.80', status: 'sell', icon: DollarSign, change: '+1.8%' },
    { label: 'CAR Credits', value: '$38.60', status: 'neutral', icon: BarChart3, change: '-0.3%' },
    { label: 'Portfolio Value', value: '$127K', status: 'portfolio', icon: Wallet, change: '+8.2%' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-50">
      {/* App Navigation */}
      <AppNavigation currentApp="carbontrace" />
      
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl flex items-center justify-center">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xs text-gray-600 leading-none">Aurex Ecosystem</div>
                <div className="text-xl font-bold text-gray-900 leading-tight">Aurex CarbonTrace</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors">
                Marketplace
              </button>
              <button className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors">
                Trading
              </button>
              <button className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors">
                Portfolio
              </button>
              <button className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:shadow-lg transition-all duration-200">
                Start Trading
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
                  The World's Leading Carbon Credit Trading Platform
                  <span className="bg-gradient-to-r from-green-600 to-emerald-700 bg-clip-text text-transparent"> CarbonTrace™</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Buy and sell verified carbon credits with institutional-grade security, real-time pricing, 
                  and transparent blockchain verification. Join the global carbon marketplace.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:shadow-xl transition-all duration-200 group">
                  Start Trading
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="inline-flex items-center justify-center px-8 py-4 border-2 border-green-600 text-green-600 rounded-xl hover:bg-green-50 transition-colors">
                  View Live Market
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Blockchain Verified
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Instant Settlement
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  KYC/AML Compliant
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  24/7 Trading
                </div>
              </div>
            </div>

            {/* Live Trading Dashboard */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Live Market Prices</h3>
                <div className="flex items-center text-green-600 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Live Trading
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {tradingMetrics.map((metric, index) => (
                  <div key={index} className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <metric.icon className={`w-5 h-5 ${
                        metric.status === 'buy' ? 'text-green-600' :
                        metric.status === 'sell' ? 'text-blue-600' :
                        metric.status === 'neutral' ? 'text-yellow-600' :
                        'text-purple-600'
                      }`} />
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        metric.change.startsWith('+') ? 'bg-green-100 text-green-700' :
                        metric.change.startsWith('-') ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {metric.change}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                    <div className="text-xs text-gray-500">{metric.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <div className="flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                  <span className="text-green-700">
                    <strong>Market up 8.2%</strong> this week
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-4xl font-bold">{stat.number}</div>
                <div className="text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trading Platform Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Professional Carbon Trading Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced trading tools, portfolio management, and market analytics for professional carbon credit trading
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {tradingPlatformFeatures.map((solution, index) => {
              const Icon = solution.icon;
              return (
                <div
                  key={solution.id}
                  className="bg-white rounded-2xl border border-gray-200 hover:border-gray-300 p-8 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="text-center mb-6">
                    <div className="inline-flex p-4 bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
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

                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <p className="text-sm text-gray-700">
                      <strong>Benefits:</strong> {solution.benefits}
                    </p>
                  </div>

                  <button className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:shadow-lg transition-all duration-200 group">
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
      <section className="py-20 bg-gradient-to-br from-gray-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose CarbonTrace™
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Enterprise-grade carbon tracking platform built for accuracy, compliance, and actionable insights
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {platformFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                  <div className="inline-flex p-3 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl mb-4">
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

      {/* User Types & Market Participants */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Built for Every Type of Carbon Market Participant
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Whether you're an individual trader, corporate buyer, or project developer, CarbonTrace has the tools you need
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Individual Traders</h3>
              <p className="text-gray-600 mb-6">
                Start trading carbon credits with low minimums, mobile access, and educational resources for personal portfolios.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Low Minimum Orders</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Mobile Trading App</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Educational Resources</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Corporate Buyers</h3>
              <p className="text-gray-600 mb-6">
                Purchase verified carbon credits at scale with enterprise features, compliance tracking, and bulk ordering.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Bulk Purchase Orders</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Compliance Tracking</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span>ESG Reporting</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Database className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Project Developers</h3>
              <p className="text-gray-600 mb-6">
                List and sell your carbon credits with verified project data, automated payments, and global market access.
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Project Verification</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Automated Payments</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Global Distribution</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Verification */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Security & Verification Standards
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Industry-leading security protocols and verified carbon credit standards for trusted trading
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              'VCS Registry',
              'Gold Standard',
              'CAR Registry',
              'CDM Registry',
              'Blockchain Verified',
              'KYC/AML',
              'SOC 2 Type II',
              'ISO 27001',
              'Multi-Sig Wallets',
              'Third-Party Audits',
              'Smart Contracts',
              'Escrow Protection'
            ].map((standard, index) => (
              <div key={index} className="bg-white rounded-xl p-4 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-6 h-6 text-white" />
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
            Ready to Join the Carbon Credit Revolution?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of traders worldwide using CarbonTrace™ for secure, transparent carbon credit trading
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:shadow-xl transition-all duration-200">
              Start Trading Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="inline-flex items-center justify-center px-8 py-4 border-2 border-green-600 text-green-600 rounded-xl hover:bg-green-50 transition-colors">
              Contact Trading Experts
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-700 rounded-xl flex items-center justify-center">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold">CarbonTrace™</div>
            </div>
            <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
              The World's Leading Carbon Credit Trading Platform with Blockchain Security, Real-time Pricing, and Global Market Access
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400 mb-6">
              <button className="hover:text-white transition-colors">Privacy Policy</button>
              <button className="hover:text-white transition-colors">Terms of Service</button>
              <button className="hover:text-white transition-colors">Trading Guide</button>
              <button className="hover:text-white transition-colors">Market Analytics</button>
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

export default CarbonTraceLandingPage;