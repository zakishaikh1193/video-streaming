# Subtitle Debugging Guide

## How to Debug Subtitle Issues

### 1. Check Browser Console

Open browser DevTools (F12) and check the console for these log messages:

**Expected logs when captions are loaded:**
```
[ShortUrlRedirect] Loaded X caption(s) for video VIDEO_ID
[VideoPlayer] Loading X caption track(s)...
[VideoPlayer] Backend URL: http://...
[VideoPlayer] Processing caption 1: {file_path: "...", language: "en", ...}
[VideoPlayer] Final caption URL: http://.../video-storage/captions/...
[VideoPlayer] ✓ Added caption track: en from http://...
[VideoPlayer] Text tracks available: X
[VideoPlayer] ✓ Enabled default caption track: en
[VideoPlayer] Showing CC button - X caption(s) available
```

**If you see errors:**
- `Could not fetch captions` - Check if captions exist in database
- `Failed to add caption track` - Check if caption file URL is accessible
- `No text tracks found` - Caption file might not be loading correctly

### 2. Verify Captions in Database

Check if captions exist for your video:

```sql
SELECT * FROM captions WHERE video_id = 'YOUR_VIDEO_ID';
```

Expected columns:
- `id`: Caption ID
- `video_id`: Video ID (should match your video)
- `language`: Language code (e.g., 'en', 'es', 'fr')
- `file_path`: Path to VTT file (e.g., 'captions/VIDEO_ID_en.vtt')

### 3. Verify Caption File Exists

Check if the caption file exists on the server:

```bash
# On server, check if file exists
ls -la video-storage/captions/VIDEO_ID_en.vtt
```

The file should be at: `backend/../video-storage/captions/VIDEO_ID_LANGUAGE.vtt`

### 4. Test Caption URL Directly

Open the caption URL directly in your browser:

```
http://YOUR_BACKEND_URL/video-storage/captions/VIDEO_ID_en.vtt
```

You should see the VTT file content. If you get 404, the file doesn't exist or the path is wrong.

### 5. Check Network Tab

In browser DevTools → Network tab:
1. Filter by "vtt" or "captions"
2. Look for requests to caption files
3. Check if they return 200 (success) or 404 (not found)

### 6. Verify API Response

Check if the video API includes captions:

```javascript
// In browser console
fetch('/api/videos/VIDEO_ID')
  .then(r => r.json())
  .then(data => console.log('Captions:', data.captions));
```

Should return an array of caption objects.

### 7. Common Issues and Solutions

#### Issue: CC button not showing
**Solution:**
- Verify captions array is not empty
- Check console for "Showing CC button" log
- Ensure `subsCapsButton` is in controlBar children

#### Issue: Captions not loading
**Solution:**
- Check caption file URL is correct
- Verify file exists on server
- Check CORS headers for VTT files
- Ensure `/video-storage/captions` is served as static files

#### Issue: Captions show but are empty
**Solution:**
- Verify VTT file format is correct
- Check file encoding (should be UTF-8)
- Test VTT file in a simple HTML video player

#### Issue: Wrong caption URL
**Solution:**
- Caption file_path format: `captions/VIDEO_ID_LANGUAGE.vtt`
- Full URL should be: `BACKEND_URL/video-storage/captions/VIDEO_ID_LANGUAGE.vtt`
- Check `getBackendBaseUrl()` returns correct backend URL

### 8. Test with Sample VTT File

Create a test VTT file to verify the system works:

```vtt
WEBVTT

00:00:00.000 --> 00:00:05.000
This is a test subtitle.

00:00:05.000 --> 00:00:10.000
Subtitles are working correctly!
```

Save as `video-storage/captions/TEST_VIDEO_ID_en.vtt` and test.

### 9. Check Video.js Text Tracks

In browser console, after video loads:

```javascript
// Get video player element
const player = videojs('your-video-id');

// Check text tracks
const tracks = player.textTracks();
console.log('Text tracks:', tracks.length);
Array.from(tracks).forEach((track, i) => {
  console.log(`Track ${i}:`, {
    kind: track.kind,
    language: track.language,
    label: track.label,
    mode: track.mode,
    src: track.src
  });
});
```

### 10. Manual Caption Test

Test if captions work by manually adding a track:

```javascript
const player = videojs('your-video-id');
player.addRemoteTextTrack({
  kind: 'captions',
  src: 'http://YOUR_BACKEND/video-storage/captions/VIDEO_ID_en.vtt',
  srclang: 'en',
  label: 'English',
  default: true
}, false);
```

If this works, the issue is with automatic loading. If it doesn't, the issue is with the file or URL.

