import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Building2, Leaf, BarChart3, Truck, Palette, Factory,
  ArrowRight, CheckCircle2, Globe
} from 'lucide-react';
import Button from '@/components/ui/Button';

const solutions = [
  {
    icon: Building2,
    title: 'Real Estate & REITs',
    description: 'Fractional property ownership with automated rental distribution, governance voting, and digital twin integration.',
    href: '/solutions/real-estate',
    features: ['Fractional ownership', 'Automated dividends', 'Governance voting', 'IoT sensors'],
    stats: { value: '$1B+', label: 'Tokenizable Assets' },
  },
  {
    icon: Leaf,
    title: 'Carbon Credits',
    description: 'Verified emission certificates with oracle validation, automated retirement tracking, and ESG compliance reporting.',
    href: '/solutions/carbon-credits',
    features: ['Oracle verification', 'Auto retirement', 'ESG reporting', 'Full traceability'],
    stats: { value: '100%', label: 'Verified' },
  },
  {
    icon: BarChart3,
    title: 'Commodities',
    description: 'Agricultural and mineral tokenization with supply chain integration, quality verification, and origin certificates.',
    href: '/solutions/commodities',
    features: ['Origin tracking', 'Quality reports', 'Price discovery', 'Instant settlement'],
    stats: { value: 'T+0', label: 'Settlement' },
  },
  {
    icon: Truck,
    title: 'Supply Chain',
    description: 'Shipment tokenization with real-time GPS tracking, automated settlements, and provenance documentation.',
    href: '/solutions/supply-chain',
    features: ['GPS tracking', 'Auto settlement', 'Provenance docs', 'Smart contracts'],
    stats: { value: 'Real-time', label: 'Tracking' },
  },
  {
    icon: Palette,
    title: 'Art & Collectibles',
    description: 'Artwork and collectible tokenization with provenance verification, fractional ownership, and authentication.',
    href: '/solutions/art-collectibles',
    features: ['Provenance proof', 'Fractional shares', 'Authentication', 'Secure custody'],
    stats: { value: 'Verified', label: 'Authenticity' },
  },
  {
    icon: Factory,
    title: 'Infrastructure',
    description: 'Renewable energy and infrastructure project tokenization with revenue sharing and performance tracking.',
    href: '/solutions/infrastructure',
    features: ['Revenue sharing', 'Performance data', 'Green bonds', 'Impact metrics'],
    stats: { value: 'ESG', label: 'Compliant' },
  },
];

const benefits = [
  {
    title: 'Instant Settlement',
    description: 'T+0 settlement vs T+2 days in traditional finance. Reduce counterparty risk and capital requirements.',
  },
  {
    title: '24/7 Trading',
    description: 'Markets never close. Trade assets globally anytime, anywhere, without market hour restrictions.',
  },
  {
    title: 'Fractional Ownership',
    description: 'Divide any asset into tokens, enabling broader investor participation and portfolio diversification.',
  },
  {
    title: 'Transparent Pricing',
    description: 'On-chain price discovery with verifiable transaction history. No opaque spreads or hidden fees.',
  },
  {
    title: 'Programmable Assets',
    description: 'Automate dividends, governance, compliance, and reporting with smart contracts.',
  },
  {
    title: 'Global Access',
    description: 'Remove geographic barriers. Enable cross-border investment with regulatory compliance.',
  },
];

export default function Solutions() {
  return (
    <>
      <Head>
        <title>Solutions | Aurigraph DLT - Real-World Asset Tokenization</title>
        <meta
          name="description"
          content="Tokenize real estate, carbon credits, commodities, and more with Aurigraph DLT's enterprise blockchain platform."
        />
      </Head>

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center pt-32 pb-20">
        <div className="absolute inset-0 quantum-grid opacity-30" />
        <div className="absolute bottom-1/4 -left-64 w-[500px] h-[500px] bg-quantum-green/20 rounded-full blur-[128px]" />

        <div className="container-custom relative z-10">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-quantum-green/10 border border-quantum-green/30 mb-6"
            >
              <Globe className="w-4 h-4 text-quantum-green mr-2" />
              <span className="text-quantum-green text-sm font-medium">Industry Solutions</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-display font-bold text-white mb-6"
            >
              Tokenize Any{' '}
              <span className="gradient-text">Real-World Asset</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-400 leading-relaxed mb-8"
            >
              From real estate to carbon credits, our platform supports the full lifecycle
              of asset tokenization with enterprise-grade security and compliance.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button size="lg" href="/demo" icon={<ArrowRight className="w-5 h-5" />}>
                Explore Your Use Case
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="section-padding bg-slate-900/30">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {solutions.map((solution, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={solution.href}
                  className="block h-full p-8 rounded-2xl bg-slate-900/80 border border-white/5 hover:border-quantum-blue/30 transition-all duration-300 group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-quantum-blue/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <solution.icon className="w-8 h-8 text-quantum-blue" />
                  </div>

                  <h3 className="text-2xl font-semibold text-white mb-3">{solution.title}</h3>
                  <p className="text-gray-400 mb-6">{solution.description}</p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {solution.features.map((feature, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-sm"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-white/10">
                    <div>
                      <div className="text-2xl font-bold text-quantum-green font-mono">
                        {solution.stats.value}
                      </div>
                      <div className="text-gray-500 text-sm">{solution.stats.label}</div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-quantum-blue group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Why Tokenize with Aurigraph?
            </h2>
            <p className="text-xl text-gray-400">
              Transform how you manage, trade, and monetize real-world assets
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start"
              >
                <CheckCircle2 className="w-6 h-6 text-quantum-green mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">{benefit.title}</h3>
                  <p className="text-gray-400">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="section-padding bg-slate-900/30">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Traditional vs Tokenized
            </h2>
            <p className="text-xl text-gray-400">
              See the difference blockchain-based asset management makes
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div></div>
              <div className="text-center p-4 rounded-xl bg-slate-800/50">
                <span className="text-gray-400">Traditional</span>
              </div>
              <div className="text-center p-4 rounded-xl bg-quantum-blue/10 border border-quantum-blue/30">
                <span className="text-quantum-blue font-semibold">Aurigraph</span>
              </div>
            </div>

            {[
              { metric: 'Settlement', traditional: 'T+2 Days', aurigraph: 'Instant' },
              { metric: 'Trading Hours', traditional: 'Market Hours', aurigraph: '24/7/365' },
              { metric: 'Minimum Investment', traditional: '$100K+', aurigraph: 'Any Amount' },
              { metric: 'Geographic Access', traditional: 'Limited', aurigraph: 'Global' },
              { metric: 'Transparency', traditional: 'Limited', aurigraph: 'Full On-chain' },
              { metric: 'Automation', traditional: 'Manual', aurigraph: 'Smart Contracts' },
            ].map((row, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="grid grid-cols-3 gap-4 mb-2"
              >
                <div className="p-4 rounded-xl bg-slate-900/50 text-gray-300 font-medium">
                  {row.metric}
                </div>
                <div className="p-4 rounded-xl bg-slate-800/50 text-center text-gray-400">
                  {row.traditional}
                </div>
                <div className="p-4 rounded-xl bg-quantum-green/10 text-center text-quantum-green font-semibold">
                  {row.aurigraph}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-r from-quantum-green/10 via-quantum-blue/10 to-quantum-purple/10">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Ready to Transform Your Assets?
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              Let us show you how tokenization can unlock new value and liquidity
              for your real-world assets.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" href="/demo" icon={<ArrowRight className="w-5 h-5" />}>
                Schedule Consultation
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
