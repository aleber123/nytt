const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  images: {
    domains: ['localhost'],
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"]
    });

    return config;
  },
  async redirects() {
    return [
      {
        source: '/services',
        destination: '/tjanster',
        permanent: true,
      },
      {
        source: '/order',
        destination: '/bestall',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
