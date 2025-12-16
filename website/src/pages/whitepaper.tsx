import Head from 'next/head';
import { motion } from 'framer-motion';
import {
  FileText, Download, BookOpen, Shield, Zap, Leaf,
  ChevronRight, Clock, Users, CheckCircle2, ArrowRight
} from 'lucide-react';
import Button from '@/components/ui/Button';

const tableOfContents = [
  { number: '01', title: 'Executive Summary', page: '4' },
  { number: '02', title: 'Introduction', page: '10' },
  { number: '03', title: 'Technical Architecture', page: '18' },
  { number: '04', title: 'HyperRAFT++ Consensus', page: '28' },
  { number: '05', title: 'Quantum-Resistant Security', page: '36' },
  { number: '06', title: 'Performance & Scalability', page: '44' },
  { number: '07', title: 'V12 Platform Enhancements', page: '52' },
  { number: '08', title: 'AI/ML Optimization Engine', page: '60' },
  { number: '09', title: 'Smart Contract Platform', page: '68' },
  { number: '10', title: 'Advanced Tokenization', page: '76' },
  { number: '11', title: 'Token Traceability & Merkle', page: '84' },
  { number: '12', title: 'File Attachment & CDN', page: '90' },
  { number: '13', title: 'External Integration Nodes', page: '96' },
  { number: '14', title: 'Sustainability & Carbon', page: '102' },
  { number: '15', title: 'Use Cases & Applications', page: '108' },
  { number: '16', title: 'Tokenomics & Economics', page: '116' },
  { number: '17', title: 'Enterprise Portal v5.1.0', page: '122' },
  { number: '18', title: 'CI/CD & Deployment', page: '128' },
  { number: '19', title: 'Roadmap & Future', page: '134' },
  { number: '20', title: 'Conclusion', page: '140' },
];

const highlights = [
  {
    icon: Zap,
    title: '3M+ TPS',
    description: 'Production-verified throughput with deterministic finality',
  },
  {
    icon: Shield,
    title: 'NIST Level 5',
    description: 'Quantum-resistant CRYSTALS cryptography',
  },
  {
    icon: Leaf,
    title: '0.022 gCO2/tx',
    description: '90%+ carbon reduction vs traditional blockchains',
  },
];

const versions = [
  {
    version: 'v2.0',
    date: 'December 2025',
    status: 'Current',
    changes: 'V12 platform: MinIO CDN, EI Nodes, Token Traceability, 3M+ TPS verified',
  },
  {
    version: 'v1.1',
    date: 'November 2025',
    status: 'Archived',
    changes: 'Enhanced citations (185+), IEEE bibliography, production deployment',
  },
  {
    version: 'v1.0',
    date: 'October 2025',
    status: 'Archived',
    changes: 'Initial release, V11 Java/Quarkus architecture',
  },
];

const relatedResources = [
  {
    title: 'Technical Documentation',
    description: 'Deep dive into our architecture and APIs',
    href: '/developers/docs',
    icon: BookOpen,
  },
  {
    title: 'Security Audit Report',
    description: 'Third-party security assessment results',
    href: '/security',
    icon: Shield,
  },
  {
    title: 'Platform Overview',
    description: 'Visual guide to our technology stack',
    href: '/platform',
    icon: Zap,
  },
];

export default function Whitepaper() {
  return (
    <>
      <Head>
        <title>Whitepaper | Aurigraph DLT</title>
        <meta
          name="description"
          content="Download the Aurigraph DLT whitepaper - comprehensive technical and business documentation for institutional blockchain asset tokenization."
        />
      </Head>

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center pt-32 pb-20">
        <div className="absolute inset-0 quantum-grid opacity-30" />
        <div className="absolute top-1/4 -left-64 w-[500px] h-[500px] bg-quantum-blue/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 -right-64 w-[400px] h-[400px] bg-quantum-purple/20 rounded-full blur-[128px]" />

        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6"
              >
                <FileText className="w-4 h-4 text-quantum-blue mr-2" />
                <span className="text-gray-300 text-sm">Version 2.0 | December 2024</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-6xl font-display font-bold text-white mb-6"
              >
                Aurigraph DLT{' '}
                <span className="gradient-text">Whitepaper</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-gray-400 leading-relaxed mb-8"
              >
                A comprehensive technical and business overview of the institutional
                blockchain platform for real-world asset tokenization. 100+ pages of
                in-depth analysis, architecture details, and market research.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-4 mb-8"
              >
                <Button size="lg" href="/downloads/aurigraph-whitepaper-v2.pdf" icon={<Download className="w-5 h-5" />}>
                  Download PDF
                </Button>
                <Button size="lg" variant="secondary" href="#table-of-contents">
                  View Contents
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center space-x-6 text-sm text-gray-500"
              >
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  100+ Pages
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  45 min read
                </span>
                <span className="flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  10K+ Downloads
                </span>
              </motion.div>
            </div>

            {/* Whitepaper Preview Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <div className="aspect-[3/4] rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 p-8 shadow-2xl shadow-quantum-blue/10">
                {/* Document Header */}
                <div className="border-b border-white/10 pb-6 mb-6">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-quantum-blue via-quantum-purple to-quantum-green flex items-center justify-center mb-4">
                    <span className="text-white font-bold text-2xl">A</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Aurigraph DLT</h3>
                  <p className="text-quantum-blue font-medium">Technical Whitepaper</p>
                </div>

                {/* Document Content Preview */}
                <div className="space-y-4">
                  <div className="h-3 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/10 rounded w-5/6" />
                  <div className="h-3 bg-white/10 rounded w-4/6" />
                  <div className="h-3 bg-white/10 rounded w-full" />
                  <div className="h-3 bg-white/10 rounded w-3/4" />
                </div>

                {/* Version Badge */}
                <div className="absolute bottom-8 right-8">
                  <span className="px-3 py-1 rounded-full bg-quantum-green/10 text-quantum-green text-sm font-medium">
                    v2.0
                  </span>
                </div>
              </div>

              {/* Floating Stats */}
              <div className="absolute -bottom-6 -left-6 p-4 rounded-xl bg-slate-900/90 border border-white/10 backdrop-blur-xl">
                <div className="text-2xl font-bold text-white font-mono">3M+</div>
                <div className="text-gray-400 text-sm">TPS Verified</div>
              </div>

              <div className="absolute -top-6 -right-6 p-4 rounded-xl bg-slate-900/90 border border-white/10 backdrop-blur-xl">
                <div className="text-2xl font-bold text-quantum-green font-mono">NIST 5</div>
                <div className="text-gray-400 text-sm">Security Level</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Highlights */}
      <section className="py-16 border-y border-white/5">
        <div className="container-custom">
          <div className="grid md:grid-cols-3 gap-8">
            {highlights.map((highlight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-4"
              >
                <div className="w-14 h-14 rounded-xl bg-quantum-blue/10 flex items-center justify-center">
                  <highlight.icon className="w-7 h-7 text-quantum-blue" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">{highlight.title}</div>
                  <div className="text-gray-400">{highlight.description}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section id="table-of-contents" className="section-padding">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Table of Contents
            </h2>
            <p className="text-xl text-gray-400">
              Comprehensive coverage of technology, economics, and vision
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-4">
              {tableOfContents.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center p-4 rounded-xl bg-slate-900/50 border border-white/5 hover:border-quantum-blue/30 transition-colors group"
                >
                  <span className="text-quantum-blue font-mono text-lg font-bold mr-4">
                    {item.number}
                  </span>
                  <span className="text-white flex-1">{item.title}</span>
                  <span className="text-gray-500 font-mono text-sm">p.{item.page}</span>
                  <ChevronRight className="w-4 h-4 text-gray-600 ml-2 group-hover:text-quantum-blue group-hover:translate-x-1 transition-all" />
                </motion.div>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Button size="lg" href="/downloads/aurigraph-whitepaper-v2.pdf" icon={<Download className="w-5 h-5" />}>
              Download Full Whitepaper
            </Button>
          </div>
        </div>
      </section>

      {/* Abstract */}
      <section className="section-padding bg-slate-900/30">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto">
            <div className="p-8 lg:p-12 rounded-3xl bg-gradient-to-br from-quantum-blue/5 via-quantum-purple/5 to-quantum-green/5 border border-white/10">
              <h2 className="text-3xl font-display font-bold text-white mb-6">Abstract</h2>
              <div className="prose prose-lg prose-invert">
                <p className="text-gray-300 leading-relaxed mb-6">
                  Aurigraph DLT presents a novel blockchain architecture specifically engineered
                  for institutional-grade real-world asset (RWA) tokenization. As traditional
                  financial markets face increasing pressure to modernize and the global digital
                  assets market projects to reach $3.7 trillion by 2030, there exists a critical
                  need for blockchain infrastructure that meets enterprise requirements for
                  security, performance, and regulatory compliance.
                </p>
                <p className="text-gray-300 leading-relaxed mb-6">
                  This whitepaper introduces HyperRAFT++, an advanced consensus mechanism
                  achieving 3M+ transactions per second with sub-500ms deterministic finality.
                  We detail our implementation of NIST-standardized CRYSTALS cryptography,
                  providing quantum-resistant security through 2030 and beyond. Our three-tier
                  hybrid storage architecture optimizes for both performance and auditability,
                  while our Ricardian smart contract framework enables legally-enforceable
                  tokenized agreements.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  The platform addresses the full lifecycle of asset tokenization including
                  digital twin integration for physical assets, oracle-verified compliance,
                  and automated ESG reporting achieving 90%+ carbon reduction versus traditional
                  blockchain networks. Aurigraph DLT represents a fundamental advancement in
                  bringing institutional-grade blockchain infrastructure to real-world applications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Version History */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Version History
            </h2>
            <p className="text-xl text-gray-400">
              Track the evolution of our technical documentation
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {versions.map((version, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-2xl border ${
                  version.status === 'Current'
                    ? 'bg-quantum-blue/10 border-quantum-blue/30'
                    : 'bg-slate-900/50 border-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl font-bold text-white font-mono">{version.version}</span>
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      version.status === 'Current'
                        ? 'bg-quantum-green/10 text-quantum-green'
                        : 'bg-gray-500/10 text-gray-400'
                    }`}>
                      {version.status}
                    </span>
                  </div>
                  <span className="text-gray-500">{version.date}</span>
                </div>
                <p className="text-gray-400">{version.changes}</p>
                {version.status === 'Current' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    href="/downloads/aurigraph-whitepaper-v2.pdf"
                    className="mt-4"
                    icon={<Download className="w-4 h-4" />}
                  >
                    Download
                  </Button>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Topics Preview */}
      <section className="section-padding bg-slate-900/30">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Key Topics Covered
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Market Analysis',
                points: ['$3.7T market opportunity', 'Competitive landscape', 'Adoption drivers', 'Regulatory trends'],
              },
              {
                title: 'Technical Architecture',
                points: ['HyperRAFT++ consensus', 'Three-tier storage', 'Sharding model', 'Network topology'],
              },
              {
                title: 'Security Framework',
                points: ['CRYSTALS cryptography', 'Zero-trust architecture', 'Byzantine tolerance', 'Audit mechanisms'],
              },
              {
                title: 'Asset Tokenization',
                points: ['Token standards', 'Digital twin framework', 'Oracle integration', 'Compliance automation'],
              },
              {
                title: 'Token Economics',
                points: ['Utility model', 'Fee structure', 'Staking mechanics', 'Governance rights'],
              },
              {
                title: 'Roadmap',
                points: ['Development phases', 'Feature timeline', 'Partner milestones', 'Global expansion'],
              },
            ].map((topic, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-slate-900/50 border border-white/5"
              >
                <h3 className="text-xl font-semibold text-white mb-4">{topic.title}</h3>
                <ul className="space-y-2">
                  {topic.points.map((point, i) => (
                    <li key={i} className="flex items-center text-gray-400">
                      <CheckCircle2 className="w-4 h-4 text-quantum-green mr-2 flex-shrink-0" />
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Related Resources
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {relatedResources.map((resource, index) => (
              <motion.a
                key={index}
                href={resource.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 hover:border-quantum-blue/30 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-quantum-blue/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <resource.icon className="w-6 h-6 text-quantum-blue" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{resource.title}</h3>
                <p className="text-gray-400 text-sm">{resource.description}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-r from-quantum-blue/10 via-quantum-purple/10 to-quantum-green/10">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <FileText className="w-16 h-16 text-quantum-blue mx-auto mb-6" />
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Ready to Dive Deeper?
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              Download the complete whitepaper for comprehensive technical details,
              market analysis, and our vision for the future of asset tokenization.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" href="/downloads/aurigraph-whitepaper-v2.pdf" icon={<Download className="w-5 h-5" />}>
                Download Whitepaper (PDF)
              </Button>
              <Button size="lg" variant="outline" href="/demo" icon={<ArrowRight className="w-5 h-5" />}>
                Request Demo
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
