import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// Import the API client at the top instead of dynamically
import { api } from '@/api/client'; 

export interface User {
  id: string;
  firebaseUid: string;
  name: string;
  email: string;
  phone?: string;
  role: 'LANDLORD' | 'CARETAKER' | 'TENANT';
  subscriptionPlan: string;
  subscriptionDuration?: string;
  subscriptionExpiry?: string;
  imageUrl?: string;
  assignments?: any[];
  tenantProfile?: any;
}

interface AuthState {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      refreshUser: async () => {
        try {
          // No need to 'await import' anymore
          const res = await api.get('/users/me');
          if (res.data) set({ user: res.data });
        } catch (err) {
          console.error("Auth refresh failed", err);
          // Optional: clear user if the token is expired/invalid
          // set({ user: null }); 
        }
      }
    }),
    {
      name: 'kirayapro-auth-storage',
    }
  )
);
