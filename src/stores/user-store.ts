'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Profile } from '@/types/database'

interface UserState {
  user: Profile | null
  session: any | null
  setUser: (user: Profile | null) => void
  setSession: (session: any | null) => void
  signOut: () => void
  updateProfile: (data: Partial<Profile>) => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      signOut: () => set({ user: null, session: null }),
      updateProfile: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        })),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user, session: state.session }),
    }
  )
)