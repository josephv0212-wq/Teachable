// Utility to get the correct API URL based on environment
// This works for both client-side and server-side rendering

let API_URL = 'http://localhost:5000/api'; // Default for development

if (typeof window !== 'undefined') {
  // Client-side: check environment variable or current hostname
  if (process.env.NEXT_PUBLIC_API_URL) {
    API_URL = process.env.NEXT_PUBLIC_API_URL;
  } else if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    // Production or staging
    API_URL = `https://${window.location.hostname}/api`;
  }
} else {
  // Server-side: check environment variable or use default
  if (process.env.NEXT_PUBLIC_API_URL) {
    API_URL = process.env.NEXT_PUBLIC_API_URL;
  } else if (process.env.NODE_ENV === 'production') {
    API_URL = 'http://86.104.72.45:5000/api'; // Production fallback
  }
}

export { API_URL };
