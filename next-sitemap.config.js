module.exports = {
  siteUrl: process.env.SITE_URL || 'https://www.doxvl.se',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        disallow: ['/admin', '/admin/*'],
      },
    ],
  },
  transform: async (config, path) => {
    return {
      loc: path,
      changefreq: 'weekly',
      priority: path === '/' ? 1.0 : 0.7,
      lastmod: new Date().toISOString(),
      alternateRefs: [
        { href: `${config.siteUrl}${path.replace(/^\/sv/, '')}`, hreflang: 'sv' },
        { href: `${config.siteUrl}/en${path.replace(/^\/(sv|en)/, '')}`, hreflang: 'en' },
      ],
    };
  },
};
