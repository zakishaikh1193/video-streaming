# Subtitle Troubleshooting Guide

## Quick Debug Steps

### Step 1: Check Browser Console
Open browser console (F12) and look for these messages:
- `[VideoPlayer] Applying subtitles, VTT URL: ...`
- `[VideoPlayer] Track src set to: ...`
- `[VideoPlayer] ✅ Track enabled, mode set to: showing`

### Step 2: Run Debug Function
In browser console, paste this:

```javascript
// Check subtitle status
const video = document.querySelector('video');
const track = document.getElementById('subtitle-track');
console.log('Track element:', track);
console.log('Track src:', track?.src);
console.log('Text tracks:', video?.textTracks);
if (video?.textTracks && video.textTracks.length > 0) {
  console.log('Track 0 mode:', video.textTracks[0].mode);
  console.log('Track 0 kind:', video.textTracks[0].kind);
}
```

### Step 3: Force Enable Subtitles
If track exists but mode is not "showing", run:

```javascript
const video = document.querySelector('video');
if (video && video.textTracks && video.textTracks.length > 0) {
  for (let i = 0; i < video.textTracks.length; i++) {
    const track = video.textTracks[i];
    if (track.kind === 'subtitles' || track.kind === 'captions') {
      track.mode = 'showing';
      console.log('✅ Track enabled:', track.mode);
    }
  }
}
```

### Step 4: Check VTT File
Open the VTT URL directly in browser:
```
http://localhost:5000/subtitles/your-file.vtt
```
Should show WebVTT content like:
```
WEBVTT

00:00:00.000 --> 00:00:05.000
Hello, welcome to this video.
```

### Step 5: Check Network Tab
1. Open DevTools → Network tab
2. Filter by "vtt"
3. Reload page
4. Check if VTT file is being loaded (status 200)

---

## Common Issues & Fixes

### Issue 1: Track Element Not Found
**Symptom:** Console shows "Subtitle track element not found"

**Fix:**
```javascript
// Manually create track element
const video = document.querySelector('video');
const track = document.createElement('track');
track.id = 'subtitle-track';
track.kind = 'subtitles';
track.srclang = 'en';
track.label = 'English';
track.default = true;
track.src = 'YOUR_VTT_URL_HERE';
video.appendChild(track);
```

### Issue 2: Track Mode is "hidden" or "disabled"
**Symptom:** Track exists but subtitles don't show

**Fix:**
```javascript
const video = document.querySelector('video');
if (video.textTracks && video.textTracks.length > 0) {
  video.textTracks[0].mode = 'showing';
}
```

### Issue 3: VTT File Not Loading
**Symptom:** Network tab shows 404 or CORS error

**Fix:**
1. Check VTT file exists in `public/subtitles/` folder
2. Check backend is serving `/subtitles` route
3. Check CORS headers if accessing from different domain

### Issue 4: Subtitles Not Visible (CSS Issue)
**Symptom:** Track is enabled but text not visible

**Fix:**
```javascript
// Check if text track display is visible
const display = document.querySelector('.vjs-text-track-display');
if (display) {
  display.style.display = 'block';
  display.style.visibility = 'visible';
  display.style.opacity = '1';
}
```

### Issue 5: Video.js Overriding Native Tracks
**Symptom:** Native tracks work but Video.js doesn't show them

**Fix:** Already handled - `nativeTextTracks: true` is set

---

## Manual Test Function

Paste this in browser console to test subtitle display:

```javascript
async function testSubtitles(vttUrl) {
  console.log('Testing subtitles with URL:', vttUrl);
  
  const video = document.querySelector('video');
  if (!video) {
    console.error('❌ No video element found');
    return;
  }
  
  // Get or create track
  let track = document.getElementById('subtitle-track');
  if (!track) {
    console.log('Creating track element...');
    track = document.createElement('track');
    track.id = 'subtitle-track';
    track.kind = 'subtitles';
    track.srclang = 'en';
    track.label = 'English';
    track.default = true;
    video.appendChild(track);
  }
  
  // Set track src
  track.src = vttUrl;
  console.log('✅ Track src set to:', track.src);
  
  // Wait for track to load
  await new Promise(resolve => {
    track.addEventListener('load', resolve);
    setTimeout(resolve, 2000); // Timeout after 2s
  });
  
  // Enable track
  if (video.textTracks && video.textTracks.length > 0) {
    for (let i = 0; i < video.textTracks.length; i++) {
      const t = video.textTracks[i];
      if (t.kind === 'subtitles' || t.kind === 'captions') {
        t.mode = 'showing';
        console.log('✅ Track enabled, mode:', t.mode);
        console.log('Track cues:', t.cues ? t.cues.length : 0);
      }
    }
  }
  
  console.log('✅ Subtitle test complete!');
}

// Usage:
// testSubtitles('http://localhost:5000/subtitles/your-file.vtt');
```

---

## Verify Everything is Working

Run this complete check:

```javascript
function checkSubtitles() {
  const video = document.querySelector('video');
  const track = document.getElementById('subtitle-track');
  
  console.log('=== SUBTITLE CHECK ===');
  console.log('1. Video element:', video ? '✅' : '❌');
  console.log('2. Track element:', track ? '✅' : '❌');
  console.log('3. Track src:', track?.src || '❌ Not set');
  console.log('4. Text tracks:', video?.textTracks?.length || 0);
  
  if (video?.textTracks && video.textTracks.length > 0) {
    const t = video.textTracks[0];
    console.log('5. Track mode:', t.mode);
    console.log('6. Track kind:', t.kind);
    console.log('7. Track cues:', t.cues?.length || 0);
    console.log('8. Track readyState:', t.readyState);
  }
  
  // Check VTT file
  if (track?.src) {
    fetch(track.src)
      .then(r => console.log('9. VTT file accessible:', r.ok ? '✅' : '❌', r.status))
      .catch(e => console.log('9. VTT file accessible: ❌', e.message));
  }
  
  console.log('=== END CHECK ===');
}

// Run check
checkSubtitles();
```

---

## Still Not Working?

1. **Check if captions prop is being passed:**
   - Look in React DevTools
   - Check if `captions` array has VTT URL

2. **Check if video has subtitle_url in database:**
   - Verify video object has `subtitle_url` field
   - Check API response includes subtitle URL

3. **Try manual application:**
   ```javascript
   import { applySubtitles } from '../utils/subtitleUtils';
   applySubtitles('http://localhost:5000/subtitles/your-file.vtt');
   ```

4. **Check browser compatibility:**
   - Some browsers require specific VTT format
   - Try different browser (Chrome, Firefox, Edge)

5. **Check Video.js version:**
   - Ensure Video.js supports native text tracks
   - Current version should support it

---

## Quick Fix: Force Enable All Tracks

```javascript
// Paste in console to force enable all subtitle tracks
(function() {
  const video = document.querySelector('video');
  if (!video) return;
  
  const tracks = video.textTracks;
  if (tracks) {
    for (let i = 0; i < tracks.length; i++) {
      if (tracks[i].kind === 'subtitles' || tracks[i].kind === 'captions') {
        tracks[i].mode = 'showing';
        console.log(`✅ Enabled track ${i}`);
      }
    }
  }
  
  // Also check Video.js
  const playerEl = video.closest('.video-js');
  if (playerEl && window.videojs) {
    const player = window.videojs.getPlayer(playerEl);
    if (player && player.textTracks) {
      const vjsTracks = player.textTracks();
      for (let i = 0; i < vjsTracks.length; i++) {
        if (vjsTracks[i].kind === 'subtitles' || vjsTracks[i].kind === 'captions') {
          vjsTracks[i].mode = 'showing';
          console.log(`✅ Enabled VJS track ${i}`);
        }
      }
    }
  }
})();
```

