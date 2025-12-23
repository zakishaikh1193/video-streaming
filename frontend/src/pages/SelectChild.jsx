import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Search, 
  Plus, 
  CheckCircle, 
  Users, 
  Sparkles,
  ArrowRight,
  GraduationCap,
  Heart,
  Star
} from 'lucide-react';
import api from '../services/api';

function SelectChild() {
  const [children, setChildren] = useState([]);
  const [filteredChildren, setFilteredChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchChildren();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredChildren(children);
    } else {
      const filtered = children.filter(child =>
        child.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        child.grade?.toString().includes(searchTerm) ||
        child.school?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredChildren(filtered);
    }
  }, [searchTerm, children]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from API if endpoint exists
      try {
        const response = await api.get('/children');
        if (response.data && Array.isArray(response.data)) {
          setChildren(response.data);
          setFilteredChildren(response.data);
        } else if (response.data && response.data.children) {
          setChildren(response.data.children);
          setFilteredChildren(response.data.children);
        } else {
          // Fallback to mock data if API doesn't exist yet
          setChildren(getMockChildren());
          setFilteredChildren(getMockChildren());
        }
      } catch (apiError) {
        // If endpoint doesn't exist, use mock data
        console.log('Children API endpoint not available, using mock data');
        setChildren(getMockChildren());
        setFilteredChildren(getMockChildren());
      }
    } catch (err) {
      console.error('Failed to fetch children:', err);
      setError('Failed to load children. Please try again.');
      // Use mock data as fallback
      setChildren(getMockChildren());
      setFilteredChildren(getMockChildren());
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration - replace with actual API call
  const getMockChildren = () => {
    return [
      {
        id: 1,
        name: 'Emma Johnson',
        grade: 3,
        school: 'Sunshine Elementary',
        avatar: null,
        subject: 'Mathematics',
        lastAccessed: '2024-01-15'
      },
      {
        id: 2,
        name: 'Lucas Martinez',
        grade: 5,
        school: 'Riverside Academy',
        avatar: null,
        subject: 'Science',
        lastAccessed: '2024-01-14'
      },
      {
        id: 3,
        name: 'Sophia Chen',
        grade: 2,
        school: 'Maple Grove School',
        avatar: null,
        subject: 'English',
        lastAccessed: '2024-01-13'
      },
      {
        id: 4,
        name: 'Noah Williams',
        grade: 4,
        school: 'Oak Valley Elementary',
        avatar: null,
        subject: 'Mathematics',
        lastAccessed: '2024-01-12'
      }
    ];
  };

  const handleSelectChild = (child) => {
    setSelectedChild(child);
    // Store selected child in localStorage for session persistence
    localStorage.setItem('selectedChild', JSON.stringify(child));
    
    // Navigate to video list or dashboard with child context
    // You can modify this route based on your app's flow
    navigate('/admin/videos', { 
      state: { selectedChild: child } 
    });
  };

  const handleAddChild = () => {
    // Navigate to add child page or open modal
    // For now, just show an alert
    alert('Add Child feature coming soon!');
  };

  const getGradeColor = (grade) => {
    const colors = {
      1: 'from-pink-500 to-rose-500',
      2: 'from-purple-500 to-indigo-500',
      3: 'from-blue-500 to-cyan-500',
      4: 'from-green-500 to-emerald-500',
      5: 'from-yellow-500 to-orange-500',
      6: 'from-red-500 to-pink-500'
    };
    return colors[grade] || 'from-slate-500 to-slate-600';
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg font-medium">Loading children...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 lg:mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl shadow-xl shadow-blue-500/20">
                <Users className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-2">
                  Select Your Child
                </h1>
                <p className="text-slate-600 text-lg sm:text-xl">
                  Choose a child to view their learning videos and progress
                </p>
              </div>
            </div>
            <button
              onClick={handleAddChild}
              className="hidden sm:flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Add Child</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, grade, or school..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 placeholder-slate-400 text-lg shadow-lg"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <p className="text-red-700 font-semibold">{error}</p>
          </div>
        )}

        {/* Children Grid */}
        {filteredChildren.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-12 text-center">
            <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Children Found</h3>
            <p className="text-slate-600 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'Add a child to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleAddChild}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Child</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChildren.map((child) => (
              <div
                key={child.id}
                onClick={() => handleSelectChild(child)}
                className={`group relative bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-2xl ${
                  selectedChild?.id === child.id
                    ? 'border-blue-500 ring-4 ring-blue-200'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                {/* Selected Indicator */}
                {selectedChild?.id === child.id && (
                  <div className="absolute top-4 right-4 z-10">
                    <div className="p-2 bg-blue-500 rounded-full shadow-lg">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                )}

                {/* Card Content */}
                <div className="p-6">
                  {/* Avatar and Grade Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getGradeColor(child.grade)} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                      {child.avatar ? (
                        <img 
                          src={child.avatar} 
                          alt={child.name}
                          className="w-full h-full rounded-2xl object-cover"
                        />
                      ) : (
                        getInitials(child.name)
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${getGradeColor(child.grade)} text-white text-sm font-bold shadow-md`}>
                      Grade {child.grade}
                    </div>
                  </div>

                  {/* Child Name */}
                  <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {child.name}
                  </h3>

                  {/* School Info */}
                  <div className="flex items-center gap-2 mb-4 text-slate-600">
                    <GraduationCap className="w-4 h-4" />
                    <span className="text-sm font-medium">{child.school}</span>
                  </div>

                  {/* Subject Badge */}
                  {child.subject && (
                    <div className="mb-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold">
                        <Sparkles className="w-3 h-3" />
                        {child.subject}
                      </span>
                    </div>
                  )}

                  {/* Last Accessed */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Last accessed: {formatDate(child.lastAccessed)}</span>
                    </div>
                    <ArrowRight className={`w-5 h-5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all`} />
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300 pointer-events-none" />
              </div>
            ))}
          </div>
        )}

        {/* Mobile Add Button */}
        <div className="fixed bottom-6 right-6 sm:hidden">
          <button
            onClick={handleAddChild}
            className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-xl hover:from-green-600 hover:to-emerald-700 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Selected Child Info */}
        {selectedChild && (
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getGradeColor(selectedChild.grade)} flex items-center justify-center text-white font-bold`}>
                  {selectedChild.avatar ? (
                    <img 
                      src={selectedChild.avatar} 
                      alt={selectedChild.name}
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    getInitials(selectedChild.name)
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-600 font-medium">Selected Child</p>
                  <p className="text-xl font-bold text-slate-900">{selectedChild.name}</p>
                </div>
              </div>
              <button
                onClick={() => handleSelectChild(selectedChild)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SelectChild;

