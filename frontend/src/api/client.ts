import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// Robust API URL detection for local and production
const getBaseURL = () => {
  const envUrl = (import.meta as any).env.VITE_API_URL;
  if (!envUrl) return 'http://localhost:3000/api';
  
  // If it's a domain name (from Render linking), ensure we add protocol and /api
  if (!envUrl.startsWith('http')) {
    return `https://${envUrl}/api`;
  }
  
  return envUrl;
};

export const api = axios.create({
  baseURL: getBaseURL(),
});

api.interceptors.request.use((config) => {
  const user = useAuthStore.getState().user;
  if (user) {
    config.headers['x-user-id'] = user.id;
    config.headers['x-firebase-uid'] = user.firebaseUid;
  }
  return config;
});
