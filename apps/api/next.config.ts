import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@halcon-os/shared'],
  typedRoutes: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        // No aplicar a /api/* (esos manejan su propio CORS).
        source: '/((?!api).*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
