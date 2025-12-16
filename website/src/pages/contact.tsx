import { useState } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import {
  Mail, Phone, MapPin, Send, Building2, Users,
  Code2, HelpCircle, ArrowRight
} from 'lucide-react';
import Button from '@/components/ui/Button';

const contactReasons = [
  { icon: Building2, label: 'Enterprise Sales', value: 'sales' },
  { icon: Users, label: 'Partnerships', value: 'partnerships' },
  { icon: Code2, label: 'Developer Support', value: 'developer' },
  { icon: HelpCircle, label: 'General Inquiry', value: 'general' },
];

const offices = [
  {
    city: 'Singapore',
    type: 'Headquarters',
    address: 'Enterprise Hub, Singapore',
    email: 'contact@aurigraph.io',
    phone: '+65 1234 5678',
  },
  {
    city: 'Global',
    type: 'Remote Operations',
    address: 'Worldwide Coverage',
    email: 'support@aurigraph.io',
    phone: '24/7 Support',
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    reason: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  return (
    <>
      <Head>
        <title>Contact Us | Aurigraph DLT</title>
        <meta
          name="description"
          content="Get in touch with Aurigraph DLT for enterprise sales, partnerships, or developer support."
        />
      </Head>

      {/* Hero */}
      <section className="relative pt-32 pb-20">
        <div className="absolute inset-0 quantum-grid opacity-30" />

        <div className="container-custom relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-display font-bold text-white mb-6"
            >
              Let's Build the{' '}
              <span className="gradient-text">Future Together</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-400"
            >
              Whether you're exploring tokenization or ready to deploy,
              our team is here to help.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
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
                <h2 className="text-2xl font-bold text-white mb-8">Send us a message</h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Reason Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      How can we help?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {contactReasons.map((reason) => (
                        <button
                          key={reason.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, reason: reason.value })}
                          className={`flex items-center p-4 rounded-xl border transition-all ${
                            formData.reason === reason.value
                              ? 'bg-quantum-blue/10 border-quantum-blue text-white'
                              : 'bg-slate-900/50 border-white/10 text-gray-400 hover:border-white/20'
                          }`}
                        >
                          <reason.icon className="w-5 h-5 mr-3" />
                          <span className="text-sm">{reason.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name & Email */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-gray-500 focus:border-quantum-blue focus:outline-none transition-colors"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Work Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-gray-500 focus:border-quantum-blue focus:outline-none transition-colors"
                        placeholder="john@company.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-gray-500 focus:border-quantum-blue focus:outline-none transition-colors"
                      placeholder="Company Inc."
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-gray-500 focus:border-quantum-blue focus:outline-none transition-colors resize-none"
                      placeholder="Tell us about your project or inquiry..."
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" size="lg" icon={<Send className="w-5 h-5" />}>
                    Send Message
                  </Button>
                </form>
              </div>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-8"
            >
              {/* Quick Contact */}
              <div className="p-8 rounded-2xl bg-gradient-to-br from-quantum-blue/10 to-quantum-purple/10 border border-white/5">
                <h3 className="text-xl font-bold text-white mb-6">Quick Contact</h3>
                <div className="space-y-4">
                  <a
                    href="mailto:contact@aurigraph.io"
                    className="flex items-center p-4 rounded-xl bg-slate-900/50 text-gray-300 hover:text-white transition-colors"
                  >
                    <Mail className="w-5 h-5 text-quantum-blue mr-4" />
                    contact@aurigraph.io
                  </a>
                  <a
                    href="tel:+6512345678"
                    className="flex items-center p-4 rounded-xl bg-slate-900/50 text-gray-300 hover:text-white transition-colors"
                  >
                    <Phone className="w-5 h-5 text-quantum-blue mr-4" />
                    +65 1234 5678
                  </a>
                </div>
              </div>

              {/* Offices */}
              <div>
                <h3 className="text-xl font-bold text-white mb-6">Our Offices</h3>
                <div className="space-y-4">
                  {offices.map((office, index) => (
                    <div
                      key={index}
                      className="p-6 rounded-2xl bg-slate-900/50 border border-white/5"
                    >
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-quantum-green mr-4 mt-1" />
                        <div>
                          <h4 className="text-lg font-semibold text-white">{office.city}</h4>
                          <p className="text-quantum-blue text-sm mb-2">{office.type}</p>
                          <p className="text-gray-400 text-sm mb-1">{office.address}</p>
                          <p className="text-gray-400 text-sm">{office.email}</p>
                          <p className="text-gray-400 text-sm">{office.phone}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Demo CTA */}
              <div className="p-8 rounded-2xl bg-gradient-to-br from-quantum-purple/20 to-quantum-blue/20 border border-quantum-purple/30">
                <h3 className="text-xl font-bold text-white mb-3">
                  Want a Live Demo?
                </h3>
                <p className="text-gray-400 mb-6">
                  See our platform in action with a personalized demo tailored to your use case.
                </p>
                <Button href="/demo" icon={<ArrowRight className="w-5 h-5" />}>
                  Schedule Demo
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-slate-900/30">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              {
                q: 'How long does it take to deploy a tokenization solution?',
                a: 'Typical enterprise deployments take 4-12 weeks depending on complexity and integration requirements.',
              },
              {
                q: 'What assets can be tokenized on Aurigraph?',
                a: 'Any real-world asset with verifiable ownership - real estate, commodities, carbon credits, art, infrastructure, and more.',
              },
              {
                q: 'Is Aurigraph compliant with financial regulations?',
                a: 'Yes, we support AML/KYC, GDPR, SOC 2, and work with clients to meet jurisdiction-specific requirements.',
              },
              {
                q: 'Can I integrate with existing systems?',
                a: 'Absolutely. We offer REST/gRPC APIs, SDKs, and support for common enterprise integration patterns.',
              },
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-slate-900/50 border border-white/5"
              >
                <h3 className="text-lg font-semibold text-white mb-3">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
