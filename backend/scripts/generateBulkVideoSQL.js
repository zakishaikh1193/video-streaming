import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate a unique video ID in format VID_XXXXXXXXXX
 */
function generateVideoId() {
  const randomBytes = crypto.randomBytes(5);
  const base36 = randomBytes.toString('base64')
    .replace(/[^A-Z0-9]/g, '')
    .substring(0, 10)
    .toUpperCase();
  return `VID_${base36}`;
}

/**
 * Generate a unique redirect slug (10 characters)
 */
function generateRedirectSlug() {
  const randomBytes = crypto.randomBytes(6);
  const base36 = randomBytes.toString('base64')
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 6)
    .toLowerCase();
  const timestamp = Date.now().toString(36).slice(-4);
  return (base36 + timestamp).substring(0, 10);
}

/**
 * Extract grade from Level1 (e.g., "Grade 10" -> "10", "Grade 6" -> "6")
 */
function extractGrade(level1) {
  if (!level1) return null;
  const match = level1.match(/Grade\s+(\d+)/i);
  if (match) return match[1];
  // Try to extract number directly
  const numMatch = level1.match(/(\d+)/);
  return numMatch ? numMatch[1] : null;
}

/**
 * Extract unit from Level2 (e.g., "U1" -> "1", "Unit 1" -> "1", "Unit 2" -> "2")
 */
function extractUnit(level2) {
  if (!level2) return null;
  // Remove "Unit" prefix and spaces, extract number
  const cleaned = level2.replace(/Unit\s*/i, '').trim();
  const match = cleaned.match(/U?(\d+)/i);
  return match ? match[1] : null;
}

/**
 * Extract lesson from Level3 (e.g., "L1" -> "1", "L 2" -> "2")
 */
function extractLesson(level3) {
  if (!level3) return null;
  // Remove "L" prefix and spaces, extract number
  const cleaned = level3.replace(/L\s*/i, '').trim();
  const match = cleaned.match(/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Extract module from filename or Level4+ if available
 */
function extractModule(filename, level4) {
  // Try to extract from filename patterns like "G10_U1_L1_M2.mp4"
  const moduleMatch = filename.match(/[M_](\d+)/i);
  if (moduleMatch) return moduleMatch[1];
  
  // If Level4 has a number, use it
  if (level4) {
    const numMatch = level4.match(/(\d+)/);
    if (numMatch) return numMatch[1];
  }
  
  // Default to "1"
  return "1";
}

/**
 * Escape SQL string
 */
function escapeSQL(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

/**
 * Parse CSV file
 */
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
  
  const videos = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Parse CSV line (handling quoted fields)
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          current += '"';
          j++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Last value
    
    if (values.length < 4) continue; // Skip invalid lines
    
    const fileName = values[0]?.replace(/^"|"$/g, '') || '';
    const level1 = values[3]?.replace(/^"|"$/g, '') || '';
    const level2 = values[4]?.replace(/^"|"$/g, '') || '';
    const level3 = values[5]?.replace(/^"|"$/g, '') || '';
    const level4 = values[6]?.replace(/^"|"$/g, '') || '';
    
    if (!fileName) continue;
    
    videos.push({
      fileName,
      level1,
      level2,
      level3,
      level4
    });
  }
  
  return videos;
}

/**
 * Generate SQL dump
 */
async function generateSQLDump() {
  try {
    // Get CSV file path from command line argument or use default
    const csvPathArg = process.argv[2];
    let csvPath;
    
    if (csvPathArg) {
      csvPath = path.isAbsolute(csvPathArg) ? csvPathArg : path.join(process.cwd(), csvPathArg);
    } else {
      // Try common locations
      const possiblePaths = [
        path.join(__dirname, '../../ICTVideosList.csv'),
        path.join(process.cwd(), 'ICTVideosList.csv'),
        'y:/Standard ICT/Digital Assets/ICTVideosList.csv',
        path.join(__dirname, '../../../ICTVideosList.csv')
      ];
      
      csvPath = possiblePaths.find(p => {
        try {
          if (fs.existsSync(p)) return true;
        } catch (e) {}
        return false;
      });
      
      if (!csvPath) {
        console.error('CSV file not found. Please provide the path as an argument:');
        console.error('  node generateBulkVideoSQL.js "path/to/ICTVideosList.csv"');
        console.error('\nOr place ICTVideosList.csv in one of these locations:');
        possiblePaths.forEach(p => console.error(`  - ${p}`));
        process.exit(1);
      }
    }
    
    console.log(`Reading CSV file from: ${csvPath}`);
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    console.log('Parsing CSV file...');
    const videos = parseCSV(csvContent);
    console.log(`Found ${videos.length} videos to process`);
    
    // Track used IDs to ensure uniqueness
    const usedVideoIds = new Set();
    const usedRedirectSlugs = new Set();
    
    // Generate SQL
    const sqlLines = [];
    sqlLines.push('-- Bulk Video Import SQL Dump');
    sqlLines.push('-- Generated from ICTVideosList.csv');
    sqlLines.push(`-- Total videos: ${videos.length}`);
    sqlLines.push('');
    sqlLines.push('SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";');
    sqlLines.push('START TRANSACTION;');
    sqlLines.push('SET time_zone = "+00:00";');
    sqlLines.push('');
    sqlLines.push('/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;');
    sqlLines.push('/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;');
    sqlLines.push('/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;');
    sqlLines.push('/*!40101 SET NAMES utf8mb4 */;');
    sqlLines.push('');
    sqlLines.push('--');
    sqlLines.push('-- Database: `video_delivery`');
    sqlLines.push('--');
    sqlLines.push('');
    
    sqlLines.push('INSERT INTO `videos` (`video_id`, `partner_id`, `title`, `subject`, `course`, `grade`, `unit`, `lesson`, `module`, `topic`, `description`, `language`, `file_path`, `streaming_url`, `qr_url`, `thumbnail_url`, `redirect_slug`, `duration`, `size`, `version`, `status`, `created_by`, `created_at`, `updated_at`, `activity`, `views`) VALUES');
    
    const insertValues = [];
    
    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      const fileName = video.fileName;
      const fileNameWithoutExt = fileName.replace(/\.mp4$/i, '');
      
      // Generate unique video_id
      let videoId;
      do {
        videoId = generateVideoId();
      } while (usedVideoIds.has(videoId));
      usedVideoIds.add(videoId);
      
      // Generate unique redirect_slug
      let redirectSlug;
      do {
        redirectSlug = generateRedirectSlug();
      } while (usedRedirectSlugs.has(redirectSlug));
      usedRedirectSlugs.add(redirectSlug);
      
      // Extract metadata
      const grade = extractGrade(video.level1);
      const unit = extractUnit(video.level2);
      const lesson = extractLesson(video.level3);
      const module = extractModule(fileName, video.level4);
      
      // Build values
      const values = [
        escapeSQL(videoId),                                    // video_id
        'NULL',                                                // partner_id
        escapeSQL(fileNameWithoutExt),                         // title
        escapeSQL('ICT'),                                      // subject
        'NULL',                                                // course
        escapeSQL(grade),                                      // grade
        escapeSQL(unit),                                       // unit
        escapeSQL(lesson),                                     // lesson
        escapeSQL(module),                                     // module
        'NULL',                                                // topic
        'NULL',                                                // description
        escapeSQL('en'),                                       // language
        escapeSQL(`upload/${fileName}`),                       // file_path
        escapeSQL(`http://localhost:5000/api/s/${redirectSlug}`), // streaming_url
        escapeSQL(`/qr-codes/${videoId}.png`),                 // qr_url
        'NULL',                                                // thumbnail_url
        escapeSQL(redirectSlug),                               // redirect_slug
        '0',                                                   // duration
        '0',                                                   // size
        '1',                                                   // version
        escapeSQL('active'),                                   // status
        '1',                                                   // created_by
        'CURRENT_TIMESTAMP',                                   // created_at
        'CURRENT_TIMESTAMP',                                   // updated_at
        'NULL',                                                // activity
        '0'                                                    // views
      ];
      
      insertValues.push(`(${values.join(', ')})`);
    }
    
    // Join all values with commas and newlines
    sqlLines.push(insertValues.join(',\n'));
    sqlLines.push(';');
    sqlLines.push('');
    sqlLines.push('COMMIT;');
    sqlLines.push('');
    sqlLines.push('/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;');
    sqlLines.push('/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;');
    sqlLines.push('/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;');
    
    // Write SQL file
    const outputPath = path.join(__dirname, '../../bulk_videos_import.sql');
    fs.writeFileSync(outputPath, sqlLines.join('\n'), 'utf-8');
    
    console.log(`\n✓ SQL dump generated successfully!`);
    console.log(`  Output file: ${outputPath}`);
    console.log(`  Total videos: ${videos.length}`);
    console.log(`\nNext steps:`);
    console.log(`1. Review the SQL file: ${outputPath}`);
    console.log(`2. Make sure video files are in backend/upload/ folder`);
    console.log(`3. Make sure QR code images are in qr-codes/ folder`);
    console.log(`4. Import the SQL file into your database`);
    
  } catch (error) {
    console.error('Error generating SQL dump:', error);
    process.exit(1);
  }
}

// Run the script
generateSQLDump();

