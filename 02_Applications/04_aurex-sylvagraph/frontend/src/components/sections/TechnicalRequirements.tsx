/**
 * TechnicalRequirements Section
 * Comprehensive technical requirements for frontend, backend, and deployment
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Monitor, 
  Server, 
  Cloud, 
  Code, 
  Database, 
  Layers, 
  Cpu,
  HardDrive,
  Network,
  Shield,
  Settings,
  CheckCircle,
  AlertTriangle,
  Zap,
  Globe,
  Container,
  GitBranch,
  Activity
} from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

const requirementCategories = [
  {
    id: 'frontend',
    title: 'Frontend Requirements',
    icon: Monitor,
    description: 'Client-side technologies and user interface specifications',
    color: 'forest'
  },
  {
    id: 'backend',
    title: 'Backend Requirements',
    icon: Server,
    description: 'Server-side infrastructure and API specifications',
    color: 'mint'
  },
  {
    id: 'deployment',
    title: 'Deployment Requirements',
    icon: Cloud,
    description: 'Infrastructure, scaling, and operational requirements',
    color: 'sand'
  }
]

const moduleRequirements = {
  // DMRV Modules
  'forest-health-monitoring': {
    frontend: {
      technologies: ['React 18', 'TypeScript', 'Leaflet Maps', 'Chart.js', 'WebSocket'],
      dependencies: ['react-leaflet', 'chartjs-react', 'socket.io-client', '@types/leaflet'],
      features: ['Real-time map visualization', 'Interactive charts', 'Live data streaming', 'Alert notifications'],
      performance: ['60fps map rendering', '< 100ms API response', '99.9% uptime'],
      storage: '50MB local cache for offline maps'
    },
    backend: {
      technologies: ['Python FastAPI', 'PostgreSQL', 'Redis', 'Celery', 'WebSocket'],
      apis: ['Satellite imagery APIs', 'Weather data APIs', 'IoT sensor APIs'],
      services: ['Real-time data processing', 'Alert management', 'Data aggregation', 'ML inference'],
      database: ['Time-series data tables', 'Geospatial indexes', 'Alert configurations'],
      compute: '4 CPU cores, 8GB RAM, 100GB SSD per service instance'
    },
    deployment: {
      infrastructure: ['Kubernetes cluster', 'Load balancer', 'CDN', 'Monitoring stack'],
      scaling: ['Auto-scaling: 2-10 pods', 'Database read replicas', 'Redis cluster'],
      monitoring: ['Prometheus metrics', 'Grafana dashboards', 'Log aggregation'],
      backup: ['Daily database backups', 'Real-time data replication', 'Disaster recovery'],
      security: ['TLS encryption', 'API rate limiting', 'DDoS protection']
    }
  },
  'satellite-analysis-engine': {
    frontend: {
      technologies: ['React 18', 'WebGL', 'Three.js', 'OpenLayers', 'TensorFlow.js'],
      dependencies: ['ol', 'three', '@tensorflow/tfjs', 'webgl-utils'],
      features: ['Satellite image viewer', '3D visualization', 'ML model inference', 'Analysis tools'],
      performance: ['Hardware-accelerated rendering', 'Lazy loading', 'Image optimization'],
      storage: '500MB for satellite imagery cache'
    },
    backend: {
      technologies: ['Python FastAPI', 'GDAL', 'OpenCV', 'TensorFlow', 'PostGIS'],
      apis: ['Landsat API', 'Sentinel Hub API', 'Planet Labs API'],
      services: ['Image processing pipeline', 'ML model serving', 'Change detection', 'Analytics'],
      database: ['Geospatial raster storage', 'Analysis results', 'Model metadata'],
      compute: '8 CPU cores, 32GB RAM, 1TB SSD, GPU for ML inference'
    },
    deployment: {
      infrastructure: ['GPU-enabled nodes', 'Object storage', 'CDN', 'Queue system'],
      scaling: ['Horizontal scaling for CPU tasks', 'GPU node pool', 'Storage scaling'],
      monitoring: ['GPU utilization metrics', 'Processing queue depth', 'Error rates'],
      backup: ['Satellite data backup', 'Model versioning', 'Result archiving'],
      security: ['Secure satellite data access', 'Model protection', 'API authentication']
    }
  },
  'iot-sensor-network': {
    frontend: {
      technologies: ['React 18', 'D3.js', 'MQTT.js', 'Socket.io', 'PWA'],
      dependencies: ['d3', 'mqtt', 'workbox-webpack-plugin'],
      features: ['Sensor dashboard', 'Real-time graphs', 'Alert management', 'Offline capability'],
      performance: ['Real-time updates', 'Efficient data visualization', 'Mobile optimization'],
      storage: '100MB for sensor data cache'
    },
    backend: {
      technologies: ['Python FastAPI', 'MQTT Broker', 'InfluxDB', 'Kafka', 'Redis'],
      apis: ['MQTT protocol', 'LoRaWAN integration', 'Cellular IoT APIs'],
      services: ['Data ingestion', 'Protocol translation', 'Data validation', 'Stream processing'],
      database: ['Time-series sensor data', 'Device registry', 'Configuration management'],
      compute: '2 CPU cores, 4GB RAM, 200GB SSD per service'
    },
    deployment: {
      infrastructure: ['IoT gateway', 'Message broker', 'Time-series database', 'Edge computing'],
      scaling: ['Message broker clustering', 'Database sharding', 'Edge deployment'],
      monitoring: ['Device connectivity', 'Data quality', 'Network latency'],
      backup: ['Time-series data retention', 'Device configuration backup'],
      security: ['Device authentication', 'Data encryption', 'Network segmentation']
    }
  },
  'carbon-sequestration-tracking': {
    frontend: {
      technologies: ['React 18', 'Recharts', 'Mapbox GL', 'Framer Motion', 'React Query'],
      dependencies: ['recharts', 'mapbox-gl', 'framer-motion', '@tanstack/react-query'],
      features: ['Carbon metrics dashboard', 'Trend analysis', 'Predictive modeling', 'Report generation'],
      performance: ['Smooth animations', 'Efficient data fetching', 'Chart optimization'],
      storage: '200MB for carbon data and models'
    },
    backend: {
      technologies: ['Python FastAPI', 'scikit-learn', 'NumPy', 'Pandas', 'PostgreSQL'],
      apis: ['Carbon calculation APIs', 'Climate data APIs', 'Verification APIs'],
      services: ['Carbon calculation engine', 'ML prediction models', 'Verification service'],
      database: ['Carbon measurement data', 'Model parameters', 'Calculation history'],
      compute: '4 CPU cores, 16GB RAM, 500GB SSD'
    },
    deployment: {
      infrastructure: ['ML pipeline', 'Model serving', 'Batch processing', 'API gateway'],
      scaling: ['Model serving replicas', 'Batch job scaling', 'Database optimization'],
      monitoring: ['Model performance', 'Calculation accuracy', 'Processing latency'],
      backup: ['Model versioning', 'Calculation audit trail', 'Data lineage'],
      security: ['Calculation integrity', 'Model protection', 'Audit compliance']
    }
  }
}

const infrastructureStack = {
  frontend: {
    core: ['React 18', 'TypeScript', 'Vite', 'Tailwind CSS'],
    stateManagement: ['React Query', 'Zustand', 'React Hook Form'],
    visualization: ['D3.js', 'Three.js', 'Leaflet', 'Chart.js', 'Recharts'],
    maps: ['Mapbox GL JS', 'OpenLayers', 'Leaflet'],
    realTime: ['Socket.io', 'MQTT.js', 'WebRTC'],
    mobile: ['PWA', 'Capacitor', 'React Native (future)']
  },
  backend: {
    core: ['Python 3.11+', 'FastAPI', 'Pydantic', 'SQLAlchemy'],
    databases: ['PostgreSQL 15+', 'PostGIS', 'Redis', 'InfluxDB'],
    messaging: ['Apache Kafka', 'RabbitMQ', 'MQTT Broker'],
    processing: ['Celery', 'Apache Airflow', 'Ray'],
    ml: ['TensorFlow', 'PyTorch', 'scikit-learn', 'GDAL'],
    monitoring: ['Prometheus', 'Grafana', 'ELK Stack']
  },
  deployment: {
    containerization: ['Docker', 'Kubernetes', 'Helm'],
    cloudProviders: ['AWS', 'Google Cloud', 'Azure'],
    infrastructure: ['Terraform', 'Ansible', 'CloudFormation'],
    cicd: ['GitHub Actions', 'GitLab CI', 'ArgoCD'],
    monitoring: ['Prometheus', 'Grafana', 'Jaeger', 'DataDog'],
    security: ['Vault', 'cert-manager', 'Falco', 'OPA Gatekeeper']
  }
}

const deploymentArchitecture = [
  {
    tier: 'Load Balancer Tier',
    components: ['NGINX Ingress', 'AWS ALB', 'SSL Termination', 'Rate Limiting'],
    scaling: 'Multi-AZ deployment with health checks'
  },
  {
    tier: 'API Gateway Tier',
    components: ['Kong API Gateway', 'Authentication', 'Request Routing', 'Monitoring'],
    scaling: 'Auto-scaling based on request volume'
  },
  {
    tier: 'Application Tier',
    components: ['FastAPI Services', 'Business Logic', 'Data Processing', 'ML Inference'],
    scaling: 'Horizontal pod auto-scaling (2-20 pods)'
  },
  {
    tier: 'Data Tier',
    components: ['PostgreSQL', 'Redis Cache', 'InfluxDB', 'Object Storage'],
    scaling: 'Read replicas, connection pooling, sharding'
  },
  {
    tier: 'Processing Tier',
    components: ['Kafka Streams', 'Celery Workers', 'ML Pipeline', 'Batch Jobs'],
    scaling: 'Dynamic worker scaling based on queue depth'
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

export const TechnicalRequirements: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('frontend')
  const [activeModule, setActiveModule] = useState('forest-health-monitoring')

  return (
    <section className="py-20 bg-gradient-to-b from-sand-50 to-white" aria-labelledby="technical-requirements">
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
              Technical Architecture
            </Badge>
            <h2 id="technical-requirements" className="text-4xl font-bold text-ink-900 mb-6">
              Technical Requirements & Architecture
            </h2>
            <p className="text-xl text-ink-600 leading-relaxed max-w-3xl mx-auto">
              Comprehensive technical specifications for frontend, backend, and deployment 
              infrastructure supporting the Sylvagraph DMRV platform.
            </p>
          </motion.div>

          {/* Requirement Category Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {requirementCategories.map((category, index) => {
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
                  className={`flex items-center px-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
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

          {/* Module Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <h3 className="text-xl font-bold text-ink-900 mb-4 text-center">
              Select Module for Detailed Requirements
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              {Object.keys(moduleRequirements).map((moduleId) => (
                <button
                  key={moduleId}
                  onClick={() => setActiveModule(moduleId)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                    activeModule === moduleId
                      ? 'bg-forest-600 text-white shadow-lg'
                      : 'bg-sand-100 text-ink-700 hover:bg-sand-200'
                  }`}
                >
                  {moduleId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Active Category Requirements */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeCategory}-${activeModule}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mb-16"
            >
              {activeModule && moduleRequirements[activeModule as keyof typeof moduleRequirements] && (
                <Card className="p-8">
                  <h3 className="text-2xl font-bold text-ink-900 mb-6 text-center">
                    {activeModule.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} - {' '}
                    {requirementCategories.find(cat => cat.id === activeCategory)?.title}
                  </h3>
                  
                  {(() => {
                    const requirements = moduleRequirements[activeModule as keyof typeof moduleRequirements][activeCategory as keyof typeof moduleRequirements[keyof typeof moduleRequirements]]
                    
                    if (!requirements) return null

                    return (
                      <div className="space-y-6">
                        {Object.entries(requirements).map(([key, value], index) => (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            className="border-l-4 border-forest-500 pl-6 py-2"
                          >
                            <h4 className="text-lg font-semibold text-ink-900 mb-3 capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </h4>
                            {Array.isArray(value) ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {value.map((item: string, itemIndex: number) => (
                                  <div key={itemIndex} className="flex items-center p-2 bg-sand-50 rounded-lg">
                                    <CheckCircle className="h-4 w-4 text-forest-500 mr-2 flex-shrink-0" />
                                    <span className="text-ink-700 text-sm">{item}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="p-3 bg-sand-50 rounded-lg">
                                <span className="text-ink-700">{value}</span>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    )
                  })()}
                </Card>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Infrastructure Stack Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <h3 className="text-3xl font-bold text-ink-900 mb-8 text-center">
              Complete Technology Stack
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {Object.entries(infrastructureStack).map(([category, technologies], categoryIndex) => {
                const colorClasses = getColorClasses(category === 'frontend' ? 'forest' : category === 'backend' ? 'mint' : 'sand')
                
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.5 + categoryIndex * 0.1 }}
                  >
                    <Card className="p-6 h-full">
                      <div className="flex items-center mb-4">
                        <div className={`p-3 ${colorClasses.bg} rounded-lg mr-3`}>
                          {category === 'frontend' && <Monitor className={`h-6 w-6 ${colorClasses.text}`} />}
                          {category === 'backend' && <Server className={`h-6 w-6 ${colorClasses.text}`} />}
                          {category === 'deployment' && <Cloud className={`h-6 w-6 ${colorClasses.text}`} />}
                        </div>
                        <h4 className="text-xl font-bold text-ink-900 capitalize">
                          {category} Stack
                        </h4>
                      </div>
                      
                      <div className="space-y-4">
                        {Object.entries(technologies).map(([subCategory, techs]) => (
                          <div key={subCategory}>
                            <h5 className="font-semibold text-ink-900 mb-2 capitalize text-sm">
                              {subCategory.replace(/([A-Z])/g, ' $1').trim()}
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {(techs as string[]).map((tech, techIndex) => (
                                <Badge 
                                  key={techIndex} 
                                  variant="secondary" 
                                  className={`text-xs ${colorClasses.bg} ${colorClasses.text}`}
                                >
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Deployment Architecture */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-16"
          >
            <h3 className="text-3xl font-bold text-ink-900 mb-8 text-center">
              Multi-Tier Deployment Architecture
            </h3>
            
            <div className="space-y-4">
              {deploymentArchitecture.map((tier, index) => (
                <motion.div
                  key={tier.tier}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                  className="border-l-4 border-mint-500 bg-white rounded-r-xl p-6 shadow-lg"
                >
                  <div className="flex items-center mb-3">
                    <Layers className="h-6 w-6 text-mint-600 mr-3" />
                    <h4 className="text-xl font-bold text-ink-900">{tier.tier}</h4>
                  </div>
                  
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-2">
                      {tier.components.map((component, componentIndex) => (
                        <Badge 
                          key={componentIndex} 
                          variant="secondary" 
                          className="bg-mint-100 text-mint-700"
                        >
                          {component}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-ink-600 text-sm">
                    <strong>Scaling Strategy:</strong> {tier.scaling}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Performance & Scaling Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-gradient-to-r from-forest-600 to-mint-600 rounded-2xl p-8 text-white text-center"
          >
            <div className="flex justify-center mb-4">
              <Activity className="h-12 w-12 text-forest-100" />
            </div>
            <h3 className="text-2xl font-bold mb-4">
              Platform Performance Targets
            </h3>
            <p className="text-forest-100 text-lg mb-8 max-w-2xl mx-auto">
              Enterprise-grade performance and reliability metrics designed for 
              mission-critical DMRV operations.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-3xl font-bold mb-2">99.99%</div>
                <div className="text-forest-100 text-sm">System Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">&lt;100ms</div>
                <div className="text-forest-100 text-sm">API Response Time</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">10,000+</div>
                <div className="text-forest-100 text-sm">Concurrent Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold mb-2">1PB+</div>
                <div className="text-forest-100 text-sm">Data Processing</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}