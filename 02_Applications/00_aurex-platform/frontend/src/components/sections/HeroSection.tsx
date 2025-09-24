import React from 'react';
import { motion } from 'framer-motion';
import { 
  CheckIcon,
  ArrowRightIcon,
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

// Data
import { heroContent } from '../../data/content';

// Utils
import { trackCTAClick } from '../../utils/analytics';

const HeroSection: React.FC = () => {

  const handleExploreOfferings = () => {
    trackCTAClick('explore_offerings', 'hero_section');
    // Scroll to Aurex Offerings section
    const productsSection = document.getElementById('products');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };


  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Orbs */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.4, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute top-20 left-4 lg:left-10 w-32 h-32 md:w-72 md:h-72 bg-primary-400 rounded-full mix-blend-multiply filter blur-xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
          className="absolute top-40 right-4 lg:right-10 w-32 h-32 md:w-72 md:h-72 bg-accent-400 rounded-full mix-blend-multiply filter blur-xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ duration: 2, delay: 1, ease: "easeOut" }}
          className="absolute -bottom-20 left-1/4 lg:left-1/3 w-32 h-32 md:w-72 md:h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl"
        />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-50" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="relative max-w-7xl mx-auto container-padding pt-16 md:pt-20 pb-12 md:pb-16">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          {/* Content Column */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 font-medium text-sm mb-6"
            >
              <span className="w-2 h-2 bg-primary-500 rounded-full mr-2 animate-pulse" />
              Leading DMRV Platform for ESG Reporting
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 leading-tight"
            >
              {heroContent.headline.split(' ').map((word, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className={`inline-block mr-3 ${
                    ['Intelligent', 'DMRV'].includes(word) 
                      ? 'bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent' 
                      : ''
                  }`}
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 max-w-2xl text-balance"
            >
              {heroContent.subheadline}
            </motion.p>

            {/* Key Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 mb-6 md:mb-8 justify-center lg:justify-start"
            >
              {heroContent.benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                  className="flex items-center gap-2 text-gray-700 font-medium"
                >
                  <div className="w-5 h-5 bg-accent-100 rounded-full flex items-center justify-center">
                    <CheckIcon className="w-3 h-3 text-accent-600" />
                  </div>
                  <span className="text-sm lg:text-base">{benefit}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="mb-6 md:mb-8 flex justify-center lg:justify-start"
            >
              <button
                onClick={handleExploreOfferings}
                className="btn-primary group relative overflow-hidden text-base md:text-lg px-6 md:px-8 py-3 md:py-4"
              >
                <span className="relative z-10 flex items-center">
                  {heroContent.cta.primary}
                  <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-primary-700 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </button>
            </motion.div>

            {/* Social Proof Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.2 }}
              className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <ChartBarIcon className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {heroContent.socialProof.customerCount}
                  </span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <ClockIcon className="w-5 h-5 text-accent-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {heroContent.socialProof.complianceRate}
                  </span>
                </div>
                <div className="flex items-center justify-center lg:justify-start gap-2">
                  <ShieldCheckIcon className="w-5 h-5 text-primary-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {heroContent.socialProof.certifications[0]}
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Visual Column */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="relative"
          >
            {/* Dashboard Mockup */}
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="relative bg-white rounded-2xl shadow-2xl p-6 transform perspective-1000"
                style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.5)'
                }}
              >
                {/* Dashboard Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    Aurex Dashboard
                  </div>
                </div>

                {/* Mock Dashboard Content */}
                <div className="space-y-4">
                  {/* Metrics Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 1.0 }}
                      className="bg-gradient-to-r from-primary-50 to-primary-100 p-4 rounded-lg"
                    >
                      <div className="text-2xl font-bold text-primary-700">2.3M+</div>
                      <div className="text-xs text-primary-600">Tons CO₂ Tracked</div>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 1.1 }}
                      className="bg-gradient-to-r from-accent-50 to-accent-100 p-4 rounded-lg"
                    >
                      <div className="text-2xl font-bold text-accent-700">98.5%</div>
                      <div className="text-xs text-accent-600">Compliance Rate</div>
                    </motion.div>
                  </div>

                  {/* Chart Placeholder */}
                  <motion.div
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: 1, scaleY: 1 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="h-32 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg flex items-end justify-around p-4"
                  >
                    {[40, 65, 45, 80, 55, 90, 70].map((height, index) => (
                      <motion.div
                        key={index}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.6, delay: 1.4 + index * 0.1 }}
                        className="bg-gradient-to-t from-primary-500 to-primary-400 rounded-sm w-4"
                      />
                    ))}
                  </motion.div>

                  {/* Status Indicators */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 1.8 }}
                    className="flex justify-between items-center text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-gray-600">Real-time monitoring</span>
                    </div>
                    <div className="text-primary-600 font-medium">+15% this month</div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Floating Elements */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.5 }}
                className="absolute -top-6 -right-6 bg-white rounded-xl shadow-lg p-3 border border-gray-100"
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-gray-700">Live Data</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 1.7 }}
                className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-3 border border-gray-100"
              >
                <div className="flex items-center gap-2">
                  <CheckIcon className="w-4 h-4 text-accent-500" />
                  <span className="text-xs font-medium text-gray-700">Compliant</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

    </section>
  );
};

export default HeroSection;