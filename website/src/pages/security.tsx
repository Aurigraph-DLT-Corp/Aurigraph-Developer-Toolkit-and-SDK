import Head from 'next/head';
import { motion } from 'framer-motion';
import {
  Shield, Lock, Key, FileCheck, Eye, Server,
  CheckCircle2, ArrowRight, AlertTriangle, Fingerprint
} from 'lucide-react';
import Button from '@/components/ui/Button';

const securityLayers = [
  {
    icon: Key,
    title: 'Quantum-Resistant Encryption',
    tech: 'CRYSTALS-Kyber',
    description: 'NIST Level 5 post-quantum key encapsulation protecting data in transit and at rest.',
    features: ['1024-bit security level', 'NIST standardized', 'Forward secrecy'],
  },
  {
    icon: Fingerprint,
    title: 'Quantum-Resistant Signatures',
    tech: 'CRYSTALS-Dilithium',
    description: 'Post-quantum digital signatures ensuring transaction authenticity and non-repudiation.',
    features: ['NIST Level 5', 'Fast verification', 'Compact signatures'],
  },
  {
    icon: Lock,
    title: 'Transport Security',
    tech: 'TLS 1.3',
    description: 'Latest transport layer security with perfect forward secrecy for all communications.',
    features: ['0-RTT resumption', 'Strong cipher suites', 'Certificate pinning'],
  },
  {
    icon: Shield,
    title: 'Access Control',
    tech: 'OAuth 2.0 / JWT',
    description: 'Enterprise identity management with role-based access control and multi-factor authentication.',
    features: ['RBAC policies', 'MFA support', 'SSO integration'],
  },
];

const complianceFrameworks = [
  { name: 'SOC 2 Type II', status: 'Certified', description: 'Security, availability, and confidentiality' },
  { name: 'ISO 27001', status: 'Certified', description: 'Information security management' },
  { name: 'GDPR', status: 'Compliant', description: 'European data protection' },
  { name: 'AML/KYC', status: 'Built-in', description: 'Anti-money laundering controls' },
  { name: 'CCPA', status: 'Compliant', description: 'California consumer privacy' },
  { name: 'PCI DSS', status: 'In Progress', description: 'Payment card data security' },
];

const securityFeatures = [
  {
    title: 'Zero-Trust Architecture',
    description: 'Every request is authenticated and authorized, regardless of network location.',
  },
  {
    title: 'Byzantine Fault Tolerance',
    description: 'Network remains secure with up to f < n/3 malicious or faulty nodes.',
  },
  {
    title: 'Merkle Proof Verification',
    description: 'O(log n) cryptographic verification of all transactions and state.',
  },
  {
    title: '7-Year Audit Trail',
    description: 'Immutable, timestamped records of all operations for compliance.',
  },
  {
    title: 'Hardware Security Module',
    description: 'Optional HSM integration for key management and signing operations.',
  },
  {
    title: 'Penetration Tested',
    description: 'Regular third-party security audits and penetration testing.',
  },
];

export default function Security() {
  return (
    <>
      <Head>
        <title>Security & Compliance | Aurigraph DLT</title>
        <meta
          name="description"
          content="Enterprise-grade security with quantum-resistant cryptography, zero-trust architecture, and comprehensive compliance frameworks."
        />
      </Head>

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center pt-32 pb-20">
        <div className="absolute inset-0 quantum-grid opacity-30" />
        <div className="absolute top-1/3 -right-32 w-[500px] h-[500px] bg-quantum-purple/20 rounded-full blur-[128px]" />

        <div className="container-custom relative z-10">
          <div className="max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center px-4 py-2 rounded-full bg-quantum-purple/10 border border-quantum-purple/30 mb-6"
            >
              <Shield className="w-4 h-4 text-quantum-purple mr-2" />
              <span className="text-quantum-purple text-sm font-medium">Enterprise Security</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-6xl font-display font-bold text-white mb-6"
            >
              Quantum-Resistant{' '}
              <span className="gradient-text">Security by Design</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-400 leading-relaxed mb-8"
            >
              Protected against both classical and quantum computing threats with
              NIST-standardized cryptography. Your assets are secure through 2030 and beyond.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-6"
            >
              {[
                { label: 'NIST Level 5', desc: 'Highest Security' },
                { label: 'Post-Quantum', desc: 'Future-Proof' },
                { label: 'Zero-Trust', desc: 'Architecture' },
              ].map((badge, index) => (
                <div key={index} className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-quantum-green mr-2" />
                  <div>
                    <div className="text-white font-semibold">{badge.label}</div>
                    <div className="text-gray-500 text-sm">{badge.desc}</div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Security Layers */}
      <section className="section-padding bg-slate-900/30">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Multi-Layer Security Architecture
            </h2>
            <p className="text-xl text-gray-400">
              Defense in depth with quantum-resistant cryptography at every layer
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {securityLayers.map((layer, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-8 rounded-2xl bg-slate-900/80 border border-white/5"
              >
                <div className="flex items-start mb-6">
                  <div className="w-14 h-14 rounded-xl bg-quantum-purple/20 flex items-center justify-center mr-4">
                    <layer.icon className="w-7 h-7 text-quantum-purple" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{layer.title}</h3>
                    <span className="text-quantum-blue font-mono text-sm">{layer.tech}</span>
                  </div>
                </div>
                <p className="text-gray-400 mb-6">{layer.description}</p>
                <div className="flex flex-wrap gap-2">
                  {layer.features.map((feature, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-sm"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quantum Threat Protection */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-quantum-blue/10 text-quantum-blue text-sm mb-6">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Quantum Computing Threat
              </div>
              <h2 className="text-4xl font-display font-bold text-white mb-6">
                Protected Against Future Threats
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Quantum computers threaten current cryptographic standards. Our CRYSTALS
                implementation ensures your assets remain secure even as quantum computing
                advances.
              </p>

              <div className="space-y-4">
                {[
                  { title: 'RSA/ECC Vulnerable', desc: 'Current standards broken by quantum algorithms', status: 'risk' },
                  { title: 'CRYSTALS-Kyber', desc: 'Quantum-resistant key encapsulation', status: 'safe' },
                  { title: 'CRYSTALS-Dilithium', desc: 'Quantum-resistant digital signatures', status: 'safe' },
                  { title: 'Harvest Now, Decrypt Later', desc: 'Protected against future decryption attacks', status: 'safe' },
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center p-4 rounded-xl ${
                      item.status === 'risk' ? 'bg-red-500/10 border border-red-500/20' : 'bg-quantum-green/10 border border-quantum-green/20'
                    }`}
                  >
                    {item.status === 'risk' ? (
                      <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-quantum-green mr-3" />
                    )}
                    <div>
                      <div className="text-white font-medium">{item.title}</div>
                      <div className="text-gray-500 text-sm">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-quantum-purple/10 to-quantum-blue/10 border border-white/10 p-8 flex items-center justify-center">
                <div className="text-center">
                  <Shield className="w-24 h-24 text-quantum-purple mx-auto mb-6" />
                  <div className="text-4xl font-bold text-white mb-2">NIST Level 5</div>
                  <div className="text-gray-400 mb-6">Highest Security Classification</div>
                  <div className="text-quantum-green font-mono">
                    Protected through 2030+
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Security Features */}
      <section className="section-padding bg-slate-900/30">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Comprehensive Security Features
            </h2>
            <p className="text-xl text-gray-400">
              Enterprise-grade security controls at every level
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-slate-900/50 border border-white/5"
              >
                <div className="flex items-start">
                  <CheckCircle2 className="w-6 h-6 text-quantum-green mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Compliance & Certifications
            </h2>
            <p className="text-xl text-gray-400">
              Meeting the highest standards for enterprise and regulatory requirements
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complianceFrameworks.map((framework, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-slate-900/50 border border-white/5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">{framework.name}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      framework.status === 'Certified'
                        ? 'bg-quantum-green/10 text-quantum-green'
                        : framework.status === 'Compliant'
                        ? 'bg-quantum-blue/10 text-quantum-blue'
                        : 'bg-yellow-500/10 text-yellow-500'
                    }`}
                  >
                    {framework.status}
                  </span>
                </div>
                <p className="text-gray-400">{framework.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-gradient-to-r from-quantum-purple/10 via-quantum-blue/10 to-quantum-green/10">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-display font-bold text-white mb-6">
              Security Questions?
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              Our security team is available to discuss your compliance requirements
              and answer any questions about our security architecture.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" href="/contact" icon={<ArrowRight className="w-5 h-5" />}>
                Contact Security Team
              </Button>
              <Button size="lg" variant="outline" href="/developers/docs/security">
                Security Documentation
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
