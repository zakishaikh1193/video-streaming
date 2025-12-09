import express from 'express';
import * as streamController from '../controllers/streamController.js';

const router = express.Router();

// Short streaming route: /s/:slug (e.g., /api/s/kdn4adsn4e)
router.options('/s/:slug', (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Range, Content-Type, Accept, Origin, X-Requested-With');
  res.header('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  res.sendStatus(200);
});

router.head('/s/:slug', async (req, res, next) => {
  // Map slug to videoId for streaming and mark as short slug route
  req.params.videoId = req.params.slug;
  req.isShortSlugRoute = true; // Flag to indicate this is a short slug route
  next();
}, streamController.streamVideo);

router.get('/s/:slug', async (req, res, next) => {
  // Map slug to videoId for streaming and mark as short slug route
  console.log(`[StreamingRoute] GET /api/s/${req.params.slug} - Mapping to videoId`);
  req.params.videoId = req.params.slug;
  req.isShortSlugRoute = true; // Flag to indicate this is a short slug route
  next();
}, streamController.streamVideo);

export default router;


