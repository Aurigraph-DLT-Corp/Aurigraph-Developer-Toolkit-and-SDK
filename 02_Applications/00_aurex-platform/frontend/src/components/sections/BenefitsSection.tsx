import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { 
  ChartBarIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  CheckBadgeIcon,
  ArrowTrendingUpIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import CountUp from 'react-countup';

// Data
import { benefits } from '../../data/content';

const iconMap = {
  chart: ChartBarIcon,
  monitor: ComputerDesktopIcon,
  shield: ShieldCheckIcon,
  savings: CurrencyDollarIcon,
};

interface BenefitCardProps {
  benefit: typeof benefits[0];
  index: number;
  isInView: boolean;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ benefit, index, isInView }) => {
  const [isHovered, setIsHovered] = useState(false);
  const IconComponent = iconMap[benefit.icon as keyof typeof iconMap];

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group w-full h-full flex"
    >
      <div className="card-interactive w-full h-full p-8 bg-white relative overflow-hidden flex flex-col">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-transparent opacity-50" />
        
        {/* Animated Background Elements */}
        <motion.div
          animate={isHovered ? { scale: 1.1, opacity: 0.1 } : { scale: 1, opacity: 0.05 }}
          transition={{ duration: 0.3 }}
          className="absolute -top-4 -right-4 w-24 h-24 bg-primary-200 rounded-full"
        />
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Content Container - grows to fill available space */}
          <div className="flex-grow flex flex-col">
            <div className="flex-grow">
              {/* Icon */}
              <motion.div
                animate={isHovered ? { scale: 1.1, rotateY: 180 } : { scale: 1, rotateY: 0 }}
                transition={{ duration: 0.3 }}
                className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-6 shadow-lg"
              >
                <IconComponent className="w-8 h-8 text-white" />
              </motion.div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-primary-600 transition-colors">
                {benefit.title}
              </h3>

              {/* Description */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                {benefit.description}
              </p>

              {/* Statistic */}
              <div className="mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : { scale: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.3 + 0.5 }}
                  className="inline-flex items-center px-4 py-2 bg-accent-100 text-accent-700 rounded-full font-bold text-lg"
                >
                  <ArrowTrendingUpIcon className="w-5 h-5 mr-2" />
                  {benefit.statistic}
                </motion.div>
              </div>
            </div>

            {/* Features - anchored to bottom area */}
            <div className="space-y-3">
              {benefit.features.map((feature, featureIndex) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                  transition={{ duration: 0.4, delay: index * 0.2 + featureIndex * 0.1 + 0.8 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-5 h-5 bg-accent-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckBadgeIcon className="w-3 h-3 text-accent-600" />
                  </div>
                  <span className="text-sm text-gray-700">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
};

const BenefitsSection: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '-50px 0px',
  });

  const [activeMetric, setActiveMetric] = useState(0);

  const keyMetrics = [
    { label: 'Faster Reporting', value: 90, suffix: '%', color: 'text-primary-600' },
    { label: 'Cost Reduction', value: 60, suffix: '%', color: 'text-accent-600' },
    { label: 'Compliance Rate', value: 100, suffix: '%', color: 'text-green-600' },
    { label: 'Time Savings', value: 24, suffix: '/7', color: 'text-blue-600' }
  ];

  React.useEffect(() => {
    if (inView) {
      const interval = setInterval(() => {
        setActiveMetric((prev) => (prev + 1) % keyMetrics.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [inView, keyMetrics.length]);


  return (
    <section ref={ref} className="section-padding bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-accent-100 rounded-full mix-blend-multiply filter blur-xl opacity-70" />
      </div>

      <div className="max-w-7xl mx-auto container-padding relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 text-primary-700 font-medium text-sm mb-6">
            <SparklesIcon className="w-4 h-4 mr-2" />
            Proven Results & Benefits
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
            Why Organizations Choose 
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              {' '}Aurex
            </span>
          </h2>
          
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-8 md:mb-12">
            Join 450+ organizations already transforming their ESG impact with our 
            intelligent DMRV platform. See the measurable results they're achieving.
          </p>

          {/* Key Metrics Display */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8 mb-12 md:mb-16">
            {keyMetrics.map((metric, index) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`text-center p-4 md:p-6 rounded-xl ${
                  activeMetric === index ? 'bg-white shadow-lg scale-105' : 'bg-white/50'
                } transition-all duration-500`}
              >
                <motion.div
                  className={`text-2xl md:text-4xl font-bold mb-2 ${metric.color}`}
                  key={`${metric.value}-${activeMetric === index}`}
                >
                  {inView && (
                    <CountUp
                      start={0}
                      end={metric.value}
                      duration={2}
                      delay={index * 0.2}
                    />
                  )}
                  {metric.suffix}
                </motion.div>
                <div className="text-sm font-medium text-gray-700">{metric.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Benefits Grid */}
        <div className="relative mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-stretch">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 50 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="flex h-full"
              >
                <BenefitCard
                  benefit={benefit}
                  index={index}
                  isInView={inView}
                />
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default BenefitsSection;