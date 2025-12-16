import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Code2, FileText, Terminal, Package, Github, BookOpen,
  ArrowRight, Zap, Lock, Globe
} from 'lucide-react';
import Button from '@/components/ui/Button';

const resources = [
  {
    icon: FileText,
    title: 'Documentation',
    description: 'Comprehensive guides, tutorials, and API references to get you started.',
    href: '/developers/docs',
    cta: 'Read Docs',
  },
  {
    icon: Terminal,
    title: 'API Reference',
    description: 'Complete REST and gRPC API documentation with interactive examples.',
    href: '/developers/api',
    cta: 'Explore API',
  },
  {
    icon: Package,
    title: 'SDKs & Tools',
    description: 'Client libraries for JavaScript, Python, Java, and more.',
    href: '/developers/sdk',
    cta: 'Get SDKs',
  },
  {
    icon: Github,
    title: 'GitHub',
    description: 'Open-source tools, sample applications, and community contributions.',
    href: 'https://github.com/Aurigraph-DLT-Corp',
    cta: 'View GitHub',
    external: true,
  },
];

const quickStart = [
  { step: '1', title: 'Get API Keys', description: 'Sign up and create your first API key' },
  { step: '2', title: 'Install SDK', description: 'Choose your language and install the client' },
  { step: '3', title: 'Make First Call', description: 'Query the blockchain and get a response' },
  { step: '4', title: 'Build Your App', description: 'Start tokenizing assets and building' },
];

const codeExample = `// Install: npm install @aurigraph/sdk

import { AurigraphClient } from '@aurigraph/sdk';

// Initialize client
const client = new AurigraphClient({
  apiKey: 'your-api-key',
  network: 'mainnet'
});

// Create a new asset token
const token = await client.tokens.create({
  name: 'Real Estate Token #1',
  type: 'REAL_ESTATE',
  totalSupply: 1000000,
  metadata: {
    propertyAddress: '123 Main St',
    valuation: 5000000,
    currency: 'USD'
  }
});

console.log('Token created:', token.id);

// Transfer tokens
await client.tokens.transfer({
  tokenId: token.id,
  to: '0x742d35Cc6634C0532925a3b844Bc9e7595f...',
  amount: 1000
});`;

export default function Developers() {
  return (
    <>
      <Head>
        <title>Developers | Aurigraph DLT</title>
        <meta
          name="description"
          content="Build on Aurigraph DLT with our comprehensive developer tools, SDKs, and documentation."
        />
      </Head>

      {/* Hero */}
      <section className="relative min-h-[50vh] flex items-center pt-32 pb-16">
        <div className="absolute inset-0 quantum-grid opacity-30" />
        <div className="absolute bottom-1/4 -right-64 w-[500px] h-[500px] bg-quantum-purple/20 rounded-full blur-[128px]" />

        <div className="container-custom relative z-10">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-quantum-purple/10 border border-quantum-purple/30 mb-6"
            >
              <Code2 className="w-4 h-4 text-quantum-purple mr-2" />
              <span className="text-quantum-purple text-sm font-medium">Developer Hub</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-display font-bold text-white mb-6"
            >
              Build the Future of{' '}
              <span className="gradient-text">Asset Tokenization</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-400 leading-relaxed mb-8"
            >
              Everything you need to integrate Aurigraph into your applications.
              Powerful APIs, comprehensive SDKs, and world-class documentation.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-4"
            >
              <Button size="lg" href="/developers/docs" icon={<BookOpen className="w-5 h-5" />}>
                Read Documentation
              </Button>
              <Button size="lg" variant="secondary" href="https://github.com/Aurigraph-DLT-Corp" external>
                <Github className="w-5 h-5 mr-2" />
                View on GitHub
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="section-padding bg-slate-900/30">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((resource, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={resource.href}
                  target={resource.external ? '_blank' : undefined}
                  className="block h-full p-6 rounded-2xl bg-slate-900/80 border border-white/5 hover:border-quantum-purple/30 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-quantum-purple/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <resource.icon className="w-6 h-6 text-quantum-purple" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{resource.title}</h3>
                  <p className="text-gray-400 mb-4">{resource.description}</p>
                  <span className="text-quantum-purple font-medium inline-flex items-center">
                    {resource.cta}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-gray-400">
              From zero to tokenizing assets in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8 mb-16">
            {quickStart.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-quantum-blue to-quantum-purple flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>

                {index < quickStart.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-quantum-blue/50 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Code Example */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="rounded-2xl bg-slate-900/80 border border-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <span className="text-gray-500 text-sm font-mono">index.ts</span>
              </div>
              <pre className="p-6 overflow-x-auto">
                <code className="text-sm text-gray-300 font-mono whitespace-pre">
                  {codeExample}
                </code>
              </pre>
            </div>
          </motion.div>
        </div>
      </section>

      {/* API Highlights */}
      <section className="section-padding bg-slate-900/30">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Powerful APIs
            </h2>
            <p className="text-xl text-gray-400">
              RESTful and gRPC APIs designed for enterprise-scale applications
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'High Performance',
                description: 'Sub-100ms response times with automatic load balancing and caching.',
              },
              {
                icon: Lock,
                title: 'Secure by Default',
                description: 'API key authentication, rate limiting, and request signing.',
              },
              {
                icon: Globe,
                title: 'Global Edge',
                description: 'Deployed globally for low-latency access from anywhere.',
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-quantum-blue/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-quantum-blue" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SDKs */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-display font-bold text-white mb-6">
                SDKs for Every Language
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Official client libraries with full TypeScript support, async/await,
                and comprehensive error handling.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { lang: 'JavaScript/TypeScript', status: 'Stable' },
                  { lang: 'Python', status: 'Stable' },
                  { lang: 'Java', status: 'Stable' },
                  { lang: 'Go', status: 'Beta' },
                  { lang: 'Rust', status: 'Beta' },
                  { lang: 'C#/.NET', status: 'Coming Soon' },
                ].map((sdk, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-white/5"
                  >
                    <span className="text-white">{sdk.lang}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        sdk.status === 'Stable'
                          ? 'bg-quantum-green/10 text-quantum-green'
                          : sdk.status === 'Beta'
                          ? 'bg-quantum-blue/10 text-quantum-blue'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {sdk.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-br from-quantum-purple/10 to-quantum-blue/10 border border-white/5">
              <h3 className="text-xl font-bold text-white mb-4">Install via npm</h3>
              <div className="bg-slate-900/80 rounded-xl p-4 font-mono text-sm">
                <span className="text-gray-500">$</span>
                <span className="text-quantum-blue ml-2">npm install</span>
                <span className="text-white ml-2">@aurigraph/sdk</span>
              </div>

              <h3 className="text-xl font-bold text-white mb-4 mt-8">Install via pip</h3>
              <div className="bg-slate-900/80 rounded-xl p-4 font-mono text-sm">
                <span className="text-gray-500">$</span>
                <span className="text-quantum-blue ml-2">pip install</span>
                <span className="text-white ml-2">aurigraph-sdk</span>
              </div>

              <h3 className="text-xl font-bold text-white mb-4 mt-8">Maven</h3>
              <div className="bg-slate-900/80 rounded-xl p-4 font-mono text-sm text-gray-300">
                {'<dependency>'}<br />
                {'  <groupId>io.aurigraph</groupId>'}<br />
                {'  <artifactId>sdk</artifactId>'}<br />
                {'</dependency>'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-r from-quantum-purple/10 via-quantum-blue/10 to-quantum-green/10">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Ready to Start Building?
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              Join developers building the next generation of financial applications
              on Aurigraph.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" href="/developers/docs" icon={<ArrowRight className="w-5 h-5" />}>
                Start Building
              </Button>
              <Button size="lg" variant="outline" href="https://discord.gg/aurigraph" external>
                Join Developer Community
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
