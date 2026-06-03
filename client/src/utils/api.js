const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
export const API_BASE = import.meta.env.VITE_API_URL || (isLocal ? 'http://localhost:5001' : 'https://resumeai-backend-opgb.onrender.com');
