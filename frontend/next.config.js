/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
  },
  
  // Configure domains for images if needed
  images: {
    domains: ['devlogr.space', 'proxy.devlogr.space'],
  },
  
  // Handle API routes properly
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'production'
          ? 'https://api.devlogr.space/api/:path*'
          : 'http://localhost:3001/api/:path*'
      }
    ];
  },
  
  // Configure headers for security and CORS
  async headers() {
    return [
      {
        source: '/(.*)',
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
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Optimize for production
  poweredByHeader: false,
  compress: true,
  
  // Handle trailing slashes
  trailingSlash: false,
  
  // Configure output for Vercel
  output: 'standalone',
};

module.exports = nextConfig;