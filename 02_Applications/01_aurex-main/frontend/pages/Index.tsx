import { Link } from "react-router-dom";
import ConsultationForm from '@/components/ConsultationForm';
import AurexLogo from '@/components/ui/AurexLogo';
import { useAuth } from '../contexts/AuthContext';



// Custom Get Started button that triggers authentication
const GetStartedButton = () => {
  try {
    const { isAuthenticated } = useAuth();

    const handleGetStarted = () => {
      if (isAuthenticated) {
        // If already authenticated, go to dashboard
        window.location.href = '/dashboard';
      } else {
        // If not authenticated, go to launchpad where they can sign up
        window.location.href = '/launchpad';
      }
    };

    return (
      <button
        onClick={handleGetStarted}
        className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
      >
        Get Started
      </button>
    );
  } catch (error) {
    // Fallback if auth context is not available
    return (
      <Link to="/launchpad" className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm">
        Get Started
      </Link>
    );
  }
};

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3">
              <AurexLogo size="lg" variant="default" />
              <div>
                <div className="font-bold text-xl text-gray-900">Aurex</div>
                <div className="text-sm text-gray-600">
                  Sustainability Platform, by <span className="text-green-600 font-medium">Aurigraph</span>
                </div>
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#platform" className="text-gray-700 hover:text-green-600 font-medium transition-colors">Platform</a>
              <a href="#about" className="text-gray-700 hover:text-green-600 font-medium transition-colors">About</a>
              <a href="#contact" className="text-gray-700 hover:text-green-600 font-medium transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Light */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-6">
                <span className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Carbon & Regenerative Solutions Platform
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 leading-tight">
                Aurigraph
                <span className="block text-green-600">Aurex Platform</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Comprehensive DMRV-compliant platform for carbon accounting, ESG assessment,
                and regenerative agriculture solutions. Transform your sustainability journey
                with blockchain-verified carbon credits and real-time monitoring.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="#platform"
                  className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg"
                >
                  Start Assessment
                </a>
                <a
                  href="#platform"
                  className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-green-600 hover:text-white transition-colors"
                >
                  Explore Solutions
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🌱</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">500+</div>
                    <div className="text-sm text-gray-600">Organizations</div>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">💧</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">50M+</div>
                    <div className="text-sm text-gray-600">Tons CO2e Tracked</div>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🌍</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">95%</div>
                    <div className="text-sm text-gray-600">DMRV Compliance</div>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">⚡</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">24/7</div>
                    <div className="text-sm text-gray-600">Real-time Monitoring</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Applications - Dark */}
      <section id="platform" className="py-20 px-4 bg-gradient-to-br from-gray-700 to-slate-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Integrated Platform Applications</h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-5xl mx-auto leading-relaxed">
              Four specialized applications working together to provide comprehensive sustainability solutions across carbon management, ESG assessment, and regenerative agriculture
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Aurex Launchpad™ */}
            <div className="bg-white rounded-2xl p-6 border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Aurex Launchpad™</h3>
                <p className="text-green-600 font-medium text-sm">Your Gateway to Net-Zero Excellence</p>
              </div>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed flex-grow">
                Comprehensive ESG assessment and sustainability management platform for your complete net-zero journey.
              </p>
              <div className="mt-auto">
                <Link
                  to="/launchpad"
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm text-center inline-block"
                >
                  Launch Assessment
                </Link>
              </div>
            </div>

            {/* Aurex HydroPulse™ */}
            <div className="bg-white rounded-2xl p-6 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">💧</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Aurex HydroPulse™</h3>
                <p className="text-blue-600 font-medium text-sm">Smart Water, Smarter Farming</p>
              </div>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed flex-grow">
                Revolutionary AWD platform that transforms rice farming through intelligent water management and carbon credits.
              </p>
              <div className="mt-auto">
                <Link
                  to="/hydropulse"
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm text-center inline-block"
                >
                  Discover Hydropulse
                </Link>
              </div>
            </div>

            {/* Aurex SylvaGraph™ */}
            <div className="bg-white rounded-2xl p-6 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🌳</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Aurex SylvaGraph™</h3>
                <p className="text-purple-600 font-medium text-sm">DMRV Agroforestry Platform</p>
              </div>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed flex-grow">
                DMRV-compliant agroforestry platform using drones, satellites, and blockchain tokenization for verifiable carbon credits.
              </p>
              <div className="mt-auto">
                <Link
                  to="/sylvagraph"
                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm text-center inline-block"
                >
                  Join Sylvagraph
                </Link>
              </div>
            </div>

            {/* Aurex CarbonTrace™ */}
            <div className="bg-white rounded-2xl p-6 border-2 border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col h-full">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Aurex CarbonTrace™</h3>
                <p className="text-emerald-600 font-medium text-sm">Blockchain-Verified Carbon Excellence</p>
              </div>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed flex-grow">
                Next-generation carbon credit marketplace powered by blockchain technology with DMRV-compliant trading.
              </p>
              <div className="mt-auto">
                <Link
                  to="/carbon-trace"
                  className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors text-sm text-center inline-block"
                >
                  Explore CarbonMarkets
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Expertise Drives Change Section - Light */}
      <section id="about" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Our Expertise Drives Change</h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-5xl mx-auto leading-relaxed">
              With deep expertise in carbon markets, regenerative agriculture, and blockchain technology,
              our team brings together scientists, technologists, and sustainability experts to create
              comprehensive solutions that address climate challenges while empowering communities.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
            {/* Aurex HydroPulse™ */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 sm:p-8 border border-blue-100 hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-8 text-center sm:text-left">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-2xl">💧</span>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Aurex HydroPulse™</h3>
                  <p className="text-blue-600 font-medium text-sm sm:text-base">Advanced Water Management & AWD Platform</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                <div className="text-center">
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-blue-100">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600 mb-2">21,053</div>
                    <div className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Hectares</div>
                    <div className="text-xs sm:text-sm text-gray-600">Under AWD Management</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-blue-100">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600 mb-2">5.89M</div>
                    <div className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Carbon Credits</div>
                    <div className="text-xs sm:text-sm text-gray-600">Generated & Verified</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-blue-200">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Water Conservation</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Methane Reduction</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">Rice Farming</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">DMRV Compliant</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/hydropulse"
                  className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                >
                  Explore HydroPulse Platform →
                </Link>
              </div>
            </div>

            {/* Aurex SylvaGraph™ */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 sm:p-8 border border-emerald-100 hover:shadow-xl transition-all duration-300">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-8 text-center sm:text-left">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-2xl">🌲</span>
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Aurex SylvaGraph™</h3>
                  <p className="text-emerald-600 font-medium text-sm sm:text-base">DMRV-Compliant Agroforestry Platform</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                <div className="text-center">
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-emerald-100">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-600 mb-2">10M</div>
                    <div className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Hectares</div>
                    <div className="text-xs sm:text-sm text-gray-600">Forest Area Monitored</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-emerald-100">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-emerald-600 mb-2">150M</div>
                    <div className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Carbon Credits</div>
                    <div className="text-xs sm:text-sm text-gray-600">Sequestration Tracked</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-emerald-200">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">AI Monitoring</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">Drone Technology</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">Agroforestry</span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">Carbon Sequestration</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/sylvagraph"
                  className="inline-flex items-center text-emerald-600 font-semibold hover:text-emerald-700 transition-colors"
                >
                  Explore SylvaGraph Platform →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cutting-Edge Technology Section - Dark */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-700 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Cutting-Edge Technology</h2>
            <p className="text-xl md:text-2xl text-gray-300 max-w-5xl mx-auto leading-relaxed">
              Powered by advanced technologies that ensure accuracy, transparency, and scalability
              in sustainability management and carbon accounting
            </p>
          </div>

          {/* Mobile Grid Layout */}
          <div className="block lg:hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mobile Technology Cards */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-white text-2xl">⛓️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Blockchain Technology</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Immutable ledger technology ensuring transparent, verifiable, and tamper-proof carbon credit transactions.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">Smart Contracts</span>
                  <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm">DMRV Compliance</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-6 border border-emerald-200 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-white text-2xl">🤖</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">AI & Machine Learning</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Advanced algorithms for predictive analytics and automated decision-making in sustainability assessments.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm">Predictive Analytics</span>
                  <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm">Automation</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-200 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-white text-2xl">🛰️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Satellite & IoT Integration</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Real-time monitoring through satellite imagery and IoT sensors for accurate environmental assessment.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-orange-600 text-white rounded-full text-sm">Real-time Monitoring</span>
                  <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm">IoT Sensors</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-6 border border-cyan-200 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-white text-2xl">☁️</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Cloud Computing</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Scalable cloud infrastructure ensuring high availability and global accessibility for sustainability operations.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-cyan-600 text-white rounded-full text-sm">Scalability</span>
                  <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">Global Access</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-white text-2xl">📊</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Advanced Analytics</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Sophisticated data processing and visualization tools providing deep insights into sustainability metrics.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm">Data Visualization</span>
                  <span className="px-3 py-1 bg-pink-600 text-white rounded-full text-sm">Deep Insights</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-6 border border-teal-200 hover:shadow-xl transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-white text-2xl">🔗</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">API Integration</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Seamless integration with existing enterprise systems and industry-standard sustainability frameworks.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-teal-600 text-white rounded-full text-sm">Enterprise Integration</span>
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm">Standards Compliance</span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Auto-scroll Layout */}
          <div className="hidden lg:block relative overflow-hidden">
            <div className="flex gap-8 animate-scroll-tech hover:pause-animation">
              {/* First set of cards */}
              {/* Blockchain Technology */}
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 border border-blue-300 hover:shadow-xl transition-all duration-300 flex-shrink-0 w-80">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-white text-2xl">⛓️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Blockchain Technology</h3>
              <p className="text-gray-700 mb-6 leading-relaxed">
                Immutable ledger technology ensuring transparent, verifiable, and tamper-proof carbon credit transactions and sustainability data recording.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">Smart Contracts</span>
                <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm">DMRV Compliance</span>
                <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">Transparency</span>
              </div>
              </div>

              {/* AI & Machine Learning */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8 border border-emerald-200 hover:shadow-xl transition-all duration-300 flex-shrink-0 w-80">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-white text-2xl">🤖</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">AI & Machine Learning</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Advanced algorithms for predictive analytics, pattern recognition, and automated decision-making in sustainability assessments and environmental monitoring.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm">Predictive Analytics</span>
                  <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm">Pattern Recognition</span>
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm">Automation</span>
                </div>
              </div>

              {/* Satellite & IoT Integration */}
              <div className="bg-gradient-to-br from-orange-700/60 to-red-700/60 rounded-2xl p-8 border border-orange-600/40 hover:shadow-xl transition-all duration-300 flex-shrink-0 w-80">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-white text-2xl">🛰️</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Satellite & IoT Integration</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Real-time monitoring through satellite imagery and IoT sensors providing continuous data collection for accurate environmental impact assessment.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-orange-600/30 text-orange-200 rounded-full text-sm">Real-time Monitoring</span>
                <span className="px-3 py-1 bg-red-600/30 text-red-200 rounded-full text-sm">Satellite Imagery</span>
                <span className="px-3 py-1 bg-orange-600/30 text-orange-200 rounded-full text-sm">IoT Sensors</span>
              </div>
              </div>

              {/* Cloud Computing */}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 border border-cyan-200 hover:shadow-xl transition-all duration-300 flex-shrink-0 w-80">
              <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-white text-2xl">☁️</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Cloud Computing</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Scalable cloud infrastructure ensuring high availability, data security, and global accessibility for all sustainability management operations.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-cyan-600 text-white rounded-full text-sm">Scalability</span>
                <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">High Availability</span>
                <span className="px-3 py-1 bg-cyan-600 text-white rounded-full text-sm">Global Access</span>
              </div>
              </div>

              {/* Advanced Analytics */}
              <div className="bg-gradient-to-br from-purple-700/60 to-pink-700/60 rounded-2xl p-8 border border-purple-600/40 hover:shadow-xl transition-all duration-300 flex-shrink-0 w-80">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-white text-2xl">📊</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Advanced Analytics</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Sophisticated data processing and visualization tools providing deep insights into sustainability metrics and performance indicators.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded-full text-sm">Data Visualization</span>
                <span className="px-3 py-1 bg-pink-600/30 text-pink-200 rounded-full text-sm">Performance Metrics</span>
                <span className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded-full text-sm">Deep Insights</span>
              </div>
              </div>

              {/* API Integration */}
              <div className="bg-gradient-to-br from-teal-700/60 to-emerald-700/60 rounded-2xl p-8 border border-teal-600/40 hover:shadow-xl transition-all duration-300 flex-shrink-0 w-80">
              <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-white text-2xl">🔗</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">API Integration</h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Seamless integration capabilities with existing enterprise systems, third-party services, and industry-standard sustainability frameworks.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-teal-600/30 text-teal-200 rounded-full text-sm">Enterprise Integration</span>
                <span className="px-3 py-1 bg-emerald-600/30 text-emerald-200 rounded-full text-sm">Third-party APIs</span>
                <span className="px-3 py-1 bg-teal-600/30 text-teal-200 rounded-full text-sm">Standards Compliance</span>
              </div>
              </div>

              {/* Duplicate set for seamless loop */}
              {/* Blockchain Technology */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200 hover:shadow-xl transition-all duration-300 flex-shrink-0 w-80">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-white text-2xl">⛓️</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Blockchain Technology</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Immutable ledger technology ensuring transparent, verifiable, and tamper-proof carbon credit transactions and sustainability data recording.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">Smart Contracts</span>
                  <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm">DMRV Compliance</span>
                  <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm">Transparency</span>
                </div>
              </div>

              {/* AI & Machine Learning */}
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8 border border-emerald-200 hover:shadow-xl transition-all duration-300 flex-shrink-0 w-80">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-white text-2xl">🤖</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">AI & Machine Learning</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Advanced algorithms for predictive analytics, pattern recognition, and automated decision-making in sustainability assessments and environmental monitoring.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm">Predictive Analytics</span>
                  <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm">Pattern Recognition</span>
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm">Automation</span>
                </div>
              </div>

              {/* Satellite & IoT Integration */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-200 hover:shadow-xl transition-all duration-300 flex-shrink-0 w-80">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-white text-2xl">🛰️</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Satellite & IoT Integration</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Real-time monitoring through satellite imagery and IoT sensors providing continuous data collection for accurate environmental impact assessment.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-orange-600 text-white rounded-full text-sm">Real-time Monitoring</span>
                  <span className="px-3 py-1 bg-red-600 text-white rounded-full text-sm">Satellite Imagery</span>
                  <span className="px-3 py-1 bg-orange-600 text-white rounded-full text-sm">IoT Sensors</span>
                </div>
              </div>

              {/* Cloud Computing */}
              <div className="bg-gradient-to-br from-cyan-700/60 to-blue-700/60 rounded-2xl p-8 border border-cyan-600/40 hover:shadow-xl transition-all duration-300 flex-shrink-0 w-80">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-white text-2xl">☁️</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Cloud Computing</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Scalable cloud infrastructure ensuring high availability, data security, and global accessibility for all sustainability management operations.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-cyan-600/30 text-cyan-200 rounded-full text-sm">Scalability</span>
                  <span className="px-3 py-1 bg-blue-600/30 text-blue-200 rounded-full text-sm">High Availability</span>
                  <span className="px-3 py-1 bg-cyan-600/30 text-cyan-200 rounded-full text-sm">Global Access</span>
                </div>
              </div>

              {/* Advanced Analytics */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 border border-purple-200 hover:shadow-xl transition-all duration-300 flex-shrink-0 w-80">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-white text-2xl">📊</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Advanced Analytics</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Sophisticated data processing and visualization tools providing deep insights into sustainability metrics and performance indicators.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm">Data Visualization</span>
                  <span className="px-3 py-1 bg-pink-600 text-white rounded-full text-sm">Performance Metrics</span>
                  <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm">Deep Insights</span>
                </div>
              </div>

              {/* API Integration */}
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-8 border border-teal-200 hover:shadow-xl transition-all duration-300 flex-shrink-0 w-80">
                <div className="w-16 h-16 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6">
                  <span className="text-white text-2xl">🔗</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">API Integration</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Seamless integration capabilities with existing enterprise systems, third-party services, and industry-standard sustainability frameworks.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-teal-600 text-white rounded-full text-sm">Enterprise Integration</span>
                  <span className="px-3 py-1 bg-emerald-600 text-white rounded-full text-sm">Third-party APIs</span>
                  <span className="px-3 py-1 bg-teal-600 text-white rounded-full text-sm">Standards Compliance</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* How Can We Help Section - Light */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-green-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">How Can We Help?</h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-xl md:text-2xl mb-8 leading-relaxed text-gray-600">
                Aurigraph Aurex is a pioneering climate-tech company at the forefront of
                <span className="font-bold text-green-600"> carbon and regenerative solutions</span>.
                We bridge the gap between environmental impact and technological innovation, creating pathways
                for organizations to achieve their Net Zero goals while fostering community development and ecosystem restoration.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-gray-200 hover:bg-white/90 transition-all duration-300 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">👥</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center text-gray-900">Expert Team</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Leading specialists in carbon markets and regenerative systems with decades of combined experience
                in climate science, blockchain technology, and sustainable agriculture.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-gray-200 hover:bg-white/90 transition-all duration-300 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center text-gray-900">Global Partnerships</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Collaborating with corporates, NGOs, and governments worldwide to scale climate solutions
                and create meaningful impact across diverse ecosystems and communities.
              </p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-8 border border-gray-200 hover:bg-white/90 transition-all duration-300 shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-center text-gray-900">Proven Impact</h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Delivering measurable results in climate action and sustainability with verified carbon reductions,
                ecosystem restoration, and community empowerment across multiple continents.
              </p>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">500+</div>
                <div className="text-gray-700 font-medium">Organizations Served</div>
                <div className="text-sm text-gray-500 mt-1">Across 50+ countries</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">50M+</div>
                <div className="text-gray-700 font-medium">Tons CO2e Tracked</div>
                <div className="text-sm text-gray-500 mt-1">Verified & monitored</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">95%</div>
                <div className="text-gray-700 font-medium">DMRV Compliance</div>
                <div className="text-sm text-gray-500 mt-1">Industry leading</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">24/7</div>
                <div className="text-gray-700 font-medium">Real-time Monitoring</div>
                <div className="text-sm text-gray-500 mt-1">Global coverage</div>
              </div>
            </div>
          </div>


        </div>
      </section>

      {/* Request for Consultation Section - Dark */}
      <section id="consultation" className="py-20 px-4 bg-gradient-to-br from-gray-700 to-slate-700 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Branding and Information */}
            <div>
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <AurexLogo size="custom" width={64} height={64} variant="white" />
                  <div>
                    <h1 className="text-2xl font-bold text-white">AUREX</h1>
                    <p className="text-sm text-gray-300">SUSTAINABILITY PLATFORM</p>
                    <p className="text-xs text-gray-400">by Aurigraph</p>
                  </div>
                </div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                  Ready to Transform Your Sustainability Journey?
                </h2>
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  Get expert consultation from our sustainability professionals. We'll help you navigate the path to net-zero with customized solutions for your organization.
                </p>
              </div>

              {/* Benefits */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">🎯</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Customized Strategy</h3>
                    <p className="text-gray-300">Tailored sustainability roadmap based on your industry, size, and specific goals.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">👥</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Expert Team</h3>
                    <p className="text-gray-300">Work with certified sustainability professionals and technology specialists.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">📈</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Proven Results</h3>
                    <p className="text-gray-300">Join 500+ organizations that have successfully achieved their sustainability goals with Aurex.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xl">🚀</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Fast Implementation</h3>
                    <p className="text-gray-300">Get started quickly with our streamlined onboarding and implementation process.</p>
                  </div>
                </div>
              </div>

              {/* Trust indicators */}
              <div className="mt-12 pt-8 border-t border-gray-600">
                <p className="text-gray-400 text-sm mb-4">Trusted by leading organizations worldwide</p>
                <div className="flex flex-wrap gap-4 text-gray-300 text-sm">
                  <span className="bg-gray-600/50 px-3 py-1 rounded-full">Fortune 500 Companies</span>
                  <span className="bg-gray-600/50 px-3 py-1 rounded-full">Government Agencies</span>
                  <span className="bg-gray-600/50 px-3 py-1 rounded-full">NGOs & Non-profits</span>
                  <span className="bg-gray-600/50 px-3 py-1 rounded-full">Agricultural Enterprises</span>
                </div>
              </div>
            </div>

            {/* Right side - Consultation Form */}
            <div>
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <ConsultationForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Voices from the Field Section - Light */}
      <section className="py-20 px-4 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">Voices from the Field</h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-5xl mx-auto leading-relaxed">
              Real stories from farmers and communities who are leading the charge in regenerative agriculture and climate action across India.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 - Prakash Sharma */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-green-100 hover:shadow-xl transition-all duration-300">
              <div className="mb-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
                <blockquote className="text-gray-700 text-lg leading-relaxed mb-6">
                  "The agroforestry program has transformed my farm. Not only am I earning from carbon credits, but my soil health has improved dramatically. My children now have a sustainable future."
                </blockquote>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-bold">PS</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Prakash Sharma</div>
                    <div className="text-sm text-gray-600">Satara, Maharashtra</div>
                    <div className="text-sm text-green-600 font-medium">Agroforestry Beneficiary</div>
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-800 mb-1">Impact</div>
                  <div className="text-green-700 font-bold">₹45,000 additional annual income</div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 - Meera Patel */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300">
              <div className="mb-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
                <blockquote className="text-gray-700 text-lg leading-relaxed mb-6">
                  "The alternate wetting and drying method has reduced my water usage by 30% while maintaining the same rice yield. The mobile app makes monitoring so easy."
                </blockquote>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-bold">MP</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Meera Patel</div>
                    <div className="text-sm text-gray-600">Anand, Gujarat</div>
                    <div className="text-sm text-blue-600 font-medium">AWD Program Participant</div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-800 mb-1">Impact</div>
                  <div className="text-blue-700 font-bold">30% water savings, 25% emission reduction</div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 - Ravi Kumar */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-emerald-100 hover:shadow-xl transition-all duration-300 md:col-span-2 lg:col-span-1">
              <div className="mb-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
                <blockquote className="text-gray-700 text-lg leading-relaxed mb-6">
                  "Working with Aurigraph has opened new opportunities for our farming community. The training and support they provide has helped us implement sustainable practices profitably."
                </blockquote>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg font-bold">RK</span>
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Ravi Kumar</div>
                    <div className="text-sm text-gray-600">Mysore, Karnataka</div>
                    <div className="text-sm text-emerald-600 font-medium">Soil Carbon Project</div>
                  </div>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4">
                  <div className="text-sm font-medium text-emerald-800 mb-1">Impact</div>
                  <div className="text-emerald-700 font-bold">2.5 tCO₂/hectare sequestered annually</div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-green-200 max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Join the Movement</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Be part of India's largest regenerative agriculture network. Connect with thousands of farmers who are transforming their land while fighting climate change.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="#platform"
                  className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
                >
                  Explore Our Platforms
                </a>
                <a
                  href="#consultation"
                  className="bg-white text-green-600 px-8 py-3 rounded-lg font-medium border border-green-600 hover:bg-green-50 transition-colors"
                >
                  Request Consultation
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-16 px-4 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="relative">
              <div className="absolute inset-0 opacity-20 rounded-lg overflow-hidden">
                <img src="/images/forest-background.svg" alt="Forest Background" className="w-full h-full object-cover" />
              </div>
              <div className="relative z-10 p-4">
                <div className="flex items-center gap-2 mb-6">
                  🌱
                  <span className="font-bold text-xl">Aurex Platform</span>
                </div>

              {/* Contact Information */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📞</span>
                  <div>
                    <div className="text-sm font-medium text-white">Phone</div>
                    <a
                      href="tel:+919945103337"
                      className="text-gray-400 hover:text-green-400 transition-colors"
                    >
                      +91 9945103337
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-lg">📧</span>
                  <div>
                    <div className="text-sm font-medium text-white">Email</div>
                    <a
                      href="mailto:contact@aurigraph.com?subject=Aurex Platform Inquiry&body=Hello Aurigraph Team,%0D%0A%0D%0AI'm interested in learning more about the Aurex sustainability platform. Please provide information about:%0D%0A%0D%0A- Platform capabilities%0D%0A- Implementation process%0D%0A- Pricing and packages%0D%0A- Next steps%0D%0A%0D%0AThank you!"
                      className="text-gray-400 hover:text-green-400 transition-colors"
                    >
                      contact@aurigraph.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-lg">📍</span>
                  <div>
                    <div className="text-sm font-medium text-white">Address</div>
                    <div className="text-gray-400">4005 36th St., Mount Rainier, MD 20712 USA</div>
                  </div>
                </div>
              </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Applications</h4>
              <ul className="space-y-2">
                <li><Link to="/launchpad" className="text-gray-400 hover:text-white transition-colors">Aurex Launchpad</Link></li>
                <li><Link to="/hydropulse" className="text-gray-400 hover:text-white transition-colors">Hydropulse AWD</Link></li>
                <li><Link to="/carbon-trace" className="text-gray-400 hover:text-white transition-colors">Carbon Trace</Link></li>
                <li><Link to="/sylvagraph" className="text-gray-400 hover:text-white transition-colors">Sylvagraph</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#platform" className="text-gray-400 hover:text-white transition-colors">Platform Overview</a></li>
                <li><a href="#consultation" className="text-gray-400 hover:text-white transition-colors">Request Consultation</a></li>
                <li><a href="mailto:contact@aurigraph.com?subject=Aurex Platform Inquiry&body=Hello Aurigraph Team,%0D%0A%0D%0AI'm interested in learning more about the Aurex sustainability platform. Please provide information about:%0D%0A%0D%0A- Platform capabilities%0D%0A- Implementation process%0D%0A- Pricing and packages%0D%0A- Next steps%0D%0A%0D%0AThank you!" className="text-gray-400 hover:text-white transition-colors">Contact Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 Aurigraph DLT Corp. All rights reserved. |
              <span className="ml-2">4005 36th St., Mount Rainier, MD 20712 USA</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
