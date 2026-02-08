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
    '/orderstatus/*',
    '/shipping-label',
    '/en/admin',
    '/en/admin/*',
    '/en/404',
    '/en/500',
    '/en/bekraftelse',
    '/visum/bekraftelse',
    '/en/visum/bekraftelse',
    '/visum/dokument',
    '/en/visum/dokument',
  ],
  // Custom priority and changefreq per page
  transform: async (config, path) => {
    // Homepage – highest priority
    if (path === '' || path === '/' || path === '/en') {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 1.0,
        lastmod: new Date().toISOString(),
      };
    }

    // Core service pages – very high priority
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
        lastmod: new Date().toISOString(),
      };
    }

    // Individual service pages – high priority
    if (path.startsWith('/tjanster/') || path.startsWith('/en/tjanster/')) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.85,
        lastmod: new Date().toISOString(),
      };
    }

    // Country-specific legalization and visa pages – high priority (long-tail SEO)
    if (
      path.startsWith('/legalisering/') || path.startsWith('/en/legalisering/') ||
      path.startsWith('/visum/') || path.startsWith('/en/visum/')
    ) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: new Date().toISOString(),
      };
    }

    // Regional pages (Stockholm, Göteborg, Malmö, Norge, Danmark, Finland)
    const regionalPages = ['/stockholm', '/goteborg', '/malmo', '/norge', '/danmark', '/finland'];
    if (regionalPages.some(p => path === p || path === `/en${p}`)) {
      return {
        loc: path,
        changefreq: 'monthly',
        priority: 0.75,
        lastmod: new Date().toISOString(),
      };
    }

    // Blog and articles
    if (path.startsWith('/blogg') || path.startsWith('/artiklar') || path.startsWith('/en/blogg') || path.startsWith('/en/artiklar')) {
      return {
        loc: path,
        changefreq: 'weekly',
        priority: 0.6,
        lastmod: new Date().toISOString(),
      };
    }

    // FAQ
    if (path === '/faq' || path === '/en/faq') {
      return {
        loc: path,
        changefreq: 'monthly',
        priority: 0.7,
        lastmod: new Date().toISOString(),
      };
    }

    // Default
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: 0.5,
      lastmod: new Date().toISOString(),
    };
  },
  // Additional paths not auto-discovered
  additionalPaths: async (config) => {
    return [
      { loc: '/llms.txt', changefreq: 'monthly', priority: 0.3 },
    ];
  },
};
