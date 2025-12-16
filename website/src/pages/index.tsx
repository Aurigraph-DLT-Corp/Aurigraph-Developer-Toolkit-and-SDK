import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight, Shield, Zap, Globe, Leaf, Building2,
  Lock, BarChart3, Cpu, Users, CheckCircle2, Play
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { FeatureCard, StatCard } from '@/components/ui/Card';

const stats = [
  { value: '3M+', label: 'TPS Achieved', description: 'Production-verified throughput' },
  { value: '<500ms', label: 'Finality', description: 'Deterministic settlement' },
  { value: '99.99%', label: 'Uptime', description: 'Enterprise availability' },
  { value: '90%+', label: 'Carbon Reduction', description: 'vs traditional blockchains' },
];

const features = [
  {
    icon: <Shield className="w-7 h-7" />,
    title: 'Quantum-Resistant Security',
    description: 'NIST Level 5 CRYSTALS cryptography protecting your assets against current and future quantum threats through 2030+.',
    highlight: 'Post-Quantum Ready',
  },
  {
    icon: <Zap className="w-7 h-7" />,
    title: 'Blazing Performance',
    description: '3M+ transactions per second with sub-500ms deterministic finality. No probabilistic forks, ever.',
    highlight: '100K+ TPS Baseline',
  },
  {
    icon: <Building2 className="w-7 h-7" />,
    title: 'Real-World Assets',
    description: 'Tokenize real estate, carbon credits, commodities, art and more with digital twin integration and IoT sensors.',
    highlight: 'Digital Twin Framework',
  },
  {
    icon: <Lock className="w-7 h-7" />,
    title: 'Legal Enforceability',
    description: 'Ricardian contracts combining human-readable legal text with machine-executable code for true legal binding.',
    highlight: 'Smart + Legal Contracts',
  },
  {
    icon: <Leaf className="w-7 h-7" />,
    title: 'ESG-Ready Platform',
    description: '0.022 gCO2/tx footprint with automated ESG reporting, compliance certification, and sustainability tracking.',
    highlight: '90%+ Carbon Reduction',
  },
  {
    icon: <Globe className="w-7 h-7" />,
    title: 'Enterprise Grade',
    description: 'Multi-cloud deployment, 7-year audit trails, role-based access control, and institutional-grade infrastructure.',
    highlight: '99.99% Availability',
  },
];

const useCases = [
  {
    title: 'Real Estate & REITs',
    description: 'Fractional property ownership with automated rental distribution and governance.',
    icon: Building2,
    stats: '$1B+ Tokenizable',
  },
  {
    title: 'Carbon Credits',
    description: 'Verified emission certificates with automated retirement and ESG reporting.',
    icon: Leaf,
    stats: 'Full Traceability',
  },
  {
    title: 'Commodities',
    description: 'Agricultural and mineral tokenization with supply chain integration.',
    icon: BarChart3,
    stats: 'Origin Verified',
  },
];

const partners = [
  'Enterprise Partner 1',
  'Enterprise Partner 2',
  'Enterprise Partner 3',
  'Enterprise Partner 4',
  'Enterprise Partner 5',
  'Enterprise Partner 6',
];

export default function Home() {
  return (
    <>
      <Head>
        <title>Aurigraph DLT | Institutional Blockchain for Real-World Asset Tokenization</title>
      </Head>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 quantum-grid opacity-50" />
        <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-quantum-blue/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 -right-64 w-[500px] h-[500px] bg-quantum-purple/20 rounded-full blur-[128px]" />

        <div className="container-custom relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-quantum-green animate-pulse mr-2" />
              <span className="text-gray-300 text-sm">V11.4.4 Production Ready</span>
              <span className="mx-2 text-gray-600">|</span>
              <span className="text-quantum-blue text-sm font-medium">3M+ TPS Achieved</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white leading-tight mb-6"
            >
              The Institutional Blockchain for{' '}
              <span className="gradient-text">Real-World Assets</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl md:text-2xl text-gray-400 mb-10 max-w-3xl mx-auto leading-relaxed"
            >
              Transform physical assets into digital tokens with quantum-resistant security,
              deterministic finality, and environmental sustainability.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <Button size="lg" href="/demo" icon={<ArrowRight className="w-5 h-5" />}>
                Request Enterprise Demo
              </Button>
              <Button size="lg" variant="secondary" href="/platform" icon={<Play className="w-5 h-5" />}>
                Watch Overview
              </Button>
            </motion.div>

            {/* Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 p-8 rounded-2xl bg-slate-900/50 border border-white/5"
            >
              {stats.map((stat, index) => (
                <StatCard key={index} {...stat} />
              ))}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/40 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 border-y border-white/5">
        <div className="container-custom">
          <p className="text-center text-gray-500 text-sm uppercase tracking-widest mb-8">
            Trusted by Enterprise Leaders
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-50">
            {partners.map((partner, index) => (
              <div key={index} className="text-gray-400 font-medium text-lg">
                {partner}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-padding relative">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Enterprise-Grade Blockchain Infrastructure
            </h2>
            <p className="text-xl text-gray-400">
              Built from the ground up for institutional adoption, regulatory compliance,
              and real-world asset integration.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <FeatureCard {...feature} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="section-padding bg-slate-900/30">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Tokenize Any Real-World Asset
            </h2>
            <p className="text-xl text-gray-400">
              From real estate to carbon credits, our platform supports the full
              lifecycle of asset tokenization.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/5 hover:border-quantum-blue/30 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-2xl bg-quantum-blue/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <useCase.icon className="w-8 h-8 text-quantum-blue" />
                </div>
                <h3 className="text-2xl font-semibold text-white mb-3">{useCase.title}</h3>
                <p className="text-gray-400 mb-4">{useCase.description}</p>
                <div className="flex items-center text-quantum-green font-mono text-sm">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {useCase.stats}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button href="/solutions" variant="outline" icon={<ArrowRight className="w-5 h-5" />}>
              Explore All Solutions
            </Button>
          </div>
        </div>
      </section>

      {/* Performance Comparison Section */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 quantum-grid opacity-30" />

        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                Performance That Sets the Standard
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Our HyperRAFT++ consensus algorithm delivers enterprise performance
                without compromising decentralization or security.
              </p>

              <div className="space-y-6">
                {[
                  { label: 'Throughput', value: '3M+ TPS', comparison: 'vs 7 TPS (Bitcoin)' },
                  { label: 'Finality', value: '<500ms', comparison: 'vs 60 min (Bitcoin)' },
                  { label: 'Energy', value: '0.022 gCO2/tx', comparison: 'vs 502 kg (Bitcoin)' },
                  { label: 'Settlement', value: 'Instant', comparison: 'vs T+2 days (TradFi)' },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-white/5"
                  >
                    <span className="text-gray-400">{item.label}</span>
                    <div className="text-right">
                      <span className="text-white font-semibold font-mono">{item.value}</span>
                      <span className="text-gray-500 text-sm ml-2">{item.comparison}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-quantum-blue/10 via-quantum-purple/10 to-quantum-green/10 border border-white/10 p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl font-bold text-white mb-4 font-mono">3M+</div>
                  <div className="text-2xl text-gray-400">Transactions Per Second</div>
                  <div className="mt-6 inline-flex items-center px-4 py-2 rounded-full bg-quantum-green/10 text-quantum-green text-sm">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Production Verified
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-quantum-blue/20 blur-2xl" />
              <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-quantum-purple/20 blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="section-padding bg-slate-900/30">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Shield, label: 'CRYSTALS-Kyber', desc: 'Quantum Encryption' },
                  { icon: Lock, label: 'CRYSTALS-Dilithium', desc: 'Quantum Signatures' },
                  { icon: Cpu, label: 'NIST Level 5', desc: 'Highest Security' },
                  { icon: Users, label: 'Multi-Signature', desc: 'Access Control' },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="p-6 rounded-2xl bg-slate-900/80 border border-white/5 text-center"
                  >
                    <div className="w-12 h-12 rounded-full bg-quantum-purple/10 flex items-center justify-center mx-auto mb-4">
                      <item.icon className="w-6 h-6 text-quantum-purple" />
                    </div>
                    <div className="text-white font-semibold mb-1">{item.label}</div>
                    <div className="text-gray-500 text-sm">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-quantum-purple/10 text-quantum-purple text-sm mb-6">
                <Shield className="w-4 h-4 mr-2" />
                Post-Quantum Cryptography
              </div>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
                Quantum-Resistant from Day One
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Protected against both classical and quantum computing threats
                with NIST-standardized CRYSTALS algorithms. Your assets are
                secure through 2030 and beyond.
              </p>
              <Button href="/security" icon={<ArrowRight className="w-5 h-5" />}>
                Explore Security
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-quantum-blue/10 via-quantum-purple/10 to-quantum-green/10" />
        <div className="absolute inset-0 quantum-grid opacity-30" />

        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-6">
              Ready to Tokenize the Future?
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              Join leading institutions in transforming real-world assets with
              enterprise-grade blockchain technology.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" href="/demo" icon={<ArrowRight className="w-5 h-5" />}>
                Schedule a Demo
              </Button>
              <Button size="lg" variant="outline" href="/contact">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
