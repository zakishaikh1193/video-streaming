# Subtitle Debugging Guide

## Why Subtitles Aren't Showing

### Issue 1: Empty Captions Array
The `captions` prop is being passed as `[]` (empty array) in:
- `ShortUrlRedirect.jsx` (line 504)
- `PublicVideoPage.jsx` (line 302)

**Solution:** You need to pass a VTT URL in the captions array:

```javascript
// Instead of:
<VideoPlayer src={streamUrl} captions={[]} />

// Use:
const captions = video.subtitle_url ? [{
  src: video.subtitle_url,
  label: 'English',
  language: 'en',
  default: true
}] : [];

<VideoPlayer src={streamUrl} captions={captions} />
```

### Issue 2: No Subtitle URL Generated
If you haven't generated subtitles yet, you need to:
1. Call `/api/subtitles/generate` with the video file
2. Get the `vttUrl` from the response
3. Pass it to the VideoPlayer component

### Issue 3: Track Not Enabled
Even if the track src is set, the text track might not be enabled. Check browser console for:
- `[VideoPlayer] Subtitle track src set: ...`
- `[VideoPlayer] Enabling text track: ...`
- `[VideoPlayer] Text track mode set to: showing`

## Quick Fix

Add this to your video pages to auto-apply subtitles if they exist:

```javascript
// In ShortUrlRedirect.jsx or PublicVideoPage.jsx
useEffect(() => {
  if (video && video.subtitle_url) {
    // Subtitles will be applied via captions prop
    console.log('Video has subtitle URL:', video.subtitle_url);
  }
}, [video]);

// Build captions array
const captions = (() => {
  if (video?.subtitle_url) {
    return [{
      src: video.subtitle_url,
      label: 'English',
      language: 'en',
      default: true
    }];
  }
  return [];
})();

<VideoPlayer src={streamUrl} captions={captions} />
```

## Test Subtitle Display

1. **Check if VTT file is accessible:**
   ```
   Open: http://localhost:5000/subtitles/your-file.vtt
   ```
   Should show WebVTT content.

2. **Check browser console:**
   Look for:
   - `[VideoPlayer] Subtitle track src set: ...`
   - `[SubtitleUtils] Track loaded event fired`
   - `[SubtitleUtils] Track mode set to: showing`

3. **Check text tracks in console:**
   ```javascript
   const video = document.querySelector('video');
   console.log('Text tracks:', video.textTracks);
   console.log('Track 0 mode:', video.textTracks[0]?.mode);
   ```

4. **Manually enable track:**
   ```javascript
   const video = document.querySelector('video');
   if (video.textTracks && video.textTracks.length > 0) {
     video.textTracks[0].mode = 'showing';
   }
   ```

## Common Issues

1. **CORS Error:** Make sure `/subtitles` folder is served with proper CORS headers
2. **Track Not Loading:** Check network tab to see if VTT file is being fetched
3. **Track Disabled:** Text track mode might be 'hidden' or 'disabled' - needs to be 'showing'
4. **No VTT URL:** Video doesn't have a subtitle URL - need to generate one first

