/**
 * Utility function to apply subtitles to an existing HTML video player
 * 
 * This function finds the subtitle track element and updates its src attribute.
 * Works with both native HTML5 video elements and Video.js players.
 * 
 * @param {string} vttUrl - The URL to the VTT subtitle file
 * @param {string|HTMLElement} videoElementOrId - Optional: video element or its ID. 
 *                                                If not provided, searches for video element in the page.
 * @returns {boolean} - Returns true if subtitle was applied successfully, false otherwise
 */
export function applySubtitles(vttUrl, videoElementOrId = null) {
  if (!vttUrl) {
    console.warn('[SubtitleUtils] No VTT URL provided');
    return false;
  }

  try {
    let videoElement = null;
    let trackElement = null;

    // Find video element
    if (videoElementOrId) {
      if (typeof videoElementOrId === 'string') {
        // If it's a string, treat it as an ID
        videoElement = document.getElementById(videoElementOrId);
      } else {
        // If it's an element, use it directly
        videoElement = videoElementOrId;
      }
    } else {
      // Search for video element in the page
      videoElement = document.querySelector('video');
    }

    if (!videoElement) {
      console.warn('[SubtitleUtils] Video element not found');
      return false;
    }

    // Find track element - try by ID first, then by kind
    trackElement = videoElement.querySelector('#subtitle-track');
    
    if (!trackElement) {
      // Try to find any existing subtitle track
      trackElement = videoElement.querySelector('track[kind="subtitles"]');
    }

    if (!trackElement) {
      // Create new track element if it doesn't exist
      console.log('[SubtitleUtils] Creating new subtitle track element');
      trackElement = document.createElement('track');
      trackElement.id = 'subtitle-track';
      trackElement.setAttribute('kind', 'subtitles');
      trackElement.setAttribute('srclang', 'en');
      trackElement.setAttribute('label', 'English');
      trackElement.setAttribute('default', '');
      videoElement.appendChild(trackElement);
    }

    // Update track src
    trackElement.src = vttUrl;
    console.log('[SubtitleUtils] Subtitle track src set to:', vttUrl);

    // Function to enable text tracks
    const enableTextTracks = () => {
      const textTracks = videoElement.textTracks;
      console.log('[SubtitleUtils] Text tracks found:', textTracks ? textTracks.length : 0);
      
      if (textTracks && textTracks.length > 0) {
        for (let i = 0; i < textTracks.length; i++) {
          const track = textTracks[i];
          console.log('[SubtitleUtils] Track', i, ':', track.kind, track.label, 'mode:', track.mode);
          
          if (track.kind === 'subtitles' || track.kind === 'captions') {
            track.mode = 'showing';
            console.log('[SubtitleUtils] Track', i, 'mode set to:', track.mode);
          }
        }
      } else {
        console.warn('[SubtitleUtils] No text tracks available yet, will retry...');
      }
    };

    // Enable tracks immediately
    enableTextTracks();

    // Also enable when track loads
    trackElement.addEventListener('load', () => {
      console.log('[SubtitleUtils] Track loaded event fired');
      enableTextTracks();
    });

    // Enable on video loadstart
    videoElement.addEventListener('loadstart', () => {
      setTimeout(enableTextTracks, 500);
    });

    // Enable on loadedmetadata
    videoElement.addEventListener('loadedmetadata', () => {
      setTimeout(enableTextTracks, 500);
    });

    // Retry enabling tracks after delays
    setTimeout(enableTextTracks, 1000);
    setTimeout(enableTextTracks, 2000);

    return true;
  } catch (error) {
    console.error('[SubtitleUtils] Error applying subtitles:', error);
    return false;
  }
}

/**
 * Apply subtitles to Video.js player instance
 * 
 * @param {Object} player - Video.js player instance
 * @param {string} vttUrl - The URL to the VTT subtitle file
 * @returns {boolean} - Returns true if subtitle was applied successfully
 */
export function applySubtitlesToVideoJS(player, vttUrl) {
  if (!player || !vttUrl) {
    console.warn('[SubtitleUtils] Player or VTT URL missing');
    return false;
  }

  try {
    const videoElement = player.el().querySelector('video');
    if (!videoElement) {
      console.warn('[SubtitleUtils] Video element not found in Video.js player');
      return false;
    }

    // Use the main applySubtitles function
    return applySubtitles(vttUrl, videoElement);
  } catch (error) {
    console.error('[SubtitleUtils] Error applying subtitles to Video.js:', error);
    return false;
  }
}

/**
 * Get the subtitle track element from a video element
 * 
 * @param {HTMLElement|string} videoElementOrId - Video element or its ID
 * @returns {HTMLElement|null} - The track element or null if not found
 */
export function getSubtitleTrack(videoElementOrId = null) {
  try {
    let videoElement = null;

    if (videoElementOrId) {
      if (typeof videoElementOrId === 'string') {
        videoElement = document.getElementById(videoElementOrId);
      } else {
        videoElement = videoElementOrId;
      }
    } else {
      videoElement = document.querySelector('video');
    }

    if (!videoElement) {
      return null;
    }

    return videoElement.querySelector('#subtitle-track') || 
           videoElement.querySelector('track[kind="subtitles"]');
  } catch (error) {
    console.error('[SubtitleUtils] Error getting subtitle track:', error);
    return null;
  }
}

