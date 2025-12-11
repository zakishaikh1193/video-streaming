import { useEffect, useState } from 'react';
import { RotateCcw, Copy, Check, Search, Trash2, AlertCircle, Download, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../services/api';

// Safe QR Code component wrapper
function SafeQRCode({ value, size = 120 }) {
  const [hasError, setHasError] = useState(false);
  
  if (hasError || !value) {
    return (
      <div className="w-30 h-30 flex items-center justify-center text-red-500 text-xs text-center p-2">
        <div>
          <AlertCircle className="w-6 h-6 mx-auto mb-1" />
          <p className="text-xs">QR Error</p>
        </div>
      </div>
    );
  }
  
  try {
    return (
      <QRCodeSVG
        value={value}
        size={size}
        level="M"
        onError={() => setHasError(true)}
      />
    );
  } catch (err) {
    console.error('QR Code rendering error:', err);
    return (
      <div className="w-30 h-30 flex items-center justify-center text-red-500 text-xs text-center p-2">
        <div>
          <AlertCircle className="w-6 h-6 mx-auto mb-1" />
          <p className="text-xs">Error</p>
        </div>
      </div>
    );
  }
}

function VideosTrash() {
  const [deletedVideos, setDeletedVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [restoringId, setRestoringId] = useState(null);

  useEffect(() => {
    loadDeletedVideos();
  }, []);

  useEffect(() => {
    filterVideos();
  }, [searchTerm, deletedVideos]);

  const loadDeletedVideos = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/videos/deleted');
      
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from server');
      }
      
      setDeletedVideos(response.data);
      setFilteredVideos(response.data);
    } catch (err) {
      console.error('Failed to load deleted videos:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
        url: err.config?.url
      });
      
      let errorMessage = 'Failed to load deleted videos';
      
      if (err.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (err.response?.status === 403) {
        errorMessage = 'Access forbidden. You do not have permission to view deleted videos.';
      } else if (err.response?.status === 404) {
        errorMessage = 'Deleted videos endpoint not found. Please check backend configuration.';
      } else if (err.response?.status >= 500) {
        errorMessage = `Server error: ${err.response?.data?.message || err.response?.data?.error || 'Please try again later or contact support.'}`;
      } else if (!err.response) {
        errorMessage = 'Network error. Please check your connection and ensure the backend server is running.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filterVideos = () => {
    let filtered = [...deletedVideos];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(term) ||
        item.videoId?.toLowerCase().includes(term) ||
        item.course?.toLowerCase().includes(term) ||
        item.subject?.toLowerCase().includes(term) ||
        item.grade?.toString().includes(term) ||
        item.lesson?.toLowerCase().includes(term) ||
        item.module?.toLowerCase().includes(term) ||
        item.shortSlug?.toLowerCase().includes(term)
      );
    }

    setFilteredVideos(filtered);
  };

  const handleCopy = async (url, id) => {
    try {
      if (!navigator.clipboard) {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        return;
      }
      
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy URL to clipboard. Please copy manually: ' + url);
    }
  };

  const handleRestore = async (videoId, id) => {
    if (!window.confirm(`Are you sure you want to restore "${videoId}"?`)) {
      return;
    }

    try {
      setRestoringId(id);
      const response = await api.post(`/videos/${id}/restore`);
      
      if (response.data.message) {
        // Remove from list
        setDeletedVideos(prev => prev.filter(v => v.id !== id));
        setFilteredVideos(prev => prev.filter(v => v.id !== id));
        
        // Show success message
        alert('Video restored successfully!');
      }
    } catch (err) {
      console.error('Failed to restore video:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to restore video';
      alert(`Failed to restore video: ${errorMessage}`);
    } finally {
      setRestoringId(null);
    }
  };

  const handleDownloadQR = async (videoId, videoData) => {
    try {
      if (!videoId) {
        throw new Error('Video ID is required');
      }
      
      const response = await api.get(`/videos/${videoId}/qr-download`, {
        responseType: 'blob',
        timeout: 30000
      });
      
      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response from server');
      }
      
      const parts = [];
      if (videoData?.grade) parts.push(`G${videoData.grade}`);
      if (videoData?.lesson) parts.push(`L${videoData.lesson}`);
      if (videoData?.course) parts.push(`U${videoData.course}`);
      if (videoData?.module) parts.push(`M${videoData.module}`);
      
      const filename = parts.length > 0 
        ? parts.join('_') + '.png'
        : `${videoId}_qr_code.png`;
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download QR code:', err);
      let errorMessage = 'Unknown error';
      
      if (err.response?.status === 404) {
        errorMessage = 'QR code file not found. It will be generated automatically on next request.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      alert(`Failed to download QR code: ${errorMessage}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading deleted videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Deleted Videos</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={loadDeletedVideos}
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50">
      <div className="w-full p-4 sm:p-6 lg:p-8 xl:p-10">
        {/* Header Container */}
        <div className="mb-8 lg:mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-red-500 via-orange-500 to-red-600 rounded-2xl shadow-xl shadow-red-500/20">
              <Trash2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Videos Trash</h1>
              <p className="text-slate-600 text-base sm:text-lg">Restore deleted videos and manage their QR codes</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-6 sm:p-8 mb-6 lg:mb-8">
          <div className="flex flex-col md:flex-row gap-4 lg:gap-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 z-10" />
              <input
                type="text"
                placeholder="Search by title, video ID, course, grade, lesson..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white hover:border-slate-300 transition-all text-[15px]"
              />
            </div>
            <div className="flex items-center px-5 py-3.5 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border-2 border-red-200 shadow-sm">
              <span className="text-sm font-bold text-red-700">
                {filteredVideos.length} {filteredVideos.length === 1 ? 'Deleted Video' : 'Deleted Videos'}
              </span>
            </div>
          </div>
        </div>

        {/* Videos Container */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-6 sm:p-8">
          {filteredVideos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-10 h-10 text-red-500" />
              </div>
              <p className="text-slate-600 text-lg sm:text-xl font-bold mb-2">No deleted videos found</p>
              <p className="text-slate-500 text-sm mb-6">Trash is empty or no videos match your search</p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:from-red-700 hover:to-orange-700 transition-all font-semibold shadow-lg hover:shadow-xl"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVideos.map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-xl shadow-lg border-2 border-slate-200 p-5 sm:p-6 hover:shadow-2xl transition-all duration-300 hover:border-red-400"
                >
                  {/* Horizontal Container */}
                  <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                    {/* QR Code Section */}
                    <div className="flex-shrink-0">
                      <div className="bg-gradient-to-br from-red-50 via-orange-50 to-red-50 p-4 rounded-xl border-2 border-red-200 flex justify-center shadow-inner">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                          <SafeQRCode value={video.shortUrl} size={120} />
                        </div>
                      </div>
                    </div>

                    {/* Video Info Section */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-4">
                        <h3 className="font-bold text-xl sm:text-2xl text-slate-900 mb-2 line-clamp-2">
                          {video.title || 'Untitled Video'}
                        </h3>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {video.course && (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-300 shadow-sm">
                              {video.course}
                            </span>
                          )}
                          {video.grade && (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-lg text-xs font-bold border border-green-300 shadow-sm">
                              Grade {video.grade}
                            </span>
                          )}
                          {video.lesson && (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-lg text-xs font-bold border border-purple-300 shadow-sm">
                              {video.lesson}
                            </span>
                          )}
                          {video.module && (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-300 shadow-sm">
                              Module {video.module}
                            </span>
                          )}
                        </div>

                        {/* Short URL */}
                        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-3 border-2 border-slate-200 mb-3">
                          <p className="text-xs text-slate-600 mb-2 font-bold uppercase tracking-wide">
                            Short Link
                          </p>
                          <div className="flex items-center gap-2 bg-white rounded-lg p-2 border border-slate-200">
                            <input
                              type="text"
                              value={video.shortUrl}
                              readOnly
                              className="flex-1 text-xs sm:text-sm font-mono text-slate-700 bg-transparent border-none focus:outline-none truncate"
                            />
                            <button
                              onClick={() => handleCopy(video.shortUrl, video.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
                              title="Copy URL"
                            >
                              {copiedId === video.id ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4 text-slate-600 hover:text-red-600" />
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-slate-500 mt-2 font-medium">
                            Video ID: <span className="font-mono">{video.videoId}</span>
                          </p>
                          {video.deletedAt && (
                            <p className="text-xs text-red-500 mt-1 font-medium">
                              Deleted: {new Date(video.deletedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions Section */}
                    <div className="flex-shrink-0 flex flex-col gap-2 w-full lg:w-auto">
                      <button
                        onClick={() => handleRestore(video.videoId, video.id)}
                        disabled={restoringId === video.id}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {restoringId === video.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Restoring...</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-5 h-5" />
                            <span>Restore</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDownloadQR(video.videoId, video)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download QR</span>
                      </button>
                      <a
                        href={video.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-xl hover:from-slate-200 hover:to-slate-300 transition-all font-bold text-sm border-2 border-slate-300 shadow-sm hover:shadow-md transform hover:scale-105"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideosTrash;

