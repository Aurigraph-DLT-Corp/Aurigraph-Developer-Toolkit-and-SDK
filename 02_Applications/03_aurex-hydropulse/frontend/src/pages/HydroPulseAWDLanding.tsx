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
  Building,
  UserPlus,
  FileSearch,
  UserCheck,
  Map,
  Satellite,
  Activity,
  CheckSquare,
  CreditCard,
  Wallet,
  TreePine,
  Sprout,
  Mountain,
  MessageCircle,
  Navigation,
  PieChart,
  Users2,
  ClipboardList,
  Cog,
  Router,
  EyeIcon,
  Lightbulb,
  FileLineChart,
  BadgeCheck,
  CircleDollarSign,
  Receipt
} from 'lucide-react';

const HydroPulseAWDLanding: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [liveStats, setLiveStats] = useState({
    farmers: 2547,
    hectares: 12850,
    waterSaved: 385500000,
    methaneReduced: 4280,
    creditsIssued: 8560
  });

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Simulate live stats updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(prev => ({
        farmers: prev.farmers + Math.floor(Math.random() * 3),
        hectares: prev.hectares + Math.floor(Math.random() * 10),
        waterSaved: prev.waterSaved + Math.floor(Math.random() * 100000),
        methaneReduced: prev.methaneReduced + Math.floor(Math.random() * 5),
        creditsIssued: prev.creditsIssued + Math.floor(Math.random() * 10)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const processSteps = [
    {
      step: 1,
      title: 'Project Registration',
      description: 'Regional project setup with acreage and farmer targets',
      icon: Navigation,
      color: 'from-blue-500 to-blue-600'
    },
    {
      step: 2,
      title: 'Baseline Survey',
      description: 'Representative farm sampling for emission baselines',
      icon: PieChart,
      color: 'from-indigo-500 to-indigo-600'
    },
    {
      step: 3,
      title: 'Local Partner Onboarding',
      description: 'Regional partner KYC and agreement signing',
      icon: Users2,
      color: 'from-purple-500 to-purple-600'
    },
    {
      step: 4,
      title: 'Farmer & Plot Onboarding',
      description: 'Individual farmer registration and land documentation',
      icon: ClipboardList,
      color: 'from-pink-500 to-pink-600'
    },
    {
      step: 5,
      title: 'Monitoring Plan Setup',
      description: 'Sensor deployment planning and QA protocols',
      icon: Cog,
      color: 'from-red-500 to-red-600'
    },
    {
      step: 6,
      title: 'Sensor & Satellite Deployment',
      description: 'IoT infrastructure and satellite monitoring setup',
      icon: Router,
      color: 'from-orange-500 to-orange-600'
    },
    {
      step: 7,
      title: 'AWD Implementation',
      description: 'Active AWD practice with real-time monitoring',
      icon: Activity,
      color: 'from-amber-500 to-amber-600'
    },
    {
      step: 8,
      title: 'Monitoring & QA',
      description: 'Continuous data validation and anomaly detection',
      icon: EyeIcon,
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      step: 9,
      title: 'PDD Generation',
      description: 'AI-assisted Project Design Document creation',
      icon: Lightbulb,
      color: 'from-lime-500 to-lime-600'
    },
    {
      step: 10,
      title: 'Monitoring Report',
      description: 'End-of-season emission reduction reporting',
      icon: FileLineChart,
      color: 'from-green-500 to-green-600'
    },
    {
      step: 11,
      title: 'VVB Verification',
      description: 'Third-party verification of emission reductions',
      icon: BadgeCheck,
      color: 'from-emerald-500 to-emerald-600'
    },
    {
      step: 12,
      title: 'Carbon Credit Issuance',
      description: 'Official carbon credit generation and DLT anchoring',
      icon: CircleDollarSign,
      color: 'from-teal-500 to-teal-600'
    },
    {
      step: 13,
      title: 'Incentive Disbursement',
      description: 'Direct farmer payments via DBT/UPI',
      icon: Receipt,
      color: 'from-cyan-500 to-cyan-600'
    }
  ];

  const environmentalBenefits = [
    {
      icon: Cloud,
      title: 'Reduces Methane Emissions',
      value: 'Up to 50%',
      description: 'Significant reduction in greenhouse gas emissions'
    },
    {
      icon: Droplets,
      title: 'Saves Irrigation Water',
      value: '15-30%',
      description: 'Conserve precious water resources'
    },
    {
      icon: Sprout,
      title: 'Improves Soil Health',
      value: 'Enhanced',
      description: 'Reduces nutrient leaching and improves soil structure'
    }
  ];

  const farmerBenefits = [
    {
      icon: DollarSign,
      title: 'Earn Carbon Credits',
      value: 'Additional Income',
      description: 'Generate revenue from sustainable practices'
    },
    {
      icon: Battery,
      title: 'Reduce Costs',
      value: 'Lower Expenses',
      description: 'Save on fuel and power for irrigation'
    },
    {
      icon: TrendingUp,
      title: 'Maintain Yields',
      value: 'Same or Better',
      description: 'No compromise on crop productivity'
    }
  ];

  const globalImpact = [
    {
      icon: Globe,
      title: 'Climate Mitigation',
      value: 'Global Impact',
      description: 'Contributing to climate change solutions'
    },
    {
      icon: Target,
      title: 'SDG Support',
      value: 'UN Goals',
      description: 'Supporting Sustainable Development Goals'
    },
    {
      icon: Mountain,
      title: 'Ecosystem Benefits',
      value: 'Nature Positive',
      description: 'Promoting sustainable agriculture'
    }
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Rice Farmer',
      company: 'Progressive Farms',
      location: 'Punjab, India',
      quote: 'AWD has transformed my farming practice. I save 25% on water costs and earned ₹45,000 in carbon credits last season. The Hydropulse team made the transition seamless.',
      savings: '₹1.2L annually',
      waterSaved: '450,000L',
      methaneReduced: '12 tons CO₂e',
      avatar: '👨‍🌾'
    },
    {
      name: 'Priya Sharma',
      role: 'Agricultural Cooperative Head',
      company: 'Green Valley Cooperative',
      location: 'Haryana, India',
      quote: 'We onboarded 150 farmers to AWD through Hydropulse. The monitoring system and verification process are excellent. Our farmers are seeing real benefits.',
      savings: '₹85L collective',
      waterSaved: '32M liters',
      methaneReduced: '850 tons CO₂e',
      avatar: '👩‍💼'
    },
    {
      name: 'Michael Chen',
      role: 'Sustainability Director',
      company: 'Asia Rice Initiative',
      location: 'Vietnam',
      quote: 'Hydropulse provides the most comprehensive AWD implementation platform. The DMRV compliance and blockchain verification give us complete confidence in the carbon credits.',
      savings: '$250,000',
      waterSaved: '125M liters',
      methaneReduced: '2,100 tons CO₂e',
      avatar: '👨‍💻'
    }
  ];

  const complianceStandards = [
    { 
      name: 'DMRV Compliant', 
      description: 'Digital MRV Process',
      icon: Shield 
    },
    { 
      name: 'Verra VM0042', 
      description: 'Verified Methodology',
      icon: Award 
    },
    { 
      name: 'ISO 14064-2', 
      description: 'GHG Verification',
      icon: CheckSquare 
    },
    { 
      name: 'DPDP Act', 
      description: 'Data Protection (India)',
      icon: FileText 
    },
    { 
      name: 'Blockchain Registry', 
      description: 'Immutable Records',
      icon: Database 
    },
    { 
      name: 'Satellite Verified', 
      description: 'Remote Monitoring',
      icon: Satellite 
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">Hydropulse</div>
                <div className="text-xs text-green-600">AWD Carbon Platform</div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <button className="text-gray-600 hover:text-green-600 font-medium transition-colors">About AWD</button>
              <button className="text-gray-600 hover:text-green-600 font-medium transition-colors">Process</button>
              <button className="text-gray-600 hover:text-green-600 font-medium transition-colors">Impact</button>
              <button className="text-gray-600 hover:text-green-600 font-medium transition-colors">Partners</button>
              <div className="flex gap-2">
                <button className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-all duration-200">
                  Get Started
                </button>
                <button className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-200">
                  Partner with Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100"></div>
          <div className="absolute inset-0" style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
          }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                Hydropulse – Sustainable Rice Cultivation.
                <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent"> Verified Carbon Rewards.</span>
              </h1>
              <p className="text-xl lg:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
                Adopt precision irrigation, reduce methane emissions, save water, and earn carbon credits.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white text-lg rounded-xl hover:shadow-xl transition-all duration-200 group">
                <UserPlus className="mr-2 w-5 h-5" />
                Get Started (Farmer)
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg rounded-xl hover:shadow-xl transition-all duration-200 group">
                <Building className="mr-2 w-5 h-5" />
                Partner with Us (Organizations)
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <button className="inline-flex items-center justify-center px-6 py-3 border-2 border-green-600 text-green-600 rounded-xl hover:bg-green-50 transition-colors group">
              <Play className="mr-2 w-5 h-5" />
              Learn How AWD Works
            </button>

            {/* Visual Split View Placeholder */}
            <div className="mt-12 grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="bg-red-50 rounded-2xl p-8 border-2 border-red-200">
                <h3 className="text-lg font-semibold text-red-800 mb-4">Traditional Flooding</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-red-600">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <span>Continuous water flooding</span>
                  </div>
                  <div className="flex items-center text-red-600">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <span>High methane emissions</span>
                  </div>
                  <div className="flex items-center text-red-600">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <span>Excessive water usage</span>
                  </div>
                  <div className="flex items-center text-red-600">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    <span>Higher irrigation costs</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-2xl p-8 border-2 border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-4">AWD Method</h3>
                <div className="space-y-3">
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span>Alternate wetting & drying</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span>50% less methane</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span>15-30% water savings</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span>Carbon credit earnings</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is AWD? Education Block */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What is AWD?
            </h2>
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                <p className="text-xl text-gray-700 font-medium">
                  AWD = Alternate Wetting and Drying – a climate-smart irrigation method for rice farming.
                </p>
              </div>
              <p className="text-lg text-gray-600 leading-relaxed">
                Instead of keeping paddies continuously flooded, farmers let water levels drop before re-irrigating, 
                reducing methane emissions and saving water while maintaining or improving yields.
              </p>
            </div>
          </div>

          {/* AWD Cycle Visual */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-32 h-32 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Droplets className="w-16 h-16 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Wetting Phase</h3>
              <p className="text-gray-600">Field is irrigated to 5-7cm depth</p>
            </div>
            
            <div className="text-center">
              <div className="w-32 h-32 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <ThermometerSun className="w-16 h-16 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Drying Phase</h3>
              <p className="text-gray-600">Water level drops to 15cm below surface</p>
            </div>
            
            <div className="text-center">
              <div className="w-32 h-32 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Activity className="w-16 h-16 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Repeat Cycle</h3>
              <p className="text-gray-600">Re-irrigate and continue cycle</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200">
              <BookOpen className="mr-2 w-5 h-5" />
              Access Complete AWD Training
            </button>
          </div>
        </div>
      </section>

      {/* Why Adopt AWD? Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Adopt AWD?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Triple benefits: Environmental protection, farmer prosperity, and global impact
            </p>
          </div>

          {/* Environmental Benefits */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Leaf className="w-8 h-8 text-green-600 mr-3" />
              Environmental Benefits
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {environmentalBenefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                    <Icon className="w-12 h-12 text-green-600 mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h4>
                    <div className="text-3xl font-bold text-green-600 mb-2">{benefit.value}</div>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Farmer Benefits */}
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              Farmer Benefits
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {farmerBenefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <div key={index} className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                    <Icon className="w-12 h-12 text-blue-600 mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h4>
                    <div className="text-2xl font-bold text-blue-600 mb-2">{benefit.value}</div>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Global Impact */}
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Globe className="w-8 h-8 text-purple-600 mr-3" />
              Global Impact
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              {globalImpact.map((impact, index) => {
                const Icon = impact.icon;
                return (
                  <div key={index} className="bg-white rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                    <Icon className="w-12 h-12 text-purple-600 mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">{impact.title}</h4>
                    <div className="text-2xl font-bold text-purple-600 mb-2">{impact.value}</div>
                    <p className="text-gray-600 text-sm">{impact.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* How Hydropulse Works - Process Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How Hydropulse Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive 13-step process ensures successful AWD implementation, rigorous monitoring, and verified carbon credit generation from project setup to farmer payments
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {processSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="relative group">
                  <div className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-green-400 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${step.color} rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0`}>
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                        <p className="text-gray-600 text-sm">{step.description}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-center">
                      <Icon className="w-8 h-8 text-gray-400 group-hover:text-green-600 transition-colors" />
                    </div>
                  </div>
                  {index < processSteps.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <ArrowRight className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <button className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl hover:shadow-lg transition-all duration-200">
              <FileText className="mr-2 w-5 h-5" />
              Download Detailed Process Guide
            </button>
          </div>
        </div>
      </section>

      {/* Live Impact Dashboard */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Live Impact Dashboard
            </h2>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              Real-time monitoring of our collective environmental impact
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center text-white">
              <Users className="w-10 h-10 mx-auto mb-3 text-green-200" />
              <div className="text-3xl font-bold mb-2">{liveStats.farmers.toLocaleString()}</div>
              <div className="text-green-100">Farmers Onboarded</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center text-white">
              <MapPin className="w-10 h-10 mx-auto mb-3 text-green-200" />
              <div className="text-3xl font-bold mb-2">{liveStats.hectares.toLocaleString()}</div>
              <div className="text-green-100">Hectares under AWD</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center text-white">
              <Droplets className="w-10 h-10 mx-auto mb-3 text-blue-200" />
              <div className="text-3xl font-bold mb-2">{(liveStats.waterSaved / 1000000).toFixed(1)}M</div>
              <div className="text-blue-100">Liters Water Saved</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center text-white">
              <Cloud className="w-10 h-10 mx-auto mb-3 text-blue-200" />
              <div className="text-3xl font-bold mb-2">{liveStats.methaneReduced.toLocaleString()}</div>
              <div className="text-blue-100">Tons CO₂e Reduced</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center text-white">
              <CreditCard className="w-10 h-10 mx-auto mb-3 text-green-200" />
              <div className="text-3xl font-bold mb-2">{liveStats.creditsIssued.toLocaleString()}</div>
              <div className="text-green-100">Carbon Credits Issued</div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center text-white/80 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              Live data updated every 3 seconds
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials & Case Studies */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Success Stories from the Field
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real farmers, real impact, real carbon credits
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border border-green-100">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="text-6xl mb-4">{testimonials[currentTestimonial].avatar}</div>
                <blockquote className="text-xl text-gray-700 italic mb-6">
                  "{testimonials[currentTestimonial].quote}"
                </blockquote>
                <div>
                  <div className="font-semibold text-gray-900 text-lg">
                    {testimonials[currentTestimonial].name}
                  </div>
                  <div className="text-green-600">
                    {testimonials[currentTestimonial].role} at {testimonials[currentTestimonial].company}
                  </div>
                  <div className="text-gray-500 text-sm">
                    {testimonials[currentTestimonial].location}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-green-50 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-600 text-sm mb-1">Annual Savings</div>
                      <div className="text-2xl font-bold text-green-600">
                        {testimonials[currentTestimonial].savings}
                      </div>
                    </div>
                    <DollarSign className="w-10 h-10 text-green-500" />
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-600 text-sm mb-1">Water Conserved</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {testimonials[currentTestimonial].waterSaved}
                      </div>
                    </div>
                    <Droplets className="w-10 h-10 text-blue-500" />
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-600 text-sm mb-1">Methane Reduced</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {testimonials[currentTestimonial].methaneReduced}
                      </div>
                    </div>
                    <Cloud className="w-10 h-10 text-purple-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial indicators */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <button className="inline-flex items-center px-6 py-3 border-2 border-green-600 text-green-600 rounded-xl hover:bg-green-50 transition-colors">
              <BookOpen className="mr-2 w-5 h-5" />
              Read All Case Studies
            </button>
          </div>
        </div>
      </section>

      {/* Compliance & Credibility */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Compliance & Credibility
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Verified, transparent, and blockchain-secured carbon credits you can trust
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-6">
            {complianceStandards.map((standard, index) => {
              const Icon = standard.icon;
              return (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-green-50 rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300 border border-green-200">
                  <Icon className="w-10 h-10 text-green-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{standard.name}</h3>
                  <p className="text-gray-600 text-xs">{standard.description}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-8 border border-green-200">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Trust Through Technology
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Satellite imagery validates AWD implementation</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">IoT sensors provide real-time water level data</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Blockchain ensures immutable credit records</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">Third-party verification by accredited bodies</span>
                  </li>
                </ul>
              </div>
              <div className="text-center">
                <div className="inline-flex p-8 bg-white rounded-2xl shadow-lg">
                  <Shield className="w-32 h-32 text-green-600" />
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  100% Verified Carbon Credits
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            {/* For Farmers */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-white">
              <div className="text-center mb-6">
                <div className="inline-flex p-4 bg-white/20 rounded-full mb-4">
                  <Users className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold mb-2">For Farmers</h3>
                <p className="text-lg text-green-100">
                  Earn from your sustainability efforts. Start AWD with Hydropulse.
                </p>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-300" />
                  <span>Free onboarding and training</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-300" />
                  <span>Guaranteed carbon credit payments</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-300" />
                  <span>Technical support throughout</span>
                </div>
              </div>
              <button className="w-full inline-flex items-center justify-center px-6 py-3 bg-white text-green-600 rounded-xl hover:shadow-lg transition-all duration-200 font-semibold">
                Sign Up Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>

            {/* For Partners */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-white">
              <div className="text-center mb-6">
                <div className="inline-flex p-4 bg-white/20 rounded-full mb-4">
                  <Building className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold mb-2">For Partners</h3>
                <p className="text-lg text-blue-100">
                  Bring AWD to your network. Partner with us.
                </p>
              </div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-blue-300" />
                  <span>Scale sustainable agriculture</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-blue-300" />
                  <span>Generate verified carbon credits</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-3 text-blue-300" />
                  <span>Complete implementation support</span>
                </div>
              </div>
              <button className="w-full inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 rounded-xl hover:shadow-lg transition-all duration-200 font-semibold">
                Request Demo
                <ArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button className="inline-flex items-center px-8 py-4 border-2 border-white text-white rounded-xl hover:bg-white/10 transition-colors text-lg">
              <Phone className="mr-2 w-5 h-5" />
              Contact Us for More Information
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-white" />
                </div>
                <div className="text-xl font-bold">Hydropulse</div>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                Empowering farmers with AWD technology for sustainable rice cultivation and verified carbon rewards.
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
                <button className="text-gray-400 hover:text-white transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <button className="block hover:text-white transition-colors">About AWD</button>
                <button className="block hover:text-white transition-colors">How It Works</button>
                <button className="block hover:text-white transition-colors">Impact Dashboard</button>
                <button className="block hover:text-white transition-colors">Carbon Credits</button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <button className="block hover:text-white transition-colors">AWD Training</button>
                <button className="block hover:text-white transition-colors">FAQs</button>
                <button className="block hover:text-white transition-colors">Case Studies</button>
                <button className="block hover:text-white transition-colors">Documentation</button>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <button className="block hover:text-white transition-colors">Terms of Service</button>
                <button className="block hover:text-white transition-colors">Privacy Policy</button>
                <button className="block hover:text-white transition-colors">Cookie Policy</button>
                <button className="block hover:text-white transition-colors">Data Protection</button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 text-sm mb-4 md:mb-0">
                © 2024 Aurigraph DLT Corp. All rights reserved.
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Powered by blockchain technology</span>
                <span>•</span>
                <span>DMRV Compliant</span>
                <span>•</span>
                <span>ISO Certified</span>
              </div>
            </div>
          </div>

          {/* Support Chat Widget Placeholder */}
          <div className="fixed bottom-6 right-6">
            <button className="w-14 h-14 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200">
              <MessageCircle className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HydroPulseAWDLanding;