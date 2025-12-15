import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Protected Route Component
 * Verifies token with backend and redirects to login if not authenticated
 */
function ProtectedRoute({ children }) {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking, true = authenticated, false = not authenticated
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // No token means not authenticated
    if (!token || token.trim() === '') {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    // Verify token with backend - must get valid response
    api.get('/auth/verify')
      .then((response) => {
        // Only authenticate if response is valid and contains valid flag
        if (response.data && response.data.valid !== false) {
          setIsAuthenticated(true);
          setIsLoading(false);
        } else {
          // Invalid response, remove token
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setIsLoading(false);
        }
      })
      .catch((error) => {
        // Token invalid, expired, or verification failed
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setIsLoading(false);
      });
  }, []);

  // Show loading state while checking authentication
  if (isLoading || isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Render protected content
  return children;
}

export default ProtectedRoute;

