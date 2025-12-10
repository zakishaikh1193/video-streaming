import { useEffect, useState } from 'react';
import VideoPlayer from './VideoPlayer';

/**
 * VideoPlayerWithLocalCC
 * - Lets a user pick a video file
 * - Sends it to a local backend /generate-subtitles (Whisper.cpp + ffmpeg)
 * - Gets back a VTT URL and passes it to VideoPlayer as captions
 *
 * Props:
 * - backendUrl: URL of the subtitle server (default http://localhost:5000)
 */
export default function VideoPlayerWithLocalCC({ backendUrl = 'http://localhost:5000' }) {
  const [file, setFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [vttUrl, setVttUrl] = useState(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const url = URL.createObjectURL(f);
    setVideoUrl(url);
    setVttUrl(null);
    setStatus('Ready to generate subtitles');
  };

  const generateSubs = async () => {
    if (!file) {
      setStatus('Please choose a video file first');
      return;
    }
    setLoading(true);
    setStatus('Generating subtitles (Whisper.cpp + ffmpeg)...');
    try {
      const fd = new FormData();
      fd.append('video', file);
      const resp = await fetch(`${backendUrl}/generate-subtitles`, {
        method: 'POST',
        body: fd
      });
      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(txt || 'Subtitle generation failed');
      }
      const data = await resp.json();
      if (!data.vtt_url) throw new Error('No vtt_url returned');
      setVttUrl(data.vtt_url);
      setStatus('Subtitles ready. Click CC to toggle.');
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 16 }}>
      <h2>Video Player with Local Auto Subtitles (Whisper.cpp)</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="file" accept="video/*" onChange={handleFileChange} />
        <button onClick={generateSubs} disabled={!file || loading}>
          {loading ? 'Processing...' : 'Generate Subtitles'}
        </button>
      </div>
      <div style={{ marginTop: 12, color: '#888' }}>{status}</div>

      {videoUrl && (
        <div style={{ marginTop: 16 }}>
          <VideoPlayer
            src={videoUrl}
            captions={vttUrl ? [{ src: vttUrl, label: 'English', language: 'en', default: true }] : []}
            autoplay={false}
          />
        </div>
      )}
    </div>
  );
}

