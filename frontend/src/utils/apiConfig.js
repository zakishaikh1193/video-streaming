/**
 * Get the API base URL from environment variable
 * @returns {string} The API base URL (e.g., "http://localhost:5000/api" or "/api")
 */
export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // Default to /api if not set (works with Vite proxy in development)
  if (!envUrl) {
    console.warn('VITE_API_URL environment variable is not set. Using default: /api');
    return '/api';
  }
  
  // If it's already an absolute URL (starts with http:// or https://), use it as-is
  if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
    return envUrl;
  }
  
  // If it's a relative path starting with /, use it as-is (Vite proxy will handle it in dev)
  if (envUrl.startsWith('/')) {
    return envUrl;
  }
  
  // If it doesn't start with / or http/https, it's malformed
  throw new Error(
    `VITE_API_URL is set to "${envUrl}" which is not a valid absolute URL or relative path. ` +
    `Expected format: "http://localhost:5000/api" or "/api"`
  );
};

/**
 * Get the backend base URL (without /api suffix) from environment variable
 * Used for constructing streaming URLs and other backend endpoints
 * @returns {string} The backend base URL (e.g., "http://localhost:5000" or "")
 */
export const getBackendBaseUrl = () => {
  const apiUrl = getApiBaseUrl();
  
  // If it's a relative path like "/api", return empty string (relative to current origin)
  if (apiUrl.startsWith('/')) {
    return apiUrl.replace('/api', '');
  }
  
  // If it's an absolute URL, remove the /api suffix
  if (apiUrl.endsWith('/api')) {
    return apiUrl.slice(0, -4);
  }
  
  // If it doesn't end with /api, return as-is (might be a different structure)
  return apiUrl.replace(/\/api\/?$/, '');
};


