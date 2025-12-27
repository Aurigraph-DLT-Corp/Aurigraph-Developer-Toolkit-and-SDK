/**
 * SDK Documentation Page
 * Complete guide for SDK installation, usage, and integration
 */

import Head from 'next/head'
import Link from 'next/link'

export default function SDKDocsPage() {
  return (
    <>
      <Head>
        <title>SDK Documentation - Aurigraph V11</title>
        <meta name="description" content="Complete SDK documentation including TypeScript, Python, and Go SDKs for Aurigraph V11" />
      </Head>

      <main className="flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-4">SDK Documentation</h1>
            <p className="text-lg text-blue-100">
              Build on Aurigraph V11 with TypeScript, Python, or Go SDKs
            </p>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

            {/* Business Proposition */}
            <section className="mb-12 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Build Fast, Scale Infinitely</h2>
                  <p className="text-indigo-100 mb-6">
                    The Aurigraph SDK enables developers to build high-performance blockchain applications in minutes, not months.
                    With 2M+ TPS throughput and quantum-resistant security, scale your application to millions of users.
                  </p>
                  <ul className="space-y-2 text-indigo-50">
                    <li>✓ <strong>2M+ TPS</strong> - Production-grade throughput</li>
                    <li>✓ <strong>Sub-100ms Finality</strong> - Near-instant confirmation</li>
                    <li>✓ <strong>Quantum-Safe</strong> - NIST Level 5 cryptography</li>
                    <li>✓ <strong>Multi-Chain</strong> - Built-in cross-chain bridge</li>
                    <li>✓ <strong>Developer-Friendly</strong> - 3 languages, full docs, SDKs</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-6 text-gray-900">
                  <h3 className="text-2xl font-bold mb-4">Get Started Today</h3>
                  <form className="space-y-4">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Company name (optional)"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition"
                    >
                      Sign Up for Free Access
                    </button>
                    <p className="text-sm text-gray-600 text-center">
                      Get API keys, documentation, and developer support
                    </p>
                  </form>
                </div>
              </div>
            </section>

            {/* Target Audiences */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Who Should Use Aurigraph SDK</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition">
                  <h3 className="text-lg font-bold mb-2">🏗️ Enterprises</h3>
                  <p className="text-gray-700 text-sm mb-4">
                    Deploy mission-critical blockchain infrastructure with quantum-resistant security and 2M+ TPS capacity.
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>✓ Enterprise SLA</li>
                    <li>✓ Dedicated support</li>
                    <li>✓ Custom integrations</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition">
                  <h3 className="text-lg font-bold mb-2">🚀 Startups</h3>
                  <p className="text-gray-700 text-sm mb-4">
                    Launch your DeFi, Web3, or blockchain app in days. Free tier includes everything you need to start.
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>✓ Free tier available</li>
                    <li>✓ Quick onboarding</li>
                    <li>✓ Developer community</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition">
                  <h3 className="text-lg font-bold mb-2">👨‍💻 Developers</h3>
                  <p className="text-gray-700 text-sm mb-4">
                    Build with your preferred language (TypeScript, Python, Go) and get up and running in minutes.
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>✓ Comprehensive docs</li>
                    <li>✓ Code examples</li>
                    <li>✓ Active community</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Overview Section */}
            <section className="mb-12 bg-white rounded-lg p-8 border border-gray-200">
              <h2 className="text-3xl font-bold mb-4">Overview</h2>
              <p className="text-gray-700 mb-4">
                The Aurigraph SDK provides a unified interface for interacting with the Aurigraph V11 blockchain.
                Choose your preferred language and start building production-ready applications.
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-xl font-bold text-blue-900 mb-2">TypeScript/JavaScript</h3>
                  <p className="text-blue-700 text-sm mb-4">Perfect for web and Node.js applications</p>
                  <code className="text-xs bg-white p-2 rounded block">npm install @aurigraph/sdk</code>
                </div>
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h3 className="text-xl font-bold text-green-900 mb-2">Python</h3>
                  <p className="text-green-700 text-sm mb-4">Async/await support with type hints</p>
                  <code className="text-xs bg-white p-2 rounded block">pip install aurigraph-sdk</code>
                </div>
                <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                  <h3 className="text-xl font-bold text-orange-900 mb-2">Go</h3>
                  <p className="text-orange-700 text-sm mb-4">High-performance systems programming</p>
                  <code className="text-xs bg-white p-2 rounded block">go get github.com/aurigraph/sdk-go</code>
                </div>
              </div>
            </section>

            {/* TypeScript SDK Section */}
            <section className="mb-12 bg-white rounded-lg p-8 border border-gray-200">
              <h2 className="text-2xl font-bold mb-4">TypeScript/JavaScript SDK</h2>

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3 text-blue-600">Installation</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-auto mb-4">
                  <pre>npm install @aurigraph/sdk
npm install --save-dev @types/node typescript</pre>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3 text-blue-600">Quick Start</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-auto">
                  <pre>{`import { AurigraphClient } from '@aurigraph/sdk'

const client = new AurigraphClient({
  baseUrl: 'https://dlt.aurigraph.io/api/v11',
  apiKey: process.env.AURIGRAPH_API_KEY,
  timeout: 30000
})

// Connect to the network
await client.connect()

// Get account information
const account = await client.getAccount('auri1...')
console.log('Balance:', account.balance)

// Submit a transaction
const tx = await client.submitTransaction({
  from: 'auri1...',
  to: 'auri1...',
  amount: '1000000'
})

// Track transaction
const status = await client.getTransaction(tx.hash)
console.log('Status:', status.status)`}</pre>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3 text-blue-600">Key Methods</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li><code className="bg-gray-100 px-2 py-1 rounded">connect(): Promise&lt;void&gt;</code> - Connect to the network</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">getAccount(address): Promise&lt;Account&gt;</code> - Get account details</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">getBalance(address): Promise&lt;string&gt;</code> - Get account balance</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">submitTransaction(tx): Promise&lt;Transaction&gt;</code> - Submit a transaction</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">getTransaction(hash): Promise&lt;Transaction&gt;</code> - Get transaction details</li>
                  <li><code className="bg-gray-100 px-2 py-1 rounded">getLatestBlock(): Promise&lt;Block&gt;</code> - Get latest block</li>
                </ul>
              </div>

              <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-2">📦 Package Details</h3>
                <p className="text-blue-700 text-sm">
                  <strong>Version:</strong> 1.0.0+ | <strong>Dependencies:</strong> axios, ws | <strong>License:</strong> Apache 2.0
                </p>
              </div>
            </section>

            {/* Python SDK Section */}
            <section className="mb-12 bg-white rounded-lg p-8 border border-gray-200">
              <h2 className="text-2xl font-bold mb-4">Python SDK</h2>

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3 text-green-600">Installation</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-auto mb-4">
                  <pre>pip install aurigraph-sdk
pip install aiohttp pydantic</pre>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3 text-green-600">Quick Start</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-auto">
                  <pre>{`import asyncio
from aurigraph import AurigraphClient

async def main():
    async with AurigraphClient(
        base_url="https://dlt.aurigraph.io/api/v11",
        api_key="sk_...",
        timeout=30
    ) as client:
        # Connect to the network
        await client.connect()

        # Get account information
        account = await client.get_account("auri1...")
        print(f"Balance: {account.balance}")

        # Submit a transaction
        tx = await client.submit_transaction({
            "from": "auri1...",
            "to": "auri1...",
            "amount": "1000000"
        })

        # Track transaction
        status = await client.get_transaction(tx.hash)
        print(f"Status: {status.status}")

asyncio.run(main())`}</pre>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3 text-green-600">Async/Await Support</h3>
                <p className="text-gray-700 mb-3">
                  The Python SDK is fully async with native support for concurrent operations using aiohttp.
                </p>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-auto">
                  <pre>{`# Concurrent transactions
import asyncio

async def send_multiple_transactions(client, transactions):
    tasks = [
        client.submit_transaction(tx)
        for tx in transactions
    ]
    results = await asyncio.gather(*tasks)
    return results`}</pre>
                </div>
              </div>

              <div className="mb-6 bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-bold text-green-900 mb-2">📦 Package Details</h3>
                <p className="text-green-700 text-sm">
                  <strong>Version:</strong> 1.0.0+ | <strong>Python:</strong> 3.9+ | <strong>License:</strong> Apache 2.0
                </p>
              </div>
            </section>

            {/* Go SDK Section */}
            <section className="mb-12 bg-white rounded-lg p-8 border border-gray-200">
              <h2 className="text-2xl font-bold mb-4">Go SDK</h2>

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3 text-orange-600">Installation</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-auto mb-4">
                  <pre>go get github.com/aurigraph/sdk-go</pre>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3 text-orange-600">Quick Start</h3>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-auto">
                  <pre>{`package main

import (
    "context"
    "fmt"
    "github.com/aurigraph/sdk-go"
)

func main() {
    client := sdk.NewClient(&sdk.Config{
        BaseURL: "https://dlt.aurigraph.io/api/v11",
        APIKey:  "sk_...",
        Timeout: 30,
    })

    ctx := context.Background()

    // Get account information
    account, err := client.GetAccount(ctx, "auri1...")
    if err != nil {
        panic(err)
    }
    fmt.Printf("Balance: %s\\n", account.Balance)

    // Submit a transaction
    tx, err := client.SubmitTransaction(ctx, map[string]interface{}{
        "from":   "auri1...",
        "to":     "auri1...",
        "amount": "1000000",
    })
    if err != nil {
        panic(err)
    }

    // Track transaction
    status, err := client.GetTransaction(ctx, tx.Hash)
    if err != nil {
        panic(err)
    }
    fmt.Printf("Status: %s\\n", status.Status)
}`}</pre>
                </div>
              </div>

              <div className="mb-6 bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h3 className="text-lg font-bold text-orange-900 mb-2">📦 Package Details</h3>
                <p className="text-orange-700 text-sm">
                  <strong>Version:</strong> 1.0.0+ | <strong>Go:</strong> 1.21+ | <strong>License:</strong> Apache 2.0
                </p>
              </div>
            </section>

            {/* Integration Guide */}
            <section className="mb-12 bg-white rounded-lg p-8 border border-gray-200">
              <h2 className="text-2xl font-bold mb-4">Integration Guide</h2>

              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Web Application Integration</h3>
                <p className="text-gray-700 mb-4">
                  For web applications, use the TypeScript SDK with Next.js, React, or vanilla JavaScript:
                </p>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-auto">
                  <pre>{`// React Hook for SDK client
import { useEffect, useState } from 'react'
import { AurigraphClient } from '@aurigraph/sdk'

export function useAurigraphClient() {
  const [client, setClient] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const initClient = async () => {
      const c = new AurigraphClient({
        baseUrl: process.env.NEXT_PUBLIC_API_URL,
        apiKey: process.env.NEXT_PUBLIC_API_KEY
      })
      await c.connect()
      setClient(c)
      setConnected(true)
    }
    initClient()
  }, [])

  return { client, connected }
}`}</pre>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">Backend Integration</h3>
                <p className="text-gray-700 mb-4">
                  For backend services, use Python or Go for high performance and concurrent operations:
                </p>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-auto">
                  <pre>{`# Python FastAPI integration
from fastapi import FastAPI, HTTPException
from aurigraph import AurigraphClient

app = FastAPI()
client = AurigraphClient(base_url="https://dlt.aurigraph.io/api/v11")

@app.post("/api/submit-transaction")
async def submit_transaction(tx: dict):
    try:
        result = await client.submit_transaction(tx)
        return {"hash": result.hash, "status": result.status}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))`}</pre>
                </div>
              </div>
            </section>

            {/* Download Section */}
            <section className="mb-12 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-8 border border-indigo-200">
              <h2 className="text-2xl font-bold mb-6">Download & Get Started</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <a href="https://npmjs.com/package/@aurigraph/sdk" className="bg-white p-6 rounded-lg border border-indigo-200 hover:shadow-lg transition">
                  <h3 className="text-lg font-bold text-blue-600 mb-2">npm</h3>
                  <p className="text-gray-700 text-sm mb-4">TypeScript/JavaScript SDK</p>
                  <code className="text-xs bg-gray-100 p-2 rounded block">npm install @aurigraph/sdk</code>
                </a>
                <a href="https://pypi.org/project/aurigraph-sdk" className="bg-white p-6 rounded-lg border border-green-200 hover:shadow-lg transition">
                  <h3 className="text-lg font-bold text-green-600 mb-2">PyPI</h3>
                  <p className="text-gray-700 text-sm mb-4">Python SDK</p>
                  <code className="text-xs bg-gray-100 p-2 rounded block">pip install aurigraph-sdk</code>
                </a>
                <a href="https://github.com/aurigraph/sdk-go" className="bg-white p-6 rounded-lg border border-orange-200 hover:shadow-lg transition">
                  <h3 className="text-lg font-bold text-orange-600 mb-2">GitHub</h3>
                  <p className="text-gray-700 text-sm mb-4">Go SDK</p>
                  <code className="text-xs bg-gray-100 p-2 rounded block">go get github.com/aurigraph/sdk-go</code>
                </a>
              </div>
            </section>

            {/* Support Section */}
            <section className="bg-white rounded-lg p-8 border border-gray-200">
              <h2 className="text-2xl font-bold mb-4">Support & Resources</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-2">Documentation</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li><Link href="/sdk-docs" className="text-indigo-600 hover:underline">API Reference</Link></li>
                    <li><Link href="/docs" className="text-indigo-600 hover:underline">Getting Started</Link></li>
                    <li><a href="https://github.com/aurigraph" className="text-indigo-600 hover:underline">GitHub Repositories</a></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold mb-2">Community</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li><a href="https://discord.gg/aurigraph" className="text-indigo-600 hover:underline">Discord Community</a></li>
                    <li><a href="https://twitter.com/aurigraph" className="text-indigo-600 hover:underline">Twitter/X</a></li>
                    <li><a href="https://github.com/aurigraph/issues" className="text-indigo-600 hover:underline">Issue Tracker</a></li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
