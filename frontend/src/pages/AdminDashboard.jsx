import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Video, 
  Upload, 
  FileVideo, 
  Link as LinkIcon, 
  TrendingUp, 
  Clock, 
  HardDrive,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  DollarSign,
  Activity,
  MoreVertical,
  Play,
  Users,
  Folder
} from 'lucide-react';
import api from '../services/api';

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalVideos: 0,
    activeVideos: 0,
    inactiveVideos: 0,
    totalSize: 0,
    totalDuration: 0,
    videosWithCaptions: 0,
    videosWithThumbnails: 0
  });
  const [recentVideos, setRecentVideos] = useState([]);
  const [videosByCourse, setVideosByCourse] = useState({});
  const [uploadActivity, setUploadActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backfilling, setBackfilling] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL videos for dashboard statistics (use high limit to get all)
      // For dashboard, we need complete stats, so fetch all videos
      const response = await api.get('/videos?limit=10000'); // High limit to get all videos
      
      // Handle both old format (array) and new format (object with videos and pagination)
      let videos = [];
      if (Array.isArray(response.data)) {
        // Old format - just an array
        videos = response.data;
      } else if (response.data && response.data.videos) {
        // New format - object with videos and pagination
        videos = response.data.videos || [];
        
        // If pagination exists and there are more videos, fetch all pages
        const pagination = response.data.pagination;
        if (pagination && pagination.totalPages > 1) {
          const allVideos = [...videos];
          
          // Fetch remaining pages
          for (let page = 2; page <= pagination.totalPages; page++) {
            const pageResponse = await api.get(`/videos?limit=10000&page=${page}`);
            if (pageResponse.data && pageResponse.data.videos) {
              allVideos.push(...pageResponse.data.videos);
            } else if (Array.isArray(pageResponse.data)) {
              allVideos.push(...pageResponse.data);
            }
          }
          
          videos = allVideos;
        }
      } else {
        videos = [];
      }

      const activeVideos = videos.filter(v => v.status === 'active');
      const inactiveVideos = videos.filter(v => v.status === 'inactive');
      // Total videos = only active + inactive (exclude deleted videos)
      const totalVideosCount = activeVideos.length + inactiveVideos.length;
      
      // Only count storage for active and inactive videos (exclude deleted)
      const validVideos = videos.filter(v => v.status === 'active' || v.status === 'inactive');
      const totalSize = validVideos.reduce((sum, v) => sum + (Number(v.size) || 0), 0);
      
      // Calculate total duration - ensure duration is parsed as number (stored in seconds)
      // Handle various formats: number, string, null, undefined
      const totalDuration = validVideos.reduce((sum, v) => {
        let duration = 0;
        if (v.duration !== null && v.duration !== undefined) {
          // Try to parse as number
          const parsed = Number(v.duration);
          if (!isNaN(parsed) && parsed > 0) {
            duration = parsed;
          }
        }
        return sum + duration;
      }, 0);
      
      const videosWithDuration = validVideos.filter(v => {
        const d = Number(v.duration) || 0;
        return d > 0;
      }).length;
      
      console.log('[Dashboard] Duration calculation:', {
        totalVideos: validVideos.length,
        videosWithDuration: videosWithDuration,
        videosWithoutDuration: validVideos.length - videosWithDuration,
        totalDurationSeconds: totalDuration,
        totalDurationMinutes: Math.round(totalDuration / 60),
        totalDurationHours: Math.round(totalDuration / 3600),
        sampleDurations: validVideos.slice(0, 10).map(v => ({ 
          video_id: v.video_id, 
          title: v.title?.substring(0, 30),
          duration: v.duration, 
          durationType: typeof v.duration,
          durationNumber: Number(v.duration) || 0
        }))
      });
      const videosWithCaptions = videos.filter(v => v.captions && v.captions.length > 0).length;
      const videosWithThumbnails = videos.filter(v => v.thumbnail_url).length;

      const byCourse = {};
      videos.forEach(video => {
        const course = video.course || 'Uncategorized';
        byCourse[course] = (byCourse[course] || 0) + 1;
      });

      const recent = [...videos]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      // Calculate upload activity (last 12 days)
      const activityByDate = {};
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Initialize last 12 days with 0
      for (let i = 11; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        activityByDate[dateKey] = 0;
      }
      
      // Count uploads by date
      videos.forEach(video => {
        if (video.created_at) {
          const uploadDate = new Date(video.created_at);
          uploadDate.setHours(0, 0, 0, 0);
          const dateKey = uploadDate.toISOString().split('T')[0];
          if (activityByDate.hasOwnProperty(dateKey)) {
            activityByDate[dateKey]++;
          }
        }
      });
      
      // Convert to array format
      const activity = Object.entries(activityByDate)
        .map(([date, count]) => ({
          date,
          count,
          dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
        }));

      setStats({
        totalVideos: totalVideosCount, // Only active + inactive videos (exclude deleted)
        activeVideos: activeVideos.length,
        inactiveVideos: inactiveVideos.length,
        totalSize,
        totalDuration,
        videosWithCaptions,
        videosWithThumbnails
      });

      setRecentVideos(recent);
      setVideosByCourse(byCourse);
      setUploadActivity(activity);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    // Ensure seconds is a number - handle various input types
    let totalSeconds = 0;
    if (seconds !== null && seconds !== undefined) {
      const parsed = Number(seconds);
      if (!isNaN(parsed) && parsed >= 0) {
        totalSeconds = Math.round(parsed);
      }
    }
    
    if (totalSeconds === 0) return '0 min';
    
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    // Format: hours, minutes, seconds
    if (hours > 0) {
      if (minutes > 0) {
        return `${hours}h ${minutes}m`;
      }
      if (secs > 0) {
        return `${hours}h ${secs}s`;
      }
      return `${hours}h`;
    }
    if (minutes > 0) {
      if (secs > 0) {
        return `${minutes}m ${secs}s`;
      }
      return `${minutes} min`;
    }
    return `${secs} sec`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleBackfillDurations = async () => {
    if (!confirm('This will extract durations from all video files. This may take several minutes. Continue?')) {
      return;
    }
    
    try {
      setBackfilling(true);
      const response = await api.post('/videos/backfill-durations');
      
      if (response.data.success) {
        alert(`Successfully updated ${response.data.updated} videos. ${response.data.failed} failed.`);
        // Refresh dashboard data
        await fetchDashboardData();
      } else {
        alert('Backfill completed with errors. Check console for details.');
      }
    } catch (err) {
      console.error('Failed to backfill durations:', err);
      alert('Failed to backfill durations: ' + (err.response?.data?.error || err.message));
    } finally {
      setBackfilling(false);
    }
  };

  // Calculate upload activity statistics
  const totalUploadsLast12Days = uploadActivity.reduce((sum, day) => sum + day.count, 0);
  const todayUploads = uploadActivity[uploadActivity.length - 1]?.count || 0;
  const yesterdayUploads = uploadActivity[uploadActivity.length - 2]?.count || 0;
  
  // Calculate real growth percentage (today vs yesterday)
  const calculateUploadGrowth = () => {
    if (yesterdayUploads === 0) {
      if (todayUploads > 0) return { value: 100, isPositive: true };
      return { value: 0, isPositive: true };
    }
    const growth = ((todayUploads - yesterdayUploads) / yesterdayUploads) * 100;
    return { value: Math.abs(growth), isPositive: growth >= 0 };
  };
  const uploadGrowth = calculateUploadGrowth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate real growth based on last 7 days vs previous 7 days
  const calculatePeriodGrowth = (currentPeriod, previousPeriod) => {
    if (previousPeriod === 0) {
      if (currentPeriod > 0) return { value: 100, isPositive: true };
      return { value: 0, isPositive: true };
    }
    const growth = ((currentPeriod - previousPeriod) / previousPeriod) * 100;
    return { value: Math.abs(growth), isPositive: growth >= 0 };
  };

  // Calculate uploads for last 7 days vs previous 7 days
  const last7DaysUploads = uploadActivity.slice(-7).reduce((sum, day) => sum + day.count, 0);
  const previous7DaysUploads = uploadActivity.slice(0, 7).reduce((sum, day) => sum + day.count, 0);
  const totalGrowth = calculatePeriodGrowth(last7DaysUploads, previous7DaysUploads);
  
  // For other stats, we don't have historical data, so show 0 or hide growth
  const activeGrowth = { value: 0, isPositive: true };
  const storageGrowth = { value: 0, isPositive: true };
  const durationGrowth = { value: 0, isPositive: true };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 lg:p-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
          <p className="text-slate-600 text-lg">Welcome to dashboard</p>
        </div>

        {/* Summary Cards - Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Videos Card */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-lg border border-orange-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Total Videos</span>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Video className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-2">{stats.totalVideos}</div>
            {totalGrowth.value > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <div className={`flex items-center gap-1 ${totalGrowth.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {totalGrowth.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  <span className="font-semibold">{totalGrowth.value.toFixed(1)}%</span>
                </div>
                <span className="text-slate-600">vs previous week</span>
              </div>
            )}
          </div>

          {/* Active Videos Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg border border-green-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-green-700 uppercase tracking-wide">Active Videos</span>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-2">{stats.activeVideos}</div>
            <div className="text-sm text-slate-600">Currently available</div>
          </div>

          {/* Total Storage Card */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg border border-blue-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Total Storage</span>
              <div className="p-2 bg-blue-100 rounded-lg">
                <HardDrive className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-2">{formatSize(stats.totalSize)}</div>
            <div className="text-sm text-slate-600">Storage used</div>
          </div>

          {/* Total Duration Card */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg border border-purple-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Total Duration</span>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="text-4xl font-bold text-slate-900 mb-2">{formatDuration(stats.totalDuration)}</div>
            <div className="text-sm text-slate-600">Combined video length</div>
            {stats.totalDuration === 0 && (
              <button
                onClick={handleBackfillDurations}
                disabled={backfilling}
                className="mt-3 w-full px-3 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {backfilling ? 'Processing...' : 'Extract Durations'}
              </button>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Upload Activity */}
          <div className="lg:col-span-2 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl shadow-lg border border-teal-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Upload Activity</h3>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {totalUploadsLast12Days} 
                  {uploadGrowth.value > 0 && (
                    <span className="text-sm font-normal text-green-600"> +{uploadGrowth.value.toFixed(1)}%</span>
                  )}
                </p>
                <p className="text-sm text-slate-600 mt-1">Total uploads in last 12 days</p>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <span className="text-sm">12 Days</span>
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-4">
              {/* Today's Uploads */}
              <div className="bg-white/60 rounded-xl p-4 border border-teal-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Today's Uploads</p>
                    <p className="text-2xl font-bold text-slate-900">{todayUploads}</p>
                  </div>
                  <div className="p-3 bg-teal-100 rounded-lg">
                    <Upload className="w-6 h-6 text-teal-600" />
                  </div>
                </div>
              </div>
              
              {/* Activity Breakdown */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {uploadActivity.slice(-4).map((day, index) => (
                  <div key={day.date} className="bg-white/60 rounded-lg p-3 border border-teal-200">
                    <p className="text-xs text-slate-600 mb-1">{day.dayName}</p>
                    <p className="text-lg font-bold text-slate-900">{day.count}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
              
               {/* Recent Uploads List */}
               <div className="bg-white/60 rounded-xl p-4 border border-teal-200">
                 <p className="text-sm font-semibold text-slate-700 mb-3">Recent Uploads</p>
                 <div className="space-y-2 max-h-64 overflow-y-auto">
                   {recentVideos.length === 0 ? (
                     <div className="text-center py-4 text-slate-500">
                       <p className="text-sm">No recent uploads</p>
                     </div>
                   ) : (
                     recentVideos.map((video) => (
                       <div key={video.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/80 transition-colors">
                         <div className="flex items-center gap-3 flex-1 min-w-0">
                           <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                             <Video className="w-4 h-4 text-teal-600" />
                           </div>
                           <div className="flex-1 min-w-0">
                             <p className="text-sm font-semibold text-slate-900 truncate">{video.title || 'Untitled Video'}</p>
                             <p className="text-xs text-slate-500">{formatDate(video.created_at)}</p>
                           </div>
                         </div>
                         <div className="text-xs font-semibold text-slate-600 ml-2">
                           {formatSize(video.size || 0)}
                         </div>
                       </div>
                     ))
                   )}
                 </div>
               </div>
            </div>
          </div>

          {/* Recent Videos */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Recent Videos</h3>
              <MoreVertical className="w-5 h-5 text-slate-400 cursor-pointer" />
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentVideos.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Video className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm">No videos yet</p>
                </div>
              ) : (
                recentVideos.map((video, index) => (
                  <div key={video.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {index === 0 ? (
                        <ShoppingBag className="w-4 h-4 text-blue-600" />
                      ) : index === 1 ? (
                        <Play className="w-4 h-4 text-green-600" />
                      ) : index === 2 ? (
                        <Upload className="w-4 h-4 text-purple-600" />
                      ) : (
                        <Video className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{video.title || 'Untitled Video'}</p>
                      <p className="text-xs text-slate-500 truncate">{video.course || 'No course'}</p>
                    </div>
                    <div className="text-sm font-semibold text-slate-600">
                      {formatSize(video.size || 0)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Categories */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Video Categories</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(videosByCourse)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([course, count], index) => (
                  <div key={course} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      {index === 0 && <Folder className="w-5 h-5 text-blue-600" />}
                      {index === 1 && <Video className="w-5 h-5 text-green-600" />}
                      {index === 2 && <FileVideo className="w-5 h-5 text-purple-600" />}
                      {index === 3 && <Users className="w-5 h-5 text-orange-600" />}
                      {index === 4 && <Activity className="w-5 h-5 text-pink-600" />}
                    </div>
                    <p className="text-xs text-slate-600 mb-1 truncate">{course}</p>
                    <p className="text-lg font-bold text-slate-900">{count}</p>
                  </div>
                ))}
              {Object.keys(videosByCourse).length === 0 && (
                <div className="col-span-2 text-center py-8 text-slate-500">
                  <p className="text-sm">No categories available</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity Table */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">Newest</button>
                <button className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-200">Oldest</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {recentVideos.slice(0, 5).map((video) => (
                    <tr key={video.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {(video.title || video.video_id || 'V').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{video.title || video.video_id || 'Untitled Video'}</p>
                            <p className="text-xs text-slate-500">{video.course || 'No course'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          video.status === 'active' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {video.status === 'active' ? 'In progress' : 'Completed'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600">{formatDate(video.created_at)}</td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-900">{formatSize(video.size || 0)}</span>
                      </td>
                    </tr>
                  ))}
                  {recentVideos.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-500">
                        <Video className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm">No videos available</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;



