import Head from 'next/head';
import { motion } from 'framer-motion';
import {
  Building2, Shield, Zap, Globe, Users, Clock,
  CheckCircle2, ArrowRight, HeadphonesIcon, FileCheck
} from 'lucide-react';
import Button from '@/components/ui/Button';

const enterpriseFeatures = [
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'SOC 2 Type II certified with quantum-resistant cryptography and zero-trust architecture.',
  },
  {
    icon: Zap,
    title: 'Guaranteed Performance',
    description: 'SLA-backed 99.99% uptime with 100K+ TPS baseline and <500ms finality.',
  },
  {
    icon: Globe,
    title: 'Global Deployment',
    description: 'Multi-region, multi-cloud infrastructure for worldwide availability.',
  },
  {
    icon: Users,
    title: 'Dedicated Support',
    description: '24/7 enterprise support with dedicated account management and technical architects.',
  },
  {
    icon: FileCheck,
    title: 'Compliance Ready',
    description: 'Built-in AML/KYC, GDPR, and regulatory compliance frameworks.',
  },
  {
    icon: Clock,
    title: 'Rapid Deployment',
    description: 'Go from concept to production in weeks with our proven implementation methodology.',
  },
];

const integrations = [
  'SAP', 'Salesforce', 'Oracle', 'Microsoft Dynamics',
  'Workday', 'ServiceNow', 'Custom ERP', 'Legacy Systems',
];

const useCases = [
  {
    title: 'Wealth Management',
    description: 'Tokenize alternative assets for high-net-worth portfolios',
    benefits: ['Fractional ownership', 'Automated reporting', 'Instant settlement'],
  },
  {
    title: 'Investment Banking',
    description: 'Streamline capital markets and securities operations',
    benefits: ['T+0 settlement', 'Reduced counterparty risk', 'Global access'],
  },
  {
    title: 'Real Estate',
    description: 'Transform property investment and management',
    benefits: ['Fractional REITs', 'Automated dividends', 'Governance voting'],
  },
  {
    title: 'Commodities',
    description: 'Modernize commodity trading and supply chain',
    benefits: ['Origin tracking', 'Instant settlement', 'Quality verification'],
  },
];

export default function Enterprise() {
  return (
    <>
      <Head>
        <title>Enterprise Solutions | Aurigraph DLT</title>
        <meta
          name="description"
          content="Enterprise-grade blockchain for institutional asset tokenization with SLA-backed performance, dedicated support, and compliance."
        />
      </Head>

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center pt-32 pb-20">
        <div className="absolute inset-0 quantum-grid opacity-30" />
        <div className="absolute top-1/3 -left-32 w-[500px] h-[500px] bg-quantum-blue/20 rounded-full blur-[128px]" />

        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center px-4 py-2 rounded-full bg-quantum-blue/10 border border-quantum-blue/30 mb-6"
              >
                <Building2 className="w-4 h-4 text-quantum-blue mr-2" />
                <span className="text-quantum-blue text-sm font-medium">Enterprise</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-6xl font-display font-bold text-white mb-6"
              >
                Built for{' '}
                <span className="gradient-text">Institutional Scale</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-gray-400 leading-relaxed mb-8"
              >
                Enterprise-grade blockchain infrastructure with SLA-backed performance,
                dedicated support, and comprehensive compliance frameworks.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-4"
              >
                <Button size="lg" href="/demo" icon={<ArrowRight className="w-5 h-5" />}>
                  Talk to Sales
                </Button>
                <Button size="lg" variant="secondary" href="/contact">
                  Contact Us
                </Button>
              </motion.div>
            </div>

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="p-8 rounded-3xl bg-slate-900/80 border border-white/10"
            >
              <h3 className="text-xl font-bold text-white mb-6">Enterprise SLA</h3>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { value: '99.99%', label: 'Uptime SLA' },
                  { value: '100K+', label: 'TPS Guaranteed' },
                  { value: '<500ms', label: 'Finality SLA' },
                  { value: '24/7', label: 'Support' },
                  { value: '<4hr', label: 'Response Time' },
                  { value: '7 Years', label: 'Audit Retention' },
                ].map((stat, index) => (
                  <div key={index} className="text-center p-4 rounded-xl bg-white/5">
                    <div className="text-2xl font-bold text-quantum-blue font-mono">{stat.value}</div>
                    <div className="text-gray-400 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-slate-900/30">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Enterprise-Grade Features
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need for institutional-scale blockchain deployment
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {enterpriseFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-2xl bg-slate-900/80 border border-white/5"
              >
                <div className="w-14 h-14 rounded-xl bg-quantum-blue/20 flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-quantum-blue" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Enterprise Use Cases
            </h2>
            <p className="text-xl text-gray-400">
              Transforming industries with blockchain-powered asset management
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-2xl bg-slate-900/50 border border-white/5"
              >
                <h3 className="text-2xl font-bold text-white mb-3">{useCase.title}</h3>
                <p className="text-gray-400 mb-6">{useCase.description}</p>
                <div className="flex flex-wrap gap-2">
                  {useCase.benefits.map((benefit, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-quantum-green/10 text-quantum-green text-sm"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {benefit}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="section-padding bg-slate-900/30">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-display font-bold text-white mb-6">
                Seamless Enterprise Integration
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Connect with your existing enterprise systems through our robust
                API layer and pre-built integrations.
              </p>

              <div className="space-y-4">
                {[
                  'REST & gRPC APIs',
                  'Webhook notifications',
                  'SSO/SAML integration',
                  'Custom connector development',
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-quantum-green mr-3" />
                    <span className="text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              {integrations.map((integration, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-slate-900/80 border border-white/5 text-center"
                >
                  <span className="text-gray-400 text-sm">{integration}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Support Tiers */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Enterprise Support
            </h2>
            <p className="text-xl text-gray-400">
              Dedicated support tailored to your organization's needs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                tier: 'Standard',
                features: [
                  'Business hours support',
                  'Email & chat support',
                  '8-hour response SLA',
                  'Documentation access',
                ],
              },
              {
                tier: 'Premium',
                highlight: true,
                features: [
                  '24/7 support',
                  'Phone & video support',
                  '4-hour response SLA',
                  'Dedicated account manager',
                  'Quarterly business reviews',
                ],
              },
              {
                tier: 'Enterprise',
                features: [
                  '24/7 priority support',
                  'Dedicated technical architect',
                  '1-hour response SLA',
                  'Custom SLA options',
                  'On-site support available',
                  'Executive escalation path',
                ],
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`p-8 rounded-2xl border ${
                  plan.highlight
                    ? 'bg-gradient-to-br from-quantum-blue/20 to-quantum-purple/20 border-quantum-blue/30'
                    : 'bg-slate-900/50 border-white/5'
                }`}
              >
                {plan.highlight && (
                  <span className="inline-block px-3 py-1 rounded-full bg-quantum-blue/20 text-quantum-blue text-sm mb-4">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold text-white mb-6">{plan.tier}</h3>
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-quantum-green mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-r from-quantum-blue/10 via-quantum-purple/10 to-quantum-green/10">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <HeadphonesIcon className="w-16 h-16 text-quantum-blue mx-auto mb-6" />
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Ready to Transform Your Enterprise?
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              Our enterprise team is ready to help you explore how blockchain
              can transform your business operations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" href="/demo" icon={<ArrowRight className="w-5 h-5" />}>
                Schedule Enterprise Demo
              </Button>
              <Button size="lg" variant="outline" href="/contact">
                Contact Enterprise Sales
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
