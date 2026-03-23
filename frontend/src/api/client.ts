import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

export const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const user = useAuthStore.getState().user;
  if (user) {
    config.headers['x-user-id'] = user.id;
    config.headers['x-firebase-uid'] = user.firebaseUid;
  }
  return config;
});
