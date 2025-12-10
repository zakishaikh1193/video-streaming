/**
 * Example Component: How to Add Auto-Generated Subtitles to Your Video Player
 * 
 * This is a reference implementation showing how to:
 * 1. Upload a video file
 * 2. Generate subtitles using the backend
 * 3. Add subtitles to your existing VideoPlayer component
 * 
 * You can integrate this logic into your existing video upload/edit pages.
 */

import { useState } from 'react';
import { generateSubtitles } from '../services/subtitleService';
import VideoPlayer from './VideoPlayer';

export default function SubtitleGeneratorExample() {
  const [videoFile, setVideoFile] = useState(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [vttUrl, setVttUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoSrc(URL.createObjectURL(file));
      setVttUrl(null);
      setError(null);
    }
  };

  const handleGenerateSubtitles = async () => {
    if (!videoFile) {
      setError('Please select a video file first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await generateSubtitles(videoFile);
      setVttUrl(result.vttUrl);
      console.log('Subtitles generated! VTT URL:', result.vttUrl);
    } catch (err) {
      console.error('Error generating subtitles:', err);
      setError(err.message || 'Failed to generate subtitles');
    } finally {
      setLoading(false);
    }
  };

  // Build captions array for VideoPlayer
  const captions = vttUrl ? [{
    src: vttUrl,
    label: 'English',
    language: 'en',
    default: true
  }] : [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Subtitle Generator Example</h2>
      
      <div className="mb-4">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          className="mb-2"
        />
        <button
          onClick={handleGenerateSubtitles}
          disabled={!videoFile || loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Generating Subtitles...' : 'Generate Subtitles'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      {vttUrl && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
          Subtitles generated! VTT URL: {vttUrl}
        </div>
      )}

      {videoSrc && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Video Player with Subtitles</h3>
          {/* Your existing VideoPlayer component - just pass the captions prop */}
          <VideoPlayer
            src={videoSrc}
            captions={captions}  // ← This is all you need to add!
            autoplay={false}
            videoId="subtitle-example"
          />
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h4 className="font-semibold mb-2">Integration Notes:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>The VideoPlayer component already supports the <code>captions</code> prop</li>
          <li>Just pass an array of caption objects with <code>src</code>, <code>label</code>, and <code>language</code></li>
          <li>The backend generates VTT files and serves them from <code>/subtitles/</code></li>
          <li>You can integrate this into your video upload/edit pages</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * MINIMAL INTEGRATION EXAMPLE:
 * 
 * In your video upload/edit page, add this:
 * 
 * import { generateSubtitles } from '../services/subtitleService';
 * 
 * // After video upload, generate subtitles:
 * const handleVideoUpload = async (videoFile) => {
 *   // ... your existing upload logic ...
 *   
 *   // Generate subtitles
 *   try {
 *     const subtitleResult = await generateSubtitles(videoFile);
 *     const vttUrl = subtitleResult.vttUrl;
 *     
 *     // Save vttUrl to your database or state
 *     // Then pass it to VideoPlayer:
 *     const captions = [{
 *       src: vttUrl,
 *       label: 'English',
 *       language: 'en',
 *       default: true
 *     }];
 *     
 *     // Use in VideoPlayer:
 *     <VideoPlayer src={videoUrl} captions={captions} />
 *   } catch (error) {
 *     console.error('Subtitle generation failed:', error);
 *   }
 * };
 */

