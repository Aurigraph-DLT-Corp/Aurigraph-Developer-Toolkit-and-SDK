import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { scrollToElement } from '@/lib/utils'

export function Hero() {
  const handleLearnMore = () => {
    scrollToElement('process-section')
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-forest-50 via-mint-50 to-sand-50 dark:from-forest-950 dark:via-ink-950 dark:to-ink-900">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Content */}
          <div className="flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Badge */}
              <div className="mb-6">
                <div className="inline-flex items-center rounded-full bg-forest-100 px-3 py-1 text-sm text-forest-700 dark:bg-forest-900 dark:text-forest-300">
                  <span className="mr-2">🌱</span>
                  Digital Agroforestry Platform
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-4xl font-bold tracking-tight text-ink-900 dark:text-ink-100 sm:text-5xl lg:text-6xl">
                Sylvagraph —{' '}
                <span className="bg-gradient-to-r from-forest-600 to-mint-600 bg-clip-text text-transparent">
                  Bringing Agroforestry to the Digital Age
                </span>
              </h1>

              {/* Subheadline */}
              <p className="mt-6 text-lg text-ink-600 dark:text-ink-400 sm:text-xl">
                Monitor landscapes with drones & satellites, verify with DMRV, and tokenize 
                high-quality credits. Transform your forest management with transparent, 
                blockchain-verified carbon credit solutions.
              </p>

              {/* CTAs */}
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link to="/contact">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start a Project
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLearnMore}
                  className="w-full sm:w-auto"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Learn How It Works
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="mt-12 flex flex-wrap items-center gap-6 text-sm text-ink-500 dark:text-ink-400">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-forest-500" />
                  ISO 14064-2 Compliant
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-mint-500" />
                  Verra/Gold Standard
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-forest-500" />
                  Blockchain Verified
                </div>
              </div>
            </motion.div>
          </div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center justify-center"
          >
            <div className="relative">
              {/* Placeholder illustration */}
              <div className="aspect-square w-full max-w-md rounded-3xl bg-gradient-to-br from-forest-100 via-mint-100 to-sand-100 p-8 dark:from-forest-900 dark:via-mint-900 dark:to-sand-900">
                <div className="flex h-full flex-col items-center justify-center space-y-6 text-center">
                  {/* Forest illustration placeholder */}
                  <div className="space-y-4">
                    <div className="mx-auto h-16 w-16 rounded-full bg-forest-200 dark:bg-forest-800" />
                    <div className="flex justify-center space-x-2">
                      <div className="h-8 w-2 rounded bg-forest-300 dark:bg-forest-700" />
                      <div className="h-12 w-2 rounded bg-forest-400 dark:bg-forest-600" />
                      <div className="h-10 w-2 rounded bg-forest-300 dark:bg-forest-700" />
                      <div className="h-14 w-2 rounded bg-forest-500 dark:bg-forest-500" />
                      <div className="h-9 w-2 rounded bg-forest-300 dark:bg-forest-700" />
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="space-y-2 text-sm text-ink-600 dark:text-ink-400">
                    <div className="rounded-lg bg-white/60 px-3 py-1 dark:bg-ink-800/60">
                      🛰️ Satellite Monitoring
                    </div>
                    <div className="rounded-lg bg-white/60 px-3 py-1 dark:bg-ink-800/60">
                      🤖 AI-Powered Analysis
                    </div>
                    <div className="rounded-lg bg-white/60 px-3 py-1 dark:bg-ink-800/60">
                      🪙 Tokenized Credits
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute -right-4 -top-4 rounded-full bg-mint-200 p-3 dark:bg-mint-800"
              >
                <span className="text-lg">🌿</span>
              </motion.div>

              <motion.div
                animate={{
                  y: [0, 10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1,
                }}
                className="absolute -bottom-4 -left-4 rounded-full bg-forest-200 p-3 dark:bg-forest-800"
              >
                <span className="text-lg">🏞️</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Background pattern */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-1/2 -top-1/2 h-full w-full rounded-full bg-gradient-to-r from-forest-100/20 to-mint-100/20 blur-3xl dark:from-forest-900/20 dark:to-mint-900/20" />
        <div className="absolute -right-1/2 -bottom-1/2 h-full w-full rounded-full bg-gradient-to-l from-mint-100/20 to-forest-100/20 blur-3xl dark:from-mint-900/20 dark:to-forest-900/20" />
      </div>
    </section>
  )
}