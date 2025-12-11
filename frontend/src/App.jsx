import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import PublicVideoPage from './pages/PublicVideoPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import VideoUpload from './pages/VideoUpload';
import VideoList from './pages/VideoList';
import VideoEdit from './pages/VideoEdit';
import RedirectViewer from './pages/RedirectViewer';
import CaptionUpload from './pages/CaptionUpload';
import VersionHistory from './pages/VersionHistory';
import StreamPage from './pages/StreamPage';
import StreamDiagnostic from './pages/StreamDiagnostic';
import UserManagement from './pages/UserManagement';
import BulkUpload from './pages/BulkUpload';
import QRCodeStorage from './pages/QRCodeStorage';
import VideosTrash from './pages/VideosTrash';
import MyStorageManager from './pages/CloudflareResourceManager';
import ShortUrlRedirect from './pages/ShortUrlRedirect';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="video/:videoId" element={<PublicVideoPage />} />
        <Route path="stream/:videoId" element={<StreamPage />} />
        <Route path="diagnostic" element={<StreamDiagnostic />} />
        <Route path="diagnostic/:videoId" element={<StreamDiagnostic />} />
        <Route path="admin/login" element={<AdminLogin />} />

        <Route path="admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="admin/upload" element={<ProtectedRoute><VideoUpload /></ProtectedRoute>} />
        <Route path="admin/bulk-upload" element={<ProtectedRoute><BulkUpload /></ProtectedRoute>} />
        <Route path="admin/videos" element={<ProtectedRoute><VideoList /></ProtectedRoute>} />
        <Route path="admin/videos/:id/edit" element={<ProtectedRoute><VideoEdit /></ProtectedRoute>} />
        <Route path="admin/qr-codes" element={<ProtectedRoute><QRCodeStorage /></ProtectedRoute>} />
        <Route path="admin/cloudflare" element={<ProtectedRoute><MyStorageManager /></ProtectedRoute>} />
        <Route path="admin/redirects" element={<ProtectedRoute><RedirectViewer /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="admin/captions/:videoId" element={<ProtectedRoute><CaptionUpload /></ProtectedRoute>} />
        <Route path="admin/versions/:videoId" element={<ProtectedRoute><VersionHistory /></ProtectedRoute>} />

        {/* Catch-all route for short URLs - must be last */}
        <Route path=":slug" element={<ShortUrlRedirect />} />
      </Route>
    </Routes>
  );
}

export default App;

