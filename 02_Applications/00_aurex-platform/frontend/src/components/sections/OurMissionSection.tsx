import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  RocketLaunchIcon,
  EyeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const OurMissionSection: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '-50px 0px',
  });

  return (
    <section ref={ref} className="section-padding bg-gradient-to-br from-primary-50 via-white to-accent-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-64 h-64 bg-accent-100 rounded-full mix-blend-multiply filter blur-xl opacity-70" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e2e8f0' fill-opacity='0.2'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
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
            Driving Climate Action Forward
          </div>
        </motion.div>

        {/* Mission and Vision Cards */}
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
          {/* Our Mission */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="group relative"
          >
            <div className="bg-white rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200 h-full">
              {/* Icon */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ duration: 0.3 }}
                className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-6 shadow-lg"
              >
                <RocketLaunchIcon className="w-8 h-8 text-white" />
              </motion.div>

              {/* Title */}
              <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 group-hover:text-primary-600 transition-colors">
                Our Mission
              </h3>

              {/* Description */}
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                Empowering organizations to achieve zero emissions through innovative policy frameworks, 
                cutting-edge technology, and community-driven solutions that create lasting environmental 
                and social impact.
              </p>

              {/* Decorative Elements */}
              <div className="absolute top-6 right-6 w-20 h-20 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="absolute bottom-6 left-6 w-12 h-12 bg-gradient-to-br from-accent-100 to-primary-100 rounded-full opacity-20 group-hover:opacity-30 transition-opacity" />
            </div>
          </motion.div>

          {/* Our Vision */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="group relative"
          >
            <div className="bg-white rounded-2xl p-8 md:p-10 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-accent-200 h-full">
              {/* Icon */}
              <motion.div
                whileHover={{ scale: 1.1, rotate: -5 }}
                transition={{ duration: 0.3 }}
                className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center mb-6 shadow-lg"
              >
                <EyeIcon className="w-8 h-8 text-white" />
              </motion.div>

              {/* Title */}
              <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 group-hover:text-accent-600 transition-colors">
                Our Vision
              </h3>

              {/* Description */}
              <p className="text-base md:text-lg text-gray-600 leading-relaxed">
                To sequester <span className="font-bold text-gray-900">1 billion tonnes of CO₂ by 2030</span> by 
                empowering small farmers, enabling nature-positive growth, and creating a regenerative economy 
                that benefits both people and the planet.
              </p>

              {/* Decorative Elements */}
              <div className="absolute top-6 right-6 w-20 h-20 bg-gradient-to-br from-accent-100 to-primary-100 rounded-full opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="absolute bottom-6 left-6 w-12 h-12 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full opacity-20 group-hover:opacity-30 transition-opacity" />
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
};

export default OurMissionSection;