import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileVideo, Trash2, RefreshCw, CheckCircle, XCircle, AlertCircle, HardDrive, Edit2, Plus, FileText, Download, Upload, Link as LinkIcon, Hash } from 'lucide-react';
import api from '../services/api';
import { getBackendBaseUrl } from '../utils/apiConfig';

function MyStorageManager() {
  const navigate = useNavigate();
  
  // State
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorDetails, setErrorDetails] = useState(null);
  const [success, setSuccess] = useState('');
  const [selectedVideos, setSelectedVideos] = useState([]);
  const [editingVideo, setEditingVideo] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [stagedFiles, setStagedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load videos from database
  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    setError('');
    setErrorDetails(null);
    try {
      const response = await api.get('/videos?status=active');
      let videosData = response.data || [];
      
      // Filter out old videos with empty course, unit, and module (old structure)
      videosData = videosData.filter(video => {
        // Keep videos that have at least course, unit, or module, OR have a strong ID format
        const hasStrongId = /^VID_[A-Z0-9]{10}$/.test(video.video_id);
        const hasMetadata = video.course || video.unit || video.module || video.grade || video.lesson;
        return hasStrongId || hasMetadata;
      });
      
      // Detect duplicate titles
      const titleCounts = {};
      videosData.forEach(video => {
        const title = (video.title || '').trim();
        if (title) {
          titleCounts[title] = (titleCounts[title] || 0) + 1;
        }
      });
      
      // Add duplicate status to videos
      videosData = videosData.map(video => {
        const title = (video.title || '').trim();
        const isDuplicate = title && titleCounts[title] > 1;
        return {
          ...video,
          isDuplicate,
          duplicateCount: title ? titleCounts[title] : 0
        };
      });
      
      setVideos(videosData);
      if (videosData.length === 0) {
        setError('No videos found. Upload some videos first.');
      }
    } catch (err) {
      console.error('Failed to load videos:', err);
      setError(err.response?.data?.error || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  // Handle multi-file select from PC
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const backendBase = getBackendBaseUrl();

    const existingIds = new Set(stagedFiles.map((f) => f.videoId));
    const makeDraftId = () => {
      let draft;
      do {
        // Strong and short ID: timestamp (base36, 5 chars) + random (base36, 5 chars) = 10 chars total
        // Format: VID_XXXXXXXXXX (short but strong)
        const timestamp = Date.now().toString(36).slice(-5).toUpperCase();
        const random = Math.random().toString(36).slice(2, 7).toUpperCase();
        draft = `VID_${timestamp}${random}`;
      } while (existingIds.has(draft));
      existingIds.add(draft);
      return draft;
    };

    const newStaged = files.map((file) => {
      const extMatch = file.name.match(/\.[^/.]+$/);
      const ext = extMatch ? extMatch[0] : '.mp4';
      const videoId = makeDraftId();
      return {
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        videoId,
        plannedPath: `upload/${videoId}${ext}`,
        previewUrl: `${backendBase}/api/s/${videoId}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        grade: '',
        lesson: '',
        unit: '',
        course: '',
        module: '',
        description: ''
      };
    });

    setStagedFiles((prev) => [...prev, ...newStaged]);
    e.target.value = '';
  };

  const updateStagedField = (id, field, value) => {
    setStagedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const removeStaged = (id) => {
    setStagedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const clearStaged = () => {
    setStagedFiles([]);
    setUploadProgress(0);
  };

  const uploadStaged = async () => {
    if (stagedFiles.length === 0) {
      setError('Please add at least one video file.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');
    setErrorDetails(null);
    setSuccess('');

    try {
      for (let i = 0; i < stagedFiles.length; i++) {
        const item = stagedFiles[i];
        const formData = new FormData();
        formData.append('video', item.file);
        formData.append('title', item.title || item.file.name);
        formData.append('videoId', item.videoId || '');
        formData.append('plannedPath', item.plannedPath || '');
        formData.append('grade', item.grade || '');
        formData.append('lesson', item.lesson || '');
        formData.append('module', item.module || '');
        formData.append('description', item.description || '');
        formData.append('course', item.course || item.unit || ''); // use course field, fallback to unit

        try {
          await api.post('/videos/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });

          const percent = Math.round(((i + 1) / stagedFiles.length) * 100);
          setUploadProgress(percent);
        } catch (uploadErr) {
          // Detailed diagnostics for this specific file upload
          const diagnostics = {
            fileName: item.file?.name || 'Unknown',
            fileSize: item.file?.size || 0,
            fileType: item.file?.type || 'Unknown',
            videoId: item.videoId || 'Not provided',
            plannedPath: item.plannedPath || 'Not provided',
            title: item.title || item.file?.name || 'Not provided',
            grade: item.grade || '',
            lesson: item.lesson || '',
            module: item.module || '',
            unit: item.unit || '',
            course: item.course || '',
            description: item.description || '',
            error: {
              message: uploadErr.message || 'Unknown error',
              code: uploadErr.code || 'NO_CODE',
              status: uploadErr.response?.status || 'NO_STATUS',
              statusText: uploadErr.response?.statusText || 'NO_STATUS_TEXT',
              responseData: uploadErr.response?.data || null,
              requestUrl: uploadErr.config?.url || 'Unknown',
              requestMethod: uploadErr.config?.method?.toUpperCase() || 'UNKNOWN',
            },
            timestamp: new Date().toISOString()
          };

          console.error('===== UPLOAD DIAGNOSTICS =====');
          console.error('Failed File:', diagnostics.fileName);
          console.error('File Size:', diagnostics.fileSize, 'bytes');
          console.error('Video ID:', diagnostics.videoId);
          console.error('Error Status:', diagnostics.error.status);
          console.error('Error Message:', diagnostics.error.message);
          console.error('Response Data:', diagnostics.error.responseData);
          console.error('Full Error Object:', uploadErr);
          console.error('==============================');

          setErrorDetails({ ...diagnostics, expanded: false });
          
          const apiMessage = uploadErr.response?.data?.message || uploadErr.response?.data?.error || uploadErr.message;
          const status = uploadErr.response?.status;
          const sqlMessage = uploadErr.response?.data?.sqlMessage;
          
          let errorMsg = `Failed to upload "${item.file?.name || 'video'}"`;
          if (status) errorMsg += ` (HTTP ${status})`;
          if (apiMessage) errorMsg += `: ${apiMessage}`;
          if (sqlMessage) errorMsg += ` [SQL: ${sqlMessage}]`;
          
          setError(errorMsg);
          throw uploadErr; // Re-throw to stop the loop
        }
      }

      setSuccess(`Uploaded ${stagedFiles.length} video(s) successfully`);
      clearStaged();
      loadVideos();
    } catch (err) {
      // This catch handles any other errors
      if (!errorDetails) {
        console.error('Upload error (general):', err);
        const apiMessage = err.response?.data?.message || err.response?.data?.error;
        const status = err.response?.status;
        const detail = apiMessage
          ? `${apiMessage}${status ? ` (status ${status})` : ''}`
          : 'Failed to upload videos';
        setError(detail);
      }
    } finally {
      setUploading(false);
    }
  };

  const generateCSV = async () => {
    if (videos.length === 0) {
      setError('No videos available to generate CSV');
      return;
    }

    try {
    setLoading(true);
    setError('');
      
      const response = await api.get('/videos/export-csv', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `videos_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSuccess(`CSV generated successfully with ${videos.length} video(s)!`);
    } catch (err) {
      console.error('CSV generation error:', err);
      setError(err.response?.data?.error || 'Failed to generate CSV');
    } finally {
      setLoading(false);
    }
  };

  // Delete video
  const handleDeleteVideo = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      await api.delete(`/videos/${id}`);
      setSuccess('Video deleted successfully');
      loadVideos();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.error || 'Failed to delete video');
    }
  };

  // Delete selected videos
  const handleDeleteSelected = async () => {
    if (selectedVideos.length === 0) {
      setError('Please select at least one video to delete');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedVideos.length} video(s)?`)) {
      return;
    }

    setLoading(true);
    try {
      const deletePromises = selectedVideos.map(id => api.delete(`/videos/${id}`));
      await Promise.all(deletePromises);
      setSuccess(`${selectedVideos.length} video(s) deleted successfully`);
      setSelectedVideos([]);
      loadVideos();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.error || 'Failed to delete videos');
    } finally {
      setLoading(false);
    }
  };

  // Select/deselect video
  const handleSelectVideo = (id) => {
    if (selectedVideos.includes(id)) {
      setSelectedVideos(selectedVideos.filter(vid => vid !== id));
    } else {
      setSelectedVideos([...selectedVideos, id]);
    }
  };

  // Select all/deselect all
  const handleSelectAll = () => {
    if (selectedVideos.length === videos.length) {
      setSelectedVideos([]);
    } else {
      setSelectedVideos(videos.map(v => v.id));
    }
  };

  // Start editing video
  const handleEditVideo = (video) => {
    setEditingVideo(video.id);
    setEditFormData({
      grade: video.grade || '',
      lesson: video.lesson || '',
      course: video.course || '',
      unit: video.unit || '',
      module: video.module || '',
      title: video.title || '',
      description: video.description || ''
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingVideo(null);
    setEditFormData({});
  };

  // Save edited video
  const handleSaveEdit = async (id) => {
    try {
      await api.put(`/videos/${id}`, editFormData);
      setSuccess('Video updated successfully');
      setEditingVideo(null);
      setEditFormData({});
      loadVideos();
    } catch (err) {
      console.error('Update error:', err);
      setError(err.response?.data?.error || 'Failed to update video');
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 lg:p-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl shadow-lg">
                <HardDrive className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  My Storage
                </h1>
                <p className="text-slate-600 text-lg">Manage your videos stored locally in backend/upload/</p>
              </div>
            </div>
              <div className="flex gap-3 flex-wrap">
                <label className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] cursor-pointer">
                  <Upload className="w-5 h-5" />
                  <span>Upload from PC (multiple)</span>
                  <input
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
            
            <button
                  onClick={loadVideos}
                  disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:scale-[1.02] font-semibold"
            >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
            </button>
              </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 space-y-4">
            <div className="p-5 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
                <div className="font-medium mb-2">{error}</div>
                {errorDetails && (
                  <button
                    onClick={() => setErrorDetails(prev => ({ ...prev, expanded: !prev.expanded }))}
                    className="text-sm text-red-600 hover:text-red-800 underline"
                  >
                    {errorDetails.expanded ? 'Hide' : 'Show'} Diagnostics
                  </button>
                )}
              </div>
              <button onClick={() => { setError(''); setErrorDetails(null); }} className="text-red-500 hover:text-red-700 transition-colors">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
            
            {/* Detailed Diagnostics */}
            {errorDetails && errorDetails.expanded && (
              <div className="bg-slate-900 text-slate-100 rounded-xl p-6 shadow-lg border border-slate-700 font-mono text-sm overflow-auto max-h-96">
                <div className="mb-4 pb-3 border-b border-slate-700">
                  <h4 className="text-lg font-bold text-red-400 mb-2">🔍 Upload Diagnostics</h4>
                  <div className="text-xs text-slate-400">Timestamp: {errorDetails.timestamp}</div>
          </div>
                
                <div className="space-y-4">
                  {/* File Information */}
                  <div>
                    <div className="text-yellow-400 font-semibold mb-2">📁 File Information</div>
                    <div className="pl-4 space-y-1 text-slate-300">
                      <div>Name: <span className="text-white">{errorDetails.fileName}</span></div>
                      <div>Size: <span className="text-white">{formatFileSize(errorDetails.fileSize)} ({errorDetails.fileSize} bytes)</span></div>
                      <div>Type: <span className="text-white">{errorDetails.fileType}</span></div>
              </div>
            </div>

                  {/* Metadata Information */}
                  <div>
                    <div className="text-yellow-400 font-semibold mb-2">📋 Metadata</div>
                    <div className="pl-4 space-y-1 text-slate-300">
                      <div>Video ID: <span className="text-white">{errorDetails.videoId || 'Not provided'}</span></div>
                      <div>Planned Path: <span className="text-white">{errorDetails.plannedPath || 'Not provided'}</span></div>
                      <div>Title: <span className="text-white">{errorDetails.title || 'Not provided'}</span></div>
                      <div>Grade: <span className="text-white">{errorDetails.grade || 'Not provided'}</span></div>
                      <div>Lesson: <span className="text-white">{errorDetails.lesson || 'Not provided'}</span></div>
                      <div>Module: <span className="text-white">{errorDetails.module || 'Not provided'}</span></div>
                      <div>Unit: <span className="text-white">{errorDetails.unit || 'Not provided'}</span></div>
                      <div>Description: <span className="text-white">{errorDetails.description || 'Not provided'}</span></div>
                    </div>
                  </div>

                  {/* Error Information */}
                  <div>
                    <div className="text-red-400 font-semibold mb-2">❌ Error Details</div>
                    <div className="pl-4 space-y-1 text-slate-300">
                      <div>Message: <span className="text-red-300">{errorDetails.error.message}</span></div>
                      <div>Code: <span className="text-white">{errorDetails.error.code}</span></div>
                      <div>HTTP Status: <span className="text-red-300">{errorDetails.error.status} {errorDetails.error.statusText}</span></div>
                      <div>Request: <span className="text-white">{errorDetails.error.requestMethod} {errorDetails.error.requestUrl}</span></div>
                      {errorDetails.error.responseData && (
                        <div className="mt-2">
                          <div className="text-yellow-400 mb-1">Response Data:</div>
                          <pre className="bg-slate-800 p-3 rounded text-xs overflow-auto max-h-48 text-slate-200">
                            {JSON.stringify(errorDetails.error.responseData, null, 2)}
                          </pre>
                        </div>
                      )}
                      {errorDetails.error.responseData?.sqlMessage && (
                        <div className="mt-2">
                          <div className="text-red-400 mb-1">SQL Error:</div>
                          <div className="bg-red-900/30 p-2 rounded text-red-200">
                            {errorDetails.error.responseData.sqlMessage}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Staged uploads from PC */}
        {stagedFiles.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <Upload className="w-5 h-5 text-emerald-600" />
                  </div>
                Staged Videos ({stagedFiles.length})
              </h3>
                <div className="flex gap-2 flex-wrap">
                    <button
                  onClick={uploadStaged}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] disabled:bg-gray-400"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading... {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload {stagedFiles.length} file(s)
                    </>
                  )}
                </button>
                  <button
                  onClick={() => clearStaged()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all duration-200 font-semibold"
                >
                  <XCircle className="w-4 h-4" />
                  Clear
                  </button>
                  <button
                  onClick={() => {
                    // Generate CSV from staged files client-side
                    const headers = ['ID', 'Title', 'Planned Path', 'Preview URL', 'Course', 'Grade', 'Unit', 'Lesson', 'Module', 'Description'];
                    const rows = stagedFiles.map((f) => [
                      f.videoId || '',
                      f.title || f.file.name.replace(/\.[^/.]+$/, ''),
                      f.plannedPath || '',
                      f.previewUrl || '',
                      f.course || '',
                      f.grade || '',
                      f.unit || '',
                      f.lesson || '',
                      f.module || '',
                      f.description || ''
                    ]);
                    const escapeCSV = (value) => {
                      const cell = String(value || '').trim();
                      return cell.includes(',') || cell.includes('"') || cell.includes('\n') || cell.includes('\r')
                        ? `"${cell.replace(/"/g, '""')}"`
                        : cell;
                    };
                    const csvContent = [
                      headers.join(','),
                      ...rows.map((row) => row.map(escapeCSV).join(',')),
                    ].join('\\r\\n');
                    const blob = new Blob(['\\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `staged_videos_${Date.now()}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg hover:scale-[1.02]"
                >
                  <FileText className="w-4 h-4" />
                  CSV (staged)
                  </button>
              </div>
            </div>

            {uploading && (
              <div className="mb-4">
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-green-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                            </div>
                <div className="text-sm text-slate-600 mt-2">Uploading... {uploadProgress}%</div>
                              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-slate-50 to-emerald-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Draft ID</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Planned URL</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Planned Path</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Lesson</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Module</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {stagedFiles.map((item, idx) => (
                    <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-6 py-3">
                        <div className="text-xs font-mono text-slate-800 bg-slate-100 px-3 py-2 rounded-lg">
                          {item.videoId}
                            </div>
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={item.title}
                          onChange={(e) => updateStagedField(item.id, 'title', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <div className="text-xs text-blue-700 font-mono bg-blue-50 px-3 py-2 rounded-lg break-all">
                          {item.previewUrl}
                          </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="text-xs text-slate-700 font-mono bg-slate-50 px-3 py-2 rounded-lg">
                          {item.plannedPath}
                </div>
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={item.course || ''}
                          onChange={(e) => updateStagedField(item.id, 'course', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Course name"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={item.grade}
                          onChange={(e) => updateStagedField(item.id, 'grade', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => updateStagedField(item.id, 'unit', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={item.lesson}
                          onChange={(e) => updateStagedField(item.id, 'lesson', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <input
                          type="text"
                          value={item.module}
                          onChange={(e) => updateStagedField(item.id, 'module', e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-3">
                        <textarea
                          value={item.description}
                          onChange={(e) => updateStagedField(item.id, 'description', e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          placeholder="Enter description..."
                        />
                      </td>
                      <td className="px-6 py-3 text-center">
                            <button
                          onClick={() => removeStaged(item.id)}
                          disabled={uploading}
                          className="text-red-500 hover:text-red-600 transition-all duration-200 p-2 hover:bg-red-50 rounded-xl hover:scale-110 disabled:text-red-300"
                          title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
                          </div>
                </div>
              )}

        {success && (
          <div className="mb-6 p-5 bg-green-50 border-l-4 border-green-500 rounded-xl text-green-700 flex items-start gap-3 shadow-sm">
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 font-medium">{success}</div>
            <button onClick={() => setSuccess('')} className="text-green-500 hover:text-green-700 transition-colors">
              <XCircle className="w-5 h-5" />
                  </button>
              </div>
        )}

        {/* Videos Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Table Header with Actions */}
          <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-teal-50 to-cyan-50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                  <div className="p-2 bg-teal-100 rounded-xl">
                  <FileVideo className="w-5 h-5 text-teal-600" />
                  </div>
                Videos
                  <span className="ml-2 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold">
                  {videos.length}
                  </span>
                </h2>
                <div className="flex items-center gap-2 flex-wrap">
                {selectedVideos.length > 0 && (
                    <button
                    onClick={handleDeleteSelected}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 font-semibold shadow-md hover:shadow-lg hover:scale-[1.02]"
                    >
                      <Trash2 className="w-4 h-4" />
                    Delete ({selectedVideos.length})
                    </button>
                  )}
                
                </div>
              </div>
            {videos.length > 0 && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                  checked={selectedVideos.length === videos.length && videos.length > 0}
                  onChange={handleSelectAll}
                    className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                  />
                  <label className="text-sm text-slate-700 cursor-pointer font-medium">
                  {selectedVideos.length === videos.length && videos.length > 0 ? 'Deselect All' : 'Select All'}
                  </label>
                {selectedVideos.length > 0 && (
                    <span className="text-sm text-slate-600 ml-2">
                    ({selectedVideos.length} selected)
                    </span>
                  )}
                </div>
              )}
            </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                </div>
            ) : videos.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 border-2 border-dashed border-slate-200 m-6 rounded-xl">
                <FileVideo className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <div className="text-slate-600 font-semibold mb-2">No videos found</div>
                <div className="text-slate-500 text-sm mb-4">Upload videos to see them here</div>
                
                </div>
              ) : (
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-slate-50 to-teal-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-12">
                          <input
                            type="checkbox"
                        checked={selectedVideos.length === videos.length && videos.length > 0}
                        onChange={handleSelectAll}
                            className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                          />
                        </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Grade</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Unit</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Lesson</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Module</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">File Path</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider">Size</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                  {videos.map((video, index) => {
                    const isSelected = selectedVideos.includes(video.id);
                    const isEditing = editingVideo === video.id;
                          return (
                      <tr key={video.id} className={`transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50'} ${isSelected ? 'bg-blue-50' : ''} hover:bg-blue-50/50`}>
                            <td className="px-6 py-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                            onChange={() => handleSelectVideo(video.id)}
                                className="w-4 h-4 text-teal-600 border-slate-300 rounded focus:ring-teal-500"
                              />
                            </td>
                            <td className="px-6 py-4">
                          <code className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-lg font-mono">
                            {video.video_id}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFormData.title || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <div className="text-sm font-semibold text-slate-900">{video.title || video.video_id}</div>
                          )}
                            </td>
                            <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFormData.course || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, course: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <div className="text-sm text-slate-700 font-semibold">{video.course || (video.course === null || video.course === undefined ? '-' : '')}</div>
                          )}
                        </td>
                            <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFormData.grade || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, grade: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <div className="text-sm text-slate-700">{video.grade || (video.grade === null || video.grade === undefined ? '-' : '')}</div>
                          )}
                            </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFormData.unit || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <div className="text-sm text-slate-700 font-semibold">{video.unit || (video.unit === null || video.unit === undefined ? '-' : '')}</div>
                          )}
                        </td>
                            <td className="px-6 py-4">
                          {isEditing ? (
                                    <input
                                      type="text"
                              value={editFormData.lesson || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, lesson: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <div className="text-sm text-slate-700">{video.lesson || (video.lesson === null || video.lesson === undefined ? '-' : '')}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editFormData.module || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, module: e.target.value })}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <div className="text-sm text-slate-700 font-semibold">{video.module || (video.module === null || video.module === undefined ? '-' : '')}</div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                          <div className="text-xs text-slate-600 font-mono bg-slate-50 px-3 py-2 rounded-lg truncate max-w-xs" title={video.file_path || 'N/A'}>
                            {video.file_path || 'N/A'}
                              </div>
                            </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-slate-700 font-semibold">{formatFileSize(video.size)}</div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isEditing ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleSaveEdit(video.id)}
                                    className="text-green-600 hover:text-green-700 transition-all duration-200 p-2 hover:bg-green-50 rounded-xl hover:scale-110"
                                    title="Save"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="text-slate-600 hover:text-slate-700 transition-all duration-200 p-2 hover:bg-slate-50 rounded-xl hover:scale-110"
                                    title="Cancel"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  {video.status === 'active' ? (
                                    video.isDuplicate ? (
                                      <span className="px-2 py-1 text-xs font-semibold bg-orange-100 text-orange-700 rounded-lg">
                                        Duplicate ({video.duplicateCount})
                                      </span>
                                    ) : (
                                      <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-lg">
                                        Active
                                      </span>
                                    )
                                  ) : video.status === 'failed' || !video.file_path ? (
                                    <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-lg">
                                      Failed
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg">
                                      {video.status || 'Unknown'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
              )}
            </div>
          </div>
      </div>
    </div>
  );
}

export default MyStorageManager;
