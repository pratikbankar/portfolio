import type { NextConfig } from 'next';

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');
const api = new URL(API_URL);
const apiIsLocal = ['localhost', '127.0.0.1'].includes(api.hostname);

// On Vercel the production address is known at build time, so NEXT_PUBLIC_SITE_URL is optional there.
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: { NEXT_PUBLIC_SITE_URL: SITE_URL },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: api.protocol.replace(':', '') as 'http' | 'https',
        hostname: api.hostname,
        port: api.port,
        pathname: '/api/files/**',
      },
    ],
    // The optimizer refuses private addresses by default; only relax that for local development.
    dangerouslyAllowLocalIP: apiIsLocal,
  },
  // The browser only ever talks to this origin, which keeps the admin session cookie first-party.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      { source: '/admin/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
    ];
  },
};

export default nextConfig;
