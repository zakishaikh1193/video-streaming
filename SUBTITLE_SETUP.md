# Automatic Subtitle Generation Setup Guide

This guide explains how to set up automatic subtitle generation using Whisper.cpp for your video player.

## Prerequisites

1. **FFmpeg** - For audio extraction
2. **Whisper.cpp** - For speech-to-text conversion
3. **Whisper Model** - `ggml-base.en.bin` model file

---

## Step 1: Install FFmpeg

### Windows
1. Download FFmpeg from: https://ffmpeg.org/download.html
2. Extract to a folder (e.g., `C:\ffmpeg`)
3. Add to PATH:
   - Open System Properties → Environment Variables
   - Add `C:\ffmpeg\bin` to PATH
4. Verify installation:
   ```bash
   ffmpeg -version
   ```

### macOS
```bash
brew install ffmpeg
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

---

## Step 2: Install Whisper.cpp

### Option A: Build from Source (Recommended)

1. **Clone the repository:**
   ```bash
   cd /path/to/video-streaming
   git clone https://github.com/ggerganov/whisper.cpp.git
   ```

2. **Build Whisper.cpp:**

   **Windows (using MSVC or MinGW):**
   ```bash
   cd whisper.cpp
   mkdir build
   cd build
   cmake ..
   cmake --build . --config Release
   ```
   The binary will be at: `whisper.cpp/bin/whisper.exe`

   **macOS/Linux:**
   ```bash
   cd whisper.cpp
   make
   ```
   The binary will be at: `whisper.cpp/bin/whisper`

### Option B: Download Pre-built Binary

- Check Whisper.cpp releases: https://github.com/ggerganov/whisper.cpp/releases
- Extract to `whisper.cpp/bin/` folder

---

## Step 3: Download Whisper Model

1. **Download the model:**
   ```bash
   cd whisper.cpp
   bash ./models/download-ggml-model.sh base.en
   ```

   Or manually download from:
   - https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin

2. **Place the model file:**
   ```
   whisper.cpp/models/ggml-base.en.bin
   ```

---

## Step 4: Verify Installation

### Check FFmpeg:
```bash
ffmpeg -version
```

### Check Whisper.cpp:
```bash
# Windows
whisper.cpp\bin\whisper.exe --help

# macOS/Linux
whisper.cpp/bin/whisper --help
```

### Check Model:
```bash
# Verify the model file exists
ls whisper.cpp/models/ggml-base.en.bin
```

---

## Step 5: Directory Structure

Your project should have this structure:

```
video-streaming/
├── backend/
│   ├── controllers/
│   │   └── subtitleController.js
│   ├── routes/
│   │   └── subtitleRoutes.js
│   └── server.js
├── whisper.cpp/
│   ├── bin/
│   │   └── whisper (or whisper.exe on Windows)
│   └── models/
│       └── ggml-base.en.bin
├── public/
│   └── subtitles/  (auto-created)
└── temp-subtitles/  (auto-created)
```

---

## Step 6: Test the Backend

1. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

2. **Test the endpoint:**
   ```bash
   curl -X POST http://localhost:5000/api/subtitles/generate \
     -F "video=@path/to/test-video.mp4"
   ```

   Expected response:
   ```json
   {
     "success": true,
     "vttUrl": "http://localhost:5000/subtitles/test-video-1234567890.vtt",
     "message": "Subtitles generated successfully"
   }
   ```

---

## FFmpeg Command Used

The backend uses this FFmpeg command to extract audio:

```bash
ffmpeg -y -i input.mp4 -ar 16000 -ac 1 -f wav output.wav
```

- `-y`: Overwrite output file
- `-i input.mp4`: Input video file
- `-ar 16000`: Sample rate 16kHz (required by Whisper)
- `-ac 1`: Mono channel
- `-f wav`: WAV format

---

## Whisper.cpp Command Used

The backend uses this Whisper.cpp command:

```bash
whisper -m models/ggml-base.en.bin -f audio.wav -otxt -ovtt -of output
```

- `-m models/ggml-base.en.bin`: Model file
- `-f audio.wav`: Input audio file
- `-otxt`: Output text file
- `-ovtt`: Output VTT file
- `-of output`: Output filename (without extension)

---

## Troubleshooting

### Error: "FFmpeg not found"
- Make sure FFmpeg is installed and in your PATH
- Test with: `ffmpeg -version`

### Error: "Whisper binary not found"
- Check the path in `backend/controllers/subtitleController.js`
- Default path: `whisper.cpp/bin/whisper` (or `whisper.exe` on Windows)
- Update `WHISPER_BIN` constant if your path is different

### Error: "Model not found"
- Download the model: `ggml-base.en.bin`
- Place it in: `whisper.cpp/models/ggml-base.en.bin`
- Update `WHISPER_MODEL` constant if your path is different

### Error: "Command failed"
- Check Whisper.cpp output for details
- Verify audio file was created correctly
- Check file permissions

### Subtitles not appearing in player
- Verify VTT file is accessible: `http://localhost:5000/subtitles/filename.vtt`
- Check browser console for CORS errors
- Ensure `<track>` tag is added to video element

---

## Production Deployment

### 1. Update Paths
If deploying to a server, update paths in `subtitleController.js`:
```javascript
const WHISPER_BIN = '/absolute/path/to/whisper.cpp/bin/whisper';
const WHISPER_MODEL = '/absolute/path/to/whisper.cpp/models/ggml-base.en.bin';
```

### 2. Set Environment Variables
```bash
export BACKEND_URL=https://your-domain.com
```

### 3. File Permissions
Ensure directories are writable:
```bash
chmod -R 755 public/subtitles
chmod -R 755 temp-subtitles
```

### 4. Process Management
Use PM2 or similar:
```bash
pm2 start backend/server.js --name video-backend
```

---

## Example VTT Output

The generated VTT file will look like this:

```vtt
WEBVTT

00:00:00.000 --> 00:00:05.000
Hello, welcome to this video tutorial.

00:00:05.000 --> 00:00:10.000
Today we will learn about automatic subtitle generation.

00:00:10.000 --> 00:00:15.000
This is powered by Whisper.cpp, a local speech recognition model.
```

---

## Frontend Integration

See `frontend/src/services/subtitleService.js` for the API client.

Example usage:
```javascript
import { generateSubtitles } from '../services/subtitleService';

const videoFile = document.querySelector('input[type="file"]').files[0];
const result = await generateSubtitles(videoFile);
console.log('VTT URL:', result.vttUrl);
```

---

## Support

For issues:
1. Check Whisper.cpp documentation: https://github.com/ggerganov/whisper.cpp
2. Verify all prerequisites are installed
3. Check backend logs for detailed error messages

