import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateSubtitles } from '../controllers/subtitleController.js';
import { ensureDirectoryExists } from '../utils/fileUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Temporary upload directory for subtitle generation
const tempSubtitleUploads = path.join(__dirname, '../../temp-subtitles');
ensureDirectoryExists(tempSubtitleUploads).catch(() => {});

// Multer configuration for video upload
const upload = multer({
  dest: tempSubtitleUploads,
  limits: {
    fileSize: 2 * 1024 * 1024 * 1024 // 2GB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept video files
    const allowedMimes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/quicktime',
      'video/x-msvideo',
      'video/x-matroska'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'), false);
    }
  }
});

/**
 * POST /api/subtitles/generate
 * Generate subtitles from uploaded video using Whisper.cpp
 */
router.post('/generate', upload.single('video'), generateSubtitles);

export default router;

