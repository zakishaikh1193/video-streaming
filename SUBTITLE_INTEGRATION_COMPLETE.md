# Complete Subtitle Integration Guide

## ✅ What's Already Done

1. **Track Element**: Automatically added to video player with:
   - `id="subtitle-track"`
   - `kind="subtitles"`
   - `srclang="en"`
   - `label="English"`
   - `default` attribute

2. **Utility Function**: `applySubtitles(vttUrl)` in `frontend/src/utils/subtitleUtils.js`

3. **CC Button**: Added to control bar and functional

4. **Subtitle Positioning**: Styled to appear 60px above control bar

5. **Captions Prop**: Fixed to pass actual captions array instead of empty array

---

## How to Use: Apply Subtitles After Generation

### Option 1: Using the Utility Function (Recommended)

```javascript
import { generateSubtitles } from '../services/subtitleService';
import { applySubtitles } from '../utils/subtitleUtils';

// After generating subtitles
const handleGenerateSubtitles = async (videoFile) => {
  try {
    // 1. Generate subtitles
    const result = await generateSubtitles(videoFile);
    const vttUrl = result.vttUrl; // e.g., "http://localhost:5000/subtitles/video-123.vtt"
    
    // 2. Apply subtitles to video player
    applySubtitles(vttUrl);
    
    console.log('Subtitles applied successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Option 2: Using Captions Prop (React)

```javascript
import { generateSubtitles } from '../services/subtitleService';
import { useState } from 'react';

function MyVideoComponent() {
  const [vttUrl, setVttUrl] = useState(null);
  
  const handleGenerateSubtitles = async (videoFile) => {
    const result = await generateSubtitles(videoFile);
    setVttUrl(result.vttUrl);
  };
  
  // Build captions array
  const captions = vttUrl ? [{
    src: vttUrl,
    label: 'English',
    language: 'en',
    default: true
  }] : [];
  
  return (
    <VideoPlayer 
      src={videoUrl} 
      captions={captions}  // ← Pass captions here
    />
  );
}
```

### Option 3: Direct DOM Manipulation (Plain HTML/JS)

```javascript
// After getting vttUrl from API
function applySubtitlesDirectly(vttUrl) {
  const trackElement = document.getElementById('subtitle-track');
  if (trackElement) {
    trackElement.src = vttUrl;
    
    // Enable the track
    const video = document.querySelector('video');
    if (video && video.textTracks && video.textTracks.length > 0) {
      for (let i = 0; i < video.textTracks.length; i++) {
        if (video.textTracks[i].kind === 'subtitles') {
          video.textTracks[i].mode = 'showing';
        }
      }
    }
  }
}

// Usage:
const result = await generateSubtitles(videoFile);
applySubtitlesDirectly(result.vttUrl);
```

---

## Complete Example: Generate and Apply Subtitles

```javascript
import { generateSubtitles } from '../services/subtitleService';
import { applySubtitles } from '../utils/subtitleUtils';

async function generateAndApplySubtitles(videoFile) {
  try {
    console.log('Generating subtitles...');
    
    // Step 1: Generate subtitles via API
    const result = await generateSubtitles(videoFile);
    
    if (result.success && result.vttUrl) {
      console.log('Subtitles generated:', result.vttUrl);
      
      // Step 2: Apply subtitles to video player
      const applied = applySubtitles(result.vttUrl);
      
      if (applied) {
        console.log('✅ Subtitles applied and should be visible!');
        
        // Optional: Save vttUrl to database
        // await saveSubtitleUrl(videoId, result.vttUrl);
      } else {
        console.warn('⚠️ Subtitles generated but not applied');
      }
    } else {
      console.error('Failed to generate subtitles:', result.error);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage:
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  if (e.target.files[0]) {
    await generateAndApplySubtitles(e.target.files[0]);
  }
});
```

---

## Verify Subtitles Are Working

### 1. Check Browser Console
Look for these messages:
```
[SubtitleUtils] Subtitle track src set to: http://localhost:5000/subtitles/video-123.vtt
[SubtitleUtils] Track loaded event fired
[SubtitleUtils] Track 0 mode set to: showing
```

### 2. Check Text Tracks
```javascript
// In browser console:
const video = document.querySelector('video');
console.log('Text tracks:', video.textTracks);
console.log('Track 0:', {
  kind: video.textTracks[0]?.kind,
  mode: video.textTracks[0]?.mode,  // Should be "showing"
  label: video.textTracks[0]?.label,
  src: document.getElementById('subtitle-track')?.src
});
```

### 3. Check VTT File
Open in browser:
```
http://localhost:5000/subtitles/your-file.vtt
```
Should show WebVTT content.

### 4. Check CC Button
- CC button should be visible in control bar
- Clicking it should toggle subtitles on/off
- Button should highlight when subtitles are showing

---

## Troubleshooting

### Subtitles Not Showing?

1. **Check track element exists:**
   ```javascript
   const track = document.getElementById('subtitle-track');
   console.log('Track element:', track);
   console.log('Track src:', track?.src);
   ```

2. **Check text track mode:**
   ```javascript
   const video = document.querySelector('video');
   const track = video.textTracks[0];
   console.log('Track mode:', track?.mode); // Should be "showing"
   if (track && track.mode !== 'showing') {
     track.mode = 'showing'; // Force enable
   }
   ```

3. **Check VTT file is accessible:**
   - Open VTT URL in browser
   - Check network tab for 200 response
   - Verify CORS headers if needed

4. **Check nativeTextTracks is enabled:**
   - Should be `true` in Video.js options
   - Already set in VideoPlayer component

### CC Button Not Visible?

1. Check control bar includes `'subsCapsButton'`
2. Check CSS: `.vjs-subs-caps-button { display: flex !important; }`
3. Button should appear between spacer and fullscreen button

### Subtitles Not Above Control Bar?

1. Check CSS: `.vjs-text-track-display { bottom: 60px !important; }`
2. Verify `::cue` styles are applied
3. Check z-index (should be 10)

---

## Files Modified

✅ `frontend/src/components/VideoPlayer.jsx`
- Added track element automatically
- Added CC button to control bar
- Enabled native text tracks
- Added subtitle styling

✅ `frontend/src/utils/subtitleUtils.js`
- `applySubtitles(vttUrl)` function
- Automatic track creation if missing
- Text track enabling logic

✅ `frontend/src/pages/ShortUrlRedirect.jsx`
- Fixed to pass `captions={captions}` instead of `[]`

✅ `frontend/src/pages/PublicVideoPage.jsx`
- Fixed to pass `captions={captions}` instead of `[]`

---

## Quick Reference

```javascript
// Generate subtitles
const result = await generateSubtitles(videoFile);
// Returns: { success: true, vttUrl: "http://..." }

// Apply subtitles (one line)
applySubtitles(result.vttUrl);

// Or via captions prop
const captions = [{ src: result.vttUrl, label: 'English', language: 'en', default: true }];
<VideoPlayer src={videoUrl} captions={captions} />
```

That's it! Subtitles should now appear automatically. 🎉

