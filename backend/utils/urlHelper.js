import config from '../config/config.js';

/**
 * Get the base URL for the backend
 * If a request object is provided, it will detect the protocol from proxy headers
 * Otherwise, it uses the BASE_URL environment variable or config default
 * 
 * @param {Object} req - Express request object (optional)
 * @returns {string} Base URL (e.g., "https://kodeit-videos.legatolxp.online" or "http://localhost:5000")
 */
export function getBaseUrl(req = null) {
  // If BASE_URL env var is explicitly set, use it (highest priority)
  // But make sure it's actually a URL, not the env var name itself
  if (process.env.BASE_URL) {
    const baseUrl = process.env.BASE_URL.trim();
    // If it starts with "BASE_URL=", it means the env var was set incorrectly
    if (baseUrl.startsWith('BASE_URL=')) {
      console.warn('[getBaseUrl] BASE_URL env var appears to contain the variable name. Using detected URL instead.');
      // Fall through to detection logic
    } else {
      return baseUrl;
    }
  }
  
  // If request object is provided, detect from proxy headers
  if (req) {
    const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'http';
    const host = req.get('X-Forwarded-Host') || req.get('host') || 'localhost:5000';
    const detectedUrl = `${protocol}://${host}`;
    console.log(`[getBaseUrl] Detected URL from request: ${detectedUrl}`);
    return detectedUrl;
  }
  
  // Fallback to config default
  console.log(`[getBaseUrl] Using config default: ${config.urls.base}`);
  return config.urls.base;
}


