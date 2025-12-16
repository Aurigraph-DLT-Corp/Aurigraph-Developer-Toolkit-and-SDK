import Head from 'next/head';
import { motion } from 'framer-motion';
import {
  Cpu, Zap, Shield, Database, Layers, GitBranch,
  Server, Cloud, Lock, ArrowRight, CheckCircle2
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card, { FeatureCard } from '@/components/ui/Card';

const architectureLayers = [
  {
    name: 'Application Layer',
    description: 'REST/gRPC APIs, Enterprise Portal, Mobile SDK',
    icon: Layers,
    color: 'quantum-blue',
  },
  {
    name: 'Smart Contract Layer',
    description: 'Ricardian Contracts, Token Standards, Governance',
    icon: GitBranch,
    color: 'quantum-purple',
  },
  {
    name: 'Consensus Layer',
    description: 'HyperRAFT++, Byzantine Fault Tolerance, AI Optimization',
    icon: Cpu,
    color: 'quantum-green',
  },
  {
    name: 'Storage Layer',
    description: 'Three-tier Hybrid: Hazelcast, Redis, MongoDB',
    icon: Database,
    color: 'quantum-blue',
  },
  {
    name: 'Network Layer',
    description: 'P2P Mesh, TLS 1.3, Cross-cloud Connectivity',
    icon: Cloud,
    color: 'quantum-purple',
  },
  {
    name: 'Cryptography Layer',
    description: 'CRYSTALS-Kyber, CRYSTALS-Dilithium, Merkle Trees',
    icon: Lock,
    color: 'quantum-green',
  },
];

const techSpecs = [
  { category: 'Runtime', specs: ['Java 21 with Virtual Threads', 'Quarkus 3.26.2', 'GraalVM Native Image'] },
  { category: 'Performance', specs: ['3M+ TPS Production Verified', '<500ms Deterministic Finality', '<1s Native Startup'] },
  { category: 'Storage', specs: ['PostgreSQL 16 (Metadata)', 'RocksDB (State)', 'Hazelcast (Hot Data)'] },
  { category: 'Security', specs: ['NIST Level 5 Cryptography', 'OAuth 2.0/JWT', 'TLS 1.3'] },
];

const consensusFeatures = [
  { title: 'Parallel Log Replication', description: '8 concurrent streams for maximum throughput' },
  { title: 'Batch Processing', description: '10K transactions per batch for efficiency' },
  { title: 'Pipelined Consensus', description: '3 concurrent rounds minimize latency' },
  { title: 'AI-Driven Ordering', description: 'ML-optimized transaction sequencing' },
  { title: 'Byzantine Tolerance', description: 'f < n/3 fault tolerance guarantee' },
  { title: 'Deterministic Finality', description: 'Zero probabilistic forks ever' },
];

export default function Platform() {
  return (
    <>
      <Head>
        <title>Platform & Technology | Aurigraph DLT</title>
        <meta
          name="description"
          content="Explore Aurigraph DLT's enterprise blockchain architecture, HyperRAFT++ consensus, and quantum-resistant cryptography."
        />
      </Head>

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center pt-32 pb-20">
        <div className="absolute inset-0 quantum-grid opacity-30" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-quantum-purple/20 rounded-full blur-[128px]" />

        <div className="container-custom relative z-10">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6"
            >
              <Cpu className="w-4 h-4 text-quantum-blue mr-2" />
              <span className="text-quantum-blue text-sm font-medium">Platform Technology</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-display font-bold text-white mb-6"
            >
              Enterprise-Grade{' '}
              <span className="gradient-text">Blockchain Infrastructure</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-400 leading-relaxed mb-8"
            >
              Built from the ground up for institutional adoption with quantum-resistant
              security, deterministic finality, and unmatched performance.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Button href="/demo" icon={<ArrowRight className="w-5 h-5" />}>
                Request Demo
              </Button>
              <Button variant="secondary" href="/developers/docs">
                View Documentation
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Performance Stats */}
      <section className="py-16 border-y border-white/5">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '3M+', label: 'TPS Achieved', highlight: 'Production Verified' },
              { value: '<500ms', label: 'Finality', highlight: 'Deterministic' },
              { value: '<1s', label: 'Startup Time', highlight: 'Native Image' },
              { value: '<256MB', label: 'Memory', highlight: 'Footprint' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2 font-mono">
                  {stat.value}
                </div>
                <div className="text-gray-300 font-semibold mb-1">{stat.label}</div>
                <div className="text-quantum-green text-sm">{stat.highlight}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" className="section-padding">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Layered Architecture
            </h2>
            <p className="text-xl text-gray-400">
              A modular, enterprise-ready architecture designed for scalability,
              security, and maintainability.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {architectureLayers.map((layer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-quantum-blue/30 transition-colors"
              >
                <div className={`w-14 h-14 rounded-xl bg-${layer.color}/20 flex items-center justify-center mr-6`}>
                  <layer.icon className={`w-7 h-7 text-${layer.color}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-1">{layer.name}</h3>
                  <p className="text-gray-400">{layer.description}</p>
                </div>
                <div className="text-gray-600 font-mono text-sm">Layer {index + 1}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Consensus */}
      <section className="section-padding bg-slate-900/30">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-quantum-blue/10 text-quantum-blue text-sm mb-6">
                <Zap className="w-4 h-4 mr-2" />
                HyperRAFT++ Consensus
              </div>
              <h2 className="text-4xl font-display font-bold text-white mb-6">
                Next-Generation Consensus Algorithm
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Our enhanced RAFT implementation delivers enterprise performance through
                parallel processing, batch optimization, and AI-driven transaction ordering.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {consensusFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-quantum-green mr-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-white font-medium">{feature.title}</div>
                      <div className="text-gray-500 text-sm">{feature.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-quantum-blue/10 to-quantum-purple/10 border border-white/10 p-8">
                <div className="h-full flex flex-col justify-center items-center text-center">
                  <div className="text-6xl font-bold text-white mb-4 font-mono">HyperRAFT++</div>
                  <div className="text-gray-400 mb-6">Enterprise Consensus</div>
                  <div className="grid grid-cols-3 gap-4 w-full">
                    {[
                      { value: '8x', label: 'Parallel Streams' },
                      { value: '10K', label: 'Tx/Batch' },
                      { value: '3', label: 'Pipeline Rounds' },
                    ].map((item, index) => (
                      <div key={index} className="p-3 rounded-xl bg-white/5">
                        <div className="text-xl font-bold text-quantum-blue font-mono">{item.value}</div>
                        <div className="text-xs text-gray-500">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Specs */}
      <section id="specs" className="section-padding">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Technical Specifications
            </h2>
            <p className="text-xl text-gray-400">
              Production-verified specifications powering enterprise deployments
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {techSpecs.map((spec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-slate-900/50 border border-white/5"
              >
                <h3 className="text-lg font-semibold text-quantum-blue mb-4">{spec.category}</h3>
                <ul className="space-y-3">
                  {spec.specs.map((item, i) => (
                    <li key={i} className="flex items-center text-gray-300 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-quantum-green mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Storage Architecture */}
      <section className="section-padding bg-slate-900/30">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Three-Tier Hybrid Storage
            </h2>
            <p className="text-xl text-gray-400">
              Optimized data placement for maximum performance at every access pattern
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                tier: 'Hot Data',
                tech: 'Hazelcast',
                capacity: '32GB',
                latency: '<1ms',
                desc: 'Recent transactions and active state',
                color: 'quantum-blue',
              },
              {
                tier: 'Warm Data',
                tech: 'Redis',
                capacity: '16GB',
                latency: '10-50ms',
                desc: 'Transaction hashes and indexes',
                color: 'quantum-purple',
              },
              {
                tier: 'Cold Data',
                tech: 'MongoDB',
                capacity: 'Unbounded',
                latency: '100-500ms',
                desc: 'Full history and audit trails',
                color: 'quantum-green',
              },
            ].map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-2xl bg-slate-900/80 border border-white/5 text-center"
              >
                <div className={`inline-flex items-center px-3 py-1 rounded-full bg-${tier.color}/10 text-${tier.color} text-sm mb-4`}>
                  {tier.tier}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{tier.tech}</h3>
                <div className="grid grid-cols-2 gap-4 my-6">
                  <div>
                    <div className="text-2xl font-mono text-white">{tier.capacity}</div>
                    <div className="text-gray-500 text-sm">Capacity</div>
                  </div>
                  <div>
                    <div className="text-2xl font-mono text-white">{tier.latency}</div>
                    <div className="text-gray-500 text-sm">Latency</div>
                  </div>
                </div>
                <p className="text-gray-400">{tier.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Deployment Options */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Flexible Deployment Options
            </h2>
            <p className="text-xl text-gray-400">
              Deploy anywhere with multi-cloud support and enterprise-grade infrastructure
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Cloud Managed',
                description: 'Fully managed service on our global infrastructure',
                features: ['Zero ops overhead', 'Automatic scaling', 'Global distribution', '99.99% SLA'],
                cta: 'Get Started',
              },
              {
                title: 'Hybrid',
                description: 'Combine cloud and on-premise for compliance needs',
                features: ['Data sovereignty', 'Regulatory compliance', 'Custom integration', 'Dedicated support'],
                cta: 'Learn More',
              },
              {
                title: 'Self-Hosted',
                description: 'Full control in your own infrastructure',
                features: ['Complete control', 'Air-gapped option', 'Custom security', 'Enterprise license'],
                cta: 'Contact Sales',
              },
            ].map((option, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-quantum-blue/30 transition-colors"
              >
                <h3 className="text-2xl font-bold text-white mb-3">{option.title}</h3>
                <p className="text-gray-400 mb-6">{option.description}</p>
                <ul className="space-y-3 mb-8">
                  {option.features.map((feature, i) => (
                    <li key={i} className="flex items-center text-gray-300">
                      <CheckCircle2 className="w-4 h-4 text-quantum-green mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full">
                  {option.cta}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-r from-quantum-blue/10 via-quantum-purple/10 to-quantum-green/10">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Ready to Build on Aurigraph?
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              Get started with our comprehensive documentation, SDKs, and developer tools.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" href="/developers/docs" icon={<ArrowRight className="w-5 h-5" />}>
                Read Documentation
              </Button>
              <Button size="lg" variant="outline" href="/demo">
                Request Demo
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
