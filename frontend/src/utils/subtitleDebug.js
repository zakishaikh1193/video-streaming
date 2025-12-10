/**
 * Debug utility for subtitle display issues
 * 
 * Usage in browser console:
 * import { debugSubtitles } from './utils/subtitleDebug';
 * debugSubtitles();
 */

export function debugSubtitles() {
  const video = document.querySelector('video');
  if (!video) {
    console.error('❌ No video element found');
    return;
  }

  console.log('=== SUBTITLE DEBUG ===');
  console.log('Video element:', video);
  
  // Check track element
  const track = document.getElementById('subtitle-track') || video.querySelector('track[kind="subtitles"]');
  console.log('Track element:', track);
  if (track) {
    console.log('Track src:', track.src);
    console.log('Track kind:', track.kind);
    console.log('Track label:', track.label);
    console.log('Track default:', track.default);
  } else {
    console.warn('⚠️ No track element found!');
  }
  
  // Check text tracks
  const textTracks = video.textTracks;
  console.log('Text tracks:', textTracks);
  console.log('Text tracks count:', textTracks ? textTracks.length : 0);
  
  if (textTracks && textTracks.length > 0) {
    for (let i = 0; i < textTracks.length; i++) {
      const t = textTracks[i];
      console.log(`Track ${i}:`, {
        kind: t.kind,
        label: t.label,
        language: t.language,
        mode: t.mode,
        readyState: t.readyState,
        cues: t.cues ? t.cues.length : 0
      });
    }
  } else {
    console.warn('⚠️ No text tracks found!');
  }
  
  // Check Video.js player
  const playerEl = video.closest('.video-js');
  if (playerEl) {
    console.log('Video.js player found');
    const playerId = playerEl.id || playerEl.className;
    console.log('Player ID:', playerId);
    
    // Try to get Video.js instance
    if (window.videojs) {
      const player = window.videojs.getPlayer(playerEl);
      if (player) {
        console.log('Video.js player instance:', player);
        if (player.textTracks) {
          const vjsTracks = player.textTracks();
          console.log('Video.js text tracks:', vjsTracks);
          for (let i = 0; i < vjsTracks.length; i++) {
            console.log(`VJS Track ${i}:`, {
              kind: vjsTracks[i].kind,
              label: vjsTracks[i].label,
              mode: vjsTracks[i].mode
            });
          }
        }
      }
    }
  }
  
  // Check CSS
  const textTrackDisplay = document.querySelector('.vjs-text-track-display');
  console.log('Text track display element:', textTrackDisplay);
  if (textTrackDisplay) {
    const styles = window.getComputedStyle(textTrackDisplay);
    console.log('Text track display styles:', {
      display: styles.display,
      visibility: styles.visibility,
      opacity: styles.opacity,
      bottom: styles.bottom,
      zIndex: styles.zIndex
    });
  }
  
  // Try to force enable
  console.log('\n=== FORCING TRACK ENABLE ===');
  if (textTracks && textTracks.length > 0) {
    for (let i = 0; i < textTracks.length; i++) {
      const t = textTracks[i];
      if (t.kind === 'subtitles' || t.kind === 'captions') {
        console.log(`Enabling track ${i}...`);
        t.mode = 'showing';
        console.log(`Track ${i} mode set to:`, t.mode);
      }
    }
  }
  
  console.log('=== END DEBUG ===');
}

/**
 * Force enable subtitles
 */
export function forceEnableSubtitles() {
  const video = document.querySelector('video');
  if (!video) {
    console.error('No video element found');
    return false;
  }
  
  const textTracks = video.textTracks;
  if (!textTracks || textTracks.length === 0) {
    console.warn('No text tracks found');
    return false;
  }
  
  let enabled = false;
  for (let i = 0; i < textTracks.length; i++) {
    const track = textTracks[i];
    if (track.kind === 'subtitles' || track.kind === 'captions') {
      track.mode = 'showing';
      console.log(`✅ Enabled track ${i}:`, track.label);
      enabled = true;
    }
  }
  
  return enabled;
}

