import { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import {
  Play, Calendar, CheckCircle2, Building2, Users, Globe,
  Zap, Shield, Leaf
} from 'lucide-react';
import Button from '@/components/ui/Button';

const demoTopics = [
  'Real-World Asset Tokenization',
  'Carbon Credit Management',
  'Real Estate & REITs',
  'Supply Chain Tracking',
  'API & Developer Tools',
  'Security & Compliance',
];

const benefits = [
  { icon: Zap, title: '3M+ TPS', description: 'Production-verified performance' },
  { icon: Shield, title: 'Quantum-Safe', description: 'NIST Level 5 security' },
  { icon: Leaf, title: 'ESG Ready', description: '90% carbon reduction' },
  { icon: Globe, title: 'Global', description: '24/7/365 availability' },
];

export default function Demo() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    role: '',
    interest: '',
    timeline: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Demo request:', formData);
  };

  return (
    <>
      <Head>
        <title>Request Demo | Aurigraph DLT</title>
        <meta
          name="description"
          content="Schedule a personalized demo of Aurigraph DLT's enterprise blockchain platform for real-world asset tokenization."
        />
      </Head>

      {/* Hero */}
      <section className="relative pt-32 pb-16">
        <div className="absolute inset-0 quantum-grid opacity-30" />
        <div className="absolute top-1/3 -right-64 w-[500px] h-[500px] bg-quantum-blue/20 rounded-full blur-[128px]" />

        <div className="container-custom relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-quantum-blue/10 border border-quantum-blue/30 mb-6"
            >
              <Play className="w-4 h-4 text-quantum-blue mr-2" />
              <span className="text-quantum-blue text-sm font-medium">Live Demo</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-display font-bold text-white mb-6"
            >
              See Aurigraph in{' '}
              <span className="gradient-text">Action</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-400"
            >
              Get a personalized walkthrough of our enterprise blockchain platform
              tailored to your specific use case.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Benefits Bar */}
      <section className="py-8 border-y border-white/5">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center justify-center space-x-3">
                <benefit.icon className="w-5 h-5 text-quantum-blue" />
                <div>
                  <div className="text-white font-semibold">{benefit.title}</div>
                  <div className="text-gray-500 text-sm">{benefit.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="p-8 lg:p-10 rounded-3xl bg-slate-900/50 border border-white/5">
                <h2 className="text-2xl font-bold text-white mb-2">Request Your Demo</h2>
                <p className="text-gray-400 mb-8">Fill out the form and we'll be in touch within 24 hours.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-gray-500 focus:border-quantum-blue focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-gray-500 focus:border-quantum-blue focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Work Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-gray-500 focus:border-quantum-blue focus:outline-none"
                      required
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Company *
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-gray-500 focus:border-quantum-blue focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Role
                      </label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white focus:border-quantum-blue focus:outline-none"
                      >
                        <option value="">Select role</option>
                        <option value="executive">C-Level / Executive</option>
                        <option value="director">Director / VP</option>
                        <option value="manager">Manager</option>
                        <option value="developer">Developer / Engineer</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      What interests you most?
                    </label>
                    <select
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white focus:border-quantum-blue focus:outline-none"
                    >
                      <option value="">Select topic</option>
                      {demoTopics.map((topic) => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Project Timeline
                    </label>
                    <select
                      value={formData.timeline}
                      onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white focus:border-quantum-blue focus:outline-none"
                    >
                      <option value="">Select timeline</option>
                      <option value="immediate">Immediate (This quarter)</option>
                      <option value="soon">Soon (Next quarter)</option>
                      <option value="planning">Planning Phase</option>
                      <option value="exploring">Just Exploring</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Anything specific you'd like to see?
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-gray-500 focus:border-quantum-blue focus:outline-none resize-none"
                      placeholder="Tell us about your project..."
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg" icon={<Calendar className="w-5 h-5" />}>
                    Schedule Demo
                  </Button>

                  <p className="text-gray-500 text-sm text-center">
                    By submitting, you agree to our Privacy Policy and Terms of Service.
                  </p>
                </form>
              </div>
            </motion.div>

            {/* What to Expect */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-8"
            >
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">What to Expect</h3>
                <div className="space-y-4">
                  {[
                    {
                      title: 'Platform Overview',
                      description: '15-minute walkthrough of core features and capabilities',
                    },
                    {
                      title: 'Use Case Deep Dive',
                      description: 'Tailored demonstration for your specific industry and needs',
                    },
                    {
                      title: 'Live Q&A',
                      description: 'Direct access to our technical team for all your questions',
                    },
                    {
                      title: 'Next Steps',
                      description: 'Custom proposal and implementation roadmap',
                    },
                  ].map((item, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle2 className="w-6 h-6 text-quantum-green mr-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="text-white font-semibold">{item.title}</h4>
                        <p className="text-gray-400">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Testimonial */}
              <div className="p-8 rounded-2xl bg-gradient-to-br from-quantum-blue/10 to-quantum-purple/10 border border-white/5">
                <p className="text-gray-300 text-lg italic mb-6">
                  "The demo exceeded our expectations. The team understood our requirements
                  and showed us exactly how Aurigraph could transform our asset management."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-quantum-blue/20 flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-quantum-blue" />
                  </div>
                  <div>
                    <div className="text-white font-semibold">Enterprise Client</div>
                    <div className="text-gray-500 text-sm">Financial Services</div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: '500+', label: 'Demos Delivered' },
                  { value: '85%', label: 'Conversion Rate' },
                  { value: '<24h', label: 'Response Time' },
                ].map((stat, index) => (
                  <div key={index} className="text-center p-4 rounded-xl bg-slate-900/50 border border-white/5">
                    <div className="text-2xl font-bold text-white font-mono">{stat.value}</div>
                    <div className="text-gray-500 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
