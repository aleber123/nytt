// Build date used as lastmod only for dynamic/frequently updated pages
const BUILD_DATE = new Date().toISOString();

module.exports = {
  siteUrl: process.env.SITE_URL || 'https://doxvl.se',
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
    '/confirm-embassy-price/*',
    '/orderstatus',
    '/orderstatus/*',
    '/shipping-label',
    '/portal',
    '/portal/*',
    '/lander/*',
    '/en/admin',
    '/en/admin/*',
    '/en/404',
    '/en/500',
    '/en/bekraftelse',
    '/en/confirm-address/*',
    '/en/confirm-embassy-price/*',
    '/en/orderstatus',
    '/en/orderstatus/*',
    '/en/portal',
    '/en/portal/*',
    '/en/lander/*',
    '/visum/bekraftelse',
    '/en/visum/bekraftelse',
    '/visum/dokument',
    '/en/visum/dokument',
  ],
  // Custom priority and changefreq per page
  transform: async (config, path) => {
    // Homepage – highest priority, updates frequently
    if (path === '' || path === '/' || path === '/en') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: BUILD_DATE,
      };
    }

    // Core service pages – very high priority, update with builds
    const highPriorityPages = [
      '/legalisering',
      '/visum',
      '/tjanster',
      '/bestall',
      '/priser',
      '/kontakt',
    ];
    if (highPriorityPages.some(p => path === p || path === `/en${p}`)) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.9,
        lastmod: BUILD_DATE,
      };
    }

    // Individual service pages – high priority, stable content
    if (path.startsWith('/tjanster/') || path.startsWith('/en/tjanster/')) {
      return {
        loc: path,
        changefreq: 'monthly',
        priority: 0.85,
      };
    }

    // Country-specific legalization and visa pages – high priority (long-tail SEO), stable
    if (
      path.startsWith('/legalisering/') || path.startsWith('/en/legalisering/') ||
      path.startsWith('/visum/') || path.startsWith('/en/visum/')
    ) {
      return {
        loc: path,
        changefreq: 'monthly',
        priority: 0.8,
      };
    }

    // Regional pages (Stockholm, Göteborg, Malmö, Norge, Danmark, Finland)
    const regionalPages = ['/stockholm', '/goteborg', '/malmo', '/norge', '/danmark', '/finland'];
    if (regionalPages.some(p => path === p || path === `/en${p}`)) {
      return {
        loc: path,
        changefreq: 'monthly',
        priority: 0.75,
      };
    }

    // Blog and articles – update when new content is published
    if (path.startsWith('/blogg') || path.startsWith('/artiklar') || path.startsWith('/en/blogg') || path.startsWith('/en/artiklar')) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.6,
        lastmod: BUILD_DATE,
      };
    }

    // FAQ
    if (path === '/faq' || path === '/en/faq') {
      return {
        loc: path,
        changefreq: 'monthly',
        priority: 0.7,
      };
    }

    // Default – stable pages, no lastmod (omit = Google uses crawl date)
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: 0.5,
    };
  },
  // Additional paths not auto-discovered
  additionalPaths: async (config) => {
    return [
      { loc: '/llms.txt', changefreq: 'monthly', priority: 0.3 },
    ];
  },
};
