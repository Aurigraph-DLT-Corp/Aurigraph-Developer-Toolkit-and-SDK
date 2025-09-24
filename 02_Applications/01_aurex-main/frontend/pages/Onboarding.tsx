import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import UniversalAuth from "../components/auth/UniversalAuth";

const Onboarding = () => {
  return (
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
            <div className="flex items-center gap-2 font-bold text-xl text-primary">
              <CheckCircle className="h-8 w-8" />
              Onboarding
            </div>
            <UniversalAuth variant="header" showUserInfo={true} />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to Aurex Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Let's get you started with your sustainability journey
          </p>
        </div>
      </section>

      {/* Onboarding Steps */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                  1
                </div>
                <CardTitle>Choose Your Application</CardTitle>
                <CardDescription>Select the right tool for your needs</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Explore our applications and choose the one that best fits your sustainability goals.
                </p>
                <Button variant="outline" asChild>
                  <Link to="/">
                    Explore Apps
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                  2
                </div>
                <CardTitle>Complete Assessment</CardTitle>
                <CardDescription>Evaluate your current state</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Complete our comprehensive assessment to understand your baseline.
                </p>
                <Button variant="outline" asChild>
                  <Link to="/launchpad">
                    Start Assessment
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                  3
                </div>
                <CardTitle>Begin Implementation</CardTitle>
                <CardDescription>Start your sustainability journey</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Implement your customized sustainability plan with our guidance.
                </p>
                <Button variant="outline">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Onboarding;
