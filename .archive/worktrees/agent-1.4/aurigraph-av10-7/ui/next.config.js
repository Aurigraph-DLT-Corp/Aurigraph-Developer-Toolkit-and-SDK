/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    appDir: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/v10/:path*',
        destination: 'http://localhost:3001/api/v10/:path*',
      },
    ];
  },
}