# Quick Integration Guide: Auto Subtitle Generation

This guide shows you how to add automatic subtitle generation to your existing video player.

## Backend Setup (Already Done ✅)

The backend endpoint is already configured:
- **Route**: `POST /api/subtitles/generate`
- **Controller**: `backend/controllers/subtitleController.js`
- **Route File**: `backend/routes/subtitleRoutes.js`

## Frontend Integration

### Step 1: Import the Service

```javascript
import { generateSubtitles } from '../services/subtitleService';
```

### Step 2: Generate Subtitles After Video Upload

```javascript
// After uploading a video file
const handleVideoUpload = async (videoFile) => {
  // ... your existing upload logic ...
  
  // Generate subtitles
  try {
    const result = await generateSubtitles(videoFile);
    const vttUrl = result.vttUrl; // e.g., "http://localhost:5000/subtitles/video-123.vtt"
    
    // Save vttUrl to your database or state
    console.log('Subtitles generated:', vttUrl);
  } catch (error) {
    console.error('Subtitle generation failed:', error);
  }
};
```

### Step 3: Add Subtitles to VideoPlayer

Your `VideoPlayer` component already supports the `captions` prop. Just pass the VTT URL:

```javascript
// Build captions array
const captions = vttUrl ? [{
  src: vttUrl,
  label: 'English',
  language: 'en',
  default: true
}] : [];

// Use in VideoPlayer
<VideoPlayer
  src={videoUrl}
  captions={captions}  // ← Add this prop
  videoId={videoId}
/>
```

## Complete Example

See `frontend/src/components/SubtitleGeneratorExample.jsx` for a complete working example.

## Minimal Integration (3 Steps)

1. **Call the API after video upload:**
   ```javascript
   const { vttUrl } = await generateSubtitles(videoFile);
   ```

2. **Build captions array:**
   ```javascript
   const captions = [{ src: vttUrl, label: 'English', language: 'en', default: true }];
   ```

3. **Pass to VideoPlayer:**
   ```javascript
   <VideoPlayer src={videoUrl} captions={captions} />
   ```

That's it! Your existing video player will now display subtitles.

## API Response Format

```json
{
  "success": true,
  "vttUrl": "http://localhost:5000/subtitles/video-1234567890.vtt",
  "message": "Subtitles generated successfully"
}
```

## Error Handling

```javascript
try {
  const result = await generateSubtitles(videoFile);
  // Success
} catch (error) {
  // Handle error
  console.error('Error:', error.message);
  // Common errors:
  // - "FFmpeg not found" → Install FFmpeg
  // - "Whisper binary not found" → Install Whisper.cpp
  // - "Model not found" → Download ggml-base.en.bin
}
```

## Notes

- The backend automatically extracts audio, runs Whisper.cpp, and generates VTT files
- VTT files are saved in `public/subtitles/` and served at `/subtitles/`
- Your existing VideoPlayer component handles everything else automatically
- No changes needed to your video player code!

