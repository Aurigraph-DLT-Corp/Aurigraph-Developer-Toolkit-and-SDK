/**
 * WhatIsSylvagraph Section
 * Overview of Sylvagraph platform with key capabilities
 */

import React from 'react'
import { motion } from 'framer-motion'
import { TreePine, Satellite, TrendingUp, Award } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

const capabilities = [
  {
    icon: TreePine,
    title: 'Forest Monitoring',
    description: 'Real-time satellite and IoT-based forest health tracking',
    color: 'bg-forest-100 text-forest-700'
  },
  {
    icon: Satellite,
    title: 'Digital MRV',
    description: 'Automated measurement, reporting & verification of carbon sequestration',
    color: 'bg-mint-100 text-mint-700'
  },
  {
    icon: TrendingUp,
    title: 'Carbon Credits',
    description: 'Tokenized carbon credit generation and marketplace integration',
    color: 'bg-sand-100 text-sand-700'
  },
  {
    icon: Award,
    title: 'Compliance',
    description: 'CORSIA, EU ETS, and voluntary standard compliance tracking',
    color: 'bg-forest-100 text-forest-700'
  }
]

export const WhatIsSylvagraph: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-sand-50 to-white" aria-labelledby="what-is-sylvagraph">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4 bg-forest-100 text-forest-700">
              Agroforestry Platform
            </Badge>
            <h2 id="what-is-sylvagraph" className="text-4xl font-bold text-ink-900 mb-6">
              What is Aurex Sylvagraph™?
            </h2>
            <p className="text-xl text-ink-600 leading-relaxed max-w-3xl mx-auto">
              A comprehensive agroforestry sustainability platform that combines satellite monitoring, 
              IoT sensors, and blockchain technology to track forest health, measure carbon sequestration, 
              and generate tokenized carbon credits with full digital MRV compliance.
            </p>
          </motion.div>

          {/* Capabilities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {capabilities.map((capability, index) => (
              <motion.div
                key={capability.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-shadow duration-300">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${capability.color}`}>
                      <capability.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-ink-900 mb-2">
                        {capability.title}
                      </h3>
                      <p className="text-ink-600 leading-relaxed">
                        {capability.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Key Value Proposition */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 text-center"
          >
            <div className="bg-gradient-to-r from-forest-50 to-mint-50 rounded-2xl p-8">
              <h3 className="text-2xl font-bold text-ink-900 mb-4">
                Digital Forest Management for the Carbon Economy
              </h3>
              <p className="text-ink-600 text-lg leading-relaxed max-w-2xl mx-auto">
                Transform your forest assets into verifiable carbon credits through our integrated 
                platform that combines cutting-edge monitoring technology with transparent, 
                automated reporting systems.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}