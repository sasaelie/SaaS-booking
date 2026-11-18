import type { NextConfig } from 'next';
const config: NextConfig = {
  poweredByHeader: false,
  outputFileTracingIncludes: { '/api/plateforme/billing': ['./public/fonts/DejaVuSans.ttf'] },
  devIndicators: false,
  agentRules: false,
  logging: { serverFunctions: false, browserToTerminal: false },
  async redirects() {
    return [
      {
        source: '/simulation/:organizationId/gestion',
        destination: '/manage?test=1',
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Referrer-Policy', value: 'no-referrer' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/manage',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Cache-Control', value: 'private, no-store' },
        ],
      },
    ];
  },
};
export default config;
