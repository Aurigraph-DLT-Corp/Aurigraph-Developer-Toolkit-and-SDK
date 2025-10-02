/**
 * TrustStrip Section
 * Compliance badges, certifications, and trust indicators
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Award, CheckCircle, Globe, Lock, Zap } from 'lucide-react'
import { Badge } from '../ui/badge'

const certifications = [
  {
    icon: Shield,
    name: 'VCS Verified',
    description: 'Verified Carbon Standard',
    color: 'text-forest-600',
    bg: 'bg-forest-50'
  },
  {
    icon: Award,
    name: 'Gold Standard',
    description: 'Premium carbon credits',
    color: 'text-mint-600',
    bg: 'bg-mint-50'
  },
  {
    icon: CheckCircle,
    name: 'CORSIA Eligible',
    description: 'Aviation offset approved',
    color: 'text-sand-700',
    bg: 'bg-sand-50'
  },
  {
    icon: Globe,
    name: 'EU ETS Ready',
    description: 'European compliance',
    color: 'text-forest-700',
    bg: 'bg-forest-100'
  },
  {
    icon: Lock,
    name: 'ISO 27001',
    description: 'Security certified',
    color: 'text-mint-700',
    bg: 'bg-mint-100'
  },
  {
    icon: Zap,
    name: 'API First',
    description: 'Integration ready',
    color: 'text-sand-600',
    bg: 'bg-sand-100'
  }
]

const stats = [
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '2.5M+', label: 'Hectares Monitored' },
  { value: '1.8M', label: 'Credits Generated' },
  { value: '15+', label: 'Countries Active' }
]

const partnerships = [
  { name: 'Verra', role: 'Standards Partner' },
  { name: 'Gold Standard', role: 'Certification Partner' },
  { name: 'ICAO', role: 'CORSIA Recognition' },
  { name: 'Climate Action Reserve', role: 'Registry Partner' }
]

export const TrustStrip: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-sand-50 to-white border-t border-sand-200" aria-labelledby="trust-strip">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <Badge variant="secondary" className="mb-4 bg-forest-100 text-forest-700">
              Trusted & Certified
            </Badge>
            <h2 id="trust-strip" className="text-3xl font-bold text-ink-900 mb-4">
              Industry-Leading Compliance & Security
            </h2>
            <p className="text-lg text-ink-600 max-w-3xl mx-auto">
              Sylvagraph meets the highest standards for carbon credit verification, 
              security, and regulatory compliance worldwide.
            </p>
          </motion.div>

          {/* Certifications Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
            {certifications.map((cert, index) => (
              <motion.div
                key={cert.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className={`${cert.bg} rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300 border hover:border-forest-200`}>
                  <div className={`${cert.color} mb-3 flex justify-center`}>
                    <cert.icon className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-ink-900 text-sm mb-1">{cert.name}</h3>
                  <p className="text-xs text-ink-600 leading-tight">{cert.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white rounded-2xl p-8 shadow-lg border border-sand-200 mb-16"
          >
            <h3 className="text-2xl font-bold text-ink-900 mb-8 text-center">
              Platform Performance Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.7 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl font-bold text-forest-600 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-ink-600 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Partnerships */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center"
          >
            <h3 className="text-lg font-semibold text-ink-900 mb-6">
              Trusted by Leading Organizations
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {partnerships.map((partner, index) => (
                <motion.div
                  key={partner.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                  className="bg-white rounded-lg p-4 border border-sand-200 hover:border-forest-200 transition-colors"
                >
                  <div className="font-semibold text-ink-900 mb-1 text-sm">
                    {partner.name}
                  </div>
                  <div className="text-xs text-ink-600">
                    {partner.role}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Security Statement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="mt-16 bg-gradient-to-r from-forest-600 to-mint-600 rounded-2xl p-8 text-white text-center"
          >
            <div className="flex justify-center mb-4">
              <Lock className="h-12 w-12 text-forest-100" />
            </div>
            <h3 className="text-2xl font-bold mb-4">
              Enterprise-Grade Security
            </h3>
            <p className="text-forest-100 max-w-2xl mx-auto">
              Your data is protected with bank-level encryption, multi-factor authentication, 
              and continuous security monitoring. SOC 2 Type II compliant with annual audits.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}