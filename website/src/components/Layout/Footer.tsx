import Link from 'next/link';
import {
  Twitter, Linkedin, Github, Mail,
  MapPin, Phone, ArrowUpRight
} from 'lucide-react';

const footerLinks = {
  platform: [
    { name: 'Technology', href: '/platform' },
    { name: 'Security', href: '/security' },
    { name: 'Performance', href: '/platform#performance' },
    { name: 'Architecture', href: '/platform#architecture' },
    { name: 'Roadmap', href: '/platform#roadmap' },
  ],
  solutions: [
    { name: 'Real Estate', href: '/solutions/real-estate' },
    { name: 'Carbon Credits', href: '/solutions/carbon-credits' },
    { name: 'Commodities', href: '/solutions/commodities' },
    { name: 'Supply Chain', href: '/solutions/supply-chain' },
    { name: 'Art & Collectibles', href: '/solutions/art-collectibles' },
  ],
  developers: [
    { name: 'Documentation', href: '/developers/docs' },
    { name: 'API Reference', href: '/developers/api' },
    { name: 'SDK & Tools', href: '/developers/sdk' },
    { name: 'GitHub', href: 'https://github.com/Aurigraph-DLT-Corp' },
    { name: 'Status', href: '/status' },
  ],
  company: [
    { name: 'About Us', href: '/about' },
    { name: 'Whitepaper', href: '/whitepaper' },
    { name: 'Sustainability', href: '/sustainability' },
    { name: 'Careers', href: '/careers' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Service', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Compliance', href: '/compliance' },
  ],
};

const socialLinks = [
  { name: 'Twitter', icon: Twitter, href: 'https://twitter.com/aurigraph' },
  { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com/company/aurigraph' },
  { name: 'GitHub', icon: Github, href: 'https://github.com/Aurigraph-DLT-Corp' },
  { name: 'Email', icon: Mail, href: 'mailto:contact@aurigraph.io' },
];

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-white/5">
      {/* Main Footer */}
      <div className="container-custom py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-quantum-blue via-quantum-purple to-quantum-green flex items-center justify-center">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-white font-display font-bold text-xl">
                Aurigraph<span className="text-quantum-blue">DLT</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              The institutional blockchain for real-world asset tokenization.
              Quantum-resistant, deterministic, and environmentally sustainable.
            </p>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-white font-semibold mb-4">Platform</h3>
            <ul className="space-y-3">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h3 className="text-white font-semibold mb-4">Solutions</h3>
            <ul className="space-y-3">
              {footerLinks.solutions.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Developers */}
          <div>
            <h3 className="text-white font-semibold mb-4">Developers</h3>
            <ul className="space-y-3">
              {footerLinks.developers.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm flex items-center"
                  >
                    {link.name}
                    {link.href.startsWith('http') && (
                      <ArrowUpRight className="w-3 h-3 ml-1" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-quantum-blue mt-0.5" />
                <span className="text-gray-400 text-sm">
                  Singapore &amp; Global<br />
                  Enterprise Solutions
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-quantum-blue" />
                <a
                  href="mailto:contact@aurigraph.io"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  contact@aurigraph.io
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-quantum-blue" />
                <a
                  href="tel:+6512345678"
                  className="text-gray-400 hover:text-white transition-colors text-sm"
                >
                  +65 1234 5678
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/5">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} Aurigraph DLT Corp. All rights reserved.
            </p>
            <div className="flex items-center space-x-6">
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-gray-500 hover:text-gray-300 transition-colors text-sm"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
