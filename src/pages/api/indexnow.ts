import type { NextApiRequest, NextApiResponse } from 'next';

const INDEXNOW_KEY = '1a4523ead619b9de4719eeb9222e3da5';
const SITE_URL = 'https://doxvl.se';

/**
 * IndexNow API route — submit URLs to Bing, Yandex, DuckDuckGo for instant indexing.
 * POST /api/indexnow { urls: ["/page1", "/page2"] }
 * GET  /api/indexnow — submits all important pages
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    let urlList: string[] = [];

    if (req.method === 'POST' && req.body?.urls) {
      urlList = req.body.urls.map((u: string) => u.startsWith('http') ? u : `${SITE_URL}${u}`);
    } else {
      // Default: submit all key pages
      urlList = [
        '/',
        '/tjanster/apostille',
        '/tjanster/ambassadlegalisering',
        '/tjanster/notarius-publicus',
        '/tjanster/utrikesdepartementet',
        '/tjanster/oversattning',
        '/tjanster/handelskammaren',
        '/bestall',
        '/priser',
        '/kontakt',
        '/om-oss',
        '/faq',
        '/visum',
        '/legalisering',
        '/legalisering/qatar',
        '/legalisering/kuwait',
        '/legalisering/saudiarabien',
        '/legalisering/uae',
        '/legalisering/egypten',
        '/legalisering/angola',
        '/legalisering/indien',
        '/legalisering/thailand',
        '/stockholm',
        '/goteborg',
        '/malmo',
        '/norge',
        '/danmark',
        '/finland',
      ].map(u => `${SITE_URL}${u}`);
    }

    const payload = {
      host: 'doxvl.se',
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList,
    };

    // Submit to IndexNow (Bing endpoint — also covers DuckDuckGo, Yandex, Seznam)
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    res.status(200).json({
      success: true,
      submitted: urlList.length,
      indexNowStatus: response.status,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'IndexNow submission failed' });
  }
}
