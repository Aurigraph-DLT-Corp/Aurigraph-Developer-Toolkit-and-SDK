import React from 'react';
import { 
  MapPinIcon, 
  EnvelopeIcon, 
  PhoneIcon
} from '@heroicons/react/24/outline';
import { AurexLogo } from './ui/AurexLogo';


const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto container-padding py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Information */}
          <div className="space-y-6">
            <div className="flex items-center">
              <AurexLogo size="lg" variant="white" />
            </div>
            
            <p className="text-gray-400">
              Transform your ESG impact with intelligent DMRV. Monitor, report, and verify environmental impact with AI-powered precision.
            </p>
            
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start space-x-2">
                <MapPinIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Aurigraph DLT Corp, 4005 36th St., Mount Rainier, MD 20712 USA</span>
              </div>
              <div className="flex items-center space-x-2">
                <EnvelopeIcon className="w-4 h-4" />
                <a href="mailto:helpdesk@aurigraph.io" className="hover:text-white transition-colors">
                  helpdesk@aurigraph.io
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <PhoneIcon className="w-4 h-4" />
                <a href="tel:+919945103337" className="hover:text-white transition-colors">
                  +91 9945103337
                </a>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Products</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#products" className="hover:text-white transition-colors">Launchpad</a></li>
              <li><a href="#products" className="hover:text-white transition-colors">HydroPulse</a></li>
              <li><a href="#products" className="hover:text-white transition-colors">Sylvagraph</a></li>
              <li><a href="#products" className="hover:text-white transition-colors">CarbonTrace</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#solutions" className="hover:text-white transition-colors">Industry Solutions</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resources</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#resources" className="hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#resources" className="hover:text-white transition-colors">API Reference</a></li>
              <li><a href="#resources" className="hover:text-white transition-colors">Support Center</a></li>
              <li><a href="#resources" className="hover:text-white transition-colors">Case Studies</a></li>
              <li><a href="#resources" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#resources" className="hover:text-white transition-colors">Webinars</a></li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#leadership" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#careers" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#partners" className="hover:text-white transition-colors">Partners</a></li>
              <li><a href="#security" className="hover:text-white transition-colors">Security</a></li>
              <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>


        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-800 flex justify-center">
          <div className="text-center text-gray-400 text-sm">
            <p>&copy; 2025 Aurex Platform. All rights reserved.</p>
            <p className="mt-1">
              Made for a sustainable future
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;