import React, { useState, useEffect } from 'react';
import { 
  Droplets, 
  Gauge, 
  BarChart3, 
  Shield, 
  Zap, 
  Globe, 
  Award, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle, 
  Waves,
  ThermometerSun,
  FlaskConical,
  MapPin,
  AlertTriangle,
  Smartphone,
  Monitor,
  Database,
  Users,
  Clock,
  DollarSign,
  Leaf,
  Target,
  Star,
  Play,
  BookOpen,
  Settings,
  Cloud,
  Wifi,
  Battery,
  Calendar,
  FileText,
  Download,
  Phone,
  Mail,
  MapIcon,
  Building
} from 'lucide-react';

const HydroPulseLandingPageEnhanced: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeSolution, setActiveSolution] = useState('smart-monitoring');
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const freeOfferings = [
    {
      title: 'Water Quality Assessment',
      description: 'Comprehensive analysis of your current water management practices and quality metrics',
      icon: FlaskConical,
      features: [
        'Basic water quality analysis',
        'Initial sensor recommendations',
        'AWD suitability evaluation',
        'Baseline measurement report'
      ],
      cta: 'Start Free Assessment',
      badge: 'FREE'
    },
    {
      title: 'AWD Learning Center',
      description: 'Access to basic AWD education materials and water-saving technique guides',
      icon: BookOpen,
      features: [
        'AWD fundamentals course',
        'Water-saving technique guides',
        'Basic implementation checklist',
        'Community forums access'
      ],
      cta: 'Access Learning Center',
      badge: 'FREE'
    },
    {
      title: 'Water Usage Calculator',
      description: 'Interactive tool to calculate potential water savings through AWD implementation',
      icon: BarChart3,
      features: [
        'Water usage tracking',
        'Savings projection calculator',
        'Efficiency benchmarking',
        'Basic reporting dashboard'
      ],
      cta: 'Calculate Savings',
      badge: 'FREE'
    }
  ];

  const premiumOfferings = [
    {
      title: 'Smart Monitoring System',
      description: 'Complete IoT sensor deployment with real-time monitoring and AI-powered analytics',
      icon: Monitor,
      features: [
        'Advanced IoT sensor network',
        'Real-time monitoring dashboard',
        'AI-powered predictive analytics',
        'Mobile app with push notifications',
        '24/7 technical support'
      ],
      cta: 'Get Premium Monitoring',
      price: 'Starting at $299/month',
      badge: 'PREMIUM'
    },
    {
      title: 'Facility Management Suite',
      description: 'Comprehensive water infrastructure management with predictive maintenance',
      icon: Database,
      features: [
        'Complete asset management',
        'Predictive maintenance scheduling',
        'Energy efficiency optimization',
        'Compliance reporting automation',
        'Custom integration support'
      ],
      cta: 'Upgrade to Full Suite',
      price: 'Starting at $599/month',
      badge: 'PREMIUM'
    },
    {
      title: 'Expert Consultation',
      description: 'Dedicated water management experts for personalized implementation guidance',
      icon: Users,
      features: [
        'Dedicated account manager',
        'Site assessment and planning',
        'Custom AWD implementation',
        'Training and certification',
        'Ongoing optimization support'
      ],
      cta: 'Book Consultation',
      price: 'Starting at $1,299/month',
      badge: 'ENTERPRISE'
    }
  ];

  const platformFeatures = [
    {
      icon: Wifi,
      title: 'Real-Time IoT Connectivity',
      description: 'Seamless integration with over 200+ sensor types for comprehensive water monitoring'
    },
    {
      icon: Cloud,
      title: 'Cloud-Based Analytics',
      description: 'Powerful cloud computing for processing massive datasets and generating insights'
    },
    {
      icon: Smartphone,
      title: 'Mobile-First Design',
      description: 'Full-featured mobile apps for iOS and Android with offline capabilities'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-grade encryption and security protocols protecting your water management data'
    },
    {
      icon: Globe,
      title: 'Global Compliance',
      description: 'Meets international water standards including ISO 14046, WHO guidelines, and local regulations'
    },
    {
      icon: Battery,
      title: 'Energy Efficient',
      description: 'Ultra-low power sensor systems with solar charging options for sustainable operations'
    }
  ];

  const implementationPhases = [
    {
      phase: 1,
      title: 'Assessment & Planning',
      duration: '2-4 weeks',
      description: 'Comprehensive site evaluation, sensor placement planning, and AWD suitability analysis',
      deliverables: ['Site assessment report', 'Sensor deployment plan', 'ROI projections', 'Implementation timeline']
    },
    {
      phase: 2,
      title: 'System Deployment',
      duration: '4-6 weeks',
      description: 'IoT sensor installation, network setup, and initial system configuration',
      deliverables: ['Sensor network installation', 'Dashboard configuration', 'Mobile app setup', 'Initial testing']
    },
    {
      phase: 3,
      title: 'Training & Optimization',
      duration: '2-3 weeks',
      description: 'Team training, AWD education, and system optimization based on initial data',
      deliverables: ['Staff training completion', 'AWD implementation guide', 'System optimization', 'Performance baseline']
    },
    {
      phase: 4,
      title: 'Monitoring & Support',
      duration: 'Ongoing',
      description: 'Continuous monitoring, regular optimization, and expert support for sustained performance',
      deliverables: ['Monthly reports', 'Quarterly optimization', '24/7 support', 'Continuous improvements']
    }
  ];

  const testimonials = [
    {
      name: 'Dr. Priya Sharma',
      role: 'Agricultural Director',
      company: 'Green Valley Farms',
      location: 'Punjab, India',
      quote: 'HydroPulse helped us reduce water consumption by 35% while maintaining crop yields. The AWD education platform was particularly valuable for our team.',
      savings: '₹2.5L annually',
      waterSaved: '500,000L',
      avatar: '👩‍🌾'
    },
    {
      name: 'James Mitchell',
      role: 'Facility Manager',
      company: 'AquaTech Industries',
      location: 'California, USA',
      quote: 'The real-time monitoring system caught a major leak that would have cost us thousands. ROI was achieved within 6 months.',
      savings: '$45,000 annually',
      waterSaved: '2.1M gallons',
      avatar: '👨‍💼'
    },
    {
      name: 'Maria Rodriguez',
      role: 'Sustainability Officer',
      company: 'EcoFarms Collective',
      location: 'Valencia, Spain',
      quote: 'Excellent platform for sustainable water management. The mobile app makes field monitoring incredibly easy and efficient.',
      savings: '€18,000 annually',
      waterSaved: '750,000L',
      avatar: '👩‍💻'
    }
  ];

  const complianceStandards = [
    { name: 'ISO 14046', description: 'Water Footprint Assessment' },
    { name: 'WHO Guidelines', description: 'Drinking Water Quality' },
    { name: 'EPA Standards', description: 'Environmental Protection' },
    { name: 'EU Water Framework', description: 'European Water Directive' },
    { name: 'AWWA Standards', description: 'American Water Works Association' },
    { name: 'IWA Guidelines', description: 'International Water Association' }
  ];

  const stats = [
    { number: '10M+', label: 'Liters Monitored Daily', icon: Droplets },
    { number: '2,500+', label: 'Active Sensors Deployed', icon: Gauge },
    { number: '35%', label: 'Average Water Savings', icon: TrendingUp },
    { number: '99.9%', label: 'System Uptime', icon: Shield }
  ];

  const waterMetrics = [
    { label: 'pH Level', value: '7.2', status: 'optimal', icon: FlaskConical, trend: '+0.1' },
    { label: 'Temperature', value: '24°C', status: 'normal', icon: ThermometerSun, trend: '-1°C' },
    { label: 'Flow Rate', value: '150 L/min', status: 'high', icon: Waves, trend: '+15 L/min' },
    { label: 'Pressure', value: '2.1 bar', status: 'normal', icon: Gauge, trend: 'stable' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">HydroPulse™</div>
                <div className="text-xs text-blue-600">Smart Water Management</div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <button className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Solutions</button>
              <button className="text-gray-600 hover:text-blue-600 font-medium transition-colors">AWD Education</button>
              <button className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Pricing</button>
              <button className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Resources</button>
              <button className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all duration-200">
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-cyan-50 opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  🚀 New: AWD Education Platform Now Available
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Transform Water Management with
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent"> AI-Powered IoT</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Reduce water usage by 35%, optimize facility operations, and achieve sustainable water management 
                  with our comprehensive IoT monitoring, AWD education, and expert consultation platform.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-xl transition-all duration-200 group">
                  Start Free Assessment
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="inline-flex items-center justify-center px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors group">
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  ISO 14046 Certified
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  35% Water Savings
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Real-time Analytics
                </div>
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  24/7 Support
                </div>
              </div>
            </div>

            {/* Live Water Metrics Dashboard */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 border border-blue-200 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Live Water Analytics</h3>
                <div className="flex items-center text-green-600 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Live Data
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                {waterMetrics.map((metric, index) => (
                  <div key={index} className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <metric.icon className={`w-5 h-5 ${
                        metric.status === 'optimal' ? 'text-green-500' : 
                        metric.status === 'normal' ? 'text-blue-500' : 
                        'text-orange-500'
                      }`} />
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        metric.status === 'optimal' ? 'bg-green-100 text-green-700' : 
                        metric.status === 'normal' ? 'bg-blue-100 text-blue-700' : 
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {metric.status}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                    <div className="text-xs text-gray-500 flex justify-between">
                      <span>{metric.label}</span>
                      <span className="text-gray-400">{metric.trend}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-4 text-white text-center">
                <div className="text-sm mb-1">Today's Water Efficiency</div>
                <div className="text-2xl font-bold">92.5%</div>
                <div className="text-xs text-blue-100">+5.2% from yesterday</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="space-y-3">
                  <Icon className="w-8 h-8 mx-auto text-blue-200" />
                  <div className="text-4xl font-bold">{stat.number}</div>
                  <div className="text-blue-100">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Free Offerings */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Start Your Water Management Journey - Free
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Access our comprehensive free tools to assess your current water management practices and discover optimization opportunities
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {freeOfferings.map((offering, index) => {
              const Icon = offering.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border-2 border-green-200 hover:border-green-300 p-8 hover:shadow-xl transition-all duration-300 group relative"
                >
                  <div className="absolute -top-3 left-6">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {offering.badge}
                    </span>
                  </div>

                  <div className="text-center mb-6">
                    <div className="inline-flex p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{offering.title}</h3>
                    <p className="text-gray-600">{offering.description}</p>
                  </div>

                  <div className="space-y-3 mb-6">
                    {offering.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <button className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 group">
                    {offering.cta}
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Premium Offerings */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Advanced Water Management Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Upgrade to premium features for comprehensive water facility management, advanced analytics, and expert consultation
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {premiumOfferings.map((offering, index) => {
              const Icon = offering.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border-2 border-blue-200 hover:border-blue-300 p-8 hover:shadow-xl transition-all duration-300 group relative"
                >
                  <div className="absolute -top-3 left-6">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                      offering.badge === 'ENTERPRISE' 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-blue-500 text-white'
                    }`}>
                      {offering.badge}
                    </span>
                  </div>

                  <div className="text-center mb-6">
                    <div className="inline-flex p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{offering.title}</h3>
                    <p className="text-gray-600 mb-2">{offering.description}</p>
                    <div className="text-lg font-bold text-blue-600">{offering.price}</div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {offering.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-blue-500 mr-3 flex-shrink-0" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <button className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 group">
                    {offering.cta}
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose HydroPulse™ Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for scale, designed for efficiency, and optimized for sustainable water management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {platformFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index} 
                  className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 border border-blue-100"
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className={`inline-flex p-3 rounded-xl mb-4 transition-all duration-300 ${
                    activeFeature === index 
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-600 scale-110' 
                      : 'bg-gradient-to-br from-blue-100 to-cyan-100'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      activeFeature === index ? 'text-white' : 'text-blue-600'
                    }`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Implementation Roadmap */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Implementation Roadmap
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our proven 4-phase approach ensures successful deployment and optimal water management results
            </p>
          </div>

          <div className="space-y-8">
            {implementationPhases.map((phase, index) => (
              <div key={index} className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {phase.phase}
                  </div>
                </div>
                <div className="flex-1 bg-white rounded-xl p-6 shadow-lg">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{phase.title}</h3>
                      <div className="flex items-center text-blue-600 mb-2">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">{phase.duration}</span>
                      </div>
                      <p className="text-gray-600 text-sm">{phase.description}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="font-semibold text-gray-900 mb-3">Key Deliverables:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {phase.deliverables.map((deliverable, idx) => (
                          <div key={idx} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {deliverable}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Success Stories from Water Management Leaders
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how organizations worldwide are transforming their water management with HydroPulse™
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-2xl border border-blue-100">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">{testimonials[currentTestimonial].avatar}</div>
              <blockquote className="text-xl text-gray-700 italic mb-6 max-w-4xl mx-auto">
                "{testimonials[currentTestimonial].quote}"
              </blockquote>
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  {testimonials[currentTestimonial].name}
                </div>
                <div className="text-blue-600">
                  {testimonials[currentTestimonial].role} at {testimonials[currentTestimonial].company}
                </div>
                <div className="text-gray-500 text-sm">
                  {testimonials[currentTestimonial].location}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-green-50 rounded-xl p-6 text-center">
                <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {testimonials[currentTestimonial].savings}
                </div>
                <div className="text-gray-600">Cost Savings</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-6 text-center">
                <Droplets className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {testimonials[currentTestimonial].waterSaved}
                </div>
                <div className="text-gray-600">Water Conserved</div>
              </div>
            </div>

            {/* Testimonial indicators */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Expert Guidance CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <Users className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4">
            Need Expert Water Management Guidance?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Book a consultation with our water management experts to develop a customized implementation strategy for your organization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-xl hover:shadow-lg transition-all duration-200 font-semibold">
              <Calendar className="mr-2 w-5 h-5" />
              Schedule Consultation
            </button>
            <button className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white/10 transition-colors">
              <Download className="mr-2 w-5 h-5" />
              Download Implementation Guide
            </button>
          </div>
        </div>
      </section>

      {/* Compliance Standards */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Compliance & Standards
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              HydroPulse™ meets international water management standards and regulatory requirements
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complianceStandards.map((standard, index) => (
              <div key={index} className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-shadow border border-gray-200">
                <Award className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">{standard.name}</h3>
                <p className="text-gray-600 text-sm">{standard.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-12">
            <div className="text-6xl mb-6">💧</div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Transform Your Water Management Today
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of organizations using HydroPulse™ to optimize water resources, reduce costs, and achieve sustainability goals.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-xl transition-all duration-200 text-lg font-semibold">
                Start Free Assessment
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
              <button className="inline-flex items-center justify-center px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50 transition-colors text-lg font-semibold">
                <Phone className="mr-2 w-5 h-5" />
                Talk to Water Expert
              </button>
            </div>

            <div className="text-sm text-gray-500">
              No credit card required • 30-day money-back guarantee • ISO 14046 certified
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-white" />
                </div>
                <div className="text-xl font-bold">HydroPulse™</div>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Advanced water management platform with IoT monitoring, AWD education, and facility management solutions.
              </p>
              <div className="flex space-x-4">
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Globe className="w-5 h-5" />
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Mail className="w-5 h-5" />
                </button>
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Solutions</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <button className="block hover:text-white transition-colors">Smart Monitoring</button>
                <button className="block hover:text-white transition-colors">AWD Education</button>
                <button className="block hover:text-white transition-colors">Facility Management</button>
                <button className="block hover:text-white transition-colors">Expert Consultation</button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <button className="block hover:text-white transition-colors">Documentation</button>
                <button className="block hover:text-white transition-colors">API Reference</button>
                <button className="block hover:text-white transition-colors">Case Studies</button>
                <button className="block hover:text-white transition-colors">Implementation Guide</button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <button className="block hover:text-white transition-colors">Help Center</button>
                <button className="block hover:text-white transition-colors">Contact Support</button>
                <button className="block hover:text-white transition-colors">System Status</button>
                <button className="block hover:text-white transition-colors">Training</button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2024 Aurigraph DLT Corp. All rights reserved.
              </div>
              <div className="flex space-x-6 text-sm text-gray-400">
                <button className="hover:text-white transition-colors">Privacy Policy</button>
                <button className="hover:text-white transition-colors">Terms of Service</button>
                <button className="hover:text-white transition-colors">Cookie Policy</button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HydroPulseLandingPageEnhanced;