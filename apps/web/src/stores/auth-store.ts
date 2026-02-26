import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi, User } from '@/lib/api';

// PROMO: setar true para dar EXPERT a todos os usuarios logados. Setar false para desativar.
const PROMO_EXPERT_ALL = false;

const applyPromo = (user: User | null): User | null => {
  if (!user || !PROMO_EXPERT_ALL) return user;
  return { ...user, plan: 'EXPERT' };
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        const { data } = await authApi.login({ email, password });
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        set({ user: applyPromo(data.user), isAuthenticated: true });
      },

      register: async (email: string, password: string, name?: string) => {
        await authApi.register({ email, password, name });
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Ignore errors on logout
        }
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        try {
          const token = localStorage.getItem('accessToken');
          if (!token) {
            set({ isLoading: false, isAuthenticated: false });
            return;
          }
          const { data } = await authApi.me();
          set({ user: applyPromo(data), isAuthenticated: true, isLoading: false });
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      setUser: (user: User) => {
        set({ user: applyPromo(user) });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      merge: (persisted: any, current) => ({
        ...current,
        ...persisted,
        user: applyPromo(persisted?.user ?? null),
      }),
    }
  )
);
