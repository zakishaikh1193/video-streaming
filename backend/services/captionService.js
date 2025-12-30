import pool from '../config/database.js';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureDirectoryExists } from '../utils/fileUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAPTIONS_DIR = path.join(__dirname, '../../video-storage/captions');

/**
 * Upload caption file
 */
export async function uploadCaption(videoId, language, fileBuffer, filename) {
  try {
    await ensureDirectoryExists(CAPTIONS_DIR);
    
    const captionPath = path.join(CAPTIONS_DIR, `${videoId}_${language}.vtt`);
    await fs.writeFile(captionPath, fileBuffer);
    
    const relativePath = `captions/${videoId}_${language}.vtt`;
    
    // Save to database
    const query = `
      INSERT INTO captions (video_id, language, file_path)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE file_path = ?
    `;
    
    await pool.execute(query, [videoId, language, relativePath, relativePath]);
    
    return relativePath;
  } catch (error) {
    console.error('Error uploading caption:', error);
    throw error;
  }
}

/**
 * Get captions for a video
 */
export async function getCaptionsByVideoId(videoId) {
  const query = 'SELECT * FROM captions WHERE video_id = ?';
  const [rows] = await pool.execute(query, [videoId]);
  return rows;
}

/**
 * Delete caption by ID
 */
export async function deleteCaption(id) {
  const query = 'SELECT * FROM captions WHERE id = ?';
  const [rows] = await pool.execute(query, [id]);
  
  if (rows.length > 0) {
    const caption = rows[0];
    const filePath = path.join(__dirname, '../../video-storage', caption.file_path);
    
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting caption file:', error);
    }
    
    const deleteQuery = 'DELETE FROM captions WHERE id = ?';
    const [result] = await pool.execute(deleteQuery, [id]);
    return result.affectedRows > 0;
  }
  
  return false;
}

/**
 * Delete all captions for a video by videoId
 * Also deletes caption files from both locations:
 * - video-storage/captions/ (final location)
 * - backend/subtitles/ (temp location)
 */
export async function deleteCaptionsByVideoId(videoId) {
  try {
    // Get all captions for this video
    const captions = await getCaptionsByVideoId(videoId);
    
    if (captions.length === 0) {
      console.log(`[deleteCaptionsByVideoId] No captions found for video ${videoId}`);
      return { deleted: 0, filesDeleted: 0 };
    }
    
    let filesDeleted = 0;
    
    // Delete caption files from video-storage/captions/
    for (const caption of captions) {
      try {
        // Delete from video-storage/captions/
        const captionFilePath = path.join(CAPTIONS_DIR, `${videoId}_${caption.language}.vtt`);
        if (fsSync.existsSync(captionFilePath)) {
          await fs.unlink(captionFilePath);
          console.log(`[deleteCaptionsByVideoId] ✅ Deleted caption file: ${captionFilePath}`);
          filesDeleted++;
        }
      } catch (error) {
        console.warn(`[deleteCaptionsByVideoId] Could not delete caption file for ${videoId}_${caption.language}:`, error.message);
      }
    }
    
    // Delete temp subtitle file from backend/subtitles/
    try {
      const subtitlesDir = path.join(__dirname, '../subtitles');
      const tempSubtitlePath = path.join(subtitlesDir, `${videoId}.vtt`);
      if (fsSync.existsSync(tempSubtitlePath)) {
        await fs.unlink(tempSubtitlePath);
        console.log(`[deleteCaptionsByVideoId] ✅ Deleted temp subtitle file: ${tempSubtitlePath}`);
        filesDeleted++;
      }
    } catch (error) {
      // Ignore if temp file doesn't exist
      console.log(`[deleteCaptionsByVideoId] Temp subtitle file not found (this is OK): ${videoId}.vtt`);
    }
    
    // Delete from database
    const deleteQuery = 'DELETE FROM captions WHERE video_id = ?';
    const [result] = await pool.execute(deleteQuery, [videoId]);
    const deletedCount = result.affectedRows;
    
    console.log(`[deleteCaptionsByVideoId] ✅ Deleted ${deletedCount} caption(s) from database for video ${videoId}`);
    
    return { deleted: deletedCount, filesDeleted };
  } catch (error) {
    console.error(`[deleteCaptionsByVideoId] Error deleting captions for video ${videoId}:`, error);
    throw error;
  }
}





