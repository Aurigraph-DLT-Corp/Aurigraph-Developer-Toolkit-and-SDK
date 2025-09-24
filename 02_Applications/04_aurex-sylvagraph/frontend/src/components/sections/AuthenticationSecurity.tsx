/**
 * AuthenticationSecurity Section
 * Comprehensive overview of authentication, authorization, and security features
 */

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Shield, 
  Lock, 
  Key, 
  UserCheck, 
  Eye, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Users,
  Database,
  Network,
  Smartphone
} from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

const authFeatures = [
  {
    icon: UserCheck,
    title: 'Multi-Factor Authentication',
    description: 'Secure login with SMS, email, and authenticator app verification',
    details: ['TOTP/HOTP support', 'Biometric authentication', 'Hardware security keys', 'Backup codes']
  },
  {
    icon: Key,
    title: 'Role-Based Access Control',
    description: 'Granular permissions based on user roles and responsibilities',
    details: ['Forest Owner', 'ESG Manager', 'Auditor', 'Administrator', 'Read-only Observer']
  },
  {
    icon: Eye,
    title: 'Audit Trail & Monitoring',
    description: 'Complete logging of all user actions and system activities',
    details: ['Real-time monitoring', 'Compliance reporting', 'Anomaly detection', 'Forensic analysis']
  },
  {
    icon: Database,
    title: 'Data Encryption',
    description: 'End-to-end encryption for data at rest and in transit',
    details: ['AES-256 encryption', 'TLS 1.3 transport', 'Key rotation', 'Zero-knowledge architecture']
  }
]

const securityLayers = [
  {
    layer: 'Application Layer',
    features: ['OAuth 2.0 / OpenID Connect', 'JWT token management', 'Session security', 'API rate limiting'],
    color: 'forest'
  },
  {
    layer: 'Network Layer',
    features: ['WAF protection', 'DDoS mitigation', 'IP whitelisting', 'VPN support'],
    color: 'mint'
  },
  {
    layer: 'Infrastructure Layer',
    features: ['Container security', 'Network segmentation', 'Intrusion detection', 'Vulnerability scanning'],
    color: 'sand'
  },
  {
    layer: 'Data Layer',
    features: ['Database encryption', 'Backup encryption', 'Access logging', 'Data masking'],
    color: 'forest'
  }
]

const complianceStandards = [
  { name: 'SOC 2 Type II', description: 'Security, availability, processing integrity' },
  { name: 'ISO 27001', description: 'Information security management' },
  { name: 'GDPR Compliant', description: 'Data protection and privacy' },
  { name: 'CCPA Ready', description: 'California consumer privacy' },
  { name: 'HIPAA Ready', description: 'Healthcare data protection' }
]

const getColorClasses = (color: string) => {
  const colors = {
    forest: { bg: 'bg-forest-100', text: 'text-forest-700', border: 'border-forest-200' },
    mint: { bg: 'bg-mint-100', text: 'text-mint-700', border: 'border-mint-200' },
    sand: { bg: 'bg-sand-100', text: 'text-sand-700', border: 'border-sand-200' }
  }
  return colors[color as keyof typeof colors] || colors.forest
}

export const AuthenticationSecurity: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-sand-50" aria-labelledby="authentication-security">
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
              Security & Access Control
            </Badge>
            <h2 id="authentication-security" className="text-4xl font-bold text-ink-900 mb-6">
              Enterprise-Grade Security Architecture
            </h2>
            <p className="text-xl text-ink-600 leading-relaxed max-w-3xl mx-auto">
              Protect your forest assets and carbon credit data with our comprehensive security 
              framework designed for the highest compliance standards.
            </p>
          </motion.div>

          {/* Authentication Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {authFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-xl transition-all duration-300 group">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-forest-50 rounded-lg mr-4 group-hover:bg-forest-100 transition-colors">
                      <feature.icon className="h-6 w-6 text-forest-600" />
                    </div>
                    <h3 className="text-xl font-bold text-ink-900 group-hover:text-forest-700 transition-colors">
                      {feature.title}
                    </h3>
                  </div>
                  
                  <p className="text-ink-600 leading-relaxed mb-4">
                    {feature.description}
                  </p>

                  <div className="space-y-2">
                    {feature.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-center text-sm text-ink-600">
                        <CheckCircle className="h-4 w-4 text-forest-500 mr-2 flex-shrink-0" />
                        {detail}
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Security Layers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <h3 className="text-3xl font-bold text-ink-900 mb-8 text-center">
              Multi-Layer Security Architecture
            </h3>
            <div className="space-y-6">
              {securityLayers.map((layer, index) => {
                const colorClasses = getColorClasses(layer.color)
                return (
                  <motion.div
                    key={layer.layer}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                    className={`border-l-4 ${colorClasses.border} ${colorClasses.bg} rounded-r-xl p-6`}
                  >
                    <h4 className={`text-xl font-bold ${colorClasses.text} mb-3`}>
                      {layer.layer}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {layer.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-sm text-ink-700">
                          <Shield className="h-3 w-3 text-forest-600 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* User Access Management */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white rounded-2xl p-8 shadow-lg border border-sand-200 mb-16"
          >
            <h3 className="text-2xl font-bold text-ink-900 mb-6 text-center">
              Granular Access Control Matrix
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sand-200">
                    <th className="text-left py-3 px-4 font-semibold text-ink-900">Role</th>
                    <th className="text-center py-3 px-4 font-semibold text-ink-900">Forest Data</th>
                    <th className="text-center py-3 px-4 font-semibold text-ink-900">MRV Reports</th>
                    <th className="text-center py-3 px-4 font-semibold text-ink-900">Carbon Credits</th>
                    <th className="text-center py-3 px-4 font-semibold text-ink-900">System Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { role: 'Forest Owner', data: 'Full', reports: 'Edit', credits: 'Manage', admin: 'None' },
                    { role: 'ESG Manager', data: 'Read', reports: 'View', credits: 'Purchase', admin: 'None' },
                    { role: 'Auditor', data: 'Read', reports: 'Verify', credits: 'Audit', admin: 'None' },
                    { role: 'Administrator', data: 'Full', reports: 'Full', credits: 'Full', admin: 'Full' },
                    { role: 'Observer', data: 'Read', reports: 'View', credits: 'View', admin: 'None' }
                  ].map((row, index) => (
                    <tr key={row.role} className={index % 2 === 0 ? 'bg-sand-25' : 'bg-white'}>
                      <td className="py-3 px-4 font-medium text-ink-900">{row.role}</td>
                      <td className="text-center py-3 px-4 text-ink-600">{row.data}</td>
                      <td className="text-center py-3 px-4 text-ink-600">{row.reports}</td>
                      <td className="text-center py-3 px-4 text-ink-600">{row.credits}</td>
                      <td className="text-center py-3 px-4 text-ink-600">{row.admin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Compliance Standards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mb-16"
          >
            <h3 className="text-2xl font-bold text-ink-900 mb-8 text-center">
              Compliance & Certifications
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {complianceStandards.map((standard, index) => (
                <motion.div
                  key={standard.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                  className="bg-white rounded-lg p-4 text-center border border-sand-200 hover:border-forest-200 transition-colors"
                >
                  <div className="w-12 h-12 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="h-6 w-6 text-forest-600" />
                  </div>
                  <h4 className="font-bold text-ink-900 mb-2 text-sm">{standard.name}</h4>
                  <p className="text-xs text-ink-600 leading-tight">{standard.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Security Monitoring Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="bg-gradient-to-r from-forest-600 to-mint-600 rounded-2xl p-8 text-white text-center"
          >
            <div className="flex justify-center mb-4">
              <Network className="h-12 w-12 text-forest-100" />
            </div>
            <h3 className="text-2xl font-bold mb-4">
              24/7 Security Operations Center
            </h3>
            <p className="text-forest-100 max-w-2xl mx-auto mb-6">
              Our dedicated security team monitors your forest data around the clock, 
              with automated threat detection and immediate incident response protocols.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div>
                <div className="text-2xl font-bold mb-2">99.99%</div>
                <div className="text-forest-100 text-sm">Security Uptime</div>
              </div>
              <div>
                <div className="text-2xl font-bold mb-2">&lt;5min</div>
                <div className="text-forest-100 text-sm">Incident Response</div>
              </div>
              <div>
                <div className="text-2xl font-bold mb-2">Zero</div>
                <div className="text-forest-100 text-sm">Data Breaches</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}