import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  UserGroupIcon,
  GlobeAltIcon,
  CheckBadgeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const HowCanWeHelpSection: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '-50px 0px',
  });

  const helpItems = [
    {
      icon: UserGroupIcon,
      title: "Expert Team",
      description: "Leading specialists in carbon markets and regenerative systems",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: GlobeAltIcon,
      title: "Global Partnerships",
      description: "Collaborating with corporates, NGOs, and governments worldwide",
      color: "from-green-500 to-green-600"
    },
    {
      icon: CheckBadgeIcon,
      title: "Proven Impact",
      description: "Delivering measurable results in climate action and sustainability",
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <section ref={ref} className="section-padding bg-gradient-to-br from-gray-50 via-white to-primary-50 relative overflow-hidden">
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
            Climate-Tech Leadership
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
            How Can We 
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              {' '}Help?
            </span>
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <p className="text-base md:text-lg lg:text-xl text-gray-600 leading-relaxed">
              Aurigraph Aurex is a pioneering climate-tech company at the forefront of carbon and regenerative solutions. 
              We bridge the gap between environmental impact and technological innovation, creating pathways for organizations 
              to achieve their Net Zero goals while fostering community development and ecosystem restoration.
            </p>
          </div>
        </motion.div>

        {/* Help Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {helpItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 50 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="group relative"
              >
                <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200 h-full">
                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotateY: 180 }}
                    transition={{ duration: 0.3 }}
                    className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-6 shadow-lg`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </motion.div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-primary-600 transition-colors">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Decorative Element */}
                  <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-primary-100 to-accent-100 rounded-full opacity-20 group-hover:opacity-30 transition-opacity" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Transform Your ESG Impact?
            </h3>
            <p className="text-gray-600 mb-6">
              Join hundreds of organizations already making a measurable difference with our climate-tech solutions.
            </p>
            <button className="btn-primary text-lg px-8 py-3">
              Get Started Today
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowCanWeHelpSection;