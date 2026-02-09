/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    locales: ['en', 'fr', 'de'],
    defaultLocale: 'en',
  },
  images: {
    domains: ['example.com'],
  },
  async rewrites() {
    return [
      { source: '/old-path', destination: '/new-path' },
    ];
  },
  async redirects() {
    return [
      { source: '/legacy', destination: '/modern', permanent: true },
    ];
  },
  webpack(config) {
    config.resolve.alias['@'] = './src';
    return config;
  },
};

module.exports = nextConfig;
