import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0a1628" />
        <meta
          name="description"
          content="Aurigraph DLT - The institutional blockchain for real-world asset tokenization. Quantum-resistant, deterministic, and environmentally sustainable."
        />
        <meta property="og:title" content="Aurigraph DLT - Institutional Blockchain for RWA" />
        <meta
          property="og:description"
          content="Transform real-world assets into digital tokens with enterprise-grade blockchain technology. 3M+ TPS, quantum-resistant security, and ESG compliance."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://aurigraph.io" />
        <meta property="og:image" content="https://aurigraph.io/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@aurigraph" />
      </Head>
      <body className="animated-bg">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
