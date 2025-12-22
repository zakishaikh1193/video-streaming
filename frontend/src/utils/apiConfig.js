/**
 * Get the API base URL from environment variable
 * @returns {string} The API base URL (e.g., "http://localhost:5000/api" or "/api")
 */
export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const isProduction = import.meta.env.PROD;
  
  // Log the environment variable for debugging
  console.log('[API Config] VITE_API_URL from env:', envUrl || '(not set)');
  console.log('[API Config] Is production:', isProduction);
  if (typeof window !== 'undefined') {
    console.log('[API Config] Current window location:', window.location.origin);
  }
  
  // If environment variable is set, use it
  if (envUrl) {
    // If it's already an absolute URL (starts with http:// or https://), use it as-is
    if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
      console.log('[API Config] Using absolute URL from env:', envUrl);
      return envUrl;
    }
    
    // If it's a relative path starting with /, use it as-is
    if (envUrl.startsWith('/')) {
      console.log('[API Config] Using relative path from env:', envUrl);
      return envUrl;
    }
    
    // If it looks like a domain name (contains a dot) but missing protocol, add https://
    if (envUrl.includes('.') && !envUrl.includes('://')) {
      const fullUrl = `https://${envUrl}`;
      console.warn(
        `[API Config] VITE_API_URL is set to "${envUrl}" which appears to be a domain without protocol. ` +
        `Automatically adding https://. Using: ${fullUrl}`
      );
      return fullUrl;
    }
    
    // If it doesn't start with / or http/https, it's malformed
    throw new Error(
      `VITE_API_URL is set to "${envUrl}" which is not a valid absolute URL or relative path. ` +
      `Expected format: "http://localhost:5000/api" or "/api" or "https://example.com/api"`
    );
  }
  
  // No environment variable set - use smart fallback
  if (typeof window !== 'undefined') {
    // In browser, use relative path (works if frontend and backend are on same domain)
    const relativePath = '/api';
    console.warn('[API Config] VITE_API_URL not set. Using relative path:', relativePath);
    console.warn('[API Config] This assumes frontend and backend are on the same domain.');
    console.warn('[API Config] Current origin:', window.location.origin);
    return relativePath;
  }
  
  // Fallback for SSR or other cases
  console.warn('[API Config] VITE_API_URL not set and window is not available. Using default: /api');
  return '/api';
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


