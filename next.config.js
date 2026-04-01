/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@napi-rs/canvas', 'chart.js'],
  },
}

module.exports = nextConfig