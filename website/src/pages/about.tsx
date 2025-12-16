import Head from 'next/head';
import { motion } from 'framer-motion';
import {
  Target, Eye, Rocket, Users, Globe, Award,
  Shield, Zap, Leaf, ArrowRight
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const values = [
  {
    icon: Shield,
    title: 'Security First',
    description: 'We build with quantum-resistant cryptography because we believe security should never be compromised.',
  },
  {
    icon: Zap,
    title: 'Performance Excellence',
    description: 'Every millisecond matters. We engineer for institutional-grade speed and reliability.',
  },
  {
    icon: Leaf,
    title: 'Sustainability',
    description: '90%+ carbon reduction is just the start. We are committed to net-zero blockchain operations.',
  },
  {
    icon: Users,
    title: 'Transparency',
    description: 'Open governance, verifiable transactions, and auditable operations define our approach.',
  },
];

const milestones = [
  { year: '2021', title: 'Founded', description: 'Vision for institutional RWA blockchain established' },
  { year: '2022', title: 'V10 Launch', description: 'First production release with 1M+ TPS capability' },
  { year: '2023', title: 'Quantum Ready', description: 'CRYSTALS cryptography integration completed' },
  { year: '2024', title: 'V11 Production', description: 'Enterprise deployment with 3M+ TPS verified' },
  { year: '2025', title: 'Global Expansion', description: 'Multi-region deployment and partner ecosystem' },
];

const team = [
  {
    name: 'Leadership Team',
    role: 'Executive Management',
    description: 'Experienced blockchain and enterprise technology leaders with deep fintech expertise.',
  },
  {
    name: 'Engineering',
    role: 'Core Development',
    description: 'World-class engineers from leading tech companies building the future of asset tokenization.',
  },
  {
    name: 'Research',
    role: 'Cryptography & Consensus',
    description: 'PhD-level researchers advancing post-quantum security and distributed systems.',
  },
  {
    name: 'Enterprise',
    role: 'Solutions & Partnerships',
    description: 'Industry veterans helping institutions navigate digital transformation.',
  },
];

export default function About() {
  return (
    <>
      <Head>
        <title>About Us | Aurigraph DLT</title>
        <meta
          name="description"
          content="Learn about Aurigraph DLT's mission to transform real-world asset tokenization with institutional-grade blockchain technology."
        />
      </Head>

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center pt-32 pb-20">
        <div className="absolute inset-0 quantum-grid opacity-30" />
        <div className="absolute top-1/3 -left-64 w-[400px] h-[400px] bg-quantum-blue/20 rounded-full blur-[100px]" />

        <div className="container-custom relative z-10">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6"
            >
              <span className="text-quantum-blue text-sm font-medium">About Aurigraph DLT</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-display font-bold text-white mb-6"
            >
              Building the Foundation for{' '}
              <span className="gradient-text">Digital Asset Ownership</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-400 leading-relaxed"
            >
              We are pioneering the infrastructure that bridges traditional finance and
              blockchain technology, enabling institutions to tokenize, trade, and manage
              real-world assets with unprecedented security and efficiency.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding bg-slate-900/30">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12">
            <Card variant="gradient" hover={false}>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-quantum-blue/20 flex items-center justify-center mr-4">
                  <Target className="w-6 h-6 text-quantum-blue" />
                </div>
                <h2 className="text-2xl font-bold text-white">Our Mission</h2>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">
                To democratize access to real-world assets through blockchain technology,
                enabling fractional ownership, instant settlement, and transparent pricing
                for everyone from individual investors to global institutions.
              </p>
            </Card>

            <Card variant="gradient" hover={false}>
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 rounded-xl bg-quantum-purple/20 flex items-center justify-center mr-4">
                  <Eye className="w-6 h-6 text-quantum-purple" />
                </div>
                <h2 className="text-2xl font-bold text-white">Our Vision</h2>
              </div>
              <p className="text-gray-300 text-lg leading-relaxed">
                A world where every asset is tokenizable, every transaction is verifiable,
                and every participant has equal access to global markets regardless of
                geography or net worth.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">Our Core Values</h2>
            <p className="text-xl text-gray-400">
              The principles that guide every decision we make
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-quantum-blue/20 to-quantum-purple/20 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7 text-quantum-blue" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{value.title}</h3>
                <p className="text-gray-400">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding bg-slate-900/30">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">Our Journey</h2>
            <p className="text-xl text-gray-400">
              From vision to production-ready enterprise platform
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-quantum-blue via-quantum-purple to-quantum-green" />

            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative flex items-center mb-12 ${
                  index % 2 === 0 ? 'justify-start' : 'justify-end'
                }`}
              >
                <div
                  className={`w-5/12 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8 text-left'}`}
                >
                  <div className="text-quantum-blue font-mono text-lg mb-2">{milestone.year}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{milestone.title}</h3>
                  <p className="text-gray-400">{milestone.description}</p>
                </div>

                {/* Node */}
                <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-quantum-blue border-4 border-slate-950" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">Our Team</h2>
            <p className="text-xl text-gray-400">
              World-class expertise in blockchain, cryptography, and enterprise technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-slate-900/50 border border-white/5"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-quantum-blue to-quantum-purple flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">{member.name}</h3>
                <p className="text-quantum-blue text-sm mb-3">{member.role}</p>
                <p className="text-gray-400 text-sm">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Presence */}
      <section className="section-padding bg-slate-900/30">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-quantum-green/10 text-quantum-green text-sm mb-6">
                <Globe className="w-4 h-4 mr-2" />
                Global Operations
              </div>
              <h2 className="text-4xl font-display font-bold text-white mb-6">
                Serving Enterprises Worldwide
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                With multi-cloud infrastructure spanning AWS, Azure, and GCP,
                we deliver enterprise-grade blockchain services to institutions
                across 10+ jurisdictions.
              </p>

              <div className="grid grid-cols-2 gap-6">
                {[
                  { value: '10+', label: 'Jurisdictions' },
                  { value: '3', label: 'Cloud Providers' },
                  { value: '50+', label: 'Partner Integrations' },
                  { value: '99.99%', label: 'Uptime SLA' },
                ].map((stat, index) => (
                  <div key={index} className="text-center p-4 rounded-xl bg-slate-900/50">
                    <div className="text-3xl font-bold text-white font-mono">{stat.value}</div>
                    <div className="text-gray-400 text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative aspect-square rounded-3xl bg-slate-900/50 border border-white/5 flex items-center justify-center">
              <Globe className="w-32 h-32 text-quantum-blue/30" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold text-white mb-2">Global</div>
                  <div className="text-gray-400">Enterprise Reach</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Join Us in Shaping the Future
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              Whether you are an institution looking to tokenize assets or a developer
              building the next generation of financial applications.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" href="/careers" icon={<ArrowRight className="w-5 h-5" />}>
                View Careers
              </Button>
              <Button size="lg" variant="outline" href="/contact">
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
