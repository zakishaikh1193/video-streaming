import { useEffect, useRef, useState } from 'react';

/**
 * Video player with automatic subtitle generation via Whisper.
 * - User selects a video file
 * - Extracts audio in-browser (Web Audio + MediaRecorder)
 * - Sends audio to backend /api/generate-subtitles
 * - Receives VTT URL and attaches as <track>
 */
export default function VideoWithAutoSubs({ backendUrl = 'http://localhost:4000' }) {
  const videoRef = useRef(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [vttUrl, setVttUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');

  // Extract audio and send to backend
  const handleFile = async (file) => {
    setStatus('Loading video...');
    setLoading(true);
    const videoBlobUrl = URL.createObjectURL(file);
    setVideoSrc(videoBlobUrl);

    try {
      setStatus('Extracting audio...');
      const audioBlob = await extractAudio(file);
      setStatus('Generating subtitles (Whisper)...');

      const formData = new FormData();
      formData.append('audio', audioBlob, 'audio.webm');

      const resp = await fetch(`${backendUrl}/api/generate-subtitles`, {
        method: 'POST',
        body: formData
      });
      if (!resp.ok) {
        const msg = await resp.text();
        throw new Error(msg);
      }
      const data = await resp.json();
      setVttUrl(data.vttUrl);
      setStatus('Subtitles ready. Click CC to toggle.');
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Extract audio from video using Web Audio + MediaRecorder
  const extractAudio = async (file) => {
    return new Promise((resolve, reject) => {
      const videoEl = document.createElement('video');
      videoEl.src = URL.createObjectURL(file);
      videoEl.crossOrigin = 'anonymous';
      videoEl.muted = true;

      const audioContext = new AudioContext();
      const dest = audioContext.createMediaStreamDestination();
      const source = audioContext.createMediaElementSource(videoEl);
      source.connect(dest);
      source.connect(audioContext.destination);

      const recorder = new MediaRecorder(dest.stream);
      const chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        resolve(blob);
      };

      videoEl.onloadedmetadata = async () => {
        try {
          await videoEl.play();
          recorder.start();
          setTimeout(() => {
            recorder.stop();
            videoEl.pause();
            videoEl.src = '';
          }, videoEl.duration * 1000 + 500);
        } catch (err) {
          reject(err);
        }
      };
      videoEl.onerror = reject;
    });
  };

  useEffect(() => {
    return () => {
      if (videoSrc) URL.revokeObjectURL(videoSrc);
    };
  }, [videoSrc]);

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
      <h2>Video Player with Auto-Generated Subtitles (CC)</h2>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <div style={{ marginTop: 12, color: '#888' }}>
        {loading ? 'Processing… ' : ''}{status}
      </div>

      {videoSrc && (
        <div style={{ marginTop: 16, position: 'relative' }}>
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            crossOrigin="anonymous"
            style={{ width: '100%', borderRadius: 8, background: '#000' }}
          >
            {vttUrl && <track kind="subtitles" src={vttUrl} srcLang="en" label="English" default />}
          </video>
        </div>
      )}
    </div>
  );
}

