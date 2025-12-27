/**
 * Mobile App Documentation Page
 * Wallet app information, registration, download, and integration
 */

import Head from 'next/head'
import Link from 'next/link'

export default function MobileAppPage() {
  return (
    <>
      <Head>
        <title>Mobile Wallet App - Aurigraph V11</title>
        <meta name="description" content="Download and manage your Aurigraph wallet on iOS and Android. Secure asset management with biometric authentication." />
      </Head>

      <main className="flex flex-col">
        {/* Header */}
        <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-4">Aurigraph Wallet</h1>
            <p className="text-lg text-purple-100">
              Secure crypto and asset management on iOS and Android
            </p>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

            {/* Business Proposition */}
            <section className="mb-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-3xl font-bold mb-4">Control Your Wealth, Anywhere</h2>
                  <p className="text-purple-100 mb-6">
                    Aurigraph Wallet puts you in complete control of your digital assets with bank-level security you can carry in your pocket.
                    Non-custodial, decentralized, and built for everyone.
                  </p>
                  <ul className="space-y-2 text-purple-50">
                    <li>✓ <strong>Your Keys, Your Coins</strong> - True ownership</li>
                    <li>✓ <strong>Biometric Security</strong> - Face ID & Touch ID</li>
                    <li>✓ <strong>Instant Transactions</strong> - Sub-second finality</li>
                    <li>✓ <strong>Zero Gas</strong> - Quantum-safe, minimal fees</li>
                    <li>✓ <strong>Multi-Asset</strong> - Manage ARI, tokens, NFTs</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-6 text-gray-900">
                  <h3 className="text-2xl font-bold mb-4">Download & Register</h3>
                  <form className="space-y-4">
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      required
                    />
                    <select className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                      <option value="">I use...</option>
                      <option value="ios">iPhone / iPad</option>
                      <option value="android">Android</option>
                      <option value="both">Both iOS & Android</option>
                    </select>
                    <button
                      type="submit"
                      className="w-full bg-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-purple-700 transition"
                    >
                      Download App
                    </button>
                    <p className="text-sm text-gray-600 text-center">
                      Join 10K+ users managing $50M+ in assets
                    </p>
                  </form>
                </div>
              </div>
            </section>

            {/* Target Users */}
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Built for Every User Type</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition">
                  <h3 className="text-lg font-bold mb-2">💰 Hodlers</h3>
                  <p className="text-gray-700 text-sm mb-4">
                    Secure long-term storage for your ARI and digital assets with hardware-grade encryption.
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>✓ Non-custodial</li>
                    <li>✓ Cold storage ready</li>
                    <li>✓ Recovery phrase backup</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition">
                  <h3 className="text-lg font-bold mb-2">🔄 Traders</h3>
                  <p className="text-gray-700 text-sm mb-4">
                    Send and receive instant transactions with real-time balance updates and transaction history.
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>✓ Live price feeds</li>
                    <li>✓ Instant settlement</li>
                    <li>✓ Transaction tracking</li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-lg transition">
                  <h3 className="text-lg font-bold mb-2">🌐 Developers</h3>
                  <p className="text-gray-700 text-sm mb-4">
                    Integrate Aurigraph Wallet into your dApp with WalletConnect and deep linking.
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>✓ WalletConnect v2</li>
                    <li>✓ Deep linking</li>
                    <li>✓ Native SDKs</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Overview Section */}
            <section className="mb-12 bg-white rounded-lg p-8 border border-gray-200">
              <h2 className="text-3xl font-bold mb-4">Overview</h2>
              <p className="text-gray-700 mb-6">
                The Aurigraph Wallet is a non-custodial mobile application that gives you full control of your digital assets on the Aurigraph V11 blockchain.
                Securely manage your wallet, send transactions, and interact with DeFi applications directly from your phone.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-xl font-bold text-blue-900 mb-3">Key Features</h3>
                  <ul className="space-y-2 text-blue-800">
                    <li>✓ Non-custodial wallet (you control your keys)</li>
                    <li>✓ Biometric authentication (Face ID / Touch ID)</li>
                    <li>✓ Send & receive transactions instantly</li>
                    <li>✓ View transaction history</li>
                    <li>✓ Manage multiple accounts</li>
                    <li>✓ Offline support for basic operations</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                  <h3 className="text-xl font-bold text-purple-900 mb-3">System Requirements</h3>
                  <ul className="space-y-2 text-purple-800">
                    <li><strong>iOS:</strong> 14.0 or later</li>
                    <li><strong>Android:</strong> API level 28 (Android 9) or later</li>
                    <li><strong>RAM:</strong> Minimum 2GB</li>
                    <li><strong>Storage:</strong> Minimum 100MB free space</li>
                    <li><strong>Network:</strong> WiFi or mobile data connection</li>
                    <li><strong>Processor:</strong> ARM64 or x86-64</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Download Section */}
            <section className="mb-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-8 border border-green-200">
              <h2 className="text-2xl font-bold mb-6 text-green-900">Download & Install</h2>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* iOS */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">🍎</span>
                    <h3 className="text-2xl font-bold">iOS App</h3>
                  </div>
                  <p className="text-gray-700 mb-6">
                    Download Aurigraph Wallet from the Apple App Store. Available on iPhone and iPad running iOS 14 or later.
                  </p>
                  <div className="space-y-3">
                    <a
                      href="https://apps.apple.com/app/aurigraph-wallet/id1234567890"
                      className="block bg-blue-600 text-white py-3 px-4 rounded-lg text-center font-bold hover:bg-blue-700 transition"
                    >
                      Download from App Store
                    </a>
                    <p className="text-gray-600 text-sm">
                      Free • In-App purchases optional • Version 1.0.0 • 120MB
                    </p>
                  </div>
                </div>

                {/* Android */}
                <div className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">🤖</span>
                    <h3 className="text-2xl font-bold">Android App</h3>
                  </div>
                  <p className="text-gray-700 mb-6">
                    Download Aurigraph Wallet from Google Play Store. Requires Android 9 (API 28) or later.
                  </p>
                  <div className="space-y-3">
                    <a
                      href="https://play.google.com/store/apps/details?id=io.aurigraph.wallet"
                      className="block bg-green-600 text-white py-3 px-4 rounded-lg text-center font-bold hover:bg-green-700 transition"
                    >
                      Download from Play Store
                    </a>
                    <p className="text-gray-600 text-sm">
                      Free • In-App purchases optional • Version 1.0.0 • 95MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-bold text-yellow-900 mb-2">⚠️ Safety Warning</h4>
                <p className="text-yellow-800 text-sm">
                  Always download Aurigraph Wallet from official app stores only. Verify the official publisher (Aurigraph Corp) before installing.
                </p>
              </div>
            </section>

            {/* Registration & Setup */}
            <section className="mb-12 bg-white rounded-lg p-8 border border-gray-200">
              <h2 className="text-2xl font-bold mb-6">Registration & Setup</h2>

              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex gap-6">
                  <div className="bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">Install the App</h3>
                    <p className="text-gray-700 mb-3">
                      Download the app from your device's app store (App Store for iOS, Play Store for Android).
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-6">
                  <div className="bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">Create or Import Wallet</h3>
                    <p className="text-gray-700 mb-3">
                      Choose to create a new wallet or import an existing one using your recovery phrase (12-24 words).
                    </p>
                    <div className="bg-gray-100 p-3 rounded-lg text-sm text-gray-700">
                      <strong>First time?</strong> Create a new wallet. Safe your recovery phrase in a secure location.
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-6">
                  <div className="bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">Set Up Security</h3>
                    <p className="text-gray-700 mb-3">
                      Configure biometric authentication (Face ID/Touch ID) and set a PIN for additional security.
                    </p>
                    <ul className="list-disc list-inside text-gray-700 ml-2">
                      <li>Enable Face ID or Touch ID authentication</li>
                      <li>Create a strong PIN (6+ digits)</li>
                      <li>Save recovery phrase securely</li>
                    </ul>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-6">
                  <div className="bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">Verify Account</h3>
                    <p className="text-gray-700 mb-3">
                      Verify your account by connecting to the Aurigraph network. Your wallet is now ready to use!
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* User Guide */}
            <section className="mb-12 bg-white rounded-lg p-8 border border-gray-200">
              <h2 className="text-2xl font-bold mb-6">User Guide</h2>

              <div className="space-y-6">
                {/* View Balance */}
                <div>
                  <h3 className="text-xl font-bold mb-3">View Balance</h3>
                  <p className="text-gray-700 mb-3">
                    Your account balance is displayed on the main wallet screen. Tap the account to see detailed information:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 ml-2 space-y-1">
                    <li>Account address (ARI address starting with "auri1")</li>
                    <li>Available balance</li>
                    <li>Recent transactions</li>
                    <li>Account nonce (transaction count)</li>
                  </ul>
                </div>

                {/* Send Transaction */}
                <div>
                  <h3 className="text-xl font-bold mb-3">Send Transaction</h3>
                  <p className="text-gray-700 mb-3">
                    To send ARI or tokens:
                  </p>
                  <ol className="list-decimal list-inside text-gray-700 ml-2 space-y-2">
                    <li>Tap the "Send" button on the home screen</li>
                    <li>Enter or scan the recipient's address</li>
                    <li>Enter the amount to send</li>
                    <li>Review transaction details</li>
                    <li>Confirm with biometric authentication</li>
                    <li>Transaction is submitted to the network</li>
                  </ol>
                </div>

                {/* Receive Funds */}
                <div>
                  <h3 className="text-xl font-bold mb-3">Receive Funds</h3>
                  <p className="text-gray-700 mb-3">
                    To receive ARI or tokens:
                  </p>
                  <ol className="list-decimal list-inside text-gray-700 ml-2 space-y-2">
                    <li>Tap the "Receive" button on the home screen</li>
                    <li>Your account address is displayed</li>
                    <li>Share the address or QR code with the sender</li>
                    <li>Funds will appear in your wallet after confirmation</li>
                  </ol>
                </div>

                {/* Transaction History */}
                <div>
                  <h3 className="text-xl font-bold mb-3">Transaction History</h3>
                  <p className="text-gray-700 mb-3">
                    View all your transactions in the History tab:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 ml-2 space-y-1">
                    <li>Sent transactions (outgoing)</li>
                    <li>Received transactions (incoming)</li>
                    <li>Pending transactions</li>
                    <li>Failed transactions with error details</li>
                  </ul>
                </div>

                {/* Security Features */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-bold text-blue-900 mb-3">🔒 Security Features</h3>
                  <ul className="list-disc list-inside text-blue-800 ml-2 space-y-1">
                    <li>Non-custodial: You control your private keys</li>
                    <li>Biometric authentication (Face ID / Touch ID)</li>
                    <li>PIN protection for sensitive operations</li>
                    <li>Encrypted local storage of keys</li>
                    <li>No servers store your private keys</li>
                    <li>Regular security audits</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Developer Integration */}
            <section className="mb-12 bg-white rounded-lg p-8 border border-gray-200">
              <h2 className="text-2xl font-bold mb-6">Developer Integration</h2>

              <p className="text-gray-700 mb-6">
                Integrate your application with Aurigraph Wallet using deep links and native SDKs:
              </p>

              <div className="space-y-6">
                {/* Deep Links */}
                <div>
                  <h3 className="text-lg font-bold mb-3">Deep Links</h3>
                  <p className="text-gray-700 mb-3">
                    Open Aurigraph Wallet from your app with specific actions:
                  </p>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-auto">
                    <pre>{`// Open wallet to send funds
aurigraph://send?to=auri1address&amount=1000000

// Open wallet to view account
aurigraph://account?address=auri1address

// Open wallet to receive funds
aurigraph://receive

// Deep link in React Native
import { Linking } from 'react-native'

const openWallet = async (address) => {
  const url = \`aurigraph://account?address=\${address}\`
  await Linking.openURL(url)
}`}</pre>
                  </div>
                </div>

                {/* WalletConnect Integration */}
                <div>
                  <h3 className="text-lg font-bold mb-3">WalletConnect Support</h3>
                  <p className="text-gray-700 mb-3">
                    Connect your dApp to Aurigraph Wallet using WalletConnect protocol (v2):
                  </p>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-auto">
                    <pre>{`import { EthereumProvider } from '@walletconnect/ethereum-provider'

const provider = await EthereumProvider.init({
  projectId: 'YOUR_PROJECT_ID',
  chains: [1],  // Aurigraph mainnet
  showQrModal: true
})

// Request connection
await provider.connect()

// Send transaction through wallet
const txHash = await provider.request({
  method: 'eth_sendTransaction',
  params: [{
    from: userAddress,
    to: recipientAddress,
    value: '1000000'
  }]
})`}</pre>
                  </div>
                </div>

                {/* Transaction Requests */}
                <div>
                  <h3 className="text-lg font-bold mb-3">Transaction Requests</h3>
                  <p className="text-gray-700 mb-3">
                    Request the user to sign transactions from your dApp:
                  </p>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-auto">
                    <pre>{`// Request transaction signature
const signatureRequest = {
  method: 'eth_sendTransaction',
  params: [{
    from: userAddress,
    to: smartContractAddress,
    data: '0x...', // Encoded function call
    value: '0'
  }]
}

const signature = await provider.request(signatureRequest)`}</pre>
                  </div>
                </div>
              </div>
            </section>

            {/* Support Section */}
            <section className="mb-12 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-8 border border-indigo-200">
              <h2 className="text-2xl font-bold mb-6">Support & Resources</h2>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold mb-3">Wallet Documentation</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li><Link href="/mobile-app" className="text-indigo-600 hover:underline">Getting Started Guide</Link></li>
                    <li><Link href="/sdk-docs" className="text-indigo-600 hover:underline">SDK Integration</Link></li>
                    <li><a href="https://github.com/aurigraph/wallet" className="text-indigo-600 hover:underline">GitHub Repository</a></li>
                    <li><a href="https://docs.aurigraph.io/wallet" className="text-indigo-600 hover:underline">Full Documentation</a></li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold mb-3">Get Help</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li><a href="https://discord.gg/aurigraph" className="text-indigo-600 hover:underline">💬 Discord Community</a></li>
                    <li><a href="mailto:support@aurigraph.io" className="text-indigo-600 hover:underline">📧 Email Support</a></li>
                    <li><a href="https://twitter.com/aurigraph" className="text-indigo-600 hover:underline">🐦 Twitter/X</a></li>
                    <li><a href="https://github.com/aurigraph/wallet/issues" className="text-indigo-600 hover:underline">🐛 Report Issues</a></li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold mb-3">Security</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li><a href="https://security.aurigraph.io" className="text-indigo-600 hover:underline">🔒 Security Policy</a></li>
                    <li><a href="https://github.com/aurigraph/security-disclosure" className="text-indigo-600 hover:underline">🛡️ Responsible Disclosure</a></li>
                    <li><a href="https://audit.aurigraph.io" className="text-indigo-600 hover:underline">✅ Security Audit</a></li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold mb-3">Legal</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li><a href="/terms" className="text-indigo-600 hover:underline">📋 Terms of Service</a></li>
                    <li><a href="/privacy" className="text-indigo-600 hover:underline">🔒 Privacy Policy</a></li>
                    <li><a href="https://github.com/aurigraph/wallet/blob/main/LICENSE" className="text-indigo-600 hover:underline">📄 License (Apache 2.0)</a></li>
                  </ul>
                </div>
              </div>
            </section>

            {/* FAQ */}
            <section className="bg-white rounded-lg p-8 border border-gray-200">
              <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>

              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h3 className="font-bold mb-2">Is Aurigraph Wallet safe?</h3>
                  <p className="text-gray-700">
                    Yes. Aurigraph Wallet is non-custodial, meaning you control your private keys. We use industry-standard encryption and have undergone professional security audits. Your keys never leave your device.
                  </p>
                </div>

                <div className="border-b pb-4">
                  <h3 className="font-bold mb-2">What if I lose my phone?</h3>
                  <p className="text-gray-700">
                    As long as you saved your recovery phrase securely, you can restore your wallet on a new device. Never share your recovery phrase with anyone.
                  </p>
                </div>

                <div className="border-b pb-4">
                  <h3 className="font-bold mb-2">Can I use multiple accounts?</h3>
                  <p className="text-gray-700">
                    Yes. The app supports multiple accounts. Each account has its own address and can be managed separately within the same wallet.
                  </p>
                </div>

                <div className="border-b pb-4">
                  <h3 className="font-bold mb-2">Are there any transaction fees?</h3>
                  <p className="text-gray-700">
                    Yes. All transactions on the Aurigraph network require a small gas fee, which varies based on network congestion. The app shows the estimated fee before confirmation.
                  </p>
                </div>

                <div className="border-b pb-4">
                  <h3 className="font-bold mb-2">How do I backup my wallet?</h3>
                  <p className="text-gray-700">
                    Save your recovery phrase in multiple secure locations (write it down, use a password manager, or store it in a hardware wallet). Never store it digitally where it could be hacked.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold mb-2">Which networks are supported?</h3>
                  <p className="text-gray-700">
                    Aurigraph Wallet supports the Aurigraph V11 mainnet, testnet, and development networks. You can switch networks in the app settings.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
