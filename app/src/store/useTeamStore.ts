import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TeamMember, User } from '@/types'

interface TeamState {
  teamMembers: TeamMember[]
  users: User[]
  setTeamMembers: (members: TeamMember[]) => void
  setUsers: (users: User[]) => void
  addTeamMember: (member: TeamMember) => void
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void
  deleteTeamMember: (id: string) => void
}

export const useTeamStore = create<TeamState>()(
  persist(
    (set) => ({
      teamMembers: [],
      users: [],

      setTeamMembers: (teamMembers) => set({ teamMembers }),
      setUsers: (users) => set({ users }),

      addTeamMember: (member) =>
        set((state) => ({ teamMembers: [...state.teamMembers, member] })),

      updateTeamMember: (id, updates) =>
        set((state) => ({
          teamMembers: state.teamMembers.map((m) =>
            m.id === id ? { ...m, ...updates } : m,
          ),
        })),

      deleteTeamMember: (id) =>
        set((state) => ({
          teamMembers: state.teamMembers.filter((m) => m.id !== id),
        })),
    }),
    { name: 'capacity-planner-team' },
  ),
)
