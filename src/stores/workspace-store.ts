'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SavingsWorkspace, WorkspaceMember } from '@/types/database'

interface WorkspaceState {
  workspace: (SavingsWorkspace & { members?: (WorkspaceMember & { profile: Profile })[] }) | null
  setWorkspace: (workspace: WorkspaceState['workspace']) => void
  clearWorkspace: () => void
  updateWorkspace: (data: Partial<SavingsWorkspace>) => void
}

import type { Profile } from '@/types/database'

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      workspace: null,
      setWorkspace: (workspace) => set({ workspace }),
      clearWorkspace: () => set({ workspace: null }),
      updateWorkspace: (data) =>
        set((state) => ({
          workspace: state.workspace ? { ...state.workspace, ...data } : null,
        })),
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({ workspace: state.workspace }),
    }
  )
)