import React from 'react';
import { Link } from 'react-router-dom';

const LaunchpadFooter: React.FC = () => {
  return (
    <footer className="py-16 px-4 bg-black text-white">
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
  );
};

export default LaunchpadFooter;
