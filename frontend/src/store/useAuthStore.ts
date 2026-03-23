import { create } from 'zustand';

export interface User {
  id: string;
  firebaseUid: string;
  name: string;
  email: string;
  phone?: string;
  role: 'LANDLORD' | 'CARETAKER' | 'TENANT';
  subscriptionPlan: string;
  subscriptionExpiry?: string;
  assignments?: any[];
  tenantProfile?: any;
}

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  refreshUser: async () => {
    try {
      const { api } = await import('@/api/client');
      const res = await api.get('/users/me');
      if (res.data) set({ user: res.data });
    } catch (err) {
      console.error("Auth refresh failed", err);
    }
  }
}));
