import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@duckdb/duckdb-wasm'],
  turbopack: {},
  webpack: (config) => {
    config.experiments.asyncWebAssembly = true
    return config
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/PokéAPI/sprites/master/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/team',
        destination: '/matchups',
        permanent: true,
      },
    ]
  },
}

export default nextConfig
