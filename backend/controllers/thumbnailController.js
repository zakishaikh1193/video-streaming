import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get list of available thumbnails
 */
export async function getThumbnails(req, res) {
  try {
    // Resolve path from backend directory
    const backendDir = path.dirname(__dirname);
    const thumbnailsDir = path.join(backendDir, '../video-storage/thumbnails');
    const resolvedPath = path.resolve(thumbnailsDir);
    
    console.log('[Thumbnails] Looking for thumbnails in:', resolvedPath);
    
    // Check if directory exists
    try {
      await fs.access(resolvedPath);
      console.log('[Thumbnails] Directory exists');
    } catch (err) {
      console.error('[Thumbnails] Directory does not exist:', resolvedPath);
      return res.json({ thumbnails: [] });
    }
    
    // Read directory
    const files = await fs.readdir(resolvedPath);
    console.log('[Thumbnails] Found files:', files);
    
    // Filter for image files
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const thumbnails = files
      .filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      })
      .map(file => ({
        filename: file,
        path: `/thumbnails/${file}`,
        name: path.basename(file, path.extname(file))
      }));
    
    console.log('[Thumbnails] Returning thumbnails:', thumbnails.length);
    res.json({ thumbnails });
  } catch (error) {
    console.error('[Thumbnails] Error getting thumbnails:', error);
    res.status(500).json({ error: 'Failed to get thumbnails', message: error.message });
  }
}

/**
 * Diagnostic endpoint to check which videos have thumbnails and which don't
 */
export async function getThumbnailDiagnostic(req, res) {
  try {
    const backendDir = path.dirname(__dirname);
    const thumbnailsDir = path.join(backendDir, '../video-storage/thumbnails');
    const resolvedPath = path.resolve(thumbnailsDir);
    
    // Get all videos from database
    const [videos] = await pool.execute(
      `SELECT id, video_id, title, thumbnail_url FROM videos WHERE deleted_at IS NULL ORDER BY id DESC LIMIT 1000`
    );
    
    // Get all thumbnail files
    let thumbnailFiles = [];
    try {
      await fs.access(resolvedPath);
      const files = await fs.readdir(resolvedPath);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      thumbnailFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext);
      });
    } catch (err) {
      console.error('[Thumbnail Diagnostic] Thumbnails directory does not exist:', resolvedPath);
    }
    
    // Create a set of video IDs that have thumbnails (by filename)
    const thumbnailVideoIds = new Set();
    thumbnailFiles.forEach(file => {
      // Extract video ID from filename (remove extension)
      const videoId = path.basename(file, path.extname(file));
      thumbnailVideoIds.add(videoId);
    });
    
    // Analyze each video
    const analysis = {
      totalVideos: videos.length,
      videosWithThumbnails: 0,
      videosWithoutThumbnails: 0,
      videosWithDbEntryButNoFile: 0,
      videosWithFileButNoDbEntry: 0,
      thumbnailDirectory: resolvedPath,
      thumbnailFilesCount: thumbnailFiles.length,
      details: []
    };
    
    videos.forEach(video => {
      const hasDbEntry = !!video.thumbnail_url;
      const hasFile = thumbnailVideoIds.has(video.video_id);
      
      if (hasFile) {
        analysis.videosWithThumbnails++;
      } else {
        analysis.videosWithoutThumbnails++;
      }
      
      if (hasDbEntry && !hasFile) {
        analysis.videosWithDbEntryButNoFile++;
      }
      
      if (hasFile && !hasDbEntry) {
        analysis.videosWithFileButNoDbEntry++;
      }
      
      analysis.details.push({
        videoId: video.video_id,
        title: video.title,
        hasThumbnailFile: hasFile,
        hasDbEntry: hasDbEntry,
        dbThumbnailUrl: video.thumbnail_url,
        status: hasFile ? 'OK' : (hasDbEntry ? 'DB_ENTRY_NO_FILE' : 'NO_THUMBNAIL')
      });
    });
    
    res.json(analysis);
  } catch (error) {
    console.error('[Thumbnail Diagnostic] Error:', error);
    res.status(500).json({ error: 'Failed to get thumbnail diagnostic', message: error.message });
  }
}

