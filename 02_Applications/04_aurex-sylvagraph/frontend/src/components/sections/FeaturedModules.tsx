/**
 * FeaturedModules Section
 * Showcase of 8 featured modules from the Sylvagraph platform
 */

import React from 'react'
import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { modules } from '../../data/modules'

const featuredModuleIds = [
  'forest-health-monitoring',
  'carbon-sequestration-tracking', 
  'biodiversity-assessment',
  'satellite-imagery-analysis',
  'iot-sensor-network',
  'automated-reporting',
  'carbon-credit-tokenization',
  'compliance-management'
]

export const FeaturedModules: React.FC = () => {
  const featuredModules = modules.filter(module => featuredModuleIds.includes(module.id))

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core':
        return 'bg-forest-100 text-forest-700'
      case 'mrv':
        return 'bg-mint-100 text-mint-700'
      case 'credits':
        return 'bg-sand-100 text-sand-700'
      case 'compliance':
        return 'bg-forest-100 text-forest-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <section className="py-20 bg-gradient-to-b from-white to-sand-50" aria-labelledby="featured-modules">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4 bg-forest-100 text-forest-700">
              Featured Capabilities
            </Badge>
            <h2 id="featured-modules" className="text-4xl font-bold text-ink-900 mb-6">
              Essential Sylvagraph Modules
            </h2>
            <p className="text-xl text-ink-600 leading-relaxed max-w-3xl mx-auto">
              Discover the core modules that power comprehensive forest management, 
              carbon tracking, and credit generation in the Sylvagraph platform.
            </p>
          </motion.div>

          {/* Featured Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {featuredModules.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="h-full"
              >
                <Card className="p-6 h-full hover:shadow-xl transition-all duration-300 group cursor-pointer">
                  {/* Icon and Category */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-forest-50 rounded-lg group-hover:bg-forest-100 transition-colors">
                      <module.icon className="h-6 w-6 text-forest-600" />
                    </div>
                    <Badge variant="secondary" className={`text-xs ${getCategoryColor(module.category)}`}>
                      {module.category.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-ink-900 mb-3 group-hover:text-forest-700 transition-colors line-clamp-2">
                    {module.title}
                  </h3>

                  {/* Description */}
                  <p className="text-ink-600 text-sm leading-relaxed mb-4 line-clamp-3">
                    {module.description}
                  </p>

                  {/* Learn More Link */}
                  <div className="mt-auto pt-4 border-t border-sand-200">
                    <div className="flex items-center text-forest-600 text-sm font-medium group-hover:text-forest-700 transition-colors">
                      <span>Learn more</span>
                      <ExternalLink className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Module Categories Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-white rounded-2xl p-8 shadow-lg border border-sand-200"
          >
            <h3 className="text-2xl font-bold text-ink-900 mb-6 text-center">
              Complete Module Categories
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-forest-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-forest-700 font-bold">8</span>
                </div>
                <h4 className="font-semibold text-ink-900 mb-2">Core Modules</h4>
                <p className="text-sm text-ink-600">Essential forest management and monitoring capabilities</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-mint-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-mint-700 font-bold">12</span>
                </div>
                <h4 className="font-semibold text-ink-900 mb-2">MRV Modules</h4>
                <p className="text-sm text-ink-600">Measurement, reporting, and verification systems</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-sand-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-sand-700 font-bold">6</span>
                </div>
                <h4 className="font-semibold text-ink-900 mb-2">Credits Modules</h4>
                <p className="text-sm text-ink-600">Carbon credit generation and tokenization</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-forest-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-forest-700 font-bold">4</span>
                </div>
                <h4 className="font-semibold text-ink-900 mb-2">Compliance</h4>
                <p className="text-sm text-ink-600">Regulatory compliance and audit management</p>
              </div>
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="text-center mt-12"
          >
            <button className="bg-forest-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-forest-700 transition-colors">
              Explore All 30 Modules
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}