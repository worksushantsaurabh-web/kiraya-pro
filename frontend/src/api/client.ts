import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// Robust API URL detection for local and production
const getBaseURL = () => {
  const envUrl = (import.meta as any).env.VITE_API_URL;
  if (!envUrl) return 'http://localhost:3000/api';
  
  // If it's a domain name (from Render linking), ensure we add protocol and /api
  let finalUrl = !envUrl.startsWith('http') ? `https://${envUrl}/api` : envUrl;
  
  // Ensure the /api suffix is present
  if (!finalUrl.endsWith('/api')) {
    finalUrl = finalUrl.replace(/\/$/, '') + '/api';
  }
  
  console.log(`[API DEBUG] Base URL: ${finalUrl}`);
  return finalUrl;
};

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000, // Handle Render free tier cold starts
});

// Robust Error Logging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('[API ERROR] Request timed out. Backend might be sleeping.');
    } else if (error.message === 'Network Error') {
      const msg = `[DEPLOYMENT ERROR] Cannot reach backend at: ${error.config.baseURL}. Please verify Render Env Vars.`;
      console.error(msg);
      alert(msg);
    } else {
      console.error('[API ERROR]', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

api.interceptors.request.use((config) => {
  const user = useAuthStore.getState().user;
  if (user) {
    config.headers['x-user-id'] = user.id;
    config.headers['x-firebase-uid'] = user.firebaseUid;
  }
  return config;
});
