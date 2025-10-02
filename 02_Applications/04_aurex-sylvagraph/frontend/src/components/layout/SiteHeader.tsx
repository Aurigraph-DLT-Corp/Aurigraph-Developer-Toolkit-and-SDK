import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Sun, Moon, Trees } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTheme, toggleTheme } from '@/lib/utils'

export function SiteHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [theme, setThemeState] = useState<'light' | 'dark'>('light')
  const location = useLocation()

  useEffect(() => {
    setThemeState(getTheme())
  }, [])

  const handleThemeToggle = () => {
    const newTheme = toggleTheme()
    setThemeState(newTheme)
  }

  const navigation = [
    { name: 'Home', href: '/', current: location.pathname === '/' },
    { name: 'Modules', href: '/modules', current: location.pathname === '/modules' },
    { name: 'Demo', href: '/demo-project', current: location.pathname === '/demo-project' },
    { name: 'Contact', href: '/contact', current: location.pathname === '/contact' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-sand-200 bg-white/80 backdrop-blur-md dark:border-ink-800 dark:bg-ink-950/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Trees className="h-8 w-8 text-forest-600 dark:text-forest-400" />
              <span className="text-xl font-bold text-forest-900 dark:text-forest-100">
                Sylvagraph
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors ${
                  item.current
                    ? 'text-forest-600 dark:text-forest-400'
                    : 'text-ink-600 hover:text-forest-600 dark:text-ink-400 dark:hover:text-forest-400'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleThemeToggle}
              className="text-ink-600 dark:text-ink-400"
            >
              {theme === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* CTA Button */}
            <Link to="/contact" className="hidden sm:block">
              <Button size="sm">Start a Project</Button>
            </Link>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 text-base font-medium transition-colors ${
                    item.current
                      ? 'text-forest-600 dark:text-forest-400'
                      : 'text-ink-600 hover:text-forest-600 dark:text-ink-400 dark:hover:text-forest-400'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="px-3 pt-2">
                <Link to="/contact" className="block">
                  <Button size="sm" className="w-full">
                    Start a Project
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}