/**
 * Landing Page
 * Main entry point for the website
 */

import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <>
      <Head>
        <title>Aurigraph V11 - High-Performance Blockchain</title>
        <meta
          name="description"
          content="Aurigraph V11: 2M+ TPS blockchain with quantum-resistant cryptography, HyperRAFT++ consensus, and real-world asset tokenization."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col">
        {/* Navigation */}
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="text-2xl font-bold text-indigo-600">Aurigraph</div>
            <div className="flex gap-8">
              <Link href="/docs" className="text-gray-600 hover:text-gray-900">
                Documentation
              </Link>
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6">
                The Future of Blockchain
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Aurigraph V11: 2M+ TPS throughput, quantum-resistant cryptography, and real-world asset tokenization.
              </p>
              <div className="flex gap-4 justify-center">
                <Link
                  href="/docs"
                  className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Read Documentation
                </Link>
                <Link
                  href="#features"
                  className="px-8 py-3 border border-gray-300 text-gray-900 rounded-lg hover:border-gray-400"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 sm:py-32 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center mb-16">Key Features</h2>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="p-8 border border-gray-200 rounded-lg">
                <div className="text-3xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold mb-4">2M+ TPS</h3>
                <p className="text-gray-600">
                  Achieve 2 million transactions per second with advanced consensus and AI optimization.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 border border-gray-200 rounded-lg">
                <div className="text-3xl mb-4">🔐</div>
                <h3 className="text-xl font-semibold mb-4">Quantum-Safe</h3>
                <p className="text-gray-600">
                  NIST Level 5 quantum-resistant cryptography protects against future threats.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 border border-gray-200 rounded-lg">
                <div className="text-3xl mb-4">🌍</div>
                <h3 className="text-xl font-semibold mb-4">Real-World Assets</h3>
                <p className="text-gray-600">
                  Tokenize and manage physical assets on the blockchain securely.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-indigo-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to build on Aurigraph?</h2>
            <p className="text-lg mb-8">
              Get started with our SDKs and comprehensive documentation.
            </p>
            <Link
              href="/docs"
              className="inline-block px-8 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-50 font-semibold"
            >
              Start Building
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="text-xl font-bold text-white">Aurigraph</div>
              <div className="flex gap-6">
                <Link href="/docs" className="hover:text-white">
                  Docs
                </Link>
                <Link href="https://github.com/Aurigraph-DLT-Corp/Aurigraph-DLT" className="hover:text-white">
                  GitHub
                </Link>
                <Link href="/blog" className="hover:text-white">
                  Blog
                </Link>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-sm">
              <p>&copy; 2025 Aurigraph. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
