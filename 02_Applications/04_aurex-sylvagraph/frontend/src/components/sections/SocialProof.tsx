/**
 * SocialProof Section
 * Testimonials, case studies, and final CTAs
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Quote, Star, ArrowRight, Users, TrendingUp, Award } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

const testimonials = [
  {
    quote: "Sylvagraph transformed our forest management approach. We've generated 240,000 carbon credits in our first year while improving biodiversity by 35%.",
    author: "Maria Rodriguez",
    title: "Sustainability Director",
    company: "GreenForest Corp",
    avatar: "MR",
    rating: 5
  },
  {
    quote: "The automated MRV system saved us countless hours of manual reporting. Audit-ready documentation generated automatically with 99.9% accuracy.",
    author: "Dr. James Chen",
    title: "Carbon Program Manager",
    company: "EcoVentures Ltd",
    avatar: "JC",
    rating: 5
  },
  {
    quote: "Real-time monitoring detected early signs of pest infestation, allowing us to take preventive action. The ROI has been exceptional.",
    author: "Sarah Thompson",
    title: "Forest Operations Lead",
    company: "Timberland Solutions",
    avatar: "ST",
    rating: 5
  }
]

const caseStudyHighlights = [
  {
    icon: Users,
    metric: "15,000+",
    label: "Forest Owners",
    description: "Active users managing carbon credits"
  },
  {
    icon: TrendingUp,
    metric: "40%",
    label: "Revenue Increase",
    description: "Average increase in forest asset value"
  },
  {
    icon: Award,
    metric: "98%",
    label: "Client Retention",
    description: "Customer satisfaction and retention rate"
  }
]

export const SocialProof: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-white to-sand-50" aria-labelledby="social-proof">
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
              Customer Success
            </Badge>
            <h2 id="social-proof" className="text-4xl font-bold text-ink-900 mb-6">
              Trusted by Forest Leaders Worldwide
            </h2>
            <p className="text-xl text-ink-600 leading-relaxed max-w-3xl mx-auto">
              Join thousands of forest owners, ESG managers, and sustainability professionals 
              who rely on Sylvagraph for their carbon credit operations.
            </p>
          </motion.div>

          {/* Testimonials Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-xl transition-all duration-300 relative">
                  {/* Quote Icon */}
                  <div className="absolute top-4 right-4 opacity-10">
                    <Quote className="h-12 w-12 text-forest-600" />
                  </div>

                  {/* Rating Stars */}
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-mint-500 fill-current" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-ink-700 leading-relaxed mb-6 relative z-10">
                    "{testimonial.quote}"
                  </p>

                  {/* Author Info */}
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-forest-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-forest-700 font-semibold text-sm">
                        {testimonial.avatar}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-ink-900">{testimonial.author}</div>
                      <div className="text-sm text-ink-600">{testimonial.title}</div>
                      <div className="text-sm font-medium text-forest-600">{testimonial.company}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Case Study Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-2xl p-8 shadow-lg border border-sand-200 mb-16"
          >
            <h3 className="text-2xl font-bold text-ink-900 mb-8 text-center">
              Measurable Impact Across Our Customer Base
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {caseStudyHighlights.map((highlight, index) => (
                <motion.div
                  key={highlight.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.4 + index * 0.1 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 bg-forest-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <highlight.icon className="h-8 w-8 text-forest-600" />
                  </div>
                  <div className="text-3xl font-bold text-ink-900 mb-2">
                    {highlight.metric}
                  </div>
                  <div className="font-semibold text-ink-900 mb-2">
                    {highlight.label}
                  </div>
                  <div className="text-ink-600 text-sm">
                    {highlight.description}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Final CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-gradient-to-r from-forest-600 to-mint-600 rounded-2xl p-12 text-white text-center"
          >
            <h3 className="text-3xl font-bold mb-4">
              Ready to Transform Your Forest Assets?
            </h3>
            <p className="text-forest-100 text-xl mb-8 max-w-2xl mx-auto">
              Join the carbon economy revolution. Start generating verified carbon credits 
              from your forest assets with our comprehensive platform.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button className="bg-white text-forest-600 px-8 py-4 rounded-lg font-semibold hover:bg-sand-50 transition-colors flex items-center">
                Start Free Demo Project
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
              <button className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:bg-opacity-10 transition-colors">
                Schedule Expert Consultation
              </button>
            </div>

            {/* Trust Indicators */}
            <div className="text-forest-100 text-sm">
              ✓ No setup fees • ✓ 30-day free trial • ✓ Expert support included
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center mt-12"
          >
            <p className="text-ink-600 mb-4">
              Questions about implementation or custom requirements?
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <div>
                <span className="font-medium text-ink-900">Email us:</span>
                <a href="mailto:sylvagraph@aurigraph.io" className="text-forest-600 hover:text-forest-700 ml-2 underline">
                  sylvagraph@aurigraph.io
                </a>
              </div>
              <div>
                <span className="font-medium text-ink-900">Call us:</span>
                <a href="tel:+1-555-FOREST-1" className="text-forest-600 hover:text-forest-700 ml-2 underline">
                  +1 (555) FOREST-1
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}