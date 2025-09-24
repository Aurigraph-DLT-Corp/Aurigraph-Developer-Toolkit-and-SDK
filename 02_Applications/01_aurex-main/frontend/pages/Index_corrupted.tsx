import { Link } from "react-router-dom";
import ConsultationForm from '@/components/ConsultationForm';
import AurexLogo from '@/components/ui/AurexLogo';
import UniversalAuth from '../components/auth/UniversalAuth';
import { useAuth } from '../contexts/AuthContext';

// Safe authentication component that handles missing auth context
const SafeAuthComponent = () => {
  try {
    return <UniversalAuth variant="header" showUserInfo={true} />;
  } catch (error) {
    // If auth context is not available, show a simple login placeholder
    return (
      <button className="text-gray-700 hover:text-green-600 font-medium transition-colors">
        Sign In
      </button>
    );
  }
};

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
              <SafeAuthComponent />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Light */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-green-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 leading-tight">
              Aurigraph
              <span className="block text-green-600">Aurex Platform</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-4xl mx-auto">
              Comprehensive DMRV-compliant platform for carbon accounting, ESG assessment,
              and regenerative agriculture solutions. Transform your sustainability journey
              with blockchain-verified carbon credits and real-time monitoring.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/launchpad"
                className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg"
              >
                Start Assessment
              </Link>
              <Link
                to="/contact"
                className="border-2 border-green-600 text-green-600 px-8 py-4 rounded-lg font-semibold hover:bg-green-600 hover:text-white transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Applications */}
      <section id="platform" className="py-20 px-4 bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-gray-900">Our Platform Applications</h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              Four specialized applications working together to provide comprehensive sustainability solutions
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Aurex Launchpad™ */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl">🚀</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Aurex Launchpad™</h3>
                <p className="text-green-600 font-medium text-sm">Gateway to Net-Zero</p>
              </div>
              <p className="text-gray-600 mb-4 text-sm">
                Comprehensive ESG assessment and sustainability management platform.
              </p>
              <Link
                to="/launchpad"
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm text-center block"
              >
                Start Assessment
              </Link>
            </div>

            {/* Aurex HydroPulse™ */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl">💧</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Aurex HydroPulse™</h3>
                <p className="text-blue-600 font-medium text-sm">Smart Water Management</p>
              </div>
              <p className="text-gray-600 mb-4 text-sm">
                Revolutionary AWD platform for intelligent water management and carbon credits.
              </p>
              <Link
                to="/hydropulse"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm text-center block"
              >
                Discover Innovation
              </Link>
            </div>

            {/* Aurex SylvaGraph™ */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl">🌳</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Aurex SylvaGraph™</h3>
                <p className="text-purple-600 font-medium text-sm">Agroforestry Platform</p>
              </div>
              <p className="text-gray-600 mb-4 text-sm">
                DMRV-compliant agroforestry platform using drones and blockchain technology.
              </p>
              <Link
                to="/sylvagraph"
                className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm text-center block"
              >
                Join Agroforestry
              </Link>
            </div>

            {/* Aurex CarbonTrace™ */}
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-center mb-4">
                <div className="w-16 h-16 mx-auto mb-3 bg-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl">🌍</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Aurex CarbonTrace™</h3>
                <p className="text-emerald-600 font-medium text-sm">Carbon Excellence</p>
              </div>
              <p className="text-gray-600 mb-4 text-sm">
                Next-generation carbon credit marketplace powered by blockchain technology.
              </p>
              <Link
                to="/carbontrace"
                className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors text-sm text-center block"
              >
                Explore Markets
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Consultation Section */}
      <section id="consultation" className="py-20 px-4 bg-gradient-to-br from-gray-700 to-slate-700 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left side - Information */}
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

      {/* Footer */}
      <footer className="py-16 px-4 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="relative">
              <div className="flex items-center gap-2 mb-6">
                🌱
                <span className="font-bold text-xl">Aurex Platform</span>
              </div>
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
                      href="mailto:contact@aurigraph.com"
                      className="text-gray-400 hover:text-green-400 transition-colors"
                    >
                      contact@aurigraph.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Applications</h4>
              <ul className="space-y-2">
                <li><Link to="/launchpad" className="text-gray-400 hover:text-white transition-colors">Aurex Launchpad</Link></li>
                <li><Link to="/hydropulse" className="text-gray-400 hover:text-white transition-colors">Hydropulse AWD</Link></li>
                <li><Link to="/carbontrace" className="text-gray-400 hover:text-white transition-colors">Carbon Trace</Link></li>
                <li><Link to="/sylvagraph" className="text-gray-400 hover:text-white transition-colors">Sylvagraph</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#platform" className="text-gray-400 hover:text-white transition-colors">Platform Overview</a></li>
                <li><a href="#consultation" className="text-gray-400 hover:text-white transition-colors">Request Consultation</a></li>
                <li><a href="mailto:contact@aurigraph.com" className="text-gray-400 hover:text-white transition-colors">Contact Support</a></li>
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
