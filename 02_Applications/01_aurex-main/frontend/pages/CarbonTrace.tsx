import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Leaf, Shield, TrendingUp, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import UniversalAuth from "../components/auth/UniversalAuth";

const CarbonTrace = () => {
  const { user, isAuthenticated, login, isLoading, hasRole } = useAuth();

  const CarbonTraceContent = () => (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card shadow-soft">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Button variant="ghost" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Platform
              </Link>
            </Button>
            <div className="flex items-center gap-2 font-bold text-xl text-green-600">
              <Leaf className="h-8 w-8" />
              Aurex Carbon Trace
            </div>
            {/* Authentication Section */}
            <UniversalAuth variant="header" showUserInfo={true} />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Aurex Carbon Trace
          </h1>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Blockchain Carbon Credit Marketplace
          </p>
          <p className="text-lg mb-8 max-w-4xl mx-auto opacity-90">
            Trade verified carbon credits with complete transparency and traceability.
            Our blockchain-based platform ensures authenticity and prevents double counting.
          </p>
          {isAuthenticated ? (
            /* Authenticated User - Show Role-Based Actions */
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {hasRole('accountant', 'aurex-carbontrace') && (
                <Button size="lg" variant="secondary">
                  Carbon Accounting Dashboard
                </Button>
              )}
              {hasRole('analyst', 'aurex-carbontrace') && (
                <Button size="lg" variant="secondary">
                  Analytics & Reporting
                </Button>
              )}
              {hasRole('compliance-officer', 'aurex-carbontrace') && (
                <Button size="lg" variant="secondary">
                  Compliance Management
                </Button>
              )}
              {hasRole('reporter', 'aurex-carbontrace') && (
                <Button size="lg" variant="secondary">
                  Reporting Tools
                </Button>
              )}
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                View All Features
              </Button>
            </div>
          ) : (
            /* Non-Authenticated User - Show Sign In */
            <div className="max-w-md mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold mb-4">Access Required</h3>
                <p className="text-green-100 mb-6">
                  CarbonTrace access is configured by Aurigraph administrators. Contact us to get your credentials.
                </p>
                <div className="space-y-4">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full"
                    onClick={() => {
                      sessionStorage.setItem('aurex_return_path', '/carbontrace');
                      login(window.location.origin + '/carbontrace');
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : 'Sign In with Credentials'}
                  </Button>
                  <a
                    href="mailto:admin@aurigraph.io?subject=CarbonTrace Access Request&body=Hello Aurigraph Team,%0D%0A%0D%0AI would like to request access to CarbonTrace.%0D%0A%0D%0AOrganization: [Your Organization]%0D%0AName: [Your Full Name]%0D%0AEmail: [Your Email]%0D%0ARole: [Accountant/Analyst/Compliance Officer/Reporter]%0D%0A%0D%0APlease provide me with login credentials.%0D%0A%0D%0AThank you!"
                    className="block w-full"
                  >
                    <Button
                      size="lg"
                      variant="outline"
                      className="w-full border-white text-white hover:bg-white hover:text-green-600"
                    >
                      Request Access Credentials
                    </Button>
                  </a>
                </div>
                <p className="text-xs text-green-200 mt-4">
                  Admin-configured access • Contact admin@aurigraph.io
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Platform Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Verified Credits</CardTitle>
                <CardDescription>Blockchain-verified authenticity</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  All carbon credits are verified through our blockchain system,
                  ensuring authenticity and preventing fraud.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Real-time Trading</CardTitle>
                <CardDescription>Live marketplace dynamics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Trade carbon credits in real-time with transparent pricing
                  and instant settlement through smart contracts.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-12 w-12 text-green-600 mb-4" />
                <CardTitle>Impact Tracking</CardTitle>
                <CardDescription>Measurable environmental impact</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track the real-world environmental impact of your carbon
                  credit purchases with detailed reporting.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                1
              </div>
              <h3 className="font-semibold mb-2">Project Verification</h3>
              <p className="text-sm text-muted-foreground">
                Carbon reduction projects undergo rigorous third-party verification
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                2
              </div>
              <h3 className="font-semibold mb-2">Credit Tokenization</h3>
              <p className="text-sm text-muted-foreground">
                Verified credits are tokenized on the blockchain for transparency
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                3
              </div>
              <h3 className="font-semibold mb-2">Marketplace Trading</h3>
              <p className="text-sm text-muted-foreground">
                Credits are listed on our marketplace for transparent trading
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                4
              </div>
              <h3 className="font-semibold mb-2">Impact Retirement</h3>
              <p className="text-sm text-muted-foreground">
                Credits are permanently retired to prevent double counting
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Start Trading Carbon Credits Today</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Join the transparent carbon marketplace and make a real impact on climate change.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Button size="lg">
                  Access Trading Dashboard
                </Button>
                <Button variant="outline" size="lg">
                  View Portfolio
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => {
                    sessionStorage.setItem('aurex_return_path', '/carbontrace');
                    login(window.location.origin + '/carbontrace');
                  }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Start Trading'}
                </Button>
                <a
                  href="mailto:admin@aurigraph.io?subject=CarbonTrace Information Request&body=Hello,%0D%0A%0D%0AI would like to learn more about CarbonTrace and request access.%0D%0A%0D%0AThank you!"
                  className="inline-block"
                >
                  <Button variant="outline" size="lg">
                    Request Information
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );

  return <CarbonTraceContent />;
};

export default CarbonTrace;
