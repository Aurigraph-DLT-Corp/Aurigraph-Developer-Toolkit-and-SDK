import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trees, Mail, Github, Twitter, Linkedin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { validateEmail } from '@/lib/utils'

export function SiteFooter() {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateEmail(email)) {
      alert('Please enter a valid email address')
      return
    }

    // TODO: Connect to newsletter API
    console.log('Newsletter subscription:', { email })
    setIsSubscribed(true)
    setEmail('')
    
    // Reset success message after 3 seconds
    setTimeout(() => setIsSubscribed(false), 3000)
  }

  const footerLinks = {
    platform: [
      { name: 'About', href: '/#about' },
      { name: 'Process', href: '/#process' },
      { name: 'Benefits', href: '/#benefits' },
      { name: 'Modules', href: '/modules' },
    ],
    resources: [
      { name: 'Demo Project', href: '/demo-project' },
      { name: 'Documentation', href: '#' },
      { name: 'API Reference', href: '#' },
      { name: 'Help Center', href: '#' },
    ],
    company: [
      { name: 'Contact', href: '/contact' },
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' },
    ],
  }

  const socialLinks = [
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'GitHub', href: '#', icon: Github },
    { name: 'LinkedIn', href: '#', icon: Linkedin },
  ]

  return (
    <footer className="bg-sand-50 dark:bg-ink-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Newsletter Section */}
        <div className="border-b border-sand-200 pb-8 dark:border-ink-800">
          <div className="mx-auto max-w-md text-center">
            <h3 className="text-lg font-semibold text-ink-900 dark:text-ink-100">
              Stay Updated
            </h3>
            <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
              Get the latest updates on agroforestry and carbon credit innovations.
            </p>
            
            {isSubscribed ? (
              <div className="mt-4 rounded-lg bg-forest-50 p-3 dark:bg-forest-900">
                <p className="text-sm text-forest-700 dark:text-forest-300">
                  Thank you for subscribing! 🌱
                </p>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="mt-4 flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 rounded-lg border border-sand-300 bg-white px-3 py-2 text-sm placeholder-ink-400 focus:border-forest-500 focus:outline-none focus:ring-1 focus:ring-forest-500 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
                  required
                />
                <Button type="submit" size="sm">
                  <Mail className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Links Section */}
        <div className="pt-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {/* Logo and Description */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center space-x-2">
                <Trees className="h-6 w-6 text-forest-600 dark:text-forest-400" />
                <span className="text-lg font-bold text-forest-900 dark:text-forest-100">
                  Sylvagraph
                </span>
              </div>
              <p className="mt-2 text-sm text-ink-600 dark:text-ink-400">
                Bringing agroforestry to the digital age with transparent, 
                verifiable carbon credit solutions.
              </p>
              
              {/* Social Links */}
              <div className="mt-4 flex space-x-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    className="text-ink-400 hover:text-forest-600 dark:hover:text-forest-400"
                  >
                    <social.icon className="h-5 w-5" />
                    <span className="sr-only">{social.name}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                Platform
              </h4>
              <ul className="mt-3 space-y-2">
                {footerLinks.platform.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-ink-600 hover:text-forest-600 dark:text-ink-400 dark:hover:text-forest-400"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Links */}
            <div>
              <h4 className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                Resources
              </h4>
              <ul className="mt-3 space-y-2">
                {footerLinks.resources.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-ink-600 hover:text-forest-600 dark:text-ink-400 dark:hover:text-forest-400"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-sm font-semibold text-ink-900 dark:text-ink-100">
                Company
              </h4>
              <ul className="mt-3 space-y-2">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-ink-600 hover:text-forest-600 dark:text-ink-400 dark:hover:text-forest-400"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-8 border-t border-sand-200 pt-8 dark:border-ink-800">
            <div className="flex flex-col items-center justify-between space-y-4 text-center sm:flex-row sm:space-y-0 sm:text-left">
              <p className="text-sm text-ink-500 dark:text-ink-400">
                © 2025 Sylvagraph. All rights reserved. Part of the{' '}
                <a 
                  href="/"
                  className="text-forest-600 hover:text-forest-700 dark:text-forest-400 dark:hover:text-forest-300"
                >
                  Aurex Platform
                </a>.
              </p>
              <div className="flex space-x-4 text-sm text-ink-500 dark:text-ink-400">
                <span>GDPR Compliant</span>
                <span>•</span>
                <span>ISO 14064-2</span>
                <span>•</span>
                <span>Verra/GS Aligned</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}