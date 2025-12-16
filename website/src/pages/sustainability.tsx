import Head from 'next/head';
import { motion } from 'framer-motion';
import {
  Leaf, Zap, Globe, BarChart3, TreePine, Wind,
  CheckCircle2, ArrowRight, TrendingDown
} from 'lucide-react';
import Button from '@/components/ui/Button';

const sustainabilityMetrics = [
  {
    value: '0.022',
    unit: 'gCO2/tx',
    label: 'Carbon Per Transaction',
    comparison: 'vs 502kg for Bitcoin',
  },
  {
    value: '90%+',
    unit: '',
    label: 'Carbon Reduction',
    comparison: 'vs mining-based consensus',
  },
  {
    value: '99.9%',
    unit: '',
    label: 'Energy Efficiency',
    comparison: 'vs Proof of Work',
  },
  {
    value: 'Net Zero',
    unit: '',
    label: 'Target by 2025',
    comparison: 'Carbon neutral operations',
  },
];

const esgFeatures = [
  {
    category: 'Environmental',
    icon: Leaf,
    items: [
      'Minimal energy consensus (HyperRAFT++)',
      'Carbon footprint tracking per transaction',
      'Renewable energy data center preference',
      'Environmental impact reporting',
    ],
  },
  {
    category: 'Social',
    icon: Globe,
    items: [
      'Democratized asset access',
      'Financial inclusion initiatives',
      'Transparent governance',
      'Community-driven development',
    ],
  },
  {
    category: 'Governance',
    icon: BarChart3,
    items: [
      'On-chain voting mechanisms',
      'Transparent decision making',
      'Audit trail compliance',
      'Regulatory framework support',
    ],
  },
];

const carbonComparison = [
  { name: 'Bitcoin', value: 502000, unit: 'gCO2/tx' },
  { name: 'Ethereum (PoW)', value: 62000, unit: 'gCO2/tx' },
  { name: 'Ethereum (PoS)', value: 20, unit: 'gCO2/tx' },
  { name: 'Aurigraph', value: 0.022, unit: 'gCO2/tx' },
];

export default function Sustainability() {
  return (
    <>
      <Head>
        <title>Sustainability & ESG | Aurigraph DLT</title>
        <meta
          name="description"
          content="Aurigraph DLT's commitment to environmental sustainability with 90%+ carbon reduction and comprehensive ESG compliance."
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
              <Leaf className="w-4 h-4 text-quantum-green mr-2" />
              <span className="text-quantum-green text-sm font-medium">Sustainability</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-display font-bold text-white mb-6"
            >
              Blockchain That's{' '}
              <span className="gradient-text">Good for the Planet</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-400 leading-relaxed"
            >
              Our HyperRAFT++ consensus delivers enterprise performance while reducing
              carbon emissions by over 90% compared to traditional blockchain networks.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="py-16 border-y border-white/5">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {sustainabilityMetrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-4xl lg:text-5xl font-bold text-white mb-1 font-mono">
                  {metric.value}
                  <span className="text-quantum-green text-xl">{metric.unit}</span>
                </div>
                <div className="text-gray-300 font-semibold mb-1">{metric.label}</div>
                <div className="text-quantum-green text-sm">{metric.comparison}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Carbon Comparison */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-quantum-green/10 text-quantum-green text-sm mb-6">
                <TrendingDown className="w-4 h-4 mr-2" />
                Carbon Footprint Comparison
              </div>
              <h2 className="text-4xl font-display font-bold text-white mb-6">
                Orders of Magnitude Lower Emissions
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Our efficient consensus mechanism eliminates energy-intensive mining,
                resulting in near-zero carbon emissions per transaction.
              </p>

              <div className="space-y-4">
                {carbonComparison.map((item, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-300">{item.name}</span>
                      <span className={`font-mono ${item.name === 'Aurigraph' ? 'text-quantum-green' : 'text-gray-400'}`}>
                        {item.value} {item.unit}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.name === 'Aurigraph'
                            ? 'bg-quantum-green'
                            : 'bg-red-500/50'
                        }`}
                        style={{
                          width: item.name === 'Aurigraph'
                            ? '1%'
                            : `${Math.min((item.value / 502000) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-quantum-green/10 to-quantum-blue/10 border border-white/10 p-8 flex items-center justify-center">
                <div className="text-center">
                  <TreePine className="w-24 h-24 text-quantum-green mx-auto mb-6" />
                  <div className="text-5xl font-bold text-white mb-2">99.99%</div>
                  <div className="text-gray-400 mb-4">Less Energy Than Bitcoin</div>
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-quantum-green/10 text-quantum-green text-sm">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Verified Carbon Footprint
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ESG Framework */}
      <section className="section-padding bg-slate-900/30">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Comprehensive ESG Framework
            </h2>
            <p className="text-xl text-gray-400">
              Built-in environmental, social, and governance compliance for institutional requirements
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {esgFeatures.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-2xl bg-slate-900/80 border border-white/5"
              >
                <div className="w-14 h-14 rounded-xl bg-quantum-green/20 flex items-center justify-center mb-6">
                  <category.icon className="w-7 h-7 text-quantum-green" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-6">{category.category}</h3>
                <ul className="space-y-3">
                  {category.items.map((item, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="w-5 h-5 text-quantum-green mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              How We Achieve Sustainability
            </h2>
            <p className="text-xl text-gray-400">
              Our architecture is designed for efficiency from the ground up
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                title: 'Efficient Consensus',
                description: 'HyperRAFT++ eliminates energy-intensive mining while maintaining security',
              },
              {
                icon: Wind,
                title: 'Green Infrastructure',
                description: 'Preference for renewable energy powered data centers',
              },
              {
                icon: BarChart3,
                title: 'Carbon Tracking',
                description: 'Real-time monitoring and reporting of environmental impact',
              },
              {
                icon: TreePine,
                title: 'Offset Programs',
                description: 'Partnership with verified carbon offset initiatives',
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-quantum-green/10 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="w-6 h-6 text-quantum-green" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Commitment */}
      <section className="section-padding bg-gradient-to-r from-quantum-green/10 via-quantum-blue/10 to-quantum-purple/10">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <Leaf className="w-16 h-16 text-quantum-green mx-auto mb-6" />
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Our Commitment to Net Zero
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              We are committed to achieving carbon-neutral operations by 2025 and
              helping our clients meet their own ESG goals through sustainable
              blockchain infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" href="/contact" icon={<ArrowRight className="w-5 h-5" />}>
                Partner With Us
              </Button>
              <Button size="lg" variant="outline" href="/solutions/carbon-credits">
                Carbon Credit Solutions
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
