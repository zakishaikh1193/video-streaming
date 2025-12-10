import pool from '../config/database.js';
import { generateVideoId, generateVideoPath } from '../utils/videoIdGenerator.js';
import { getVideoFilePath, ensureDirectoryExists, getFileSize } from '../utils/fileUtils.js';
import { generateQRCode } from './qrCodeService.js';
import config from '../config/config.js';
import { getBaseUrl } from '../utils/urlHelper.js';

/**
 * Create video entry in database
 */
export async function createVideo(videoData) {
  const {
    videoId,
    partnerId,
    title,
    subject,
    grade,
    unit,
    lesson,
    module,
    activity,
    topic,
    description,
    language,
    filePath,
    streamingUrl,
    qrUrl,
    thumbnailUrl,
    redirectSlug,
    duration,
    size,
    version = 1,
    status = 'active'
  } = videoData;
  
  // Try with all new columns first, fallback to old schema if columns don't exist
  let query, params;
  
  try {
    // Try with new schema (partner_id, subject, unit, module, activity, thumbnail_url)
    // First try with unit column
    try {
      query = `
        INSERT INTO videos (
          video_id, partner_id, title, subject, grade, unit, lesson, module, activity, topic, description, language,
          file_path, streaming_url, qr_url, thumbnail_url, redirect_slug, duration, size, version, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      params = [
        videoId, 
        partnerId || null, 
        title || 'Untitled Video', 
        subject || null, 
        grade || null, 
        unit || null,
        lesson || null, 
        module || null, 
        activity || null, 
        topic || null, 
        description || '', 
        language || 'en',
        filePath || null, 
        streamingUrl || null, 
        qrUrl || null, 
        thumbnailUrl || null, 
        redirectSlug || null, 
        duration || 0, 
        size || 0, 
        version || 1, 
        status || 'active'
      ];
      
      const [result] = await pool.execute(query, params);
      return result.insertId;
    } catch (unitError) {
      // If unit column doesn't exist, try to add it first, then retry
      if (unitError.code === 'ER_BAD_FIELD_ERROR') {
        console.log('[createVideo] Unit column not found, attempting to add it...');
        try {
          // Try to add unit column if it doesn't exist
          await pool.execute('ALTER TABLE videos ADD COLUMN unit VARCHAR(255) NULL AFTER grade');
          console.log('[createVideo] Unit column added successfully, retrying insert...');
          // Retry the original insert
          const [result] = await pool.execute(query, params);
          return result.insertId;
        } catch (alterError) {
          console.error('[createVideo] Failed to add unit column:', alterError.message);
          // If we can't add the column, fall back to storing without unit
          console.log('[createVideo] Falling back to insert without unit column');
          query = `
            INSERT INTO videos (
              video_id, partner_id, title, subject, grade, lesson, module, activity, topic, description, language,
              file_path, streaming_url, qr_url, thumbnail_url, redirect_slug, duration, size, version, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          params = [
            videoId, 
            partnerId || null, 
            title || 'Untitled Video', 
            subject || null, // Keep subject separate, don't mix with unit
            grade || null, 
            lesson || null, 
            module || null, 
            activity || null, 
            topic || null, 
            description || '', 
            language || 'en',
            filePath || null, 
            streamingUrl || null, 
            qrUrl || null, 
            thumbnailUrl || null, 
            redirectSlug || null, 
            duration || 0, 
            size || 0, 
            version || 1, 
            status || 'active'
          ];
          
          const [result] = await pool.execute(query, params);
          return result.insertId;
        }
      }
      throw unitError;
    }
  } catch (error) {
    // If new columns don't exist, try with old schema
    if (error.code === 'ER_BAD_FIELD_ERROR') {
      console.warn('New columns not found, using old schema. Please run database migrations.');
      
      // Fallback to old schema (without subject, module, activity, thumbnail_url)
      // Map subject/grade/lesson to old grade/unit/lesson structure
      query = `
        INSERT INTO videos (
          video_id, title, grade, unit, lesson, topic, description, language,
          file_path, streaming_url, qr_url, redirect_slug, duration, size, version, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      // Try to extract numeric values from text fields
      const gradeNum = grade ? parseInt(grade.toString().replace(/\D/g, '')) || null : null;
      const unitNum = subject ? parseInt(subject.toString().replace(/\D/g, '')) || null : null;
      const lessonNum = lesson ? parseInt(lesson.toString().replace(/\D/g, '')) || null : null;
      
      params = [
        videoId, title || 'Untitled Video', gradeNum || 0, unitNum || 0, lessonNum || 0, topic || '', 
        description || '', language || 'en',
        filePath, streamingUrl, qrUrl, redirectSlug, duration || 0, size || 0, version, status
      ];
      
      const [result] = await pool.execute(query, params);
      return result.insertId;
    }
    throw error;
  }
}

/**
 * Get video by ID
 * @param {string} videoId - The video_id to search for
 * @param {boolean} includeInactive - If true, also return inactive videos
 */
export async function getVideoByVideoId(videoId, includeInactive = false) {
  let query = 'SELECT * FROM videos WHERE video_id = ?';
  if (!includeInactive) {
    query += ' AND status = "active"';
  }
  query += ' ORDER BY version DESC LIMIT 1';
  const [rows] = await pool.execute(query, [videoId]);
  return rows[0] || null;
}

/**
 * Get video by database ID
 */
export async function getVideoById(id) {
  const query = 'SELECT * FROM videos WHERE id = ?';
  const [rows] = await pool.execute(query, [id]);
  const video = rows[0] || null;
  
  // Log to verify subject information is being retrieved
  if (video) {
    console.log('[getVideoById] Retrieved video subject info:', {
      id: video.id,
      video_id: video.video_id,
      subject: video.subject,
      grade: video.grade,
      unit: video.unit,
      lesson: video.lesson,
      module: video.module,
      description: video.description
    });
  }
  
  return video;
}

/**
 * Check if a video with the same file path or streaming URL already exists
 * This prevents duplicate uploads of the same video resource
 */
export async function findVideoByFileOrUrl(filePath, streamingUrl) {
  try {
    // Check by streaming_url first (most reliable for Cloudflare URLs)
    if (streamingUrl && streamingUrl.trim() !== '') {
      const [urlRows] = await pool.execute(
        'SELECT * FROM videos WHERE streaming_url = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
        [streamingUrl]
      );
      if (urlRows.length > 0) {
        return urlRows[0];
      }
    }
    
    // Check by file_path (for local files)
    if (filePath && filePath.trim() !== '') {
      const [pathRows] = await pool.execute(
        'SELECT * FROM videos WHERE file_path = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
        [filePath]
      );
      if (pathRows.length > 0) {
        return pathRows[0];
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error checking for duplicate video:', error);
    return null;
  }
}

/**
 * Check if a video with the same title already exists
 * @param {string} title - The title to check
 * @param {boolean} includeInactive - If true, also check inactive videos
 */
export async function getVideoByTitle(title, includeInactive = false) {
  if (!title || title.trim() === '') {
    return null;
  }
  
  let query = 'SELECT * FROM videos WHERE title = ?';
  if (!includeInactive) {
    query += ' AND status = "active"';
  }
  query += ' ORDER BY created_at DESC LIMIT 1';
  
  try {
    const [rows] = await pool.execute(query, [title.trim()]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error checking for duplicate title:', error);
    return null;
  }
}

/**
 * Get video by redirect slug (short URL)
 */
export async function getVideoByRedirectSlug(redirectSlug, includeInactive = false) {
  let query = 'SELECT * FROM videos WHERE redirect_slug = ?';
  if (!includeInactive) {
    query += ' AND status = "active"';
  }
  query += ' ORDER BY version DESC LIMIT 1';
  const [rows] = await pool.execute(query, [redirectSlug]);
  return rows[0] || null;
}

/**
 * Get all videos with filters
 */
export async function getAllVideos(filters = {}) {
  let query = 'SELECT * FROM videos WHERE 1=1';
  const params = [];
  
  // Search filter - searches in title, description, video_id, subject, grade, lesson, module, activity, topic
  if (filters.search) {
    query += ` AND (
      title LIKE ? OR 
      description LIKE ? OR 
      video_id LIKE ? OR 
      subject LIKE ? OR 
      grade LIKE ? OR 
      lesson LIKE ? OR 
      module LIKE ? OR 
      activity LIKE ? OR 
      topic LIKE ?
    )`;
    const searchTerm = `%${filters.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }
  
  if (filters.subject) {
    query += ' AND subject = ?';
    params.push(filters.subject);
  }
  
  // Support legacy 'course' filter for backward compatibility
  if (filters.course) {
    query += ' AND subject = ?';
    params.push(filters.course);
  }
  
  if (filters.grade) {
    query += ' AND grade = ?';
    params.push(filters.grade);
  }
  
  if (filters.lesson) {
    query += ' AND lesson = ?';
    params.push(filters.lesson);
  }
  
  if (filters.module) {
    query += ' AND module = ?';
    params.push(filters.module);
  }
  
  // Filter by module number (extract numeric part from module field)
  if (filters.moduleNumber) {
    // Extract number from module field and match
    // This handles cases like "Module 1", "1", "M1", "Module1", etc.
    const moduleNum = parseInt(filters.moduleNumber);
    if (!isNaN(moduleNum)) {
      // Match if module contains the number (handles "Module 1", "1", "M1", etc.)
      query += ' AND (module LIKE ? OR module LIKE ? OR module LIKE ? OR module = ?)';
      params.push(`%${moduleNum}%`, `%Module ${moduleNum}%`, `%M${moduleNum}%`, filters.moduleNumber);
    } else {
      // If not a number, just do a text search
      query += ' AND module LIKE ?';
      params.push(`%${filters.moduleNumber}%`);
    }
  }
  
  if (filters.activity) {
    query += ' AND activity = ?';
    params.push(filters.activity);
  }
  
  if (filters.unit) {
    query += ' AND unit = ?';
    params.push(filters.unit);
  }
  
  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  
  // Don't filter by file_path - include all videos regardless of storage location
  // This ensures videos in upload/, my-storage/, and other locations are all shown
  query += ' ORDER BY created_at DESC';
  
  console.log('[getAllVideos] Query:', query);
  console.log('[getAllVideos] Params:', params);
  
  const [rows] = await pool.execute(query, params);
  
  console.log(`[getAllVideos] Found ${rows.length} videos`);
  
  // Log subject information to verify it's being returned - show all fields including nulls
  if (rows.length > 0) {
    const sampleVideo = rows[0];
    console.log('[getAllVideos] Sample video subject info from database (all fields):', {
      id: sampleVideo.id,
      video_id: sampleVideo.video_id,
      title: sampleVideo.title,
      subject: sampleVideo.subject,
      grade: sampleVideo.grade,
      unit: sampleVideo.unit,
      lesson: sampleVideo.lesson,
      module: sampleVideo.module,
      description: sampleVideo.description,
      status: sampleVideo.status,
      // Show raw database values
      subjectType: typeof sampleVideo.subject,
      gradeType: typeof sampleVideo.grade,
      unitType: typeof sampleVideo.unit,
      lessonType: typeof sampleVideo.lesson,
      moduleType: typeof sampleVideo.module
    });
    
    // Log all column names to verify all fields are being selected
    if (rows.length > 0) {
      console.log('[getAllVideos] Available columns in result:', Object.keys(rows[0]));
    }
  }
  
  // Log file paths to verify upload/ videos are included
  if (rows.length > 0) {
    const uploadVideos = rows.filter(v => v.file_path && v.file_path.startsWith('upload/'));
    console.log(`[getAllVideos] Videos in upload/ folder: ${uploadVideos.length}`);
    if (uploadVideos.length > 0) {
      console.log('[getAllVideos] Upload videos:', uploadVideos.map(v => ({ id: v.id, video_id: v.video_id, file_path: v.file_path, status: v.status })));
    }
  }
  
  // Ensure all fields are returned, even if null - SELECT * should already do this
  // But we'll explicitly map to ensure consistency
  return rows.map(video => ({
    ...video,
    // Explicitly include all subject information fields, preserving null values
    subject: video.subject !== undefined ? video.subject : null,
    grade: video.grade !== undefined ? video.grade : null,
    unit: video.unit !== undefined ? video.unit : null,
    lesson: video.lesson !== undefined ? video.lesson : null,
    module: video.module !== undefined ? video.module : null,
    description: video.description !== undefined ? video.description : null
  }));
}

/**
 * Get unique filter values for dropdowns
 */
export async function getFilterValues() {
  try {
    // Try to get unit column, fallback if it doesn't exist
    let unitsQuery = 'SELECT DISTINCT unit FROM videos WHERE unit IS NOT NULL AND unit != "" ORDER BY unit ASC';
    let units = [];
    try {
      const [unitsRows] = await pool.execute(unitsQuery);
      units = unitsRows.map(row => row.unit).filter(Boolean);
    } catch (unitError) {
      console.log('[getFilterValues] Unit column not found, skipping');
    }

    const queries = {
      subjects: 'SELECT DISTINCT subject FROM videos WHERE subject IS NOT NULL AND subject != "" ORDER BY subject ASC',
      grades: 'SELECT DISTINCT grade FROM videos WHERE grade IS NOT NULL AND grade != "" ORDER BY grade ASC',
      lessons: 'SELECT DISTINCT lesson FROM videos WHERE lesson IS NOT NULL AND lesson != "" ORDER BY lesson ASC',
      modules: 'SELECT DISTINCT module FROM videos WHERE module IS NOT NULL AND module != "" ORDER BY module ASC'
    };

    const [subjects] = await pool.execute(queries.subjects);
    const [grades] = await pool.execute(queries.grades);
    const [lessons] = await pool.execute(queries.lessons);
    const [modules] = await pool.execute(queries.modules);

    return {
      subjects: subjects.map(row => row.subject).filter(Boolean),
      courses: subjects.map(row => row.subject).filter(Boolean), // Keep 'courses' for backward compatibility
      grades: grades.map(row => row.grade).filter(Boolean),
      units: units,
      lessons: lessons.map(row => row.lesson).filter(Boolean),
      modules: modules.map(row => row.module).filter(Boolean)
    };
  } catch (error) {
    console.error('Error fetching filter values:', error);
    // Return empty arrays if there's an error (e.g., column doesn't exist)
    return {
      courses: [],
      grades: [],
      units: [],
      lessons: [],
      modules: []
    };
  }
}

/**
 * Update video metadata
 */
export async function updateVideo(id, updates) {
  const allowedFields = [
    'title', 'description', 'language', 'status',
    'subject', 'course', 'grade', 'unit', 'lesson', 'module',
    'streaming_url', 'file_path', 'thumbnail_url'
  ];
  
  const fields = [];
  const values = [];
  
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key) && value !== undefined) {
      // Handle null values for optional fields
      if (value === '' || value === null) {
        fields.push(`${key} = NULL`);
      } else {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
  }
  
  if (fields.length === 0) {
    return null;
  }
  
  values.push(id);
  const query = `UPDATE videos SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
  
  const [result] = await pool.execute(query, values);
  return result.affectedRows > 0;
}

/**
 * Delete video (soft delete)
 */
export async function deleteVideo(id) {
  const query = 'UPDATE videos SET status = "deleted", updated_at = NOW() WHERE id = ?';
  const [result] = await pool.execute(query, [id]);
  return result.affectedRows > 0;
}

/**
 * Get latest version number for a video ID
 */
export async function getLatestVersion(videoId) {
  const query = 'SELECT MAX(version) as maxVersion FROM videos WHERE video_id = ?';
  const [rows] = await pool.execute(query, [videoId]);
  return (rows[0]?.maxVersion || 0) + 1;
}

/**
 * Create video version entry
 */
export async function createVideoVersion(videoId, version, filePath, size) {
  const query = `
    INSERT INTO video_versions (video_id, version, file_path, size, created_at)
    VALUES (?, ?, ?, ?, NOW())
  `;
  
  const [result] = await pool.execute(query, [videoId, version, filePath, size]);
  return result.insertId;
}

/**
 * Get all versions for a video ID
 */
export async function getVideoVersions(videoId) {
  const query = 'SELECT * FROM video_versions WHERE video_id = ? ORDER BY version DESC';
  const [rows] = await pool.execute(query, [videoId]);
  return rows;
}

/**
 * Build streaming URL - Always use localhost for local streaming
 * This ensures videos are streamed from localhost instead of Cloudflare URLs
 * @param {string} relativePath - Relative path to the video file
 * @param {string|null} videoId - Video ID
 * @param {string|null} redirectSlug - Redirect slug for short URLs
 * @param {Object|null} req - Express request object (optional, for detecting protocol)
 */
export function buildStreamingUrl(relativePath, videoId = null, redirectSlug = null, req = null) {
  const baseUrl = getBaseUrl(req);
  
  // Always use localhost streaming endpoint for proper range request support
  // Use redirect_slug if available (for short URLs like /api/s/:slug), otherwise use videoId
  if (redirectSlug) {
    return `${baseUrl}/api/s/${redirectSlug}`;
  }
  if (videoId) {
    return `${baseUrl}/api/videos/${videoId}/stream`;
  }
  // Fallback to static file serving if no videoId provided
  return `${config.cdn.localBaseUrl}${relativePath}`;
}

