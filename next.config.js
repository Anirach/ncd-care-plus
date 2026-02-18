/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },

  // Performance optimizations
  reactStrictMode: true,

  // Enable SWC minification for smaller bundles
  swcMinify: true,

  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Optimize production builds
  experimental: {
    // Enable optimized package imports for better tree-shaking
    optimizePackageImports: ['clsx', 'tailwind-merge'],
  },

  // Reduce bundle size by excluding source maps in production
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
