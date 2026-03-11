import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Assignment } from '@/types'

interface AssignmentState {
  assignments: Assignment[]
  setAssignments: (assignments: Assignment[]) => void
  addAssignment: (assignment: Assignment) => void
  updateAssignment: (id: string, updates: Partial<Assignment>) => void
  deleteAssignment: (id: string) => void
  deleteAssignmentsByTask: (taskId: string) => void
  deleteAssignmentsByMember: (memberId: string) => void
}

export const useAssignmentStore = create<AssignmentState>()(
  persist(
    (set) => ({
      assignments: [],

      setAssignments: (assignments) => set({ assignments }),

      addAssignment: (assignment) =>
        set((state) => ({ assignments: [...state.assignments, assignment] })),

      updateAssignment: (id, updates) =>
        set((state) => ({
          assignments: state.assignments.map((a) =>
            a.id === id ? { ...a, ...updates } : a,
          ),
        })),

      deleteAssignment: (id) =>
        set((state) => ({
          assignments: state.assignments.filter((a) => a.id !== id),
        })),

      deleteAssignmentsByTask: (taskId) =>
        set((state) => ({
          assignments: state.assignments.filter((a) => a.taskId !== taskId),
        })),

      deleteAssignmentsByMember: (memberId) =>
        set((state) => ({
          assignments: state.assignments.filter((a) => a.memberId !== memberId),
        })),
    }),
    { name: 'capacity-planner-assignments' },
  ),
)
