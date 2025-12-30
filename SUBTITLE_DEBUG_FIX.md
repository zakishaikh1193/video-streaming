# Subtitle Display Fix - Debugging Guide

## 🔧 Changes Made

### 1. Enhanced SimpleVideoPlayer Component
- ✅ Added `crossOrigin="anonymous"` to video element (required for CORS with subtitle tracks)
- ✅ Added comprehensive logging for caption loading and track management
- ✅ Added `useEffect` hook to enable caption tracks when video metadata loads
- ✅ Improved caption URL building with better path handling
- ✅ Added debug overlay in development mode showing caption count

### 2. Fixed Caption Fetching in Pages
- ✅ **ShortUrlRedirect.jsx**: Fixed captions array check (empty array is truthy, need explicit length check)
- ✅ **PublicVideoPage.jsx**: Added captions fetching if missing from video response
- ✅ **StreamPage.jsx**: Ensured captions prop is always an array
- ✅ Added extensive logging to track caption loading flow

### 3. Enhanced Backend Logging
- ✅ Added detailed logging in `getVideo` endpoint to track caption fetching
- ✅ Logs show how many captions are found and their file paths

## 🐛 How to Debug

### Step 1: Check Browser Console
Open browser DevTools (F12) and look for these log messages:

```
[ShortUrlRedirect] 🔍 Fetching captions for video_id: VID_XXXXX
[ShortUrlRedirect] ✅ Loaded 1 caption(s) for video VID_XXXXX
[SimpleVideoPlayer] Captions prop received: [...]
[SimpleVideoPlayer] Found 1 text track(s)
[SimpleVideoPlayer] ✅ Enabled track: English (en)
```

### Step 2: Check Backend Console
Look for these log messages in your Node.js server:

```
[Get Video] 🔍 Fetching captions for video_id: VID_XXXXX
[Get Video] ✅ Found 1 caption(s) for video VID_XXXXX
[Get Video]   Caption 1: { id: X, video_id: 'VID_XXXXX', language: 'en', file_path: 'captions/VID_XXXXX_en.vtt' }
[Get Video] 📤 Sending response with 1 caption(s)
```

### Step 3: Verify Caption File Exists
Check if the caption file exists on disk:
- Path: `backend/video-storage/captions/VID_XXXXX_en.vtt`
- Should be accessible via: `http://localhost:5000/video-storage/captions/VID_XXXXX_en.vtt`

### Step 4: Check Database
Verify caption entry exists in database:

```sql
SELECT * FROM captions WHERE video_id = 'VID_XXXXX';
```

Expected result:
- `video_id`: Your video ID
- `language`: 'en' (or other language code)
- `file_path`: 'captions/VID_XXXXX_en.vtt'

### Step 5: Test Caption URL Directly
Open the caption URL directly in browser:
```
http://localhost:5000/video-storage/captions/VID_XXXXX_en.vtt
```

You should see WebVTT content:
```
WEBVTT

00:00:00.000 --> 00:00:05.000
Hello, this is a subtitle.
```

## 🔍 Common Issues

### Issue 1: "No text tracks found"
**Symptoms**: Console shows `[SimpleVideoPlayer] ⚠️ No text tracks found in video element`

**Possible Causes**:
1. Captions array is empty or not passed to component
2. Caption file doesn't exist
3. CORS issue preventing track loading

**Solution**:
- Check browser console for caption loading errors
- Verify caption file exists and is accessible
- Check CORS headers in backend (`server.js`)

### Issue 2: "Track error"
**Symptoms**: Console shows `[SimpleVideoPlayer] Track error for en`

**Possible Causes**:
1. Invalid VTT file format
2. File path is incorrect
3. CORS blocking the request

**Solution**:
- Open caption URL directly in browser to verify it loads
- Check VTT file format is valid WebVTT
- Verify CORS headers are set correctly

### Issue 3: CC Button Not Showing
**Symptoms**: Video plays but no CC button in controls

**Possible Causes**:
1. No caption tracks added to video element
2. Tracks not enabled (mode is 'disabled')
3. Browser doesn't support text tracks

**Solution**:
- Check console for track loading messages
- Verify `video.textTracks` has entries in browser console
- Try manually enabling: `video.textTracks[0].mode = 'showing'`

## 🧪 Testing Steps

1. **Upload a video** (via Cloudflare or regular upload)
2. **Wait for subtitle generation** (check backend logs)
3. **Open video page** in browser
4. **Check browser console** for caption loading logs
5. **Look for CC button** in video controls
6. **Click CC button** to toggle subtitles

## 📝 Expected Behavior

1. When video loads, console should show:
   - Captions fetched from API
   - Tracks added to video element
   - Default track enabled

2. CC button should appear in video controls automatically

3. Clicking CC button should:
   - Show/hide subtitles
   - Show language options if multiple tracks exist

## 🚨 If Still Not Working

1. **Check if subtitles were generated**:
   ```bash
   cd backend
   npm run check-subtitles VID_YOUR_VIDEO_ID
   ```

2. **Manually test caption URL**:
   - Open `http://localhost:5000/video-storage/captions/VID_XXXXX_en.vtt` in browser
   - Should see VTT content, not 404

3. **Check video element in browser**:
   - Open DevTools → Elements
   - Find `<video>` element
   - Check if `<track>` elements exist inside it
   - Check `video.textTracks` in console

4. **Verify CORS**:
   - Check Network tab for caption file request
   - Verify response headers include `Access-Control-Allow-Origin: *`

## 📊 Debug Checklist

- [ ] Backend logs show captions being fetched
- [ ] Frontend logs show captions received
- [ ] Caption file exists on disk
- [ ] Caption URL is accessible in browser
- [ ] Database has caption entry
- [ ] Video element has `<track>` children
- [ ] `video.textTracks` has entries
- [ ] CORS headers are set correctly
- [ ] CC button appears in controls

## 🎯 Next Steps

If subtitles still don't show after checking all above:
1. Share browser console logs
2. Share backend server logs
3. Share Network tab showing caption file request
4. Share screenshot of video player
