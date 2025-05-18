import { Router } from 'express';
import { SitemapStream, streamToPromise } from 'sitemap';

const router = Router();

router.get('/sitemap.xml', async (req, res) => {
  try {
    const smStream = new SitemapStream({
      hostname: 'https://PROJECT_CLIENT_DOMAIN',
    });

    // Get all public tables

    // Add static routes
    smStream.write({ url: '/', changefreq: 'daily', priority: 1 });

    smStream.end();

    const sitemap = await streamToPromise(smStream);

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

export default router;
