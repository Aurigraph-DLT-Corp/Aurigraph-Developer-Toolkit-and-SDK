import { Link } from "react-router-dom";
import {
  Droplets,
  Leaf,
  TrendingUp,
  Users,
  Play,
  CheckCircle,
  ArrowRight,
  Phone,
  MessageCircle,
  Download,
  Star,
  BarChart3,
  Shield,
  Award,
  Globe
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "../contexts/AuthContext";
import UniversalAuth from "../components/auth/UniversalAuth";
import { useState } from "react";

const Hydropulse = () => {
  const { user, isAuthenticated, login, isLoading, hasRole } = useAuth();
  const [accessRequestForm, setAccessRequestForm] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    role: '',
    location: '',
    farmSize: '',
    message: ''
  });

  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      // Use the existing Keycloak login but with credentials
      // This will authenticate in the background without redirecting
      sessionStorage.setItem('aurex_return_path', '/hydropulse');
      await login(window.location.origin + '/hydropulse');
    } catch (error) {
      setLoginError('Invalid username or password. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleForgotPassword = (email?: string) => {
    // Enhanced forgot password flow with email validation
    const keycloakUrl = 'http://localhost:8080'; // Update this to match your Keycloak URL
    const realmName = 'aurex-platform';
    const clientId = 'aurex-platform-app'; // Update this to match your client ID

    // Build reset URL with optional email parameter
    let resetUrl = `${keycloakUrl}/realms/${realmName}/login-actions/reset-credentials?client_id=${clientId}&tab_id=1`;

    // Add email parameter if provided
    if (email && email.trim()) {
      resetUrl += `&username=${encodeURIComponent(email.trim())}`;
    }

    // Store return URL for after password reset
    sessionStorage.setItem('aurex_return_path', '/hydropulse');
    sessionStorage.setItem('aurex_reset_initiated', 'true');

    // Open in same window to maintain user flow
    window.location.href = resetUrl;
  };

  const handleForgotPasswordWithEmail = () => {
    // Validate email format before proceeding
    const email = loginForm.username;

    if (!email || !email.trim()) {
      setLoginError('Please enter your email address first');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLoginError('Please enter a valid email address');
      return;
    }

    // Clear any previous errors
    setLoginError('');

    // Proceed with password reset
    handleForgotPassword(email);
  };

  const handleAccessRequest = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    const emailBody = `
Hello HydroPulse Admin,

I would like to request access to HydroPulse.

Name: ${accessRequestForm.name}
Email: ${accessRequestForm.email}
Phone: ${accessRequestForm.phone}
Organization: ${accessRequestForm.organization}
Role: ${accessRequestForm.role}
Location: ${accessRequestForm.location}
Farm Size: ${accessRequestForm.farmSize}

Message: ${accessRequestForm.message}

Please review my application and provide login credentials.

Thank you!
    `.trim();

    const mailtoLink = `mailto:admin@aurigraph.io?subject=HydroPulse Access Request - ${accessRequestForm.name}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoLink);
  };

  const HydropulseContent = () => (
    <div className="min-h-screen bg-gray-50">
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
            <div className="flex items-center gap-2 font-bold text-xl text-blue-600">
              <Droplets className="h-8 w-8" />
              Aurex HydroPulse
            </div>
            {/* Authentication Section */}
            <UniversalAuth variant="header" showUserInfo={true} />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-white/20 text-white border-white/30">
            🌾 Sustainable Rice Farming Platform
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Transform Rice Farming with
            <span className="block text-yellow-300">Alternate Wetting & Drying</span>
          </h1>
          <p className="text-xl mb-8 max-w-4xl mx-auto opacity-90">
            Join thousands of farmers using HydroPulse to reduce water usage by 30%,
            cut methane emissions by 50%, and earn carbon credits while maintaining yields.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            {isAuthenticated ? (
              <>
                <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Access Dashboard
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  <Globe className="mr-2 h-5 w-5" />
                  View Farm Analytics
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                  onClick={() => {
                    document.getElementById('access-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Get Started Today
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => {
                    document.getElementById('what-is-awd')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Learn About AWD
                </Button>
              </>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300">2,500+</div>
              <div className="text-sm opacity-80">Farmers Onboarded</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300">15,000</div>
              <div className="text-sm opacity-80">Hectares Under AWD</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300">30%</div>
              <div className="text-sm opacity-80">Water Savings</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-300">50,000</div>
              <div className="text-sm opacity-80">Carbon Credits Generated</div>
            </div>
          </div>
        </div>
      </section>

      {/* Login / Access Section */}
      <section id="access-section" className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Join HydroPulse?</h2>
            <p className="text-xl text-gray-600">
              Choose your path to get started with sustainable rice farming
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Existing Users */}
            <Card className="border-2 border-blue-200">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Existing User?</CardTitle>
                <p className="text-gray-600">Sign in to access your dashboard</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      placeholder="Email or Username"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      type="password"
                      placeholder="Password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      required
                    />
                  </div>
                  {loginError && (
                    <p className="text-sm text-red-600 text-center">{loginError}</p>
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loginLoading}
                  >
                    {loginLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleForgotPasswordWithEmail}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
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
                <p className="text-xs text-gray-500 text-center mt-4">
                  Secure authentication via Aurex IAM
                </p>
              </CardContent>
            </Card>

            {/* New Users */}
            <Card className="border-2 border-green-200">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ArrowRight className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">New to HydroPulse?</CardTitle>
                <p className="text-gray-600">Request access from our admin team</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAccessRequest} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Full Name"
                      value={accessRequestForm.name}
                      onChange={(e) => setAccessRequestForm({...accessRequestForm, name: e.target.value})}
                      required
                    />
                    <Input
                      type="email"
                      placeholder="Email"
                      value={accessRequestForm.email}
                      onChange={(e) => setAccessRequestForm({...accessRequestForm, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Phone"
                      value={accessRequestForm.phone}
                      onChange={(e) => setAccessRequestForm({...accessRequestForm, phone: e.target.value})}
                    />
                    <Input
                      placeholder="Organization"
                      value={accessRequestForm.organization}
                      onChange={(e) => setAccessRequestForm({...accessRequestForm, organization: e.target.value})}
                    />
                  </div>
                  <Select onValueChange={(value) => setAccessRequestForm({...accessRequestForm, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="farmer">Farmer</SelectItem>
                      <SelectItem value="agency">Partner Agency</SelectItem>
                      <SelectItem value="vvb">Validation Body (VVB)</SelectItem>
                      <SelectItem value="internal">Aurex Internal Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Location"
                      value={accessRequestForm.location}
                      onChange={(e) => setAccessRequestForm({...accessRequestForm, location: e.target.value})}
                    />
                    <Input
                      placeholder="Farm Size (hectares)"
                      value={accessRequestForm.farmSize}
                      onChange={(e) => setAccessRequestForm({...accessRequestForm, farmSize: e.target.value})}
                    />
                  </div>
                  <Textarea
                    placeholder="Additional message (optional)"
                    value={accessRequestForm.message}
                    onChange={(e) => setAccessRequestForm({...accessRequestForm, message: e.target.value})}
                    rows={3}
                  />
                  <Button type="submit" className="w-full" size="lg">
                    Request Access
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What is AWD Section */}
      <section id="what-is-awd" className="py-16 px-4 bg-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What is Alternate Wetting & Drying?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AWD is a revolutionary water management technique that reduces water usage
              while maintaining rice yields and generating carbon credits.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Traditional Flooding vs AWD</h3>
                  <p className="text-gray-600">
                    Unlike continuous flooding, AWD alternates between wet and dry periods,
                    reducing water usage by up to 30% without affecting yield.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Environmental Benefits</h3>
                  <p className="text-gray-600">
                    AWD reduces methane emissions by 50%, contributing to climate change
                    mitigation while earning carbon credits for farmers.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Economic Advantages</h3>
                  <p className="text-gray-600">
                    Lower water costs, reduced labor, and additional income from
                    carbon credits make AWD economically attractive.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Join HydroPulse Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Join HydroPulse?</h2>
            <p className="text-xl text-gray-600">
              Discover the benefits that thousands of farmers are already experiencing
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <Card className="text-center border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <CardHeader>
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Droplets className="h-10 w-10 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Water Savings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 mb-2">30%</div>
                <p className="text-gray-600">
                  Reduce water consumption while maintaining optimal rice yields through smart irrigation management.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-green-100 hover:border-green-300 transition-colors">
              <CardHeader>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="h-10 w-10 text-green-600" />
                </div>
                <CardTitle className="text-xl">Emission Reduction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600 mb-2">50%</div>
                <p className="text-gray-600">
                  Cut methane emissions significantly, contributing to global climate change mitigation efforts.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-2 border-yellow-100 hover:border-yellow-300 transition-colors">
              <CardHeader>
                <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-10 w-10 text-yellow-600" />
                </div>
                <CardTitle className="text-xl">Carbon Credits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600 mb-2">₹15K+</div>
                <p className="text-gray-600">
                  Generate additional income through verified carbon credit sales and sustainability incentives.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Benefits */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">For Farmers</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Reduced water and labor costs</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Additional income from carbon credits</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Technical support and training</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Digital monitoring tools</span>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">For Partners</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span>Scalable farmer onboarding platform</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span>Real-time monitoring and verification</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span>Comprehensive reporting tools</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span>Revenue sharing opportunities</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Dashboard Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600 to-green-600 text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Real-Time Impact Dashboard</h2>
            <p className="text-xl opacity-90">
              See the collective impact of our HydroPulse community
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-300 mb-2">2,547</div>
              <div className="text-lg font-semibold mb-1">Farmers Onboarded</div>
              <div className="text-sm opacity-80">Across 12 states</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-300 mb-2">15,234</div>
              <div className="text-lg font-semibold mb-1">Hectares Under AWD</div>
              <div className="text-sm opacity-80">And growing daily</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-300 mb-2">52,891</div>
              <div className="text-lg font-semibold mb-1">Carbon Credits Generated</div>
              <div className="text-sm opacity-80">Verified & traded</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-300 mb-2">₹1.2Cr</div>
              <div className="text-lg font-semibold mb-1">Farmer Incentives Paid</div>
              <div className="text-sm opacity-80">Direct to bank accounts</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">
              Simple steps to join the sustainable rice farming revolution
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Registration</h3>
              <p className="text-gray-600 mb-4">
                Sign up through our platform or partner agencies. Get verified and receive training materials.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div>• Complete farmer profile</div>
                <div>• Field verification</div>
                <div>• Training completion</div>
              </div>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Implementation</h3>
              <p className="text-gray-600 mb-4">
                Install monitoring equipment and begin AWD practices with technical support.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div>• IoT sensor installation</div>
                <div>• AWD cycle training</div>
                <div>• Mobile app setup</div>
              </div>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Monitoring</h3>
              <p className="text-gray-600 mb-4">
                Track water levels, emissions, and yield data through our digital platform.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div>• Real-time monitoring</div>
                <div>• Data verification</div>
                <div>• Progress tracking</div>
              </div>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white font-bold text-2xl">
                4
              </div>
              <h3 className="text-xl font-semibold mb-4">Incentives</h3>
              <p className="text-gray-600 mb-4">
                Receive payments for water savings, carbon credits, and sustainability achievements.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div>• Carbon credit sales</div>
                <div>• Performance bonuses</div>
                <div>• Direct bank transfer</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Farmer Testimonials Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Farmer Success Stories</h2>
            <p className="text-xl text-gray-600">
              Hear from farmers who are already benefiting from HydroPulse
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-gray-100">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Rajesh Kumar</h4>
                    <p className="text-sm text-gray-600">Punjab • 5 hectares</p>
                  </div>
                </div>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 italic">
                  "HydroPulse helped me save 40% on water costs while earning ₹25,000
                  extra from carbon credits. The technical support is excellent!"
                </p>
                <div className="mt-4 text-sm text-green-600 font-semibold">
                  Saved: ₹45,000 annually
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Priya Sharma</h4>
                    <p className="text-sm text-gray-600">Haryana • 3 hectares</p>
                  </div>
                </div>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 italic">
                  "The mobile app makes monitoring so easy. I can track everything
                  from my phone and the yields are actually better than before!"
                </p>
                <div className="mt-4 text-sm text-green-600 font-semibold">
                  Yield increase: 12%
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Suresh Patel</h4>
                    <p className="text-sm text-gray-600">Gujarat • 8 hectares</p>
                  </div>
                </div>
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 italic">
                  "Best decision I made for my farm. Lower costs, better environment,
                  and additional income. My family is very happy with the results."
                </p>
                <div className="mt-4 text-sm text-green-600 font-semibold">
                  Total benefit: ₹1.2L annually
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="relative">
              <div className="relative z-10 p-4">
                <div className="flex items-center gap-2 mb-6">
                  <Droplets className="h-8 w-8 text-blue-400" />
                  <span className="font-bold text-xl">Aurex Platform</span>
                </div>
                <p className="text-gray-400 mb-6">
                  Leading DMRV compliant carbon accounting solutions for a sustainable future.
                </p>
                <div className="flex gap-4">
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <Globe className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <MessageCircle className="h-5 w-5" />
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    <Phone className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><a href="/launchpad" className="text-gray-400 hover:text-white transition-colors">Launchpad</a></li>
                <li><a href="/hydropulse" className="text-gray-400 hover:text-white transition-colors">HydroPulse</a></li>
                <li><a href="/sylvagraph" className="text-gray-400 hover:text-white transition-colors">SylvaGraph</a></li>
                <li><a href="/carbontrace" className="text-gray-400 hover:text-white transition-colors">CarbonTrace</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Solutions</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Carbon Accounting</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">ESG Reporting</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Sustainability Analytics</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">DMRV Compliance</a></li>
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

  return <HydropulseContent />;
};

export default Hydropulse;
