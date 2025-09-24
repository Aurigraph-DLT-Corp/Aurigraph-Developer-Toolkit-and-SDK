import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, HelpCircle, BookOpen, MessageSquare, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import UniversalAuth from "../components/auth/UniversalAuth";

const SelfService = () => {
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
              <HelpCircle className="h-8 w-8" />
              Self Service
            </div>
            <UniversalAuth variant="header" showUserInfo={true} />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Self Service Center
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Find answers, resources, and support for the Aurex Platform
          </p>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <BookOpen className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Documentation</CardTitle>
                <CardDescription>Comprehensive guides and tutorials</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Access detailed documentation for all Aurex Platform features and integrations.
                </p>
                <Button variant="outline">
                  Browse Docs
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Community Forum</CardTitle>
                <CardDescription>Connect with other users</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Join our community forum to ask questions and share experiences.
                </p>
                <Button variant="outline">
                  Visit Forum
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Phone className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Contact Support</CardTitle>
                <CardDescription>Get direct help from our team</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Need personalized assistance? Contact our support team directly.
                </p>
                <Button variant="outline">
                  Contact Us
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SelfService;
