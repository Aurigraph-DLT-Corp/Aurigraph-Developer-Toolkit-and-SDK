import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RocketLaunchIcon,
  ChartBarIcon,
  EyeIcon,
  CurrencyDollarIcon,
  PlayIcon,
  ArrowRightIcon,
  SparklesIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Data
import { products } from '../../data/content';

// Utils
import { trackCTAClick, trackDemoRequest } from '../../utils/analytics';

// URL Configuration
import { getAppUrl } from '../../config/urls';

// Product icon mapping
const productIcons = {
  rocket: RocketLaunchIcon,
  water: ChartBarIcon,
  tree: EyeIcon,
  leaf: CurrencyDollarIcon,
};

interface InteractiveDemoProps {
  product: typeof products[0];
  isActive: boolean;
}

const InteractiveDemo: React.FC<InteractiveDemoProps> = ({ product, isActive }) => {
  const [demoStep, setDemoStep] = useState(0);
  
  const demoSteps = [
    'Data Collection',
    'AI Analysis',
    'Report Generation',
    'Compliance Check'
  ];

  React.useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setDemoStep((prev) => (prev + 1) % demoSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isActive, demoSteps.length]);

  return (
    <div className="relative bg-gray-50 rounded-xl p-6 h-64 overflow-hidden">
      {/* Demo Content Based on Product */}
      <AnimatePresence mode="wait">
        {product.id === 'launchpad' && (
          <motion.div
            key="launchpad"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">ESG Assessment Demo</h4>
              <div className="flex items-center gap-2 text-xs text-primary-600">
                <SparklesIcon className="w-4 h-4" />
                AI-Powered
              </div>
            </div>
            
            {/* Assessment Questions */}
            <div className="space-y-3">
              {['Energy Management', 'Water Usage', 'Waste Reduction', 'Carbon Emissions'].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="flex items-center gap-3"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    index <= demoStep ? 'bg-accent-500' : 'bg-gray-300'
                  }`}>
                    {index <= demoStep && <CheckCircleIcon className="w-4 h-4 text-white" />}
                  </div>
                  <span className={`text-sm ${index <= demoStep ? 'text-gray-900' : 'text-gray-500'}`}>
                    {item}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>Assessment Progress</span>
                <span>{Math.round(((demoStep + 1) / 4) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-primary-500 h-2 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${((demoStep + 1) / 4) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {product.id === 'hydropulse' && (
          <motion.div
            key="hydropulse"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Water Monitoring Dashboard</h4>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Live Data
              </div>
            </div>
            
            {/* Sensor Data */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Soil Moisture', value: '68%', trend: '+5%' },
                { label: 'Water Flow', value: '24L/min', trend: '-12%' },
                { label: 'pH Level', value: '6.8', trend: 'stable' },
                { label: 'Temperature', value: '22°C', trend: '+2°C' }
              ].map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg p-3 border"
                >
                  <div className="text-xs text-gray-500">{metric.label}</div>
                  <div className="text-lg font-bold text-gray-900">{metric.value}</div>
                  <div className={`text-xs ${
                    metric.trend.startsWith('+') ? 'text-red-500' : 
                    metric.trend.startsWith('-') ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {metric.trend}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Water Usage Chart */}
            <div className="bg-white rounded-lg p-3 border">
              <div className="text-xs text-gray-500 mb-2">Weekly Water Usage</div>
              <div className="flex items-end justify-between h-16">
                {[30, 45, 25, 60, 35, 50, 40].map((height, index) => (
                  <motion.div
                    key={index}
                    className="bg-blue-400 rounded-sm"
                    style={{ width: '8px' }}
                    initial={{ height: 0 }}
                    animate={{ height: `${(height / 60) * 100}%` }}
                    transition={{ delay: index * 0.1 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {product.id === 'sylvagraph' && (
          <motion.div
            key="sylvagraph"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Satellite Forest Analysis</h4>
              <div className="flex items-center gap-1 text-xs text-primary-600">
                <EyeIcon className="w-4 h-4" />
                Computer Vision
              </div>
            </div>
            
            {/* Mock Satellite Map */}
            <div className="relative bg-green-100 rounded-lg h-32 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-200 to-green-400 opacity-50" />
              
              {/* Forest Coverage Indicators */}
              {[
                { x: '20%', y: '30%', size: 'w-4 h-4', color: 'bg-green-600' },
                { x: '60%', y: '20%', size: 'w-6 h-6', color: 'bg-green-700' },
                { x: '40%', y: '60%', size: 'w-3 h-3', color: 'bg-yellow-500' },
                { x: '80%', y: '70%', size: 'w-5 h-5', color: 'bg-green-600' }
              ].map((dot, index) => (
                <motion.div
                  key={index}
                  className={`absolute ${dot.size} ${dot.color} rounded-full`}
                  style={{ left: dot.x, top: dot.y }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.2 }}
                />
              ))}
              
              {/* Change Detection Alert */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1 }}
                className="absolute bottom-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
              >
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Change Detected
              </motion.div>
            </div>

            {/* Forest Metrics */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Coverage', value: '94.2%' },
                { label: 'Change', value: '-0.3%' },
                { label: 'Health', value: 'Good' }
              ].map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-sm font-bold text-gray-900">{metric.value}</div>
                  <div className="text-xs text-gray-500">{metric.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {product.id === 'carbontrace' && (
          <motion.div
            key="carbontrace"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">Carbon Credit Marketplace</h4>
              <div className="flex items-center gap-1 text-xs text-green-600">
                <CurrencyDollarIcon className="w-4 h-4" />
                Live Prices
              </div>
            </div>
            
            {/* Market Price */}
            <div className="bg-white rounded-lg p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500">Carbon Credit Price</div>
                  <div className="text-2xl font-bold text-gray-900">$125.50</div>
                  <div className="text-sm text-green-600">+$8.20 (+7.0%)</div>
                </div>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-green-500"
                >
                  📈
                </motion.div>
              </div>
            </div>

            {/* Trading Activity */}
            <div className="space-y-2">
              <div className="text-xs text-gray-500">Recent Transactions</div>
              {[
                { type: 'SELL', amount: '50 credits', price: '$125.50', time: '2m ago' },
                { type: 'BUY', amount: '25 credits', price: '$124.80', time: '5m ago' },
                { type: 'BUY', amount: '100 credits', price: '$124.20', time: '8m ago' }
              ].map((trade, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="flex items-center justify-between text-xs bg-white rounded p-2 border"
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      trade.type === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {trade.type}
                    </span>
                    <span>{trade.amount}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{trade.price}</div>
                    <div className="text-gray-500">{trade.time}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProductShowcase: React.FC = () => {
  const [activeProduct, setActiveProduct] = useState(0);

  const handleTryDemo = (productId: string) => {
    trackDemoRequest(`${productId}_demo`);
    trackCTAClick('explore_app', 'product_showcase');
    
    // Get URL based on current environment (localhost vs production)
    const appUrl = getAppUrl(productId);
    window.open(appUrl, '_blank');
  };


  return (
    <section className="section-padding bg-gray-50">
      <div className="max-w-7xl mx-auto container-padding">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 font-medium text-sm mb-6">
            <SparklesIcon className="w-4 h-4 mr-2" />
            AI-Powered DMRV Suite
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
            Aurex 
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              {' '}Offerings
            </span>
          </h2>
          
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Experience our comprehensive DMRV platform with interactive demos. 
            See how AI-powered precision transforms environmental monitoring and reporting.
          </p>
        </motion.div>

        {/* Product Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8 md:mb-12"
        >
          {products.map((product, index) => {
            const IconComponent = productIcons[product.icon as keyof typeof productIcons];
            return (
              <button
                key={product.id}
                onClick={() => setActiveProduct(index)}
                className={`flex items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 rounded-xl text-sm md:text-base font-medium transition-all duration-300 ${
                  activeProduct === index
                    ? 'bg-white shadow-lg text-primary-600 border-2 border-primary-200'
                    : 'bg-white/50 text-gray-600 hover:bg-white hover:shadow-md border-2 border-transparent'
                }`}
              >
                <IconComponent className="w-4 h-4 md:w-5 md:h-5" />
                <span>{product.name}</span>
                {activeProduct === index && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="w-2 h-2 bg-primary-500 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </motion.div>

        {/* Active Product Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeProduct}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.5 }}
            className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center"
          >
            {/* Product Info */}
            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  {React.createElement(productIcons[products[activeProduct].icon as keyof typeof productIcons], {
                    className: "w-8 h-8 text-primary-600"
                  })}
                  <h3 className="text-3xl font-bold text-gray-900">
                    {products[activeProduct].title}
                  </h3>
                </div>
                
                <p className="text-xl text-gray-600 mb-6">
                  {products[activeProduct].description}
                </p>
              </div>

              {/* Key Features */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Features</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                  {products[activeProduct].keyFeatures.map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <CheckCircleIcon className="w-5 h-5 text-accent-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Metrics */}
              {products[activeProduct].metrics && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                    {products[activeProduct].metrics?.map((metric, index) => (
                      <motion.div
                        key={metric.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="text-center p-4 bg-white rounded-lg border"
                      >
                        <div className="text-2xl font-bold text-primary-600 mb-1">
                          {metric.value}
                        </div>
                        <div className="text-sm text-gray-900 font-medium mb-1">
                          {metric.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {metric.description}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Button */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => handleTryDemo(products[activeProduct].id)}
                  className="btn-primary group"
                >
                  <PlayIcon className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Explore {products[activeProduct].name}
                  <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Interactive Demo */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ClockIcon className="w-4 h-4" />
                Live Demo Preview
              </div>
              
              <InteractiveDemo 
                product={products[activeProduct]} 
                isActive={true}
              />
              
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">
                  This is a preview. Click "Explore {products[activeProduct].name}" for the full experience.
                </p>
                <div className="flex justify-center gap-2">
                  {[...Array(4)].map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === activeProduct ? 'bg-primary-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Auto-advance indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-sm text-gray-500">
            🔄 Auto-advancing every 10 seconds • Click any product to explore
          </p>
        </motion.div>
      </div>
    </section>
  );
};

// Note: Auto-advance functionality available but not currently implemented

export default ProductShowcase;