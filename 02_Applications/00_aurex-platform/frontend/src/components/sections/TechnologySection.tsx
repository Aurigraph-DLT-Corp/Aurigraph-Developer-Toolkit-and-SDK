import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Smartphone, 
  Monitor, 
  Satellite, 
  Database, 
  Cpu, 
  Shield 
} from 'lucide-react';

const TechnologySection: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const technologies = [
    {
      id: 'mobile-app',
      title: 'Mobile App',
      description: 'Field data collection and farmer support tools',
      icon: Smartphone,
      features: [
        'Real-time data entry',
        'Offline capability', 
        'Multilingual support'
      ]
    },
    {
      id: 'dashboard-platform',
      title: 'Dashboard Platform', 
      description: 'Comprehensive monitoring and analytics interface',
      icon: Monitor,
      features: [
        'Real-time monitoring',
        'Impact visualization',
        'Reporting tools'
      ]
    },
    {
      id: 'remote-sensing',
      title: 'Remote Sensing',
      description: 'Integrated drone and satellite monitoring systems',
      icon: Satellite,
      features: [
        'High-resolution aerial imaging',
        'Large-scale environmental monitoring', 
        'Deforestation alerts',
        'Vegetation analysis',
        'Change detection'
      ]
    },
    {
      id: 'dmrv-tools',
      title: 'dMRV Tools',
      description: 'Digital Monitoring, Reporting, and Verification',
      icon: Database,
      features: [
        'Automated verification',
        'Data integrity',
        'Audit trails'
      ]
    },
    {
      id: 'ai-analytics',
      title: 'AI Analytics',
      description: 'Machine learning for impact prediction',
      icon: Cpu,
      features: [
        'Predictive modeling',
        'Pattern recognition',
        'Optimization'
      ]
    },
    {
      id: 'blockchain-tokenization',
      title: 'Blockchain Tokenization',
      description: 'Secure and transparent carbon credit management',
      icon: Shield,
      features: [
        'Immutable transaction records',
        'Fractional ownership',
        'Smart contract automation',
        'Greenwashing prevention'
      ]
    }
  ];

  useEffect(() => {
    if (!scrollRef.current || isPaused) return;

    const container = scrollRef.current;
    const scrollAmount = 1; // pixels per frame
    const scrollDelay = 30; // milliseconds between scroll steps

    const autoScroll = () => {
      if (container.scrollLeft >= container.scrollWidth - container.clientWidth) {
        // Reset to beginning when reached end
        container.scrollLeft = 0;
      } else {
        container.scrollLeft += scrollAmount;
      }
    };

    const interval = setInterval(autoScroll, scrollDelay);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <section id="technology" className="section-padding">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 mb-4 text-primary-600 border-primary-600"
          >
            Technology Stack
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-secondary-900 mb-6"
          >
            Cutting-Edge Technology
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-lg text-secondary-600 max-w-3xl mx-auto"
          >
            Our integrated technology platform combines mobile applications, remote sensing, blockchain tokenization, 
            and AI analytics to deliver precise monitoring and verification of environmental projects.
          </motion.p>
        </div>

        {/* Technology Cards Carousel */}
        <div className="relative mb-16">
          <div 
            ref={scrollRef}
            className="flex gap-8 overflow-x-auto scrollbar-hide pb-4"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {technologies.map((tech, index) => {
              const IconComponent = tech.icon;
              return (
                <motion.div
                  key={tech.id}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="card flex-shrink-0 w-80 hover:shadow-lg transition-all duration-300 group hover:scale-105"
                >
                  <div className="flex flex-col space-y-1.5 p-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 group-hover:bg-primary-600 rounded-lg transition-colors duration-300 mb-4">
                      <IconComponent className="w-6 h-6 text-primary-600 group-hover:text-white" />
                    </div>
                    <h3 className="font-semibold tracking-tight text-xl text-secondary-900">
                      {tech.title}
                    </h3>
                  </div>
                  
                  <div className="p-6 pt-0">
                    <p className="text-secondary-600 mb-4">
                      {tech.description}
                    </p>
                    
                    <div className="space-y-2">
                      {tech.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-primary-600 rounded-full"></div>
                          <span className="text-sm text-secondary-600">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {/* Scroll Indicators */}
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full bg-primary-300 transition-colors duration-300"
              />
            ))}
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm text-secondary-500">🔄 Auto-scrolling • Hover to pause</p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default TechnologySection;