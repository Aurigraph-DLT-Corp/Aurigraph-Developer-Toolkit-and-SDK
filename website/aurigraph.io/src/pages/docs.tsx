/**
 * Documentation Page
 * API documentation and guides
 */

import Head from 'next/head'
import Link from 'next/link'

export default function DocsPage() {
  const sections = [
    {
      title: 'Getting Started',
      items: ['Overview', 'Installation', 'Quick Start'],
    },
    {
      title: 'SDK Reference',
      items: ['TypeScript SDK', 'Python SDK', 'Go SDK'],
    },
    {
      title: 'API Reference',
      items: ['Transactions', 'Accounts', 'Blocks', 'Consensus'],
    },
    {
      title: 'Guides',
      items: ['Wallet Integration', 'Smart Contracts', 'Asset Tokenization'],
    },
  ]

  return (
    <>
      <Head>
        <title>Documentation - Aurigraph V11</title>
        <meta name="description" content="Complete documentation for Aurigraph V11 SDK and API" />
      </Head>

      <main className="flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-4">Documentation</h1>
            <p className="text-lg text-indigo-100">
              Complete guides and API reference for building on Aurigraph V11
            </p>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid md:grid-cols-2 gap-8">
              {sections.map((section) => (
                <div key={section.title} className="bg-white rounded-lg p-8 border border-gray-200">
                  <h2 className="text-2xl font-bold mb-6">{section.title}</h2>
                  <ul className="space-y-3">
                    {section.items.map((item) => (
                      <li key={item}>
                        <Link
                          href={`/docs/${item.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-indigo-600 hover:text-indigo-700 flex items-center"
                        >
                          <span className="mr-3">→</span>
                          {item}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Code Example */}
            <div className="mt-12 bg-white rounded-lg p-8 border border-gray-200">
              <h2 className="text-2xl font-bold mb-6">Quick Start Example</h2>
              <div className="bg-gray-900 text-gray-100 p-6 rounded-lg font-mono overflow-auto">
                <pre>{`import { AurigraphClient } from '@aurigraph/sdk'

const client = new AurigraphClient({
  baseUrl: 'https://dlt.aurigraph.io/api/v11',
  apiKey: 'sk_...'
})

await client.connect()
const account = await client.getAccount('auri1...')
console.log(account.balance)`}</pre>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
