import pool from '../config/database.js';
import config from '../config/config.js';
import { generateUniqueShortId } from '../utils/shortUrlGenerator.js';

/**
 * Create redirect entry with short URL
 * Returns both the original slug and a short URL slug
 */
export async function createRedirect(slug, targetUrl, useShortUrl = true) {
  let shortSlug = slug;
  
  // Generate short URL if requested
  if (useShortUrl) {
    try {
      shortSlug = await generateUniqueShortId();
      console.log(`Generated short URL slug: ${shortSlug} for video: ${slug}`);
    } catch (error) {
      console.warn('Failed to generate short URL, using original slug:', error.message);
      shortSlug = slug;
    }
  }
  
  // Create redirect with short slug
  const query = 'INSERT INTO redirects (slug, target_url) VALUES (?, ?) ON DUPLICATE KEY UPDATE target_url = ?';
  const [result] = await pool.execute(query, [shortSlug, targetUrl, targetUrl]);
  
  // Also create redirect for original slug if different
  if (shortSlug !== slug) {
    try {
      await pool.execute(query, [slug, targetUrl, targetUrl]);
    } catch (error) {
      // Ignore if original slug already exists
    }
  }
  
  return {
    insertId: result.insertId,
    shortSlug,
    shortUrl: `${config.urls.base}/${shortSlug}`
  };
}

/**
 * Get redirect by slug
 */
export async function getRedirectBySlug(slug) {
  const query = 'SELECT * FROM redirects WHERE slug = ? LIMIT 1';
  const [rows] = await pool.execute(query, [slug]);
  return rows[0] || null;
}

/**
 * Get all redirects - only for active videos (not deleted)
 * Returns only recent/active redirects with QR codes
 */
export async function getAllRedirects() {
  // Join with videos table to filter only active videos
  // Only show redirects that belong to active videos
  const query = `
    SELECT DISTINCT 
      r.id,
      r.slug,
      r.target_url,
      r.created_at,
      r.updated_at,
      v.video_id,
      v.title,
      v.status,
      v.redirect_slug,
      v.qr_url,
      v.subject,
      v.grade,
      v.lesson,
      v.module
    FROM redirects r
    LEFT JOIN videos v ON (
      r.slug = v.redirect_slug 
      OR r.slug = v.video_id
    )
    WHERE (v.status = 'active' OR (v.status IS NULL AND r.slug NOT IN (
      SELECT COALESCE(redirect_slug, video_id) 
      FROM videos 
      WHERE status = 'deleted' 
        AND (redirect_slug IS NOT NULL OR video_id IS NOT NULL)
    )))
    ORDER BY 
      CASE WHEN v.updated_at IS NOT NULL THEN v.updated_at ELSE r.created_at END DESC,
      r.created_at DESC
    LIMIT 500
  `;
  
  const [rows] = await pool.execute(query);
  
  // Additional filter: only return redirects for active videos
  const activeRedirects = rows.filter(row => {
    // If we have a video match, it must be active
    if (row.video_id && row.status) {
      return row.status === 'active';
    }
    // If no video match but redirect exists, include it (standalone redirect)
    return true;
  });
  
  console.log(`[getAllRedirects] Found ${activeRedirects.length} active redirects (filtered from ${rows.length} total)`);
  
  return activeRedirects;
}

/**
 * Delete redirect
 */
export async function deleteRedirect(slug) {
  const query = 'DELETE FROM redirects WHERE slug = ?';
  const [result] = await pool.execute(query, [slug]);
  return result.affectedRows > 0;
}

/**
 * Build redirect URL
 */
export function buildRedirectUrl(slug) {
  return `${config.urls.base}/${slug}`;
}





