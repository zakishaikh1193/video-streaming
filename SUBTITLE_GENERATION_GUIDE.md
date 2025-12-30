# Offline Subtitle Generation Guide

Complete guide for generating subtitles (closed captions) for HTML5 video players using **FFmpeg** and **OpenAI Whisper** - completely free and offline.

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Usage](#usage)
5. [Integration with HTML5 Video Player](#integration-with-html5-video-player)
6. [Troubleshooting](#troubleshooting)

## 🎯 Overview

This solution uses:
- **FFmpeg**: Extracts audio from video files
- **OpenAI Whisper**: Local speech-to-text transcription (open-source, not API)
- **Node.js**: Orchestrates the process
- **WebVTT**: Standard subtitle format for HTML5 video

**All tools are free, open-source, and work completely offline!**

## 📦 Prerequisites

Before starting, ensure you have:
- Node.js (v14 or higher)
- Python 3.8 or higher
- At least 2GB free disk space (for Whisper models)

## 🔧 Installation

### Step 1: Install FFmpeg

#### Windows:
1. Download FFmpeg from: https://www.gyan.dev/ffmpeg/builds/
2. Extract the ZIP file
3. Add FFmpeg to your PATH:
   - Copy the `bin` folder path (e.g., `C:\ffmpeg\bin`)
   - Open System Properties → Environment Variables
   - Add the path to `Path` variable
4. Verify installation:
   ```bash
   ffmpeg -version
   ```

#### macOS:
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install ffmpeg
```

### Step 2: Install Python

#### Windows:
1. Download Python from: https://www.python.org/downloads/
2. **Important**: Check "Add Python to PATH" during installation
3. Verify installation:
   ```bash
   python --version
   ```

#### macOS:
```bash
brew install python3
```

#### Linux:
```bash
sudo apt install python3 python3-pip
```

### Step 3: Install OpenAI Whisper

Open a terminal/command prompt and run:

```bash
pip install openai-whisper
```

**Note**: On some systems, you may need to use `pip3` instead of `pip`.

Verify installation:
```bash
whisper --help
```

### Step 4: Install Node.js Dependencies

The subtitle generation script uses only Node.js built-in modules, so no additional npm packages are required!

## 🚀 Usage

### Method 1: Command Line Script

Use the provided script directly:

```bash
# Basic usage (auto-detects language)
node backend/scripts/generateSubtitles.js path/to/video.mp4

# Specify output file
node backend/scripts/generateSubtitles.js video.mp4 -o subtitles.vtt

# Use a different Whisper model
node backend/scripts/generateSubtitles.js video.mp4 --model small

# Specify language
node backend/scripts/generateSubtitles.js video.mp4 --language en

# All options together
node backend/scripts/generateSubtitles.js video.mp4 -o output.vtt -m base -l en
```

#### Whisper Model Sizes:
- `tiny`: Fastest, least accurate (~39MB)
- `base`: Balanced (default, ~74MB)
- `small`: Better accuracy (~244MB)
- `medium`: High accuracy (~769MB)
- `large`: Best accuracy (~1550MB)

**Recommendation**: Start with `base` for speed, use `small` or `medium` for better accuracy.

### Method 2: Programmatic Usage

Use the utility function in your Node.js code:

```javascript
import { generateSubtitles } from './utils/subtitleGenerator.js';

// Basic usage
const vttPath = await generateSubtitles('path/to/video.mp4');

// With options
const vttPath = await generateSubtitles('path/to/video.mp4', {
  outputPath: 'custom-subtitles.vtt',
  model: 'small',
  language: 'en'
});

console.log('Subtitles generated at:', vttPath);
```

### Method 3: API Endpoint (Optional)

You can create an API endpoint to generate subtitles on-demand:

```javascript
// In your Express route
import { generateSubtitles } from '../utils/subtitleGenerator.js';

router.post('/api/videos/:id/generate-subtitles', async (req, res) => {
  try {
    const videoPath = getVideoPath(req.params.id);
    const vttPath = await generateSubtitles(videoPath, {
      model: req.body.model || 'base',
      language: req.body.language || null
    });
    
    res.json({ 
      success: true, 
      vttPath: vttPath 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

## 🎬 Integration with HTML5 Video Player

### Basic Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Player with Subtitles</title>
    <style>
        video {
            width: 100%;
            max-width: 800px;
            height: auto;
        }
        .video-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
    </style>
</head>
<body>
    <div class="video-container">
        <video controls>
            <source src="video.mp4" type="video/mp4">
            <!-- Add subtitle track -->
            <track 
                kind="captions" 
                src="video.vtt" 
                srclang="en" 
                label="English"
                default
            >
            Your browser does not support the video tag.
        </video>
    </div>
</body>
</html>
```

### Advanced Example with Multiple Languages

```html
<video controls>
    <source src="video.mp4" type="video/mp4">
    
    <!-- English subtitles (default) -->
    <track 
        kind="captions" 
        src="video.en.vtt" 
        srclang="en" 
        label="English"
        default
    >
    
    <!-- Spanish subtitles -->
    <track 
        kind="captions" 
        src="video.es.vtt" 
        srclang="es" 
        label="Español"
    >
    
    <!-- French subtitles -->
    <track 
        kind="captions" 
        src="video.fr.vtt" 
        srclang="fr" 
        label="Français"
    >
</video>
```

### JavaScript API for Subtitles

```javascript
const video = document.querySelector('video');
const textTracks = video.textTracks;

// Listen for cue changes
textTracks[0].addEventListener('cuechange', (e) => {
    const track = e.target;
    const activeCues = track.activeCues;
    
    if (activeCues && activeCues.length > 0) {
        console.log('Current subtitle:', activeCues[0].text);
    }
});

// Enable/disable subtitles programmatically
function toggleSubtitles() {
    const track = textTracks[0];
    track.mode = track.mode === 'showing' ? 'hidden' : 'showing';
}

// Switch subtitle language
function switchSubtitleLanguage(lang) {
    Array.from(textTracks).forEach(track => {
        track.mode = track.srclang === lang ? 'showing' : 'hidden';
    });
}
```

## 🔍 Troubleshooting

### FFmpeg not found
**Error**: `FFmpeg is not installed`

**Solution**:
1. Verify FFmpeg is in your PATH: `ffmpeg -version`
2. Restart your terminal/command prompt after adding to PATH
3. On Windows, ensure you added the `bin` folder, not the root folder

### Whisper not found
**Error**: `Whisper is not installed`

**Solution**:
1. Verify Python is installed: `python --version`
2. Reinstall Whisper: `pip install openai-whisper`
3. Try using `python -m whisper` instead if `whisper` command doesn't work

### Permission errors
**Error**: Permission denied when writing files

**Solution**:
- Ensure you have write permissions in the output directory
- On Linux/Mac, you may need `sudo` for system-wide installations

### Out of memory
**Error**: Process runs out of memory

**Solution**:
- Use a smaller Whisper model (`tiny` or `base`)
- Process shorter video segments
- Close other applications

### Slow transcription
**Solution**:
- Use a smaller model (`tiny` or `base`)
- Process on a machine with GPU (Whisper supports CUDA)
- For GPU acceleration, install: `pip install openai-whisper[gpu]`

### Audio extraction fails
**Error**: FFmpeg cannot extract audio

**Solution**:
- Verify video file is not corrupted
- Check video format is supported by FFmpeg
- Try converting video first: `ffmpeg -i input.mp4 -c copy output.mp4`

## 📝 Example Workflow

1. **Generate subtitles**:
   ```bash
   node backend/scripts/generateSubtitles.js my-video.mp4
   ```

2. **Output**: `my-video.vtt` is created in the same directory

3. **Use in HTML**:
   ```html
   <video controls>
       <source src="my-video.mp4" type="video/mp4">
       <track src="my-video.vtt" kind="captions" srclang="en" label="English" default>
   </video>
   ```

## 🎓 Additional Resources

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [OpenAI Whisper GitHub](https://github.com/openai/whisper)
- [WebVTT Specification](https://www.w3.org/TR/webvtt1/)
- [MDN Video Track API](https://developer.mozilla.org/en-US/docs/Web/API/TextTrack)

## ✅ Checklist

Before generating subtitles, ensure:
- [ ] FFmpeg is installed and in PATH
- [ ] Python 3.8+ is installed
- [ ] OpenAI Whisper is installed (`pip install openai-whisper`)
- [ ] Video file exists and is accessible
- [ ] You have write permissions in the output directory

## 🎉 You're Ready!

You now have a complete offline subtitle generation system. Generate subtitles for any video file and enhance accessibility for your users!

