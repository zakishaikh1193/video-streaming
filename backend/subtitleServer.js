// Standalone subtitle generation server using OpenAI Whisper
// Run with: OPENAI_API_KEY=your_key node subtitleServer.js

import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { OpenAI } from 'openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Ensure subtitles directory exists
const subtitlesDir = path.join(__dirname, 'subtitles');
if (!fs.existsSync(subtitlesDir)) fs.mkdirSync(subtitlesDir, { recursive: true });

// Multer in-memory storage (audio is forwarded to Whisper)
const upload = multer({ storage: multer.memoryStorage() });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Format milliseconds to VTT timestamp
function msToVtt(ts) {
  const ms = Math.floor(ts % 1000);
  const totalSec = Math.floor(ts / 1000);
  const s = totalSec % 60;
  const m = Math.floor(totalSec / 60) % 60;
  const h = Math.floor(totalSec / 3600);
  const pad = (n, z = 2) => String(n).padStart(z, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

// Build WebVTT content from Whisper segments
function buildVtt(segments) {
  let vtt = 'WEBVTT\n\n';
  segments.forEach((seg, idx) => {
    const start = msToVtt(seg.start * 1000);
    const end = msToVtt(seg.end * 1000);
    vtt += `${idx + 1}\n${start} --> ${end}\n${seg.text.trim()}\n\n`;
  });
  return vtt;
}

// POST /api/generate-subtitles : accepts audio file, returns VTT URL
app.post('/api/generate-subtitles', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Audio file is required' });

    const response = await openai.audio.transcriptions.create({
      file: new File([req.file.buffer], 'audio.webm', { type: 'audio/webm' }),
      model: 'whisper-1',
      response_format: 'verbose_json'
    });

    const segments = response.segments || [];
    if (!segments.length) return res.status(500).json({ error: 'No segments returned from Whisper' });

    const vttContent = buildVtt(segments);
    const vttName = `subs_${Date.now()}.vtt`;
    const vttPath = path.join(subtitlesDir, vttName);
    fs.writeFileSync(vttPath, vttContent, 'utf8');

    const vttUrl = `${req.protocol}://${req.get('host')}/subtitles/${vttName}`;
    res.json({ vttUrl });
  } catch (err) {
    console.error('Subtitle generation error:', err);
    res.status(500).json({ error: 'Failed to generate subtitles', details: err.message });
  }
});

// Serve saved subtitles
app.use('/subtitles', express.static(subtitlesDir));

const PORT = process.env.SUBTITLE_PORT || 4000;
app.listen(PORT, () => {
  console.log(`Subtitle server running on http://localhost:${PORT}`);
});


