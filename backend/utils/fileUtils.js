import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ensure directory exists, create if not
 */
export async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Get full path to video storage directory
 */
export function getVideoStoragePath() {
  const configPath = path.join(__dirname, '../config/config.js');
  // For now, use relative path from backend to video-storage
  return path.join(__dirname, '../../video-storage');
}

/**
 * Get video file path
 */
export function getVideoFilePath(grade, unit, lesson, videoId, version = 1, quality = 'master') {
  const storagePath = getVideoStoragePath();
  const folderPath = path.join(
    storagePath,
    String(grade).padStart(2, '0'),
    `U${String(unit).padStart(2, '0')}`,
    `L${String(lesson).padStart(2, '0')}`
  );
  
  const versionStr = version > 1 ? `_v${String(version).padStart(2, '0')}` : '';
  const filename = `${videoId}${versionStr}_${quality}.mp4`;
  
  return path.join(folderPath, filename);
}

/**
 * Check if file exists
 */
export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file size in bytes
 */
export async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * Get video duration in seconds using ffprobe
 */
export async function getVideoDuration(videoPath) {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    // Use ffprobe to get duration (more reliable than ffmpeg)
    // -v error: Only show errors
    // -show_entries format=duration: Get duration from format
    // -of default=noprint_wrappers=1:nokey=1: Output only the value
    const command = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
    
    try {
      const { stdout } = await execAsync(command);
      const duration = parseFloat(stdout.trim());
      
      if (isNaN(duration) || duration <= 0) {
        console.warn(`[getVideoDuration] Invalid duration extracted: ${stdout.trim()}`);
        return 0;
      }
      
      // Round to nearest integer (duration in seconds)
      return Math.round(duration);
    } catch (error) {
      console.error(`[getVideoDuration] FFprobe error for ${videoPath}:`, error.message);
      return 0;
    }
  } catch (error) {
    console.error(`[getVideoDuration] Error getting video duration:`, error.message);
    return 0;
  }
}





