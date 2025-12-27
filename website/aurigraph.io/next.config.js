/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Image optimization
  images: {
    domains: ['dlt.aurigraph.io', 'cdn.aurigraph.io'],
    formats: ['image/avif', 'image/webp'],
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ]
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
        permanent: false,
      },
    ]
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE || 'https://dlt.aurigraph.io/api/v11',
  },

  // Webpack config
  webpack: (config, { isServer }) => {
    return config
  },
}

module.exports = nextConfig
