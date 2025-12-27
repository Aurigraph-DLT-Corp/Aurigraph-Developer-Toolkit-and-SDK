/**
 * Next.js App Component
 * Global layout and configuration
 */

import type { AppProps } from 'next/app'
import { SessionProvider } from 'next-auth/react'
import '@styles/globals.css'

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  )
}
