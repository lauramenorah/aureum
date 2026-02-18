import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Profile {
  id: string;
  account_id: string;
  nickname: string;
  type: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  identity_id?: string;
  account_id?: string;
  profile_id?: string;
  onboarding_status: 'NOT_STARTED' | 'IDENTITY_CREATED' | 'ACCOUNT_CREATED' | 'PROFILE_CREATED' | 'APPROVED';
}

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile | null) => void;
  profiles: Profile[];
  setProfiles: (profiles: Profile[]) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      activeProfile: null,
      setActiveProfile: (profile) => set({ activeProfile: profile }),
      profiles: [],
      setProfiles: (profiles) => set({ profiles }),
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
    }),
    { name: 'neobank-store' }
  )
);
