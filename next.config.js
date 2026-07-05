/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['bcrypt', 'ccxt'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
      },
      {
        protocol: 'https',
        hostname: 'coin-images.coingecko.com',
      },
    ],
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
}

module.exports = nextConfig
