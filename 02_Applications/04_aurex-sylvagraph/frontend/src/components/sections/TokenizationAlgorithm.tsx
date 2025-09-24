/**
 * TokenizationAlgorithm Section
 * Detailed explanation of the tokenization algorithm for land parcels and vegetation
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calculator, 
  MapPin, 
  TreePine, 
  BarChart3, 
  Coins, 
  TrendingUp,
  Layers,
  Satellite,
  Settings,
  CheckCircle,
  ArrowRight,
  FileCode,
  Zap,
  Award,
  Database,
  AlertCircle
} from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

const algorithmSteps = [
  {
    id: 1,
    title: 'Land Parcel Assessment',
    description: 'Comprehensive analysis of geographical and topographical characteristics',
    icon: MapPin,
    details: [
      'GPS boundary mapping and area calculation',
      'Soil composition and quality analysis',
      'Elevation, slope, and drainage assessment',
      'Climate zone and microclimate evaluation',
      'Historical land use and disturbance analysis'
    ],
    formula: 'LP_Score = (Area × Soil_Quality × Climate_Factor × Accessibility_Index) / Risk_Multiplier'
  },
  {
    id: 2,
    title: 'Vegetation Analysis',
    description: 'Multi-dimensional assessment of forest composition and carbon potential',
    icon: TreePine,
    details: [
      'Species composition and biodiversity index',
      'Tree age distribution and growth rates',
      'Canopy cover and forest structure analysis',
      'Biomass density measurements',
      'Carbon sequestration potential calculation'
    ],
    formula: 'Veg_Score = Σ(Species_i × Biomass_i × Growth_Rate_i × Carbon_Factor_i)'
  },
  {
    id: 3,
    title: 'Satellite Integration',
    description: 'Remote sensing data integration for accurate monitoring',
    icon: Satellite,
    details: [
      'NDVI (Normalized Difference Vegetation Index)',
      'LAI (Leaf Area Index) calculations',
      'Deforestation and degradation detection',
      'Seasonal growth pattern analysis',
      'Multi-spectral imagery processing'
    ],
    formula: 'Sat_Factor = (NDVI × LAI × Seasonal_Trend) / Degradation_Risk'
  },
  {
    id: 4,
    title: 'Carbon Quantification',
    description: 'Precise calculation of carbon sequestration and storage capacity',
    icon: BarChart3,
    details: [
      'Above-ground biomass calculations',
      'Below-ground carbon storage assessment',
      'Soil organic carbon measurements',
      'Annual sequestration rate projections',
      'Permanence and additionality factors'
    ],
    formula: 'Carbon_Credits = (AGB + BGB + SOC) × Seq_Rate × Permanence × Additionality'
  },
  {
    id: 5,
    title: 'Risk Assessment',
    description: 'Comprehensive risk analysis and mitigation factors',
    icon: AlertCircle,
    details: [
      'Natural disaster probability analysis',
      'Climate change vulnerability assessment',
      'Market volatility and price risk factors',
      'Regulatory and policy risk evaluation',
      'Buffer pool allocation calculations'
    ],
    formula: 'Risk_Adjusted_Value = Token_Value × (1 - Risk_Score) × Buffer_Factor'
  },
  {
    id: 6,
    title: 'Token Generation',
    description: 'Final tokenization based on verified carbon credit potential',
    icon: Coins,
    details: [
      'Verified carbon credit calculations',
      'Token denomination and fractional ownership',
      'Blockchain metadata and smart contracts',
      'Tradeable token creation and minting',
      'Registry and marketplace integration'
    ],
    formula: 'Tokens = Verified_Credits × Quality_Premium × Market_Liquidity_Factor'
  }
]

const algorithmFactors = {
  land: {
    title: 'Land Parcel Factors',
    factors: [
      { name: 'Area Size', weight: '25%', description: 'Total hectares of forest land' },
      { name: 'Soil Quality', weight: '20%', description: 'Nutrient content and pH levels' },
      { name: 'Climate Suitability', weight: '20%', description: 'Temperature, rainfall, humidity' },
      { name: 'Accessibility', weight: '15%', description: 'Management and monitoring feasibility' },
      { name: 'Legal Status', weight: '20%', description: 'Ownership clarity and permits' }
    ]
  },
  vegetation: {
    title: 'Vegetation Assessment Factors',
    factors: [
      { name: 'Species Diversity', weight: '30%', description: 'Biodiversity and ecosystem health' },
      { name: 'Biomass Density', weight: '25%', description: 'Carbon storage per hectare' },
      { name: 'Growth Rate', weight: '20%', description: 'Annual carbon sequestration' },
      { name: 'Age Distribution', weight: '15%', description: 'Forest maturity and potential' },
      { name: 'Health Status', weight: '10%', description: 'Disease and pest resistance' }
    ]
  }
}

const tokenomics = {
  supply: {
    total: '1,000,000,000 SYLV',
    distribution: [
      { category: 'Forest Owners', allocation: '60%', description: 'Direct carbon credit tokens' },
      { category: 'Platform Operations', allocation: '20%', description: 'MRV and technology costs' },
      { category: 'Buffer Pool', allocation: '10%', description: 'Risk mitigation reserves' },
      { category: 'Ecosystem Development', allocation: '10%', description: 'Community and partnerships' }
    ]
  },
  utility: [
    'Carbon credit trading and ownership',
    'Staking for enhanced verification',
    'Governance voting rights',
    'Access to premium features',
    'Marketplace transaction fees'
  ]
}

export const TokenizationAlgorithm: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1)
  const [activeFactorType, setActiveFactorType] = useState<'land' | 'vegetation'>('land')

  return (
    <section className="py-20 bg-gradient-to-b from-white to-sand-50" aria-labelledby="tokenization-algorithm">
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
              Tokenization Engine
            </Badge>
            <h2 id="tokenization-algorithm" className="text-4xl font-bold text-ink-900 mb-6">
              Advanced Carbon Credit Tokenization Algorithm
            </h2>
            <p className="text-xl text-ink-600 leading-relaxed max-w-3xl mx-auto">
              Our proprietary algorithm combines satellite data, IoT sensors, and machine learning 
              to accurately quantify and tokenize carbon credits from forest assets.
            </p>
          </motion.div>

          {/* Algorithm Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-r from-forest-600 to-mint-600 rounded-2xl p-8 text-white mb-16"
          >
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-4">Algorithm Core Formula</h3>
              <div className="bg-white bg-opacity-10 rounded-lg p-4 font-mono text-lg">
                Token_Value = f(Land_Parcel, Vegetation, Satellite_Data, Carbon_Potential, Risk_Factors)
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold mb-2">15+</div>
                <div className="text-forest-100 text-sm">Data Sources</div>
              </div>
              <div>
                <div className="text-2xl font-bold mb-2">99.2%</div>
                <div className="text-forest-100 text-sm">Accuracy Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold mb-2">Real-time</div>
                <div className="text-forest-100 text-sm">Processing</div>
              </div>
              <div>
                <div className="text-2xl font-bold mb-2">Blockchain</div>
                <div className="text-forest-100 text-sm">Secured</div>
              </div>
            </div>
          </motion.div>

          {/* Algorithm Steps */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-ink-900 mb-8 text-center">
              Step-by-Step Tokenization Process
            </h3>
            
            {/* Step Navigation */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {algorithmSteps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeStep === step.id
                      ? 'bg-forest-600 text-white shadow-lg'
                      : 'bg-sand-100 text-ink-700 hover:bg-sand-200'
                  }`}
                >
                  Step {step.id}
                </button>
              ))}
            </div>

            {/* Active Step Display */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {algorithmSteps.map((step) => {
                  if (step.id !== activeStep) return null
                  
                  return (
                    <Card key={step.id} className="p-8">
                      <div className="flex items-center mb-6">
                        <div className="p-4 bg-forest-100 rounded-xl mr-6">
                          <step.icon className="h-8 w-8 text-forest-600" />
                        </div>
                        <div>
                          <h4 className="text-2xl font-bold text-ink-900 mb-2">{step.title}</h4>
                          <p className="text-ink-600 text-lg">{step.description}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Details */}
                        <div>
                          <h5 className="text-xl font-semibold text-ink-900 mb-4">Key Components</h5>
                          <ul className="space-y-2">
                            {step.details.map((detail, index) => (
                              <li key={index} className="flex items-start">
                                <CheckCircle className="h-5 w-5 text-forest-500 mr-3 flex-shrink-0 mt-0.5" />
                                <span className="text-ink-600">{detail}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Formula */}
                        <div>
                          <h5 className="text-xl font-semibold text-ink-900 mb-4">Mathematical Formula</h5>
                          <div className="bg-sand-50 rounded-lg p-4 border-l-4 border-forest-500">
                            <code className="text-forest-700 font-mono text-sm">
                              {step.formula}
                            </code>
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Weighting Factors */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mb-16"
          >
            <h3 className="text-3xl font-bold text-ink-900 mb-8 text-center">
              Algorithm Weighting Factors
            </h3>

            {/* Factor Type Tabs */}
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={() => setActiveFactorType('land')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeFactorType === 'land'
                    ? 'bg-forest-600 text-white shadow-lg'
                    : 'bg-sand-100 text-ink-700 hover:bg-sand-200'
                }`}
              >
                <MapPin className="h-5 w-5 inline mr-2" />
                Land Factors
              </button>
              <button
                onClick={() => setActiveFactorType('vegetation')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeFactorType === 'vegetation'
                    ? 'bg-forest-600 text-white shadow-lg'
                    : 'bg-sand-100 text-ink-700 hover:bg-sand-200'
                }`}
              >
                <TreePine className="h-5 w-5 inline mr-2" />
                Vegetation Factors
              </button>
            </div>

            {/* Factor Details */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFactorType}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-sand-200"
              >
                <h4 className="text-2xl font-bold text-ink-900 mb-6 text-center">
                  {algorithmFactors[activeFactorType].title}
                </h4>
                <div className="space-y-4">
                  {algorithmFactors[activeFactorType].factors.map((factor, index) => (
                    <motion.div
                      key={factor.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-sand-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="font-semibold text-ink-900 mr-3">{factor.name}</span>
                          <Badge variant="secondary" className="bg-forest-100 text-forest-700">
                            {factor.weight}
                          </Badge>
                        </div>
                        <p className="text-ink-600 text-sm">{factor.description}</p>
                      </div>
                      <div className="ml-4">
                        <div className="w-16 h-2 bg-sand-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-forest-500 to-mint-600 rounded-full"
                            style={{ width: factor.weight }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Tokenomics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mb-16"
          >
            <h3 className="text-3xl font-bold text-ink-900 mb-8 text-center">
              SYLV Token Economics
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Token Distribution */}
              <Card className="p-6">
                <h4 className="text-xl font-bold text-ink-900 mb-4 flex items-center">
                  <Coins className="h-6 w-6 text-forest-600 mr-3" />
                  Token Supply & Distribution
                </h4>
                <div className="mb-4">
                  <div className="text-2xl font-bold text-forest-600 mb-2">
                    {tokenomics.supply.total}
                  </div>
                  <p className="text-ink-600 text-sm mb-4">Total Supply</p>
                </div>
                <div className="space-y-3">
                  {tokenomics.supply.distribution.map((item, index) => (
                    <div key={item.category} className="flex justify-between items-center p-3 bg-sand-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-ink-900">{item.category}</div>
                        <div className="text-xs text-ink-600">{item.description}</div>
                      </div>
                      <div className="font-bold text-forest-600">{item.allocation}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Token Utility */}
              <Card className="p-6">
                <h4 className="text-xl font-bold text-ink-900 mb-4 flex items-center">
                  <Zap className="h-6 w-6 text-mint-600 mr-3" />
                  Token Utility & Use Cases
                </h4>
                <div className="space-y-3">
                  {tokenomics.utility.map((utility, index) => (
                    <div key={index} className="flex items-start p-3 bg-mint-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-mint-600 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-ink-700">{utility}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </motion.div>

          {/* Technical Implementation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="bg-gradient-to-r from-forest-600 to-mint-600 rounded-2xl p-8 text-white text-center"
          >
            <div className="flex justify-center mb-4">
              <FileCode className="h-12 w-12 text-forest-100" />
            </div>
            <h3 className="text-2xl font-bold mb-4">
              Open Source Algorithm
            </h3>
            <p className="text-forest-100 text-lg mb-6 max-w-2xl mx-auto">
              Our tokenization algorithm is fully transparent and auditable. 
              Access the source code, documentation, and contribute to improvements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-forest-600 px-8 py-3 rounded-lg font-semibold hover:bg-sand-50 transition-colors">
                View Algorithm Code
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:bg-opacity-10 transition-colors">
                Technical Documentation
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}