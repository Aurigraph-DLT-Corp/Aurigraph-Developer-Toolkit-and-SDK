/**
 * ProcessTimeline Section
 * 7-step process timeline for Sylvagraph implementation
 */

import React from 'react'
import { motion } from 'framer-motion'
import { 
  MapPin, 
  Satellite, 
  BarChart3, 
  Shield, 
  Coins, 
  TrendingUp, 
  CheckCircle 
} from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

const timelineSteps = [
  {
    step: 1,
    icon: MapPin,
    title: 'Forest Registration',
    description: 'Register your forest area with GPS coordinates and initial assessment.',
    duration: '1-2 weeks',
    deliverable: 'Digital forest baseline',
    color: 'forest'
  },
  {
    step: 2,
    icon: Satellite,
    title: 'Monitoring Setup',
    description: 'Deploy IoT sensors and establish satellite monitoring protocols.',
    duration: '2-3 weeks',
    deliverable: 'Real-time monitoring system',
    color: 'mint'
  },
  {
    step: 3,
    icon: BarChart3,
    title: 'Data Collection',
    description: 'Continuous monitoring of forest health, growth rates, and carbon sequestration.',
    duration: 'Ongoing',
    deliverable: 'Historical data baseline',
    color: 'sand'
  },
  {
    step: 4,
    icon: Shield,
    title: 'MRV Verification',
    description: 'Automated measurement, reporting, and third-party verification processes.',
    duration: '3-4 months',
    deliverable: 'Verified carbon credits',
    color: 'forest'
  },
  {
    step: 5,
    icon: Coins,
    title: 'Credit Generation',
    description: 'Tokenize verified carbon credits and prepare for marketplace listing.',
    duration: '1-2 weeks',
    deliverable: 'Tokenized carbon credits',
    color: 'mint'
  },
  {
    step: 6,
    icon: TrendingUp,
    title: 'Market Integration',
    description: 'List credits on carbon marketplaces and optimize pricing strategies.',
    duration: '2-3 weeks',
    deliverable: 'Market-ready credits',
    color: 'sand'
  },
  {
    step: 7,
    icon: CheckCircle,
    title: 'Revenue Realization',
    description: 'Execute carbon credit sales and receive revenue from forest assets.',
    duration: 'Ongoing',
    deliverable: 'Sustainable revenue stream',
    color: 'forest'
  }
]

const getColorClasses = (color: string) => {
  const colors = {
    forest: {
      bg: 'bg-forest-100',
      text: 'text-forest-700',
      gradient: 'from-forest-500 to-forest-600',
      border: 'border-forest-200'
    },
    mint: {
      bg: 'bg-mint-100',
      text: 'text-mint-700',
      gradient: 'from-mint-500 to-mint-600',
      border: 'border-mint-200'
    },
    sand: {
      bg: 'bg-sand-100',
      text: 'text-sand-700',
      gradient: 'from-sand-600 to-sand-700',
      border: 'border-sand-200'
    }
  }
  return colors[color as keyof typeof colors] || colors.forest
}

export const ProcessTimeline: React.FC = () => {
  return (
    <section className="py-20 bg-white" aria-labelledby="process-timeline">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <Badge variant="secondary" className="mb-4 bg-mint-100 text-mint-700">
              Implementation Process
            </Badge>
            <h2 id="process-timeline" className="text-4xl font-bold text-ink-900 mb-6">
              From Forest to Carbon Credits
            </h2>
            <p className="text-xl text-ink-600 leading-relaxed max-w-3xl mx-auto">
              Follow our proven 7-step process to transform your forest assets into verified 
              carbon credits with full transparency and automated compliance.
            </p>
          </motion.div>

          {/* Timeline */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-forest-200 via-mint-200 to-sand-200 hidden lg:block" />

            {/* Timeline Steps */}
            <div className="space-y-12 lg:space-y-16">
              {timelineSteps.map((step, index) => {
                const colorClasses = getColorClasses(step.color)
                const isEven = index % 2 === 0

                return (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className={`flex items-center ${
                      isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                    } flex-col lg:relative`}
                  >
                    {/* Step Number (Center on desktop) */}
                    <div className="lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2 z-10 mb-4 lg:mb-0">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${colorClasses.gradient} flex items-center justify-center text-white font-bold text-xl shadow-lg`}>
                        {step.step}
                      </div>
                    </div>

                    {/* Content Card */}
                    <div className={`lg:w-5/12 ${isEven ? 'lg:mr-auto lg:pr-8' : 'lg:ml-auto lg:pl-8'}`}>
                      <Card className="p-6 hover:shadow-xl transition-all duration-300 group">
                        {/* Icon and Title */}
                        <div className="flex items-center mb-4">
                          <div className={`p-3 rounded-lg ${colorClasses.bg} mr-4`}>
                            <step.icon className={`h-6 w-6 ${colorClasses.text}`} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-ink-900 group-hover:text-forest-700 transition-colors">
                              {step.title}
                            </h3>
                            <span className={`text-sm font-medium px-2 py-1 rounded-full ${colorClasses.bg} ${colorClasses.text}`}>
                              {step.duration}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-ink-600 leading-relaxed mb-4">
                          {step.description}
                        </p>

                        {/* Deliverable */}
                        <div className={`border-l-4 ${colorClasses.border} pl-4 py-2 bg-sand-50 rounded-r-lg`}>
                          <div className="text-sm font-semibold text-ink-700">Deliverable:</div>
                          <div className="text-sm text-ink-600">{step.deliverable}</div>
                        </div>
                      </Card>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Summary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="text-center mt-16"
          >
            <div className="bg-gradient-to-br from-sand-50 to-forest-50 rounded-2xl p-8 border border-sand-200">
              <h3 className="text-2xl font-bold text-ink-900 mb-4">
                Ready to Get Started?
              </h3>
              <p className="text-ink-600 text-lg mb-6 max-w-2xl mx-auto">
                Begin your journey from forest ownership to carbon credit revenue. 
                Our experts will guide you through every step of the process.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="bg-forest-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-forest-700 transition-colors">
                  Start Your Forest Assessment
                </button>
                <button className="border-2 border-forest-600 text-forest-600 px-8 py-3 rounded-lg font-semibold hover:bg-forest-50 transition-colors">
                  Download Process Guide
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}