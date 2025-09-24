/**
 * PersonaCards Section
 * Target user personas for Sylvagraph platform
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Building2, Sprout, TrendingUp, Globe } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

const personas = [
  {
    icon: Building2,
    title: 'ESG Managers',
    subtitle: 'Corporate Sustainability',
    description: 'Track and report forest-based carbon offsets for corporate ESG compliance and sustainability reporting.',
    keyBenefits: ['Automated ESG reporting', 'Verified carbon credits', 'Regulatory compliance'],
    iconColor: 'text-forest-600',
    bgColor: 'bg-forest-50'
  },
  {
    icon: Sprout,
    title: 'Forest Owners',
    subtitle: 'Landowners & Farmers',
    description: 'Monetize your forest assets through carbon credit generation while maintaining sustainable forest management.',
    keyBenefits: ['Revenue generation', 'Forest health monitoring', 'Sustainable practices'],
    iconColor: 'text-mint-600',
    bgColor: 'bg-mint-50'
  },
  {
    icon: TrendingUp,
    title: 'Carbon Traders',
    subtitle: 'Market Participants',
    description: 'Access high-quality, verified carbon credits from managed forests with transparent provenance and real-time data.',
    keyBenefits: ['Market transparency', 'Quality assurance', 'Real-time pricing'],
    iconColor: 'text-sand-700',
    bgColor: 'bg-sand-50'
  },
  {
    icon: Globe,
    title: 'NGOs & Agencies',
    subtitle: 'Conservation Organizations',
    description: 'Monitor forest conservation projects and track progress toward climate and biodiversity goals.',
    keyBenefits: ['Impact measurement', 'Project monitoring', 'Conservation tracking'],
    iconColor: 'text-forest-700',
    bgColor: 'bg-forest-100'
  }
]

export const PersonaCards: React.FC = () => {
  return (
    <section className="py-20 bg-white" aria-labelledby="persona-cards">
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
              For Everyone
            </Badge>
            <h2 id="persona-cards" className="text-4xl font-bold text-ink-900 mb-6">
              Who Uses Sylvagraph?
            </h2>
            <p className="text-xl text-ink-600 leading-relaxed max-w-3xl mx-auto">
              From corporate sustainability managers to forest owners, Sylvagraph serves 
              diverse stakeholders in the carbon economy ecosystem.
            </p>
          </motion.div>

          {/* Personas Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            {personas.map((persona, index) => (
              <motion.div
                key={persona.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="h-full"
              >
                <Card className="p-8 h-full hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer group">
                  {/* Icon and Header */}
                  <div className="flex items-center mb-6">
                    <div className={`p-4 rounded-xl ${persona.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                      <persona.icon className={`h-8 w-8 ${persona.iconColor}`} />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xl font-bold text-ink-900 group-hover:text-forest-700 transition-colors">
                        {persona.title}
                      </h3>
                      <p className="text-ink-500 font-medium">
                        {persona.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-ink-600 leading-relaxed mb-6">
                    {persona.description}
                  </p>

                  {/* Key Benefits */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-ink-700 mb-3">Key Benefits:</h4>
                    <ul className="space-y-2">
                      {persona.keyBenefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center text-sm text-ink-600">
                          <div className="w-2 h-2 bg-forest-500 rounded-full mr-3 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Hover Effect */}
                  <div className="mt-6 pt-6 border-t border-sand-200 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-sm font-medium text-forest-600">
                      Learn more about solutions for {persona.title.toLowerCase()} →
                    </p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-16"
          >
            <div className="bg-gradient-to-r from-forest-600 to-mint-600 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">
                Ready to Transform Your Forest Management?
              </h3>
              <p className="text-forest-100 text-lg mb-6 max-w-2xl mx-auto">
                Join leading organizations using Sylvagraph to create sustainable value 
                from their forest assets while contributing to global climate goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-white text-forest-600 px-8 py-3 rounded-lg font-semibold hover:bg-sand-50 transition-colors">
                  Start Demo Project
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-forest-600 transition-colors">
                  Schedule Consultation
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}