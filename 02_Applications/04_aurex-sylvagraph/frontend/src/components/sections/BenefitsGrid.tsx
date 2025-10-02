/**
 * BenefitsGrid Section
 * Key benefits and value propositions of Sylvagraph platform
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Zap, Shield, TrendingUp, Leaf, Clock } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

const benefits = [
  {
    icon: Zap,
    title: 'Automated MRV',
    description: 'Eliminate manual reporting with AI-powered measurement, reporting, and verification systems.',
    stats: '95% faster reporting',
    gradient: 'from-forest-500 to-forest-600'
  },
  {
    icon: Shield,
    title: 'Verified Compliance',
    description: 'Built-in compliance with CORSIA, EU ETS, VCS, and other international carbon standards.',
    stats: '100% audit-ready',
    gradient: 'from-mint-500 to-mint-600'
  },
  {
    icon: TrendingUp,
    title: 'Revenue Optimization',
    description: 'Maximize carbon credit value through data-driven forest management and market intelligence.',
    stats: 'Up to 40% higher returns',
    gradient: 'from-sand-600 to-sand-700'
  },
  {
    icon: Leaf,
    title: 'Ecosystem Impact',
    description: 'Track biodiversity, soil health, and water quality alongside carbon sequestration metrics.',
    stats: '12+ impact indicators',
    gradient: 'from-forest-600 to-mint-600'
  },
  {
    icon: Clock,
    title: 'Real-time Monitoring',
    description: 'Continuous forest health monitoring with satellite imagery and IoT sensor networks.',
    stats: '24/7 monitoring',
    gradient: 'from-mint-600 to-forest-500'
  }
]

export const BenefitsGrid: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-sand-50 to-white" aria-labelledby="benefits-grid">
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
              Platform Benefits
            </Badge>
            <h2 id="benefits-grid" className="text-4xl font-bold text-ink-900 mb-6">
              Why Choose Sylvagraph?
            </h2>
            <p className="text-xl text-ink-600 leading-relaxed max-w-3xl mx-auto">
              Experience the next generation of forest management with our comprehensive platform 
              that combines cutting-edge technology with proven sustainability practices.
            </p>
          </motion.div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {benefits.slice(0, 3).map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-xl transition-all duration-300 group">
                  {/* Icon with gradient background */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${benefit.gradient} p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <benefit.icon className="h-6 w-6 text-white" />
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-xl font-bold text-ink-900 mb-3 group-hover:text-forest-700 transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-ink-600 leading-relaxed mb-4">
                    {benefit.description}
                  </p>

                  {/* Stats */}
                  <div className="mt-auto">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r ${benefit.gradient} text-white`}>
                      {benefit.stats}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Bottom Row - 2 Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {benefits.slice(3).map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: (index + 3) * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-xl transition-all duration-300 group">
                  {/* Icon with gradient background */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${benefit.gradient} p-3 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <benefit.icon className="h-6 w-6 text-white" />
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-xl font-bold text-ink-900 mb-3 group-hover:text-forest-700 transition-colors">
                    {benefit.title}
                  </h3>
                  <p className="text-ink-600 leading-relaxed mb-4">
                    {benefit.description}
                  </p>

                  {/* Stats */}
                  <div className="mt-auto">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r ${benefit.gradient} text-white`}>
                      {benefit.stats}
                    </span>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Key Value Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 bg-gradient-to-r from-forest-600 to-mint-600 rounded-2xl p-8 text-white text-center"
          >
            <h3 className="text-2xl font-bold mb-6">Platform Impact Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold mb-2">2.5M+</div>
                <div className="text-forest-100">Hectares Monitored</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">1.8M</div>
                <div className="text-forest-100">Carbon Credits Generated</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">99.9%</div>
                <div className="text-forest-100">Verification Accuracy</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}