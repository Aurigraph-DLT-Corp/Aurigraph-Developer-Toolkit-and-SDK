import React from 'react';
import { Link } from 'react-router-dom';
import DemoRequestForm from '@/components/DemoRequestForm';
import { CheckCircle, Users, Clock, Award } from 'lucide-react';
import UniversalAuth from '../components/auth/UniversalAuth';

const Demo = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <div>
                <div className="font-bold text-xl text-gray-900">Aurigraph</div>
                <div className="text-sm text-green-600 font-medium">Aurex Platform</div>
              </div>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-gray-700 hover:text-green-600 font-medium transition-colors">Home</Link>
              <Link to="/#platform" className="text-gray-700 hover:text-green-600 font-medium transition-colors">Platform</Link>
              <Link to="/contact" className="text-gray-700 hover:text-green-600 font-medium transition-colors">Contact</Link>
              <Link to="/launchpad" className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm">
                Get Started
              </Link>
              <UniversalAuth variant="header" showUserInfo={true} />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900">
            See Aurex in Action
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Experience how our sustainability platforms can transform your organization's environmental impact with a personalized demo.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>30-minute personalized demo</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Live platform walkthrough</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Custom implementation roadmap</span>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Content */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Demo Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Why Schedule a Demo?</h2>

              <div className="space-y-6 mb-12">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Personalized Experience</h3>
                    <p className="text-gray-600">Our sustainability experts will tailor the demo to your specific industry, challenges, and goals.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Efficient & Focused</h3>
                    <p className="text-gray-600">In just 30 minutes, see how our platforms can address your sustainability challenges and accelerate your net-zero journey.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Expert Guidance</h3>
                    <p className="text-gray-600">Get insights from our team of sustainability professionals and learn best practices from industry leaders.</p>
                  </div>
                </div>
              </div>

              {/* Platform Options */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Choose Your Platform Demo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                      📊
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">Aurex Launchpad</h4>
                    <p className="text-sm text-gray-600">ESG Assessment & Net-Zero Planning</p>
                  </div>

                  <div className="p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                      💧
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">Aurex HydroPulse</h4>
                    <p className="text-sm text-gray-600">Smart Water Management</p>
                  </div>

                  <div className="p-4 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                      🌲
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">Aurex SylvaGraph</h4>
                    <p className="text-sm text-gray-600">Forest Monitoring & Management</p>
                  </div>

                  <div className="p-4 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
                      🌿
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">Aurex CarbonTrace</h4>
                    <p className="text-sm text-gray-600">Carbon Credit Trading</p>
                  </div>
                </div>
              </div>

              {/* Testimonial */}
              <div className="mt-12 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">JD</span>
                  </div>
                  <div>
                    <p className="text-gray-700 mb-4 italic">
                      "The demo was incredibly insightful. In just 30 minutes, I could see how Aurex would transform our sustainability reporting and help us achieve our net-zero commitments."
                    </p>
                    <div>
                      <div className="font-semibold text-gray-900">Jane Doe</div>
                      <div className="text-sm text-gray-600">Sustainability Director, GreenTech Corp</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Demo Request Form */}
            <div>
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <DemoRequestForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 px-4 bg-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Company Info */}
            <div className="flex items-center gap-2">
              🌱
              <span className="font-semibold text-lg">Aurex Platform</span>
            </div>

            {/* Contact Information */}
            <div className="flex flex-col md:flex-row items-center gap-3 text-sm">
              <a
                href="tel:+919945103337"
                className="flex items-center gap-1 text-gray-400 hover:text-green-400 transition-colors"
              >
                📞 +91 9945103337
              </a>

              <a
                href="mailto:helpdesk@aurigraph.io"
                className="flex items-center gap-1 text-gray-400 hover:text-green-400 transition-colors"
              >
                📧 helpdesk@aurigraph.io
              </a>

              <div className="flex items-center gap-1 text-gray-400">
                📍 Mount Rainier, MD
              </div>
            </div>

            {/* Copyright */}
            <div className="text-xs text-gray-500">
              © 2025 Aurigraph DLT Corp
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Demo;
