import { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Play, Edit, Trash2, ExternalLink, Eye, Calendar, Search, MessageCircle, Bug, X, AlertCircle, CheckCircle, Info, Grid3x3, List } from 'lucide-react';

              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
            >
              <option value="">All Lessons</option>
              {filterOptions.lessons && filterOptions.lessons.map((lesson) => (
                <option key={lesson} value={lesson}>
                  {lesson}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Module
            </label>
            <select
              value={filters.module || ''}
              onChange={(e) => {
                const value = e.target.value;
                setFilters(prev => ({ ...prev, module: value }));
              }}
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
            >
              <option value="">All Modules</option>
              {filterOptions.modules && filterOptions.modules.map((module) => (
                <option key={module} value={module}>
                  {module}
                </option>
              ))}
            </select>
          </div>
          {!isInactiveRoute && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Status
              </label>
              <select
                value={filters.status || 'active'}
                onChange={(e) => {
                  const value = e.target.value;
                  setFilters(prev => ({ ...prev, status: value }));
                }}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white cursor-pointer"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}
        </div>
        {/* Clear Filters Button */}
        {(filters.search || filters.subject || filters.course || filters.grade || filters.unit || filters.lesson || filters.module || filters.moduleNumber || filters.status !== 'active') && (
          <div className="mt-6">
            <button
              onClick={() => setFilters({
                search: '',
                subject: '',
                course: '',
                grade: '',
                unit: '',
                lesson: '',
                module: '',
                moduleNumber: '',
                status: 'active'
              })}
              className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {videos.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
          <p className="text-slate-500 text-lg font-semibold">No videos found</p>
          <p className="text-slate-400 text-sm mt-2">Try adjusting your filters or upload a new video</p>
        </div>
      ) : viewMode === 'list' ? (
        // List View
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-blue-50 border-b-2 border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Thumbnail</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Subject</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Grade</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Lesson</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Module</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {videos.map((video) => {
                  const formatDate = (dateString) => {
                    if (!dateString) return 'Recently';
                    const date = new Date(dateString);
                    const now = new Date();
                    const diffTime = Math.abs(now - date);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays === 0) return 'Today';
                    if (diffDays === 1) return '1 day ago';
                    if (diffDays < 7) return `${diffDays} days ago`;
                    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
                    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
                    return `${Math.ceil(diffDays / 365)} years ago`;
                  };

                  const backendUrl = getBackendBaseUrl();
                  const buildThumbnailUrl = (pathOrUrl, videoId) => {
                    if (pathOrUrl && pathOrUrl.trim() !== '') {
                      let thumbnailPath = pathOrUrl.trim();
                      if (thumbnailPath.startsWith('http://') || thumbnailPath.startsWith('https://')) {
                        return thumbnailPath;
                      }
                      if (!thumbnailPath.startsWith('/')) {
                        thumbnailPath = `/${thumbnailPath}`;
                      }
                      if (!thumbnailPath.toLowerCase().startsWith('/thumbnails/')) {
                        if (!thumbnailPath.includes('/')) {
                          thumbnailPath = `/thumbnails/${thumbnailPath}`;
                        } else {
                          const filename = thumbnailPath.split('/').pop();
                          thumbnailPath = `/thumbnails/${filename}`;
                        }
                      }
                      return `${backendUrl}${thumbnailPath}`;
                    }
                    if (videoId) {
                      return `${backendUrl}/thumbnails/${videoId}.jpg`;
                    }
                    return null;
                  };
                  
                  const thumbnailUrl = buildThumbnailUrl(video.thumbnail_url, video.video_id);

                  return (
                    <tr key={video.id} className="hover:bg-blue-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-20 h-12 rounded-lg overflow-hidden flex items-center justify-center relative">
                          {thumbnailUrl && (
                            <img
                              src={thumbnailUrl}
                              alt={video.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const fallback = e.target.parentElement?.querySelector('.thumb-fallback');
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                          )}
                          <div
                            className={`thumb-fallback absolute inset-0 flex items-center justify-center font-bold text-sm text-slate-800 ${thumbnailUrl ? 'hidden' : 'flex'}`}
                            style={{ background: getTitleGradient(video.title) }}
                          >
                            <span className="px-2 py-1 bg-white/70 rounded-md shadow-sm">
                              {getTitleInitials(video.title)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-900">{video.title || 'Untitled Video'}</div>
                        {video.description && (
                          <div className="text-xs text-slate-500 mt-1 truncate max-w-xs">{truncateDescription(video.description)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded">
                          {video.subject || video.course || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold bg-green-50 text-green-700 rounded">
                          {video.grade || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded">
                          {video.unit || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold bg-teal-50 text-teal-700 rounded">
                          {video.lesson || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-semibold bg-amber-50 text-amber-700 rounded">
                          {video.module || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                          <Eye className="w-4 h-4" />
                          <span className="font-semibold">{video.views || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {video.status === 'active' ? (
                          <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-bold bg-slate-300 text-slate-700 rounded-full">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600"
                            checked={selectedIds.has(video.id)}
                            onChange={() => handleToggleSelect(video.id)}
                          />
                          {isInactiveRoute ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActivate(video.id);
                                }}
                                className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                title="Activate Video"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <Link
                                to={`/video/${video.video_id}`}
                                className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                              <Link
                                to={`/stream/${video.video_id}`}
                                className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                                title="Stream"
                              >
                                <Play className="w-4 h-4" />
                              </Link>
                              <Link
                                to={`/admin/videos/${video.id}/edit`}
                                className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                            </>
                          ) : (
                            <>
                              <Link
                                to={`/stream/${video.video_id}`}
                                className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                title="Stream"
                              >
                                <Play className="w-4 h-4" />
                              </Link>
                              <Link
                                to={`/admin/videos/${video.id}/edit`}
                                className="p-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(video.id);
                                }}
                                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Card View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {videos.map((video) => {
            const formatDate = (dateString) => {
              if (!dateString) return 'Recently';
              const date = new Date(dateString);
              const now = new Date();
              const diffTime = Math.abs(now - date);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              if (diffDays === 0) return 'Today';
              if (diffDays === 1) return '1 day ago';
              if (diffDays < 7) return `${diffDays} days ago`;
              if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
              if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
              return `${Math.ceil(diffDays / 365)} years ago`;
            };

            const formatSize = (bytes) => {
              if (!bytes) return '0 MB';
              return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
            };

            // Get thumbnail URL - use video thumbnail or try to fetch by videoId
            const backendUrl = getBackendBaseUrl();
            
            // Function to build thumbnail URL
            const buildThumbnailUrl = (pathOrUrl, videoId) => {
              // If we have a thumbnail_url from database
              if (pathOrUrl && pathOrUrl.trim() !== '') {
                let thumbnailPath = pathOrUrl.trim();
                
                // If it's already a full URL, return it
                if (thumbnailPath.startsWith('http://') || thumbnailPath.startsWith('https://')) {
                  return thumbnailPath;
                }
                
                // If it doesn't start with /, add it
                if (!thumbnailPath.startsWith('/')) {
                  thumbnailPath = `/${thumbnailPath}`;
                }
                
                // Ensure it starts with /thumbnails/
                if (!thumbnailPath.toLowerCase().startsWith('/thumbnails/')) {
                  // If it's just a filename, add /thumbnails/ prefix
                  if (!thumbnailPath.includes('/')) {
                    thumbnailPath = `/thumbnails/${thumbnailPath}`;
                  } else {
                    // Extract filename and add /thumbnails/ prefix
                    const filename = thumbnailPath.split('/').pop();
                    thumbnailPath = `/thumbnails/${filename}`;
                  }
                }
                
                return `${backendUrl}${thumbnailPath}`;
              }
              
              // If no thumbnail_url, try common thumbnail paths by videoId
              if (videoId) {
                // Try different extensions - start with .jpg as it's most common
                const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
                // Return the first one - the image will load if it exists, otherwise show placeholder
                return `${backendUrl}/thumbnails/${videoId}${extensions[0]}`;
              }
              
              // Fallback to null (will show placeholder)
              return null;
            };
            
            // Get thumbnail URL - prioritize database thumbnail_url, then try by videoId
            let thumbnailUrl = buildThumbnailUrl(video.thumbnail_url, video.video_id);
            
            // If no thumbnail_url in database, try to construct from videoId
            if (!thumbnailUrl && video.video_id) {
              thumbnailUrl = `${backendUrl}/thumbnails/${video.video_id}.jpg`;
            }

            return (
              <div
                key={video.id}
                className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 overflow-hidden hover:shadow-2xl hover:border-blue-400 transition-all duration-300 group transform hover:-translate-y-2"
              >
                {/* Thumbnail Section */}
                <div 
                  className="relative w-full aspect-video bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50 overflow-hidden p-2"
                  onMouseEnter={() => {
                    setHoveredVideoId(video.video_id);
                  }}
                  onMouseLeave={() => {
                    setHoveredVideoId(null);
                  }}
                >
                  {/* Video Frame Thumbnail - Extract frame from video and show as image */}
                  <VideoFrameThumbnail videoId={video.video_id} />

                  {/* Thumbnail Image - Show if available, overlay on top of video preview */}
                  {thumbnailUrl && (
                    <div className="relative w-full h-full rounded-lg overflow-hidden border border-white shadow-md z-10">
                      <img
                        src={thumbnailUrl}
                        alt={video.title}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          hoveredVideoId === video.video_id ? 'opacity-30' : 'opacity-100'
                        }`}
                        onError={(e) => {
                          // Try alternative extensions if first one fails
                          const currentSrc = e.target.src;
                          const videoId = video.video_id;
                          const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
                          const currentExt = extensions.find(ext => currentSrc.includes(ext)) || extensions[0];
                          const currentIndex = extensions.indexOf(currentExt);
                          
                          if (currentIndex < extensions.length - 1) {
                            // Try next extension
                            const nextExt = extensions[currentIndex + 1];
                            e.target.src = `${backendUrl}/thumbnails/${videoId}${nextExt}`;
                          } else {
                            // All extensions failed, hide image and let video preview show
                            e.target.style.display = 'none';
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Default Placeholder - Only show if video frame extraction fails */}
                  <div
                    className="thumbnail-placeholder absolute inset-2 flex flex-col items-center justify-center rounded-xl border-2 border-slate-300 shadow-inner z-5 pointer-events-none"
                    style={{ background: getTitleGradient(video.title), display: 'none' }}
                    id={`placeholder-${video.video_id}`}
                  >
                    <div className="w-16 h-16 bg-white/70 rounded-full flex items-center justify-center mb-2 shadow-md">
                      <span className="text-xl font-bold text-slate-800">{getTitleInitials(video.title)}</span>
                    </div>
                    <p className="text-xs text-slate-700 font-semibold">No Preview</p>
                  </div>
                  
                  {/* Video Preview on Hover - Overlay on top */}
                  <VideoPreview 
                    videoId={video.video_id} 
                    isHovered={hoveredVideoId === video.video_id} 
                  />

                  {/* Play Button Overlay (only on hover, but not when video preview is showing) */}
                  {hoveredVideoId !== video.video_id && (
                    <Link
                      to={`/stream/${video.video_id}`}
                      className="absolute inset-2 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40 backdrop-blur-sm rounded-lg z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform duration-300 border-3 border-white/80">
                        <Play className="w-10 h-10 text-white ml-1" fill="currentColor" />
                      </div>
                    </Link>
                  )}
            
                  {/* Status Badge */}
                  {video.status === 'active' && (
                    <div className="absolute top-2 right-2 z-30">
                      <span className="px-2 py-1 text-xs rounded-full font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg border border-white/80 backdrop-blur-sm">
                        Active
                      </span>
                    </div>
                  )}
                </div>
             
                {/* Content Section */}
                <div className="p-3 sm:p-4 bg-white">
                  {/* Screen Recording Title with Views in Top Right */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-base font-bold text-slate-900 flex-1 line-clamp-2">
                      {video.title || 'Untitled Video'}
                    </h3>
                    {/* Views Count - Top Right */}
                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-200 cursor-default flex-shrink-0">
                      <Eye className="w-3.5 h-3.5" />
                      <span className="font-semibold text-xs">{video.views || 0}</span>
                    </div>
                  </div>

                  {/* Description - always show */}
                  <div className="mb-2">
                    <div className="text-xs uppercase text-slate-500 mb-1">DESCRIPTION</div>
                    <div className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg min-h-[2rem] text-slate-700">
                      {truncateDescription(video.description)}
                    </div>
                  </div>

                  {/* Subject Information - Two Row Layout */}
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-1 h-4 bg-blue-600 rounded"></div>
                      <h5 className="text-sm font-bold text-slate-900">Subject Information</h5>
                    </div>
                    
                    {/* Subject - Full Width Single Line */}
                    <div className="mb-1.5">
                      <div className="text-xs uppercase text-slate-500 mb-0.5">SUBJECT</div>
                      <div className="w-full px-2 py-1.5 text-xs font-bold text-slate-900 bg-blue-50 border border-blue-200 rounded-lg text-center whitespace-nowrap overflow-hidden text-ellipsis" title={(() => {
                        const subjectValue = video.subject || video.course || '';
                        return subjectValue !== null && subjectValue !== undefined && subjectValue !== '' ? String(subjectValue) : '-';
                      })()}>
                        {(() => {
                          const subjectValue = video.subject || video.course || '';
                          return subjectValue !== null && subjectValue !== undefined && subjectValue !== '' ? String(subjectValue) : '-';
                        })()}
                      </div>
                    </div>

                    {/* Grade, Unit, Lesson, Module - Four Column Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {/* Grade */}
                      <div className="min-w-0">
                        <div className="text-xs uppercase text-green-700 mb-0.5">GRADE</div>
                        <div className="w-full px-1.5 py-1.5 text-xs font-bold text-green-900 bg-green-50 border border-green-200 rounded-lg text-center break-words min-h-[2rem] flex items-center justify-center">
                          {video.grade !== null && video.grade !== undefined && video.grade !== '' ? video.grade : '-'}
                        </div>
                      </div>

                      {/* Unit */}
                      <div className="min-w-0">
                        <div className="text-xs uppercase text-indigo-700 mb-0.5">UNIT</div>
                        <div className="w-full px-1.5 py-1.5 text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-lg text-center break-words min-h-[2rem] flex items-center justify-center">
                          {(() => {
                            const unitValue = video.unit;
                            return unitValue !== null && unitValue !== undefined && unitValue !== '' && unitValue !== 0 && unitValue !== '0' ? String(unitValue) : '-';
                          })()}
                        </div>
                      </div>

                      {/* Lesson */}
                      <div className="min-w-0">
                        <div className="text-xs uppercase text-teal-700 mb-0.5">LESSON</div>
                        <div className="w-full px-1.5 py-1.5 text-xs font-bold text-teal-900 bg-teal-50 border border-teal-200 rounded-lg text-center break-words min-h-[2rem] flex items-center justify-center">
                          {video.lesson !== null && video.lesson !== undefined && video.lesson !== '' ? video.lesson : '-'}
                        </div>
                      </div>

                      {/* Module */}
                      <div className="min-w-0">
                        <div className="text-xs uppercase text-amber-700 mb-0.5">MODULE</div>
                        <div className="w-full px-1.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 rounded-lg text-center break-words min-h-[2rem] flex items-center justify-center">
                          {(() => {
                            const moduleValue = video.module;
                            return moduleValue !== null && moduleValue !== undefined && moduleValue !== '' && moduleValue !== 0 && moduleValue !== '0' ? String(moduleValue) : '-';
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Version + File Size and Date */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mb-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg">
                      <span className="font-semibold text-slate-700">Version:</span>
                      <span className="font-bold text-slate-900">
                        {video.version !== null && video.version !== undefined && video.version !== '' ? video.version : '-'}
                      </span>
                    </div>
                    <span className="text-slate-400">•</span>
                    <span className="font-semibold text-slate-700">{formatSize(video.size)}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">{formatDate(video.created_at)}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    {isInactiveRoute ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivate(video.id);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 px-2.5 py-2 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-lg text-xs font-bold hover:from-green-100 hover:to-green-200 hover:text-green-800 hover:shadow-md transition-all duration-200 border border-green-300"
                          title="Activate Video"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Activate</span>
                        </button>
                        <Link
                          to={`/video/${video.video_id}`}
                          className="flex-1 flex items-center justify-center gap-1 px-2.5 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:from-blue-100 hover:to-blue-200 hover:text-blue-800 hover:shadow-md transition-all duration-200 border border-blue-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">View</span>
                        </Link>
                        <Link
                          to={`/stream/${video.video_id}`}
                          target="_blank"
                          className="flex-1 flex items-center justify-center gap-1 px-2.5 py-2 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 rounded-lg text-xs font-bold hover:from-emerald-100 hover:to-emerald-200 hover:text-emerald-800 hover:shadow-md transition-all duration-200 border border-emerald-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Stream</span>
                        </Link>
                        <Link
                          to={`/admin/videos/${video.id}/edit`}
                          className="px-2.5 py-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 hover:text-slate-900 hover:shadow-md transition-all duration-200 border border-slate-300"
                          onClick={(e) => e.stopPropagation()}
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to={`/video/${video.video_id}`}
                          className="flex-1 flex items-center justify-center gap-1 px-2.5 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg text-xs font-bold hover:from-blue-100 hover:to-blue-200 hover:text-blue-800 hover:shadow-md transition-all duration-200 border border-blue-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">View</span>
                        </Link>
                        <Link
                          to={`/stream/${video.video_id}`}
                          target="_blank"
                          className="flex-1 flex items-center justify-center gap-1 px-2.5 py-2 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-lg text-xs font-bold hover:from-green-100 hover:to-green-200 hover:text-green-800 hover:shadow-md transition-all duration-200 border border-green-300"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Stream</span>
                        </Link>
                        <Link
                          to={`/admin/videos/${video.id}/edit`}
                          className="px-2.5 py-2 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg hover:from-slate-200 hover:to-slate-300 hover:text-slate-900 hover:shadow-md transition-all duration-200 border border-slate-300"
                          onClick={(e) => e.stopPropagation()}
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(video.id);
                          }}
                          className="px-2.5 py-2 bg-gradient-to-r from-red-50 to-red-100 text-red-700 rounded-lg hover:from-red-100 hover:to-red-200 hover:text-red-800 hover:shadow-md transition-all duration-200 border border-red-300"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Diagnostic Modal */}
      {showDiagnosticModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bug className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Video Metadata Diagnostic</h2>
              </div>
              <button
                onClick={() => {
                  setShowDiagnosticModal(false);
                  setDiagnosticData(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {diagnosticLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Running diagnostic...</p>
                  </div>
                </div>
              ) : diagnosticData?.error ? (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                    <h3 className="text-xl font-bold text-red-900">Error</h3>
                  </div>
                  <p className="text-red-700">{diagnosticData.message}</p>
                </div>
              ) : diagnosticData ? (
                <div className="space-y-6">
                  {/* Status Summary */}
                  <div className={`rounded-xl p-6 border-2 ${
                    diagnosticData.status === 'healthy' 
                      ? 'bg-green-50 border-green-200' 
                      : diagnosticData.status === 'warning'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      {diagnosticData.status === 'healthy' ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : diagnosticData.status === 'warning' ? (
                        <AlertCircle className="w-6 h-6 text-yellow-600" />
                      ) : (
                        <X className="w-6 h-6 text-red-600" />
                      )}
                      <h3 className="text-xl font-bold">Status: {diagnosticData.status?.toUpperCase() || 'UNKNOWN'}</h3>
                    </div>
                    {diagnosticData.summary && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <div className="text-sm text-slate-600">Video Found</div>
                          <div className={`font-bold ${diagnosticData.summary.videoFound ? 'text-green-700' : 'text-red-700'}`}>
                            {diagnosticData.summary.videoFound ? 'Yes' : 'No'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-600">Columns Exist</div>
                          <div className={`font-bold ${diagnosticData.summary.columnsExist ? 'text-green-700' : 'text-red-700'}`}>
                            {diagnosticData.summary.columnsExist ? 'Yes' : 'No'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-600">Values Present</div>
                          <div className={`font-bold ${diagnosticData.summary.valuesPresent ? 'text-green-700' : 'text-red-700'}`}>
                            {diagnosticData.summary.valuesPresent ? 'Yes' : 'No'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-600">Issues Found</div>
                          <div className="font-bold text-slate-700">{diagnosticData.summary.issuesFound || 0}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Database Schema */}
                  {diagnosticData.databaseSchema && (
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        Database Schema
                      </h3>
                      <div className="space-y-2">
                        <div>
                          <span className="font-semibold text-slate-700">Columns Found: </span>
                          <span className="text-slate-600">
                            {diagnosticData.databaseSchema.columnsFound?.length > 0
                              ? diagnosticData.databaseSchema.columnsFound.join(', ')
                              : 'None'}
                          </span>
                        </div>
                        {diagnosticData.databaseSchema.columnDetails && Object.keys(diagnosticData.databaseSchema.columnDetails).length > 0 && (
                          <div className="mt-4">
                            <div className="font-semibold text-slate-700 mb-2">Column Details:</div>
                            <div className="bg-white rounded-lg p-4 space-y-2">
                              {Object.entries(diagnosticData.databaseSchema.columnDetails).map(([name, details]) => (
                                <div key={name} className="flex items-center justify-between border-b pb-2">
                                  <span className="font-mono text-sm font-bold text-slate-800">{name}</span>
                                  <span className="text-xs text-slate-600">
                                    {details.type} {details.nullable ? '(nullable)' : '(not null)'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Raw Database Values */}
                  {diagnosticData.rawDatabaseValues && (
                    <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Raw Database Values</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-slate-600 mb-1">Subject</div>
                          <div className={`font-bold ${diagnosticData.rawDatabaseValues.subjectIsNull ? 'text-red-700' : 'text-green-700'}`}>
                            {diagnosticData.rawDatabaseValues.subject !== null && diagnosticData.rawDatabaseValues.subject !== undefined
                              ? String(diagnosticData.rawDatabaseValues.subject)
                              : 'NULL'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-600 mb-1">Module</div>
                          <div className={`font-bold ${diagnosticData.rawDatabaseValues.moduleIsNull ? 'text-red-700' : 'text-green-700'}`}>
                            {diagnosticData.rawDatabaseValues.module !== null && diagnosticData.rawDatabaseValues.module !== undefined
                              ? String(diagnosticData.rawDatabaseValues.module)
                              : 'NULL'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-600 mb-1">Grade</div>
                          <div className="font-bold text-slate-700">
                            {diagnosticData.rawDatabaseValues.grade || 'NULL'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-600 mb-1">Unit</div>
                          <div className="font-bold text-slate-700">
                            {diagnosticData.rawDatabaseValues.unit || 'NULL'}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-slate-600 mb-1">Lesson</div>
                          <div className="font-bold text-slate-700">
                            {diagnosticData.rawDatabaseValues.lesson || 'NULL'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Test Cases */}
                  {diagnosticData.analysis && diagnosticData.analysis.testCases && diagnosticData.analysis.testCases.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        Test Cases - Why Values Are Not Fetched
                      </h3>
                      {diagnosticData.analysis.testSummary && (
                        <div className="mb-4 p-3 bg-white rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-slate-700">Test Results:</span>
                            <span className={`font-bold ${
                              diagnosticData.analysis.testSummary.passed === diagnosticData.analysis.testSummary.total
                                ? 'text-green-700'
                                : 'text-red-700'
                            }`}>
                              {diagnosticData.analysis.testSummary.passed}/{diagnosticData.analysis.testSummary.total} Passed ({diagnosticData.analysis.testSummary.passRate})
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="space-y-3">
                        {diagnosticData.analysis.testCases.map((testCase, index) => (
                          <div key={index} className={`p-4 rounded-lg border-2 ${
                            testCase.status === 'passed'
                              ? 'bg-green-50 border-green-200'
                              : testCase.status === 'failed'
                              ? 'bg-red-50 border-red-200'
                              : testCase.status === 'skipped'
                              ? 'bg-slate-100 border-slate-300'
                              : 'bg-yellow-50 border-yellow-200'
                          }`}>
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {testCase.status === 'passed' ? (
                                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                ) : testCase.status === 'failed' ? (
                                  <X className="w-5 h-5 text-red-600 flex-shrink-0" />
                                ) : (
                                  <Info className="w-5 h-5 text-slate-600 flex-shrink-0" />
                                )}
                                <span className="font-bold text-slate-900">{testCase.name}</span>
                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                  testCase.status === 'passed'
                                    ? 'bg-green-200 text-green-800'
                                    : testCase.status === 'failed'
                                    ? 'bg-red-200 text-red-800'
                                    : 'bg-slate-200 text-slate-800'
                                }`}>
                                  {testCase.status.toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 mb-2">{testCase.description}</p>
                            {testCase.failureReason && (
                              <div className="mt-2 p-2 bg-red-100 rounded border border-red-300">
                                <p className="text-sm font-semibold text-red-800">❌ Failure Reason:</p>
                                <p className="text-sm text-red-700">{testCase.failureReason}</p>
                              </div>
                            )}
                            {testCase.details && Object.keys(testCase.details).length > 0 && (
                              <details className="mt-2">
                                <summary className="text-sm font-semibold text-slate-700 cursor-pointer hover:text-slate-900">
                                  View Details
                                </summary>
                                <pre className="mt-2 p-3 bg-white rounded text-xs overflow-x-auto border border-slate-200">
                                  {JSON.stringify(testCase.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Root Cause & Solution */}
                  {diagnosticData.analysis && (diagnosticData.analysis.rootCause || diagnosticData.analysis.solution) && (
                    <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Root Cause & Solution</h3>
                      {diagnosticData.analysis.rootCause && (
                        <div className="mb-4 p-4 bg-white rounded-lg border border-indigo-300">
                          <p className="text-sm font-semibold text-indigo-900 mb-2">🔍 Root Cause:</p>
                          <p className="text-slate-700">{diagnosticData.analysis.rootCause}</p>
                        </div>
                      )}
                      {diagnosticData.analysis.solution && (
                        <div className="mb-4 p-4 bg-white rounded-lg border border-indigo-300">
                          <p className="text-sm font-semibold text-indigo-900 mb-2">✅ Solution:</p>
                          <p className="text-slate-700">{diagnosticData.analysis.solution}</p>
                        </div>
                      )}
                      
                      {/* Quick Fix Button */}
                      {diagnosticData.analysis && diagnosticData.analysis.subjectValueLost && (
                        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
                          <p className="text-sm font-semibold text-green-900 mb-3">🚀 Quick Fix - Test Update Function:</p>
                          <p className="text-sm text-slate-700 mb-4">Click the button below to set test values (Subject: "1", Module: "1") and verify the update process works:</p>
                          <button
                            onClick={async () => {
                              try {
                                const videoId = diagnosticData.videoId;
                                const response = await api.post(`/videos/diagnostic/${videoId}/quick-fix`, {
                                  subject: '1',
                                  module: '1'
                                });
                                
                                if (response.data.success) {
                                  alert('✅ Quick fix successful! Values have been saved. Please refresh the page and run the diagnostic again to verify.');
                                  // Refresh the video list
                                  window.location.reload();
                                }
                              } catch (error) {
                                alert(`❌ Quick fix failed: ${error.response?.data?.message || error.message}`);
                              }
                            }}
                            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                          >
                            🔧 Set Test Values (Subject: "1", Module: "1")
                          </button>
                          <p className="text-xs text-slate-600 mt-2">This will update the video with test values to verify the update function works correctly.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Analysis */}
                  {diagnosticData.analysis && (
                    <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Issues Found</h3>
                      {diagnosticData.analysis.issues && diagnosticData.analysis.issues.length > 0 ? (
                        <ul className="space-y-2">
                          {diagnosticData.analysis.issues.map((issue, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                              <span className="text-slate-700">{issue}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-green-700 font-semibold">✅ No issues detected! All values are being fetched correctly.</p>
                      )}
                    </div>
                  )}

                  {/* Recommendations */}
                  {diagnosticData.recommendations && diagnosticData.recommendations.length > 0 && (
                    <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Recommendations</h3>
                      <ul className="space-y-2">
                        {diagnosticData.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Checks */}
                  {diagnosticData.checks && diagnosticData.checks.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Detailed Checks</h3>
                      <div className="space-y-3">
                        {diagnosticData.checks.map((check, index) => (
                          <div key={index} className={`p-4 rounded-lg border-2 ${
                            check.status === 'pass' 
                              ? 'bg-green-50 border-green-200' 
                              : check.status === 'warning'
                              ? 'bg-yellow-50 border-yellow-200'
                              : 'bg-red-50 border-red-200'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              {check.status === 'pass' ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : check.status === 'warning' ? (
                                <AlertCircle className="w-5 h-5 text-yellow-600" />
                              ) : (
                                <X className="w-5 h-5 text-red-600" />
                              )}
                              <span className="font-bold text-slate-900">{check.name}</span>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${
                                check.status === 'pass'
                                  ? 'bg-green-200 text-green-800'
                                  : check.status === 'warning'
                                  ? 'bg-yellow-200 text-yellow-800'
                                  : 'bg-red-200 text-red-800'
                              }`}>
                                {check.status?.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-slate-700">{check.message}</p>
                            {check.details && (
                              <pre className="mt-2 p-3 bg-white rounded text-xs overflow-x-auto">
                                {JSON.stringify(check.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default VideoList;

