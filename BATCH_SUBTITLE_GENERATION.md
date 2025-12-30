# Batch Subtitle Generation Guide

Complete guide for automatically generating subtitles for all videos in your upload folder.

## 📋 Overview

This script automatically processes all `.mp4` videos in the `backend/upload` folder and generates WebVTT subtitle files using FFmpeg and OpenAI Whisper (local, offline).

## 🎯 Features

- ✅ Scans upload folder for all `.mp4` videos
- ✅ Extracts audio using FFmpeg
- ✅ Transcribes using OpenAI Whisper (local, free)
- ✅ Generates WebVTT subtitle files
- ✅ Saves to `backend/subtitles` folder
- ✅ Cleans up temporary files automatically
- ✅ Detailed progress logging
- ✅ Skip existing subtitles option
- ✅ Works completely offline

## 📦 Prerequisites

Before running the script, ensure you have:

1. **FFmpeg** installed and in PATH
2. **Python 3.8+** installed
3. **OpenAI Whisper** installed: `pip install openai-whisper`

See `SUBTITLE_GENERATION_GUIDE.md` for detailed installation instructions.

## 🚀 Quick Start

### Basic Usage

Generate subtitles for all videos in the upload folder:

```bash
cd backend
npm run generate-all-subtitles
```

Or directly:

```bash
node scripts/generateSubtitlesForAllVideos.js
```

### With Options

```bash
# Use a different Whisper model (faster but less accurate)
node scripts/generateSubtitlesForAllVideos.js --model tiny

# Use a better model (slower but more accurate)
node scripts/generateSubtitlesForAllVideos.js --model small

# Specify language (faster than auto-detect)
node scripts/generateSubtitlesForAllVideos.js --language en

# Skip videos that already have subtitles
node scripts/generateSubtitlesForAllVideos.js --skip-existing

# All options together
node scripts/generateSubtitlesForAllVideos.js --model small --language en --skip-existing
```

## 📁 Folder Structure

```
backend/
├── upload/              # Input: Place your .mp4 videos here
│   ├── video1.mp4
│   ├── video2.mp4
│   └── ...
├── subtitles/          # Output: Generated .vtt files saved here
│   ├── video1.vtt
│   ├── video2.vtt
│   └── ...
└── scripts/
    └── generateSubtitlesForAllVideos.js
```

## 🎛️ Options

### `--model, -m`
Whisper model size (affects speed and accuracy):
- `tiny`: Fastest, least accurate (~39MB)
- `base`: Balanced (default, ~74MB) ⭐ Recommended
- `small`: Better accuracy (~244MB)
- `medium`: High accuracy (~769MB)
- `large`: Best accuracy (~1550MB)

**Example:**
```bash
node scripts/generateSubtitlesForAllVideos.js --model small
```

### `--language, -l`
Language code for transcription:
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `ja` - Japanese
- And many more...

If not specified, Whisper will auto-detect the language (slower).

**Example:**
```bash
node scripts/generateSubtitlesForAllVideos.js --language en
```

### `--skip-existing`
Skip videos that already have a corresponding `.vtt` file in the subtitles folder.

**Example:**
```bash
node scripts/generateSubtitlesForAllVideos.js --skip-existing
```

## 📝 Example Output

```
🚀 Starting batch subtitle generation...

============================================================
Configuration:
   Upload folder: C:\...\backend\upload
   Subtitles folder: C:\...\backend\subtitles
   Whisper model: base
   Language: auto-detect
   Skip existing: No
============================================================

🔍 Checking dependencies...
   ✅ FFmpeg is installed
   ✅ Whisper is installed

📂 Scanning for video files...
   ✅ Found 5 video file(s)

[1/5]
📹 Processing: lesson1.mp4
   Video: C:\...\backend\upload\lesson1.mp4
   🎵 Step 1/3: Extracting audio...
   ✅ Audio extracted
   🎤 Step 2/3: Transcribing audio (model: base, auto-detect)...
   ✅ Transcription completed
   📝 Step 3/3: Saving subtitle file...
   ✅ Subtitle saved: C:\...\backend\subtitles\lesson1.vtt
   ✨ Completed: lesson1.mp4

[2/5]
📹 Processing: lesson2.mp4
...

============================================================
📊 Summary:
   Total videos: 5
   ✅ Successful: 5
   ❌ Failed: 0
============================================================

✨ Subtitle generation completed!
   Subtitles saved to: C:\...\backend\subtitles
```

## 🔧 Troubleshooting

### No videos found
**Error**: `No .mp4 files found in upload folder`

**Solution:**
- Ensure videos are in `backend/upload/` folder
- Check file extensions are `.mp4` (case-insensitive)
- Verify folder path is correct

### FFmpeg not found
**Error**: `FFmpeg is not installed`

**Solution:**
1. Install FFmpeg: https://ffmpeg.org/download.html
2. Add to PATH environment variable
3. Restart terminal/command prompt
4. Verify: `ffmpeg -version`

### Whisper not found
**Error**: `Whisper is not installed`

**Solution:**
1. Install Python 3.8+
2. Install Whisper: `pip install openai-whisper`
3. Verify: `whisper --help`

### Out of memory
**Error**: Process runs out of memory

**Solution:**
- Use smaller model: `--model tiny` or `--model base`
- Process videos one at a time
- Close other applications

### Slow processing
**Solution:**
- Use smaller model (`tiny` or `base`)
- Specify language instead of auto-detect
- Process on machine with GPU (install `pip install openai-whisper[gpu]`)

### Permission errors
**Error**: Permission denied when writing files

**Solution:**
- Ensure write permissions in subtitles folder
- Run as administrator if needed (Windows)
- Check folder permissions

## 📊 Performance Tips

1. **Start with `base` model** - Good balance of speed and accuracy
2. **Specify language** - Faster than auto-detect
3. **Use `--skip-existing`** - Avoid reprocessing existing subtitles
4. **Process during off-hours** - Large models can be CPU-intensive
5. **GPU acceleration** - Install `pip install openai-whisper[gpu]` for faster processing

## 🔄 Workflow Example

1. **Place videos in upload folder:**
   ```
   backend/upload/
   ├── math-lesson-1.mp4
   ├── math-lesson-2.mp4
   └── science-intro.mp4
   ```

2. **Run the script:**
   ```bash
   npm run generate-all-subtitles
   ```

3. **Subtitles are generated:**
   ```
   backend/subtitles/
   ├── math-lesson-1.vtt
   ├── math-lesson-2.vtt
   └── science-intro.vtt
   ```

4. **Use subtitles in your video player:**
   ```html
   <video controls>
       <source src="math-lesson-1.mp4" type="video/mp4">
       <track src="math-lesson-1.vtt" kind="captions" srclang="en" label="English" default>
   </video>
   ```

## 🎓 Advanced Usage

### Process only new videos

```bash
# First run - processes all videos
node scripts/generateSubtitlesForAllVideos.js

# Later runs - only process new videos
node scripts/generateSubtitlesForAllVideos.js --skip-existing
```

### Batch process with different models

```bash
# Quick pass with tiny model
node scripts/generateSubtitlesForAllVideos.js --model tiny

# Then improve with better model for important videos
node scripts/generateSubtitlesForAllVideos.js --model small --skip-existing
```

### Process specific language

```bash
# All videos are in English
node scripts/generateSubtitlesForAllVideos.js --language en

# All videos are in Spanish
node scripts/generateSubtitlesForAllVideos.js --language es
```

## ✅ Checklist

Before running the script:
- [ ] FFmpeg is installed and in PATH
- [ ] Python 3.8+ is installed
- [ ] OpenAI Whisper is installed (`pip install openai-whisper`)
- [ ] Videos are in `backend/upload/` folder
- [ ] You have write permissions in `backend/subtitles/` folder
- [ ] At least 2GB free disk space (for Whisper models)

## 🎉 You're Ready!

Run the script and let it process all your videos automatically. The subtitles will be ready to use in your video player!

