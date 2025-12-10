import api from './api';

/**
 * Generate subtitles from a video file using Whisper.cpp backend
 * @param {File} videoFile - The video file to process
 * @param {Function} onProgress - Optional progress callback (progress: number) => void
 * @returns {Promise<{vttUrl: string}>} Object containing the VTT file URL
 */
export async function generateSubtitles(videoFile, onProgress = null) {
  if (!videoFile) {
    throw new Error('Video file is required');
  }

  const formData = new FormData();
  formData.append('video', videoFile);

  try {
    // Note: We use fetch directly here because axios might not handle FormData progress well
    const response = await fetch('/api/subtitles/generate', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary
      headers: {
        // Authorization header if needed
        ...(localStorage.getItem('token') && {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        })
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || errorData.details || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[SubtitleService] Error generating subtitles:', error);
    throw error;
  }
}

/**
 * Generate subtitles using the API service (alternative method)
 * @param {File} videoFile - The video file to process
 * @returns {Promise<{vttUrl: string}>} Object containing the VTT file URL
 */
export async function generateSubtitlesWithApi(videoFile) {
  if (!videoFile) {
    throw new Error('Video file is required');
  }

  const formData = new FormData();
  formData.append('video', videoFile);

  try {
    const response = await api.post('/subtitles/generate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  } catch (error) {
    console.error('[SubtitleService] Error generating subtitles:', error);
    throw new Error(error.response?.data?.error || error.response?.data?.details || error.message);
  }
}

