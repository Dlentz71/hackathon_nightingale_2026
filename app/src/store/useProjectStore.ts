import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Task, TaskNote } from '@/types'

interface ProjectState {
  projects: Project[]
  tasks: Task[]
  setProjects: (projects: Project[]) => void
  setTasks: (tasks: Task[]) => void
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  bulkDeleteTasks: (ids: string[]) => void
  addTaskNote: (taskId: string, note: TaskNote) => void
  deleteTaskNote: (taskId: string, noteId: string) => void
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set) => ({
      projects: [],
      tasks: [],

      setProjects: (projects) => set({ projects }),
      setTasks: (tasks) => set({ tasks }),

      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates } : p,
          ),
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          tasks: state.tasks.filter((t) => t.projectId !== id),
        })),

      addTask: (task) =>
        set((state) => ({ tasks: [...state.tasks, task] })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t,
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      bulkDeleteTasks: (ids) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => !ids.includes(t.id)),
        })),

      addTaskNote: (taskId, note) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, notes: [...(t.notes || []), note] }
              : t
          ),
        })),

      deleteTaskNote: (taskId, noteId) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, notes: (t.notes || []).filter((n) => n.id !== noteId) }
              : t
          ),
        })),
    }),
    { name: 'capacity-planner-projects' },
  ),
)
