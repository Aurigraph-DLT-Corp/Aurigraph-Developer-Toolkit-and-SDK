import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, ChevronDown, Shield, Cpu, Building2,
  Code2, Leaf, FileText, Phone, ExternalLink
} from 'lucide-react';

const navigation = {
  platform: [
    { name: 'Technology Overview', href: '/platform', icon: Cpu },
    { name: 'Security & Compliance', href: '/security', icon: Shield },
    { name: 'Performance', href: '/platform#performance', icon: Cpu },
    { name: 'Architecture', href: '/platform#architecture', icon: Cpu },
  ],
  solutions: [
    { name: 'Real Estate & REITs', href: '/solutions/real-estate', icon: Building2 },
    { name: 'Carbon Credits', href: '/solutions/carbon-credits', icon: Leaf },
    { name: 'Commodities', href: '/solutions/commodities', icon: Building2 },
    { name: 'Supply Chain', href: '/solutions/supply-chain', icon: Building2 },
    { name: 'Art & Collectibles', href: '/solutions/art-collectibles', icon: Building2 },
  ],
  developers: [
    { name: 'Documentation', href: '/developers/docs', icon: FileText },
    { name: 'API Reference', href: '/developers/api', icon: Code2 },
    { name: 'SDK & Tools', href: '/developers/sdk', icon: Code2 },
    { name: 'GitHub', href: 'https://github.com/Aurigraph-DLT-Corp', icon: ExternalLink },
  ],
  company: [
    { name: 'About Us', href: '/about', icon: Building2 },
    { name: 'Whitepaper', href: '/whitepaper', icon: FileText },
    { name: 'Sustainability', href: '/sustainability', icon: Leaf },
    { name: 'Contact', href: '/contact', icon: Phone },
  ],
};

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-slate-900/95 backdrop-blur-xl shadow-lg shadow-primary-500/10'
          : 'bg-transparent'
      }`}
    >
      <nav className="container-custom">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-quantum-blue via-quantum-purple to-quantum-green flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-white font-display font-bold text-xl tracking-tight">
              Aurigraph<span className="text-quantum-blue">DLT</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {/* Platform Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('platform')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="flex items-center space-x-1 px-4 py-2 text-gray-300 hover:text-white transition-colors">
                <span>Platform</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {activeDropdown === 'platform' && (
                  <DropdownMenu items={navigation.platform} />
                )}
              </AnimatePresence>
            </div>

            {/* Solutions Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('solutions')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="flex items-center space-x-1 px-4 py-2 text-gray-300 hover:text-white transition-colors">
                <span>Solutions</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {activeDropdown === 'solutions' && (
                  <DropdownMenu items={navigation.solutions} />
                )}
              </AnimatePresence>
            </div>

            {/* Developers Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('developers')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="flex items-center space-x-1 px-4 py-2 text-gray-300 hover:text-white transition-colors">
                <span>Developers</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {activeDropdown === 'developers' && (
                  <DropdownMenu items={navigation.developers} />
                )}
              </AnimatePresence>
            </div>

            {/* Company Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setActiveDropdown('company')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="flex items-center space-x-1 px-4 py-2 text-gray-300 hover:text-white transition-colors">
                <span>Company</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {activeDropdown === 'company' && (
                  <DropdownMenu items={navigation.company} />
                )}
              </AnimatePresence>
            </div>

            <Link
              href="/enterprise"
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Enterprise
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link
              href="/demo"
              className="text-gray-300 hover:text-white transition-colors font-medium"
            >
              Request Demo
            </Link>
            <Link
              href="https://dlt.aurigraph.io"
              className="px-6 py-2.5 bg-gradient-to-r from-quantum-blue to-quantum-purple text-white font-semibold rounded-full hover:shadow-lg hover:shadow-quantum-blue/25 transition-all duration-300"
            >
              Launch App
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-slate-900/95 backdrop-blur-xl rounded-2xl mt-2 overflow-hidden"
            >
              <div className="p-6 space-y-6">
                <MobileMenuSection title="Platform" items={navigation.platform} />
                <MobileMenuSection title="Solutions" items={navigation.solutions} />
                <MobileMenuSection title="Developers" items={navigation.developers} />
                <MobileMenuSection title="Company" items={navigation.company} />

                <div className="pt-6 border-t border-white/10 space-y-3">
                  <Link
                    href="/demo"
                    className="block w-full py-3 text-center text-white border border-white/20 rounded-full hover:bg-white/5 transition-colors"
                  >
                    Request Demo
                  </Link>
                  <Link
                    href="https://dlt.aurigraph.io"
                    className="block w-full py-3 text-center bg-gradient-to-r from-quantum-blue to-quantum-purple text-white font-semibold rounded-full"
                  >
                    Launch App
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}

function DropdownMenu({ items }: { items: typeof navigation.platform }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="absolute top-full left-0 w-64 mt-2 py-3 bg-slate-900/95 backdrop-blur-xl rounded-xl shadow-xl shadow-black/20 border border-white/10"
    >
      {items.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className="flex items-center space-x-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
        >
          <item.icon className="w-5 h-5 text-quantum-blue" />
          <span>{item.name}</span>
        </Link>
      ))}
    </motion.div>
  );
}

function MobileMenuSection({ title, items }: { title: string; items: typeof navigation.platform }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-white font-semibold"
      >
        {title}
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 space-y-2 pl-4"
          >
            {items.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-3 py-2 text-gray-400 hover:text-white transition-colors"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
