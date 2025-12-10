import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureDirectoryExists } from '../utils/fileUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths configuration
const SUBTITLES_DIR = path.join(__dirname, '../../public/subtitles');
const TEMP_DIR = path.join(__dirname, '../../temp-subtitles');
const WHISPER_BIN = process.platform === 'win32' 
  ? path.join(__dirname, '../../whisper.cpp/bin/whisper.exe')
  : path.join(__dirname, '../../whisper.cpp/bin/whisper');
const WHISPER_MODEL = path.join(__dirname, '../../whisper.cpp/models/ggml-base.en.bin');

// Ensure directories exist
ensureDirectoryExists(SUBTITLES_DIR).catch(() => {});
ensureDirectoryExists(TEMP_DIR).catch(() => {});

/**
 * Run a command and return promise with stdout/stderr
 */
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, {
      ...options,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
      }
    });
    
    proc.on('error', (err) => {
      reject(new Error(`Failed to start process: ${err.message}`));
    });
  });
}

/**
 * Convert seconds to WebVTT timestamp format (HH:MM:SS.mmm)
 */
function secondsToVTTTimestamp(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const wholeSecs = Math.floor(secs);
  const millis = Math.floor((secs - wholeSecs) * 1000);
  
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(wholeSecs).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

/**
 * Convert Whisper.cpp output to WebVTT format
 */
function convertWhisperToVTT(whisperOutput, vttPath) {
  const lines = whisperOutput.split('\n').filter(line => line.trim());
  
  let vttContent = 'WEBVTT\n\n';
  
  // Parse Whisper output (format: [start] --> [end]  text)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Try to match timestamp patterns
    // Whisper.cpp output format varies, but typically: [00:00:00.000 --> 00:00:05.000] text
    const timestampMatch = line.match(/\[(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})\]/);
    
    if (timestampMatch) {
      const startTime = `${timestampMatch[1]}:${timestampMatch[2]}:${timestampMatch[3]}.${timestampMatch[4]}`;
      const endTime = `${timestampMatch[5]}:${timestampMatch[6]}:${timestampMatch[7]}.${timestampMatch[8]}`;
      const text = line.replace(/\[.*?\]/, '').trim();
      
      if (text) {
        vttContent += `${startTime} --> ${endTime}\n${text}\n\n`;
      }
    } else {
      // Alternative: try to parse as simple text with timestamps
      // Some Whisper outputs use format: [HH:MM:SS.mmm] text
      const simpleMatch = line.match(/\[(\d{2}):(\d{2}):(\d{2})\.(\d{3})\]\s*(.+)/);
      if (simpleMatch && i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        const endMatch = nextLine.match(/\[(\d{2}):(\d{2}):(\d{2})\.(\d{3})\]/);
        
        if (endMatch) {
          const startTime = `${simpleMatch[1]}:${simpleMatch[2]}:${simpleMatch[3]}.${simpleMatch[4]}`;
          const endTime = `${endMatch[1]}:${endMatch[2]}:${endMatch[3]}.${endMatch[4]}`;
          const text = simpleMatch[5].trim();
          
          if (text) {
            vttContent += `${startTime} --> ${endTime}\n${text}\n\n`;
          }
          i++; // Skip next line as we used it
        }
      }
    }
  }
  
  // If no timestamps found, try to parse as plain text with timestamps in seconds
  if (vttContent === 'WEBVTT\n\n' && lines.length > 0) {
    // Fallback: create simple segments (10 seconds each)
    let currentTime = 0;
    const segmentDuration = 10; // 10 seconds per segment
    
    for (const line of lines) {
      const text = line.trim();
      if (text && !text.match(/^\d+:\d+:\d+/)) {
        const startTime = secondsToVTTTimestamp(currentTime);
        const endTime = secondsToVTTTimestamp(currentTime + segmentDuration);
        vttContent += `${startTime} --> ${endTime}\n${text}\n\n`;
        currentTime += segmentDuration;
      }
    }
  }
  
  fs.writeFileSync(vttPath, vttContent, 'utf8');
  return vttContent;
}

/**
 * Generate subtitles from video file
 */
export async function generateSubtitles(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const inputVideo = req.file.path;
    const baseName = path.parse(req.file.originalname).name.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = Date.now();
    
    // Paths for temporary files
    const audioPath = path.join(TEMP_DIR, `${baseName}-${timestamp}.wav`);
    const whisperOutputPath = path.join(TEMP_DIR, `${baseName}-${timestamp}.txt`);
    const vttFileName = `${baseName}-${timestamp}.vtt`;
    const vttPath = path.join(SUBTITLES_DIR, vttFileName);

    console.log('[Subtitle] Starting subtitle generation...');
    console.log('[Subtitle] Input video:', inputVideo);
    console.log('[Subtitle] Audio output:', audioPath);
    console.log('[Subtitle] VTT output:', vttPath);

    // Step 1: Extract audio using ffmpeg
    console.log('[Subtitle] Step 1: Extracting audio with ffmpeg...');
    try {
      await runCommand('ffmpeg', [
        '-y', // Overwrite output file
        '-i', inputVideo,
        '-ar', '16000', // Sample rate: 16kHz (required by Whisper)
        '-ac', '1', // Mono channel
        '-f', 'wav', // WAV format
        audioPath
      ]);
      console.log('[Subtitle] Audio extraction successful');
    } catch (error) {
      console.error('[Subtitle] FFmpeg error:', error);
      // Cleanup
      if (fs.existsSync(inputVideo)) fs.unlinkSync(inputVideo);
      return res.status(500).json({ 
        error: 'Audio extraction failed', 
        details: error.message,
        hint: 'Make sure ffmpeg is installed and in your PATH'
      });
    }

    // Step 2: Check if Whisper binary exists
    if (!fs.existsSync(WHISPER_BIN)) {
      console.error('[Subtitle] Whisper binary not found:', WHISPER_BIN);
      // Cleanup
      if (fs.existsSync(inputVideo)) fs.unlinkSync(inputVideo);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      return res.status(500).json({ 
        error: 'Whisper.cpp binary not found',
        details: `Expected at: ${WHISPER_BIN}`,
        hint: 'Please install Whisper.cpp and build the binary. See instructions in SUBTITLE_SETUP.md'
      });
    }

    // Step 3: Check if model exists
    if (!fs.existsSync(WHISPER_MODEL)) {
      console.error('[Subtitle] Whisper model not found:', WHISPER_MODEL);
      // Cleanup
      if (fs.existsSync(inputVideo)) fs.unlinkSync(inputVideo);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      return res.status(500).json({ 
        error: 'Whisper model not found',
        details: `Expected at: ${WHISPER_MODEL}`,
        hint: 'Please download the ggml-base.en.bin model. See instructions in SUBTITLE_SETUP.md'
      });
    }

    // Step 4: Run Whisper.cpp to generate transcription
    console.log('[Subtitle] Step 2: Running Whisper.cpp...');
    try {
      const whisperArgs = [
        '-m', WHISPER_MODEL,
        '-f', audioPath,
        '-otxt', // Output as text
        '-ovtt', // Output as VTT
        '-of', whisperOutputPath.replace('.txt', '') // Output filename (without extension)
      ];

      await runCommand(WHISPER_BIN, whisperArgs, {
        cwd: path.dirname(WHISPER_BIN)
      });
      console.log('[Subtitle] Whisper.cpp processing successful');
    } catch (error) {
      console.error('[Subtitle] Whisper.cpp error:', error);
      // Cleanup
      if (fs.existsSync(inputVideo)) fs.unlinkSync(inputVideo);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      return res.status(500).json({ 
        error: 'Subtitle generation failed', 
        details: error.message,
        hint: 'Check Whisper.cpp installation and model file'
      });
    }

    // Step 5: Check if VTT file was generated by Whisper
    const whisperVttPath = whisperOutputPath.replace('.txt', '.vtt');
    let finalVttPath = vttPath;

    if (fs.existsSync(whisperVttPath)) {
      // Whisper generated VTT directly - copy it to public folder
      console.log('[Subtitle] Whisper generated VTT file found, copying...');
      fs.copyFileSync(whisperVttPath, vttPath);
      console.log('[Subtitle] VTT file copied to public folder');
    } else if (fs.existsSync(whisperOutputPath)) {
      // Whisper generated text file - convert to VTT
      console.log('[Subtitle] Converting Whisper text output to VTT...');
      const whisperText = fs.readFileSync(whisperOutputPath, 'utf8');
      convertWhisperToVTT(whisperText, vttPath);
      console.log('[Subtitle] VTT conversion complete');
    } else {
      // Fallback: try to find any output file
      const possibleOutputs = [
        whisperOutputPath.replace('.txt', '.vtt'),
        whisperOutputPath,
        path.join(TEMP_DIR, `${baseName}-${timestamp}.vtt`),
        path.join(TEMP_DIR, `${baseName}-${timestamp}.txt`)
      ];

      let found = false;
      for (const possiblePath of possibleOutputs) {
        if (fs.existsSync(possiblePath)) {
          if (possiblePath.endsWith('.vtt')) {
            fs.copyFileSync(possiblePath, vttPath);
          } else {
            const text = fs.readFileSync(possiblePath, 'utf8');
            convertWhisperToVTT(text, vttPath);
          }
          found = true;
          break;
        }
      }

      if (!found) {
        throw new Error('Whisper.cpp did not generate any output file');
      }
    }

    // Step 6: Verify VTT file exists and is valid
    if (!fs.existsSync(vttPath)) {
      throw new Error('VTT file was not created');
    }

    const vttStats = fs.statSync(vttPath);
    if (vttStats.size === 0) {
      throw new Error('VTT file is empty');
    }

    // Step 7: Cleanup temporary files
    try {
      if (fs.existsSync(inputVideo)) fs.unlinkSync(inputVideo);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      if (fs.existsSync(whisperOutputPath)) fs.unlinkSync(whisperOutputPath);
      if (fs.existsSync(whisperVttPath)) fs.unlinkSync(whisperVttPath);
      // Clean up any other temp files
      const tempFiles = fs.readdirSync(TEMP_DIR).filter(f => f.includes(`${baseName}-${timestamp}`));
      tempFiles.forEach(f => {
        try {
          fs.unlinkSync(path.join(TEMP_DIR, f));
        } catch (e) {
          console.warn('[Subtitle] Could not delete temp file:', f);
        }
      });
    } catch (cleanupError) {
      console.warn('[Subtitle] Cleanup warning:', cleanupError.message);
    }

    // Step 8: Return public URL for VTT file
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const vttUrl = `${backendUrl}/subtitles/${vttFileName}`;

    console.log('[Subtitle] Subtitle generation complete!');
    console.log('[Subtitle] VTT URL:', vttUrl);

    res.json({
      success: true,
      vttUrl: vttUrl,
      message: 'Subtitles generated successfully'
    });

  } catch (error) {
    console.error('[Subtitle] Error:', error);
    res.status(500).json({
      error: 'Subtitle generation failed',
      details: error.message
    });
  }
}

