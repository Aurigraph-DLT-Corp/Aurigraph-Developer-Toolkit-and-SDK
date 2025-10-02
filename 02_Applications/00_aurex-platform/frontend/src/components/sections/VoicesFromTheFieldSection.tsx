import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  ChatBubbleLeftRightIcon as QuoteIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  MapPinIcon,
  CalendarDaysIcon,
  TrophyIcon,
  StarIcon,
  ChartBarIcon,
  ArrowPathIcon as LeafIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';

// Data for different Aurex offerings and their real-world impact
const voicesData = [
  {
    offering: 'Aurex Launchpad',
    icon: ChartBarIcon,
    color: 'emerald',
    stories: [
      {
        id: 1,
        quote: "Aurex Launchpad transformed our ESG reporting from a 6-week manual process to just 3 days of automated analysis. The AI-powered insights helped us identify $2.3M in cost savings opportunities through energy efficiency improvements.",
        author: "Dr. Sarah Chen",
        title: "Chief Sustainability Officer",
        company: "Global Manufacturing Corp",
        location: "Munich, Germany",
        impact: {
          metric: "94%",
          description: "Reduction in reporting time",
          secondary: "$2.3M saved through optimization"
        },
        date: "December 2024",
        featured: true
      },
      {
        id: 2,
        quote: "The Carbon Maturity Model assessment revealed we were operating at Level 2 when we thought we were at Level 4. The roadmap they provided helped us achieve Level 4 certification within 8 months, opening doors to new green financing opportunities.",
        author: "Marcus Rodriguez",
        title: "ESG Director",
        company: "European Energy Solutions",
        location: "Barcelona, Spain", 
        impact: {
          metric: "Level 4",
          description: "Carbon accounting maturity achieved",
          secondary: "€15M green financing secured"
        },
        date: "November 2024",
        featured: false
      }
    ]
  },
  {
    offering: 'Aurex HydroPulse',
    icon: GlobeAltIcon,
    color: 'blue',
    stories: [
      {
        id: 3,
        quote: "HydroPulse's AI-powered water monitoring system detected inefficiencies that saved us 2.8 million gallons annually. The real-time alerts prevented three potential contamination events that could have cost us millions in cleanup and fines.",
        author: "Jennifer Park",
        title: "Water Resource Manager",
        company: "Pacific Agriculture Holdings",
        location: "California, USA",
        impact: {
          metric: "2.8M",
          description: "Gallons saved annually",
          secondary: "3 contamination events prevented"
        },
        date: "October 2024",
        featured: true
      },
      {
        id: 4,
        quote: "The precision irrigation recommendations from HydroPulse increased our crop yield by 23% while reducing water consumption by 31%. Our farmers are now more profitable and environmentally responsible.",
        author: "Ahmed Hassan",
        title: "Agricultural Technology Director",
        company: "Cape Agricultural Cooperative",
        location: "Cape Town, South Africa",
        impact: {
          metric: "23%",
          description: "Increase in crop yield",
          secondary: "31% reduction in water usage"
        },
        date: "September 2024",
        featured: false
      }
    ]
  },
  {
    offering: 'Aurex SylvaGraph',
    icon: LeafIcon,
    color: 'green',
    stories: [
      {
        id: 5,
        quote: "SylvaGraph's satellite monitoring and AI analysis helped us optimize our reforestation program, increasing survival rates from 67% to 94%. We've now sequestered over 45,000 tons of CO2 ahead of our 5-year target.",
        author: "Dr. Maria Santos",
        title: "Forest Conservation Director",
        company: "Sandalwood Farmers Association",
        location: "Karnataka, India",
        impact: {
          metric: "94%",
          description: "Tree survival rate achieved",
          secondary: "45,000 tons CO2 sequestered"
        },
        date: "November 2024",
        featured: true
      },
      {
        id: 6,
        quote: "The biodiversity impact assessments from SylvaGraph identified 3 endangered species in our project area we hadn't detected. This led to a conservation partnership that secured $8M in additional funding.",
        author: "Robert MacLeod",
        title: "Environmental Program Manager",
        company: "Canadian Forestry Council",
        location: "Vancouver, Canada",
        impact: {
          metric: "3",
          description: "Endangered species identified",
          secondary: "$8M additional funding secured"
        },
        date: "August 2024",
        featured: false
      }
    ]
  },
  {
    offering: 'Aurex CarbonTrace',
    icon: TrophyIcon,
    color: 'purple',
    stories: [
      {
        id: 7,
        quote: "CarbonTrace's supply chain analysis revealed that 78% of our carbon footprint was hidden in Scope 3 emissions. Their supplier engagement platform helped us reduce overall emissions by 42% and achieve carbon neutrality 2 years ahead of schedule.",
        author: "Lisa Thompson",
        title: "Chief Operations Officer",
        company: "Global Retail Networks",
        location: "London, UK",
        impact: {
          metric: "42%",
          description: "Overall emissions reduction",
          secondary: "Carbon neutrality 2 years early"
        },
        date: "December 2024",
        featured: true
      },
      {
        id: 8,
        quote: "The product carbon footprint analysis from CarbonTrace helped us redesign our packaging, reducing material usage by 35% and transportation emissions by 28%. Our customers love the new eco-friendly design.",
        author: "David Kim",
        title: "Sustainability Lead",
        company: "Tech Solutions Inc",
        location: "Seoul, South Korea",
        impact: {
          metric: "35%",
          description: "Material usage reduction",
          secondary: "28% lower transport emissions"
        },
        date: "October 2024",
        featured: false
      }
    ]
  }
];


const VoicesFromTheFieldSection: React.FC = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
    rootMargin: '-50px 0px',
  });

  // Auto-scroll functionality
  const [currentIndex, setCurrentIndex] = useState(0);
  const allStories = voicesData.flatMap(offering => 
    offering.stories.map(story => ({ ...story, offering: offering.offering, color: offering.color, icon: offering.icon }))
  );

  // Auto-scroll every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allStories.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [allStories.length]);

  // Helper functions for dynamic classes

  const getImpactBackgroundClass = (color: string) => {
    const colorClasses = {
      emerald: 'bg-gradient-to-r from-emerald-50 to-emerald-100',
      blue: 'bg-gradient-to-r from-blue-50 to-blue-100',
      green: 'bg-gradient-to-r from-green-50 to-green-100',
      purple: 'bg-gradient-to-r from-purple-50 to-purple-100'
    };
    return colorClasses[color as keyof typeof colorClasses] || 'bg-gradient-to-r from-gray-50 to-gray-100';
  };

  const getImpactTextClass = (color: string) => {
    const colorClasses = {
      emerald: 'text-emerald-600',
      blue: 'text-blue-600',
      green: 'text-green-600',
      purple: 'text-purple-600'
    };
    return colorClasses[color as keyof typeof colorClasses] || 'text-gray-600';
  };


  return (
    <section ref={ref} className="section-padding bg-gradient-to-br from-gray-50 via-white to-gray-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-accent-100 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
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
            <QuoteIcon className="w-4 h-4 mr-2" />
            Voices from the Field
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 md:mb-6">
            Real Impact, Real Results
            <span className="block bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Across Every Offering
            </span>
          </h2>
          
          <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto mb-8 md:mb-12">
            Discover how organizations worldwide are transforming their environmental impact with Aurex.
            From ESG reporting to carbon management, see the measurable difference our platform makes.
          </p>
        </motion.div>

        {/* Auto-scroll Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-center gap-2 mb-8 md:mb-12"
        >
          {allStories.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentIndex ? 'w-8 bg-primary-600' : 'w-3 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </motion.div>

        {/* Auto-scrollable Story Cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Story Content */}
              <div className="p-8 lg:p-12">
                <div className="flex flex-col lg:flex-row items-start gap-8">
                  {/* Offering Badge */}
                  <div className="flex items-center gap-3 mb-6 lg:mb-0">
                    <div className={`p-3 rounded-xl ${getImpactBackgroundClass(allStories[currentIndex].color)}`}>
                      {React.createElement(allStories[currentIndex].icon, { 
                        className: `w-6 h-6 ${getImpactTextClass(allStories[currentIndex].color)}` 
                      })}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{allStories[currentIndex].offering}</div>
                      {allStories[currentIndex].featured && (
                        <div className="flex items-center gap-1">
                          <StarIcon className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-yellow-600">Featured Story</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Story Content */}
                  <div className="flex-1">
                    {/* Quote */}
                    <div className="relative mb-8">
                      <QuoteIcon className="w-8 h-8 text-primary-300 absolute -top-2 -left-2" />
                      <blockquote className="text-lg lg:text-xl text-gray-700 leading-relaxed pl-6">
                        "{allStories[currentIndex].quote}"
                      </blockquote>
                    </div>

                    {/* Author Info */}
                    <div className="flex flex-wrap items-center gap-6 mb-6">
                      <div>
                        <div className="font-bold text-gray-900 text-lg">{allStories[currentIndex].author}</div>
                        <div className="text-gray-600">{allStories[currentIndex].title}</div>
                        <div className="font-medium text-primary-600">{allStories[currentIndex].company}</div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPinIcon className="w-4 h-4" />
                          {allStories[currentIndex].location}
                        </div>
                        <div className="flex items-center gap-1">
                          <CalendarDaysIcon className="w-4 h-4" />
                          {allStories[currentIndex].date}
                        </div>
                      </div>
                    </div>

                    {/* Impact Metrics */}
                    <div className={`${getImpactBackgroundClass(allStories[currentIndex].color)} p-6 rounded-xl`}>
                      <div className="flex flex-wrap items-center gap-8">
                        <div className="text-center">
                          <div className={`text-3xl font-bold ${getImpactTextClass(allStories[currentIndex].color)} mb-1`}>
                            {allStories[currentIndex].impact.metric}
                          </div>
                          <div className="text-sm text-gray-600">{allStories[currentIndex].impact.description}</div>
                        </div>
                        <div className="flex-1 text-center lg:text-left">
                          <div className="text-sm font-medium text-gray-700">
                            {allStories[currentIndex].impact.secondary}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + allStories.length) % allStories.length)}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Previous
            </button>

            <div className="text-sm text-gray-500">
              {currentIndex + 1} of {allStories.length}
            </div>

            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % allStories.length)}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              Next
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default VoicesFromTheFieldSection;