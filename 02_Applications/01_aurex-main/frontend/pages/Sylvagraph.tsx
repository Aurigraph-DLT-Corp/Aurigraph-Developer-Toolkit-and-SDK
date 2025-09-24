import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TreePine,
  Satellite,
  Users,
  Shield,
  CheckCircle,
  Eye,
  EyeOff,
  Building,
  Sprout,
  Globe,
  Camera,
  Plane
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import UniversalAuth from '../components/auth/UniversalAuth';

const Sylvagraph: React.FC = () => {
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Stats animation
  const [stats, setStats] = useState({
    saplings: 0,
    hectares: 0,
    co2: 0,
    biodiversity: 0
  });

  useEffect(() => {
    // Animate stats on page load
    const targetStats = {
      saplings: 2500000,
      hectares: 15000,
      co2: 125000,
      biodiversity: 85
    };

    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;

      setStats({
        saplings: Math.floor(targetStats.saplings * progress),
        hectares: Math.floor(targetStats.hectares * progress),
        co2: Math.floor(targetStats.co2 * progress),
        biodiversity: Math.floor(targetStats.biodiversity * progress)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setStats(targetStats);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginForm.username || !loginForm.password) {
      setLoginError('Please enter both username and password');
      return;
    }

    // Redirect to Keycloak for Sylvagraph realm
    const keycloakUrl = 'http://localhost:8080';
    const realmName = 'Aurex-Sylvagraph';
    const clientId = 'aurex-sylvagraph-app';
    const redirectUri = encodeURIComponent(window.location.origin + '/sylvagraph');

    const loginUrl = `${keycloakUrl}/realms/${realmName}/protocol/openid-connect/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid`;

    window.location.href = loginUrl;
  };

  const handleForgotPasswordWithEmail = () => {
    const email = loginForm.username;

    if (!email || !email.trim()) {
      setLoginError('Please enter your email address first');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLoginError('Please enter a valid email address');
      return;
    }

    setLoginError('');

    const keycloakUrl = 'http://localhost:8080';
    const realmName = 'Aurex-Sylvagraph';
    const clientId = 'aurex-sylvagraph-app';
    let resetUrl = `${keycloakUrl}/realms/${realmName}/login-actions/reset-credentials?client_id=${clientId}&tab_id=1`;

    if (email && email.trim()) {
      resetUrl += `&username=${encodeURIComponent(email.trim())}`;
    }

    sessionStorage.setItem('aurex_return_path', '/sylvagraph');
    sessionStorage.setItem('aurex_reset_initiated', 'true');

    window.location.href = resetUrl;
  };

  const handleRequestAccess = () => {
    window.open('mailto:admin@sylvagraph.com?subject=Sylvagraph Access Request&body=Please provide your role (Farmer, Partner Org, Government Agency, etc.) and reason for access.', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Navigation */}
      <nav className="border-b bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              ← Back to Platform
            </Link>
            <div className="flex items-center gap-2 font-bold text-xl text-green-600">
              <TreePine className="h-8 w-8" />
              Aurex Sylvagraph
            </div>
            <UniversalAuth variant="header" showUserInfo={true} />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <TreePine className="h-12 w-12 text-green-200" />
              <h1 className="text-5xl font-bold">Sylvagraph</h1>
            </div>
            <p className="text-xl mb-8 text-green-100">
              DMRV-Compliant Agroforestry Platform
            </p>
            <p className="text-lg mb-10 max-w-3xl mx-auto leading-relaxed">
              Leverage drones, satellites, and Aurex DLT tokenization to create verifiable carbon credits
              through measurable agroforestry projects. Join farmers, NGOs, and agencies in restoring
              ecosystems while generating sustainable income.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-green-600 hover:bg-green-50">
                <Sprout className="mr-2 h-5 w-5" />
                Join Sylvagraph
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Camera className="mr-2 h-5 w-5" />
                Watch DMRV Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Login Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card className="border-2 border-green-200">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-green-800">Access Sylvagraph</CardTitle>
                <p className="text-gray-600">Login to your DMRV dashboard</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                      className="w-full"
                    />
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      className="w-full pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {loginError && (
                    <div className="text-red-600 text-sm text-center">
                      {loginError}
                    </div>
                  )}

                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                    <TreePine className="mr-2 h-4 w-4" />
                    Login to Sylvagraph
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleForgotPasswordWithEmail}
                      className="text-sm text-green-600 hover:text-green-800 underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="text-center mt-2">
                    <p className="text-xs text-gray-500">
                      Enter your email above, then click "Forgot Password?" to receive a reset link
                    </p>
                  </div>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3">
                      New to Sylvagraph? Request access:
                    </p>
                    <Button
                      onClick={handleRequestAccess}
                      variant="outline"
                      className="w-full border-green-600 text-green-600 hover:bg-green-50"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Request Access
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Available for Farmers, NGOs, Government Agencies, and VVBs
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Dashboard */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Live Impact Dashboard</h2>
            <p className="text-green-100 max-w-2xl mx-auto">
              Real-time metrics from our DMRV-compliant agroforestry projects worldwide
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{stats.saplings.toLocaleString()}</div>
              <div className="text-green-200">Saplings Planted</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{stats.hectares.toLocaleString()}</div>
              <div className="text-green-200">Hectares Restored</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{stats.co2.toLocaleString()}</div>
              <div className="text-green-200">Tons CO₂ Sequestered</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{stats.biodiversity}%</div>
              <div className="text-green-200">Biodiversity Increase</div>
            </div>
          </div>
        </div>
      </section>

      {/* DMRV Technology */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">DMRV Technology Stack</h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              Advanced monitoring and verification technology ensuring transparent, verifiable carbon credit generation
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-green-200 hover:border-green-400 transition-colors">
              <CardHeader className="text-center">
                <Plane className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-green-800">Drone Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Automated drone flights capture high-resolution imagery for plantation survival tracking,
                  canopy cover analysis, and biomass estimation.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 hover:border-green-400 transition-colors">
              <CardHeader className="text-center">
                <Satellite className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-green-800">Satellite Data</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Multi-spectral satellite imagery provides NDVI analysis, deforestation alerts,
                  and large-scale vegetation monitoring for comprehensive coverage.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 hover:border-green-400 transition-colors">
              <CardHeader className="text-center">
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle className="text-green-800">Blockchain Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-center">
                  Aurex DLT tokenization creates immutable carbon credit records, ensuring transparency
                  and preventing double-counting in carbon markets.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Join the Agroforestry Revolution</h2>
          <p className="text-green-100 mb-8 max-w-2xl mx-auto">
            Whether you're a farmer, NGO, government agency, or private company,
            Sylvagraph provides the tools to create measurable environmental impact.
          </p>

          <div className="grid md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Button className="bg-white text-green-600 hover:bg-green-50">
              <Sprout className="mr-2 h-4 w-4" />
              Join as Farmer
            </Button>
            <Button className="bg-white text-green-600 hover:bg-green-50">
              <Users className="mr-2 h-4 w-4" />
              Partner NGO
            </Button>
            <Button className="bg-white text-green-600 hover:bg-green-50">
              <Building className="mr-2 h-4 w-4" />
              Government Agency
            </Button>
            <Button className="bg-white text-green-600 hover:bg-green-50">
              <Globe className="mr-2 h-4 w-4" />
              Validation Body
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TreePine className="h-6 w-6 text-green-400" />
                <span className="text-xl font-bold">Sylvagraph</span>
              </div>
              <p className="text-gray-400">
                DMRV-compliant agroforestry platform creating verifiable carbon credits through
                advanced monitoring technology.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/sylvagraph" className="hover:text-white">Dashboard</Link></li>
                <li><Link to="/about" className="hover:text-white">About DMRV</Link></li>
                <li><Link to="/technology" className="hover:text-white">Technology</Link></li>
                <li><Link to="/impact" className="hover:text-white">Impact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link to="/documentation" className="hover:text-white">Documentation</Link></li>
                <li><Link to="/api" className="hover:text-white">API</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-400">
                <p>Email: support@sylvagraph.com</p>
                <p>Phone: +1 (555) 123-4567</p>
                <p>Address: 4005 36th St., Mount Rainier, MD 20712</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Aurigraph DLT Corp. All rights reserved. | Sylvagraph DMRV Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Sylvagraph;
