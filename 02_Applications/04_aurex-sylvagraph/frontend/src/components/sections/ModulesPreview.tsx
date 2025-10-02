/**
 * ModulesPreview Section
 * Compact grid preview of additional modules with links to full modules page
 */

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { modules } from '../../data/modules'

// Show modules not featured in the FeaturedModules section
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

export const ModulesPreview: React.FC = () => {
  // Get modules not shown in featured section, limited to 8 for preview
  const previewModules = modules
    .filter(module => !featuredModuleIds.includes(module.id))
    .slice(0, 8)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core':
        return 'bg-forest-100 text-forest-700 border-forest-200'
      case 'mrv':
        return 'bg-mint-100 text-mint-700 border-mint-200'
      case 'credits':
        return 'bg-sand-100 text-sand-700 border-sand-200'
      case 'compliance':
        return 'bg-forest-100 text-forest-700 border-forest-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'core':
        return 'Core'
      case 'mrv':
        return 'MRV'
      case 'credits':
        return 'Credits'
      case 'compliance':
        return 'Compliance'
      default:
        return 'Other'
    }
  }

  return (
    <section className="py-20 bg-white" aria-labelledby="modules-preview">
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
            <Badge variant="secondary" className="mb-4 bg-mint-100 text-mint-700">
              More Capabilities
            </Badge>
            <h2 id="modules-preview" className="text-4xl font-bold text-ink-900 mb-6">
              Additional Platform Modules
            </h2>
            <p className="text-xl text-ink-600 leading-relaxed max-w-3xl mx-auto">
              Explore more specialized modules that extend Sylvagraph's capabilities for 
              advanced forest management, compliance, and market integration.
            </p>
          </motion.div>

          {/* Modules Preview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {previewModules.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <Card className="p-4 h-full hover:shadow-lg transition-all duration-300 group cursor-pointer border hover:border-forest-200">
                  {/* Category Badge */}
                  <div className="flex justify-between items-start mb-3">
                    <Badge variant="outline" className={`text-xs ${getCategoryColor(module.category)}`}>
                      {getCategoryName(module.category)}
                    </Badge>
                    <module.icon className="h-5 w-5 text-forest-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-semibold text-ink-900 mb-2 group-hover:text-forest-700 transition-colors line-clamp-2">
                    {module.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-ink-600 leading-relaxed line-clamp-2">
                    {module.description}
                  </p>

                  {/* Hover Effect */}
                  <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="text-forest-600 text-xs font-medium">
                      Learn more →
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Statistics and CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-gradient-to-r from-forest-50 to-mint-50 rounded-2xl p-8 text-center border border-sand-200"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <div className="text-3xl font-bold text-ink-900 mb-2">30+</div>
                <div className="text-ink-600">Total Modules</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-ink-900 mb-2">4</div>
                <div className="text-ink-600">Module Categories</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-ink-900 mb-2">100%</div>
                <div className="text-ink-600">Customizable</div>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-ink-900 mb-4">
              Discover All Platform Capabilities
            </h3>
            <p className="text-ink-600 text-lg mb-6 max-w-2xl mx-auto">
              Explore the complete suite of Sylvagraph modules designed to handle every aspect 
              of forest management, carbon tracking, and compliance requirements.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-forest-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-forest-700 transition-colors flex items-center justify-center">
                View All Modules
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
              <button className="border-2 border-forest-600 text-forest-600 px-8 py-3 rounded-lg font-semibold hover:bg-forest-50 transition-colors">
                Request Custom Demo
              </button>
            </div>
          </motion.div>

          {/* Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div className="text-center p-4 bg-forest-50 rounded-lg">
              <div className="text-lg font-bold text-forest-700">8</div>
              <div className="text-sm text-forest-600">Core Modules</div>
            </div>
            <div className="text-center p-4 bg-mint-50 rounded-lg">
              <div className="text-lg font-bold text-mint-700">12</div>
              <div className="text-sm text-mint-600">MRV Modules</div>
            </div>
            <div className="text-center p-4 bg-sand-50 rounded-lg">
              <div className="text-lg font-bold text-sand-700">6</div>
              <div className="text-sm text-sand-600">Credits Modules</div>
            </div>
            <div className="text-center p-4 bg-forest-50 rounded-lg">
              <div className="text-lg font-bold text-forest-700">4</div>
              <div className="text-sm text-forest-600">Compliance</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}