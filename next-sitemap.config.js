module.exports = {
  siteUrl: process.env.SITE_URL || 'https://www.doxvl.se',
  generateRobotsTxt: false, // We manage robots.txt manually
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 5000,
  // Exclude admin, error pages, and internal pages from sitemap
  exclude: [
    '/admin',
    '/admin/*',
    '/api/*',
    '/404',
    '/500',
    '/bekraftelse',
    '/confirm-address/*',
    '/orderstatus/*',
    '/shipping-label',
    '/en/admin',
    '/en/admin/*',
    '/en/404',
    '/en/500',
    '/en/bekraftelse',
  ],
};
