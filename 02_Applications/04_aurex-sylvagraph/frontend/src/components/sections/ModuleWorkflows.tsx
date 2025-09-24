/**
 * ModuleWorkflows Section
 * Detailed workflow diagrams for each Sylvagraph module category
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TreePine, 
  Satellite, 
  BarChart3, 
  Shield, 
  Coins, 
  ArrowRight, 
  ArrowDown,
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  Settings,
  FileText
} from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

const workflowCategories = [
  {
    id: 'core',
    title: 'Core Forest Monitoring',
    icon: TreePine,
    description: 'Comprehensive forest health tracking and data collection',
    color: 'forest'
  },
  {
    id: 'mrv',
    title: 'MRV (Measurement, Reporting, Verification)',
    icon: BarChart3,
    description: 'Automated carbon measurement and verification processes',
    color: 'mint'
  },
  {
    id: 'credits',
    title: 'Carbon Credit Generation',
    icon: Coins,
    description: 'Tokenization and marketplace integration workflows',
    color: 'sand'
  },
  {
    id: 'compliance',
    title: 'Regulatory Compliance',
    icon: Shield,
    description: 'Audit trails and regulatory reporting workflows',
    color: 'forest'
  }
]

const workflows = {
  core: {
    steps: [
      { id: 1, title: 'Forest Registration', description: 'GPS mapping and baseline assessment', icon: Database, duration: '1-2 weeks' },
      { id: 2, title: 'Sensor Deployment', description: 'IoT sensors and monitoring equipment setup', icon: Settings, duration: '2-3 weeks' },
      { id: 3, title: 'Satellite Integration', description: 'Connect satellite imagery feeds', icon: Satellite, duration: '1 week' },
      { id: 4, title: 'Data Collection', description: 'Continuous monitoring and data aggregation', icon: BarChart3, duration: 'Ongoing' },
      { id: 5, title: 'Health Analysis', description: 'AI-powered forest health assessment', icon: CheckCircle, duration: 'Real-time' }
    ],
    dataFlow: ['GPS coordinates', 'Soil sensors', 'Weather stations', 'Satellite imagery', 'Drone surveys']
  },
  mrv: {
    steps: [
      { id: 1, title: 'Baseline Measurement', description: 'Initial carbon stock assessment', icon: BarChart3, duration: '4-6 weeks' },
      { id: 2, title: 'Monitoring Period', description: 'Continuous carbon sequestration tracking', icon: Clock, duration: '12+ months' },
      { id: 3, title: 'Data Verification', description: 'Third-party verification of measurements', icon: Shield, duration: '2-4 weeks' },
      { id: 4, title: 'Report Generation', description: 'Automated MRV report creation', icon: FileText, duration: '1 week' },
      { id: 5, title: 'Credit Quantification', description: 'Calculate eligible carbon credits', icon: Coins, duration: '1-2 weeks' }
    ],
    dataFlow: ['Carbon stocks', 'Sequestration rates', 'Biomass calculations', 'Verification data', 'Credit quantities']
  },
  credits: {
    steps: [
      { id: 1, title: 'Credit Validation', description: 'Verify credit eligibility and quality', icon: CheckCircle, duration: '1-2 weeks' },
      { id: 2, title: 'Tokenization', description: 'Convert credits to blockchain tokens', icon: Coins, duration: '3-5 days' },
      { id: 3, title: 'Registry Upload', description: 'Submit to carbon credit registries', icon: Database, duration: '1 week' },
      { id: 4, title: 'Marketplace Listing', description: 'List credits on trading platforms', icon: Settings, duration: '2-3 days' },
      { id: 5, title: 'Transaction Settlement', description: 'Execute sales and transfer ownership', icon: ArrowRight, duration: 'Real-time' }
    ],
    dataFlow: ['Verified credits', 'Token metadata', 'Registry records', 'Market prices', 'Transaction history']
  },
  compliance: {
    steps: [
      { id: 1, title: 'Regulatory Mapping', description: 'Identify applicable regulations and standards', icon: Shield, duration: '1-2 weeks' },
      { id: 2, title: 'Audit Trail Setup', description: 'Configure logging and documentation', icon: FileText, duration: '1 week' },
      { id: 3, title: 'Compliance Monitoring', description: 'Continuous compliance status tracking', icon: AlertCircle, duration: 'Ongoing' },
      { id: 4, title: 'Report Generation', description: 'Automated compliance reporting', icon: BarChart3, duration: 'Scheduled' },
      { id: 5, title: 'Audit Support', description: 'Provide documentation for external audits', icon: CheckCircle, duration: 'As needed' }
    ],
    dataFlow: ['Regulatory requirements', 'Audit logs', 'Compliance status', 'Automated reports', 'Audit evidence']
  }
}

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

export const ModuleWorkflows: React.FC = () => {
  const [activeWorkflow, setActiveWorkflow] = useState('core')

  return (
    <section className="py-20 bg-gradient-to-b from-sand-50 to-white" aria-labelledby="module-workflows">
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
              Module Workflows
            </Badge>
            <h2 id="module-workflows" className="text-4xl font-bold text-ink-900 mb-6">
              Detailed Process Workflows
            </h2>
            <p className="text-xl text-ink-600 leading-relaxed max-w-3xl mx-auto">
              Explore the step-by-step workflows that power each module category in the 
              Sylvagraph platform, from forest monitoring to carbon credit generation.
            </p>
          </motion.div>

          {/* Workflow Category Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {workflowCategories.map((category, index) => {
              const colorClasses = getColorClasses(category.color)
              const isActive = activeWorkflow === category.id
              
              return (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  onClick={() => setActiveWorkflow(category.id)}
                  className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    isActive 
                      ? `bg-gradient-to-r ${colorClasses.gradient} text-white shadow-lg` 
                      : `${colorClasses.bg} ${colorClasses.text} hover:shadow-md`
                  }`}
                >
                  <category.icon className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-bold">{category.title}</div>
                    <div className={`text-sm ${isActive ? 'text-white opacity-90' : 'opacity-70'}`}>
                      {category.description}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Active Workflow Display */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeWorkflow}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Workflow Steps */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-ink-900 mb-8 text-center">
                  {workflowCategories.find(cat => cat.id === activeWorkflow)?.title} Workflow
                </h3>
                
                <div className="relative">
                  {/* Connecting Lines */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-forest-200 via-mint-200 to-sand-200 hidden lg:block" />

                  {/* Workflow Steps */}
                  <div className="space-y-8">
                    {workflows[activeWorkflow as keyof typeof workflows].steps.map((step, index) => {
                      const isEven = index % 2 === 0
                      
                      return (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                          className={`flex items-center ${
                            isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                          } flex-col lg:relative`}
                        >
                          {/* Step Number (Center on desktop) */}
                          <div className="lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2 z-10 mb-4 lg:mb-0">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-forest-500 to-mint-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                              {step.id}
                            </div>
                          </div>

                          {/* Content Card */}
                          <div className={`lg:w-5/12 ${isEven ? 'lg:mr-auto lg:pr-8' : 'lg:ml-auto lg:pl-8'}`}>
                            <Card className="p-6 hover:shadow-xl transition-all duration-300 group">
                              <div className="flex items-center mb-3">
                                <div className="p-3 bg-forest-50 rounded-lg mr-4">
                                  <step.icon className="h-6 w-6 text-forest-600" />
                                </div>
                                <div>
                                  <h4 className="text-xl font-bold text-ink-900 group-hover:text-forest-700 transition-colors">
                                    {step.title}
                                  </h4>
                                  <span className="text-sm font-medium px-2 py-1 rounded-full bg-mint-100 text-mint-700">
                                    {step.duration}
                                  </span>
                                </div>
                              </div>
                              
                              <p className="text-ink-600 leading-relaxed">
                                {step.description}
                              </p>
                            </Card>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Data Flow Visualization */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-sand-200"
              >
                <h4 className="text-xl font-bold text-ink-900 mb-6 text-center">
                  Data Flow & Integration Points
                </h4>
                
                <div className="flex flex-wrap justify-center items-center gap-4">
                  {workflows[activeWorkflow as keyof typeof workflows].dataFlow.map((dataPoint, index) => (
                    <React.Fragment key={dataPoint}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                        className="px-4 py-2 bg-forest-50 rounded-lg border border-forest-200 text-forest-700 font-medium text-sm"
                      >
                        {dataPoint}
                      </motion.div>
                      {index < workflows[activeWorkflow as keyof typeof workflows].dataFlow.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-mint-500" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Integration Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 bg-gradient-to-r from-forest-600 to-mint-600 rounded-2xl p-8 text-white text-center"
          >
            <h3 className="text-2xl font-bold mb-4">
              Integrated Workflow Management
            </h3>
            <p className="text-forest-100 text-lg mb-6 max-w-2xl mx-auto">
              All workflows seamlessly integrate through our central data platform, 
              ensuring consistent data flow and automated handoffs between processes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-2xl font-bold mb-2">30+</div>
                <div className="text-forest-100 text-sm">Integrated Modules</div>
              </div>
              <div>
                <div className="text-2xl font-bold mb-2">95%</div>
                <div className="text-forest-100 text-sm">Automation Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold mb-2">24/7</div>
                <div className="text-forest-100 text-sm">Process Monitoring</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}