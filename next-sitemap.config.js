module.exports = {
  siteUrl: process.env.SITE_URL || 'https://doxvl-51a30.web.app',
  generateRobotsTxt: false,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
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
