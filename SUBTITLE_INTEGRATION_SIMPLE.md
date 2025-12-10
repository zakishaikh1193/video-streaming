# Simple Subtitle Integration - Minimal Code Snippet

This is the **minimal code** you need to add subtitles to your existing HTML video player.

## ✅ Backend Already Set Up

The backend endpoint `/api/subtitles/generate` is already configured and the `/subtitles` folder is being served.

## Minimal HTML/JS Code Snippet

Add this to your HTML file where you have your video player:

```html
<!-- Your existing video element -->
<video id="my-video" controls>
  <source src="your-video.mp4" type="video/mp4">
  
  <!-- Add this track element -->
  <track id="subtitle-track" kind="subtitles" srclang="en" label="English" default />
</video>

<script>
// Function to apply subtitles (paste this anywhere in your script)
function applySubtitles(vttUrl) {
  const trackElement = document.getElementById('subtitle-track');
  if (trackElement) {
    trackElement.src = vttUrl;
    console.log('Subtitles applied:', vttUrl);
    
    // Enable the track
    const video = document.getElementById('my-video');
    if (video && video.textTracks && video.textTracks.length > 0) {
      for (let i = 0; i < video.textTracks.length; i++) {
        if (video.textTracks[i].kind === 'subtitles') {
          video.textTracks[i].mode = 'showing';
        }
      }
    }
    return true;
  }
  return false;
}

// Example: Generate subtitles and apply them
async function generateAndApplySubtitles(videoFile) {
  const formData = new FormData();
  formData.append('video', videoFile);
  
  try {
    const response = await fetch('/api/subtitles/generate', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success && result.vttUrl) {
      // Apply subtitles to your video
      applySubtitles(result.vttUrl);
      console.log('Subtitles generated and applied!');
    }
  } catch (error) {
    console.error('Error generating subtitles:', error);
  }
}

// Usage example:
// const fileInput = document.querySelector('input[type="file"]');
// fileInput.addEventListener('change', (e) => {
//   if (e.target.files[0]) {
//     generateAndApplySubtitles(e.target.files[0]);
//   }
// });
</script>
```

## Even Simpler - One-Liner After API Call

If you already have the `vttUrl` from the API response:

```javascript
// After getting { vttUrl: "http://localhost:5000/subtitles/video-123.vtt" }
document.getElementById('subtitle-track').src = vttUrl;
```

That's it! The subtitles will appear automatically.

## For React Components

If you're using the VideoPlayer component in React:

```javascript
import { applySubtitles } from '../utils/subtitleUtils';
import { generateSubtitles } from '../services/subtitleService';

// After video upload
const handleGenerateSubtitles = async (videoFile) => {
  const result = await generateSubtitles(videoFile);
  applySubtitles(result.vttUrl);
};
```

## Verify Subtitles Are Served

Test that subtitles are accessible:
```
http://localhost:5000/subtitles/your-file.vtt
```

If you see the VTT content, it's working! ✅

