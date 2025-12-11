import { useEffect, useState } from 'react';
import { Download, Filter, FileSpreadsheet, AlertCircle, Loader } from 'lucide-react';
import api from '../services/api';

function CSVExport() {
  const [filterValues, setFilterValues] = useState({
    subjects: [],
    grades: [],
    units: [],
    lessons: []
  });
  const [selectedFilters, setSelectedFilters] = useState({
    subject: 'all',
    grade: 'all',
    unit: 'all',
    lesson: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [videoCount, setVideoCount] = useState(0);
  const [counting, setCounting] = useState(false);

  useEffect(() => {
    loadFilterValues();
  }, []);

  useEffect(() => {
    if (filterValues.subjects.length > 0) {
      countVideos();
    }
  }, [selectedFilters, filterValues]);

  const loadFilterValues = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/videos/filters');
      
      if (response.data) {
        setFilterValues({
          subjects: response.data.subjects || [],
          grades: response.data.grades || [],
          units: response.data.units || [],
          lessons: response.data.lessons || []
        });
      }
    } catch (err) {
      console.error('Failed to load filter values:', err);
      setError('Failed to load filter options');
    } finally {
      setLoading(false);
    }
  };

  const countVideos = async () => {
    try {
      setCounting(true);
      // Build filters exactly like the CSV export endpoint
      const params = {};
      if (selectedFilters.subject !== 'all') {
        params.subject = selectedFilters.subject;
      }
      if (selectedFilters.grade !== 'all') {
        params.grade = selectedFilters.grade;
      }
      if (selectedFilters.unit !== 'all') {
        params.unit = selectedFilters.unit;
      }
      if (selectedFilters.lesson !== 'all') {
        params.lesson = selectedFilters.lesson;
      }

      // Use the same endpoint logic as CSV export - get filtered videos
      // This ensures the count matches exactly what will be in the CSV
      const response = await api.get('/videos', { 
        params: {
          ...params,
          status: 'active' // Only count active videos (same as CSV export)
        }
      });
      
      // Count only videos that have redirect_slug (QR codes) - same as CSV export should include
      const videosWithQR = response.data?.filter(video => 
        video.redirect_slug && video.redirect_slug.trim() !== ''
      ) || [];
      
      setVideoCount(videosWithQR.length);
    } catch (err) {
      console.error('Failed to count videos:', err);
      setVideoCount(0);
    } finally {
      setCounting(false);
    }
  };

  const handleDownloadCSV = async () => {
    try {
      setDownloading(true);
      setError(null);

      // Build query parameters
      const params = {};
      if (selectedFilters.subject !== 'all') {
        params.subject = selectedFilters.subject;
      }
      if (selectedFilters.grade !== 'all') {
        params.grade = selectedFilters.grade;
      }
      if (selectedFilters.unit !== 'all') {
        params.unit = selectedFilters.unit;
      }
      if (selectedFilters.lesson !== 'all') {
        params.lesson = selectedFilters.lesson;
      }

      // Download CSV
      const response = await api.get('/videos/export-filtered-csv', {
        params: params,
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      let filename = 'videos_export';
      if (selectedFilters.subject !== 'all') {
        filename += `_subject_${selectedFilters.subject}`;
      }
      if (selectedFilters.grade !== 'all') {
        filename += `_grade_${selectedFilters.grade}`;
      }
      if (selectedFilters.unit !== 'all') {
        filename += `_unit_${selectedFilters.unit}`;
      }
      if (selectedFilters.lesson !== 'all') {
        filename += `_lesson_${selectedFilters.lesson}`;
      }
      filename += `_${Date.now()}.csv`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download CSV:', err);
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to download CSV';
      setError(errorMessage);
    } finally {
      setDownloading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const resetFilters = () => {
    setSelectedFilters({
      subject: 'all',
      grade: 'all',
      unit: 'all',
      lesson: 'all'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading filter options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="w-full p-4 sm:p-6 lg:p-8 xl:p-10">
        {/* Header Container */}
        <div className="mb-8 lg:mb-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 rounded-2xl shadow-xl shadow-green-500/20">
              <FileSpreadsheet className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">CSV Export</h1>
              <p className="text-slate-600 text-base sm:text-lg">Export videos to CSV with filters by Subject, Grade, Unit, and Lesson</p>
            </div>
          </div>
        </div>

        {/* Filters Container */}
        <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-6 sm:p-8 mb-6 lg:mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Filter className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Filter Videos</h2>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-700 font-semibold">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Subject
              </label>
              <select
                value={selectedFilters.subject}
                onChange={(e) => handleFilterChange('subject', e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-slate-300 transition-all text-[15px] font-medium cursor-pointer"
              >
                <option value="all">All Subjects</option>
                {filterValues.subjects
                  .filter(s => s && s.trim() !== '')
                  .sort()
                  .map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
              </select>
            </div>

            {/* Grade Filter */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Grade
              </label>
              <select
                value={selectedFilters.grade}
                onChange={(e) => handleFilterChange('grade', e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-slate-300 transition-all text-[15px] font-medium cursor-pointer"
              >
                <option value="all">All Grades</option>
                {filterValues.grades
                  .filter(g => g !== null && g !== undefined && String(g).trim() !== '')
                  .sort((a, b) => {
                    const numA = parseInt(a) || 0;
                    const numB = parseInt(b) || 0;
                    return numA - numB;
                  })
                  .map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
              </select>
            </div>

            {/* Unit Filter */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Unit
              </label>
              <select
                value={selectedFilters.unit}
                onChange={(e) => handleFilterChange('unit', e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-slate-300 transition-all text-[15px] font-medium cursor-pointer"
              >
                <option value="all">All Units</option>
                {filterValues.units
                  .filter(u => u !== null && u !== undefined && String(u).trim() !== '')
                  .sort((a, b) => {
                    const numA = parseInt(a) || 0;
                    const numB = parseInt(b) || 0;
                    return numA - numB;
                  })
                  .map((unit) => (
                    <option key={unit} value={unit}>
                      Unit {unit}
                    </option>
                  ))}
              </select>
            </div>

            {/* Lesson Filter */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Lesson
              </label>
              <select
                value={selectedFilters.lesson}
                onChange={(e) => handleFilterChange('lesson', e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white hover:border-slate-300 transition-all text-[15px] font-medium cursor-pointer"
              >
                <option value="all">All Lessons</option>
                {filterValues.lessons
                  .filter(l => l !== null && l !== undefined && String(l).trim() !== '')
                  .sort((a, b) => {
                    const numA = parseInt(a) || 0;
                    const numB = parseInt(b) || 0;
                    return numA - numB;
                  })
                  .map((lesson) => (
                    <option key={lesson} value={lesson}>
                      Lesson {lesson}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Filter Summary and Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t-2 border-slate-200">
            <div className="flex items-center gap-4">
              <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-sm">
                {counting ? (
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm font-bold text-blue-700">Counting...</span>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-blue-700">
                    {videoCount} {videoCount === 1 ? 'Video' : 'Videos'} Found
                  </span>
                )}
              </div>
              {(selectedFilters.subject !== 'all' || selectedFilters.grade !== 'all' || selectedFilters.unit !== 'all' || selectedFilters.lesson !== 'all') && (
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold text-sm"
                >
                  Reset Filters
                </button>
              )}
            </div>
            <button
              onClick={handleDownloadCSV}
              disabled={downloading || videoCount === 0}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all font-bold text-sm shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {downloading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Generating CSV...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download CSV</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CSV Format Info */}
        
      </div>
    </div>
  );
}

export default CSVExport;

