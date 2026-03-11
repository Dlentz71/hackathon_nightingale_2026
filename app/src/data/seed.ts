import seedData from './seed-data.json'
import { useProjectStore } from '@/store/useProjectStore'
import { useTeamStore } from '@/store/useTeamStore'
import { useAssignmentStore } from '@/store/useAssignmentStore'
import { useAuthStore } from '@/store/useAuthStore'
import type { Project, Task, TeamMember, Assignment, User } from '@/types'

// Version key to track seed data changes
const SEED_VERSION_KEY = 'capacity-planner-seed-version'
const CURRENT_SEED_VERSION = seedData._meta?.generatedDate || '2026-03-11'

/**
 * Hydrates all stores from seed data on first boot.
 * Automatically clears localStorage if seed data version has changed.
 */
export function hydrateSeedData() {
  const { projects, setProjects, setTasks } = useProjectStore.getState()
  
  // Check if seed data version has changed
  const storedVersion = localStorage.getItem(SEED_VERSION_KEY)
  const seedVersionChanged = storedVersion !== CURRENT_SEED_VERSION
  
  // If seed version changed, clear all localStorage data
  if (seedVersionChanged && storedVersion !== null) {
    console.log('🔄 Seed data updated - clearing cache and reloading...')
    
    // Clear all capacity-planner keys
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('capacity-planner-')) {
        localStorage.removeItem(key)
      }
    })
    
    // Update version
    localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION)
    
    // Force reload to reinitialize stores
    window.location.reload()
    return
  }

  // Already has data and version matches — don't overwrite
  if (projects.length > 0 && !seedVersionChanged) return

  // Store the current version
  localStorage.setItem(SEED_VERSION_KEY, CURRENT_SEED_VERSION)

  setProjects(seedData.projects as Project[])
  setTasks(seedData.tasks as Task[])

  useTeamStore.getState().setTeamMembers(seedData.teamMembers as TeamMember[])
  useTeamStore.getState().setUsers(seedData.users as User[])

  useAssignmentStore.getState().setAssignments(seedData.assignments as Assignment[])

  // Set the first admin user as the active user
  const firstAdmin = (seedData.users as User[]).find((u) => u.role === 'admin')
  if (firstAdmin) {
    useAuthStore.getState().setCurrentUser(firstAdmin)
  }
}
