import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  BarChart3,
  FileText,
  CheckCircle,
  ArrowRight,
  Target,
  Globe,
  Award,
  TrendingUp,
  Users,
  Building,
  Leaf,
  Zap,
  Lock,
  Play,
  Star,
  Clock,
  ChevronRight,
  ExternalLink,
  Activity,
  Database,
  Upload,
  GitBranch,
  Gauge,
  Recycle,
  DollarSign,
  ShoppingCart,
  MessageCircle,
  Calculator
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import GHGReadinessAssessment from '../components/assessment/GHGReadinessAssessment';
import AssessmentResults from '../components/assessment/AssessmentResults';
import AnnualReportAnalytics from '../components/analytics/AnnualReportAnalytics';
import Footer from '../components/Footer';

const LaunchpadLandingPage: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);
  const [showGHGAssessment, setShowGHGAssessment] = useState(false);
  const [showReportAnalytics, setShowReportAnalytics] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState<any>(null);
  const heroRef = useRef<HTMLElement>(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleAuthAction = (actionType: string, applicationId?: string) => {
    if (!isAuthenticated) {
      // Store the intended action in localStorage to redirect after login
      if (applicationId) {
        localStorage.setItem('postLoginAction', JSON.stringify({ type: actionType, appId: applicationId }));
      }
      navigate('/login');
    } else {
      // User is authenticated, proceed with the action
      handleApplicationAction(actionType, applicationId);
    }
  };

  const handleApplicationAction = (actionType: string, applicationId?: string) => {
    switch (actionType) {
      case 'free_assessment':
        if (applicationId === 'ghg-readiness') {
          setShowGHGAssessment(true);
        } else if (applicationId === 'annual-report-analytics') {
          setShowReportAnalytics(true);
        }
        console.log(`Starting ${applicationId} assessment for user: ${user?.email}`);
        break;
      case 'premium_contact':
        // Handle premium service contact
        console.log(`Contact for premium service: ${applicationId}`);
        // TODO: Open contact modal or navigate to contact page
        break;
      case 'platform_demo':
        // Handle platform demo request
        console.log('Platform demo requested');
        // TODO: Navigate to demo booking page
        break;
      case 'consultation':
        // Handle consultation booking
        console.log('Consultation booking requested');
        // TODO: Navigate to consultation booking page
        break;
    }
  };

  const handleAssessmentComplete = (assessmentData: any) => {
    setShowGHGAssessment(false);
    setAssessmentResults(assessmentData);
  };

  const handleReportAnalyticsComplete = (analysisResults: any) => {
    setShowReportAnalytics(false);
    console.log('Report analysis completed:', analysisResults);
    // TODO: Handle analytics results display
  };

  const handleResultsClose = () => {
    setAssessmentResults(null);
  };

  const handleStartPremium = () => {
    console.log('Starting premium service flow');
    // TODO: Navigate to premium service selection or contact form
  };

  // Free Offerings (3 applications)
  const freeOfferings = [
    {
      id: 'ghg-readiness',
      title: 'GHG Readiness Assessment',
      subtitle: 'Beginner Assessment',
      description: 'Evaluate your organization\'s readiness for greenhouse gas reporting with our comprehensive beginner-friendly assessment.',
      icon: Shield,
      gradient: 'from-emerald-500 to-teal-600',
      price: 'FREE',
      features: [
        '7-section readiness evaluation',
        'Beginner-friendly questionnaire',
        'Immediate scoring and results',
        'Gap identification',
        'Basic improvement recommendations'
      ],
      cta: 'Start Assessment',
      popular: true
    },
    {
      id: 'annual-report-analytics',
      title: 'GHG Assessment for Mature Organizations',
      subtitle: 'Annual Report Analytics',
      description: 'Evaluate your organization\'s GHG emissions report gaps by uploading your annual reports.',
      icon: Upload,
      gradient: 'from-blue-500 to-indigo-600',
      price: 'FREE',
      features: [
        'Upload annual sustainability reports',
        'AI-powered document analysis',
        'Gap identification in reporting',
        'Benchmark against standards',
        'Improvement recommendations'
      ],
      cta: 'Upload Report'
    },
    {
      id: 'carbon-maturity-model',
      title: 'Aurex Carbon Maturity Model',
      subtitle: 'Assess Carbon Maturity',
      description: 'Assess your organization\'s carbon accounting maturity using our 5-level CMM framework with industry benchmarking.',
      icon: GitBranch,
      gradient: 'from-purple-500 to-pink-600',
      price: 'FREE',
      features: [
        '5-level capability maturity model',
        'Evidence-based assessment',
        'Industry benchmarking',
        'Tailored improvement roadmaps',
        'Progress tracking dashboard'
      ],
      cta: 'Assess Maturity',
      badge: 'Patent-Pending'
    }
  ];

  // Premium Offerings (3 applications)
  const premiumOfferings = [
    {
      id: 'data-acquisition',
      title: 'Industry Data Acquisition and Analytics',
      subtitle: 'Capture Emission Data',
      description: 'Capture and analyze industry-specific emission data with comprehensive data acquisition forms and analytics.',
      icon: Database,
      gradient: 'from-cyan-500 to-blue-600',
      price: 'PREMIUM',
      features: [
        'Industry-specific data forms',
        'Comprehensive emission tracking',
        'Advanced analytics dashboard',
        'Custom reporting tools',
        'Data validation and verification'
      ],
      cta: 'Contact Us'
    },
    {
      id: 'product-carbon-footprint',
      title: 'Product Carbon Footprint',
      subtitle: 'Product LCA Analysis',
      description: 'Calculate and analyze your product\'s carbon footprint with comprehensive emission tracking and reporting.',
      icon: Calculator,
      gradient: 'from-green-500 to-emerald-600',
      price: 'PREMIUM',
      disabled: true,
      features: [
        'Cradle-to-gate analysis',
        'Product-specific calculations',
        'Emission hotspot identification',
        'Supply chain impact assessment',
        'Carbon label generation'
      ],
      cta: 'Contact Us'
    },
    {
      id: 'lifecycle-assessment',
      title: 'Life Cycle Assessment (LCA)',
      subtitle: 'Comprehensive LCA',
      description: 'Comprehensive life cycle assessment tools to evaluate environmental impacts across your product\'s entire lifecycle.',
      icon: Recycle,
      gradient: 'from-orange-500 to-red-600',
      price: 'PREMIUM',
      disabled: true,
      features: [
        'Cradle-to-grave analysis',
        'Multi-impact assessment',
        'ISO 14040/14044 compliance',
        'Impact visualization',
        'Sensitivity analysis'
      ],
      cta: 'Contact Us'
    }
  ];

  const platformFeatures = [
    {
      icon: Target,
      title: 'Comprehensive Assessment',
      description: 'Multi-framework ESG evaluation supporting GRI, SASB, TCFD, and CDP standards.',
      color: 'text-emerald-600'
    },
    {
      icon: Activity,
      title: 'Automated Calculations',
      description: 'AI-powered GHG emissions and impact calculations with 95% accuracy.',
      color: 'text-blue-600'
    },
    {
      icon: FileText,
      title: 'Intelligent Reporting',
      description: 'Automated generation of compliance-ready reports in under 5 minutes.',
      color: 'text-purple-600'
    },
    {
      icon: Database,
      title: 'Data Integration',
      description: 'Smart document processing and data extraction for 100+ document types.',
      color: 'text-cyan-600'
    },
    {
      icon: TrendingUp,
      title: 'Actionable Insights',
      description: 'Analytics and AI-powered recommendations for continuous improvement.',
      color: 'text-orange-600'
    },
    {
      icon: Shield,
      title: 'Regulatory Compliance',
      description: 'Built-in compliance validation for major ESG frameworks and standards.',
      color: 'text-red-600'
    }
  ];


  const testimonials = [
    {
      quote: "The free GHG Readiness Assessment gave us a clear starting point for our carbon accounting journey. The beginner-friendly approach was exactly what our team needed.",
      author: "Sarah Chen",
      role: "Chief Sustainability Officer",
      company: "Global Manufacturing Corp",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b5bc?w=64&h=64&fit=crop&crop=face"
    },
    {
      quote: "Aurex's Carbon Maturity Model assessment provided invaluable benchmarking insights. The tailored roadmap helped us prioritize our carbon management initiatives effectively.",
      author: "Michael Rodriguez",
      role: "ESG Manager",
      company: "European Energy Ltd",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=face"
    }
  ];

  const implementationPhases = [
    {
      phase: '01',
      title: 'Core Modules',
      description: 'ESG Assessment Engine and GHG Calculator - foundational tools for immediate impact assessment and compliance readiness.',
      color: 'from-emerald-500 to-teal-600',
      modules: ['ESG Assessment Engine', 'GHG Emissions Calculator']
    },
    {
      phase: '02',
      title: 'Compliance & AI',
      description: 'EU Taxonomy/ESRS and Document Intelligence - regulatory compliance with AI-powered automation and processing.',
      color: 'from-blue-500 to-indigo-600',
      modules: ['EU Taxonomy & ESRS', 'Document Intelligence', 'Materiality Assessment']
    },
    {
      phase: '03',
      title: 'Advanced Analytics',
      description: 'Supply Chain ESG and Carbon Maturity Navigator™ - comprehensive value chain analysis with patent-pending technology.',
      color: 'from-purple-500 to-pink-600',
      modules: ['Analytics & Reporting', 'Supply Chain ESG', 'Carbon Maturity Navigator™']
    },
    {
      phase: '04',
      title: 'Enterprise Workflow',
      description: 'Assurance workflow and Stakeholder Engagement - complete enterprise-grade ESG management platform.',
      color: 'from-orange-500 to-red-600',
      modules: ['Assurance Workflow', 'Stakeholder Engagement', 'Organization Management']
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % platformFeatures.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [platformFeatures.length]);

  // Handle post-login actions
  useEffect(() => {
    if (isAuthenticated && user) {
      const postLoginAction = localStorage.getItem('postLoginAction');
      if (postLoginAction) {
        try {
          const action = JSON.parse(postLoginAction);
          localStorage.removeItem('postLoginAction');
          handleApplicationAction(action.type, action.appId);
        } catch (error) {
          console.error('Error processing post-login action:', error);
        }
      }
    }
  }, [isAuthenticated, user]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <motion.div
                initial={{ rotate: -45 }}
                animate={{ rotate: 0 }}
                transition={{ duration: 0.5 }}
                className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg"
              >
                <Leaf className="w-7 h-7 text-white" />
              </motion.div>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => handleAuthAction('premium_contact')}
                className="text-gray-600 hover:text-emerald-600 font-medium transition-colors"
              >
                Contact Sales
              </button>
              <button 
                onClick={() => handleAuthAction('free_assessment', 'ghg-readiness')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {isAuthenticated ? 'Start Assessment' : 'Login to Start'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.4, scale: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute top-20 left-10 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
            className="absolute top-40 right-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.3, scale: 1 }}
            transition={{ duration: 2, delay: 1 }}
            className="absolute -bottom-20 left-1/3 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-medium text-sm mb-6"
          >
            <Star className="w-4 h-4 mr-2" />
            3 Free Tools • 3 Premium Services • Patent-Pending Technology
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight"
          >
            Carbon Assessment &
            <span className="block bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              Management Platform
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xl lg:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto"
          >
            Start your carbon accounting journey with our free assessment tools, then advance with premium carbon management services. 
            From readiness evaluation to carbon credit trading - comprehensive solutions for every stage.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isHeroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <button 
              onClick={() => handleAuthAction('free_assessment', 'ghg-readiness')}
              className="group bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {isAuthenticated ? 'Start Free Assessment' : 'Login to Start Assessment'}
              <ArrowRight className="inline-block ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => handleAuthAction('platform_demo')}
              className="group border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
            >
              <Play className="inline-block mr-2 w-5 h-5" />
              {isAuthenticated ? 'Platform Demo' : 'Login for Demo'}
            </button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isHeroInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600"
          >
            {[
              { icon: CheckCircle, text: 'GRI • SASB • TCFD • CDP' },
              { icon: CheckCircle, text: 'ISO 14064-1 • CSRD • EU Taxonomy' },
              { icon: CheckCircle, text: 'Patent-Pending CMM Technology' },
              { icon: CheckCircle, text: 'AI-Powered Intelligence' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={isHeroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                className="flex items-center gap-2"
              >
                <item.icon className="w-5 h-5 text-emerald-600" />
                {item.text}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>


      {/* Free Offerings Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-700 font-medium text-sm mb-6">
              <Award className="w-4 h-4 mr-2" />
              Our Free Offerings
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Get Started for Free
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive free assessment tools designed to help you understand your carbon footprint and sustainability readiness
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {freeOfferings.map((app, index) => {
              const Icon = app.icon;
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="group relative"
                >
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                    {/* Popular Badge */}
                    {app.popular && (
                      <div className="absolute top-6 right-6 z-10">
                        <span className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    {/* Patent Badge */}
                    {app.badge && (
                      <div className="absolute top-6 left-6 z-10">
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                          {app.badge}
                        </span>
                      </div>
                    )}

                    {/* Header */}
                    <div className={`bg-gradient-to-r ${app.gradient} p-8 text-white relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/10"></div>
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <Icon className="w-12 h-12" />
                          <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold">
                            {app.price}
                          </span>
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{app.title}</h3>
                        <p className="text-sm text-white/90 mb-2">{app.subtitle}</p>
                        <p className="text-white/80 text-sm leading-relaxed">{app.description}</p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                      <div className="mb-6">
                        <div className="space-y-3">
                          {app.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                              <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-600">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button 
                        onClick={() => handleAuthAction('free_assessment', app.id)}
                        className="bg-gray-900 hover:bg-gray-800 text-white py-3 px-6 rounded-lg font-semibold transition-all group-hover:bg-gradient-to-r group-hover:from-emerald-600 group-hover:to-blue-600 flex items-center justify-center"
                      >
                        {isAuthenticated ? app.cta : 'Login to Start'}
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </section>

      {/* Premium Offerings Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 text-purple-700 font-medium text-sm mb-6">
              <Star className="w-4 h-4 mr-2" />
              Our Premium Offerings
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Advanced Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced carbon management solutions for organizations ready to take their sustainability journey to the next level
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {premiumOfferings.map((app, index) => {
              const Icon = app.icon;
              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: (index % 3) * 0.1 }}
                  viewport={{ once: true }}
                  className="group relative"
                >
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    {/* Header */}
                    <div className={`bg-gradient-to-r ${app.gradient} p-6 text-white relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-black/5"></div>
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <Icon className="w-10 h-10" />
                          <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold">
                            {app.price}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold mb-1">{app.title}</h3>
                        <p className="text-xs text-white/80 mb-2">{app.subtitle}</p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed">{app.description}</p>
                      
                      <div className="mb-4">
                        <div className="space-y-2">
                          {app.features.slice(0, 3).map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-gray-600">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <button 
                        onClick={() => !app.disabled && handleAuthAction('premium_contact', app.id)}
                        className={`py-2 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center ${
                          app.disabled 
                            ? 'bg-gray-400 text-gray-600 cursor-not-allowed opacity-50' 
                            : 'bg-gray-900 hover:bg-gray-800 text-white group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600'
                        }`}
                        disabled={app.disabled}
                      >
                        {app.disabled ? 'Coming Soon' : (isAuthenticated ? app.cta : 'Login for Access')}
                        <ExternalLink className={`ml-1 w-4 h-4 ${
                          app.disabled ? 'opacity-50' : 'group-hover:translate-x-0.5 transition-transform'
                        }`} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-100 text-purple-700 font-medium text-sm mb-6">
              <Award className="w-4 h-4 mr-2" />
              Platform Advantages
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Why Choose Aurex Launchpad™
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Industry-leading ESG platform with patent-pending technology and AI-powered intelligence
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {platformFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="group bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Implementation Roadmap */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-medium text-sm mb-6">
              <Activity className="w-4 h-4 mr-2" />
              Implementation Roadmap
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Phased Platform Rollout
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Strategic 4-phase implementation ensuring immediate value while building toward comprehensive ESG management
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {implementationPhases.map((phase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center group"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${phase.color} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <span className="text-white font-bold text-xl">{phase.phase}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
                  {phase.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {phase.description}
                </p>
                <div className="space-y-1">
                  {phase.modules.map((module, idx) => (
                    <div key={idx} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      {module}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-r from-emerald-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 font-medium text-sm mb-6">
              <Users className="w-4 h-4 mr-2" />
              Customer Success Stories
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Trusted by ESG Leaders
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-xl shadow-lg"
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-700 mb-6 text-lg leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.author}
                    className="w-12 h-12 rounded-full mr-4"
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Expert Guidance CTA */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 text-center"
          >
            <MessageCircle className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Need Expert Guidance?</h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Ready to take your sustainability journey to the next level? Schedule a consultation with our carbon accounting experts.
            </p>
            <button 
              onClick={() => handleAuthAction('consultation')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              {isAuthenticated ? 'Schedule Consultation' : 'Login for Consultation'}
            </button>
          </motion.div>
        </div>
      </section>

      {/* Compliance Standards */}
      <section className="py-20 bg-gradient-to-r from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              ESG Frameworks & Standards
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Native support for all major ESG frameworks, regulations, and emerging standards
            </p>
          </motion.div>

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[ 
              'GRI Standards', 'SASB', 'TCFD', 'CDP', 'ISO 14064-1', 'CSRD',
              'EU Taxonomy', 'ESRS', 'SFDR', 'SEC Climate', 'GHG Protocol', 'CDSB'
            ].map((standard, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="group"
              >
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-4 rounded-lg text-center hover:bg-white/20 transition-all duration-300 group-hover:scale-105">
                  <div className="text-white font-semibold text-sm">{standard}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Ready to Transform Your ESG Management?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join organizations worldwide using our comprehensive 13-module platform for complete ESG management and compliance
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => handleAuthAction('free_assessment', 'ghg-readiness')}
                className="bg-white text-emerald-600 hover:bg-gray-50 px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg"
              >
                {isAuthenticated ? 'Start Free Assessment' : 'Login to Start Assessment'}
                <ArrowRight className="inline-block ml-2 w-5 h-5" />
              </button>
              <button 
                onClick={() => handleAuthAction('platform_demo')}
                className="border-2 border-white text-white hover:bg-white hover:text-emerald-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all"
              >
                {isAuthenticated ? 'Schedule Platform Demo' : 'Login for Demo'}
                <ExternalLink className="inline-block ml-2 w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Assessment Modals */}
      {showGHGAssessment && (
        <GHGReadinessAssessment
          organizationId={user?.organizationId || 'demo-org'}
          onComplete={handleAssessmentComplete}
          onClose={() => setShowGHGAssessment(false)}
        />
      )}

      {assessmentResults && (
        <AssessmentResults
          assessmentData={assessmentResults}
          onClose={handleResultsClose}
          onStartPremium={handleStartPremium}
        />
      )}

      {showReportAnalytics && (
        <AnnualReportAnalytics
          organizationId={user?.organizationId || 'demo-org'}
          onComplete={handleReportAnalyticsComplete}
          onClose={() => setShowReportAnalytics(false)}
          remainingUploads={3}
        />
      )}
      <Footer />
    </div>
  );
};

export default LaunchpadLandingPage;
