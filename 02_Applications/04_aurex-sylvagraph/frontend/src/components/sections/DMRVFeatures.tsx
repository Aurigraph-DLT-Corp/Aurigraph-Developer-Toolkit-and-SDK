/**
 * DMRVFeatures Section
 * Comprehensive Digital Monitoring, Reporting, and Verification capabilities
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Satellite, 
  Monitor, 
  FileText, 
  Shield, 
  Camera,
  Zap,
  BarChart3,
  Clock,
  CheckCircle,
  AlertTriangle,
  Database,
  Wifi,
  Eye,
  Settings,
  TrendingUp,
  Award,
  Globe,
  Smartphone,
  CloudRain,
  Thermometer,
  Wind,
  MapPin,
  TreePine
} from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

const dmrvCategories = [
  {
    id: 'monitoring',
    title: 'Digital Monitoring',
    icon: Monitor,
    description: 'Real-time forest health and carbon sequestration monitoring',
    color: 'forest',
    features: [
      'Satellite imagery analysis (Landsat, Sentinel, Planet)',
      'IoT sensor networks for environmental data',
      'Drone-based aerial surveys and LiDAR scanning',
      'Ground-based measurements and photo documentation',
      'Weather station integration and climate monitoring',
      'Biodiversity tracking with camera traps',
      'Soil carbon measurement systems',
      'Tree growth and mortality tracking'
    ]
  },
  {
    id: 'reporting',
    title: 'Automated Reporting',
    icon: FileText,
    description: 'Comprehensive reporting system for all stakeholders',
    color: 'mint',
    features: [
      'Real-time dashboard with key performance indicators',
      'Automated monthly and quarterly reports',
      'Custom report generation for different stakeholders',
      'Regulatory compliance reporting (VCS, Gold Standard, CORSIA)',
      'ESG reporting integration for corporate clients',
      'Transparent public reporting portal',
      'API access for third-party integrations',
      'Multi-language report generation'
    ]
  },
  {
    id: 'verification',
    title: 'Third-Party Verification',
    icon: Shield,
    description: 'Independent verification and audit capabilities',
    color: 'sand',
    features: [
      'Automated verification workflows',
      'Third-party verifier portal access',
      'Blockchain-based audit trail',
      'Document version control and tracking',
      'Remote verification capabilities',
      'Quality assurance protocols',
      'Dispute resolution mechanisms',
      'Certification tracking and management'
    ]
  }
]

const dmrvTechnologies = [
  {
    category: 'Satellite Monitoring',
    icon: Satellite,
    technologies: [
      { name: 'Landsat 8/9', purpose: 'Forest cover change detection', resolution: '30m', frequency: '16 days' },
      { name: 'Sentinel-1/2', purpose: 'Deforestation alerts', resolution: '10-20m', frequency: '5-10 days' },
      { name: 'Planet Labs', purpose: 'High-resolution monitoring', resolution: '3-5m', frequency: 'Daily' },
      { name: 'MODIS Terra/Aqua', purpose: 'Fire and disturbance detection', resolution: '250m', frequency: '1-2 days' }
    ]
  },
  {
    category: 'IoT Sensor Network',
    icon: Wifi,
    technologies: [
      { name: 'Environmental Sensors', purpose: 'Temperature, humidity, rainfall', resolution: 'Point data', frequency: 'Hourly' },
      { name: 'Soil Sensors', purpose: 'Soil moisture, pH, nutrients', resolution: 'Point data', frequency: 'Daily' },
      { name: 'Dendrometers', purpose: 'Tree growth measurement', resolution: '0.1mm', frequency: 'Daily' },
      { name: 'Camera Traps', purpose: 'Wildlife and biodiversity monitoring', resolution: 'HD video/photo', frequency: 'Event-triggered' }
    ]
  },
  {
    category: 'Drone Technology',
    icon: Camera,
    technologies: [
      { name: 'RGB Imaging', purpose: 'Visual forest assessment', resolution: '2-5cm', frequency: 'Monthly' },
      { name: 'LiDAR Scanning', purpose: '3D forest structure mapping', resolution: '10cm', frequency: 'Quarterly' },
      { name: 'Multispectral', purpose: 'Vegetation health analysis', resolution: '5cm', frequency: 'Bi-weekly' },
      { name: 'Thermal Imaging', purpose: 'Fire risk and stress detection', resolution: '10cm', frequency: 'Weekly' }
    ]
  }
]

const dmrvMetrics = [
  {
    category: 'Forest Health',
    metrics: [
      { name: 'Forest Cover', unit: '% coverage', target: '>95%', current: '97.3%', trend: 'up' },
      { name: 'Canopy Density', unit: '% cover', target: '>80%', current: '84.2%', trend: 'stable' },
      { name: 'Biodiversity Index', unit: 'Shannon Index', target: '>2.0', current: '2.34', trend: 'up' },
      { name: 'Tree Mortality', unit: '% annual', target: '<2%', current: '1.8%', trend: 'down' }
    ]
  },
  {
    category: 'Carbon Sequestration',
    metrics: [
      { name: 'Total Carbon Stock', unit: 'tCO2e/ha', target: '>200', current: '247', trend: 'up' },
      { name: 'Annual Sequestration', unit: 'tCO2e/ha/yr', target: '>8', current: '9.2', trend: 'up' },
      { name: 'Soil Carbon', unit: 'tC/ha', target: '>50', current: '62', trend: 'stable' },
      { name: 'Biomass Growth', unit: 'm³/ha/yr', target: '>12', current: '14.5', trend: 'up' }
    ]
  }
]

const verificationStandards = [
  {
    standard: 'VCS (Verified Carbon Standard)',
    coverage: 'Global voluntary carbon market',
    features: ['AFOLU methodologies', 'Jurisdictional REDD+', 'Nested approaches', 'Double counting prevention'],
    integration: 'Full API integration'
  },
  {
    standard: 'Gold Standard',
    coverage: 'Premium voluntary carbon credits',
    features: ['Sustainable development goals', 'Community co-benefits', 'Gender equality', 'Human rights safeguards'],
    integration: 'Certified partnership'
  },
  {
    standard: 'CORSIA (ICAO)',
    coverage: 'International aviation offsets',
    features: ['Eligible unit criteria', 'Registry requirements', 'Cancellation procedures', 'Sustainability criteria'],
    integration: 'ICAO approved'
  },
  {
    standard: 'California Cap-and-Trade',
    coverage: 'Compliance carbon market',
    features: ['Forest offset protocols', 'Permanence requirements', 'Buffer pool contributions', 'Leakage assessments'],
    integration: 'ARB approved'
  }
]

const getColorClasses = (color: string) => {
  const colors = {
    forest: { 
      bg: 'bg-forest-100', 
      text: 'text-forest-700', 
      border: 'border-forest-200',
      gradient: 'from-forest-500 to-forest-600'
    },
    mint: { 
      bg: 'bg-mint-100', 
      text: 'text-mint-700', 
      border: 'border-mint-200',
      gradient: 'from-mint-500 to-mint-600'
    },
    sand: { 
      bg: 'bg-sand-100', 
      text: 'text-sand-700', 
      border: 'border-sand-200',
      gradient: 'from-sand-600 to-sand-700'
    }
  }
  return colors[color as keyof typeof colors] || colors.forest
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />
    case 'down': return <TrendingUp className="h-4 w-4 text-red-500 transform rotate-180" />
    default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />
  }
}

export const DMRVFeatures: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('monitoring')
  const [activeTechCategory, setActiveTechCategory] = useState(0)

  return (
    <section className="py-20 bg-gradient-to-b from-white to-sand-50" aria-labelledby="dmrv-features">
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
              DMRV Technology
            </Badge>
            <h2 id="dmrv-features" className="text-4xl font-bold text-ink-900 mb-6">
              Digital Monitoring, Reporting & Verification
            </h2>
            <p className="text-xl text-ink-600 leading-relaxed max-w-3xl mx-auto">
              Advanced DMRV system combining satellite monitoring, IoT sensors, and AI analytics 
              to provide transparent, verifiable forest carbon data in real-time.
            </p>
          </motion.div>

          {/* DMRV Category Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {dmrvCategories.map((category, index) => {
              const colorClasses = getColorClasses(category.color)
              const isActive = activeCategory === category.id
              
              return (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                    isActive 
                      ? `bg-gradient-to-r ${colorClasses.gradient} text-white shadow-xl` 
                      : `${colorClasses.bg} ${colorClasses.text} hover:shadow-lg`
                  }`}
                >
                  <category.icon className="h-6 w-6 mr-3" />
                  <div className="text-left">
                    <div className="font-bold text-lg">{category.title}</div>
                    <div className={`text-sm ${isActive ? 'text-white opacity-90' : 'opacity-70'}`}>
                      {category.description}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Active Category Features */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mb-16"
            >
              {dmrvCategories.map(category => {
                if (category.id !== activeCategory) return null
                
                return (
                  <Card key={category.id} className="p-8">
                    <h3 className="text-2xl font-bold text-ink-900 mb-6 text-center">
                      {category.title} Capabilities
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.features.map((feature, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.1 }}
                          className="flex items-center p-3 bg-sand-50 rounded-lg"
                        >
                          <CheckCircle className="h-5 w-5 text-forest-500 mr-3 flex-shrink-0" />
                          <span className="text-ink-700">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                )
              })}
            </motion.div>
          </AnimatePresence>

          {/* Technology Stack */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <h3 className="text-3xl font-bold text-ink-900 mb-8 text-center">
              DMRV Technology Stack
            </h3>
            
            {/* Technology Category Selector */}
            <div className="flex justify-center gap-4 mb-8">
              {dmrvTechnologies.map((tech, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTechCategory(index)}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTechCategory === index
                      ? 'bg-forest-600 text-white shadow-lg'
                      : 'bg-sand-100 text-ink-700 hover:bg-sand-200'
                  }`}
                >
                  <tech.icon className="h-5 w-5 mr-2" />
                  {tech.category}
                </button>
              ))}
            </div>

            {/* Technology Details */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTechCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-sand-200"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-sand-200">
                        <th className="text-left py-3 px-4 font-semibold text-ink-900">Technology</th>
                        <th className="text-left py-3 px-4 font-semibold text-ink-900">Purpose</th>
                        <th className="text-center py-3 px-4 font-semibold text-ink-900">Resolution</th>
                        <th className="text-center py-3 px-4 font-semibold text-ink-900">Frequency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dmrvTechnologies[activeTechCategory].technologies.map((tech, index) => (
                        <motion.tr
                          key={tech.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className={index % 2 === 0 ? 'bg-sand-25' : 'bg-white'}
                        >
                          <td className="py-3 px-4 font-medium text-ink-900">{tech.name}</td>
                          <td className="py-3 px-4 text-ink-600">{tech.purpose}</td>
                          <td className="text-center py-3 px-4 text-ink-600">{tech.resolution}</td>
                          <td className="text-center py-3 px-4 text-ink-600">{tech.frequency}</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Real-time Metrics Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-16"
          >
            <h3 className="text-3xl font-bold text-ink-900 mb-8 text-center">
              Live DMRV Metrics Dashboard
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {dmrvMetrics.map((metricCategory, categoryIndex) => (
                <motion.div
                  key={metricCategory.category}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.7 + categoryIndex * 0.1 }}
                >
                  <Card className="p-6">
                    <h4 className="text-xl font-bold text-ink-900 mb-4">
                      {metricCategory.category}
                    </h4>
                    <div className="space-y-3">
                      {metricCategory.metrics.map((metric, index) => (
                        <div key={metric.name} className="flex items-center justify-between p-3 bg-sand-50 rounded-lg">
                          <div className="flex-1">
                            <div className="font-semibold text-ink-900">{metric.name}</div>
                            <div className="text-sm text-ink-600">{metric.unit}</div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center">
                              <span className="font-bold text-lg text-ink-900 mr-2">{metric.current}</span>
                              {getTrendIcon(metric.trend)}
                            </div>
                            <div className="text-xs text-ink-500">Target: {metric.target}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Verification Standards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mb-16"
          >
            <h3 className="text-3xl font-bold text-ink-900 mb-8 text-center">
              Integrated Verification Standards
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {verificationStandards.map((standard, index) => (
                <motion.div
                  key={standard.standard}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
                >
                  <Card className="p-6 h-full">
                    <div className="flex items-center mb-4">
                      <Award className="h-6 w-6 text-forest-600 mr-3" />
                      <div>
                        <h4 className="text-lg font-bold text-ink-900">{standard.standard}</h4>
                        <p className="text-sm text-ink-600">{standard.coverage}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h5 className="font-semibold text-ink-900 mb-2">Key Features:</h5>
                      <ul className="space-y-1">
                        {standard.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start text-sm">
                            <CheckCircle className="h-3 w-3 text-forest-500 mr-2 flex-shrink-0 mt-1" />
                            <span className="text-ink-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-auto">
                      <Badge variant="secondary" className="bg-mint-100 text-mint-700">
                        {standard.integration}
                      </Badge>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* DMRV Performance Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="bg-gradient-to-r from-forest-600 to-mint-600 rounded-2xl p-8 text-white text-center"
          >
            <div className="flex justify-center mb-4">
              <BarChart3 className="h-12 w-12 text-forest-100" />
            </div>
            <h3 className="text-2xl font-bold mb-4">
              DMRV Platform Performance
            </h3>
            <p className="text-forest-100 text-lg mb-8 max-w-2xl mx-auto">
              Industry-leading accuracy and reliability in forest carbon monitoring, 
              reporting, and verification processes.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-bold mb-2">99.7%</div>
                <div className="text-forest-100 text-sm">Data Accuracy</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">24/7</div>
                <div className="text-forest-100 text-sm">Real-time Monitoring</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">15min</div>
                <div className="text-forest-100 text-sm">Alert Response Time</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">100%</div>
                <div className="text-forest-100 text-sm">Audit Compliance</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}