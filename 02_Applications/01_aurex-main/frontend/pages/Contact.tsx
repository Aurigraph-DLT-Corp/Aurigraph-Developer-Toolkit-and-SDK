import React from 'react';
import { Link } from 'react-router-dom';
import ContactForm from '@/components/ContactForm';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import UniversalAuth from '../components/auth/UniversalAuth';

const Contact = () => {
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
            Get in Touch
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ready to transform your sustainability journey? Our team of experts is here to help you achieve your net-zero goals.
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Contact Information */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Contact Information</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Email</h3>
                    <a href="mailto:helpdesk@aurigraph.io" className="text-gray-600 hover:text-green-600 transition-colors">General inquiries: helpdesk@aurigraph.io</a>
                    <p className="text-gray-600">Support: {import.meta.env.VITE_SUPPORT_EMAIL}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Phone</h3>
                    <a
                      href="tel:+919945103337"
                      className="text-gray-600 hover:text-blue-600 transition-colors"
                    >
                      +91 9945103337
                    </a>
                    <p className="text-sm text-gray-500">Monday - Friday, 9:00 AM - 6:00 PM IST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                    <p className="text-gray-600">4005 36th St.<br />Mount Rainier, MD 20712<br />United States</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Business Hours</h3>
                    <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                    <p className="text-gray-600">Saturday - Sunday: Closed</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
                <div className="space-y-3">
                  <Link
                    to="/launchpad"
                    className="block w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors text-center"
                  >
                    🚀 Start ESG Assessment
                  </Link>
                  <Link
                    to="/demo"
                    className="block w-full border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg font-medium hover:bg-green-600 hover:text-white transition-colors text-center"
                  >
                    📅 Schedule Demo
                  </Link>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Send us a Message</h2>
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <ContactForm />
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
              <div className="absolute inset-0 opacity-20 rounded-lg overflow-hidden">
                <img src="/images/forest-background.svg" alt="Forest Background" className="w-full h-full object-cover" />
              </div>
              <div className="relative z-10 p-4">
                <div className="flex items-center gap-2 mb-4">
                  🌱
                  <span className="font-bold text-xl">Aurex Platform</span>
                </div>
                <p className="text-gray-400 mb-6">
                  Leading DMRV compliant carbon accounting solutions for a sustainable future.
                </p>

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
                        href="mailto:helpdesk@aurigraph.io"
                        className="text-gray-400 hover:text-green-400 transition-colors"
                      >
                        helpdesk@aurigraph.io
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
              <h3 className="font-bold text-lg mb-4">Platform</h3>
              <ul className="space-y-2">
                <li><Link to="/launchpad" className="text-gray-400 hover:text-white transition-colors">Aurex Launchpad</Link></li>
                <li><Link to="/hydropulse" className="text-gray-400 hover:text-white transition-colors">Aurex HydroPulse</Link></li>
                <li><Link to="/sylvagraph" className="text-gray-400 hover:text-white transition-colors">Aurex SylvaGraph</Link></li>
                <li><Link to="/carbon-trace" className="text-gray-400 hover:text-white transition-colors">Aurex CarbonTrace</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/careers" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/news" className="text-gray-400 hover:text-white transition-colors">News</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link to="/documentation" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="/support" className="text-gray-400 hover:text-white transition-colors">Support</Link></li>
                <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">
              © 2025 Aurigraph DLT Corp. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
