import './globals.css'
import { Inter } from 'next/font/google'
import Navigation from '../components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Aurigraph AV10-18 | Next-Gen DLT Platform',
  description: 'Management interface for the quantum-native DLT platform with 5M+ TPS and autonomous compliance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-purple-950">
          <Navigation />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}